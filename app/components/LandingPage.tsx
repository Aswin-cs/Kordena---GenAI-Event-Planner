"use client";

import React from "react";
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
} from "lucide-react";

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenSignup,
  onExploreDemo,
}) => {
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
            <a href="#preview" className="hover:text-[#10B981] transition-colors">
              Aesthetic Showcase
            </a>
            <button
              onClick={onExploreDemo}
              className="text-[#10B981] hover:text-[#059669] transition-colors cursor-pointer"
            >
              Live Demo
            </button>
          </nav>

          {/* Unauthenticated User Auth Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#2D3748] hover:text-[#10B981] hover:bg-[#E6F7F0]/60 border border-[#E2ECE5] transition-all cursor-pointer shadow-2xs"
              id="landing-login-btn"
            >
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
              <span>Sign in with Google</span>
            </button>

            <button
              onClick={onExploreDemo}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs sm:text-sm font-semibold hover:bg-[#059669] transition-all cursor-pointer shadow-sm shadow-[#10B981]/30"
              id="landing-demo-btn"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Try Demo</span>
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
              onClick={onOpenSignup}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] transition-all cursor-pointer shadow-md shadow-[#10B981]/30 flex items-center justify-center gap-2 group"
            >
              <span>Get Started with Google</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#FFFFFF] text-[#2D3748] border border-[#E2ECE5] text-sm font-bold hover:border-[#10B981] hover:bg-[#F4F7F5] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              <span>Explore Live Interactive Demo</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-[#718096]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> No credit card required
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

      {/* 3. Live Dashboard Interactive Preview Showcase (Addressing the 3 visual feedback focal points) */}
      <section id="preview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E2ECE5] shadow-lg relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2ECE5]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">
                Interactive Workspace Showcase
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2D3748]">
                Clear Visual Feedback Across Every Dimension
              </h2>
            </div>
            <button
              onClick={onExploreDemo}
              className="px-4 py-2 rounded-xl bg-[#E6F7F0] border border-[#A7F3D0] text-xs font-semibold text-[#059669] hover:bg-[#A7F3D0]/60 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
            >
              <span>Launch Full Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Feature Metric Cards Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Completed Tasks Feedback */}
            <div className="bg-[#F4F7F5] rounded-2xl p-5 border border-[#E2ECE5] space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#718096]">
                      Completed Tasks
                    </h4>
                    <p className="text-base font-bold text-[#2D3748]">
                      Clear Mint Visual Feedback
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
                  14/18 Done
                </span>
              </div>
              <p className="text-xs text-[#718096] leading-relaxed">
                Check off milestones with satisfying emerald checkmarks, instant progress ring updates, and zero cognitive clutter.
              </p>
              <div className="w-full h-2.5 bg-[#FFFFFF] rounded-full overflow-hidden border border-[#E2ECE5]">
                <div className="w-[78%] h-full bg-[#10B981] rounded-full" />
              </div>
            </div>

            {/* Card 2: Budget Progress Bar */}
            <div className="bg-[#F4F7F5] rounded-2xl p-5 border border-[#E2ECE5] space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#718096]">
                      Budget Progress
                    </h4>
                    <p className="text-base font-bold text-[#2D3748]">
                      Real-Time Progress Bar
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
                  $37.8k / $45k
                </span>
              </div>
              <p className="text-xs text-[#718096] leading-relaxed">
                Dynamic visual indicator displaying spent allocation vs. safety cushion, preventing unexpected budget overruns.
              </p>
              <div className="w-full h-2.5 bg-[#FFFFFF] rounded-full overflow-hidden border border-[#E2ECE5]">
                <div className="w-[84%] h-full bg-gradient-to-r from-[#34D399] to-[#10B981] rounded-full" />
              </div>
            </div>

            {/* Card 3: Calendar Alerts */}
            <div className="bg-[#F4F7F5] rounded-2xl p-5 border border-[#E2ECE5] space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#718096]">
                      Calendar Alerts
                    </h4>
                    <p className="text-base font-bold text-[#2D3748]">
                      Predictive Deadlines
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
                  T-3 Days
                </span>
              </div>
              <p className="text-xs text-[#718096] leading-relaxed">
                Automated alerts for final catering headcounts, insurance certificates, and spatial audio dry runs.
              </p>
              <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2ECE5] flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#10B981] emerald-pulse" />
                <span className="font-semibold text-[#2D3748] truncate">
                  Final Dietary Lock with Chef Danielle
                </span>
              </div>
            </div>
          </div>
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
            <h3 className="text-base font-bold text-[#2D3748]">
              Prompt-to-Blueprint GenAI
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
              Type any concept—from a 180-guest botanical summit to an intimate Napa vineyard wedding—and Kordena generates a complete operational blueprint in seconds.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-7 border border-[#E2ECE5] shadow-xs space-y-3 hover:border-[#10B981]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D3748]">
              60-30-10 Smart Budget Ledger
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
              Automatically segments your expenditure across venue, culinary hospitality, spatial design, and emergency reserve with live progress meter feedback.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-7 border border-[#E2ECE5] shadow-xs space-y-3 hover:border-[#10B981]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D3748]">
              AI Vendor Matchmaker
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
              Vets and pairs partners based on your aesthetic vibe, capacity, and budget tier, complete with pre-drafted inquiry messages ready to send.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-7 border border-[#E2ECE5] shadow-xs space-y-3 hover:border-[#10B981]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D3748]">
              Day-of Run-of-Show
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
              Minute-by-minute operational sequence mapping responsibilities, vendor arrivals, keynote cues, and guest transitions seamlessly.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-7 border border-[#E2ECE5] shadow-xs space-y-3 hover:border-[#10B981]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D3748]">
              Kordena AI Copilot Assistant
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
              On-demand intelligent advisor to rebalance budgets, draft personalized attendee invitations, and resolve acoustic or culinary questions.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-7 border border-[#E2ECE5] shadow-xs space-y-3 hover:border-[#10B981]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D3748]">
              One-Click Executive Brief Export
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
              Export clean, printable markdown summaries formatted for corporate executive committees, wedding parties, and venue operators.
            </p>
          </div>
        </div>
      </section>

      {/* 5. How It Works Workflow (3 Steps) */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="bg-[#FFFFFF] rounded-3xl p-8 sm:p-12 border border-[#E2ECE5] shadow-xs space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              Serene Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3748]">
              From Concept to Execution in 3 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="space-y-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5] text-[#10B981] font-bold text-base flex items-center justify-center">
                1
              </div>
              <h4 className="text-base font-bold text-[#2D3748]">
                Describe Your Event Vision
              </h4>
              <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
                Provide guest count, budget range, and vibe. Kordena accepts natural language prompts and quick presets.
              </p>
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5] text-[#10B981] font-bold text-base flex items-center justify-center">
                2
              </div>
              <h4 className="text-base font-bold text-[#2D3748]">
                GenAI Synthesizes the Master Plan
              </h4>
              <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
                The neural planner balances budget categories, schedules milestone calendar alerts, and matches curated vendors.
              </p>
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5] text-[#10B981] font-bold text-base flex items-center justify-center">
                3
              </div>
              <h4 className="text-base font-bold text-[#2D3748]">
                Orchestrate with Serene Focus
              </h4>
              <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
                Track checklist execution with clear emerald feedback, manage day-of run-of-show, and consult your copilot anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonial / Social Proof */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="bg-[#E6F7F0]/40 rounded-3xl p-8 sm:p-10 border border-[#A7F3D0] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm sm:text-base font-medium text-[#2D3748] italic leading-relaxed">
              &ldquo;Kordena brought an incredible sense of clarity and serenity to our 200-person tech symposium. The Fresh Sage interface and real-time budget feedback saved us countless hours of spreadsheet friction.&rdquo;
            </p>
            <p className="text-xs text-[#718096] font-semibold">
              — Julian Montgomery, Executive Director at Apex Horizons
            </p>
          </div>

          <button
            onClick={onOpenSignup}
            className="px-6 py-3 rounded-2xl bg-[#10B981] text-white text-xs sm:text-sm font-bold hover:bg-[#059669] transition-all cursor-pointer shadow-md shadow-[#10B981]/25 shrink-0"
          >
            Create Your First Event Free
          </button>
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
            onClick={onOpenLogin}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] transition-all cursor-pointer shadow-md shadow-[#10B981]/30 flex items-center justify-center gap-2.5"
          >
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
            <span>Continue with Google</span>
          </button>

          <button
            onClick={onExploreDemo}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#FFFFFF] text-[#2D3748] border border-[#E2ECE5] text-sm font-bold hover:border-[#10B981] hover:bg-[#F4F7F5] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <span>Explore Demo Workspace</span>
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
