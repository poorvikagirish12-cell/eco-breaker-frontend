"use client";

import { useEffect, useState, useCallback } from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const [role, setRole] = useState<"reader" | "author" | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync role state
  const syncRole = useCallback(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("user-role") as "reader" | "author";
      setRole(savedRole || "reader");
    }
  }, []);

  useEffect(() => {
    syncRole();
    if (typeof window !== "undefined") {
      window.addEventListener("role-change", syncRole);
      return () => window.removeEventListener("role-change", syncRole);
    }
  }, [syncRole]);

  // Load Author's Articles & Tags
  const loadDashboardData = useCallback(async () => {
    try {
      const artRes = await fetch("/api/authors/me/articles");
      if (artRes.ok) {
        const artData = await artRes.json();
        setArticles(artData);
      }

      const tagsRes = await fetch("/api/tags");
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  }, []);

  useEffect(() => {
    if (role === "author") {
      loadDashboardData();
    }
  }, [role, loadDashboardData]);

  // Submit Article (Create Draft)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      // POST new article
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        const newArt = await res.json();
        
        // Link tags sequentially if selected
        for (const tagId of selectedTags) {
          await fetch(`/api/articles/${newArt.article_id}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag_id: tagId }), // Mock endpoint just takes query/params
          });
        }

        setMessage({ type: "success", text: "Draft article created successfully!" });
        setTitle("");
        setContent("");
        setSelectedTags([]);
        loadDashboardData();
      } else {
        setMessage({ type: "error", text: "Failed to create article. Please check input requirements." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Unable to connect to backend server." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish Draft
  const handlePublish = async (articleId: number) => {
    try {
      const res = await fetch(`/api/articles/${articleId}/publish`, {
        method: "PATCH",
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error("Publish error:", err);
    }
  };

  // Unpublish Article
  const handleUnpublish = async (articleId: number) => {
    try {
      const res = await fetch(`/api/articles/${articleId}/unpublish`, {
        method: "PATCH",
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error("Unpublish error:", err);
    }
  };

  // Delete Article
  const handleDelete = async (articleId: number) => {
    if (!confirm("Are you sure you want to permanently delete this article?")) return;

    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });
      if (res.status === 204 || res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleTagSelection = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  if (role === null) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Loading interface context...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30">
      <TopNavbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8">
        {role !== "author" ? (
          <div className="max-w-md mx-auto text-center py-16 px-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <span className="text-4xl">🔒</span>
            <h1 className="text-xl font-bold mt-4 mb-2">Author Verification Required</h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Only verified creators can access the publishing dashboard. Switch your role to **Author** in the navbar to unlock writing operations.
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent mb-3" id="page-title">
                Author Dashboard
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
                Compose articles, assign categories, and publish content to our negative bias distribution network.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Create Form */}
              <div className="lg:col-span-7">
                <Card className="bg-slate-900/50 border-slate-800/80 rounded-2xl p-6">
                  <CardHeader className="px-0 pt-0 pb-5 border-b border-slate-800/60 mb-6">
                    <CardTitle className="text-lg font-bold text-foreground">✍️ Write a Post</CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-1">
                      Draft a new contrarian take. It will be initialized in DRAFT mode until you publish it.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <form onSubmit={handleSubmit} className="space-y-6" id="publish-form">
                      {message && (
                        <div 
                          className={`p-3 rounded-lg text-xs font-semibold ${
                            message.type === "success" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {message.text}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label htmlFor="article-title" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Article Title
                        </label>
                        <Input
                          id="article-title"
                          placeholder="e.g. Why centralization is actually better than web3..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="bg-slate-950 border-slate-800 text-sm h-10 focus:ring-sky-500/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="article-content" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Body Content
                        </label>
                        <Textarea
                          id="article-content"
                          placeholder="Flesh out your contrarian thesis here. Be analytical, back it with reasoning, and challenge popular sentiments."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="bg-slate-950 border-slate-800 text-sm min-h-[220px] focus:ring-sky-500/20 leading-relaxed"
                          required
                        />
                      </div>

                      {/* Tag Multi-select */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                          Assign Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((t) => {
                            const isSelected = selectedTags.includes(t.tag_id);
                            return (
                              <button
                                key={t.tag_id}
                                type="button"
                                onClick={() => toggleTagSelection(t.tag_id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                  isSelected
                                    ? "bg-sky-600 border-sky-500 text-white shadow-md shadow-sky-600/15"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                                }`}
                              >
                                {t.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button 
                          type="submit" 
                          disabled={isSubmitting} 
                          className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold h-10 shadow-md"
                          id="btn-create-article"
                        >
                          {isSubmitting ? "Creating..." : "Save Article Draft"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Dash List */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-foreground mb-1">📚 Your Articles</h2>
                  <p className="text-xs text-slate-400 mb-6">Review, publish, and manage your posts.</p>

                  <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                    {articles.length > 0 ? (
                      articles.map((art) => (
                        <div 
                          key={art.article_id}
                          className="p-4 bg-slate-950 border border-slate-800/60 rounded-xl space-y-3 hover:border-slate-700 transition"
                          id={`author-article-${art.article_id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-200 line-clamp-1">{art.title}</h3>
                            <Badge 
                              variant={art.status === "PUBLISHED" ? "default" : "secondary"}
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 ${
                                art.status === "PUBLISHED" 
                                  ? "bg-emerald-500/10 text-emerald-400 border-none" 
                                  : "bg-amber-500/10 text-amber-400 border-none"
                              }`}
                            >
                              {art.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>👁️ {art.view_count} views</span>
                            <span>{art.created_at ? new Date(art.created_at).toLocaleDateString() : "Draft"}</span>
                          </div>

                          <div className="flex gap-2 pt-1.5 border-t border-slate-900">
                            {art.status === "DRAFT" ? (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handlePublish(art.article_id)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-7 px-3 py-1 flex-grow"
                              >
                                🚀 Publish
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnpublish(art.article_id)}
                                className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 font-semibold text-xs h-7 px-3 py-1 flex-grow"
                              >
                                📥 Unpublish
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(art.article_id)}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-semibold text-xs h-7 px-3 py-1"
                            >
                              ❌ Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic text-center py-6">You haven't written any articles yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
