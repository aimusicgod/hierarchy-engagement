import { useState, useEffect } from 'react'
import { useTalent } from '../hooks/useDatabase'
import { supabase } from '../lib/supabase'
import { compliancePct, scoreColor, platformBadgeClass, platformShort } from '../lib/utils'
import { Badge, GradBar, PageHeader, Spinner, Empty } from '../components/UI'

export default function MasterListPage() {
  const { talent, loading: tLoad } = useTalent()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState('score')
  const [sortDir, setSortDir] = useState('asc')
  const [view, setView]       = useState('all')

  useEffect(() => {
    if (!talent.length) { setMembers([]); setLoading(false); return }
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('members')
        .select('*, pods!inner(id, name, platform, talent_id)')
        .in('pods.talent_id', talent.map(t => t.id))
        .eq('status', 'active')
        .order('username')
      setMembers(data || [])
      setLoading(false)
    })()
  }, [talent.map(t => t.id).join(',')])

  function doSort(k) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const filtered = [...members].filter(m => {
    if (search && !m.username.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'ig' && m.pods?.platform !== 'ig') return false
    if (filter === 'tt' && m.pods?.platform !== 'tt') return false
    if (filter === 'risk'   && compliancePct(m) > 70) return false
    if (filter === 'remove' && compliancePct(m) > 50) return false
    return true
  }).sort((a, b) => {
    let va, vb
    if (sortKey === 'username') { va = a.username; vb = b.username }
    else if (sortKey === 'pod') { va = a.pods?.name || ''; vb = b.pods?.name || '' }
    else if (sortKey === 'tier') { va = a.tier; vb = b.tier }
    else { va = compliancePct(a); vb = compliancePct(b) }
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return sortDir === 'asc' ? va - vb : vb - va
  })

  const topPerformers = members.filter(m => compliancePct(m) >= 100).sort((a, b) => (b.session_count || 0) - (a.session_count || 0))

  if (tLoad || loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>

  const Th = ({ k, label }) => (
    <span onClick={() => doSort(k)} className="cursor-pointer text-[9px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white select-none transition-colors">
      {label}{sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </span>
  )

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <PageHeader title="Master List" sub="All active members across all pods" />
      <GradBar />

      <div className="flex gap-0 mb-5 bg-zinc-900/50 rounded-xl p-1 w-fit">
        {[['all', 'All Members'], ['top', 'Top Performers']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer font-mono transition-all border-0 ${view === v ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {view === 'all' && (
        <>
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search username…"
              className="w-48 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[11px] text-white font-mono outline-none focus:border-cyan-500/50 placeholder:text-zinc-700" />
            {['all', 'ig', 'tt', 'risk', 'remove'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold border cursor-pointer font-mono transition-all ${filter === f ? 'bg-[#fe2c55] text-white border-[#fe2c55]' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}>
                {f === 'all' ? 'All' : f === 'ig' ? 'IG' : f === 'tt' ? 'TT' : f === 'risk' ? 'At Risk' : 'Removal'}
              </button>
            ))}
            <span className="text-[10px] text-zinc-600 ml-auto">{filtered.length} members</span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid gap-2 px-4 py-2 bg-zinc-900/80 border-b border-zinc-800" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.2fr' }}>
              <Th k="username" label="Username" /><Th k="pod" label="Pod" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Platform</span>
              <Th k="tier" label="Tier" /><Th k="score" label="Compliance" />
            </div>
            {!filtered.length ? <div className="py-12 text-center text-sm text-zinc-600">No members match.</div>
              : filtered.map(m => {
                const pct = compliancePct(m)
                return (
                  <div key={m.id} className={`grid gap-2 items-center px-4 py-2.5 border-b border-zinc-900 last:border-0 hover:bg-zinc-900/40 ${pct <= 50 ? 'border-l-2 border-l-red-500/50 bg-red-500/5' : ''}`}
                    style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.2fr' }}>
                    <span className="text-[12px] font-bold text-white">{pct <= 50 && <span className="text-red-400 mr-1">⚑</span>}{m.username}</span>
                    <span className="text-[11px] text-zinc-600">{m.pods?.name}</span>
                    <Badge className={platformBadgeClass(m.pods?.platform) + ' text-[9px]'}>{platformShort(m.pods?.platform)}</Badge>
                    <span className={`text-[10px] font-bold ${m.tier === 'a' ? 'text-cyan-400' : 'text-zinc-500'}`}>{m.tier === 'a' ? 'Tier 1' : 'Tier 2'}</span>
                    <span className="text-right text-[11px] font-bold" style={{ color: scoreColor(pct) }}>{pct}%</span>
                  </div>
                )
              })}
          </div>

          <div className="flex gap-4 flex-wrap mt-4">
            {[['#22d3ee', 'Good (90–100%)'], ['#fbbf24', 'Warning (80%)'], ['#f97316', 'At Risk (70%)'], ['#f87171', 'Remove (≤50%)']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />{l}
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'top' && (
        <>
          <div className="text-[10px] text-zinc-500 bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3 mb-5">
            Members with 100% compliance — never missed a comment or like.
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid gap-2 px-4 py-2 bg-zinc-900/80 border-b border-zinc-800" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }}>
              {['Username', 'Pod', 'Platform', 'Sessions', 'Compliance'].map(h => (
                <span key={h} className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{h}</span>
              ))}
            </div>
            {!topPerformers.length ? <div className="py-12 text-center text-sm text-zinc-600">No perfect performers yet.</div>
              : topPerformers.map((m, i) => (
                <div key={m.id} className="grid gap-2 items-center px-4 py-2.5 border-b border-zinc-900 last:border-0 hover:bg-zinc-900/40" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }}>
                  <span className="flex items-center gap-2 text-[12px] font-bold text-white">
                    <span style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#555', fontSize: 11, minWidth: 16 }}>{i + 1}</span>
                    {m.username}
                  </span>
                  <span className="text-[11px] text-zinc-600">{m.pods?.name}</span>
                  <Badge className={platformBadgeClass(m.pods?.platform) + ' text-[9px]'}>{platformShort(m.pods?.platform)}</Badge>
                  <span className="text-[11px] text-zinc-500">{m.session_count || 0}</span>
                  <span className="text-[11px] font-black text-cyan-400 text-right">100%</span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  )
}
