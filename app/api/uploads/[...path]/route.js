// app/api/uploads/[...path]/route.js
// Legacy route - files are now stored on Vercel Blob
// This route handles old URLs that might still be in the database

import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json(
        { error: 'File path required' },
        { status: 400 }
      );
    }

    // For old file URLs, return a message that files have been migrated
    // New uploads go directly to Vercel Blob and have different URLs
    return NextResponse.json(
      {
        error: 'File not found',
        message: 'This file may have been uploaded before migration to cloud storage. New uploads are stored on Vercel Blob with different URLs.'
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
