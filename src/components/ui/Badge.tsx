import { cn } from '@/lib/utils'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'purple'
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  const variants = {
    blue: 'cb-badge-blue',
    green: 'cb-badge-green',
    amber: 'cb-badge-amber',
    red: 'cb-badge-red',
    gray: 'cb-badge-gray',
    purple: 'bg-purple-50 text-purple-700',
  }

  return (
    <span className={cn('cb-badge', variants[variant], className)}>
      {children}
    </span>
  )
}
