import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: string
}

const colorMap: Record<string, string> = {
  A: 'bg-blue-600', B: 'bg-teal-600', C: 'bg-emerald-600',
  D: 'bg-green-600', E: 'bg-cyan-600', F: 'bg-sky-600',
  G: 'bg-indigo-600', H: 'bg-violet-600', I: 'bg-purple-600',
  J: 'bg-fuchsia-600', K: 'bg-pink-600', L: 'bg-rose-600',
  M: 'bg-red-600', N: 'bg-orange-600', O: 'bg-amber-600',
  P: 'bg-yellow-600', Q: 'bg-lime-600', R: 'bg-brand-600',
  S: 'bg-blue-700', T: 'bg-teal-700', U: 'bg-emerald-700',
  V: 'bg-green-700', W: 'bg-cyan-700', X: 'bg-sky-700',
  Y: 'bg-indigo-700', Z: 'bg-violet-700',
}

export function Avatar({ name, size = 'md', className, color }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const firstLetter = initials[0] || 'A'
  const bgColor = color || colorMap[firstLetter] || 'bg-brand-500'

  const sizes = {
    sm: 'cb-avatar-sm',
    md: 'cb-avatar-md',
    lg: 'cb-avatar-lg',
  }

  return (
    <span className={cn('cb-avatar', sizes[size], bgColor, className)}>
      {initials}
    </span>
  )
}
