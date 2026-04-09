import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useTalent, useManagers } from './hooks/useDatabase'
import LoginPage from './pages/LoginPage'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import PreviewBanner from './components/PreviewBanner'
import DashboardPage from './pages/DashboardPage'
import TalentPage from './pages/TalentPage'
import ManagersPage from './pages/ManagersPage'
import PodsPage from './pages/PodsPage'
import MasterListPage from './pages/MasterListPage'
import SessionsPage from './pages/SessionsPage'
import ViolationsPage from './pages/ViolationsPage'
import TalentWorkspace from './components/TalentWorkspace'
import PodDetail from './components/PodDetail'

const PAGE_LABELS = {
  dashboard: 'Dashboard', talent: 'Talent', managers: 'Managers',
  pods: 'Pods', masterlist: 'Master List', sessions: 'Sessions', violations: 'Violations',
}
const MGR_LABELS = {
  dashboard: 'My Dashboard', talent: 'My Talent', pods: 'Pods',
  sessions: 'Sessions', violations: 'Violations',
}

function Spinner() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  )
}

function TopBar({ page, isManagerView, onMenuClick }) {
  const labels = isManagerView ? MGR_LABELS : PAGE_LABELS
  return (
    <div className="h-[46px] bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button onClick={onMenuClick}
          className="md:hidden text-zinc-500 hover:text-white bg-transparent border-0 cursor-pointer text-lg leading-none p-1">
          ☰
        </button>
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
          {labels[page] || page}
        </span>
      </div>
      <div className="flex gap-1.5">
        <span className="text-[9px] font-bold px-2 py-0.5 rounded border" style={{ background: 'rgba(37,244,238,.08)', color: '#25f4ee', borderColor: 'rgba(37,244,238,.2)' }}>TikTok</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded border" style={{ background: 'rgba(254,44,85,.08)', color: '#fe2c55', borderColor: 'rgba(254,44,85,.2)' }}>Instagram</span>
      </div>
    </div>
  )
}

function MainApp() {
  const { profile } = useAuth()
  const isOwner = profile?.role === 'owner'
  const { talent, refetch: refetchTalent } = useTalent()
  const { managers } = useManagers()

  const [page, setPage]               = useState(isOwner ? 'dashboard' : 'talent')
  const [workspaceId, setWorkspaceId] = useState(null)
  const [podDetailId, setPodDetailId] = useState(null)
  const [previewMgrId, setPreviewMgrId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isManagerView = !isOwner || !!previewMgrId

  return (
    <div className="flex h-screen bg-black overflow-hidden font-mono">
      <Sidebar
        page={page}
        onNavigate={setPage}
        isOwner={isOwner}
        isManagerView={isManagerView}
        previewMgrId={previewMgrId}
        setPreviewMgrId={setPreviewMgrId}
        managers={managers}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {previewMgrId && (
          <PreviewBanner
            manager={managers.find(m => m.id === previewMgrId)}
            onExit={() => setPreviewMgrId(null)}
          />
        )}

        <TopBar page={page} isManagerView={isManagerView} onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-hidden relative">
          {page === 'dashboard'  && <DashboardPage onOpenWorkspace={setWorkspaceId} />}
          {page === 'talent'     && <TalentPage onOpenWorkspace={setWorkspaceId} managers={managers} />}
          {page === 'managers'   && <ManagersPage onOpenWorkspace={setWorkspaceId} talent={talent} />}
          {page === 'pods'       && <PodsPage onOpenPodDetail={setPodDetailId} />}
          {page === 'masterlist' && <MasterListPage />}
          {page === 'sessions'   && <SessionsPage />}
          {page === 'violations' && <ViolationsPage />}

          {podDetailId && (
            <PodDetail
              podId={podDetailId}
              allTalent={talent}
              onClose={() => setPodDetailId(null)}
              onRunSession={() => { setPodDetailId(null); setPage('sessions') }}
            />
          )}
        </div>

        {workspaceId && (
          <TalentWorkspace
            talentId={workspaceId}
            allTalent={talent}
            managers={managers}
            onClose={() => setWorkspaceId(null)}
            onRefresh={refetchTalent}
          />
        )}
      </div>

      {/* Mobile bottom nav — only shown when logged in */}
      <MobileNav page={page} onNavigate={setPage} isOwner={isOwner} isManagerView={isManagerView} />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? <MainApp /> : <LoginPage />
}
