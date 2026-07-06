import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Clock, BarChart2, CheckCircle2, Sparkles, ShieldCheck, Zap, TrendingUp, ArrowRight } from 'lucide-react'
import type { Course } from '@veolms/shared'
import { formatINR, formatDuration } from '../../lib/utils'
import { TrailerPlayer } from './TrailerPlayer'
import { useState } from 'react'
import { validateCoupon } from '../../services/coupon.service'
import { toast } from 'sonner'
import { Tag } from 'lucide-react'

interface CourseCheckoutCardProps {
  course: Course
  isEnrolled?: boolean
  isLoggedIn: boolean
  paying: boolean
  firstLessonId?: string
  onEnroll: (couponCode?: string) => void
}

export function CourseCheckoutCard({
  course,
  isEnrolled,
  isLoggedIn,
  paying,
  firstLessonId,
  onEnroll
}: CourseCheckoutCardProps) {
  const location = useLocation()
  const features = [
    { icon: BookOpen, label: `${course.totalLessons} On-Demand Lessons` },
    { icon: Clock, label: `${formatDuration(course.totalDuration)} of Content` },
    { icon: BarChart2, label: `${course.level} Level` },
    { icon: CheckCircle2, label: 'Lifetime Access' }
  ]

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number, finalAmount: number } | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  const handleApplyCoupon = async () => {
    if (!couponCode) return
    setValidatingCoupon(true)
    try {
      const result = await validateCoupon(course.id, couponCode)
      setAppliedCoupon({
        code: couponCode,
        discount: result.discountAmount,
        finalAmount: result.finalAmount
      })
      toast.success('Coupon applied successfully!')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Invalid coupon code')
      setAppliedCoupon(null)
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setAppliedCoupon(null)
  }

  const isFree = course.price === 0 || (appliedCoupon && appliedCoupon.finalAmount === 0)
  const hasDiscount = course.originalPrice > course.price || appliedCoupon !== null
  const currentPrice = appliedCoupon ? appliedCoupon.finalAmount : course.price
  const originalPriceDisplay = appliedCoupon ? course.price : course.originalPrice
  const discountPct = hasDiscount ? Math.round((1 - currentPrice / originalPriceDisplay) * 100) : 0

  const ctaStyle = {
    background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 75%, #000) 100%)',
    color: 'var(--primary-fg)', 
    letterSpacing: '0.02em'
  } as const

  return (
    <div className="relative">
      <div
        className="absolute -inset-3 rounded-[calc(var(--rad-card)+8px)] pointer-events-none bg-[radial-gradient(ellipse_at_top,var(--primary),transparent_65%)] opacity-20"
        style={{ filter: 'blur(14px)' }}
      />

      <div className="relative rounded-[var(--rad-card)] overflow-hidden bg-card/80 backdrop-blur-xl">
        <div
          className="p-1.5"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 55%)'
          }}
        >
          <div className="rounded-[calc(var(--rad-card)-6px)] overflow-hidden">
            <TrailerPlayer trailerUrl={course.trailerUrl} thumbnail={course.thumbnail} title={course.title} />
          </div>
        </div>

        <div className="px-5 pt-5">
          <div className="flex items-baseline gap-3 flex-wrap mb-5">
            {isFree ? (
              <span className="text-4xl font-extrabold tracking-tight text-success">Free</span>
            ) : (
              <>
                <span className="text-4xl font-extrabold tracking-[-0.03em] text-fg">
                  {formatINR(currentPrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xl font-medium line-through text-muted opacity-55">
                      {formatINR(originalPriceDisplay)}
                    </span>
                    <span
                      className="bg-primary/10 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ color: 'var(--success)' }}
                    >
                      <TrendingUp size={10} />
                      {discountPct}% off
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          {!isEnrolled && isLoggedIn && !isFree && (
            <div className="mb-5 space-y-2">
              <label className="text-sm font-medium text-muted">Have a coupon code?</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon || validatingCoupon}
                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
                  />
                </div>
                {appliedCoupon ? (
                  <button onClick={handleRemoveCoupon} className="px-3 py-2 text-sm font-medium text-red-500 bg-red-500/10 rounded-md hover:bg-red-500/20 transition-colors">
                    Remove
                  </button>
                ) : (
                  <button onClick={handleApplyCoupon} disabled={!couponCode || validatingCoupon} className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50">
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                )}
              </div>
            </div>
          )}

          {isEnrolled ? (
            <Link
              to={`/learn/${course.slug}/${firstLessonId || ''}`}
              className="w-full mb-5 flex items-center justify-center gap-2.5 py-3.5 rounded-[var(--rad-btn)] font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98]"
              style={ctaStyle}
            >
              <Sparkles size={16} />
              Continue Learning
              <ArrowRight size={16} />
            </Link>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={() => onEnroll(appliedCoupon?.code)}
              disabled={paying}
              className="w-full mb-5 flex items-center justify-center gap-2.5 py-3.5 rounded-[var(--rad-btn)] font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-55"
              style={ctaStyle}
            >
              <Zap size={16} fill="currentColor" />
              {paying ? 'Processing…' : 'Enroll Now'}
              <ArrowRight size={16} />
            </button>
          ) : (
            <Link
              to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
              className="w-full mb-5 flex items-center justify-center gap-2.5 py-3.5 rounded-[var(--rad-btn)] font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98]"
              style={ctaStyle}
            >
              Login to Enroll
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        <div className="mx-5 mb-4 h-px" style={{ background: 'color-mix(in srgb, var(--border) 90%, transparent)' }} />

        <div className="px-5 pb-5 space-y-1">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3.5 px-3.5 py-3 rounded-[calc(var(--rad-btn)+2px)] transition-colors duration-200 hover:bg-primary/5"
            >
              <div className="bg-primary/10 shadow-[0_0_14px_-4px_color-mix(in_srgb,var(--primary)_18%,transparent)] w-9 h-9 rounded-lg grid place-items-center shrink-0 text-primary">
                <Icon size={15} />
              </div>
              <span className="text-sm font-medium text-muted">{label}</span>
            </div>
          ))}
        </div>

        <div className="bg-surface/50 mx-5 mb-5 flex items-center justify-center gap-2 py-3 rounded-[var(--rad-btn)]">
          <ShieldCheck size={13} className="text-subtle opacity-55" />
          <span className="text-[11px] font-medium text-muted opacity-55">
            Secure checkout · 30-day money-back guarantee
          </span>
        </div>
      </div>
    </div>
  )
}
