"use client";

import React from "react";
import { Sparkles, MapPin, Calendar, Users, DollarSign, Lightbulb, CheckCircle2, ArrowRight } from "lucide-react";
import { EventPlan } from "../types";

interface OverviewSectionProps {
  event: EventPlan;
  onNavigateTab: (tab: "overview" | "budget" | "tasks" | "timeline" | "vendors") => void;
  onOpenAssistant: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  event,
  onNavigateTab,
  onOpenAssistant,
}) => {
  const completedTasks = event.tasks.filter((t) => t.completed).length;
  const totalTasks = event.tasks.length;
  const totalSpent = event.budget.reduce((acc, b) => acc + b.spent, 0);
  const totalAllocated = event.budget.reduce((acc, b) => acc + b.allocated, 0);

  return (
    <div className="space-y-6">
      {/* Hero Banner Card */}
      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E2ECE5] shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#10B981]/10 via-[#E6F7F0]/40 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
                {event.eventType}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F4F7F5] text-[#718096] border border-[#E2ECE5]">
                Fresh Sage & Mint Palette
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D3748] tracking-tight">
              {event.title}
            </h1>
            <p className="text-sm sm:text-base text-[#718096] font-medium leading-relaxed">
              {event.tagline}
            </p>

            {/* Quick Meta Badges */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#2D3748]">
              <div className="flex items-center gap-1.5 bg-[#F4F7F5] px-3 py-1.5 rounded-xl border border-[#E2ECE5]">
                <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="font-semibold">{event.date}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#F4F7F5] px-3 py-1.5 rounded-xl border border-[#E2ECE5]">
                <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="font-semibold">{event.location}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#F4F7F5] px-3 py-1.5 rounded-xl border border-[#E2ECE5]">
                <Users className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="font-semibold">{event.guestCount} Guests</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#F4F7F5] px-3 py-1.5 rounded-xl border border-[#E2ECE5]">
                <DollarSign className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="font-semibold">${event.totalBudget.toLocaleString()} Total</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:w-48 shrink-0">
            <button
              onClick={onOpenAssistant}
              className="w-full py-2.5 px-4 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-[#10B981]/30"
            >
              <Sparkles className="w-4 h-4" /> Consult Kordena
            </button>
            <button
              onClick={() => onNavigateTab("tasks")}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F4F7F5] text-[#2D3748] border border-[#E2ECE5] text-xs font-semibold hover:bg-[#EBF3EE] hover:border-[#10B981]/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              Review Action Items <ArrowRight className="w-3.5 h-3.5 text-[#10B981]" />
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Grid: GenAI Atmosphere + AI Synthesis Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: GenAI Vibe & Sensory Atmosphere (2 cols) */}
        <div className="lg:col-span-2 bg-[#FFFFFF] rounded-3xl p-6 sm:p-7 border border-[#E2ECE5] shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D3748]">
                  GenAI Sensory & Spatial Architecture
                </h3>
                <p className="text-xs text-[#718096]">
                  Aesthetic harmony synthesized specifically for this event
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F4F7F5] text-[#10B981] border border-[#A7F3D0]">
              Serene & Focused
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] leading-relaxed">
            <p className="font-normal italic">
              &ldquo;{event.aiVibeSummary}&rdquo;
            </p>
          </div>

          {/* Theme specifications highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2ECE5] text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-[#F4F7F5] border border-[#CBD5E1]" />
                <span className="font-bold text-[#2D3748]">Background (60%)</span>
              </div>
              <p className="text-[#718096]">#F4F7F5 Subtle Sage Tint calm, distraction-free foundation.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2ECE5] text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-[#FFFFFF] border border-[#CBD5E1]" />
                <span className="font-bold text-[#2D3748]">Surfaces & Cards (30%)</span>
              </div>
              <p className="text-[#718096]">#FFFFFF Crisp Cards with #2D3748 Slate Gray readable typography.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2ECE5] text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="font-bold text-[#2D3748]">Accent Feedback (10%)</span>
              </div>
              <p className="text-[#718096]">#10B981 Emerald/Mint for completed tasks, budget bars & alerts.</p>
            </div>
          </div>
        </div>

        {/* Right: AI Synthesis Recommendations (1 col) */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#E2ECE5] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981]">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D3748]">
                Kordena AI Intelligence
              </h3>
              <p className="text-xs text-[#718096]">Continuous proactive audits</p>
            </div>
          </div>

          <div className="space-y-3">
            {event.aiSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5] flex items-start gap-2.5 text-xs text-[#2D3748] leading-relaxed"
              >
                <div className="w-2 h-2 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenAssistant}
              className="w-full py-2 px-3 rounded-xl bg-[#E6F7F0] text-[#059669] hover:bg-[#A7F3D0]/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ask AI For More Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
