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
    const { password, userId, action } = body;

    await connectToDatabase();

    const baseQuery = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

    const query = userId && typeof userId === 'string' && userId.trim()
      ? { ...baseQuery, userId: userId.trim() }
      : baseQuery;

    // If manual re-lock action requested on existing locked note:
    if (action === 'lock-now') {
      const reLocked = await NoteModel.findOneAndUpdate(
        query,
        {
          $set: {
            unlockedUntil: null,
          },
        },
        { returnDocument: 'after' }
      ).lean();

      if (!reLocked) {
        return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
      }

      const { _id, password: _pwd, __v, ...rest } = (reLocked as unknown) as Record<string, unknown>;

      return NextResponse.json({
        success: true,
        message: 'Note locked successfully',
        data: {
          ...rest,
          id: String(_id),
          isLocked: true,
          isUnlocked: false,
          unlockedUntil: null,
          content: '',
          images: [],
          checklist: [],
          audioUrl: null,
        },
      });
    }

    if (!password || typeof password !== 'string' || password.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    const updated = await NoteModel.findOneAndUpdate(
      query,
      {
        $set: {
          isLocked: true,
          password: hashNotePassword(password.trim()),
          unlockedUntil: null,
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
