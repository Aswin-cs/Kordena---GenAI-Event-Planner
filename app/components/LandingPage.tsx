"use client";

import React, { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Stepper, { Step } from "./Stepper";
import { EventCalendarView } from "./EventCalendarView";
import { EventHistories } from "./EventHistories";
import { initialEvents } from "../mockData";
import { EventPlan } from "../types";
import { Sparkles, ArrowRight, Plus, IndianRupee, Loader2, AlertCircle, X, Lock } from "lucide-react";
import { AiEvaluationStepper } from "./AiEvaluationStepper";
import { AiEvaluationResponse } from "../api/ai-evaluate/route";

function parseDateForInput(dateStr?: string): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return "";
}

function normalizeEventType(typeStr?: string): string {
  if (!typeStr) return "Conference";
  const lower = typeStr.toLowerCase();
  if (lower.includes("wedding")) return "Wedding";
  if (lower.includes("summit") || lower.includes("tech") || lower.includes("conference")) return "Conference";
  if (lower.includes("retreat")) return "Retreat";
  if (lower.includes("gala") || lower.includes("charity")) return "Gala";
  if (lower.includes("launch")) return "Product Launch";
  if (lower.includes("network")) return "Networking";
  if (lower.includes("exhibition") || lower.includes("trade")) return "Exhibition";
  return "Conference";
}

