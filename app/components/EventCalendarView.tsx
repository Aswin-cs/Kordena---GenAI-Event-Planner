"use client";

import React, { useMemo, useState, useEffect } from "react";
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
  Plus,
  PhoneCall,
  Handshake,
  Palette,
  ShoppingCart,
  Wrench,
  AlertTriangle,
  Circle,
  ListChecks,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Users,
  ShieldAlert,
  X,
  Star,
  Zap,
  SlidersHorizontal,
  Save,
  RotateCcw,
  Check,
  ShieldCheck,
  UtensilsCrossed,
  Building2,
  Camera,
  Layers,
} from "lucide-react";
import {
  IPrepCalendarTask,
  IDayOfRunOfShowItem,
  IBudgetBreakdownItem,
  IEvaluationSummary,
} from "@/models/UserStatus.model";
import MagicBento, { MagicBentoItem } from "./MagicBento";
import ElasticSlider from "./ElasticSlider";

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
  // Prep Calendar task fields from UserStatus
  task?: IPrepCalendarTask;
  runOfShowItem?: IDayOfRunOfShowItem;
  department?: string;
  actionType?: "call" | "arrange" | "design" | "procure" | "setup";
  priority?: "high" | "medium" | "low";
  daysBeforeEvent?: number;
  estimatedCost?: number;
  actionBrief?: string;
}

export interface EventCalendarViewProps {
  eventName: string;
  eventType: string;
  eventBudget: string;
  eventDate: string;
  selectedPlan: string;
  tier?: string;
  guestCount?: number | string;
  organizerName?: string;
  // Real details from UserStatus.model.ts
  prepCalendarTasks?: IPrepCalendarTask[];
  dayOfRunOfShow?: IDayOfRunOfShowItem[];
  budgetBreakdown?: IBudgetBreakdownItem[];
  evaluationSummary?: IEvaluationSummary;
  plannedItems?: string[];
  requirements?: string[];
  onBackToStepper: () => void;
  onNewEvent?: () => void;
}

