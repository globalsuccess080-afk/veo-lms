import { Check, Quote } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { CoursePanel, SectionEyebrow } from './CoursePanel'

const DEFAULT_LEARN = [
  'Build real-world projects from scratch',
  'Understand core concepts deeply',
  'Write clean, production-ready code',
  'Best practices used by senior engineers'
]

export function CourseLearnBlock() {
  return (
    <CoursePanel index={1} glow="top-right">
      <SectionEyebrow>Outcomes</SectionEyebrow>
      <h2 className="font-bold text-xl mb-6 tracking-tight text-fg">What you&apos;ll learn</h2>

      <div className="grid sm:grid-cols-2 gap-3">
        {DEFAULT_LEARN.map((point) => (
          <div
            key={point}
            className="cp-inner-tile group flex items-start gap-3 text-sm leading-relaxed p-4 rounded-[calc(var(--rad-card)-6px)]"
          >
            <span
              className="cp-icon-box w-7 h-7 rounded-lg grid place-items-center shrink-0 mt-0.5 text-primary"
            >
              <Check size={13} strokeWidth={2.5} />
            </span>
            <span className="text-muted group-hover:text-fg transition-colors duration-200">{point}</span>
          </div>
        ))}
      </div>
    </CoursePanel>
  )
}

export function CourseAboutBlock({ description }: { description: string }) {
  return (
    <CoursePanel index={2} glow="top-left">
      <SectionEyebrow>Overview</SectionEyebrow>
      <h2 className="font-bold text-xl mb-6 tracking-tight text-fg">About this course</h2>

      <div className="relative pl-6" style={{ borderLeft: '3px solid var(--primary)' }}>
        <Quote size={24} className="absolute -top-1 left-3 opacity-12 text-primary" />
        <div className="leading-relaxed text-[15px] text-muted rich-text-content" dangerouslySetInnerHTML={{ __html: description }} />
      </div>
    </CoursePanel>
  )
}

export function CourseInstructorBlock({
  name,
  bio,
  avatar
}: {
  name: string
  bio?: string
  avatar?: string
}) {
  return (
    <CoursePanel index={4} glow="bottom-right">
      <SectionEyebrow>Instructor</SectionEyebrow>
      <h2 className="font-bold text-xl mb-6 tracking-tight text-fg">Meet your instructor</h2>

      <div className="flex items-start gap-5">
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-full scale-[1.2] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 30%, transparent), transparent 70%)',
              filter: 'blur(10px)',
              opacity: 0.55
            }}
          />
          <div
            className="relative rounded-full p-[2px]"
            style={{
              background: 'linear-gradient(145deg, var(--primary), color-mix(in srgb, var(--primary) 25%, transparent))'
            }}
          >
            <div className="rounded-full overflow-hidden w-[60px] h-[60px]">
              <Avatar name={name} src={avatar} size={60} />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-bold text-[1.1rem] leading-tight text-fg">{name}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] mt-0.5 mb-3 text-primary">
            Course Instructor
          </p>
          <p className="text-sm leading-relaxed text-muted">
            {bio || 'Experienced instructor and software engineer passionate about helping learners build real-world skills.'}
          </p>
        </div>
      </div>
    </CoursePanel>
  )
}
