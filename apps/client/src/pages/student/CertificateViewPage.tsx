import { useMutation, useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Award, CheckCircle2, Copy, Download, ExternalLink, Loader2, Lock, Share2, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactConfetti from 'react-confetti'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Button } from '../../components/ui/Button'
import { generateCertificate, getCourseCertificate, requestPdfDownload } from '../../services/certificate.service'
import { getCourse, getCurriculum } from '../../services/course.service'
import { getCourseProgress } from '../../services/progress.service'
import { queryClient } from '../../lib/queryClient'

function getReadableError(err: unknown, fallback: string) {
    const error = err as { response?: { data?: { message?: string } }, message?: string }
    return error.response?.data?.message || error.message || fallback
}

export function CertificateViewPage() {
    const { slug } = useParams<{ slug: string }>()
    const [showConfetti, setShowConfetti] = useState(false)
    const [cardSize, setCardSize] = useState({ width: 0, height: 0 })
    const [isPolling, setIsPolling] = useState(false)
    const [pollCount, setPollCount] = useState(0)
    const [downloadAction, setDownloadAction] = useState<'download' | 'view'>('download')
    const [copied, setCopied] = useState(false)
    const confettiShownRef = useRef(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const { data: course, isLoading: courseLoading } = useQuery({
        queryKey: ['course', slug],
        queryFn: () => getCourse(slug!),
    })

    const { data: progressData } = useQuery({
        queryKey: ['course-progress', course?.id],
        queryFn: () => getCourseProgress(course!.id),
        enabled: !!course,
    })

    const { data: curriculum } = useQuery({
        queryKey: ['curriculum', slug],
        queryFn: () => getCurriculum(slug!),
        enabled: !!course,
    })

    const { data: certificate, refetch: refetchCert } = useQuery({
        queryKey: ['certificate', course?.id],
        queryFn: () => getCourseCertificate(course!.id),
        enabled: !!course,
    })

    useEffect(() => {
        if (certificate && !confettiShownRef.current) {
            queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['my-certificates'] })
            confettiShownRef.current = true
            if (cardRef.current) {
                const { width, height } = cardRef.current.getBoundingClientRect()
                setCardSize({ width, height })
            }
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 5500)
        }
    }, [certificate])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isPolling && !certificate) {
            interval = setInterval(() => {
                setPollCount((prev) => {
                    if (prev >= 15) {
                        setIsPolling(false)
                        toast.error('Taking longer than expected. Please check back later.')
                        return prev
                    }
                    refetchCert().then(({ data }) => { if (data) setIsPolling(false) }).catch(() => { })
                    return prev + 1
                })
            }, 2000)
        }
        return () => clearInterval(interval)
    }, [isPolling, certificate, refetchCert])

    const { mutate: handleGenerate, isPending: isGenerating } = useMutation({
        mutationFn: () => generateCertificate(course!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['my-certificates'] })
            setIsPolling(true)
            setPollCount(0)
            void refetchCert()
        },
        onError: (err: unknown) => toast.error(getReadableError(err, 'We could not generate your certificate. Please try again.')),
    })

    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownloadRequest = async (action: 'download' | 'view') => {
        try {
            setDownloadAction(action)
            setIsDownloading(true)
            const res = await requestPdfDownload(certificate!.certificateId)
            
            if (!res.data) {
                throw new Error('The certificate PDF was not returned. Please try again.')
            }

            const binaryString = window.atob(res.data)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
            const blob = new Blob([bytes], { type: 'application/pdf' })
            const blobUrl = URL.createObjectURL(blob)
            
            if (action === 'download') {
                const link = document.createElement('a')
                link.href = blobUrl
                link.download = `certificate-${certificate?.certificateId}.pdf`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            } else {
                window.open(blobUrl, '_blank')
            }
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
            
        } catch (err: unknown) {
            toast.error(getReadableError(err, 'We could not create the PDF right now. Please try again in a moment.'))
        } finally {
            setIsDownloading(false)
        }
    }

    const handleCopy = () => {
        const url = `${window.location.origin}/certificate/${certificate?.certificateId}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success('Link copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
    }

    if (courseLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        )
    }

    if (!course) return null

    const totalLessons = curriculum?.sections?.flatMap((s: any) => s.lessons).length || 0
    const completedLessons = progressData?.filter((p: any) => p.isCompleted).length || 0
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    const isEligible = progressPct >= 85
    const certUrl = certificate ? `${window.location.origin}/certificate/${certificate.certificateId}` : ''

    return (
        <PageWrapper className="min-h-screen">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">

                <Link
                    to={`/learn/${slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg transition-colors mb-10 group"
                >
                    <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
                    Back to Course
                </Link>

                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Award size={20} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-fg leading-tight">Course Certificate</h1>
                        <p className="text-sm text-muted mt-0.5 leading-tight">{course.title}</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">

                    {certificate ? (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                        >
                            <div ref={cardRef} className="rounded-2xl border border-line/60 bg-surface overflow-hidden relative">
                                {showConfetti && (
                                    <ReactConfetti
                                        width={cardSize.width}
                                        height={cardSize.height}
                                        recycle={false}
                                        numberOfPieces={280}
                                        gravity={0.22}
                                        initialVelocityY={12}
                                        colors={['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#e2e8f0']}
                                        style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }}
                                    />
                                )}

                                <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500" />

                                <div className="px-6 py-10 sm:px-10 sm:py-12 flex flex-col items-center text-center">

                                    <div className="relative mb-6">
                                        <div className="w-16 h-16 rounded-full bg-success/10 border border-success/25 flex items-center justify-center">
                                            <CheckCircle2 size={30} className="text-success" />
                                        </div>
                                        <motion.div
                                            className="absolute inset-0 rounded-full border border-success/30"
                                            animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                                        />
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight mb-2">
                                        Certificate Ready 🎉
                                    </h2>
                                    <p className="text-muted text-sm sm:text-base max-w-sm leading-relaxed">
                                        Congratulations! Your verified certificate is permanently on record.
                                    </p>

                                    <div className="w-full mt-8 mb-8 rounded-xl border border-line/50 bg-surface2/40 divide-y divide-line/50">
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <span className="text-xs font-semibold text-muted uppercase tracking-widest">Certificate ID</span>
                                            <span className="font-mono font-bold text-fg text-sm">{certificate.certificateId}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <span className="text-xs font-semibold text-muted uppercase tracking-widest">Issued On</span>
                                            <span className="font-semibold text-fg text-sm">
                                                {new Date(certificate.issuedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <span className="text-xs font-semibold text-muted uppercase tracking-widest">Public Link</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={handleCopy}
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                                >
                                                    {copied
                                                        ? <><CheckCircle2 size={12} className="text-success" /> Copied</>
                                                        : <><Copy size={12} /> Copy link</>
                                                    }
                                                </button>
                                                <span className="text-line">|</span>
                                                <a
                                                    href={certUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-fg transition-colors"
                                                >
                                                    <ExternalLink size={12} />
                                                    Open
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <Button
                                            onClick={() => handleDownloadRequest('download')}
                                            disabled={isDownloading}
                                            isLoading={isDownloading && downloadAction === 'download'}
                                            className="gap-2 sm:min-w-[160px]"
                                        >
                                            <Download size={15} />
                                            {isDownloading && downloadAction === 'download' ? 'Downloading…' : 'Download PDF'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDownloadRequest('view')}
                                            disabled={isDownloading}
                                            isLoading={isDownloading && downloadAction === 'view'}
                                            className="gap-2 sm:min-w-[140px]"
                                        >
                                            <ExternalLink size={15} />
                                            {isDownloading && downloadAction === 'view' ? 'Opening…' : 'View PDF'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleCopy}
                                            className="gap-2"
                                        >
                                            <Share2 size={15} />
                                            Share
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    ) : isPolling ? (
                        <motion.div
                            key="polling"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-2xl border border-line/60 bg-surface overflow-hidden"
                        >
                            <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500" />
                            <div className="px-6 py-16 sm:py-20 flex flex-col items-center text-center">
                                <div className="relative mb-7">
                                    <div className="w-16 h-16 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-primary" size={28} strokeWidth={1.5} />
                                    </div>
                                    <motion.div
                                        className="absolute inset-0 rounded-full border border-primary/20"
                                        animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                                        transition={{ duration: 1.8, repeat: Infinity }}
                                    />
                                </div>
                                <h2 className="text-xl font-extrabold text-fg tracking-tight mb-2">
                                    Generating your certificate…
                                </h2>
                                <p className="text-muted text-sm max-w-xs leading-relaxed">
                                    We're embedding your details and creating a verified QR code. Hang tight!
                                </p>
                                <div className="flex gap-1.5 mt-6">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-full bg-primary"
                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                    ) : (
                        <motion.div
                            key="locked"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                        >
                            <div className="rounded-2xl border border-line/60 bg-surface overflow-hidden">
                                <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500" />

                                <div className="px-6 py-10 sm:px-10 sm:py-12">
                                    <div className="flex flex-col sm:flex-row gap-8 sm:gap-10 items-center sm:items-start">

                                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center border transition-all ${isEligible ? 'bg-success/10 border-success/30' : 'bg-surface2 border-line'}`}>
                                                {isEligible
                                                    ? <Sparkles size={40} className="text-success" />
                                                    : <Lock size={40} className="text-muted" />
                                                }
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-widest ${isEligible ? 'text-success' : 'text-muted'}`}>
                                                {isEligible ? 'Eligible' : 'Locked'}
                                            </span>
                                        </div>

                                        <div className="flex-1 text-center sm:text-left">
                                            <h2 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight mb-2">
                                                {isEligible ? 'Claim Your Certificate' : 'Certificate Locked'}
                                            </h2>
                                            <p className="text-muted text-sm leading-relaxed mb-6 max-w-sm mx-auto sm:mx-0">
                                                {isEligible
                                                    ? "You've crossed the 85% threshold. Generate your official certificate and share your achievement."
                                                    : `Complete at least 85% of the course to unlock your certificate. You're at ${progressPct}% — just ${85 - progressPct}% more to go!`}
                                            </p>

                                            <div className="mb-7">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Your Progress</span>
                                                    <span className={`text-sm font-extrabold ${isEligible ? 'text-success' : 'text-fg'}`}>{progressPct}%</span>
                                                </div>
                                                <div className="h-2.5 bg-surface2 rounded-full overflow-hidden border border-line/50">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progressPct}%` }}
                                                        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                                                        className={`h-full rounded-full ${isEligible ? 'bg-success' : 'bg-gradient-to-r from-primary to-info'}`}
                                                    />
                                                </div>
                                                <div className="flex justify-between mt-1.5">
                                                    <span className="text-[11px] text-muted/60">{completedLessons} / {totalLessons} lessons</span>
                                                    <span className="text-[11px] text-muted/60">Required: 85%</span>
                                                </div>
                                            </div>

                                            <Button
                                                size="lg"
                                                className="gap-2 w-full sm:w-auto px-8"
                                                disabled={!isEligible || isGenerating}
                                                isLoading={isGenerating}
                                                onClick={() => handleGenerate()}
                                            >
                                                <Award size={17} />
                                                Generate Certificate
                                            </Button>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </PageWrapper>
    )
}
