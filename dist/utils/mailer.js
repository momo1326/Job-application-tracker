import nodemailer from 'nodemailer';
import { config } from '../config.js';
const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
});
export const sendEmail = async (to, subject, text) => {
    await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        text
    });
};
