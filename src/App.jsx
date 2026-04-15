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
import Watermark from './components/Watermark'

const PAGE_LABELS = {
  dashboard: 'Dashboard', talent: 'Talent', managers: 'Managers',
  pods: 'Pods', masterlist: 'Master List', sessions: 'Sessions', violations: 'Violations',
}
const MGR_LABELS = {
  talent: 'My Talent', pods: 'Pods', sessions: 'Sessions', violations: 'Violations',
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #27272a', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function TopBar({ page, isManagerView, onMenuClick }) {
  const labels = isManagerView ? MGR_LABELS : PAGE_LABELS
  return (
    <div style={{ height: 46, background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Hamburger - mobile only */}
        <button onClick={onMenuClick} className="md:hidden"
          style={{ color: '#555', background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}>
          ☰
        </button>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '.8px', textTransform: 'uppercase' }}>
          {labels[page] || page}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'rgba(37,244,238,.08)', color: '#25f4ee', border: '1px solid rgba(37,244,238,.2)' }}>TikTok</span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'rgba(254,44,85,.08)', color: '#fe2c55', border: '1px solid rgba(254,44,85,.2)' }}>Instagram</span>
      </div>
    </div>
  )
}

function MainApp() {
  const { profile } = useAuth()
  const isOwner = profile?.role === 'owner'
  const { talent, refetch: refetchTalent } = useTalent()
  const { managers } = useManagers()

  const [page, setPage]                 = useState(isOwner ? 'dashboard' : 'talent')
  const [workspaceId, setWorkspaceId]   = useState(null)
  const [podDetailId, setPodDetailId]   = useState(null)
  const [previewMgrId, setPreviewMgrId] = useState(null)
  const [sidebarOpen, setSidebarOpen]   = useState(false)

  const isManagerView = !isOwner || !!previewMgrId

  // Page content lookup
  const pages = {
    dashboard:  <DashboardPage onOpenWorkspace={setWorkspaceId} />,
    talent:     <TalentPage onOpenWorkspace={setWorkspaceId} managers={managers} />,
    managers:   <ManagersPage onOpenWorkspace={setWorkspaceId} talent={talent} />,
    pods:       <PodsPage onOpenPodDetail={setPodDetailId} />,
    masterlist: <MasterListPage />,
    sessions:   <SessionsPage />,
    violations: <ViolationsPage />,
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#000', fontFamily: "'Inter', sans-serif" }}>

      <Sidebar
        page={page} onNavigate={setPage}
        isOwner={isOwner} isManagerView={isManagerView}
        previewMgrId={previewMgrId} setPreviewMgrId={setPreviewMgrId}
        managers={managers}
        mobileOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {previewMgrId && (
          <PreviewBanner manager={managers.find(m => m.id === previewMgrId)} onExit={() => setPreviewMgrId(null)} />
        )}

        <TopBar page={page} isManagerView={isManagerView} onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable page area — this is the key fix */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', paddingBottom: 60 }}>
          {pages[page]}

          {podDetailId && (
            <PodDetail
              podId={podDetailId} allTalent={talent}
              onClose={() => setPodDetailId(null)}
              onRunSession={() => { setPodDetailId(null); setPage('sessions') }}
            />
          )}
        </div>

      </div>

      {/* Overlays */}
      {workspaceId && (
        <TalentWorkspace
          talentId={workspaceId} allTalent={talent} managers={managers}
          onClose={() => setWorkspaceId(null)} onRefresh={refetchTalent} onOpenPodDetail={setPodDetailId}
        />
      )}

      {/* Email watermark for leak tracking */}
      <Watermark />

      {/* Mobile bottom nav */}
      <MobileNav page={page} onNavigate={setPage} isOwner={isOwner} isManagerView={isManagerView} />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? <MainApp /> : <LoginPage />
}
