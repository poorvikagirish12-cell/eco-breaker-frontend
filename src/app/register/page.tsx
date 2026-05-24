"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("VALIDATION_ERROR: Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("VALIDATION_ERROR: Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (res.ok || res.status === 201) {
        const data = await res.json();
        localStorage.setItem("user-email", email);
        localStorage.setItem("user-name", username);
        localStorage.setItem("auth-token", data.token || "mock-jwt-token");
        localStorage.setItem("is-authenticated", "true");
        router.push("/feed");
      } else {
        setError("REGISTRATION_FAILED: Parameter overlap detected. Email might already exist.");
      }
    } catch (err) {
      setError("CONNECTION_FAILED: Verify database server connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d0b] flex items-center justify-center px-4 selection:bg-[#03e38c]/20 relative overflow-hidden">
      {/* 3D perspective grid background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, #03e38c 1px, transparent 1px),
            linear-gradient(to bottom, #03e38c 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          transform: "perspective(500px) rotateX(60deg) translateY(-100px)",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))",
          transformOrigin: "top center",
          height: "150%"
        }}
      />

      <div className="relative w-full max-w-sm terminal-font">
        {/* Terminal panel */}
        <div className="bg-[#0b120f] border border-[rgba(3,227,140,0.25)] rounded-sm p-6 shadow-2xl shadow-black/80">
          
          {/* Logo & lowercase title */}
          <div className="text-center mb-6 border-b border-[rgba(3,227,140,0.1)] pb-4">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="p-1 rounded bg-[#070d0b] border border-[rgba(0,229,255,0.2)] shadow-[0_0_10px_rgba(0,229,255,0.05)]">
                {/* Custom SVG Circuit Leaf Logo with Blue-Cyan Gradient */}
                <svg className="w-8 h-8 filter drop-shadow-[0_0_6px_rgba(0,229,255,0.3)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="logoGradRegister" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00e5ff" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M50 10 C68 25, 78 45, 70 70 C60 90, 50 95, 50 95 C50 95, 40 90, 30 70 C22 45, 32 25, 50 10 Z" 
                    stroke="url(#logoGradRegister)" 
                    strokeWidth="4.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <path 
                    d="M50 20 V82" 
                    stroke="url(#logoGradRegister)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                  />
                  <path 
                    d="M50 35 L68 31 V24" 
                    stroke="url(#logoGradRegister)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <circle cx="68" cy="24" r="3" fill="url(#logoGradRegister)" />

                  <path 
                    d="M50 48 L32 44 V37" 
                    stroke="url(#logoGradRegister)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <circle cx="32" cy="37" r="3" fill="url(#logoGradRegister)" />

                  <path 
                    d="M50 61 L70 58 V51" 
                    stroke="url(#logoGradRegister)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <circle cx="70" cy="51" r="3" fill="url(#logoGradRegister)" />

                  <path 
                    d="M50 72 L30 69 V62" 
                    stroke="url(#logoGradRegister)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <circle cx="30" cy="62" r="3" fill="url(#logoGradRegister)" />
                </svg>
              </div>
              <span className="brand-font text-2xl font-bold tracking-wide bg-gradient-to-r from-[#00e5ff] to-[#3b82f6] bg-clip-text text-transparent">
                EcoBreaker
              </span>
            </div>
            <h1 className="text-xs font-semibold text-[#708078] uppercase mt-1">UPLINK_CONSOLE: ACCOUNT_PROVISION</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-[rgba(255,0,127,0.05)] border border-[#ff007f] rounded-sm text-[#ff007f] text-xs">
              &gt;&gt;&gt; {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4" id="register-form">

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="reg-username" className="text-[10px] font-bold text-[#708078] uppercase tracking-wider block">
                &gt; USERNAME
              </label>
              <input
                id="reg-username"
                type="text"
                placeholder="operator_42"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-9 bg-[#070d0b] border border-[rgba(3,227,140,0.15)] focus:border-[#03e38c] focus:outline-none rounded-sm px-3 text-xs text-[#c9d1c9] placeholder:text-[#4d5e56]"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="text-[10px] font-bold text-[#708078] uppercase tracking-wider block">
                &gt; EMAIL ADDRESS
              </label>
              <input
                id="reg-email"
                type="email"
                placeholder="operator@ecobreaker.xyz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-9 bg-[#070d0b] border border-[rgba(3,227,140,0.15)] focus:border-[#03e38c] focus:outline-none rounded-sm px-3 text-xs text-[#c9d1c9] placeholder:text-[#4d5e56]"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-[10px] font-bold text-[#708078] uppercase tracking-wider block">
                &gt; SECURITY PASSWORD
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-9 bg-[#070d0b] border border-[rgba(3,227,140,0.15)] focus:border-[#03e38c] focus:outline-none rounded-sm px-3 text-xs text-[#c9d1c9] placeholder:text-[#4d5e56]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4d5e56] hover:text-[#03e38c] transition-colors text-[10px] font-bold"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-confirm" className="text-[10px] font-bold text-[#708078] uppercase tracking-wider block">
                &gt; CONFIRM PASSWORD
              </label>
              <input
                id="reg-confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full h-9 bg-[#070d0b] border rounded-sm px-3 text-xs text-[#c9d1c9] placeholder:text-[#4d5e56] focus:outline-none focus:ring-0 ${
                  confirmPassword && confirmPassword !== password
                    ? "border-[#ff007f] focus:border-[#ff007f]"
                    : "border-[rgba(3,227,140,0.15)] focus:border-[#03e38c]"
                }`}
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[9px] text-[#ff007f] font-bold">ERROR: PASSWORDS DO NOT MATCH</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || (!!confirmPassword && confirmPassword !== password)}
              id="btn-register"
              className="w-full h-9 bg-transparent border border-[#03e38c] text-[#03e38c] hover:bg-[#03e38c]/10 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs rounded-sm uppercase tracking-widest transition-all mt-2 shadow-[0_0_10px_rgba(3,227,140,0.15)]"
            >
              {isLoading ? "PROVISIONING..." : "COMPILE_ACCOUNT"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-2 my-5 text-[10px] text-[#4d5e56]">
            <div className="flex-grow h-px bg-[rgba(3,227,140,0.1)]" />
            <span>ALREADY REGISTERED</span>
            <div className="flex-grow h-px bg-[rgba(3,227,140,0.1)]" />
          </div>

          <Link
            href="/login"
            id="link-login"
            className="flex items-center justify-center w-full h-9 border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff]/10 font-bold text-xs rounded-sm uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(0,229,255,0.1)]"
          >
            SIGN IN TO EXISTING CHANNEL
          </Link>
        </div>

        {/* Footer info */}
        <p className="text-center text-[9px] text-[#4d5e56] mt-4 uppercase tracking-wider">
          SYSTEM COMPLIANT PROTOCOL 48 ACCESS GRANTED FOR VERIFIED CLIENTS.
        </p>
      </div>
    </div>
  );
}
