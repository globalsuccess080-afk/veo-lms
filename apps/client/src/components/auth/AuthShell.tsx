import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Zap, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { ThemeSwitcher } from '../shared/ThemeSwitcher'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
  highlight?: string
  badge?: string
}

const FEATURES = [
  { icon: BookOpen, title: 'Rich Course Library', text: 'Hundreds of lessons across every skill level' },
  { icon: Users, title: 'Community Learning', text: 'Learn alongside thousands of active students' },
  { icon: Zap, title: 'Track Progress', text: 'Built-in progress tracking and certificates' },
]

export function AuthShell({ title, subtitle, children, footer, highlight, badge }: AuthShellProps) {
  return (
    <div className="h-screen overflow-hidden flex" style={{ background: 'var(--bg)' }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.18] dark:opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.12] dark:opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
        <div className="absolute top-[35%] left-[45%] w-[360px] h-[220px] rounded-full opacity-[0.08] dark:opacity-[0.05] rotate-[-20deg]"
          style={{ background: 'radial-gradient(ellipse, var(--primary) 0%, transparent 75%)' }} />

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <circle cx="200" cy="200" r="350" fill="none" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.12" />
          <circle cx="200" cy="200" r="550" fill="none" stroke="var(--primary)" strokeWidth="0.6" strokeOpacity="0.07" />
          <circle cx="1240" cy="700" r="300" fill="none" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.12" />
          <circle cx="1240" cy="700" r="480" fill="none" stroke="var(--primary)" strokeWidth="0.6" strokeOpacity="0.07" />
        </svg>
      </div>

      <aside className="hidden lg:flex lg:w-1/2 relative">
        <div className="relative z-10 flex flex-col justify-between w-full px-12 xl:px-16 py-10 max-w-[560px] ml-auto">
          <Link to="/" className="flex items-center gap-3 w-fit group">
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden"
              style={{ border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' }}
            >
              <img src="/logo.png" alt="VeoLMS" className="w-full h-full object-contain" />
            </motion.div>
            <span className="font-bold text-[1.1rem] tracking-tight transition-colors" style={{ color: 'var(--fg)' }}>VeoLMS</span>
          </Link>

          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-primary" style={{ opacity: 0.7 }}>Learning Platform</p>
              <h2 className="text-[2.2rem] xl:text-[2.6rem] font-extrabold leading-[1.15] tracking-tight mb-4" style={{ color: 'var(--fg)' }}>
                {highlight || 'Learn without limits.'}
              </h2>
              <p className="text-[14px] leading-relaxed mb-8 max-w-[320px]" style={{ color: 'var(--fg-muted)' }}>
                Join thousands of learners mastering their craft with modern, interactive courses.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="space-y-2 mb-10">
              {FEATURES.map(({ icon: Icon, title: t, text }) => (
                <div key={t} className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-primary" style={{ background: 'var(--primary-subtle)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
                    <Icon size={15} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: 'var(--fg)' }}>{t}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--fg-subtle)' }}>{text}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex items-center gap-8 pt-8" style={{ borderTop: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
              {[['4+', 'Courses'], ['40+', 'Lessons'], ['1k+', 'Learners']].map(([v, l]) => (
                <div key={l}>
                  <p className="text-xl font-extrabold tracking-tight text-primary">{v}</p>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--fg-subtle)' }}>{l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-primary" style={{ opacity: 0.6 }}>
            <ShieldCheck size={13} strokeWidth={2.5} />
            Secure, encrypted platform
          </div>
        </div>
      </aside>

      <main className="w-full lg:w-1/2 flex flex-col overflow-y-auto relative z-10">
        <div className="absolute top-5 right-5 z-50">
          <ThemeSwitcher />
        </div>

        <div className="lg:hidden flex items-center px-6 pt-6 pb-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="VeoLMS" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold" style={{ color: 'var(--fg)' }}>VeoLMS</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-12 xl:px-14 py-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="w-full max-w-[380px]"
          >
            {badge && (
              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"
                  style={{ border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', background: 'var(--primary-subtle)' }}>
                  {badge}
                </span>
              </div>
            )}

            <h1 className="text-[1.8rem] font-extrabold mb-1.5 tracking-tight" style={{ color: 'var(--fg)' }}>{title}</h1>
            <p className="text-[14px] mb-7" style={{ color: 'var(--fg-muted)' }}>{subtitle}</p>

            <div className="rounded-2xl shadow-lg overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
              <div className="h-[2px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />
              <div className="p-6">
                {children}
              </div>
            </div>

            {footer && (
              <div className="mt-6 text-center text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
