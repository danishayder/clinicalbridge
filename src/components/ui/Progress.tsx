import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  color?: string
  className?: string
  showLabel?: boolean
}

export function Progress({ value, max = 100, color, className, showLabel = false }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const defaultColor = percentage >= 80 ? 'bg-success-500' : percentage >= 50 ? 'bg-brand-500' : 'bg-warning-500'
  const fillColor = color || defaultColor

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="cb-progress flex-1">
        <div
          className={cn('cb-progress-fill', fillColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-surface-500 font-medium tabular-nums">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}
