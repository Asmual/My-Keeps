import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';
import { verifyNotePassword } from '@/lib/security';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password, action = 'unlock', userId } = body;

    await connectToDatabase();

    const baseQuery = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

    const query = userId && typeof userId === 'string' && userId.trim()
      ? { ...baseQuery, userId: userId.trim() }
      : baseQuery;

    const note = await NoteModel.findOne(query);
    if (!note) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    if (!note.isLocked) {
      const obj = (note.toObject() as unknown) as Record<string, unknown>;
      delete obj.password;
      delete obj.__v;
      return NextResponse.json({
        success: true,
        message: 'Note is not locked',
        data: { ...obj, id: String(obj._id) },
      });
    }

    if (!password || !note.password || !verifyNotePassword(String(password).trim(), note.password)) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Password verified!
    if (action === 'remove-lock') {
      await NoteModel.findOneAndUpdate(query, {
        $set: { isLocked: false, password: null },
      });
      note.isLocked = false;
      note.password = null;
    }

    const obj = (note.toObject() as unknown) as Record<string, unknown>;
    delete obj.password;
    delete obj.__v;

    return NextResponse.json({
      success: true,
      message: action === 'remove-lock' ? 'Lock removed successfully' : 'Note unlocked successfully',
      data: { ...obj, id: String(obj._id) },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
