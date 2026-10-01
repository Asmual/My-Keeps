import { headers, cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';

export interface UserSession {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AuthSession {
  user: UserSession;
  session?: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date | string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

/**
 * Server-side session verification with Redis caching.
 * Resolves session synchronously during Server Component rendering to prevent auth flickers.
 */
export async function getServerSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get('better-auth.session_token')?.value ||
      cookieStore.get('__Secure-better-auth.session_token')?.value;

    if (!token) {
      return null;
    }

    // 1. Check Redis Cache for ultra-fast session lookup (<2ms)
    const cacheKey = `session:token:${token}`;
    const cached = await getCachedData<AuthSession>(cacheKey);
    if (cached && cached.user) {
      return cached;
    }

    // 2. Fallback to Better Auth database verification
    const reqHeaders = await headers();
    const serverSession = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (serverSession && serverSession.user) {
      const formattedSession: AuthSession = {
        user: {
          id: serverSession.user.id,
          email: serverSession.user.email,
          name: serverSession.user.name || null,
          image: serverSession.user.image || null,
        },
        session: serverSession.session
          ? {
              id: serverSession.session.id,
              userId: serverSession.session.userId,
              token: serverSession.session.token,
              expiresAt: serverSession.session.expiresAt,
            }
          : undefined,
      };

      // Cache session in Redis for 120 seconds
      await setCachedData(cacheKey, formattedSession, 120);
      return formattedSession;
    }

    return null;
  } catch (err) {
    console.error('[Session] Error fetching server session:', err);
    return null;
  }
}

/**
 * Invalidate server-cached session token when user logs out.
 */
export async function invalidateServerSession(token?: string): Promise<void> {
  if (token) {
    await invalidateCache(`session:token:${token}`);
  }
}
