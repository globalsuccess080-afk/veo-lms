import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { ThemeSwitcher } from '../shared/ThemeSwitcher'
import { NotificationBell } from '../shared/NotificationBell'
import { UserMenu } from '../shared/UserMenu'
import { buttonClass } from '../ui/Button'

export function Navbar() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="sticky top-0 z-50 flex justify-center w-full">
      <motion.header
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="w-full relative bg-transparent"
      >
        <div className="absolute inset-x-0 top-0 h-[1.5px] pointer-events-none" style={{
            background: `linear-gradient(90deg, transparent 10%, color-mix(in srgb, var(--primary) 60%, transparent) 50%, transparent 90%)`,
        }} />

        <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse 60% 80% at 50% -20%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 60%)`,
        }} />

        <div className="relative max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 rounded-lg bg-white grid place-items-center shadow-soft overflow-hidden"
              >
                <img src="/logo.png" alt="VeoLMS" className="w-full h-full object-contain" />
              </motion.div>
              <span className="font-bold tracking-tight text-fg group-hover:text-primary transition-colors">VeoLMS</span>
            </Link>

            <nav className="hidden md:flex items-center gap-2 ml-4">
              {!user ? (
                <>
                  <NavLink to="/search" className={({ isActive }) => `relative group px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${isActive ? 'text-fg' : 'text-muted hover:text-fg'}`}>
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10 transition-colors duration-200">Courses</span>
                        <span
                          className={`absolute -bottom-1 left-0 h-[2px] transition-all duration-300 rounded-full bg-gradient-to-r from-primary to-transparent ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                        />
                      </>
                    )}
                  </NavLink>
                  <NavLink to="/contact" className={({ isActive }) => `relative group px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${isActive ? 'text-fg' : 'text-muted hover:text-fg'}`}>
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10 transition-colors duration-200">Contact</span>
                        <span
                          className={`absolute -bottom-1 left-0 h-[2px] transition-all duration-300 rounded-full bg-gradient-to-r from-primary to-transparent ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                        />
                      </>
                    )}
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/dashboard" className={({ isActive }) => `relative group px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${isActive ? 'text-fg' : 'text-muted hover:text-fg'}`}>
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10 transition-colors duration-200">My Courses</span>
                        <span
                          className={`absolute -bottom-1 left-0 h-[2px] transition-all duration-300 rounded-full bg-gradient-to-r from-primary to-transparent ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                        />
                      </>
                    )}
                  </NavLink>
                  <NavLink to="/search" className={({ isActive }) => `relative group px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${isActive ? 'text-fg' : 'text-muted hover:text-fg'}`}>
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10 transition-colors duration-200">Courses</span>
                        <span
                          className={`absolute -bottom-1 left-0 h-[2px] transition-all duration-300 rounded-full bg-gradient-to-r from-primary to-transparent ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                        />
                      </>
                    )}
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {!user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-line/50">
                <Link to="/login" className={buttonClass('ghost', 'sm') + " font-semibold text-sm"}>Log in</Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-3 border-l border-line/50">
                <NotificationBell />
                <UserMenu />
              </div>
            )}
          </div>
        </div>
      </motion.header>
    </div>
  )
}
