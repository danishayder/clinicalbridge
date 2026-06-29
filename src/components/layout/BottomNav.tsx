import { cn } from '@/lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  ShieldCheck, MapPin, Clock, ClipboardList, LayoutDashboard, Users, GraduationCap
} from 'lucide-react'

const bottomItems = [
  { label: 'Students', icon: Users, path: '/students' },
  { label: 'Cohorts', icon: GraduationCap, path: '/cohorts' },
  { label: 'Compliance', icon: ShieldCheck, path: '/compliance' },
  { label: 'Placements', icon: MapPin, path: '/placements' },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="cb-bottom-nav safe-bottom">
      {bottomItems.map((item) => {
        const isActive = location.pathname === item.path
        const Icon = item.icon
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'cb-bottom-nav-item',
              isActive && 'cb-bottom-nav-item-active'
            )}
          >
            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}