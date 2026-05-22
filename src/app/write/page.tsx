"use client";

import { useEffect, useState, useCallback } from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  // Load user's articles and available tags
  const loadData = useCallback(async () => {
    try {
      const [artRes, tagsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/authors/me/articles`),
        fetch(`${BASE_URL}/api/tags`),
      ]);

      if (artRes.ok) setArticles(await artRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit new blog post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`${BASE_URL}/api/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        const newArt = await res.json();

        // Assign tags
        for (const tagId of selectedTags) {
          await fetch(`${BASE_URL}/api/articles/${newArt.article_id}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag_id: tagId }),
          });
        }

        setMessage({ type: "success", text: "🎉 Blog post created! It's saved as a draft — click Publish to go live." });
        setTitle("");
        setContent("");
        setSelectedTags([]);
        loadData();
      } else {
        setMessage({ type: "error", text: "Failed to create post. Please try again." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Cannot connect to server. Make sure the backend is running." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (articleId: number) => {
    try {
      await fetch(`${BASE_URL}/api/articles/${articleId}/publish`, { method: "PATCH" });
      loadData();
    } catch (err) {
      console.error("Publish error:", err);
    }
  };

  const handleUnpublish = async (articleId: number) => {
    try {
      await fetch(`${BASE_URL}/api/articles/${articleId}/unpublish`, { method: "PATCH" });
      loadData();
    } catch (err) {
      console.error("Unpublish error:", err);
    }
  };

  const handleDelete = async (articleId: number) => {
    if (!confirm("Permanently delete this post?")) return;
    try {
      await fetch(`${BASE_URL}/api/articles/${articleId}`, { method: "DELETE" });
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30">
      <TopNavbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8">

        {/* Page Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent mb-3" id="page-title">
            Post a Blog
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            Share your contrarian take with the EchoBreaker community. Write something that challenges the status quo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Create Form */}
          <div className="lg:col-span-7">
            <Card className="bg-slate-900/50 border-slate-800/80 rounded-2xl">
              <CardHeader className="border-b border-slate-800/60 pb-5">
                <CardTitle className="text-lg font-bold">✍️ Write Your Post</CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-1">
                  Your post will be saved as a <strong>Draft</strong>. You can publish it immediately after.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6" id="blog-post-form">

                  {/* Success / Error message */}
                  {message && (
                    <div className={`p-3.5 rounded-xl text-sm font-medium ${
                      message.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {message.text}
                    </div>
                  )}

                  {/* Title */}
                  <div className="space-y-2">
                    <label htmlFor="post-title" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Blog Title *
                    </label>
                    <Input
                      id="post-title"
                      placeholder="e.g. Why remote work is actually less productive..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-sm h-11 focus:ring-sky-500/30 focus:border-sky-500/50 placeholder:text-slate-600"
                      required
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <label htmlFor="post-content" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Blog Content *
                    </label>
                    <Textarea
                      id="post-content"
                      placeholder="Write your blog post here. Be detailed, analytical, and challenge popular thinking..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-sm min-h-[260px] focus:ring-sky-500/30 focus:border-sky-500/50 leading-relaxed placeholder:text-slate-600"
                      required
                    />
                    <p className="text-[11px] text-slate-500 text-right">{content.length} characters</p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Select Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tags.length > 0 ? tags.map((t) => {
                        const isSelected = selectedTags.includes(t.tag_id);
                        return (
                          <button
                            key={t.tag_id}
                            type="button"
                            onClick={() => toggleTag(t.tag_id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              isSelected
                                ? "bg-sky-600 border-sky-500 text-white shadow-md shadow-sky-600/20"
                                : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                            }`}
                          >
                            {isSelected ? "✓ " : ""}{t.name}
                          </button>
                        );
                      }) : (
                        <span className="text-xs text-slate-500 italic">Loading tags...</span>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim() || !content.trim()}
                    id="btn-submit-post"
                    className="w-full h-11 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {isSubmitting ? "Saving Post..." : "💾 Save Blog Post as Draft"}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right: My Posts */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-1">📚 My Blog Posts</h2>
              <p className="text-xs text-slate-400 mb-6">Manage your drafts and published posts.</p>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {articles.length > 0 ? (
                  articles.map((art) => (
                    <div
                      key={art.article_id}
                      id={`post-${art.article_id}`}
                      className="p-4 bg-slate-950 border border-slate-800/60 rounded-xl space-y-3 hover:border-slate-700/80 transition-all"
                    >
                      {/* Title + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-200 line-clamp-2 flex-grow">{art.title}</h3>
                        <Badge className={`text-[9px] shrink-0 uppercase font-bold px-2 py-0.5 rounded-full ${
                          art.status === "PUBLISHED"
                            ? "bg-emerald-500/10 text-emerald-400 border-none"
                            : "bg-amber-500/10 text-amber-400 border-none"
                        }`}>
                          {art.status === "PUBLISHED" ? "🟢 Live" : "🟡 Draft"}
                        </Badge>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-[11px] text-slate-500">
                        <span>👁 {art.view_count} views</span>
                        <span>{art.published_at
                          ? `Published ${new Date(art.published_at).toLocaleDateString()}`
                          : art.created_at
                          ? `Created ${new Date(art.created_at).toLocaleDateString()}`
                          : "Just created"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-slate-900">
                        {art.status === "DRAFT" ? (
                          <button
                            onClick={() => handlePublish(art.article_id)}
                            className="flex-grow h-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all"
                          >
                            🚀 Publish Now
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnpublish(art.article_id)}
                            className="flex-grow h-8 border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 font-semibold text-xs rounded-lg transition-all"
                          >
                            📥 Revert to Draft
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(art.article_id)}
                          className="h-8 px-3 text-rose-400 hover:bg-rose-500/10 font-semibold text-xs rounded-lg transition-all"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-3xl mb-2">📝</p>
                    <p className="text-sm text-slate-500 font-medium">No posts yet</p>
                    <p className="text-xs text-slate-600 mt-1">Write your first blog post using the form!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
