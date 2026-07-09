import nodemailer from 'nodemailer'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'

const smtpPort = env.SMTP_PORT || 465
const smtpHost = env.SMTP_HOST || 'smtp.gmail.com'
const smtpSecure = smtpPort === 465

type EmailProvider = 'resend' | 'smtp' | 'none'

function normalizeSmtpPass(pass: string): string {
  // Google App Passwords are shown with spaces; SMTP expects the 16-char string.
  return pass.replace(/\s+/g, '')
}

function getFromAddress(): string {
  return (
    env.EMAIL_FROM ||
    env.SMTP_FROM ||
    (env.SMTP_USER ? `"VeoLMS" <${env.SMTP_USER}>` : '"VeoLMS" <onboarding@resend.dev>')
  )
}

function getEmailProvider(): EmailProvider {
  if (env.RESEND_API_KEY) return 'resend'
  if (env.SMTP_USER && env.SMTP_PASS) return 'smtp'
  return 'none'
}

const activeProvider = getEmailProvider()
if (env.NODE_ENV === 'production' && activeProvider === 'smtp') {
  logger.warn(
    'Outbound SMTP is blocked on Railway Hobby/Trial plans (ports 25/465/587). ' +
      'Emails will time out in production. Set RESEND_API_KEY to send via HTTPS API instead.'
  )
}

function createSmtpTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASS) return null
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: env.SMTP_USER,
      pass: normalizeSmtpPass(env.SMTP_PASS),
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  })
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
}

interface ResendErrorBody {
  message?: string
  name?: string
}

async function sendViaResend(options: SendEmailOptions) {
  const recipients = Array.isArray(options.to) ? options.to : [options.to]

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  })

  const body = (await response.json().catch(() => ({}))) as ResendErrorBody & { id?: string }

  if (!response.ok) {
    throw new Error(body.message || `Resend API error (${response.status})`)
  }

  return {
    messageId: body.id,
    response: `Resend accepted: ${body.id}`,
  }
}

export async function sendEmail(options: SendEmailOptions) {
  const provider = getEmailProvider()

  logger.info('sendEmail invoked', {
    to: options.to,
    subject: options.subject,
    provider,
    smtpConfigured: provider === 'smtp',
    resendConfigured: provider === 'resend',
    smtpHost: provider === 'smtp' ? smtpHost : undefined,
    smtpPort: provider === 'smtp' ? smtpPort : undefined,
    smtpSecure: provider === 'smtp' ? smtpSecure : undefined,
    smtpUser: provider === 'smtp' ? env.SMTP_USER || null : null,
  })

  if (provider === 'none') {
    logger.warn('Email not sent because no email provider is configured', {
      to: options.to,
      subject: options.subject,
      smtpUserPresent: Boolean(env.SMTP_USER),
      smtpPassPresent: Boolean(env.SMTP_PASS),
      resendKeyPresent: Boolean(env.RESEND_API_KEY),
    })
    return null
  }

  try {
    if (provider === 'resend') {
      const info = await sendViaResend(options)
      logger.info('Email sent successfully via Resend', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
        response: info.response,
      })
      return info
    }

    const transporter = createSmtpTransporter()
    if (!transporter) return null

    const info = await transporter.sendMail({
      from: getFromAddress(),
      ...options,
    })
    logger.info('Email sent successfully via SMTP', {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
      response: info.response,
    })
    return info
  } catch (error) {
    const err = error as Error
    const isSmtpTimeout =
      provider === 'smtp' &&
      (err.message.includes('timeout') || err.message.includes('ETIMEDOUT'))

    logger.error('Error sending email', {
      to: options.to,
      subject: options.subject,
      provider,
      error: err.message,
      stack: err.stack,
      ...(isSmtpTimeout && env.NODE_ENV === 'production'
        ? {
            hint:
              'Railway Hobby blocks outbound SMTP. Add RESEND_API_KEY in Railway variables and redeploy.',
          }
        : {}),
    })
    throw error
  }
}
