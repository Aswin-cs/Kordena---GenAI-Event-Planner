"use client";

import React, { useState, useMemo } from "react";
import { EventPlan } from "../types";
import MagicBento, { MagicBentoItem } from "./MagicBento";
import {
  History,
  Calendar as CalendarIcon,
  IndianRupee,
  Users,
  MapPin,
  ArrowUpRight,
  Sparkles,
  Trash2,
  Search,
  CheckCircle2,
  Layers,
  Filter,
} from "lucide-react";

interface EventHistoriesProps {
  events: EventPlan[];
  activeEventId?: string;
  onSelectEvent: (event: EventPlan) => void;
  onOpenCalendar: (event: EventPlan) => void;
  onDeleteEvent?: (eventId: string) => void;
  onStartNewEvent?: () => void;
}

export const EventHistories: React.FC<EventHistoriesProps> = ({
  events,
  activeEventId,
  onSelectEvent,
  onOpenCalendar,
  onDeleteEvent,
  onStartNewEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const filterCategories = ["All", "Conference", "Wedding", "Gala", "Retreat"];

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ev.tagline && ev.tagline.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFilter === "All") return true;
      return ev.eventType.toLowerCase().includes(selectedFilter.toLowerCase());
    });
  }, [events, searchQuery, selectedFilter]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getEventTypeColor = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("wedding")) {
      return "bg-[#FDF0F4] text-[#9F224E] border-[#D44372]/30";
    }
    if (lower.includes("gala") || lower.includes("summit") || lower.includes("conference")) {
      return "bg-[#D44372] text-white border-[#D44372]";
    }
    if (lower.includes("retreat")) {
      return "bg-[#FDF0F4] text-[#2E131E] border-[#F7D6DF]";
    }
    return "bg-[#FDF0F4] text-[#9F224E] border-[#D44372]/30";
  };

  // Convert filtered events to MagicBento items with interactive card content
  const bentoItems: MagicBentoItem[] = useMemo(() => {
    return filteredEvents.map((event) => {
      const isActive = activeEventId === event.id;

      return {
        id: event.id,
        title: event.title,
        description: event.tagline || event.aiVibeSummary,
        colSpan: 1,
        rowSpan: 1,
        content: (
          <div className="flex flex-col justify-between h-full w-full">
            <div>
              {/* Top Badges */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${getEventTypeColor(
                    event.eventType
                  )}`}
                >
                  {event.eventType}
                </span>

                <div className="flex items-center gap-1.5">
                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D44372] animate-pulse" />
                      Active
                    </span>
                  )}

                  {onDeleteEvent && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Are you sure you want to remove "${event.title}" from your history?`
                          )
                        ) {
                          onDeleteEvent(event.id);
                        }
                      }}
                      className="p-1 rounded-lg text-[#A0AEC0] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer z-10"
                      title="Delete blueprint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Tagline */}
              <h3 className="font-[family-name:var(--font-display)] text-base font-medium text-[#2E131E] leading-snug line-clamp-1 hover:text-[#D44372] transition-colors">
                {event.title}
              </h3>

              {event.tagline && (
                <p className="text-xs text-[#8A6775] mt-1 line-clamp-1 italic">
                  "{event.tagline}"
                </p>
              )}

              {/* Key Metrics / Attributes */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#F7D6DF] text-xs">
                <div className="flex items-center gap-1.5 text-[#8A6775]">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#D44372] shrink-0" />
                  <span className="truncate font-medium text-[#2E131E]">
                    {event.date || "Date TBD"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[#8A6775]">
                  <IndianRupee className="w-3.5 h-3.5 text-[#D44372] shrink-0" />
                  <span className="truncate font-bold text-[#2E131E] font-[family-name:var(--font-display)]">
                    {event.totalBudget ? formatCurrency(event.totalBudget) : "Flexible"}
                  </span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-1.5 text-[#8A6775] col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-[#8A6775] shrink-0" />
                    <span className="truncate text-[#8A6775] text-[11px]">
                      {event.location}
                    </span>
                  </div>
                )}
              </div>

              {/* AI Vibe Summary */}
              {event.aiVibeSummary && (
                <div className="mt-3 p-3 rounded-2xl bg-[#FDF0F4]/50 border border-[#F7D6DF] text-[11px] text-[#2E131E] line-clamp-2">
                  <span className="font-bold text-[#9F224E] mr-1">AI Vibe:</span>
                  {event.aiVibeSummary}
                </div>
              )}

              {/* Tasks / Vendors counts */}
              <div className="flex items-center gap-2 mt-3 text-[11px] text-[#8A6775]">
                {event.tasks && event.tasks.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#F7D6DF] text-[#2E131E]">
                    <CheckCircle2 className="w-3 h-3 text-[#D44372]" />
                    {event.tasks.length} Tasks
                  </span>
                )}
                {event.vendors && event.vendors.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#F7D6DF] text-[#2E131E]">
                    <Users className="w-3 h-3 text-[#8A6775]" />
                    {event.vendors.length} Vendors
                  </span>
                )}
                {event.guestCount && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#F7D6DF] text-[#2E131E]">
                    {event.guestCount} Guests
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#F7D6DF]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEvent(event);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-white hover:bg-[#FDF0F4] text-[#2E131E] hover:text-[#2E131E] border border-[#F7D6DF] hover:border-[#D44372] transition-all cursor-pointer shadow-2xs z-10"
                title="Load event parameters into stepper"
              >
                <Layers className="w-3.5 h-3.5 text-[#D44372]" />
                <span>Load Blueprint</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCalendar(event);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-[#D44372] hover:bg-[#BE335E] text-white transition-all cursor-pointer shadow-xs z-10"
                title="Open calendar for this event"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Open Calendar</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ),
      };
    });
  }, [filteredEvents, activeEventId, onSelectEvent, onOpenCalendar, onDeleteEvent]);

  return (
    <section className="w-full mt-10 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F7D6DF]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#D44372] text-white flex items-center justify-center font-bold shadow-xs">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-medium text-[#2E131E] tracking-tight">
                Event Histories
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/40">
                {events.length} {events.length === 1 ? "Blueprint" : "Blueprints"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8A6775]">
              Interactive Magic Bento grid of architected event blueprints. Hover for spotlight & tilt, or load into stepper.
            </p>
          </div>
        </div>

        {onStartNewEvent && (
          <button
            type="button"
            onClick={onStartNewEvent}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#FDF0F4] hover:bg-[#ede3cf] text-[#9F224E] border border-[#D44372] transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create New Blueprint</span>
          </button>
        )}
      </div>

      {/* Search and Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8A6775]" />
          <input
            type="text"
            placeholder="Search blueprints by name, type, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#F7D6DF] bg-white text-xs sm:text-sm text-[#2E131E] placeholder-[#7B8C86]/60 focus:outline-none focus:border-[#D44372] focus:ring-1 focus:ring-[#D44372] transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8A6775] hover:text-[#2E131E]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-[#8A6775] mr-1 shrink-0 hidden sm:block" />
          {filterCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedFilter === cat
                  ? "bg-[#D44372] text-white shadow-xs"
                  : "bg-white text-[#8A6775] border border-[#F7D6DF] hover:text-[#2E131E] hover:bg-[#FDF0F4]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Bento Grid */}
      {filteredEvents.length === 0 ? (
        <div className="w-full bg-white rounded-[28px] border border-[#F7D6DF] p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#FDF0F4] flex items-center justify-center text-[#9F224E]">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-base font-medium text-[#2E131E]">
              No event blueprints found
            </h3>
            <p className="text-xs text-[#8A6775] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No event blueprints matched "${searchQuery}". Try clearing your search.`
                : "You haven't created any event blueprints yet. Use the stepper above to architect your first event."}
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-[#D44372] hover:underline cursor-pointer"
            >
              Reset search filter
            </button>
          )}
        </div>
      ) : (
        <div className="w-full">
          <MagicBento
            items={bentoItems}
            columns={2}
            rowHeight={310}
            gap={16}
            radius={24}
            theme="light"
            glowColor="#D44372"
            enableBorderGlow={true}
            enableSpotlight={true}
            spotlightRadius={300}
            enableStars={false}
            particleCount={20}
            enableTilt={false}
            enableMagnetism={false}
            clickEffect={true}
            textAutoHide={false}
          />
        </div>
      )}
    </section>
  );
};
