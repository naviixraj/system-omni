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
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">System Overview</h1>
          <p className="text-gray-400 text-sm">Welcome back. The Omni-Cron is actively scanning 16+ platforms.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/discovery" className="premium-button text-sm flex items-center gap-2">
            <Globe2 size={16} /> Open Discovery
          </Link>
          <Link href="/pipeline" className="premium-button-primary text-sm flex items-center gap-2">
            <Target size={16} /> View Pipeline
          </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="premium-panel p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Activity className="text-blue-400" size={20} />
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">Live</span>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Total Leads Found</h3>
            <p className="text-3xl font-extrabold text-white tracking-tight">{stats.discovered}</p>
          </div>
        </div>

        <div className="premium-panel p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Database className="text-purple-400" size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Leads in Pipeline</h3>
            <p className="text-3xl font-extrabold text-white tracking-tight">{stats.active}</p>
          </div>
        </div>

        <div className="premium-panel p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
              <TrendingUp className="text-pink-400" size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Total Pitches Sent</h3>
            <p className="text-3xl font-extrabold text-white tracking-tight">{stats.pitched}</p>
          </div>
        </div>
      </div>

      {/* RECENT UPDATES / NEW PROJECTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Panel */}
        <div className="premium-panel p-6 lg:col-span-1">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            Engine Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-[#121212] rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <Globe2 className="text-gray-400" size={18} />
                <span className="text-sm font-medium text-gray-200">Global Aggregator</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Online</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-[#121212] rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <Target className="text-gray-400" size={18} />
                <span className="text-sm font-medium text-gray-200">Google Maps Drip</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Online</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-[#121212] rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <Activity className="text-gray-400" size={18} />
                <span className="text-sm font-medium text-gray-200">Omni-Cron Timer</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Every 5m</span>
            </div>
          </div>
        </div>

        {/* Live New Projects Updates */}
        <div className="premium-panel p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="text-blue-400" size={18} />
              Recent Project Updates
            </h3>
            <Link href="/discovery" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col gap-3">
            {recentProjects.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm border border-dashed border-white/5 rounded-xl">
                Waiting for Omni-Cron to find new projects...
              </div>
            ) : (
              recentProjects.map(project => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-[#121212] hover:bg-[#1a1a1a] rounded-xl border border-white/[0.04] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${project.leadType === 'LOCAL' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {project.platform}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-200 leading-tight">{project.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {project.leadType === 'LOCAL' ? `Issue: ${project.issueDetected} in ${project.district}` : 'Global Freelance Lead'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className="text-sm font-bold text-gray-300">
                       {project.leadType === 'LOCAL' ? 'High Target' : project.budget}
                     </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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
