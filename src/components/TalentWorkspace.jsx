import { useState } from 'react'
import { usePods, useAllMembers, useViolations, useSessions, useMembers } from '../hooks/useDatabase'
import { compliancePct, scoreColor, platformBadgeClass, platformShort, platformLabel, parseUsernames, formatDate, initials } from '../lib/utils'
import { Btn, Badge, StatCard, Panel, Spinner, Empty, Input, Select, toast } from '../components/UI'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pods', label: 'Pods' },
  { id: 'members', label: 'Members' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'violations', label: 'Violations' },
]

export default function TalentWorkspace({ talentId, allTalent, managers, onClose, onRefresh }) {
  const talent = allTalent?.find(t => t.id === talentId)
  const [tab, setTab] = useState('overview')
  const { pods, refetch: refetchPods, addPod, deletePod } = usePods(talentId)
  const { members: allMembers } = useAllMembers(talentId)
  const { violations } = useViolations(talentId)
  const { sessions, createSession } = useSessions(talentId)

  if (!talent) return null
  const mgr = managers?.find(m => m.id === talent.manager_id)

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      <div className="bg-zinc-950 border-b border-zinc-800 px-5 flex-shrink-0">
        <div className="h-14 flex items-center gap-4">
          <button onClick={onClose} className="text-[11px] font-bold text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded-lg bg-transparent cursor-pointer hover:text-white hover:border-zinc-500 transition-all font-mono flex-shrink-0">← Back</button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,rgba(37,244,238,.3),rgba(254,44,85,.3))' }}>{initials(talent.name)}</div>
            <div className="min-w-0">
              <div className="text-[15px] font-black text-white">{talent.name}</div>
              <div className="text-[10px] text-zinc-500 truncate">{[talent.ig_handle, talent.tt_handle].filter(Boolean).join('  ·  ')}</div>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-shrink-0">
            {mgr && <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">{mgr.name}</Badge>}
            <Badge className={talent.active ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25 text-[10px]' : 'bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px]'}>{talent.active ? 'Active' : 'Inactive'}</Badge>
          </div>
        </div>
        <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2.5 text-[11px] font-semibold cursor-pointer whitespace-nowrap border-b-2 bg-transparent border-t-0 border-l-0 border-r-0 font-mono transition-all ${tab === id ? 'text-white border-b-[#fe2c55] font-bold' : 'text-zinc-500 border-b-transparent hover:text-white'}`}>{label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'overview'   && <OverviewTab allMembers={allMembers} violations={violations} pods={pods} />}
        {tab === 'pods'       && <PodsTab pods={pods} addPod={addPod} deletePod={deletePod} onRefresh={() => { refetchPods(); onRefresh() }} />}
        {tab === 'members'    && <MembersTab allMembers={allMembers} pods={pods} />}
        {tab === 'sessions'   && <SessionsTab sessions={sessions} pods={pods} createSession={createSession} />}
        {tab === 'violations' && <ViolationsTab violations={violations} />}
      </div>
    </div>
  )
}

function OverviewTab({ allMembers, violations, pods }) {
  const avg = allMembers.length ? Math.round(allMembers.reduce((a, m) => a + compliancePct(m), 0) / allMembers.length) : 100
  const atRisk = allMembers.filter(m => compliancePct(m) <= 70).length
  const removal = allMembers.filter(m => compliancePct(m) <= 50).length
  const top = allMembers.filter(m => compliancePct(m) >= 100).sort((a, b) => (b.session_count||0)-(a.session_count||0)).slice(0, 5)
  const risk = allMembers.filter(m => compliancePct(m) <= 70).sort((a, b) => compliancePct(a) - compliancePct(b))
  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Members" value={allMembers.length} sub={`${pods.length} pods`} accent />
        <StatCard label="Avg Compliance" value={avg+'%'} />
        <StatCard label="At Risk" value={atRisk} sub="score ≤70%" warning />
        <StatCard label="Removal Queue" value={removal} sub="score ≤50%" danger />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <Panel title="Pods Summary">
          {!pods.length ? <span className="text-xs text-zinc-600">No pods yet.</span> : pods.map(p => {
            const cnt=(p.members||[]).filter(m=>m.status==='active').length
            const vios=violations.filter(v=>v.pod_id===p.id).length
            return (<div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-900 last:border-0">
              <div className="flex items-center gap-2"><span className="text-[12px] font-semibold text-white">{p.name}</span><Badge className={platformBadgeClass(p.platform)+' text-[8px] px-1.5 py-0.5'}>{platformShort(p.platform)}</Badge></div>
              <span className="text-[10px] text-zinc-500">{cnt} members{vios>0&&<span className="text-red-400 ml-2">{vios} vios</span>}</span>
            </div>)
          })}
        </Panel>
        <Panel title="Top Performers">
          {!top.length ? <span className="text-xs text-zinc-600">Run sessions to see performers.</span>
            : top.map((m,i) => (<div key={m.id} className="flex items-center justify-between py-1.5 border-b border-zinc-900 last:border-0">
              <div className="flex items-center gap-2"><span className="text-sm">{['🥇','🥈','🥉'][i]||i+1}</span><span className="text-[12px] font-bold text-white">{m.username}</span></div>
              <span className="text-[11px] font-black text-cyan-400">100%</span>
            </div>))}
        </Panel>
      </div>
      <Panel title="At Risk & Removal Queue">
        {!risk.length ? <span className="text-xs text-zinc-600">All members in good standing.</span>
          : risk.map(m => { const p=compliancePct(m); return (<div key={m.id} className="flex items-center justify-between py-1.5 border-b border-zinc-900 last:border-0"><span className="text-[12px] font-bold text-white">{p<=50&&'⚑ '}{m.username}</span><span className="text-[11px] font-bold" style={{color:scoreColor(p)}}>{p}%</span></div>) })}
      </Panel>
    </div>
  )
}

function PodsTab({ pods, addPod, deletePod, onRefresh }) {
  const [showAdd,setShowAdd]=useState(false); const [name,setName]=useState(''); const [plat,setPlat]=useState('ig'); const [saving,setSaving]=useState(false)
  async function doAdd(){if(!name.trim())return;setSaving(true);try{await addPod({name:name.trim(),platform:plat});setName('');setShowAdd(false);toast('Pod added!');onRefresh()}catch(e){toast('Error: '+e.message)}setSaving(false)}
  async function doDel(id){if(!window.confirm('Remove this pod and all its members?'))return;try{await deletePod(id);toast('Pod removed.');onRefresh()}catch(e){toast('Error: '+e.message)}}
  return (<div>
    <div className="flex items-center justify-between mb-4"><div className="text-[13px] font-bold text-white">Engagement Groups</div><Btn size="sm" onClick={()=>setShowAdd(!showAdd)}>+ Add Pod</Btn></div>
    {showAdd&&(<div className="bg-red-500/5 border border-red-500/25 rounded-xl p-4 mb-4">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Pod Name</div><Input value={name} onChange={setName} placeholder="e.g. IG Group A"/></div>
        <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Platform</div><Select value={plat} onChange={setPlat}><option value="ig">Instagram</option><option value="tt">TikTok</option><option value="both">Both</option></Select></div>
      </div>
      <div className="flex gap-2"><Btn onClick={doAdd} disabled={saving} size="sm">Add →</Btn><Btn onClick={()=>setShowAdd(false)} variant="ghost" size="sm">Cancel</Btn></div>
    </div>)}
    {!pods.length?<Empty msg="No pods yet — add one above."/>:pods.map(p=>{const cnt=(p.members||[]).filter(m=>m.status==='active').length;return(
      <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0"><div className="text-[13px] font-bold text-white">{p.name}</div><div className="text-[10px] text-zinc-500 mt-0.5">{cnt} active members</div></div>
        <Badge className={platformBadgeClass(p.platform)}>{platformLabel(p.platform)}</Badge>
        <button onClick={()=>doDel(p.id)} className="text-[10px] font-bold text-red-400 border border-red-500/25 px-3 py-1.5 rounded-lg bg-transparent cursor-pointer hover:bg-red-500/10 transition-colors font-mono">Remove</button>
      </div>
    )})}
  </div>)
}

function MembersTab({ allMembers, pods }) {
  const [search,setSearch]=useState('')
  const [filter,setFilter]=useState('all')
  const [showAdd,setShowAdd]=useState(false)
  const [bulkText,setBulkText]=useState('')
  const [selPod,setSelPod]=useState(pods[0]?.id||'')
  const [tier,setTier]=useState('a')
  const [saving,setSaving]=useState(false)
  const { addMember } = useMembers(selPod)

  const filt=allMembers.filter(m=>{
    if(search&&!m.username.toLowerCase().includes(search.toLowerCase()))return false
    if(filter==='ig'&&m.pods?.platform!=='ig')return false
    if(filter==='tt'&&m.pods?.platform!=='tt')return false
    if(filter==='risk'&&compliancePct(m)>70)return false
    return true
  })

  function parseBulk(raw){
    const seen=new Set()
    return raw.split(/[\n,;]+/).map(u=>u.trim().replace(/^@/,'').toLowerCase())
      .filter(u=>{if(!u||!/^[a-z0-9._]+$/i.test(u))return false;if(seen.has(u))return false;seen.add(u);return true})
  }
  const parsed=parseBulk(bulkText)
  const existingInPod=new Set(allMembers.filter(m=>m.pod_id===selPod).map(m=>m.username.replace(/^@/,'').toLowerCase()))
  const dups=parsed.filter(u=>existingInPod.has(u))
  const toAdd=parsed.filter(u=>!existingInPod.has(u))

  async function doBulkAdd(){
    if(!toAdd.length||!selPod)return
    setSaving(true)
    try{for(const u of toAdd)await addMember({username:'@'+u,tier});setBulkText('');setShowAdd(false);toast(`Added ${toAdd.length} member${toAdd.length!==1?'s':''}!`)}
    catch(e){toast('Error: '+e.message)}
    setSaving(false)
  }

  return (<div>
    <div className="flex items-center justify-between mb-4">
      <div><div className="text-[13px] font-bold text-white">All Members</div><div className="text-[10px] text-zinc-500 mt-0.5">Across all pods for this talent</div></div>
      <Btn size="sm" onClick={()=>{setShowAdd(!showAdd);if(!selPod&&pods[0])setSelPod(pods[0].id)}}>+ Add Member</Btn>
    </div>
    {showAdd&&(
      <div className="bg-red-500/5 border border-red-500/25 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Bulk Add Members</div>
          <div className="text-[9px] text-zinc-600">One per line — duplicates auto-removed</div>
        </div>
        <div className="grid gap-3 mb-3" style={{gridTemplateColumns:'1fr 200px'}}>
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Usernames</div>
            <textarea value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder={"@user1\n@user2\n@user3"}
              className="w-full h-28 bg-zinc-950 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-[11px] font-mono outline-none resize-none focus:border-red-500/40 placeholder:text-zinc-700"/>
          </div>
          <div className="flex flex-col gap-3">
            <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Pod</div>
              <Select value={selPod} onChange={setSelPod}>{pods.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
            <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Tier</div>
              <Select value={tier} onChange={setTier}><option value="a">Tier 1</option><option value="b">Tier 2</option></Select></div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[10px] flex flex-col gap-1">
              <div className="flex justify-between"><span className="text-zinc-600">Pasted</span><span className="font-bold text-white">{parsed.length}</span></div>
              <div className="flex justify-between"><span className="text-red-400">Will add</span><span className="font-bold text-red-400">{toAdd.length}</span></div>
              <div className="flex justify-between"><span className="text-yellow-400">Dups skipped</span><span className="font-bold text-yellow-400">{dups.length}</span></div>
            </div>
          </div>
        </div>
        {dups.length>0&&(<div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2 mb-3 flex flex-wrap gap-1">
          {dups.map(u=><span key={u} className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 rounded px-2 py-0.5 font-mono">@{u}</span>)}
        </div>)}
        <div className="flex gap-2">
          <button onClick={doBulkAdd} disabled={saving||!toAdd.length}
            className="bg-[#fe2c55] text-white text-[11px] font-bold px-4 py-2 rounded-lg border-0 cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed font-mono transition-opacity">
            {saving?'Adding…':`Add ${toAdd.length} Member${toAdd.length!==1?'s':''} →`}
          </button>
          <Btn onClick={()=>{setShowAdd(false);setBulkText('')}} variant="ghost" size="sm">Cancel</Btn>
        </div>
      </div>
    )}
    <div className="flex gap-2 flex-wrap mb-4">
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="w-36 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[11px] text-white font-mono outline-none focus:border-cyan-500/50 placeholder:text-zinc-700"/>
      {['all','ig','tt','risk'].map(f=>(<button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold border cursor-pointer font-mono transition-all ${filter===f?'bg-[#fe2c55] text-white border-[#fe2c55]':'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}>{f==='all'?'All':f==='ig'?'IG':f==='tt'?'TT':'At Risk'}</button>))}
      <span className="text-[10px] text-zinc-600 ml-auto self-center">{filt.length} members</span>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="grid gap-2 px-4 py-2 bg-zinc-900/80 border-b border-zinc-800" style={{gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1.2fr'}}>
        {['Username','Pod','Platform','Tier','Compliance'].map(h=><span key={h} className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{h}</span>)}
      </div>
      {!filt.length?<div className="py-10 text-center text-sm text-zinc-600">No members match.</div>
        :filt.map(m=>{const pct=compliancePct(m);return(
          <div key={m.id} className={`grid gap-2 items-center px-4 py-2.5 border-b border-zinc-900 last:border-0 hover:bg-zinc-900/30 ${pct<=50?'border-l-2 border-l-red-500/50 bg-red-500/5':''}`} style={{gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1.2fr'}}>
            <span className="text-[12px] font-bold text-white">{pct<=50&&'⚑ '}{m.username}</span>
            <span className="text-[11px] text-zinc-600">{m.pods?.name}</span>
            <Badge className={platformBadgeClass(m.pods?.platform)+' text-[9px]'}>{platformShort(m.pods?.platform)}</Badge>
            <span className={`text-[10px] font-bold ${m.tier==='a'?'text-cyan-400':'text-zinc-500'}`}>{m.tier==='a'?'Tier 1':'Tier 2'}</span>
            <span className="text-right text-[11px] font-bold" style={{color:scoreColor(pct)}}>{pct}%</span>
          </div>
        )})}
    </div>
  </div>)
}

function SessionsTab({ sessions, pods, createSession }) {
  const [showForm,setShowForm]=useState(false);const [url,setUrl]=useState('');const [date,setDate]=useState(new Date().toISOString().slice(0,10));const [time,setTime]=useState('12:00');const [selPods,setSelPods]=useState([]);const [commented,setCommented]=useState('');const [liked,setLiked]=useState('');const [active,setActive]=useState(null);const [live,setLive]=useState(null);const [saving,setSaving]=useState(false)
  function computeLive(){if(!active)return;const c=parseUsernames(commented),l=parseUsernames(liked);if(!c.length&&!l.length){setLive(null);return}setLive(active.pods.map(pod=>{const mems=(pod.members||[]).filter(m=>m.status==='active');let ok=0,vio=0;const rows=mems.map(m=>{const key=m.username.replace(/^@/,'').toLowerCase();const dc=c.includes(key),dl=l.includes(key);if(dc&&dl)ok++;else vio++;return{...m,dc,dl}});return{pod,rows,ok,vio}}))}
  function startSess(){if(!url.trim()){toast('Post URL required.');return}if(!selPods.length){toast('Select at least one pod.');return}setActive({url,date,time,pods:pods.filter(p=>selPods.includes(p.id))});setCommented('');setLiked('');setLive(null);setShowForm(false)}
  async function logSess(){if(!active||!live)return;setSaving(true);try{await createSession({post_url:active.url,session_date:active.date,session_time:active.time,pod_ids:active.pods.map(p=>p.id),commented:parseUsernames(commented),liked:parseUsernames(liked)});setActive(null);setLive(null);setSelPods([]);toast('Session saved!')}catch(e){toast('Error: '+e.message)}setSaving(false)}
  return (<div>
    <div className="flex items-center justify-between mb-4"><div className="text-[13px] font-bold text-white">Sessions</div>{!active&&<Btn size="sm" onClick={()=>setShowForm(!showForm)}>+ New Session</Btn>}</div>
    {showForm&&(<div className="bg-cyan-500/5 border border-cyan-500/25 rounded-xl p-4 mb-4">
      <div className="mb-3"><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Post URL *</div><input value={url} onChange={e=>setUrl(e.target.value)} type="url" placeholder="https://…" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-cyan-400 text-[11px] font-mono outline-none focus:border-cyan-500/50"/></div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Date</div><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none"/></div>
        <div><div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Time</div><input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none"/></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">{pods.map(p=>{const ch=selPods.includes(p.id);return(<label key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${ch?'bg-red-500/10 border-red-500/35':'bg-zinc-900 border-zinc-800 hover:border-zinc-600'}`}><input type="checkbox" checked={ch} onChange={()=>setSelPods(prev=>ch?prev.filter(id=>id!==p.id):[...prev,p.id])} className="accent-[#fe2c55]"/><span className="text-[11px] font-bold text-white">{p.name}</span><Badge className={platformBadgeClass(p.platform)+' text-[8px]'}>{platformShort(p.platform)}</Badge></label>)})}</div>
      <div className="flex gap-2"><Btn onClick={startSess} variant="blue" size="sm">Start →</Btn><Btn onClick={()=>setShowForm(false)} variant="ghost" size="sm">Cancel</Btn></div>
    </div>)}
    {active&&(<div className="mb-4">
      <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-3 mb-3"><div className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1">Active Session</div><div className="text-[11px] text-zinc-500 font-mono break-all">{active.url}</div></div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><div className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">Who Commented</div><textarea value={commented} onChange={e=>{setCommented(e.target.value);setTimeout(computeLive,100)}} placeholder={"@user1\n@user2"} className="w-full bg-zinc-950 border border-cyan-500/20 rounded-lg px-3 py-2 text-cyan-400 text-[11px] font-mono outline-none resize-none min-h-[80px]"/></div>
        <div><div className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1.5">Who Liked</div><textarea value={liked} onChange={e=>{setLiked(e.target.value);setTimeout(computeLive,100)}} placeholder={"@user1\n@user2"} className="w-full bg-zinc-950 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-[11px] font-mono outline-none resize-none min-h-[80px]"/></div>
      </div>
      {live&&(<div className="mb-3">{live.map(({pod,rows,ok,vio})=>(<div key={pod.id} className="mb-3"><div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-t-xl border-b-0"><Badge className={platformBadgeClass(pod.platform)+' text-[8px]'}>{platformShort(pod.platform)}</Badge><span className="text-[11px] font-bold text-white">{pod.name}</span><span className="ml-auto text-[10px] text-cyan-400">{ok} ok</span><span className="text-[10px] text-red-400">{vio} vios</span></div><div className="border border-zinc-800 border-t-0 rounded-b-xl overflow-hidden">{rows.map(m=>(<div key={m.id} className="grid gap-2 items-center px-4 py-2 border-b border-zinc-900 last:border-0" style={{gridTemplateColumns:'2fr 1fr 1fr'}}><span className="text-[11px] font-bold text-white">{m.username}</span><span className={m.dc?'text-cyan-400':'text-red-400'}>{m.dc?'✓':'✗'}</span><span className={m.dl?'text-cyan-400':'text-red-400'}>{m.dl?'✓':'✗'}</span></div>))}</div></div>))}<button onClick={logSess} disabled={saving} className="w-full bg-[#fe2c55] text-white text-[12px] font-bold py-3 rounded-xl border-0 cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50 font-mono">{saving?'Saving…':'Log Violations + Save →'}</button></div>)}
    </div>)}
    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">History</div>
    {!sessions.length?<Empty msg="No sessions yet."/>:sessions.map(s=>{const pn=(s.session_pods||[]).map(sp=>sp.pods?.name).join(' + ')||'—';return(<div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-3"><div className="p-3 flex items-center justify-between flex-wrap gap-2"><div><div className="text-[12px] font-bold text-white">{pn}</div><div className="text-[10px] text-zinc-500">{formatDate(s.session_date)}</div></div><div className="flex gap-3 text-[11px] font-bold"><span className="text-cyan-400">✓ {s.total_ok}</span><span className="text-red-400">✗ {s.total_violations}</span></div></div><div className="px-3 py-1.5 border-t border-zinc-900"><a href={s.post_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-400 font-mono hover:text-white truncate block">{s.post_url}</a></div></div>)})}
  </div>)
}

function ViolationsTab({ violations }) {
  const [filter, setFilter] = useState('all')
  const filt = violations.filter(v => filter === 'all' || v.violation_type === filter)
  return (<div>
    <div className="text-[13px] font-bold text-white mb-4">Violation Log</div>
    <div className="flex gap-2 flex-wrap mb-4">
      {[['all','All'],['no_comment','No Comment'],['no_like','No Like']].map(([f,l])=>(
        <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold border cursor-pointer font-mono transition-all ${filter===f?'bg-[#fe2c55] text-white border-[#fe2c55]':'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}>{l}</button>
      ))}
      <span className="text-[10px] text-zinc-600 ml-auto self-center">{filt.length} records</span>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="grid gap-2 px-4 py-2 bg-zinc-900/80 border-b border-zinc-800" style={{gridTemplateColumns:'2fr 1.5fr 1fr 1.5fr 1fr'}}>
        {['Username','Pod','Platform','Type','Compliance'].map(h=><span key={h} className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{h}</span>)}
      </div>
      {!filt.length?<div className="py-10 text-center text-sm text-zinc-600">No violations logged yet.</div>
        :filt.map(v=>{const m=v.members,p=v.pods,pct=m?compliancePct(m):null;return(
          <div key={v.id} className={`grid gap-2 items-center px-4 py-2.5 border-b border-zinc-900 last:border-0 hover:bg-zinc-900/30 ${pct!==null&&pct<=50?'border-l-2 border-l-red-500/50 bg-red-500/5':''}`} style={{gridTemplateColumns:'2fr 1.5fr 1fr 1.5fr 1fr'}}>
            <span className="text-[12px] font-bold text-white">{pct!==null&&pct<=50&&'⚑ '}{m?.username||'—'}</span>
            <span className="text-[11px] text-zinc-600">{p?.name||'—'}</span>
            {p?<Badge className={platformBadgeClass(p.platform)+' text-[9px]'}>{platformShort(p.platform)}</Badge>:<span/>}
            {v.violation_type==='no_comment'?<Badge className="bg-red-500/10 text-red-400 border-red-500/25 text-[9px]">No Comment</Badge>:<Badge className="bg-orange-500/10 text-orange-400 border-orange-500/25 text-[9px]">No Like</Badge>}
            {pct!==null?<span className="text-right text-[11px] font-bold" style={{color:scoreColor(pct)}}>{pct}%</span>:<span/>}
          </div>
        )})}
    </div>
  </div>)
}
