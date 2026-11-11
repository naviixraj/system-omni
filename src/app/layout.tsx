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
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-[#080808]`}>
        <Sidebar />
        {/* Main Workspace with independent smooth scrolling and mobile safe area */}
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden pt-16 md:pt-6 pb-20 md:pb-6 p-3.5 sm:p-6 lg:p-8 custom-scrollbar touch-scroll">
          {children}
        </main>
      </body>
    </html>
  );
}
