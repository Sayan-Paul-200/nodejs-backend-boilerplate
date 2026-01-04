import nodemailer from "nodemailer";
import { getInvitationEmailHtml } from "../templates/invitation-template";
import { getResetPasswordEmailHtml } from "../templates/reset-password";
import { env } from "../config/env";

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    if (
      env.SMTP_HOST &&
      env.SMTP_USER &&
      env.SMTP_PASS
    ) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT) || 587,
        secure: env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      this.isConfigured = true;
      console.log("✅ Email Service: SMTP Configured");
    } else {
      console.warn("⚠️ Email Service: SMTP credentials missing. Emails will be logged to console only.");
    }
  }

  async sendInvite(to: string, inviteUrl: string, orgName: string) {
    const html = getInvitationEmailHtml(inviteUrl, orgName, to);
    const subject = `Invitation to join ${orgName}`;

    if (!this.isConfigured || !this.transporter) {
      this.logMockEmail(to, subject, inviteUrl);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${env.FROM_NAME || "MySaaS"}" <${env.FROM_EMAIL || "no-reply@example.com"}>`,
        to,
        subject,
        html,
      });
      console.log(`📧 Email sent successfully to ${to}`);
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      // Fallback to console log so dev doesn't get stuck
      this.logMockEmail(to, subject, inviteUrl);
    }
  }

  async sendPasswordReset(to: string, token: string) {
    const baseUrl = env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    const html = getResetPasswordEmailHtml(resetUrl);
    
    // ... reused logic from sendInvite (checking transporter etc.) ...
    
    if (!this.isConfigured || !this.transporter) {
      console.log(`[MOCK EMAIL] Password Reset Link: ${resetUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: env.FROM_EMAIL,
      to,
      subject: "Reset Your Password",
      html,
    });
  }

  private logMockEmail(to: string, subject: string, link: string) {
    console.log(`
    ================ [MOCK EMAIL] ================
    TO: ${to}
    SUBJECT: ${subject}
    LINK: ${link}
    ==============================================
    `);
  }
}

export const emailService = new EmailService();