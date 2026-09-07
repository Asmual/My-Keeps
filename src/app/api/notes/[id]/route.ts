import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const note = await NoteModel.findById(id);
    if (!note) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: note });
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
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        success: true,
        message: 'Mock update successful',
        data: { _id: id, ...body },
      });
    }

    const updatedNote = await NoteModel.findByIdAndUpdate(id, body, { new: true });
    if (!updatedNote) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedNote });
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
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ success: true, message: 'Mock delete successful' });
    }

    const deleted = await NoteModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Note permanently deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
