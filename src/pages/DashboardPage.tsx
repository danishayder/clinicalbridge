import { useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MetricCard } from '@/components/modules/MetricCard'
import { ActivityFeed } from '@/components/modules/ActivityFeed'
import { useToast } from '@/hooks/useToast'
import { useDashboardStats, useRecentActivity, useActionItems } from '@/hooks/data'
import { Loader2 } from 'lucide-react'

export function DashboardPage() {
  const { toast } = useToast()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity(10)
  const { data: actionItems, isLoading: itemsLoading } = useActionItems()

  useEffect(() => {
    toast('Welcome to Clinical Bridge — Program Dashboard loaded', 'info')
  }, [])

  const metrics = stats ? [
    { label: 'Students', value: String(stats.students), sub: 'Active this block', color: 'blue' as const },
    { label: 'Cleared', value: String(stats.cleared), sub: 'Ready for placement', color: 'green' as const },
    { label: 'Placements', value: String(stats.placements), sub: 'Confirmed', color: 'blue' as const },
    { label: 'Evaluations', value: String(stats.pendingEvaluations), sub: 'Pending signature', color: 'amber' as const },
    { label: 'Accreditation', value: `${stats.accreditationPct}%`, sub: 'Standards mapped', color: 'purple' as const },
  ] : [
    { label: 'Students', value: '0', sub: 'Active this block', color: 'blue' as const },
    { label: 'Cleared', value: '0', sub: 'Ready for placement', color: 'green' as const },
    { label: 'Placements', value: '0', sub: 'Confirmed', color: 'blue' as const },
    { label: 'Evaluations', value: '0', sub: 'Pending signature', color: 'amber' as const },
    { label: 'Accreditation', value: '0%', sub: 'Standards mapped', color: 'purple' as const },
  ]

  const formatActivity = (log: any) => ({
    time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    who: log.created_by ? 'User' : 'System',
    action: `${log.action} on ${log.entity_type}`,
  })

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Activity & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          header={<span className="text-sm font-semibold text-surface-900">Recent Activity</span>}
        >
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
            </div>
          ) : activities && activities.length > 0 ? (
            <ActivityFeed items={activities.map(formatActivity)} />
          ) : (
            <div className="text-center py-8 text-surface-500 text-sm">
              No recent activity. Actions you take will appear here.
            </div>
          )}
        </Card>

        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-semibold text-surface-900">Action Items</span>
              <Badge variant="red">{actionItems?.filter(i => i.severity === 'danger').length || 0} urgent</Badge>
            </div>
          }
        >
          {itemsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
            </div>
          ) : actionItems && actionItems.length > 0 ? (
            <div className="space-y-1">
              {actionItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 py-2 border-b border-surface-200 last:border-0"
                >
                  <span className={cn(
                    'flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
                    item.severity === 'danger' ? 'bg-danger-500' : 'bg-warning-500'
                  )}>
                    !
                  </span>
                  <span className="text-sm text-surface-700">{item.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-surface-500 text-sm">
              No action items. Everything looks good!
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

import { cn } from '@/lib/utils'