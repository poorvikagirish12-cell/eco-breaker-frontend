"use client";

import { useState } from "react";
import Link from "next/link";
import { BASE_URL } from "@/lib/api";

interface Tag {
  tag_id: number;
  name: string;
}

interface Article {
  article_id: number;
  title: string;
  content?: string;
  author_id: number;
  author_name?: string;
  is_verified_author?: boolean;
  view_count: number;
  status: string;
  published_at?: string;
  tags?: Tag[];
}

interface ArticleCardProps {
  article: Article;
  onInteractionChange?: () => void;
}

/* Tag colour helper */
function tagClass(name: string) {
  const n = name.toLowerCase();
  if (n.includes("tech") || n.includes("cyber")) return "tag-tech";
  if (n.includes("polit")) return "tag-politics";
  if (n.includes("econ")) return "tag-economics";
  return "tag-default";
}

/* Relative date */
function relativeDate(dateStr?: string) {
  if (!dateStr) return "Unknown date";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return `${diff} days ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return `${Math.floor(diff / 365)} years ago`;
}

/* Read time estimate */
function readTime(content?: string) {
  if (!content) return "1 min read";
  const words = content.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
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

function getCoverImage(tags?: Tag[]): string {
  if (!tags || tags.length === 0) return "/images/tech.png";
  const name = tags[0].name.toLowerCase();
  if (name.includes("tech") || name.includes("ai") || name.includes("cyber") || name.includes("crypto") || name.includes("quantum")) return "/images/tech.png";
  if (name.includes("nature") || name.includes("environment") || name.includes("climate") || name.includes("eco")) return "/images/nature.png";
  if (name.includes("space") || name.includes("astro") || name.includes("cosmos")) return "/images/space.png";
  if (name.includes("science") || name.includes("mind") || name.includes("neuro") || name.includes("psych")) return "/images/science.png";
  if (name.includes("societ") || name.includes("business") || name.includes("econom") || name.includes("politi") || name.includes("financ")) return "/images/society.png";
  if (name.includes("culture") || name.includes("philos") || name.includes("art") || name.includes("histor") || name.includes("ethic")) return "/images/culture.png";
  return "/images/tech.png";
}

export function ArticleCard({ article, onInteractionChange }: ArticleCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const tags = article.tags?.length ? article.tags : [{ tag_id: 0, name: "General" }];
  const primaryTag = tags[0];
  const excerpt = article.content
    ? article.content.slice(0, 140) + (article.content.length > 140 ? "…" : "")
    : "";
  const authorDisplay = article.author_name ?? `User #${article.author_id}`;

  const getHeaders = (): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  const openArticle = () => {
    setIsOpen(true);
    setStartTime(Date.now());
  };

  const closeArticle = async () => {
    setIsOpen(false);
    if (startTime) {
      const secs = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      try {
        await fetch(`${BASE_URL}/api/interactions/view?article_id=${article.article_id}`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ view_duration_seconds: secs }),
        });
        onInteractionChange?.();
      } catch {}
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (isLiked) {
        await fetch(`${BASE_URL}/api/interactions/like/${article.article_id}`, {
          method: "DELETE", headers: getHeaders(),
        });
        setIsLiked(false);
      } else {
        await fetch(`${BASE_URL}/api/interactions/like?article_id=${article.article_id}`, {
          method: "POST", headers: getHeaders(),
        });
        setIsLiked(true);
      }
      onInteractionChange?.();
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (isSaved) {
        await fetch(`${BASE_URL}/api/interactions/save/${article.article_id}`, {
          method: "DELETE", headers: getHeaders(),
        });
        setIsSaved(false);
      } else {
        await fetch(`${BASE_URL}/api/interactions/save?article_id=${article.article_id}`, {
          method: "POST", headers: getHeaders(),
        });
        setIsSaved(true);
      }
      onInteractionChange?.();
    } catch {} finally { setLoading(false); }
  };

  return (
    <>
      {/* ── Card ── */}
      <div
        id={`article-card-${article.article_id}`}
        onClick={openArticle}
        className="group relative flex flex-col bg-[#0f172a] border border-[rgba(56,189,248,0.1)] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-[rgba(56,189,248,0.3)] hover:shadow-[0_8px_32px_rgba(56,189,248,0.08)] hover:-translate-y-0.5"
      >
        {/* Cover image banner */}
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={getCoverImage(article.tags)}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col flex-grow gap-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag.tag_id} className={`text-[10px] font-semibold italic px-2 py-0.5 rounded-full ${tagClass(tag.name)}`}>
                {tag.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-bold italic leading-snug text-[#e2e8f0] group-hover:text-[#38bdf8] transition-colors line-clamp-2">
            {article.title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-sm italic text-[#64748b] line-clamp-3 leading-relaxed flex-grow">
              {excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between pt-2 border-t border-[rgba(56,189,248,0.07)]">
            {/* Author */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-[#020617]"
                style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)" }}>
                {authorDisplay[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="text-xs italic text-[#94a3b8] truncate max-w-[100px]">{authorDisplay}</span>
              {article.is_verified_author && (
                <svg className="w-3.5 h-3.5 text-[#38bdf8] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* Right side: read time + actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[10px] italic text-[#475569]">{readTime(article.content)}</span>
              <button onClick={handleLike} disabled={loading}
                className={`p-1.5 rounded-lg transition-all hover:bg-[#1e293b] ${isLiked ? "text-rose-400" : "text-[#475569] hover:text-[#e2e8f0]"}`}
                title="Like">
                <svg className="w-3.5 h-3.5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
              <button onClick={handleSave} disabled={loading}
                className={`p-1.5 rounded-lg transition-all hover:bg-[#1e293b] ${isSaved ? "text-[#38bdf8]" : "text-[#475569] hover:text-[#e2e8f0]"}`}
                title="Save">
                <svg className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Date + views + read link */}
          <div className="flex items-center justify-between text-[10px] italic text-[#475569]">
            <span>{relativeDate(article.published_at)}</span>
            <div className="flex items-center gap-3">
              <span>{article.view_count.toLocaleString()} views</span>
              <Link
                href={`/article/${article.article_id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[#38bdf8] hover:text-[#7dd3fc] font-semibold transition-colors flex items-center gap-0.5"
              >
                Read →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Article Detail Modal ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)" }}
          onClick={closeArticle}>
          <div
            className="relative w-full max-w-2xl max-h-[85vh] bg-[#0f172a] border border-[rgba(56,189,248,0.2)] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal cover image */}
            <div className="relative h-44 w-full overflow-hidden flex-shrink-0">
              <img
                src={getCoverImage(article.tags)}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/50 to-transparent" />
            </div>

            {/* Modal header */}
            <div className="flex items-start justify-between p-6 border-b border-[rgba(56,189,248,0.1)]">
              <div className="flex-1 pr-4">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map((tag) => (
                    <span key={tag.tag_id} className={`text-[10px] font-semibold italic px-2 py-0.5 rounded-full ${tagClass(tag.name)}`}>
                      {tag.name}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold italic text-[#e2e8f0] leading-snug">{article.title}</h2>
                <div className="flex items-center gap-3 mt-2 text-xs italic text-[#64748b]">
                  <span>By {authorDisplay}</span>
                  {article.is_verified_author && <span className="text-[#38bdf8]">✓ Verified</span>}
                  <span>·</span>
                  <span>{relativeDate(article.published_at)}</span>
                  <span>·</span>
                  <span>{readTime(article.content)}</span>
                </div>
              </div>
              <button onClick={closeArticle}
                className="flex-shrink-0 p-1.5 text-[#475569] hover:text-[#e2e8f0] hover:bg-[#1e293b] rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {article.content ? (
                article.content.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm italic leading-relaxed text-[#94a3b8]">
                    {renderParagraphWithLinks(para)}
                  </p>
                ))
              ) : (
                <p className="text-sm italic leading-relaxed text-[#64748b]">
                  No content available for this article.
                </p>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between p-4 border-t border-[rgba(56,189,248,0.1)] bg-[#020617]/50">
              <span className="text-xs italic text-[#475569]">{article.view_count.toLocaleString()} views</span>
              <div className="flex items-center gap-2">
                <button onClick={handleLike} disabled={loading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs italic rounded-lg border transition-all ${
                    isLiked
                      ? "border-rose-400/40 text-rose-400 bg-rose-400/10"
                      : "border-[rgba(56,189,248,0.15)] text-[#64748b] hover:text-[#e2e8f0] hover:border-[rgba(56,189,248,0.3)]"
                  }`}>
                  ♥ Like
                </button>
                <button onClick={handleSave} disabled={loading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs italic rounded-lg border transition-all ${
                    isSaved
                      ? "border-[#38bdf8]/40 text-[#38bdf8] bg-[#38bdf8]/10"
                      : "border-[rgba(56,189,248,0.15)] text-[#64748b] hover:text-[#e2e8f0] hover:border-[rgba(56,189,248,0.3)]"
                  }`}>
                  🔖 Save
                </button>
                <Link
                  href={`/article/${article.article_id}`}
                  onClick={closeArticle}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs italic rounded-lg border border-[rgba(56,189,248,0.2)] text-[#38bdf8] hover:bg-[rgba(56,189,248,0.08)] transition-all font-semibold"
                >
                  Open Full Article →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
