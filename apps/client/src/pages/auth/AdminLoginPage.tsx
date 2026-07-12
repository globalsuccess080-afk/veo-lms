import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@veolms/shared'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, type Variants } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { adminLogin } from '../../services/auth.service'
import { useAuthStore } from '../../store/authStore'
import { AuthShell } from '../../components/auth/AuthShell'
import { Button } from '../../components/ui/Button'
import { Input, Field } from '../../components/ui/Input'
import { queryClient } from '../../lib/queryClient'

type FormData = z.infer<typeof loginSchema>

const itemVars: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const result = await adminLogin(data.email, data.password)
      setAuth(result.user, result.accessToken)
      queryClient.removeQueries()
      toast.success('Welcome back, admin')
      navigate('/admin')
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || 'The admin email or password you entered is incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Admin Portal"
      subtitle="Restricted access — administrators only"
      highlight="Manage your platform."
      footer={<><Link to="/login" className="text-primary font-bold hover:underline transition-all inline-flex items-center gap-1"><span aria-hidden="true">&larr;</span> Student login</Link></>}
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 mb-6 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold shadow-inner"
      >
        <ShieldCheck size={18} strokeWidth={2.5} />
        Secured admin access
      </motion.div>

      <motion.form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-5"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={itemVars}>
          <Field label="Admin email" error={errors.email?.message}>
            <Input type="email" placeholder="admin@veolms.com" className="h-12 text-[15px] bg-canvas hover:border-line-strong focus:bg-canvas transition-all" {...register('email')} />
          </Field>
        </motion.div>
        
        <motion.div variants={itemVars}>
          <Field label="Password" error={errors.password?.message}>
            <Input type="password" placeholder="••••••••" className="h-12 text-[15px] bg-canvas hover:border-line-strong focus:bg-canvas transition-all" {...register('password')} />
          </Field>
        </motion.div>
        
        <motion.div variants={itemVars} className="pt-2">
          <Button type="submit" loading={loading} className="w-full h-12 text-[15px] font-bold shadow-soft" size="lg">Sign In to Admin</Button>
        </motion.div>
      </motion.form>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 rounded-xl border border-primary/20 bg-primary/5 text-[13px] text-muted flex flex-col items-center text-center"
      >
        <p className="font-bold text-primary mb-1 uppercase tracking-wider text-[10px]">Demo Admin</p>
        <p className="font-mono text-fg">admin@veolms.com <span className="text-line-strong mx-2">|</span> Admin@123456</p>
      </motion.div>
    </AuthShell>
  )
}
