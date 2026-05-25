"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopNavbar } from "@/components/TopNavbar";
import { BASE_URL } from "@/lib/api";

interface User {
  user_id: number;
  username: string;
  email: string;
  is_verified_author: boolean;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
}

interface StatsReport {
  user_count: number;
  article_count: number;
  total_views: number;
}

interface TopArticle {
  article_id: number;
  title: string;
  author_id: number;
  author_name?: string;
  view_count: number;
  published_at?: string;
}

interface TopTag {
  name: string;
  usage_count: number;
}

type AdminTab = "overview" | "users" | "articles" | "tags";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<StatsReport | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [topArticles, setTopArticles] = useState<TopArticle[]>([]);
  const [topTags, setTopTags] = useState<TopTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const getHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
    return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const h = getHeaders();
    try {
      const [uc, ac, tv, ta, tg, us] = await Promise.all([
        fetch(`${BASE_URL}/api/admin/reports/user-count`, { headers: h }),
        fetch(`${BASE_URL}/api/admin/reports/article-count`, { headers: h }),
        fetch(`${BASE_URL}/api/admin/reports/total-views`, { headers: h }),
        fetch(`${BASE_URL}/api/admin/reports/top-articles`, { headers: h }),
        fetch(`${BASE_URL}/api/admin/reports/top-tags`, { headers: h }),
        fetch(`${BASE_URL}/api/admin/users`, { headers: h }),
      ]);

      if (uc.status === 403 || uc.status === 401) {
        router.push("/feed");
        return;
      }

      const [ucData, acData, tvData, taData, tgData, usData] = await Promise.all([
        uc.ok ? uc.json() : null,
        ac.ok ? ac.json() : null,
        tv.ok ? tv.json() : null,
        ta.ok ? ta.json() : [],
        tg.ok ? tg.json() : [],
        us.ok ? us.json() : [],
      ]);

      if (ucData && acData && tvData) {
        setStats({
          user_count: ucData.count,
          article_count: acData.count,
          total_views: tvData.count,
        });
      }
      setTopArticles(Array.isArray(taData) ? taData : []);
      setTopTags(Array.isArray(tgData) ? tgData : []);
      setUsers(Array.isArray(usData) ? usData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const showMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const approveAuthor = async (userId: number) => {
    await fetch(`${BASE_URL}/api/admin/authors/${userId}/approve`, { method: "PUT", headers: getHeaders() });
    showMsg("Author approved ✓");
    loadData();
  };

  const revokeAuthor = async (userId: number) => {
    await fetch(`${BASE_URL}/api/admin/authors/${userId}/revoke`, { method: "PUT", headers: getHeaders() });
    showMsg("Author status revoked");
    loadData();
  };

  const toggleUserActive = async (user: User) => {
    const endpoint = user.is_active ? "deactivate" : "activate";
    await fetch(`${BASE_URL}/api/admin/users/${user.user_id}/${endpoint}`, { method: "PUT", headers: getHeaders() });
    showMsg(user.is_active ? "User deactivated" : "User reactivated ✓");
    loadData();
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: `Users (${users.length})`, icon: "👥" },
    { id: "articles", label: "Top Articles", icon: "📰" },
    { id: "tags", label: "Top Tags", icon: "🏷️" },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-[#e2e8f0] flex flex-col">
      <TopNavbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold italic text-[#e2e8f0] mb-1">Admin Dashboard</h1>
            <p className="text-sm italic text-[#64748b]">Manage users, monitor platform health.</p>
          </div>
          {actionMsg && (
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm italic animate-pulse">
              {actionMsg}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-[#0f172a] rounded-2xl border border-[rgba(56,189,248,0.08)] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Total Users", value: stats.user_count.toLocaleString(), icon: "👥", color: "#38bdf8" },
                  { label: "Published Articles", value: stats.article_count.toLocaleString(), icon: "📰", color: "#818cf8" },
                  { label: "Total Views", value: stats.total_views.toLocaleString(), icon: "👁", color: "#34d399" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                      {icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold italic" style={{ color }}>{value}</p>
                      <p className="text-xs italic text-[#64748b] mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-xl p-1 w-fit mb-6 flex-wrap">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm italic font-semibold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white shadow-lg"
                      : "text-[#64748b] hover:text-[#e2e8f0]"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unverified users pending */}
                <div className="bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-2xl p-5">
                  <h2 className="text-sm font-bold italic text-[#e2e8f0] mb-4 flex items-center gap-2">
                    <span className="text-[#38bdf8]">⏳</span> Pending Email Verification
                  </h2>
                  {users.filter(u => !u.is_verified_author && u.is_active).length === 0 ? (
                    <p className="text-xs italic text-[#475569]">No pending verifications.</p>
                  ) : (
                    <div className="space-y-2">
                      {users.filter(u => !u.is_verified_author && u.is_active).slice(0, 8).map(u => (
                        <div key={u.user_id} className="flex items-center justify-between gap-2 py-2 border-b border-[rgba(56,189,248,0.06)] last:border-0">
                          <div className="min-w-0">
                            <p className="text-xs italic font-semibold text-[#94a3b8] truncate">{u.username}</p>
                            <p className="text-[10px] italic text-[#475569] truncate">{u.email}</p>
                          </div>
                          <button
                            onClick={() => approveAuthor(u.user_id)}
                            className="flex-shrink-0 px-2.5 py-1 text-[10px] italic font-bold rounded-lg border border-[rgba(56,189,248,0.2)] text-[#38bdf8] hover:bg-[rgba(56,189,248,0.08)] transition-all"
                          >
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verified Authors */}
                <div className="bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-2xl p-5">
                  <h2 className="text-sm font-bold italic text-[#e2e8f0] mb-4 flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Verified Authors
                    <span className="ml-auto text-[10px] italic text-[#475569]">
                      {users.filter(u => u.is_verified_author).length} total
                    </span>
                  </h2>
                  {users.filter(u => u.is_verified_author).length === 0 ? (
                    <p className="text-xs italic text-[#475569]">No verified authors yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {users.filter(u => u.is_verified_author).slice(0, 8).map(u => (
                        <div key={u.user_id} className="flex items-center gap-2 py-1.5 border-b border-[rgba(56,189,248,0.06)] last:border-0">
                          <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-[#020617]"
                            style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)" }}>
                            {u.username[0]?.toUpperCase()}
                          </div>
                          <span className="text-xs italic text-[#94a3b8] truncate flex-1">{u.username}</span>
                          <span className="text-[10px] italic text-emerald-400">✓ Author</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[rgba(56,189,248,0.08)] flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-sm font-bold italic text-[#e2e8f0]">All Users</h2>
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="h-8 w-48 bg-[#020617] border border-[rgba(56,189,248,0.15)] rounded-lg px-3 text-xs italic text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#38bdf8] focus:outline-none transition-all"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs italic">
                    <thead>
                      <tr className="border-b border-[rgba(56,189,248,0.06)] text-[#475569]">
                        <th className="text-left px-5 py-3 font-semibold">User</th>
                        <th className="text-left px-3 py-3 font-semibold hidden sm:table-cell">Email</th>
                        <th className="text-center px-3 py-3 font-semibold">Author</th>
                        <th className="text-center px-3 py-3 font-semibold">Status</th>
                        <th className="text-right px-5 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(56,189,248,0.04)]">
                      {filteredUsers.map(u => (
                        <tr key={u.user_id} className="hover:bg-[rgba(56,189,248,0.02)] transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-[#020617]"
                                style={{ background: u.is_active ? "linear-gradient(135deg,#38bdf8,#818cf8)" : "#334155" }}>
                                {u.username[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[#e2e8f0] font-semibold">{u.username}</p>
                                <p className="text-[#475569] text-[10px]">ID #{u.user_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[#64748b] hidden sm:table-cell max-w-[180px] truncate">{u.email}</td>
                          <td className="px-3 py-3 text-center">
                            {u.is_verified_author
                              ? <span className="text-emerald-400">✓</span>
                              : <span className="text-[#334155]">—</span>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.is_active
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                            }`}>
                              {u.is_active ? "Active" : "Suspended"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {u.is_verified_author ? (
                                <button
                                  onClick={() => revokeAuthor(u.user_id)}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 transition-all"
                                >
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  onClick={() => approveAuthor(u.user_id)}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-[rgba(56,189,248,0.2)] text-[#38bdf8] hover:bg-[rgba(56,189,248,0.08)] transition-all"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => toggleUserActive(u)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                                  u.is_active
                                    ? "border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                                    : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                }`}
                              >
                                {u.is_active ? "Suspend" : "Reactivate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="py-10 text-center text-sm italic text-[#475569]">No users found.</div>
                  )}
                </div>
              </div>
            )}

            {/* Top Articles Tab */}
            {activeTab === "articles" && (
              <div className="bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[rgba(56,189,248,0.08)]">
                  <h2 className="text-sm font-bold italic text-[#e2e8f0]">Top 10 Articles by Views</h2>
                </div>
                <div className="divide-y divide-[rgba(56,189,248,0.04)]">
                  {topArticles.map((a, i) => (
                    <div key={a.article_id} className="flex items-center gap-4 px-5 py-4 hover:bg-[rgba(56,189,248,0.02)] transition-colors">
                      <span className="text-2xl font-black italic flex-shrink-0"
                        style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "#334155" }}>
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm italic font-semibold text-[#e2e8f0] truncate">{a.title}</p>
                        <p className="text-xs italic text-[#64748b]">
                          {a.author_name ? `By ${a.author_name}` : `Author #${a.author_id}`}
                          {a.published_at && ` · ${new Date(a.published_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm italic font-bold text-[#38bdf8]">{a.view_count.toLocaleString()}</p>
                        <p className="text-[10px] italic text-[#475569]">views</p>
                      </div>
                    </div>
                  ))}
                  {topArticles.length === 0 && (
                    <div className="py-10 text-center text-sm italic text-[#475569]">No articles yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* Tags Tab */}
            {activeTab === "tags" && (
              <div className="bg-[#0f172a] border border-[rgba(56,189,248,0.12)] rounded-2xl p-5">
                <h2 className="text-sm font-bold italic text-[#e2e8f0] mb-5">Top Tags by Usage</h2>
                <div className="space-y-4">
                  {topTags.map((tag, i) => {
                    const max = topTags[0]?.usage_count ?? 1;
                    const pct = Math.round((tag.usage_count / max) * 100);
                    return (
                      <div key={tag.name}>
                        <div className="flex justify-between text-xs italic mb-1.5">
                          <span className="text-[#94a3b8] font-semibold">#{i + 1} {tag.name}</span>
                          <span className="text-[#38bdf8]">{tag.usage_count} uses</span>
                        </div>
                        <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: "linear-gradient(90deg,#38bdf8,#3b82f6)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {topTags.length === 0 && (
                    <p className="text-sm italic text-[#475569] text-center py-4">No tag data yet.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-[rgba(56,189,248,0.08)] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="brand-font text-lg font-bold" style={{
            background: "linear-gradient(135deg,#38bdf8,#818cf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>EcoBreaker</span>
          <p className="text-xs italic text-[#334155]">© 2026 EcoBreaker · Admin Panel</p>
        </div>
      </footer>
    </div>
  );
}
