// lib/otpUtils.js
import { executeQuery } from './db.js';
import nodemailer from 'nodemailer';

// 2Factor.in API Configuration
const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;
const TWO_FACTOR_BASE_URL = 'https://2factor.in/API/V1';

// Generate 6-digit OTP (used for email only - 2Factor generates for SMS)
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in database (for email) or session_id (for phone via 2Factor)
export async function storeOTP(identifier, otpCodeOrSessionId, type) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  // Delete any existing OTP for this identifier and type
  await executeQuery(
    'DELETE FROM otp_verifications WHERE identifier = ? AND otp_type = ?',
    [identifier, type]
  );

  // Insert new OTP or session_id
  await executeQuery(
    'INSERT INTO otp_verifications (identifier, otp_code, otp_type, expires_at) VALUES (?, ?, ?, ?)',
    [identifier, otpCodeOrSessionId, type, expiresAt]
  );
}

// Verify OTP (works for both email and phone)
export async function verifyOTP(identifier, otpCode, type) {
  const results = await executeQuery(
    'SELECT * FROM otp_verifications WHERE identifier = ? AND otp_type = ? AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
    [identifier, type]
  );

  if (results.length === 0) {
    return { success: false, message: 'No OTP found. Please request a new OTP.' };
  }

  const otpRecord = results[0];

  // Check if OTP has expired
  if (new Date() > new Date(otpRecord.expires_at)) {
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }

  // Check if too many attempts
  if (otpRecord.attempts >= 3) {
    return { success: false, message: 'Too many attempts. Please request a new OTP.' };
  }

  // Increment attempt counter
  await executeQuery(
    'UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?',
    [otpRecord.id]
  );

  // Verify OTP code
  if (otpRecord.otp_code !== otpCode) {
    return { success: false, message: 'Invalid OTP code. Please try again.' };
  }

  // Mark as verified
  await executeQuery(
    'UPDATE otp_verifications SET verified = TRUE WHERE id = ?',
    [otpRecord.id]
  );

  return {
    success: true,
    message: type === 'email' ? 'Email verified successfully' : 'Phone number verified successfully'
  };
}

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Send OTP via email
export async function sendEmailOTP(email, otpCode) {
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@maega.com',
    to: email,
    subject: 'Your MAEGA Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">MAEGA Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${otpCode}</span>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };
  
  try {
    await emailTransporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// Format phone number for 2Factor (requires 10-digit Indian number without country code)
function formatPhoneFor2Factor(phone) {
  let formatted = phone.replace(/\D/g, ''); // Remove all non-digits

  // Remove country code if present
  if (formatted.startsWith('91') && formatted.length === 12) {
    formatted = formatted.substring(2);
  } else if (formatted.startsWith('0')) {
    formatted = formatted.substring(1);
  }

  // Ensure it's a 10-digit number
  if (formatted.length !== 10) {
    throw new Error('Invalid phone number. Please enter a valid 10-digit Indian mobile number.');
  }

  return formatted;
}

// Send OTP via 2Factor.in API (AUTOGEN - generates and sends OTP automatically)
export async function sendSMSOTP(phone) {
  try {
    if (!TWO_FACTOR_API_KEY) {
      console.error('TWO_FACTOR_API_KEY not set in .env');
      return {
        success: false,
        error: 'SMS service not configured. Please contact support.'
      };
    }

    const formattedPhone = formatPhoneFor2Factor(phone);
    const sendUrl = `${TWO_FACTOR_BASE_URL}/${TWO_FACTOR_API_KEY}/SMS/${formattedPhone}/AUTOGEN`;

    console.log('=== 2Factor Send OTP ===');
    console.log('Phone (original):', phone);
    console.log('Phone (formatted):', formattedPhone);
    console.log('API URL:', sendUrl.replace(TWO_FACTOR_API_KEY, '***API_KEY***'));

    // Use 2Factor AUTOGEN endpoint to send OTP (6-digit SMS OTP)
    const response = await fetch(sendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('2Factor Send Response:', JSON.stringify(data, null, 2));

    if (data.Status === 'Success') {
      console.log('OTP sent successfully. Session ID:', data.Details);
      return {
        success: true,
        sessionId: data.Details, // This is the session_id for verification
        message: 'OTP sent successfully'
      };
    } else {
      console.error('2Factor API error:', data);
      return {
        success: false,
        error: data.Details || 'Failed to send SMS OTP'
      };
    }

  } catch (error) {
    console.error('2Factor SMS OTP sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS OTP'
    };
  }
}

// Verify OTP via 2Factor.in API
export async function verifySMSOTPVia2Factor(phone, otpCode) {
  try {
    if (!TWO_FACTOR_API_KEY) {
      return { success: false, error: 'SMS service not configured' };
    }

    console.log('Verifying OTP for phone:', phone, 'OTP:', otpCode);

    // Get the stored session_id from database - try exact match first
    let results = await executeQuery(
      'SELECT otp_code, identifier FROM otp_verifications WHERE identifier = ? AND otp_type = ? AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
      [phone, 'phone']
    );

    // If no exact match, try with formatted phone number
    if (results.length === 0) {
      // Try matching with different phone formats
      const cleanPhone = phone.replace(/\D/g, '');
      const phoneVariants = [
        cleanPhone,
        cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone,
        cleanPhone.startsWith('91') ? cleanPhone.substring(2) : cleanPhone,
        '+91' + (cleanPhone.length === 10 ? cleanPhone : cleanPhone.substring(2))
      ];

      console.log('Trying phone variants:', phoneVariants);

      for (const variant of phoneVariants) {
        results = await executeQuery(
          'SELECT otp_code, identifier FROM otp_verifications WHERE identifier = ? AND otp_type = ? AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
          [variant, 'phone']
        );
        if (results.length > 0) {
          console.log('Found session with phone variant:', variant);
          break;
        }
      }
    }

    if (results.length === 0) {
      console.log('No OTP session found for phone:', phone);
      return { success: false, message: 'No OTP session found. Please request a new OTP.' };
    }

    const sessionId = results[0].otp_code;
    const storedPhone = results[0].identifier;
    console.log('Found session ID:', sessionId, 'for stored phone:', storedPhone);

    // Check if session has expired
    const sessionCheck = await executeQuery(
      'SELECT expires_at, attempts FROM otp_verifications WHERE identifier = ? AND otp_type = ? AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
      [storedPhone, 'phone']
    );

    if (sessionCheck.length > 0) {
      if (new Date() > new Date(sessionCheck[0].expires_at)) {
        return { success: false, message: 'OTP has expired. Please request a new one.' };
      }
      if (sessionCheck[0].attempts >= 3) {
        return { success: false, message: 'Too many attempts. Please request a new OTP.' };
      }
    }

    // Increment attempt counter
    await executeQuery(
      'UPDATE otp_verifications SET attempts = attempts + 1 WHERE identifier = ? AND otp_type = ? AND verified = FALSE',
      [storedPhone, 'phone']
    );

    // Verify OTP using 2Factor API (use SMS/VERIFY for 6-digit OTP from AUTOGEN)
    const verifyUrl = `${TWO_FACTOR_BASE_URL}/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otpCode}`;
    console.log('Calling 2Factor verify URL:', verifyUrl.replace(TWO_FACTOR_API_KEY, '***'));

    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('2Factor verify response:', JSON.stringify(data));

    // 2Factor returns "OTP Matched" on success
    if (data.Status === 'Success' && (data.Details === 'OTP Matched' || data.Details?.includes('Matched'))) {
      // Mark as verified in database
      await executeQuery(
        'UPDATE otp_verifications SET verified = TRUE WHERE identifier = ? AND otp_type = ?',
        [storedPhone, 'phone']
      );
      return { success: true, message: 'Phone number verified successfully' };
    } else {
      console.log('OTP verification failed:', data);
      return { success: false, message: data.Details || 'Invalid OTP code. Please try again.' };
    }

  } catch (error) {
    console.error('2Factor Verify check error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify OTP'
    };
  }
}