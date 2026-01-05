// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';
import { verifyOTP, verifySMSOTPVia2Factor } from '../../../../lib/otpUtils.js';

export async function POST(request) {
  try {
    const { identifier, otpCode, type } = await request.json();

    if (!identifier || !otpCode || !type) {
      return NextResponse.json(
        { message: 'Identifier, OTP code, and type are required' },
        { status: 400 }
      );
    }

    if (!['email', 'phone'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid type. Must be email or phone' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    const cleanOtp = otpCode.toString().trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { message: 'Please enter a valid 6-digit OTP' },
        { status: 400 }
      );
    }

    let verificationResult;

    if (type === 'phone') {
      // Use 2Factor.in API for phone verification
      verificationResult = await verifySMSOTPVia2Factor(identifier, cleanOtp);
    } else {
      // Use database verification for email
      verificationResult = await verifyOTP(identifier, cleanOtp, type);
    }

    if (!verificationResult.success) {
      return NextResponse.json(
        { message: verificationResult.message || verificationResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: verificationResult.message,
      verified: true
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}