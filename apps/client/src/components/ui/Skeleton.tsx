import { cn } from '../../lib/utils'


export function Skeleton({ className, style, ...props }: React.ComponentProps<'div'>) {
  return (
    <div 
      className={cn('skeleton rounded-md motion-reduce:animate-none', className)} 
      style={style} 
      aria-busy="true"
      {...props} 
    />
  )
}
