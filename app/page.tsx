"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSession, signOut } from "next-auth/react";
import { LandingPage } from "./components/LandingPage";
import { EventPlan } from "./types";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  LogOut,
  Calendar as CalendarIcon,
  CheckCircle2,
} from "lucide-react";
import { BlueprintCreationStepper } from "./components/BlueprintCreationStepper";
import { EventHistories } from "./components/EventHistories";
import { AiEvaluationResponse } from "./api/ai-evaluate/route";
import { parseDateForInput, normalizeEventType, validateEventParameters } from "@/lib/calendar-utils";

// Optimize initial bundle size and memory by code-splitting heavy components
const EventCalendarView = dynamic(
  () => import("./components/EventCalendarView").then((m) => m.EventCalendarView),
  {
    loading: () => (
      <div className="flex-1 min-h-[450px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-[28px] border border-[#F7D6DF]">
        <div className="w-8 h-8 border-2 border-[#F7D6DF] border-t-[#D44372] rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#2E131E]">Loading Calendar UI...</p>
      </div>
    ),
  }
);

const AuthModal = dynamic(
  () => import("./components/AuthModal").then((m) => m.AuthModal)
);

export default function Home() {
  // 1. NextAuth Session Hook
  const { data: session, status } = useSession();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // View state: 'stepper' or 'calendar'
  const [viewMode, setViewMode] = useState<"stepper" | "calendar">("stepper");

  // Stepper input states requested by user
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Conference");
  const [eventBudget, setEventBudget] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("100");
  const [selectedPlan] = useState("Professional Suite");
  const [eventTier, setEventTier] = useState<"Starter" | "Basic" | "Professional">("Starter");
  const [planningItems, setPlanningItems] = useState<string[]>([]);
  const [currentPlanningInput, setCurrentPlanningInput] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [stepperKey, setStepperKey] = useState(0);
  const [stepperCurrentStep, setStepperCurrentStep] = useState(1);

  // Tomorrow's date for datepicker min attribute
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  // Validation across stepper steps
  const validation = useMemo(() => {
    return validateEventParameters({
      eventName,
      eventType,
      eventBudget,
      eventDate,
      guestCount,
      planningItems,
    });
  }, [eventName, eventType, eventBudget, eventDate, guestCount, planningItems]);

  // AI Evaluation Stepper states
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [aiEvaluationData, setAiEvaluationData] = useState<AiEvaluationResponse | null>(null);
  const [aiEvalError, setAiEvalError] = useState<string | null>(null);
  const [savedOperations, setSavedOperations] = useState<{
    prepCalendarTasks?: any[];
    dayOfRunOfShow?: any[];
    budgetBreakdown?: any[];
    evaluationSummary?: any;
    plannedItems?: string[];
  } | null>(null);

  const handleAddPlanningItem = useCallback(() => {
    const trimmed = currentPlanningInput.trim();
    if (!trimmed) return;
    setPlanningItems((prev) => [...prev, trimmed]);
    setCurrentPlanningInput("");
  }, [currentPlanningInput]);

  const handleRemovePlanningItem = useCallback((indexToRemove: number) => {
    setPlanningItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }, []);

  const handleStartNewEvent = useCallback(() => {
    setEventName("");
    setEventType("Conference");
    setEventBudget("");
    setEventDate("");
    setGuestCount("100");
    setEventTier("Starter");
    setPlanningItems([]);
    setCurrentPlanningInput("");
    setIsCompleted(false);
    setAiEvaluationData(null);
    setSavedOperations(null);
    setAiEvalError(null);
    setStepperCurrentStep(1);
    setStepperKey((prev) => prev + 1);
    setViewMode("stepper");
  }, []);

  // Check URL query parameters for NextAuth status/errors on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      if (errorParam) {
        if (errorParam === "OAuthSignin" || errorParam === "OAuthCallback") {
          setAuthNotice(
            "Google sign-in was cancelled or encountered an OAuth handshake issue. Please try signing in again."
          );
        } else {
          setAuthNotice(`NextAuth status: ${errorParam}`);
        }
      }
    }
  }, []);

  // Workspace state (initialized empty so no unwanted static mock data is shown)
  const [events, setEvents] = useState<EventPlan[]>([]);
  const [activeEventId, setActiveEventId] = useState<string>("");

  // Active authenticated user from NextAuth session
  const activeUser = useMemo(() => {
    if (!session?.user) return null;
    return {
      name: session.user.name || "Event Planner",
      email: session.user.email || "",
      image: session.user.image || undefined,
    };
  }, [session]);

  const isAuthenticated = status === "authenticated";

  // Active event plan
  const activeEvent = useMemo(
    () => events.find((e) => e.id === activeEventId) || events[0],
    [events, activeEventId]
  );

  // Fetch real saved event blueprints from database
  useEffect(() => {
    let isMounted = true;
    fetch("/api/user-status")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data.success || !Array.isArray(data.userStatuses)) return;
        const loadedPlans: EventPlan[] = data.userStatuses.map((us: any) => ({
          id: us._id || `event-${Date.now()}-${Math.random()}`,
          title: us.eventName || "Untitled Event",
          tagline:
            us.evaluationSummary?.eventVibe ||
            us.aiSummary ||
            `${us.eventType || "Event"} architected with Kordena GenAI`,
          eventType: us.eventType || "Conference",
          date: us.endDate ? new Date(us.endDate).toISOString().split("T")[0] : "",
          location: "Main Venue",
          guestCount: us.guestCount || 100,
          totalBudget: us.budget || 50000,
          aiVibeSummary: us.evaluationSummary?.eventVibe || us.aiSummary || "",
          paletteDescription: "",
          tasks: (us.prepCalendarTasks || []).map((t: any, idx: number) => ({
            id: t.id || `t-${idx}`,
            title: t.title || "Task",
            category: "Program",
            deadline: "",
            completed: false,
            priority: t.priority === "high" ? "High" : t.priority === "medium" ? "Medium" : "Low",
          })),
          budget: (us.budgetBreakdown || []).map((b: any, idx: number) => ({
            id: `b-${idx}`,
            category: b.category,
            allocated: b.allocatedAmount || 0,
            spent: 0,
            notes: b.spendStrategy || "",
          })),
          alerts: [],
          vendors: [],
          schedule: (us.dayOfRunOfShow || []).map((s: any, idx: number) => ({
            id: `s-${idx}`,
            time: s.timeSlot || "",
            title: s.activity || "",
            duration: "",
            responsible: s.departmentInCharge || "",
            status: "Pending",
          })),
          aiSuggestions: [],
        }));
        if (loadedPlans.length > 0) {
          setEvents(loadedPlans);
          setActiveEventId((prev) => prev || loadedPlans[0].id);
        }
      })
      .catch((err) => console.warn("Failed to load user events:", err));
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // 1. Trigger AI Evaluation route after initial stepper review
  const handleTriggerAiEvaluation = useCallback(async () => {
    if (!validation.isValid) {
      setAiEvalError(
        `Cannot submit: Missing required details (${validation.missingFields.join(", ")}). Please complete them to proceed.`
      );
      return;
    }

    setIsAiEvaluating(true);
    setAiEvalError(null);

    try {
      const response = await fetch("/api/ai-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: eventName.trim(),
          eventType,
          budget: Number(eventBudget),
          guestCount: Number(guestCount),
          eventDate,
          endDate: eventDate,
          tier: eventTier,
          leadOrganizer: activeUser?.name || "Planner",
          planningItems,
          plannedItems: planningItems,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to analyze event with AI");
      }

      setAiEvaluationData(data);
      const ops = {
        prepCalendarTasks: data.prepCalendarTasks || [],
        dayOfRunOfShow: data.dayOfRunOfShow || [],
        budgetBreakdown: data.budgetBreakdown || [],
        evaluationSummary: data.evaluationSummary,
        plannedItems: planningItems,
      };
      setSavedOperations(ops);

      // Directly save full event architecture and AI operations to MongoDB via /api/user-status
      try {
        await fetch("/api/user-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName: eventName.trim(),
            eventType,
            tier: eventTier,
            budget: Number(eventBudget),
            guestCount: Number(guestCount),
            plannedItems: planningItems,
            endDate: eventDate,
            selectedPlan,
            evaluationSummary: data.evaluationSummary,
            budgetBreakdown: data.budgetBreakdown,
            prepCalendarTasks: data.prepCalendarTasks,
            dayOfRunOfShow: data.dayOfRunOfShow,
            requirements: planningItems,
            aiResponse: data,
          }),
        });
      } catch (saveErr) {
        console.warn("Could not auto-save user status:", saveErr);
      }

      // Add to event history
      if (eventName.trim()) {
        const newPlan: EventPlan = {
          id: `event-${Date.now()}`,
          title: eventName,
          tagline:
            data.evaluationSummary?.eventVibe ||
            `${eventType} architected with Kordena GenAI`,
          eventType: eventType,
          date: eventDate || new Date().toISOString().split("T")[0],
          location: activeEvent?.location || "Main Venue",
          totalBudget: Number(eventBudget) || 250000,
          guestCount: Number(guestCount) || 100,
          aiVibeSummary: data.evaluationSummary?.eventVibe || activeEvent?.aiVibeSummary || "",
          paletteDescription: activeEvent?.paletteDescription || "",
          tasks: activeEvent?.tasks || [],
          budget: activeEvent?.budget || [],
          alerts: activeEvent?.alerts || [],
          vendors: activeEvent?.vendors || [],
          schedule: activeEvent?.schedule || [],
          aiSuggestions: activeEvent?.aiSuggestions || [],
        };
        setEvents((prev) => [newPlan, ...prev]);
        setActiveEventId(newPlan.id);
      }

      // Directly go to calendar UI
      setIsCompleted(true);
      setViewMode("calendar");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("AI Evaluation error:", err);
      setAiEvalError(
        err?.message || "Could not complete AI evaluation. Please verify your inputs and try again."
      );
    } finally {
      setIsAiEvaluating(false);
    }
  }, [
    eventName,
    eventType,
    eventBudget,
    guestCount,
    eventDate,
    eventTier,
    activeUser?.name,
    planningItems,
    selectedPlan,
    activeEvent,
    validation,
  ]);

  const handleSelectEventFromHistory = useCallback((ev: EventPlan) => {
    setActiveEventId(ev.id);
    setEventName(ev.title);
    setEventType(normalizeEventType(ev.eventType));
    setEventBudget(ev.totalBudget ? String(ev.totalBudget) : "");
    setEventDate(parseDateForInput(ev.date));
    setIsCompleted(false);
    setAiEvaluationData(null);
    setAiEvalError(null);
    setStepperCurrentStep(1);
    setStepperKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleOpenCalendarFromHistory = useCallback((ev: EventPlan) => {
    setActiveEventId(ev.id);
    setEventName(ev.title);
    setEventType(normalizeEventType(ev.eventType));
    setEventBudget(ev.totalBudget ? String(ev.totalBudget) : "");
    setEventDate(parseDateForInput(ev.date) || ev.date);
    setIsCompleted(true);
    setViewMode("calendar");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteEventFromHistory = useCallback(async (eventId: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    try {
      await fetch(`/api/user-status?id=${encodeURIComponent(eventId)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Could not delete from backend:", err);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (session) {
      await signOut({ callbackUrl: "/" });
    }
  }, [session]);

  // 1. LOADING SCREEN: White canvas with soft rose & light pink pulse during NextAuth session resolution
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#2E131E] px-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300 text-center max-w-sm">
          <img
            src="/kordena-mark-reversed.svg"
            alt="Kordena Logo"
            className="w-14 h-14 rounded-2xl shadow-lg shadow-[#D44372]/20 object-contain animate-pulse"
          />
          <div className="flex items-center gap-2.5 text-sm font-semibold text-[#2E131E]">
            <Loader2 className="w-4 h-4 animate-spin text-[#D44372]" />
            <span>Verifying NextAuth Session...</span>
          </div>
          <div className="w-48 bg-[#F7D6DF] h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#D44372] to-[#E05A87] rounded-full animate-pulse w-3/4" />
          </div>
          <p className="text-xs text-[#8A6775]">
            Serene & focused event planning powered by Generative AI
          </p>
        </div>
      </div>
    );
  }

  // 2. UNAUTHENTICATED: Splash page with Stepper & NextAuth Google SSO
  if (!isAuthenticated) {
    return (
      <>
        {/* Optional Auth Notice Banner */}
        {authNotice && (
          <div className="bg-[#FDF0F4] border-b border-[#F7D6DF] px-4 py-2.5 text-xs text-[#9F224E] flex items-center justify-between">
            <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D44372]" />
              <span>{authNotice}</span>
              <button
                onClick={() => setAuthNotice(null)}
                className="ml-auto text-[#D44372] hover:text-[#2E131E] cursor-pointer"
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
        />

        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  // 3. AUTHENTICATED: Simple Navbar with Profile Picture + Custom Event Stepper
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#2E131E]">
      {/* Editorial Luxury Authenticated Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#F7D6DF] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand (Hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <img
              src="/kordena-mark-reversed.svg"
              alt="Kordena Logo"
              className="w-9 h-9 rounded-xl shadow-xs object-contain"
            />
            <div>
              <span className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-[#2E131E]">
                Kordena
              </span>
            </div>
          </div>

          {/* View Mode Switcher + New Event Button */}
          <div className="flex items-center gap-2.5">
            <nav
              role="navigation"
              aria-label="View Switcher"
              className="flex items-center gap-1 bg-[#FDF0F4] p-1 rounded-full border border-[#F7D6DF]"
            >
              <button
                type="button"
                onClick={() => setViewMode("stepper")}
                aria-pressed={viewMode === "stepper"}
                aria-label="Switch to Blueprint Stepper"
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "stepper"
                    ? "bg-[#D44372] text-white shadow-xs"
                    : "text-[#8A6775] hover:text-[#2E131E]"
                }`}
              >
                <span>Blueprint Stepper</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                aria-pressed={viewMode === "calendar"}
                aria-label="Switch to Calendar UI"
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "calendar"
                    ? "bg-[#D44372] text-white shadow-xs"
                    : "text-[#8A6775] hover:text-[#2E131E]"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendar UI</span>
                {isCompleted && (
                  <span className="w-2 h-2 rounded-full bg-[#D44372] animate-pulse" />
                )}
              </button>
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#FDF0F4]/60 border border-[#F7D6DF]">
              {activeUser?.image ? (
                <img
                  src={activeUser.image}
                  alt={activeUser.name || "User Avatar"}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-[#D44372]/40 shadow-2xs"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#D44372] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {activeUser?.name ? activeUser.name[0].toUpperCase() : "U"}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-[#2E131E] leading-tight">
                  {activeUser?.name || "Active Planner"}
                </p>
                <p className="text-[10px] text-[#8A6775] leading-tight">
                  {activeUser?.email || "planner@kordena.ai"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              aria-label="Sign out of account"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#B5473C] hover:bg-[#FDF2F0] border border-transparent hover:border-[#B5473C]/20 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Skip Link Anchor (WCAG 2.4.1) */}
      {viewMode === "calendar" ? (
        <main id="main-content" tabIndex={-1} className="flex-1 p-3 sm:p-6 lg:p-8 outline-none">
          <EventCalendarView
            eventName={eventName || activeEvent?.title || "Annual Global Tech Summit 2026"}
            eventType={eventType || activeEvent?.eventType || "Conference"}
            eventBudget={eventBudget || String(activeEvent?.totalBudget || 50000)}
            eventDate={eventDate || parseDateForInput(activeEvent?.date) || new Date().toISOString().split("T")[0]}
            selectedPlan={selectedPlan}
            tier={eventTier}
            guestCount={guestCount}
            organizerName={activeUser?.name}
            prepCalendarTasks={savedOperations?.prepCalendarTasks || aiEvaluationData?.prepCalendarTasks}
            dayOfRunOfShow={savedOperations?.dayOfRunOfShow || aiEvaluationData?.dayOfRunOfShow}
            budgetBreakdown={savedOperations?.budgetBreakdown || aiEvaluationData?.budgetBreakdown}
            evaluationSummary={savedOperations?.evaluationSummary || aiEvaluationData?.evaluationSummary}
            plannedItems={planningItems}
            onBackToStepper={() => setViewMode("stepper")}
            onNewEvent={handleStartNewEvent}
          />
        </main>
      ) : (
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 outline-none">
          <div className="w-full max-w-4xl flex flex-col items-center">
            {/* Header Title */}
            <div className="text-center mb-6 space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/40 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D44372]" />
                <span>Kordena Event Studio</span>
              </span>
              <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-medium text-[#2E131E] tracking-tight">
                Create Your Event Blueprint
              </h1>
              <p className="text-xs sm:text-sm text-[#8A6775]">
                Input your event parameters to configure your AI architecture.
              </p>
            </div>

            {isCompleted && (
              <div className="w-full mb-6 p-4 rounded-2xl bg-[#FDF0F4] border border-[#D44372]/30 text-[#2E131E] flex items-center justify-between text-xs animate-in fade-in shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D44372] shrink-0" />
                  <span>
                    Blueprint for <strong>{eventName || "your event"}</strong> marked on calendar!
                  </span>
                </div>
                <button
                  onClick={() => setViewMode("calendar")}
                  className="px-3.5 py-1.5 rounded-full bg-[#D44372] text-white text-[11px] font-bold hover:bg-[#BE335E] cursor-pointer shadow-xs transition-colors"
                >
                  View Calendar UI →
                </button>
              </div>
            )}

            {/* AI Evaluation Error Alert */}
            {aiEvalError && (
              <div className="w-full mb-4 p-4 rounded-2xl bg-[#FDF2F0] border border-[#B5473C]/20 text-[#B5473C] flex items-start justify-between text-xs animate-in fade-in shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#B5473C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AI Evaluation Notice:</span>
                    <p className="mt-0.5 text-[#2E131E]">{aiEvalError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTriggerAiEvaluation()}
                  className="px-3 py-1 rounded-full bg-[#B5473C] text-white font-bold hover:bg-[#9B3C33] cursor-pointer shrink-0 ml-3 text-[11px] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* AI Evaluation Loading Overlay Modal (WCAG 2.1.2 & 4.1.2) */}
            {isAiEvaluating && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="ai-eval-modal-title"
                aria-describedby="ai-eval-modal-desc"
                className="fixed inset-0 z-50 bg-[#2E131E]/40 backdrop-blur-xs flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-[28px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#F7D6DF] flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95">
                  <img
                    src="/kordena-mark-reversed.svg"
                    alt="Kordena Logo"
                    className="w-14 h-14 rounded-2xl shadow-lg shadow-[#D44372]/20 object-contain animate-pulse"
                  />
                  <div>
                    <h3 id="ai-eval-modal-title" className="font-[family-name:var(--font-display)] text-xl font-medium text-[#2E131E]">
                      Kordena AI is Evaluating Your Event
                    </h3>
                    <p id="ai-eval-modal-desc" className="text-xs sm:text-sm text-[#8A6775] mt-1.5 leading-relaxed">
                      Analyzing parameters for <strong className="text-[#2E131E]">{eventName || "your event"}</strong> ({eventType}, {guestCount} guests, ₹{Number(eventBudget || 250000).toLocaleString("en-IN")})...
                    </p>
                  </div>
                  <div className="w-full bg-[#F7D6DF] h-2 rounded-full overflow-hidden border border-[#F7D6DF]" role="progressbar" aria-label="Evaluation progress" aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-gradient-to-r from-[#D44372] to-[#E05A87] rounded-full animate-pulse w-3/4" />
                  </div>
                  <p className="text-[11px] text-[#2E131E] font-semibold flex items-center gap-1.5" aria-live="polite">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D44372]" />
                    Synthesizing production schedule, countdown milestones & budget breakdown...
                  </p>
                </div>
              </div>
            )}

            {/* Modular Blueprint Stepper */}
            <BlueprintCreationStepper
              stepperKey={stepperKey}
              stepperCurrentStep={stepperCurrentStep}
              setStepperCurrentStep={setStepperCurrentStep}
              eventName={eventName}
              setEventName={setEventName}
              eventType={eventType}
              setEventType={setEventType}
              eventBudget={eventBudget}
              setEventBudget={setEventBudget}
              eventDate={eventDate}
              setEventDate={setEventDate}
              tomorrowStr={tomorrowStr}
              guestCount={guestCount}
              setGuestCount={setGuestCount}
              eventTier={eventTier}
              setEventTier={setEventTier}
              planningItems={planningItems}
              setPlanningItems={setPlanningItems}
              currentPlanningInput={currentPlanningInput}
              setCurrentPlanningInput={setCurrentPlanningInput}
              handleAddPlanningItem={handleAddPlanningItem}
              handleRemovePlanningItem={handleRemovePlanningItem}
              validation={validation}
              onFinalStepCompleted={handleTriggerAiEvaluation}
              completeButtonText="Submit to AI Evaluation →"
              leadOrganizerName={activeUser?.name || "Planner"}
            />

            {/* Event Histories Section under Blueprint Stepper */}
            {events.length > 0 && (
              <div className="w-full">
                <EventHistories
                  events={events}
                  activeEventId={activeEventId}
                  onSelectEvent={handleSelectEventFromHistory}
                  onOpenCalendar={handleOpenCalendarFromHistory}
                  onDeleteEvent={handleDeleteEventFromHistory}
                  onStartNewEvent={handleStartNewEvent}
                />
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
