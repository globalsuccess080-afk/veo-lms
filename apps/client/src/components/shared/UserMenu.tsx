import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, User, LogOut, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { logout } from '../../services/auth.service'
import { useClickOutside } from '../../hooks/useClickOutside'
import { Avatar } from '../ui/Avatar'

export function UserMenu() {
  const { user, logout: clearAuth } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = async () => {
    try { await logout() } catch {}
    clearAuth()
    navigate('/')
  }

  const items =
    user.role === 'admin'
      ? [{ to: '/admin', icon: LayoutDashboard, label: 'Admin Panel' }]
      : [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/my-courses', icon: BookOpen, label: 'My Courses' },
          { to: '/profile', icon: User, label: 'Profile' }
        ]

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-btn p-1 pr-2 hover:bg-surface2 transition-colors">
        <Avatar name={user.name} src={user.avatar} size={32} />
        <ChevronDown size={15} className="text-subtle" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-line rounded-card shadow-pop z-50 animate-fade-in overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-subtle truncate">{user.email}</p>
          </div>
          <div className="p-1.5">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted hover:bg-surface2 hover:text-fg transition-colors"
              >
                <item.icon size={16} /> {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
