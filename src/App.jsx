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
  dashboard: 'My Dashboard', talent: 'My Talent', pods: 'Pods', sessions: 'Sessions', violations: 'Violations',
}

function TopBar({ page, isManagerView }) {
  const labels = isManagerView ? MGR_LABELS : PAGE_LABELS
  return (
    <div className="h-[46px] bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between px-5 flex-shrink-0">
      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{labels[page] || page}</span>
      <div className="flex gap-1.5">
        <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-cyan-500/8 text-cyan-400 border-cyan-500/20">TikTok</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-red-500/8 text-red-400 border-red-500/20">Instagram</span>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  )
}

function MainApp() {
  const { profile } = useAuth()
  const isOwner = profile?.role === 'owner'
  const { talent, refetch: refetchTalent } = useTalent()
  const { managers } = useManagers()

  const [page, setPage]           = useState(isOwner ? 'dashboard' : 'talent')
  const [workspaceId, setWorkspaceId] = useState(null)
  const [podDetailId, setPodDetailId] = useState(null)

  // Owner preview-as-manager state
  const [previewMgrId, setPreviewMgrId] = useState(null)
  const isManagerView = !isOwner || !!previewMgrId

  function navigate(p) { setPage(p) }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-mono">
      <Sidebar
        page={page}
        onNavigate={navigate}
        isOwner={isOwner}
        isManagerView={isManagerView}
        previewMgrId={previewMgrId}
        setPreviewMgrId={setPreviewMgrId}
        managers={managers}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {previewMgrId && (
          <PreviewBanner
            manager={managers.find(m => m.id === previewMgrId)}
            onExit={() => setPreviewMgrId(null)}
          />
        )}
        <TopBar page={page} isManagerView={isManagerView} />

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
              onRunSession={(podId) => { setPodDetailId(null); navigate('sessions') }}
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

      <MobileNav page={page} onNavigate={navigate} isOwner={isOwner} isManagerView={isManagerView} />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? <MainApp /> : <LoginPage />
}
