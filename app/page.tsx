"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { LandingPage } from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";
import { initialEvents } from "./mockData";
import {
  EventPlan,
} from "./types";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  LogOut,
  Calendar as CalendarIcon,
  DollarSign,
  Tag,
  CheckCircle2,
} from "lucide-react";
import Stepper, { Step } from "./components/Stepper";
import { EventCalendarView } from "./components/EventCalendarView";

export default function Home() {
  // 1. NextAuth Session Hook
  const { data: session, status } = useSession();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // View state: 'stepper' or 'calendar'
  const [viewMode, setViewMode] = useState<"stepper" | "calendar">("stepper");

  // Stepper input states requested by user
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Conference");
  const [eventBudget, setEventBudget] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Professional Suite");
  const [isCompleted, setIsCompleted] = useState(false);

  // Check URL query parameters for NextAuth status/errors on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      if (errorParam) {
        if (errorParam === "OAuthSignin" || errorParam === "OAuthCallback") {
          setAuthNotice(
            "Google sign-in was cancelled or encountered an OAuth handshake issue. Please try signing in again."
          );
        } else {
          setAuthNotice(`NextAuth status: ${errorParam}`);
        }
      }
    }
  }, []);

  // Workspace state
  const [events, setEvents] = useState<EventPlan[]>(initialEvents);
  const [activeEventId, setActiveEventId] = useState<string>(initialEvents[0].id);

  // Active authenticated user from NextAuth session
  const activeUser = session?.user
    ? {
        name: session.user.name || "Event Planner",
        email: session.user.email || "",
        image: session.user.image || undefined,
      }
    : null;

  const isAuthenticated = status === "authenticated";

  // Active event plan
  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];

  const handleFinalStepCompleted = () => {
    console.log("Event setup completed:", {
      eventName,
      eventType,
      eventBudget,
      eventDate,
      selectedPlan,
      organizer: activeUser?.name,
    });
    setIsCompleted(true);
    // Redirect to the Calendar UI as requested
    setViewMode("calendar");

    if (eventName.trim()) {
      const newPlan: EventPlan = {
        ...activeEvent,
        id: `event-${Date.now()}`,
        title: eventName,
        eventType: eventType,
        date: eventDate || new Date().toISOString().split("T")[0],
        totalBudget: Number(eventBudget) || 25000,
      };
      setEvents((prev) => [newPlan, ...prev]);
      setActiveEventId(newPlan.id);
    }
  };

  const handleLogout = async () => {
    if (session) {
      await signOut({ callbackUrl: "/" });
    }
  };

  // 1. LOADING SCREEN: Serene sage & mint pulse during NextAuth session resolution
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F5] text-[#2D3748] px-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white shadow-md shadow-[#10B981]/25">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#2D3748]">
            <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
            <span>Verifying NextAuth Session...</span>
          </div>
          <p className="text-xs text-[#718096]">
            Serene & focused event planning powered by Generative AI
          </p>
        </div>
      </div>
    );
  }

  // 2. UNAUTHENTICATED: Splash page with Stepper & NextAuth Google SSO
  if (!isAuthenticated) {
    return (
      <>
        {/* Optional Auth Notice Banner */}
        {authNotice && (
          <div className="bg-[#E6F7F0] border-b border-[#A7F3D0] px-4 py-2.5 text-xs text-[#059669] flex items-center justify-between">
            <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#10B981]" />
              <span>{authNotice}</span>
              <button
                onClick={() => setAuthNotice(null)}
                className="ml-auto text-[#059669] hover:text-[#2D3748] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <LandingPage
          onOpenLogin={() => {
            setAuthMode("login");
            setAuthModalOpen(true);
          }}
          onOpenSignup={() => {
            setAuthMode("signup");
            setAuthModalOpen(true);
          }}
        />

        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  // 3. AUTHENTICATED: Simple Navbar with Profile Picture + Custom Event Stepper
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5] text-[#2D3748]">
      {/* Simple Authenticated Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E2ECE5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white shadow-xs shadow-[#10B981]/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-[#2D3748]">
                  Kordena
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
                  Event Studio
                </span>
              </div>
            </div>
          </div>

          {/* View Mode Switcher (Stepper Blueprint vs Calendar UI) */}
          <div className="flex items-center gap-1 bg-[#F4F7F5] p-1 rounded-2xl border border-[#E2ECE5]">
            <button
              type="button"
              onClick={() => setViewMode("stepper")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "stepper"
                  ? "bg-white text-[#2D3748] shadow-xs border border-[#E2ECE5]"
                  : "text-[#718096] hover:text-[#2D3748]"
              }`}
            >
              <span>Blueprint Stepper</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "calendar"
                  ? "bg-[#10B981] text-white shadow-xs shadow-[#10B981]/25"
                  : "text-[#718096] hover:text-[#2D3748]"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar UI</span>
              {isCompleted && (
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              )}
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5]">
              {activeUser?.image ? (
                <img
                  src={activeUser.image}
                  alt={activeUser.name || "User Avatar"}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-[#A7F3D0] shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {activeUser?.name ? activeUser.name[0].toUpperCase() : "U"}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-[#2D3748] leading-tight">
                  {activeUser?.name || "Active Planner"}
                </p>
                <p className="text-[11px] text-[#718096] leading-tight">
                  {activeUser?.email || "planner@kordena.ai"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {viewMode === "calendar" ? (
        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <EventCalendarView
            eventName={eventName || "Annual Global Tech Summit 2026"}
            eventType={eventType}
            eventBudget={eventBudget || "50000"}
            eventDate={eventDate || new Date().toISOString().split("T")[0]}
            selectedPlan={selectedPlan}
            organizerName={activeUser?.name}
            onBackToStepper={() => setViewMode("stepper")}
          />
        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[640px] flex flex-col items-center">
            {/* Header Title */}
            <div className="text-center mb-6 space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D3748] tracking-tight">
                Create Your Event Blueprint
              </h1>
              <p className="text-xs sm:text-sm text-[#718096]">
                Input your event parameters to configure your AI architecture.
              </p>
            </div>

            {isCompleted && (
              <div className="w-full mb-6 p-4 rounded-2xl bg-[#E6F7F0] border border-[#A7F3D0] text-[#059669] flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>
                    Blueprint for <strong>{eventName || "your event"}</strong> marked on calendar!
                  </span>
                </div>
                <button
                  onClick={() => setViewMode("calendar")}
                  className="px-3 py-1 rounded-lg bg-[#10B981] text-white text-[11px] font-bold hover:bg-[#059669] cursor-pointer shadow-2xs"
                >
                  View Calendar UI →
                </button>
              </div>
            )}

            <Stepper
              initialStep={1}
              onStepChange={(step) => console.log("Stepper step changed to:", step)}
              onFinalStepCompleted={handleFinalStepCompleted}
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
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#E2ECE5]">
                      <span className="text-[#718096]">Lead Organizer:</span>
                      <strong className="text-[#2D3748]">{activeUser?.name || "Planner"}</strong>
                    </div>
                  </div>
                </div>
              </Step>
            </Stepper>
          </div>
        </main>
      )}
    </div>
  );
}
