
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Activity, LayoutDashboard, Database, Settings, Menu, X } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/discovery', label: 'Global Discovery', icon: Activity },
    { href: '/pipeline', label: 'CRM Pipeline', icon: Database },
  ];

  return (
    <>
      {/* MOBILE TOP NAVIGATION BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#050505]/90 backdrop-blur-lg border-b border-white/[0.05] px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/30">
            <span className="text-white font-bold text-sm tracking-wider">OS</span>
          </div>
          <h1 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 tracking-widest">OMNI-SYSTEM</h1>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg border border-white/10"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER (DESKTOP & MOBILE DRAWER) */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-[#050505] md:bg-transparent border-r border-white/[0.04] p-6 flex flex-col z-50 backdrop-blur-md transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-8 md:mb-12 px-2 pt-2 md:pt-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/30">
              <span className="text-white font-bold text-sm tracking-wider">OS</span>
            </div>
            <h1 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 tracking-widest">OMNI-SYSTEM</h1>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setMobileOpen(false)}
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
        
        <div className="pt-6 border-t border-white/[0.04]">
          <button className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] rounded-xl transition-all duration-300 w-full border border-transparent hover:border-white/5">
            <Settings size={18} /> Settings
          </button>
        </div>
      </aside>
    </>
  );
}
