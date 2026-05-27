"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BASE_URL } from "@/lib/api";

type Status = "loading" | "success" | "already" | "error" | "expired";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link. Please check your email.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok) {
          if (data.already_verified) {
            setStatus("already");
          } else {
            setStatus("success");
          }
          setMessage(data.message);
        } else if (res.status === 400 && data.detail?.includes("expired")) {
          setStatus("expired");
          setMessage(data.detail);
        } else {
          setStatus("error");
          setMessage(data.detail || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Could not connect to the server. Please try again.");
      }
    })();
  }, [params]);

  // Auto-redirect on success
  useEffect(() => {
    if (status === "success" || status === "already") {
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            router.push("/feed");
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, router]);

  return (
    <div className="relative w-full max-w-md fade-up">
      <div className="bg-[#0f172a] border border-[rgba(56,189,248,0.18)] rounded-2xl p-8 shadow-2xl text-center">

        {/* Loading */}
        {status === "loading" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-[rgba(56,189,248,0.15)] border-t-[#38bdf8] animate-spin" />
            </div>
            <h1 className="text-xl font-bold italic text-[#e2e8f0] mb-2">Verifying your email…</h1>
            <p className="text-sm italic text-[#64748b]">Please wait a moment.</p>
          </>
        )}

        {/* Success */}
        {(status === "success" || status === "already") && (
          <>
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: "linear-gradient(135deg,rgba(52,211,153,0.15),rgba(52,211,153,0.05))", border: "1px solid rgba(52,211,153,0.3)" }}
              >
                ✓
              </div>
            </div>
            <h1 className="text-2xl font-bold italic text-emerald-400 mb-3">
              {status === "already" ? "Already Verified!" : "Email Verified! 🎉"}
            </h1>
            <p className="text-sm italic text-[#94a3b8] leading-relaxed mb-6">{message}</p>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6">
              <p className="text-xs italic text-emerald-400">
                ✦ You now have <strong>full author access</strong> — write and publish articles freely.
              </p>
            </div>
            <p className="text-xs italic text-[#475569] mb-4">
              Redirecting to your feed in <strong className="text-[#38bdf8]">{countdown}s</strong>…
            </p>
            <Link
              href="/feed"
              className="inline-block w-full py-2.5 rounded-xl text-sm italic font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#3b82f6)", boxShadow: "0 4px 20px rgba(14,165,233,0.25)" }}
            >
              Go to Feed Now →
            </Link>
          </>
        )}

        {/* Expired */}
        {status === "expired" && (
          <>
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}
              >
                ⏰
              </div>
            </div>
            <h1 className="text-xl font-bold italic text-amber-400 mb-3">Link Expired</h1>
            <p className="text-sm italic text-[#94a3b8] leading-relaxed mb-6">{message}</p>
            <ResendForm />
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)" }}
              >
                ✗
              </div>
            </div>
            <h1 className="text-xl font-bold italic text-rose-400 mb-3">Verification Failed</h1>
            <p className="text-sm italic text-[#94a3b8] leading-relaxed mb-6">{message}</p>
            <ResendForm />
            <p className="mt-4 text-xs italic text-[#475569]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#38bdf8] hover:text-[#7dd3fc] transition-colors">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(56,189,248,0.07) 0%, transparent 70%)",
        }}
      />
      <Suspense
        fallback={
          <div className="w-16 h-16 rounded-full border-2 border-[rgba(56,189,248,0.15)] border-t-[#38bdf8] animate-spin" />
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}

function ResendForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${BASE_URL}/api/auth/resend-verification?email=${encodeURIComponent(email)}`);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-[#0ea5e9]/10 border border-[#38bdf8]/20 rounded-xl px-4 py-3 text-center">
        <p className="text-sm italic text-[#38bdf8]">
          ✓ If that email is registered, a new verification link has been sent.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleResend} className="space-y-3">
      <p className="text-xs italic text-[#64748b] mb-2">Request a new verification link:</p>
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full h-10 bg-[#020617] border border-[rgba(56,189,248,0.15)] rounded-xl px-4 text-sm italic text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#38bdf8] focus:outline-none transition-all"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm italic font-bold text-white transition-all disabled:opacity-60"
        style={{ background: "linear-gradient(135deg,#0ea5e9,#3b82f6)" }}
      >
        {loading ? "Sending…" : "Resend Verification Email"}
      </button>
    </form>
  );
}
