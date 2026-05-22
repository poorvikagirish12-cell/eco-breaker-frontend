"use client";

import { useEffect, useState, useCallback } from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { ArticleCard } from "@/components/ArticleCard";
import { ChatPanel } from "@/components/ChatPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface TagAffinity {
  name: string;
  affinity_score: number;
}

interface HistoryItem {
  article_id: number;
  title: string;
  viewed_at: string;
  view_duration_seconds: number;
}

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [preferences, setPreferences] = useState<TagAffinity[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Search & Filter State
  const [activeTab, setActiveTab] = useState<"personalized" | "global">("personalized");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "trending">("newest");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load Tags, Preferences & Reading History
  const loadSidebarData = useCallback(async () => {
    try {
      const tagsRes = await fetch(`${BASE_URL}/api/tags`);
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }

      const prefRes = await fetch(`${BASE_URL}/api/users/me/preferences`);
      if (prefRes.ok) {
        const prefData = await prefRes.json();
        setPreferences(prefData);
      }

      const histRes = await fetch(`${BASE_URL}/api/users/me/history`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData);
      }
    } catch (err) {
      console.error("Error loading sidebar metadata:", err);
    }
  }, []);

  // Load Feed / Articles
  const loadArticles = useCallback(async () => {
    setIsRefreshing(true);
    try {
      let endpoint = `${BASE_URL}/api/feed`;
      
      if (activeTab === "global") {
        // Construct query parameters for global filtering
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (selectedTag) params.append("tag", selectedTag.toString());
        if (sortBy === "trending") params.append("sort", "trending");
        
        endpoint = `${BASE_URL}/api/articles?${params.toString()}`;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        
        // Enrich mock data with tags if missing
        const enriched = data.map((art: Article) => {
          if (!art.tags) {
            // Give articles deterministic mock tags
            const artTags = [];
            if (art.article_id % 2 === 0) artTags.push({ tag_id: 1, name: "Tech" });
            if (art.article_id % 3 === 0 || art.article_id === 1) artTags.push({ tag_id: 2, name: "Politics" });
            if (artTags.length === 0) artTags.push({ tag_id: 3, name: "Economics" });
            return { ...art, tags: artTags };
          }
          return art;
        });

        setArticles(enriched);
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeTab, searchTerm, selectedTag, sortBy]);

  // Load everything on mount and tab changes
  useEffect(() => {
    loadArticles();
    loadSidebarData();
  }, [loadArticles, loadSidebarData]);

  // Reset Preferences Handler
  const handleResetPreferences = async () => {
    try {
      await fetch(`${BASE_URL}/api/users/me/preferences`, { method: "DELETE" });
      await fetch(`${BASE_URL}/api/users/me/history`, { method: "DELETE" });
      loadArticles();
      loadSidebarData();
    } catch (err) {
      console.error("Failed to reset preferences:", err);
    }
  };

  // Triggered when an ArticleCard registers a silent view/like/save interaction
  const handleInteractionChange = () => {
    loadSidebarData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <TopNavbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-3" id="page-title">
            Contrarian Feed
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            Welcome to the EchoBreaker reading model. We disrupt confirmation bias by surfacing perspectives that challenge your established affinity patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Middle: Articles Feed */}
          <div className="lg:col-span-8 space-y-6">
            <Tabs 
              defaultValue="personalized" 
              value={activeTab} 
              onValueChange={(val) => {
                setActiveTab(val as "personalized" | "global");
                setSelectedTag(null);
              }}
              className="w-full"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
                <TabsList className="bg-slate-900 border border-slate-800/80 p-1 rounded-lg">
                  <TabsTrigger 
                    value="personalized" 
                    id="tab-personalized"
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-medium text-xs sm:text-sm transition-all"
                  >
                    💡 Contrarian Feed
                  </TabsTrigger>
                  <TabsTrigger 
                    value="global" 
                    id="tab-global"
                    className="data-[state=active]:bg-sky-600 data-[state=active]:text-white font-medium text-xs sm:text-sm transition-all"
                  >
                    🌐 Global Library
                  </TabsTrigger>
                </TabsList>

                {/* Filters (Only show for Global Library) */}
                {activeTab === "global" && (
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <Input
                      placeholder="Search title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-900 border-slate-800 h-9 text-xs sm:text-sm w-full sm:w-44 focus:ring-sky-500/20"
                      id="input-search"
                    />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "newest" | "trending")}
                      className="bg-slate-900 border border-slate-800 text-xs sm:text-sm h-9 rounded-md px-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      id="select-sort"
                    >
                      <option value="newest">Newest</option>
                      <option value="trending">Trending</option>
                    </select>
                  </div>
                )}
              </div>

              <TabsContent value="personalized" className="mt-0 outline-none">
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 text-lg">⚖️</div>
                  <div>
                    <h3 className="font-semibold text-sm text-indigo-300">Negative Bias Active</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      SURFACING content with tags OPPOSITE to your top interest tags to prevent cognitive polarization.
                    </p>
                  </div>
                </div>

                {isRefreshing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-44 bg-slate-900/60 rounded-xl border border-slate-800/40 animate-pulse" />
                    ))}
                  </div>
                ) : articles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {articles.map((article) => (
                      <ArticleCard 
                        key={article.article_id} 
                        article={article} 
                        onInteractionChange={handleInteractionChange}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                    <p className="text-slate-500 text-sm">No articles available in your personalized feed.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="global" className="mt-0 outline-none">
                {/* Tag badges row */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <Button
                    size="sm"
                    variant={selectedTag === null ? "default" : "outline"}
                    onClick={() => setSelectedTag(null)}
                    className="text-xs h-7 rounded-full"
                  >
                    All Tags
                  </Button>
                  {tags.map((t) => (
                    <Button
                      key={t.tag_id}
                      size="sm"
                      variant={selectedTag === t.tag_id ? "default" : "outline"}
                      onClick={() => setSelectedTag(t.tag_id)}
                      className={`text-xs h-7 rounded-full transition-all ${
                        selectedTag === t.tag_id 
                          ? "bg-sky-600 hover:bg-sky-500 text-white" 
                          : "border-slate-800 text-slate-400 hover:bg-slate-950"
                      }`}
                    >
                      {t.name}
                    </Button>
                  ))}
                </div>

                {isRefreshing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-44 bg-slate-900/60 rounded-xl border border-slate-800/40 animate-pulse" />
                    ))}
                  </div>
                ) : articles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {articles.map((article) => (
                      <ArticleCard 
                        key={article.article_id} 
                        article={article} 
                        onInteractionChange={handleInteractionChange}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                    <p className="text-slate-500 text-sm">No articles found matching filters.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar: Preferences, Logs, Chat Assistant */}
          <div className="lg:col-span-4 space-y-6">
            {/* Preferences Dashboard */}
            <div id="preferences" className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                📊 Preference Engine (Track B)
              </h2>

              {/* Tag Affinity list */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tag Affinity Scores</h3>
                {preferences.length > 0 ? (
                  <div className="space-y-3">
                    {preferences.map((p) => {
                      const maxScore = Math.max(...preferences.map((pref) => pref.affinity_score), 1);
                      const widthPercent = Math.min((p.affinity_score / maxScore) * 100, 100);
                      
                      return (
                        <div key={p.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>{p.name}</span>
                            <span className="text-indigo-400">{p.affinity_score} pts</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No interest data compiled yet.</p>
                )}
              </div>

              {/* History list */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Reading History</h3>
                {history.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {history.map((h, i) => (
                      <div key={i} className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-1.5">
                        <span className="truncate text-slate-300 font-medium max-w-[170px]">{h.title}</span>
                        <span className="text-[10px] text-slate-500">{h.view_duration_seconds}s</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Reading logs empty.</p>
                )}
              </div>

              {/* Reset Controls */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleResetPreferences} 
                  variant="outline" 
                  size="sm"
                  className="w-full border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 font-semibold"
                  id="btn-reset-preferences"
                >
                  🔄 Reset Engine
                </Button>
              </div>
            </div>

            {/* Conversational Assistant */}
            <div>
              <ChatPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
