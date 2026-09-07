// Authentication helper placeholder for Next.js full-stack architecture.
// Ready to integrate with NextAuth / Auth.js / Custom JWT authentication.

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
}

export async function getSession(): Promise<AuthSession | null> {
  // Placeholder session retriever
  return {
    user: {
      id: 'demo-user-1',
      email: 'user@mykeeps.local',
      name: 'Demo User',
    },
  };
}
