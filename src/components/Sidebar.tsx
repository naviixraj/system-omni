"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, Database, Settings } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/discovery', label: 'Global Discovery', icon: Activity },
    { href: '/pipeline', label: 'CRM Pipeline', icon: Database },
  ];

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-white/[0.04] p-6 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-white font-bold text-sm">OS</span>
        </div>
        <h1 className="text-sm font-bold text-gray-100 tracking-wide">OMNI-SYSTEM</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.03]'
              }`}
            >
              <Icon size={16} /> {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="pt-6 border-t border-white/[0.04]">
        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors w-full">
          <Settings size={16} /> Settings
        </button>
      </div>
    </aside>
  );
}
