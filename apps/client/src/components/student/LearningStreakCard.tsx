import { useQuery } from '@tanstack/react-query'
import { motion, type Variants } from 'framer-motion'
import { Flame, Calendar, Trophy, Activity, Check, X } from 'lucide-react'
import { getMyStreak, getStreakHistory, type StreakDay, type StreakStats } from '../../services/streak.service'

const ITEM_VAR: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function LearningStreakCard({ stats: initialStats, history: initialHistory }: { stats?: StreakStats | null; history?: StreakDay[] }) {
  const { data: stats } = useQuery({ queryKey: ['my-streak'], queryFn: getMyStreak, initialData: initialStats || undefined })
  const { data: history } = useQuery({ queryKey: ['streak-history'], queryFn: getStreakHistory, initialData: initialHistory })

  if (!stats || !history) return null

  // Helper to format date to short weekday (M, T, W)
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).charAt(0)
  }

  return (
    <motion.div variants={ITEM_VAR} className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Current Streak Hero */}
      <div 
        className="col-span-1 lg:col-span-1 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-orange-500/10 text-orange-500">
          <Flame size={32} strokeWidth={2.5} />
        </div>
        
        <h2 className="text-4xl font-extrabold mb-2" style={{ color: 'var(--fg)' }}>
          {stats.current} <span className="text-2xl">Days</span>
        </h2>
        <p className="text-sm font-medium" style={{ color: 'var(--fg-muted)' }}>
          Current Learning Streak
        </p>
        <p className="text-xs mt-4 max-w-[200px]" style={{ color: 'var(--fg-subtle)' }}>
          Keep learning every day to maintain your streak!
        </p>
      </div>

      {/* Stats & Calendar */}
      <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
        {/* Statistics Row */}
        <div className="grid grid-cols-3 gap-4 h-full">
          <div className="rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-orange-500 to-transparent opacity-50" />
            <div className="flex items-center gap-2 mb-3 text-orange-500">
              <Flame size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Current</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{stats.current} <span className="text-sm font-medium text-muted">Days</span></p>
          </div>

          <div className="rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-primary to-transparent opacity-50" />
            <div className="flex items-center gap-2 mb-3 text-primary">
              <Trophy size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Longest</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{stats.longest} <span className="text-sm font-medium text-muted">Days</span></p>
          </div>

          <div className="rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-green-500 to-transparent opacity-50" />
            <div className="flex items-center gap-2 mb-3 text-green-500">
              <Activity size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Active</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{stats.activeDays} <span className="text-sm font-medium text-muted">Days</span></p>
          </div>
        </div>

        {/* 7-Day Calendar */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-muted" />
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--fg)' }}>Last 7 Days</h3>
          </div>
          <div className="flex items-center justify-between gap-2 max-w-md">
            {history.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold uppercase" style={{ color: 'var(--fg-subtle)' }}>
                  {getDayLabel(day.date)}
                </span>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors`}
                  style={{ 
                    background: day.active ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                    color: day.active ? 'var(--primary)' : 'var(--fg-subtle)',
                    border: day.active ? '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' : '1px solid var(--border)'
                  }}
                >
                  {day.active ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={2} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
