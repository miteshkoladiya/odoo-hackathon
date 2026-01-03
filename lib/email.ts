
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || "user@example.com",
        pass: process.env.SMTP_PASS || "pass",
    },
});

export async function sendOnboardingEmail(to: string, name: string, credentials: { email: string, password: string }) {
    try {
        const info = await transporter.sendMail({
            from: process.env.FROM_EMAIL || '"Dayflow HR" <hr@dayflow.com>', // sender address
            to, // list of receivers
            subject: "Welcome to Dayflow - Your Login Credentials", // Subject line
            html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Welcome to Dayflow, ${name}!</h2>
          <p>We are excited to have you on board. Your employee account has been created.</p>
          <p>Here are your login details:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Login ID:</strong> ${credentials.email}</p>
            <p><strong>Password:</strong> ${credentials.password}</p>
          </div>
          <p>Please login at <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login">Dayflow Portal</a> and change your password immediately.</p>
          <br>
          <p>Best Regards,<br>HR Team</p>
        </div>
      `,
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email: ", error);
        return false;
    }
}
