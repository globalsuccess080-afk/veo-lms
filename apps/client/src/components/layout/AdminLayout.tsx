import { useState, useEffect } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Users, GraduationCap, Megaphone, LogOut, ArrowLeft, PanelLeftClose, PanelLeftOpen, Tag, Menu, X, PieChart, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { logout } from '../../services/auth.service'
import { ThemeSwitcher } from '../shared/ThemeSwitcher'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../lib/utils'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/analytics', icon: PieChart, label: 'Analytics' },
  { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/enrollments', icon: GraduationCap, label: 'Enrollments' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { to: '/admin/certificates', icon: Award, label: 'Certificates' }
]

export function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)')
  
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (isTablet) setCollapsed(true)
    else if (!isMobile) setCollapsed(false)
  }, [isTablet, isMobile])

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false)
    }
  }, [location.pathname, isMobile])

  const handleLogout = async () => {
    try { await logout() } catch {}
    clearAuth()
    navigate('/')
  }

  const sidebarWidth = isMobile ? 260 : (collapsed ? 80 : 260)
  const contentMargin = isMobile ? 0 : sidebarWidth

  return (
    <div className="min-h-screen flex bg-canvas overflow-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarWidth,
          x: isMobile ? (mobileOpen ? 0 : -260) : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="shrink-0 border-r border-line/80 bg-surface/90 backdrop-blur-md flex flex-col fixed inset-y-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        <div className={cn("h-[72px] flex items-center border-b border-line/80 transition-all relative", collapsed && !isMobile ? "justify-center px-0" : "px-5 gap-3")}>
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-hover text-primary-fg flex items-center justify-center shadow-soft shrink-0"
            >
              <GraduationCap size={20} strokeWidth={2.2} />
            </motion.div>
            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                >
                  <span className="font-bold text-[1.1rem] tracking-tight">VeoLMS</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-subtle px-1.5 py-0.5 rounded-md">Admin</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="absolute right-4 p-2 text-muted hover:text-fg">
              <X size={20} />
            </button>
          )}
        </div>

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3.5 top-[calc(72px+1rem)] w-7 h-7 rounded-full bg-surface border border-line text-muted hover:text-primary hover:border-primary transition-colors flex items-center justify-center z-50 shadow-sm"
          >
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        )}

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              title={collapsed && !isMobile ? link.label : undefined}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center rounded-xl py-3 text-sm font-semibold transition-all duration-300 group overflow-hidden',
                  collapsed && !isMobile ? 'justify-center px-0' : 'gap-3 px-4',
                  isActive ? 'text-fg bg-primary-subtle' : 'text-muted hover:text-fg hover:bg-surface2'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span 
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary" 
                    />
                  )}
                  <link.icon 
                    size={20} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      'shrink-0 relative z-10 transition-all duration-300',
                      isActive ? 'text-primary scale-110' : 'group-hover:scale-110 group-hover:text-primary'
                    )} 
                  />
                  <AnimatePresence>
                    {(!collapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="relative z-10 whitespace-nowrap"
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={cn("p-4 border-t border-line/80 space-y-2", collapsed && !isMobile ? "px-2" : "px-4")}>
          <Link 
            to="/" 
            title={collapsed && !isMobile ? "Back to site" : undefined}
            className={cn(
              "flex items-center rounded-xl py-2.5 text-sm font-medium text-muted hover:bg-surface2 hover:text-fg transition-all",
              collapsed && !isMobile ? "justify-center px-0" : "gap-3 px-3"
            )}
          >
            <ArrowLeft size={18} className="shrink-0" />
            {(!collapsed || isMobile) && <span className="whitespace-nowrap">Back to site</span>}
          </Link>
          
          <div className={cn("flex items-center gap-3 pt-2", collapsed && !isMobile ? "justify-center" : "px-2")}>
            <Avatar name={user?.name} size={collapsed && !isMobile ? 36 : 32} className="shrink-0 ring-2 ring-transparent hover:ring-primary-subtle transition-all" />
            {(!collapsed || isMobile) && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate text-fg leading-tight">{user?.name}</p>
                <p className="text-[11px] text-muted truncate mt-0.5">{user?.email}</p>
              </div>
            )}
            {(!collapsed || isMobile) && (
              <button onClick={handleLogout} className="text-muted hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-all" title="Logout">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      <motion.div 
        animate={{ marginLeft: contentMargin }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col min-w-0"
      >
        <header className="h-[72px] border-b border-line/80 glass sticky top-0 z-30 flex items-center px-4 lg:px-6 gap-3 shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} className="p-2 text-muted hover:text-fg -ml-2">
              <Menu size={24} />
            </button>
          )}
          <div className="ml-auto flex items-center gap-3">
            <ThemeSwitcher />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-5 lg:p-6 bg-canvas max-w-full overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </motion.div>
    </div>
  )
}
