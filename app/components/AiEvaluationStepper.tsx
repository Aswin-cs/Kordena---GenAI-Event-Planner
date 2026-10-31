"use client";

import React, { useState } from "react";
import Stepper, { Step } from "./Stepper";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  ArrowLeft,
  Calendar,
  Users,
  IndianRupee,
  Palette,
  ClipboardList,
  Cpu,
  Layers,
  X,
  Check,
  Star,
} from "lucide-react";
import { AiEvaluationResponse, AiEvaluationOption } from "../api/ai-evaluate/route";

interface AiEvaluationStepperProps {
  eventData: {
    eventName: string;
    eventType: string;
    budget: number | string;
    guestCount: number | string;
    eventDate: string;
    tier?: "Starter" | "Basic" | "Professional";
  };
  aiEvaluation: AiEvaluationResponse;
  onBackToParams: () => void;
  onComplete: (data: {
    decorations: string[];
    arrangements: string[];
    requirements: string[];
    aiSummary: string;
    aiResponse?: AiEvaluationResponse;
    tier?: "Starter" | "Basic" | "Professional";
  }) => Promise<void> | void;
  isSaving?: boolean;
}

export const AiEvaluationStepper: React.FC<AiEvaluationStepperProps> = ({
  eventData,
  aiEvaluation,
  onBackToParams,
  onComplete,
  isSaving = false,
}) => {
  const { aiSummary, questions } = aiEvaluation;

  // Selected tier
  const [selectedTier, setSelectedTier] = useState<"Starter" | "Basic" | "Professional">(
    eventData.tier || "Starter"
  );

  // Selected decorations
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>(() => {
    return questions.decorations.options
      .filter((o) => o.recommended)
      .map((o) => o.label);
  });
  const [customDecor, setCustomDecor] = useState("");

  // Selected arrangements
  const [selectedArrangements, setSelectedArrangements] = useState<string[]>(() => {
    return questions.arrangements.options
      .filter((o) => o.status === "Done")
      .map((o) => o.label);
  });
  const [customArrangement, setCustomArrangement] = useState("");

  // Selected requirements
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>(() => {
    return questions.requirements.options
      .filter((o) => o.tag === "Essential")
      .map((o) => o.label);
  });
  const [customRequirement, setCustomRequirement] = useState("");

  // Toggle helpers
  const toggleItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleAddCustom = (
    val: string,
    setVal: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = val.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setVal("");
    }
  };

  const handleFinalSubmit = () => {
    const summaryText = `${aiSummary.headline}. ${aiSummary.overview}`;
    onComplete({
      decorations: selectedDecorations,
      arrangements: selectedArrangements,
      requirements: selectedRequirements,
      aiSummary: summaryText,
      aiResponse: aiEvaluation,
      tier: selectedTier,
    });
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header Banner */}
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/40 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#D44372]" />
          <span>Kordena AI Evaluation Stepper</span>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-medium text-[#2E131E] tracking-tight">
          AI Architecture & Parameters Evaluation
        </h2>
        <p className="text-xs sm:text-sm text-[#8A6775] max-w-xl mx-auto">
          AI analyzed <strong className="text-[#2E131E]">{eventData.eventName}</strong>. Select your planned decorations, completed arrangements, and required logistics below.
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={onBackToParams}
            className="inline-flex items-center gap-1.5 text-xs text-[#8A6775] hover:text-[#2E131E] transition-colors font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit Initial Event Details</span>
          </button>
        </div>
      </div>

      {/* Main Stepper */}
      <Stepper
        initialStep={1}
        orientation="vertical"
        width={720}
        backButtonText="Back"
        nextButtonText="Next"
        completeButtonText={isSaving ? "Saving Event..." : "Confirm & Open Calendar"}
        onFinalStepCompleted={handleFinalSubmit}
        theme="light"
        accentColor="#D44372"
        radius={28}
        className="border border-[#F7D6DF] shadow-[0_24px_48px_-32px_rgba(212,67,114,0.18)] bg-white rounded-[28px] p-2 sm:p-4"
      >
        {/* Step 1: AI Evaluation Summary */}
        <Step title="AI Summary">
          <div className="space-y-4 py-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F224E] bg-[#FDF0F4] px-2.5 py-0.5 rounded-full border border-[#D44372]/40">
                  AI Synthesis
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#2E131E] mt-2">
                  {aiSummary.headline}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#2E131E] leading-relaxed bg-[#FDF0F4]/40 p-4 rounded-2xl border border-[#F7D6DF]">
              {aiSummary.overview}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3.5 rounded-2xl bg-white border border-[#F7D6DF] shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#8A6775] text-[11px] font-semibold mb-1">
                  <IndianRupee className="w-3.5 h-3.5 text-[#D44372]" />
                  <span>Budget / Guest</span>
                </div>
                <div className="text-sm font-bold text-[#2E131E] font-[family-name:var(--font-display)]">
                  {aiSummary.budgetPerGuest}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#F7D6DF] shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#8A6775] text-[11px] font-semibold mb-1">
                  <Layers className="w-3.5 h-3.5 text-[#2E131E]" />
                  <span>Feasibility</span>
                </div>
                <div className="text-xs font-bold text-[#2E131E]">
                  {aiSummary.feasibility}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#F7D6DF] shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#8A6775] text-[11px] font-semibold mb-1">
                  <Palette className="w-3.5 h-3.5 text-[#D44372]" />
                  <span>Recommended Vibe</span>
                </div>
                <div className="text-[11px] font-bold text-[#2E131E] line-clamp-2">
                  {aiSummary.recommendedVibe}
                </div>
              </div>
            </div>

            {/* Package Tier Selector */}
            <div className="p-4 rounded-2xl bg-white border border-[#F7D6DF] shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div id="ai-stepper-tier-label" className="flex items-center gap-1.5 text-[#2E131E] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#D44372]" aria-hidden="true" />
                  <span>Package Tier</span>
                </div>
                <span className="text-[10px] font-bold text-[#9F224E] bg-[#FDF0F4] px-2.5 py-0.5 rounded-full border border-[#D44372]/40">
                  {selectedTier} Selected
                </span>
              </div>
              <div role="radiogroup" aria-labelledby="ai-stepper-tier-label" className="grid grid-cols-3 gap-2">
                {(["Starter", "Basic", "Professional"] as const).map((tierOption) => (
                  <button
                    key={tierOption}
                    type="button"
                    role="radio"
                    aria-checked={selectedTier === tierOption}
                    onClick={() => setSelectedTier(tierOption)}
                    className={`py-2 px-3 rounded-full text-xs font-bold border transition-all text-center cursor-pointer ${
                      selectedTier === tierOption
                        ? "border-[#D44372] bg-[#D44372] text-white shadow-xs"
                        : "border-[#F7D6DF] bg-white text-[#8A6775] hover:bg-[#FDF0F4] hover:text-[#2E131E]"
                    }`}
                  >
                    {tierOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FDF0F4]/60 border border-[#D44372]/30 flex items-center gap-2.5 text-xs text-[#2E131E]">
              <Sparkles className="w-4 h-4 text-[#D44372] shrink-0" />
              <span>
                Proceed to the next steps to select your planned <strong>decorations</strong>, confirm <strong>arrangements done</strong>, and identify <strong>requirements</strong>.
              </span>
            </div>
          </div>
        </Step>

        {/* Step 2: Decorations Planning */}
        <Step title="Decorations">
          <div className="space-y-4 py-1">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F224E] bg-[#FDF0F4] px-2.5 py-0.5 rounded-full border border-[#D44372]/30">
                  Question 1 of 3
                </span>
                <span className="text-xs font-semibold text-[#8A6775]">
                  {selectedDecorations.length} selected
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#2E131E]">
                {questions.decorations.question}
              </h3>
              <p className="text-xs sm:text-sm text-[#8A6775]">
                {questions.decorations.description}
              </p>
            </div>

            {/* Selection Options List */}
            <div role="group" aria-label="Decorations options" className="space-y-2 pt-1 max-h-[300px] overflow-y-auto pr-1">
              {questions.decorations.options.map((opt) => {
                const isSelected = selectedDecorations.includes(opt.label);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`${opt.label}: ${opt.description}${opt.recommended ? " (AI Recommended)" : ""}`}
                    onClick={() =>
                      toggleItem(
                        selectedDecorations,
                        setSelectedDecorations,
                        opt.label
                      )
                    }
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#D44372] bg-[#FDF0F4]/50 shadow-xs"
                        : "border-[#F7D6DF] bg-white hover:bg-[#FDF0F4]/20"
                    }`}
                  >
                    <div className="pr-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#2E131E]">
                          {opt.label}
                        </span>
                        {opt.recommended && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D44372] text-white">
                            AI Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8A6775] mt-0.5">
                        {opt.description}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5" aria-hidden="true">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-[#2E131E]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#CBD5E1]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="pt-2 flex items-center gap-2">
              <input
                id="custom-decor-input"
                type="text"
                placeholder="Add other decoration item..."
                aria-label="Add custom decoration item"
                value={customDecor}
                onChange={(e) => setCustomDecor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustom(
                      customDecor,
                      setCustomDecor,
                      selectedDecorations,
                      setSelectedDecorations
                    );
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] shadow-2xs"
              />
              <button
                type="button"
                aria-label="Add custom decoration"
                onClick={() =>
                  handleAddCustom(
                    customDecor,
                    setCustomDecor,
                    selectedDecorations,
                    setSelectedDecorations
                  )
                }
                className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#D44372] text-white hover:bg-[#BE335E] transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </Step>

        {/* Step 3: Arrangements Status */}
        <Step title="Arrangements">
          <div className="space-y-4 py-1">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F224E] bg-[#FDF0F4] px-2.5 py-0.5 rounded-full border border-[#D44372]/30">
                  Question 2 of 3
                </span>
                <span className="text-xs font-semibold text-[#8A6775]">
                  {selectedArrangements.length} confirmed done
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#2E131E]">
                {questions.arrangements.question}
              </h3>
              <p className="text-xs sm:text-sm text-[#8A6775]">
                {questions.arrangements.description}
              </p>
            </div>

            {/* Selection Options List */}
            <div role="group" aria-label="Arrangements options" className="space-y-2 pt-1 max-h-[300px] overflow-y-auto pr-1">
              {questions.arrangements.options.map((opt) => {
                const isSelected = selectedArrangements.includes(opt.label);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`${opt.label}: ${opt.description}${opt.status ? ` (${opt.status})` : ""}`}
                    onClick={() =>
                      toggleItem(
                        selectedArrangements,
                        setSelectedArrangements,
                        opt.label
                      )
                    }
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#D44372] bg-[#FDF0F4]/50 shadow-xs"
                        : "border-[#F7D6DF] bg-white hover:bg-[#FDF0F4]/20"
                    }`}
                  >
                    <div className="pr-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#2E131E]">
                          {opt.label}
                        </span>
                        {opt.status && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              opt.status === "Done"
                                ? "bg-[#D44372] text-white"
                                : opt.status === "In Progress"
                                ? "bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/40"
                                : "bg-[#F4F7F5] text-[#8A6775]"
                            }`}
                          >
                            {opt.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8A6775] mt-0.5">
                        {opt.description}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5" aria-hidden="true">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-[#2E131E]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#CBD5E1]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="pt-2 flex items-center gap-2">
              <input
                id="custom-arrangement-input"
                type="text"
                placeholder="Add other arrangement done..."
                aria-label="Add custom arrangement item"
                value={customArrangement}
                onChange={(e) => setCustomArrangement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustom(
                      customArrangement,
                      setCustomArrangement,
                      selectedArrangements,
                      setSelectedArrangements
                    );
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] shadow-2xs"
              />
              <button
                type="button"
                aria-label="Add custom arrangement"
                onClick={() =>
                  handleAddCustom(
                    customArrangement,
                    setCustomArrangement,
                    selectedArrangements,
                    setSelectedArrangements
                  )
                }
                className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#D44372] text-white hover:bg-[#BE335E] transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </Step>

        {/* Step 4: Special Requirements */}
        <Step title="Requirements">
          <div className="space-y-4 py-1">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F224E] bg-[#FDF0F4] px-2.5 py-0.5 rounded-full border border-[#D44372]/30">
                  Question 3 of 3
                </span>
                <span className="text-xs font-semibold text-[#8A6775]">
                  {selectedRequirements.length} selected
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#2E131E]">
                {questions.requirements.question}
              </h3>
              <p className="text-xs sm:text-sm text-[#8A6775]">
                {questions.requirements.description}
              </p>
            </div>

            {/* Selection Options List */}
            <div role="group" aria-label="Requirements options" className="space-y-2 pt-1 max-h-[300px] overflow-y-auto pr-1">
              {questions.requirements.options.map((opt) => {
                const isSelected = selectedRequirements.includes(opt.label);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`${opt.label}: ${opt.description}${opt.tag ? ` (${opt.tag})` : ""}`}
                    onClick={() =>
                      toggleItem(
                        selectedRequirements,
                        setSelectedRequirements,
                        opt.label
                      )
                    }
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#D44372] bg-[#FDF0F4]/50 shadow-xs"
                        : "border-[#F7D6DF] bg-white hover:bg-[#FDF0F4]/20"
                    }`}
                  >
                    <div className="pr-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#2E131E]">
                          {opt.label}
                        </span>
                        {opt.tag && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              opt.tag === "Essential"
                                ? "bg-[#FDF2F0] text-[#B5473C] border border-[#B5473C]/20"
                                : opt.tag === "Recommended"
                                ? "bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/40"
                                : "bg-[#F4F7F5] text-[#8A6775]"
                            }`}
                          >
                            {opt.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8A6775] mt-0.5">
                        {opt.description}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5" aria-hidden="true">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-[#2E131E]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#CBD5E1]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="pt-2 flex items-center gap-2">
              <input
                id="custom-requirement-input"
                type="text"
                placeholder="Add other requirement..."
                aria-label="Add custom requirement item"
                value={customRequirement}
                onChange={(e) => setCustomRequirement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustom(
                      customRequirement,
                      setCustomRequirement,
                      selectedRequirements,
                      setSelectedRequirements
                    );
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs text-[#2E131E] placeholder:text-[#8A6775]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] shadow-2xs"
              />
              <button
                type="button"
                aria-label="Add custom requirement"
                onClick={() =>
                  handleAddCustom(
                    customRequirement,
                    setCustomRequirement,
                    selectedRequirements,
                    setSelectedRequirements
                  )
                }
                className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#D44372] text-white hover:bg-[#BE335E] transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </Step>

        {/* Step 5: Final Review & Confirmation */}
        <Step title="Review & Confirm">
          <div className="space-y-4 py-1">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/40 mb-1.5">
                <Check className="w-3 h-3 text-[#D44372]" />
                <span>Ready to Launch</span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-medium text-[#2E131E]">
                Event Blueprint Summary
              </h3>
              <p className="text-xs sm:text-sm text-[#8A6775]">
                Confirm your selections to persist your event architecture and view on the Calendar.
              </p>
            </div>

            <div className="bg-[#FDF0F4]/40 p-5 rounded-[24px] border border-[#F7D6DF] space-y-3 text-xs">
              {/* Event Core Specs */}
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#F7D6DF]">
                <div>
                  <span className="text-[#8A6775]">Event:</span>
                  <p className="font-bold text-[#2E131E]">{eventData.eventName}</p>
                </div>
                <div>
                  <span className="text-[#8A6775]">Type & Guests:</span>
                  <p className="font-bold text-[#2E131E]">
                    {eventData.eventType} • {eventData.guestCount} guests
                  </p>
                </div>
                <div>
                  <span className="text-[#8A6775]">Budget:</span>
                  <p className="font-bold text-[#2E131E] font-[family-name:var(--font-display)] text-sm">
                    ₹{Number(eventData.budget).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-[#8A6775]">Target Date:</span>
                  <p className="font-bold text-[#2E131E]">
                    {eventData.eventDate || "Date TBD"}
                  </p>
                </div>
                <div className="col-span-2 flex items-center justify-between pt-2 border-t border-[#F7D6DF]">
                  <span className="text-[#8A6775]">Package Tier:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#D44372] text-white">
                    {selectedTier}
                  </span>
                </div>
              </div>

              {/* Decorations Badges */}
              <div>
                <span className="text-[11px] font-semibold text-[#8A6775] block mb-1.5">
                  Planned Decorations ({selectedDecorations.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDecorations.length > 0 ? (
                    selectedDecorations.map((d, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#F7D6DF] text-[10.5px] font-medium text-[#2E131E] shadow-2xs"
                      >
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#8A6775] italic">None selected</span>
                  )}
                </div>
              </div>

              {/* Arrangements Badges */}
              <div>
                <span className="text-[11px] font-semibold text-[#8A6775] block mb-1.5">
                  Arrangements Done ({selectedArrangements.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedArrangements.length > 0 ? (
                    selectedArrangements.map((a, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#F7D6DF] text-[10.5px] font-medium text-[#2E131E] flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3 h-3 text-[#D44372] shrink-0" />
                        <span>{a}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#8A6775] italic">None marked</span>
                  )}
                </div>
              </div>

              {/* Requirements Badges */}
              <div>
                <span className="text-[11px] font-semibold text-[#8A6775] block mb-1.5">
                  Requirements Needed ({selectedRequirements.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRequirements.length > 0 ? (
                    selectedRequirements.map((r, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#F7D6DF] text-[10.5px] font-medium text-[#2E131E] flex items-center gap-1 shadow-2xs"
                      >
                        <Star className="w-3 h-3 text-[#D44372] shrink-0" />
                        <span>{r}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#8A6775] italic">None selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Step>
      </Stepper>
    </div>
  );
};
