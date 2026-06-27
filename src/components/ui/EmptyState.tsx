import { cn } from '@/lib/utils'
import { FileX } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title = 'No items found',
  description = 'There are no items to display at this time.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('cb-empty', className)}>
      <div className="cb-empty-icon">
        {icon || <FileX className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-xs text-surface-500 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  )
}
