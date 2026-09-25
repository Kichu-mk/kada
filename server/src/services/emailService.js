const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'KADA <onboarding@resend.dev>';

const sendRegistrationOtp = async (email, otp) => {
    const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'KADA - Store Management Website Email verification code',
        text: `Your KADA verification code is ${otp}. It expires in 10 minutes.`
    });

    if (error) {
        console.error('Resend error (OTP):', error);
        throw new Error('Failed to send verification email');
    }

    return data;
};

const sendPasswordResetEmail = async (email, resetUrl) => {
    const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Reset your KADA password',
        text: `Reset your KADA password using this link: ${resetUrl}. This link expires in 15 minutes.`
    });

    if (error) {
        console.error('Resend error (password reset):', error);
        throw new Error('Failed to send password reset email');
    }

    return data;
};

module.exports = { sendRegistrationOtp, sendPasswordResetEmail };