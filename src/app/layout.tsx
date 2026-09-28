import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Freelance CRM | Enterprise',
  description: 'Senior-grade client acquisition system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex`}>
        <Sidebar />
        {/* Main Workspace */}
        <main className="flex-1 pt-20 md:pt-8 p-4 md:p-8 lg:p-12 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
