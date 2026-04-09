import { useState } from 'react'
import { useMembers } from '../hooks/useDatabase'
import { compliancePct, scoreColor, formatDate } from '../lib/utils'
import { Btn, Badge, StatCard, Spinner, Input, Select, toast } from '../components/UI'

export default function PodDetail({ podId, allTalent, onClose, onRunSession }) {
  const pod = allTalent?.flatMap(t => t.pods || []).find(p => p.id === podId)
  const { members, loading, addMember, removeMember, restoreMember } = useMembers(podId)

  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState('')
  const [newTier, setNewTier] = useState('a')
  const [saving, setSaving]   = useState(false)
  const [search, setSearch]   = useState('')

  if (!pod) return null

  const active  = members.filter(m => m.status === 'active')
  const removed = members.filter(m => m.status === 'removed')
  const avg     = active.length ? Math.round(active.reduce((a, m) => a + compliancePct(m), 0) / active.length) : 100
  const atRisk  = active.filter(m => compliancePct(m) <= 70).length

  const filtered = active.filter(m => !search || m.username.toLowerCase().includes(search.toLowerCase()))

  async function doAdd() {
    if (!newUser.trim()) return
    setSaving(true)
    try {
      const u = newUser.trim().startsWith('@') ? newUser.trim() : '@' + newUser.trim()
      await addMember({ username: u, tier: newTier })
      setNewUser(''); setShowAdd(false); toast('Member added!')
    } catch (e) { toast('Error: ' + e.message) }
    setSaving(false)
  }

  async function doRemove(id) {
    try { await removeMember(id); toast('Member removed.') }
    catch (e) { toast('Error: ' + e.message) }
  }

  async function doRestore(id) {
    try { await restoreMember(id); toast('Member restored.') }
    catch (e) { toast('Error: ' + e.message) }
  }

  return (
    <div className="absolute inset-0 bg-black z-20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center gap-4 flex-shrink-0 flex-wrap">
        <button onClick={onClose} className="text-[11px] font-bold text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded-lg bg-transparent cursor-pointer hover:text-white hover:border-zinc-500 transition-all font-mono">
          ← Back to Pods
        </button>
        <div>
          <div className="text-[16px] font-black text-white">{pod.name}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{active.length} active · {removed.length} removed</div>
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
          <StatCard label="Removed" value={removed.length} />
        </div>

        {/* Add member form */}
        {showAdd && (
          <div className="bg-cyan-500/5 border border-cyan-500/25 rounded-xl p-4 mb-5">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3">Add Member to Pod</div>
            <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
              <div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Username</div>
                <Input value={newUser} onChange={setNewUser} placeholder="@username" />
              </div>
              <div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Tier</div>
                <Select value={newTier} onChange={setNewTier}>
                  <option value="a">Tier 1</option>
                  <option value="b">Tier 2</option>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Btn onClick={doAdd} disabled={saving} variant="blue" size="sm">Add →</Btn>
                <Btn onClick={() => setShowAdd(false)} variant="ghost" size="sm">Cancel</Btn>
              </div>
            </div>
          </div>
        )}

        {/* Search + member table */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Members</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="w-36 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[11px] text-white font-mono outline-none focus:border-cyan-500/50 placeholder:text-zinc-700" />
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-6">
          <div className="grid gap-2 px-4 py-2 bg-zinc-900/80 border-b border-zinc-800" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
            {['Username', 'Tier', 'Sessions', 'Compliance', 'Actions'].map(h => (
              <span key={h} className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{h}</span>
            ))}
          </div>
          {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
            : !filtered.length ? <div className="py-10 text-center text-sm text-zinc-600">No members match.</div>
            : filtered.map(m => {
              const pct = compliancePct(m)
              return (
                <div key={m.id} className={`grid gap-2 items-center px-4 py-2.5 border-b border-zinc-900 last:border-0 hover:bg-zinc-800/30 ${pct <= 50 ? 'border-l-2 border-l-red-500/50 bg-red-500/5' : ''}`}
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                  <span className="text-[12px] font-bold text-white">{pct <= 50 && <span className="text-red-400 mr-1">⚑</span>}{m.username}</span>
                  <span className={`text-[10px] font-bold ${m.tier === 'a' ? 'text-cyan-400' : 'text-zinc-500'}`}>{m.tier === 'a' ? 'Tier 1' : 'Tier 2'}</span>
                  <span className="text-[11px] text-zinc-500">{m.session_count || 0}</span>
                  <span className="text-[11px] font-bold" style={{ color: scoreColor(pct) }}>{pct}%</span>
                  <div>
                    <button onClick={() => doRemove(m.id)}
                      className="text-[9px] font-bold text-red-400 border border-red-500/30 px-2 py-1 rounded-md bg-transparent cursor-pointer hover:bg-red-500/10 transition-colors font-mono">
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Removed members */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/15">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Removed Members</span>
            <span className="text-[10px] text-zinc-600">{removed.length} members</span>
          </div>
          {!removed.length ? <div className="py-8 text-center text-sm text-zinc-700">No removed members</div>
            : removed.map(m => (
              <div key={m.id} className="grid gap-2 items-center px-4 py-2.5 border-b border-zinc-900 last:border-0 hover:bg-zinc-900/30"
                style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}>
                <span className="text-[12px] font-bold text-zinc-500">{m.username}</span>
                <span className="text-[11px] text-zinc-600">{formatDate(m.removed_at)}</span>
                <span className="text-[11px] font-bold text-red-400">{compliancePct(m)}%</span>
                <div>
                  <button onClick={() => doRestore(m.id)}
                    className="text-[9px] font-bold text-zinc-500 border border-zinc-700 px-2 py-1 rounded-md bg-transparent cursor-pointer hover:border-cyan-500/50 hover:text-cyan-400 transition-colors font-mono">
                    Restore
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
