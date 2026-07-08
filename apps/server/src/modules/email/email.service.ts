import nodemailer from 'nodemailer'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'

const transporter = (env.SMTP_USER && env.SMTP_PASS) ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
}) : null

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
}

export async function sendEmail(options: SendEmailOptions) {
  logger.info('sendEmail invoked', {
    to: options.to,
    subject: options.subject,
    smtpConfigured: Boolean(transporter && env.SMTP_USER && env.SMTP_PASS),
    smtpUser: env.SMTP_USER || null,
  })

  if (!transporter || !env.SMTP_USER) {
    logger.warn('Email not sent because SMTP is not configured', {
      to: options.to,
      subject: options.subject,
      smtpUserPresent: Boolean(env.SMTP_USER),
      smtpPassPresent: Boolean(env.SMTP_PASS),
    })
    return null
  }

  try {
    const info = await transporter.sendMail({
      from: `"VeoLMS" <${env.SMTP_USER}>`,
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
