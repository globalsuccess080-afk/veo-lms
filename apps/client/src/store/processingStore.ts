import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProcessingJob {
  lessonId: string
  lessonTitle: string
  courseId: string
  courseTitle: string
  jobId?: string
  startedAt: number // Date.now()
  status: 'queued' | 'processing' | 'ready' | 'failed'
  progress?: number
}

interface ProcessingStore {
  jobs: ProcessingJob[]
  addJob: (job: Omit<ProcessingJob, 'startedAt' | 'status' | 'progress'>) => void
  updateJobStatus: (lessonId: string, status: ProcessingJob['status'], progress?: number) => void
  removeJob: (lessonId: string) => void
  getJobsForCourse: (courseId: string) => ProcessingJob[]
  hasActiveJobs: (courseId: string) => boolean
}

export const useProcessingStore = create<ProcessingStore>()(
  persist(
    (set, get) => ({
      jobs: [],
      addJob: (job) => set(s => ({
        jobs: [
          ...s.jobs.filter(j => j.lessonId !== job.lessonId),
          { ...job, startedAt: Date.now(), status: 'queued' as const, progress: 0 }
        ]
      })),
      updateJobStatus: (lessonId, status, progress) => set(s => ({
        jobs: s.jobs.map(j => j.lessonId === lessonId ? { ...j, status, progress: progress ?? j.progress } : j)
      })),
      removeJob: (lessonId) => set(s => ({ jobs: s.jobs.filter(j => j.lessonId !== lessonId) })),
      getJobsForCourse: (courseId) => get().jobs.filter(j => j.courseId === courseId),
      hasActiveJobs: (courseId) => get().jobs.some(j => j.courseId === courseId && (j.status === 'queued' || j.status === 'processing')),
    }),
    { name: 'veo-processing-jobs' }
  )
)
