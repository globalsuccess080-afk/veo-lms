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
  if (!transporter || !env.SMTP_USER) {
    logger.warn(`Email not sent (SMTP_USER or SMTP_PASS missing): ${options.subject} to ${options.to}`)
    return null
  }

  try {
    const info = await transporter.sendMail({
      from: `"VeoLMS" <${env.SMTP_USER}>`,
      ...options
    })
    logger.info(`Email sent: ${info.messageId}`)
    return info
  } catch (error) {
    logger.error('Error sending email:', error)
    throw error
  }
}
