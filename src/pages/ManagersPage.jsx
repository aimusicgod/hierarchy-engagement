// src/pages/ManagersPage.jsx
import { useState } from 'react'
import { useTalent, useManagers } from '../hooks/useDatabase'
import { supabase } from '../lib/supabase'
import { initials } from '../lib/utils'
import { Btn, Badge, GradBar, PageHeader, Spinner, Input, Modal, toast } from '../components/UI'

export default function ManagersPage({ onOpenWorkspace, talent }) {
  const { managers, loading, refetch, toggleActive } = useManagers()
  const [showAdd, setShowAdd] = useState(false)
  const [mName, setMName] = useState(''); const [mEmail, setMEmail] = useState('')
  const [assignModal, setAssignModal] = useState(null)
  const [assignTalent, setAssignTalent] = useState([])
  const [saving, setSaving] = useState(false)

  async function doInvite() {
    if (!mName || !mEmail) return toast('Name and email required.')
    setSaving(true)
    try {
      // In Supabase: invite user via Auth, then they set up their profile
      const { error } = await supabase.auth.admin.inviteUserByEmail(mEmail, { data: { name: mName, role: 'manager' } })
      if (error) throw error
      toast('Invite sent to ' + mEmail)
      setMName(''); setMEmail(''); setShowAdd(false); await refetch()
    } catch (e) { toast('Error: ' + e.message) }
    setSaving(false)
  }

  async function doSaveAssign() {
    if (!assignModal) return
    setSaving(true)
    try {
      const prev = (talent||[]).filter(t=>t.manager_id===assignModal.id).map(t=>t.id)
      for (const id of prev.filter(id=>!assignTalent.includes(id)))
        await supabase.from('talent').update({ manager_id: null }).eq('id', id)
      for (const id of assignTalent.filter(id=>!prev.includes(id)))
        await supabase.from('talent').update({ manager_id: assignModal.id }).eq('id', id)
      toast('Assignment saved!')
      setAssignModal(null)
    } catch (e) { toast('Error: ' + e.message) }
    setSaving(false)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <PageHeader title="Managers" sub="Invite managers and assign their talent"
        action={<Btn onClick={()=>setShowAdd(!showAdd)}>+ Invite Manager</Btn>} />
      <GradBar />
      {showAdd && (
        <div className="bg-cyan-500/5 border border-cyan-500/25 rounded-xl p-4 mb-5">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4">Invite Manager</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Name</div><Input value={mName} onChange={setMName} placeholder="Full name" /></div>
            <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email</div><Input value={mEmail} onChange={setMEmail} placeholder="manager@email.com" type="email" /></div>
          </div>
          <div className="flex gap-2"><Btn onClick={doInvite} disabled={saving} variant="blue">Send Invite →</Btn><Btn onClick={()=>setShowAdd(false)} variant="ghost">Cancel</Btn></div>
        </div>
      )}
      {!managers.length ? <div className="text-center py-16 text-sm text-zinc-600">No managers yet.</div> :
        managers.map(m => {
          const assigned = (talent||[]).filter(t=>t.manager_id===m.id)
          return (
            <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-3">
              <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center text-base font-black text-red-400 flex-shrink-0">{initials(m.name)}</div>
                  <div><div className="text-[13px] font-bold text-white">{m.name}</div><div className="text-[10px] text-zinc-500">{m.email}</div></div>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-[10px] text-zinc-600">{assigned.length} talent</span>
                  <Badge className={m.active!==false?'bg-red-500/10 text-red-400 border-red-500/25 text-[10px]':'bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px]'}>{m.active!==false?'Active':'Inactive'}</Badge>
                  <Btn size="sm" variant="ghost" onClick={()=>toggleActive(m.id, !m.active)}>{m.active!==false?'Suspend':'Reactivate'}</Btn>
                  <Btn size="sm" variant="cyan" onClick={()=>{ setAssignModal(m); setAssignTalent(assigned.map(t=>t.id)) }}>+ Assign Talent</Btn>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-zinc-900">
                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Assigned Talent</div>
                {!assigned.length ? <span className="text-[10px] text-zinc-700">No talent assigned</span> :
                  <div className="flex flex-wrap gap-2">
                    {assigned.map(t=>(
                      <div key={t.id} onClick={()=>onOpenWorkspace(t.id)} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-500 transition-colors">
                        <span className="text-[11px] font-bold text-white">{t.name}</span><span className="text-zinc-600 text-sm">→</span>
                      </div>
                    ))}
                  </div>}
              </div>
            </div>
          )
        })}
      <Modal open={!!assignModal} onClose={()=>setAssignModal(null)} title={`Assign Talent — ${assignModal?.name}`}>
        <div className="flex flex-col gap-2 mb-5">
          {(talent||[]).map(t=>{
            const checked = assignTalent.includes(t.id)
            return (
              <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked?'border-red-500/40 bg-red-500/5':'border-zinc-800 hover:border-zinc-600'}`}>
                <input type="checkbox" checked={checked} onChange={()=>setAssignTalent(prev=>checked?prev.filter(id=>id!==t.id):[...prev,t.id])} className="accent-[#fe2c55]" />
                <span className="text-sm font-bold text-white">{t.name}</span>
                {checked && <Badge className="ml-auto bg-red-500/10 text-red-400 border-red-500/25 text-[9px]">Assigned</Badge>}
              </label>
            )
          })}
        </div>
        <div className="flex gap-2"><Btn onClick={doSaveAssign} disabled={saving} className="flex-1">Save →</Btn><Btn onClick={()=>setAssignModal(null)} variant="ghost">Cancel</Btn></div>
      </Modal>
    </div>
  )
}
