"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Globe2, Search, Filter, ArrowUpDown, X, Zap, Target, CheckCircle2, XCircle, AlertTriangle, Activity, Trash2, Mail, Phone, Smartphone, Gauge, Archive, MapPin, ExternalLink } from "lucide-react";

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
    // 1. Force BUGGED websites (SLOW_LOAD, ERROR, NOT_MOBILE_FRIENDLY) to the absolute top of the feed
    const isBuggedA = (a.issueDetected && a.issueDetected !== 'NO_WEBSITE') ? 1 : 0;
    const isBuggedB = (b.issueDetected && b.issueDetected !== 'NO_WEBSITE') ? 1 : 0;
    if (isBuggedA !== isBuggedB) return isBuggedB - isBuggedA;

    // 2. Normal sorting for the rest
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
      } catch (e) {}
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

  const uniquePlatforms = Array.from(new Set(jobs.map(j => j.platform)));

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-neutral-300">Discovery</span>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Leads & Global Opportunities</h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center px-3 py-1.5 gap-2 rounded-md bg-[#121212] border border-white/[0.08] focus-within:border-white/20 transition-all w-full sm:w-72">
            <Search size={14} className="text-neutral-500 shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter leads..." 
              className="bg-transparent border-none outline-none text-xs text-neutral-200 placeholder-neutral-500 w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-neutral-500 hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SEGMENTED FILTER ROW (LINEAR STYLE) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-lg bg-[#0d0d0d] border border-white/[0.08]">
        <div className="flex items-center gap-1">
          {[
            { id: "ALL", label: "All Leads", count: jobs.length },
            { id: "GLOBAL", label: "Freelance Projects", count: jobs.filter(j => j.leadType === "GLOBAL").length },
            { id: "LOCAL", label: "Local Businesses", count: jobs.filter(j => j.leadType === "LOCAL").length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id 
                  ? "bg-white/[0.1] text-white border border-white/[0.1]" 
                  : "text-neutral-400 hover:text-neutral-200 border border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${activeTab === tab.id ? "bg-white/[0.1] text-neutral-300" : "bg-white/[0.04] text-neutral-500"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-2">
          {/* Issue Filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Filter size={13} className="text-neutral-500" />
            <select 
              className="bg-transparent text-xs text-neutral-300 font-medium outline-none cursor-pointer hover:text-white"
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
            >
              <option value="ALL" className="bg-[#121212]">All Issues</option>
              <option value="ERROR" className="bg-[#121212]">Broken/Error</option>
              <option value="SLOW_LOAD" className="bg-[#121212]">Slow Load</option>
              <option value="NOT_MOBILE_FRIENDLY" className="bg-[#121212]">Not Mobile Friendly</option>
              <option value="NO_WEBSITE" className="bg-[#121212]">No Website</option>
            </select>
          </div>

          <div className="w-px h-4 bg-white/[0.08]"></div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <ArrowUpDown size={13} className="text-neutral-500" />
            <select 
              className="bg-transparent text-xs text-neutral-300 font-medium outline-none cursor-pointer hover:text-white"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="NEWEST" className="bg-[#121212]">Newest</option>
              <option value="BUDGET_DESC" className="bg-[#121212]">Budget: High to Low</option>
              <option value="BUDGET_ASC" className="bg-[#121212]">Budget: Low to High</option>
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
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        job.leadType === 'LOCAL' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
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

                      <span className="text-[11px] text-neutral-500">
                        {job.district || "Live Match"}
                      </span>
                    </div>

                    <h3 className="text-sm font-medium text-neutral-100 group-hover:text-white transition-colors truncate">
                      {job.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/[0.04] sm:border-none">
                    <span className="text-xs font-mono font-medium text-neutral-300">
                      {job.leadType === 'LOCAL' ? 'High Target' : job.budget}
                    </span>

                    <div className="flex items-center gap-1.5">
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
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded border border-white/[0.06] transition-colors"
                          title={job.url && job.url.trim() !== '' && job.issueDetected !== 'NO_WEBSITE' ? `Visit ${job.url}` : `Search ${job.title} on Google`}
                        >
                          <Globe2 size={13} />
                        </a>
                      )}

                      {/* Quick Mobile UX Audit Button */}
                      {job.leadType === 'LOCAL' && job.issueDetected === 'NOT_MOBILE_FRIENDLY' && job.url && (
                        <a
                          href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(job.url)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded border border-purple-500/20 transition-colors"
                          title="Run Mobile UX Audit on Google PageSpeed"
                        >
                          <Smartphone size={13} />
                        </a>
                      )}

                      {/* Quick PageSpeed Audit Button */}
                      {job.leadType === 'LOCAL' && job.issueDetected === 'SLOW_LOAD' && job.url && (
                        <a
                          href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(job.url)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded border border-amber-500/20 transition-colors"
                          title="Run PageSpeed Performance Audit"
                        >
                          <Gauge size={13} />
                        </a>
                      )}

                      {/* Quick Wayback Archive Button */}
                      {job.leadType === 'LOCAL' && job.issueDetected === 'ERROR' && job.url && (
                        <a
                          href={`https://web.archive.org/web/*/${job.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded border border-red-500/20 transition-colors"
                          title="View Cached Archive on Wayback Machine"
                        >
                          <Archive size={13} />
                        </a>
                      )}

                      {/* Call Option Button */}
                      <a
                        href={callUrl}
                        target={phone ? "_self" : "_blank"}
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded border border-emerald-500/20 transition-colors"
                        title={phone ? `Call ${phone}` : `Find Phone / Call ${job.title}`}
                      >
                        <Phone size={13} />
                      </a>

                      {/* Quick Mail outreach */}
                      <a
                        href={`mailto:${email}?subject=${encodeURIComponent(`Website Upgrade for ${job.title}`)}&body=${encodeURIComponent(`Hi ${job.title} Team,\n\nI reviewed your online presence in ${job.district || "your area"} and noticed some high-impact areas where we can increase customer conversions.\n\nLet me know if you would be open to a quick 5-minute chat.`)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded border border-blue-500/20 transition-colors"
                        title={`Send Email to ${email}`}
                      >
                        <Mail size={13} />
                      </a>

                      {/* Move to Pipeline Button */}
                      <button 
                        onClick={(e) => saveJob(job, e)} 
                        className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded border border-blue-500/30 flex items-center gap-1.5 transition-colors"
                      >
                        <Save size={12} /> Pipeline
                      </button>

                      {/* Dismiss / Delete Lead Button */}
                      <button 
                        onClick={(e) => deleteJob(job.id, e)} 
                        disabled={deletingId === job.id}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Dismiss / Delete Lead"
                      >
                        {deletingId === job.id ? <Loader2 size={13} className="animate-spin text-red-400" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAILED JOB OVERLAY MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md animate-in fade-in duration-200 custom-scrollbar" onClick={() => setSelectedJob(null)}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="premium-panel w-full max-w-3xl p-4 sm:p-8 relative flex flex-col gap-4 sm:gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 my-4 sm:my-8" 
              onClick={(e) => e.stopPropagation()} // Prevent clicking inside modal from closing it
            >
            <button 
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10"
            >
              <X size={20} />
            </button>

            {/* Modal Header Banner */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`premium-badge ${selectedJob.leadType === 'LOCAL' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                    {selectedJob.platform}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {selectedJob.leadType === 'LOCAL' ? `Located in ${selectedJob.district}` : 'Global Remote Lead'}
                  </span>
                </div>

                {/* Small Banner Action Buttons (Call, Email, Delete) */}
                <div className="flex items-center gap-2">
                  <a
                    href={resolveLeadContact(selectedJob).callUrl}
                    target={resolveLeadContact(selectedJob).phone ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20 flex items-center gap-1.5 transition"
                    title={resolveLeadContact(selectedJob).phone ? `Call ${resolveLeadContact(selectedJob).phone}` : `Look up phone for ${selectedJob.title}`}
                  >
                    <Phone size={13} /> Call
                  </a>

                  <a
                    href={`mailto:${resolveLeadContact(selectedJob).email}?subject=${encodeURIComponent(`Website Upgrade for ${selectedJob.title}`)}&body=${encodeURIComponent(`Hi ${selectedJob.title} Team,\n\nI reviewed your online presence in ${selectedJob.district || "your area"} and noticed some high-impact areas where we can increase customer conversions.\n\nLet me know if you would be open to a quick 5-minute chat.`)}`}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/20 flex items-center gap-1.5 transition"
                    title={`Send email to ${resolveLeadContact(selectedJob).email}`}
                  >
                    <Mail size={13} /> Email
                  </a>

                  <button 
                    onClick={(e) => deleteJob(selectedJob.id, e)} 
                    disabled={deletingId === selectedJob.id}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 flex items-center justify-center transition"
                    title="Dismiss / Delete Lead from database"
                  >
                    {deletingId === selectedJob.id ? <Loader2 size={13} className="animate-spin text-red-400" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pr-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{selectedJob.title}</h2>
                {(selectedJob.url || selectedJob.leadType === 'LOCAL') && (
                  <a 
                    href={
                      selectedJob.url && selectedJob.url.trim() !== '' && selectedJob.issueDetected !== 'NO_WEBSITE'
                        ? selectedJob.url
                        : `https://www.google.com/search?q=${encodeURIComponent(selectedJob.title + " " + (selectedJob.district || ""))}`
                    } 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-blue-400 transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10" 
                    title={selectedJob.url && selectedJob.url.trim() !== '' && selectedJob.issueDetected !== 'NO_WEBSITE' ? `Visit ${selectedJob.url}` : `Search ${selectedJob.title} on Google`}
                  >
                    <Globe2 size={20} />
                  </a>
                )}
              </div>
            </div>

            {/* AI Intelligence Section */}
            <div className="bg-[#121212] rounded-xl border border-white/[0.04] overflow-hidden mt-2 min-h-[160px]">
              <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 px-5 py-3 border-b border-white/[0.04] flex items-center gap-2">
                <Zap className="text-yellow-400" size={18} fill="currentColor" />
                <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">True AI Intelligence Report</h3>
              </div>
              <div className="p-5 flex flex-col gap-5 ">
                {isAnalyzing || !aiAnalysis ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                     <Loader2 className="animate-spin text-purple-400" size={28} />
                     <p className="text-sm text-gray-400 font-medium animate-pulse">Gemini AI is analyzing client details...</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-2">
                        <Target size={16} className="text-blue-400" /> What to Build (Project Scope)
                      </h4>
                      <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                        {aiAnalysis.requirements}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-2">
                        💰 Suggested Pitch Price
                      </h4>
                      <p className="text-sm text-emerald-400 font-semibold bg-emerald-500/10 inline-block px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        {aiAnalysis.suggestedPrice}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Deep Technical Audit Section */}
            {selectedJob.leadType === 'LOCAL' && selectedJob.url && selectedJob.issueDetected !== 'NO_WEBSITE' && (
              <div className="bg-[#121212] rounded-xl border border-white/[0.04] overflow-hidden mt-2">
                <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="text-red-400" size={18} />
                    <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">Deep Technical Audit</h3>
                  </div>
                  {!deepAuditReport && !isAuditing && (
                    <button 
                      onClick={() => handleDeepAudit(selectedJob.url)}
                      className="text-xs font-semibold bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
                    >
                      Run Live Scan
                    </button>
                  )}
                </div>
                
                {isAuditing && (
                  <div className="p-8 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-red-400" size={28} />
                    <p className="text-sm text-gray-400 font-medium animate-pulse">Running robotic penetration scan & performance audit...</p>
                  </div>
                )}

                {deepAuditReport && (
                  <div className="p-5 flex flex-col gap-3">
                    {deepAuditReport.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="mt-0.5">
                          {item.status === 'pass' && <CheckCircle2 className="text-emerald-400" size={18} />}
                          {item.status === 'warn' && <AlertTriangle className="text-yellow-400" size={18} />}
                          {item.status === 'fail' && <XCircle className="text-red-400" size={18} />}
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${item.status === 'pass' ? 'text-emerald-300' : item.status === 'warn' ? 'text-yellow-300' : 'text-red-300'}`}>
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">{item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2 pt-4 sm:pt-6 border-t border-white/[0.04] justify-between items-stretch sm:items-center">
              {/* Primary Specialized Action: Mobile UX Audit / PageSpeed / Archive / Map / View Post */}
              {(() => {
                const audit = resolveAuditAction(selectedJob);
                const AuditIcon = audit.Icon;
                return (
                  <a 
                    href={audit.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="premium-button text-sm flex-1 flex items-center justify-center gap-2 font-medium"
                    title={audit.label}
                  >
                    <AuditIcon size={16} />
                    <span>{audit.label}</span>
                  </a>
                );
              })()}

              {/* Dedicated "Go to Website" button when business has an authentic website */}
              {selectedJob.url && selectedJob.url.trim() !== '' && selectedJob.issueDetected !== 'NO_WEBSITE' && (
                <a 
                  href={selectedJob.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors shrink-0"
                  title={`Open official website: ${selectedJob.url}`}
                >
                  <Globe2 size={16} />
                  <span>Go to Website</span>
                </a>
              )}

              {/* Save to CRM Pipeline */}
              <button onClick={(e) => saveJob(selectedJob, e)} className="premium-button-primary text-sm flex-1 flex items-center justify-center gap-2">
                <Save size={16} /> Save to CRM Pipeline
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

    </div>
  );
}
