import { useState } from 'react'
import { useTalent, useSessions } from '../hooks/useDatabase'
import { parseUsernames, platformBadgeClass, platformShort, formatDate } from '../lib/utils'
import { Btn, Badge, GradBar, PageHeader, Spinner, Empty, toast } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'

function HistCard({ session }) {
  const [open, setOpen] = useState(false)
  const pods = session.session_pods || []
  const cols = Math.min(pods.length, 3)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-3">
      <div onClick={() => setOpen(!open)} className="p-4 flex items-center justify-between flex-wrap gap-3 cursor-pointer hover:bg-zinc-800/30 transition-colors">
        <div>
          <div className="text-[13px] font-bold text-white">{pods.map(sp => sp.pods?.name).join(' + ') || '—'}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{formatDate(session.session_date)}{session.session_time ? ' · ' + session.session_time : ''}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700">Saved</span>
          <div className="flex gap-3 text-[11px] font-bold">
            <span className="text-cyan-400">✓ {session.total_ok}</span>
            <span className="text-red-400">✗ {session.total_violations}</span>
          </div>
          <span className="text-[10px] text-zinc-600">{open ? '▲ collapse' : '▼ expand'}</span>
        </div>
      </div>
      <div className="px-4 py-2 border-t border-zinc-900 flex gap-2 items-center">
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Post</span>
        <a href={session.post_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-400 font-mono hover:text-white truncate flex-1" onClick={e => e.stopPropagation()}>
          {session.post_url}
        </a>
      </div>
      {open && (
        <div className="border-t border-zinc-900 p-4">
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {pods.map(sp => (
              <div key={sp.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 truncate">{sp.pods?.name}</div>
                <div className="text-[22px] font-black text-cyan-400">{sp.ok_count}</div>
                <div className="text-[9px] text-zinc-600 mb-1">compliant</div>
                <div className="text-[14px] font-bold text-red-400">{sp.violation_count} violation{sp.violation_count !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
          {(session.violations || []).length > 0 && (
            <div className="border-t border-zinc-800 pt-4">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Who Violated</div>
              {pods.map(sp => {
                const pvios = (session.violations || []).filter(v => v.pod_id === sp.pod_id)
                if (!pvios.length) return null
                return (
                  <div key={sp.id} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={platformBadgeClass(sp.pods?.platform) + ' text-[8px]'}>{platformShort(sp.pods?.platform)}</Badge>
                      <span className="text-[10px] font-bold text-zinc-400">{sp.pods?.name}</span>
                    </div>
                    {pvios.map((v, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-zinc-900 last:border-0">
                        <span className="text-[11px] font-bold text-white">{v.members?.username}</span>
                        <div className="flex gap-1">
                          {v.violation_type === 'no_comment' && <Badge className="bg-red-500/10 text-red-400 border-red-500/25 text-[8px]">No Comment</Badge>}
                          {v.violation_type === 'no_like'    && <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/25 text-[8px]">No Like</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SessionsPage() {
  const { profile } = useAuth()
  const { talent, loading: tLoad } = useTalent()
  const [talentId, setTalentId] = useState('')
  const { sessions, loading: sLoad, createSession } = useSessions(talentId || talent[0]?.id)

  const selTalent = talent.find(t => t.id === (talentId || talent[0]?.id))
  const pods = selTalent?.pods || []

  const [showForm, setShowForm]       = useState(false)
  const [postUrl, setPostUrl]         = useState('')
  const [sessDate, setSessDate]       = useState(new Date().toISOString().slice(0, 10))
  const [sessTime, setSessTime]       = useState('12:00')
  const [selPods, setSelPods]         = useState([])
  const [active, setActive]           = useState(null)
  const [commented, setCommented]     = useState('')
  const [liked, setLiked]             = useState('')
  const [liveResults, setLiveResults] = useState(null)
  const [logging, setLogging]         = useState(false)

  // Auto-select first talent if only one
  if (!talentId && talent.length === 1 && !talentId) setTalentId(talent[0].id)

  function computeLive() {
    if (!active) return
    const c = parseUsernames(commented), l = parseUsernames(liked)
    // Even with empty inputs, compute — empty means nobody commented/liked (all violations)
    const results = active.pods.map(pod => {
      const mems = (pod.members || []).filter(m => m.status === 'active')
      let ok = 0, vio = 0
      const rows = mems.map(m => {
        const key = m.username.replace(/^@/, '').toLowerCase()
        const dc = c.includes(key), dl = l.includes(key)
        if (dc && dl) ok++; else vio++
        return { ...m, dc, dl }
      })
      return { pod, rows, ok, vio }
    })
    setLiveResults(results)
  }

  function startSession() {
    if (!postUrl.trim()) { toast('Post URL required.'); return }
    if (!selPods.length) { toast('Select at least one pod.'); return }
    setActive({ postUrl, sessDate, sessTime, pods: pods.filter(p => selPods.includes(p.id)) })
    setCommented(''); setLiked(''); setLiveResults(null); setShowForm(false)
  }

  async function logSession() {
    if (!active) return
    setLogging(true)
    try {
      await createSession({
        post_url: active.postUrl, session_date: active.sessDate, session_time: active.sessTime,
        pod_ids: active.pods.map(p => p.id),
        commented: parseUsernames(commented), liked: parseUsernames(liked)
      })
      setActive(null); setLiveResults(null); setSelPods([])
      toast('Session saved!')
    } catch (e) { toast('Error: ' + e.message) }
    setLogging(false)
  }

  if (tLoad) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <PageHeader title="Sessions" sub="Multi-pod · multiple posts per day · live compare"
        action={!active && <Btn onClick={() => setShowForm(!showForm)}>+ New Session</Btn>} />
      <GradBar />

      {/* Talent selector */}
      {talent.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {talent.map(t => (
            <button key={t.id} onClick={() => { setTalentId(t.id); setSelPods([]) }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer font-mono transition-all ${(talentId||talent[0]?.id) === t.id ? 'bg-[#fe2c55] text-white border-[#fe2c55]' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* New session form */}
      {showForm && selTalent && (
        <div className="bg-cyan-500/5 border border-cyan-500/25 rounded-xl p-4 mb-5">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4">Configure Session</div>
          <div className="mb-3">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Post URL *</div>
            <input value={postUrl} onChange={e => setPostUrl(e.target.value)} type="url" placeholder="https://instagram.com/p/… or https://tiktok.com/@…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-cyan-400 text-[11px] font-mono outline-none focus:border-cyan-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Date</div>
              <input type="date" value={sessDate} onChange={e => setSessDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none" /></div>
            <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Time</div>
              <input type="time" value={sessTime} onChange={e => setSessTime(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none" /></div>
          </div>
          <div className="mb-4">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Select Pods</div>
            <div className="grid grid-cols-2 gap-2">
              {pods.map(p => {
                const checked = selPods.includes(p.id)
                const cnt = (p.members || []).filter(m => m.status === 'active').length
                return (
                  <label key={p.id} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-red-500/10 border-red-500/35' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'}`}>
                    <input type="checkbox" checked={checked} onChange={() => setSelPods(prev => checked ? prev.filter(id => id !== p.id) : [...prev, p.id])} className="accent-[#fe2c55]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{p.name}</div>
                      <div className="text-[9px] text-zinc-500">{cnt} members</div>
                    </div>
                    <Badge className={platformBadgeClass(p.platform) + ' text-[8px]'}>{platformShort(p.platform)}</Badge>
                  </label>
                )
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <Btn onClick={startSession} variant="blue">Start Session →</Btn>
            <Btn onClick={() => setShowForm(false)} variant="ghost">Cancel</Btn>
          </div>
        </div>
      )}

      {/* Active session */}
      {active && (
        <div className="mb-5">
          <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-4 mb-3">
            <div className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1">Active Session</div>
            <div className="text-[11px] text-zinc-500 font-mono break-all">{active.postUrl}</div>
            <div className="text-[10px] text-zinc-600 mt-1">{active.pods.map(p => p.name).join(' · ')}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">Who Commented</div>
              <textarea value={commented} onChange={e => { setCommented(e.target.value); setTimeout(computeLive, 100) }}
                placeholder="@user1&#10;@user2&#10;@user3"
                className="w-full bg-zinc-950 border border-cyan-500/20 rounded-lg px-3 py-2 text-cyan-400 text-[11px] font-mono outline-none resize-none min-h-[90px] focus:border-cyan-500/40" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1.5">Who Liked</div>
              <textarea value={liked} onChange={e => { setLiked(e.target.value); setTimeout(computeLive, 100) }}
                placeholder="@user1&#10;@user4&#10;@user5"
                className="w-full bg-zinc-950 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-[11px] font-mono outline-none resize-none min-h-[90px] focus:border-red-500/40" />
            </div>
          </div>
          {/* Live results — shown when something typed */}
          {liveResults && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Results</span>
                <div className="flex gap-4 text-[11px] font-bold">
                  <span className="text-cyan-400">{liveResults.reduce((a,r)=>a+r.ok,0)} compliant</span>
                  <span className="text-red-400">{liveResults.reduce((a,r)=>a+r.vio,0)} violations</span>
                </div>
              </div>
              {liveResults.map(({ pod, rows, ok, vio }) => (
                <div key={pod.id} className="mb-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-t-xl border-b-0">
                    <Badge className={platformBadgeClass(pod.platform) + ' text-[8px]'}>{platformShort(pod.platform)}</Badge>
                    <span className="text-[11px] font-bold text-white">{pod.name}</span>
                    <span className="ml-auto text-[10px] text-cyan-400">{ok} ok</span>
                    <span className="text-[10px] text-red-400">{vio} violations</span>
                  </div>
                  <div className="border border-zinc-800 border-t-0 rounded-b-xl overflow-hidden">
                    <div className="grid gap-2 px-4 py-1.5 bg-zinc-900/50 text-[9px] font-bold text-zinc-600 uppercase tracking-widest" style={{gridTemplateColumns:'2fr 1fr 1fr'}}>
                      <span>Username</span><span>Commented</span><span>Liked</span>
                    </div>
                    {rows.map(m => (
                      <div key={m.id} className="grid gap-2 items-center px-4 py-2 border-b border-zinc-900 last:border-0" style={{gridTemplateColumns:'2fr 1fr 1fr'}}>
                        <span className="text-[11px] font-bold text-white">{m.username}</span>
                        <span className={m.dc ? 'text-cyan-400' : 'text-red-400'}>{m.dc ? '✓' : '✗'}</span>
                        <span className={m.dl ? 'text-cyan-400' : 'text-red-400'}>{m.dl ? '✓' : '✗'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save button — ALWAYS visible when session is active */}
          <button onClick={logSession} disabled={logging}
            className="w-full bg-[#fe2c55] text-white text-[12px] font-bold py-3 rounded-xl border-0 cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50"
            style={{marginBottom: 8}}>
            {logging ? 'Saving…' : liveResults ? 'Log All Violations + Save Session →' : 'Save Session (no engagement data yet) →'}
          </button>
          <div className="text-[10px] text-zinc-600 text-center mb-3">
            Tip: paste who commented and liked above first to track violations before saving
          </div>
        </div>
      )}

      {/* History */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Session History</div>
        {!sLoad && <span className="text-[10px] text-zinc-600">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>}
      </div>
      {sLoad ? <div className="flex justify-center py-8"><Spinner /></div>
        : !sessions.length ? <Empty msg="No sessions yet — run your first session above." />
        : sessions.map(s => <HistCard key={s.id} session={s} />)}
    </div>
  )
}
