"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Globe2, Search, Filter, ArrowUpDown, X, Zap, Target, CheckCircle2, XCircle, AlertTriangle, Activity, Trash2, Mail, Phone } from "lucide-react";

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

  const uniquePlatforms = Array.from(new Set(jobs.map(j => j.platform)));

  return (
    <div className="max-w-6xl mx-auto pb-10 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 md:mb-2 flex items-center gap-3">
            <Globe2 className="text-blue-500" size={26} />
            Global Discovery
          </h1>
          <p className="text-gray-400 text-xs md:text-sm">Live structured feed. Refreshed every 60 seconds.</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="premium-panel flex items-center px-4 py-2 gap-2 focus-within:border-blue-500/40 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all w-full sm:w-auto">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, name, role..." 
              className="bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-500 w-full sm:w-52 md:w-64"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="text-gray-400 hover:text-white transition p-0.5"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="premium-panel p-2 mb-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 overflow-x-auto custom-scrollbar">
        <div className="flex gap-2 flex-shrink-0 w-full xl:w-auto">
          {["ALL", "GLOBAL", "LOCAL"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab 
                ? "bg-white/10 text-white border border-white/10" 
                : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] border border-transparent"
              }`}
            >
              {tab === "ALL" ? "All Leads" : tab === "GLOBAL" ? "Freelance Projects" : "Local Businesses"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-4 px-3 w-full xl:w-auto pb-2 xl:pb-0">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <select 
              className="bg-transparent text-sm text-gray-300 font-medium outline-none cursor-pointer hover:text-white transition"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="ALL" className="bg-[#121212]">All Platforms</option>
              {uniquePlatforms.map(p => (
                <option key={p as string} value={p as string} className="bg-[#121212]">{p as string}</option>
              ))}
            </select>
          </div>
          <div className="w-px h-5 bg-white/10 mx-2"></div>
          
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <select 
              className="bg-transparent text-sm text-gray-300 font-medium outline-none cursor-pointer hover:text-white transition"
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
            >
              <option value="ALL" className="bg-[#121212]">All Issues</option>
              <option value="NO_WEBSITE" className="bg-[#121212]">No Website</option>
              <option value="SLOW_LOAD" className="bg-[#121212]">Slow Load</option>
              <option value="NOT_MOBILE_FRIENDLY" className="bg-[#121212]">Not Mobile Friendly</option>
              <option value="ERROR" className="bg-[#121212]">Broken/Error</option>
            </select>
          </div>
          <div className="w-px h-5 bg-white/10 mx-2"></div>

          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-gray-500" />
            <select 
              className="bg-transparent text-sm text-gray-300 font-medium outline-none cursor-pointer hover:text-white transition"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="NEWEST" className="bg-[#121212]">Sort: Newest First</option>
              <option value="BUDGET_DESC" className="bg-[#121212]">Sort: Budget (High to Low)</option>
              <option value="BUDGET_ASC" className="bg-[#121212]">Sort: Budget (Low to High)</option>
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

          {filteredJobs.map((job: any) => {
            const { email, phone, callUrl } = resolveLeadContact(job);
            return (
              <div 
                key={job.id} 
                onClick={() => handleOpenModal(job)}
                className="premium-panel flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 gap-4 group cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300"
              >
                <div className="w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <span className={`premium-badge ${job.leadType === 'LOCAL' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                      {job.platform}
                    </span>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                      {job.district || "Live Match"}
                    </p>
                    
                    {job.leadType === 'LOCAL' && job.issueDetected && (
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm border ${
                        job.issueDetected === 'ERROR' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        job.issueDetected === 'SLOW_LOAD' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        job.issueDetected === 'NOT_MOBILE_FRIENDLY' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {job.issueDetected.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-200 group-hover:text-white transition-colors tracking-tight">{job.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2 sm:line-clamp-1 w-full sm:w-[80%]">
                    {job.leadType === 'LOCAL' ? `System detected website issue: ${job.issueDetected}. High priority outreach target.` : `Client is actively looking for a developer to handle this project. Click view to see full brief.`}
                  </p>
                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto flex-shrink-0 pt-3 sm:pt-0 border-t border-white/[0.04] sm:border-none">
                  <p className="font-semibold text-gray-100 text-base sm:text-lg">
                    {job.leadType === 'LOCAL' ? <span className="text-orange-400/90 text-xs sm:text-sm">High Target</span> : job.budget}
                  </p>
                  <div className="flex items-center gap-2">
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
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition"
                        title={job.url && job.url.trim() !== '' && job.issueDetected !== 'NO_WEBSITE' ? `Visit ${job.url}` : `Search ${job.title} on Google`}
                      >
                        <Globe2 size={14} />
                      </a>
                    )}

                    {/* Call Option Button (Direct tel: or Google Call lookup) */}
                    <a
                      href={callUrl}
                      target={phone ? "_self" : "_blank"}
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition"
                      title={phone ? `Call ${phone}` : `Find Phone / Call ${job.title}`}
                    >
                      <Phone size={14} />
                    </a>

                    {/* Quick Mail outreach */}
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent(`Website Upgrade for ${job.title}`)}&body=${encodeURIComponent(`Hi ${job.title} Team,\n\nI reviewed your online presence in ${job.district || "your area"} and noticed some high-impact areas where we can increase customer conversions.\n\nLet me know if you would be open to a quick 5-minute chat.`)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/20 transition"
                      title={`Send Email to ${email}`}
                    >
                      <Mail size={14} />
                    </a>

                    {/* Move to Pipeline Button */}
                    <button onClick={(e) => saveJob(job, e)} className="premium-button-primary text-xs flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5">
                      <Save size={13} /> Pipeline
                    </button>

                    {/* Dismiss / Delete Lead Button */}
                    <button 
                      onClick={(e) => deleteJob(job.id, e)} 
                      disabled={deletingId === job.id}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition"
                      title="Dismiss / Delete Lead"
                    >
                      {deletingId === job.id ? <Loader2 size={14} className="animate-spin text-red-400" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 pt-4 sm:pt-6 border-t border-white/[0.04] justify-between items-stretch sm:items-center">
              <a 
                href={
                  selectedJob.url && selectedJob.url.trim() !== '' && selectedJob.issueDetected !== 'NO_WEBSITE'
                    ? selectedJob.url
                    : `https://www.google.com/search?q=${encodeURIComponent(selectedJob.title + " " + (selectedJob.district || ""))}`
                } 
                target="_blank" 
                rel="noopener noreferrer"
                className="premium-button text-sm flex-1 text-center"
              >
                {selectedJob.url && selectedJob.url.trim() !== '' && selectedJob.issueDetected !== 'NO_WEBSITE'
                  ? 'Go to Website'
                  : 'Search Business on Google'}
              </a>

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
