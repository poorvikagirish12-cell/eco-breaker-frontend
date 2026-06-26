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

interface Tag { tag_id: number; name: string; }

const inputClass = "w-full bg-[#0f172a] border border-[rgba(56,189,248,0.15)] rounded-xl px-4 py-2.5 text-sm italic text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#38bdf8] focus:outline-none focus:ring-1 focus:ring-[rgba(56,189,248,0.15)] transition-all resize-none";

export default function WritePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);

  const getHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadData = useCallback(async () => {
    const h = getHeaders();
    const [artRes, tagsRes] = await Promise.all([
      fetch(`${BASE_URL}/api/authors/me/articles`, { headers: h }),
      fetch(`${BASE_URL}/api/tags`, { headers: h }),
    ]);
    if (artRes.ok) setArticles(await artRes.json());
    if (tagsRes.ok) setTags(await tagsRes.json());
  }, [getHeaders]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (action: "draft" | "publish", e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const h = { "Content-Type": "application/json", ...getHeaders() };
      const res = await fetch(`${BASE_URL}/api/articles`, {
        method: "POST", headers: h,
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const art = await res.json();
        for (const tagId of selectedTags) {
          await fetch(`${BASE_URL}/api/articles/${art.article_id}/tags`, {
            method: "POST", headers: h,
            body: JSON.stringify({ tag_id: tagId }),
          });
        }
        if (action === "publish") {
          const pubRes = await fetch(`${BASE_URL}/api/articles/${art.article_id}/publish`, {
            method: "PATCH", headers: getHeaders(),
          });
          if (pubRes.ok) {
            setMessage({ type: "success", text: "Article published successfully!" });
          } else {
            setMessage({ type: "success", text: "Article saved as draft, but failed to publish." });
          }
        } else {
          setMessage({ type: "success", text: "Article saved as draft! You can publish it from your articles list below." });
        }
        setTitle(""); setContent(""); setSelectedTags([]);
        loadData();
      } else {
        setMessage({ type: "error", text: "Failed to save the article. Please check you are logged in." });
      }
    } catch {
      setMessage({ type: "error", text: "Could not connect to the server. Please try again." });
    } finally { setIsSubmitting(false); }
  };

  const handlePublish = async (id: number) => {
    await fetch(`${BASE_URL}/api/articles/${id}/publish`, {
      method: "PATCH", headers: getHeaders(),
    });
    loadData();
  };

  const handleUnpublish = async (id: number) => {
    await fetch(`${BASE_URL}/api/articles/${id}/unpublish`, {
      method: "PATCH", headers: getHeaders(),
    });
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this article permanently?")) return;
    await fetch(`${BASE_URL}/api/articles/${id}`, {
      method: "DELETE", headers: getHeaders(),
    });
    loadData();
  };

  const toggleTag = (id: number) =>
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);

  const displayedArticles = showDraftsOnly
    ? articles.filter((a) => a.status === "DRAFT")
    : articles;

  const drafts = articles.filter((a) => a.status === "DRAFT").length;
  const published = articles.filter((a) => a.status === "PUBLISHED").length;

  return (
    <div className="min-h-screen bg-transparent text-[#e2e8f0] flex flex-col">
      <TopNavbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold italic text-[#e2e8f0] mb-1">Write a Blog</h1>
          <p className="text-sm italic text-[#64748b]">Share your ideas and perspectives with the EcoBreaker community.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Editor Column ── */}
          <div className="lg:col-span-8 space-y-5" id="editor">

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-xl text-sm italic border ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/25 text-rose-400"
              }`}>
                {message.text}
              </div>
            )}

            {/* Write form */}
            <form onSubmit={(e) => e.preventDefault()} className="bg-[#0f172a]/60 backdrop-blur-md border border-[rgba(56,189,248,0.12)] rounded-2xl overflow-hidden">

              {/* Form header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(56,189,248,0.08)] bg-[#020617]/40">
                <span className="text-sm italic font-semibold text-[#94a3b8]">New Article</span>
                <span className="text-xs italic text-[#475569]">Draft will be saved automatically</span>
              </div>

              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label htmlFor="article-title" className="block text-xs italic font-semibold text-[#94a3b8] mb-1.5">
                    Title *
                  </label>
                  <input
                    id="article-title"
                    type="text"
                    placeholder="Give your article a compelling title…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                {/* Content */}
                <div>
                  <label htmlFor="article-content" className="block text-xs italic font-semibold text-[#94a3b8] mb-1.5">
                    Content *
                  </label>
                  <textarea
                    id="article-content"
                    rows={14}
                    placeholder="Write your article here…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className={inputClass}
                  />
                  <p className="text-[10px] italic text-[#475569] mt-1 text-right">
                    {content.trim().split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div>
                    <label className="block text-xs italic font-semibold text-[#94a3b8] mb-2">
                      Topics (optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.tag_id}
                          type="button"
                          onClick={() => toggleTag(tag.tag_id)}
                          className={`px-3 py-1.5 text-xs italic font-semibold rounded-lg border transition-all ${
                            selectedTags.includes(tag.tag_id)
                              ? "bg-[rgba(56,189,248,0.15)] border-[#38bdf8] text-[#38bdf8]"
                              : "border-[rgba(56,189,248,0.12)] text-[#64748b] hover:text-[#e2e8f0] hover:border-[rgba(56,189,248,0.25)]"
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit("draft", e)}
                    disabled={isSubmitting || !title.trim() || !content.trim()}
                    id="btn-save-draft"
                    className="flex-1 h-11 rounded-xl text-sm italic font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[rgba(56,189,248,0.2)] bg-transparent hover:bg-[rgba(56,189,248,0.08)]"
                  >
                    {isSubmitting ? "Saving…" : "Save as Draft"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit("publish", e)}
                    disabled={isSubmitting || !title.trim() || !content.trim()}
                    id="btn-publish-direct"
                    className="flex-1 h-11 rounded-xl text-sm italic font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg,#0ea5e9,#3b82f6)", boxShadow: "0 4px 20px rgba(14,165,233,0.25)" }}
                  >
                    {isSubmitting ? "Publishing…" : "Publish Directly"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* ── Sidebar: My Articles ── */}
          <div className="lg:col-span-4 space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Published", value: published, color: "text-[#38bdf8]" },
                { label: "Drafts", value: drafts, color: "text-[#f59e0b]" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#0f172a]/60 backdrop-blur-md border border-[rgba(56,189,248,0.12)] rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold italic ${color}`}>{value}</p>
                  <p className="text-xs italic text-[#64748b] mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Filter toggle */}
            <div className="flex gap-1 bg-[#0f172a]/60 backdrop-blur-md border border-[rgba(56,189,248,0.12)] rounded-xl p-1">
              {[false, true].map((isDrafts) => (
                <button
                  key={String(isDrafts)}
                  onClick={() => setShowDraftsOnly(isDrafts)}
                  className={`flex-1 py-1.5 text-xs italic font-semibold rounded-lg transition-all ${
                    showDraftsOnly === isDrafts
                      ? "bg-[rgba(56,189,248,0.15)] text-[#38bdf8]"
                      : "text-[#64748b] hover:text-[#e2e8f0]"
                  }`}
                >
                  {isDrafts ? "Drafts Only" : "All Articles"}
                </button>
              ))}
            </div>

            {/* Articles list */}
            <div className="bg-[#0f172a]/60 backdrop-blur-md border border-[rgba(56,189,248,0.12)] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgba(56,189,248,0.08)]">
                <h2 className="text-sm italic font-bold text-[#e2e8f0]">My Articles</h2>
              </div>
              {displayedArticles.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm italic text-[#475569]">No articles yet.</p>
                  <p className="text-xs italic text-[#334155] mt-1">Start writing above!</p>
                </div>
              ) : (
                <div className="divide-y divide-[rgba(56,189,248,0.06)] max-h-[480px] overflow-y-auto">
                  {displayedArticles.map((art) => (
                    <div key={art.article_id} className="p-4 hover:bg-[rgba(56,189,248,0.03)] transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm italic font-semibold text-[#e2e8f0] line-clamp-2 flex-1">{art.title}</h3>
                        <span className={`flex-shrink-0 text-[10px] italic font-bold px-2 py-0.5 rounded-full ${
                          art.status === "PUBLISHED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                        }`}>
                          {art.status === "PUBLISHED" ? "Live" : "Draft"}
                        </span>
                      </div>
                      <p className="text-[10px] italic text-[#475569] mb-3">
                        {art.view_count} views · {art.published_at
                          ? new Date(art.published_at).toLocaleDateString()
                          : "Not published"}
                      </p>
                      <div className="flex gap-2">
                        {art.status === "DRAFT" ? (
                          <button onClick={() => handlePublish(art.article_id)}
                            className="flex-1 py-1.5 text-xs italic font-semibold rounded-lg border border-[rgba(56,189,248,0.2)] text-[#38bdf8] hover:bg-[rgba(56,189,248,0.08)] transition-all">
                            Publish
                          </button>
                        ) : (
                          <button onClick={() => handleUnpublish(art.article_id)}
                            className="flex-1 py-1.5 text-xs italic font-semibold rounded-lg border border-[rgba(56,189,248,0.12)] text-[#64748b] hover:text-[#e2e8f0] hover:border-[rgba(56,189,248,0.25)] transition-all">
                            Unpublish
                          </button>
                        )}
                        <button onClick={() => handleDelete(art.article_id)}
                          className="py-1.5 px-3 text-xs italic font-semibold rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[rgba(56,189,248,0.08)] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="brand-font text-lg font-bold" style={{
            background: "linear-gradient(135deg,#38bdf8,#818cf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>EcoBreaker</span>
          <p className="text-xs italic text-[#334155]">© 2026 EcoBreaker. Challenging perspectives, one article at a time.</p>
        </div>
      </footer>
    </div>
  );
}
