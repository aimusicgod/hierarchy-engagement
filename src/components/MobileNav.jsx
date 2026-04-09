// Mobile bottom navigation - only shown after login (App.jsx only renders MainApp when user is logged in)
const OWNER_TABS = [
  { page: 'dashboard', icon: '⬡', label: 'Home'     },
  { page: 'talent',    icon: '★', label: 'Talent'   },
  { page: 'sessions',  icon: '▷', label: 'Sessions' },
  { page: 'managers',  icon: '◈', label: 'Managers' },
]
const MGR_TABS = [
  { page: 'talent',     icon: '★', label: 'Talent'     },
  { page: 'pods',       icon: '◉', label: 'Pods'       },
  { page: 'sessions',   icon: '▷', label: 'Sessions'   },
  { page: 'violations', icon: '⚑', label: 'Violations' },
]

export default function MobileNav({ page, onNavigate, isOwner, isManagerView }) {
  const tabs = isManagerView ? MGR_TABS : OWNER_TABS
  return (
    <nav className="hidden md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 z-50 flex pb-safe"
      style={{ display: 'flex' }}
    >
      {/* This nav only renders inside MainApp which only renders when logged in */}
      <style>{`
        @media (max-width: 768px) {
          .mob-nav-bar { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mob-nav-bar { display: none !important; }
        }
      `}</style>
      <div className="mob-nav-bar w-full" style={{ display: 'none' }}>
        {tabs.map(({ page: p, icon, label }) => (
          <button
            key={p}
            onClick={() => onNavigate(p)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 border-0 bg-transparent cursor-pointer transition-colors"
            style={{ color: page === p ? '#fe2c55' : '#555' }}
          >
            <span className="text-base leading-none">{icon}</span>
            <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
