import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { executeQuery } from '../../../../lib/db.js'

export async function POST(request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = await request.json()

    // Verify the payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (isAuthentic) {
      // Update the booking with payment information
      if (bookingId) {
        await executeQuery(
          `UPDATE service_bookings
           SET payment_status = 'paid',
               payment_id = ?,
               payment_order_id = ?,
               updated_at = NOW()
           WHERE booking_code = ?`,
          [razorpay_payment_id, razorpay_order_id, bookingId]
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
