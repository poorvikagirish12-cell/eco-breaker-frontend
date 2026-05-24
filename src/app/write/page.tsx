"use client";

import { useEffect, useState, useCallback } from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { BASE_URL } from "@/lib/api";

interface Article {
  article_id: number;
  title: string;
  view_count: number;
  status: string;
  published_at?: string;
  created_at?: string;
  content?: string;
}

interface Tag {
  tag_id: number;
  name: string;
}

export default function WritePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Tab/Filter display for drafts in left column
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);

  // Auth helper
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }, []);

  // Load user's articles and available tags
  const loadData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [artRes, tagsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/authors/me/articles`, { headers }),
        fetch(`${BASE_URL}/api/tags`, { headers }),
      ]);

      if (artRes.ok) setArticles(await artRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit new blog post
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${BASE_URL}/api/articles`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...headers
        },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        const newArt = await res.json();

        // Assign tags
        for (const tagId of selectedTags) {
          await fetch(`${BASE_URL}/api/articles/${newArt.article_id}/tags`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              ...headers
            },
            body: JSON.stringify({ tag_id: tagId }),
          });
        }

        setMessage({ type: "success", text: "SIGNAL COMPILED: Saved as DRAFT. Execute publish to stream live." });
        setTitle("");
        setContent("");
        setSelectedTags([]);
        loadData();
      } else {
        setMessage({ type: "error", text: "TRANSMISSION FAILED: Verify authorization parameters." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "CONNECTION TIMEOUT: Core server unreachable." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (articleId: number) => {
    try {
      await fetch(`${BASE_URL}/api/articles/${articleId}/publish`, { 
        method: "PATCH",
        headers: getAuthHeaders()
      });
      loadData();
    } catch (err) {
      console.error("Publish error:", err);
    }
  };

  const handleUnpublish = async (articleId: number) => {
    try {
      await fetch(`${BASE_URL}/api/articles/${articleId}/unpublish`, { 
        method: "PATCH",
        headers: getAuthHeaders()
      });
      loadData();
    } catch (err) {
      console.error("Unpublish error:", err);
    }
  };

  const handleDelete = async (articleId: number) => {
    if (!confirm("Confirm complete database purge for this signal?")) return;
    try {
      await fetch(`${BASE_URL}/api/articles/${articleId}`, { 
        method: "DELETE",
        headers: getAuthHeaders()
      });
      loadData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Find active tag names selected
  const getSelectedTagNames = () => {
    if (selectedTags.length === 0) return "Unassigned";
    return selectedTags.map(id => tags.find(t => t.tag_id === id)?.name).join(", ");
  };

  return (
    <div className="min-h-screen bg-[#070d0b] text-[#c9d1c9] flex flex-col relative">
      <TopNavbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-10 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - STATUS.LOG & DIRECTIVES */}
          <div className="lg:col-span-3 space-y-6 terminal-font text-xs">
            
            {/* STATUS LOG */}
            <div className="bg-[#0b120f] border border-[rgba(3,227,140,0.15)] rounded-sm p-4">
              <h2 className="text-[10px] font-bold text-[#ff007f] tracking-widest uppercase mb-4 border-b border-[rgba(3,227,140,0.1)] pb-1.5">
                STATUS.LOG
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#03e38c]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#03e38c] shadow-[0_0_6px_#03e38c]" />
                  <span>UPLINK SECURE</span>
                </div>
                <div className="flex items-center gap-2 text-[#00e5ff]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] shadow-[0_0_6px_#00e5ff] animate-ping" />
                  <span>SYNCING NODES...</span>
                </div>
                <div className="flex items-center gap-2 text-[#ffb300]">
                  <svg className="w-3.5 h-3.5 text-[#ffb300]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>ANOMALY DETECTED</span>
                </div>
              </div>
            </div>

            {/* DIRECTIVES */}
            <div className="bg-[#0b120f] border border-[rgba(3,227,140,0.15)] rounded-sm p-4">
              <h2 className="text-[10px] font-bold text-[#03e38c] tracking-widest uppercase mb-4 border-b border-[rgba(3,227,140,0.1)] pb-1.5">
                DIRECTIVES
              </h2>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowDraftsOnly(!showDraftsOnly)}
                  className={`w-full text-left py-1.5 px-2 rounded-sm border transition-colors flex items-center justify-between ${
                    showDraftsOnly 
                      ? "border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/5" 
                      : "border-transparent text-[#708078] hover:text-[#c9d1c9] hover:bg-[#070d0b]"
                  }`}
                >
                  <span>&gt; DRAFT MANIFESTS</span>
                  <span className="text-[9px] px-1 border border-current">{articles.filter(a => a.status === "DRAFT").length}</span>
                </button>
                <a 
                  href="#editor" 
                  className="block py-1.5 px-2 text-[#708078] hover:text-[#c9d1c9] hover:bg-[#070d0b] rounded-sm transition-colors"
                >
                  &gt; INJECT LOGIC
                </a>
              </div>
            </div>

            {/* Brand display */}
            <div className="pt-4 opacity-30 select-none">
              <div className="text-xl font-bold tracking-widest text-[#03e38c]">
                ECO BREAKER
              </div>
              <p className="text-[9px] text-[#708078] mt-1 uppercase">Terminal Modes Core v4.2</p>
            </div>
          </div>

          {/* Right Column - Unified Code Editor Console */}
          <div className="lg:col-span-9 space-y-6" id="editor">
            
            {/* Main Console Box */}
            <div className="bg-[#0b120f] border border-[rgba(3,227,140,0.15)] rounded-sm shadow-xl overflow-hidden">
              {/* Console Header Bar */}
              <div className="bg-[#09100d] border-b border-[rgba(3,227,140,0.15)] py-2.5 px-4 flex items-center justify-between terminal-font text-xs">
                <div className="flex items-center gap-2 text-[#708078]">
                  <span className="w-2 h-2 rounded-full bg-[#ff007f]/80" />
                  <span className="font-semibold uppercase tracking-wider">NEW_ENTRY_PROTOCOL</span>
                </div>
                <div className="text-[#4d5e56]">
                  STATUS: AUTO_SAVING_ENABLED
                </div>
              </div>

              {/* Console Body */}
              <div className="p-6 space-y-6">
                
                {/* Status/Success Message */}
                {message && (
                  <div className={`p-3 text-xs font-semibold terminal-font border rounded-sm ${
                    message.type === "success"
                      ? "bg-[#03e38c]/5 border-[#03e38c] text-[#03e38c]"
                      : "bg-[#ff007f]/5 border-[#ff007f] text-[#ff007f]"
                  }`}>
                    &gt;&gt;&gt; {message.text}
                  </div>
                )}

                {/* Big Title Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ENTER.TITLE_HERE"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent text-xl md:text-2xl font-bold text-[#c9d1c9] placeholder:text-[#4d5e56] border-b border-[rgba(3,227,140,0.15)] pb-3 focus:outline-none focus:border-[#00e5ff] transition-colors uppercase tracking-wider"
                    required
                  />
                  
                  {/* COMMIT Button Top-Right inside editor */}
                  <button
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting || !title.trim() || !content.trim()}
                    className="absolute right-0 bottom-3 h-8 px-4 border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff]/10 text-xs font-bold uppercase transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed terminal-font shadow-[0_0_8px_rgba(0,229,255,0.2)]"
                  >
                    {isSubmitting ? "SYNCING..." : "COMMIT"}
                  </button>
                </div>

                {/* Metadata clearance indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-[rgba(3,227,140,0.1)] bg-[#09100d]/50 p-3 terminal-font text-[10px]">
                  
                  {/* Classification */}
                  <div className="flex items-center gap-2 border-r border-[rgba(3,227,140,0.1)] last:border-none pr-3">
                    <svg className="w-3.5 h-3.5 text-[#ffb300]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-[#708078]">CLASSIFICATION:</span>
                    <span className={selectedTags.length > 0 ? "text-[#03e38c] font-bold" : "text-[#ffb300] font-bold"}>
                      {getSelectedTagNames().toUpperCase()}
                    </span>
                  </div>

                  {/* Clearance */}
                  <div className="flex items-center gap-2 border-r border-[rgba(3,227,140,0.1)] last:border-none pr-3">
                    <svg className="w-3.5 h-3.5 text-[#00e5ff]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span className="text-[#708078]">CLEARANCE:</span>
                    <span className="text-[#00e5ff] font-bold">LEVEL 1 (PUBLIC)</span>
                  </div>

                  {/* Revisions */}
                  <div className="flex items-center gap-2 last:border-none">
                    <svg className="w-3.5 h-3.5 text-[#03e38c]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span className="text-[#708078]">REVISIONS:</span>
                    <span className="text-[#03e38c] font-bold">{articles.length} COMMITS</span>
                  </div>

                </div>

                {/* Form Title & Tag Elements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 terminal-font text-xs">
                  
                  {/* Subject Tag Selector */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-[#708078] uppercase tracking-wider block">
                      &gt; CLASSIFICATION_TAGS
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {tags.length > 0 ? tags.map((t) => {
                        const isSelected = selectedTags.includes(t.tag_id);
                        return (
                          <button
                            key={t.tag_id}
                            type="button"
                            onClick={() => toggleTag(t.tag_id)}
                            className={`px-3 py-1 border transition-all rounded-sm uppercase ${
                              isSelected
                                ? "bg-[#03e38c]/15 border-[#03e38c] text-[#03e38c] font-bold shadow-[0_0_8px_rgba(3,227,140,0.2)]"
                                : "bg-[#070d0b] border-[rgba(3,227,140,0.15)] text-[#708078] hover:border-[#03e38c]/50 hover:text-[#c9d1c9]"
                            }`}
                          >
                            {t.name}
                          </button>
                        );
                      }) : (
                        <span className="text-[#4d5e56] italic">Loading tags list...</span>
                      )}
                    </div>
                  </div>

                  {/* Subject Title Designation Info */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-[#708078] uppercase tracking-wider block">
                      &gt; SUBJECT / SIGN DESIGNATION
                    </span>
                    <input
                      type="text"
                      placeholder="Enter signal designation metadata..."
                      className="w-full h-8 px-2 bg-[#070d0b] border border-[rgba(3,227,140,0.15)] focus:border-[#03e38c] focus:outline-none text-xs text-[#c9d1c9]"
                    />
                  </div>

                </div>

                {/* Textarea data stream */}
                <div className="space-y-2 terminal-font">
                  <label className="text-[10px] font-bold text-[#708078] uppercase tracking-wider block">
                    &gt; DATA_STREAM_TRANSCRIPTION
                  </label>
                  <textarea
                    placeholder="Begin synthesis..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[300px] p-4 bg-[#070d0b] border border-[rgba(3,227,140,0.15)] text-xs text-[#c9d1c9] placeholder:text-[#4d5e56] focus:border-[#03e38c] focus:outline-none leading-relaxed select-text"
                    required
                  />
                  <div className="text-[10px] text-[#4d5e56] text-right font-semibold">
                    METRIC_SIZE: {content.length} CHARS
                  </div>
                </div>

                {/* Bottom Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between pt-2">
                  <button
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting || !title.trim() || !content.trim()}
                    className="h-10 px-6 border border-[#03e38c] text-[#03e38c] hover:bg-[#03e38c]/10 text-xs font-bold uppercase transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed terminal-font flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(3,227,140,0.1)]"
                  >
                    💾 Save Protocol
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      // Submits as draft and auto-publishes (or alerts if not saved)
                      if (!title.trim() || !content.trim()) return;
                      setIsSubmitting(true);
                      try {
                        const headers = getAuthHeaders();
                        const res = await fetch(`${BASE_URL}/api/articles`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", ...headers },
                          body: JSON.stringify({ title, content }),
                        });
                        if (res.ok) {
                          const art = await res.json();
                          // Assign tags
                          for (const tagId of selectedTags) {
                            await fetch(`${BASE_URL}/api/articles/${art.article_id}/tags`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json", ...headers },
                              body: JSON.stringify({ tag_id: tagId }),
                            });
                          }
                          // Publish
                          await fetch(`${BASE_URL}/api/articles/${art.article_id}/publish`, { 
                            method: "PATCH",
                            headers
                          });
                          setMessage({ type: "success", text: "SUCCESS: Signal compiled and streamed to network." });
                          setTitle("");
                          setContent("");
                          setSelectedTags([]);
                          loadData();
                        }
                      } catch (e) {
                        setMessage({ type: "error", text: "ERROR: Publish pipeline failed." });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting || !title.trim() || !content.trim()}
                    className="h-10 px-6 border border-[#ff007f] text-[#ff007f] hover:bg-[#ff007f]/10 text-xs font-bold uppercase transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed terminal-font flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(255,0,127,0.15)]"
                  >
                    🚀 Execute Publish
                  </button>
                </div>

              </div>
            </div>

            {/* My Signal Logs Section */}
            <div className="bg-[#0b120f] border border-[rgba(3,227,140,0.15)] rounded-sm p-6">
              <h2 className="text-sm font-bold text-[#03e38c] terminal-font uppercase tracking-wider mb-1">
                📚 My Transmission Logs
              </h2>
              <p className="text-[10px] text-[#708078] terminal-font uppercase mb-6">
                Manage your localized signal records and active draft streams.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                {articles.length > 0 ? (
                  articles
                    .filter(art => !showDraftsOnly || art.status === "DRAFT")
                    .map((art) => (
                      <div
                        key={art.article_id}
                        id={`post-${art.article_id}`}
                        className="p-4 bg-[#070d0b] border border-[rgba(3,227,140,0.1)] rounded-sm space-y-3.5 hover:border-[rgba(3,227,140,0.25)] transition-all terminal-font text-xs"
                      >
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-[#c9d1c9] line-clamp-2 uppercase tracking-wide leading-snug">{art.title}</h3>
                          <span className={`text-[8px] font-bold px-2 py-0.5 border rounded-sm tracking-widest shrink-0 ${
                            art.status === "PUBLISHED"
                              ? "bg-[rgba(3,227,140,0.1)] border-[#03e38c] text-[#03e38c]"
                              : "bg-[rgba(255,179,0,0.1)] border-[#ffb300] text-[#ffb300]"
                          }`}>
                            {art.status === "PUBLISHED" ? "LIVE" : "DRAFT"}
                          </span>
                        </div>

                        {/* Telemetry data */}
                        <div className="flex items-center gap-4 text-[9px] text-[#4d5e56] font-bold">
                          <span>VIEWS: {art.view_count}</span>
                          <span>DATE: {art.published_at
                            ? new Date(art.published_at).toLocaleDateString()
                            : art.created_at
                            ? new Date(art.created_at).toLocaleDateString()
                            : "ACTIVE"}
                          </span>
                        </div>

                        {/* Options */}
                        <div className="flex gap-2 pt-2 border-t border-[rgba(3,227,140,0.05)]">
                          {art.status === "DRAFT" ? (
                            <button
                              onClick={() => handlePublish(art.article_id)}
                              className="flex-grow h-7 bg-transparent border border-[#03e38c] text-[#03e38c] hover:bg-[#03e38c]/15 font-bold text-[10px] rounded-sm transition-all"
                            >
                              PUBLISH
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnpublish(art.article_id)}
                              className="flex-grow h-7 bg-transparent border border-[#ffb300] text-[#ffb300] hover:bg-[#ffb300]/15 font-bold text-[10px] rounded-sm transition-all"
                            >
                              REVERT TO DRAFT
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(art.article_id)}
                            className="h-7 px-3 border border-[#ff007f] text-[#ff007f] hover:bg-[#ff007f]/10 font-bold text-[10px] rounded-sm transition-all"
                          >
                            DELETE
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="col-span-2 text-center py-10 border border-dashed border-[rgba(3,227,140,0.15)] rounded-sm terminal-font">
                    <p className="text-xs text-[#708078]">NO SIGNAL RECORDS REGISTERED FOR AUTHOR ENDPOINT.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Cyberpunk Monospace Footer */}
      <footer className="mt-auto border-t border-[rgba(3,227,140,0.1)] bg-[#09100d]/30 py-5 terminal-font text-[10px] text-[#4d5e56]">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 uppercase">
          <div className="font-extrabold tracking-widest text-[#03e38c]/80">
            Eco Breaker
          </div>
          <div className="flex gap-6 tracking-widest">
            <span className="cursor-pointer hover:text-[#03e38c]">Terminal</span>
            <span className="cursor-pointer hover:text-[#00e5ff]">Modes</span>
            <span className="cursor-pointer hover:text-[#ff007f]">Core</span>
          </div>
          <div>
            © 2026 Eco Breaker Archive. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
