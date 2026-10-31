"use client";

import React from "react";
import Stepper, { Step } from "./Stepper";
import { Plus, X, AlertCircle } from "lucide-react";
import { EventValidationResult } from "@/lib/calendar-utils";

export interface BlueprintCreationStepperProps {
  stepperKey: number;
  stepperCurrentStep: number;
  setStepperCurrentStep: (step: number) => void;
  eventName: string;
  setEventName: (val: string) => void;
  eventType: string;
  setEventType: (val: string) => void;
  eventBudget: string;
  setEventBudget: (val: string) => void;
  eventDate: string;
  setEventDate: (val: string) => void;
  tomorrowStr: string;
  guestCount: string;
  setGuestCount: (val: string) => void;
  eventTier: "Starter" | "Basic" | "Professional";
  setEventTier: (val: "Starter" | "Basic" | "Professional") => void;
  planningItems: string[];
  setPlanningItems: React.Dispatch<React.SetStateAction<string[]>>;
  currentPlanningInput: string;
  setCurrentPlanningInput: (val: string) => void;
  handleAddPlanningItem: () => void;
  handleRemovePlanningItem: (index: number) => void;
  validation: EventValidationResult;
  onFinalStepCompleted: () => void;
  completeButtonText?: string;
  leadOrganizerName?: string;
  idPrefix?: string;
  extraReviewContent?: React.ReactNode;
}

const QUICK_SUGGESTIONS = [
  "Stage & Audio Setup",
  "Catering & Refreshments",
  "Photography & Videography",
  "Guest Badges & Welcome Kit",
  "Decorations & Floral Backdrop",
  "VIP Seating & Hostess Desk",
];

