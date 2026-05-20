"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function TopNavbar() {
  const pathname = usePathname();
  const [role, setRole] = useState<"reader" | "author">("reader");

  // Read role from local storage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("user-role") as "reader" | "author";
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  const handleRoleToggle = () => {
    const newRole = role === "reader" ? "author" : "reader";
    setRole(newRole);
    localStorage.setItem("user-role", newRole);
    // Dispatch custom event to notify other components of the role change
    window.dispatchEvent(new Event("role-change"));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/feed" className="flex items-center space-x-2" id="nav-logo">
            <span className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              EchoBreaker
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
              Contrarian
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/feed"
              id="nav-link-feed"
              className={`transition-colors hover:text-foreground ${
                pathname === "/feed" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Feed
            </Link>
            {role === "author" && (
              <Link
                href="/write"
                id="nav-link-write"
                className={`transition-colors hover:text-foreground ${
                  pathname === "/write" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Author Dashboard
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Role Indicator / Switcher */}
          <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-full border border-border">
            <button
              onClick={handleRoleToggle}
              id="btn-role-reader"
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                role === "reader"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Reader
            </button>
            <button
              onClick={handleRoleToggle}
              id="btn-role-author"
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                role === "author"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Author
            </button>
          </div>

          {/* Quick Actions */}
          {role === "author" ? (
            <Link href="/write" passHref>
              <Button size="sm" variant="default" className="bg-sky-600 hover:bg-sky-500 text-white font-medium" id="btn-quick-write">
                Write a Post
              </Button>
            </Link>
          ) : (
            <Link href="/feed#preferences" passHref>
              <Button size="sm" variant="outline" className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 font-medium" id="btn-quick-pref">
                My Profile
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
