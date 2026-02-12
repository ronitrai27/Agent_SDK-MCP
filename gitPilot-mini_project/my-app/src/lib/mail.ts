import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: `"Gitpilot Demo AI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: body,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email error:", error);

    return {
      success: false,
      message: "Failed to send email",
    };
  }
}
