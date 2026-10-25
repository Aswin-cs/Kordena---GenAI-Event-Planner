"use client";

import React from "react";
import { Sparkles, Calendar, Plus, Download, Bot, ChevronDown, CheckCircle2, LogOut, User } from "lucide-react";
import { EventPlan } from "../types";

interface NavbarProps {
  events: EventPlan[];
  activeEvent: EventPlan;
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  onLogout: () => void;
  onSelectEvent: (event: EventPlan) => void;
  onOpenGenerator: () => void;
  onOpenAssistant: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  events,
  activeEvent,
  user,
  onLogout,
  onSelectEvent,
  onOpenGenerator,
  onOpenAssistant,
  onOpenExport,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E2ECE5] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white shadow-sm shadow-[#10B981]/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#2D3748]">
                Kordena
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
                GenAI Planner
              </span>
            </div>
            <p className="text-xs text-[#718096] hidden sm:block">
              Serene & Focused Event Architecture
            </p>
          </div>
        </div>

        {/* Center: Event Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm font-medium text-[#2D3748] hover:border-[#10B981]/50 hover:bg-[#EBF3EE] transition-all cursor-pointer"
            id="event-selector-dropdown-btn"
          >
            <Calendar className="w-4 h-4 text-[#10B981]" />
            <span className="max-w-[140px] sm:max-w-[200px] truncate font-medium">
              {activeEvent.title}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#718096]" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 rounded-2xl bg-[#FFFFFF] border border-[#E2ECE5] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#718096] border-b border-[#E2ECE5]/60 mb-1">
                Your Event Blueprints
              </div>
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => {
                    onSelectEvent(ev);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-[#F4F7F5] transition-colors cursor-pointer ${
                    ev.id === activeEvent.id
                      ? "bg-[#E6F7F0]/60 text-[#2D3748] font-semibold"
                      : "text-[#2D3748]"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-medium truncate">{ev.title}</p>
                    <p className="text-[11px] text-[#718096]">{ev.eventType} • {ev.date}</p>
                  </div>
                  {ev.id === activeEvent.id && (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  )}
                </button>
              ))}
              <div className="border-t border-[#E2ECE5]/60 pt-1.5 mt-1 px-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenGenerator();
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-medium text-[#059669] hover:bg-[#E6F7F0] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New AI Blueprint
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ask Kordena Copilot */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E2ECE5] text-xs sm:text-sm font-medium text-[#2D3748] hover:border-[#10B981] hover:text-[#059669] hover:bg-[#E6F7F0]/40 transition-all cursor-pointer shadow-2xs"
            id="open-assistant-btn"
            title="Ask Kordena Copilot"
          >
            <Bot className="w-4 h-4 text-[#10B981]" />
            <span className="hidden md:inline">Ask AI</span>
          </button>

          {/* Export Brief */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E2ECE5] text-xs sm:text-sm font-medium text-[#2D3748] hover:border-[#10B981] hover:bg-[#F4F7F5] transition-all cursor-pointer shadow-2xs"
            id="export-brief-btn"
            title="Export Event Brief"
          >
            <Download className="w-4 h-4 text-[#718096]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Generate New */}
          <button
            onClick={onOpenGenerator}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#10B981] text-white text-xs sm:text-sm font-semibold hover:bg-[#059669] active:scale-98 transition-all cursor-pointer shadow-sm shadow-[#10B981]/30"
            id="generate-new-plan-btn"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Plan</span>
          </button>

          {/* User Account / Sign Out Menu */}
          <div className="relative pl-1 sm:pl-2 border-l border-[#E2ECE5]">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F4F7F5] border border-transparent hover:border-[#E2ECE5] transition-all cursor-pointer"
              title="User Account Menu"
              id="user-profile-menu-btn"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User Avatar"}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover border border-[#A7F3D0] shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#E6F7F0] border border-[#A7F3D0] text-[#059669] flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-[#718096] hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FFFFFF] border border-[#E2ECE5] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-[#E2ECE5]/60">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-[#A7F3D0]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#E6F7F0] border border-[#A7F3D0] text-[#059669] flex items-center justify-center font-bold text-xs">
                        {user?.name ? user.name[0].toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#2D3748] truncate">
                        {user?.name || "Active Planner"}
                      </p>
                      <p className="text-[11px] text-[#718096] truncate">
                        {user?.email || "planner@kordena.ai"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Connected via NextAuth
                  </span>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
