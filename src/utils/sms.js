import twilio from "twilio";
import { config } from "../config/index.js";

// Initialize Twilio Client
// Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER are in your .env
const client =
  config.sms && config.sms.accountSid
    ? twilio(config.sms.accountSid, config.sms.authToken)
    : null;

export const sendSMS = async ({ to, body }) => {
  try {
    if (!client) {
      console.log(`[SMS MOCK] To: ${to} | Body: ${body}`);
      return;
    }

    await client.messages.create({
      body: body,
      from: config.sms.phoneNumber,
      to: to,
    });
    console.log(`📲 SMS sent to ${to}`);
  } catch (error) {
    console.error("SMS Failed:", error.message);
    // Don't crash the app if SMS fails
  }
};
