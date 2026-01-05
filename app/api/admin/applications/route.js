// app/api/admin/applications/route.js
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (status !== 'all') {
      whereClause = 'WHERE status = ?';
      queryParams.push(status);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM workers ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get applications with pagination
    const query = `
      SELECT
        id,
        worker_code,
        first_name,
        last_name,
        phone,
        email,
        date_of_birth,
        gender,
        photo_url,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        account_holder_name,
        account_number,
        account_type,
        bank_name,
        ifsc_code,
        branch_name,
        shop_name,
        shop_address,
        shop_phone,
        shop_registration_number,
        house_type,
        house_address,
        marital_status,
        experience_years,
        previous_company,
        reference_name,
        reference_phone,
        academic_qualification,
        technical_qualification,
        other_qualifications,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        blood_group,
        id_proof_url,
        certificates_url,
        status,
        created_at,
        approved_at,
        approved_by
      FROM workers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const applications = await executeQuery(query, [...queryParams, limit, offset]);

    return NextResponse.json({
      success: true,
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
