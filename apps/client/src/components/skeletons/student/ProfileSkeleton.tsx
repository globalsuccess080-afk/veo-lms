import React from 'react'
import { PageWrapper } from '../../layout/PageWrapper'
import { Skeleton } from '../../ui/Skeleton'

export function ProfileSkeleton() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-10 lg:py-12">
        <div className="mb-10 text-center lg:text-left">
          <Skeleton className="h-10 w-48 mb-2 mx-auto lg:mx-0" />
          <Skeleton className="h-5 w-64 mx-auto lg:mx-0" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="p-6 lg:p-8 border border-line/80 shadow-sm bg-surface/50 rounded-card">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <Skeleton className="w-20 h-20 rounded-full shrink-0" />
                <div className="w-full text-center sm:text-left space-y-2 flex flex-col items-center sm:items-start">
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>

              <div className="mb-6 border-b border-line/80 pb-3">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-5">
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
                <div className="pt-2"><Skeleton className="h-11 w-36 rounded-btn" /></div>
              </div>
            </div>

            <div className="p-6 lg:p-8 border border-line/80 shadow-sm bg-surface/50 rounded-card">
              <div className="mb-6 border-b border-line/80 pb-3">
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-5">
                <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
                <div className="pt-2"><Skeleton className="h-11 w-40 rounded-btn" /></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="p-6 border border-line/80 shadow-sm bg-surface/50 rounded-card sticky top-24">
              <div className="mb-6 border-b border-line/80 pb-3">
                <Skeleton className="h-5 w-32" />
              </div>

              <Skeleton className="h-4 w-16 mb-3" />
              <div className="grid grid-cols-3 gap-3 mb-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>

              <Skeleton className="h-4 w-24 mb-3" />
              <div className="flex flex-wrap gap-4 mb-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-10 h-10 rounded-full" />
                ))}
              </div>

              <Skeleton className="h-4 w-24 mb-3" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
