import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getCourse, getCurriculum } from '../../services/course.service'
import { checkEnrollment } from '../../services/enrollment.service'
import { useAuthStore } from '../../store/authStore'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useRazorpay } from '../../hooks/useRazorpay'
import {
  CoursePageBackground,
  CoursePageSkeleton,
  CourseHero,
  CourseCheckoutCard,
  CourseCurriculum,
  CourseLearnBlock,
  CourseAboutBlock,
  CourseInstructorBlock
} from '../../components/course-page'

interface CurriculumLesson { id: string; title: string; duration: number; isPreview: boolean }
interface CurriculumSection { _id: string; title: string; lessons: CurriculumLesson[] }

export function CoursePage() {
  const { slug } = useParams<{ slug: string }>()
  const user = useAuthStore((s) => s.user)
  const { initiatePayment, loading: paying } = useRazorpay()

  const { data: course, isLoading } = useQuery({ queryKey: ['course', slug], queryFn: () => getCourse(slug!), enabled: !!slug })
  const { data: curriculum } = useQuery({ queryKey: ['curriculum', slug], queryFn: () => getCurriculum(slug!), enabled: !!slug })
  const { data: enrollment } = useQuery({ queryKey: ['enrollment', course?.id], queryFn: () => checkEnrollment(course!.id), enabled: !!user && !!course?.id })

  if (isLoading) return <CoursePageSkeleton />

  if (!course) {
    return (
      <PageWrapper>
        <div className="p-16 text-center text-muted">Course not found</div>
      </PageWrapper>
    )
  }

  const isEnrolled = enrollment?.enrolled
  const sections: CurriculumSection[] = curriculum?.sections || []
  const firstLesson = sections[0]?.lessons?.[0]

  return (
    <PageWrapper>
      <div className="relative">
        <CoursePageBackground />

        <div className="relative z-10">
          <CourseHero course={course} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
              <CourseLearnBlock />
              <CourseAboutBlock description={course.description} />
              <CourseCurriculum
                sections={sections}
                courseSlug={course.slug}
                totalLessons={course.totalLessons}
                isEnrolled={isEnrolled}
                isLoggedIn={!!user}
              />
              <CourseInstructorBlock
                name={course.instructor.name}
                bio={course.instructor.bio}
                avatar={course.instructor.avatar}
              />
            </div>

            <div className="lg:sticky lg:top-24 h-fit order-1 lg:order-2">
              <CourseCheckoutCard
                course={course}
                isEnrolled={isEnrolled}
                isLoggedIn={!!user}
                paying={paying}
                firstLessonId={firstLesson?.id}
                onEnroll={(couponCode) => initiatePayment(course.id, couponCode)}
              />
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
