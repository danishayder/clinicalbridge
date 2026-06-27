interface ActivityItem {
  time: string
  who: string
  action: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 py-2 border-b border-surface-200 last:border-0 text-sm">
          <span className="text-surface-500 font-mono text-xs w-[70px] flex-shrink-0">{item.time}</span>
          <span className="text-surface-700 font-medium w-[100px] flex-shrink-0 hidden sm:block">{item.who}</span>
          <span className="text-surface-900 flex-1">{item.action}</span>
        </div>
      ))}
    </div>
  )
}
