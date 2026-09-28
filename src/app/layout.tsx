import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Freelance CRM | Enterprise',
  description: 'Senior-grade client acquisition system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col md:flex-row max-w-full overflow-x-hidden`}>
        <Sidebar />
        {/* Main Workspace */}
        <main className="flex-1 pt-20 md:pt-8 p-3 sm:p-6 lg:p-12 overflow-y-auto max-w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