interface LandingPageProps {
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onOpenSignup }) => {
  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated";

  // Stepper input states
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Conference");
  const [eventBudget, setEventBudget] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("100");
  const [selectedPlan, setSelectedPlan] = useState("Professional Suite");
  const [eventTier, setEventTier] = useState<"Starter" | "Basic" | "Professional">("Starter");
  const [planningItems, setPlanningItems] = useState<string[]>([]);
  const [currentPlanningInput, setCurrentPlanningInput] = useState("");
  const [stepperKey, setStepperKey] = useState(0);

  const handleAddPlanningItem = () => {
    const trimmed = currentPlanningInput.trim();
    if (!trimmed) return;
    setPlanningItems((prev) => [...prev, trimmed]);
    setCurrentPlanningInput("");
  };

  const handleRemovePlanningItem = (indexToRemove: number) => {
    setPlanningItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // AI Evaluation Stepper states
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAiStepper, setShowAiStepper] = useState(false);
  const [aiEvaluationData, setAiEvaluationData] = useState<AiEvaluationResponse | null>(null);
  const [aiEvalError, setAiEvalError] = useState<string | null>(null);
  const [savedOperations, setSavedOperations] = useState<{
    prepCalendarTasks?: any[];
    dayOfRunOfShow?: any[];
    budgetBreakdown?: any[];
    evaluationSummary?: any;
    plannedItems?: string[];
  } | null>(null);

  // Events history state (initialized empty so no static mock data is shown)
  const [events, setEvents] = useState<EventPlan[]>([]);
  const [activeEventId, setActiveEventId] = useState<string>("");

  // Fetch real saved event blueprints from database if available
  React.useEffect(() => {
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
  }, []);

  // Redirect state to Calendar UI
  const [showCalendar, setShowCalendar] = useState(false);

  const handleStartNewEvent = () => {
    setEventName("");
    setEventType("Conference");
    setEventBudget("");
    setEventDate("");
    setGuestCount("100");
    setSelectedPlan("Professional Suite");
    setEventTier("Starter");
    setPlanningItems([]);
    setCurrentPlanningInput("");
    setShowAiStepper(false);
    setAiEvaluationData(null);
    setSavedOperations(null);
    setAiEvalError(null);
    setStepperKey((prev) => prev + 1);
    setShowCalendar(false);
  };

  const handleSelectEventFromHistory = (ev: EventPlan) => {
    setActiveEventId(ev.id);
    setEventName(ev.title);
    setEventType(normalizeEventType(ev.eventType));
    setEventBudget(ev.totalBudget ? String(ev.totalBudget) : "");
    setEventDate(parseDateForInput(ev.date));
    setShowAiStepper(false);
    setAiEvaluationData(null);
    setAiEvalError(null);
    setStepperKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenCalendarFromHistory = (ev: EventPlan) => {
    setActiveEventId(ev.id);
    setEventName(ev.title);
    setEventType(normalizeEventType(ev.eventType));
    setEventBudget(ev.totalBudget ? String(ev.totalBudget) : "");
    setEventDate(parseDateForInput(ev.date) || ev.date);
    setShowCalendar(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteEventFromHistory = async (eventId: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    try {
      await fetch(`/api/user-status?id=${encodeURIComponent(eventId)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Could not delete from backend:", err);
    }
  };

  const handleTriggerAiEvaluation = async () => {
    if (!isAuthenticated) {
      setAiEvalError("Sign in required: AI Event Evaluation requires an authenticated account. Please sign in with Google to evaluate your event parameters and generate your milestone calendar.");
      return;
    }

    setIsAiEvaluating(true);
    setAiEvalError(null);

    try {
      const response = await fetch("/api/ai-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: eventName.trim() || "Untitled Event",
          eventType,
          budget: Number(eventBudget) || 250000,
          guestCount: Number(guestCount) || 100,
          eventDate: eventDate || undefined,
          tier: eventTier,
          leadOrganizer: "Planner",
          planningItems,
          plannedItems: planningItems,
        }),
      });

      const data = await response.json();
      if (response.status === 401 || data.code === "UNAUTHORIZED") {
        setAiEvalError(data.message || "Unauthorized: Sign in required to evaluate event architecture with Kordena AI.");
        setIsAiEvaluating(false);
        return;
      }

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
            eventName: eventName.trim() || "Untitled Event",
            eventType,
            tier: eventTier,
            budget: Number(eventBudget) || 250000,
            guestCount: Number(guestCount) || 100,
            plannedItems: planningItems,
            endDate: eventDate || new Date().toISOString().split("T")[0],
            selectedPlan,
            evaluationSummary: data.evaluationSummary,
            budgetBreakdown: data.budgetBreakdown,
            prepCalendarTasks: data.prepCalendarTasks,
            dayOfRunOfShow: data.dayOfRunOfShow,
            requirements: planningItems,
            aiResponse: data,
          }),
        });
      } catch (err) {
        console.error("Guest save error:", err);
      }

      // Add to events history
      if (eventName.trim()) {
        const activeEv = events.find((e) => e.id === activeEventId) || events[0];
        const newPlan: EventPlan = {
          id: `event-${Date.now()}`,
          title: eventName,
          tagline:
            data.evaluationSummary?.eventVibe ||
            `${eventType} architected with Kordena GenAI`,
          eventType: eventType,
          date: eventDate || new Date().toISOString().split("T")[0],
          location: activeEv?.location || "Main Venue",
          totalBudget: Number(eventBudget) || 250000,
          guestCount: Number(guestCount) || 100,
          aiVibeSummary: data.evaluationSummary?.eventVibe || activeEv?.aiVibeSummary || "",
          paletteDescription: activeEv?.paletteDescription || "",
          tasks: activeEv?.tasks || [],
          budget: activeEv?.budget || [],
          alerts: activeEv?.alerts || [],
          vendors: activeEv?.vendors || [],
          schedule: activeEv?.schedule || [],
          aiSuggestions: activeEv?.aiSuggestions || [],
        };
        setEvents((prev) => [newPlan, ...prev]);
        setActiveEventId(newPlan.id);
      }

      // Directly go to calendar UI
      setShowAiStepper(false);
      setShowCalendar(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("AI Evaluation error on landing page:", err);
      setAiEvalError(
        err?.message || "Could not complete AI evaluation. Please verify your inputs and try again."
      );
    } finally {
      setIsAiEvaluating(false);
    }
  };

  const handleFinalSaveWithAi = async (evalSelections: {
    decorations: string[];
    arrangements: string[];
    requirements: string[];
    aiSummary: string;
    aiResponse?: any;
    tier?: "Starter" | "Basic" | "Professional";
  }) => {
    const effectiveTier = evalSelections.tier || eventTier;
    setIsSaving(true);
    try {
      await fetch("/api/user-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: eventName.trim() || "Untitled Event",
          eventType,
          tier: effectiveTier,
          budget: Number(eventBudget) || 250000,
          guestCount: Number(guestCount) || 100,
          plannedItems: planningItems,
          endDate: eventDate || new Date().toISOString().split("T")[0],
          selectedPlan,
          evaluationSummary: evalSelections.aiResponse?.evaluationSummary,
          budgetBreakdown: evalSelections.aiResponse?.budgetBreakdown,
          prepCalendarTasks: evalSelections.aiResponse?.prepCalendarTasks,
          dayOfRunOfShow: evalSelections.aiResponse?.dayOfRunOfShow,
          mediatorStarterPrompts: evalSelections.aiResponse?.mediatorStarterPrompts,
          decorations: evalSelections.decorations,
          arrangements: evalSelections.arrangements,
          requirements: evalSelections.requirements,
          aiSummary: evalSelections.aiSummary,
          aiResponse: evalSelections.aiResponse,
        }),
      });

      if (evalSelections.aiResponse) {
        setSavedOperations({
          prepCalendarTasks: evalSelections.aiResponse.prepCalendarTasks || [],
          dayOfRunOfShow: evalSelections.aiResponse.dayOfRunOfShow || [],
          budgetBreakdown: evalSelections.aiResponse.budgetBreakdown || [],
          evaluationSummary: evalSelections.aiResponse.evaluationSummary,
          plannedItems: planningItems,
        });
      }
    } catch (err) {
      console.error("Guest save error:", err);
    } finally {
      setIsSaving(false);
    }

    if (eventName.trim()) {
      const activeEv = events.find((e) => e.id === activeEventId) || events[0];
      const newPlan: EventPlan = {
        id: `event-${Date.now()}`,
        title: eventName,
        tagline: evalSelections.aiSummary || `${eventType} architected with Kordena GenAI`,
        eventType: eventType,
        date: eventDate || new Date().toISOString().split("T")[0],
        location: activeEv?.location || "Main Venue",
        totalBudget: Number(eventBudget) || 250000,
        guestCount: Number(guestCount) || 100,
        aiVibeSummary: evalSelections.aiSummary || activeEv?.aiVibeSummary || "",
        paletteDescription: activeEv?.paletteDescription || "",
        tasks: activeEv?.tasks || [],
        budget: activeEv?.budget || [],
        alerts: activeEv?.alerts || [],
        vendors: activeEv?.vendors || [],
        schedule: activeEv?.schedule || [],
        aiSuggestions: activeEv?.aiSuggestions || [],
      };
      setEvents((prev) => [newPlan, ...prev]);
      setActiveEventId(newPlan.id);
    }

    setShowCalendar(true);
  };

  if (showCalendar) {
    return (
      <div className="min-h-screen bg-[#FCFDFC] flex flex-col text-[#24352F]">
        {/* Top bar with quick sign-in banner */}
        <header className="sticky top-0 z-40 w-full bg-[#FCFDFC]/90 backdrop-blur-md border-b border-[#E7EDE9] shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0E2A24] text-[#F3E7C9] flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-4 h-4 text-[#F3E7C9]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-[#0E2A24]">
                  Kordena
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/40">
                  Event Studio
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="text-xs font-semibold text-[#7B8C86] hover:text-[#0E2A24] px-3.5 py-2 rounded-full cursor-pointer transition-colors"
              >
                ← Back to Stepper
              </button>
              <button
                type="button"
                onClick={handleStartNewEvent}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F5EFE2] hover:bg-[#ede3cf] text-[#7D6230] border border-[#B08D4F] shadow-2xs transition-all cursor-pointer group"
                title="Create New Event"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
                <span>New Event</span>
              </button>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#0E2A24] hover:bg-[#163D34] text-[#F3E7C9] shadow-xs transition-all cursor-pointer"
              >
                <span>Save with Google</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F3E7C9]" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <EventCalendarView
            eventName={eventName || "Annual Global Tech Summit 2026"}
            eventType={eventType}
            eventBudget={eventBudget || "50000"}
            eventDate={eventDate || new Date().toISOString().split("T")[0]}
            selectedPlan={selectedPlan}
            tier={eventTier}
            guestCount={guestCount}
            organizerName="Guest Planner"
            prepCalendarTasks={savedOperations?.prepCalendarTasks || aiEvaluationData?.prepCalendarTasks}
            dayOfRunOfShow={savedOperations?.dayOfRunOfShow || aiEvaluationData?.dayOfRunOfShow}
            budgetBreakdown={savedOperations?.budgetBreakdown || aiEvaluationData?.budgetBreakdown}
            evaluationSummary={savedOperations?.evaluationSummary || aiEvaluationData?.evaluationSummary}
            plannedItems={planningItems}
            onBackToStepper={() => setShowCalendar(false)}
            onNewEvent={handleStartNewEvent}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFDFC] text-[#24352F]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-[#FCFDFC]/90 backdrop-blur-md border-b border-[#E7EDE9] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0E2A24] text-[#F3E7C9] flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-[#F3E7C9]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-[#0E2A24]">
                Kordena
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/40">
                Event Studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleStartNewEvent}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F5EFE2] hover:bg-[#ede3cf] text-[#7D6230] border border-[#B08D4F] shadow-2xs transition-all cursor-pointer group"
              title="Create New Event"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
              <span>New Event</span>
            </button>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#0E2A24] hover:bg-[#163D34] text-[#F3E7C9] shadow-xs transition-all cursor-pointer"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Title */}
          <div className="text-center mb-6 space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/40 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#B08D4F]" />
              <span>Kordena Event Studio</span>
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-medium text-[#0E2A24] tracking-tight">
              Configure Your Event Blueprint
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8C86]">
              Input your event parameters to mark your event date on the Calendar.
            </p>
          </div>

          {/* AI Evaluation Error Alert */}
          {aiEvalError && (
            <div className="w-full mb-4 p-4 rounded-2xl bg-[#FDF2F0] border border-[#B5473C]/20 text-[#B5473C] flex items-start justify-between text-xs animate-in fade-in shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#B5473C] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">AI Evaluation Notice:</span>
                  <p className="mt-0.5 text-[#24352F]">{aiEvalError}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="px-3.5 py-1.5 rounded-full bg-[#0E2A24] text-[#F3E7C9] font-bold hover:bg-[#163D34] cursor-pointer text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In with Google</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTriggerAiEvaluation()}
                  className="px-3 py-1.5 rounded-full bg-[#B5473C] text-white font-bold hover:bg-[#9B3C33] cursor-pointer text-xs transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* AI Evaluation Loading Overlay Modal */}
          {isAiEvaluating && (
            <div className="fixed inset-0 z-50 bg-[#0E2A24]/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-[#FCFDFC] rounded-[28px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E7EDE9] flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-[#0E2A24] flex items-center justify-center text-[#F3E7C9] shadow-lg shadow-[#0E2A24]/20">
                  <Sparkles className="w-7 h-7 text-[#F3E7C9] animate-pulse" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[#0E2A24]">
                    Kordena AI is Evaluating Your Event
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7B8C86] mt-1.5 leading-relaxed">
                    Analyzing parameters for <strong className="text-[#0E2A24]">{eventName || "your event"}</strong> ({eventType}, {guestCount} guests, ₹{Number(eventBudget || 250000).toLocaleString("en-IN")})...
                  </p>
                </div>
                <div className="w-full bg-[#E7EDE9] h-2 rounded-full overflow-hidden border border-[#E7EDE9]">
                  <div className="h-full bg-gradient-to-r from-[#0E2A24] to-[#B08D4F] rounded-full animate-pulse w-3/4" />
                </div>
                <p className="text-[11px] text-[#0E2A24] font-semibold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B08D4F]" />
                  Synthesizing production schedule, countdown milestones & budget breakdown...
                </p>
              </div>
            </div>
          )}

          {/* Blueprint Stepper */}
          <Stepper
            key={stepperKey}
            initialStep={1}
            onStepChange={(step) => console.log("Landing stepper step:", step)}
            onFinalStepCompleted={handleTriggerAiEvaluation}
            backButtonText="Back"
            nextButtonText="Continue"
            orientation="vertical"
            width={640}
            completeButtonText={isAuthenticated ? "Submit to AI Evaluation →" : "Sign In & Evaluate with AI 🔒"}
            theme="light"
            accentColor="#0E2A24"
            radius={28}
            className="border border-[#E7EDE9] shadow-[0_24px_48px_-32px_rgba(14,42,36,0.18)] bg-[#FCFDFC] rounded-[28px] p-2 sm:p-4"
          >
              {/* Step 1: Event Details Input (Event Name, Event Type, Budget, Date, Guests) */}
              <Step title="Event Info">
                <div className="space-y-4 py-1">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#0E2A24]">
                      Event Parameters
                    </h3>
                    <p className="text-xs sm:text-sm text-[#7B8C86]">
                      Enter the name, type, budget, and date for your event.
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-1">
                    {/* 1. Event Name */}
                    <div>
                      <label className="block text-xs font-bold text-[#0E2A24] mb-1.5">
                        Event Name <span className="text-[#B5473C]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Annual Global Tech Summit 2026"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full border border-[#E7EDE9] bg-white text-xs sm:text-sm text-[#0E2A24] placeholder:text-[#7B8C86]/60 focus:outline-none focus:border-[#B08D4F] focus:ring-1 focus:ring-[#B08D4F] transition-all shadow-2xs"
                        required
                      />
                    </div>

                    {/* 2. Event Type */}
                    <div>
                      <label className="block text-xs font-bold text-[#0E2A24] mb-1.5">
                        Event Type <span className="text-[#B5473C]">*</span>
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full border border-[#E7EDE9] bg-white text-xs sm:text-sm text-[#0E2A24] focus:outline-none focus:border-[#B08D4F] focus:ring-1 focus:ring-[#B08D4F] transition-all cursor-pointer shadow-2xs"
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
                      <label className="block text-xs font-bold text-[#0E2A24] mb-1.5">
                        Estimated Budget (₹) <span className="text-[#B5473C]">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B8C86] text-xs font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          placeholder="e.g. 500000"
                          value={eventBudget}
                          onChange={(e) => setEventBudget(e.target.value)}
                          className="w-full pl-8 pr-4 py-2.5 rounded-full border border-[#E7EDE9] bg-white text-xs sm:text-sm text-[#0E2A24] placeholder:text-[#7B8C86]/60 focus:outline-none focus:border-[#B08D4F] focus:ring-1 focus:ring-[#B08D4F] transition-all shadow-2xs"
                          min="0"
                          step="5000"
                        />
                      </div>
                    </div>

                    {/* 4. Date of the Event */}
                    <div>
                      <label className="block text-xs font-bold text-[#0E2A24] mb-1.5">
                        Date of the Event <span className="text-[#B5473C]">*</span>
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full border border-[#E7EDE9] bg-white text-xs sm:text-sm text-[#0E2A24] focus:outline-none focus:border-[#B08D4F] focus:ring-1 focus:ring-[#B08D4F] transition-all cursor-pointer shadow-2xs"
                      />
                    </div>

                    {/* 5. Estimated Guest Count */}
                    <div>
                      <label className="block text-xs font-bold text-[#0E2A24] mb-1.5">
                        Estimated Guest Count <span className="text-[#B5473C]">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 150"
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full border border-[#E7EDE9] bg-white text-xs sm:text-sm text-[#0E2A24] placeholder:text-[#7B8C86]/60 focus:outline-none focus:border-[#B08D4F] focus:ring-1 focus:ring-[#B08D4F] transition-all shadow-2xs"
                        min="1"
                        step="10"
                      />
                    </div>

                    {/* 6. Package Tier */}
                    <div>
                      <label className="block text-xs font-bold text-[#0E2A24] mb-1.5">
                        Package Tier <span className="text-[#B08D4F] font-normal">(Starter, Basic, Professional)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Starter", "Basic", "Professional"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setEventTier(t)}
                            className={`py-2 px-3 rounded-full text-xs font-bold border transition-all text-center cursor-pointer ${
                              eventTier === t
                                ? "border-[#0E2A24] bg-[#0E2A24] text-[#F3E7C9] shadow-xs"
                                : "border-[#E7EDE9] bg-white text-[#7B8C86] hover:bg-[#F5EFE2] hover:text-[#0E2A24]"
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
                    <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#0E2A24]">
                      Planning Requirements
                    </h3>
                    <p className="text-xs sm:text-sm text-[#7B8C86]">
                      Specify the essential items, services, or sub-arrangements needed for your event.
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-1">
                    {/* Input Box */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-[#0E2A24]">
                          What are things that be need for these <span className="text-[#B5473C]">*</span>
                        </label>
                        <span className="text-[10.5px] text-[#7D6230] font-bold bg-[#F5EFE2] px-2.5 py-0.5 rounded-full border border-[#B08D4F]/30">
                          Press Enter ↵ to add
                        </span>
                      </div>

                      <div className="relative flex items-center">
                        <input
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
                          className="w-full pl-4 pr-24 py-2.5 rounded-full border border-[#E7EDE9] bg-white text-xs sm:text-sm text-[#0E2A24] placeholder:text-[#7B8C86]/60 focus:outline-none focus:border-[#B08D4F] focus:ring-1 focus:ring-[#B08D4F] transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddPlanningItem}
                          disabled={!currentPlanningInput.trim()}
                          className="absolute right-1.5 px-3.5 py-1.5 rounded-full bg-[#0E2A24] hover:bg-[#163D34] disabled:bg-[#E7EDE9] disabled:text-[#7B8C86] text-[#F3E7C9] text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-[#7B8C86] mt-1.5">
                        Type any word or phrase, then press <strong>Enter</strong> to create sub-part bullet points below.
                      </p>
                    </div>

                    {/* Suggested Quick Add Chips */}
                    <div>
                      <span className="text-[11px] font-bold text-[#0E2A24] block mb-1.5">
                        Quick suggestions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
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
                            className="text-[11px] px-3 py-1.5 rounded-full bg-white border border-[#E7EDE9] text-[#24352F] hover:border-[#B08D4F] hover:text-[#0E2A24] hover:bg-[#F5EFE2] transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
                          >
                            <Plus className="w-3 h-3 text-[#B08D4F]" />
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bullet Points / Sub parts display */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#0E2A24] flex items-center gap-2">
                          <span>Planning Points</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/30">
                            {planningItems.length} {planningItems.length === 1 ? "item" : "items"}
                          </span>
                        </label>
                        {planningItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPlanningItems([])}
                            className="text-[11px] text-[#B5473C] hover:text-[#9B3C33] font-semibold cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {planningItems.length === 0 ? (
                        <div className="p-4 rounded-2xl border border-dashed border-[#E7EDE9] bg-[#F5EFE2]/30 text-center space-y-1">
                          <p className="text-xs font-semibold text-[#0E2A24]">
                            No planning points added yet
                          </p>
                          <p className="text-[11px] text-[#7B8C86]">
                            Type in the input box above and press Enter to generate bullet points.
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {planningItems.map((item, index) => (
                            <li
                              key={index}
                              className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-[#E7EDE9] hover:border-[#B08D4F]/50 hover:bg-[#F5EFE2]/20 transition-all shadow-2xs"
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                {/* Stylized bullet point */}
                                <span className="w-2 h-2 rounded-full bg-[#B08D4F] mt-1.5 shrink-0 shadow-2xs group-hover:scale-125 transition-transform" />
                                <span className="text-xs text-[#24352F] font-medium leading-relaxed break-words">
                                  {item}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePlanningItem(index)}
                                className="opacity-60 group-hover:opacity-100 hover:text-[#B5473C] text-[#7B8C86] p-1 rounded-full transition-colors cursor-pointer shrink-0"
                                title="Remove point"
                              >
                                <X className="w-3.5 h-3.5" />
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
                    <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#0E2A24]">
                      Review Parameters
                    </h3>
                    <p className="text-xs sm:text-sm text-[#7B8C86]">
                      Verify your details before submitting to Kordena AI for evaluation.
                    </p>
                  </div>

                  <div className="bg-[#F5EFE2]/40 p-5 rounded-[24px] border border-[#E7EDE9] space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#7B8C86]">Event Name:</span>
                      <strong className="text-[#0E2A24] font-semibold">{eventName || "Untitled Event"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7B8C86]">Event Type:</span>
                      <strong className="text-[#0E2A24] font-semibold">{eventType}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7B8C86]">Estimated Budget:</span>
                      <strong className="text-[#0E2A24] font-[family-name:var(--font-display)] text-sm">
                        {eventBudget ? `₹${Number(eventBudget).toLocaleString("en-IN")}` : "Not specified"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7B8C86]">Package Tier:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#0E2A24] text-[#F3E7C9]">
                        {eventTier}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7B8C86]">Event Date:</span>
                      <strong className="text-[#0E2A24] font-semibold">{eventDate || "Date TBD"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7B8C86]">Guest Count:</span>
                      <strong className="text-[#0E2A24] font-semibold">{guestCount || "100"} guests</strong>
                    </div>

                    {/* Planning Points Review */}
                    <div className="pt-2 border-t border-[#E7EDE9]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[#7B8C86]">Planning Points:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/30">
                          {planningItems.length} {planningItems.length === 1 ? "point" : "points"}
                        </span>
                      </div>
                      {planningItems.length > 0 ? (
                        <ul className="space-y-1.5 pl-1 max-h-32 overflow-y-auto">
                          {planningItems.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[#24352F]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B08D4F] mt-1 shrink-0" />
                              <span className="font-medium text-[11.5px] leading-snug">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#7B8C86] italic text-[11px]">
                          No custom planning points specified (AI will infer defaults)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Auth Session Status & AI Notice */}
                  {!isAuthenticated ? (
                    <div className="p-4 rounded-2xl bg-[#F5EFE2] border border-[#B08D4F]/30 text-[#0E2A24] text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#0E2A24] text-[#F3E7C9] flex items-center justify-center shrink-0 shadow-2xs">
                          <Lock className="w-4 h-4 text-[#F3E7C9]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#0E2A24]">Sign in required for AI evaluation</p>
                          <p className="text-[#7B8C86] text-[11.5px]">Kordena AI evaluation synthesizes personalized countdown milestones and day-of schedules. Sign in to evaluate.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="px-4 py-2 rounded-full bg-[#0E2A24] text-[#F3E7C9] font-bold hover:bg-[#163D34] transition-all cursor-pointer shadow-xs text-xs shrink-0 flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sign In with Google</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-[#F5EFE2] border border-[#B08D4F]/30 text-[#0E2A24] text-xs flex items-center gap-2.5 shadow-2xs">
                      <Sparkles className="w-4 h-4 text-[#B08D4F] shrink-0" />
                      <span>
                        Signed in as <strong>{session?.user?.name || session?.user?.email}</strong>. AI Evaluation will synthesize and save your event blueprint.
                      </span>
                    </div>
                  )}
                </div>
              </Step>
            </Stepper>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="text-xs text-[#718096] hover:text-[#10B981] transition-colors font-medium cursor-pointer"
          >
            Already have an account? <span className="underline font-semibold">Sign in with Google</span>
          </button>
        </div>

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
    </div>
  </div>
  );
};
