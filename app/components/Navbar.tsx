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
    <header className="sticky top-0 z-40 w-full bg-[#FCFDFC]/90 backdrop-blur-md border-b border-[#E7EDE9] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0E2A24] text-[#F3E7C9] flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-5 h-5 text-[#F3E7C9]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-[#0E2A24]">
                Kordena
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/40">
                GenAI Planner
              </span>
            </div>
            <p className="text-xs text-[#7B8C86] hidden sm:block">
              Serene & Focused Event Architecture
            </p>
          </div>
        </div>

        {/* Center: Event Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#F5EFE2]/60 border border-[#E7EDE9] text-sm font-medium text-[#24352F] hover:border-[#B08D4F] hover:bg-[#F5EFE2] transition-all cursor-pointer shadow-2xs"
            id="event-selector-dropdown-btn"
          >
            <Calendar className="w-4 h-4 text-[#B08D4F]" />
            <span className="max-w-[140px] sm:max-w-[200px] truncate font-bold text-xs text-[#0E2A24]">
              {activeEvent.title}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#7B8C86]" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 rounded-2xl bg-[#FCFDFC] border border-[#E7EDE9] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7B8C86] border-b border-[#E7EDE9] mb-1">
                Your Event Blueprints
              </div>
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => {
                    onSelectEvent(ev);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-[#F5EFE2]/60 transition-colors cursor-pointer ${
                    ev.id === activeEvent.id
                      ? "bg-[#F5EFE2] text-[#0E2A24] font-bold border-l-2 border-[#B08D4F]"
                      : "text-[#24352F]"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-bold truncate text-xs">{ev.title}</p>
                    <p className="text-[10px] text-[#7B8C86]">{ev.eventType} • {ev.date}</p>
                  </div>
                  {ev.id === activeEvent.id && (
                    <CheckCircle2 className="w-4 h-4 text-[#B08D4F] shrink-0" />
                  )}
                </button>
              ))}
              <div className="border-t border-[#E7EDE9] pt-1.5 mt-1 px-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenGenerator();
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-bold text-[#7D6230] hover:bg-[#F5EFE2] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#E7EDE9] text-xs font-bold text-[#24352F] hover:border-[#B08D4F] hover:text-[#0E2A24] hover:bg-[#F5EFE2] transition-all cursor-pointer shadow-2xs"
            id="open-assistant-btn"
            title="Ask Kordena Copilot"
          >
            <Bot className="w-4 h-4 text-[#B08D4F]" />
            <span className="hidden md:inline">Ask AI</span>
          </button>

          {/* Export Brief */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#E7EDE9] text-xs font-bold text-[#7B8C86] hover:text-[#0E2A24] hover:bg-[#F5EFE2] transition-all cursor-pointer shadow-2xs"
            id="export-brief-btn"
            title="Export Event Brief"
          >
            <Download className="w-4 h-4 text-[#7B8C86]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Generate New */}
          <button
            onClick={onOpenGenerator}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0E2A24] text-[#F3E7C9] text-xs font-bold hover:bg-[#163830] active:scale-98 transition-all cursor-pointer shadow-sm"
            id="generate-new-plan-btn"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Plan</span>
          </button>

          {/* User Account / Sign Out Menu */}
          <div className="relative pl-1 sm:pl-2 border-l border-[#E7EDE9]">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#F5EFE2] border border-transparent hover:border-[#E7EDE9] transition-all cursor-pointer"
              title="User Account Menu"
              id="user-profile-menu-btn"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User Avatar"}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-[#B08D4F]/40 shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0E2A24] text-[#F3E7C9] flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-[#7B8C86] hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FCFDFC] border border-[#E7EDE9] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-[#E7EDE9]">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-[#B08D4F]/40"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#0E2A24] text-[#F3E7C9] flex items-center justify-center font-bold text-xs">
                        {user?.name ? user.name[0].toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#0E2A24] truncate">
                        {user?.name || "Active Planner"}
                      </p>
                      <p className="text-[11px] text-[#7B8C86] truncate">
                        {user?.email || "planner@kordena.ai"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B08D4F]" /> Connected via NextAuth
                  </span>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-[#B5473C] hover:bg-[#FDF2F0] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
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
