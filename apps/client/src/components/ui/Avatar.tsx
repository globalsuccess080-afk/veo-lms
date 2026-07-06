import { cn } from '../../lib/utils'

export function Avatar({ name, src, size = 36, className }: { name?: string; src?: string | null; size?: number; className?: string }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (src) {
    return <img src={src} alt={name} width={size} height={size} className={cn('rounded-full object-cover', className)} style={{ width: size, height: size }} />
  }

  return (
    <div
      className={cn('rounded-full bg-primary-subtle text-primary grid place-items-center font-semibold', className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  )
}
