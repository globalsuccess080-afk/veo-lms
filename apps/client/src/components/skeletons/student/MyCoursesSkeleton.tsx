import React from 'react'
import { PageWrapper } from '../../layout/PageWrapper'
import { CourseCardSkeleton } from '../shared/CourseCardSkeleton'
import { Skeleton } from '../../ui/Skeleton'

export function MyCoursesSkeleton() {
  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-10 lg:py-12">
        <div className="mb-10">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="flex gap-2.5 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-xl shrink-0" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
