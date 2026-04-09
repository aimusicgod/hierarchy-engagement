// src/pages/PodsPage.jsx
import { useTalent } from '../hooks/useDatabase'
import { compliancePct, platformLabel, platformBadgeClass, initials } from '../lib/utils'
import { Badge, GradBar, PageHeader, Spinner, Empty } from '../components/UI'
import { useState } from 'react'

export default function PodsPage({ onOpenPodDetail }) {
  const { talent, loading } = useTalent()
  const [platFilter, setPlatFilter] = useState('all')
  const [talentFilter, setTalentFilter] = useState('all')
  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
  const vis = talentFilter === 'all' ? talent : talent.filter(t => t.id === talentFilter)
  return (
    <div className="flex-1 overflow-y-auto p-5">
      <PageHeader title="Pods" sub="Engagement groups — each talent's own network" />
      <GradBar />
      <div className="flex gap-2 flex-wrap mb-4">
        {[{id:'all',name:'All Talent'},...talent].map(t=>(
          <button key={t.id} onClick={()=>setTalentFilter(t.id)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold border cursor-pointer transition-all font-mono ${talentFilter===t.id?'bg-[#fe2c55] text-white border-[#fe2c55]':'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}>
            {t.name}
          </button>
        ))}
      </div>
      <div className="flex gap-0 mb-5 bg-zinc-900/50 rounded-xl p-1 w-fit">
        {['all','tt','ig'].map(p=>(
          <button key={p} onClick={()=>setPlatFilter(p)}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer font-mono transition-all border-0 ${platFilter===p?'bg-zinc-800 text-white':'text-zinc-500 hover:text-white'}`}>
            {p==='all'?'All':p==='tt'?'TikTok':'Instagram'}
          </button>
        ))}
      </div>
      {!vis.length && <Empty msg="No talent found." />}
      {vis.map(t => {
        const filtPods = (t.pods||[]).filter(p=>platFilter==='all'||p.platform===platFilter)
        if (!filtPods.length) return null
        return (
          <div key={t.id} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0" style={{background:'linear-gradient(135deg,rgba(37,244,238,.3),rgba(254,44,85,.3))'}}>{initials(t.name)}</div>
              <span className="text-[13px] font-black text-white">{t.name}</span>
              <span className="text-[10px] text-zinc-600 ml-auto">{filtPods.length} pod{filtPods.length!==1?'s':''}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filtPods.map(p=>{
                const cnt=(p.members||[]).filter(m=>m.status==='active').length
                return (
                  <div key={p.id} onClick={()=>onOpenPodDetail(p.id)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 transition-all"
                    onMouseEnter={e=>e.currentTarget.style.borderColor='#555'} onMouseLeave={e=>e.currentTarget.style.borderColor='#27272a'}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[13px] font-bold text-white">{p.name}</div>
                      <span className="text-zinc-600">→</span>
                    </div>
                    <Badge className={platformBadgeClass(p.platform)+' text-[9px]'}>{platformLabel(p.platform)}</Badge>
                    <div className="border-t border-zinc-800 mt-3 pt-3 text-[10px] text-zinc-600">{cnt} members</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
