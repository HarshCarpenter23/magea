import { executeQuery } from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId, first_name, last_name, phone } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update user profile
    const updateQuery = `
      UPDATE users
      SET first_name = ?, last_name = ?, phone = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await executeQuery(updateQuery, [first_name || '', last_name || '', phone || '', userId]);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: userId,
        first_name,
        last_name,
        phone
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
