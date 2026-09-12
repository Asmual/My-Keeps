import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';
import { hashNotePassword, verifyNotePassword } from '@/lib/security';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    await connectToDatabase();

    const baseQuery = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

    const query = userId && userId.trim()
      ? { ...baseQuery, userId: userId.trim() }
      : baseQuery;

    const note = await NoteModel.findOne(query).lean();
    if (!note) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    const { _id, password, ...rest } = (note as unknown) as Record<string, unknown>;
    delete rest.__v;

    const hasPassword = Boolean(rest.isLocked);
    const isTemporarilyUnlocked = Boolean(
      hasPassword &&
        rest.unlockedUntil &&
        new Date(rest.unlockedUntil as string | Date).getTime() > Date.now()
    );
    const isEffectivelyLocked = hasPassword && !isTemporarilyUnlocked;

    if (isEffectivelyLocked) {
      rest.content = '';
      rest.images = [];
      rest.checklist = [];
      rest.audioUrl = null;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...rest,
        id: String(_id),
        isLocked: hasPassword,
        isUnlocked: isTemporarilyUnlocked,
        unlockedUntil: rest.unlockedUntil ? new Date(rest.unlockedUntil as string | Date).toISOString() : null,
        reminder: rest.reminder ? new Date(rest.reminder as string | Date).toISOString() : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const body = await request.json();
    const userId = body.userId || userIdParam;

    await connectToDatabase();

    const updatePayload = { ...body };
    // Lock, password and unlock window are managed exclusively via dedicated /lock and /unlock routes
    delete updatePayload.password;
    delete updatePayload.isLocked;
    delete updatePayload.unlockedUntil;
    delete updatePayload.userId;

    if (updatePayload.reminder !== undefined) {
      updatePayload.reminder = updatePayload.reminder ? new Date(updatePayload.reminder) : null;
    }

    const baseQuery = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

    const query = userId && typeof userId === 'string' && userId.trim()
      ? { ...baseQuery, userId: userId.trim() }
      : baseQuery;

    // If attempting to move note to trash, verify password if note is locked
    if (body.isTrashed === true) {
      const existing = await NoteModel.findOne(query);
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
      }
      if (existing.isLocked && existing.password) {
        const providedPassword = body.password;
        if (!providedPassword || !verifyNotePassword(String(providedPassword).trim(), existing.password)) {
          return NextResponse.json(
            { success: false, error: 'Password required to delete a locked note' },
            { status: 403 }
          );
        }
      }
    }

    const updatedNote = await NoteModel.findOneAndUpdate(query, updatePayload, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();

    if (!updatedNote) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    const { _id, password, ...rest } = (updatedNote as unknown) as Record<string, unknown>;
    delete rest.__v;

    const hasPassword = Boolean(rest.isLocked);
    const isTemporarilyUnlocked = Boolean(
      hasPassword &&
        rest.unlockedUntil &&
        new Date(rest.unlockedUntil as string | Date).getTime() > Date.now()
    );
    const isEffectivelyLocked = hasPassword && !isTemporarilyUnlocked;

    if (isEffectivelyLocked) {
      rest.content = '';
      rest.images = [];
      rest.checklist = [];
      rest.audioUrl = null;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...rest,
        id: String(_id),
        isLocked: hasPassword,
        isUnlocked: isTemporarilyUnlocked,
        unlockedUntil: rest.unlockedUntil ? new Date(rest.unlockedUntil as string | Date).toISOString() : null,
        reminder: rest.reminder ? new Date(rest.reminder as string | Date).toISOString() : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    await connectToDatabase();

    const baseQuery = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

    const query = userId && userId.trim()
      ? { ...baseQuery, userId: userId.trim() }
      : baseQuery;

    const note = await NoteModel.findOne(query);
    if (!note) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    // Require password if note is locked
    if (note.isLocked && note.password) {
      const body = await request.json().catch(() => ({}));
      const providedPassword = body.password || searchParams.get('password');
      if (!providedPassword || !verifyNotePassword(String(providedPassword).trim(), note.password)) {
        return NextResponse.json(
          { success: false, error: 'Password required to delete a locked note' },
          { status: 403 }
        );
      }
    }

    await NoteModel.deleteOne(query);

    return NextResponse.json({
      success: true,
      message: 'Note permanently deleted',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
