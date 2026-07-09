import nodemailer from 'nodemailer'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'

const smtpPort = env.SMTP_PORT || 465
const smtpHost = env.SMTP_HOST || 'smtp.gmail.com'
const smtpSecure = smtpPort === 465

function createTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASS) return null
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
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

export async function sendEmail(options: SendEmailOptions) {
  const transporter = createTransporter()

  logger.info('sendEmail invoked', {
    to: options.to,
    subject: options.subject,
    smtpConfigured: Boolean(transporter),
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser: env.SMTP_USER || null,
  })

  if (!transporter) {
    logger.warn('Email not sent because SMTP is not configured', {
      to: options.to,
      subject: options.subject,
      smtpHost,
      smtpPort,
      smtpUserPresent: Boolean(env.SMTP_USER),
      smtpPassPresent: Boolean(env.SMTP_PASS),
    })
    return null
  }

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM || `"VeoLMS" <${env.SMTP_USER}>`,
      ...options
    })
    logger.info('Email sent successfully', {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
      response: info.response,
    })
    return info
  } catch (error) {
    const err = error as Error
    logger.error('Error sending email', {
      to: options.to,
      subject: options.subject,
      error: err.message,
      stack: err.stack,
    })
    throw error
  }
}
