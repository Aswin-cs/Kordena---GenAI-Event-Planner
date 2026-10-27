"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Stepper, { Step } from "./Stepper";
import { EventCalendarView } from "./EventCalendarView";
import { EventHistories } from "./EventHistories";
import { initialEvents } from "../mockData";
import { EventPlan } from "../types";
import { Sparkles, ArrowRight, Plus, IndianRupee, Loader2, AlertCircle, X } from "lucide-react";
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

export const LandingPage: React.FC<LandingPageProps> = () => {
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

  // Events history state
  const [events, setEvents] = useState<EventPlan[]>(initialEvents);
  const [activeEventId, setActiveEventId] = useState<string>(initialEvents[0].id);

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

  const handleDeleteEventFromHistory = (eventId: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
  };

  const handleTriggerAiEvaluation = async () => {
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
      if (!data.success) {
        throw new Error(data.message || "Failed to analyze event with AI");
      }

      setAiEvaluationData(data);
      setShowAiStepper(true);
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
    } catch (err) {
      console.error("Guest save error:", err);
    } finally {
      setIsSaving(false);
    }

    if (eventName.trim()) {
      const activeEv = events.find((e) => e.id === activeEventId) || events[0];
      const newPlan: EventPlan = {
        ...activeEv,
        id: `event-${Date.now()}`,
        title: eventName,
        tagline: evalSelections.aiSummary || `${eventType} architected with Kordena GenAI`,
        eventType: eventType,
        date: eventDate || new Date().toISOString().split("T")[0],
        totalBudget: Number(eventBudget) || 250000,
        guestCount: Number(guestCount) || 100,
      };
      setEvents((prev) => [newPlan, ...prev]);
      setActiveEventId(newPlan.id);
    }

    setShowCalendar(true);
  };

  if (showCalendar) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex flex-col">
        {/* Top bar with quick sign-in banner */}
        <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#E2ECE5] shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white shadow-xs shadow-[#10B981]/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[#2D3748]">Kordena</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="text-xs font-semibold text-[#718096] hover:text-[#2D3748] px-3 py-2 cursor-pointer"
              >
                ← Back to Stepper
              </button>
              <button
                type="button"
                onClick={handleStartNewEvent}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white shadow-xs shadow-[#10B981]/25 transition-all cursor-pointer group"
                title="Create New Event"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
                <span>New Event</span>
              </button>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F4F7F5] hover:bg-[#E2ECE5] text-[#2D3748] border border-[#E2ECE5] transition-all cursor-pointer shadow-2xs"
              >
                <span>Save with Google</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
            organizerName="Guest Planner"
            onBackToStepper={() => setShowCalendar(false)}
            onNewEvent={handleStartNewEvent}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#E2ECE5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white shadow-xs shadow-[#10B981]/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#2D3748]">Kordena</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
                Event Studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleStartNewEvent}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white shadow-xs shadow-[#10B981]/25 transition-all cursor-pointer group"
              title="Create New Event"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
              <span>New Event</span>
            </button>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F4F7F5] hover:bg-[#E2ECE5] text-[#2D3748] border border-[#E2ECE5] transition-all cursor-pointer shadow-2xs"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Title */}
          <div className="text-center mb-6 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Kordena Event Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D3748] tracking-tight">
              Configure Your Event Blueprint
            </h1>
            <p className="text-xs sm:text-sm text-[#718096]">
              Input your event parameters to mark your event date on the Calendar.
            </p>
          </div>

          {/* AI Evaluation Error Alert */}
          {aiEvalError && (
            <div className="w-full mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between text-xs animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">AI Evaluation Notice:</span>
                  <p className="mt-0.5">{aiEvalError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTriggerAiEvaluation()}
                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer shrink-0 ml-3 text-[11px]"
              >
                Retry
              </button>
            </div>
          )}

          {/* AI Evaluation Loading Overlay Modal */}
          {isAiEvaluating && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E2ECE5] flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white shadow-lg shadow-[#10B981]/30 animate-pulse">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2D3748]">
                    Kordena AI is Evaluating Your Event
                  </h3>
                  <p className="text-xs sm:text-sm text-[#718096] mt-1">
                    Analyzing parameters for <strong>{eventName || "your event"}</strong> ({eventType}, {guestCount} guests, ₹{Number(eventBudget || 250000).toLocaleString("en-IN")})...
                  </p>
                </div>
                <div className="w-full bg-[#F4F7F5] h-2 rounded-full overflow-hidden border border-[#E2ECE5]">
                  <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full animate-pulse w-3/4" />
                </div>
                <p className="text-[11px] text-[#059669] font-semibold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Synthesizing tailored decorations, arrangements & requirements...
                </p>
              </div>
            </div>
          )}

          {/* If AI Stepper Stage is Active, render AiEvaluationStepper */}
          {showAiStepper && aiEvaluationData ? (
            <AiEvaluationStepper
              eventData={{
                eventName: eventName.trim() || "Untitled Event",
                eventType,
                tier: eventTier,
                budget: eventBudget || "250000",
                guestCount: guestCount || "100",
                eventDate,
              }}
              aiEvaluation={aiEvaluationData}
              onBackToParams={() => setShowAiStepper(false)}
              onComplete={handleFinalSaveWithAi}
              isSaving={isSaving}
            />
          ) : (
            <Stepper
              key={stepperKey}
              initialStep={1}
              onStepChange={(step) => console.log("Landing stepper step:", step)}
              onFinalStepCompleted={handleTriggerAiEvaluation}
              backButtonText="Back"
              nextButtonText="Continue"
              orientation="vertical"
              width={640}
              completeButtonText="Submit to AI Evaluation →"
              theme="light"
              accentColor="#10B981"
              radius={24}
              className="border border-[#E2ECE5] shadow-xl bg-white/95"
            >
              {/* Step 1: Event Details Input (Event Name, Event Type, Budget, Date, Guests) */}
              <Step title="Event Info">
                <div className="space-y-4 py-1">
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3748]">Event Parameters</h3>
                    <p className="text-xs sm:text-sm text-[#718096]">
                      Enter the name, type, budget, and date for your event.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* 1. Event Name */}
                    <div>
                      <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                        Event Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Annual Global Tech Summit 2026"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2ECE5] bg-white text-xs sm:text-sm text-[#2D3748] focus:outline-none focus:border-[#10B981] transition-colors"
                        required
                      />
                    </div>

                    {/* 2. Event Type */}
                    <div>
                      <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                        Event Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2ECE5] bg-white text-xs sm:text-sm text-[#2D3748] focus:outline-none focus:border-[#10B981] transition-colors cursor-pointer"
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
                      <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                        Estimated Budget (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718096] text-xs font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          placeholder="e.g. 500000"
                          value={eventBudget}
                          onChange={(e) => setEventBudget(e.target.value)}
                          className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-[#E2ECE5] bg-white text-xs sm:text-sm text-[#2D3748] focus:outline-none focus:border-[#10B981] transition-colors"
                          min="0"
                          step="5000"
                        />
                      </div>
                    </div>

                    {/* 4. Date of the Event */}
                    <div>
                      <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                        Date of the Event <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2ECE5] bg-white text-xs sm:text-sm text-[#2D3748] focus:outline-none focus:border-[#10B981] transition-colors cursor-pointer"
                      />
                    </div>

                    {/* 5. Estimated Guest Count */}
                    <div>
                      <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                        Estimated Guest Count <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 150"
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2ECE5] bg-white text-xs sm:text-sm text-[#2D3748] focus:outline-none focus:border-[#10B981] transition-colors"
                        min="1"
                        step="10"
                      />
                    </div>

                    {/* 6. Package Tier */}
                    <div>
                      <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                        Package Tier <span className="text-[#10B981] font-normal">(Starter, Basic, Professional)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Starter", "Basic", "Professional"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setEventTier(t)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                              eventTier === t
                                ? "border-[#10B981] bg-[#E6F7F0] text-[#059669] shadow-2xs"
                                : "border-[#E2ECE5] bg-white text-[#718096] hover:bg-[#F4F7F5]"
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
                    <h3 className="text-lg font-bold text-[#2D3748]">Planning Requirements</h3>
                    <p className="text-xs sm:text-sm text-[#718096]">
                      Specify the essential items, services, or sub-arrangements needed for your event.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Input Box with exact requested label */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-[#2D3748]">
                          What are things that be need for these <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10.5px] text-[#059669] font-semibold bg-[#E6F7F0] px-2 py-0.5 rounded-md border border-[#A7F3D0]">
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
                          className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-[#E2ECE5] bg-white text-xs sm:text-sm text-[#2D3748] placeholder:text-[#A0AEC0] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15 transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddPlanningItem}
                          disabled={!currentPlanningInput.trim()}
                          className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] disabled:bg-[#E2ECE5] disabled:text-[#A0AEC0] text-white text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-[#718096] mt-1.5">
                        Type any word or 5-word sentence, then press <strong>Enter</strong> to create sub-part bullet points below.
                      </p>
                    </div>

                    {/* Suggested Quick Add Chips */}
                    <div>
                      <span className="text-[11px] font-semibold text-[#718096] block mb-1.5">
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
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#E2ECE5] text-[#4A5568] hover:border-[#10B981] hover:text-[#059669] hover:bg-[#E6F7F0]/50 transition-all cursor-pointer font-medium flex items-center gap-1 shadow-2xs"
                          >
                            <Plus className="w-3 h-3 text-[#10B981]" />
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bullet Points / Sub parts display */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#2D3748] flex items-center gap-1.5">
                          <span>Planning Points</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
                            {planningItems.length} {planningItems.length === 1 ? "item" : "items"}
                          </span>
                        </label>
                        {planningItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPlanningItems([])}
                            className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {planningItems.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center space-y-1">
                          <p className="text-xs font-medium text-[#64748B]">
                            No planning points added yet
                          </p>
                          <p className="text-[11px] text-[#94A3B8]">
                            Type in the input box above and press Enter to generate bullet points.
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {planningItems.map((item, index) => (
                            <li
                              key={index}
                              className="group flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2ECE5] hover:border-[#A7F3D0] hover:bg-[#F0FDF4] transition-all"
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                {/* Stylized bullet point */}
                                <span className="w-2 h-2 rounded-full bg-[#10B981] mt-1.5 shrink-0 shadow-2xs group-hover:scale-125 transition-transform" />
                                <span className="text-xs text-[#2D3748] font-medium leading-relaxed break-words">
                                  {item}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePlanningItem(index)}
                                className="opacity-60 group-hover:opacity-100 hover:text-rose-600 text-[#718096] p-1 rounded-md transition-colors cursor-pointer shrink-0"
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
                    <h3 className="text-lg font-bold text-[#2D3748]">Review Parameters</h3>
                    <p className="text-xs sm:text-sm text-[#718096]">
                      Verify your details before submitting to Kordena AI for evaluation.
                    </p>
                  </div>

                  <div className="bg-[#F4F7F5] p-4 rounded-2xl border border-[#E2ECE5] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#718096]">Event Name:</span>
                      <strong className="text-[#2D3748]">{eventName || "Untitled Event"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#718096]">Event Type:</span>
                      <strong className="text-[#2D3748]">{eventType}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#718096]">Estimated Budget:</span>
                      <strong className="text-[#10B981]">
                        {eventBudget ? `₹${Number(eventBudget).toLocaleString("en-IN")}` : "Not specified"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#718096]">Package Tier:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
                        {eventTier}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#718096]">Event Date:</span>
                      <strong className="text-[#2D3748]">{eventDate || "Date TBD"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#718096]">Guest Count:</span>
                      <strong className="text-[#2D3748]">{guestCount || "100"} guests</strong>
                    </div>

                    {/* Planning Points Review */}
                    <div className="pt-2 border-t border-[#E2ECE5]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[#718096]">Planning Points:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
                          {planningItems.length} {planningItems.length === 1 ? "point" : "points"}
                        </span>
                      </div>
                      {planningItems.length > 0 ? (
                        <ul className="space-y-1.5 pl-1 max-h-32 overflow-y-auto">
                          {planningItems.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[#2D3748]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1 shrink-0" />
                              <span className="font-medium text-[11.5px] leading-snug">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#718096] italic text-[11px]">
                          No custom planning points specified (AI will infer defaults)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Step>
            </Stepper>
          )}

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
      </div>
    </div>
  </div>
  );
};
