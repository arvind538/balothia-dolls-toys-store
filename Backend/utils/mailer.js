const nodemailer = require('nodemailer');

const configured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);
let transporter;

const getTransporter = () => {
    if (!transporter) {
        const port = Number(process.env.SMTP_PORT) || 587;
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port,
            secure: port === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    }
    return transporter;
};

exports.mailConfigured = configured;

exports.sendOtpMail = async (to, name, otp) => {
    if (!configured()) {
        console.log(`\n[DEV] Password reset OTP for ${to}: ${otp}\n`);
        return { sent: false };
    }
    const first = (name || 'there').split(' ')[0];
    await getTransporter().sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject: 'Your Balothia password reset OTP',
        text: `Hi ${first}, your OTP is ${otp}. It is valid for 10 minutes. If you did not request this, ignore this email.`,
        html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#0b2a5b;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold">BALOTHIA <span style="font-size:11px;letter-spacing:3px;color:#fb923c">REFRIGERATION</span></div>
        <div style="padding:24px;color:#1e293b">
          <p>Hi ${first},</p>
          <p>Password reset ke liye aapka OTP:</p>
          <p style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#1d4ed8;margin:18px 0">${otp}</p>
          <p style="font-size:13px;color:#64748b">Ye OTP 10 minute tak valid hai. Kisi ko share mat karo. Agar aapne request nahi ki, to is email ko ignore karo.</p>
        </div>
      </div>`,
    });
    return { sent: true };
};

// Sends a plain-text notification to the support inbox when someone uses the contact form.
exports.sendSupportMail = async ({ name, email, phone, orderId, topic, message }) => {
    const to = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    const text = [
        `Topic: ${topic}`,
        `Name: ${name}`,
        `Email: ${email}`,
        `Mobile: ${phone || '-'}`,
        `Order ID: ${orderId || '-'}`,
        '',
        message,
    ].join('\n');

    if (!configured() || !to) {
        console.log(`\n[CONTACT] New message from ${name} <${email}>\n${text}\n`);
        return { sent: false };
    }
    await getTransporter().sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        replyTo: email,
        subject: `[Contact] ${topic} from ${name}`,
        text,
    });
    return { sent: true };
};

const clientUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
const escapeHtml = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Emails the admin's reply to the customer.
exports.sendReplyMail = async ({ to, name, topic, original, reply, adminName, id }) => {
    const first = (name || 'there').split(' ')[0];
    const link = `${clientUrl()}/support?open=${id}`;
    const text = [
        `Hi ${first},`,
        '',
        reply,
        '',
        `You can view the full conversation here: ${link}`,
        '',
        `Regards,`,
        `${adminName || 'Support Team'}, Balothia Refrigeration`,
        '',
        '----- Your original message -----',
        original,
    ].join('\n');

    if (!configured()) {
        console.log(`\n[REPLY EMAIL - SMTP is not set, so nothing was sent] To: ${to}\n${text}\n`);
        return { sent: false };
    }

    await getTransporter().sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        replyTo: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
        subject: `Re: ${topic} - Balothia Refrigeration`,
        text,
        html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#0b2a5b;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold">BALOTHIA <span style="font-size:11px;letter-spacing:3px;color:#fb923c">REFRIGERATION</span></div>
        <div style="padding:24px;color:#1e293b;line-height:1.6">
          <p>Hi ${escapeHtml(first)},</p>
          <div style="white-space:pre-wrap;background:#f8fafc;border-left:4px solid #1d4ed8;padding:14px 16px;border-radius:6px">${escapeHtml(reply)}</div>
          <p style="margin:22px 0"><a href="${link}" style="background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">View conversation</a></p>
          <p style="font-size:13px;color:#64748b">Regards,<br>${escapeHtml(adminName || 'Support Team')}, Balothia Refrigeration</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0">
          <p style="font-size:12px;color:#94a3b8">Your original message (${escapeHtml(topic)}):</p>
          <p style="font-size:13px;color:#64748b;white-space:pre-wrap">${escapeHtml(original)}</p>
        </div>
      </div>`,
    });
    return { sent: true };
};