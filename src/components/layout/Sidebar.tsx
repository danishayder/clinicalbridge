import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useIsDesktop, useIsTablet } from '@/hooks/useMediaQuery'
import { 
  ShieldCheck, MapPin, Clock, ClipboardList, BarChart3, 
  LayoutDashboard, Settings, HeartPulse, X, ChevronLeft, Users
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  badge?: number
  badgeVariant?: 'blue' | 'amber' | 'red'
  roles?: string[]
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Clinical Ops',
    items: [
      { label: 'Compliance', icon: <ShieldCheck className="w-[18px] h-[18px]" />, path: '/compliance', badge: 3, badgeVariant: 'amber' },
      { label: 'Placements', icon: <MapPin className="w-[18px] h-[18px]" />, path: '/placements' },
      { label: 'Timecards', icon: <Clock className="w-[18px] h-[18px]" />, path: '/timecards', badge: 2, badgeVariant: 'amber' },
    ],
  },
  {
    title: 'Education',
    items: [
      { label: 'Students', icon: <Users className="w-[18px] h-[18px]" />, path: '/students' },
      { label: 'Evaluations', icon: <ClipboardList className="w-[18px] h-[18px]" />, path: '/evaluations', badge: 4, badgeVariant: 'blue' },
      { label: 'Accreditation', icon: <BarChart3 className="w-[18px] h-[18px]" />, path: '/accreditation' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, path: '/' },
      { label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" />, path: '/settings' },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const isDesktop = useIsDesktop()
  const isTablet = useIsTablet()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleNav = (path: string) => {
    navigate(path)
    if (!isDesktop) onClose()
  }

  // Tablet: icon-only sidebar
  if (isTablet) {
    return (
      <aside className="w-16 flex-shrink-0 bg-surface-0 border-r border-surface-200 flex flex-col h-screen overflow-hidden">
        <div className="p-3 border-b border-surface-200 flex justify-center">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
            <HeartPulse className="w-5 h-5" />
          </div>
        </div>
        <nav className="flex-1 py-2 space-y-1">
          {navSections.flatMap(s => s.items).map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                'w-full flex items-center justify-center py-3 px-2 relative transition-colors',
                location.pathname === item.path
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100'
              )}
              title={item.label}
            >
              {item.icon}
              {item.badge && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-warning-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-surface-200">
          <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-semibold mx-auto">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
        </div>
      </aside>
    )
  }

  // Desktop: full sidebar
  if (isDesktop) {
    return (
      <aside className="w-[220px] flex-shrink-0 bg-surface-0 border-r border-surface-200 flex flex-col h-screen overflow-hidden">
        {/* Logo */}
        <div className="p-4 border-b border-surface-200 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center text-white shadow-bridge">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-surface-900">Clinical Bridge</div>
            <div className="text-2xs text-surface-500 font-mono">v1.0 · Program Manager</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navSections.map((section) => (
            <div key={section.title} className="mb-2">
              <div className="px-4 py-2 text-2xs font-semibold text-surface-500 uppercase tracking-wider">
                {section.title}
              </div>
              {section.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    'cb-nav-item w-full text-left mx-2',
                    location.pathname === item.path && 'cb-nav-item-active'
                  )}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      'text-2xs font-semibold px-1.5 py-0.5 rounded-full',
                      item.badgeVariant === 'blue' && 'bg-brand-50 text-brand-700',
                      item.badgeVariant === 'amber' && 'bg-warning-50 text-warning-700',
                      item.badgeVariant === 'red' && 'bg-danger-50 text-danger-700',
                    )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-surface-200">
          <div className="flex items-center gap-3 p-2 rounded-sm hover:bg-surface-100 cursor-pointer transition-colors">
            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-surface-900 truncate">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-2xs text-surface-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </aside>
    )
  }

  // Mobile: drawer overlay
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-surface-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-50 bg-surface-0 shadow-xl flex flex-col"
          >
            <div className="p-4 border-b border-surface-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center text-white">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Clinical Bridge</div>
                  <div className="text-2xs text-surface-500 font-mono">v1.0</div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-sm">
                <X className="w-5 h-5 text-surface-500" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {navSections.map((section) => (
                <div key={section.title} className="mb-2">
                  <div className="px-4 py-2 text-2xs font-semibold text-surface-500 uppercase tracking-wider">
                    {section.title}
                  </div>
                  {section.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={cn(
                        'cb-nav-item w-full text-left mx-2',
                        location.pathname === item.path && 'cb-nav-item-active'
                      )}
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="bg-warning-50 text-warning-700 text-2xs font-semibold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}