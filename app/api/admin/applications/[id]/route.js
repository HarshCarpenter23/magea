// app/api/admin/applications/[id]/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { executeQuery } from '../../../../../lib/db.js';

// Generate random 10-character password
function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
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

// Send approval email with password
async function sendApprovalEmail(email, firstName, password) {
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@maega.com',
    to: email,
    subject: 'MAEGA Partner Application Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background-color: #2563eb; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; font-size: 24px;">M</span>
          </div>
        </div>

        <h2 style="color: #16a34a; text-align: center;">Congratulations, ${firstName}!</h2>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We are pleased to inform you that your application to become a MAEGA Partner has been <strong style="color: #16a34a;">approved</strong>!
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          You can now log in to the MAEGA Partners portal and start accepting service requests.
        </p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Your Login Credentials</h3>
          <p style="margin: 10px 0;"><strong>Portal:</strong> <a href="https://maega-partners.in" style="color: #2563eb;">maega-partners.in</a></p>
          <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 10px 0;"><strong>Password:</strong> <span style="font-family: monospace; background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${password}</span></p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Important:</strong> Please change your password after your first login for security purposes.
          </p>
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Welcome to the MAEGA family!
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong>The MAEGA Team</strong>
          </p>
        </div>
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

// Send rejection email
async function sendRejectionEmail(email, firstName, reason) {
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@maega.com',
    to: email,
    subject: 'MAEGA Partner Application Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background-color: #2563eb; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; font-size: 24px;">M</span>
          </div>
        </div>

        <h2 style="color: #374151; text-align: center;">Application Update</h2>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Dear ${firstName},
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Thank you for your interest in becoming a MAEGA Partner. After careful review of your application, we regret to inform you that we are unable to proceed with your application at this time.
        </p>

        ${reason ? `
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #374151; margin: 0;"><strong>Reason:</strong> ${reason}</p>
        </div>
        ` : ''}

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          You are welcome to reapply in the future. If you have any questions, please contact our support team.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong>The MAEGA Team</strong>
          </p>
        </div>
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

// GET - Fetch single application details
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const applications = await executeQuery(
      `SELECT * FROM workers WHERE id = ?`,
      [id]
    );

    if (applications.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: applications[0]
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// PUT - Approve or reject application
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { action, adminId, reason } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Check if application exists
    const applications = await executeQuery(
      'SELECT id, email, first_name, status FROM workers WHERE id = ?',
      [id]
    );

    if (applications.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    const application = applications[0];

    // Check if already processed
    if (application.status !== 'Pending Approval') {
      return NextResponse.json(
        { success: false, message: `Application has already been ${application.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Generate random password
      const plainPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      // Update worker status to Active and set password
      await executeQuery(
        `UPDATE workers
         SET status = 'Active',
             password_hash = ?,
             approved_at = NOW(),
             approved_by = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [hashedPassword, adminId || null, id]
      );

      // Send approval email with password
      const emailResult = await sendApprovalEmail(
        application.email,
        application.first_name,
        plainPassword
      );

      if (!emailResult.success) {
        console.error('Failed to send approval email:', emailResult.error);
        // Don't fail the request, just log it
      }

      return NextResponse.json({
        success: true,
        message: 'Application approved successfully. Login credentials sent to the applicant.',
        emailSent: emailResult.success
      });

    } else {
      // Reject application
      await executeQuery(
        `UPDATE workers
         SET status = 'Rejected',
             updated_at = NOW()
         WHERE id = ?`,
        [id]
      );

      // Send rejection email
      const emailResult = await sendRejectionEmail(
        application.email,
        application.first_name,
        reason
      );

      return NextResponse.json({
        success: true,
        message: 'Application rejected.',
        emailSent: emailResult.success
      });
    }

  } catch (error) {
    console.error('Error processing application:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process application' },
      { status: 500 }
    );
  }
}
