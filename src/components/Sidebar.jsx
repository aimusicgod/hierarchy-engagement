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

function HierarchyLogo({ size = 44 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        {/* Main gradient: blue top-left → purple → pink bottom-right */}
        <linearGradient id="g1" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#00cfff" />
          <stop offset="45%"  stopColor="#7b3fbe" />
          <stop offset="100%" stopColor="#ff2d78" />
        </linearGradient>

        {/* Left bar of H: blue → dark navy */}
        <linearGradient id="gLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#00aaff" />
          <stop offset="100%" stopColor="#001a4d" />
        </linearGradient>

        {/* Right bar of H: dark maroon → pink */}
        <linearGradient id="gRight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#4a003a" />
          <stop offset="100%" stopColor="#ff2d78" />
        </linearGradient>

        {/* Crossbar gradient */}
        <linearGradient id="gCross" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#00aaff" />
          <stop offset="50%"  stopColor="#8a2be2" />
          <stop offset="100%" stopColor="#ff2d78" />
        </linearGradient>
      </defs>

      {/* ── OUTER THICK RING (gradient stroke) ── */}
      <circle cx="100" cy="100" r="94" stroke="url(#g1)" strokeWidth="10" fill="none" />

      {/* ── THIN INNER RING ── */}
      <circle cx="100" cy="100" r="81" stroke="url(#g1)" strokeWidth="2.5" fill="none" />

      {/* ── WHITE FILL ── */}
      <circle cx="100" cy="100" r="79" fill="white" />

      {/* ────── LEFT VERTICAL BAR OF H ────── */}
      {/* Outer gradient outline */}
      <rect x="38" y="28" width="38" height="144" rx="4" fill="url(#gLeft)" />
      {/* Dark inner fill (creates the outlined look) */}
      <rect x="43" y="33" width="28" height="134" rx="2" fill="#0a1a3a" />

      {/* ────── RIGHT VERTICAL BAR OF H ────── */}
      {/* Outer gradient outline */}
      <rect x="124" y="28" width="38" height="144" rx="4" fill="url(#gRight)" />
      {/* Dark inner fill */}
      <rect x="129" y="33" width="28" height="134" rx="2" fill="#2a001a" />

      {/* ────── CROSSBAR ────── */}
      {/* Outer gradient outline */}
      <rect x="38" y="85" width="124" height="30" rx="3" fill="url(#gCross)" />
      {/* Dark inner fill */}
      <rect x="43" y="89" width="114" height="22" rx="2" fill="#1a0830" opacity="0.85" />

      {/* ────── BLUE DOT (left) ────── */}
      <circle cx="18" cy="100" r="10" fill="#00aaff" />

      {/* ────── PINK DOT (right) ────── */}
      <circle cx="182" cy="100" r="10" fill="#ff2d78" />
    </svg>
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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onCloseMobile} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 md:z-auto
        w-[220px] bg-zinc-950 border-r border-zinc-800/80 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{ height: '100dvh' }}>

        {/* Logo */}
        <div className="px-4 py-4 border-b border-zinc-800/80 flex items-center gap-3 flex-shrink-0">
          <HierarchyLogo size={44} />
          <div>
            <div className="text-[15px] font-black text-white tracking-tight">Hierarchy</div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Music</div>
          </div>
          <button onClick={onCloseMobile}
            className="ml-auto md:hidden text-zinc-600 hover:text-white bg-transparent border-0 text-xl cursor-pointer leading-none">
            ✕
          </button>
        </div>

        {/* Role badge + Owner/Manager toggle */}
        <div className="px-3 py-2.5 border-b border-zinc-800/80 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-1.5 text-[11px] font-bold"
            style={{ background: 'rgba(37,244,238,.1)', color: '#25f4ee', border: '1px solid rgba(37,244,238,.3)' }}>
            <div className="w-[7px] h-[7px] rounded-full bg-cyan-400" />
            {isOwner ? 'Owner' : 'Manager'}
          </div>
          <div className="text-[9px] text-zinc-600 mb-2.5 truncate">{user?.email}</div>

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
                <div className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                  style={{ background: active ? '#fe2c55' : '#333' }} />
                {label}
              </div>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-4 py-3.5 border-t border-zinc-800/80 flex-shrink-0">
          <button onClick={signOut}
            className="text-[11px] text-zinc-600 cursor-pointer bg-transparent border-0 hover:text-red-400 transition-colors">
            ← Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
