import { PageWrapper } from '../layout/PageWrapper'
import { Skeleton } from '../ui/Skeleton'
import { CoursePageBackground } from './CoursePageBackground'

function SkeletonPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-[var(--rad-card)] p-6 sm:p-7 ${className}`}>
      {children}
    </div>
  )
}

export function CoursePageSkeleton() {
  return (
    <PageWrapper>
      <div className="relative">
        <CoursePageBackground />
        <div className="relative z-10">
          <header
            style={{
              borderBottom: '1px solid color-mix(in srgb, var(--border) 90%, transparent)',
              background: `linear-gradient(165deg, color-mix(in srgb, var(--primary) 14%, var(--surface)) 0%, var(--bg) 42%, color-mix(in srgb, var(--primary) 4%, var(--bg)) 100%)`
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10 lg:pt-8 lg:pb-14">
              <Skeleton className="h-9 w-64 rounded-full mb-8" />
              <div className="flex items-center gap-3 mb-5">
                <Skeleton className="h-px w-8" />
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <div className="flex gap-2 mb-5">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-11 w-4/5 max-w-xl mb-3 rounded-lg" />
              <Skeleton className="h-11 w-3/5 max-w-md mb-6 rounded-lg" />
              <Skeleton className="h-5 w-full max-w-2xl mb-2 rounded" />
              <Skeleton className="h-5 w-3/4 max-w-lg mb-8 rounded" />
              <div className="flex flex-wrap gap-2">
                {[100, 90, 80, 95, 72].map((w, i) => (
                  <Skeleton key={i} className="h-9 rounded-full" style={{ width: w }} />
                ))}
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="lg:col-span-2 space-y-5 order-2 lg:order-1">
              <SkeletonPanel>
                <Skeleton className="h-3 w-20 mb-3 rounded" />
                <Skeleton className="h-6 w-44 mb-6 rounded" />
                <div className="grid sm:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-surface/50 flex items-start gap-3 p-4 rounded-[calc(var(--rad-card)-6px)]">
                      <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                      <Skeleton className="h-4 flex-1 rounded" />
                    </div>
                  ))}
                </div>
              </SkeletonPanel>

              <SkeletonPanel>
                <Skeleton className="h-3 w-20 mb-3 rounded" />
                <Skeleton className="h-6 w-44 mb-6 rounded" />
                <div className="pl-6" style={{ borderLeft: '3px solid var(--primary)' }}>
                  <Skeleton className="h-4 w-full mb-2 rounded" />
                  <Skeleton className="h-4 w-5/6 mb-2 rounded" />
                  <Skeleton className="h-4 w-4/6 rounded" />
                </div>
              </SkeletonPanel>

              <SkeletonPanel>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Skeleton className="h-3 w-20 mb-3 rounded" />
                    <Skeleton className="h-6 w-40 rounded" />
                  </div>
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-surface/80 shadow-md rounded-[calc(var(--rad-card)-4px)] overflow-hidden flex">
                      <div className="w-1 shrink-0" style={{ background: 'var(--primary)' }} />
                      <div className="flex-1">
                        <div className="bg-surface/50 flex items-center justify-between px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                            <div>
                              <Skeleton className="h-2.5 w-16 mb-1 rounded" />
                              <Skeleton className="h-4 w-36 rounded" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-24 rounded" />
                        </div>
                        {Array.from({ length: 2 }).map((_, j) => (
                          <div
                            key={j}
                            className="flex items-center justify-between px-4 py-3"
                            style={{ borderTop: j > 0 ? '1px solid color-mix(in srgb, var(--border) 90%, transparent)' : undefined }}
                          >
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                              <Skeleton className="h-4 w-40 rounded" />
                            </div>
                            <Skeleton className="h-3.5 w-10 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SkeletonPanel>

              <SkeletonPanel>
                <Skeleton className="h-3 w-20 mb-3 rounded" />
                <Skeleton className="h-6 w-32 mb-6 rounded" />
                <div className="flex items-start gap-5">
                  <Skeleton className="w-[60px] h-[60px] rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-44 mb-1.5 rounded" />
                    <Skeleton className="h-3 w-28 mb-4 rounded" />
                    <Skeleton className="h-4 w-full mb-2 rounded" />
                    <Skeleton className="h-4 w-4/5 rounded" />
                  </div>
                </div>
              </SkeletonPanel>
            </div>

            <div className="lg:sticky lg:top-24 h-fit order-1 lg:order-2">
              <div className="relative">
                <div
                  className="absolute -inset-3 rounded-[calc(var(--rad-card)+8px)] pointer-events-none bg-[radial-gradient(ellipse_at_top,var(--primary),transparent_65%)] opacity-20"
                  style={{ filter: 'blur(14px)' }}
                />
                <div className="relative rounded-[var(--rad-card)] overflow-hidden bg-card/80 backdrop-blur-xl">
                  <div
                    className="p-1.5"
                    style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 55%)' }}
                  >
                    <Skeleton className="aspect-video w-full rounded-[calc(var(--rad-card)-6px)]" />
                  </div>
                  <div className="px-5 pt-5 pb-6 space-y-5">
                    <div className="flex items-baseline gap-2.5">
                      <Skeleton className="h-9 w-24 rounded" />
                      <Skeleton className="h-5 w-16 rounded" />
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-[var(--rad-btn)]" />
                    <div className="space-y-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-3.5 py-3">
                          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                          <Skeleton className="h-4 flex-1 rounded" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-10 w-full rounded-[var(--rad-btn)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