export function getActionMeta(actionType?: string) {
  switch (actionType?.toLowerCase()) {
    case "call":
      return {
        label: "Vendor Call",
        icon: PhoneCall,
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "procure":
      return {
        label: "Procurement",
        icon: ShoppingCart,
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      };
    case "design":
      return {
        label: "Creative Design",
        icon: Palette,
        badgeBg: "bg-pink-50 text-pink-700 border-pink-200",
      };
    case "arrange":
      return {
        label: "Logistics",
        icon: Handshake,
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "setup":
      return {
        label: "Tech & Staging",
        icon: Wrench,
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    default:
      return {
        label: "Prep Milestone",
        icon: Clock,
        badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
}

export function getPriorityMeta(priority?: string) {
  switch (priority?.toLowerCase()) {
    case "high":
      return {
        label: "High Priority",
        badge: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
        border: "border-rose-400",
      };
    case "medium":
      return {
        label: "Medium Priority",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
        border: "border-amber-400",
      };
    case "low":
      return {
        label: "Low Priority",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        border: "border-emerald-400",
      };
    default:
      return {
        label: "Normal",
        badge: "bg-slate-50 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
        border: "border-slate-300",
      };
  }
}

function parseTimeSlotToHours(baseDate: Date, timeSlotStr: string): { start: Date; end: Date } {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  try {
    const parts = timeSlotStr.split("-").map((p) => p.trim());
    if (parts.length >= 1) {
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
    if (parts.length >= 2) {
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
  return { start, end };
}

export function getCategoryMeta(category: string) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("food") || cat.includes("cater") || cat.includes("dining") || cat.includes("beverage") || cat.includes("hospitality")) {
    return { icon: UtensilsCrossed, color: "text-amber-700 bg-amber-50 border-amber-200" };
  }
  if (cat.includes("venue") || cat.includes("hall") || cat.includes("space") || cat.includes("location") || cat.includes("infra")) {
    return { icon: Building2, color: "text-indigo-700 bg-indigo-50 border-indigo-200" };
  }
  if (cat.includes("photo") || cat.includes("video") || cat.includes("media") || cat.includes("camera")) {
    return { icon: Camera, color: "text-rose-700 bg-rose-50 border-rose-200" };
  }
  if (cat.includes("decor") || cat.includes("flower") || cat.includes("stage") || cat.includes("art") || cat.includes("production")) {
    return { icon: Palette, color: "text-pink-700 bg-pink-50 border-pink-200" };
  }
  if (cat.includes("sound") || cat.includes("light") || cat.includes("audio") || cat.includes("tech") || cat.includes("av") || cat.includes("visual")) {
    return { icon: Wrench, color: "text-blue-700 bg-blue-50 border-blue-200" };
  }
  if (cat.includes("security") || cat.includes("permit") || cat.includes("license") || cat.includes("safety") || cat.includes("contingency")) {
    return { icon: ShieldCheck, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  }
  return { icon: Layers, color: "text-slate-700 bg-slate-50 border-slate-200" };
}

export const EventCalendarView: React.FC<EventCalendarViewProps> = ({
  eventName,
  eventType,
  eventBudget,
  eventDate,
  selectedPlan,
  tier = "Starter",
  guestCount = 100,
  organizerName,
  prepCalendarTasks: initialTasks,
  dayOfRunOfShow: initialRunOfShow,
  budgetBreakdown: initialBudget,
  evaluationSummary: initialSummary,
  plannedItems = [],
  onBackToStepper,
  onNewEvent,
}) => {
  const [currentView, setCurrentView] = useState<View>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);

  // Loaded tasks & run of show state (with fallback to GET /api/user-status if props are empty)
  const [tasks, setTasks] = useState<IPrepCalendarTask[]>(initialTasks || []);
  const [runOfShow, setRunOfShow] = useState<IDayOfRunOfShowItem[]>(initialRunOfShow || []);
  const [evalSummary, setEvalSummary] = useState<IEvaluationSummary | undefined>(initialSummary);
  const [budgetList, setBudgetList] = useState<IBudgetBreakdownItem[]>(initialBudget || []);
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});

  // Fallback default budget breakdown if event has no AI budget breakdown yet
  const defaultCategories = useMemo<IBudgetBreakdownItem[]>(() => {
    const total = Number(eventBudget) || 100000;
    return [
      {
        category: "Venue & Infrastructure",
        allocatedAmount: Math.round(total * 0.35),
        percentage: 35,
        sliderMin: Math.round(total * 0.15),
        sliderMax: Math.round(total * 0.60),
        spendStrategy: "Secures prime location and base operational facilities.",
      },
      {
        category: "Catering & Hospitality",
        allocatedAmount: Math.round(total * 0.30),
        percentage: 30,
        sliderMin: Math.round(total * 0.10),
        sliderMax: Math.round(total * 0.50),
        spendStrategy: "Multi-course meal, refreshments & guest dining experience.",
      },
      {
        category: "Audio/Visual & Staging",
        allocatedAmount: Math.round(total * 0.15),
        percentage: 15,
        sliderMin: Math.round(total * 0.05),
        sliderMax: Math.round(total * 0.35),
        spendStrategy: "High-definition sound, stage lighting & display visuals.",
      },
      {
        category: "Decor & Production",
        allocatedAmount: Math.round(total * 0.10),
        percentage: 10,
        sliderMin: Math.round(total * 0.05),
        sliderMax: Math.round(total * 0.25),
        spendStrategy: "Floral arrangements, theme signage & welcome arch.",
      },
      {
        category: "Contingency & Permits",
        allocatedAmount: Math.round(total * 0.10),
        percentage: 10,
        sliderMin: Math.round(total * 0.02),
        sliderMax: Math.round(total * 0.20),
        spendStrategy: "Emergency operational reserves & municipal compliance.",
      },
    ];
  }, [eventBudget]);

  const targetBudget = Number(eventBudget) || 100000;

  // Helper to ensure each category has fixed, stable min & max bounds
  const normalizeBudgetItems = (items: IBudgetBreakdownItem[]): IBudgetBreakdownItem[] => {
    return items.map((item) => {
      const allocated = Math.max(0, Number(item.allocatedAmount) || 0);
      const sMin =
        typeof item.sliderMin === "number" && !isNaN(item.sliderMin) && item.sliderMin >= 0
          ? item.sliderMin
          : Math.max(0, Math.round(Math.min(allocated * 0.25, targetBudget * 0.05)));
      const sMax =
        typeof item.sliderMax === "number" && !isNaN(item.sliderMax) && item.sliderMax > sMin
          ? item.sliderMax
          : Math.max(sMin + 5000, Math.round(Math.max(allocated * 2, targetBudget * 0.6, 25000)));

      return {
        ...item,
        allocatedAmount: allocated,
        sliderMin: sMin,
        sliderMax: sMax,
      };
    });
  };

  // Editable budget breakdown state controlled by ElasticSlider
  const [editableBudget, setEditableBudget] = useState<IBudgetBreakdownItem[]>(() => {
    const base = initialBudget && initialBudget.length > 0 ? initialBudget : defaultCategories;
    return normalizeBudgetItems(base);
  });
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync editable budget if budgetList updates from database or parent
  useEffect(() => {
    if (budgetList && budgetList.length > 0) {
      setEditableBudget(normalizeBudgetItems(budgetList));
    }
  }, [budgetList, targetBudget]);

  // Target budget and total allocated calculations
  const totalAllocated = useMemo(() => {
    return editableBudget.reduce(
      (sum, item) => sum + (Number(item.allocatedAmount) || 0),
      0
    );
  }, [editableBudget]);
  const budgetDelta = targetBudget - totalAllocated;

  // Handle category slider change
  const handleCategoryBudgetChange = (index: number, newAmount: number) => {
    setEditableBudget((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      item.allocatedAmount = Math.round(newAmount);
      item.percentage = targetBudget > 0 ? Math.round((newAmount / targetBudget) * 100) : 0;
      next[index] = item;
      return next;
    });
    setSaveSuccess(false);
  };

  // Reset to initial AI breakdown or defaults
  const handleResetBudget = () => {
    if (budgetList && budgetList.length > 0) {
      setEditableBudget(budgetList);
    } else {
      setEditableBudget(defaultCategories);
    }
    setSaveSuccess(false);
    setSaveError(null);
  };

  // Save budget changes to database
  const handleSaveBudget = async () => {
    setIsSavingBudget(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/user-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          budgetBreakdown: editableBudget,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBudgetList(editableBudget);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setSaveError(data.message || "Failed to save budget breakdown");
      }
    } catch (err: any) {
      console.error("Error saving budget breakdown:", err);
      setSaveError(err?.message || "Failed to save budget breakdown");
    } finally {
      setIsSavingBudget(false);
    }
  };

  // Filters for the Countdown Tasks panel
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sync if props update
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) setTasks(initialTasks);
    if (initialRunOfShow && initialRunOfShow.length > 0) setRunOfShow(initialRunOfShow);
    if (initialSummary) setEvalSummary(initialSummary);
    if (initialBudget && initialBudget.length > 0) setBudgetList(initialBudget);
  }, [initialTasks, initialRunOfShow, initialSummary, initialBudget]);

  // If initial tasks are empty, try fetching latest saved UserStatus from database
  useEffect(() => {
    if (!initialTasks || initialTasks.length === 0) {
      let isMounted = true;
      fetch("/api/user-status")
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted || !data.success || !data.userStatuses?.length) return;
          // Find matching event or use latest
          const matched =
            data.userStatuses.find(
              (us: any) =>
                us.eventName?.trim().toLowerCase() === eventName.trim().toLowerCase()
            ) || data.userStatuses[0];

          if (matched) {
            if (matched.prepCalendarTasks?.length) setTasks(matched.prepCalendarTasks);
            if (matched.dayOfRunOfShow?.length) setRunOfShow(matched.dayOfRunOfShow);
            if (matched.evaluationSummary) setEvalSummary(matched.evaluationSummary);
            if (matched.budgetBreakdown?.length) setBudgetList(matched.budgetBreakdown);
          }
        })
        .catch((err) => console.warn("Could not load user-status for calendar:", err));
      return () => {
        isMounted = false;
      };
    }
  }, [initialTasks, eventName]);

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
  useEffect(() => {
    setCurrentDate(parsedEventDate);
  }, [parsedEventDate]);

  // Toggle task completion
  const handleToggleTaskCompleted = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Build calendar events list: Main Event + Prep Calendar Tasks + Day-of-Run-of-Show
  const eventsList: CalendarEventItem[] = useMemo(() => {
    const mainTitle = eventName.trim() || "Untitled Event";
    const mainStart = new Date(parsedEventDate);
    mainStart.setHours(9, 0, 0, 0);

    const mainEnd = new Date(parsedEventDate);
    mainEnd.setHours(18, 0, 0, 0);

    // 1. Main event card
    const items: CalendarEventItem[] = [
      {
        id: "main-event",
        title: mainTitle,
        start: mainStart,
        end: mainEnd,
        allDay: true,
        type: eventType,
        budget: eventBudget,
        plan: selectedPlan,
        isMainEvent: true,
        description: `Main Event Day for ${mainTitle}. Feasibility: ${evalSummary?.feasibilityAssessment || "High"}. Budget: ₹${Number(eventBudget || 0).toLocaleString("en-IN")}.`,
      },
    ];

    // 2. Add prepCalendarTasks countdown milestones — prefer scheduledDate, fallback to daysBeforeEvent
    if (tasks && tasks.length > 0) {
      tasks.forEach((task, idx) => {
        const days = Number(task.daysBeforeEvent) || 0;
        let taskDate: Date;

        // Use concrete scheduledDate if provided, otherwise compute from daysBeforeEvent
        if (task.scheduledDate) {
          const parts = task.scheduledDate.split("-");
          if (parts.length === 3) {
            taskDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          } else {
            taskDate = new Date(task.scheduledDate);
          }
          if (isNaN(taskDate.getTime())) {
            // Fallback if scheduledDate is invalid
            taskDate = new Date(parsedEventDate);
            taskDate.setDate(taskDate.getDate() - days);
          }
        } else {
          taskDate = new Date(parsedEventDate);
          taskDate.setDate(taskDate.getDate() - days);
        }
        taskDate.setHours(10, 0, 0, 0);

        const taskEndDate = new Date(taskDate);
        taskEndDate.setHours(12, 0, 0, 0);

        const meta = getActionMeta(task.actionType);
        const isDone = completedTaskIds[task.id || `task-${idx}`];

        items.push({
          id: task.id || `task-${idx}`,
          title: `[${task.department}] ${task.title}`,
          start: taskDate,
          end: taskEndDate,
          allDay: false,
          type: `T - ${days} Days (${meta.label})`,
          isMainEvent: false,
          description: task.actionBrief,
          task,
          department: task.department,
          actionType: task.actionType,
          priority: task.priority,
          daysBeforeEvent: days,
          estimatedCost: task.estimatedCost,
          actionBrief: task.actionBrief,
        });
      });
    }

    // 3. Add Day-of-Run-of-Show items onto the main event day
    if (runOfShow && runOfShow.length > 0) {
      runOfShow.forEach((ros, idx) => {
        const { start, end } = parseTimeSlotToHours(parsedEventDate, ros.timeSlot);
        items.push({
          id: `ros-${idx}`,
          title: `[${ros.departmentInCharge}] ${ros.activity}`,
          start,
          end,
          allDay: false,
          type: "Day-of Run of Show",
          isMainEvent: false,
          description: `${ros.operationalNotes} (Dependency: ${ros.dependency})`,
          runOfShowItem: ros,
          department: ros.departmentInCharge,
        });
      });
    }

    return items;
  }, [
    eventName,
    eventType,
    eventBudget,
    selectedPlan,
    parsedEventDate,
    tasks,
    runOfShow,
    evalSummary,
    completedTaskIds,
  ]);

  // Custom event styles for React-Big-Calendar
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

    if (event.runOfShowItem) {
      return {
        style: {
          backgroundColor: "#F3E8FF",
          borderColor: "#D8B4FE",
          color: "#7E22CE",
          borderRadius: "6px",
          fontWeight: "600",
          fontSize: "11px",
          padding: "2px 6px",
          borderLeftWidth: "4px",
          borderLeftColor: "#A855F7",
        },
      };
    }

    const isDone = completedTaskIds[event.id];

    if (event.priority === "high") {
      return {
        style: {
          backgroundColor: isDone ? "#F3F4F6" : "#FEF2F2",
          borderColor: isDone ? "#D1D5DB" : "#F87171",
          color: isDone ? "#9CA3AF" : "#B91C1C",
          textDecoration: isDone ? "line-through" : "none",
          borderRadius: "6px",
          fontWeight: "600",
          fontSize: "11px",
          padding: "2px 6px",
          borderLeftWidth: "4px",
          borderLeftColor: isDone ? "#9CA3AF" : "#EF4444",
        },
      };
    }

    if (event.priority === "medium") {
      return {
        style: {
          backgroundColor: isDone ? "#F3F4F6" : "#EFF6FF",
          borderColor: isDone ? "#D1D5DB" : "#93C5FD",
          color: isDone ? "#9CA3AF" : "#1D4ED8",
          textDecoration: isDone ? "line-through" : "none",
          borderRadius: "6px",
          fontWeight: "600",
          fontSize: "11px",
          padding: "2px 6px",
          borderLeftWidth: "4px",
          borderLeftColor: isDone ? "#9CA3AF" : "#3B82F6",
        },
      };
    }

    return {
      style: {
        backgroundColor: isDone ? "#F3F4F6" : "#ECFDF5",
        borderColor: isDone ? "#D1D5DB" : "#A7F3D0",
        color: isDone ? "#9CA3AF" : "#065F46",
        textDecoration: isDone ? "line-through" : "none",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "11px",
        padding: "2px 6px",
        borderLeftWidth: "4px",
        borderLeftColor: isDone ? "#9CA3AF" : "#10B981",
      },
    };
  };

  // Filter tasks for the bottom checklist
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    plannedItems.forEach((p) => set.add(p));
    return Array.from(set);
  }, [tasks, plannedItems]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (departmentFilter !== "all" && task.department?.toLowerCase() !== departmentFilter.toLowerCase()) {
        return false;
      }
      if (priorityFilter !== "all" && task.priority?.toLowerCase() !== priorityFilter.toLowerCase()) {
        return false;
      }
      if (actionFilter !== "all" && task.actionType?.toLowerCase() !== actionFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesBrief = task.actionBrief?.toLowerCase().includes(query);
        const matchesDept = task.department?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesBrief && !matchesDept) return false;
      }
      return true;
    });
  }, [tasks, departmentFilter, priorityFilter, actionFilter, searchQuery]);

  const completedCount = useMemo(() => {
    return tasks.filter((t) => completedTaskIds[t.id]).length;
  }, [tasks, completedTaskIds]);

  const completionPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Jump to specific task on calendar
  const handleJumpToTask = (task: IPrepCalendarTask) => {
    const days = Number(task.daysBeforeEvent) || 0;
    let taskDate: Date;

    // Prefer scheduledDate for precise navigation
    if (task.scheduledDate) {
      const parts = task.scheduledDate.split("-");
      if (parts.length === 3) {
        taskDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        taskDate = new Date(task.scheduledDate);
      }
      if (isNaN(taskDate.getTime())) {
        taskDate = new Date(parsedEventDate);
        taskDate.setDate(taskDate.getDate() - days);
      }
    } else {
      taskDate = new Date(parsedEventDate);
      taskDate.setDate(taskDate.getDate() - days);
    }

    setCurrentDate(taskDate);
    setCurrentView("month");

    // Open detail modal
    const meta = getActionMeta(task.actionType);
    setSelectedEvent({
      id: task.id,
      title: `[${task.department}] ${task.title}`,
      start: taskDate,
      end: taskDate,
      task,
      department: task.department,
      actionType: task.actionType,
      priority: task.priority,
      daysBeforeEvent: days,
      estimatedCost: task.estimatedCost,
      actionBrief: task.actionBrief,
      isMainEvent: false,
    });
  };

  // Convert filtered prep tasks to MagicBento items with interactive card content
  const bentoTaskItems: MagicBentoItem[] = useMemo(() => {
    return filteredTasks.map((task, idx) => {
      const meta = getActionMeta(task.actionType);
      const priority = getPriorityMeta(task.priority);
      const days = Number(task.daysBeforeEvent) || 0;
      let taskDate: Date;
      if (task.scheduledDate) {
        const parts = task.scheduledDate.split("-");
        if (parts.length === 3) {
          taskDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          taskDate = new Date(task.scheduledDate);
        }
        if (isNaN(taskDate.getTime())) {
          taskDate = new Date(parsedEventDate);
          taskDate.setDate(taskDate.getDate() - days);
        }
      } else {
        taskDate = new Date(parsedEventDate);
        taskDate.setDate(taskDate.getDate() - days);
      }

      const isDone = completedTaskIds[task.id || `task-${idx}`];

      return {
        id: task.id || `task-${idx}`,
        title: task.title,
        description: task.actionBrief,
        colSpan: 1,
        rowSpan: 1,
        onClick: () => handleJumpToTask(task),
        content: (
          <div
            className={`flex flex-col justify-between h-full w-full gap-3 ${
              isDone ? "opacity-75" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTaskCompleted(task.id || `task-${idx}`, e);
                  }}
                  className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 z-20 ${
                    isDone
                      ? "bg-[#10B981] border-[#10B981] text-white"
                      : "border-[#CBD5E1] bg-white hover:border-[#10B981]"
                  }`}
                  title={isDone ? "Mark as Incomplete" : "Mark as Completed"}
                >
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${meta.badgeBg}`}
                    >
                      <meta.icon className="w-3 h-3 shrink-0" />
                      <span>{meta.label}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${priority.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                      {priority.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F4F7F5] text-[#2D3748] border border-[#E2ECE5]">
                      {task.department}
                    </span>
                  </div>

                  <h4
                    className={`text-xs font-bold leading-snug transition-colors line-clamp-1 ${
                      isDone ? "line-through text-[#9CA3AF]" : "text-[#2D3748]"
                    }`}
                  >
                    {task.title}
                  </h4>

                  <p className="text-[11px] text-[#718096] line-clamp-2 leading-relaxed">
                    {task.actionBrief}
                  </p>
                </div>
              </div>

              {/* Countdown Badge */}
              <div className="text-right shrink-0">
                <span className="px-2 py-1 rounded-xl bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0] text-[10px] font-extrabold whitespace-nowrap block">
                  T - {days} Days
                </span>
                <span className="text-[10px] text-[#718096] mt-0.5 block font-medium">
                  {format(taskDate, "MMM dd")}
                </span>
              </div>
            </div>

            {/* Card Bottom Meta */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#E2ECE5]/60 text-[11px] mt-auto">
              <div className="flex items-center gap-1 font-bold text-[#059669]">
                <IndianRupee className="w-3 h-3 text-[#10B981]" />
                <span>₹{Number(task.estimatedCost || 0).toLocaleString("en-IN")}</span>
              </div>

              <div className="text-[11px] font-bold text-[#10B981] hover:text-[#059669] flex items-center gap-1 cursor-pointer">
                <span>View on Calendar</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ),
      };
    });
  }, [filteredTasks, completedTaskIds, parsedEventDate]);

  // Custom Event component rendering Lucide icons inside React-Big-Calendar cells
  const CustomCalendarEvent = ({ event }: { event: CalendarEventItem }) => {
    if (event.isMainEvent) {
      return (
        <div className="flex items-center gap-1.5 truncate font-bold text-white">
          <Star className="w-3.5 h-3.5 shrink-0 text-amber-300 fill-amber-300" />
          <span className="truncate">{event.title}</span>
        </div>
      );
    }
    if (event.runOfShowItem) {
      return (
        <div className="flex items-center gap-1.5 truncate text-purple-700">
          <Zap className="w-3 h-3 shrink-0 text-purple-600" />
          <span className="truncate">{event.title}</span>
        </div>
      );
    }
    const meta = getActionMeta(event.actionType);
    const ActionIcon = meta.icon;
    const isDone = completedTaskIds[event.id];
    return (
      <div className={`flex items-center gap-1.5 truncate ${isDone ? "line-through opacity-70" : ""}`}>
        {isDone ? (
          <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />
        ) : (
          <ActionIcon className="w-3 h-3 shrink-0" />
        )}
        <span className="truncate">{event.title}</span>
      </div>
    );
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
              {tasks.length > 0
                ? `${tasks.length} countdown preparation milestones generated across departments.`
                : "Your event blueprint schedule and milestone timeline are ready."}
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
            <span className="font-bold">{tier} Tier</span>
          </div>
        </div>
      </div>

      {/* AI Evaluation Operations Banner (if available) */}
      {evalSummary && (
        <div className="bg-gradient-to-r from-[#F0FDF4] via-[#FFFFFF] to-[#EFF6FF] rounded-3xl p-5 border border-[#A7F3D0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#10B981]/15 text-[#059669]">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#059669]">
                Operations Feasibility & Vibe
              </span>
            </div>
            <p className="text-sm font-bold text-[#2D3748]">
              {evalSummary.eventVibe || "High-Energy Executive Experience"}
            </p>
            <p className="text-xs text-[#718096] max-w-2xl">
              {evalSummary.feasibilityAssessment ||
                "Production timeline and department requirements are aligned with target budget."}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {evalSummary.costPerGuest && (
              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase text-[#718096]">
                  Est. Cost / Guest
                </span>
                <p className="text-base font-extrabold text-[#10B981]">
                  ₹{Number(evalSummary.costPerGuest).toLocaleString("en-IN")}
                </p>
              </div>
            )}
            <div className="text-right pl-4 border-l border-[#E2ECE5]">
              <span className="text-[10px] font-semibold uppercase text-[#718096]">
                Prep Milestones
              </span>
              <p className="text-base font-extrabold text-[#2D3748]">{tasks.length} Tasks</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Calendar & Right-side Budget Breakdown Allocator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Main Calendar Card (8 cols on xl) */}
        <div className="xl:col-span-8 bg-[#FFFFFF] rounded-3xl p-4 sm:p-6 border border-[#E2ECE5] shadow-md space-y-4">
          {/* Calendar Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2ECE5] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center font-bold">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#2D3748]">Event Master Production Calendar</h2>
                <p className="text-xs text-[#718096]">
                  Interactive schedule mapping your target event and countdown milestones.
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E6F7F0] text-[#059669] font-medium border border-[#A7F3D0]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Target Event
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEF2F2] text-[#B91C1C] font-medium border border-[#FCA5A5]">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> High Priority
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] font-medium border border-[#93C5FD]">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Medium Priority
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0FDF4] text-[#15803D] font-medium border border-[#86EFAC]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Low Priority
              </span>
              {runOfShow.length > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3E8FF] text-[#7E22CE] font-medium border border-[#D8B4FE]">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7]" /> Run of Show
                </span>
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
              components={{
                event: CustomCalendarEvent as any,
              }}
            />
          </div>
        </div>

        {/* Right: Budget Breakdown Allocator Panel (4 cols on xl) */}
        <div className="xl:col-span-4 bg-[#FFFFFF] rounded-3xl p-5 sm:p-6 border border-[#E2ECE5] shadow-md space-y-5 xl:sticky xl:top-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE5] gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#2D3748]">Budget Allocator</h2>
                <p className="text-[11px] text-[#718096]">
                  Fine-tune allocations with Elastic Slider
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetBudget}
              className="p-1.5 rounded-xl text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5] border border-transparent hover:border-[#E2ECE5] transition-all cursor-pointer flex items-center gap-1 text-xs"
              title="Reset to Original Values"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-semibold">Reset</span>
            </button>
          </div>

          {/* Current Event / Selected Milestone Context */}
          <div className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#718096]">
                Target Event Blueprint
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669]">
                <IndianRupee className="w-3 h-3 text-[#10B981]" />
                ₹{targetBudget.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-xs font-extrabold text-[#2D3748] truncate">
              {eventName || "Current Event"}
            </p>
            {selectedEvent ? (
              <div className="pt-2 mt-1.5 border-t border-[#E2ECE5] flex items-center justify-between text-[11px]">
                <span className="text-[#059669] font-medium truncate flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shrink-0" />
                  <span className="truncate">Selected: <strong>{selectedEvent.title}</strong></span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="text-[10px] text-[#718096] hover:text-[#2D3748] underline ml-2 shrink-0 cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-[#718096]">
                Click any calendar task to highlight its department allocation.
              </p>
            )}
          </div>

          {/* Budget Health & Allocation Progress */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-[#FFFFFF] border border-[#A7F3D0]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#2D3748]">Total Allocated:</span>
              <span className="font-extrabold text-sm text-[#2D3748]">
                ₹{totalAllocated.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[#E2ECE5] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  budgetDelta < 0 ? "bg-rose-500" : "bg-[#10B981]"
                }`}
                style={{
                  width: `${Math.min(100, (totalAllocated / Math.max(1, targetBudget)) * 100)}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#718096]">
                {((totalAllocated / Math.max(1, targetBudget)) * 100).toFixed(0)}% of target budget
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${
                  budgetDelta > 0
                    ? "bg-[#E6F7F0] text-[#059669] border-[#A7F3D0]"
                    : budgetDelta === 0
                    ? "bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD]"
                    : "bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]"
                }`}
              >
                {budgetDelta > 0
                  ? `₹${budgetDelta.toLocaleString("en-IN")} Buffer Left`
                  : budgetDelta === 0
                  ? "Perfect Balance"
                  : `+₹${Math.abs(budgetDelta).toLocaleString("en-IN")} Over Budget`}
              </span>
            </div>
          </div>

          {/* Categories List with ElasticSlider */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {editableBudget.map((item, index) => {
              const meta = getCategoryMeta(item.category);
              const CategoryIcon = meta.icon;
              const isDepartmentMatch =
                selectedEvent?.department &&
                item.category.toLowerCase().includes(selectedEvent.department.toLowerCase());

              const minBound = Math.max(0, item.sliderMin ?? 0);
              const maxBound = Math.max(minBound + 5000, item.sliderMax ?? Math.round(targetBudget * 0.6));

              return (
                <div
                  key={`${item.category}-${index}`}
                  className={`p-3 rounded-2xl border transition-all ${
                    isDepartmentMatch
                      ? "bg-[#F0FDF4] border-[#10B981] shadow-xs ring-1 ring-[#10B981]/30"
                      : "bg-[#FFFFFF] hover:bg-[#F9FBFA] border-[#E2ECE5]"
                  }`}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`p-1.5 rounded-xl border shrink-0 ${meta.color}`}>
                        <CategoryIcon className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-[#2D3748] truncate">
                            {item.category}
                          </h4>
                          {isDepartmentMatch && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-[#10B981] text-white">
                              Active Task
                            </span>
                          )}
                        </div>
                        {item.spendStrategy && (
                          <p className="text-[10px] text-[#718096] line-clamp-1">
                            {item.spendStrategy}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-[#10B981] block">
                        ₹{Number(item.allocatedAmount).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-[#718096] font-semibold">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Elastic Slider from React Bits */}
                  <div className="py-1">
                    <ElasticSlider
                      value={item.allocatedAmount}
                      startingValue={minBound}
                      maxValue={maxBound}
                      stepSize={500}
                      isStepped={true}
                      thickness={8}
                      activeThickness={14}
                      thumb={true}
                      thumbColor="#10B981"
                      valuePosition="bubble"
                      rangeColor="#10B981"
                      trackColor="#E2ECE5"
                      leftIcon={<IndianRupee className="w-3.5 h-3.5 text-[#10B981]" />}
                      rightIcon={<TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />}
                      formatValue={(val) => `₹${Math.round(val).toLocaleString("en-IN")}`}
                      onChange={(newVal) => handleCategoryBudgetChange(index, newVal)}
                      className="w-full"
                    />
                  </div>

                  {/* Min / Max bounds guide */}
                  <div className="flex items-center justify-between text-[10px] text-[#718096] mt-1 pt-1 border-t border-[#E2ECE5]/50">
                    <span>Min: ₹{minBound.toLocaleString("en-IN")}</span>
                    <span>Max: ₹{maxBound.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Action & Feedback */}
          <div className="pt-2 border-t border-[#E2ECE5] space-y-2">
            <button
              type="button"
              disabled={isSavingBudget}
              onClick={handleSaveBudget}
              className={`w-full py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                saveSuccess
                  ? "bg-[#059669] text-white"
                  : "bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSavingBudget ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Allocations...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Allocations Saved to Blueprint</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Sync Budget Allocations</span>
                </>
              )}
            </button>

            {saveError && (
              <p className="text-[11px] text-rose-600 font-medium text-center">
                {saveError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Countdown Prep Tasks Checklist Section (Directly from UserStatus.prepCalendarTasks) */}
      <div className="bg-[#FFFFFF] rounded-3xl p-5 sm:p-6 border border-[#E2ECE5] shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E2ECE5] gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center">
                <ListChecks className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#2D3748]">
                Countdown Prep Tasks Checklist (prepCalendarTasks)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#F4F7F5] text-[#718096] border border-[#E2ECE5]">
                {tasks.length} Total
              </span>
            </div>
            <p className="text-xs text-[#718096]">
              Action-oriented tasks organized by countdown days before event execution date.
            </p>
          </div>

          {/* Progress Pill */}
          <div className="flex items-center gap-3 bg-[#F4F7F5] p-2.5 px-4 rounded-2xl border border-[#E2ECE5]">
            <div className="text-xs font-semibold text-[#2D3748]">
              <span className="font-extrabold text-[#10B981]">{completedCount}</span> /{" "}
              {tasks.length} Completed
            </div>
            <div className="w-24 bg-[#E2ECE5] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#10B981] h-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#10B981]">{completionPercent}%</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#718096]" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs font-semibold text-[#2D3748] focus:outline-hidden focus:ring-1 focus:ring-[#10B981]"
              >
                <option value="all">All Departments ({tasks.length})</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs font-semibold text-[#2D3748] focus:outline-hidden focus:ring-1 focus:ring-[#10B981]"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            {/* Action Type Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs font-semibold text-[#2D3748] focus:outline-hidden focus:ring-1 focus:ring-[#10B981]"
              >
                <option value="all">All Action Types</option>
                <option value="call">Call</option>
                <option value="procure">Procure</option>
                <option value="design">Design</option>
                <option value="arrange">Arrange</option>
                <option value="setup">Setup</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search prep tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs font-medium text-[#2D3748] placeholder-[#718096] w-full sm:w-56 focus:outline-hidden focus:ring-1 focus:ring-[#10B981]"
            />
          </div>
        </div>

        {/* Tasks List Table / Cards */}
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-[#F4F7F5] rounded-2xl border border-dashed border-[#E2ECE5]">
            <p className="text-xs text-[#718096] font-medium">
              No prep tasks match the selected filters.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <MagicBento
              items={bentoTaskItems}
              columns={2}
              rowHeight={170}
              gap={14}
              radius={20}
              theme="light"
              glowColor="#10B981"
              enableBorderGlow={true}
              enableSpotlight={true}
              spotlightRadius={280}
              enableStars={false}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect={true}
              textAutoHide={false}
            />
          </div>
        )}
      </div>

      {/* Selected Event Details Modal / Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-[#2D3748]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-3xl max-w-lg w-full border border-[#E2ECE5] shadow-2xl p-6 animate-in fade-in zoom-in duration-150 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE5]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    selectedEvent.isMainEvent
                      ? "bg-[#10B981]"
                      : selectedEvent.priority === "high"
                      ? "bg-[#EF4444]"
                      : selectedEvent.priority === "medium"
                      ? "bg-[#3B82F6]"
                      : "bg-[#10B981]"
                  }`}
                />
                <h3 className="text-base font-bold text-[#2D3748]">
                  {selectedEvent.isMainEvent
                    ? "Target Event Details"
                    : selectedEvent.runOfShowItem
                    ? "Day-of Run of Show Item"
                    : "Countdown Prep Task Details"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#718096] hover:text-[#2D3748] cursor-pointer p-1 rounded-lg hover:bg-[#F4F7F5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-[#718096] font-semibold uppercase text-[10px] tracking-wider">
                  Title
                </p>
                <p className="text-sm font-bold text-[#2D3748] mt-0.5">{selectedEvent.title}</p>
              </div>

              {/* Countdown or Execution Timing */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F4F7F5] p-2.5 rounded-xl border border-[#E2ECE5]">
                  <span className="text-[10px] uppercase font-bold text-[#718096]">Timeline</span>
                  <p className="font-extrabold text-xs text-[#2D3748] mt-0.5">
                    {selectedEvent.daysBeforeEvent !== undefined
                      ? `T - ${selectedEvent.daysBeforeEvent} Days Before Event`
                      : "Main Event Execution Day"}
                  </p>
                </div>
                <div className="bg-[#F4F7F5] p-2.5 rounded-xl border border-[#E2ECE5]">
                  <span className="text-[10px] uppercase font-bold text-[#718096]">Date</span>
                  <p className="font-extrabold text-xs text-[#2D3748] mt-0.5">
                    {format(selectedEvent.start, "EEE, MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              {/* Badges for Department, Priority & Action Type */}
              {(selectedEvent.department || selectedEvent.actionType || selectedEvent.priority) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedEvent.department && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#F4F7F5] border border-[#E2ECE5] text-xs font-semibold text-[#2D3748]">
                      Dept: <strong>{selectedEvent.department}</strong>
                    </span>
                  )}
                  {selectedEvent.actionType && (() => {
                    const actionMeta = getActionMeta(selectedEvent.actionType);
                    const ActionIcon = actionMeta.icon;
                    return (
                      <span
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${actionMeta.badgeBg}`}
                      >
                        <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{actionMeta.label}</span>
                      </span>
                    );
                  })()}
                  {selectedEvent.priority && (
                    <span
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                        getPriorityMeta(selectedEvent.priority).badge
                      }`}
                    >
                      {getPriorityMeta(selectedEvent.priority).label}
                    </span>
                  )}
                </div>
              )}

              {/* Action Brief or Description */}
              <div>
                <p className="text-[#718096] font-semibold uppercase text-[10px] tracking-wider">
                  Operational Guidance / Brief
                </p>
                <div className="text-[#2D3748] bg-[#F4F7F5] p-3 rounded-xl border border-[#E2ECE5] mt-1 text-xs leading-relaxed">
                  {selectedEvent.actionBrief || selectedEvent.description || "No notes available."}
                </div>
              </div>

              {/* Estimated Cost & Budget */}
              {(selectedEvent.estimatedCost !== undefined || selectedEvent.budget) && (
                <div className="bg-[#E6F7F0] p-3 rounded-xl border border-[#A7F3D0] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#059669]">
                    {selectedEvent.isMainEvent ? "Total Event Budget" : "Milestone Budget Allocation"}
                  </span>
                  <p className="font-extrabold text-base text-[#059669]">
                    ₹
                    {Number(
                      selectedEvent.estimatedCost ?? selectedEvent.budget ?? 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              {/* Toggle Completion button for Prep Tasks */}
              {selectedEvent.task && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleTaskCompleted(selectedEvent.id)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                      completedTaskIds[selectedEvent.id]
                        ? "bg-[#F3F4F6] text-[#718096] border-[#D1D5DB]"
                        : "bg-[#10B981] hover:bg-[#059669] text-white border-[#10B981] shadow-xs"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {completedTaskIds[selectedEvent.id]
                        ? "Marked as Completed (Click to Reopen)"
                        : "Mark Task as Completed"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full py-2.5 rounded-xl bg-[#F4F7F5] text-[#2D3748] font-bold text-xs hover:bg-[#E2ECE5] transition-all cursor-pointer border border-[#E2ECE5]"
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
