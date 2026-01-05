// app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';
import { generateOTP, storeOTP, sendEmailOTP, sendSMSOTP } from '../../../../lib/otpUtils.js';
import { executeQuery } from '../../../../lib/db.js';

export async function POST(request) {
  try {
    const { identifier, type } = await request.json();

    if (!identifier || !type) {
      return NextResponse.json(
        { message: 'Identifier and type are required' },
        { status: 400 }
      );
    }

    if (!['email', 'phone'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid type. Must be email or phone' },
        { status: 400 }
      );
    }

    // Validate email format
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return NextResponse.json(
          { message: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if email already exists
      const existingEmail = await executeQuery(
        'SELECT id FROM users WHERE email = ?',
        [identifier]
      );

      if (existingEmail.length > 0) {
        return NextResponse.json(
          { message: 'Email already registered' },
          { status: 400 }
        );
      }
    }

    // Validate phone format (10-digit Indian mobile number)
    if (type === 'phone') {
      // Remove all non-digits for validation
      let cleanPhone = identifier.replace(/\D/g, '');

      // Remove country code if present
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = cleanPhone.substring(2);
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }

      if (cleanPhone.length !== 10) {
        return NextResponse.json(
          { message: 'Please enter a valid 10-digit Indian mobile number' },
          { status: 400 }
        );
      }

      // Check if phone already exists
      const existingPhone = await executeQuery(
        'SELECT id FROM users WHERE phone = ?',
        [identifier]
      );

      if (existingPhone.length > 0) {
        return NextResponse.json(
          { message: 'Phone number already registered' },
          { status: 400 }
        );
      }
    }

    let sendResult;

    if (type === 'email') {
      // For email: Generate OTP locally and send via email
      const otpCode = generateOTP();
      await storeOTP(identifier, otpCode, type);
      sendResult = await sendEmailOTP(identifier, otpCode);
    } else {
      // For phone: 2Factor generates OTP automatically, we store the session_id
      sendResult = await sendSMSOTP(identifier);

      if (sendResult.success && sendResult.sessionId) {
        // Store the session_id in database for later verification
        await storeOTP(identifier, sendResult.sessionId, type);
      }
    }

    if (!sendResult.success) {
      return NextResponse.json(
        {
          message: `Failed to send ${type} OTP`,
          error: sendResult.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `OTP sent successfully to ${type === 'email' ? identifier : 'your phone'}`,
      type
    });

  } catch (error) {
    console.error('Send OTP error:', error);

    // Handle specific error for invalid phone number
    if (error.message && error.message.includes('Invalid phone number')) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}