"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { signIn, useSession } from "next-auth/react";
import { BlueprintCreationStepper } from "./BlueprintCreationStepper";
import { EventHistories } from "./EventHistories";
import { EventPlan } from "../types";
import { Sparkles, ArrowRight, Plus, IndianRupee, Loader2, AlertCircle, X, Lock } from "lucide-react";
import { AiEvaluationResponse } from "../api/ai-evaluate/route";
import { parseDateForInput, normalizeEventType, validateEventParameters } from "@/lib/calendar-utils";

// Lazily load heavy modules to reduce initial landing bundle size and memory usage
const EventCalendarView = dynamic(
  () => import("./EventCalendarView").then((m) => m.EventCalendarView),
  {
    loading: () => (
      <div className="flex-1 min-h-[450px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-[28px] border border-[#F7D6DF]">
        <div className="w-8 h-8 border-2 border-[#F7D6DF] border-t-[#D44372] rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#2E131E]">Loading Calendar UI...</p>
      </div>
    ),
  }
);

const AiEvaluationStepper = dynamic(
  () => import("./AiEvaluationStepper").then((m) => m.AiEvaluationStepper)
);

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
  const [stepperCurrentStep, setStepperCurrentStep] = useState(1);

  // Tomorrow's date for datepicker min attribute
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  // Validation across stepper steps
  const validation = React.useMemo(() => {
    return validateEventParameters({
      eventName,
      eventType,
      eventBudget,
      eventDate,
      guestCount,
      planningItems,
    });
  }, [eventName, eventType, eventBudget, eventDate, guestCount, planningItems]);

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

  // Fetch real saved event blueprints from database only for authenticated users
  React.useEffect(() => {
    if (!isAuthenticated) {
      setEvents([]);
      return;
    }
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
      <div className="min-h-screen bg-white flex flex-col text-[#2E131E]">
        {/* Top bar with quick sign-in banner */}
        <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#F7D6DF] shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand (Hidden on mobile) */}
            <div className="hidden sm:flex items-center gap-3">
              <img
                src="/kordena-mark-reversed.svg"
                alt="Kordena Logo"
                className="w-9 h-9 rounded-xl shadow-xs object-contain"
              />
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-[#2E131E]">
                  Kordena
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="text-xs font-semibold text-[#8A6775] hover:text-[#2E131E] px-3.5 py-2 rounded-full cursor-pointer transition-colors"
              >
                ← Back to Stepper
              </button>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#D44372] hover:bg-[#BE335E] text-white shadow-xs transition-all cursor-pointer"
              >
                <span>Save with Google</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
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
    <div className="min-h-screen flex flex-col bg-white text-[#2E131E]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#F7D6DF] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand (Hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-3">
            <img
              src="/kordena-mark-reversed.svg"
              alt="Kordena Logo"
              className="w-9 h-9 rounded-xl shadow-xs object-contain"
            />
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-[#2E131E]">
                Kordena
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#D44372] hover:bg-[#BE335E] text-white shadow-xs transition-all cursor-pointer"
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/40 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D44372]" />
              <span>Kordena Event Studio</span>
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-medium text-[#2E131E] tracking-tight">
              Configure Your Event Blueprint
            </h1>
            <p className="text-xs sm:text-sm text-[#8A6775]">
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
                  <p className="mt-0.5 text-[#2E131E]">{aiEvalError}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="px-3.5 py-1.5 rounded-full bg-[#D44372] text-white font-bold hover:bg-[#BE335E] cursor-pointer text-xs flex items-center gap-1.5 shadow-xs transition-colors"
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
            <div className="fixed inset-0 z-50 bg-[#2E131E]/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-[28px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#F7D6DF] flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95">
                <img
                  src="/kordena-mark-reversed.svg"
                  alt="Kordena Logo"
                  className="w-14 h-14 rounded-2xl shadow-lg shadow-[#D44372]/20 object-contain animate-pulse"
                />
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[#2E131E]">
                    Kordena AI is Evaluating Your Event
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8A6775] mt-1.5 leading-relaxed">
                    Analyzing parameters for <strong className="text-[#2E131E]">{eventName || "your event"}</strong> ({eventType}, {guestCount} guests, ₹{Number(eventBudget || 250000).toLocaleString("en-IN")})...
                  </p>
                </div>
                <div className="w-full bg-[#F7D6DF] h-2 rounded-full overflow-hidden border border-[#F7D6DF]">
                  <div className="h-full bg-gradient-to-r from-[#D44372] to-[#E05A87] rounded-full animate-pulse w-3/4" />
                </div>
                <p className="text-[11px] text-[#2E131E] font-semibold flex items-center gap-1.5">
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
            leadOrganizerName={session?.user?.name || "Guest Planner"}
            idPrefix="landing"
            extraReviewContent={
              !isAuthenticated ? (
                <div className="p-4 rounded-2xl bg-[#FDF0F4] border border-[#D44372]/30 text-[#2E131E] text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#D44372] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-[#2E131E]">Sign in required for AI evaluation</p>
                      <p className="text-[#8A6775] text-[11.5px]">Kordena AI evaluation synthesizes personalized countdown milestones and day-of schedules. Sign in to evaluate.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="px-4 py-2 rounded-full bg-[#D44372] text-white font-bold hover:bg-[#BE335E] transition-all cursor-pointer shadow-xs text-xs shrink-0 flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In with Google</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#FDF0F4] border border-[#D44372]/30 text-[#2E131E] text-xs flex items-center gap-2.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#D44372] shrink-0" />
                  <span>
                    Signed in as <strong>{session?.user?.name || session?.user?.email}</strong>. AI Evaluation will synthesize and save your event blueprint.
                  </span>
                </div>
              )
            }
          />

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="text-xs text-[#718096] hover:text-[#10B981] transition-colors font-medium cursor-pointer"
          >
            Already have an account? <span className="underline font-semibold">Sign in with Google</span>
          </button>
        </div>

        {/* Event Histories Section under Blueprint Stepper (authenticated users only) */}
        {isAuthenticated && events.length > 0 && (
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
