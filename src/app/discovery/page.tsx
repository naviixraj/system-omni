"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Globe2, Search, Filter, ArrowUpDown, X, Zap, Target, CheckCircle2, XCircle, AlertTriangle, Activity, Trash2, Mail, Phone, Smartphone, Gauge, Archive, MapPin, ExternalLink, Layers, Sparkles, Copy, Check, RotateCw, SlidersHorizontal } from "lucide-react";

export default function Discovery() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  
  const [activeTab, setActiveTab] = useState("ALL"); 
  const [sortOrder, setSortOrder] = useState("NEWEST"); 
  const [selectedPlatform, setSelectedPlatform] = useState("ALL"); 
  const [issueFilter, setIssueFilter] = useState("ALL"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedPrice, setCopiedPrice] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error' | 'partial'; message: string } | null>(null);

  const fetchJobs = () => {
    fetch("/api/live-jobs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setJobs(data);
        } else {
          setJobs([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load discovery jobs:", err);
        setJobs([]);
        setLoading(false);
      });
  };

  const triggerLeadScan = async () => {
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
            message: `Successfully checked orders! Found ${data.newLeadsFound || 0} new orders across active platforms.`
          });
        }
        fetchJobs(); // refresh the leads list immediately
      } else {
        const errorMsg = data.error || data.message || "Failed to sync orders from remote platforms";
        setScanStatus({
          type: 'error',
          message: `Orders check halted: ${errorMsg}. Click to retry.`
        });
      }
    } catch (err: any) {
      console.error("Orders check failed:", err);
      setScanStatus({
        type: 'error',
        message: `Orders check error: ${err.message || 'Network timeout connecting to scraper API'}. Click to retry.`
      });
    }
    setIsScanning(false);
  };

  useEffect(() => {
    fetchJobs(); 
    const interval = setInterval(fetchJobs, 15000); // Live real-time polling every 15s
    return () => clearInterval(interval);
  }, []);

  const saveJob = async (job: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent opening the modal when clicking save
    await fetch("/api/saved-jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: job.id, status: "QUEUED" }),
    });
    setJobs(prev => prev.filter(j => j.id !== job.id));
    setSelectedJob(null); // Close modal if open
  };

  const deleteJob = async (jobId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingId(jobId);
    try {
      const res = await fetch(`/api/saved-jobs?id=${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        if (selectedJob?.id === jobId) setSelectedJob(null);
      }
    } catch (err) {
      console.error("Failed to dismiss lead", err);
    }
    setDeletingId(null);
  };

  const parseBudget = (budgetStr: string | null) => {
    if (!budgetStr) return 0;
    if (budgetStr.toLowerCase().includes("high target") || budgetStr.toLowerCase().includes("high priority")) return 999999;
    const digits = budgetStr.replace(/[^0-9]/g, '');
    return digits ? parseInt(digits) : 0;
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ requirements: string; suggestedPrice: string } | null>(null);

  const [isAuditing, setIsAuditing] = useState(false);
  const [deepAuditReport, setDeepAuditReport] = useState<any[] | null>(null);

  const handleDeepAudit = async (url: string) => {
    setIsAuditing(true);
    setDeepAuditReport(null);
    try {
      const res = await fetch("/api/deep-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setDeepAuditReport(data.report || []);
    } catch (err) {
      console.error("Deep audit failed", err);
    }
    setIsAuditing(false);
  };

  const handleOpenModal = async (job: any) => {
    setSelectedJob(job);
    setAiAnalysis(null);
    setDeepAuditReport(null);
    setIsAnalyzing(true);
    
    try {
      const res = await fetch("/api/analyze-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (error) {
      console.error("AI failed", error);
    }
    setIsAnalyzing(false);
  };

  let filteredJobs = (Array.isArray(jobs) ? jobs : []).filter((job) => {
    if (activeTab !== "ALL" && job.leadType !== activeTab) return false;
    if (selectedPlatform !== "ALL" && job.platform !== selectedPlatform) return false;
    if (issueFilter !== "ALL" && job.issueDetected !== issueFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = job.title?.toLowerCase().includes(q);
      const matchDistrict = job.district?.toLowerCase().includes(q);
      const matchPlatform = job.platform?.toLowerCase().includes(q);
      const matchIssue = job.issueDetected?.toLowerCase().includes(q);
      if (!matchTitle && !matchDistrict && !matchPlatform && !matchIssue) return false;
    }
    return true;
  });

  filteredJobs = filteredJobs.sort((a, b) => {
    // 1. If user is specifically on LOCAL tab, prioritize bugged local websites first
    if (activeTab === "LOCAL") {
      const isBuggedA = (a.issueDetected && a.issueDetected !== 'NO_WEBSITE') ? 1 : 0;
      const isBuggedB = (b.issueDetected && b.issueDetected !== 'NO_WEBSITE') ? 1 : 0;
      if (isBuggedA !== isBuggedB) return isBuggedB - isBuggedA;
    }

    // 2. Normal sorting for All Leads and Freelance Projects
    if (sortOrder === "BUDGET_DESC") return parseBudget(b.budget || b.issueDetected) - parseBudget(a.budget || a.issueDetected);
    if (sortOrder === "BUDGET_ASC") return parseBudget(a.budget || a.issueDetected) - parseBudget(b.budget || b.issueDetected);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const resolveLeadContact = (job: any) => {
    let email = job.email || null;
    if (!email && job.url && job.url.includes('.')) {
      try {
        const urlObj = new URL(job.url.startsWith('http') ? job.url : 'http://' + job.url);
        const host = urlObj.hostname.replace(/^www\./, '');
        if (host && host.includes('.')) {
          email = `contact@${host}`;
        }
      } catch {}
    }
    if (!email && job.title) {
      const slug = job.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
      email = `info@${slug}.com`;
    }

    const phone = job.phone || null;
    const callUrl = phone 
      ? `tel:${phone}` 
      : `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + (job.district || "") + " phone number")}`;

    return { email, phone, callUrl };
  };

  const resolveAuditAction = (job: any) => {
    if (!job) return { label: 'Go to Website', href: '#', Icon: Globe2 };

    if (job.leadType === 'LOCAL') {
      if (job.issueDetected === 'NOT_MOBILE_FRIENDLY') {
        return {
          label: 'Run Mobile UX Audit',
          href: job.url ? `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(job.url)}` : `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + (job.district || ""))}`,
          Icon: Smartphone,
        };
      }
      if (job.issueDetected === 'SLOW_LOAD') {
        return {
          label: 'Run PageSpeed Audit',
          href: job.url ? `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(job.url)}` : `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + (job.district || ""))}`,
          Icon: Gauge,
        };
      }
      if (job.issueDetected === 'ERROR') {
        return {
          label: 'View Cached Archive',
          href: job.url ? `https://web.archive.org/web/*/${job.url}` : `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + (job.district || ""))}`,
          Icon: Archive,
        };
      }
      if (job.issueDetected === 'NO_WEBSITE') {
        return {
          label: 'Open in Google Maps',
          href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.title + " " + (job.district || ""))}`,
          Icon: MapPin,
        };
      }
      return {
        label: 'Audit Website',
        href: job.url || `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + (job.district || ""))}`,
        Icon: ExternalLink,
      };
    }

    return {
      label: 'View Original Post',
      href: job.url || '#',
      Icon: ExternalLink,
    };
  };

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

  const uniquePlatforms = Array.from(new Set(jobs.map(j => j.platform))).filter(Boolean);
  const activeFilterCount = (selectedPlatform !== "ALL" ? 1 : 0) + (issueFilter !== "ALL" ? 1 : 0) + (sortOrder !== "NEWEST" ? 1 : 0);

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-0.5 sm:mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-neutral-300">Discovery</span>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">Leads & Global Opportunities</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={triggerLeadScan}
            disabled={isScanning}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-md text-xs font-semibold sm:font-medium bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.14] text-neutral-200 border border-white/[0.1] hover:border-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm min-h-[44px] sm:min-h-0"
            title="Scan 16+ global platforms and local maps for new orders"
          >
            {isScanning ? (
              <>
                <Loader2 size={14} className="animate-spin text-amber-400" />
                <span>Checking Orders...</span>
              </>
            ) : (
              <>
                <RotateCw size={14} className="text-emerald-400" />
                <span>Check for New Orders</span>
              </>
            )}
          </button>

          <div className="flex items-center px-3.5 py-2.5 sm:py-1.5 gap-2 rounded-xl sm:rounded-md bg-[#121212] border border-white/[0.08] focus-within:border-white/20 transition-all w-full sm:w-72 min-h-[44px] sm:min-h-0">
            <Search size={14} className="text-neutral-500 shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter leads..." 
              className="bg-transparent border-none outline-none text-xs text-neutral-200 placeholder-neutral-500 w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-neutral-500 hover:text-white p-1">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SCAN STATUS & ERROR FEEDBACK NOTIFICATION */}
      {scanStatus && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
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
            <span>{scanStatus.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {scanStatus.type === 'error' && (
              <button 
                onClick={triggerLeadScan} 
                className="text-[11px] underline hover:text-white px-2 py-0.5"
              >
                Retry Scan
              </button>
            )}
            <button 
              onClick={() => setScanStatus(null)} 
              className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
              title="Dismiss notice"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* SEGMENTED FILTER ROW */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 p-1.5 rounded-xl bg-[#0d0d0d] border border-white/[0.08]">
        {/* Segmented Pills & Mobile Filters Trigger */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
            {[
              { id: "ALL", label: "All Leads", count: jobs.length },
              { id: "GLOBAL", label: "Freelance", count: jobs.filter(j => j.leadType === "GLOBAL").length },
              { id: "LOCAL", label: "Local", count: jobs.filter(j => j.leadType === "LOCAL").length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 sm:py-1.5 rounded-lg sm:rounded-md text-xs font-semibold sm:font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0 min-h-[38px] sm:min-h-0 ${
                  activeTab === tab.id 
                    ? "bg-white/[0.12] text-white border border-white/[0.15] shadow-sm" 
                    : "text-neutral-400 hover:text-neutral-200 border border-transparent"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === tab.id ? "bg-white/[0.15] text-neutral-200" : "bg-white/[0.04] text-neutral-500"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Mobile Filters Modal Trigger */}
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="sm:hidden px-3 py-2 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.15] active:scale-95 border border-white/[0.1] text-neutral-200 flex items-center gap-1.5 shrink-0 transition-all min-h-[38px]"
            title="Open Mobile Filter Drawer"
          >
            <SlidersHorizontal size={13} className={activeFilterCount > 0 ? "text-blue-400" : "text-neutral-400"} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-mono flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Filter Row (Preserved for Tablet & Desktop) */}
        <div className="hidden sm:flex flex-wrap items-center justify-between sm:justify-start gap-2.5 px-1 py-1 border-t lg:border-t-0 border-white/[0.06]">
          {/* Platform Filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-white/[0.03] px-2 py-1 rounded border border-white/[0.06]">
            <Layers size={13} className="text-neutral-500 shrink-0" />
            <select 
              className="bg-transparent text-xs text-neutral-300 font-medium outline-none cursor-pointer hover:text-white max-w-[130px] sm:max-w-none truncate"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="ALL" className="bg-[#121212]">All Platforms ({uniquePlatforms.length})</option>
              {uniquePlatforms.map((plat) => (
                <option key={plat} value={plat} className="bg-[#121212]">
                  {plat}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-white/[0.03] px-2 py-1 rounded border border-white/[0.06]">
            <Filter size={13} className="text-neutral-500 shrink-0" />
            <select 
              className="bg-transparent text-xs text-neutral-300 font-medium outline-none cursor-pointer hover:text-white max-w-[110px] sm:max-w-none truncate"
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
            >
              <option value="ALL" className="bg-[#121212]">All Issues</option>
              <option value="ERROR" className="bg-[#121212]">Broken/Error</option>
              <option value="SLOW_LOAD" className="bg-[#121212]">Slow Load</option>
              <option value="NOT_MOBILE_FRIENDLY" className="bg-[#121212]">Not Mobile</option>
              <option value="NO_WEBSITE" className="bg-[#121212]">No Website</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-white/[0.03] px-2 py-1 rounded border border-white/[0.06]">
            <ArrowUpDown size={13} className="text-neutral-500 shrink-0" />
            <select 
              className="bg-transparent text-xs text-neutral-300 font-medium outline-none cursor-pointer hover:text-white max-w-[100px] sm:max-w-none truncate"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="NEWEST" className="bg-[#121212]">Newest</option>
              <option value="BUDGET_DESC" className="bg-[#121212]">Budget: High</option>
              <option value="BUDGET_ASC" className="bg-[#121212]">Budget: Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* FEED CONTENT */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="animate-spin text-gray-500" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.length === 0 && (
            <div className="premium-panel h-48 flex items-center justify-center text-gray-500 text-sm border-dashed">
              No leads match your exact filters. Try changing them!
            </div>
          )}

          <div className="premium-panel divide-y divide-white/[0.06] overflow-hidden">
            {filteredJobs.map((job: any) => {
              const { email, phone, callUrl } = resolveLeadContact(job);
              return (
                <div 
                  key={job.id} 
                  onClick={() => handleOpenModal(job)}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white/[0.02] active:bg-white/[0.05] cursor-pointer transition-colors group"
                >
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-center justify-between sm:justify-start gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getPlatformBadge(job.platform, job.leadType)}`}>
                          {job.platform}
                        </span>

                        {job.leadType === 'LOCAL' && job.issueDetected && (
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                            job.issueDetected === 'ERROR' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            job.issueDetected === 'SLOW_LOAD' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            job.issueDetected === 'NOT_MOBILE_FRIENDLY' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              job.issueDetected === 'ERROR' ? 'bg-red-400' :
                              job.issueDetected === 'SLOW_LOAD' ? 'bg-yellow-400' :
                              job.issueDetected === 'NOT_MOBILE_FRIENDLY' ? 'bg-purple-400' :
                              'bg-neutral-400'
                            }`}></span>
                            {job.issueDetected.replace(/_/g, ' ')}
                          </span>
                        )}

                        <span className="text-[11px] text-neutral-500 truncate max-w-[120px] sm:max-w-none">
                          {job.district || "Live Match"}
                        </span>
                      </div>

                      {/* Mobile-only budget pill at top-right */}
                      <span className="sm:hidden text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        {job.leadType === 'LOCAL' ? 'High Target' : job.budget}
                      </span>
                    </div>

                    <h3 className="text-sm font-medium text-neutral-100 group-hover:text-white transition-colors line-clamp-2 sm:truncate">
                      {job.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/[0.04] sm:border-none">
                    {/* Desktop-only budget */}
                    <span className="hidden sm:inline-block text-xs font-mono font-medium text-neutral-300">
                      {job.leadType === 'LOCAL' ? 'High Target' : job.budget}
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        {/* Go to Website Globe Button */}
                        {(job.url || job.leadType === 'LOCAL') && (
                          <a
                            href={
                              job.url && job.url.trim() !== '' && job.issueDetected !== 'NO_WEBSITE'
                                ? job.url
                                : `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + (job.district || ""))}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 sm:w-auto sm:h-auto p-2 sm:p-1.5 flex items-center justify-center text-neutral-400 hover:text-white active:bg-white/[0.1] rounded-lg sm:rounded border border-white/[0.08] transition-colors shrink-0"
                            title={job.url && job.url.trim() !== '' && job.issueDetected !== 'NO_WEBSITE' ? `Visit ${job.url}` : `Search ${job.title} on Google`}
                          >
                            <Globe2 size={15} />
                          </a>
                        )}

                        {/* Quick Mobile UX Audit Button */}
                        {job.leadType === 'LOCAL' && job.issueDetected === 'NOT_MOBILE_FRIENDLY' && job.url && (
                          <a
                            href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(job.url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 sm:w-auto sm:h-auto p-2 sm:p-1.5 flex items-center justify-center text-purple-400 hover:text-purple-300 active:bg-purple-500/20 rounded-lg sm:rounded border border-purple-500/20 transition-colors shrink-0"
                            title="Run Mobile UX Audit on Google PageSpeed"
                          >
                            <Smartphone size={15} />
                          </a>
                        )}

                        {/* Quick PageSpeed Audit Button */}
                        {job.leadType === 'LOCAL' && job.issueDetected === 'SLOW_LOAD' && job.url && (
                          <a
                            href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(job.url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 sm:w-auto sm:h-auto p-2 sm:p-1.5 flex items-center justify-center text-amber-400 hover:text-amber-300 active:bg-amber-500/20 rounded-lg sm:rounded border border-amber-500/20 transition-colors shrink-0"
                            title="Run PageSpeed Performance Audit"
                          >
                            <Gauge size={15} />
                          </a>
                        )}

                        {/* Quick Wayback Archive Button */}
                        {job.leadType === 'LOCAL' && job.issueDetected === 'ERROR' && job.url && (
                          <a
                            href={`https://web.archive.org/web/*/${job.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 sm:w-auto sm:h-auto p-2 sm:p-1.5 flex items-center justify-center text-red-400 hover:text-red-300 active:bg-red-500/20 rounded-lg sm:rounded border border-red-500/20 transition-colors shrink-0"
                            title="View Cached Archive on Wayback Machine"
                          >
                            <Archive size={15} />
                          </a>
                        )}

                        {/* Call Option Button */}
                        <a
                          href={callUrl}
                          target={phone ? "_self" : "_blank"}
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-9 h-9 sm:w-auto sm:h-auto p-2 sm:p-1.5 flex items-center justify-center text-emerald-400 hover:text-emerald-300 active:bg-emerald-500/20 rounded-lg sm:rounded border border-emerald-500/20 transition-colors shrink-0"
                          title={phone ? `Call ${phone}` : `Find Phone / Call ${job.title}`}
                        >
                          <Phone size={15} />
                        </a>

                        {/* Quick Mail outreach */}
                        <a
                          href={`mailto:${email}?subject=${encodeURIComponent(`Website Upgrade for ${job.title}`)}&body=${encodeURIComponent(`Hi ${job.title} Team,\n\nI reviewed your online presence in ${job.district || "your area"} and noticed some high-impact areas where we can increase customer conversions.\n\nLet me know if you would be open to a quick 5-minute chat.`)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-9 h-9 sm:w-auto sm:h-auto p-2 sm:p-1.5 flex items-center justify-center text-blue-400 hover:text-blue-300 active:bg-blue-500/20 rounded-lg sm:rounded border border-blue-500/20 transition-colors shrink-0"
                          title={`Send Email to ${email}`}
                        >
                          <Mail size={15} />
                        </a>

                        {/* Dismiss / Delete Lead Button */}
                        <button 
                          onClick={(e) => deleteJob(job.id, e)} 
                          disabled={deletingId === job.id}
                          className="w-9 h-9 sm:w-auto sm:h-auto p-2 sm:p-1.5 flex items-center justify-center text-neutral-500 hover:text-red-400 active:bg-red-500/20 rounded-lg sm:rounded transition-colors shrink-0"
                          title="Dismiss / Delete Lead"
                        >
                          {deletingId === job.id ? <Loader2 size={13} className="animate-spin text-red-400" /> : <Trash2 size={15} />}
                        </button>
                      </div>

                      {/* Move to Pipeline Button */}
                      <button 
                        onClick={(e) => saveJob(job, e)} 
                        className="h-9 sm:h-auto px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg border border-blue-500/30 flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                      >
                        <Save size={13} /> Pipeline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MOBILE FILTER & SORT BOTTOM SHEET */}
      {isFilterSheetOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:hidden overscroll-none animate-in fade-in duration-150"
          onClick={() => setIsFilterSheetOpen(false)}
        >
          <div 
            className="w-full bg-[#0e0e12] border-t border-white/[0.12] rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="pt-3 pb-1 shrink-0 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Sheet Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">Filter & Sort Leads</h3>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setSelectedPlatform("ALL");
                      setIssueFilter("ALL");
                      setSortOrder("NEWEST");
                    }}
                    className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button 
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Filter Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
              {/* Sort By Section */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpDown size={12} className="text-neutral-400" /> Sort By
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "NEWEST", label: "Newest" },
                    { id: "BUDGET_DESC", label: "Budget: High" },
                    { id: "BUDGET_ASC", label: "Budget: Low" }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortOrder(s.id)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        sortOrder === s.id
                          ? "bg-blue-600/20 border-blue-500/40 text-blue-200"
                          : "bg-white/[0.03] border-white/[0.08] text-neutral-300 hover:bg-white/[0.06]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Filter Section */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={12} className="text-neutral-400" /> Platform ({uniquePlatforms.length + 1})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedPlatform("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedPlatform === "ALL"
                        ? "bg-blue-600/20 border-blue-500/40 text-blue-200"
                        : "bg-white/[0.03] border-white/[0.08] text-neutral-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    All Platforms
                  </button>
                  {uniquePlatforms.map((plat) => (
                    <button
                      key={plat}
                      onClick={() => setSelectedPlatform(plat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        selectedPlatform === plat
                          ? "bg-blue-600/20 border-blue-500/40 text-blue-200"
                          : "bg-white/[0.03] border-white/[0.08] text-neutral-300 hover:bg-white/[0.06]"
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Website Issues Section */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter size={12} className="text-neutral-400" /> Website Issues
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "ALL", label: "All Issues" },
                    { id: "ERROR", label: "Broken / Error 500" },
                    { id: "SLOW_LOAD", label: "Slow Load Speed" },
                    { id: "NOT_MOBILE_FRIENDLY", label: "Not Mobile Friendly" },
                    { id: "NO_WEBSITE", label: "No Website Found" }
                  ].map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => setIssueFilter(issue.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        issueFilter === issue.id
                          ? "bg-blue-600/20 border-blue-500/40 text-blue-200"
                          : "bg-white/[0.03] border-white/[0.08] text-neutral-300 hover:bg-white/[0.06]"
                      }`}
                    >
                      {issue.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Apply Action */}
            <div className="p-4 border-t border-white/[0.08] bg-[#09090b] shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Show Results ({filteredJobs.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED JOB OVERLAY MODAL */}
      {selectedJob && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 flex flex-col justify-end sm:justify-center sm:items-center sm:p-6 overscroll-none" 
          onClick={() => setSelectedJob(null)}
        >
          <div 
            className="w-full max-w-3xl bg-[#0e0e11] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col h-[88vh] sm:h-auto sm:max-h-[88vh] relative overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

            {/* STICKY TOP HEADER: PULL HANDLE, BADGES, ACTIONS & TITLE */}
            <div className="shrink-0 p-4 sm:p-6 border-b border-white/[0.08] bg-[#0e0e11]/95 backdrop-blur-md relative z-10 flex flex-col gap-2.5">
              {/* Pinned Top-Right Close Button */}
              <button 
                onClick={() => setSelectedJob(null)}
                className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] active:bg-white/[0.22] border border-white/[0.12] text-neutral-300 hover:text-white flex items-center justify-center transition-all z-30 cursor-pointer shadow-md active:scale-95"
                title="Close modal"
              >
                <X size={16} />
              </button>

              {/* iOS/Android Bottom Sheet Pull Handle Indicator */}
              <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

              {/* Top Navigation & Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-white/[0.06] relative z-10 pr-9 sm:pr-10">
                {/* Left: Platform & Metadata Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${getPlatformBadge(selectedJob.platform, selectedJob.leadType)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                    {selectedJob.platform}
                  </span>

                  {selectedJob.issueDetected && (
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                      selectedJob.issueDetected === 'ERROR' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      selectedJob.issueDetected === 'SLOW_LOAD' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      selectedJob.issueDetected === 'NOT_MOBILE_FRIENDLY' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {selectedJob.issueDetected.replace(/_/g, ' ')}
                    </span>
                  )}

                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <MapPin size={12} className="text-neutral-500" />
                    {selectedJob.leadType === 'LOCAL' ? (selectedJob.district || 'Local Business') : 'Global Remote Lead'}
                  </span>
                </div>

                {/* Right: Actions Toolbar (Call, Email, Delete) */}
                <div className="flex items-center gap-2">
                  {/* Call Button */}
                  <a
                    href={resolveLeadContact(selectedJob).callUrl}
                    target={resolveLeadContact(selectedJob).phone ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/20 flex items-center gap-1.5 transition-colors"
                    title={resolveLeadContact(selectedJob).phone ? `Call ${resolveLeadContact(selectedJob).phone}` : `Look up phone for ${selectedJob.title}`}
                  >
                    <Phone size={12} />
                    <span>Call</span>
                  </a>

                  {/* Email Button */}
                  <a
                    href={`mailto:${resolveLeadContact(selectedJob).email}?subject=${encodeURIComponent(`Website Upgrade for ${selectedJob.title}`)}&body=${encodeURIComponent(`Hi ${selectedJob.title} Team,\n\nI reviewed your online presence in ${selectedJob.district || "your area"} and noticed some high-impact areas where we can increase customer conversions.\n\nLet me know if you would be open to a quick 5-minute chat.`)}`}
                    className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 text-blue-400 text-xs font-medium rounded-lg border border-blue-500/20 flex items-center gap-1.5 transition-colors"
                    title={`Send email to ${resolveLeadContact(selectedJob).email}`}
                  >
                    <Mail size={12} />
                    <span>Email</span>
                  </a>

                  {/* Dismiss / Delete Lead Button */}
                  <button 
                    onClick={(e) => deleteJob(selectedJob.id, e)} 
                    disabled={deletingId === selectedJob.id}
                    className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-white/[0.06] transition-colors cursor-pointer"
                    title="Dismiss / Delete Lead"
                  >
                    {deletingId === selectedJob.id ? <Loader2 size={13} className="animate-spin text-red-400" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>

            {/* Title & Official Link Bar */}
            <div className="flex flex-col gap-2 relative z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {selectedJob.title}
              </h2>

              {(selectedJob.url || selectedJob.leadType === 'LOCAL') && (
                <div className="flex flex-wrap items-center gap-2">
                  <a 
                    href={
                      selectedJob.url && selectedJob.url.trim() !== '' && selectedJob.issueDetected !== 'NO_WEBSITE'
                        ? selectedJob.url
                        : `https://www.google.com/search?q=${encodeURIComponent(selectedJob.title + " " + (selectedJob.district || ""))}`
                    } 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-xs font-mono text-neutral-300 hover:text-white transition-colors" 
                    title={selectedJob.url && selectedJob.url.trim() !== '' && selectedJob.issueDetected !== 'NO_WEBSITE' ? `Visit ${selectedJob.url}` : `Search ${selectedJob.title} on Google`}
                  >
                    <Globe2 size={12} className="text-neutral-400" />
                    <span className="truncate max-w-[280px] sm:max-w-md">
                      {selectedJob.url && selectedJob.url.trim() !== '' && selectedJob.issueDetected !== 'NO_WEBSITE'
                        ? selectedJob.url.replace(/^https?:\/\//, '')
                        : `Google Search: ${selectedJob.title}`}
                    </span>
                    <ExternalLink size={11} className="text-neutral-500" />
                  </a>

                  <span className="text-xs font-mono text-neutral-400 px-2.5 py-1 rounded-md bg-white/[0.02] border border-white/[0.04]">
                    {selectedJob.leadType === 'LOCAL' ? 'High Conversion Target' : (selectedJob.budget || 'Open Contract')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SMOOTHLY SCROLLABLE MODAL BODY (TOUCH-PAN-Y) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar p-4 sm:p-6 space-y-4 relative z-10">
            {/* Modern AI Intelligence Bento Card */}
            <div className="bg-[#121215] rounded-xl border border-white/[0.08] overflow-hidden relative shadow-sm">
              <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-violet-400" />
                  <span className="text-xs font-semibold text-neutral-200 tracking-wide uppercase">AI Lead Intelligence</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    Gemini 2.5
                  </span>
                </div>

                {!isAnalyzing && aiAnalysis && (
                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Verified Analysis
                  </span>
                )}
              </div>

              <div className="p-4 sm:p-5 flex flex-col gap-4">
                {isAnalyzing || !aiAnalysis ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="animate-spin text-violet-400" size={26} />
                    <p className="text-xs text-neutral-400 font-medium animate-pulse">
                      Analyzing client presence, technical flaws, and generating proposal scope...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Project Scope / What to Build */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-300">
                        <Target size={14} className="text-blue-400" />
                        <span>Recommended Scope of Work</span>
                      </div>
                      <div className="text-xs text-neutral-300 leading-relaxed bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-lg whitespace-pre-wrap font-sans">
                        {aiAnalysis.requirements}
                      </div>
                    </div>

                    {/* Suggested Pitch Price - Modern KPI Widget */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>Suggested Pitch Valuation</span>
                        </span>
                        
                        <button
                          onClick={() => {
                            if (aiAnalysis?.suggestedPrice) {
                              navigator.clipboard.writeText(aiAnalysis.suggestedPrice);
                              setCopiedPrice(true);
                              setTimeout(() => setCopiedPrice(false), 2000);
                            }
                          }}
                          className="text-[11px] font-medium text-neutral-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06]"
                          title="Copy Suggested Price and Scope"
                        >
                          {copiedPrice ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedPrice ? 'Copied' : 'Copy Pitch'}</span>
                        </button>
                      </div>

                      <div className="p-3.5 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/20 text-emerald-300 text-xs font-medium leading-relaxed font-mono">
                        {aiAnalysis.suggestedPrice}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Deep Technical Diagnostics Section */}
            {selectedJob.leadType === 'LOCAL' && selectedJob.url && selectedJob.issueDetected !== 'NO_WEBSITE' && (
              <div className="bg-[#121215] rounded-xl border border-white/[0.08] overflow-hidden relative z-10 shadow-sm">
                <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={15} className="text-rose-400" />
                    <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wide">
                      Deep Technical Diagnostics
                    </span>
                  </div>

                  {!deepAuditReport && !isAuditing && (
                    <button 
                      onClick={() => handleDeepAudit(selectedJob.url)}
                      className="text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/20 flex items-center gap-1.5 transition-all"
                    >
                      <Zap size={12} />
                      <span>Run Live Scan</span>
                    </button>
                  )}
                </div>

                {isAuditing && (
                  <div className="p-6 flex flex-col items-center justify-center gap-2.5">
                    <Loader2 className="animate-spin text-rose-400" size={24} />
                    <p className="text-xs text-neutral-400 font-medium animate-pulse">
                      Running robotic penetration scan & performance diagnostics...
                    </p>
                  </div>
                )}

                {deepAuditReport && (
                  <div className="p-4 sm:p-5 flex flex-col gap-2.5">
                    {deepAuditReport.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                        <div className="mt-0.5 shrink-0">
                          {item.status === 'pass' && <CheckCircle2 className="text-emerald-400" size={16} />}
                          {item.status === 'warn' && <AlertTriangle className="text-amber-400" size={16} />}
                          {item.status === 'fail' && <XCircle className="text-rose-400" size={16} />}
                        </div>
                        <div>
                          <h4 className={`text-xs font-semibold ${
                            item.status === 'pass' ? 'text-emerald-300' :
                            item.status === 'warn' ? 'text-amber-300' :
                            'text-rose-300'
                          }`}>
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STICKY BOTTOM ACTIONS BAR */}
          <div className="shrink-0 p-3.5 sm:p-5 border-t border-white/[0.08] bg-[#0c0c0e]/95 backdrop-blur-md flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-between items-stretch sm:items-center relative z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {/* Primary Action Button: Audit / Cached Archive / Maps / Post */}
              {(() => {
                const audit = resolveAuditAction(selectedJob);
                const AuditIcon = audit.Icon;
                return (
                  <a 
                    href={audit.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center gap-2 transition-all shadow-sm"
                    title={audit.label}
                  >
                    <AuditIcon size={15} className="text-neutral-300" />
                    <span>{audit.label}</span>
                    <ExternalLink size={12} className="text-neutral-500" />
                  </a>
                );
              })()}

              {/* Save to CRM Pipeline */}
              <button 
                onClick={(e) => saveJob(selectedJob, e)} 
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.25)] border border-blue-400/30 flex items-center justify-center gap-2 transition-all"
              >
                <Save size={15} />
                <span>Save to CRM Pipeline</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
