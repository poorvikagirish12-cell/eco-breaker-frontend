"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@/lib/api";

/* Reuse same glass logo */
function GlassLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 12px rgba(56,189,248,0.5))" }}>
      <defs>
        <linearGradient id="lgFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="lgStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="60%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="lgShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#lgShield)" stroke="rgba(56,189,248,0.3)" strokeWidth="1.5" />
      <rect x="6" y="6" width="88" height="28" rx="18" fill="rgba(255,255,255,0.04)" />
      <path d="M50 14 C72 22, 82 42, 74 66 C65 86, 50 90, 50 90 C50 90, 35 86, 26 66 C18 42, 28 22, 50 14 Z"
        fill="url(#lgFill)" stroke="url(#lgStroke)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 18 V86" stroke="url(#lgStroke)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 32 L66 28 L66 21" stroke="url(#lgStroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="66" cy="21" r="2.8" fill="#38bdf8" />
      <path d="M50 50 L68 46 L68 39" stroke="url(#lgStroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="68" cy="39" r="2.8" fill="#60a5fa" />
      <path d="M50 41 L34 37 L34 30" stroke="url(#lgStroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="34" cy="30" r="2.8" fill="#818cf8" />
      <path d="M50 62 L32 58 L32 51" stroke="url(#lgStroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="51" r="2.8" fill="#38bdf8" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("auth-token", data.token || "");
        localStorage.setItem("user-email", email);
        localStorage.setItem("user-name", data.username || email.split("@")[0]);
        localStorage.setItem("is-authenticated", "true");
        // Check admin status
        try {
          const profileRes = await fetch(`${BASE_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${data.token}` }
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            localStorage.setItem("is-admin", profile.is_admin ? "true" : "false");
          }
        } catch {}
        router.push("/feed");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full h-11 bg-[#0f172a] border border-[rgba(56,189,248,0.15)] rounded-xl px-4 text-sm italic text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#38bdf8] focus:outline-none focus:ring-1 focus:ring-[rgba(56,189,248,0.2)] transition-all";

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(56,189,248,0.06) 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-md fade-up">

        {/* Card */}
        <div className="bg-[#0f172a] border border-[rgba(56,189,248,0.15)] rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <GlassLogo />
            </div>
            <h1 className="brand-font text-3xl font-bold"
              style={{
                background: "linear-gradient(135deg,#38bdf8,#818cf8)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
              EcoBreaker
            </h1>
            <p className="text-sm italic text-[#64748b] mt-1">Sign in to your account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm italic">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4" id="login-form">
            <div>
              <label htmlFor="login-email" className="block text-xs italic font-semibold text-[#94a3b8] mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs italic font-semibold text-[#94a3b8] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8] transition-colors"
                >
                  {showPassword
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              id="btn-login"
              className="w-full h-11 rounded-xl text-sm italic font-bold text-white transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#3b82f6)", boxShadow: "0 4px 20px rgba(14,165,233,0.3)" }}
            >
              {isLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm italic text-[#64748b] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#38bdf8] hover:text-[#7dd3fc] font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
