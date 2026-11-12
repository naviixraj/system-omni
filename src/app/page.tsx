"use client";

import { Globe2, Target, ArrowRight, Clock, RotateCw, Loader2, AlertTriangle, CheckCircle2, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    active: 0,
    discovered: 0,
    pitched: 0,
    won: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error' | 'partial'; message: string } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Live");
  const [dbConnected, setDbConnected] = useState<boolean>(true);

  const loadData = () => {
    // Fetch pipeline stats
    fetch("/api/saved-jobs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStats((prev) => ({
            ...prev,
            active: data.length,
            pitched: data.filter((j: any) => j.status === 'PITCHED').length,
            won: data.filter((j: any) => j.status === 'WON').length,
          }));
          setDbConnected(true);
        }
      })
      .catch(() => {
        setDbConnected(false);
      });

    // Fetch live feed for stats and recent projects
    fetch("/api/live-jobs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStats((prev) => ({ ...prev, discovered: data.length }));
          setRecentProjects(data.slice(0, 6)); // Display top 6 newest projects
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setDbConnected(true);
        }
      })
      .catch(() => {
        setDbConnected(false);
      });
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
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
      {/* SECTION 1: HEADER & PRIMARY MOBILE COMMAND BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 sm:pb-4 border-b border-white/[0.08]">
        <div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-neutral-300">Overview</span>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">System Command Center</h1>
            <div className="sm:hidden flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Sync {lastSyncTime}</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 sm:mt-1 hidden sm:block">Autonomous client acquisition and live deal intelligence</p>
        </div>

        {/* PRIMARY ACTION CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={triggerScan}
            disabled={isScanning}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-md text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.12] active:bg-white/[0.18] active:scale-[0.98] text-neutral-100 border border-white/[0.12] hover:border-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm min-h-[44px] sm:min-h-0"
            title="Trigger instant live orders check across all platforms"
          >
            {isScanning ? (
              <>
                <Loader2 size={15} className="animate-spin text-amber-400" />
                <span>Scanning 16+ Platforms...</span>
              </>
            ) : (
              <>
                <RotateCw size={15} className="text-emerald-400" />
                <span>Check Orders Now</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <Link 
              href="/discovery" 
              className="premium-button text-xs flex items-center justify-center gap-2 py-2.5 sm:py-1.5 rounded-xl sm:rounded-md active:scale-[0.98] min-h-[44px] sm:min-h-0 text-center font-medium"
            >
              <Globe2 size={15} className="text-blue-400 shrink-0" /> 
              <span>Discovery</span>
            </Link>
            <Link 
              href="/pipeline" 
              className="premium-button-primary text-xs flex items-center justify-center gap-2 py-2.5 sm:py-1.5 rounded-xl sm:rounded-md active:scale-[0.98] min-h-[44px] sm:min-h-0 text-center font-medium"
            >
              <Target size={15} className="shrink-0" /> 
              <span>Pipeline</span>
            </Link>
          </div>
        </div>
      </div>

      {/* SCAN STATUS FEEDBACK TOAST/BANNER */}
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
                className="text-[11px] underline hover:text-white px-2 py-1 min-h-[36px] flex items-center"
              >
                Retry
              </button>
            )}
            <button 
              onClick={() => setScanStatus(null)} 
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-neutral-400 hover:text-white"
              aria-label="Dismiss message"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: SYSTEM HEALTH & INTEGRATION STATUS STRIP */}
      <div className="px-3.5 py-2.5 rounded-xl bg-[#0c0c0e] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-400 font-medium">System Health:</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            dbConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {dbConnected ? 'Cloud DB Connected' : 'Local Fallback'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] text-neutral-400 font-mono">
          <span className="hidden sm:inline">Scraper: Online (16+ Platforms)</span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="text-neutral-400">Polling: 15s</span>
        </div>
      </div>

      {/* SECTION 3: KEY PERFORMANCE INDICATORS (2-COL MOBILE / 4-COL DESKTOP) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Total Discovered */}
        <div className="premium-panel p-3.5 sm:p-4 flex flex-col justify-between rounded-xl active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1.5">
            <span className="truncate flex items-center gap-1.5 font-medium">
              <Globe2 size={13} className="text-emerald-400 shrink-0" />
              Total Leads
            </span>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">Live</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{stats.discovered}</div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">Total scanned opportunities</div>
        </div>

        {/* Metric 2: Pipeline Opportunities */}
        <Link href="/pipeline" className="premium-panel p-3.5 sm:p-4 flex flex-col justify-between rounded-xl active:scale-[0.98] transition-transform block">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1.5">
            <span className="truncate flex items-center gap-1.5 font-medium">
              <Target size={13} className="text-blue-400 shrink-0" />
              Pipeline
            </span>
            <span className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0">Deals</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{stats.active}</div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">Active in CRM pipeline</div>
        </Link>

        {/* Metric 3: AI Pitches */}
        <div className="premium-panel p-3.5 sm:p-4 flex flex-col justify-between rounded-xl active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1.5">
            <span className="truncate flex items-center gap-1.5 font-medium">
              <Sparkles size={13} className="text-purple-400 shrink-0" />
              AI Pitches
            </span>
            <span className="text-[10px] text-purple-400 font-medium bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 shrink-0">AI</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{stats.pitched}</div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">Outreach generated</div>
        </div>

        {/* Metric 4: Won Deals */}
        <div className="premium-panel p-3.5 sm:p-4 flex flex-col justify-between rounded-xl active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1.5">
            <span className="truncate flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              Won Deals
            </span>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">🏆 Closed</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{stats.won}</div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">Clients successfully won</div>
        </div>
      </div>

      {/* SECTION 4: INCOMING REAL-TIME LEADS (MOBILE TOUCH CARDS) */}
      <div className="premium-panel overflow-hidden rounded-xl">
        <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Clock size={15} className="text-neutral-400" />
            <h2 className="text-xs font-semibold text-neutral-200 tracking-wider uppercase">Incoming Real-Time Leads</h2>
            <span className="text-[10px] bg-white/[0.06] text-neutral-400 px-1.5 py-0.2 rounded font-mono">
              {recentProjects.length}
            </span>
          </div>
          <Link href="/discovery" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors font-medium min-h-[36px]">
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
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors group block"
              >
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 w-full">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 mt-0.5 sm:mt-0 ${getPlatformBadge(project.platform, project.leadType)}`}>
                    {project.platform}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-xs font-semibold text-neutral-100 group-hover:text-white line-clamp-2 sm:line-clamp-1 leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">
                      {project.leadType === 'LOCAL' 
                        ? `Issue: ${project.issueDetected?.replace(/_/g, ' ') || 'None'} • ${project.district || 'Local Business'}` 
                        : 'Global Freelance Project'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/[0.03] sm:border-none">
                  <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {project.leadType === 'LOCAL' ? 'High Target' : project.budget}
                  </span>
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.02] text-neutral-400 group-hover:text-white group-hover:bg-white/[0.08] transition-colors">
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
