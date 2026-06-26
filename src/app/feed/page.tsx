"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TopNavbar } from "@/components/TopNavbar";
import { ArticleCard } from "@/components/ArticleCard";
import { BASE_URL } from "@/lib/api";
import { Lock, Brain, Leaf, Cpu, Atom, BookOpen, Globe, Landmark, Palette, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

interface Tag { tag_id: number; name: string; }
interface Article {
  article_id: number; title: string; content?: string;
  author_id: number; author_name?: string; is_verified_author?: boolean;
  view_count: number; status: string; published_at?: string; tags?: Tag[];
}
interface TagAffinity { name: string; affinity_score: number; }
interface HistoryItem { article_id: number; title: string; viewed_at: string; view_duration_seconds: number; }

function getCoverImage(tags?: Tag[], title?: string): string {
  // Check tags first
  if (tags && tags.length > 0) {
    const name = tags[0].name.toLowerCase();
    if (name.includes("tech") || name.includes("ai") || name.includes("cyber") || name.includes("crypto") || name.includes("quantum")) return "/images/tech.png";
    if (name.includes("nature") || name.includes("environment") || name.includes("climate") || name.includes("eco")) return "/images/nature.png";
    if (name.includes("space") || name.includes("astro") || name.includes("cosmos")) return "/images/space.png";
    if (name.includes("science") || name.includes("mind") || name.includes("neuro") || name.includes("psych")) return "/images/science.png";
    if (name.includes("societ") || name.includes("business") || name.includes("econom") || name.includes("politi") || name.includes("financ")) return "/images/society.png";
    if (name.includes("culture") || name.includes("philos") || name.includes("art") || name.includes("histor") || name.includes("ethic")) return "/images/culture.png";
    if (name.includes("remote") || name.includes("work") || name.includes("career")) return "/images/society.png";
    if (name.includes("stoic") || name.includes("moral") || name.includes("ethics")) return "/images/culture.png";
  }
  // Fallback: check title keywords
  if (title) {
    const t = title.toLowerCase();
    if (t.includes("tech") || t.includes("ai") || t.includes("digital") || t.includes("virtual") || t.includes("augmented") || t.includes("robot")) return "/images/tech.png";
    if (t.includes("nature") || t.includes("climate") || t.includes("green") || t.includes("planet")) return "/images/nature.png";
    if (t.includes("space") || t.includes("mars") || t.includes("moon") || t.includes("star")) return "/images/space.png";
    if (t.includes("brain") || t.includes("science") || t.includes("research") || t.includes("neuro")) return "/images/science.png";
    if (t.includes("societ") || t.includes("business") || t.includes("econom") || t.includes("work") || t.includes("market") || t.includes("remote")) return "/images/society.png";
    if (t.includes("culture") || t.includes("philos") || t.includes("art") || t.includes("truth") || t.includes("vulnerab") || t.includes("moral")) return "/images/culture.png";
    if (t.includes("security") || t.includes("cyber") || t.includes("hack") || t.includes("crypto")) return "/images/tech.png";
  }
  // Cycle through images based on a simple hash of the title
  const images = ["/images/tech.png", "/images/nature.png", "/images/space.png", "/images/science.png", "/images/society.png", "/images/culture.png"];
  const hash = (title || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return images[hash % images.length];
}

function getTopicIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("crypto") || n.includes("secur")) return <Lock className="w-3.5 h-3.5 text-[#38bdf8]" />;
  if (n.includes("ai") || n.includes("intellig") || n.includes("neuro") || n.includes("mind")) return <Brain className="w-3.5 h-3.5 text-[#a78bfa]" />;
  if (n.includes("climate") || n.includes("eco") || n.includes("environment") || n.includes("nature")) return <Leaf className="w-3.5 h-3.5 text-[#34d399]" />;
  if (n.includes("quantum") || n.includes("comput")) return <Cpu className="w-3.5 h-3.5 text-[#f472b6]" />;
  if (n.includes("science") || n.includes("physics") || n.includes("chem")) return <Atom className="w-3.5 h-3.5 text-[#60a5fa]" />;
  if (n.includes("politi") || n.includes("govern") || n.includes("law")) return <Landmark className="w-3.5 h-3.5 text-[#fbbf24]" />;
  if (n.includes("culture") || n.includes("art") || n.includes("philos")) return <Palette className="w-3.5 h-3.5 text-[#f97316]" />;
  if (n.includes("econom") || n.includes("financ") || n.includes("business")) return <Globe className="w-3.5 h-3.5 text-[#22d3ee]" />;
  if (n.includes("space") || n.includes("astro")) return <Lightbulb className="w-3.5 h-3.5 text-[#c084fc]" />;
  return <BookOpen className="w-3.5 h-3.5 text-[#38bdf8]" />;
}

