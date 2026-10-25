"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Stepper, { Step } from "./Stepper";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Bell,
  Wand2,
  Calendar,
  Users,
  ShieldCheck,
  Bot,
  Layers,
  ChevronRight,
  Star,
  LogIn,
  UserPlus,
  Loader2,
  Check,
} from "lucide-react";

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenSignup,
}) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [stepperName, setStepperName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Professional Suite");
  const [selectedEventType, setSelectedEventType] = useState("Corporate Summit");

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Direct Google sign-in failed:", err);
      setGoogleLoading(false);
      onOpenLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5] text-[#2D3748]">
      {/* 1. Header Navigation for Unauthenticated Users */}
      <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E2ECE5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white shadow-sm shadow-[#10B981]/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#2D3748]">
                  Kordena
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
                  GenAI Planner
                </span>
              </div>
              <p className="text-xs text-[#718096] hidden sm:block">
                Serene, Balanced & Focused Event Architecture
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-semibold text-[#718096]">
            <a href="#features" className="hover:text-[#10B981] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#10B981] transition-colors">
              How It Works
            </a>
            <a href="#stepper" className="hover:text-[#10B981] transition-colors">
              Interactive Stepper
            </a>
          </nav>

          {/* Unauthenticated User Auth Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#2D3748] hover:text-[#10B981] hover:bg-[#E6F7F0]/60 border border-[#E2ECE5] transition-all cursor-pointer shadow-2xs"
              id="landing-login-btn"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              )}
              <span>{googleLoading ? "Signing In..." : "Sign in with Google"}</span>
            </button>

            <button
              onClick={onOpenSignup}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs sm:text-sm font-semibold hover:bg-[#059669] transition-all cursor-pointer shadow-sm shadow-[#10B981]/30"
              id="landing-signup-btn"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Get Started</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-18 sm:pt-16 sm:pb-24">
        {/* Subtle decorative background blur in mint & sage */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#10B981]/15 via-[#E6F7F0]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6 sm:space-y-8">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E2ECE5] shadow-xs text-xs font-semibold text-[#2D3748]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] emerald-pulse" />
            <span>GenAI Event Planning • Fresh Sage & Mint Design</span>
            <span className="text-[#10B981]">•</span>
            <span className="text-[#059669]">Serene & Focused</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#2D3748] tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Design Extraordinary Gatherings with{" "}
            <span className="text-[#10B981] relative inline-block">
              Generative AI
              <svg
                className="absolute left-0 -bottom-2 w-full h-2 text-[#A7F3D0]"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path d="M0,5 Q50,0 100,5" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>{" "}
            and Total Serenity.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-[#718096] max-w-2xl mx-auto font-normal leading-relaxed">
            From your raw initial prompt to the final standing ovation: Kordena synthesizes
            balanced budgets, milestone schedules, verified vendor matches, and calm task execution.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] transition-all cursor-pointer shadow-md shadow-[#10B981]/30 flex items-center justify-center gap-2 group"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
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
              )}
              <span>{googleLoading ? "Starting Sign In..." : "Get Started with Google"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#stepper"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#FFFFFF] text-[#2D3748] border border-[#E2ECE5] text-sm font-bold hover:border-[#10B981] hover:bg-[#F4F7F5] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              <span>Interactive Setup Stepper</span>
            </a>
          </div>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-[#718096]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Google OAuth Single Sign-On
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Instant GenAI blueprint
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Serene 60-30-10 palette
            </span>
          </div>
        </div>
      </section>

      {/* 3. React Bits Stepper Component Integration (Replaces demo content) */}
      <section id="stepper" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
            <Sparkles className="w-3.5 h-3.5" /> React Bits &bull; Interactive Stepper
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D3748]">
            Configure Your Event Workspace in 4 Easy Steps
          </h2>
          <p className="text-xs sm:text-sm text-[#718096]">
            Walk through the serene onboarding flow powered by the fluid, animated Stepper component.
          </p>
        </div>

        <div className="flex justify-center w-full">
          <Stepper
            initialStep={1}
            onStepChange={step => console.log("Stepper step changed to:", step)}
            onFinalStepCompleted={() => {
              console.log("All steps completed!");
              handleGoogleSignIn();
            }}
            backButtonText="Back"
            nextButtonText="Continue"
            completeButtonText="Place order & Launch"
            orientation="vertical"
            width={640}
            theme="light"
            accentColor="#10B981"
            radius={24}
            className="border border-[#E2ECE5] shadow-lg bg-[#FFFFFF]/90"
          >
            {/* Step 1: Welcome */}
            <Step title="Welcome">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#2D3748]">Welcome aboard</h3>
                  <p className="text-xs sm:text-sm text-[#718096]">
                    Set up your workspace in a few quick steps.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-[#2D3748]">
                    Select Event Vision
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "Corporate Summit", icon: "🏢", desc: "Keynotes & networking" },
                      { name: "Tech Launch", icon: "🚀", desc: "Interactive demos" },
                      { name: "Serene Gala", icon: "✨", desc: "Dinner & banquet" },
                      { name: "Private Retreat", icon: "🌿", desc: "Leadership summit" },
                    ].map(item => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedEventType(item.name)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedEventType === item.name
                            ? "border-[#10B981] bg-[#E6F7F0]/60 shadow-xs"
                            : "border-[#E2ECE5] bg-white hover:bg-[#F4F7F5]"
                        }`}
                      >
                        <div className="text-lg mb-1">{item.icon}</div>
                        <p className="text-xs font-bold text-[#2D3748]">{item.name}</p>
                        <p className="text-[11px] text-[#718096]">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 2: Plan */}
            <Step title="Plan">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#2D3748]">Choose a plan</h3>
                  <p className="text-xs sm:text-sm text-[#718096]">
                    You can change this at any time.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  {[
                    {
                      name: "Starter AI Blueprint",
                      tag: "Free Trial",
                      desc: "Core budgeting, milestone schedules, and basic vendor directory.",
                    },
                    {
                      name: "Professional Suite",
                      tag: "Recommended",
                      desc: "Unlimited AI generations, Kordena Copilot, budget alert triggers.",
                    },
                    {
                      name: "Enterprise Architecture",
                      tag: "Multi-Team",
                      desc: "Custom vendor contracts, dedicated concierge, and real-time sync.",
                    },
                  ].map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setSelectedPlan(p.name)}
                      className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                        selectedPlan === p.name
                          ? "border-[#10B981] bg-[#E6F7F0]/60 shadow-xs"
                          : "border-[#E2ECE5] bg-white hover:bg-[#F4F7F5]"
                      }`}
                    >
                      <div className="pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2D3748]">{p.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F7F0] text-[#059669]">
                            {p.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#718096] mt-0.5">{p.desc}</p>
                      </div>
                      {selectedPlan === p.name && (
                        <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            {/* Step 3: Profile */}
            <Step title="Profile">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#2D3748]">What should we call you?</h3>
                  <p className="text-xs sm:text-sm text-[#718096]">
                    Provide your name or event organization handle.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#2D3748] mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={stepperName}
                      onChange={e => setStepperName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2ECE5] focus:outline-none focus:border-[#10B981] text-xs sm:text-sm text-[#2D3748] shadow-xs"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs text-[#718096]">
                    💡 <em>Tip:</em> Once your workspace opens, you can prompt Kordena Copilot anytime to auto-generate timelines, vendor matches, and budgets.
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 4: Review */}
            <Step title="Review">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#2D3748]">Looking good</h3>
                  <p className="text-xs sm:text-sm text-[#718096]">
                    Complete setup to open your workspace.
                  </p>
                </div>

                <div className="bg-[#F4F7F5] p-4 rounded-2xl border border-[#E2ECE5] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#718096]">Planner Handle:</span>
                    <strong className="text-[#2D3748]">{stepperName || "Lead Architect"}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#718096]">Event Vision:</span>
                    <strong className="text-[#2D3748]">{selectedEventType}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#718096]">Workspace Tier:</span>
                    <strong className="text-[#10B981]">{selectedPlan}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E2ECE5]">
                    <span className="text-[#718096]">Authentication:</span>
                    <span className="font-semibold text-[#2D3748] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> Google OAuth 2.0
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full py-3 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-md shadow-[#10B981]/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Complete Setup with Google SSO</span>
                  </button>
                </div>
              </div>
            </Step>
          </Stepper>
        </div>
      </section>

      {/* 4. Features Bento Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
            Intelligent Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D3748]">
            Engineered for Calm, Flawless Event Planning
          </h2>
          <p className="text-xs sm:text-sm text-[#718096]">
            Every feature in Kordena is purposefully designed to eliminate chaos and keep event leaders balanced and focused.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-7 border border-[#E2ECE5] shadow-xs space-y-3 hover:border-[#10B981]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D3748]">Prompt-to-Event Synthesis</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              Describe your occasion in natural language and receive a comprehensive blueprint complete with timelines, cost projections, and supplier recommendations.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-7 border border-[#E2ECE5] shadow-xs space-y-3 hover:border-[#10B981]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D3748]">Dynamic Budget Intelligence</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              Prevent surprise expenses with real-time budget distribution, spent-vs-allocated ratios, and automated safety cushion calculations.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-7 border border-[#E2ECE5] shadow-xs space-y-3 hover:border-[#10B981]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D3748]">AI Supplier Matchmaker</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              Discover verified caterers, audio-visual masters, and scenic designers scored specifically against your vibe and budget.
            </p>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="bg-[#FFFFFF] border-y border-[#E2ECE5] py-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              Simple Three-Step Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D3748]">
              From Raw Concept to Flawless Execution
            </h2>
            <p className="text-xs sm:text-sm text-[#718096]">
              A structured workflow designed to preserve mental peace at every milestone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative space-y-3 p-5 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5]">
              <span className="w-8 h-8 rounded-full bg-[#10B981] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                01
              </span>
              <h4 className="text-base font-bold text-[#2D3748]">Seed Your Vision</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                Enter your event archetype, target guest count, date, and atmosphere parameters into Kordena&apos;s GenAI generator.
              </p>
            </div>

            <div className="relative space-y-3 p-5 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5]">
              <span className="w-8 h-8 rounded-full bg-[#10B981] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                02
              </span>
              <h4 className="text-base font-bold text-[#2D3748]">Refine with Copilot</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                Consult the embedded Kordena Copilot to adjust schedules, reallocate budget categories, and fine-tune team responsibilities.
              </p>
            </div>

            <div className="relative space-y-3 p-5 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5]">
              <span className="w-8 h-8 rounded-full bg-[#10B981] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                03
              </span>
              <h4 className="text-base font-bold text-[#2D3748]">Export & Orchestrate</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                Download a polished executive brief in PDF, CSV, or Markdown format, ready to share with stakeholders and vendors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonial Quote */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F7F0]/40 border border-[#E2ECE5] shadow-xs space-y-6">
          <div className="flex justify-center gap-1 text-[#10B981]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>

          <p className="text-sm sm:text-base font-medium text-[#2D3748] italic max-w-2xl mx-auto leading-relaxed">
            &ldquo;Kordena brought an immense sense of serenity to our flagship international summit. The GenAI-synthesized schedule and budget bars gave our team instant clarity and absolute peace of mind.&rdquo;
          </p>

          <p className="text-xs text-[#718096] font-semibold">
            — Julian Montgomery, Executive Director at Apex Horizons
          </p>
        </div>
      </section>

      {/* 7. Bottom Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6 w-full">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2D3748] tracking-tight">
          Ready to experience serene, AI-guided event planning?
        </h2>
        <p className="text-xs sm:text-sm text-[#718096] max-w-xl mx-auto">
          Join thousands of event creators crafting balanced, memorable gatherings with Kordena.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] transition-all cursor-pointer shadow-md shadow-[#10B981]/30 flex items-center justify-center gap-2.5"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
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
            )}
            <span>{googleLoading ? "Starting Sign In..." : "Continue with Google"}</span>
          </button>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto border-t border-[#E2ECE5] bg-[#FFFFFF] py-8 text-xs text-[#718096]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2D3748]">Kordena</span>
            <span>— GenAI Event Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F4F7F5] border border-[#CBD5E1]" />
              60% Subtle Sage Tint (#F4F7F5)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF] border border-[#CBD5E1]" />
              30% Crisp White & Slate Gray (#2D3748)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              10% Emerald Accent (#10B981)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
