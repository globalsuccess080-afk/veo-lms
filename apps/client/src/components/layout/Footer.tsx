import { Link } from 'react-router-dom'
import { 
  Github, Twitter, Linkedin, Youtube, Mail, Phone, MapPin, 
  BookOpen, PlayCircle, Award, Compass, 
  MessageSquare, LifeBuoy, Bug, ThumbsUp 
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

function SocialLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a 
      href={href} 
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
      style={{
        background: hovered ? 'var(--primary)' : 'var(--surface2)',
        color: hovered ? 'var(--primary-fg)' : 'var(--muted)',
        border: `1px solid ${hovered ? 'var(--primary)' : 'var(--border)'}`,
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 4px 12px color-mix(in srgb, var(--primary) 30%, transparent)' : 'none'
      }}
    >
      <Icon size={16} />
    </a>
  )
}

function FooterLink({ to, label, icon: Icon }: { to: string; label: string; icon: any }) {
  return (
    <li>
      <Link to={to} className="text-[13px] text-muted hover:text-primary transition-all duration-200 flex items-center gap-2 group">
        <Icon size={15} className="text-muted opacity-60 group-hover:opacity-100 group-hover:text-primary transition-colors duration-200" />
        {label}
      </Link>
    </li>
  )
}

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-transparent">
      <div className="absolute inset-x-0 top-0 h-[1.5px] pointer-events-none z-20" style={{
          background: `linear-gradient(90deg, transparent 10%, color-mix(in srgb, var(--primary) 60%, transparent) 50%, transparent 90%)`,
      }} />

      {/* Background Gradients & Patterns */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.05] dark:opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.08] dark:opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />

        {/* Polished Curve Overlay */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.02]" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="var(--fg)" d="M0,160L48,170.7C96,181,192,203,288,213.3C384,224,480,224,576,213.3C672,203,768,181,864,176C960,171,1056,181,1152,192C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>

        {/* Grid pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.5 }} />
        
        {/* Fade mask for grid */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/10" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
          {/* Column 1: Brand & Description */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-primary shadow-sm"
                style={{ background: 'var(--primary-subtle)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' }}
              >
                <img src="/logo.png" alt="VeoLMS" className="w-full h-full object-contain" />
              </motion.div>
              <span className="font-extrabold text-[1.4rem] tracking-tight text-fg group-hover:text-primary transition-colors">VeoLMS</span>
            </Link>
            <p className="text-[14px] leading-relaxed max-w-[380px]" style={{ color: 'var(--fg-muted)' }}>
              Learn industry-relevant skills through structured courses, hands-on projects, and real-world learning experiences.
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-2.5 text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                <Mail size={14} className="text-primary" />
                <span>support@veolms.com</span>
              </div>
              <div className="flex items-center gap-2.5 text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                <Phone size={14} className="text-primary" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2.5 text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                <MapPin size={14} className="text-primary" />
                <span>123 Education Lane, Tech City, TC 90210</span>
              </div>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="lg:col-span-3">
            <h4 className="font-bold text-[15px] mb-5" style={{ color: 'var(--fg)' }}>Explore</h4>
            <ul className="space-y-3.5">
              <FooterLink to="/search" label="Courses" icon={BookOpen} />
              <FooterLink to="/dashboard" label="My Learning" icon={PlayCircle} />
              <FooterLink to="/profile?tab=certificates" label="Certificates" icon={Award} />
              <FooterLink to="/search" label="Explore Courses" icon={Compass} />
            </ul>
          </div>

          {/* Column 3: Support Links */}
          <div className="lg:col-span-4">
            <h4 className="font-bold text-[15px] mb-5" style={{ color: 'var(--fg)' }}>Support</h4>
            <ul className="space-y-3.5 mb-8">
              <FooterLink to="/contact" label="Contact Us" icon={MessageSquare} />
              <FooterLink to="/contact" label="Help Center" icon={LifeBuoy} />
              <FooterLink to="/contact" label="Report Issue" icon={Bug} />
              <FooterLink to="/contact" label="Feedback" icon={ThumbsUp} />
            </ul>

            <h4 className="font-bold text-[13px] mb-4 uppercase tracking-wider" style={{ color: 'var(--fg-subtle)' }}>Connect With Us</h4>
            <div className="flex gap-3">
              <SocialLink href="#" icon={Youtube} label="YouTube" />
              <SocialLink href="#" icon={Linkedin} label="LinkedIn" />
              <SocialLink href="#" icon={Twitter} label="Twitter" />
              <SocialLink href="#" icon={Github} label="GitHub" />
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid color-mix(in srgb, var(--border) 50%, transparent)' }}>
          <p className="text-[12px] font-medium" style={{ color: 'var(--fg-subtle)' }}>
            © {new Date().getFullYear()} VeoLMS. Empowering learners worldwide.
          </p>
          <div className="flex items-center gap-6 text-[12px] font-medium" style={{ color: 'var(--fg-subtle)' }}>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
