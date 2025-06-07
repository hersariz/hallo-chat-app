import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AIConfigProvider } from '@/lib/context';
import I18nextClientProvider from '@/components/I18nextClientProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hallo - Aplikasi Chat',
  description: 'Aplikasi chatting modern mirip WhatsApp',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <I18nextClientProvider>
          <AIConfigProvider>
            <main className="min-h-screen bg-gray-100">{children}</main>
          </AIConfigProvider>
        </I18nextClientProvider>
      </body>
    </html>
  );
} 