export function generateOtpEmail(name: string, otp: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center;">Welcome to VeoLMS, ${name}!</h2>
      <p style="font-size: 16px; color: #333;">You are one step away from creating your account. Please use the following One-Time Password (OTP) to verify your email address:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #fff; background-color: #2563eb; border-radius: 8px; letter-spacing: 5px;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #666;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">If you didn't request this email, please ignore it.</p>
    </div>
  `;
}

export function generateWelcomeEmail(name: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center;">Registration Successful!</h2>
      <p style="font-size: 16px; color: #333;">Hi ${name},</p>
      <p style="font-size: 16px; color: #333;">Your email has been successfully verified, and your VeoLMS account has been created.</p>
      <p style="font-size: 16px; color: #333;">You can now browse our catalog and start learning.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{APP_URL}}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: bold; color: #fff; background-color: #2563eb; text-decoration: none; border-radius: 8px;">Explore Courses</a>
      </div>
    </div>
  `;
}

export function generateEnrollmentEmail(courseTitle: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #10b981; text-align: center;">Enrollment Confirmed!</h2>
      <p style="font-size: 16px; color: #333;">You have successfully enrolled in the course:</p>
      <h3 style="color: #333; text-align: center;">${courseTitle}</h3>
      <p style="font-size: 16px; color: #333;">You can start learning right away by going to your dashboard.</p>
    </div>
  `;
}

export function generatePaymentEmail(name: string, amount: number, courseTitle: string, orderId: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center;">Payment Receipt</h2>
      <p style="font-size: 16px; color: #333;">Hi ${name},</p>
      <p style="font-size: 16px; color: #333;">Thank you for your purchase. We have successfully received your payment.</p>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin: 5px 0;"><strong>Course:</strong> ${courseTitle}</p>
        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${(amount / 100).toFixed(2)}</p>
      </div>
      <p style="font-size: 14px; color: #666;">You can download your detailed invoice from your dashboard.</p>
    </div>
  `;
}

export function generateCourseUpdateEmail(courseTitle: string, message: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #f59e0b; text-align: center;">Course Update: ${courseTitle}</h2>
      <p style="font-size: 16px; color: #333;">An update has been made to a course you are enrolled in.</p>
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
        <p style="font-size: 15px; color: #b45309; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
      </div>
      <p style="font-size: 16px; color: #333;">Visit the course page to see the latest content.</p>
    </div>
  `;
}

export function generatePasswordResetEmail(name: string, otp: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center;">Reset Your Password</h2>
      <p style="font-size: 16px; color: #333;">Hi ${name},</p>
      <p style="font-size: 16px; color: #333;">We received a request to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #fff; background-color: #2563eb; border-radius: 8px; letter-spacing: 5px;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #666;">This OTP is valid for 10 minutes. If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</p>
    </div>
  `;
}
