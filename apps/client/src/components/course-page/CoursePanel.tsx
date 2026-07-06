import type { ReactNode } from 'react'

interface CoursePanelProps {
  children: ReactNode
  className?: string
  index?: number
  glow?: 'top-right' | 'top-left' | 'bottom-right' | 'none'
}

const glowPos: Record<string, string> = {
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  none: ''
}

const glowAt: Record<string, string> = {
  'top-right': 'top right',
  'top-left': 'top left',
  'bottom-right': 'bottom right',
  none: 'center'
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-8 shrink-0" style={{ background: 'var(--primary)' }} />
      <span
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--primary)' }}
      >
        {children}
      </span>
    </div>
  )
}

export function CoursePanel({ children, className = '', index, glow = 'top-right' }: CoursePanelProps) {
  return (
    <div className={`bg-card/80 backdrop-blur-xl relative overflow-hidden rounded-[var(--rad-card)] ${className}`}>
      {glow !== 'none' && (
        <div
          className={`bg-[radial-gradient(ellipse_at_var(--cp-glow-x),var(--primary),transparent_68%)] opacity-10 absolute w-72 h-56 pointer-events-none ${glowPos[glow]}`}
          style={{ '--cp-glow-x': glowAt[glow] } as React.CSSProperties}
        />
      )}

      {index !== undefined && (
        <span
          className="absolute top-5 right-6 font-extrabold tabular-nums pointer-events-none select-none"
          style={{
            fontSize: '4.5rem',
            lineHeight: 1,
            color: 'color-mix(in srgb, var(--fg) 5%, transparent)',
            letterSpacing: '-0.04em'
          }}
        >
          {String(index).padStart(2, '0')}
        </span>
      )}

      <div
        className="absolute top-0 left-8 right-8 h-px pointer-events-none opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 35%, transparent) 40%, color-mix(in srgb, var(--primary) 35%, transparent) 60%, transparent)`
        }}
      />

      <div className="relative p-6 sm:p-7">{children}</div>
    </div>
  )
}
