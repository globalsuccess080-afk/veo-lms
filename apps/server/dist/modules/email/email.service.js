"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
const smtpPort = env_1.env.SMTP_PORT || 465;
const smtpHost = env_1.env.SMTP_HOST || 'smtp.gmail.com';
const smtpSecure = smtpPort === 465;
function normalizeSmtpPass(pass) {
    // Google App Passwords are shown with spaces; SMTP expects the 16-char string.
    return pass.replace(/\s+/g, '');
}
function getFromAddress() {
    return (env_1.env.EMAIL_FROM ||
        env_1.env.SMTP_FROM ||
        (env_1.env.SMTP_USER ? `"VeoLMS" <${env_1.env.SMTP_USER}>` : '"VeoLMS" <onboarding@resend.dev>'));
}
function getEmailProvider() {
    if (env_1.env.RESEND_API_KEY)
        return 'resend';
    if (env_1.env.SMTP_USER && env_1.env.SMTP_PASS)
        return 'smtp';
    return 'none';
}
const activeProvider = getEmailProvider();
if (env_1.env.NODE_ENV === 'production' && activeProvider === 'smtp') {
    logger_1.logger.warn('Outbound SMTP is blocked on Railway Hobby/Trial plans (ports 25/465/587). ' +
        'Emails will time out in production. Set RESEND_API_KEY to send via HTTPS API instead.');
}
function createSmtpTransporter() {
    if (!env_1.env.SMTP_USER || !env_1.env.SMTP_PASS)
        return null;
    return nodemailer_1.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: env_1.env.SMTP_USER,
            pass: normalizeSmtpPass(env_1.env.SMTP_PASS),
        },
        tls: {
            rejectUnauthorized: false,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
    });
}
async function sendViaResend(options) {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env_1.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: getFromAddress(),
            to: recipients,
            subject: options.subject,
            html: options.html,
            text: options.text,
        }),
    });
    const body = (await response.json().catch(() => ({})));
    if (!response.ok) {
        throw new Error(body.message || `Resend API error (${response.status})`);
    }
    return {
        messageId: body.id,
        response: `Resend accepted: ${body.id}`,
    };
}
async function sendEmail(options) {
    const provider = getEmailProvider();
    logger_1.logger.info('sendEmail invoked', {
        to: options.to,
        subject: options.subject,
        provider,
        smtpConfigured: provider === 'smtp',
        resendConfigured: provider === 'resend',
        smtpHost: provider === 'smtp' ? smtpHost : undefined,
        smtpPort: provider === 'smtp' ? smtpPort : undefined,
        smtpSecure: provider === 'smtp' ? smtpSecure : undefined,
        smtpUser: provider === 'smtp' ? env_1.env.SMTP_USER || null : null,
    });
    if (provider === 'none') {
        logger_1.logger.warn('Email not sent because no email provider is configured', {
            to: options.to,
            subject: options.subject,
            smtpUserPresent: Boolean(env_1.env.SMTP_USER),
            smtpPassPresent: Boolean(env_1.env.SMTP_PASS),
            resendKeyPresent: Boolean(env_1.env.RESEND_API_KEY),
        });
        return null;
    }
    try {
        if (provider === 'resend') {
            const info = await sendViaResend(options);
            logger_1.logger.info('Email sent successfully via Resend', {
                to: options.to,
                subject: options.subject,
                messageId: info.messageId,
                response: info.response,
            });
            return info;
        }
        const transporter = createSmtpTransporter();
        if (!transporter)
            return null;
        const info = await transporter.sendMail({
            from: getFromAddress(),
            ...options,
        });
        logger_1.logger.info('Email sent successfully via SMTP', {
            to: options.to,
            subject: options.subject,
            messageId: info.messageId,
            response: info.response,
        });
        return info;
    }
    catch (error) {
        const err = error;
        const isSmtpTimeout = provider === 'smtp' &&
            (err.message.includes('timeout') || err.message.includes('ETIMEDOUT'));
        logger_1.logger.error('Error sending email', {
            to: options.to,
            subject: options.subject,
            provider,
            error: err.message,
            stack: err.stack,
            ...(isSmtpTimeout && env_1.env.NODE_ENV === 'production'
                ? {
                    hint: 'Railway Hobby blocks outbound SMTP. Add RESEND_API_KEY in Railway variables and redeploy.',
                }
                : {}),
        });
        throw error;
    }
}
