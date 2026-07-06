import React from 'react'
import { Skeleton } from '../../ui/Skeleton'

export function LearnSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      <header className="h-14 border-b border-line glass z-30 flex items-center gap-3 px-3 sm:px-4 shrink-0">
        <Skeleton className="h-5 w-24" />
        <span className="text-line hidden sm:inline">|</span>
        <Skeleton className="h-5 w-48 flex-1" />
        <Skeleton className="h-4 w-32 hidden md:block" />
      </header>
      <div className="flex flex-1 min-h-0">
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <Skeleton className="w-full aspect-video md:aspect-auto md:h-[calc(100vh-3.5rem-150px)] rounded-none" />
          <div className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
            <Skeleton className="h-8 w-3/4 max-w-md mb-6" />
            <Skeleton className="h-10 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
        </main>
        <aside className="hidden lg:flex flex-col w-[340px] border-l border-line bg-surface shrink-0 min-h-0">
          <div className="p-4 border-b border-line shrink-0">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="p-4 space-y-6">
            <div>
              <Skeleton className="h-5 w-full mb-3" />
              <div className="space-y-3 pl-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-5 w-full mb-3" />
              <div className="space-y-3 pl-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
