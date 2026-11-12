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
  viewportFit: 'cover',
  themeColor: '#080808',
};

export const metadata: Metadata = {
  title: 'OMNI-SYSTEM | Autonomous Client Acquisition & CRM',
  description: 'Senior-grade autonomous freelance lead discovery, client acquisition, and CRM pipeline system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-[#080808] text-[#ededed]`}>
        <Sidebar />
        {/* Main Workspace with independent smooth scrolling, safe-area clearance, and mobile padding */}
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden pt-16 md:pt-6 pb-28 md:pb-8 p-3.5 sm:p-6 lg:p-8 custom-scrollbar touch-scroll">
          {children}
        </main>
      </body>
    </html>
  );
}
