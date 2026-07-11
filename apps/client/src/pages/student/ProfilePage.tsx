import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { User as UserIcon, Lock, Palette, Check, Award, ExternalLink, Receipt, CreditCard, CalendarDays, ShieldCheck, TrendingUp } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { updateProfile, changePassword } from '../../services/user.service'
import { getMyCertificates, type Certificate } from '../../services/certificate.service'
import { getPaymentHistory, type PaymentHistoryItem } from '../../services/payment.service'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Card } from '../../components/ui/Card'
import { Input, Field } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { MODE_OPTIONS, ACCENT_OPTIONS } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { resolveAssetUrl } from '../../lib/assets'
import { ProfileSkeleton } from '../../components/skeletons/student/ProfileSkeleton'

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVars: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCurrency(value: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function paymentAmount(payment: PaymentHistoryItem) {
  if (Number.isFinite(payment.finalAmount)) return payment.finalAmount
  return Math.round((payment.amount || 0) / 100)
}

function statusClass(status: PaymentHistoryItem['status']) {
  if (status === 'COMPLETED') return 'bg-success/15 text-success border-success/20'
  if (status === 'FAILED' || status === 'REFUNDED') return 'bg-danger/10 text-danger border-danger/20'
  return 'bg-warning/10 text-warning border-warning/20'
}

export function ProfilePage() {
  const { user, setAuth, accessToken } = useAuthStore()
  const { mode, accent, radiusVariant, setMode, setAccent, setRadiusVariant } = useThemeStore()
  const [name, setName] = useState(user?.name || '')
  const [pw, setPw] = useState({ current: '', next: '' })
  const { data: certificates = [] } = useQuery<Certificate[]>({ queryKey: ['my-certificates'], queryFn: getMyCertificates, enabled: !!user })
  const { data: payments = [] } = useQuery<PaymentHistoryItem[]>({ queryKey: ['payment-history'], queryFn: getPaymentHistory, enabled: !!user })

  const profileMut = useMutation({
    mutationFn: () => updateProfile(name),
    onSuccess: (u) => {
      if (accessToken) setAuth(u, accessToken)
      toast.success('Profile updated')
    },
    onError: () => toast.error('Failed to update profile')
  })

  const passwordMut = useMutation({
    mutationFn: () => changePassword(pw.current, pw.next),
    onSuccess: () => {
      toast.success('Password changed')
      setPw({ current: '', next: '' })
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed to change password')
  })

  if (!user) return <ProfileSkeleton />

  const completedPayments = payments.filter((payment) => payment.status === 'COMPLETED')
  const totalSpent = completedPayments.reduce((sum, payment) => sum + paymentAmount(payment), 0)
  const latestCertificate = certificates[0]

  return (
    <PageWrapper>
      <motion.div initial="hidden" animate="show" variants={containerVars} className="max-w-6xl mx-auto px-4 py-10 lg:py-12">
        <motion.div variants={itemVars} className="mb-10 text-center lg:text-left">
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-2 text-fg tracking-tight">Profile Settings</h1>
          <p className="text-[15px] font-medium text-muted">Manage your account and preferences</p>
        </motion.div>

        <motion.div variants={itemVars} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Award, label: 'Certificates', value: certificates.length },
            { icon: CreditCard, label: 'Successful Payments', value: completedPayments.length },
            { icon: TrendingUp, label: 'Total Invested', value: formatCurrency(totalSpent) },
          ].map((stat) => (
            <Card key={stat.label} className="p-5 border-line/80 bg-surface/50 shadow-sm overflow-hidden relative">
              <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-primary/10" />
              <div className="w-10 h-10 rounded-xl bg-primary-subtle border border-primary/20 text-primary grid place-items-center mb-4">
                <stat.icon size={19} strokeWidth={2.4} />
              </div>
              <p className="text-2xl font-extrabold text-fg leading-none">{stat.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted mt-1.5">{stat.label}</p>
            </Card>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <motion.div variants={itemVars}>
              <Card className="p-6 lg:p-8 border-line/80 shadow-sm bg-surface/50 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                  <Avatar name={user?.name} src={user?.avatar} size={80} className="shadow-md ring-4 ring-primary-subtle" />
                  <div className="text-center sm:text-left">
                    <p className="font-extrabold text-2xl text-fg tracking-tight">{user?.name}</p>
                    <p className="text-[15px] text-muted mb-2">{user?.email}</p>
                    <span className="inline-block text-[11px] font-bold text-primary bg-primary-subtle border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">{user?.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-6 text-[15px] font-bold text-fg uppercase tracking-wide border-b border-line/80 pb-3">
                  <UserIcon size={18} className="text-primary" /> Account details
                </div>
                <div className="space-y-5">
                  <Field label="Full name">
                    <Input className="h-12 bg-canvas hover:border-line-strong transition-colors" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <Input className="h-12 bg-canvas/50 text-muted" value={user?.email || ''} disabled />
                  </Field>
                  <div className="pt-2">
                    <Button onClick={() => profileMut.mutate()} loading={profileMut.isPending} disabled={!name || name === user?.name} className="h-11 px-6 font-bold shadow-soft">
                      Save changes
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={itemVars}>
              <Card className="p-6 lg:p-8 border-line/80 shadow-sm bg-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-2.5 mb-6 text-[15px] font-bold text-fg uppercase tracking-wide border-b border-line/80 pb-3">
                  <Lock size={18} className="text-primary" /> Change password
                </div>
                <div className="space-y-5">
                  <Field label="Current password">
                    <Input type="password" placeholder="Current password" className="h-12 bg-canvas hover:border-line-strong transition-colors" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
                  </Field>
                  <Field label="New password">
                    <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="At least 8 characters" className="h-12 bg-canvas hover:border-line-strong transition-colors" />
                  </Field>
                  <div className="pt-2">
                    <Button onClick={() => passwordMut.mutate()} loading={passwordMut.isPending} disabled={!pw.current || pw.next.length < 8} className="h-11 px-6 font-bold shadow-soft">
                      Update password
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-4">
            <motion.div variants={itemVars} className="sticky top-24">
              <Card className="p-6 border-line/80 shadow-sm bg-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-2.5 mb-6 text-[15px] font-bold text-fg uppercase tracking-wide border-b border-line/80 pb-3">
                  <Palette size={18} className="text-primary" /> Appearance
                </div>

                <p className="text-[13px] font-bold text-muted mb-3 uppercase tracking-wide">Mode</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {MODE_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 py-4 rounded-xl border-b-2 transition-all shadow-sm',
                        mode === m.id ? 'border-primary bg-primary-subtle/50 text-primary' : 'border-transparent bg-canvas hover:bg-surface2 text-muted hover:text-fg'
                      )}
                    >
                      <m.icon size={22} strokeWidth={2} />
                      <span className="text-[12px] font-bold">{m.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[13px] font-bold text-muted mb-3 uppercase tracking-wide">Accent color</p>
                <div className="flex flex-wrap gap-4 mb-8">
                  {ACCENT_OPTIONS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAccent(a.id)}
                      title={a.label}
                      className={cn(
                        'w-10 h-10 rounded-full grid place-items-center transition-all hover:scale-110 shadow-sm',
                        accent === a.id && 'ring-[3px] ring-offset-2 ring-offset-surface'
                      )}
                      style={{ background: a.color, ...(accent === a.id ? { ['--tw-ring-color' as string]: a.color } : {}) }}
                    >
                      {accent === a.id && <Check size={18} className="text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>

                <p className="text-[13px] font-bold text-muted mb-3 uppercase tracking-wide">Corner style</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['round', 'sharp'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadiusVariant(r)}
                      className={cn(
                        'px-4 py-3 rounded-xl text-[13px] font-bold border-b-2 capitalize transition-all shadow-sm',
                        radiusVariant === r ? 'border-primary bg-primary-subtle/50 text-primary' : 'border-transparent bg-canvas hover:bg-surface2 text-muted hover:text-fg'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        <motion.section id="certificates" variants={itemVars} className="mt-8">
          <Card className="p-5 sm:p-6 lg:p-8 border-line/80 shadow-sm bg-surface/50 backdrop-blur-md overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 border-b border-line/80 pb-4">
              <div>
                <div className="flex items-center gap-2.5 text-[15px] font-bold text-fg uppercase tracking-wide">
                  <Award size={18} className="text-primary" /> Certificates achieved
                </div>
                <p className="text-[13px] text-muted mt-1">All verified certificates earned from completed courses.</p>
              </div>
              {latestCertificate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle border border-primary/20 px-3 py-1 text-[11px] font-bold text-primary w-fit">
                  <ShieldCheck size={13} /> Latest: {formatDate(latestCertificate.issuedAt)}
                </span>
              )}
            </div>

            {certificates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center bg-canvas/50">
                <Award size={34} className="mx-auto text-muted mb-3" />
                <p className="font-bold text-fg">No certificates yet</p>
                <p className="text-[13px] text-muted mt-1">Complete eligible courses to unlock certificates here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {certificates.map((cert) => (
                  <div key={cert.certificateId} className="rounded-2xl border border-primary/20 bg-canvas overflow-hidden shadow-sm group">
                    <div className="relative aspect-[16/9] overflow-hidden bg-surface2">
                      {cert.courseId?.thumbnail ? (
                        <img src={resolveAssetUrl(cert.courseId.thumbnail)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full grid place-items-center bg-primary-subtle text-primary">
                          <Award size={40} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-success px-3 py-1 text-[11px] font-black text-white shadow-md">Completed</span>
                      <div className="absolute left-4 right-4 bottom-4">
                        <p className="text-white font-extrabold text-[15px] leading-tight line-clamp-2">{cert.courseId?.title || 'Course Certificate'}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-xl bg-surface p-3 border border-line/70">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Issued</p>
                          <p className="text-[12px] font-bold text-fg mt-1">{formatDate(cert.issuedAt)}</p>
                        </div>
                        <div className="rounded-xl bg-surface p-3 border border-line/70">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Progress</p>
                          <p className="text-[12px] font-bold text-fg mt-1">{cert.progressPercentage}%</p>
                        </div>
                      </div>
                      <p className="text-[11px] font-mono text-muted truncate mb-4">ID: {cert.certificateId}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Link to={`/certificate/${cert.certificateId}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-[12px] font-bold text-primary-fg hover:bg-primary-hover transition-colors">
                          Verify <ExternalLink size={13} />
                        </Link>
                        {cert.courseId?.slug && (
                          <Link to={`/learn/${cert.courseId.slug}`} className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-3 py-2.5 text-[12px] font-bold text-fg hover:bg-surface2 transition-colors">
                            Course
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.section>

        <motion.section variants={itemVars} className="mt-8">
          <Card className="p-5 sm:p-6 lg:p-8 border-line/80 shadow-sm bg-surface/50 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 border-b border-line/80 pb-4">
              <div>
                <div className="flex items-center gap-2.5 text-[15px] font-bold text-fg uppercase tracking-wide">
                  <Receipt size={18} className="text-primary" /> Fee & payment details
                </div>
                <p className="text-[13px] text-muted mt-1">Receipts, discounts, and enrollment payment history.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-3 py-1 text-[11px] font-bold text-success w-fit">
                <CreditCard size={13} /> Paid {formatCurrency(totalSpent)}
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center bg-canvas/50">
                <Receipt size={34} className="mx-auto text-muted mb-3" />
                <p className="font-bold text-fg">No payments found</p>
                <p className="text-[13px] text-muted mt-1">Your course fee and receipt history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const amount = paymentAmount(payment)
                  return (
                    <div key={payment.id} className="rounded-2xl border border-line bg-canvas p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-12 w-12 rounded-xl bg-primary-subtle border border-primary/20 text-primary grid place-items-center shrink-0">
                          <Receipt size={21} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-fg truncate">{payment.course?.title || payment.courseName || 'Course payment'}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted mt-1">
                            <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDate(payment.createdAt)}</span>
                            <span className="font-mono truncate max-w-[220px]">Order: {payment.orderId}</span>
                            {payment.couponCode && <span className="text-success font-bold">Coupon {payment.couponCode}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-3 lg:gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Amount</p>
                          <p className="text-[14px] font-extrabold text-fg">{formatCurrency(amount, payment.currency)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Discount</p>
                          <p className="text-[14px] font-extrabold text-success">{formatCurrency(payment.discountAmount || 0, payment.currency)}</p>
                        </div>
                        <span className={cn('inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider w-fit', statusClass(payment.status))}>
                          {payment.status.toLowerCase()}
                        </span>
                        {payment.course?.slug && (
                          <Link to={`/learn/${payment.course.slug}`} className="inline-flex items-center justify-center rounded-xl bg-surface border border-line px-3 py-2 text-[12px] font-bold text-fg hover:bg-surface2 transition-colors">
                            Open course
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </motion.section>
      </motion.div>
    </PageWrapper>
  )
}
