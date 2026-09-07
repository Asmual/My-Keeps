import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'all', 'archive', 'trash'

    const db = await connectToDatabase();
    if (!db) {
      // If DB is not connected yet, return mock readiness response
      return NextResponse.json({
        success: true,
        message: 'Full-stack API is ready. Set MONGODB_URI to persist to MongoDB.',
        data: [],
      });
    }

    const query: Record<string, unknown> = {};
    if (filter === 'archive') {
      query.isArchived = true;
      query.isTrashed = false;
    } else if (filter === 'trash') {
      query.isTrashed = true;
    } else {
      query.isArchived = false;
      query.isTrashed = false;
    }

    const notes = await NoteModel.find(query).sort({ isPinned: -1, updatedAt: -1 });
    return NextResponse.json({ success: true, data: notes });
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
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json({
        success: true,
        message: 'Mock creation successful (Connect MongoDB for database persistence)',
        data: { ...body, _id: 'mock_' + Date.now() },
      });
    }

    const newNote = await NoteModel.create(body);
    return NextResponse.json({ success: true, data: newNote }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
