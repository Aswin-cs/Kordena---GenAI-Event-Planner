"use client";

import React, { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Stepper, { Step } from "./Stepper";
import { EventCalendarView } from "./EventCalendarView";
import { EventHistories } from "./EventHistories";
import { EventPlan } from "../types";
import { Sparkles, ArrowRight, Plus, IndianRupee, Loader2, AlertCircle, X, Lock } from "lucide-react";
import { AiEvaluationStepper } from "./AiEvaluationStepper";
import { AiEvaluationResponse } from "../api/ai-evaluate/route";
import { parseDateForInput, normalizeEventType, validateEventParameters } from "@/lib/calendar-utils";

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
            completeButtonText={isAuthenticated ? "Submit to AI Evaluation →" : "Sign In & Evaluate with AI 🔒"}
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
              {/* Step 1: Event Details Input (Event Name, Event Type, Budget, Date, Guests) */}
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
                      <label className="block text-xs font-bold text-[#2E131E] mb-1.5">
                        Event Name <span className="text-[#B5473C]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Annual Global Tech Summit 2026"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all shadow-2xs"
                        required
                      />
                    </div>

                    {/* 2. Event Type */}
                    <div>
                      <label className="block text-xs font-bold text-[#2E131E] mb-1.5">
                        Event Type <span className="text-[#B5473C]">*</span>
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
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
                      <label className="block text-xs font-bold text-[#2E131E] mb-1.5">
                        Estimated Budget (₹) <span className="text-[#B5473C]">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A6775] text-xs font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          placeholder="e.g. 500000"
                          value={eventBudget}
                          onChange={(e) => setEventBudget(e.target.value)}
                          className="w-full pl-8 pr-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all shadow-2xs"
                          min="1"
                          step="5000"
                          required
                        />
                      </div>
                      {eventBudget !== "" && Number(eventBudget) <= 0 && (
                        <p className="text-[11px] text-[#B5473C] mt-1 font-semibold">
                          Budget must be greater than ₹0
                        </p>
                      )}
                    </div>

                    {/* 4. Date of the Event */}
                    <div>
                      <label className="block text-xs font-bold text-[#2E131E] mb-1.5">
                        Date of the Event <span className="text-[#B5473C]">*</span>
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        min={tomorrowStr}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all cursor-pointer shadow-2xs"
                        required
                      />
                      {eventDate && validation.errors.eventDate && (
                        <p className="text-[11px] text-[#B5473C] mt-1 font-semibold">
                          {validation.errors.eventDate}
                        </p>
                      )}
                    </div>

                    {/* 5. Estimated Guest Count */}
                    <div>
                      <label className="block text-xs font-bold text-[#2E131E] mb-1.5">
                        Estimated Guest Count <span className="text-[#B5473C]">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 150"
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all shadow-2xs"
                        min="1"
                        step="10"
                      />
                    </div>

                    {/* 6. Package Tier */}
                    <div>
                      <label className="block text-xs font-bold text-[#2E131E] mb-1.5">
                        Package Tier <span className="text-[#D44372] font-normal">(Starter, Basic, Professional)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Starter", "Basic", "Professional"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
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
                        <label className="block text-xs font-bold text-[#2E131E]">
                          What are things that be need for these <span className="text-[#B5473C]">*</span>
                        </label>
                        <span className="text-[10.5px] text-[#9F224E] font-bold bg-[#FDF0F4] px-2.5 py-0.5 rounded-full border border-[#D44372]/30">
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
                          className="w-full pl-4 pr-24 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddPlanningItem}
                          disabled={!currentPlanningInput.trim()}
                          className="absolute right-1.5 px-3.5 py-1.5 rounded-full bg-[#D44372] hover:bg-[#BE335E] disabled:bg-[#F7D6DF] disabled:text-[#8A6775] text-white text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-[#8A6775] mt-1.5">
                        Type any word or phrase, then press <strong>Enter</strong> to create sub-part bullet points below.
                      </p>
                    </div>

                    {/* Suggested Quick Add Chips */}
                    <div>
                      <span className="text-[11px] font-bold text-[#2E131E] block mb-1.5">
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
                            className="text-[11px] px-3 py-1.5 rounded-full bg-white border border-[#F7D6DF] text-[#2E131E] hover:border-[#D44372] hover:text-[#2E131E] hover:bg-[#FDF0F4] transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
                          >
                            <Plus className="w-3 h-3 text-[#D44372]" />
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bullet Points / Sub parts display */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#2E131E] flex items-center gap-2">
                          <span>Planning Points</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/30">
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
                        <div className="p-4 rounded-2xl border border-dashed border-[#F7D6DF] bg-[#FDF0F4]/30 text-center space-y-1.5">
                          <p className="text-xs font-semibold text-[#2E131E]">
                            No planning points added yet
                          </p>
                          <p className="text-[11px] text-[#8A6775]">
                            Type in the input box above and press Enter, or choose from quick suggestions.
                          </p>
                          <p className="text-[11px] font-semibold text-[#B5473C] bg-[#FFF4F6] border border-[#F7C4D2] px-3 py-1 rounded-full inline-flex items-center gap-1.5 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> At least 1 planning point is required to continue.
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {planningItems.map((item, index) => (
                            <li
                              key={index}
                              className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-[#F7D6DF] hover:border-[#D44372]/50 hover:bg-[#FDF0F4]/20 transition-all shadow-2xs"
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                {/* Stylized bullet point */}
                                <span className="w-2 h-2 rounded-full bg-[#D44372] mt-1.5 shrink-0 shadow-2xs group-hover:scale-125 transition-transform" />
                                <span className="text-xs text-[#2E131E] font-medium leading-relaxed break-words">
                                  {item}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePlanningItem(index)}
                                className="opacity-60 group-hover:opacity-100 hover:text-[#B5473C] text-[#8A6775] p-1 rounded-full transition-colors cursor-pointer shrink-0"
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
                    <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#2E131E]">
                      Review Parameters
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8A6775]">
                      Verify your details before submitting to Kordena AI for evaluation.
                    </p>
                  </div>

                  {!validation.isValid && (
                    <div className="bg-[#FFF4F6] border border-[#F7C4D2] rounded-2xl p-4 text-xs flex items-start gap-2.5 text-[#B5473C] animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B5473C]" />
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
                  </div>

                  {/* Auth Session Status & AI Notice */}
                  {!isAuthenticated ? (
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
