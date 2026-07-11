import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import { register as registerUser, sendOtp } from '../../services/auth.service'
import { useAuthStore } from '../../store/authStore'
import { AuthShell } from '../../components/auth/AuthShell'

interface FormErrors { name?: string; email?: string; password?: string; otp?: string }

function validateDetails(name: string, email: string): FormErrors {
  const errs: FormErrors = {}
  if (!name.trim()) errs.name = 'Full name is required'
  else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters'
  if (!email.trim()) errs.email = 'Email address is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address'
  return errs
}

function validateVerify(otp: string, password: string): FormErrors {
  const errs: FormErrors = {}
  if (!otp.trim()) errs.otp = 'OTP is required'
  else if (otp.trim().length !== 6) errs.otp = 'OTP must be 6 digits'
  if (!password) errs.password = 'Password is required'
  else if (password.length < 8) errs.password = 'Password must be at least 8 characters'
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

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const s = value.length >= 12 ? 3 : value.length >= 8 ? 2 : 1
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500']
  const labels = ['Weak', 'Good', 'Strong']
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < s ? colors[s - 1] : 'bg-zinc-700'}`} />
        ))}
      </div>
      <span className="text-[10px] font-bold text-zinc-500">{labels[s - 1]}</span>
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState({ name: false, email: false, password: false, otp: false })
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const touchDetails = (field: 'name' | 'email', next = { name, email }) => {
    setTouched((p) => ({ ...p, [field]: true }))
    setErrors(validateDetails(next.name, next.email))
  }

  const touchVerify = (field: 'password' | 'otp', next = { otp, password }) => {
    setTouched((p) => ({ ...p, [field]: true }))
    setErrors(validateVerify(next.otp, next.password))
  }

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setTouched((p) => ({ ...p, name: true, email: true }))
    const errs = validateDetails(name, email)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      await sendOtp(name.trim(), email.trim())
      toast.success('OTP sent to your email!')
      setStep(2)
      setTimeLeft(60) // Allow resend after 60s
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || 'We could not send the OTP. Please check your email address and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched((p) => ({ ...p, otp: true, password: true }))
    const errs = validateVerify(otp, password)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      const result = await registerUser(name.trim(), email.trim(), password, otp.trim())
      setAuth(result.user, result.accessToken)
      toast.success('Account created! Welcome to VeoLMS 🎉')
      const searchParams = new URLSearchParams(location.search)
      const redirect = searchParams.get('redirect')
      navigate(redirect || '/dashboard', { replace: true })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || 'The OTP is incorrect or has expired. Please check the code or request a new OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={step === 1 ? "Create your account" : "Verify Email"}
      subtitle={step === 1 ? "Start learning today — it's free to join" : `Enter the 6-digit code sent to ${email}`}
      highlight="Start your journey today."
      badge="Free to join"
      footer={step === 1 ? <>Already have an account? <Link to={`/login${location.search}`} className="text-primary font-bold hover:text-primary-hover ml-1">Sign in</Link></> : undefined}
    >
      {step === 1 ? (
        <form onSubmit={handleSendOtp} noValidate className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>
              Full name
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (touched.name) touchDetails('name', { name: e.target.value, email }) }}
              onBlur={() => touchDetails('name')}
              placeholder="John Doe"
              className={errors.name && touched.name ? inputError : inputBase}
            />
            <FieldError msg={touched.name ? errors.name : undefined} />
          </div>

          <div>
            <label htmlFor="reg-email" className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>
              Email address
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (touched.email) touchDetails('email', { name, email: e.target.value }) }}
              onBlur={() => touchDetails('email')}
              placeholder="you@example.com"
              className={errors.email && touched.email ? inputError : inputBase}
            />
            <FieldError msg={touched.email ? errors.email : undefined} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-bold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading
              ? <><span className="h-4 w-4 rounded-full border-2 border-primary-fg/30 border-t-primary-fg animate-spin" /> Sending OTP…</>
              : <><span>Send OTP</span><ArrowRight size={16} strokeWidth={2.5} /></>
            }
          </button>

          <p className="text-center text-[11px] pt-1" style={{ color: 'var(--fg-subtle)' }}>
            By signing up you agree to our{' '}
            <span className="font-semibold cursor-pointer transition-colors" style={{ color: 'var(--fg-muted)' }}>Terms of Service</span>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegister} noValidate className="space-y-4">
          <div>
            <label htmlFor="reg-otp" className="mb-1.5 flex justify-between text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>
              <span>6-Digit OTP</span>
              {timeLeft > 0 ? (
                <span className="text-[11px] text-zinc-500">Resend in {timeLeft}s</span>
              ) : (
                <button type="button" onClick={() => handleSendOtp()} className="text-[11px] text-primary hover:underline">
                  Resend OTP
                </button>
              )}
            </label>
            <input
              id="reg-otp"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); if (touched.otp) touchVerify('otp', { otp: e.target.value, password }) }}
              onBlur={() => touchVerify('otp')}
              placeholder="000000"
              className={`${errors.otp && touched.otp ? inputError : inputBase} text-center tracking-[0.5em] font-mono`}
            />
            <FieldError msg={touched.otp ? errors.otp : undefined} />
          </div>

          <div>
            <label htmlFor="reg-password" className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>
              Create Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (touched.password) touchVerify('password', { otp, password: e.target.value }) }}
                onBlur={() => touchVerify('password')}
                placeholder="At least 8 characters"
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
            <PasswordStrength value={password} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-bold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading
              ? <><span className="h-4 w-4 rounded-full border-2 border-primary-fg/30 border-t-primary-fg animate-spin" /> Verifying…</>
              : <><span>Verify & Create Account</span><ArrowRight size={16} strokeWidth={2.5} /></>
            }
          </button>
          
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[12px] font-semibold text-zinc-500 hover:text-zinc-700 flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft size={12} />
              Back to edit email
            </button>
          </div>
        </form>
      )}

      {step === 1 && (
        <div className="mt-5 pt-4 flex items-center justify-center gap-3 text-[10px] font-semibold" style={{ borderTop: '1px solid var(--border)', color: 'var(--fg-subtle)' }}>
          <span>Free forever</span>
          <span className="w-1 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
          <span>No credit card</span>
          <span className="w-1 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
          <span>Cancel anytime</span>
        </div>
      )}
    </AuthShell>
  )
}
