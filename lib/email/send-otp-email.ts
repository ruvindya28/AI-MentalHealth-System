import { sendEmail } from "@/lib/email/mailer";

interface SendOtpEmailParams {
    to: string;
    name: string;
    code: string;
}

export async function sendOtpEmail({ to, name, code }: SendOtpEmailParams): Promise<void> {
    await sendEmail({
        to,
        subject: "Your MindCare verification code",
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #2e3547; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="color: #3b82f6; margin-top: 0;">Verify your email</h2>
                <p>Hi ${name || "there"},</p>
                <p>Please use the following 6-digit code to complete your verification with MindCare. This code expires in 10 minutes.</p>
                <div style="margin: 28px 0; text-align: center;">
                    <div style="display: inline-block; background: #f1f5f9; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #1e293b; padding: 14px 28px; border-radius: 12px; border: 1px dashed #cbd5e1;">
                        ${code}
                    </div>
                </div>
                <p style="color: #64748b; font-size: 13px;">
                    If you did not request this verification, you can safely ignore this email.
                </p>
            </div>
        `,
    });
}
