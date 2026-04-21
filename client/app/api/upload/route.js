import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Here you would authenticate the user
        // e.g., const user = await auth(request);
        // if (!user) throw new Error("Unauthorized");
        
        return {
          // Specify the allowed content types and maximum file size
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            // Optional data to pass to onUploadCompleted
            source: 'plasma-upload',
          }),
        };
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Vercel Blob Client Upload Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 } // Webhook retries if not 200
    );
  }
}
