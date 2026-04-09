import { useState } from 'react'
import { useTalent, useManagers } from '../hooks/useDatabase'
import { supabase } from '../lib/supabase'
import { initials } from '../lib/utils'
import { Btn, Badge, GradBar, PageHeader, Spinner, Input, Modal, Empty, toast } from '../components/UI'

export default function ManagersPage({ onOpenWorkspace, talent }) {
  const { managers, loading, refetch, toggleActive } = useManagers()
  const [showInstructions, setShowInstructions] = useState(false)
  const [assignModal, setAssignModal] = useState(null)
  const [assignTalent, setAssignTalent] = useState([])
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const sqlSnippet = `-- Run this in Supabase SQL Editor after creating the user in Auth
INSERT INTO profiles (id, role, name, email)
SELECT id, 'manager', 'Their Name', 'their@email.com'
FROM auth.users
WHERE email = 'their@email.com';`

  function copySql() {
    navigator.clipboard.writeText(sqlSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function doSaveAssign() {
    if (!assignModal) return
    setSaving(true)
    try {
      const prev = (talent || []).filter(t => t.manager_id === assignModal.id).map(t => t.id)
      for (const id of prev.filter(id => !assignTalent.includes(id)))
        await supabase.from('talent').update({ manager_id: null }).eq('id', id)
      for (const id of assignTalent.filter(id => !prev.includes(id)))
        await supabase.from('talent').update({ manager_id: assignModal.id }).eq('id', id)
      toast('Assignment saved!')
      setAssignModal(null)
      await refetch()
    } catch (e) { toast('Error: ' + e.message) }
    setSaving(false)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-5">
      <PageHeader title="Managers" sub="Add managers and assign their talent"
        action={<Btn onClick={() => setShowInstructions(true)}>+ Add Manager</Btn>} />
      <GradBar />

      {/* How to add a manager modal */}
      <Modal open={showInstructions} onClose={() => setShowInstructions(false)} title="How to Add a Manager">
        <div className="space-y-4">

          {/* Step 1 */}
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
            <p className="font-bold text-cyan-400 text-[11px] uppercase tracking-widest mb-2">Step 1 — Create their login in Supabase</p>
            <ol className="text-[11px] text-zinc-400 leading-relaxed space-y-1.5">
              <li>1. Go to <strong className="text-white">supabase.com</strong> → your project</li>
              <li>2. Click <strong className="text-white">Authentication</strong> in the left menu</li>
              <li>3. Click <strong className="text-white">Add user</strong> → <strong className="text-white">Create new user</strong></li>
              <li>4. Enter their email and set a temporary password</li>
              <li>5. Click <strong className="text-white">Create User</strong></li>
            </ol>
          </div>

          {/* Step 2 */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <p className="font-bold text-red-400 text-[11px] uppercase tracking-widest mb-2">Step 2 — Run this SQL to give them manager access</p>
            <p className="text-[11px] text-zinc-400 mb-3">SQL Editor → New Query → paste this → swap in their real name and email → Run:</p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[10px] text-cyan-400 whitespace-pre-wrap mb-2 select-all">
{`INSERT INTO profiles (id, role, name, email)
SELECT id, 'manager', 'Their Name', 'their@email.com'
FROM auth.users
WHERE email = 'their@email.com';`}
            </div>
            <button onClick={copySql}
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all font-mono"
              style={{ background: copied ? 'rgba(37,244,238,.15)' : 'transparent', color: copied ? '#25f4ee' : '#666', borderColor: copied ? '#25f4ee' : '#333' }}>
              {copied ? '✓ Copied!' : 'Copy SQL'}
            </button>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="font-bold text-zinc-300 text-[11px] uppercase tracking-widest mb-2">Step 3 — Share their login</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Send them the site URL and their email + password. They log in and see only their assigned talent.
              You can change their password anytime in Supabase → Authentication.
            </p>
          </div>

          <Btn onClick={() => setShowInstructions(false)} variant="ghost" className="w-full">Got it</Btn>
        </div>
      </Modal>

      {/* Managers list */}
      {!managers.length ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="text-3xl opacity-20">◯</div>
          <div className="text-sm text-zinc-600">No managers yet.</div>
          <Btn onClick={() => setShowInstructions(true)} variant="cyan" size="sm">How to add a manager →</Btn>
        </div>
      ) : managers.map(m => {
        const assigned = (talent || []).filter(t => t.manager_id === m.id)
        return (
          <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-3">
            <div className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center text-base font-black text-red-400 flex-shrink-0">{initials(m.name)}</div>
                <div>
                  <div className="text-[13px] font-bold text-white">{m.name}</div>
                  <div className="text-[10px] text-zinc-500">{m.email}</div>
                </div>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-[10px] text-zinc-600">{assigned.length} talent</span>
                <Badge className={m.active !== false ? 'bg-red-500/10 text-red-400 border-red-500/25 text-[10px]' : 'bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px]'}>
                  {m.active !== false ? 'Active' : 'Inactive'}
                </Badge>
                <Btn size="sm" variant="ghost" onClick={() => toggleActive(m.id, !m.active)}>{m.active !== false ? 'Suspend' : 'Reactivate'}</Btn>
                <Btn size="sm" variant="cyan" onClick={() => { setAssignModal(m); setAssignTalent(assigned.map(t => t.id)) }}>Assign Talent</Btn>
              </div>
            </div>
            {assigned.length > 0 && (
              <div className="px-4 py-3 border-t border-zinc-900">
                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Assigned Talent</div>
                <div className="flex flex-wrap gap-2">
                  {assigned.map(t => (
                    <div key={t.id} onClick={() => onOpenWorkspace(t.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-500 transition-colors">
                      <span className="text-[11px] font-bold text-white">{t.name}</span>
                      <span className="text-zinc-600 text-sm">→</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Assign Talent Modal */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign Talent — ${assignModal?.name}`}>
        <div className="flex flex-col gap-2 mb-5">
          {(talent || []).map(t => {
            const checked = assignTalent.includes(t.id)
            return (
              <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'border-red-500/40 bg-red-500/5' : 'border-zinc-800 hover:border-zinc-600'}`}>
                <input type="checkbox" checked={checked}
                  onChange={() => setAssignTalent(prev => checked ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                  className="accent-[#fe2c55]" />
                <span className="text-sm font-bold text-white">{t.name}</span>
                {checked && <Badge className="ml-auto bg-red-500/10 text-red-400 border-red-500/25 text-[9px]">Assigned</Badge>}
              </label>
            )
          })}
        </div>
        <div className="flex gap-2">
          <Btn onClick={doSaveAssign} disabled={saving} className="flex-1">Save →</Btn>
          <Btn onClick={() => setAssignModal(null)} variant="ghost">Cancel</Btn>
        </div>
      </Modal>
    </div>
  )
}
