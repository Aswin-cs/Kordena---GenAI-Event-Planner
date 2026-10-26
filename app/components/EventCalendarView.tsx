"use client";

import React, { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Calendar as CalendarIcon,
  Clock,
  IndianRupee,
  Tag,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Share2,
  Download,
  Plus,
  Info,
  Layers,
} from "lucide-react";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export interface CalendarEventItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type?: string;
  budget?: string | number;
  plan?: string;
  isMainEvent?: boolean;
  description?: string;
}

interface EventCalendarViewProps {
  eventName: string;
  eventType: string;
  eventBudget: string;
  eventDate: string;
  selectedPlan: string;
  organizerName?: string;
  onBackToStepper: () => void;
  onNewEvent?: () => void;
}

export const EventCalendarView: React.FC<EventCalendarViewProps> = ({
  eventName,
  eventType,
  eventBudget,
  eventDate,
  selectedPlan,
  organizerName,
  onBackToStepper,
  onNewEvent,
}) => {
  const [currentView, setCurrentView] = useState<View>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);

  // Compute the parsed event Date
  const parsedEventDate = useMemo(() => {
    if (!eventDate) return new Date();
    const parts = eventDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day, 10, 0, 0);
      if (!isNaN(d.getTime())) return d;
    }
    const fallback = new Date(eventDate);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
  }, [eventDate]);

  // Controlled date state so Next, Back, and Today buttons work properly
  const [currentDate, setCurrentDate] = useState<Date>(parsedEventDate);

  // Sync internal calendar date if parsedEventDate changes
  React.useEffect(() => {
    setCurrentDate(parsedEventDate);
  }, [parsedEventDate]);

  // Build calendar events list (Main event + related AI milestones)
  const eventsList: CalendarEventItem[] = useMemo(() => {
    const mainTitle = eventName.trim() || "Untitled Event";
    const mainStart = new Date(parsedEventDate);
    mainStart.setHours(9, 0, 0, 0);

    const mainEnd = new Date(parsedEventDate);
    mainEnd.setHours(18, 0, 0, 0);

    // Main event
    const items: CalendarEventItem[] = [
      {
        id: "main-event",
        title: `★ ${mainTitle}`,
        start: mainStart,
        end: mainEnd,
        allDay: true,
        type: eventType,
        budget: eventBudget,
        plan: selectedPlan,
        isMainEvent: true,
        description: `Main event execution date for ${mainTitle}. Budget: ₹${Number(eventBudget || 0).toLocaleString("en-IN")}`,
      },
    ];

    // Add milestone 7 days before
    const tMinus7 = new Date(parsedEventDate);
    tMinus7.setDate(tMinus7.getDate() - 7);
    tMinus7.setHours(10, 0, 0, 0);
    const tMinus7End = new Date(tMinus7);
    tMinus7End.setHours(12, 0, 0, 0);

    items.push({
      id: "milestone-catering",
      title: "📋 Final Headcount & Vendor Lock",
      start: tMinus7,
      end: tMinus7End,
      allDay: false,
      type: "Milestone",
      isMainEvent: false,
      description: "Confirm catering headcounts, stage tech riders, and vendor arrivals.",
    });

    // Add milestone 2 days before
    const tMinus2 = new Date(parsedEventDate);
    tMinus2.setDate(tMinus2.getDate() - 2);
    tMinus2.setHours(14, 0, 0, 0);
    const tMinus2End = new Date(tMinus2);
    tMinus2End.setHours(16, 0, 0, 0);

    items.push({
      id: "milestone-rehearsal",
      title: "🎙️ Audio/Visual & Tech Dry Run",
      start: tMinus2,
      end: tMinus2End,
      allDay: false,
      type: "Milestone",
      isMainEvent: false,
      description: "Soundcheck, presenter runs, livestream check, and signage placements.",
    });

    return items;
  }, [eventName, eventType, eventBudget, selectedPlan, parsedEventDate]);

  // Custom event styles
  const eventPropGetter = (event: CalendarEventItem) => {
    if (event.isMainEvent) {
      return {
        style: {
          backgroundColor: "#10B981",
          borderColor: "#059669",
          color: "#FFFFFF",
          borderRadius: "8px",
          fontWeight: "700",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
          padding: "3px 8px",
        },
      };
    }
    return {
      style: {
        backgroundColor: "#E6F7F0",
        borderColor: "#A7F3D0",
        color: "#059669",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "12px",
        padding: "2px 6px",
      },
    };
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Bar with Back Button & Event Summary Pill */}
      <div className="bg-[#FFFFFF] rounded-3xl p-5 sm:p-6 border border-[#E2ECE5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={onBackToStepper}
            className="p-2.5 rounded-2xl bg-[#F4F7F5] hover:bg-[#E2ECE5] text-[#2D3748] border border-[#E2ECE5] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs group"
            title="Back to Stepper Setup"
          >
            <ArrowLeft className="w-4 h-4 text-[#718096] group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-semibold hidden sm:inline">Back to Stepper</span>
          </button>

          {onNewEvent && (
            <button
              onClick={onNewEvent}
              className="p-2.5 px-3.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs shadow-[#10B981]/25 font-bold text-xs"
              title="Create New Event"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Event</span>
            </button>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D3748] tracking-tight">
                {eventName || "Annual Global Tech Summit 2026"}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Date Marked on Calendar
              </span>
            </div>
            <p className="text-xs text-[#718096]">
              Your event blueprint schedule and milestone timeline are ready.
            </p>
          </div>
        </div>

        {/* Event Meta Badges */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="px-3 py-1.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] flex items-center gap-2 text-xs">
            <CalendarIcon className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="font-semibold text-[#2D3748]">
              {format(parsedEventDate, "MMMM dd, yyyy")}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] flex items-center gap-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="font-semibold text-[#2D3748]">{eventType}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] flex items-center gap-1 text-xs">
            <IndianRupee className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="font-semibold text-[#2D3748]">
              {eventBudget ? `₹${Number(eventBudget).toLocaleString("en-IN")}` : "₹0"}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#E6F7F0] border border-[#A7F3D0] flex items-center gap-1.5 text-xs text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-bold">{selectedPlan}</span>
          </div>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-[#FFFFFF] rounded-3xl p-4 sm:p-6 border border-[#E2ECE5] shadow-md space-y-4">
        {/* Calendar Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2ECE5] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D3748]">Event Master Calendar</h2>
              <p className="text-xs text-[#718096]">
                Interactive schedule highlighting your marked event and preparatory milestones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E6F7F0] text-[#059669] font-medium border border-[#A7F3D0]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Main Event
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F7F5] text-[#718096] font-medium border border-[#E2ECE5]">
              <span className="w-2 h-2 rounded-full bg-[#718096]" /> Milestones
            </span>
            {onNewEvent && (
              <button
                type="button"
                onClick={onNewEvent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition-all shadow-xs shadow-[#10B981]/20 cursor-pointer sm:ml-1"
                title="Create New Event"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Calendar Wrapper */}
        <div className="h-[620px] w-full calendar-container">
          <Calendar
            localizer={localizer}
            events={eventsList}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            view={currentView}
            onView={(view) => setCurrentView(view)}
            eventPropGetter={eventPropGetter}
            onSelectEvent={(event) => setSelectedEvent(event as CalendarEventItem)}
            popup
            views={["month", "week", "day", "agenda"]}
          />
        </div>
      </div>

      {/* Selected Event Details Modal / Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-[#2D3748]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full border border-[#E2ECE5] shadow-2xl p-6 animate-in fade-in zoom-in duration-150 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE5]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                <h3 className="text-base font-bold text-[#2D3748]">
                  {selectedEvent.isMainEvent ? "Event Milestone Details" : "Milestone Details"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#718096] hover:text-[#2D3748] text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[#718096] font-semibold uppercase text-[10px] tracking-wider">
                  Title
                </p>
                <p className="text-sm font-bold text-[#2D3748]">{selectedEvent.title}</p>
              </div>

              <div>
                <p className="text-[#718096] font-semibold uppercase text-[10px] tracking-wider">
                  Date & Time
                </p>
                <p className="font-medium text-[#2D3748]">
                  {format(selectedEvent.start, "EEEE, MMMM dd, yyyy")}
                  {!selectedEvent.allDay && ` • ${format(selectedEvent.start, "hh:mm a")} - ${format(selectedEvent.end, "hh:mm a")}`}
                </p>
              </div>

              {selectedEvent.description && (
                <div>
                  <p className="text-[#718096] font-semibold uppercase text-[10px] tracking-wider">
                    Notes
                  </p>
                  <p className="text-[#2D3748] bg-[#F4F7F5] p-2.5 rounded-xl border border-[#E2ECE5] mt-1 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {selectedEvent.isMainEvent && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-[#E6F7F0] p-2.5 rounded-xl border border-[#A7F3D0]">
                    <span className="text-[10px] uppercase font-bold text-[#059669]">Budget</span>
                    <p className="font-extrabold text-sm text-[#059669]">
                      ₹{Number(selectedEvent.budget || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="bg-[#F4F7F5] p-2.5 rounded-xl border border-[#E2ECE5]">
                    <span className="text-[10px] uppercase font-bold text-[#718096]">Type</span>
                    <p className="font-extrabold text-sm text-[#2D3748]">{selectedEvent.type}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full py-2.5 rounded-xl bg-[#10B981] text-white font-bold text-xs hover:bg-[#059669] transition-all cursor-pointer shadow-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
