"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  view_count: number;
  status: string;
  published_at?: string;
  tags?: Tag[];
}

interface ArticleCardProps {
  article: Article;
  onInteractionChange?: () => void;
}

// Custom botanical tech leaf SVG
const BotanicalSVG = () => (
  <svg className="w-full h-28 text-[#03e38c] opacity-35 group-hover:opacity-55 transition-opacity" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 10 V90" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    <path d="M100 25 C130 20, 140 40, 100 60" stroke="currentColor" strokeWidth="1.5" />
    <path d="M100 45 C70 40, 60 60, 100 75" stroke="currentColor" strokeWidth="1.5" />
    <path d="M100 25 L125 15" stroke="currentColor" strokeWidth="1" />
    <path d="M100 45 L75 35" stroke="currentColor" strokeWidth="1" />
    <path d="M100 60 L130 52" stroke="currentColor" strokeWidth="1" />
    <path d="M100 70 L70 65" stroke="currentColor" strokeWidth="1" />
    <circle cx="125" cy="15" r="2.5" fill="currentColor" />
    <circle cx="75" cy="35" r="2.5" fill="currentColor" />
    <circle cx="130" cy="52" r="2.5" fill="currentColor" />
    <circle cx="70" cy="65" r="2.5" fill="currentColor" />
  </svg>
);

// Custom critical fracture SVG
const FractureSVG = () => (
  <svg className="w-full h-28 text-[#ff007f] opacity-35 group-hover:opacity-55 transition-opacity" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 20 L80 50 L110 30 L180 80" stroke="currentColor" strokeWidth="1.5" />
    <path d="M80 50 L90 85 L140 60 L180 80" stroke="currentColor" strokeWidth="1" />
    <path d="M50 70 L80 50" stroke="currentColor" strokeWidth="1" />
    <circle cx="20" cy="20" r="3" fill="currentColor" />
    <circle cx="80" cy="50" r="4.5" fill="currentColor" className="animate-pulse" />
    <circle cx="80" cy="50" r="2.5" fill="currentColor" />
    <circle cx="110" cy="30" r="3" fill="currentColor" />
    <circle cx="180" cy="80" r="3" fill="currentColor" />
    <circle cx="90" cy="85" r="2" fill="currentColor" />
    <circle cx="140" cy="60" r="3" fill="currentColor" />
    <circle cx="50" cy="70" r="2" fill="currentColor" />
  </svg>
);

