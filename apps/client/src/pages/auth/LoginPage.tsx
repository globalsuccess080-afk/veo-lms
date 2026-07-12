import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowRight, GraduationCap } from 'lucide-react'
import { login } from '../../services/auth.service'
import { useAuthStore } from '../../store/authStore'
import { AuthShell } from '../../components/auth/AuthShell'
import { queryClient } from '../../lib/queryClient'

interface FormErrors { email?: string; password?: string }

function validate(email: string, password: string): FormErrors {
  const errs: FormErrors = {}
  if (!email.trim()) errs.email = 'Email address is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address'
  if (!password) errs.password = 'Password is required'
  return errs
}

const inputBase = [
  'h-11 w-full rounded-xl border px-4 text-[14px] font-medium outline-none transition-all focus:ring-2',
  '[background:var(--surface)] [color:var(--fg)] [border-color:var(--border)]',
  'placeholder:[color:var(--fg-subtle)]',
  'hover:[border-color:color-mix(in_srgb,var(--primary)_40%,var(--border))] focus:[border-color:color-mix(in_srgb,var(--primary)_60%,transparent)] focus:ring-primary/15',
].join(' ')
const inputError = [
  'h-11 w-full rounded-xl border px-4 text-[14px] font-medium outline-none transition-all focus:ring-2',
  '[background:color-mix(in_srgb,var(--danger)_5%,var(--surface))] [color:var(--fg)]',
  'placeholder:[color:var(--fg-subtle)]',
  'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10',
].join(' ')

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 text-[12px] font-semibold text-red-400 flex items-center gap-1.5">
      <span className="w-3.5 h-3.5 rounded-full border border-red-400/80 inline-flex items-center justify-center text-[8px] font-black shrink-0">!</span>
      {msg}
    </p>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState({ email: false, password: false })

  const touch = (field: keyof typeof touched, next = { email, password }) => {
    setTouched((p) => ({ ...p, [field]: true }))
    setErrors(validate(next.email, next.password))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    const errs = validate(email, password)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    try {
      const result = await login(email, password)
      setAuth(result.user, result.accessToken)
      queryClient.removeQueries()
      toast.success('Welcome back!')
      const searchParams = new URLSearchParams(location.search)
      const redirect = searchParams.get('redirect')
      navigate(redirect || '/dashboard', { replace: true })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || 'The email or password you entered is incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your learning journey"
      badge="Secure login"
      footer={<>Don't have an account? <Link to={`/register${location.search}`} className="text-primary font-bold hover:text-primary-hover ml-1">Sign up free</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (touched.email) touch('email', { email: e.target.value, password }) }}
            onBlur={() => touch('email')}
            placeholder="you@example.com"
            className={errors.email && touched.email ? `${inputError} pr-4` : `${inputBase} pr-4`}
          />
          <FieldError msg={touched.email ? errors.email : undefined} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>Password</label>
            <Link to="/forgot-password" className="text-[11px] font-semibold text-primary/80 hover:text-primary transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (touched.password) touch('password', { email, password: e.target.value }) }}
              onBlur={() => touch('password')}
              placeholder="••••••••"
              className={`${errors.password && touched.password ? inputError : inputBase} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
              style={{ color: 'var(--fg-subtle)' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <FieldError msg={touched.password ? errors.password : undefined} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-bold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {loading
            ? <><span className="h-4 w-4 rounded-full border-2 border-primary-fg/30 border-t-primary-fg animate-spin" /> Signing in…</>
            : <><span>Sign in to VeoLMS</span><ArrowRight size={16} strokeWidth={2.5} /></>
          }
        </button>
      </form>

      <div className="mt-5 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: 'var(--fg-subtle)' }}>Demo Account</p>
        <p className="text-[12px] font-mono" style={{ color: 'var(--fg-muted)' }}>
          student@veolms.com <span className="mx-1" style={{ color: 'var(--border)' }}>·</span> Student@123456
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link to="/admin/login" className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors" style={{ color: 'var(--fg-subtle)' }}>
          <GraduationCap size={13} /> Admin portal
        </Link>
      </div>
    </AuthShell>
  )
}
