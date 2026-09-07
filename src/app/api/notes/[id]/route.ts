import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';

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

    const { _id, ...rest } = (note as unknown) as Record<string, unknown>;
    delete rest.__v;

    return NextResponse.json({
      success: true,
      data: { ...rest, id: String(_id) },
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

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id }] }
      : { id };

    const updatedNote = await NoteModel.findOneAndUpdate(query, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedNote) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    const { _id, ...rest } = (updatedNote as unknown) as Record<string, unknown>;
    delete rest.__v;

    return NextResponse.json({
      success: true,
      data: { ...rest, id: String(_id) },
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
      return NextResponse.json({ success: false, error: 'Note not found in MongoDB' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Note permanently deleted from MongoDB',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
