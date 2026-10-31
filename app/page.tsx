"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { LandingPage } from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";
import { EventPlan } from "./types";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  LogOut,
  Calendar as CalendarIcon,
  CheckCircle2,
  Plus,
} from "lucide-react";
import Stepper, { Step } from "./components/Stepper";
import { EventCalendarView } from "./components/EventCalendarView";
import { EventHistories } from "./components/EventHistories";
import { AiEvaluationResponse } from "./api/ai-evaluate/route";
import { parseDateForInput, normalizeEventType, validateEventParameters } from "@/lib/calendar-utils";

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

            {/* Blueprint Stepper */}
            <Stepper
              key={stepperKey}
              initialStep={1}
              linear={true}
              onStepChange={(step) => setStepperCurrentStep(step)}
              canAdvance={(fromStep) => {
                if (fromStep === 1) return validation.isStep1Valid;
                if (fromStep === 2) return validation.isStep2Valid;
                if (fromStep === 3) return validation.isValid;
                return true;
              }}
              onFinalStepCompleted={handleTriggerAiEvaluation}
              backButtonText="Back"
              nextButtonText="Continue"
              orientation="vertical"
              width={640}
              completeButtonText="Submit to AI Evaluation →"
              nextButtonProps={{
                disabled:
                  stepperCurrentStep === 1
                    ? !validation.isStep1Valid
                    : stepperCurrentStep === 2
                    ? !validation.isStep2Valid
                    : !validation.isValid,
                title:
                  stepperCurrentStep === 1 && !validation.isStep1Valid
                    ? "Please complete all required parameters (Name, Budget, Date, Guests) to continue"
                    : stepperCurrentStep === 2 && !validation.isStep2Valid
                    ? "Please add at least 1 planning requirement to continue"
                    : !validation.isValid
                    ? `Cannot submit: Missing ${validation.missingFields.join(", ")}`
                    : undefined,
              }}
              theme="light"
              accentColor="#D44372"
              radius={28}
              className="border border-[#F7D6DF] shadow-[0_24px_48px_-32px_rgba(212,67,114,0.18)] bg-white rounded-[28px] p-2 sm:p-4"
            >
                {/* Step 1: Event Details Input (Event Name, Event Type, Budget, Date) */}
                <Step title="Event Info">
                  <div className="space-y-4 py-1">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#2E131E]">
                        Event Parameters
                      </h3>
                      <p className="text-xs sm:text-sm text-[#8A6775]">
                        Enter the name, type, budget, and date for your event.
                      </p>
                    </div>

                    <div className="space-y-3.5 pt-1">
                      {/* 1. Event Name */}
                      <div>
                        <label htmlFor="event-name-input" className="block text-xs font-bold text-[#2E131E] mb-1.5">
                          Event Name <span className="text-[#B5473C]" aria-hidden="true">*</span>
                          <span className="sr-only">(required)</span>
                        </label>
                        <input
                          id="event-name-input"
                          type="text"
                          placeholder="e.g. Annual Global Tech Summit 2026"
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          aria-required="true"
                          aria-invalid={!eventName.trim() || eventName.trim() === "Untitled Event"}
                          className="w-full px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all shadow-2xs"
                          required
                        />
                      </div>

                      {/* 2. Event Type */}
                      <div>
                        <label htmlFor="event-type-select" className="block text-xs font-bold text-[#2E131E] mb-1.5">
                          Event Type <span className="text-[#B5473C]" aria-hidden="true">*</span>
                          <span className="sr-only">(required)</span>
                        </label>
                        <select
                          id="event-type-select"
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value)}
                          aria-required="true"
                          className="w-full px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all cursor-pointer shadow-2xs"
                        >
                          <option value="Conference">Conference / Summit</option>
                          <option value="Wedding">Wedding & Reception</option>
                          <option value="Birthday">Birthday Party / Celebration</option>
                          <option value="Product Launch">Product Launch</option>
                          <option value="Gala">Gala & Charity Dinner</option>
                          <option value="Networking">Networking & Mixer</option>
                          <option value="Retreat">Corporate Leadership Retreat</option>
                          <option value="Exhibition">Exhibition / Trade Show</option>
                        </select>
                      </div>

                      {/* 3. Budget */}
                      <div>
                        <label htmlFor="event-budget-input" className="block text-xs font-bold text-[#2E131E] mb-1.5">
                          Estimated Budget (₹) <span className="text-[#B5473C]" aria-hidden="true">*</span>
                          <span className="sr-only">(required)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A6775] text-xs font-bold" aria-hidden="true">
                            ₹
                          </span>
                          <input
                            id="event-budget-input"
                            type="number"
                            placeholder="e.g. 500000"
                            value={eventBudget}
                            onChange={(e) => setEventBudget(e.target.value)}
                            aria-required="true"
                            aria-invalid={eventBudget !== "" && Number(eventBudget) <= 0}
                            aria-describedby={eventBudget !== "" && Number(eventBudget) <= 0 ? "event-budget-error" : undefined}
                            className="w-full pl-8 pr-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all shadow-2xs"
                            min="1"
                            step="5000"
                            required
                          />
                        </div>
                        {eventBudget !== "" && Number(eventBudget) <= 0 && (
                          <p id="event-budget-error" role="alert" className="text-[11px] text-[#B5473C] mt-1 font-semibold">
                            Budget must be greater than ₹0
                          </p>
                        )}
                      </div>

                      {/* 4. Date of the Event */}
                      <div>
                        <label htmlFor="event-date-input" className="block text-xs font-bold text-[#2E131E] mb-1.5">
                          Date of the Event <span className="text-[#B5473C]" aria-hidden="true">*</span>
                          <span className="sr-only">(required)</span>
                        </label>
                        <input
                          id="event-date-input"
                          type="date"
                          value={eventDate}
                          min={tomorrowStr}
                          onChange={(e) => setEventDate(e.target.value)}
                          aria-required="true"
                          aria-invalid={Boolean(eventDate && validation.errors.eventDate)}
                          aria-describedby={eventDate && validation.errors.eventDate ? "event-date-error" : undefined}
                          className="w-full px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all cursor-pointer shadow-2xs"
                          required
                        />
                        {eventDate && validation.errors.eventDate && (
                          <p id="event-date-error" role="alert" className="text-[11px] text-[#B5473C] mt-1 font-semibold">
                            {validation.errors.eventDate}
                          </p>
                        )}
                      </div>

                      {/* 5. Estimated Guest Count */}
                      <div>
                        <label htmlFor="guest-count-input" className="block text-xs font-bold text-[#2E131E] mb-1.5">
                          Estimated Guest Count <span className="text-[#B5473C]" aria-hidden="true">*</span>
                          <span className="sr-only">(required)</span>
                        </label>
                        <input
                          id="guest-count-input"
                          type="number"
                          placeholder="e.g. 150"
                          value={guestCount}
                          onChange={(e) => setGuestCount(e.target.value)}
                          aria-required="true"
                          aria-invalid={Number(guestCount) < 1}
                          className="w-full px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all shadow-2xs"
                          min="1"
                          step="10"
                        />
                      </div>

                      {/* 6. Package Tier */}
                      <div>
                        <label id="tier-selection-label" className="block text-xs font-bold text-[#2E131E] mb-1.5">
                          Package Tier <span className="text-[#D44372] font-normal">(Starter, Basic, Professional)</span>
                        </label>
                        <div role="radiogroup" aria-labelledby="tier-selection-label" className="grid grid-cols-3 gap-2">
                          {(["Starter", "Basic", "Professional"] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              role="radio"
                              aria-checked={eventTier === t}
                              onClick={() => setEventTier(t)}
                              className={`py-2 px-3 rounded-full text-xs font-bold border transition-all text-center cursor-pointer ${
                                eventTier === t
                                  ? "border-[#D44372] bg-[#D44372] text-white shadow-xs"
                                  : "border-[#F7D6DF] bg-white text-[#8A6775] hover:bg-[#FDF0F4] hover:text-[#2E131E]"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Step>

                {/* Step 2: Planning Requirements */}
                <Step title="Planning">
                  <div className="space-y-4 py-1">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#2E131E]">
                        Planning Requirements
                      </h3>
                      <p className="text-xs sm:text-sm text-[#8A6775]">
                        Specify the essential items, services, or sub-arrangements needed for your event.
                      </p>
                    </div>

                    <div className="space-y-3.5 pt-1">
                      {/* Input Box */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="planning-item-input" className="block text-xs font-bold text-[#2E131E]">
                            What are things that be need for these <span className="text-[#B5473C]" aria-hidden="true">*</span>
                            <span className="sr-only">(required)</span>
                          </label>
                          <span className="text-[10.5px] text-[#9F224E] font-bold bg-[#FDF0F4] px-2.5 py-0.5 rounded-full border border-[#D44372]/30">
                            Press Enter ↵ to add
                          </span>
                        </div>

                        <div className="relative flex items-center">
                          <input
                            id="planning-item-input"
                            type="text"
                            placeholder="Type a word or sentence and press Enter (e.g. Photography & Drone Video)"
                            value={currentPlanningInput}
                            onChange={(e) => setCurrentPlanningInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddPlanningItem();
                              }
                            }}
                            className="w-full pl-4 pr-24 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddPlanningItem}
                            disabled={!currentPlanningInput.trim()}
                            aria-label="Add planning requirement"
                            className="absolute right-1.5 px-3.5 py-1.5 rounded-full bg-[#D44372] hover:bg-[#BE335E] disabled:bg-[#F7D6DF] disabled:text-[#8A6775] text-white text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Add</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-[#8A6775] mt-1.5">
                          Type any word or phrase, then press <strong>Enter</strong> to create sub-part bullet points below.
                        </p>
                      </div>

                      {/* Suggested Quick Add Chips */}
                      <div>
                        <span id="quick-suggestions-label" className="text-[11px] font-bold text-[#2E131E] block mb-1.5">
                          Quick suggestions:
                        </span>
                        <div role="group" aria-labelledby="quick-suggestions-label" className="flex flex-wrap gap-1.5">
                          {[
                            "Stage & Audio Setup",
                            "Catering & Refreshments",
                            "Photography & Videography",
                            "Guest Badges & Welcome Kit",
                            "Decorations & Floral Backdrop",
                            "VIP Seating & Hostess Desk",
                          ].map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                if (!planningItems.includes(suggestion)) {
                                  setPlanningItems((prev) => [...prev, suggestion]);
                                }
                              }}
                              aria-label={`Add suggestion: ${suggestion}`}
                              className="text-[11px] px-3 py-1.5 rounded-full bg-white border border-[#F7D6DF] text-[#2E131E] hover:border-[#D44372] hover:text-[#2E131E] hover:bg-[#FDF0F4] transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
                            >
                              <Plus className="w-3 h-3 text-[#D44372]" aria-hidden="true" />
                              <span>{suggestion}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bullet Points / Sub parts display */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <label id="planning-points-heading" className="text-xs font-bold text-[#2E131E] flex items-center gap-2">
                            <span>Planning Points</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/30">
                              {planningItems.length} {planningItems.length === 1 ? "item" : "items"}
                            </span>
                          </label>
                          {planningItems.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setPlanningItems([])}
                              aria-label="Clear all planning points"
                              className="text-[11px] text-[#B5473C] hover:text-[#9B3C33] font-semibold cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>

                        {planningItems.length === 0 ? (
                          <div role="status" className="p-4 rounded-2xl border border-dashed border-[#F7D6DF] bg-[#FDF0F4]/30 text-center space-y-1.5">
                            <p className="text-xs font-semibold text-[#2E131E]">
                              No planning points added yet
                            </p>
                            <p className="text-[11px] text-[#8A6775]">
                              Type in the input box above and press Enter, or choose from quick suggestions.
                            </p>
                            <p className="text-[11px] font-semibold text-[#B5473C] bg-[#FFF4F6] border border-[#F7C4D2] px-3 py-1 rounded-full inline-flex items-center gap-1.5 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> At least 1 planning point is required to continue.
                            </p>
                          </div>
                        ) : (
                          <ul aria-labelledby="planning-points-heading" className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {planningItems.map((item, index) => (
                              <li
                                key={index}
                                className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-[#F7D6DF] hover:border-[#D44372]/50 hover:bg-[#FDF0F4]/20 transition-all shadow-2xs"
                              >
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  {/* Stylized bullet point */}
                                  <span className="w-2 h-2 rounded-full bg-[#D44372] mt-1.5 shrink-0 shadow-2xs group-hover:scale-125 transition-transform" aria-hidden="true" />
                                  <span className="text-xs text-[#2E131E] font-medium leading-relaxed break-words">
                                    {item}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePlanningItem(index)}
                                  className="opacity-60 group-hover:opacity-100 hover:text-[#B5473C] text-[#8A6775] p-1 rounded-full transition-colors cursor-pointer shrink-0"
                                  title={`Remove point: ${item}`}
                                  aria-label={`Remove planning point: ${item}`}
                                >
                                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </Step>

                {/* Step 3: Review */}
                <Step title="Review">
                  <div className="space-y-4 py-1">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#2E131E]">
                        Review Parameters
                      </h3>
                      <p className="text-xs sm:text-sm text-[#8A6775]">
                        Verify your details before submitting to Kordena AI for evaluation.
                      </p>
                    </div>

                    {!validation.isValid && (
                      <div role="alert" aria-live="assertive" className="bg-[#FFF4F6] border border-[#F7C4D2] rounded-2xl p-4 text-xs flex items-start gap-2.5 text-[#B5473C] animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B5473C]" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="font-bold">Cannot Submit: Missing Required Details</p>
                          <p className="text-[11.5px] text-[#8A6775] leading-relaxed">
                            All necessary parameters must be provided before submitting to AI evaluation. Please go back to complete:{" "}
                            <strong className="text-[#B5473C] font-semibold">{validation.missingFields.join(", ")}</strong>.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-[#FDF0F4]/40 p-5 rounded-[24px] border border-[#F7D6DF] space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8A6775]">Event Name:</span>
                        {eventName.trim() && eventName.trim() !== "Untitled Event" ? (
                          <strong className="text-[#2E131E] font-semibold">{eventName}</strong>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FCE7EC] text-[#B5473C] border border-[#F7C4D2]">
                            Missing — Required
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8A6775]">Event Type:</span>
                        <strong className="text-[#2E131E] font-semibold">{eventType}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8A6775]">Estimated Budget:</span>
                        {eventBudget && Number(eventBudget) > 0 ? (
                          <strong className="text-[#2E131E] font-[family-name:var(--font-display)] text-sm">
                            ₹{Number(eventBudget).toLocaleString("en-IN")}
                          </strong>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FCE7EC] text-[#B5473C] border border-[#F7C4D2]">
                            Missing — Required (&gt; ₹0)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8A6775]">Package Tier:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#D44372] text-white">
                          {eventTier}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8A6775]">Event Date:</span>
                        {eventDate && !validation.errors.eventDate ? (
                          <strong className="text-[#2E131E] font-semibold">{eventDate}</strong>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FCE7EC] text-[#B5473C] border border-[#F7C4D2]">
                            {validation.errors.eventDate || "Date TBD — Future date required"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8A6775]">Guest Count:</span>
                        {guestCount && Number(guestCount) >= 1 ? (
                          <strong className="text-[#2E131E] font-semibold">{guestCount} guests</strong>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FCE7EC] text-[#B5473C] border border-[#F7C4D2]">
                            Missing — At least 1 guest required
                          </span>
                        )}
                      </div>

                      {/* Planning Points Review */}
                      <div className="pt-2 border-t border-[#F7D6DF]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[#8A6775]">Planning Points:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            planningItems.length > 0
                              ? "bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/30"
                              : "bg-[#FCE7EC] text-[#B5473C] border border-[#F7C4D2]"
                          }`}>
                            {planningItems.length} {planningItems.length === 1 ? "point" : "points"}
                          </span>
                        </div>
                        {planningItems.length > 0 ? (
                          <ul className="space-y-1.5 pl-1 max-h-32 overflow-y-auto">
                            {planningItems.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[#2E131E]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D44372] mt-1 shrink-0" />
                                <span className="font-medium text-[11.5px] leading-snug">{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[#B5473C] font-semibold text-[11px] bg-[#FFF4F6] p-2 rounded-xl border border-[#F7C4D2] flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> At least 1 planning point required before submission
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#F7D6DF]">
                        <span className="text-[#8A6775]">Lead Organizer:</span>
                        <strong className="text-[#2E131E] font-semibold">{activeUser?.name || "Planner"}</strong>
                      </div>
                    </div>
                  </div>
                </Step>
              </Stepper>

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
