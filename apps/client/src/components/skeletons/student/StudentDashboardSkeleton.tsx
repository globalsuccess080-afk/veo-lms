import React from 'react'
import { PageWrapper } from '../../layout/PageWrapper'
import { CourseCardSkeleton } from '../shared/CourseCardSkeleton'
import { Skeleton } from '../../ui/Skeleton'

export function StudentDashboardSkeleton() {
  return (
    <PageWrapper className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-10 lg:py-14">
        {/* Header Section */}
        <div className="mb-14 max-w-2xl">
          <Skeleton className="h-6 w-32 mb-4 rounded-full" />
          <Skeleton className="h-12 w-3/4 mb-3" />
          <Skeleton className="h-5 w-1/2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl p-6 shadow-sm border border-line bg-surface">
              <Skeleton className="w-10 h-10 rounded-xl mb-6" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Continue Learning Section */}
        <div className="mb-16">
          <div className="mb-6">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 flex gap-4 items-center rounded-2xl border border-line bg-surface">
                <Skeleton className="w-[110px] h-[74px] rounded-xl shrink-0" />
                <div className="min-w-0 flex-1 pr-2 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 opacity-70 mb-2" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-1.5 flex-1" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Courses Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
