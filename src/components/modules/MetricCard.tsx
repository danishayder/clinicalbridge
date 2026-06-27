import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
}

const colorMap = {
  blue: 'text-brand-500',
  green: 'text-success-500',
  amber: 'text-warning-500',
  red: 'text-danger-500',
  purple: 'text-purple-600',
}

export function MetricCard({ label, value, sub, color = 'blue' }: MetricCardProps) {
  return (
    <div className="cb-metric">
      <div className="cb-metric-label">{label}</div>
      <div className={cn('cb-metric-value', colorMap[color])}>{value}</div>
      {sub && <div className="cb-metric-sub">{sub}</div>}
    </div>
  )
}
