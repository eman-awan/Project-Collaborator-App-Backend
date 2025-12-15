import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(private config: ConfigService) {
        const temp = {
            host: this.config.get('MAIL_HOST'),
            port: this.config.get('MAIL_PORT'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.config.get('MAIL_USER'),
                pass: this.config.get('MAIL_PASSWORD'),
            },
            tls: {
                rejectUnauthorized: false, // <-- ADD THIS LINE
            },
        };
        this.transporter = nodemailer.createTransport(temp);
    }

    async sendVerificationEmail(email: string, otp: string) {
        const mailOptions = {
            from: this.config.get('MAIL_FROM'),
            to: email,
            subject: 'Email Verification - OTP Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p>Thank you for signing up! Please use the following OTP code to verify your email address:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #4CAF50; letter-spacing: 5px; margin: 0;">${otp}</h1>
                    </div>
                    <p>This code will expire in ${this.config.get('OTP_EXPIRY_MINUTES')} minutes.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    async sendPasswordResetEmail(email: string, otp: string) {
        const mailOptions = {
            from: this.config.get('MAIL_FROM'),
            to: email,
            subject: 'Password Reset - OTP Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>You requested to reset your password. Please use the following OTP code:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #FF5722; letter-spacing: 5px; margin: 0;">${otp}</h1>
                    </div>
                    <p>This code will expire in ${this.config.get('OTP_EXPIRY_MINUTES')} minutes.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        If you didn't request this, please ignore this email and your password will remain unchanged.
                    </p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
}