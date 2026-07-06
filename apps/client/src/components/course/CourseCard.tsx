import { Link } from 'react-router-dom'
import { Course } from '@veolms/shared'
import { Star, Users, PlayCircle, Clock, BookOpen } from 'lucide-react'
import { formatINR, formatDuration } from '../../lib/utils'
import { Badge } from '../ui/Badge'

const FALLBACK = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80'

export function CourseCard({ course }: { course: Course }) {
  const discount = course.originalPrice > course.price
    ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
    : 0

  const rating = course.rating?.average || 4.6
  const reviewCount = course.rating?.count || 0

  return (
    <Link to={`/courses/${course.slug}`} className="group block h-full">
      <div
        className="relative h-full flex flex-col overflow-hidden transition-all duration-300 group-hover:-translate-y-1"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--rad-card)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px color-mix(in srgb, var(--primary) 30%, transparent)'
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'color-mix(in srgb, var(--primary) 40%, transparent)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        }}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden" style={{ borderRadius: `var(--rad-card) var(--rad-card) 0 0` }}>
          <img
            src={course.thumbnail || FALLBACK}
            alt={course.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Dark overlay + play on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform duration-200 group-hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.5)' }}
            >
              <PlayCircle size={26} className="text-white" />
            </div>
          </div>

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
            {discount > 0 ? (
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: 'var(--danger)' }}
              >
                {discount}% OFF
              </span>
            ) : <span />}
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize backdrop-blur-sm"
              style={{
                background: 'rgba(0,0,0,0.55)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {course.level}
            </span>
          </div>

          {/* Bottom gradient strip on card image */}
          <div
            className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
            style={{ background: 'linear-gradient(to top, var(--card), transparent)' }}
          />
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          {/* Category + Rating */}
          <div className="flex items-center justify-between">
            <Badge tone="primary">{course.category}</Badge>
            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--warning)' }}>
              <Star size={11} className="fill-warning text-warning" />
              {rating}
              {reviewCount > 0 && (
                <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--fg-subtle)' }}>
                  ({reviewCount})
                </span>
              )}
            </span>
          </div>

          {/* Title */}
          <h3
            className="font-semibold text-[14.5px] leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-primary"
            style={{ color: 'var(--fg)' }}
          >
            {course.title}
          </h3>

          {/* Instructor */}
          <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
            by <span className="font-medium">{course.instructor.name}</span>
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-auto pt-1" style={{ color: 'var(--fg-subtle)' }}>
            <span className="flex items-center gap-1 text-xs">
              <BookOpen size={12} />
              {course.totalLessons} lessons
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Users size={12} />
              {course.enrollmentCount}
            </span>
            {course.totalDuration > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <Clock size={12} />
                {formatDuration(course.totalDuration)}
              </span>
            )}
          </div>

          {/* Price row */}
          <div
            className="flex items-center gap-2 pt-3 mt-1"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="text-base font-bold" style={{ color: 'var(--primary)' }}>
              {course.price === 0 ? 'Free' : formatINR(course.price)}
            </span>
            {discount > 0 && (
              <span className="text-xs line-through" style={{ color: 'var(--fg-subtle)' }}>
                {formatINR(course.originalPrice)}
              </span>
            )}
            <span
              className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                color: 'var(--primary)',
              }}
            >
              Enroll Now
            </span>
          </div>
        </div>

        {/* Bottom primary accent line on hover */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to right, var(--primary), color-mix(in srgb, var(--primary) 50%, transparent))' }}
        />
      </div>
    </Link>
  )
}

export function CourseCardSkeleton() {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--rad-card)',
      }}
    >
      <div className="skeleton aspect-video" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-4 w-10 rounded-full" />
        </div>
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex gap-3 pt-1">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-12 rounded" />
        </div>
        <div className="skeleton h-5 w-24 rounded mt-2" />
      </div>
    </div>
  )
}
