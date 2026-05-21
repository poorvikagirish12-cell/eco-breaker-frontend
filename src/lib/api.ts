// ============================================================
// EchoBreaker — Centralized API Client (src/lib/api.ts)
// ============================================================
// All backend calls go through this file.
// To switch backends: just change NEXT_PUBLIC_API_URL in .env.local
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Core fetch wrapper ──────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 204) return undefined as T; // No Content
  return res.json() as Promise<T>;
}

// ============================================================
// TYPES
// ============================================================
export interface Article {
  article_id: number;
  title: string;
  content?: string;
  author_id: number;
  view_count: number;
  status: string;
  published_at?: string;
  created_at?: string;
  tags?: Tag[];
}

export interface Tag {
  tag_id: number;
  name: string;
  created_at?: string;
}

export interface TagAffinity {
  name: string;
  affinity_score: number;
}

export interface HistoryItem {
  article_id: number;
  title: string;
  viewed_at: string;
  view_duration_seconds: number;
}

export interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  is_verified_author: boolean;
  is_active: boolean;
  created_at: string;
}

// ============================================================
// AUTH
// ============================================================
export const auth = {
  register: (username: string, email: string, password: string) =>
    request<UserProfile>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ message: string; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ message: string }>("/api/auth/logout", { method: "POST" }),
};

// ============================================================
// FEED
// ============================================================
export const feed = {
  getPersonalized: () =>
    request<Article[]>("/api/feed"),
};

// ============================================================
// ARTICLES
// ============================================================
export const articles = {
  list: (params?: { search?: string; tag?: number; sort?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.append("search", params.search);
    if (params?.tag)    qs.append("tag", params.tag.toString());
    if (params?.sort)   qs.append("sort", params.sort);
    return request<Article[]>(`/api/articles?${qs.toString()}`);
  },

  get: (articleId: number) =>
    request<Article>(`/api/articles/${articleId}`),

  create: (title: string, content: string) =>
    request<Article>("/api/articles", {
      method: "POST",
      body: JSON.stringify({ title, content }),
    }),

  update: (articleId: number, data: { title?: string; content?: string }) =>
    request<Article>(`/api/articles/${articleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  publish: (articleId: number) =>
    request<Article>(`/api/articles/${articleId}/publish`, { method: "PATCH" }),

  unpublish: (articleId: number) =>
    request<Article>(`/api/articles/${articleId}/unpublish`, { method: "PATCH" }),

  delete: (articleId: number) =>
    request<void>(`/api/articles/${articleId}`, { method: "DELETE" }),

  assignTag: (articleId: number, tagId: number) =>
    request<{ message: string }>(`/api/articles/${articleId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tag_id: tagId }),
    }),

  getTags: (articleId: number) =>
    request<Tag[]>(`/api/articles/${articleId}/tags`),
};

// ============================================================
// TAGS
// ============================================================
export const tags = {
  list: () => request<Tag[]>("/api/tags"),
};

// ============================================================
// USER
// ============================================================
export const user = {
  getProfile: () => request<UserProfile>("/api/users/me"),

  getMyArticles: () => request<Article[]>("/api/authors/me/articles"),

  getPreferences: () => request<TagAffinity[]>("/api/users/me/preferences"),

  resetPreferences: () =>
    request<void>("/api/users/me/preferences", { method: "DELETE" }),

  getHistory: () => request<HistoryItem[]>("/api/users/me/history"),

  clearHistory: () =>
    request<void>("/api/users/me/history", { method: "DELETE" }),

  getSavedArticles: () =>
    request<Article[]>("/api/users/me/saved-articles"),
};

// ============================================================
// INTERACTIONS
// ============================================================
export const interactions = {
  logView: (viewDurationSeconds: number) =>
    request<{ message: string }>("/api/interactions/view", {
      method: "POST",
      body: JSON.stringify({ view_duration_seconds: viewDurationSeconds }),
    }),

  like: () =>
    request<{ message: string }>("/api/interactions/like", { method: "POST" }),

  unlike: (articleId: number) =>
    request<void>(`/api/interactions/like/${articleId}`, { method: "DELETE" }),

  save: () =>
    request<{ message: string }>("/api/interactions/save", { method: "POST" }),

  unsave: (articleId: number) =>
    request<void>(`/api/interactions/save/${articleId}`, { method: "DELETE" }),
};

// ============================================================
// HEALTH CHECK
// ============================================================
export const health = {
  check: () => fetch(`${BASE_URL}/`).then((r) => ({ ok: r.ok, status: r.status })),
  getBaseUrl: () => BASE_URL,
};
