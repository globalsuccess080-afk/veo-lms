import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-line rounded-card',
        interactive && 'transition-colors duration-200 hover:border-line-strong hover:bg-surface2/40',
        className
      )}
      {...props}
    />
  )
}
