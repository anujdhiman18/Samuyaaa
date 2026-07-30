import dotenv from 'dotenv';

dotenv.config();

export function validateEnv() {
  console.log('--- Environment Configuration Check ---');
  
  const required = ['PORT', 'JWT_SECRET'];
  const missingRequired = required.filter((key) => !process.env[key]);

  if (missingRequired.length > 0) {
    console.warn(`⚠️ Warning: Missing required environment variables: ${missingRequired.join(', ')}. Using defaults.`);
  }

  // Twilio Check
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  
  const isTwilioConfigured = 
    twilioSid && 
    twilioToken && 
    !twilioSid.includes('your_twilio_account_sid') && 
    !twilioToken.includes('your_twilio_auth_token');

  if (isTwilioConfigured) {
    console.log('✅ Twilio Automated Messaging Service: CONFIGURED & READY (WhatsApp + SMS API active)');
  } else {
    console.log('ℹ️ Twilio Automated Messaging Service: NOT CONFIGURED (Operating in Standalone Simulated Mode)');
    console.log('   To activate real Twilio dispatches, add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to server/.env');
  }

  // MongoDB Check
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.log('ℹ️ MongoDB URI not set in .env. Backend will attempt local database connection.');
  } else {
    console.log('✅ MongoDB Database URI: SPECIFIED');
  }

  console.log('---------------------------------------');
  return { isTwilioConfigured };
}
