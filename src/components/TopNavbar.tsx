"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BASE_URL } from "@/lib/api";

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("user-name");
    const email = localStorage.getItem("user-email");
    if (name) setUserName(name);
    if (email) setUserEmail(email);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, { method: "POST" });
    } catch (_) {}
    // Clear session
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-name");
    localStorage.removeItem("user-email");
    localStorage.removeItem("is-authenticated");
    router.push("/login");
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">

        {/* Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/feed" className="flex items-center space-x-2" id="nav-logo">
            <img src="/logo.png" className="w-7 h-7 rounded-lg shadow-md object-cover" alt="EchoBreaker Logo" />
            <span className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              EchoBreaker
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
            <Link
              href="/feed"
              id="nav-link-feed"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                pathname === "/feed"
                  ? "bg-indigo-500/10 text-indigo-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              📰 Browse Feed
            </Link>
            <Link
              href="/write"
              id="nav-link-write"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                pathname === "/write"
                  ? "bg-sky-500/10 text-sky-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              ✍️ Write a Blog
            </Link>
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/feed" className={`text-xs font-semibold px-2 py-1 rounded-lg ${pathname === "/feed" ? "text-indigo-400" : "text-muted-foreground"}`}>Feed</Link>
            <Link href="/write" className={`text-xs font-semibold px-2 py-1 rounded-lg ${pathname === "/write" ? "text-sky-400" : "text-muted-foreground"}`}>Write</Link>
          </div>

          {/* Write CTA */}
          <Link
            href="/write"
            id="btn-write-post"
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-md shadow-indigo-500/20"
          >
            + Post a Blog
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-2 group relative">
            <div className="flex items-center gap-2 bg-muted/60 hover:bg-muted px-3 py-1.5 rounded-full border border-border cursor-pointer transition-all" id="user-menu">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black">
                {initials}
              </div>
              <span className="text-xs font-semibold text-foreground hidden sm:block capitalize">{userName}</span>
              <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-xl shadow-black/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              <div className="p-3 border-b border-slate-800">
                <p className="text-xs font-bold text-slate-200 capitalize">{userName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{userEmail}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <Link href="/feed" className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                  <span>📰</span> My Feed
                </Link>
                <Link href="/write" className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                  <span>✍️</span> My Posts
                </Link>
                <button
                  onClick={handleLogout}
                  id="btn-logout"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <span>🚪</span> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
