import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ─── TALENT ───────────────────────────────────────────────────────────────────
export function useTalent() {
  const { profile } = useAuth()
  const [talent, setTalent]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('talent').select(`
      *, profiles:manager_id(id, name, email),
      pods(id, name, platform, members(id, status, violation_count, session_count))
    `).order('name')
    if (profile?.role === 'manager') q = q.eq('manager_id', profile.id)
    const { data } = await q
    setTalent(data || [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetch() }, [fetch])

  async function addTalent({ name, ig_handle, tt_handle, manager_id }) {
    const { error } = await supabase.from('talent').insert({ name, ig_handle, tt_handle, manager_id: manager_id || null, active: true })
    if (error) throw error
    await fetch()
  }

  async function assignManager(talentId, managerId) {
    const { error } = await supabase.from('talent').update({ manager_id: managerId || null }).eq('id', talentId)
    if (error) throw error
    await fetch()
  }

  async function updateTalent(id, updates) {
    const { error } = await supabase.from('talent').update(updates).eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { talent, loading, refetch: fetch, addTalent, assignManager, updateTalent }
}

// ─── PODS ─────────────────────────────────────────────────────────────────────
export function usePods(talentId) {
  const [pods, setPods]       = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!talentId) { setPods([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.from('pods')
      .select('*, members(id, username, tier, violation_count, session_count, status, removed_at)')
      .eq('talent_id', talentId).order('name')
    setPods(data || [])
    setLoading(false)
  }, [talentId])

  useEffect(() => { fetch() }, [fetch])

  async function addPod({ name, platform }) {
    const { error } = await supabase.from('pods').insert({ talent_id: talentId, name, platform })
    if (error) throw error
    await fetch()
  }

  async function deletePod(podId) {
    const { error } = await supabase.from('pods').delete().eq('id', podId)
    if (error) throw error
    await fetch()
  }

  return { pods, loading, refetch: fetch, addPod, deletePod }
}

// ─── MEMBERS (single pod) ─────────────────────────────────────────────────────
export function useMembers(podId) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!podId) { setMembers([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.from('members').select('*').eq('pod_id', podId).order('username')
    setMembers(data || [])
    setLoading(false)
  }, [podId])

  useEffect(() => { fetch() }, [fetch])

  async function addMember({ username, tier = 'a' }) {
    const { error } = await supabase.from('members').insert({ pod_id: podId, username, tier, status: 'active', violation_count: 0, session_count: 0 })
    if (error) throw error
    await fetch()
  }

  async function removeMember(memberId) {
    const { error } = await supabase.from('members').update({ status: 'removed', removed_at: new Date().toISOString() }).eq('id', memberId)
    if (error) throw error
    await fetch()
  }

  async function restoreMember(memberId) {
    const { error } = await supabase.from('members').update({ status: 'active', removed_at: null }).eq('id', memberId)
    if (error) throw error
    await fetch()
  }

  return { members, loading, refetch: fetch, addMember, removeMember, restoreMember }
}

// ─── ALL MEMBERS (across all pods for one talent) ─────────────────────────────
export function useAllMembers(talentId) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!talentId) { setMembers([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.from('members')
      .select('*, pods!inner(id, name, platform, talent_id)')
      .eq('pods.talent_id', talentId)
      .eq('status', 'active')
    setMembers(data || [])
    setLoading(false)
  }, [talentId])

  useEffect(() => { fetch() }, [fetch])
  return { members, loading, refetch: fetch }
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
export function useSessions(talentId) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    if (!talentId) { setSessions([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.from('sessions')
      .select(`*, session_pods(id, ok_count, violation_count, pods(id, name, platform)),
               violations(id, violation_type, members(id, username), pods(id, name, platform))`)
      .eq('talent_id', talentId)
      .order('created_at', { ascending: false })
    setSessions(data || [])
    setLoading(false)
  }, [talentId])

  useEffect(() => { fetch() }, [fetch])

  // Log a full session with violations
  async function createSession({ post_url, session_date, session_time, notes, pod_ids, commented, liked }) {
    // Create the session row
    const { data: session, error: sErr } = await supabase.from('sessions')
      .insert({ talent_id: talentId, post_url, session_date, session_time, notes })
      .select().single()
    if (sErr) throw sErr

    let grandOk = 0, grandVio = 0

    for (const podId of pod_ids) {
      const { data: members } = await supabase.from('members').select('*').eq('pod_id', podId).eq('status', 'active')
      const rows = members || []
      let podOk = 0, podVio = 0
      const violations = []

      for (const m of rows) {
        const key = m.username.replace(/^@/, '').toLowerCase()
        const didComment = commented.includes(key)
        const didLike    = liked.includes(key)
        let mVios = 0
        if (!didComment) { violations.push({ session_id: session.id, member_id: m.id, pod_id: podId, violation_type: 'no_comment' }); mVios++ }
        if (!didLike)    { violations.push({ session_id: session.id, member_id: m.id, pod_id: podId, violation_type: 'no_like'    }); mVios++ }
        if (mVios > 0) { podVio++; await supabase.from('members').update({ violation_count: (m.violation_count||0) + mVios, session_count: (m.session_count||0) + 1 }).eq('id', m.id) }
        else            { podOk++;  await supabase.from('members').update({ session_count: (m.session_count||0) + 1 }).eq('id', m.id) }
      }

      await supabase.from('session_pods').insert({ session_id: session.id, pod_id: podId, ok_count: podOk, violation_count: podVio })
      if (violations.length) await supabase.from('violations').insert(violations)
      grandOk += podOk; grandVio += podVio
    }

    await supabase.from('sessions').update({ total_ok: grandOk, total_violations: grandVio }).eq('id', session.id)
    await fetch()
    return session
  }

  return { sessions, loading, refetch: fetch, createSession }
}

// ─── VIOLATIONS ───────────────────────────────────────────────────────────────
export function useViolations(talentId) {
  const [violations, setViolations] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!talentId) { setViolations([]); setLoading(false); return }
    ;(async () => {
      setLoading(true)
      const { data } = await supabase.from('violations')
        .select('*, members(id, username, violation_count, session_count), pods(id, name, platform, talent_id), sessions(id, talent_id, session_date)')
        .eq('pods.talent_id', talentId)
        .order('created_at', { ascending: false })
        .limit(300)
      setViolations(data || [])
      setLoading(false)
    })()
  }, [talentId])

  return { violations, loading }
}

// ─── MANAGERS ─────────────────────────────────────────────────────────────────
export function useManagers() {
  const [managers, setManagers] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('role', 'manager').order('name')
    setManagers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function toggleActive(managerId, active) {
    const { error } = await supabase.from('profiles').update({ active }).eq('id', managerId)
    if (error) throw error
    await fetch()
  }

  return { managers, loading, refetch: fetch, toggleActive }
}
