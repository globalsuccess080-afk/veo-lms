import { MapPin, Mail, Phone, Send, Clock, MessageCircle, Github, Twitter, Linkedin, Youtube } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Navbar } from '../../components/layout/Navbar'

const CONTACT_INFO = [
  { icon: Mail, title: 'Email Us', text: 'support@veolms.com', subtext: 'Drop us a line anytime', href: 'mailto:support@veolms.com' },
  { icon: Phone, title: 'Call Us', text: '+1 (555) 123-4567', subtext: 'Mon-Fri from 8am to 5pm', href: 'tel:+15551234567' },
  { icon: MapPin, title: 'Visit Us', text: '123 Education Lane, Tech City, TC 90210', subtext: 'Headquarters', href: 'https://maps.google.com/?q=123+Education+Lane+Tech+City' },
  { icon: Clock, title: 'Working Hours', text: 'Mon-Fri: 9AM - 6PM (EST)', subtext: 'Weekends: Closed' },
]

export function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'var(--bg)' }}>
      {/* Unique Polished Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft, large background glows */}
        <div className="absolute -top-[20%] right-[10%] w-[1000px] h-[1000px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 60%)' }} />
        <div className="absolute top-[40%] left-[-15%] w-[800px] h-[800px] rounded-full opacity-[0.05] dark:opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 60%)' }} />
        
        {/* Elegant dotted grid pattern with fade mask */}
        <div className="absolute inset-0 opacity-[0.2] dark:opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, transparent 0%, var(--bg) 80%)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />
      </div>

      <Navbar />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative mt-[72px] z-10">
        {/* Left Side: Contact Info */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-24 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-6 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm"
              style={{ border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', background: 'var(--primary-subtle)' }}>
              Get in Touch
            </span>
            <h1 className="text-[2.5rem] lg:text-[3.2rem] font-extrabold leading-[1.05] tracking-tight mb-5" style={{ color: 'var(--fg)' }}>
              Let's start a <br /> conversation.
            </h1>
            <p className="text-[15px] leading-relaxed mb-10 max-w-[420px]" style={{ color: 'var(--fg-muted)' }}>
              We're here to help and answer any question you might have. We look forward to hearing from you!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {CONTACT_INFO.map(({ icon: Icon, title, text, subtext, href }) => {
                const Wrapper = href ? 'a' : 'div'
                return (
                  <Wrapper 
                    key={title} 
                    href={href}
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex flex-col gap-3 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden" 
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                  >
                    {/* Glowing Left Streak Border */}
                    <div className="absolute inset-y-0 left-0 w-[2.5px] bg-primary shadow-[0_0_12px_var(--primary)] opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Hover Gradient Background */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                      style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 80%)' }} />

                    <div className="relative z-10 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-fg shadow-sm" style={{ background: 'var(--primary-subtle)' }}>
                      <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[14px] font-bold group-hover:text-primary transition-colors duration-300" style={{ color: 'var(--fg)' }}>{title}</p>
                      <p className="text-[13px] font-medium mt-1 transition-colors duration-300" style={{ color: 'var(--fg-subtle)' }}>{text}</p>
                      <p className="text-[11px] mt-0.5 opacity-70" style={{ color: 'var(--fg-muted)' }}>{subtext}</p>
                    </div>
                  </Wrapper>
                )
              })}
            </div>

            {/* Social Media Links */}
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--fg-subtle)' }}>Follow our journey</p>
              <div className="flex gap-3">
                {[Twitter, Linkedin, Github, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:text-primary hover:border-primary"
                    style={{ background: 'var(--surface2)', color: 'var(--fg-muted)', border: '1px solid var(--border)' }}>
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Form & Clean Background */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-[480px]"
          >
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="h-[2px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />
              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MessageCircle size={20} />
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>Send us a message</h3>
                </div>

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>First Name</label>
                      <Input placeholder="John" className="bg-surface/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>Last Name</label>
                      <Input placeholder="Doe" className="bg-surface/50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>Email Address</label>
                    <Input type="email" placeholder="john@example.com" className="bg-surface/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold" style={{ color: 'var(--fg-muted)' }}>Message</label>
                    <textarea 
                      className="w-full min-h-[120px] p-3 text-[14px] rounded-xl outline-none transition-all resize-y"
                      style={{ 
                        background: 'color-mix(in srgb, var(--surface2) 50%, transparent)', 
                        border: '1px solid var(--border)', 
                        color: 'var(--fg)' 
                      }}
                      placeholder="How can we help you?"
                    />
                  </div>
                  <Button type="button" variant="primary" size="lg" className="w-full mt-2 group">
                    Send Message
                    <Send size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
