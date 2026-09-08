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
    await connectToDatabase();

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

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
    const body = await request.json();
    await connectToDatabase();

    const updatePayload = { ...body };
    // Lock and password are managed exclusively via dedicated /lock and /unlock routes
    delete updatePayload.password;
    delete updatePayload.isLocked;

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

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
    await connectToDatabase();

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

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
