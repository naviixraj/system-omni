"use client";

import { Globe2, Target, ArrowRight, Clock, RotateCw, Loader2, AlertTriangle, CheckCircle2, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    active: 0,
    discovered: 0,
    pitched: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error' | 'partial'; message: string } | null>(null);

  const loadData = () => {
    // Fetch pipeline stats
    fetch("/api/saved-jobs", { cache: "no-store" })
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
    fetch("/api/live-jobs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStats((prev) => ({ ...prev, discovered: data.length }));
          setRecentProjects(data.slice(0, 4)); // Get the 4 absolute newest projects
        }
      })
      .catch(() => {});
  };

  const triggerScan = async () => {
    setIsScanning(true);
    setScanStatus(null);
    try {
      const res = await fetch("/api/cron", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.errors && data.errors.length > 0) {
          setScanStatus({
            type: 'partial',
            message: `Synced ${data.newLeadsFound || 0} new orders. (${data.errors.join('; ')})`
          });
        } else {
          setScanStatus({
            type: 'success',
            message: `Orders check completed! Found ${data.newLeadsFound || 0} new orders across active platforms.`
          });
        }
        loadData();
      } else {
        const errorMsg = data.error || data.message || "Failed to scan orders from remote platforms";
        setScanStatus({
          type: 'error',
          message: `Orders check notice: ${errorMsg}. Click to retry.`
        });
      }
    } catch (err: any) {
      setScanStatus({
        type: 'error',
        message: `Orders check network error: ${err.message || 'Scraper connection interrupted'}. Click to retry.`
      });
    }
    setIsScanning(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Live real-time polling every 15s
    return () => clearInterval(interval);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-neutral-300">Overview</span>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">System Command Center</h1>
            <span className="sm:hidden flex items-center gap-1 text-[9px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Auto-Sync 15s
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={triggerScan}
            disabled={isScanning}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-md text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.12] active:bg-white/[0.18] active:scale-[0.98] text-neutral-100 border border-white/[0.12] hover:border-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm min-h-[42px] sm:min-h-0"
            title="Trigger instant live orders check across all platforms"
          >
            {isScanning ? (
              <>
                <Loader2 size={14} className="animate-spin text-amber-400" />
                <span>Checking 16+ Platforms...</span>
              </>
            ) : (
              <>
                <RotateCw size={14} className="text-emerald-400" />
                <span>Check Orders Now</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <Link 
              href="/discovery" 
              className="premium-button text-xs flex items-center justify-center gap-2 py-2.5 sm:py-1.5 rounded-xl sm:rounded-md active:scale-[0.98] min-h-[42px] sm:min-h-0 text-center font-medium"
            >
              <Globe2 size={14} className="text-blue-400 shrink-0" /> 
              <span>Discovery</span>
            </Link>
            <Link 
              href="/pipeline" 
              className="premium-button-primary text-xs flex items-center justify-center gap-2 py-2.5 sm:py-1.5 rounded-xl sm:rounded-md active:scale-[0.98] min-h-[42px] sm:min-h-0 text-center font-medium"
            >
              <Target size={14} className="shrink-0" /> 
              <span>Pipeline</span>
            </Link>
          </div>
        </div>
      </div>

      {/* SCAN STATUS FEEDBACK */}
      {scanStatus && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
          scanStatus.type === 'error' 
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
            : scanStatus.type === 'partial'
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            {scanStatus.type === 'error' ? (
              <AlertTriangle size={15} className="text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            )}
            <span className="leading-snug">{scanStatus.message}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {scanStatus.type === 'error' && (
              <button 
                onClick={triggerScan} 
                className="text-[11px] underline hover:text-white px-2 py-0.5"
              >
                Retry
              </button>
            )}
            <button 
              onClick={() => setScanStatus(null)} 
              className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* KPI METRICS BAR (LINEAR STYLE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="premium-panel p-3.5 sm:p-4 flex flex-col justify-between rounded-xl active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1.5 sm:mb-2">
            <span className="truncate flex items-center gap-1.5">
              <Globe2 size={13} className="text-emerald-400" />
              Total Leads
            </span>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">+12%</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{stats.discovered}</div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">Live database records</div>
        </div>

        <div className="premium-panel p-3.5 sm:p-4 flex flex-col justify-between rounded-xl active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1.5 sm:mb-2">
            <span className="truncate flex items-center gap-1.5">
              <Target size={13} className="text-blue-400" />
              Pipeline
            </span>
            <span className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0">Deals</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{stats.active}</div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">Saved to CRM pipeline</div>
        </div>

        <div className="premium-panel p-3.5 sm:p-4 flex flex-col justify-between rounded-xl active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1.5 sm:mb-2">
            <span className="truncate flex items-center gap-1.5">
              <Sparkles size={13} className="text-purple-400" />
              AI Pitches
            </span>
            <span className="text-[10px] text-purple-400 font-medium bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 shrink-0">AI</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{stats.pitched}</div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">Outreach generated</div>
        </div>

        <div className="premium-panel p-3.5 sm:p-4 flex flex-col justify-between rounded-xl active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1.5 sm:mb-2">
            <span className="truncate flex items-center gap-1.5">
              <RotateCw size={13} className="text-emerald-400" />
              Scraper
            </span>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">Online</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">Active</div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">Scanning 16+ Platforms</div>
        </div>
      </div>

      {/* RECENT LEADS SPLIT LIST (LINEAR DATA-DENSE VIEW) */}
      <div className="premium-panel overflow-hidden rounded-xl">
        <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Clock size={14} className="text-neutral-400" />
            <h2 className="text-xs font-semibold text-neutral-200 tracking-wider uppercase">Incoming Real-Time Leads</h2>
          </div>
          <Link href="/discovery" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors">
            View All <ArrowRight size={13} />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            Waiting for next cron cycle to populate leads...
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {recentProjects.map((project) => (
              <Link 
                key={project.id} 
                href="/discovery"
                className="px-3.5 sm:px-5 py-3.5 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors group block"
              >
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 w-full">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 mt-0.5 sm:mt-0 ${getPlatformBadge(project.platform, project.leadType)}`}>
                    {project.platform}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-xs font-medium text-neutral-100 group-hover:text-white line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                      {project.leadType === 'LOCAL' 
                        ? `Issue: ${project.issueDetected?.replace(/_/g, ' ') || 'None'} • ${project.district || 'Local'}` 
                        : 'Global Freelance Lead'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto pt-1 sm:pt-0 border-t border-white/[0.03] sm:border-none">
                  <span className="text-[11px] sm:text-xs font-mono font-medium text-emerald-400/90 sm:text-neutral-300">
                    {project.leadType === 'LOCAL' ? 'High Target' : project.budget}
                  </span>
                  <div className="p-1 text-neutral-500 group-hover:text-neutral-200 transition-colors">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
