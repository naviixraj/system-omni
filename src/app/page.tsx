"use client";

import { Activity, Globe2, Target, TrendingUp, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    active: 0,
    discovered: 0,
    pitched: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    // Fetch pipeline stats
    fetch("/api/saved-jobs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStats((prev) => ({
            ...prev,
            active: data.length,
            pitched: data.filter((j: any) => j.status === 'PITCHED' || j.status === 'WON').length,
          }));
        }
      })
      .catch(() => {});

    // Fetch live feed for stats and recent projects
    fetch("/api/live-jobs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStats((prev) => ({ ...prev, discovered: data.length }));
          setRecentProjects(data.slice(0, 4)); // Get the 4 absolute newest projects
        }
      })
  }, []);

  const getPlatformBadge = (platform: string, leadType: string) => {
    switch (platform) {
      case 'UPWORK':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REMOTEOK':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'WEWORKREMOTELY':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'HACKER_NEWS':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'FIVERR PRO':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'GURU':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'PEOPLEPERHOUR':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'X (TWITTER)':
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
      case 'REDDIT (r/forhire)':
      case 'REDDIT (r/slavelabour)':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'LINKEDIN':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'WELLFOUND':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return leadType === 'LOCAL' 
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
          : 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* HEADER BREADCRUMB & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-neutral-300">Overview</span>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">System Command Center</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/discovery" className="premium-button text-xs flex items-center gap-2">
            <Globe2 size={14} /> Discovery Feed
          </Link>
          <Link href="/pipeline" className="premium-button-primary text-xs flex items-center gap-2">
            <Target size={14} /> Pipeline Board
          </Link>
        </div>
      </div>

      {/* KPI METRICS BAR (LINEAR STYLE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="premium-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Total Leads</span>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">+12%</span>
          </div>
          <div className="text-2xl font-semibold text-white tracking-tight">{stats.discovered}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Live database records</div>
        </div>

        <div className="premium-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Active Pipeline</span>
            <span className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Deals</span>
          </div>
          <div className="text-2xl font-semibold text-white tracking-tight">{stats.active}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Saved to CRM pipeline</div>
        </div>

        <div className="premium-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Pitches Dispatched</span>
            <span className="text-[10px] text-purple-400 font-medium bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">AI</span>
          </div>
          <div className="text-2xl font-semibold text-white tracking-tight">{stats.pitched}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Outreach generated</div>
        </div>

        <div className="premium-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Scraper Engine</span>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Online</span>
          </div>
          <div className="text-2xl font-semibold text-white tracking-tight">Active</div>
          <div className="text-[11px] text-neutral-500 mt-1">Scanning Maps & OSM</div>
        </div>
      </div>

      {/* RECENT LEADS SPLIT LIST (LINEAR DATA-DENSE VIEW) */}
      <div className="premium-panel overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock size={14} className="text-neutral-400" />
            <h2 className="text-xs font-semibold text-neutral-200 tracking-wider uppercase">Incoming Real-Time Leads</h2>
          </div>
          <Link href="/discovery" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors">
            View All Leads <ArrowRight size={13} />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            Waiting for next cron cycle to populate leads...
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {recentProjects.map((project) => (
              <div key={project.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getPlatformBadge(project.platform, project.leadType)}`}>
                    {project.platform}
                  </span>
                  <div>
                    <h3 className="text-xs font-medium text-neutral-100">{project.title}</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {project.leadType === 'LOCAL' 
                        ? `Issue: ${project.issueDetected?.replace(/_/g, ' ') || 'None'} • ${project.district || 'Local'}` 
                        : 'Global Freelance Lead'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-medium text-neutral-300">
                    {project.leadType === 'LOCAL' ? 'High Target' : project.budget}
                  </span>
                  <Link href="/discovery" className="p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.05] rounded transition-colors">
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal missing icon wrapper
function Database(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  );
}
