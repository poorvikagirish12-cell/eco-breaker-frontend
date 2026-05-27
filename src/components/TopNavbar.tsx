"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BASE_URL } from "@/lib/api";
import { Newspaper, PenTool, Shield, Bookmark, LogOut, Search } from "lucide-react";

/* ── Glass Circuit Leaf Logo SVG ── */
function EcoBreakerLogo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 8px rgba(56,189,248,0.45))" }}
    >
      <defs>
        <linearGradient id="leafFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="leafStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="60%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        {/* glass shield backdrop */}
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Glass shield background */}
      <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#shieldGrad)"
        stroke="rgba(56,189,248,0.25)" strokeWidth="1.5" />
      {/* Subtle inner highlight */}
      <rect x="6" y="6" width="88" height="30" rx="18" fill="rgba(255,255,255,0.03)" />

      {/* Leaf outline */}
      <path
        d="M50 14 C72 22, 82 42, 74 66 C65 86, 50 90, 50 90 C50 90, 35 86, 26 66 C18 42, 28 22, 50 14 Z"
        fill="url(#leafFill)"
        stroke="url(#leafStroke)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Centre spine */}
      <path d="M50 18 V86" stroke="url(#leafStroke)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Circuit traces — right */}
      <path d="M50 32 L66 28 L66 21" stroke="url(#leafStroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="66" cy="21" r="2.8" fill="#38bdf8" opacity="0.9" />

      <path d="M50 50 L68 46 L68 39" stroke="url(#leafStroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="68" cy="39" r="2.8" fill="#60a5fa" opacity="0.9" />

      {/* Circuit traces — left */}
      <path d="M50 41 L34 37 L34 30" stroke="url(#leafStroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="34" cy="30" r="2.8" fill="#818cf8" opacity="0.9" />

      <path d="M50 62 L32 58 L32 51" stroke="url(#leafStroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="51" r="2.8" fill="#38bdf8" opacity="0.9" />

      {/* Bottom right trace */}
      <path d="M50 74 L64 70 L64 63" stroke="url(#leafStroke)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="64" cy="63" r="2.2" fill="#60a5fa" opacity="0.85" />
    </svg>
  );
}

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("user-name");
    const email = localStorage.getItem("user-email");
    const admin = localStorage.getItem("is-admin") === "true";
    if (name) setUserName(name);
    if (email) setUserEmail(email);
    setIsAdmin(admin);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, { method: "POST" });
    } catch (_) {}
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-name");
    localStorage.removeItem("user-email");
    localStorage.removeItem("is-authenticated");
    localStorage.removeItem("is-admin");
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

  const navLinks = [
    { href: "/feed", label: "Browse Feed" },
    { href: "/write", label: "Write Blog" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(56,189,248,0.1)] bg-[#020617]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6">

        {/* ── Brand ── */}
        <Link href="/feed" className="flex items-center gap-2.5 group" id="nav-logo">
          <EcoBreakerLogo size={36} />
          <span
            className="brand-font text-2xl font-bold tracking-wide"
            style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 6px rgba(56,189,248,0.3))",
            }}
          >
            EcoBreaker
          </span>
        </Link>

        {/* ── Nav links ── */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`text-sm font-semibold italic transition-all duration-150 flex items-center gap-1.5 ${
                pathname === href
                  ? "text-[#38bdf8]"
                  : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              {label === "Browse Feed" && <Newspaper className="w-4 h-4" />}
              {label === "Write Blog" && <PenTool className="w-4 h-4" />}
              {label === "Admin" && <Shield className="w-4 h-4" />}
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Right side: search + user ── */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="hidden md:relative md:block">
            <input
              type="text"
              placeholder="Search articles…"
              value={searchValue}
              onChange={handleSearchChange}
              id="nav-search"
              className="w-48 xl:w-56 h-8 pl-3 pr-8 text-sm italic bg-[#0f172a] border border-[rgba(56,189,248,0.15)] rounded-lg text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#38bdf8] focus:outline-none transition-all"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569]" />
          </div>

          {/* User avatar + dropdown */}
          <div className="relative group" id="user-menu-wrapper">
            <button
              id="user-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-[#0f172a] border border-[rgba(56,189,248,0.15)] rounded-lg px-2.5 py-1.5 hover:border-[rgba(56,189,248,0.3)] transition-all"
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-[#020617]"
                style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)" }}>
                {initials}
              </div>
              <span className="text-xs italic font-semibold text-[#94a3b8] hidden sm:block max-w-[80px] truncate">
                {userName}
              </span>
              <svg className="w-3 h-3 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-44 bg-[#0f172a] border border-[rgba(56,189,248,0.18)] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[rgba(56,189,248,0.1)] bg-[#020617]">
                <p className="text-xs font-bold italic text-[#38bdf8] truncate capitalize">{userName}</p>
                <p className="text-[10px] italic text-[#475569] mt-0.5 truncate">{userEmail}</p>
              </div>
              <div className="p-1">
                {navLinks.map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs italic text-[#94a3b8] hover:text-[#38bdf8] hover:bg-[#020617] rounded-lg transition-colors">
                    {label === "Browse Feed" && <Newspaper className="w-3.5 h-3.5" />}
                    {label === "Write Blog" && <PenTool className="w-3.5 h-3.5" />}
                    {label === "Admin" && <Shield className="w-3.5 h-3.5" />}
                    {label}
                  </Link>
                ))}
                <Link href="/feed?saved=1"
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs italic text-[#94a3b8] hover:text-[#38bdf8] hover:bg-[#020617] rounded-lg transition-colors">
                  <Bookmark className="w-3.5 h-3.5" /> Saved Articles
                </Link>
                <button
                  onClick={handleLogout}
                  id="btn-logout"
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs italic text-rose-400 hover:text-rose-300 hover:bg-[#020617] rounded-lg transition-colors text-left font-semibold mt-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