export const BlueprintCreationStepper: React.FC<BlueprintCreationStepperProps> = ({
  stepperKey,
  stepperCurrentStep,
  setStepperCurrentStep,
  eventName,
  setEventName,
  eventType,
  setEventType,
  eventBudget,
  setEventBudget,
  eventDate,
  setEventDate,
  tomorrowStr,
  guestCount,
  setGuestCount,
  eventTier,
  setEventTier,
  planningItems,
  setPlanningItems,
  currentPlanningInput,
  setCurrentPlanningInput,
  handleAddPlanningItem,
  handleRemovePlanningItem,
  validation,
  onFinalStepCompleted,
  completeButtonText = "Submit to AI Evaluation →",
  leadOrganizerName = "Planner",
  idPrefix = "",
  extraReviewContent,
}) => {
  const prefix = idPrefix ? `${idPrefix}-` : "";
  const nameId = `${prefix}event-name-input`;
  const typeId = `${prefix}event-type-select`;
  const budgetId = `${prefix}event-budget-input`;
  const budgetErrorId = `${prefix}event-budget-error`;
  const dateId = `${prefix}event-date-input`;
  const dateErrorId = `${prefix}event-date-error`;
  const guestsId = `${prefix}guest-count-input`;
  const tierGroupId = `${prefix}tier-selection-label`;
  const planningInputId = `${prefix}planning-item-input`;
  const quickSuggestionsId = `${prefix}quick-suggestions-label`;
  const planningPointsHeadingId = `${prefix}planning-points-heading`;

  return (
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
      onFinalStepCompleted={onFinalStepCompleted}
      backButtonText="Back"
      nextButtonText="Continue"
      orientation="vertical"
      width={640}
      completeButtonText={completeButtonText}
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
      {/* Step 1: Event Details Input (Event Name, Event Type, Budget, Date, Guests, Tier) */}
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
              <label htmlFor={nameId} className="block text-xs font-bold text-[#2E131E] mb-1.5">
                Event Name <span className="text-[#B5473C]" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id={nameId}
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
              <label htmlFor={typeId} className="block text-xs font-bold text-[#2E131E] mb-1.5">
                Event Type <span className="text-[#B5473C]" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <select
                id={typeId}
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
              <label htmlFor={budgetId} className="block text-xs font-bold text-[#2E131E] mb-1.5">
                Estimated Budget (₹) <span className="text-[#B5473C]" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A6775] text-xs font-bold" aria-hidden="true">
                  ₹
                </span>
                <input
                  id={budgetId}
                  type="number"
                  placeholder="e.g. 500000"
                  value={eventBudget}
                  onChange={(e) => setEventBudget(e.target.value)}
                  aria-required="true"
                  aria-invalid={eventBudget !== "" && Number(eventBudget) <= 0}
                  aria-describedby={eventBudget !== "" && Number(eventBudget) <= 0 ? budgetErrorId : undefined}
                  className="w-full pl-8 pr-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all shadow-2xs"
                  min="1"
                  step="5000"
                  required
                />
              </div>
              {eventBudget !== "" && Number(eventBudget) <= 0 && (
                <p id={budgetErrorId} role="alert" className="text-[11px] text-[#B5473C] mt-1 font-semibold">
                  Budget must be greater than ₹0
                </p>
              )}
            </div>

            {/* 4. Date of the Event */}
            <div>
              <label htmlFor={dateId} className="block text-xs font-bold text-[#2E131E] mb-1.5">
                Date of the Event <span className="text-[#B5473C]" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id={dateId}
                type="date"
                value={eventDate}
                min={tomorrowStr}
                onChange={(e) => setEventDate(e.target.value)}
                aria-required="true"
                aria-invalid={Boolean(eventDate && validation.errors.eventDate)}
                aria-describedby={eventDate && validation.errors.eventDate ? dateErrorId : undefined}
                className="w-full px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-all cursor-pointer shadow-2xs"
                required
              />
              {eventDate && validation.errors.eventDate && (
                <p id={dateErrorId} role="alert" className="text-[11px] text-[#B5473C] mt-1 font-semibold">
                  {validation.errors.eventDate}
                </p>
              )}
            </div>

            {/* 5. Estimated Guest Count */}
            <div>
              <label htmlFor={guestsId} className="block text-xs font-bold text-[#2E131E] mb-1.5">
                Estimated Guest Count <span className="text-[#B5473C]" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id={guestsId}
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
              <label id={tierGroupId} className="block text-xs font-bold text-[#2E131E] mb-1.5">
                Package Tier <span className="text-[#D44372] font-normal">(Starter, Basic, Professional)</span>
              </label>
              <div role="radiogroup" aria-labelledby={tierGroupId} className="grid grid-cols-3 gap-2">
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
                <label htmlFor={planningInputId} className="block text-xs font-bold text-[#2E131E]">
                  What are things that be need for these <span className="text-[#B5473C]" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </label>
                <span className="text-[10.5px] text-[#9F224E] font-bold bg-[#FDF0F4] px-2.5 py-0.5 rounded-full border border-[#D44372]/30">
                  Press Enter ↵ to add
                </span>
              </div>

              <div className="relative flex items-center">
                <input
                  id={planningInputId}
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
              <span id={quickSuggestionsId} className="text-[11px] font-bold text-[#2E131E] block mb-1.5">
                Quick suggestions:
              </span>
              <div role="group" aria-labelledby={quickSuggestionsId} className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((suggestion) => (
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
                <label id={planningPointsHeadingId} className="text-xs font-bold text-[#2E131E] flex items-center gap-2">
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
                <ul aria-labelledby={planningPointsHeadingId} className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {planningItems.map((item, index) => (
                    <li
                      key={index}
                      className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-[#F7D6DF] hover:border-[#D44372]/50 hover:bg-[#FDF0F4]/20 transition-all shadow-2xs"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
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
              <strong className="text-[#2E131E] font-semibold">{leadOrganizerName}</strong>
            </div>
          </div>

          {extraReviewContent}
        </div>
      </Step>
    </Stepper>
  );
};
