import { useState } from 'react'
import { useMembers } from '../hooks/useDatabase'
import { useAuth } from '../contexts/AuthContext'
import { compliancePct, scoreColor, formatDate } from '../lib/utils'
import { Btn, Badge, StatCard, Spinner, Input, Select, toast } from '../components/UI'

export default function PodDetail({ podId, allTalent, onClose, onRunSession }) {
  const pod = allTalent?.flatMap(t => t.pods || []).find(p => p.id === podId)
  const { members, loading, addMember, removeMember, approveRestore, permanentBan } = useMembers(podId)
  const { profile } = useAuth()
  const isOwner = profile?.role === 'owner'

  const [showAdd, setShowAdd]         = useState(false)
  const [bulkText, setBulkText]       = useState('')
  const [tier, setTier]               = useState('a')
  const [search, setSearch]           = useState('')
  const [tab, setTab]                 = useState('active') // active | blacklist
  const [blacklistSearch, setBlacklistSearch] = useState('')
  const [saving, setSaving]           = useState(false)
  const [removeReason, setRemoveReason] = useState({}) // memberId -> reason text
  const [showRemoveForm, setShowRemoveForm] = useState(null) // memberId
  const [sortCol, setSortCol]   = useState('username')  // username | tier | session_count | compliance
  const [sortDir, setSortDir]   = useState('asc')       // asc | desc

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir(col === 'compliance' ? 'asc' : 'asc') }
  }

  function sortIcon(col) {
    if (sortCol !== col) return <span style={{color:'#444',marginLeft:3}}>↕</span>
    return <span style={{color:'#25f4ee',marginLeft:3}}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  if (!pod) return null

  const active      = members.filter(m => m.status === 'active')
  const blacklisted = members.filter(m => m.status === 'blacklisted' || m.status === 'banned')
  const avg         = active.length ? Math.round(active.reduce((a, m) => a + compliancePct(m), 0) / active.length) : 100
  const atRisk      = active.filter(m => compliancePct(m) <= 70).length

  const filtered = active
    .filter(m => !search || m.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av, bv
      if (sortCol === 'username')      { av = a.username.toLowerCase(); bv = b.username.toLowerCase() }
      else if (sortCol === 'tier')     { av = a.tier; bv = b.tier }
      else if (sortCol === 'sessions') { av = a.session_count || 0; bv = b.session_count || 0 }
      else if (sortCol === 'compliance') { av = compliancePct(a); bv = compliancePct(b) }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  const filteredBlacklist = blacklisted.filter(m => !blacklistSearch || m.username.toLowerCase().includes(blacklistSearch.toLowerCase()))

  // Parse and check bulk usernames against blacklist
  function parseBulk(raw) {
    const seen = new Set()
    return raw.split(/[\n,;]+/)
      .map(u => u.trim().replace(/^@/, '').toLowerCase())
      .filter(u => { if (!u || !/^[a-z0-9._]+$/i.test(u)) return false; if (seen.has(u)) return false; seen.add(u); return true })
  }

  const parsed          = parseBulk(bulkText)
  const existingActive  = new Set(active.map(m => m.username.replace(/^@/, '').toLowerCase()))
  const existingBlocked = new Set(blacklisted.map(m => m.username.replace(/^@/, '').toLowerCase()))
  const alreadyIn       = parsed.filter(u => existingActive.has(u))
  const blocked         = parsed.filter(u => existingBlocked.has(u))
  const toAdd           = parsed.filter(u => !existingActive.has(u) && !existingBlocked.has(u))

  async function doBulkAdd() {
    if (!toAdd.length) return
    setSaving(true)
    try {
      for (const u of toAdd) await addMember({ username: '@' + u, tier })
      setBulkText(''); setShowAdd(false)
      toast(`Added ${toAdd.length} member${toAdd.length !== 1 ? 's' : ''}!`)
    } catch (e) { toast('Error: ' + e.message) }
    setSaving(false)
  }

  async function doRemove(id) {
    const reason = removeReason[id] || ''
    try {
      await removeMember(id)
      setShowRemoveForm(null)
      toast('Member moved to blacklist.')
    } catch (e) { toast('Error: ' + e.message) }
  }

  async function doApproveRestore(id) {
    if (!isOwner) { toast('Only the owner can approve restores.'); return }
    try { await approveRestore(id); toast('Member restored to active.') }
    catch (e) { toast('Error: ' + e.message) }
  }

  async function doPermanentBan(id) {
    if (!isOwner) { toast('Only the owner can permanently ban.'); return }
    if (!window.confirm('Permanently ban this member? They will never be re-addable.')) return
    try { await permanentBan(id); toast('Member permanently banned.') }
    catch (e) { toast('Error: ' + e.message) }
  }

  return (
    <div className="absolute inset-0 bg-black z-20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center gap-4 flex-shrink-0 flex-wrap">
        <button onClick={onClose} className="text-[11px] font-bold text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded-lg bg-transparent cursor-pointer hover:text-white hover:border-zinc-500 transition-all font-mono">
          ← Back
        </button>
        <div>
          <div className="text-[16px] font-black text-white">{pod.name}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{active.length} active · {blacklisted.length} blacklisted</div>
        </div>
        <div className="ml-auto flex gap-2">
          <Btn size="sm" variant="ghost" onClick={() => setShowAdd(!showAdd)}>+ Add Member</Btn>
          <Btn size="sm" onClick={() => onRunSession(podId)}>Run Session</Btn>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard label="Active Members" value={active.length} accent />
          <StatCard label="Avg Compliance" value={avg + '%'} />
          <StatCard label="At Risk" value={atRisk} warning />
          <StatCard label="Blacklisted" value={blacklisted.length} danger />
        </div>

        {/* Bulk add form */}
        {showAdd && (
          <div className="bg-cyan-500/5 border border-cyan-500/25 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Bulk Add Members</div>
              <div className="text-[9px] text-zinc-600">Blacklisted usernames are automatically blocked</div>
            </div>
            <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: '1fr 180px' }}>
              <div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Usernames</div>
                <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
                  placeholder={"@user1\n@user2\n@user3"}
                  className="w-full h-28 bg-zinc-950 border border-cyan-500/20 rounded-lg px-3 py-2 text-cyan-400 text-[11px] font-mono outline-none resize-none focus:border-cyan-500/40 placeholder:text-zinc-700" />
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Tier</div>
                  <Select value={tier} onChange={setTier}><option value="a">Tier 1</option><option value="b">Tier 2</option></Select>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[10px] flex flex-col gap-1.5">
                  <div className="flex justify-between"><span className="text-zinc-600">Pasted</span><span className="font-bold text-white">{parsed.length}</span></div>
                  <div className="flex justify-between"><span className="text-cyan-400">Will add</span><span className="font-bold text-cyan-400">{toAdd.length}</span></div>
                  <div className="flex justify-between"><span className="text-yellow-400">Already in pod</span><span className="font-bold text-yellow-400">{alreadyIn.length}</span></div>
                  <div className="flex justify-between"><span className="text-red-400">⛔ Blacklisted</span><span className="font-bold text-red-400">{blocked.length}</span></div>
                </div>
              </div>
            </div>

            {/* Blocked warning */}
            {blocked.length > 0 && (
              <div className="bg-red-500/8 border border-red-500/25 rounded-lg px-3 py-2.5 mb-3">
                <div className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1.5">⛔ Blocked — Previously Removed</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {blocked.map(u => <span key={u} className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5 font-mono">@{u}</span>)}
                </div>
                <div className="text-[10px] text-zinc-600">
                  {isOwner ? 'As owner, go to the Blacklist tab to review and approve any restores.' : 'These accounts were removed. Contact your owner to approve re-adding them.'}
                </div>
              </div>
            )}

            {alreadyIn.length > 0 && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2 mb-3 flex flex-wrap gap-1.5">
                {alreadyIn.map(u => <span key={u} className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 rounded px-2 py-0.5 font-mono">@{u}</span>)}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={doBulkAdd} disabled={saving || !toAdd.length}
                className="bg-[#fe2c55] text-white text-[11px] font-bold px-4 py-2 rounded-lg border-0 cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed font-mono transition-opacity">
                {saving ? 'Adding…' : `Add ${toAdd.length} Member${toAdd.length !== 1 ? 's' : ''} →`}
              </button>
              <Btn onClick={() => { setShowAdd(false); setBulkText('') }} variant="ghost" size="sm">Cancel</Btn>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-0 mb-4 bg-zinc-900/50 rounded-xl p-1 w-fit">
          {[['active', `Active (${active.length})`], ['blacklist', `Blacklist (${blacklisted.length})`]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer font-mono transition-all border-0 ${tab === t ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'} ${t === 'blacklist' && blacklisted.length > 0 ? 'text-red-400' : ''}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ACTIVE MEMBERS TAB */}
        {tab === 'active' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Members</div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="w-36 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[11px] text-white font-mono outline-none focus:border-cyan-500/50 placeholder:text-zinc-700" />
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="grid gap-2 px-4 py-2 bg-zinc-900/80 border-b border-zinc-800" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                {[['username','Username'],['tier','Tier'],['sessions','Sessions'],['compliance','Compliance']].map(([col,label]) => (
                  <button key={col} onClick={() => toggleSort(col)}
                    className="text-left text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-transparent border-0 cursor-pointer hover:text-white transition-colors p-0 flex items-center">
                    {label}{sortIcon(col)}
                  </button>
                ))}
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Actions</span>
              </div>
              {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
                : !filtered.length ? <div className="py-10 text-center text-sm text-zinc-600">No members match.</div>
                : filtered.map(m => {
                  const pct = compliancePct(m)
                  return (
                    <div key={m.id}>
                      <div className={`grid gap-2 items-center px-4 py-2.5 border-b border-zinc-900 last:border-0 hover:bg-zinc-800/30 ${pct <= 50 ? 'border-l-2 border-l-red-500/50 bg-red-500/5' : ''}`}
                        style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                        <span className="text-[12px] font-bold text-white">{pct <= 50 && <span className="text-red-400 mr-1">⚑</span>}{m.username}</span>
                        <span className={`text-[10px] font-bold ${m.tier === 'a' ? 'text-cyan-400' : 'text-zinc-500'}`}>{m.tier === 'a' ? 'Tier 1' : 'Tier 2'}</span>
                        <span className="text-[11px] text-zinc-500">{m.session_count || 0}</span>
                        <span className="text-[11px] font-bold" style={{ color: scoreColor(pct) }}>{pct}%</span>
                        <div>
                          {showRemoveForm === m.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => doRemove(m.id)}
                                className="text-[9px] font-bold text-red-400 border border-red-500/40 px-2 py-1 rounded bg-transparent cursor-pointer hover:bg-red-500/15 font-mono transition-colors">
                                Confirm
                              </button>
                              <button onClick={() => setShowRemoveForm(null)}
                                className="text-[9px] font-bold text-zinc-600 border border-zinc-700 px-2 py-1 rounded bg-transparent cursor-pointer hover:text-white font-mono transition-colors">
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setShowRemoveForm(m.id)}
                              className="text-[9px] font-bold text-red-400 border border-red-500/30 px-2 py-1 rounded-md bg-transparent cursor-pointer hover:bg-red-500/10 transition-colors font-mono">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </>
        )}

        {/* BLACKLIST TAB */}
        {tab === 'blacklist' && (
          <>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
              <div className="text-[11px] font-bold text-red-400 mb-1">⛔ Blacklist</div>
              <div className="text-[10px] text-zinc-500 leading-relaxed">
                These members were removed from this pod. They <strong className="text-white">cannot be re-added</strong> through bulk add or manually — they are blocked automatically.
                {isOwner
                  ? ' As the owner, you can review and approve a restore if needed.'
                  : ' Only the owner can approve restoring a blacklisted member.'}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Blacklisted Members</div>
              <input value={blacklistSearch} onChange={e => setBlacklistSearch(e.target.value)} placeholder="Search blacklist…"
                className="w-40 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[11px] text-white font-mono outline-none focus:border-red-500/50 placeholder:text-zinc-700" />
            </div>

            <div className="bg-zinc-950 border border-red-500/20 rounded-xl overflow-hidden">
              <div className="grid gap-2 px-4 py-2 bg-red-500/5 border-b border-red-500/15" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                {['Username', 'Removed On', 'Last Score', isOwner ? 'Owner Actions' : 'Status'].map(h => (
                  <span key={h} className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{h}</span>
                ))}
              </div>
              {!filteredBlacklist.length
                ? <div className="py-10 text-center text-sm text-zinc-600">{blacklisted.length === 0 ? 'No blacklisted members.' : 'No results match your search.'}</div>
                : filteredBlacklist.map(m => {
                  const pct = compliancePct(m)
                  const isBanned = m.status === 'banned'
                  return (
                    <div key={m.id} className={`grid gap-2 items-center px-4 py-3 border-b border-zinc-900 last:border-0 ${isBanned ? 'bg-red-500/8' : 'hover:bg-zinc-900/30'}`}
                      style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                      <div>
                        <div className="text-[12px] font-bold text-zinc-400">{m.username}</div>
                        {isBanned && <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-0.5">Permanently Banned</div>}
                      </div>
                      <span className="text-[11px] text-zinc-600">{formatDate(m.removed_at)}</span>
                      <span className="text-[11px] font-bold" style={{ color: scoreColor(pct) }}>{pct}%</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {isOwner && !isBanned ? (
                          <>
                            <button onClick={() => doApproveRestore(m.id)}
                              className="text-[9px] font-bold text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded bg-transparent cursor-pointer hover:bg-cyan-500/10 font-mono transition-colors">
                              ✓ Restore
                            </button>
                            <button onClick={() => doPermanentBan(m.id)}
                              className="text-[9px] font-bold text-red-500 border border-red-500/40 px-2 py-1 rounded bg-transparent cursor-pointer hover:bg-red-500/15 font-mono transition-colors">
                              Ban
                            </button>
                          </>
                        ) : isOwner && isBanned ? (
                          <span className="text-[9px] text-red-500 font-bold">Permanently banned</span>
                        ) : (
                          <span className="text-[9px] text-zinc-600 italic">Owner approval needed</span>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
