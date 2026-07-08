import { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function PageWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={['min-h-screen flex flex-col bg-canvas', className].filter(Boolean).join(' ')}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
