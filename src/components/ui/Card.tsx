import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function Card({ children, className, header, footer }: CardProps) {
  return (
    <div className={cn('cb-card', className)}>
      {header && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 bg-surface-50">
          {header}
        </div>
      )}
      <div className={cn('p-4', !header && 'pt-4')}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-surface-200 bg-surface-50">
          {footer}
        </div>
      )}
    </div>
  )
}
