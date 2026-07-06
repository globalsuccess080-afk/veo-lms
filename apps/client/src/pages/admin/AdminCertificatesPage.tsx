import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminCertificates, revokeCertificate } from '../../services/certificate.service'
import { AdminPage, Table } from '../../components/admin/AdminPage'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Loader2, ExternalLink, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export function AdminCertificatesPage() {
  const queryClient = useQueryClient()

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: getAdminCertificates
  })

  const { mutate: handleRevoke, isPending } = useMutation({
    mutationFn: revokeCertificate,
    onSuccess: () => {
      toast.success('Certificate revoked successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-certificates'] })
    },
    onError: () => toast.error('Failed to revoke certificate')
  })

  if (isLoading) {
    return (
      <AdminPage title="Certificates">
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
      </AdminPage>
    )
  }

  return (
    <AdminPage title="Certificates" subtitle="Manage and revoke student certificates">
      <Card className="overflow-hidden border-line/50">
        <Table head={['Student', 'Course', 'Certificate ID', 'Issued', 'Status', 'Actions']}>
          {certificates?.map((cert) => (
            <tr key={cert._id} className="border-b border-line/50 last:border-0 hover:bg-surface2/30 transition-colors">
              <td className="px-5 py-4 font-bold text-fg">{cert.userId?.name}</td>
              <td className="px-5 py-4 text-muted">{cert.courseId?.title}</td>
              <td className="px-5 py-4 font-mono font-medium text-fg">{cert.certificateId}</td>
              <td className="px-5 py-4 text-muted">{new Date(cert.issuedAt).toLocaleDateString()}</td>
              <td className="px-5 py-4">
                <Badge tone={cert.status === 'active' ? 'success' : 'danger'}>
                  {cert.status.toUpperCase()}
                </Badge>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <Link to={`/certificate/${cert.certificateId}`} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-strong transition-colors" title="View Certificate">
                    <ExternalLink size={18} />
                  </Link>
                  {cert.status === 'active' && (
                    <button 
                      onClick={() => handleRevoke(cert.certificateId)} 
                      disabled={isPending}
                      className="text-danger hover:text-danger-strong transition-colors"
                      title="Revoke Certificate"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {(!certificates || certificates.length === 0) && (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-muted">No certificates generated yet.</td>
            </tr>
          )}
        </Table>
      </Card>
    </AdminPage>
  )
}
