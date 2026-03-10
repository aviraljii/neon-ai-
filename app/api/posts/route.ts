import { connectDB } from '@/lib/db';
import { Post } from '@/models/Post';
import { uploadImageToCloudinary } from '@/lib/uploads/cloudinary';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();
    const posts = await Post.find({}).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Posts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();

    const title = String(formData.get('title') || '').trim();
    const link = String(formData.get('link') || '').trim();
    const userId = String(formData.get('userId') || 'anonymous').trim();
    const imageFile = formData.get('image');
    const imageUrl = String(formData.get('imageUrl') || '').trim();

    if (!title || !link) {
      return NextResponse.json({ error: 'title and link are required' }, { status: 400 });
    }

    let image = imageUrl;

    if (!image && imageFile instanceof File) {
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image size must be 5MB or less' }, { status: 400 });
      }

      // Preferred: store hosted image URL from Cloudinary.
      // Fallback: preserve existing base64 behavior when Cloudinary is not configured/available.
      try {
        const bytes = await imageFile.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const dataUri = `data:${imageFile.type};base64,${base64}`;
        image = await uploadImageToCloudinary(dataUri);
      } catch (uploadError) {
        console.error('Cloudinary upload failed, falling back to base64:', uploadError);
        const bytes = await imageFile.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        image = `data:${imageFile.type};base64,${base64}`;
      }
    }

    if (!image) {
      return NextResponse.json({ error: 'image is required' }, { status: 400 });
    }

    const post = await Post.create({
      image,
      title,
      link,
      userId: userId || 'anonymous',
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Posts POST error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
