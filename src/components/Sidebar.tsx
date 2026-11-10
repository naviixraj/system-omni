
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
        fixed md:sticky top-0 left-0 h-screen w-60 bg-[#080808] border-r border-white/[0.08] p-4 flex flex-col z-50 transition-transform duration-200 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-8 px-2 pt-2 md:pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-extrabold text-xs tracking-tight">OS</span>
            </div>
            <span className="text-xs font-semibold text-neutral-200 tracking-wider uppercase">Omni-System</span>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-neutral-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Workspace</span>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'text-white bg-white/[0.08] border border-white/[0.08]' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className={isActive ? 'text-white' : 'text-neutral-400'} /> 
                  <span>{link.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
              </Link>
            );
          })}
        </nav>
        
        <div className="pt-4 border-t border-white/[0.08] space-y-1">
          <div className="px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">Scraper Status</span>
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
            </span>
          </div>
          <button className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03] rounded-md transition-colors w-full border border-transparent">
            <Settings size={15} /> Settings
          </button>
        </div>
      </aside>
    </>
  );
}
