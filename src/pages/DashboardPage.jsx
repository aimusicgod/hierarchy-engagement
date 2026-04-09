import { useEffect, useRef, useState } from 'react'
import { useTalent } from '../hooks/useDatabase'
import { supabase } from '../lib/supabase'
import { compliancePct, scoreColor, initials } from '../lib/utils'
import { StatCard, Panel, Spinner, GradBar, PageHeader } from '../components/UI'

export default function DashboardPage({ onOpenWorkspace }) {
  const { talent, loading } = useTalent()
  const [allMembers, setAllMembers] = useState([])
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!talent.length) return
    supabase.from('members')
      .select('*, pods!inner(id, name, platform, talent_id)')
      .in('pods.talent_id', talent.map(t => t.id))
      .eq('status', 'active')
      .then(({ data }) => setAllMembers(data || []))
  }, [talent.map(t => t.id).join()])

  const total   = allMembers.length
  const avg     = total ? Math.round(allMembers.reduce((a, m) => a + compliancePct(m), 0) / total) : 0
  const atRisk  = allMembers.filter(m => compliancePct(m) <= 70).length
  const removal = allMembers.filter(m => compliancePct(m) <= 50).length

  // Draw pie chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !total) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 110, 110)
    const slices = [
      { v: allMembers.filter(m => compliancePct(m) >= 90).length, c: '#22d3ee' },
      { v: allMembers.filter(m => compliancePct(m) >= 80 && compliancePct(m) < 90).length, c: '#fbbf24' },
      { v: allMembers.filter(m => compliancePct(m) >= 60 && compliancePct(m) < 80).length, c: '#f97316' },
      { v: allMembers.filter(m => compliancePct(m) < 60).length, c: '#f87171' },
    ].filter(s => s.v > 0)
    let angle = -Math.PI / 2
    slices.forEach(s => {
      const sweep = (s.v / total) * Math.PI * 2
      ctx.beginPath(); ctx.moveTo(55, 55); ctx.arc(55, 55, 50, angle, angle + sweep)
      ctx.closePath(); ctx.fillStyle = s.c; ctx.fill(); angle += sweep
    })
    ctx.beginPath(); ctx.arc(55, 55, 28, 0, Math.PI * 2); ctx.fillStyle = '#0a0a0a'; ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(avg + '%', 55, 48)
    ctx.font = '9px monospace'; ctx.fillStyle = '#555'; ctx.fillText('avg', 55, 63)
  }, [allMembers.length])

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>

  const topPerformers = allMembers.filter(m => compliancePct(m) >= 100).sort((a, b) => (b.session_count||0) - (a.session_count||0)).slice(0, 5)
  const atRiskList    = allMembers.filter(m => compliancePct(m) <= 70).sort((a, b) => compliancePct(a) - compliancePct(b)).slice(0, 8)

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <PageHeader title="Command Center" sub="All networks · live overview" />
      <GradBar />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Members" value={total} sub={`${talent.reduce((a,t)=>a+(t.pods?.length||0),0)} pods`} accent />
        <StatCard label="Avg Compliance" value={avg + '%'} />
        <StatCard label="At Risk" value={atRisk} sub="score ≤70%" warning />
        <StatCard label="Removal Queue" value={removal} sub="score ≤50%" danger />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <Panel title="Compliance Breakdown">
          <div className="flex items-center gap-4">
            {total > 0 ? <canvas ref={canvasRef} width={110} height={110} className="flex-shrink-0" />
              : <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0"><span className="text-xs text-zinc-600">No data</span></div>}
            <div className="flex-1 flex flex-col gap-1.5 text-[10px]">
              {[['#22d3ee','Good (90%+)'],['#fbbf24','Warning (80%)'],['#f97316','At Risk (60%)'],['#f87171','Removal (<60%)']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{background:c}} /><span className="text-zinc-500 flex-1">{l}</span></div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Avg Compliance by Talent">
          {!talent.length ? <span className="text-xs text-zinc-600">No talent yet.</span>
            : talent.map(t => {
              const mems = allMembers.filter(m => m.pods?.talent_id === t.id)
              const a = mems.length ? Math.round(mems.reduce((s,m)=>s+compliancePct(m),0)/mems.length) : 100
              const c = scoreColor(a)
              return (
                <div key={t.id} className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                    style={{background:'linear-gradient(135deg,rgba(37,244,238,.3),rgba(254,44,85,.3))'}}>
                    {initials(t.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-semibold text-white truncate max-w-[90px]">{t.name}</span>
                      <span className="text-[11px] font-black" style={{color:c}}>{a}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full">
                      <div className="h-1 rounded-full" style={{width:`${a}%`,background:c}} />
                    </div>
                  </div>
                </div>
              )
            })}
        </Panel>
      </div>

      {/* Talent cards */}
      {talent.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Network Overview — click to open workspace</div>
          <div className="grid gap-3" style={{gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))'}}>
            {talent.map(t => {
              const mems = allMembers.filter(m => m.pods?.talent_id === t.id)
              const a = mems.length ? Math.round(mems.reduce((s,m)=>s+compliancePct(m),0)/mems.length) : 100
              const c = scoreColor(a)
              return (
                <div key={t.id} onClick={() => onOpenWorkspace(t.id)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5"
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#555'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#27272a'}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                      style={{background:'linear-gradient(135deg,rgba(37,244,238,.3),rgba(254,44,85,.3))'}}>{initials(t.name)}</div>
                    <span className="text-[11px] font-bold text-white truncate">{t.name}</span>
                    <span className="ml-auto text-zinc-600 text-sm">→</span>
                  </div>
                  <div className="text-[22px] font-black" style={{color:c}}>{a}%</div>
                  <div className="h-1 bg-zinc-800 rounded-full mt-1.5 mb-2"><div className="h-1 rounded-full" style={{width:`${a}%`,background:c}} /></div>
                  <div className="text-[10px] text-zinc-500">{mems.length} members · {t.pods?.length||0} pods</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Panel title="Top Performers">
          {topPerformers.length ? topPerformers.map((m,i) => (
            <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-zinc-900 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-sm w-5">{['🥇','🥈','🥉'][i]||i+1}</span>
                <span className="text-[12px] font-bold text-white">{m.username}</span>
                <span className="text-[10px] text-zinc-600">{m.pods?.name}</span>
              </div>
              <span className="text-[11px] font-black text-cyan-400">100%</span>
            </div>
          )) : <span className="text-xs text-zinc-600">No perfect performers yet.</span>}
        </Panel>
        <Panel title="At Risk & Removal Queue">
          {atRiskList.length ? atRiskList.map(m => {
            const p = compliancePct(m)
            return (
              <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-zinc-900 last:border-0">
                <span className="text-[12px] font-bold text-white">{p<=50&&'⚑ '}{m.username} <span className="text-[10px] text-zinc-600">{m.pods?.name}</span></span>
                <span className="text-[11px] font-bold" style={{color:scoreColor(p)}}>{p}%</span>
              </div>
            )
          }) : <span className="text-xs text-zinc-600">All members in good standing.</span>}
        </Panel>
      </div>
    </div>
  )
}
