import { useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns'
import { cn } from '../../lib/utils'
import { useClickOutside } from '../../hooks/useClickOutside'

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
]

const YEARS = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - 50 + i)

export interface AppDatePickerProps {
    value: string | undefined
    onChange: (date: string) => void
    placeholder?: string
    className?: string
    error?: string
    disabled?: boolean
    minDate?: string
    maxDate?: string
    type?: 'date' | 'datetime-local'
}

export function AppDatePicker({
    value,
    onChange,
    placeholder = 'Select date...',
    className,
    error,
    disabled,
    minDate,
    maxDate,
    type = 'date'
}: AppDatePickerProps) {
    const [open, setOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(() =>
        value ? new Date(value) : new Date()
    )

    const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))

    const selectedDate = value ? new Date(value) : undefined

    const handleDayClick = (day: Date) => {
        let formatted = format(day, 'yyyy-MM-dd')

        if (type === 'datetime-local') {
            const existingTime =
                value && value.includes('T')
                    ? value.split('T')[1]
                    : format(new Date(), 'HH:mm')

            formatted = `${formatted}T${existingTime}`
        }

        onChange(formatted)
    }

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate
    })

    const base =
        'w-full bg-surface text-fg border rounded-[var(--rad-input)] px-3.5 transition-colors h-12 md:h-11 flex items-center gap-2 text-sm'

    const stateClasses = error
        ? 'border-danger ring-1 ring-danger/20'
        : open
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-line hover:border-line-strong'

    const disabledClasses = disabled
        ? 'opacity-60 cursor-not-allowed bg-surface2'
        : 'cursor-pointer'

    const displayFormat =
        type === 'datetime-local'
            ? 'MMM d, yyyy h:mm a'
            : 'MMM d, yyyy'

    const hours =
        value?.includes('T')
            ? value.split('T')[1].split(':')[0]
            : '00'

    const minutes =
        value?.includes('T')
            ? value.split('T')[1].split(':')[1]
            : '00'

    return (
        <div className={cn('relative w-full', className)} ref={ref}>
            <div
                className={cn(base, stateClasses, disabledClasses)}
                onClick={() => !disabled && setOpen(!open)}
            >
                <CalendarIcon size={16} className="text-muted shrink-0" />

                <span
                    className={cn(
                        'truncate flex-1 text-left',
                        !selectedDate && 'text-subtle'
                    )}
                >
                    {selectedDate && !isNaN(selectedDate.getTime())
                        ? format(selectedDate, displayFormat)
                        : placeholder}
                </span>
            </div>

            {open && !disabled && (
                <div className="absolute z-50 mt-1 w-[360px] rounded-[var(--rad-card)] border border-line bg-card p-3 shadow-pop overflow-hidden animate-fade-in">
                    <div className="mb-3 flex items-center justify-between">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="rounded p-1 text-muted transition-colors hover:bg-surface2"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-2">
                            <select
                                value={currentMonth.getMonth()}
                                onChange={(e) =>
                                    setCurrentMonth(
                                        new Date(
                                            currentMonth.getFullYear(),
                                            Number(e.target.value),
                                            1
                                        )
                                    )
                                }
                                className="h-8 rounded-md border border-line bg-surface px-2 text-xs outline-none focus:border-primary"
                            >
                                {MONTHS.map((month, index) => (
                                    <option key={month} value={index}>
                                        {month}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={currentMonth.getFullYear()}
                                onChange={(e) =>
                                    setCurrentMonth(
                                        new Date(
                                            Number(e.target.value),
                                            currentMonth.getMonth(),
                                            1
                                        )
                                    )
                                }
                                className="h-8 rounded-md border border-line bg-surface px-2 text-xs outline-none focus:border-primary"
                            >
                                {YEARS.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="rounded p-1 text-muted transition-colors hover:bg-surface2"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="mb-2 grid grid-cols-7 gap-1 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                            <span
                                key={d}
                                className="text-[11px] font-bold uppercase text-muted"
                            >
                                {d}
                            </span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                            const isSelected =
                                selectedDate && isSameDay(day, selectedDate)

                            const isCurrentMonth = isSameMonth(day, currentMonth)

                            const isTodayDate = isToday(day)

                            const dayString = format(day, 'yyyy-MM-dd')
                            const isDisabled =
                                (minDate && dayString < minDate.split('T')[0]) ||
                                (maxDate && dayString > maxDate.split('T')[0])

                            return (
                                <button
                                    key={i}
                                    disabled={Boolean(isDisabled)}
                                    onClick={() => handleDayClick(day)}
                                    className={cn(
                                        'h-9 w-9 rounded-full flex items-center justify-center text-[13px] transition-colors',
                                        !isCurrentMonth && 'text-subtle opacity-50',
                                        isCurrentMonth &&
                                        !isSelected &&
                                        'hover:bg-surface2 text-fg',
                                        isSelected &&
                                        'bg-primary text-primary-fg font-bold shadow-soft',
                                        isTodayDate &&
                                        !isSelected &&
                                        'border border-primary text-primary font-bold',
                                        isDisabled &&
                                        'pointer-events-none opacity-30'
                                    )}
                                >
                                    {format(day, 'd')}
                                </button>
                            )
                        })}
                    </div>

                    {type === 'datetime-local' && selectedDate && (
                        <div className="mt-4 border-t border-line pt-3">
                            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                                Time
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={hours}
                                    onChange={(e) => {
                                        if (!value) return
                                        const datePart = value.split('T')[0]
                                        onChange(`${datePart}T${e.target.value}:${minutes}`)
                                    }}
                                    className="h-9 flex-1 rounded-md border border-line bg-surface px-2 text-sm outline-none focus:border-primary"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option
                                            key={i}
                                            value={i.toString().padStart(2, '0')}
                                        >
                                            {i.toString().padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>

                                <span className="font-semibold text-muted">:</span>

                                <select
                                    value={minutes}
                                    onChange={(e) => {
                                        if (!value) return
                                        const datePart = value.split('T')[0]
                                        onChange(`${datePart}T${hours}:${e.target.value}`)
                                    }}
                                    className="h-9 flex-1 rounded-md border border-line bg-surface px-2 text-sm outline-none focus:border-primary"
                                >
                                    {Array.from({ length: 60 }, (_, i) => (
                                        <option
                                            key={i}
                                            value={i.toString().padStart(2, '0')}
                                        >
                                            {i.toString().padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date()

                                const formatted =
                                    type === 'datetime-local'
                                        ? format(now, "yyyy-MM-dd'T'HH:mm")
                                        : format(now, 'yyyy-MM-dd')

                                onChange(formatted)
                                setCurrentMonth(now)
                                setOpen(false)
                            }}
                            className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
                        >
                            Today
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                onChange('')
                                setOpen(false)
                            }}
                            className="text-sm font-medium text-danger transition-opacity hover:opacity-80"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
