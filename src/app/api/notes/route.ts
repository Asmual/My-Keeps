import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';
import { hashNotePassword } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'all', 'archive', 'trash'
    const userId = searchParams.get('userId');

    // Strict multi-tenant isolation: Unauthenticated requests or missing userId return empty array
    if (!userId || !userId.trim()) {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

    await connectToDatabase();

    const query: Record<string, unknown> = {
      userId: userId.trim(),
    };

    if (filter === 'archive') {
      query.isArchived = true;
      query.isTrashed = false;
    } else if (filter === 'trash') {
      query.isTrashed = true;
    } else if (filter === 'checklist') {
      query.isArchived = false;
      query.isTrashed = false;
      query.$or = [{ noteType: 'checklist' }, { 'checklist.0': { $exists: true } }];
    } else if (filter === 'important') {
      query.isArchived = false;
      query.isTrashed = false;
      query.isImportant = true;
    } else if (filter === 'image') {
      query.isArchived = false;
      query.isTrashed = false;
      query.$or = [{ noteType: 'image' }, { 'images.0': { $exists: true } }];
    } else if (filter === 'voice') {
      query.isArchived = false;
      query.isTrashed = false;
      query.$or = [{ noteType: 'voice' }, { audioUrl: { $ne: null } }];
    } else if (filter === 'reminders') {
      query.isArchived = false;
      query.isTrashed = false;
      query.reminder = { $ne: null };
    } else {
      // Default active notes
      query.isArchived = false;
      query.isTrashed = false;
    }

    const rawNotes = await NoteModel.find(query).sort({ isPinned: -1, isImportant: -1, updatedAt: -1 }).lean();

    const notes = rawNotes.map((n) => {
      const doc = (n as unknown) as Record<string, unknown>;
      const { _id, password, ...rest } = doc;
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
      return {
        ...rest,
        id: String(_id),
        isLocked: hasPassword,
        isUnlocked: isTemporarilyUnlocked,
        unlockedUntil: rest.unlockedUntil ? new Date(rest.unlockedUntil as string | Date).toISOString() : null,
        reminder: rest.reminder ? new Date(rest.reminder as string | Date).toISOString() : null,
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

    if (!body.userId || typeof body.userId !== 'string' || !body.userId.trim()) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to create notes.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let isLocked = Boolean(body.isLocked);
    let passwordHash: string | null = null;
    if (body.password && typeof body.password === 'string' && body.password.trim().length >= 4) {
      isLocked = true;
      passwordHash = hashNotePassword(body.password.trim());
    }

    const created = await NoteModel.create({
      title: body.title || '',
      content: body.content || '',
      color: body.color || 'default',
      isPinned: Boolean(body.isPinned),
      isImportant: Boolean(body.isImportant),
      isArchived: Boolean(body.isArchived),
      isTrashed: false,
      labels: body.labels || [],
      checklist: body.checklist || [],
      noteType: body.noteType || 'text',
      images: body.images || [],
      audioUrl: body.audioUrl || null,
      reminder: body.reminder ? new Date(body.reminder) : null,
      isLocked,
      password: passwordHash,
      userId: body.userId.trim(),
    });

    const noteObj = (created.toObject() as unknown) as Record<string, unknown>;
    delete noteObj.password;
    delete noteObj.__v;
    if (isLocked) {
      noteObj.content = '';
      noteObj.images = [];
      noteObj.checklist = [];
      noteObj.audioUrl = null;
    }
    const result = {
      ...noteObj,
      id: String(noteObj._id),
      isLocked: Boolean(noteObj.isLocked),
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

    if (!userId || !userId.trim()) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    if (action === 'empty-trash') {
      const query: Record<string, unknown> = {
        isTrashed: true,
        userId: userId.trim(),
        isLocked: { $ne: true },
      };

      const res = await NoteModel.deleteMany(query);
      return NextResponse.json({
        success: true,
        message: 'Trash emptied successfully (locked notes preserved)',
        deletedCount: res.deletedCount,
      });
    }

    // Support batch deletion by IDs
    let ids: string[] = [];
    try {
      const body = await request.json();
      if (Array.isArray(body.ids)) {
        ids = body.ids;
      }
    } catch {
      // not a json body
    }

    if (ids.length > 0) {
      const objectIds = ids
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const query: Record<string, unknown> = {
        $or: [
          { _id: { $in: objectIds } },
          { id: { $in: ids } },
        ],
        userId: userId.trim(),
        isLocked: { $ne: true }, // Protect locked notes from batch delete
      };

      const res = await NoteModel.deleteMany(query);
      return NextResponse.json({
        success: true,
        message: `${res.deletedCount} notes deleted`,
        deletedCount: res.deletedCount,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid delete request' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
