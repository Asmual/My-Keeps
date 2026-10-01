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
    const reqHeaders = await headers();
    const cookieStore = await cookies();

    // Find any session token cookie across prefixes (__Secure-, better-auth., etc.)
    const allCookies = cookieStore.getAll();
    const sessionCookie = allCookies.find(
      (c) => c.name.endsWith('session_token') || c.name.includes('session_token')
    );
    const rawToken = sessionCookie?.value;
    const cleanToken = rawToken
      ? rawToken.includes('.')
        ? rawToken.split('.')[0]
        : rawToken
      : undefined;

    // 1. Check Redis Cache first for ultra-fast session lookup (<2ms)
    if (cleanToken) {
      const cached = await getCachedData<AuthSession>(`session:token:${cleanToken}`);
      if (cached && cached.user) {
        return cached;
      }
    }
    if (rawToken && rawToken !== cleanToken) {
      const cached = await getCachedData<AuthSession>(`session:token:${rawToken}`);
      if (cached && cached.user) {
        return cached;
      }
    }

    // 2. Database verification via Better Auth API
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

      // Cache session in Redis for 120 seconds across all token variants
      const serverToken = serverSession.session?.token;
      if (serverToken) {
        await setCachedData(`session:token:${serverToken}`, formattedSession, 120);
      }
      if (cleanToken && cleanToken !== serverToken) {
        await setCachedData(`session:token:${cleanToken}`, formattedSession, 120);
      }
      if (rawToken && rawToken !== serverToken) {
        await setCachedData(`session:token:${rawToken}`, formattedSession, 120);
      }

      return formattedSession;
    }

    return null;
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('[Session] Error fetching server session:', err);
    return null;
  }
}

/**
 * Invalidate server-cached session token when user logs out.
 */
export async function invalidateServerSession(token?: string): Promise<void> {
  if (token) {
    const cleanToken = token.includes('.') ? token.split('.')[0] : token;
    await invalidateCache(`session:token:${token}`);
    if (cleanToken !== token) {
      await invalidateCache(`session:token:${cleanToken}`);
    }
  }
}
