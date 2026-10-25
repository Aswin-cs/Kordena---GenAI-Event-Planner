"use client";

import React, { useState } from "react";
import { AuthModal } from "./components/AuthModal";
import { LogOut, Sparkles } from "lucide-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleAuthSuccess = (authenticatedUser: { name: string; email: string }) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  // 1. UNAUTHORIZED USER: Plain blank page with title "Hi" & Google OAuth only (no demo/mockup)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F5] text-[#2D3748] px-4">
        <main className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-8 sm:p-10 border border-[#E2ECE5] shadow-xs text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold tracking-tight text-[#2D3748]">
              Hi
            </h1>
            <p className="text-xs sm:text-sm text-[#718096]">
              Welcome to Kordena • GenAI Event Planner
            </p>
          </div>

          {/* Google OAuth Sign In Button Only */}
          <div className="pt-2">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#FFFFFF] hover:bg-[#F4F7F5] border-2 border-[#E2ECE5] hover:border-[#10B981] text-[#2D3748] font-bold text-sm shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-3 group"
              id="unauthorized-google-signin-btn"
            >
              {/* Official Google 'G' Logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          <p className="text-[11px] text-[#718096] pt-1">
            Authentication is required. No demo access.
          </p>
        </main>

        <AuthModal
          isOpen={authModalOpen}
          initialMode="login"
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // 2. AUTHORIZED USER: Plain blank page with title "Hi" (or "Hi, Name") & Sign Out
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5] text-[#2D3748]">
      {/* Minimal Top Bar */}
      <header className="w-full bg-[#FFFFFF] border-b border-[#E2ECE5] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base text-[#2D3748]">Kordena</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs">
            <div className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <span className="font-semibold text-[#2D3748] hidden sm:inline">{user?.name}</span>
            <span className="text-[#718096] text-[11px] hidden md:inline">({user?.email})</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Plain Blank Canvas with Title "Hi" */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <h1 className="text-6xl font-extrabold text-[#2D3748] tracking-tight">
            Hi
          </h1>
          <p className="text-sm text-[#718096]">
            Welcome back, <strong className="text-[#2D3748]">{user?.name || "Event Planner"}</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}
