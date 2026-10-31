/**
 * Calendar and Event Scheduling Utility Functions
 * Pure functions for date parsing, countdowns, time slot calculation,
 * task filtering, and budget telemetry.
 */

import { IPrepCalendarTask, IBudgetBreakdownItem } from "@/models/UserStatus.model";

/**
 * Formats a date string (ISO or arbitrary) into YYYY-MM-DD for HTML date inputs.
 */
export function parseDateForInput(dateStr?: string): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return "";
}

/**
 * Normalizes user input event type strings to canonical event categories.
 */
export function normalizeEventType(typeStr?: string): string {
  if (!typeStr) return "Conference";
  const lower = typeStr.toLowerCase();
  if (lower.includes("birthday")) return "Birthday";
  if (lower.includes("wedding")) return "Wedding";
  if (lower.includes("summit") || lower.includes("tech") || lower.includes("conference")) return "Conference";
  if (lower.includes("retreat")) return "Retreat";
  if (lower.includes("gala") || lower.includes("charity")) return "Gala";
  if (lower.includes("launch")) return "Product Launch";
  if (lower.includes("network")) return "Networking";
  if (lower.includes("exhibition") || lower.includes("trade")) return "Exhibition";
  return "Conference";
}

/**
 * Computes a task date using its concrete scheduledDate or falls back to
 * daysBeforeEvent offset from baseEventDate.
 */
export function computeTaskDate(
  task: { scheduledDate?: string; daysBeforeEvent?: number | string },
  baseEventDate: Date
): Date {
  const days = Number(task.daysBeforeEvent) || 0;
  if (task.scheduledDate) {
    const parts = task.scheduledDate.split("-");
    if (parts.length === 3) {
      const parsed = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 10, 0, 0);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const directDate = new Date(task.scheduledDate);
    if (!isNaN(directDate.getTime())) return directDate;
  }
  const fallback = new Date(baseEventDate);
  fallback.setDate(fallback.getDate() - days);
  fallback.setHours(10, 0, 0, 0);
  return fallback;
}

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
  tasks: Array<{ id?: string; taskId?: string; isCompleted?: boolean }> = [],
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
    if (completedTaskIds[id] !== undefined) {
      return Boolean(completedTaskIds[id]);
    }
    return Boolean(t.isCompleted);
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

/**
 * Event creation and parameter validation inputs.
 */
export interface EventParametersInput {
  eventName?: string | null;
  eventType?: string | null;
  eventBudget?: string | number | null;
  budget?: string | number | null;
  eventDate?: string | null;
  endDate?: string | null;
  guestCount?: string | number | null;
  planningItems?: string[] | null;
  plannedItems?: string[] | null;
}

export interface EventValidationResult {
  isValid: boolean;
  isStep1Valid: boolean;
  isStep2Valid: boolean;
  errors: {
    eventName?: string;
    eventType?: string;
    budget?: string;
    eventDate?: string;
    guestCount?: string;
    planningItems?: string;
  };
  missingFields: string[];
}

/**
 * Validates event creation parameters for Stepper and backend API routes.
 * Ensures all necessary details are present and valid before evaluation or database storage.
 */
export function validateEventParameters(params: EventParametersInput): EventValidationResult {
  const errors: EventValidationResult["errors"] = {};
  const missingFields: string[] = [];

  // 1. Event Name
  const trimmedName = typeof params.eventName === "string" ? params.eventName.trim() : "";
  if (!trimmedName || trimmedName === "Untitled Event") {
    errors.eventName = "Event name is required.";
    missingFields.push("Event Name");
  }

  // 2. Event Type
  const trimmedType = typeof params.eventType === "string" ? params.eventType.trim() : "";
  if (!trimmedType) {
    errors.eventType = "Event type is required.";
    missingFields.push("Event Type");
  }

  // 3. Estimated Budget (> 0)
  const rawBudget = params.budget ?? params.eventBudget;
  const numBudget = Number(rawBudget);
  if (rawBudget === undefined || rawBudget === null || rawBudget === "" || isNaN(numBudget) || numBudget <= 0) {
    errors.budget = "Estimated budget must be greater than ₹0.";
    missingFields.push("Estimated Budget");
  }

  // 4. Event Date (Future date only, >= tomorrow)
  const dateInput = String(params.endDate || params.eventDate || "").trim();
  if (!dateInput || dateInput === "Date TBD") {
    errors.eventDate = "Event date is required.";
    missingFields.push("Event Date");
  } else {
    const targetDate = new Date(dateInput);
    if (isNaN(targetDate.getTime())) {
      errors.eventDate = "Event date is invalid. Please select a valid date.";
      missingFields.push("Event Date");
    } else {
      const today = new Date();
      targetDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (targetDate.getTime() === today.getTime()) {
        errors.eventDate = "Event date cannot be today. Please select a future date.";
        missingFields.push("Event Date (Future)");
      } else if (targetDate.getTime() < today.getTime()) {
        errors.eventDate = "Event date cannot be in the past. Please select a future date.";
        missingFields.push("Event Date (Future)");
      }
    }
  }

  // 5. Guest Count (>= 1)
  const rawGuests = params.guestCount;
  const numGuests = Number(rawGuests);
  if (rawGuests === undefined || rawGuests === null || rawGuests === "" || isNaN(numGuests) || numGuests < 1) {
    errors.guestCount = "Guest count must be at least 1.";
    missingFields.push("Guest Count");
  }

  // 6. Planning Requirements (at least 1 non-empty item)
  const rawList = Array.isArray(params.planningItems) && params.planningItems.length
    ? params.planningItems
    : Array.isArray(params.plannedItems)
    ? params.plannedItems
    : [];
  const validPlanningItems = rawList.map((item) => String(item || "").trim()).filter(Boolean);

  if (validPlanningItems.length === 0) {
    errors.planningItems = "At least one planning requirement is required.";
    missingFields.push("Planning Requirements");
  }

  const isStep1Valid = !errors.eventName && !errors.eventType && !errors.budget && !errors.eventDate && !errors.guestCount;
  const isStep2Valid = !errors.planningItems;
  const isValid = isStep1Valid && isStep2Valid;

  return {
    isValid,
    isStep1Valid,
    isStep2Valid,
    errors,
    missingFields,
  };
}
