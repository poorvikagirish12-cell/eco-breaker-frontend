"use client";

import { useEffect, useState, useCallback } from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { ArticleCard } from "@/components/ArticleCard";
import { ChatPanel } from "@/components/ChatPanel";
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

  // Auth helper
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }, []);

  // Load Tags, Preferences & Reading History
  const loadSidebarData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();

      const tagsRes = await fetch(`${BASE_URL}/api/tags`, { headers });
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }

      const prefRes = await fetch(`${BASE_URL}/api/users/me/preferences`, { headers });
      if (prefRes.ok) {
        const prefData = await prefRes.json();
        setPreferences(prefData);
      }

      const histRes = await fetch(`${BASE_URL}/api/users/me/history`, { headers });
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData);
      }
    } catch (err) {
      console.error("Error loading sidebar metadata:", err);
    }
  }, [getAuthHeaders]);

  // Load Feed / Articles
  const loadArticles = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const headers = getAuthHeaders();
      let endpoint = `${BASE_URL}/api/feed`;
      
      if (activeTab === "global") {
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (selectedTag) params.append("tag", selectedTag.toString());
        if (sortBy === "trending") params.append("sort", "trending");
        
        endpoint = `${BASE_URL}/api/articles?${params.toString()}`;
      }

      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data = await res.json();
        
        // Enrich articles with tags if missing
        const enriched = data.map((art: Article) => {
          if (!art.tags) {
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
  }, [activeTab, searchTerm, selectedTag, sortBy, getAuthHeaders]);

  // Sync Navbar search via custom event
  useEffect(() => {
    const handleSearchEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setSearchTerm(customEvent.detail);
      setActiveTab("global"); // Auto switch to archive mode when searching
      setSelectedTag(null);
    };
    window.addEventListener("archive-search", handleSearchEvent);
    return () => window.removeEventListener("archive-search", handleSearchEvent);
  }, []);

  // Listen to profile interaction changes or resets
  useEffect(() => {
    loadArticles();
    loadSidebarData();
  }, [loadArticles, loadSidebarData]);

  // Listen to role changes
  useEffect(() => {
    const handleRoleChange = () => {
      loadArticles();
      loadSidebarData();
    };
    window.addEventListener("role-change", handleRoleChange);
    return () => window.removeEventListener("role-change", handleRoleChange);
  }, [loadArticles, loadSidebarData]);

  // Reset Preferences Handler
  const handleResetPreferences = async () => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${BASE_URL}/api/users/me/preferences`, { method: "DELETE", headers });
      await fetch(`${BASE_URL}/api/users/me/history`, { method: "DELETE", headers });
      loadArticles();
      loadSidebarData();
    } catch (err) {
      console.error("Failed to reset preferences:", err);
    }
  };

  const handleInteractionChange = () => {
    loadSidebarData();
  };

  // Helper to map DB tags to Mockup filter selections
  const getTagIdByName = (name: string) => {
    const found = tags.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
    return found ? found.tag_id : null;
  };

  const tagTechId = getTagIdByName("Tech");
  const tagPoliticsId = getTagIdByName("Politics");
  const tagEconomicsId = getTagIdByName("Economics");

  return (
    <div className="min-h-screen bg-[#070d0b] text-[#c9d1c9] flex flex-col relative overflow-hidden">
      {/* 3D perspective grid background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #03e38c 1px, transparent 1px),
            linear-gradient(to bottom, #03e38c 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: "perspective(800px) rotateX(65deg) translateY(-200px) translateZ(-80px)",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 80%)",
          transformOrigin: "top center",
          height: "150%"
        }}
      />

      <TopNavbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-10 relative z-10">
        {/* Core Feed Title */}
        <div className="mb-10 text-left border-b border-[rgba(3,227,140,0.1)] pb-6">
          <h1 className="text-3xl font-extrabold tracking-wider text-[#c9d1c9] mb-3 uppercase terminal-font" id="page-title">
            Core Feed / Signals
          </h1>
          <p className="text-[#708078] text-xs max-w-3xl leading-relaxed terminal-font">
            Incoming data streams from the ecological fracture zones. Real-time monitoring and synthesis. surfs opposing views to dissolve polarization networks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Feed Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Cyber Terminal Mode Selectors */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[rgba(3,227,140,0.1)] pb-4 mb-6 terminal-font text-xs">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setActiveTab("personalized");
                    setSelectedTag(null);
                  }}
                  id="tab-personalized"
                  className={`px-3 py-1.5 border rounded-sm transition-all uppercase ${
                    activeTab === "personalized"
                      ? "bg-[#03e38c]/10 border-[#03e38c] text-[#03e38c] shadow-[0_0_10px_rgba(3,227,140,0.2)]"
                      : "border-transparent text-[#708078] hover:text-[#c9d1c9]"
                  }`}
                >
                  [ MODE: SIGNAL DEVIATION ]
                </button>
                <button 
                  onClick={() => {
                    setActiveTab("global");
                    setSelectedTag(null);
                  }}
                  id="tab-global"
                  className={`px-3 py-1.5 border rounded-sm transition-all uppercase ${
                    activeTab === "global"
                      ? "bg-[#00e5ff]/10 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                      : "border-transparent text-[#708078] hover:text-[#c9d1c9]"
                  }`}
                >
                  [ MODE: CENTRAL ARCHIVE ]
                </button>
              </div>

              {/* Sorting & Search Controls */}
              {activeTab === "global" && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "newest" | "trending")}
                    className="bg-[#09100d] border border-[rgba(3,227,140,0.15)] text-[10px] h-8 rounded-sm px-2 text-[#c9d1c9] focus:outline-none focus:border-[#03e38c]"
                    id="select-sort"
                  >
                    <option value="newest">LATEST_LOGS</option>
                    <option value="trending">HIGH_FLOW</option>
                  </select>
                </div>
              )}
            </div>

            {/* Category Tags Layout (Mockup buttons) */}
            {activeTab === "global" && (
              <div className="flex flex-wrap gap-3 mb-6 terminal-font text-xs">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-4 py-2 border rounded-sm transition-all uppercase ${
                    selectedTag === null
                      ? "bg-[#c9d1c9]/10 border-[#c9d1c9] text-[#c9d1c9]"
                      : "border-[rgba(3,227,140,0.15)] text-[#708078] hover:text-[#c9d1c9]"
                  }`}
                >
                  ALL SIGNALS
                </button>
                <button
                  onClick={() => tagTechId && setSelectedTag(tagTechId)}
                  className={`px-4 py-2 border rounded-sm transition-all uppercase ${
                    selectedTag === tagTechId
                      ? "bg-[rgba(255,0,127,0.15)] border-[#ff007f] text-[#ff007f]"
                      : "border-[#ff007f]/30 text-[#ff007f]/70 hover:border-[#ff007f] hover:text-[#ff007f]"
                  }`}
                >
                  ANOMALY
                </button>
                <button
                  onClick={() => tagPoliticsId && setSelectedTag(tagPoliticsId)}
                  className={`px-4 py-2 border rounded-sm transition-all uppercase ${
                    selectedTag === tagPoliticsId
                      ? "bg-[rgba(0,229,255,0.15)] border-[#00e5ff] text-[#00e5ff]"
                      : "border-[#00e5ff]/30 text-[#00e5ff]/70 hover:border-[#00e5ff] hover:text-[#00e5ff]"
                  }`}
                >
                  BIOMETRICS
                </button>
                <button
                  onClick={() => tagEconomicsId && setSelectedTag(tagEconomicsId)}
                  className={`px-4 py-2 border rounded-sm transition-all uppercase ${
                    selectedTag === tagEconomicsId
                      ? "bg-[rgba(3,227,140,0.15)] border-[#03e38c] text-[#03e38c]"
                      : "border-[#03e38c]/30 text-[#03e38c]/70 hover:border-[#03e38c] hover:text-[#03e38c]"
                  }`}
                >
                  SYNTHETICS
                </button>
              </div>
            )}

            {/* Articles List */}
            {activeTab === "personalized" && (
              <div className="bg-[rgba(3,227,140,0.02)] border border-[rgba(3,227,140,0.15)] rounded-sm p-4 mb-6 flex items-start gap-3 terminal-font text-xs">
                <div className="p-1.5 bg-[#03e38c]/10 text-[#03e38c] rounded-sm">⚖️</div>
                <div>
                  <h3 className="font-bold text-[#03e38c] uppercase tracking-wider">NEGATIVE BIAS ROUTING: ACTIVE</h3>
                  <p className="text-[#708078] mt-0.5 leading-relaxed">
                    Surfacing node files containing topics OPPOSITE to your leading affinity values. Destabilizing confirmation loops.
                  </p>
                </div>
              </div>
            )}

            {isRefreshing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 bg-[#0b120f] rounded-sm border border-[rgba(3,227,140,0.1)] animate-pulse" />
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
              <div className="text-center py-16 bg-[#0b120f] border border-dashed border-[rgba(3,227,140,0.15)] rounded-sm terminal-font">
                <p className="text-[#708078] text-xs">NO DECODED SIGNALS DETECTED IN ACTIVE CHANNEL.</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Preference Engine (Track B) */}
            <div id="preferences" className="bg-[#0b120f] border border-[rgba(3,227,140,0.15)] rounded-sm p-5 terminal-font text-xs">
              <h2 className="text-sm font-bold text-[#03e38c] mb-4 uppercase tracking-wider flex items-center gap-2">
                ⚙️ Preference Engine (Track B)
              </h2>

              {/* Tag Affinity Gauge bars */}
              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-[#708078] uppercase tracking-widest mb-3 border-b border-[rgba(3,227,140,0.1)] pb-1">Tag Affinity Matrix</h3>
                {preferences.length > 0 ? (
                  <div className="space-y-3.5">
                    {preferences.map((p) => {
                      const maxScore = Math.max(...preferences.map((pref) => pref.affinity_score), 1);
                      const widthPercent = Math.min((p.affinity_score / maxScore) * 100, 100);
                      
                      return (
                        <div key={p.name} className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                            <span>{p.name}</span>
                            <span className="text-[#00e5ff]">{p.affinity_score} pts</span>
                          </div>
                          <div className="w-full bg-[#070d0b] border border-[rgba(3,227,140,0.15)] h-2 rounded-sm overflow-hidden p-0.5">
                            <div 
                              className="bg-[#03e38c] h-full rounded-sm transition-all duration-500 shadow-[0_0_8px_rgba(3,227,140,0.5)]" 
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[#4d5e56] italic">No telemetry data recorded.</p>
                )}
              </div>

              {/* History Console Logs */}
              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-[#708078] uppercase tracking-widest mb-3 border-b border-[rgba(3,227,140,0.1)] pb-1">Transmission Logs</h3>
                {history.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {history.map((h, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] border-b border-[rgba(3,227,140,0.05)] pb-1.5">
                        <span className="truncate text-[#c9d1c9] max-w-[170px] uppercase">
                          {h.title}
                        </span>
                        <span className="text-[#4d5e56] shrink-0 font-semibold">{h.view_duration_seconds}s</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#4d5e56] italic">Logs stream empty.</p>
                )}
              </div>

              {/* Reset Controls */}
              <button 
                onClick={handleResetPreferences} 
                className="w-full h-8 border border-[#ff007f] text-[#ff007f] hover:bg-[#ff007f]/10 text-xs font-bold uppercase transition-all rounded-sm flex items-center justify-center gap-1.5"
                id="btn-reset-preferences"
              >
                🔄 Reset Engine
              </button>
            </div>

            {/* Conversational Assistant */}
            <div>
              <ChatPanel />
            </div>
          </div>
        </div>
      </main>

      {/* Cyberpunk Monospace Footer */}
      <footer className="mt-auto border-t border-[rgba(3,227,140,0.1)] bg-[#09100d]/30 py-5 terminal-font text-[10px] text-[#4d5e56]">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 uppercase">
          <div className="font-extrabold tracking-widest text-[#03e38c]/80">
            Eco Breaker
          </div>
          <div className="flex gap-6 tracking-widest">
            <span className="cursor-pointer hover:text-[#03e38c]">Terminal</span>
            <span className="cursor-pointer hover:text-[#00e5ff]">Modes</span>
            <span className="cursor-pointer hover:text-[#ff007f]">Core</span>
          </div>
          <div>
            © 2026 Eco Breaker Archive. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
