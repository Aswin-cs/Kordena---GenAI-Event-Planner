"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Sparkles, ShieldCheck, CheckCircle2, X, Loader2, ArrowRight, AlertCircle, PlayCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "signup";
  onClose: () => void;
  onSuccess: (user: { name: string; email: string; image?: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = "login",
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemoAccount, setSelectedDemoAccount] = useState<string>("elena.vance@gmail.com");

  if (!isOpen) return null;

  // Real NextAuth Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("NextAuth signIn error:", err);
      setError("Unable to initiate Google sign-in. Please verify your connection.");
      setLoading(false);
    }
  };

  // Instant Demo Sign-In (for quick testing without OAuth redirect)
  const handleDemoSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const isElena = selectedDemoAccount.startsWith("elena");
      onSuccess({
        name: isElena ? "Elena Vance" : "Sarath (Event Lead)",
        email: selectedDemoAccount,
      });
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D3748]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full border border-[#E2ECE5] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in duration-150 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#F4F7F5] text-[#718096] hover:text-[#2D3748] hover:bg-[#E2ECE5] flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
          aria-label="Close auth dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white mx-auto shadow-sm shadow-[#10B981]/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-[#2D3748]">
            {initialMode === "signup" ? "Get Started with Kordena" : "Sign in to Kordena"}
          </h3>
          <p className="text-xs text-[#718096]">
            Serene & focused event planning powered by Generative AI & NextAuth
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Section */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5] text-center space-y-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
              <ShieldCheck className="w-3.5 h-3.5" /> NextAuth Google SSO
            </span>
            <p className="text-xs text-[#2D3748] font-medium pt-1">
              Secure single sign-on with Google OAuth 2.0 and encrypted session cookies.
            </p>
          </div>

          {/* PRIMARY GOOGLE OAUTH BUTTON (Calls NextAuth) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FFFFFF] hover:bg-[#F4F7F5] border-2 border-[#E2ECE5] hover:border-[#10B981] text-[#2D3748] font-bold text-sm shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-3 relative group"
            id="google-oauth-signin-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#10B981]" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                {/* Official Google G Logo */}
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
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-[#718096] group-hover:text-[#10B981] group-hover:translate-x-1 transition-all ml-auto" />
              </>
            )}
          </button>

          {/* Quick Demo Option for local preview / developer testing */}
          <div className="pt-2">
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-[#E2ECE5]" />
              <span className="text-[10px] uppercase font-bold text-[#718096] tracking-wider">
                Or Instant Demo Preview
              </span>
              <div className="flex-1 h-px bg-[#E2ECE5]" />
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setSelectedDemoAccount("elena.vance@gmail.com")}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                  selectedDemoAccount === "elena.vance@gmail.com"
                    ? "border-[#10B981] bg-[#E6F7F0]/50"
                    : "border-[#E2ECE5] bg-[#FFFFFF] hover:bg-[#F4F7F5]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-[10px]">
                    E
                  </div>
                  <div>
                    <span className="font-semibold text-[#2D3748]">Elena Vance</span>
                    <span className="text-[10px] text-[#718096] ml-2">(elena.vance@gmail.com)</span>
                  </div>
                </div>
                {selectedDemoAccount === "elena.vance@gmail.com" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedDemoAccount("sarath.eventplanner@gmail.com")}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                  selectedDemoAccount === "sarath.eventplanner@gmail.com"
                    ? "border-[#10B981] bg-[#E6F7F0]/50"
                    : "border-[#E2ECE5] bg-[#FFFFFF] hover:bg-[#F4F7F5]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                    S
                  </div>
                  <div>
                    <span className="font-semibold text-[#2D3748]">Sarath (Event Lead)</span>
                    <span className="text-[10px] text-[#718096] ml-2">(sarath.eventplanner@gmail.com)</span>
                  </div>
                </div>
                {selectedDemoAccount === "sarath.eventplanner@gmail.com" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                )}
              </button>

              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={loading}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-[#F4F7F5] hover:bg-[#E2ECE5] text-[#2D3748] font-semibold text-xs border border-[#E2ECE5] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlayCircle className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Launch Selected Demo Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Terms Footer */}
        <div className="mt-5 pt-4 border-t border-[#E2ECE5]/70 text-center space-y-1">
          <p className="text-[11px] text-[#718096]">
            By continuing with Google, you accept Kordena&apos;s Terms of Service and Privacy Policy.
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-[#718096]">
            <span>🔒 256-Bit SSL</span>
            <span>•</span>
            <span>OAuth 2.0 Protocol</span>
            <span>•</span>
            <span>Zero Password Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
