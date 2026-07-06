import React from 'react'
import { PageWrapper } from '../../layout/PageWrapper'
import { Skeleton } from '../../ui/Skeleton'
import { CourseCardSkeleton } from '../../course/CourseCard'

export function GenericPageSkeleton() {
  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-10 lg:py-16">
        <div className="mb-10">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="flex gap-4 mb-10">
          <Skeleton className="h-12 w-full max-w-xl rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
