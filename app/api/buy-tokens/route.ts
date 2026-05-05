import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Receipt from '@/models/Receipt';
import { getSession } from '@/lib/auth';
import { uploadReceiptImage } from '@/lib/cloudinary';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('receipt') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Payment receipt image is required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageUrl = await uploadReceiptImage(buffer, file.name);

    await connectToDatabase();

    const receipt = await Receipt.create({
      userId: session.id,
      imageData: imageUrl,
    });

    return NextResponse.json({ success: true, receiptId: receipt._id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error uploading receipt' }, { status: 500 });
  }
}
