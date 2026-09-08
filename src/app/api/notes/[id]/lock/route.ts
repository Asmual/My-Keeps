import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';
import { hashNotePassword } from '@/lib/security';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string' || password.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

    const updated = await NoteModel.findOneAndUpdate(
      query,
      {
        $set: {
          isLocked: true,
          password: hashNotePassword(password.trim()),
        },
      },
      { returnDocument: 'after' }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    const { _id, password: _pwd, __v, ...rest } = (updated as unknown) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      message: 'Note locked successfully',
      data: {
        ...rest,
        id: String(_id),
        isLocked: true,
        content: '',
        images: [],
        checklist: [],
        audioUrl: null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
