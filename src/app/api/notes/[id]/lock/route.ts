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

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Password is required to lock note' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

    const note = await NoteModel.findOne(query);
    if (!note) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    note.isLocked = true;
    note.password = hashNotePassword(password.trim());
    await note.save();

    const obj = (note.toObject() as unknown) as Record<string, unknown>;
    delete obj.password;
    delete obj.__v;

    // Mask sensitive fields in response
    obj.content = '';
    obj.images = [];
    obj.checklist = [];
    obj.audioUrl = null;

    return NextResponse.json({
      success: true,
      message: 'Note locked successfully',
      data: { ...obj, id: String(obj._id) },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
