"use client";

import { useEffect, useState } from "react";
import { Sparkles, ExternalLink, Loader2, Copy, Check, RotateCcw, Globe2, Trash2, Mail, Phone, Smartphone, Gauge, Archive } from "lucide-react";

export default function Pipeline() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [pitches, setPitches] = useState<{ [key: string]: string }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/saved-jobs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setJobs(data);
        } else {
          setJobs([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load saved jobs:", err);
        setJobs([]);
      });
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

  const handleUnsave = async (jobId: string) => {
    setDeletingId(jobId);
    try {
      await fetch("/api/saved-jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: 'SAVED' }),
      });
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (error) {
      console.error("Failed to return job to discovery", error);
    }
    setDeletingId(null);
  };

  const handleDeletePermanently = async (jobId: string) => {
    setDeletingId(jobId);
    try {
      const res = await fetch(`/api/saved-jobs?id=${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
      }
    } catch (error) {
      console.error("Failed to delete job permanently", error);
    }
    setDeletingId(null);
  };

  const handleGeneratePitch = async (job: any) => {
    setGeneratingFor(job.id);
    try {
      const res = await fetch("/api/generate-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      const data = await res.json();
      setPitches((prev) => ({ ...prev, [job.id]: data.pitch }));
    } catch (error) {
      console.error("Failed to generate pitch", error);
    }
    setGeneratingFor(null);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // DRAG AND DROP LOGIC
  const onDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData("jobId", jobId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const onDrop = async (e: React.DragEvent, newStatus: string) => {
    const jobId = e.dataTransfer.getData("jobId");
    if (!jobId) return;

    setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job)));

    try {
      await fetch("/api/saved-jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: newStatus }),
      });
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const renderColumn = (title: string, statusKey: string, dotColor: string, emptyText: string) => {
    const columnJobs = Array.isArray(jobs) ? jobs.filter((job) => job.status === statusKey) : [];

    return (
      <div 
        className="w-full md:w-[350px] flex-shrink-0 flex flex-col"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, statusKey)}
      >
        <div className="flex justify-between items-center mb-3 px-2 py-1.5 rounded-md bg-[#0d0d0d] border border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
            <h3 className="text-xs font-semibold text-neutral-200 tracking-wider uppercase">{title}</h3>
          </div>
          <span className="text-[10px] font-mono font-medium text-neutral-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">{columnJobs.length}</span>
        </div>

        <div className={`flex-1 p-2 rounded-lg bg-[#0a0a0a] border border-white/[0.06] overflow-y-auto space-y-2.5 min-h-[500px] ${columnJobs.length === 0 ? 'border-dashed' : ''}`}>
          {columnJobs.length === 0 && (
            <div className="h-32 flex items-center justify-center text-[11px] text-neutral-500">
              {emptyText}
            </div>
          )}

          {columnJobs.map((job: any) => (
            <div 
              key={job.id} 
              draggable
              onDragStart={(e) => onDragStart(e, job.id)}
              className="bg-[#121212] border border-white/[0.08] hover:border-white/20 p-3.5 rounded-lg cursor-grab active:cursor-grabbing transition-colors flex flex-col gap-2.5 shadow-none"
            >
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getPlatformBadge(job.platform, job.leadType)}`}>
                  {job.platform}
                </span>

                <div className="flex items-center gap-1.5">
                  {(job.url || job.leadType === 'LOCAL') && (
                    <a 
                      href={
                        job.url && job.url.trim() !== '' && job.issueDetected !== 'NO_WEBSITE'
                          ? job.url
                          : `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + (job.district || ""))}`
                      } 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded transition-colors"
                      title={
                        job.url && job.url.trim() !== '' && job.issueDetected !== 'NO_WEBSITE'
                          ? 'Go to Website'
                          : 'Search Business on Google'
                      }
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
                      className="p-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors"
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
                      className="p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors"
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
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="View Cached Archive on Wayback Machine"
                    >
                      <Archive size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => handleUnsave(job.id)}
                    disabled={deletingId === job.id}
                    className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-white/[0.06] rounded transition-colors"
                    title="Return to Discovery Feed"
                  >
                    {deletingId === job.id ? <Loader2 size={13} className="animate-spin text-blue-400" /> : <RotateCcw size={13} />}
                  </button>

                  <button
                    onClick={() => handleDeletePermanently(job.id)}
                    disabled={deletingId === job.id}
                    className="text-gray-500 hover:text-red-400 transition"
                    title="Delete permanently from database"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-sm text-gray-200 leading-tight">{job.title}</h4>
                {job.url && job.url !== '' && job.issueDetected !== 'NO_WEBSITE' && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition" title="Visit Official Website">
                    <Globe2 size={14} />
                  </a>
                )}
              </div>
              
              <p className="text-gray-400 font-medium text-[11px] mb-4">
                {job.leadType === 'LOCAL' ? 'High Priority Local Lead' : job.budget}
              </p>
              
              {!pitches[job.id] ? (
                <button 
                  onClick={() => handleGeneratePitch(job)}
                  disabled={generatingFor === job.id}
                  className="w-full flex items-center justify-center gap-2 bg-[#222] hover:bg-[#2a2a2a] disabled:opacity-50 text-gray-300 py-2 rounded-lg text-xs font-semibold transition border border-white/5"
                >
                  {generatingFor === job.id ? (
                    <><Loader2 size={13} className="animate-spin text-blue-400" /> Analyzing...</>
                  ) : (
                    <><Sparkles size={13} className="text-pink-400" /> Generate AI Pitch</>
                  )}
                </button>
              ) : (
                <div className="mt-1 space-y-2">
                  <div className="relative group/pitch">
                    <div className="text-[11px] text-gray-400 bg-[#121212] p-3 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                      {pitches[job.id]}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(job.id, pitches[job.id])}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-[#222] hover:bg-[#333] rounded-md transition text-gray-400 hover:text-white border border-white/5"
                      title="Copy pitch to clipboard"
                    >
                      {copiedId === job.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>

                  {(() => {
                    let targetEmail = job.email || "";
                    if (!targetEmail && job.url && job.url.includes('.')) {
                      try {
                        const urlObj = new URL(job.url.startsWith('http') ? job.url : 'http://' + job.url);
                        const host = urlObj.hostname.replace(/^www\./, '');
                        if (host && host.includes('.')) targetEmail = `contact@${host}`;
                      } catch (e) {}
                    }
                    if (!targetEmail && job.title) {
                      const slug = job.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
                      targetEmail = `info@${slug}.com`;
                    }
                    return (
                      <a
                        href={`mailto:${targetEmail}?subject=${encodeURIComponent(`Partnership / Web Proposal: ${job.title}`)}&body=${encodeURIComponent(pitches[job.id])}`}
                        className="w-full py-1.5 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                        title={`Send pitch to ${targetEmail}`}
                      >
                        <Mail size={13} /> Send Email ({targetEmail})
                      </a>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
          
          {columnJobs.length === 0 && (
            <div className="h-full min-h-32 flex items-center justify-center text-center p-6 text-gray-600 text-xs font-medium">
              {emptyText}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto min-h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 tracking-tight">CRM Pipeline</h1>
          <p className="text-gray-500 text-xs md:text-sm">Drag and drop leads to track your progress.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {renderColumn("QUEUED LEADS", "QUEUED", "bg-blue-500", "No saved leads. Hunt in the Discovery Feed!")}
        {renderColumn("PITCHED & WAITING", "PITCHED", "bg-purple-500", "Drag leads here after sending your AI pitch.")}
        {renderColumn("WON / CLOSED", "WON", "bg-emerald-500", "Drag deals here when the client hires you!")}
      </div>
    </div>
  );
}
