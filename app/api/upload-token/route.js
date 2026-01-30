// app/api/upload-token/route.js
// Generates upload tokens for client-side Vercel Blob uploads
import { handleUpload } from '@vercel/blob/client';

export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate the upload path
        if (!pathname.startsWith('workers/')) {
          throw new Error('Invalid upload path');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB max
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Optional: Log or track completed uploads
        console.log('Upload completed:', blob.url);
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
