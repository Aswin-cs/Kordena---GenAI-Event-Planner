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
} from "lucide-react";
import { AiEvaluationResponse, AiEvaluationOption } from "../api/ai-evaluate/route";

interface AiEvaluationStepperProps {
  eventData: {
    eventName: string;
    eventType: string;
    budget: number | string;
    guestCount: number | string;
    eventDate: string;
  };
  aiEvaluation: AiEvaluationResponse;
  onBackToParams: () => void;
  onComplete: (data: {
    decorations: string[];
    arrangements: string[];
    requirements: string[];
    aiSummary: string;
    aiResponse?: AiEvaluationResponse;
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
    });
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header Banner */}
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0] shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#10B981] animate-spin-slow" />
          <span>Kordena AI Evaluation Stepper</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D3748] tracking-tight">
          AI Architecture & Parameters Evaluation
        </h2>
        <p className="text-xs sm:text-sm text-[#718096] max-w-xl mx-auto">
          AI analyzed <strong className="text-[#2D3748]">{eventData.eventName}</strong>. Select your planned decorations, completed arrangements, and required logistics below.
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={onBackToParams}
            className="inline-flex items-center gap-1.5 text-xs text-[#718096] hover:text-[#10B981] transition-colors font-semibold cursor-pointer"
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
        accentColor="#10B981"
        radius={24}
        className="border border-[#E2ECE5] shadow-xl bg-white/95"
      >
        {/* Step 1: AI Evaluation Summary */}
        <Step title="AI Summary">
          <div className="space-y-4 py-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] bg-[#E6F7F0] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                  AI Synthesis
                </span>
                <h3 className="text-lg font-bold text-[#2D3748] mt-1.5">
                  {aiSummary.headline}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed bg-[#F4F7F5] p-3.5 rounded-xl border border-[#E2ECE5]">
              {aiSummary.overview}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-white border border-[#E2ECE5] shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#718096] text-[11px] font-semibold mb-1">
                  <IndianRupee className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Budget / Guest</span>
                </div>
                <div className="text-sm font-extrabold text-[#2D3748]">
                  {aiSummary.budgetPerGuest}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E2ECE5] shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#718096] text-[11px] font-semibold mb-1">
                  <Layers className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Feasibility</span>
                </div>
                <div className="text-xs font-bold text-[#059669]">
                  {aiSummary.feasibility}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E2ECE5] shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#718096] text-[11px] font-semibold mb-1">
                  <Palette className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Recommended Vibe</span>
                </div>
                <div className="text-[11px] font-bold text-[#2D3748] line-clamp-2">
                  {aiSummary.recommendedVibe}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#E6F7F0]/40 border border-[#A7F3D0]/60 flex items-center gap-2.5 text-xs text-[#065F46]">
              <Sparkles className="w-4 h-4 text-[#10B981] shrink-0" />
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] bg-[#E6F7F0] px-2 py-0.5 rounded-full">
                  Question 1 of 3
                </span>
                <span className="text-xs font-semibold text-[#718096]">
                  {selectedDecorations.length} selected
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#2D3748]">
                {questions.decorations.question}
              </h3>
              <p className="text-xs sm:text-sm text-[#718096]">
                {questions.decorations.description}
              </p>
            </div>

            {/* Selection Options List */}
            <div className="space-y-2 pt-1 max-h-[300px] overflow-y-auto pr-1">
              {questions.decorations.options.map((opt) => {
                const isSelected = selectedDecorations.includes(opt.label);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      toggleItem(
                        selectedDecorations,
                        setSelectedDecorations,
                        opt.label
                      )
                    }
                    className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#10B981] bg-[#E6F7F0]/70 shadow-xs"
                        : "border-[#E2ECE5] bg-white hover:bg-[#F4F7F5]"
                    }`}
                  >
                    <div className="pr-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#2D3748]">
                          {opt.label}
                        </span>
                        {opt.recommended && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#10B981]/15 text-[#059669]">
                            AI Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#718096] mt-0.5">
                        {opt.description}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
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
                type="text"
                placeholder="Add other decoration item..."
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
                className="flex-1 px-3 py-2 rounded-xl border border-[#E2ECE5] bg-white text-xs text-[#2D3748] focus:outline-none focus:border-[#10B981]"
              />
              <button
                type="button"
                onClick={() =>
                  handleAddCustom(
                    customDecor,
                    setCustomDecor,
                    selectedDecorations,
                    setSelectedDecorations
                  )
                }
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[#E6F7F0] text-[#059669] hover:bg-[#D1FAE5] border border-[#A7F3D0] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </Step>

        {/* Step 3: Arrangements Status */}
        <Step title="Arrangements">
          <div className="space-y-4 py-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] bg-[#E6F7F0] px-2 py-0.5 rounded-full">
                  Question 2 of 3
                </span>
                <span className="text-xs font-semibold text-[#718096]">
                  {selectedArrangements.length} confirmed done
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#2D3748]">
                {questions.arrangements.question}
              </h3>
              <p className="text-xs sm:text-sm text-[#718096]">
                {questions.arrangements.description}
              </p>
            </div>

            {/* Selection Options List */}
            <div className="space-y-2 pt-1 max-h-[300px] overflow-y-auto pr-1">
              {questions.arrangements.options.map((opt) => {
                const isSelected = selectedArrangements.includes(opt.label);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      toggleItem(
                        selectedArrangements,
                        setSelectedArrangements,
                        opt.label
                      )
                    }
                    className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#10B981] bg-[#E6F7F0]/70 shadow-xs"
                        : "border-[#E2ECE5] bg-white hover:bg-[#F4F7F5]"
                    }`}
                  >
                    <div className="pr-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#2D3748]">
                          {opt.label}
                        </span>
                        {opt.status && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              opt.status === "Done"
                                ? "bg-emerald-100 text-emerald-800"
                                : opt.status === "In Progress"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {opt.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#718096] mt-0.5">
                        {opt.description}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
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
                type="text"
                placeholder="Add other arrangement done..."
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
                className="flex-1 px-3 py-2 rounded-xl border border-[#E2ECE5] bg-white text-xs text-[#2D3748] focus:outline-none focus:border-[#10B981]"
              />
              <button
                type="button"
                onClick={() =>
                  handleAddCustom(
                    customArrangement,
                    setCustomArrangement,
                    selectedArrangements,
                    setSelectedArrangements
                  )
                }
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[#E6F7F0] text-[#059669] hover:bg-[#D1FAE5] border border-[#A7F3D0] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </Step>

        {/* Step 4: Special Requirements */}
        <Step title="Requirements">
          <div className="space-y-4 py-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] bg-[#E6F7F0] px-2 py-0.5 rounded-full">
                  Question 3 of 3
                </span>
                <span className="text-xs font-semibold text-[#718096]">
                  {selectedRequirements.length} selected
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#2D3748]">
                {questions.requirements.question}
              </h3>
              <p className="text-xs sm:text-sm text-[#718096]">
                {questions.requirements.description}
              </p>
            </div>

            {/* Selection Options List */}
            <div className="space-y-2 pt-1 max-h-[300px] overflow-y-auto pr-1">
              {questions.requirements.options.map((opt) => {
                const isSelected = selectedRequirements.includes(opt.label);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      toggleItem(
                        selectedRequirements,
                        setSelectedRequirements,
                        opt.label
                      )
                    }
                    className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#10B981] bg-[#E6F7F0]/70 shadow-xs"
                        : "border-[#E2ECE5] bg-white hover:bg-[#F4F7F5]"
                    }`}
                  >
                    <div className="pr-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#2D3748]">
                          {opt.label}
                        </span>
                        {opt.tag && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              opt.tag === "Essential"
                                ? "bg-rose-100 text-rose-800"
                                : opt.tag === "Recommended"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {opt.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#718096] mt-0.5">
                        {opt.description}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
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
                type="text"
                placeholder="Add other requirement..."
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
                className="flex-1 px-3 py-2 rounded-xl border border-[#E2ECE5] bg-white text-xs text-[#2D3748] focus:outline-none focus:border-[#10B981]"
              />
              <button
                type="button"
                onClick={() =>
                  handleAddCustom(
                    customRequirement,
                    setCustomRequirement,
                    selectedRequirements,
                    setSelectedRequirements
                  )
                }
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[#E6F7F0] text-[#059669] hover:bg-[#D1FAE5] border border-[#A7F3D0] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </Step>

        {/* Step 5: Final Review & Confirmation */}
        <Step title="Review & Confirm">
          <div className="space-y-4 py-1">
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F7F0] text-[#059669] mb-1">
                <Check className="w-3 h-3" />
                <span>Ready to Launch</span>
              </div>
              <h3 className="text-lg font-bold text-[#2D3748]">
                Event Blueprint Summary
              </h3>
              <p className="text-xs sm:text-sm text-[#718096]">
                Confirm your selections to persist your event architecture and view on the Calendar.
              </p>
            </div>

            <div className="bg-[#F4F7F5] p-4 rounded-2xl border border-[#E2ECE5] space-y-3 text-xs">
              {/* Event Core Specs */}
              <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-[#E2ECE5]">
                <div>
                  <span className="text-[#718096]">Event:</span>
                  <p className="font-bold text-[#2D3748]">{eventData.eventName}</p>
                </div>
                <div>
                  <span className="text-[#718096]">Type & Guests:</span>
                  <p className="font-bold text-[#2D3748]">
                    {eventData.eventType} • {eventData.guestCount} guests
                  </p>
                </div>
                <div>
                  <span className="text-[#718096]">Budget:</span>
                  <p className="font-bold text-[#10B981]">
                    ₹{Number(eventData.budget).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-[#718096]">Target Date:</span>
                  <p className="font-bold text-[#2D3748]">
                    {eventData.eventDate || "Date TBD"}
                  </p>
                </div>
              </div>

              {/* Decorations Badges */}
              <div>
                <span className="text-[11px] font-semibold text-[#718096] block mb-1">
                  Planned Decorations ({selectedDecorations.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDecorations.length > 0 ? (
                    selectedDecorations.map((d, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-white border border-[#E2ECE5] text-[10.5px] font-medium text-[#2D3748]"
                      >
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#718096] italic">None selected</span>
                  )}
                </div>
              </div>

              {/* Arrangements Badges */}
              <div>
                <span className="text-[11px] font-semibold text-[#718096] block mb-1">
                  Arrangements Done ({selectedArrangements.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedArrangements.length > 0 ? (
                    selectedArrangements.map((a, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-white border border-[#E2ECE5] text-[10.5px] font-medium text-[#059669]"
                      >
                        ✓ {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#718096] italic">None marked</span>
                  )}
                </div>
              </div>

              {/* Requirements Badges */}
              <div>
                <span className="text-[11px] font-semibold text-[#718096] block mb-1">
                  Requirements Needed ({selectedRequirements.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRequirements.length > 0 ? (
                    selectedRequirements.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-white border border-[#E2ECE5] text-[10.5px] font-medium text-[#2D3748]"
                      >
                        ★ {r}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#718096] italic">None selected</span>
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
