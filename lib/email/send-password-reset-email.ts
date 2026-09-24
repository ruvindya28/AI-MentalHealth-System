import { sendEmail } from "@/lib/email/mailer";

interface SendPasswordResetEmailParams {
    to: string;
    name: string;
    resetUrl: string;
}

export async function sendPasswordResetEmail({
    to,
    name,
    resetUrl,
}: SendPasswordResetEmailParams): Promise<void> {
    await sendEmail({
        to,
        subject: "Reset your MindCare password",
        html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #2e3547; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="color: #4a5568; margin-top: 0;">Reset your password</h2>
                <p>Hi ${name || "there"},</p>
                <p>We received a request to reset your MindCare password. This link expires in 1 hour.</p>
                <p style="margin: 24px 0;">
                    <a href="${resetUrl}" style="background: #8b9eff; color: #1e2233; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">
                        Reset Password
                    </a>
                </p>
                <p style="color: #64748b; font-size: 13px;">
                    If you didn't request this, you can safely ignore this email — your password won't change.
                </p>
            </div>
        `,
    });
}
