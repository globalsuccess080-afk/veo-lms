import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { forgotPassword, resetPassword } from '../../services/auth.service'
import { AuthShell } from '../../components/auth/AuthShell'

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

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  
  // Form fields
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Validation
  const [errors, setErrors] = useState<{ email?: string; otp?: string; password?: string }>({})

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Enter a valid email address' })
      return
    }
    
    setErrors({})
    setLoading(true)
    
    try {
      await forgotPassword(email)
      toast.success('OTP sent to your email')
      setStep(2)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errs: any = {}
    if (otp.length !== 6) errs.otp = 'OTP must be 6 digits'
    if (newPassword.length < 6) errs.password = 'Password must be at least 6 characters'
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    
    setErrors({})
    setLoading(true)
    
    try {
      await resetPassword(email, otp, newPassword)
      toast.success('Password reset successfully! Please log in.')
      navigate('/login', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={step === 1 ? 'Reset password' : 'Set new password'}
      subtitle={step === 1 ? "Enter your email to receive a reset OTP" : "Enter the OTP sent to your email and your new password"}
      badge="Account recovery"
      footer={<>Remember your password? <Link to="/login" className="text-primary font-bold hover:text-primary-hover ml-1">Sign in</Link></>}
    >
      {step === 1 ? (
        <form onSubmit={handleSendOtp} noValidate className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>
              Email address
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
              placeholder="you@example.com"
              className={errors.email ? `${inputError} pr-4` : `${inputBase} pr-4`}
            />
            <FieldError msg={errors.email} />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-bold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading
              ? <><span className="h-4 w-4 rounded-full border-2 border-primary-fg/30 border-t-primary-fg animate-spin" /> Sending OTP…</>
              : <><span>Send Reset OTP</span><ArrowRight size={16} strokeWidth={2.5} /></>
            }
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} noValidate className="space-y-4">
          <div>
            <label htmlFor="reset-otp" className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>
              6-Digit OTP
            </label>
            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setErrors((p) => ({...p, otp: undefined})) }}
              placeholder="000000"
              className={`${errors.otp ? inputError : inputBase} text-center tracking-[0.5em] text-lg`}
            />
            <FieldError msg={errors.otp} />
          </div>

          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({...p, password: undefined})) }}
                placeholder="••••••••"
                className={`${errors.password ? inputError : inputBase} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                style={{ color: 'var(--fg-subtle)' }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <FieldError msg={errors.password} />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6 || newPassword.length < 6}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-bold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading
              ? <><span className="h-4 w-4 rounded-full border-2 border-primary-fg/30 border-t-primary-fg animate-spin" /> Resetting…</>
              : <><span>Reset Password</span><ShieldCheck size={16} strokeWidth={2.5} /></>
            }
          </button>
        </form>
      )}
    </AuthShell>
  )
}
