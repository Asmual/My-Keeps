import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { NotesProvider } from '@/components/providers/NotesProvider';
import { Toaster } from 'react-hot-toast';
import { NoteEditModal } from '@/components/notes/NoteEditModal';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'My Keeps - Clean Note-Taking & Organization',
  description: 'Minimalist note-taking workspace inspired by Google Keep',
  icons: {
    icon: '/images/MK-logo.png',
    apple: '/images/MK-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('mykeeps-theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-amber-500/20 selection:text-amber-900 dark:selection:text-amber-200"
      >
        <ThemeProvider>
          <NotesProvider>
            {children}
            <NoteEditModal />
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 2500,
                style: {
                  background: '#1c1c1f',
                  color: '#ffffff',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                },
              }}
            />
          </NotesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
