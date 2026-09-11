import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';
import { hashNotePassword } from '@/lib/security';
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

    if (rest.isLocked) {
      rest.content = '';
      rest.images = [];
      rest.checklist = [];
      rest.audioUrl = null;
    }

    return NextResponse.json({
      success: true,
      data: { ...rest, id: String(_id), isLocked: Boolean(rest.isLocked) },
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
    // Lock and password are managed exclusively via dedicated /lock and /unlock routes
    delete updatePayload.password;
    delete updatePayload.isLocked;
    delete updatePayload.userId;

    const baseQuery = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

    const query = userId && typeof userId === 'string' && userId.trim()
      ? { ...baseQuery, userId: userId.trim() }
      : baseQuery;

    const updatedNote = await NoteModel.findOneAndUpdate(query, updatePayload, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();

    if (!updatedNote) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    const { _id, password, ...rest } = (updatedNote as unknown) as Record<string, unknown>;
    delete rest.__v;

    if (rest.isLocked) {
      rest.content = '';
      rest.images = [];
      rest.checklist = [];
      rest.audioUrl = null;
    }

    return NextResponse.json({
      success: true,
      data: { ...rest, id: String(_id), isLocked: Boolean(rest.isLocked) },
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

    const deleted = await NoteModel.findOneAndDelete(query);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

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
