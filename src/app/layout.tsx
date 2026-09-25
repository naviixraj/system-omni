import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Activity, LayoutDashboard, Database, Settings } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Freelance CRM | Enterprise',
  description: 'Senior-grade client acquisition system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex`}>
        {/* Sleek Minimalist Sidebar */}
        <aside className="w-64 bg-[#0a0a0a] border-r border-white/[0.04] p-6 flex flex-col h-screen sticky top-0">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-sm">OS</span>
            </div>
            <h1 className="text-sm font-bold text-gray-100 tracking-wide">OMNI-SYSTEM</h1>
          </div>

          <nav className="flex-1 space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-white/[0.03] rounded-lg transition-colors">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link href="/discovery" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-lg transition-colors">
              <Activity size={16} /> Global Discovery
            </Link>
            <Link href="/pipeline" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-white/[0.03] rounded-lg transition-colors">
              <Database size={16} /> CRM Pipeline
            </Link>
          </nav>
          
          <div className="pt-6 border-t border-white/[0.04]">
            <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors w-full">
              <Settings size={16} /> Settings
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
