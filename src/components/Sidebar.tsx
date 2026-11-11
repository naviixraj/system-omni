'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Compass, Layers, Menu, X, Shield } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/', label: 'Dashboard', shortLabel: 'Overview', icon: LayoutDashboard },
    { href: '/discovery', label: 'Global Discovery', shortLabel: 'Discovery', icon: Compass },
    { href: '/pipeline', label: 'CRM Pipeline', shortLabel: 'Pipeline', icon: Layers },
  ];

  return (
    <>
      {/* MOBILE TOP APP BAR */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#08080a]/85 backdrop-blur-xl border-b border-white/[0.08] px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white to-neutral-200 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            <span className="text-black font-extrabold text-[12px] tracking-tight">OS</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wider uppercase">Omni-System</span>
              <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-neutral-400 hover:text-white bg-white/[0.04] active:bg-white/[0.1] active:scale-95 rounded-lg border border-white/[0.08] transition-all"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED FOR THUMB NAVIGATION) */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09090b]/90 backdrop-blur-2xl border-t border-white/[0.1] flex items-center justify-around z-40 px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_35px_rgba(0,0,0,0.8)]"
        aria-label="Mobile Navigation"
      >
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-90 duration-150 ${
                isActive 
                  ? 'text-white' 
                  : 'text-neutral-500 active:text-neutral-300'
              }`}
            >
              <div className={`relative px-3 py-1 rounded-full transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.3)]' 
                  : 'text-neutral-400'
              }`}>
                <Icon size={18} className="transition-transform" />
                {isActive && (
                  <span className="absolute -top-0.5 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-neutral-400 font-medium'
              }`}>
                {link.shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* DESKTOP SIDEBAR & MOBILE DRAWER */}
      <aside className={`
        fixed md:static top-0 left-0 h-screen w-60 flex-shrink-0 bg-[#080808] border-r border-white/[0.08] p-4 flex flex-col z-50 select-none transition-transform duration-200 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* SIDEBAR LOGO */}
        <div className="flex items-center justify-between mb-8 px-2 pt-2 md:pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-extrabold text-xs tracking-tight">OS</span>
            </div>
            <span className="text-xs font-semibold text-neutral-200 tracking-wider uppercase">Omni-System</span>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-neutral-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Workspace</span>
        </div>

        {/* NAVIGATION LINKS */}
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
        
        {/* FOOTER WIDGET */}
        <div className="pt-4 border-t border-white/[0.08] space-y-2">
          <div className="px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">Scraper Watchdog</span>
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
            </span>
          </div>
          <div className="px-3 py-1.5 text-[10px] text-neutral-500 flex items-center gap-1.5">
            <Shield size={12} className="text-neutral-400" />
            <span>Mobile Optimized v2.4</span>
          </div>
        </div>
      </aside>
    </>
  );
}
