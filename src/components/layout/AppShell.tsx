import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile, useIsDesktop } from '@/hooks/useMediaQuery'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { ToastContainer } from '@/components/ui/Toast'
import { Outlet, useLocation } from 'react-router-dom'

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Program Dashboard', subtitle: 'Overview & Action Items' },
  '/students': { title: 'Students', subtitle: 'Manage student records' },
  '/compliance': { title: 'Compliance & Clearance', subtitle: 'PTA / DPT / OTA Programs · Block 3' },
  '/placements': { title: 'Site & Placement Management', subtitle: 'Map, Roster & Auto-placement' },
  '/timecards': { title: 'Timecards', subtitle: 'Clock In/Out & Attestation' },
  '/evaluations': { title: 'Clinical Evaluation Engine', subtitle: 'Evaluations & Remediation' },
  '/accreditation': { title: 'Accreditation & Outcomes', subtitle: 'Standards Mapping & Evidence' },
  '/settings': { title: 'Settings', subtitle: 'Account & Preferences' },
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()
  const location = useLocation()

  const pageInfo = pageTitles[location.pathname] || { title: 'Clinical Bridge' }

  return (
    <div className="h-screen flex overflow-hidden bg-surface-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className={cn(
          "flex-1 overflow-y-auto",
          isMobile && "pb-20"
        )}>
          <div className="p-4 lg:p-5 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {isMobile && <BottomNav />}
      </div>

      <ToastContainer />
    </div>
  )
}