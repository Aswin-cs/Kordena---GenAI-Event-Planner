"use client";

import React, { useState } from "react";
import { Sparkles, Wand2, Users, DollarSign, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { EventPlan } from "../types";

interface HeroGeneratorProps {
  onPlanGenerated: (newPlan: EventPlan) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  {
    label: "🌿 Botanical Garden Wedding",
    prompt: "Intimate botanical garden wedding with live acoustic strings and organic farm-to-table dinner",
    type: "Wedding",
    guests: 100,
    budget: 35000,
  },
  {
    label: "🚀 Tech Product Launch & Gala",
    prompt: "Twilight AI product launch with interactive generative demos, spatial audio, and executive networking",
    type: "Tech Summit",
    guests: 180,
    budget: 50000,
  },
  {
    label: "🧘 Executive Wellness Retreat",
    prompt: "Serene leadership retreat focusing on mindfulness, strategic alignment, and organic nourishment",
    type: "Corporate Retreat",
    guests: 45,
    budget: 28000,
  },
  {
    label: "🍸 Fresh Sage Evening Soirée",
    prompt: "Milestone celebration featuring botanical mixology, ambient lounge music, and minimalist modern decor",
    type: "Private Celebration",
    guests: 80,
    budget: 20000,
  },
];

export const HeroGenerator: React.FC<HeroGeneratorProps> = ({
  onPlanGenerated,
  isOpen,
  onClose,
}) => {
  const [prompt, setPrompt] = useState("");
  const [eventType, setEventType] = useState("Corporate Gala");
  const [guestCount, setGuestCount] = useState<number>(120);
  const [budget, setBudget] = useState<number>(35000);
  const [loading, setLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const steps = [
    "Analyzing serene sage & mint design aesthetics...",
    "Computing balanced 60-30-10 budget allocation...",
    "Synthesizing milestone schedule & calendar alert cadence...",
    "Curating verified vendor matchmaker shortlists...",
    "Finalizing Kordena event architecture blueprint...",
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setGenerationStep(0);

    // Progression timer for visual satisfaction
    const interval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          eventType,
          guestCount,
          budget,
        }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (data.success && data.plan) {
        onPlanGenerated(data.plan);
        setPrompt("");
        onClose();
      }
    } catch (err) {
      console.error("Generation error:", err);
      clearInterval(interval);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setPrompt(preset.prompt);
    setEventType(preset.type);
    setGuestCount(preset.guests);
    setBudget(preset.budget);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#2D3748]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FFFFFF] rounded-3xl border border-[#E2ECE5] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#E2ECE5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3748]">
                Kordena GenAI Event Architect
              </h2>
              <p className="text-xs text-[#718096]">
                Transform your vision into a balanced, executable event blueprint
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F7F5] text-[#718096] hover:text-[#2D3748] hover:bg-[#E2ECE5] flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Preset chips */}
        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#718096] block mb-2">
            Quick Inception Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F4F7F5] text-[#2D3748] border border-[#E2ECE5] hover:border-[#10B981] hover:bg-[#E6F7F0] hover:text-[#059669] transition-all cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
              Event Vision & Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Sustainable tech summit for 150 leaders with organic catering, generative visuals, and serene acoustic lounge in San Francisco with a $40,000 budget..."
              className="w-full px-4 py-3 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] placeholder-[#718096]/70 focus:bg-[#FFFFFF] focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                Event Category
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981] transition-all"
              >
                <option value="Corporate Gala">Corporate Gala</option>
                <option value="Wedding Celebration">Wedding Celebration</option>
                <option value="Tech Summit & Hackathon">Tech Summit & Hackathon</option>
                <option value="Executive Retreat">Executive Retreat</option>
                <option value="Private Soirée">Private Soirée</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                Target Guests
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#718096] absolute left-3 top-3" />
                <input
                  type="number"
                  min={10}
                  max={2500}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                Total Budget ($ USD)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#718096] absolute left-3 top-3" />
                <input
                  type="number"
                  step={500}
                  min={2000}
                  max={1000000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Reasoning animation if loading */}
          {loading && (
            <div className="p-4 rounded-2xl bg-[#E6F7F0] border border-[#A7F3D0] space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-[#059669]">
                <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                Kordena Neural Engine Thinking:
              </div>
              <p className="text-xs text-[#2D3748] font-medium pl-6">
                {steps[generationStep]}
              </p>
              <div className="w-full h-1.5 bg-[#FFFFFF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] progress-fill"
                  style={{ width: `${((generationStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-[#F4F7F5] text-xs sm:text-sm font-medium text-[#718096] hover:text-[#2D3748] hover:bg-[#E2ECE5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#10B981] text-white text-xs sm:text-sm font-semibold hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#10B981]/25"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Synthesize Event Blueprint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
