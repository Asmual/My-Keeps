import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn('⚠️ MONGODB_URI is not defined in environment variables.');
}

const client = new MongoClient(uri || 'mongodb://localhost:27017/my_keeps');
const db = client.db();

const getBaseURL = () => {
  let url =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000';

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
};

const baseUrl = getBaseURL();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-build-and-dev-32charslong!!',
  baseURL: baseUrl,
  trustedOrigins: Array.from(
    new Set(
      [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        baseUrl,
        process.env.BETTER_AUTH_URL,
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      ].filter(Boolean) as string[]
    )
  ),
});

