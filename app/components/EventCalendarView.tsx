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
  ChevronLeft,
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
  CheckCheck,
  Copy,
  FileText,
  CalendarDays,
  ShieldCheck,
  UtensilsCrossed,
  Building2,
  Camera,
  Layers,
  Columns,
  Maximize2,
  Minimize2,
  CalendarRange,
  Flame,
  LayoutGrid,
} from "lucide-react";
import {
  IPrepCalendarTask,
  IDayOfRunOfShowItem,
  IBudgetBreakdownItem,
  IEvaluationSummary,
} from "@/models/UserStatus.model";
import MagicBento, { MagicBentoItem } from "./MagicBento";
import ElasticSlider from "./ElasticSlider";
import { CalendarAiChatbot } from "./CalendarAiChatbot";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerEvent, setActiveDrawerEvent] = useState<CalendarEventItem | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"calendar" | "tasks" | "runofshow" | "budget">("calendar");
  const [isCalendarSplitView, setIsCalendarSplitView] = useState<boolean>(true);

  // Smooth left pop-up drawer animation lifecycle
  useEffect(() => {
    if (selectedEvent) {
      setActiveDrawerEvent(selectedEvent);
      const timer = setTimeout(() => {
        setIsDrawerOpen(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsDrawerOpen(false);
      const timer = setTimeout(() => {
        setActiveDrawerEvent(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedEvent]);

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

  // Days until target event countdown
  const daysUntilEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(parsedEventDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [parsedEventDate]);

  // Calendar Header Navigation Handlers
  const handleCalendarToday = () => {
    setCurrentDate(new Date(parsedEventDate));
  };

  const handleCalendarPrev = () => {
    const newDate = new Date(currentDate);
    if (currentView === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (currentView === "day") {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleCalendarNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (currentView === "day") {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

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

  // Pop-up bar UI/UX helper states and actions
  const [copiedTask, setCopiedTask] = useState(false);

  const currentEventIdx = useMemo(() => {
    if (!activeDrawerEvent) return -1;
    return eventsList.findIndex((e) => e.id === activeDrawerEvent.id);
  }, [eventsList, activeDrawerEvent]);

  const handleNavigateEvent = (direction: "prev" | "next") => {
    if (currentEventIdx === -1) return;
    const nextIdx = direction === "prev" ? currentEventIdx - 1 : currentEventIdx + 1;
    if (nextIdx >= 0 && nextIdx < eventsList.length) {
      const nextEvent = eventsList[nextIdx];
      setSelectedEvent(nextEvent);
      setCurrentDate(nextEvent.start);
    }
  };

  const handleCopyTask = (event: CalendarEventItem) => {
    const textToCopy = `Event Task: ${event.title}\nDate: ${format(event.start, "EEE, MMM dd, yyyy")}\nTimeline: ${
      event.daysBeforeEvent !== undefined ? `T - ${event.daysBeforeEvent} Days Before Event` : "Main Event Day"
    }\nDepartment: ${event.department || "General"}\nGuidance: ${event.actionBrief || event.description || "N/A"}\nBudget: ₹${Number(event.estimatedCost ?? event.budget ?? 0).toLocaleString("en-IN")}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedTask(true);
    setTimeout(() => setCopiedTask(false), 2000);
  };

  const handleFocusCalendar = (date: Date) => {
    setCurrentDate(date);
    const calendarEl = document.querySelector(".calendar-container");
    if (calendarEl) {
      calendarEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Keyboard navigation: ESC to close, Arrow keys to cycle tasks while open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedEvent) return;
      if (e.key === "Escape") {
        setSelectedEvent(null);
      } else if (e.key === "ArrowLeft" && currentEventIdx > 0) {
        handleNavigateEvent("prev");
      } else if (e.key === "ArrowRight" && currentEventIdx >= 0 && currentEventIdx < eventsList.length - 1) {
        handleNavigateEvent("next");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent, currentEventIdx, eventsList]);

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
      {/* Executive Command Header Bar */}
      <div className="bg-[#FFFFFF] rounded-3xl p-5 sm:p-6 border border-[#E2ECE5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={onBackToStepper}
            className="p-2.5 rounded-2xl bg-[#F4F7F5] hover:bg-[#E2ECE5] text-[#2D3748] border border-[#E2ECE5] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs group"
            title="Back to Stepper Setup"
          >
            <ArrowLeft className="w-4 h-4 text-[#718096] group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-semibold hidden sm:inline">Back</span>
          </button>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D3748] tracking-tight">
                {eventName || "Annual Global Tech Summit 2026"}
              </h1>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#E6F7F0] text-[#059669] border border-[#A7F3D0]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Production Blueprint Active
              </span>

              {daysUntilEvent !== undefined && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]">
                  <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                  {daysUntilEvent > 0
                    ? `T - ${daysUntilEvent} Days To Go`
                    : daysUntilEvent === 0
                    ? "Target Event Day"
                    : "Event Concluded"}
                </span>
              )}
            </div>
            <p className="text-xs text-[#718096]">
              Master schedule synchronized across {tasks.length} countdown milestones & {runOfShow.length} day-of execution items.
            </p>
          </div>
        </div>

        {/* Action Button Cluster */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onNewEvent && (
            <button
              onClick={onNewEvent}
              className="p-2.5 px-3.5 rounded-2xl bg-white hover:bg-[#F4F7F5] text-[#2D3748] border border-[#E2ECE5] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs font-bold text-xs"
              title="Create New Event Blueprint"
            >
              <Plus className="w-4 h-4 text-[#10B981] stroke-[2.5]" />
              <span>New Blueprint</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAiChatOpen(true)}
            className="p-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm shadow-[#10B981]/25 font-extrabold text-xs group"
            title="Open AI Calendar Copilot (Ctrl+J)"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span>Ask AI Copilot</span>
            <span className="hidden sm:inline-block text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded-md border border-white/20">
              Ctrl+J
            </span>
          </button>
        </div>
      </div>

      {/* Executive 4-Card KPI Telemetry Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Target Date */}
        <div className="bg-[#FFFFFF] p-4 rounded-3xl border border-[#E2ECE5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#718096]">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[#10B981]" /> Target Date
            </span>
            <span className="text-[10px] font-semibold bg-[#F4F7F5] px-2 py-0.5 rounded-full border border-[#E2ECE5]">
              {eventType}
            </span>
          </div>
          <p className="text-sm font-extrabold text-[#2D3748] truncate">
            {format(parsedEventDate, "EEE, MMM dd, yyyy")}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#059669] font-semibold">
            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
            <span>Master Schedule Locked</span>
          </div>
        </div>

        {/* Card 2: Blueprint Profile & Vibe */}
        <div className="bg-[#FFFFFF] p-4 rounded-3xl border border-[#E2ECE5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#718096]">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" /> Experience Tier
            </span>
            <span className="text-[10px] font-extrabold text-[#059669] bg-[#E6F7F0] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
              {tier} Tier
            </span>
          </div>
          <p className="text-sm font-extrabold text-[#2D3748] truncate">
            {evalSummary?.eventVibe || "High-Energy Executive Experience"}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#718096]">
            <TrendingUp className="w-3 h-3 text-[#3B82F6]" />
            <span>Feasibility: {evalSummary?.feasibilityAssessment ? "Verified" : "Aligned"}</span>
          </div>
        </div>

        {/* Card 3: Total Budget Health */}
        <div className="bg-[#FFFFFF] p-4 rounded-3xl border border-[#E2ECE5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#718096]">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-[#10B981]" /> Budget Health
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                budgetDelta > 0
                  ? "bg-[#E6F7F0] text-[#059669] border-[#A7F3D0]"
                  : budgetDelta === 0
                  ? "bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD]"
                  : "bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]"
              }`}
            >
              {budgetDelta > 0
                ? `+₹${budgetDelta.toLocaleString("en-IN")} Buffer`
                : budgetDelta === 0
                ? "Balanced"
                : "Over Budget"}
            </span>
          </div>
          <p className="text-sm font-extrabold text-[#2D3748]">
            ₹{targetBudget.toLocaleString("en-IN")}
          </p>
          <div className="w-full bg-[#E2ECE5] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetDelta < 0 ? "bg-rose-500" : "bg-[#10B981]"
              }`}
              style={{
                width: `${Math.min(100, (totalAllocated / Math.max(1, targetBudget)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Card 4: Preparation Progress Velocity */}
        <div className="bg-[#FFFFFF] p-4 rounded-3xl border border-[#E2ECE5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#718096]">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Task Velocity
            </span>
            <span className="text-[10px] font-bold text-[#10B981] bg-[#E6F7F0] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
              {completionPercent}% Done
            </span>
          </div>
          <p className="text-sm font-extrabold text-[#2D3748]">
            {completedCount} of {tasks.length} Tasks Finished
          </p>
          <div className="w-full bg-[#E2ECE5] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#10B981] h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Primary Workspace Segmented Tabs */}
      <div className="bg-[#FFFFFF] p-2 rounded-2xl border border-[#E2ECE5] shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("calendar")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeWorkspaceTab === "calendar"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Master Schedule & Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("tasks")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeWorkspaceTab === "tasks"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Countdown Prep Tasks</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeWorkspaceTab === "tasks"
                  ? "bg-white/25 text-white"
                  : "bg-[#F4F7F5] text-[#718096] border border-[#E2ECE5]"
              }`}
            >
              {tasks.length}
            </span>
          </button>

          {runOfShow.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab("runofshow")}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeWorkspaceTab === "runofshow"
                  ? "bg-[#10B981] text-white shadow-xs"
                  : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Day-of Run of Show</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeWorkspaceTab === "runofshow"
                    ? "bg-white/25 text-white"
                    : "bg-[#F4F7F5] text-[#718096] border border-[#E2ECE5]"
                }`}
              >
                {runOfShow.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("budget")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeWorkspaceTab === "budget"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Budget Allocator</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeWorkspaceTab === "budget"
                  ? "bg-white/25 text-white"
                  : "bg-[#F4F7F5] text-[#718096] border border-[#E2ECE5]"
              }`}
            >
              {editableBudget.length}
            </span>
          </button>
        </div>

        {/* If in Calendar tab, provide Layout Mode Switcher */}
        {activeWorkspaceTab === "calendar" && (
          <div className="hidden lg:flex items-center gap-1.5 bg-[#F4F7F5] p-1 rounded-xl border border-[#E2ECE5]">
            <button
              type="button"
              onClick={() => setIsCalendarSplitView(true)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isCalendarSplitView
                  ? "bg-white text-[#2D3748] shadow-2xs border border-[#E2ECE5]"
                  : "text-[#718096] hover:text-[#2D3748]"
              }`}
              title="Split View (Calendar + Budget Panel)"
            >
              <Columns className="w-3 h-3 text-[#10B981]" />
              <span>Split Companion</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCalendarSplitView(false)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                !isCalendarSplitView
                  ? "bg-white text-[#2D3748] shadow-2xs border border-[#E2ECE5]"
                  : "text-[#718096] hover:text-[#2D3748]"
              }`}
              title="Full Calendar Stage (Expanded)"
            >
              <Maximize2 className="w-3 h-3 text-[#10B981]" />
              <span>Full Stage</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace Stage */}
      {activeWorkspaceTab === "calendar" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Calendar Card */}
          <div
            className={`${
              isCalendarSplitView ? "xl:col-span-8" : "xl:col-span-12"
            } bg-[#FFFFFF] rounded-3xl p-4 sm:p-6 border border-[#E2ECE5] shadow-md space-y-4`}
          >
            {/* Calendar Custom Command Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#E2ECE5] gap-3">
              {/* Date Navigation Cluster */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCalendarToday}
                  className="px-3 py-1.5 rounded-xl bg-[#F4F7F5] hover:bg-[#E2ECE5] border border-[#E2ECE5] text-xs font-extrabold text-[#2D3748] transition-all cursor-pointer shadow-2xs"
                >
                  Today
                </button>

                <div className="flex items-center gap-0.5 bg-[#F4F7F5] p-0.5 rounded-xl border border-[#E2ECE5]">
                  <button
                    type="button"
                    onClick={handleCalendarPrev}
                    className="p-1.5 rounded-lg text-[#718096] hover:text-[#2D3748] hover:bg-white transition-all cursor-pointer"
                    title="Previous Month/Week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCalendarNext}
                    className="p-1.5 rounded-lg text-[#718096] hover:text-[#2D3748] hover:bg-white transition-all cursor-pointer"
                    title="Next Month/Week"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-base sm:text-lg font-extrabold text-[#1A202C] ml-1 tracking-tight">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
              </div>

              {/* Status Legend Pills */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#E6F7F0] text-[#059669] font-medium border border-[#A7F3D0]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Target Event
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#FEF2F2] text-[#B91C1C] font-medium border border-[#FCA5A5]">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> High
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] font-medium border border-[#93C5FD]">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Medium
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#F0FDF4] text-[#15803D] font-medium border border-[#86EFAC]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Low
                </span>
                {runOfShow.length > 0 && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#F3E8FF] text-[#7E22CE] font-medium border border-[#D8B4FE]">
                    <span className="w-2 h-2 rounded-full bg-[#A855F7]" /> Run of Show
                  </span>
                )}
              </div>

              {/* Calendar Views Switcher */}
              <div className="flex items-center gap-1 bg-[#F4F7F5] p-1 rounded-xl border border-[#E2ECE5] text-xs">
                {(["month", "week", "day", "agenda"] as View[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCurrentView(v)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                      currentView === v
                        ? "bg-[#10B981] text-white shadow-2xs"
                        : "text-[#718096] hover:text-[#2D3748]"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Calendar Canvas */}
            <div className="h-[640px] w-full calendar-container">
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

          {/* Right Companion: Budget Breakdown Allocator Panel (when in split mode) */}
          {isCalendarSplitView && (
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
                    Target Blueprint
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

              {/* Budget Health Progress */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-[#FFFFFF] border border-[#A7F3D0]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#2D3748]">Total Allocated:</span>
                  <span className="font-extrabold text-sm text-[#2D3748]">
                    ₹{totalAllocated.toLocaleString("en-IN")}
                  </span>
                </div>

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
                      ? `₹${budgetDelta.toLocaleString("en-IN")} Buffer`
                      : budgetDelta === 0
                      ? "Balanced"
                      : `+₹${Math.abs(budgetDelta).toLocaleString("en-IN")} Over`}
                  </span>
                </div>
              </div>

              {/* Categories with ElasticSlider */}
              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
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
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`p-1.5 rounded-xl border shrink-0 ${meta.color}`}>
                            <CategoryIcon className="w-3.5 h-3.5" />
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#2D3748] truncate">
                              {item.category}
                            </h4>
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
                    </div>
                  );
                })}
              </div>

              {/* Save Budget Action */}
              <div className="pt-2 border-t border-[#E2ECE5]">
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
                      <span>Allocations Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Sync Allocations</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Countdown Prep Tasks Section */}
      {activeWorkspaceTab === "tasks" && (
        <div className="bg-[#FFFFFF] rounded-3xl p-5 sm:p-6 border border-[#E2ECE5] shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E2ECE5] gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center">
                  <ListChecks className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#2D3748]">
                  Countdown Prep Tasks Checklist
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#F4F7F5] text-[#718096] border border-[#E2ECE5]">
                  {tasks.length} Total
                </span>
              </div>
              <p className="text-xs text-[#718096]">
                Operational milestones mapped by countdown days prior to event day.
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

          {/* Bento Cards */}
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
      )}

      {/* Day-of Run of Show Stage */}
      {activeWorkspaceTab === "runofshow" && (
        <div className="bg-[#FFFFFF] rounded-3xl p-5 sm:p-6 border border-[#E2ECE5] shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2ECE5] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#A855F7] flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D3748]">
                  Day-of Execution Run of Show Timeline
                </h3>
                <p className="text-xs text-[#718096]">
                  Synchronized hourly execution schedule for main event day ({format(parsedEventDate, "MMMM dd, yyyy")}).
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE]">
              {runOfShow.length} Operational Sequence Items
            </span>
          </div>

          {runOfShow.length === 0 ? (
            <div className="p-8 text-center bg-[#F4F7F5] rounded-2xl border border-dashed border-[#E2ECE5]">
              <p className="text-xs text-[#718096] font-medium">
                No run of show timeline items specified for this event.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {runOfShow.map((ros, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const rosEvent: CalendarEventItem = {
                      id: `ros-${idx}`,
                      title: `[${ros.departmentInCharge}] ${ros.activity}`,
                      start: new Date(parsedEventDate),
                      end: new Date(parsedEventDate),
                      allDay: false,
                      type: "Day-of Run of Show",
                      description: `${ros.operationalNotes} (Dependency: ${ros.dependency})`,
                      runOfShowItem: ros,
                      department: ros.departmentInCharge,
                    };
                    setSelectedEvent(rosEvent);
                  }}
                  className="p-4 rounded-2xl bg-[#FAFCFB] hover:bg-[#F0FDF4] border border-[#E2ECE5] hover:border-[#A7F3D0] transition-all cursor-pointer shadow-2xs space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-[#7E22CE] bg-[#F3E8FF] px-2.5 py-1 rounded-lg border border-[#D8B4FE]">
                      {ros.timeSlot || "TBD"}
                    </span>
                    <span className="text-[11px] font-bold text-[#2D3748] px-2 py-0.5 rounded-lg bg-[#F4F7F5] border border-[#E2ECE5]">
                      {ros.departmentInCharge}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-[#1A202C] group-hover:text-[#059669] transition-colors">
                    {ros.activity}
                  </h4>

                  <p className="text-xs text-[#718096] leading-relaxed">
                    {ros.operationalNotes}
                  </p>

                  {ros.dependency && (
                    <div className="pt-2 border-t border-[#E2ECE5] flex items-center justify-between text-[11px] text-[#718096]">
                      <span>Dependency: <strong>{ros.dependency}</strong></span>
                      <span className="text-[#10B981] font-semibold group-hover:translate-x-0.5 transition-transform">
                        Details →
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dedicated Budget Allocator Stage (when in budget tab) */}
      {activeWorkspaceTab === "budget" && (
        <div className="bg-[#FFFFFF] rounded-3xl p-5 sm:p-6 border border-[#E2ECE5] shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2ECE5] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D3748]">
                  Financial Allocation Dashboard & Elastic Slider
                </h3>
                <p className="text-xs text-[#718096]">
                  Fine-tune departmental budget allocations and simulate contingency reserves.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetBudget}
              className="p-2 px-3 rounded-xl text-[#718096] hover:text-[#2D3748] bg-[#F4F7F5] hover:bg-[#E2ECE5] border border-[#E2ECE5] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Values</span>
            </button>
          </div>

          {/* Full Width Grid for Budget Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editableBudget.map((item, index) => {
              const meta = getCategoryMeta(item.category);
              const CategoryIcon = meta.icon;
              const minBound = Math.max(0, item.sliderMin ?? 0);
              const maxBound = Math.max(minBound + 5000, item.sliderMax ?? Math.round(targetBudget * 0.6));

              return (
                <div
                  key={`${item.category}-${index}`}
                  className="p-4 rounded-2xl bg-[#FAFCFB] border border-[#E2ECE5] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-xl border shrink-0 ${meta.color}`}>
                        <CategoryIcon className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-[#2D3748]">{item.category}</h4>
                        <span className="text-[10px] text-[#718096]">{item.spendStrategy}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#10B981] block">
                        ₹{Number(item.allocatedAmount).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-[#718096] font-semibold">{item.percentage}%</span>
                    </div>
                  </div>

                  <div className="py-2">
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
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={isSavingBudget}
              onClick={handleSaveBudget}
              className="py-3 px-6 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition-all cursor-pointer shadow-xs shadow-[#10B981]/25 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync All Allocations</span>
            </button>
          </div>
        </div>
      )}

      {/* Selected Event Details Left-Side Pop-Up Bar / Drawer */}
      {activeDrawerEvent && (() => {
        const cleanTitle = activeDrawerEvent.title.replace(/^\[.*?\]\s*/, "");
        const extractedDept =
          activeDrawerEvent.department ||
          (activeDrawerEvent.title.match(/^\[(.*?)\]/)?.[1] ?? "");
        const isDone = Boolean(completedTaskIds[activeDrawerEvent.id]);
        const eventCostNum = Number(
          activeDrawerEvent.estimatedCost ?? activeDrawerEvent.budget ?? 0
        );
        const targetBudgetNum = Number(eventBudget) || 100000;
        const percentOfBudget =
          targetBudgetNum > 0
            ? Math.min(100, Math.round((eventCostNum / targetBudgetNum) * 100))
            : 0;
        const hasPrev = currentEventIdx > 0;
        const hasNext =
          currentEventIdx >= 0 && currentEventIdx < eventsList.length - 1;

        return (
          <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
            {/* Backdrop with smooth fade */}
            <div
              onClick={() => setSelectedEvent(null)}
              className={`fixed inset-0 bg-[#1A202C]/25 backdrop-blur-[3px] transition-opacity duration-300 ease-out pointer-events-auto ${
                isDrawerOpen ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            />

            {/* Left Side Pop-Up Bar Card with Smooth Slide Animation */}
            <div
              className={`fixed top-0 bottom-0 left-0 sm:top-3 sm:bottom-3 sm:left-3 md:top-4 md:bottom-4 md:left-4 z-50 w-full sm:w-[490px] md:w-[510px] max-w-[calc(100vw-1rem)] p-2 sm:p-0 flex flex-col pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isDrawerOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-full opacity-0"
              }`}
            >
              <div className="bg-[#FFFFFF] rounded-3xl border border-[#E2ECE5] shadow-[0_25px_70px_-12px_rgba(20,40,30,0.18),0_0_0_1px_rgba(226,236,229,0.8)] flex flex-col h-full max-h-full overflow-hidden pointer-events-auto relative">
                {/* Top Accent Gradient Line */}
                <div
                  className={`h-1.5 w-full shrink-0 ${
                    activeDrawerEvent.isMainEvent
                      ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"
                      : activeDrawerEvent.priority === "high"
                      ? "bg-gradient-to-r from-red-500 via-rose-500 to-amber-500"
                      : activeDrawerEvent.priority === "medium"
                      ? "bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-500"
                      : activeDrawerEvent.runOfShowItem
                      ? "bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-500"
                      : "bg-gradient-to-r from-emerald-500 to-teal-400"
                  }`}
                />

                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#E2ECE5] bg-white shrink-0">
                  <div className="flex items-center gap-2.5">
                    {/* Pulsing Status Dot */}
                    <span className="relative flex h-2.5 w-2.5">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          activeDrawerEvent.isMainEvent
                            ? "bg-emerald-400"
                            : activeDrawerEvent.priority === "high"
                            ? "bg-red-400"
                            : activeDrawerEvent.priority === "medium"
                            ? "bg-blue-400"
                            : "bg-emerald-400"
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          activeDrawerEvent.isMainEvent
                            ? "bg-emerald-500"
                            : activeDrawerEvent.priority === "high"
                            ? "bg-red-500"
                            : activeDrawerEvent.priority === "medium"
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                      />
                    </span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#2D3748] tracking-tight">
                      {activeDrawerEvent.isMainEvent
                        ? "Target Event Details"
                        : activeDrawerEvent.runOfShowItem
                        ? "Day-of Run of Show Item"
                        : "Countdown Prep Task Details"}
                    </h3>
                    {currentEventIdx >= 0 && (
                      <span className="text-[10px] font-bold text-[#718096] bg-[#F4F7F5] px-2 py-0.5 rounded-full border border-[#E2ECE5]">
                        {currentEventIdx + 1} of {eventsList.length}
                      </span>
                    )}
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Previous Task */}
                    <button
                      type="button"
                      onClick={() => handleNavigateEvent("prev")}
                      disabled={!hasPrev}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        hasPrev
                          ? "text-[#4A5568] hover:text-[#2D3748] hover:bg-[#F4F7F5] border-[#E2ECE5]"
                          : "text-[#CBD5E1] border-transparent cursor-not-allowed"
                      }`}
                      title="Previous Milestone (← Arrow Key)"
                      aria-label="Previous Milestone"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Next Task */}
                    <button
                      type="button"
                      onClick={() => handleNavigateEvent("next")}
                      disabled={!hasNext}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        hasNext
                          ? "text-[#4A5568] hover:text-[#2D3748] hover:bg-[#F4F7F5] border-[#E2ECE5]"
                          : "text-[#CBD5E1] border-transparent cursor-not-allowed"
                      }`}
                      title="Next Milestone (→ Arrow Key)"
                      aria-label="Next Milestone"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy Summary */}
                    <button
                      type="button"
                      onClick={() => handleCopyTask(activeDrawerEvent)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                        copiedTask
                          ? "bg-[#E6F7F0] text-[#059669] border-[#A7F3D0]"
                          : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5] border-[#E2ECE5]"
                      }`}
                      title="Copy Task Brief to Clipboard"
                      aria-label="Copy Task Details"
                    >
                      {copiedTask ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-[#059669]" />
                          <span className="text-[10px] font-bold text-[#059669] hidden sm:inline">
                            Copied
                          </span>
                        </>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Close Button with Esc Hint */}
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(null)}
                      className="text-[#718096] hover:text-[#2D3748] cursor-pointer p-1.5 rounded-xl hover:bg-[#F4F7F5] transition-colors border border-transparent hover:border-[#E2ECE5] flex items-center"
                      title="Close Panel (Esc)"
                      aria-label="Close Details"
                    >
                      <X className="w-4 h-4" />
                      <kbd className="text-[9px] font-bold text-[#718096] bg-[#F4F7F5] border border-[#E2ECE5] px-1 py-0.5 rounded-md ml-1 hidden sm:inline-block">
                        ESC
                      </kbd>
                    </button>
                  </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 text-xs">
                  {/* Category Pill & Completed State */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {extractedDept ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-[11px] font-bold text-[#2D3748]">
                        <Building2 className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>{extractedDept}</span>
                      </span>
                    ) : null}

                    {activeDrawerEvent.task && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                          isDone
                            ? "bg-[#E6F7F0] text-[#059669] border-[#A7F3D0]"
                            : "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                            <span>Completed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                            <span>Action Pending</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Clean Title */}
                  <div>
                    <p className="text-[#718096] font-semibold uppercase text-[10px] tracking-wider">
                      Title
                    </p>
                    <h2 className="text-sm sm:text-base font-extrabold text-[#1A202C] mt-0.5 tracking-tight leading-snug">
                      {cleanTitle}
                    </h2>
                  </div>

                  {/* Countdown & Execution Timing Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-gradient-to-br from-[#FAFCFB] to-[#F4F7F5] p-3 rounded-2xl border border-[#E2ECE5] shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[#718096]">
                        <Clock className="w-3 h-3 text-[#10B981]" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Timeline
                        </span>
                      </div>
                      <p className="font-extrabold text-xs text-[#2D3748] mt-1.5">
                        {activeDrawerEvent.daysBeforeEvent !== undefined
                          ? `T - ${activeDrawerEvent.daysBeforeEvent} Days Before Event`
                          : "Main Event Execution Day"}
                      </p>
                      <span className="text-[10px] text-[#718096] mt-0.5 block">
                        Milestone prep phase
                      </span>
                    </div>

                    <div className="bg-gradient-to-br from-[#FAFCFB] to-[#F4F7F5] p-3 rounded-2xl border border-[#E2ECE5] shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[#718096]">
                        <CalendarDays className="w-3 h-3 text-[#3B82F6]" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Scheduled Date
                        </span>
                      </div>
                      <p className="font-extrabold text-xs text-[#2D3748] mt-1.5">
                        {format(activeDrawerEvent.start, "EEE, MMM dd, yyyy")}
                      </p>
                      <span className="text-[10px] text-[#718096] mt-0.5 block">
                        Production calendar
                      </span>
                    </div>
                  </div>

                  {/* Badges for Action Type & Priority */}
                  {(activeDrawerEvent.department ||
                    activeDrawerEvent.actionType ||
                    activeDrawerEvent.priority) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {activeDrawerEvent.actionType && (() => {
                        const actionMeta = getActionMeta(
                          activeDrawerEvent.actionType
                        );
                        const ActionIcon = actionMeta.icon;
                        return (
                          <span
                            className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${actionMeta.badgeBg}`}
                          >
                            <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{actionMeta.label}</span>
                          </span>
                        );
                      })()}
                      {activeDrawerEvent.priority && (
                        <span
                          className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
                            getPriorityMeta(activeDrawerEvent.priority).badge
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {getPriorityMeta(activeDrawerEvent.priority).label}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Operational Guidance / Brief Card */}
                  <div className="bg-gradient-to-br from-[#FAFCFB] to-[#F3F7F5] p-3.5 rounded-2xl border border-[#D5E5DC] shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#059669]">
                      <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="font-extrabold uppercase text-[10px] tracking-wider">
                        Operational Guidance / Brief
                      </span>
                    </div>
                    <div className="text-[#2D3748] text-xs leading-relaxed font-normal">
                      {activeDrawerEvent.actionBrief ||
                        activeDrawerEvent.description ||
                        "Standard operational milestone execution."}
                    </div>
                  </div>

                  {/* Milestone Budget Allocation Card */}
                  {(activeDrawerEvent.estimatedCost !== undefined ||
                    activeDrawerEvent.budget) && (
                    <div className="bg-gradient-to-br from-[#ECFDF5] to-[#F0FDF4] p-3.5 rounded-2xl border border-[#A7F3D0] shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[#059669]">
                          <span className="w-5 h-5 rounded-lg bg-[#10B981]/20 flex items-center justify-center font-bold">
                            <IndianRupee className="w-3 h-3 text-[#059669]" />
                          </span>
                          <span className="text-xs font-bold text-[#059669]">
                            {activeDrawerEvent.isMainEvent
                              ? "Total Event Budget"
                              : "Milestone Budget Allocation"}
                          </span>
                        </div>
                        <p className="font-extrabold text-base text-[#059669]">
                          ₹{eventCostNum.toLocaleString("en-IN")}
                        </p>
                      </div>

                      {percentOfBudget > 0 && !activeDrawerEvent.isMainEvent && (
                        <div className="pt-1 border-t border-[#A7F3D0]/50 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-[#059669] font-medium">
                            <span>Share of Total Budget</span>
                            <span className="font-bold">{percentOfBudget}%</span>
                          </div>
                          <div className="w-full bg-[#A7F3D0]/40 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#10B981] h-1.5 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${percentOfBudget}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle Completion button for Prep Tasks */}
                  {activeDrawerEvent.task && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleTaskCompleted(activeDrawerEvent.id)
                        }
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-xs ${
                          isDone
                            ? "bg-[#F3F4F6] text-[#4A5568] hover:bg-[#E5E7EB] border-[#D1D5DB]"
                            : "bg-[#10B981] hover:bg-[#059669] text-white border-[#10B981] hover:shadow-md active:scale-[0.99]"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isDone
                            ? "Marked as Completed (Click to Reopen)"
                            : "Mark Task as Completed"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer with Focus Calendar and Close */}
                <div className="px-5 sm:px-6 py-3 border-t border-[#E2ECE5] bg-[#FFFFFF] shrink-0 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleFocusCalendar(activeDrawerEvent.start)}
                    className="flex-1 py-2 rounded-xl bg-[#F4F7F5] text-[#2D3748] font-bold text-xs hover:bg-[#E2ECE5] transition-all cursor-pointer border border-[#E2ECE5] flex items-center justify-center gap-1.5"
                    title="Focus Calendar on this Date"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Focus on Calendar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="flex-1 py-2 rounded-xl bg-white text-[#718096] hover:text-[#2D3748] font-bold text-xs hover:bg-[#F4F7F5] transition-all cursor-pointer border border-[#E2ECE5]"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Calendar AI Chatbot Assistant */}
      <CalendarAiChatbot
        isOpen={isAiChatOpen}
        onToggle={() => setIsAiChatOpen((prev) => !prev)}
        onClose={() => setIsAiChatOpen(false)}
        eventContext={{
          title: eventName,
          eventType,
          eventBudget,
          eventDate,
          tier,
          guestCount,
          prepCalendarTasks: tasks,
          dayOfRunOfShow: runOfShow,
          budgetBreakdown: budgetList,
          evaluationSummary: evalSummary,
          selectedEvent,
        }}
        onEventStatusUpdated={(updatedFields) => {
          if (updatedFields.prepCalendarTasks) {
            setTasks(updatedFields.prepCalendarTasks);
          }
          if (updatedFields.dayOfRunOfShow) {
            setRunOfShow(updatedFields.dayOfRunOfShow);
          }
          if (updatedFields.budgetBreakdown) {
            setBudgetList(updatedFields.budgetBreakdown);
          }
        }}
        onFocusDate={handleFocusCalendar}
      />
    </div>
  );
};
