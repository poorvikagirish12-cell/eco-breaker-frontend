"use client";

import { useEffect, useState, useCallback } from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { ArticleCard } from "@/components/ArticleCard";
import { BASE_URL } from "@/lib/api";

interface Tag { tag_id: number; name: string; }
interface Article {
  article_id: number; title: string; content?: string;
  author_id: number; author_name?: string; is_verified_author?: boolean;
  view_count: number; status: string; published_at?: string; tags?: Tag[];
}
interface TagAffinity { name: string; affinity_score: number; }
interface HistoryItem { article_id: number; title: string; viewed_at: string; view_duration_seconds: number; }

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [preferences, setPreferences] = useState<TagAffinity[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"personalized" | "global">("personalized");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "trending">("newest");
  const [loading, setLoading] = useState(false);

  const getHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadSidebar = useCallback(async () => {
    const h = getHeaders();
    try {
      const [tr, pr, hr] = await Promise.all([
        fetch(`${BASE_URL}/api/tags`, { headers: h }),
        fetch(`${BASE_URL}/api/users/me/preferences`, { headers: h }),
        fetch(`${BASE_URL}/api/users/me/history`, { headers: h }),
      ]);
      if (tr.ok) setTags(await tr.json());
      if (pr.ok) setPreferences(await pr.json());
      if (hr.ok) setHistory(await hr.json());
    } catch {}
  }, [getHeaders]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    const h = getHeaders();
    try {
      let url = `${BASE_URL}/api/feed`;
      if (activeTab === "global") {
        const p = new URLSearchParams();
        if (searchTerm) p.set("search", searchTerm);
        if (selectedTag) p.set("tag", String(selectedTag));
        if (sortBy === "trending") p.set("sort", "trending");
        url = `${BASE_URL}/api/articles?${p}`;
      }
      const r = await fetch(url, { headers: h });
      if (r.ok) setArticles(await r.json());
    } catch {} finally { setLoading(false); }
  }, [activeTab, searchTerm, selectedTag, sortBy, getHeaders]);

  useEffect(() => { loadArticles(); loadSidebar(); }, [loadArticles, loadSidebar]);

  // Sync search from navbar
  useEffect(() => {
    const handler = (e: Event) => {
      const val = (e as CustomEvent<string>).detail;
      setSearchTerm(val);
      setActiveTab("global");
      setSelectedTag(null);
    };
    window.addEventListener("archive-search", handler);
    return () => window.removeEventListener("archive-search", handler);
  }, []);

  const handleResetPreferences = async () => {
    const h = getHeaders();
    await Promise.all([
      fetch(`${BASE_URL}/api/users/me/preferences`, { method: "DELETE", headers: h }),
      fetch(`${BASE_URL}/api/users/me/history`, { method: "DELETE", headers: h }),
    ]);
    loadArticles(); loadSidebar();
  };

  const maxScore = Math.max(...preferences.map(p => p.affinity_score), 1);

  return (
    <div className="min-h-screen bg-[#020617] text-[#e2e8f0] flex flex-col">
      <TopNavbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold italic text-[#e2e8f0] mb-1" id="page-title">Article Feed</h1>
          <p className="text-sm italic text-[#64748b]">
            Discover articles that challenge and expand your perspective.
          </p>
        </div>

        {/* ── Mode Tabs ── */}
        <div className="flex items-center gap-1 bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-xl p-1 w-fit mb-6">
          {(["personalized", "global"] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => { setActiveTab(tab); setSelectedTag(null); }}
              className={`px-5 py-2 text-sm italic font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white shadow-lg"
                  : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              {tab === "personalized" ? "✦ For You" : "🌐 All Articles"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Main Feed Column ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Global-mode controls */}
            {activeTab === "global" && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Sort */}
                <select
                  id="select-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "trending")}
                  className="text-sm italic bg-[#0f172a] border border-[rgba(56,189,248,0.15)] rounded-lg px-3 py-1.5 text-[#e2e8f0] focus:outline-none focus:border-[#38bdf8] cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="trending">Trending</option>
                </select>

                {/* Tag filters from backend */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-3 py-1.5 text-xs italic font-semibold rounded-lg border transition-all ${
                      selectedTag === null
                        ? "bg-[rgba(56,189,248,0.15)] border-[#38bdf8] text-[#38bdf8]"
                        : "border-[rgba(56,189,248,0.12)] text-[#64748b] hover:text-[#e2e8f0] hover:border-[rgba(56,189,248,0.25)]"
                    }`}
                  >
                    All Topics
                  </button>
                  {tags.map((tag) => (
                    <button
                      key={tag.tag_id}
                      onClick={() => setSelectedTag(selectedTag === tag.tag_id ? null : tag.tag_id)}
                      className={`px-3 py-1.5 text-xs italic font-semibold rounded-lg border transition-all ${
                        selectedTag === tag.tag_id
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

            {/* Personalized mode notice */}
            {activeTab === "personalized" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0f172a] border border-[rgba(56,189,248,0.12)]">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="text-sm italic font-semibold text-[#38bdf8]">Personalized for You</p>
                  <p className="text-xs italic text-[#64748b] mt-0.5 leading-relaxed">
                    Articles are chosen to challenge your reading habits — surfacing content from topics you haven&apos;t explored yet.
                  </p>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-56 bg-[#0f172a] rounded-2xl border border-[rgba(56,189,248,0.08)] animate-pulse" />
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.article_id}
                    article={article}
                    onInteractionChange={loadSidebar}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-base italic font-semibold text-[#e2e8f0]">No articles found</p>
                <p className="text-sm italic text-[#475569] mt-1">Try switching to All Articles or adjusting your filters.</p>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="lg:col-span-4 space-y-5">

            {/* Tag Affinity Panel */}
            <div id="preferences" className="bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-2xl p-5">
              <h2 className="text-sm font-bold italic text-[#e2e8f0] mb-4 flex items-center gap-2">
                <span className="text-[#38bdf8]">⚙</span> Your Reading Profile
              </h2>

              {preferences.length > 0 ? (
                <div className="space-y-3 mb-5">
                  {preferences.map((p) => (
                    <div key={p.name}>
                      <div className="flex justify-between text-xs italic mb-1">
                        <span className="text-[#94a3b8] font-semibold">{p.name}</span>
                        <span className="text-[#38bdf8]">{p.affinity_score} pts</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min((p.affinity_score / maxScore) * 100, 100)}%`,
                            background: "linear-gradient(90deg,#38bdf8,#3b82f6)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-[#475569] mb-4">Read some articles to build your profile.</p>
              )}

              <button
                onClick={handleResetPreferences}
                id="btn-reset-preferences"
                className="w-full py-2 text-xs italic font-semibold text-rose-400 border border-rose-400/25 rounded-lg hover:bg-rose-400/10 transition-all"
              >
                Reset Profile
              </button>
            </div>

            {/* Reading History */}
            {history.length > 0 && (
              <div className="bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-2xl p-5">
                <h2 className="text-sm font-bold italic text-[#e2e8f0] mb-4 flex items-center gap-2">
                  <span className="text-[#38bdf8]">📖</span> Recently Read
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {history.slice(0, 8).map((h, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-1.5 border-b border-[rgba(56,189,248,0.06)] last:border-0">
                      <span className="text-xs italic text-[#94a3b8] truncate flex-1">{h.title}</span>
                      <span className="text-[10px] italic text-[#475569] flex-shrink-0">{h.view_duration_seconds}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick tip */}
            <div className="bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-2xl p-5">
              <h2 className="text-sm font-bold italic text-[#e2e8f0] mb-2 flex items-center gap-2">
                <span className="text-[#38bdf8]">💡</span> How It Works
              </h2>
              <p className="text-xs italic text-[#64748b] leading-relaxed">
                EcoBreaker tracks topics you read and intentionally surfaces articles from
                <em className="text-[#94a3b8]"> different perspectives</em> to break your filter bubble.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
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
