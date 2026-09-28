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
    <aside className="w-64 bg-transparent border-r border-white/[0.02] p-6 flex flex-col h-screen sticky top-0 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/30">
          <span className="text-white font-bold text-sm tracking-wider">OS</span>
        </div>
        <h1 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 tracking-widest">OMNI-SYSTEM</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' 
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.02] border border-transparent hover:border-white/5'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} /> 
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="pt-6 border-t border-white/[0.02]">
        <button className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] rounded-xl transition-all duration-300 w-full border border-transparent hover:border-white/5">
          <Settings size={18} /> Settings
        </button>
      </div>
    </aside>
  );
}
