import { executeQuery } from '../../../lib/db';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { findBestWorker } from '../workers/assign/route.js';

// GET - Fetch bookings for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    let query = `
      SELECT
        sb.id,
        sb.booking_code,
        sb.customer_name,
        sb.customer_phone,
        sb.customer_email,
        sb.customer_address,
        sb.service_description,
        sb.preferred_date,
        sb.preferred_time,
        sb.status,
        sb.created_at,
        s.name as service_name,
        ss.name as sub_service_name,
        w.first_name as technician_first_name,
        w.last_name as technician_last_name,
        sb.customer_rating
      FROM service_bookings sb
      LEFT JOIN services s ON sb.service_id = s.id
      LEFT JOIN service_subcategories ss ON sb.subcategory_id = ss.id
      LEFT JOIN workers w ON sb.assigned_worker_id = w.id
      WHERE sb.customer_email = ?
      ORDER BY sb.created_at DESC
    `;

    const bookings = await executeQuery(query, [email]);

    // Transform the data to match frontend expectations
    const transformedBookings = bookings.map(booking => ({
      id: booking.booking_code,
      service: booking.service_name || 'Service',
      subService: booking.sub_service_name || booking.service_description || '',
      date: booking.preferred_date ? new Date(booking.preferred_date).toISOString().split('T')[0] : '',
      time: booking.preferred_time || '',
      status: mapStatus(booking.status),
      technician: booking.technician_first_name
        ? `${booking.technician_first_name} ${booking.technician_last_name || ''}`.trim()
        : 'To be assigned',
      rating: booking.customer_rating || null,
      createdAt: booking.created_at
    }));

    return NextResponse.json({
      success: true,
      bookings: transformedBookings
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// Email transporter configuration
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

// Send worker assignment email to customer
async function sendWorkerAssignmentEmail(customerEmail, customerName, bookingCode, workerInfo, serviceInfo) {
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@maega.com',
    to: customerEmail,
    subject: `Technician Assigned - Booking #${bookingCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background-color: #2563eb; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; font-size: 24px;">M</span>
          </div>
        </div>

        <h2 style="color: #16a34a; text-align: center;">Technician Assigned!</h2>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Dear ${customerName},
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Great news! A technician has been assigned to your service booking.
        </p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Booking ID:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Service:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${serviceInfo.service}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Sub-Service:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${serviceInfo.subService}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Date:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${serviceInfo.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Time Slot:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${serviceInfo.time}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #065f46; margin-top: 0; margin-bottom: 15px;">Your Technician</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #047857;">Name:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #065f46;">${workerInfo.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #047857;">Contact:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #065f46;">${workerInfo.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #047857;">Estimated Arrival:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #065f46;">${workerInfo.eta}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Note:</strong> The technician will call you 30 minutes before arrival. Please ensure someone is available at the service location.
          </p>
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          If you have any questions, please contact our support team.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Thank you for choosing MAEGA!<br>
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

// POST - Create a new booking
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      service,
      subService,
      date,
      time,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      notes,
      userId,
      paymentMethod,
      amount,
      latitude,
      longitude,
      // Payment details (for Razorpay payments)
      paymentStatus,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = body;

    // Validate required fields
    if (!service || !subService || !date || !time || !customerName || !customerPhone || !customerEmail || !customerAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate booking code
    const bookingCode = 'MAEGA' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase();

    // Find service ID from service name
    const serviceMap = {
      'ac-services': 1,
      'refrigerators': 2,
      'washing-machine': 3,
      'microwave': 4,
      'chimney': 5,
      'tv-repair': 6,
      'water-cooler': 7,
      'water-coolers': 7,
      'deep-freezer': 8,
      'deep-freezers': 8,
      'geyser': 9,
      'installation': 10,
      'bottle-cooler': 7,
      'visi-coolers': 7,
      'fow': 8,
      'water-dispenser': 7,
      'refrigerator-vans': 2,
      'cold-rooms': 8
    };

    const serviceId = serviceMap[service] || 1;

    // Format time for database
    const timeMap = {
      '9:00 AM - 10:00 AM': '09:00:00',
      '10:00 AM - 11:00 AM': '10:00:00',
      '11:00 AM - 12:00 PM': '11:00:00',
      '12:00 PM - 1:00 PM': '12:00:00',
      '2:00 PM - 3:00 PM': '14:00:00',
      '3:00 PM - 4:00 PM': '15:00:00',
      '4:00 PM - 5:00 PM': '16:00:00',
      '5:00 PM - 6:00 PM': '17:00:00'
    };

    const formattedTime = timeMap[time] || '10:00:00';

    // For Razorpay payments, verify the signature before saving
    if (paymentMethod === 'razorpay' && razorpay_payment_id) {
      if (!razorpay_order_id || !razorpay_signature) {
        return NextResponse.json(
          { success: false, error: 'Payment verification details missing' },
          { status: 400 }
        );
      }

      // Verify the payment signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        return NextResponse.json(
          { success: false, error: 'Payment verification failed. Invalid signature.' },
          { status: 400 }
        );
      }
    }

    // Determine payment status based on payment method
    const finalPaymentStatus = paymentStatus || (paymentMethod === 'pay-on-service' ? 'pending' : 'pending');

    // Insert booking with location data and payment details
    const insertQuery = `
      INSERT INTO service_bookings (
        booking_code,
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        service_id,
        service_description,
        preferred_date,
        preferred_time,
        special_instructions,
        service_location_lat,
        service_location_lng,
        status,
        payment_status,
        payment_method,
        payment_amount,
        payment_id,
        payment_order_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      bookingCode,
      null, // customer_id - set to null since we store customer info directly
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      serviceId,
      subService,
      date,
      formattedTime,
      notes || null,
      latitude || null,
      longitude || null,
      finalPaymentStatus,
      paymentMethod || null,
      amount || null,
      razorpay_payment_id || null,
      razorpay_order_id || null
    ];

    const result = await executeQuery(insertQuery, values);

    // Try to assign a worker automatically
    let assignedWorker = null;
    try {
      const worker = await findBestWorker(serviceId, latitude, longitude);

      if (worker) {
        // Update booking with assigned worker
        await executeQuery(
          `UPDATE service_bookings
           SET assigned_worker_id = ?,
               assigned_at = NOW(),
               status = 'Assigned',
               updated_at = NOW()
           WHERE booking_code = ?`,
          [worker.id, bookingCode]
        );

        assignedWorker = {
          name: `${worker.first_name} ${worker.last_name}`,
          phone: worker.phone,
          eta: worker.eta || 'To be confirmed'
        };

        // Get service name for email
        const serviceNames = {
          1: 'AC Repair & Service',
          2: 'Refrigerator Repair',
          3: 'Washing Machine Repair',
          4: 'Microwave Repair',
          5: 'Chimney Repair',
          6: 'TV Repair',
          7: 'Water Cooler Service',
          8: 'Deep Freezer Repair',
          9: 'Geyser Repair',
          10: 'Installation'
        };

        // Send email notification to customer
        await sendWorkerAssignmentEmail(
          customerEmail,
          customerName,
          bookingCode,
          assignedWorker,
          {
            service: serviceNames[serviceId] || 'Service',
            subService: subService,
            date: new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: time
          }
        );
      }
    } catch (workerError) {
      console.error('Error assigning worker:', workerError);
      // Don't fail the booking if worker assignment fails
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      bookingCode: bookingCode,
      bookingId: result.insertId,
      assignedWorker: assignedWorker
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

// Helper function to map database status to frontend status
function mapStatus(dbStatus) {
  const statusMap = {
    'Pending': 'scheduled',
    'Assigned': 'scheduled',
    'In Progress': 'in-progress',
    'Completed': 'completed',
    'Cancelled': 'cancelled',
    'Rejected': 'cancelled'
  };
  return statusMap[dbStatus] || 'scheduled';
}
