import { useAuth } from '../contexts/AuthContext'

const OWNER_NAV = [
  { page: 'dashboard',  label: 'Dashboard'  },
  { page: 'talent',     label: 'Talent'      },
  { page: 'managers',   label: 'Managers'    },
  { page: 'pods',       label: 'Pods'        },
  { page: 'masterlist', label: 'Master List' },
  { page: 'sessions',   label: 'Sessions'    },
  { page: 'violations', label: 'Violations'  },
]
const MGR_NAV = [
  { page: 'talent',     label: 'My Talent'  },
  { page: 'pods',       label: 'Pods'       },
  { page: 'sessions',   label: 'Sessions'   },
  { page: 'violations', label: 'Violations' },
]

// The real Hierarchy Music logo mark — H with vertical bars and dots
function HierarchyLogo({ size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #0d1a1a, #1a0d0d)', border: '2px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        {/* Left bar */}
        <rect x="2" y="3" width="4" height="18" rx="1" fill="#25f4ee" />
        {/* Right bar */}
        <rect x="18" y="3" width="4" height="18" rx="1" fill="#fe2c55" />
        {/* Cross bar */}
        <rect x="2" y="10" width="20" height="4" rx="1" fill="white" opacity="0.9" />
        {/* Dots */}
        <circle cx="4" cy="2" r="1.5" fill="#25f4ee" />
        <circle cx="20" cy="2" r="1.5" fill="#fe2c55" />
      </svg>
    </div>
  )
}

export default function Sidebar({ page, onNavigate, isOwner, isManagerView, previewMgrId, setPreviewMgrId, managers, mobileOpen, onCloseMobile }) {
  const { user, signOut } = useAuth()
  const navItems = isManagerView ? MGR_NAV : OWNER_NAV

  function handleViewSwitch(view) {
    if (view === 'owner') {
      setPreviewMgrId(null)
      onNavigate('dashboard')
    } else {
      const first = managers?.[0]
      if (first) { setPreviewMgrId(first.id); onNavigate('talent') }
    }
    if (onCloseMobile) onCloseMobile()
  }

  function handleNav(p) {
    onNavigate(p)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onCloseMobile} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 md:z-auto
        w-[220px] bg-zinc-950 border-r border-zinc-800/80 flex flex-col flex-shrink-0
        transform transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="px-4 py-4 border-b border-zinc-800/80 flex items-center gap-3">
          <HierarchyLogo size={42} />
          <div>
            <div className="text-[15px] font-black text-white tracking-tight">Hierarchy</div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Music</div>
          </div>
          {/* Close button on mobile */}
          <button onClick={onCloseMobile} className="ml-auto md:hidden text-zinc-600 hover:text-white bg-transparent border-0 text-xl cursor-pointer">✕</button>
        </div>

        {/* Role badge + Owner/Manager toggle */}
        <div className="px-3 py-2.5 border-b border-zinc-800/80">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-1.5 text-[11px] font-bold"
            style={{ background: 'rgba(37,244,238,.1)', color: '#25f4ee', border: '1px solid rgba(37,244,238,.3)' }}>
            <div className="w-[7px] h-[7px] rounded-full bg-cyan-400" />
            {isOwner ? 'Owner' : 'Manager'}
          </div>

          <div className="text-[9px] text-zinc-600 mb-2.5 truncate">{user?.email}</div>

          {/* Owner/Manager toggle — only for owners */}
          {isOwner && (
            <>
              <div className="flex gap-1.5 mb-1">
                <button onClick={() => handleViewSwitch('owner')}
                  className="flex-1 py-2 rounded-lg text-[11px] font-black cursor-pointer border-0 transition-all"
                  style={!previewMgrId
                    ? { background: '#25f4ee', color: '#000' }
                    : { background: 'transparent', color: '#555', border: '1px solid #2a2a2a' }}>
                  Owner
                </button>
                <button onClick={() => handleViewSwitch('manager')}
                  className="flex-1 py-2 rounded-lg text-[11px] font-bold cursor-pointer border-0 transition-all"
                  style={previewMgrId
                    ? { background: '#1a1a1a', color: '#fff', border: '1px solid #3a3a3a' }
                    : { background: 'transparent', color: '#555', border: '1px solid #2a2a2a' }}>
                  Manager
                </button>
              </div>
              {previewMgrId && managers?.length > 0 && (
                <select value={previewMgrId}
                  onChange={e => { setPreviewMgrId(e.target.value); onNavigate('talent') }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none cursor-pointer mt-1">
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              )}
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2.5 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ page: p, label }) => {
            const active = page === p
            return (
              <div key={p} onClick={() => handleNav(p)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] cursor-pointer select-none transition-all"
                style={active
                  ? { background: 'linear-gradient(135deg,rgba(254,44,85,.12),rgba(37,244,238,.06))', border: '1px solid rgba(254,44,85,.22)', color: '#fff', fontWeight: 700 }
                  : { border: '1px solid transparent', color: '#555', fontWeight: 500 }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#161616'; e.currentTarget.style.color = '#fff' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' } }}>
                <div className="w-[7px] h-[7px] rounded-full flex-shrink-0 transition-colors"
                  style={{ background: active ? '#fe2c55' : '#333' }} />
                {label}
              </div>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-4 py-3.5 border-t border-zinc-800/80">
          <button onClick={signOut}
            className="text-[11px] text-zinc-600 cursor-pointer bg-transparent border-0 hover:text-red-400 transition-colors">
            ← Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
