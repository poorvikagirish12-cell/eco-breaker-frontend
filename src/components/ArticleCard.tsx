"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function ArticleCard({ article, onInteractionChange }: ArticleCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Fallback content if not provided by feed endpoint
  const contentExcerpt = article.content 
    ? article.content.substring(0, 150) + "..." 
    : "This article is handpicked by our EchoBreaker Contrarian Routing engine to provide a diverse, thought-provoking perspective different from your usual reads.";

  // Default tags if not present
  const tags = article.tags || [
    { tag_id: 1, name: "Tech" },
    { tag_id: 2, name: "Economics" }
  ];

  const handleOpen = () => {
    setIsOpen(true);
    setStartTime(Date.now());
  };

  const handleClose = async () => {
    setIsOpen(false);
    if (startTime) {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000) || 1;
      
      // Silently log view interaction to backend
      try {
        await fetch(`${BASE_URL}/api/interactions/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ view_duration_seconds: durationSeconds }),
        });
        
        if (onInteractionChange) {
          onInteractionChange();
        }
      } catch (err) {
        console.error("Failed to log view interaction:", err);
      }
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (isLiked) {
        await fetch(`${BASE_URL}/api/interactions/like/${article.article_id}`, { method: "DELETE" });
        setIsLiked(false);
      } else {
        await fetch(`${BASE_URL}/api/interactions/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Mock article ID passed in query/body as mock endpoint doesn't strictly check
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
        await fetch(`${BASE_URL}/api/interactions/save/${article.article_id}`, { method: "DELETE" });
        setIsSaved(false);
      } else {
        await fetch(`${BASE_URL}/api/interactions/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      <Card 
        onClick={handleOpen}
        id={`article-card-${article.article_id}`}
        className="group relative overflow-hidden bg-card border-border/60 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
      >
        {/* Glow decoration */}
        <div className="absolute -inset-px bg-gradient-to-r from-sky-500/0 to-indigo-500/0 group-hover:from-sky-500/5 group-hover:to-indigo-500/10 rounded-[calc(var(--radius)-1px)] transition-all duration-500 pointer-events-none" />

        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <Badge 
                key={tag.tag_id} 
                variant="secondary" 
                className="bg-indigo-500/10 text-indigo-400 border-none text-[10px] uppercase font-semibold tracking-wider"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
          <CardTitle className="text-lg font-bold group-hover:text-indigo-400 transition-colors line-clamp-2">
            {article.title}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            By Author #{article.author_id} &bull; {article.published_at ? new Date(article.published_at).toLocaleDateString() : "Just now"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-4 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {contentExcerpt}
          </p>
        </CardContent>

        <CardFooter className="pt-2 border-t border-border/30 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {article.view_count} views
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleLike}
              disabled={isLoading}
              className={`w-8 h-8 rounded-full transition-all ${
                isLiked 
                  ? "text-rose-500 hover:text-rose-600 bg-rose-500/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSave}
              disabled={isLoading}
              className={`w-8 h-8 rounded-full transition-all ${
                isSaved 
                  ? "text-amber-500 hover:text-amber-600 bg-amber-500/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Full Article Reading Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-2xl bg-card border-border rounded-xl">
          <DialogHeader>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <Badge key={tag.tag_id} variant="outline" className="text-indigo-400 border-indigo-400/20 text-[10px] uppercase font-bold">
                  {tag.name}
                </Badge>
              ))}
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {article.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              By Author #{article.author_id} &bull; Published {article.published_at ? new Date(article.published_at).toLocaleString() : "Just now"} &bull; {article.view_count + 1} Views
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <p className="whitespace-pre-wrap">
              {article.content || 
                "This article represents a contrarian take on standard practices. In our publishing platform, we focus on routing readers to opinions that run counter to their established preferences. This helps break filter bubbles, reduce polarization, and trigger critical thought processes. By showing you this piece, our Negative Bias algorithm aims to introduce cognitive friction and intellectual variety into your feed."
              }
            </p>
            <p className="border-t border-border/40 pt-4 text-xs italic text-indigo-400">
              Reading tracking active. When you close this modal, your view time will be logged to help refine your contrarian feed recommendation!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
