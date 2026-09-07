import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'all', 'archive', 'trash'
    const userId = searchParams.get('userId');

    await connectToDatabase();

    const query: Record<string, unknown> = {};

    if (userId) {
      query.userId = userId;
    }

    if (filter === 'archive') {
      query.isArchived = true;
      query.isTrashed = false;
    } else if (filter === 'trash') {
      query.isTrashed = true;
    } else if (filter === 'reminders') {
      query.isArchived = false;
      query.isTrashed = false;
      query.reminder = { $ne: null };
    } else {
      // Default active notes
      query.isArchived = false;
      query.isTrashed = false;
    }

    const rawNotes = await NoteModel.find(query).sort({ isPinned: -1, updatedAt: -1 }).lean();

    const notes = rawNotes.map((n) => {
      const doc = (n as unknown) as Record<string, unknown>;
      const { _id, ...rest } = doc;
      delete rest.__v;
      return {
        ...rest,
        id: String(_id),
      };
    });

    return NextResponse.json({ success: true, count: notes.length, data: notes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const created = await NoteModel.create({
      title: body.title || '',
      content: body.content || '',
      color: body.color || 'default',
      isPinned: Boolean(body.isPinned),
      isArchived: Boolean(body.isArchived),
      isTrashed: false,
      labels: body.labels || [],
      checklist: body.checklist || [],
      reminder: body.reminder || null,
      userId: body.userId || null,
    });

    const noteObj = created.toObject();
    const result = {
      ...noteObj,
      id: String(noteObj._id),
    };

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    await connectToDatabase();

    if (action === 'empty-trash') {
      const query: Record<string, unknown> = { isTrashed: true };
      if (userId) query.userId = userId;

      const res = await NoteModel.deleteMany(query);
      return NextResponse.json({
        success: true,
        message: 'Trash emptied successfully from MongoDB',
        deletedCount: res.deletedCount,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
