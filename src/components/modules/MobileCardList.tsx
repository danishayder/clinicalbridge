interface MobileCardListProps {
  children: React.ReactNode
}

export function MobileCardList({ children }: MobileCardListProps) {
  return (
    <div className="space-y-2">
      {children}
    </div>
  )
}
