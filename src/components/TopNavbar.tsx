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
  const [searchValue, setSearchValue] = useState("");

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
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-name");
    localStorage.removeItem("user-email");
    localStorage.removeItem("is-authenticated");
    router.push("/login");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    window.dispatchEvent(new CustomEvent("archive-search", { detail: val }));
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(3,227,140,0.15)] bg-[#070d0b]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo & lowercase "ecobreaker" title */}
        <div className="flex items-center gap-3">
          <Link href="/feed" className="flex items-center gap-2 group" id="nav-logo">
            <div className="relative flex items-center justify-center p-1 rounded bg-[#070d0b] border border-[rgba(0,229,255,0.2)] shadow-[0_0_10px_rgba(0,229,255,0.05)]">
              {/* Custom SVG Circuit Leaf Logo with Blue-Cyan Gradient */}
              <svg className="w-6 h-6 filter drop-shadow-[0_0_6px_rgba(0,229,255,0.3)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00e5ff" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <path 
                  d="M50 10 C68 25, 78 45, 70 70 C60 90, 50 95, 50 95 C50 95, 40 90, 30 70 C22 45, 32 25, 50 10 Z" 
                  stroke="url(#logoGrad)" 
                  strokeWidth="4.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M50 20 V82" 
                  stroke="url(#logoGrad)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                />
                <path 
                  d="M50 35 L68 31 V24" 
                  stroke="url(#logoGrad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <circle cx="68" cy="24" r="3" fill="url(#logoGrad)" />

                <path 
                  d="M50 48 L32 44 V37" 
                  stroke="url(#logoGrad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <circle cx="32" cy="37" r="3" fill="url(#logoGrad)" />

                <path 
                  d="M50 61 L70 58 V51" 
                  stroke="url(#logoGrad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <circle cx="70" cy="51" r="3" fill="url(#logoGrad)" />

                <path 
                  d="M50 72 L30 69 V62" 
                  stroke="url(#logoGrad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <circle cx="30" cy="62" r="3" fill="url(#logoGrad)" />
              </svg>
            </div>
            <span className="brand-font text-xl font-bold tracking-wide bg-gradient-to-r from-[#00e5ff] to-[#3b82f6] bg-clip-text text-transparent transition-all group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              EcoBreaker
            </span>
          </Link>
        </div>

        {/* Navigation Links & Search Input */}
        <div className="flex items-center gap-6 md:gap-8">
          <nav className="flex items-center space-x-6 text-xs md:text-sm font-medium uppercase tracking-wider terminal-font">
            <Link
              href="/feed"
              id="nav-link-archive"
              className={`transition-colors hover:text-[#03e38c] ${
                pathname === "/feed" ? "text-[#03e38c] drop-shadow-[0_0_5px_rgba(3,227,140,0.5)] font-bold" : "text-muted-foreground"
              }`}
            >
              Archive
            </Link>
            <Link
              href="/feed?tab=personalized"
              id="nav-link-signals"
              className={`transition-colors hover:text-[#03e38c] ${
                pathname === "/feed" ? "text-muted-foreground hover:text-[#03e38c]" : "text-muted-foreground"
              }`}
            >
              Signals
            </Link>
            <Link
              href="/write"
              id="nav-link-synthesis"
              className={`transition-colors hover:text-[#03e38c] ${
                pathname === "/write" ? "text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.5)] font-bold" : "text-muted-foreground"
              }`}
            >
              Synthesis
            </Link>
          </nav>

          {/* Search Input Bar (Desktop) */}
          <div className="hidden md:relative md:block">
            <input
              type="text"
              placeholder="Search archive..."
              value={searchValue}
              onChange={handleSearchChange}
              className="w-48 xl:w-60 h-8 pl-3 pr-8 text-xs bg-[#09100d] border border-[rgba(3,227,140,0.2)] rounded-sm text-[#c9d1c9] placeholder:text-[#4d5e56] focus:border-[#03e38c] focus:outline-none transition-all terminal-font"
            />
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#03e38c]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2 group relative">
            <div className="flex items-center gap-1.5 bg-[#09100d] hover:bg-[#0f1d19] px-2.5 py-1 rounded border border-[rgba(3,227,140,0.2)] cursor-pointer transition-all" id="user-menu">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#03e38c] to-[#00e5ff] flex items-center justify-center text-[#070d0b] text-[9px] font-black">
                {initials}
              </div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground hidden sm:block truncate max-w-[80px] terminal-font">{userName}</span>
              <svg className="w-3 h-3 text-[#03e38c]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0b120f] border border-[rgba(3,227,140,0.25)] rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 terminal-font">
              <div className="p-3 border-b border-[rgba(3,227,140,0.15)] bg-[#070d0b]">
                <p className="text-xs font-bold text-[#03e38c] truncate capitalize">{userName}</p>
                <p className="text-[9px] text-[#4d5e56] mt-0.5 truncate">{userEmail}</p>
              </div>
              <div className="p-1 space-y-0.5">
                <Link href="/feed" className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-[#03e38c] hover:bg-[#070d0b] rounded transition-colors uppercase">
                  <span>📰</span> Archive
                </Link>
                <Link href="/write" className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-[#00e5ff] hover:bg-[#070d0b] rounded transition-colors uppercase">
                  <span>✍️</span> Synthesis
                </Link>
                <button
                  onClick={handleLogout}
                  id="btn-logout"
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-[#1a080d] rounded transition-colors uppercase text-left"
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
