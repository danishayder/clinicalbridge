import { useIsMobile, useIsDesktop } from '@/hooks/useMediaQuery'
import { Menu, Bell, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
  onSearch?: () => void
  onNew?: () => void
}

export function Header({ title, subtitle, onMenuClick, onSearch, onNew }: HeaderProps) {
  const isMobile = useIsMobile()
  const isDesktop = useIsDesktop()

  return (
    <header className="bg-surface-0 border-b border-surface-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 safe-top">
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-surface-700" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight text-surface-900 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-surface-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onSearch && (
          <Button variant="ghost" size="sm" onClick={onSearch} className="hidden sm:flex">
            <Search className="w-4 h-4" />
            {!isMobile && <span>Search</span>}
          </Button>
        )}
        <button className="relative p-2 hover:bg-surface-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-surface-700" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            5
          </span>
        </button>
        {onNew && isDesktop && (
          <Button variant="primary" size="sm" onClick={onNew} leftIcon={<Plus className="w-4 h-4" />}>
            New
          </Button>
        )}
      </div>
    </header>
  )
}