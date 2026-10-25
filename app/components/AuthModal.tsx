"use client";

import React, { useState } from "react";
import { Sparkles, Mail, Lock, User, ArrowRight, CheckCircle2, X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "signup";
  onClose: () => void;
  onSuccess: (user: { name: string; email: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = "login",
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onSuccess({
        name: name.trim() || (email.split("@")[0] ? email.split("@")[0] : "Elena Vance"),
        email: email.trim() || "planner@kordena.ai",
      });
      onClose();
    }, 600);
  };

  const handleGuestDemo = () => {
    onSuccess({
      name: "Guest Planner",
      email: "demo@kordena.ai",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D3748]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full border border-[#E2ECE5] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in duration-150 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#F4F7F5] text-[#718096] hover:text-[#2D3748] hover:bg-[#E2ECE5] flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white mx-auto shadow-sm shadow-[#10B981]/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-[#2D3748]">
            {mode === "login" ? "Welcome back to Kordena" : "Create your Kordena account"}
          </h3>
          <p className="text-xs text-[#718096]">
            {mode === "login"
              ? "Access your serene GenAI event planning workspace"
              : "Start designing balanced and focused events with GenAI"}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-2xl bg-[#F4F7F5] p-1 border border-[#E2ECE5] mb-5">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === "login"
                ? "bg-[#FFFFFF] text-[#2D3748] shadow-xs"
                : "text-[#718096] hover:text-[#2D3748]"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-[#FFFFFF] text-[#2D3748] shadow-xs"
                : "text-[#718096] hover:text-[#2D3748]"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-[#718096] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elena Vance"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981] transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#718096] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="planner@kordena.ai"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981] transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#718096] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981] transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#10B981] text-white text-xs sm:text-sm font-semibold hover:bg-[#059669] transition-all cursor-pointer shadow-sm shadow-[#10B981]/30 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              "Authenticating..."
            ) : mode === "login" ? (
              <>
                Sign In to Kordena <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Create Free Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2ECE5]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#FFFFFF] px-2 text-[#718096] font-semibold">
              Or explore instantly
            </span>
          </div>
        </div>

        {/* Guest Demo Bypass */}
        <button
          type="button"
          onClick={handleGuestDemo}
          className="w-full py-2.5 rounded-xl bg-[#E6F7F0] border border-[#A7F3D0] text-xs font-semibold text-[#059669] hover:bg-[#A7F3D0]/60 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
          Continue with Live Interactive Demo
        </button>

        <p className="text-[11px] text-center text-[#718096] mt-4">
          By signing in, you agree to Kordena&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