function relativeDate(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return `${diff}d ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

function readTime(content?: string) {
  if (!content) return "1 min";
  return `${Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))} min`;
}

type FeedTab = "personalized" | "global" | "saved";

function FeedContent() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [preferences, setPreferences] = useState<TagAffinity[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<FeedTab>(
    searchParams.get("saved") === "1" ? "saved" : "personalized"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "trending">("newest");
  const [loading, setLoading] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);

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
      if (activeTab === "saved") {
        const r = await fetch(`${BASE_URL}/api/users/me/saved-articles`, { headers: h });
        if (r.ok) setSavedArticles(await r.json());
        setLoading(false);
        return;
      }
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

  // Hero article = highest view count from current list
  const displayedArticles = activeTab === "saved" ? savedArticles : articles;
  const heroArticle = activeTab === "global" && displayedArticles.length > 0 ? displayedArticles[0] : null;
  const gridArticles = heroArticle ? displayedArticles.slice(1) : displayedArticles;

  return (
    <div className="min-h-screen bg-transparent text-[#e2e8f0] flex flex-col">
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
          {([
            { id: "personalized", label: "✦ For You" },
            { id: "global", label: "🌐 All Articles" },
            { id: "saved", label: "🔖 Saved" },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => { setActiveTab(id); setSelectedTag(null); }}
              className={`px-5 py-2 text-sm italic font-semibold rounded-lg transition-all ${
                activeTab === id
                  ? "bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white shadow-lg"
                  : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Main Feed Column ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Global-mode controls */}
            {activeTab === "global" && (
              <div className="flex flex-wrap items-center gap-3">
                <select
                  id="select-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "trending")}
                  className="text-sm italic bg-[#0f172a] border border-[rgba(56,189,248,0.15)] rounded-lg px-3 py-1.5 text-[#e2e8f0] focus:outline-none focus:border-[#38bdf8] cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="trending">Trending</option>
                </select>
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
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0f172a]/60 backdrop-blur-md border border-[rgba(56,189,248,0.12)]">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="text-sm italic font-semibold text-[#38bdf8]">Personalized for You</p>
                  <p className="text-xs italic text-[#64748b] mt-0.5 leading-relaxed">
                    Articles are chosen to challenge your reading habits — surfacing content from topics you haven&apos;t explored yet.
                  </p>
                </div>
              </div>
            )}

            {/* Saved mode notice */}
            {activeTab === "saved" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0f172a]/60 backdrop-blur-md border border-[rgba(56,189,248,0.12)]">
                <span className="text-2xl">🔖</span>
                <div>
                  <p className="text-sm italic font-semibold text-[#38bdf8]">Your Saved Articles</p>
                  <p className="text-xs italic text-[#64748b] mt-0.5">Articles you bookmarked for later reading.</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-56 bg-[#0f172a] rounded-2xl border border-[rgba(56,189,248,0.08)] animate-pulse" />
                ))}
              </div>
            ) : displayedArticles.length > 0 ? (
              <>
                {/* Hero Article — only in global mode with results */}
                {heroArticle && (
                  <ArticleCard
                    article={heroArticle}
                    layout="hero"
                    onInteractionChange={loadSidebar}
                  />
                )}

                {/* Articles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gridArticles.map((article) => (
                    <ArticleCard
                      key={article.article_id}
                      article={article}
                      onInteractionChange={loadSidebar}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">
                  {activeTab === "saved" ? "🔖" : "📭"}
                </div>
                <p className="text-base italic font-semibold text-[#e2e8f0]">
                  {activeTab === "saved" ? "No saved articles yet" : "No articles found"}
                </p>
                <p className="text-sm italic text-[#475569] mt-1">
                  {activeTab === "saved"
                    ? "Save articles by clicking the bookmark icon on any article card."
                    : "Try switching to All Articles or adjusting your filters."}
                </p>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="lg:col-span-4 space-y-5">

            {/* Tag Affinity Panel */}
            <div id="preferences" className="bg-[#0f172a]/60 backdrop-blur-md border border-[rgba(56,189,248,0.12)] rounded-2xl p-5">
              <h2 className="sidebar-title text-sm font-bold italic text-[#e2e8f0] mb-4 flex items-center gap-2">
                <span className="text-[#38bdf8]">⚙</span> Your Reading Profile
              </h2>

              {preferences.length > 0 ? (
                <div className="space-y-2.5 mb-5">
                  {(showAllTopics ? preferences : preferences.slice(0, 5)).map((p) => (
                    <div key={p.name} className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#1e293b] flex items-center justify-center">
                        {getTopicIcon(p.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs italic mb-0.5">
                          <span className="text-[#94a3b8] font-semibold truncate">{p.name}</span>
                          <span className="text-[#38bdf8] flex-shrink-0 ml-2">{p.affinity_score} pts</span>
                        </div>
                        <div className="w-full h-1 bg-[#1e293b] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min((p.affinity_score / maxScore) * 100, 100)}%`,
                              background: "linear-gradient(90deg,#38bdf8,#3b82f6)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {preferences.length > 5 && (
                    <button
                      onClick={() => setShowAllTopics(!showAllTopics)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] italic font-semibold text-[#38bdf8] hover:text-[#7dd3fc] transition-colors"
                    >
                      {showAllTopics ? (
                        <><ChevronUp className="w-3.5 h-3.5" /> See Less Topics</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5" /> See More Topics ({preferences.length - 5} more)</>
                      )}
                    </button>
                  )}
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
              <div className="bg-[#0f172a]/60 backdrop-blur-md border border-[rgba(56,189,248,0.12)] rounded-2xl p-5">
                <h2 className="sidebar-title text-sm font-bold italic text-[#e2e8f0] mb-4 flex items-center gap-2">
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

            {/* Newsletter Widget */}
            <div className="bg-[#0f172a]/60 backdrop-blur-md border border-[rgba(56,189,248,0.18)] rounded-2xl p-5 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)" }} />
              <h2 className="sidebar-title text-sm font-bold italic text-[#e2e8f0] mb-1 flex items-center gap-2">
                <span>✉️</span> Stay in the Loop
              </h2>
              <p className="text-xs italic text-[#64748b] mb-4 leading-relaxed">
                Get the week&apos;s most thought-provoking articles delivered to your inbox.
              </p>
              {newsletterSent ? (
                <div className="text-center py-2">
                  <p className="text-sm italic text-emerald-400 font-semibold">✓ You&apos;re subscribed!</p>
                  <p className="text-[10px] italic text-[#475569] mt-1">Check your email for confirmation.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); setNewsletterSent(true); }}
                  className="space-y-2"
                >
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="w-full h-9 bg-[#020617] border border-[rgba(56,189,248,0.15)] rounded-lg px-3 text-xs italic text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#38bdf8] focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 text-xs italic font-bold text-white rounded-lg transition-all"
                    style={{ background: "linear-gradient(135deg,#0ea5e9,#3b82f6)" }}
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>

            {/* How It Works */}
            <div className="bg-[#0f172a]/60 backdrop-blur-md border border-[rgba(56,189,248,0.12)] rounded-2xl p-5">
              <h2 className="sidebar-title text-sm font-bold italic text-[#e2e8f0] mb-2 flex items-center gap-2">
                <span className="text-[#38bdf8]">💡</span> How It Works
              </h2>
              <p className="text-xs italic text-[#64748b] leading-relaxed">
                EcoBreaker tracks topics you read and intentionally surfaces articles from{" "}
                <em className="text-[#94a3b8]">different perspectives</em> to break your filter bubble.
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

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[rgba(56,189,248,0.2)] border-t-[#38bdf8] animate-spin" />
      </div>
    }>
      <FeedContent />
    </Suspense>
  );
}
