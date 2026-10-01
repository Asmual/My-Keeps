import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';
import { getCachedData, setCachedData } from '@/lib/redis';
import { Note } from '@/types/note';

/**
 * Server-side data fetching for initial notes with Redis Cache-Aside.
 * Invoked inside Server Components for instant First Contentful Paint without skeleton flashes.
 */
export async function getServerNotes(userId: string): Promise<Note[]> {
  if (!userId || !userId.trim()) {
    return [];
  }

  const cacheKey = `notes:${userId.trim()}:all`;

  try {
    // 1. Check Redis Cache first (sub-millisecond latency)
    const cached = await getCachedData<{ success: boolean; data: Note[] } | Note[]>(cacheKey);
    if (cached) {
      if (Array.isArray(cached)) return cached;
      if (cached && Array.isArray(cached.data)) return cached.data;
    }

    // 2. Cache miss: fetch from MongoDB Atlas
    await connectToDatabase();
    const rawNotes = await NoteModel.find({
      userId: userId.trim(),
    })
      .sort({ isPinned: -1, isImportant: -1, updatedAt: -1 })
      .lean();

    const notes: Note[] = rawNotes.map((n) => {
      const doc = n as unknown as Record<string, unknown>;
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
        ...(rest as unknown as Omit<Note, 'id' | 'createdAt' | 'updatedAt'>),
        id: String(_id),
        isLocked: hasPassword,
        isUnlocked: isTemporarilyUnlocked,
        unlockedUntil: rest.unlockedUntil ? new Date(rest.unlockedUntil as string | Date).toISOString() : null,
        reminder: rest.reminder ? new Date(rest.reminder as string | Date).toISOString() : null,
        reminderSent: Boolean(rest.reminderSent),
        createdAt: rest.createdAt ? new Date(rest.createdAt as string | Date).toISOString() : new Date().toISOString(),
        updatedAt: rest.updatedAt ? new Date(rest.updatedAt as string | Date).toISOString() : new Date().toISOString(),
      };
    });

    // 3. Populate Redis Cache with 300s TTL
    await setCachedData(cacheKey, { success: true, count: notes.length, data: notes }, 300);

    return notes;
  } catch (error) {
    console.error('[ServerNotes] Error loading notes on server:', error);
    return [];
  }
}
