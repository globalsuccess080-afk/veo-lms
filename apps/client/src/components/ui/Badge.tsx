import { cn } from '../../lib/utils'

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

const tones: Record<Tone, string> = {
  primary: 'bg-primary-subtle text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  neutral: 'bg-surface2 text-muted'
}

export function Badge({ tone = 'neutral', className, ...props }: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}
      {...props}
    />
  )
}
