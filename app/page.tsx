"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { LandingPage } from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";
import { Navbar } from "./components/Navbar";
import { MetricCards } from "./components/MetricCards";
import { OverviewSection } from "./components/OverviewSection";
import { BudgetSection } from "./components/BudgetSection";
import { TasksSection } from "./components/TasksSection";
import { TimelineSection } from "./components/TimelineSection";
import { VendorsSection } from "./components/VendorsSection";
import { HeroGenerator } from "./components/HeroGenerator";
import { AiAssistantModal } from "./components/AiAssistantModal";
import { ExportModal } from "./components/ExportModal";
import { initialEvents } from "./mockData";
import {
  EventPlan,
  BudgetItem,
  TaskItem,
  CalendarAlert,
  TimelineScheduleItem,
  Vendor,
} from "./types";
import {
  LayoutDashboard,
  DollarSign,
  CheckSquare,
  Calendar,
  Users,
  Sparkles,
  Wand2,
  Loader2,
  AlertCircle,
  X,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  // 1. NextAuth Session Hook
  const { data: session, status } = useSession();

  // Local demo fallback state for preview testing
  const [demoUser, setDemoUser] = useState<{
    name: string;
    email: string;
    image?: string;
  } | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Check URL query parameters for NextAuth status/errors on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      if (errorParam) {
        if (errorParam === "OAuthSignin" || errorParam === "OAuthCallback") {
          setAuthNotice(
            "Google sign-in was cancelled or encountered an OAuth handshake issue. You can try again or use Instant Demo Mode."
          );
        } else {
          setAuthNotice(`NextAuth status: ${errorParam}`);
        }
      }
    }
  }, []);

  // Workspace state
  const [events, setEvents] = useState<EventPlan[]>(initialEvents);
  const [activeEventId, setActiveEventId] = useState<string>(initialEvents[0].id);
  const [activeTab, setActiveTab] = useState<
    "overview" | "budget" | "tasks" | "timeline" | "vendors"
  >("overview");

  // Modals state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Determine active authenticated user (NextAuth session takes priority)
  const activeUser = session?.user
    ? {
        name: session.user.name || "Event Planner",
        email: session.user.email || "",
        image: session.user.image || undefined,
      }
    : demoUser;

  const isAuthenticated = status === "authenticated" || !!demoUser;

  // Active event plan
  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];

  const updateActiveEvent = (updates: Partial<EventPlan>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === activeEvent.id ? { ...e, ...updates } : e))
    );
  };

  const handlePlanGenerated = (newPlan: EventPlan) => {
    setEvents((prev) => [newPlan, ...prev]);
    setActiveEventId(newPlan.id);
    setActiveTab("overview");
  };

  const handleAuthSuccess = (u: { name: string; email: string; image?: string }) => {
    setDemoUser(u);
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    setDemoUser(null);
    if (session) {
      await signOut({ callbackUrl: "/" });
    }
  };

  // 1. LOADING SCREEN: Serene sage & mint pulse during NextAuth session resolution
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F5] text-[#2D3748] px-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white shadow-md shadow-[#10B981]/25">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#2D3748]">
            <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
            <span>Verifying NextAuth Session...</span>
          </div>
          <p className="text-xs text-[#718096]">
            Serene & focused event planning powered by Generative AI
          </p>
        </div>
      </div>
    );
  }

  // 2. UNAUTHENTICATED: Rich introductory landing page with NextAuth Google SSO & Demo options
  if (!isAuthenticated) {
    return (
      <>
        {/* Optional Auth Notice Banner */}
        {authNotice && (
          <div className="bg-[#E6F7F0] border-b border-[#A7F3D0] px-4 py-2.5 text-xs text-[#059669] flex items-center justify-between">
            <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#10B981]" />
              <span>{authNotice}</span>
              <button
                onClick={() => setAuthNotice(null)}
                className="ml-auto text-[#059669] hover:text-[#2D3748] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <LandingPage
          onOpenLogin={() => {
            setAuthMode("login");
            setAuthModalOpen(true);
          }}
          onOpenSignup={() => {
            setAuthMode("signup");
            setAuthModalOpen(true);
          }}
          onExploreDemo={() => {
            setDemoUser({
              name: "Elena Vance",
              email: "elena.vance@gmail.com",
            });
          }}
        />

        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // 3. AUTHENTICATED: Full Kordena GenAI Event Planner Workspace
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5] text-[#2D3748]">
      {/* Demo Mode Notice Banner if running under local guest demo */}
      {!session && demoUser && (
        <div className="bg-[#E6F7F0] border-b border-[#A7F3D0] px-4 py-2 text-xs text-[#059669] flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>
                <strong>Demo Mode Active:</strong> You are exploring as <em>{demoUser.name}</em>. Sign in with Google anytime to save your blueprints to the cloud.
              </span>
            </div>
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="px-2.5 py-1 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Navigation with NextAuth user info & controls */}
      <Navbar
        events={events}
        activeEvent={activeEvent}
        user={activeUser}
        onLogout={handleLogout}
        onSelectEvent={(ev) => setActiveEventId(ev.id)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Quick GenAI Prompt Inception Strip */}
        <div className="bg-[#FFFFFF] rounded-2xl p-3.5 sm:p-4 border border-[#E2ECE5] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#2D3748]">GenAI Event Studio: </span>
              <span className="text-[#718096]">
                Design or synthesize any event vision into an actionable sage & mint blueprint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-[#E6F7F0] hover:bg-[#A7F3D0]/60 text-[#059669] border border-[#A7F3D0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              id="prompt-to-event-btn"
            >
              <Wand2 className="w-3.5 h-3.5" /> Prompt-to-Event
            </button>
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="hidden sm:flex px-3.5 py-1.5 rounded-xl bg-[#F4F7F5] hover:bg-[#E2ECE5] text-[#2D3748] border border-[#E2ECE5] text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer"
              id="consult-copilot-strip-btn"
            >
              Consult Copilot
            </button>
          </div>
        </div>

        {/* 2. Three Visual Feedback Metric Cards (Tasks, Budget Bar, Calendar Alerts) */}
        <MetricCards
          event={activeEvent}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        {/* 3. Navigation Tabs Bar */}
        <div className="bg-[#FFFFFF] rounded-2xl p-1.5 border border-[#E2ECE5] shadow-xs flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Blueprint Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("budget")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "budget"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Budget Progress</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "budget"
                  ? "bg-white/20 text-white"
                  : "bg-[#E6F7F0] text-[#10B981]"
              }`}
            >
              ${activeEvent.budget.reduce((a, b) => a + b.spent, 0).toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "tasks"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Checklist & Tasks</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "tasks"
                  ? "bg-white/20 text-white"
                  : "bg-[#E6F7F0] text-[#10B981]"
              }`}
            >
              {activeEvent.tasks.filter((t) => t.completed).length}/{activeEvent.tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "timeline"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar Alerts</span>
            {activeEvent.alerts.filter((a) => !a.completed).length > 0 && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeTab === "timeline" ? "bg-white" : "bg-[#10B981] emerald-pulse"
                }`}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("vendors")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "vendors"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>AI Matchmaker</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "vendors"
                  ? "bg-white/20 text-white"
                  : "bg-[#E6F7F0] text-[#10B981]"
              }`}
            >
              {activeEvent.vendors.length}
            </span>
          </button>
        </div>

        {/* 4. Tab Content Panel */}
        <div className="transition-all duration-150">
          {activeTab === "overview" && (
            <OverviewSection
              event={activeEvent}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          )}

          {activeTab === "budget" && (
            <BudgetSection
              event={activeEvent}
              onUpdateBudget={(newBudget: BudgetItem[]) =>
                updateActiveEvent({ budget: newBudget })
              }
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          )}

          {activeTab === "tasks" && (
            <TasksSection
              event={activeEvent}
              onUpdateTasks={(newTasks: TaskItem[]) =>
                updateActiveEvent({ tasks: newTasks })
              }
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          )}

          {activeTab === "timeline" && (
            <TimelineSection
              event={activeEvent}
              onUpdateAlerts={(newAlerts: CalendarAlert[]) =>
                updateActiveEvent({ alerts: newAlerts })
              }
              onUpdateSchedule={(newSchedule: TimelineScheduleItem[]) =>
                updateActiveEvent({ schedule: newSchedule })
              }
            />
          )}

          {activeTab === "vendors" && (
            <VendorsSection
              event={activeEvent}
              onUpdateVendors={(newVendors: Vendor[]) =>
                updateActiveEvent({ vendors: newVendors })
              }
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Footer with Theme Palette Statement */}
      <footer className="mt-12 border-t border-[#E2ECE5] bg-[#FFFFFF] py-6 text-center text-xs text-[#718096]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2D3748]">Kordena</span>
            <span>— GenAI Event Architecture</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F4F7F5] border border-[#CBD5E1]" />
              60% Subtle Sage Tint (#F4F7F5)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF] border border-[#CBD5E1]" />
              30% White Surfaces & Slate Gray (#2D3748)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              10% Emerald Mint Accent (#10B981)
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <HeroGenerator
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onPlanGenerated={handlePlanGenerated}
      />

      <AiAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        event={activeEvent}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        event={activeEvent}
      />
    </div>
  );
}
