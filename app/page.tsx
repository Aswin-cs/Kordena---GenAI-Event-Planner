"use client";

import React, { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";
import { Navbar } from "./components/Navbar";
import { MetricCards } from "./components/MetricCards";
import { OverviewSection } from "./components/OverviewSection";
import { BudgetSection } from "./components/BudgetSection";
import { TasksSection } from "./components/TasksSection";
import { TimelineSection } from "./components/TimelineSection";
import { VendorsSection } from "./components/VendorsSection";
import { HeroGenerator } from "./components/HeroGenerator";
import { AiAssistantModal } from "./components/AiAssistantModal";
import { ExportModal } from "./components/ExportModal";
import { initialEvents } from "./mockData";
import { EventPlan, BudgetItem, TaskItem, CalendarAlert, TimelineScheduleItem, Vendor } from "./types";
import { LayoutDashboard, DollarSign, CheckSquare, Calendar, Users, Sparkles, Wand2 } from "lucide-react";

export default function Home() {
  // Auth state: unauthenticated by default so users see the introductory page
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Event workspace state
  const [events, setEvents] = useState<EventPlan[]>(initialEvents);
  const [activeEventId, setActiveEventId] = useState<string>(initialEvents[0].id);
  const [activeTab, setActiveTab] = useState<"overview" | "budget" | "tasks" | "timeline" | "vendors">("overview");

  // Modals
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Active event resolution
  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];

  const updateActiveEvent = (updates: Partial<EventPlan>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === activeEvent.id ? { ...e, ...updates } : e))
    );
  };

  const handlePlanGenerated = (newPlan: EventPlan) => {
    setEvents((prev) => [newPlan, ...prev]);
    setActiveEventId(newPlan.id);
    setActiveTab("overview");
  };

  const handleAuthSuccess = (authenticatedUser: { name: string; email: string }) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  // IF UNAUTHENTICATED: Show the introductory Landing Page with Login & Signup
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          onOpenLogin={() => {
            setAuthMode("login");
            setAuthModalOpen(true);
          }}
          onOpenSignup={() => {
            setAuthMode("signup");
            setAuthModalOpen(true);
          }}
          onExploreDemo={() => {
            setUser({ name: "Guest Planner", email: "demo@kordena.ai" });
            setIsAuthenticated(true);
          }}
        />

        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // IF AUTHENTICATED: Show the full Kordena GenAI Event Planner Workspace
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5] text-[#2D3748]">
      {/* 1. Header Navigation */}
      <Navbar
        events={events}
        activeEvent={activeEvent}
        user={user}
        onLogout={handleLogout}
        onSelectEvent={(ev) => setActiveEventId(ev.id)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Quick GenAI Prompt Inception Strip */}
        <div className="bg-[#FFFFFF] rounded-2xl p-3.5 sm:p-4 border border-[#E2ECE5] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F0] flex items-center justify-center text-[#10B981] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#2D3748]">GenAI Event Studio: </span>
              <span className="text-[#718096]">
                Design or synthesize any event vision into an actionable sage & mint blueprint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-[#E6F7F0] hover:bg-[#A7F3D0]/60 text-[#059669] border border-[#A7F3D0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" /> Prompt-to-Event
            </button>
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="hidden sm:flex px-3.5 py-1.5 rounded-xl bg-[#F4F7F5] hover:bg-[#E2ECE5] text-[#2D3748] border border-[#E2ECE5] text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer"
            >
              Consult Copilot
            </button>
          </div>
        </div>

        {/* 2. Three Visual Feedback Metric Cards (Tasks, Budget Bar, Calendar Alerts) */}
        <MetricCards
          event={activeEvent}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        {/* 3. Navigation Tabs Bar */}
        <div className="bg-[#FFFFFF] rounded-2xl p-1.5 border border-[#E2ECE5] shadow-xs flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Blueprint Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("budget")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "budget"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Budget Progress</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "budget"
                  ? "bg-white/20 text-white"
                  : "bg-[#E6F7F0] text-[#10B981]"
              }`}
            >
              ${activeEvent.budget.reduce((a, b) => a + b.spent, 0).toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "tasks"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Checklist & Tasks</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "tasks"
                  ? "bg-white/20 text-white"
                  : "bg-[#E6F7F0] text-[#10B981]"
              }`}
            >
              {activeEvent.tasks.filter((t) => t.completed).length}/{activeEvent.tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "timeline"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar Alerts</span>
            {activeEvent.alerts.filter((a) => !a.completed).length > 0 && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeTab === "timeline" ? "bg-white" : "bg-[#10B981] emerald-pulse"
                }`}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("vendors")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "vendors"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>AI Matchmaker</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "vendors"
                  ? "bg-white/20 text-white"
                  : "bg-[#E6F7F0] text-[#10B981]"
              }`}
            >
              {activeEvent.vendors.length}
            </span>
          </button>
        </div>

        {/* 4. Tab Content Panel */}
        <div className="transition-all duration-150">
          {activeTab === "overview" && (
            <OverviewSection
              event={activeEvent}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          )}

          {activeTab === "budget" && (
            <BudgetSection
              event={activeEvent}
              onUpdateBudget={(newBudget: BudgetItem[]) =>
                updateActiveEvent({ budget: newBudget })
              }
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          )}

          {activeTab === "tasks" && (
            <TasksSection
              event={activeEvent}
              onUpdateTasks={(newTasks: TaskItem[]) =>
                updateActiveEvent({ tasks: newTasks })
              }
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          )}

          {activeTab === "timeline" && (
            <TimelineSection
              event={activeEvent}
              onUpdateAlerts={(newAlerts: CalendarAlert[]) =>
                updateActiveEvent({ alerts: newAlerts })
              }
              onUpdateSchedule={(newSchedule: TimelineScheduleItem[]) =>
                updateActiveEvent({ schedule: newSchedule })
              }
            />
          )}

          {activeTab === "vendors" && (
            <VendorsSection
              event={activeEvent}
              onUpdateVendors={(newVendors: Vendor[]) =>
                updateActiveEvent({ vendors: newVendors })
              }
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Footer with Theme Palette Statement */}
      <footer className="mt-12 border-t border-[#E2ECE5] bg-[#FFFFFF] py-6 text-center text-xs text-[#718096]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2D3748]">Kordena</span>
            <span>— GenAI Event Architecture</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F4F7F5] border border-[#CBD5E1]" />
              60% Subtle Sage Tint (#F4F7F5)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF] border border-[#CBD5E1]" />
              30% White Surfaces & Slate Gray (#2D3748)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              10% Emerald Mint Accent (#10B981)
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <HeroGenerator
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onPlanGenerated={handlePlanGenerated}
      />

      <AiAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        event={activeEvent}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        event={activeEvent}
      />
    </div>
  );
}
