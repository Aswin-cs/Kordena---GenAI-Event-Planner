"use client";

import React from "react";
import { CheckCircle2, DollarSign, Bell, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { EventPlan } from "../types";

interface MetricCardsProps {
  event: EventPlan;
  onNavigateTab: (tab: "overview" | "budget" | "tasks" | "timeline" | "vendors") => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ event, onNavigateTab }) => {
  // 1. Task metrics
  const totalTasks = event.tasks.length;
  const completedTasks = event.tasks.filter((t) => t.completed).length;
  const taskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Budget metrics
  const totalAllocated = event.budget.reduce((acc, b) => acc + b.allocated, 0);
  const totalSpent = event.budget.reduce((acc, b) => acc + b.spent, 0);
  const budgetPercentage = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const remainingBudget = totalAllocated - totalSpent;

  // 3. Calendar Alerts
  const pendingAlerts = event.alerts.filter((a) => !a.completed);
  const nextAlert = pendingAlerts[0] || event.alerts[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. COMPLETED TASKS CARD */}
      <div
        onClick={() => onNavigateTab("tasks")}
        className="group relative bg-[#FFFFFF] rounded-2xl p-6 border border-[#E2ECE5] shadow-xs hover:border-[#10B981]/60 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        id="metric-completed-tasks-card"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981] group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#718096]">
                Task Execution
              </span>
              <h3 className="text-xl font-bold text-[#2D3748]">
                {completedTasks} <span className="text-sm font-normal text-[#718096]">/ {totalTasks} Completed</span>
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
            {taskPercentage}% Done
          </span>
        </div>

        {/* Task Visual Progress Feedback */}
        <div className="mt-5">
          <div className="flex justify-between items-center text-xs font-medium text-[#718096] mb-1.5">
            <span>Milestone Readiness</span>
            <span className="text-[#10B981] font-semibold">{totalTasks - completedTasks} remaining</span>
          </div>
          <div className="w-full h-2.5 bg-[#F4F7F5] rounded-full overflow-hidden border border-[#E2ECE5]">
            <div
              className="h-full bg-[#10B981] rounded-full progress-fill"
              style={{ width: `${taskPercentage}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E2ECE5]/70 flex items-center justify-between text-xs text-[#718096]">
          <span className="flex items-center gap-1.5 text-[#2D3748]">
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            AI automated tracking
          </span>
          <span className="text-[#10B981] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
            Manage Tasks <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* 2. BUDGET PROGRESS CARD */}
      <div
        onClick={() => onNavigateTab("budget")}
        className="group relative bg-[#FFFFFF] rounded-2xl p-6 border border-[#E2ECE5] shadow-xs hover:border-[#10B981]/60 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        id="metric-budget-progress-card"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981] group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#718096]">
                Budget Utilization
              </span>
              <h3 className="text-xl font-bold text-[#2D3748]">
                ${totalSpent.toLocaleString()}{" "}
                <span className="text-sm font-normal text-[#718096]">/ ${totalAllocated.toLocaleString()}</span>
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
            {budgetPercentage}% Spent
          </span>
        </div>

        {/* Budget Visual Progress Feedback */}
        <div className="mt-5">
          <div className="flex justify-between items-center text-xs font-medium text-[#718096] mb-1.5">
            <span>Buffer Cushion: <strong className="text-[#2D3748]">${remainingBudget.toLocaleString()}</strong></span>
            <span className="text-[#10B981] font-semibold">Healthy Range</span>
          </div>
          <div className="w-full h-2.5 bg-[#F4F7F5] rounded-full overflow-hidden border border-[#E2ECE5]">
            <div
              className="h-full bg-gradient-to-r from-[#34D399] to-[#10B981] rounded-full progress-fill"
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E2ECE5]/70 flex items-center justify-between text-xs text-[#718096]">
          <span className="flex items-center gap-1.5 text-[#2D3748]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            ${Math.round(totalAllocated / (event.guestCount || 1))}/guest allocation
          </span>
          <span className="text-[#10B981] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
            View Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* 3. CALENDAR ALERTS CARD */}
      <div
        onClick={() => onNavigateTab("timeline")}
        className="group relative bg-[#FFFFFF] rounded-2xl p-6 border border-[#E2ECE5] shadow-xs hover:border-[#10B981]/60 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        id="metric-calendar-alerts-card"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981] group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
              {pendingAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] rounded-full emerald-pulse" />
              )}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#718096]">
                Calendar Alerts
              </span>
              <h3 className="text-xl font-bold text-[#2D3748]">
                {pendingAlerts.length}{" "}
                <span className="text-sm font-normal text-[#718096]">Active Alerts</span>
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
            Next: {nextAlert ? `T-${nextAlert.daysRemaining}d` : "None"}
          </span>
        </div>

        {/* Calendar Alerts Feedback Snippet */}
        <div className="mt-4 p-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
          <div className="truncate text-xs">
            <p className="font-semibold text-[#2D3748] truncate">
              {nextAlert ? nextAlert.title : "All calendar milestones on schedule"}
            </p>
            <p className="text-[11px] text-[#718096] truncate">
              {nextAlert ? `${nextAlert.date} • ${nextAlert.description}` : "No upcoming conflicts detected"}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E2ECE5]/70 flex items-center justify-between text-xs text-[#718096]">
          <span className="text-[#2D3748] truncate">
            {event.date} • {event.location.split(",")[0]}
          </span>
          <span className="text-[#10B981] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium shrink-0">
            Alert Center <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
