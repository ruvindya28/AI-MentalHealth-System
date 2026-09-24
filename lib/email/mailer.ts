import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter {
    if (!transporter) {
        const host = process.env.SMTP_HOST || "smtp.gmail.com";
        const port = Number(process.env.SMTP_PORT || "465");
        const secure = process.env.SMTP_SECURE !== undefined 
            ? process.env.SMTP_SECURE === "true" 
            : port === 465;
        
        const user = process.env.SMTP_USER;
        // Strip spaces if user pasted an app password like "iaon krds cgae hgaj"
        const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, "") : undefined;

        if (!user || !pass) {
            throw new Error("SMTP_USER or SMTP_PASS is missing in environment variables.");
        }

        transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user,
                pass,
            },
        });
    }

    return transporter;
}

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}): Promise<void> {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@mindcare.com";
    const fromName = process.env.EMAIL_FROM_NAME || "MindCare";
    
    const mailer = getEmailTransporter();
    
    await mailer.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to,
        subject,
        html,
    });
}
