"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TopNavbar } from "@/components/TopNavbar";
import { BASE_URL } from "@/lib/api";

interface Tag { tag_id: number; name: string; }
interface Article {
  article_id: number;
  title: string;
  content: string;
  author_id: number;
  author_name?: string;
  is_verified_author?: boolean;
  view_count: number;
  status: string;
  published_at?: string;
  tags?: Tag[];
}

function relativeDate(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return `${diff} days ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return `${Math.floor(diff / 365)} years ago`;
}

function readTime(content?: string) {
  if (!content) return "1 min read";
  const words = content.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function tagColor(name: string) {
  const n = name.toLowerCase();
  if (n.includes("tech") || n.includes("cyber")) return { bg: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "rgba(56,189,248,0.3)" };
  if (n.includes("polit")) return { bg: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "rgba(139,92,246,0.3)" };
  if (n.includes("econ")) return { bg: "rgba(52,211,153,0.1)", color: "#34d399", border: "rgba(52,211,153,0.3)" };
  return { bg: "rgba(99,102,241,0.1)", color: "#818cf8", border: "rgba(99,102,241,0.3)" };
}

/* Link rendering helper */
function renderParagraphWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#38bdf8] hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = Number(params.id);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const contentRef = useRef<HTMLDivElement>(null);
  const hasSentView = useRef(false);

  const getHeaders = (): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  useEffect(() => {
    if (!articleId) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/articles/${articleId}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const read = Math.min(1, Math.max(0, (windowH - top) / height));
      setScrollPct(Math.round(read * 100));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Log view on unmount
  useEffect(() => {
    return () => {
      if (!hasSentView.current && article) {
        hasSentView.current = true;
        const secs = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        fetch(`${BASE_URL}/api/interactions/view?article_id=${articleId}`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ view_duration_seconds: secs }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [article, articleId]);

  const handleLike = async () => {
    if (isLiked) {
      await fetch(`${BASE_URL}/api/interactions/like/${articleId}`, { method: "DELETE", headers: getHeaders() });
      setIsLiked(false);
    } else {
      await fetch(`${BASE_URL}/api/interactions/like?article_id=${articleId}`, { method: "POST", headers: getHeaders() });
      setIsLiked(true);
    }
  };

  const handleSave = async () => {
    if (isSaved) {
      await fetch(`${BASE_URL}/api/interactions/save/${articleId}`, { method: "DELETE", headers: getHeaders() });
      setIsSaved(false);
    } else {
      await fetch(`${BASE_URL}/api/interactions/save?article_id=${articleId}`, { method: "POST", headers: getHeaders() });
      setIsSaved(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <TopNavbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[rgba(56,189,248,0.2)] border-t-[#38bdf8] animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <TopNavbar />
        <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
          <div className="text-6xl mb-4">📭</div>
          <h1 className="text-2xl font-bold italic text-[#e2e8f0] mb-2">Article Not Found</h1>
          <p className="text-sm italic text-[#64748b] mb-6">This article may have been unpublished or removed.</p>
          <Link href="/feed" className="px-6 py-2.5 rounded-xl text-sm italic font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#0ea5e9,#3b82f6)" }}>
            ← Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const tags = article.tags?.length ? article.tags : [{ tag_id: 0, name: "General" }];
  const authorDisplay = article.author_name ?? `Author #${article.author_id}`;

  return (
    <div className="min-h-screen bg-transparent text-[#e2e8f0] flex flex-col">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-[100] bg-[#0f172a]">
        <div
          className="h-full transition-all duration-150"
          style={{ width: `${scrollPct}%`, background: "linear-gradient(90deg,#38bdf8,#818cf8)" }}
        />
      </div>

      <TopNavbar />

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Back link */}
        <Link href="/feed" className="inline-flex items-center gap-1.5 text-xs italic text-[#64748b] hover:text-[#38bdf8] transition-colors mb-8 group">
          <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Feed
        </Link>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(tag => {
            const c = tagColor(tag.name);
            return (
              <span key={tag.tag_id} className="text-xs italic font-semibold px-3 py-1 rounded-full"
                style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                {tag.name}
              </span>
            );
          })}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold italic leading-tight text-[#e2e8f0] mb-5">
          {article.title}
        </h1>

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-[rgba(56,189,248,0.1)] mb-8">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-[#020617]"
              style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)" }}>
              {authorDisplay[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm italic font-semibold text-[#94a3b8]">{authorDisplay}</p>
              {article.is_verified_author && (
                <p className="text-[10px] italic text-[#38bdf8]">✓ Verified Author</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs italic text-[#475569] ml-auto">
            <span>{relativeDate(article.published_at)}</span>
            <span>·</span>
            <span>{readTime(article.content)}</span>
            <span>·</span>
            <span>{article.view_count.toLocaleString()} views</span>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="article-content mb-10">
          {article.content.split("\n\n").map((para, i) => (
            <p key={i} className="mb-5 text-[#94a3b8] leading-[1.85] text-base italic">
              {renderParagraphWithLinks(para)}
            </p>
          ))}
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-6 border-t border-[rgba(56,189,248,0.1)]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 text-sm italic font-semibold rounded-xl border transition-all ${
                isLiked
                  ? "border-rose-400/40 text-rose-400 bg-rose-400/10"
                  : "border-[rgba(56,189,248,0.15)] text-[#64748b] hover:text-[#e2e8f0] hover:border-[rgba(56,189,248,0.3)]"
              }`}
            >
              <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {isLiked ? "Liked" : "Like"}
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 text-sm italic font-semibold rounded-xl border transition-all ${
                isSaved
                  ? "border-[#38bdf8]/40 text-[#38bdf8] bg-[#38bdf8]/10"
                  : "border-[rgba(56,189,248,0.15)] text-[#64748b] hover:text-[#e2e8f0] hover:border-[rgba(56,189,248,0.3)]"
              }`}
            >
              <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>

          {/* Share */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link copied to clipboard!");
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm italic font-semibold rounded-xl border border-[rgba(56,189,248,0.15)] text-[#64748b] hover:text-[#e2e8f0] hover:border-[rgba(56,189,248,0.3)] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>

        {/* Reading progress */}
        {scrollPct > 0 && (
          <div className="mt-6 flex items-center gap-3 text-xs italic text-[#475569]">
            <div className="flex-1 h-1 bg-[#1e293b] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${scrollPct}%`, background: "linear-gradient(90deg,#38bdf8,#818cf8)" }} />
            </div>
            <span>{scrollPct}% read</span>
          </div>
        )}
      </main>

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
