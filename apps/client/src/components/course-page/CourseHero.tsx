import { Link } from 'react-router-dom'
import { Star, Users, BookOpen, Clock, Globe, ChevronRight, Sparkles } from 'lucide-react'
import { formatDuration, cn } from '../../lib/utils'

interface CourseHeroProps {
  course: {
    title: string
    shortDescription: string
    category: string
    level: string
    language: string
    totalLessons: number
    totalDuration: number
    enrollmentCount: number
    rating: { average: number }
  }
}

export function CourseHero({ course }: CourseHeroProps) {
  const stats = [
    { icon: Star, label: `${course.rating.average || '4.6'} rating`, accent: true },
    { icon: Users, label: `${course.enrollmentCount} students` },
    { icon: BookOpen, label: `${course.totalLessons} lessons` },
    { icon: Clock, label: formatDuration(course.totalDuration) },
    { icon: Globe, label: course.language }
  ]

  return (
    <header className="relative">


      <svg
        className="absolute top-0 right-0 pointer-events-none"
        style={{ width: '38%', maxWidth: 520, opacity: 0.03 }}
        viewBox="0 0 280 280"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="280" cy="0" r="220" fill="none" stroke="var(--primary)" strokeWidth="0.5" />
        <circle cx="280" cy="0" r="160" fill="none" stroke="var(--primary)" strokeWidth="0.5" />
        <circle cx="280" cy="0" r="100" fill="none" stroke="var(--primary)" strokeWidth="0.5" />
        <circle cx="280" cy="0" r="48" fill="none" stroke="var(--primary)" strokeWidth="0.5" />
      </svg>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10 lg:pt-8 lg:pb-14">
        <nav className="bg-card/80 backdrop-blur-md shadow-sm inline-flex items-center gap-1.5 text-sm mb-8 px-4 py-2 rounded-full flex-wrap">
          <Link to="/" className="text-muted hover:text-primary transition-colors duration-200">
            Home
          </Link>
          <ChevronRight size={13} className="shrink-0 opacity-35 text-muted" />
          <Link to="/search" className="text-muted hover:text-primary transition-colors duration-200">
            Courses
          </Link>
          <ChevronRight size={13} className="shrink-0 opacity-35 text-muted" />
          <span className="truncate max-w-[200px] sm:max-w-sm text-fg opacity-70">{course.title}</span>
        </nav>

        <div className="flex items-center gap-3 mb-5">
          <span className="h-px w-8 shrink-0" style={{ background: 'var(--primary)' }} />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--primary)' }}
          >
            Premium Course
          </span>
          <span
            className="bg-primary/10 inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ color: 'var(--primary)' }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ background: 'var(--primary)' }}
              />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'var(--primary)' }} />
            </span>
            Enrolling now
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-full"
            style={{
              color: 'var(--primary-fg)',
              background: 'var(--primary)',
              boxShadow: '0 4px 16px -4px color-mix(in srgb, var(--primary) 45%, transparent)'
            }}
          >
            <Sparkles size={11} />
            {course.category}
          </span>
          <span
            className="bg-card/80 backdrop-blur-md shadow-sm border border-border inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.12em] px-3.5 py-1.5 rounded-full capitalize text-muted"
          >
            {course.level}
          </span>
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold mb-5 leading-[1.06] tracking-[-0.03em] max-w-3xl text-fg"
        >
          {course.title}
        </h1>

        <p className="text-base sm:text-lg mb-9 max-w-2xl leading-relaxed text-muted">
          {course.shortDescription}
        </p>

        <div className="flex flex-wrap gap-2">
          {stats.map(({ icon: Icon, label, accent }) => (
            <div
              key={label}
              className={cn(
                'bg-card/80 backdrop-blur-md shadow-sm border border-border inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px]',
                accent ? 'text-fg' : 'text-muted'
              )}
              style={
                accent
                  ? {
                      background: 'color-mix(in srgb, var(--primary) 10%, var(--card))',
                      boxShadow: '0 4px 16px -4px color-mix(in srgb, var(--primary) 22%, transparent)'
                    }
                  : undefined
              }
            >
              <Icon
                size={13}
                style={{ color: accent ? '#F59E0B' : 'var(--primary)' }}
                className={accent ? 'fill-amber-400' : ''}
              />
              <span className={accent ? 'font-semibold' : 'font-medium'}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
