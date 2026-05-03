import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

import { NotificationChannel, NotificationStatus } from '../types/enums';


// Initialize mailer
const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
});

// Initialize Twilio client (only if credentials are provided)
const twilioClient =
    config.twilio.accountSid && config.twilio.authToken
        ? twilio(config.twilio.accountSid, config.twilio.authToken)
        : null;

export const notificationService = {
    /**
     * Send an SMS via Twilio
     */
    async sendSMS(to: string, message: string): Promise<void> {
        if (!twilioClient) {
            logger.warn('Twilio not configured — SMS skipped', { to });
            return;
        }
        await twilioClient.messages.create({
            from: config.twilio.phoneNumber,
            to,
            body: message,
        });
    },

    /**
     * Send a WhatsApp message via Twilio WhatsApp
     */
    async sendWhatsApp(to: string, message: string): Promise<void> {
        if (!twilioClient) {
            logger.warn('Twilio not configured — WhatsApp skipped', { to });
            return;
        }
        await twilioClient.messages.create({
            from: config.twilio.whatsappFrom,
            to: `whatsapp:${to}`,
            body: message,
        });
    },

    /**
     * Send an email via SMTP
     */
    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        if (!config.smtp.user || !config.smtp.pass) {
            logger.warn('SMTP not configured — Email skipped', { to });
            return;
        }
        await transporter.sendMail({
            from: config.smtp.from,
            to,
            subject,
            html,
        });
    },

    /**
     * Send a payment confirmation notification to parent/student
     */
    async sendPaymentConfirmation(
        recipientPhone: string | null,
        recipientEmail: string | null,
        studentName: string,
        amount: number, // in paise
        receiptNumber: string,
        paymentMode: string,
        triggeredById: string
    ): Promise<void> {
        const rupees = (amount / 100).toFixed(2);
        const smsMessage = `Dear Parent, Fee payment of ₹${rupees} for ${studentName} has been received successfully. Receipt No: ${receiptNumber}. Mode: ${paymentMode}. Thank you - ${config.school.name}`;

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1a3a7c; padding: 24px; color: white;">
          <h2 style="margin: 0">${config.school.name}</h2>
          <p style="margin: 4px 0; opacity: 0.8;">Fee Payment Confirmation</p>
        </div>
        <div style="padding: 24px;">
          <p>Dear Parent / Guardian,</p>
          <p>We are pleased to confirm the receipt of the following fee payment:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f5f5f5"><td style="padding: 8px; font-weight: bold">Student Name</td><td style="padding: 8px">${studentName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold">Amount Paid</td><td style="padding: 8px; color: #2196F3"><strong>₹${rupees}</strong></td></tr>
            <tr style="background: #f5f5f5"><td style="padding: 8px; font-weight: bold">Payment Mode</td><td style="padding: 8px">${paymentMode}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold">Receipt Number</td><td style="padding: 8px">${receiptNumber}</td></tr>
            <tr style="background: #f5f5f5"><td style="padding: 8px; font-weight: bold">Date & Time</td><td style="padding: 8px">${new Date().toLocaleString('en-IN')}</td></tr>
          </table>
          <p style="color: #666; font-size: 13px;">Please retain this receipt for your records. You can download the PDF receipt from the school portal.</p>
        </div>
        <div style="background: #f9f9f9; padding: 16px; text-align: center; color: #888; font-size: 12px;">
          ${config.school.name} | ${config.school.address} | ${config.school.phone}
        </div>
      </div>
    `;

        const notificationsToCreate: Array<{
            channel: NotificationChannel;
            recipient: string;
            subject?: string;
            message: string;
            triggeredBy: string;
        }> = [];

        // Attempt SMS
        if (recipientPhone) {
            try {
                await this.sendSMS(recipientPhone, smsMessage);
                notificationsToCreate.push({
                    channel: NotificationChannel.SMS,
                    recipient: recipientPhone,
                    message: smsMessage,
                    triggeredBy: triggeredById,
                });
            } catch (err) {
                logger.error('SMS send failed', { err, recipientPhone });
                await prisma.notification.create({
                    data: {
                        channel: NotificationChannel.SMS,
                        recipient: recipientPhone,
                        message: smsMessage,
                        status: NotificationStatus.FAILED,
                        error: String(err),
                        triggeredBy: triggeredById,
                    },
                });
            }
        }

        // Attempt WhatsApp
        if (recipientPhone) {
            try {
                await this.sendWhatsApp(recipientPhone, smsMessage);
                notificationsToCreate.push({
                    channel: NotificationChannel.WHATSAPP,
                    recipient: recipientPhone,
                    message: smsMessage,
                    triggeredBy: triggeredById,
                });
            } catch (err) {
                logger.warn('WhatsApp send failed', { err });
            }
        }

        // Attempt Email
        if (recipientEmail) {
            try {
                await this.sendEmail(
                    recipientEmail,
                    `Fee Receipt - ${receiptNumber} | ${config.school.name}`,
                    emailHtml
                );
                notificationsToCreate.push({
                    channel: NotificationChannel.EMAIL,
                    recipient: recipientEmail,
                    subject: `Fee Receipt - ${receiptNumber}`,
                    message: `Payment confirmation for ${studentName}`,
                    triggeredBy: triggeredById,
                });
            } catch (err) {
                logger.error('Email send failed', { err, recipientEmail });
            }
        }

        // Batch create sent notifications
        if (notificationsToCreate.length > 0) {
            await prisma.notification.createMany({
                data: notificationsToCreate.map((n) => ({
                    ...n,
                    status: NotificationStatus.SENT,
                    sentAt: new Date(),
                })),
            });
        }
    },

    /**
     * Send fee due reminder
     */
    async sendFeeReminder(
        recipientPhone: string | null,
        recipientEmail: string | null,
        studentName: string,
        pendingAmount: number,
        dueDate: Date | null,
        triggeredById: string
    ): Promise<void> {
        const rupees = (pendingAmount / 100).toFixed(2);
        const dueDateStr = dueDate ? dueDate.toLocaleDateString('en-IN') : 'immediately';
        const message = `Reminder: Fee of ₹${rupees} is pending for ${studentName}. Please pay by ${dueDateStr}. Contact: ${config.school.phone}. - ${config.school.name}`;

        if (recipientPhone) {
            try {
                await this.sendSMS(recipientPhone, message);
            } catch (err) {
                logger.warn('Fee reminder SMS failed', { err });
            }
        }

        if (recipientEmail) {
            const html = `<div style="font-family: Arial; padding: 24px"><h2>Fee Due Reminder</h2><p>Dear Parent, fee of <strong>₹${rupees}</strong> is pending for <strong>${studentName}</strong>. Please pay by <strong>${dueDateStr}</strong>.</p><p>${config.school.name}<br/>${config.school.phone}</p></div>`;
            try {
                await this.sendEmail(recipientEmail, `Fee Reminder - ${studentName}`, html);
            } catch (err) {
                logger.warn('Fee reminder email failed', { err });
            }
        }

        await prisma.notification.createMany({
            data: [
                ...(recipientPhone
                    ? [{ channel: NotificationChannel.SMS, recipient: recipientPhone, message, status: NotificationStatus.SENT, sentAt: new Date(), triggeredBy: triggeredById }]
                    : []),
                ...(recipientEmail
                    ? [{ channel: NotificationChannel.EMAIL, recipient: recipientEmail, subject: 'Fee Reminder', message, status: NotificationStatus.SENT, sentAt: new Date(), triggeredBy: triggeredById }]
                    : []),
            ],
        });
    },
};
