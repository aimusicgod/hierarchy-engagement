// src/pages/TalentPage.jsx
import { useState } from 'react'
import { useTalent } from '../hooks/useDatabase'
import { compliancePct, initials, platformBadgeClass } from '../lib/utils'
import { Btn, Badge, GradBar, PageHeader, Spinner, Empty, Input, Select, Modal, toast } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'

export default function TalentPage({ onOpenWorkspace, managers }) {
  const { profile } = useAuth()
  const isOwner = profile?.role === 'owner'
  const { talent, loading, addTalent, assignManager } = useTalent()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState(''); const [ig, setIg] = useState(''); const [tt, setTt] = useState(''); const [mgrId, setMgrId] = useState('')
  const [saving, setSaving] = useState(false)
  const [assignModal, setAssignModal] = useState(null); const [selMgr, setSelMgr] = useState('')

  async function doAdd() {
    if (!name.trim()) return
    setSaving(true)
    try { await addTalent({ name: name.trim(), ig_handle: ig, tt_handle: tt, manager_id: mgrId || null }); setName(''); setIg(''); setTt(''); setMgrId(''); setShowAdd(false); toast('Talent added!') }
    catch (e) { toast('Error: ' + e.message) }
    setSaving(false)
  }

  async function doAssign() {
    try { await assignManager(assignModal.id, selMgr || null); setAssignModal(null); toast('Manager updated!') }
    catch (e) { toast('Error: ' + e.message) }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <PageHeader title={isOwner ? 'Talent' : 'My Talent'} sub="Each artist manages their own engagement network"
        action={isOwner && <Btn onClick={() => setShowAdd(!showAdd)}>+ Add Talent</Btn>} />
      <GradBar />
      {showAdd && (
        <div className="bg-cyan-500/5 border border-cyan-500/25 rounded-xl p-4 mb-5">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4">New Talent Profile</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Artist Name *</div><Input value={name} onChange={setName} placeholder="WavyNikki" /></div>
            <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Instagram</div><Input value={ig} onChange={setIg} placeholder="@handle" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">TikTok</div><Input value={tt} onChange={setTt} placeholder="@handle" /></div>
            <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Assign Manager</div>
              <Select value={mgrId} onChange={setMgrId}><option value="">Unassigned</option>{(managers||[]).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Select></div>
          </div>
          <div className="flex gap-2"><Btn onClick={doAdd} disabled={saving} variant="blue">Create →</Btn><Btn onClick={() => setShowAdd(false)} variant="ghost">Cancel</Btn></div>
        </div>
      )}
      {!talent.length ? <Empty msg={isOwner ? 'No talent yet — add your first artist.' : 'No talent assigned to you yet.'} /> :
        talent.map(t => {
          const mems = (t.pods||[]).flatMap(p=>(p.members||[]).filter(m=>m.status==='active'))
          const avg = mems.length ? Math.round(mems.reduce((a,m)=>a+compliancePct(m),0)/mems.length) : 100
          const mgr = (managers||[]).find(m=>m.id===t.manager_id)
          return (
            <div key={t.id} onClick={() => onOpenWorkspace(t.id)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer mb-3 hover:-translate-y-0.5 transition-all"
              onMouseEnter={e=>e.currentTarget.style.borderColor='#555'} onMouseLeave={e=>e.currentTarget.style.borderColor='#27272a'}>
              <div className="p-4 flex items-center gap-4 flex-wrap">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                  style={{background:'linear-gradient(135deg,rgba(37,244,238,.3),rgba(254,44,85,.3))'}}>{initials(t.name)}</div>
                <div className="flex-1 min-w-0"><div className="text-sm font-black text-white">{t.name}</div>
                  <div className="text-[10px] text-zinc-500">{[t.ig_handle,t.tt_handle].filter(Boolean).join('  ·  ')}</div></div>
                <div className="flex gap-4">
                  <div className="text-center"><div className="text-lg font-black text-cyan-400">{mems.length}</div><div className="text-[9px] text-zinc-600">members</div></div>
                  <div className="text-center"><div className="text-lg font-black" style={{color:avg>=80?'#22d3ee':avg>=70?'#fb923c':'#f87171'}}>{avg}%</div><div className="text-[9px] text-zinc-600">compliance</div></div>
                  <div className="text-center"><div className="text-lg font-black text-zinc-500">{(t.pods||[]).length}</div><div className="text-[9px] text-zinc-600">pods</div></div>
                </div>
                <div className="flex gap-2 items-center" onClick={e=>e.stopPropagation()}>
                  <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">{mgr?mgr.name:'No Manager'}</Badge>
                  {isOwner && <Btn size="sm" variant="cyan" onClick={() => { setAssignModal(t); setSelMgr(t.manager_id||'') }}>⇄ Mgr</Btn>}
                  <span className="text-zinc-600">→</span>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-zinc-900 flex gap-1.5 flex-wrap">
                {(t.pods||[]).map(p=><Badge key={p.id} className={platformBadgeClass(p.platform)+' text-[8px] px-1.5 py-0.5'}>{p.name}</Badge>)}
                {!(t.pods||[]).length && <span className="text-[10px] text-zinc-700">No pods yet</span>}
              </div>
            </div>
          )
        })}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Manage Manager — ${assignModal?.name}`}>
        <div className="flex flex-col gap-2 mb-5">
          {[{id:'',name:'Unassigned'},...(managers||[])].map(m=>(
            <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selMgr===m.id?'border-cyan-500/40 bg-cyan-500/5':'border-zinc-800 hover:border-zinc-600'}`}>
              <input type="radio" name="mgr" value={m.id} checked={selMgr===m.id} onChange={()=>setSelMgr(m.id)} className="accent-cyan-400" />
              <span className="text-sm font-bold text-white">{m.name}</span>
              {m.id===assignModal?.manager_id&&<Badge className="ml-auto bg-cyan-500/10 text-cyan-400 border-cyan-500/25 text-[9px]">Current</Badge>}
            </label>
          ))}
        </div>
        <div className="flex gap-2"><Btn onClick={doAssign} className="flex-1">Save →</Btn><Btn onClick={()=>setAssignModal(null)} variant="ghost">Cancel</Btn></div>
      </Modal>
    </div>
  )
}
