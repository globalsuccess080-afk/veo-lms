import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Award, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { getPublicCertificate } from '../../services/certificate.service'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function PublicCertificatePage() {
  const { certificateId } = useParams<{ certificateId: string }>()

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ['public-certificate', certificateId],
    queryFn: () => getPublicCertificate(certificateId!),
    retry: false
  })

  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const { requestPdfDownload } = await import('../../services/certificate.service')
      const res = await requestPdfDownload(certificateId!)
      const binaryString = window.atob((res as any).data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
    } catch (e) {
      console.error(e)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </PageWrapper>
    )
  }

  if (isError || !cert) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-fg mb-2">Certificate Not Found</h1>
          <p className="text-muted">This certificate ID does not exist in our records.</p>
        </div>
      </PageWrapper>
    )
  }

  const isRevoked = cert.status === 'revoked'

  return (
    <PageWrapper className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mx-auto mb-6">
          <Award size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-fg tracking-tight mb-2">Certificate Verification</h1>
        <p className="text-muted font-medium">Verify the authenticity of a VeoLMS certificate</p>
      </div>

      <Card className="p-8 border-line/50 overflow-hidden relative shadow-lg max-w-5xl mx-auto my-6">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isRevoked ? 'bg-danger' : 'bg-success'}`} />

        <div className="flex flex-col items-center text-center">
          {isRevoked ? (
            <>
              <div className="w-20 h-20 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-6">
                <XCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-danger mb-2">Certificate Revoked</h2>
              <p className="text-muted mb-8 max-w-md">
                This certificate has been revoked by the platform administrators and is no longer valid.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-success mb-2">Verified & Authentic</h2>
              <p className="text-muted mb-8 max-w-md">
                This certificate is officially issued by VeoLMS and remains in good standing.
              </p>
            </>
          )}

          <div className="w-full bg-surface2/50 rounded-2xl p-6 border border-line/50 text-left mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Student Name</p>
              <p className="font-bold text-fg text-lg">{cert.studentName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Course Completed</p>
              <p className="font-bold text-fg text-lg">{cert.courseName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Issue Date</p>
              <p className="font-bold text-fg">{new Date(cert.issuedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Certificate ID</p>
              <p className="font-mono font-bold text-fg">{cert.certificateId}</p>
            </div>
          </div>

          {!isRevoked && (
            <Button onClick={handleDownload} disabled={isDownloading} isLoading={isDownloading} size="lg">
              View Original PDF
            </Button>
          )}
        </div>
      </Card>
    </PageWrapper>
  )
}
