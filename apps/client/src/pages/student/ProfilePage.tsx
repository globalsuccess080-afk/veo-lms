import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { User as UserIcon, Lock, Palette, Check } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { updateProfile, changePassword } from '../../services/user.service'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Card } from '../../components/ui/Card'
import { Input, Field } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { MODE_OPTIONS, ACCENT_OPTIONS } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { ProfileSkeleton } from '../../components/skeletons/student/ProfileSkeleton'

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVars: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function ProfilePage() {
  const { user, setAuth, accessToken } = useAuthStore()
  const { mode, accent, radiusVariant, setMode, setAccent, setRadiusVariant } = useThemeStore()
  const [name, setName] = useState(user?.name || '')
  const [pw, setPw] = useState({ current: '', next: '' })

  const profileMut = useMutation({
    mutationFn: () => updateProfile(name),
    onSuccess: (u) => {
      if (accessToken) setAuth(u, accessToken)
      toast.success('Profile updated')
    },
    onError: () => toast.error('Failed to update profile')
  })

  const passwordMut = useMutation({
    mutationFn: () => changePassword(pw.current, pw.next),
    onSuccess: () => {
      toast.success('Password changed')
      setPw({ current: '', next: '' })
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed to change password')
  })

  if (!user) return <ProfileSkeleton />

  return (
    <PageWrapper>
      <motion.div initial="hidden" animate="show" variants={containerVars} className="max-w-4xl mx-auto px-4 py-10 lg:py-12">
        <motion.div variants={itemVars} className="mb-10 text-center lg:text-left">
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-2 text-fg tracking-tight">Profile Settings</h1>
          <p className="text-[15px] font-medium text-muted">Manage your account and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <motion.div variants={itemVars}>
              <Card className="p-6 lg:p-8 border-line/80 shadow-sm bg-surface/50 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                  <Avatar name={user?.name} src={user?.avatar} size={80} className="shadow-md ring-4 ring-primary-subtle" />
                  <div className="text-center sm:text-left">
                    <p className="font-extrabold text-2xl text-fg tracking-tight">{user?.name}</p>
                    <p className="text-[15px] text-muted mb-2">{user?.email}</p>
                    <span className="inline-block text-[11px] font-bold text-primary bg-primary-subtle border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">{user?.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-6 text-[15px] font-bold text-fg uppercase tracking-wide border-b border-line/80 pb-3">
                  <UserIcon size={18} className="text-primary" /> Account details
                </div>
                <div className="space-y-5">
                  <Field label="Full name">
                    <Input className="h-12 bg-canvas hover:border-line-strong transition-colors" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <Input className="h-12 bg-canvas/50 text-muted" value={user?.email || ''} disabled />
                  </Field>
                  <div className="pt-2">
                    <Button onClick={() => profileMut.mutate()} loading={profileMut.isPending} disabled={!name || name === user?.name} className="h-11 px-6 font-bold shadow-soft">
                      Save changes
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={itemVars}>
              <Card className="p-6 lg:p-8 border-line/80 shadow-sm bg-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-2.5 mb-6 text-[15px] font-bold text-fg uppercase tracking-wide border-b border-line/80 pb-3">
                  <Lock size={18} className="text-primary" /> Change password
                </div>
                <div className="space-y-5">
                  <Field label="Current password">
                    <Input type="password" placeholder="••••••••" className="h-12 bg-canvas hover:border-line-strong transition-colors" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
                  </Field>
                  <Field label="New password">
                    <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="At least 8 characters" className="h-12 bg-canvas hover:border-line-strong transition-colors" />
                  </Field>
                  <div className="pt-2">
                    <Button onClick={() => passwordMut.mutate()} loading={passwordMut.isPending} disabled={!pw.current || pw.next.length < 8} className="h-11 px-6 font-bold shadow-soft">
                      Update password
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-4">
            <motion.div variants={itemVars} className="sticky top-24">
              <Card className="p-6 border-line/80 shadow-sm bg-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-2.5 mb-6 text-[15px] font-bold text-fg uppercase tracking-wide border-b border-line/80 pb-3">
                  <Palette size={18} className="text-primary" /> Appearance
                </div>

                <p className="text-[13px] font-bold text-muted mb-3 uppercase tracking-wide">Mode</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {MODE_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 py-4 rounded-xl border-b-2 transition-all shadow-sm',
                        mode === m.id ? 'border-primary bg-primary-subtle/50 text-primary' : 'border-transparent bg-canvas hover:bg-surface2 text-muted hover:text-fg'
                      )}
                    >
                      <m.icon size={22} strokeWidth={2} />
                      <span className="text-[12px] font-bold">{m.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[13px] font-bold text-muted mb-3 uppercase tracking-wide">Accent color</p>
                <div className="flex flex-wrap gap-4 mb-8">
                  {ACCENT_OPTIONS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAccent(a.id)}
                      title={a.label}
                      className={cn(
                        'w-10 h-10 rounded-full grid place-items-center transition-all hover:scale-110 shadow-sm',
                        accent === a.id && 'ring-[3px] ring-offset-2 ring-offset-surface'
                      )}
                      style={{ background: a.color, ...(accent === a.id ? { ['--tw-ring-color' as string]: a.color } : {}) }}
                    >
                      {accent === a.id && <Check size={18} className="text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>

                <p className="text-[13px] font-bold text-muted mb-3 uppercase tracking-wide">Corner style</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['round', 'sharp'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadiusVariant(r)}
                      className={cn(
                        'px-4 py-3 rounded-xl text-[13px] font-bold border-b-2 capitalize transition-all shadow-sm',
                        radiusVariant === r ? 'border-primary bg-primary-subtle/50 text-primary' : 'border-transparent bg-canvas hover:bg-surface2 text-muted hover:text-fg'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </PageWrapper>
  )
}
