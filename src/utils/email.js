// src/utils/email.js
import nodemailer from "nodemailer";
import { config } from "../config/index.js";

const createTransporter = () => {
  const { email } = config;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "devakarthik8899@gmail.com",
      pass: "yqbf oewv ahye rssq",
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("Failed to send email");
  }
};

export default sendEmail;
