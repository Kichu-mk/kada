const nodemailer = require('nodemailer');

const getTransporter = () => {
    const SMTP_HOST = process.env.SMTP_HOST?.trim();
    const SMTP_PORT = process.env.SMTP_PORT?.trim();
    const SMTP_USER = process.env.SMTP_USER?.trim();
    const SMTP_PASSWORD = process.env.SMTP_PASSWORD?.trim();

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
        throw new Error('SMTP configuration is missing');
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
    });
};

const sendRegistrationOtp = async (email, otp) => {
    await getTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'KADA email verification code',
        text: `Your KADA verification code is ${otp}. It expires in 10 minutes.`
    });
};

const sendPasswordResetEmail = async (email, resetUrl) => {
    await getTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Reset your KADA password',
        text: `Reset your KADA password using this link: ${resetUrl}. This link expires in 15 minutes.`
    });
};

module.exports = { sendRegistrationOtp, sendPasswordResetEmail };
