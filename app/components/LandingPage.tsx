"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Stepper, { Step } from "./Stepper";
import { EventCalendarView } from "./EventCalendarView";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

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
  const [selectedPlan, setSelectedPlan] = useState("Professional Suite");

  // Redirect state to Calendar UI
  const [showCalendar, setShowCalendar] = useState(false);

  const handleFinalStep = () => {
    console.log("Stepper completed on landing page:", {
      eventName,
      eventType,
      eventBudget,
      eventDate,
      selectedPlan,
    });
    // Redirect to the Calendar UI as requested
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

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="text-xs font-semibold text-[#718096] hover:text-[#2D3748] px-3 py-2 cursor-pointer"
              >
                ← Back to Stepper
              </button>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#10B981] text-white hover:bg-[#059669] transition-all cursor-pointer shadow-xs"
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
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F5] p-4 sm:p-6">
      <div className="w-full max-w-[640px] flex flex-col items-center">
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

        <Stepper
          initialStep={1}
          onStepChange={(step) => console.log("Landing stepper step:", step)}
          onFinalStepCompleted={handleFinalStep}
          backButtonText="Back"
          nextButtonText="Continue"
          orientation="vertical"
          width={640}
          completeButtonText="Submit & Open Calendar"
          theme="light"
          accentColor="#10B981"
          radius={24}
          className="border border-[#E2ECE5] shadow-xl bg-white/95"
        >
          {/* Step 1: Event Details Input (Event Name, Event Type, Budget, Date) */}
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
                    Estimated Budget ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718096] text-xs font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={eventBudget}
                      onChange={(e) => setEventBudget(e.target.value)}
                      className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-[#E2ECE5] bg-white text-xs sm:text-sm text-[#2D3748] focus:outline-none focus:border-[#10B981] transition-colors"
                      min="0"
                      step="500"
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
              </div>
            </div>
          </Step>

          {/* Step 2: Plan Selection */}
          <Step title="Plan">
            <div className="space-y-4 py-1">
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
                    desc: "Core budgeting, milestone schedules, and basic vendor checklist.",
                  },
                  {
                    name: "Professional Suite",
                    tag: "Recommended",
                    desc: "Full generative synthesis, Kordena Copilot, and budget alerts.",
                  },
                  {
                    name: "Enterprise Architecture",
                    tag: "Multi-Team",
                    desc: "Custom vendor contracts, multi-day schedules, and dedicated support.",
                  },
                ].map((p) => (
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
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Step>

          {/* Step 3: Review */}
          <Step title="Review">
            <div className="space-y-4 py-1">
              <div>
                <h3 className="text-lg font-bold text-[#2D3748]">Looking good</h3>
                <p className="text-xs sm:text-sm text-[#718096]">
                  Complete setup to view your marked event on the Calendar.
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
                    {eventBudget ? `$${Number(eventBudget).toLocaleString()}` : "Not specified"}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#718096]">Event Date:</span>
                  <strong className="text-[#2D3748]">{eventDate || "Date TBD"}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#718096]">Selected Plan:</span>
                  <strong className="text-[#2D3748]">{selectedPlan}</strong>
                </div>
              </div>
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
      </div>
    </div>
  );
};
