import { useState, useEffect } from 'react'
import { useTalent } from '../hooks/useDatabase'
import { supabase } from '../lib/supabase'
import { compliancePct, scoreColor, platformBadgeClass, platformShort } from '../lib/utils'
import { Badge, GradBar, PageHeader, Spinner, Empty } from '../components/UI'

export default function ViolationsPage() {
  const { talent, loading: tLoad } = useTalent()
  const [violations, setViolations] = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')

  useEffect(() => {
    if (!talent.length) { setViolations([]); setLoading(false); return }
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('violations')
        .select('*, members(id, username, violation_count, session_count), pods(id, name, platform, talent_id), sessions(id, talent_id, session_date)')
        .in('pods.talent_id', talent.map(t => t.id))
        .order('created_at', { ascending: false })
        .limit(300)
      setViolations(data || [])
      setLoading(false)
    })()
  }, [talent.map(t => t.id).join(',')])

  const filtered = violations.filter(v => filter === 'all' || v.violation_type === filter)

  if (tLoad || loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <PageHeader title="Violations" sub="Full violation log across all sessions" />
      <GradBar />

      <div className="flex gap-2 flex-wrap items-center mb-4">
        {[['all', 'All'], ['no_comment', 'No Comment'], ['no_like', 'No Like']].map(([f, l]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold border cursor-pointer font-mono transition-all ${filter === f ? 'bg-[#fe2c55] text-white border-[#fe2c55]' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}>
            {l}
          </button>
        ))}
        <span className="text-[10px] text-zinc-600 ml-auto">{filtered.length} records</span>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid gap-2 px-4 py-2 bg-zinc-900/80 border-b border-zinc-800" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr' }}>
          {['Member', 'Platform', 'Pod', 'Type', 'Compliance'].map(h => (
            <span key={h} className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{h}</span>
          ))}
        </div>
        {!filtered.length ? <div className="py-12 text-center text-sm text-zinc-600">No violations logged yet.</div>
          : filtered.map(v => {
            const member = v.members, pod = v.pods
            const pct = member ? compliancePct(member) : null
            return (
              <div key={v.id}
                className={`grid gap-2 items-center px-4 py-2.5 border-b border-zinc-900 last:border-0 hover:bg-zinc-900/30 transition-colors ${pct !== null && pct <= 50 ? 'border-l-2 border-l-red-500/50 bg-red-500/5' : ''}`}
                style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr' }}>
                <span className="text-[12px] font-bold text-white">
                  {pct !== null && pct <= 50 && <span className="text-red-400 mr-1">⚑</span>}
                  {member?.username || '—'}
                </span>
                {pod ? <Badge className={platformBadgeClass(pod.platform) + ' text-[9px]'}>{platformShort(pod.platform)}</Badge> : <span />}
                <span className="text-[11px] text-zinc-600">{pod?.name || '—'}</span>
                {v.violation_type === 'no_comment'
                  ? <Badge className="bg-red-500/10 text-red-400 border-red-500/25 text-[9px]">No Comment</Badge>
                  : <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/25 text-[9px]">No Like</Badge>}
                {pct !== null
                  ? <span className="text-right text-[11px] font-bold" style={{ color: scoreColor(pct) }}>{pct}%</span>
                  : <span />}
              </div>
            )
          })}
      </div>
    </div>
  )
}