// Custom data grid wireframe SVG
const GridSVG = () => (
  <svg className="w-full h-28 text-[#00e5ff] opacity-25 group-hover:opacity-45 transition-opacity" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 90 L100 10 L190 90" stroke="currentColor" strokeWidth="1" />
    <path d="M40 90 L100 10 L160 90" stroke="currentColor" strokeWidth="1" />
    <path d="M70 90 L100 10 L130 90" stroke="currentColor" strokeWidth="1" />
    <path d="M100 90 L100 10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M70 30 H130" stroke="currentColor" strokeWidth="1" />
    <path d="M55 50 H145" stroke="currentColor" strokeWidth="1" />
    <path d="M35 70 H165" stroke="currentColor" strokeWidth="1" />
    <path d="M10 90 H190" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export function ArticleCard({ article, onInteractionChange }: ArticleCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    const rotateX = -(y - yc) / 15;
    const rotateY = (x - xc) / 15;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`,
      transition: "transform 0.05s ease"
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.4s ease"
    });
  };

  // Content fallback excerpt
  const contentExcerpt = article.content 
    ? article.content.substring(0, 120) + "..." 
    : "Biometric and environmental anomalies detected in localized synthesis fractures. Real-time logging sequence initiated.";

  // Safe tag selection
  const tags = article.tags || [
    { tag_id: 1, name: "Synthesis" }
  ];

  // Helper to categorize tag colors and wireframe layouts
  const getCategoryTheme = (tagName: string) => {
    const name = tagName.toLowerCase();
    if (name.includes("anomaly") || name.includes("critical") || name.includes("breach") || name.includes("fail") || name.includes("politics")) {
      return {
        badgeText: "CRITICAL",
        badgeStyle: "bg-[rgba(255,0,127,0.1)] text-[#ff007f] border-[#ff007f]",
        borderStyle: "border-[#ff007f]/30 hover:border-[#ff007f]/70",
        shadowStyle: "hover:shadow-[0_0_15px_rgba(255,0,127,0.15)]",
        graphic: <FractureSVG />
      };
    }
    if (name.includes("biometrics") || name.includes("tech") || name.includes("cyber")) {
      return {
        badgeText: "BIOMETRIC",
        badgeStyle: "bg-[rgba(0,229,255,0.1)] text-[#00e5ff] border-[#00e5ff]",
        borderStyle: "border-[#00e5ff]/30 hover:border-[#00e5ff]/70",
        shadowStyle: "hover:shadow-[0_0_15px_rgba(0,229,255,0.15)]",
        graphic: <GridSVG />
      };
    }
    return {
      badgeText: "SYNTHESIS",
      badgeStyle: "bg-[rgba(3,227,140,0.1)] text-[#03e38c] border-[#03e38c]",
      borderStyle: "border-[rgba(3,227,140,0.2)] hover:border-[#03e38c]/70",
      shadowStyle: "hover:shadow-[0_0_15px_rgba(3,227,140,0.15)]",
      graphic: <BotanicalSVG />
    };
  };

  const primaryTagName = tags[0]?.name || "Synthesis";
  const theme = getCategoryTheme(primaryTagName);

  // Dynamic sci-fi T-MINUS countdown age
  const formatCountdown = (dateString?: string) => {
    if (!dateString) return "T-MINUS 24D";
    const date = new Date(dateString);
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `T-MINUS ${diffDays}D`;
  };

  // Auth helper
  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const handleOpen = () => {
    setIsOpen(true);
    setStartTime(Date.now());
  };

  const handleClose = async () => {
    setIsOpen(false);
    if (startTime) {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000) || 1;
      try {
        await fetch(`${BASE_URL}/api/interactions/view?article_id=${article.article_id}`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ view_duration_seconds: durationSeconds }),
        });
        if (onInteractionChange) onInteractionChange();
      } catch (err) {
        console.error("View log error:", err);
      }
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (isLiked) {
        await fetch(`${BASE_URL}/api/interactions/like/${article.article_id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        setIsLiked(false);
      } else {
        await fetch(`${BASE_URL}/api/interactions/like?article_id=${article.article_id}`, {
          method: "POST",
          headers: getAuthHeaders()
        });
        setIsLiked(true);
      }
      if (onInteractionChange) onInteractionChange();
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (isSaved) {
        await fetch(`${BASE_URL}/api/interactions/save/${article.article_id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        setIsSaved(false);
      } else {
        await fetch(`${BASE_URL}/api/interactions/save?article_id=${article.article_id}`, {
          method: "POST",
          headers: getAuthHeaders()
        });
        setIsSaved(true);
      }
      if (onInteractionChange) onInteractionChange();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        onClick={handleOpen}
        id={`article-card-${article.article_id}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={tiltStyle}
        className={`group relative overflow-hidden bg-[#0c120f] border rounded-sm cursor-pointer flex flex-col justify-between transition-all duration-300 ${theme.borderStyle} ${theme.shadowStyle}`}
      >
        {/* Glow decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#070d0b]/80 pointer-events-none z-10" />

        {/* Top Graphic Panel */}
        <div className="relative w-full h-32 bg-[#09100d] border-b border-[rgba(3,227,140,0.1)] flex items-center justify-center overflow-hidden">
          {theme.graphic}
          
          {/* Category Badge */}
          <span className={`absolute top-3 left-3 text-[9px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-widest terminal-font z-20 ${theme.badgeStyle}`}>
            {theme.badgeText}
          </span>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-grow relative z-20 space-y-2">
          <h3 className="text-base font-bold text-[#c9d1c9] group-hover:text-[#03e38c] transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-xs text-[#708078] line-clamp-3 leading-relaxed">
            {contentExcerpt}
          </p>
          <div className="flex items-center justify-between pt-1 text-[10px] text-[#4d5e56] terminal-font">
            <span>SEC_ID: 0{article.author_id}</span>
            <span>VIEWS: {article.view_count}</span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="p-3 border-t border-[rgba(3,227,140,0.1)] bg-[#09100d]/50 flex items-center justify-between relative z-20 terminal-font">
          <span className="text-[10px] text-[#708078] font-bold tracking-wider flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#03e38c]/70" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatCountdown(article.published_at)}
          </span>

          <div className="flex items-center gap-2">
            {/* Quick Interactions */}
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`p-1.5 rounded transition-all hover:bg-slate-900 ${
                isLiked ? "text-[#ff007f]" : "text-[#4d5e56] hover:text-[#c9d1c9]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`p-1.5 rounded transition-all hover:bg-slate-900 ${
                isSaved ? "text-[#00e5ff]" : "text-[#4d5e56] hover:text-[#c9d1c9]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </button>

            {/* Mockup DECRYPT button */}
            <span className="text-[10px] font-bold text-[#ff007f] tracking-widest uppercase hover:underline ml-1 pl-2 border-l border-[rgba(3,227,140,0.15)]">
              DECRYPT +
            </span>
          </div>
        </div>
      </div>

      {/* Detail Dialog Popup */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-2xl bg-[#0b120f] border border-[rgba(3,227,140,0.25)] text-[#c9d1c9] rounded-sm terminal-font">
          <DialogHeader>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <Badge key={tag.tag_id} variant="outline" className="border-[rgba(3,227,140,0.25)] text-[#03e38c] bg-[#070d0b] text-[9px] uppercase font-bold tracking-widest rounded-sm">
                  {tag.name}
                </Badge>
              ))}
            </div>
            <DialogTitle className="text-xl font-bold text-[#c9d1c9] tracking-tight">
              {article.title}
            </DialogTitle>
            <div className="text-[10px] text-[#708078] pt-1 border-b border-[rgba(3,227,140,0.1)] pb-2 flex justify-between">
              <span>DESIGNATION: SIG-0{article.article_id}</span>
              <span>AUTHOR_REF: SEC-0{article.author_id}</span>
              <span>DATE_METRIC: {article.published_at ? new Date(article.published_at).toLocaleString() : "ACTIVE RECORD"}</span>
            </div>
          </DialogHeader>
          <div className="mt-4 text-xs leading-relaxed text-[#c9d1c9] space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <p className="whitespace-pre-wrap select-text selection:bg-[#03e38c]/20">
              {article.content || 
                "No signal feed transcript decoded. The transmission source might have fragmented. Synthesizing secondary telemetry metrics..."
              }
            </p>
            <div className="border-t border-[rgba(3,227,140,0.1)] pt-3 text-[10px] italic text-[#03e38c]">
              {">>> TELEMETRY MONITORING ACTIVE. READING INTERVAL IS RECORDED UPON CONSOLE CLOSE."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
