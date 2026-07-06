import { Link } from 'react-router-dom'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { buttonClass } from '../../components/ui/Button'
import { FileQuestion } from 'lucide-react'

export function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <FileQuestion className="w-16 h-16 text-primary" />
        </div>
        <p className="text-8xl font-bold gradient-text">404</p>
        <h1 className="text-2xl font-bold mt-4">Page not found</h1>
        <p className="text-muted mt-2 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className={buttonClass('primary', 'lg', 'mt-8')}>Back to Home</Link>
      </div>
    </PageWrapper>
  )
}
