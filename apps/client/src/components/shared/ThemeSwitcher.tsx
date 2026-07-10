import { useState } from 'react'
import { Palette, Check, Circle, Square, Monitor, Sun, Moon, X } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { MODE_OPTIONS, ACCENT_OPTIONS } from '../../lib/constants'
import { useClickOutside } from '../../hooks/useClickOutside'
import { cn } from '../../lib/utils'

const MODE_ICONS: Record<string, React.ElementType> = {
    light: Sun,
    dark: Moon,
    system: Monitor,
}

export function ThemeSwitcher() {
    const [open, setOpen] = useState(false)
    const { mode, accent, radiusVariant, setMode, setAccent, setRadiusVariant } = useThemeStore()
    const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))

    const activeAccent = ACCENT_OPTIONS.find((a) => a.id === accent)

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'h-9 w-9 grid place-items-center rounded-xl transition-all duration-200',
                    'text-muted hover:text-fg',
                    open ? 'bg-surface2 text-fg shadow-inner' : 'hover:bg-surface2'
                )}
                aria-label="Customize theme"
            >
                <Palette size={17} strokeWidth={1.8} />
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        className="fixed left-3 right-3 top-[82px] z-50 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2.5 sm:w-[280px]"
                        style={{
                            filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.18)) drop-shadow(0 2px 8px rgba(0,0,0,0.12))',
                        }}
                    >
                        <div className="bg-card border border-line rounded-2xl overflow-hidden max-h-[calc(100dvh-96px)] overflow-y-auto">

                            <div className="flex items-start justify-between px-4 pt-4 pb-3">
                                <div>
                                    <p className="font-semibold text-[13px] text-fg tracking-tight">Appearance</p>
                                    <p className="text-[11px] text-subtle mt-0.5">Customize your interface</p>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="h-6 w-6 grid place-items-center rounded-lg text-muted hover:text-fg hover:bg-surface2 transition-colors mt-0.5 flex-shrink-0"
                                    aria-label="Close"
                                >
                                    <X size={13} strokeWidth={2.2} />
                                </button>
                            </div>

                            <div className="px-3 pb-3">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle px-1 mb-2">Mode</p>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {MODE_OPTIONS.map((m) => {
                                        const active = mode === m.id
                                        const Icon = MODE_ICONS[m.id] ?? m.icon
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => setMode(m.id)}
                                                className={cn(
                                                    'relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all duration-150',
                                                    active
                                                        ? 'bg-primary text-white shadow-sm'
                                                        : 'bg-surface2/60 text-muted hover:bg-surface2 hover:text-fg'
                                                )}
                                            >
                                                <Icon
                                                    size={16}
                                                    strokeWidth={active ? 2.2 : 1.8}
                                                    className={active ? 'text-white' : ''}
                                                />
                                                <span className="leading-none">{m.label}</span>
                                                {active && (
                                                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-white/60" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="h-px bg-line mx-3" />

                            <div className="px-3 py-3">
                                <div className="flex items-center justify-between px-1 mb-2.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">Accent</p>
                                    {activeAccent && (
                                        <span className="text-[11px] text-subtle font-medium">{activeAccent.label}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 px-1">
                                    {ACCENT_OPTIONS.map((a) => {
                                        const active = accent === a.id
                                        return (
                                            <button
                                                key={a.id}
                                                onClick={() => setAccent(a.id)}
                                                title={a.label}
                                                aria-label={a.label}
                                                className={cn(
                                                    'relative h-7 w-7 rounded-full grid place-items-center transition-all duration-150',
                                                    'hover:scale-110 active:scale-95',
                                                    active && 'scale-110'
                                                )}
                                                style={{
                                                    background: a.color,
                                                    boxShadow: active
                                                        ? `0 0 0 2px var(--color-card), 0 0 0 3.5px ${a.color}`
                                                        : 'none',
                                                }}
                                            >
                                                {active && (
                                                    <Check size={12} strokeWidth={2.8} className="text-white drop-shadow-sm" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="h-px bg-line mx-3" />

                            <div className="px-3 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle px-1 mb-2">Corners</p>
                                <div className="grid grid-cols-2 gap-1.5 px-1">
                                    {[
                                        { id: 'round', label: 'Rounded', Icon: Circle },
                                        { id: 'sharp', label: 'Sharp', Icon: Square },
                                    ].map(({ id, label, Icon }) => {
                                        const active = radiusVariant === id
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => setRadiusVariant(id as 'round' | 'sharp')}
                                                className={cn(
                                                    'flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-medium transition-all duration-150',
                                                    active
                                                        ? 'bg-primary/10 text-primary border border-primary/30'
                                                        : 'bg-surface2/60 text-muted hover:bg-surface2 hover:text-fg border border-transparent'
                                                )}
                                            >
                                                <Icon
                                                    size={13}
                                                    strokeWidth={active ? 2.2 : 1.8}
                                                    className={active ? 'text-primary' : ''}
                                                />
                                                {label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
