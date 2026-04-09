import { useAuth } from '../contexts/AuthContext'

const OWNER_NAV = [
  { page: 'dashboard',  label: 'Dashboard'   },
  { page: 'talent',     label: 'Talent'       },
  { page: 'managers',   label: 'Managers'     },
  { page: 'pods',       label: 'Pods'         },
  { page: 'masterlist', label: 'Master List'  },
  { page: 'sessions',   label: 'Sessions'     },
  { page: 'violations', label: 'Violations'   },
]
const MGR_NAV = [
  { page: 'talent',     label: 'My Talent'   },
  { page: 'pods',       label: 'Pods'        },
  { page: 'sessions',   label: 'Sessions'    },
  { page: 'violations', label: 'Violations'  },
]

export default function Sidebar({ page, onNavigate, isOwner, isManagerView, previewMgrId, setPreviewMgrId, managers }) {
  const { user, signOut } = useAuth()
  const navItems = isManagerView ? MGR_NAV : OWNER_NAV

  function handleViewSwitch(view) {
    if (view === 'owner') {
      setPreviewMgrId(null)
      onNavigate('dashboard')
    } else {
      // Default to first manager
      const first = managers?.[0]
      if (first) { setPreviewMgrId(first.id); onNavigate('talent') }
    }
  }

  return (
    <aside className="w-[220px] bg-zinc-950 border-r border-zinc-800/80 flex flex-col flex-shrink-0">

      {/* Logo */}
      <div className="px-4 py-[18px] border-b border-zinc-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#25f4ee20,#fe2c5520)',border:'1px solid #1a1a1a'}}>
          <div className="relative w-5 h-5">
            <div className="absolute left-0 top-0 w-[5px] h-5 border-2 border-cyan-400 rounded-sm" />
            <div className="absolute right-0 top-0 w-[5px] h-5 border-2 border-red-400 rounded-sm" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-0.5 bg-white rounded" />
          </div>
        </div>
        <div>
          <div className="text-[14px] font-black text-white tracking-tight">Hierarchy</div>
          <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Music</div>
        </div>
      </div>

      {/* Role badge + toggle pills */}
      <div className="px-3 py-2.5 border-b border-zinc-800/80">
        {/* Role pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-1.5 text-[11px] font-bold"
          style={{ background: 'rgba(37,244,238,.1)', color: '#25f4ee', border: '1px solid rgba(37,244,238,.3)' }}>
          <div className="w-[7px] h-[7px] rounded-full bg-cyan-400" />
          {previewMgrId ? 'Owner' : isOwner ? 'Owner' : 'Manager'}
        </div>

        {/* Email */}
        <div className="text-[9px] text-zinc-600 mb-2.5 truncate">{user?.email}</div>

        {/* Owner / Manager toggle pills — only for owners */}
        {isOwner && (
          <div className="flex gap-1.5 mb-1">
            <button
              onClick={() => handleViewSwitch('owner')}
              className="flex-1 py-2 rounded-lg text-[11px] font-black cursor-pointer border-0 transition-all"
              style={!previewMgrId
                ? { background: '#25f4ee', color: '#000' }
                : { background: 'transparent', color: '#555', border: '1px solid #2a2a2a' }}
            >
              Owner
            </button>
            <button
              onClick={() => handleViewSwitch('manager')}
              className="flex-1 py-2 rounded-lg text-[11px] font-bold cursor-pointer border-0 transition-all"
              style={previewMgrId
                ? { background: '#1a1a1a', color: '#fff', border: '1px solid #3a3a3a' }
                : { background: 'transparent', color: '#555', border: '1px solid #2a2a2a' }}
            >
              Manager
            </button>
          </div>
        )}

        {/* Manager picker dropdown — shown when previewing as manager */}
        {isOwner && previewMgrId && managers?.length > 0 && (
          <select
            value={previewMgrId}
            onChange={e => { setPreviewMgrId(e.target.value); onNavigate('talent') }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none cursor-pointer mt-1"
          >
            {managers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2.5 flex flex-col gap-0.5">
        {navItems.map(({ page: p, label }) => {
          const active = page === p
          return (
            <div
              key={p}
              onClick={() => onNavigate(p)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] cursor-pointer select-none transition-all"
              style={active
                ? { background: 'linear-gradient(135deg,rgba(254,44,85,.12),rgba(37,244,238,.06))', border: '1px solid rgba(254,44,85,.22)', color: '#fff', fontWeight: 700 }
                : { border: '1px solid transparent', color: '#555', fontWeight: 500 }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#161616'; e.currentTarget.style.color = '#fff' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' } }}
            >
              <div className="w-[7px] h-[7px] rounded-full flex-shrink-0 transition-colors" style={{ background: active ? '#fe2c55' : '#333' }} />
              {label}
            </div>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-4 py-3.5 border-t border-zinc-800/80">
        <button
          onClick={signOut}
          className="text-[11px] text-zinc-600 cursor-pointer bg-transparent border-0 hover:text-red-400 transition-colors"
        >
          ← Sign Out
        </button>
      </div>
    </aside>
  )
}
