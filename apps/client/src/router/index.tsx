import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet, ScrollRestoration } from 'react-router-dom'
import { ProtectedRoute } from '../components/shared/ProtectedRoute'
import { ErrorBoundary } from '../components/shared/ErrorBoundary'
import { AdminLayout } from '../components/layout/AdminLayout'

import { AdminDashboardSkeleton } from '../components/skeletons/admin/AdminDashboardSkeleton'
import { ManageCoursesSkeleton } from '../components/skeletons/admin/ManageCoursesSkeleton'
import { CourseEditorSkeleton } from '../components/skeletons/admin/CourseEditorSkeleton'
import { ManageStudentsSkeleton } from '../components/skeletons/admin/ManageStudentsSkeleton'
import { EnrollmentsSkeleton } from '../components/skeletons/admin/EnrollmentsSkeleton'
import { AnnouncementsSkeleton } from '../components/skeletons/admin/AnnouncementsSkeleton'
import { CouponsSkeleton } from '../components/skeletons/admin/CouponsSkeleton'

import { StudentDashboardSkeleton } from '../components/skeletons/student/StudentDashboardSkeleton'
import { MyCoursesSkeleton } from '../components/skeletons/student/MyCoursesSkeleton'
import { LearnSkeleton } from '../components/skeletons/student/LearnSkeleton'
import { ProfileSkeleton } from '../components/skeletons/student/ProfileSkeleton'

import { CoursePageSkeleton } from '../components/course-page/CoursePageSkeleton'
import { PageLoader } from '../components/ui/Spinner'

const HomePage = lazy(() => import('../pages/public/HomePage').then(m => ({ default: m.HomePage })))
const CoursePage = lazy(() => import('../pages/public/CoursePage').then(m => ({ default: m.CoursePage })))
const SearchPage = lazy(() => import('../pages/public/SearchPage').then(m => ({ default: m.SearchPage })))
const LearningPathsPage = lazy(() => import('../pages/public/LearningPathsPage').then(m => ({ default: m.LearningPathsPage })))
const ContactPage = lazy(() => import('../pages/public/ContactPage').then(m => ({ default: m.ContactPage })))
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const AdminLoginPage = lazy(() => import('../pages/auth/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })))
const DashboardPage = lazy(() => import('../pages/student/DashboardPage').then(m => ({ default: m.DashboardPage })))
const MyCoursesPage = lazy(() => import('../pages/student/MyCoursesPage').then(m => ({ default: m.MyCoursesPage })))
const LearnPage = lazy(() => import('../pages/student/LearnPage').then(m => ({ default: m.LearnPage })))
const ProfilePage = lazy(() => import('../pages/student/ProfilePage').then(m => ({ default: m.ProfilePage })))
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const ManageCoursesPage = lazy(() => import('../pages/admin/ManageCoursesPage').then(m => ({ default: m.ManageCoursesPage })))
const CourseEditorPage = lazy(() => import('../pages/admin/CourseEditorPage').then(m => ({ default: m.CourseEditorPage })))
const ManageStudentsPage = lazy(() => import('../pages/admin/ManageStudentsPage').then(m => ({ default: m.ManageStudentsPage })))
const EnrollmentsPage = lazy(() => import('../pages/admin/EnrollmentsPage').then(m => ({ default: m.EnrollmentsPage })))
const AnnouncementsPage = lazy(() => import('../pages/admin/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })))
const CouponsPage = lazy(() => import('../pages/admin/CouponsPage').then(m => ({ default: m.CouponsPage })))
const AnalyticsDashboard = lazy(() => import('../pages/admin/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })))
const CertificateViewPage = lazy(() => import('../pages/student/CertificateViewPage').then(m => ({ default: m.CertificateViewPage })))
const PublicCertificatePage = lazy(() => import('../pages/public/PublicCertificatePage').then(m => ({ default: m.PublicCertificatePage })))
const AdminCertificatesPage = lazy(() => import('../pages/admin/AdminCertificatesPage').then(m => ({ default: m.AdminCertificatesPage })))

function withSuspense(Component: React.ComponentType, SkeletonFallback?: React.ComponentType) {
  const Fallback = SkeletonFallback || PageLoader
  return (
    <ErrorBoundary>
      <Suspense fallback={<Fallback />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}

export const router = createBrowserRouter([
  {
    element: (
      <>
        <ScrollRestoration />
        <Outlet />
      </>
    ),
    children: [
      { path: '/', element: withSuspense(HomePage) },
      { path: '/courses/:slug', element: withSuspense(CoursePage, CoursePageSkeleton) },
      { path: '/search', element: withSuspense(SearchPage) },
      { path: '/learning-paths', element: withSuspense(LearningPathsPage) },
      { path: '/contact', element: withSuspense(ContactPage) },
      { path: '/certificate/:certificateId', element: withSuspense(PublicCertificatePage) },
      { path: '/learn/:courseSlug', element: withSuspense(LearnPage, LearnSkeleton) },
      { path: '/learn/:courseSlug/:lessonId', element: withSuspense(LearnPage, LearnSkeleton) },
      { path: '/login', element: withSuspense(LoginPage) },
      { path: '/register', element: withSuspense(RegisterPage) },
      { path: '/forgot-password', element: withSuspense(ForgotPasswordPage) },
      { path: '/admin/login', element: withSuspense(AdminLoginPage) },
      {
        element: <ProtectedRoute allowedRoles={['student', 'admin']} />,
        children: [
          { path: '/dashboard', element: withSuspense(DashboardPage, StudentDashboardSkeleton) },
          { path: '/my-courses', element: withSuspense(MyCoursesPage, MyCoursesSkeleton) },
          { path: '/courses/:slug/certificate', element: withSuspense(CertificateViewPage) },
          { path: '/profile', element: withSuspense(ProfilePage, ProfileSkeleton) }
        ]
      },
      {
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: withSuspense(AdminDashboardPage, AdminDashboardSkeleton) },
              { path: 'analytics', element: withSuspense(AnalyticsDashboard) },
              { path: 'courses', element: withSuspense(ManageCoursesPage, ManageCoursesSkeleton) },
              { path: 'courses/new', element: withSuspense(CourseEditorPage, CourseEditorSkeleton) },
              { path: 'courses/:id/edit', element: withSuspense(CourseEditorPage, CourseEditorSkeleton) },
              { path: 'students', element: withSuspense(ManageStudentsPage, ManageStudentsSkeleton) },
              { path: 'enrollments', element: withSuspense(EnrollmentsPage, EnrollmentsSkeleton) },
              { path: 'announcements', element: withSuspense(AnnouncementsPage, AnnouncementsSkeleton) },
              { path: 'coupons', element: withSuspense(CouponsPage, CouponsSkeleton) },
              { path: 'certificates', element: withSuspense(AdminCertificatesPage) }
            ]
          }
        ]
      },
      { path: '*', element: withSuspense(NotFoundPage) }
    ]
  }
])
