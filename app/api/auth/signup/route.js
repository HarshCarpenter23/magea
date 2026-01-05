// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../../../../lib/db.js';

export async function POST(request) {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password, 
      confirmPassword,
      emailVerified,
      phoneVerified 
    } = await request.json();

    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if both email and phone are verified
    if (!emailVerified || !phoneVerified) {
      return NextResponse.json(
        { message: 'Both email and phone must be verified before signup' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: 'User with this email or phone already exists' },
        { status: 400 }
      );
    }

    // Verify that email OTP verification was completed (stored in database)
    // Note: Phone verification is handled by Twilio Verify API, not stored locally
    const emailVerification = await executeQuery(
      'SELECT verified FROM otp_verifications WHERE identifier = ? AND otp_type = ? AND verified = TRUE ORDER BY created_at DESC LIMIT 1',
      [email, 'email']
    );

    if (emailVerification.length === 0) {
      return NextResponse.json(
        { message: 'Email verification not completed' },
        { status: 400 }
      );
    }

    // Phone verification is validated via Twilio Verify API on the frontend
    // The phoneVerified flag from the request indicates successful Twilio verification

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const result = await executeQuery(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, email_verified, phone_verified) 
       VALUES (?, ?, ?, ?, ?, TRUE, TRUE)`,
      [firstName, lastName, email, phone, passwordHash]
    );

    // Clean up OTP verifications for this user
    await executeQuery(
      'DELETE FROM otp_verifications WHERE identifier IN (?, ?)',
      [email, phone]
    );

    return NextResponse.json({ 
      message: 'User created successfully',
      userId: result.insertId,
      user: {
        id: result.insertId,
        firstName,
        lastName,
        email,
        phone,
        emailVerified: true,
        phoneVerified: true
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { message: 'User with this email or phone already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}