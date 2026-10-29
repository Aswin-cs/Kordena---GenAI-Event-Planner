"use client";

import React, { useState } from "react";
import { Bell, Clock, Calendar, AlertTriangle, CheckCircle2, Check, Sparkles, Plus } from "lucide-react";
import { CalendarAlert, TimelineScheduleItem, EventPlan } from "../types";

interface TimelineSectionProps {
  event: EventPlan;
  onUpdateAlerts: (alerts: CalendarAlert[]) => void;
  onUpdateSchedule: (schedule: TimelineScheduleItem[]) => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  event,
  onUpdateAlerts,
  onUpdateSchedule,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"alerts" | "schedule">("alerts");

  const toggleAlert = (alertId: string) => {
    const updated = event.alerts.map((a) => {
      if (a.id === alertId) {
        return { ...a, completed: !a.completed };
      }
      return a;
    });
    onUpdateAlerts(updated);
  };

  const toggleScheduleStatus = (scheduleId: string) => {
    const updated = event.schedule.map((item) => {
      if (item.id === scheduleId) {
        const nextStatus: TimelineScheduleItem["status"] =
          item.status === "Pending"
            ? "In-Progress"
            : item.status === "In-Progress"
            ? "Completed"
            : "Pending";
        return { ...item, status: nextStatus };
      }
      return item;
    });
    onUpdateSchedule(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E2ECE5] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">
                Chronological Synchronization
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
                Live Countdown
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#2D3748]">
              Calendar Alerts & Run-of-Show
            </h2>
            <p className="text-xs sm:text-sm text-[#718096]">
              Clear visual mint green (#10B981) feedback for upcoming milestone deadlines
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Timeline navigation"
            className="flex items-center gap-2 bg-[#F4F7F5] p-1.5 rounded-2xl border border-[#E2ECE5]"
          >
            <button
              type="button"
              role="tab"
              id="tab-alerts"
              aria-selected={activeSubTab === "alerts"}
              aria-controls="alerts-panel"
              onClick={() => setActiveSubTab("alerts")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "alerts"
                  ? "bg-[#10B981] text-white shadow-xs"
                  : "text-[#718096] hover:text-[#2D3748]"
              }`}
            >
              Calendar Alerts ({event.alerts.filter((a) => !a.completed).length})
            </button>
            <button
              type="button"
              role="tab"
              id="tab-schedule"
              aria-selected={activeSubTab === "schedule"}
              aria-controls="schedule-panel"
              onClick={() => setActiveSubTab("schedule")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "schedule"
                  ? "bg-[#10B981] text-white shadow-xs"
                  : "text-[#718096] hover:text-[#2D3748]"
              }`}
            >
              Day-of Schedule ({event.schedule.length})
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: CALENDAR ALERTS */}
      {activeSubTab === "alerts" && (
        <div
          role="tabpanel"
          id="alerts-panel"
          aria-labelledby="tab-alerts"
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">
              Critical Milestone Calendar Alerts
            </span>
            <span className="text-xs text-[#10B981] font-semibold">
              Kordena AI Automated Tracking
            </span>
          </div>

          <div className="space-y-3">
            {event.alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => toggleAlert(alert.id)}
                className={`group bg-[#FFFFFF] rounded-2xl p-5 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  alert.completed
                    ? "border-[#E2ECE5] bg-[#FFFFFF]/70 opacity-75"
                    : "border-[#A7F3D0] shadow-xs hover:border-[#10B981]"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* ACCENT VISUAL FEEDBACK: #10B981 */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                      alert.completed
                        ? "bg-[#E6F7F0] text-[#10B981]"
                        : "bg-[#E6F7F0] text-[#10B981] group-hover:scale-105"
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold ${
                          alert.completed
                            ? "line-through text-[#718096]"
                            : "text-[#2D3748] group-hover:text-[#10B981]"
                        }`}
                      >
                        {alert.title}
                      </h4>

                      {/* CLEAR ACCENT BADGE: #10B981 */}
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
                        {alert.completed ? "Resolved" : `T - ${alert.daysRemaining} Days`}
                      </span>
                    </div>

                    <p className="text-xs text-[#718096] leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5 text-[11px] text-[#718096]">
                      <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Scheduled deadline: {alert.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end sm:justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAlert(alert.id);
                    }}
                    aria-label={`${alert.completed ? "Mark alert unresolved" : "Acknowledge and clear alert"}: ${alert.title}`}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      alert.completed
                        ? "bg-[#F4F7F5] text-[#718096] border border-[#E2ECE5]"
                        : "bg-[#10B981] text-white hover:bg-[#059669] shadow-2xs"
                    }`}
                  >
                    {alert.completed ? "Mark Unresolved" : "Acknowledge & Clear"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: RUN OF SHOW SCHEDULE */}
      {activeSubTab === "schedule" && (
        <div
          role="tabpanel"
          id="schedule-panel"
          aria-labelledby="tab-schedule"
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">
              Day-of Operational Sequence
            </span>
            <span className="text-xs text-[#10B981] font-semibold">
              Live Flow Director
            </span>
          </div>

          <div className="space-y-3">
            {event.schedule.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => toggleScheduleStatus(item.id)}
                className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2ECE5] shadow-xs hover:border-[#10B981]/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="px-3 py-2 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs font-bold text-[#2D3748] shrink-0 text-center min-w-[110px]">
                    <Clock className="w-3.5 h-3.5 text-[#10B981] inline-block mr-1 -mt-0.5" />
                    {item.time}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#2D3748]">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#718096]">
                      Responsible Lead: <strong className="text-[#2D3748] font-semibold">{item.responsible}</strong> • Duration: {item.duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                      item.status === "Completed"
                        ? "bg-[#E6F7F0] text-[#10B981] border-[#A7F3D0]"
                        : item.status === "In-Progress"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-[#F4F7F5] text-[#718096] border-[#E2ECE5]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
