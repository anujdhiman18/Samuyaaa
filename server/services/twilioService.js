import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappSender = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const smsSender = process.env.TWILIO_SMS_NUMBER || '+14155238886';

let twilioClient = null;
if (accountSid && authToken && !accountSid.includes('your_twilio_account_sid')) {
  try {
    twilioClient = twilio(accountSid, authToken);
  } catch (err) {
    console.warn('Twilio initialization warning:', err.message);
  }
}

export function formatPhoneNumber(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

export async function sendWhatsAppReminder({ studentPhone, studentName, dueAmount, rollNumber, className }) {
  const formattedPhone = formatPhoneNumber(studentPhone);
  if (!formattedPhone) {
    throw new Error(`Invalid phone number format: "${studentPhone}". Required minimum 10 digits.`);
  }

  const message = `Dear Parent, this is a reminder from Saumyaa Studies that the tuition fee of ₹${Number(dueAmount).toLocaleString()} for ${studentName} (${rollNumber || 'N/A'}, Class ${className || '10th'}) is pending. Please pay at the earliest. - Saumyaa Studies`;

  if (!twilioClient) {
    console.warn(`[Twilio Standalone Mode] WhatsApp dispatch simulated for ${formattedPhone}: "${message}"`);
    return {
      success: true,
      sid: 'SIMULATED_WA_' + Date.now(),
      status: 'simulated',
      isSimulated: true,
      message: `[Standalone] WhatsApp reminder dispatched to ${formattedPhone}`,
    };
  }

  const res = await twilioClient.messages.create({
    body: message,
    from: whatsappSender.startsWith('whatsapp:') ? whatsappSender : `whatsapp:${whatsappSender}`,
    to: `whatsapp:${formattedPhone}`,
  });

  return {
    success: true,
    sid: res.sid,
    status: res.status,
    isSimulated: false,
    message: `WhatsApp reminder sent to ${formattedPhone} via Twilio API`,
  };
}

export async function sendSMSReminder({ studentPhone, studentName, dueAmount, rollNumber, className }) {
  const formattedPhone = formatPhoneNumber(studentPhone);
  if (!formattedPhone) {
    throw new Error(`Invalid phone number format: "${studentPhone}". Required minimum 10 digits.`);
  }

  const message = `Dear Parent, tuition fee of ₹${Number(dueAmount).toLocaleString()} for ${studentName} (${rollNumber || 'N/A'}, Class ${className || '10th'}) is pending. Please pay promptly. - Saumyaa Studies`;

  if (!twilioClient) {
    console.warn(`[Twilio Standalone Mode] SMS dispatch simulated for ${formattedPhone}: "${message}"`);
    return {
      success: true,
      sid: 'SIMULATED_SMS_' + Date.now(),
      status: 'simulated',
      isSimulated: true,
      message: `[Standalone] SMS reminder dispatched to ${formattedPhone}`,
    };
  }

  const res = await twilioClient.messages.create({
    body: message,
    from: smsSender,
    to: formattedPhone,
  });

  return {
    success: true,
    sid: res.sid,
    status: res.status,
    isSimulated: false,
    message: `SMS reminder sent to ${formattedPhone} via Twilio API`,
  };
}
