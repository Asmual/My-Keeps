import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { isCloudinaryConfigured } from '@/lib/cloudinary';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    let fileData: string | null = null;
    let resourceType: 'auto' | 'image' | 'video' = 'auto';
    let folder = 'my-keeps/media';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      fileData = body.file || null;
      if (body.type === 'voice' || body.type === 'audio') {
        resourceType = 'video';
        folder = 'my-keeps/audio';
      } else if (body.type === 'avatar') {
        resourceType = 'image';
        folder = 'my-keeps/avatars';
      } else {
        resourceType = 'image';
        folder = 'my-keeps/images';
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const type = formData.get('type') as string | null;

      if (type === 'voice' || type === 'audio') {
        resourceType = 'video';
        folder = 'my-keeps/audio';
      } else if (type === 'avatar') {
        resourceType = 'image';
        folder = 'my-keeps/avatars';
      } else {
        resourceType = 'image';
        folder = 'my-keeps/images';
      }

      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const bytes = await (file as Blob).arrayBuffer();
        const buffer = Buffer.from(bytes);
        const mimeType = (file as Blob).type || 'application/octet-stream';
        fileData = `data:${mimeType};base64,${buffer.toString('base64')}`;
      } else if (typeof file === 'string') {
        fileData = file;
      }
    }

    if (!fileData) {
      return NextResponse.json(
        { success: false, error: 'No file data provided' },
        { status: 400 }
      );
    }

    // Check if Cloudinary is configured with credentials
    if (!isCloudinaryConfigured()) {
      console.warn('⚠️ Cloudinary is not configured. Returning payload as fallback.');
      return NextResponse.json({
        success: true,
        url: fileData,
        warning: 'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured. Returning local data.',
      });
    }

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: resourceType,
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to upload media to Cloudinary' },
      { status: 500 }
    );
  }
}
