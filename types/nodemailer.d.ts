declare module "nodemailer" {
    export interface SendMailOptions {
        from?: string;
        to?: string | string[];
        subject?: string;
        text?: string;
        html?: string;
        [key: string]: unknown;
    }

    export interface Transporter {
        sendMail(options: SendMailOptions): Promise<{
            messageId: string;
            accepted: string[];
            rejected: string[];
            response: string;
            [key: string]: unknown;
        }>;
    }

    export interface TransportOptions {
        host?: string;
        port?: number;
        secure?: boolean;
        auth?: {
            user?: string;
            pass?: string;
        };
        [key: string]: unknown;
    }

    export function createTransport(options: TransportOptions): Transporter;
}
