import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Role } from '@veolms/shared'
import { PageLoader } from '../ui/Spinner'

export function ProtectedRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const user = useAuthStore((s) => s.user)
  const authChecked = useAuthStore((s) => s.authChecked)
  if (!authChecked) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}
