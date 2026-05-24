"use client";

import { useEffect, useState } from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { health, BASE_URL } from "@/lib/api";

interface EndpointCheck {
  name: string;
  method: string;
  url: string;
  status: "checking" | "ok" | "error";
  statusCode?: number;
  latency?: number;
}

const ENDPOINTS: Omit<EndpointCheck, "status">[] = [
  { name: "Backend Root",         method: "GET",  url: "/api/../" },
  { name: "Auth — Register",      method: "POST", url: "/api/auth/register" },
  { name: "Auth — Login",         method: "POST", url: "/api/auth/login" },
  { name: "Feed (Contrarian)",    method: "GET",  url: "/api/feed" },
  { name: "Articles — List",      method: "GET",  url: "/api/articles" },
  { name: "Tags — List",          method: "GET",  url: "/api/tags" },
  { name: "User — Profile",       method: "GET",  url: "/api/users/me" },
  { name: "User — Preferences",   method: "GET",  url: "/api/users/me/preferences" },
  { name: "User — History",       method: "GET",  url: "/api/users/me/history" },
  { name: "Author — My Articles", method: "GET",  url: "/api/authors/me/articles" },
  { name: "Interactions — View",  method: "POST", url: "/api/interactions/view" },
];

export default function ApiStatusPage() {
  const [checks, setChecks] = useState<EndpointCheck[]>(
    ENDPOINTS.map((e) => ({ ...e, status: "checking" }))
  );
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const runChecks = async () => {
    setChecks(ENDPOINTS.map((e) => ({ ...e, status: "checking" })));
    setBackendOnline(null);

    // Check backend root first
    try {
      const start = Date.now();
      const res = await fetch(BASE_URL + "/");
      const latency = Date.now() - start;
      setBackendOnline(res.ok);
      if (!res.ok) {
        setChecks(ENDPOINTS.map((e) => ({ ...e, status: "error" })));
        return;
      }
      // Update root check
      setChecks((prev) =>
        prev.map((c) =>
          c.name === "Backend Root"
            ? { ...c, status: "ok", statusCode: res.status, latency }
            : c
        )
      );
    } catch {
      setBackendOnline(false);
      setChecks(ENDPOINTS.map((e) => ({ ...e, status: "error" })));
      return;
    }

    // Check each endpoint
    for (const ep of ENDPOINTS.slice(1)) {
      const start = Date.now();
      try {
        const opts: RequestInit = { method: ep.method };
        if (ep.method === "POST") {
          opts.headers = { "Content-Type": "application/json" };
          // Minimal valid body for POST endpoints
          if (ep.url.includes("register"))
            opts.body = JSON.stringify({ username: "_test", email: "_test@test.com", password: "test123" });
          else if (ep.url.includes("login"))
            opts.body = JSON.stringify({ email: "_test@test.com", password: "test123" });
          else if (ep.url.includes("interactions/view"))
            opts.body = JSON.stringify({ view_duration_seconds: 5 });
        }

        const fetchUrl = ep.url.startsWith("/api") ? `${BASE_URL}${ep.url}` : ep.url;
        const res = await fetch(fetchUrl, opts);
        const latency = Date.now() - start;
        // 4xx/5xx are still "reachable" — endpoint exists and backend responded
        const reachable = res.status < 500;

        setChecks((prev) =>
          prev.map((c) =>
            c.name === ep.name
              ? { ...c, status: reachable ? "ok" : "error", statusCode: res.status, latency }
              : c
          )
        );
      } catch {
        setChecks((prev) =>
          prev.map((c) =>
            c.name === ep.name ? { ...c, status: "error" } : c
          )
        );
      }
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  const allOk = checks.every((c) => c.status === "ok");
  const okCount = checks.filter((c) => c.status === "ok").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <TopNavbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            🔌 API Connection Status
          </h1>
          <p className="text-slate-400 text-sm">
            Live check: Frontend → Backend ({BASE_URL})
          </p>
        </div>

        {/* Overall Status Banner */}
        <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between ${
          backendOnline === null
            ? "bg-slate-900/50 border-slate-800"
            : backendOnline
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-rose-500/10 border-rose-500/20"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              backendOnline === null ? "bg-slate-600 animate-pulse" :
              backendOnline ? "bg-emerald-400 shadow-lg shadow-emerald-400/40 animate-pulse" : "bg-rose-500"
            }`} />
            <div>
              <p className={`font-bold text-sm ${
                backendOnline === null ? "text-slate-400" :
                backendOnline ? "text-emerald-400" : "text-rose-400"
              }`}>
                {backendOnline === null
                  ? "Checking connection..."
                  : backendOnline
                  ? `✅ Backend Connected — ${okCount}/${checks.length} endpoints OK`
                  : `❌ Backend Offline — Could not connect to ${BASE_URL}`}
              </p>
              {!backendOnline && backendOnline !== null && BASE_URL.includes("localhost") && (
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Run: <span className="text-rose-400">uvicorn main:app --reload --port 8000</span> in the backend folder
                </p>
              )}
            </div>
          </div>
          <button
            onClick={runChecks}
            className="text-xs font-bold px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all"
          >
            🔄 Re-check
          </button>
        </div>

        {/* Endpoint Table */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-sm">Endpoint Health Checks</h2>
            <span className="text-xs text-slate-500">{okCount}/{checks.length} reachable</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {checks.map((check) => (
              <div key={check.name} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 shrink-0 rounded-full ${
                    check.status === "checking" ? "bg-slate-600 animate-pulse" :
                    check.status === "ok" ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" :
                    "bg-rose-500"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{check.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      <span className={`font-bold mr-1.5 ${
                        check.method === "GET" ? "text-sky-400" :
                        check.method === "POST" ? "text-emerald-400" :
                        "text-amber-400"
                      }`}>{check.method}</span>
                      {check.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {check.latency !== undefined && (
                    <span className="text-[11px] text-slate-500 font-mono">{check.latency}ms</span>
                  )}
                  {check.statusCode !== undefined && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      check.statusCode < 300 ? "bg-emerald-500/10 text-emerald-400" :
                      check.statusCode < 400 ? "bg-sky-500/10 text-sky-400" :
                      "bg-amber-500/10 text-amber-400"
                    }`}>
                      {check.statusCode}
                    </span>
                  )}
                  <span className={`text-xs font-bold ${
                    check.status === "checking" ? "text-slate-500" :
                    check.status === "ok" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {check.status === "checking" ? "..." :
                     check.status === "ok" ? "OK" : "FAIL"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions if offline */}
        {backendOnline === false && BASE_URL.includes("localhost") && (
          <div className="mt-6 p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-rose-400">🛠️ How to start the backend</h3>
            <ol className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">1.</span>
                Open a new terminal window
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">2.</span>
                <span>Navigate to the backend folder:<br />
                  <code className="text-xs bg-slate-900 px-2 py-0.5 rounded font-mono text-sky-400">
                    cd "C:\Users\poorv\OneDrive\Desktop\tessa\task 6\backend"
                  </code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">3.</span>
                <span>Start the server:<br />
                  <code className="text-xs bg-slate-900 px-2 py-0.5 rounded font-mono text-emerald-400">
                    uvicorn main:app --reload --port 8000
                  </code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">4.</span>
                Click <strong className="text-white">🔄 Re-check</strong> above
              </li>
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}
