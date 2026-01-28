import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { AuthProvider } from '@/components/ui/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'D&D Master - AI Dungeon Master',
  description: 'An AI-powered multiplayer Dungeons & Dragons experience',
  keywords: ['D&D', 'Dungeons and Dragons', 'AI', 'Dungeon Master', 'RPG', 'tabletop'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
