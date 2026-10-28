/**
 * Calendar and Event Scheduling Utility Functions
 * Pure functions for date parsing, countdowns, time slot calculation,
 * task filtering, and budget telemetry.
 */

import { IPrepCalendarTask, IBudgetBreakdownItem } from "@/models/UserStatus.model";

/**
 * Parses an event date string (e.g. "2026-11-10" or ISO string) into a valid local Date object.
 * Falls back to current Date if undefined or invalid.
 */
export function parseTargetEventDate(eventDate?: string): Date {
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
}

/**
 * Calculates the number of days remaining until the target event date.
 * Positive number = days until event in the future.
 * Negative number = days past event.
 */
export function calculateDaysUntilEvent(eventDate: Date | string, todayDate?: Date): number {
  const today = todayDate ? new Date(todayDate) : new Date();
  today.setHours(0, 0, 0, 0);

  const target = typeof eventDate === "string" ? parseTargetEventDate(eventDate) : new Date(eventDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Parses a time slot string such as "09:00 AM - 11:30 AM" or "14:00 - 16:00"
 * into a start and end Date anchored on baseDate.
 */
export function parseTimeSlotToHours(
  baseDate: Date,
  timeSlotStr: string
): { start: Date; end: Date } {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  try {
    const parts = (timeSlotStr || "").split("-").map((p) => p.trim());
    if (parts.length >= 1 && parts[0]) {
      const match = parts[0].match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        start.setHours(hours, mins, 0, 0);
      }
    }
    if (parts.length >= 2 && parts[1]) {
      const match = parts[1].match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        end.setHours(hours, mins, 0, 0);
      } else {
        end.setTime(start.getTime() + 60 * 60 * 1000);
      }
    } else {
      end.setTime(start.getTime() + 60 * 60 * 1000);
    }
  } catch {
    start.setHours(9, 0, 0, 0);
    end.setHours(10, 0, 0, 0);
  }

  // Safety fallback if start >= end
  if (end.getTime() <= start.getTime()) {
    end.setTime(start.getTime() + 60 * 60 * 1000);
  }

  return { start, end };
}

/**
 * Calculates budget allocation totals, percentage committed, and remaining contingency buffer.
 */
export function calculateBudgetMetrics(
  totalBudget: number,
  items: Array<{ allocatedAmount?: number }> = []
): {
  totalBudget: number;
  totalAllocated: number;
  remainingBuffer: number;
  allocatedPercentage: number;
  isOverBudget: boolean;
} {
  const safeTotal = Math.max(0, Number(totalBudget) || 0);
  const totalAllocated = items.reduce(
    (sum, item) => sum + (Number(item?.allocatedAmount) || 0),
    0
  );
  const remainingBuffer = safeTotal - totalAllocated;
  const allocatedPercentage = safeTotal > 0 ? Math.round((totalAllocated / safeTotal) * 100) : 0;

  return {
    totalBudget: safeTotal,
    totalAllocated,
    remainingBuffer,
    allocatedPercentage,
    isOverBudget: remainingBuffer < 0,
  };
}

/**
 * Calculates task completion metrics and velocity percentage.
 */
export function calculateCompletionMetrics(
  tasks: Array<{ id?: string; taskId?: string }> = [],
  completedTaskIds: Record<string, boolean> = {}
): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = tasks.length;
  if (total === 0) {
    return { total: 0, completed: 0, percentage: 0 };
  }

  const completed = tasks.filter((t, idx) => {
    const id = t.id || t.taskId || `task-${idx}`;
    return Boolean(completedTaskIds[id]);
  }).length;

  const percentage = Math.round((completed / total) * 100);
  return { total, completed, percentage };
}

/**
 * Filters prep tasks based on department, priority, action type, and search query.
 */
export function filterPrepTasks(
  tasks: IPrepCalendarTask[] = [],
  filters: {
    department?: string;
    priority?: string;
    actionType?: string;
    searchQuery?: string;
  } = {}
): IPrepCalendarTask[] {
  return tasks.filter((task) => {
    if (filters.department && filters.department !== "all") {
      if (task.department !== filters.department) return false;
    }
    if (filters.priority && filters.priority !== "all") {
      if (task.priority?.toLowerCase() !== filters.priority.toLowerCase()) return false;
    }
    if (filters.actionType && filters.actionType !== "all") {
      if (task.actionType?.toLowerCase() !== filters.actionType.toLowerCase()) return false;
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matches =
        task.title?.toLowerCase().includes(q) ||
        task.department?.toLowerCase().includes(q) ||
        task.actionType?.toLowerCase().includes(q) ||
        task.actionBrief?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });
}
