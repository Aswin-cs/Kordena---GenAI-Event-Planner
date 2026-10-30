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
  ChevronDown,
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
  Lock,
} from "lucide-react";
import { useSession } from "next-auth/react";
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
        badgeBg: "bg-[#F0F4F8] text-[#3F5F8F] border-[#3F5F8F]/25",
      };
    case "procure":
      return {
        label: "Procurement",
        icon: ShoppingCart,
        badgeBg: "bg-[#F4EFF8] text-[#6D5D96] border-[#6D5D96]/25",
      };
    case "design":
      return {
        label: "Creative Design",
        icon: Palette,
        badgeBg: "bg-[#F5EFE2] text-[#7D6230] border-[#B08D4F]/30",
      };
    case "arrange":
      return {
        label: "Logistics",
        icon: Handshake,
        badgeBg: "bg-[#F5EFE2] text-[#7D6230] border-[#B08D4F]/30",
      };
    case "setup":
      return {
        label: "Tech & Staging",
        icon: Wrench,
        badgeBg: "bg-[#F0F5F2] text-[#4F7D68] border-[#4F7D68]/30",
      };
    default:
      return {
        label: "Prep Milestone",
        icon: Clock,
        badgeBg: "bg-[#F5EFE2]/60 text-[#24352F] border-[#E7EDE9]",
      };
  }
}

export function getPriorityMeta(priority?: string) {
  switch (priority?.toLowerCase()) {
    case "high":
      return {
        label: "High Priority",
        badge: "bg-[#FDF2F0] text-[#B5473C] border-[#B5473C]/30",
        dot: "bg-[#B5473C]",
        border: "border-[#B5473C]",
      };
    case "medium":
      return {
        label: "Medium Priority",
        badge: "bg-[#F0F4F8] text-[#3F5F8F] border-[#3F5F8F]/30",
        dot: "bg-[#3F5F8F]",
        border: "border-[#3F5F8F]",
      };
    case "low":
      return {
        label: "Low Priority",
        badge: "bg-[#F0F5F2] text-[#4F7D68] border-[#4F7D68]/30",
        dot: "bg-[#4F7D68]",
        border: "border-[#4F7D68]",
      };
    default:
      return {
        label: "Normal",
        badge: "bg-[#F5EFE2]/60 text-[#7D6230] border-[#E7EDE9]",
        dot: "bg-[#B08D4F]",
        border: "border-[#E7EDE9]",
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
    return { icon: UtensilsCrossed, color: "text-[#7D6230] bg-[#F5EFE2] border-[#B08D4F]/30" };
  }
  if (cat.includes("venue") || cat.includes("hall") || cat.includes("space") || cat.includes("location") || cat.includes("infra")) {
    return { icon: Building2, color: "text-[#3F5F8F] bg-[#F0F4F8] border-[#3F5F8F]/30" };
  }
  if (cat.includes("photo") || cat.includes("video") || cat.includes("media") || cat.includes("camera")) {
    return { icon: Camera, color: "text-[#B5473C] bg-[#FDF2F0] border-[#B5473C]/30" };
  }
  if (cat.includes("decor") || cat.includes("flower") || cat.includes("stage") || cat.includes("art") || cat.includes("production")) {
    return { icon: Palette, color: "text-[#6D5D96] bg-[#F4EFF8] border-[#6D5D96]/30" };
  }
  if (cat.includes("sound") || cat.includes("light") || cat.includes("audio") || cat.includes("tech") || cat.includes("av") || cat.includes("visual")) {
    return { icon: Wrench, color: "text-[#24352F] bg-[#F5EFE2] border-[#E7EDE9]" };
  }
  if (cat.includes("security") || cat.includes("permit") || cat.includes("license") || cat.includes("safety") || cat.includes("contingency")) {
    return { icon: ShieldCheck, color: "text-[#4F7D68] bg-[#F0F5F2] border-[#4F7D68]/30" };
  }
  return { icon: Layers, color: "text-[#7B8C86] bg-[#F5EFE2]/60 border-[#E7EDE9]" };
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
  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated";

  const [currentView, setCurrentView] = useState<View>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerEvent, setActiveDrawerEvent] = useState<CalendarEventItem | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"calendar" | "tasks" | "runofshow" | "budget">("calendar");
  const [isCalendarSplitView, setIsCalendarSplitView] = useState<boolean>(true);
  const [splitCompanionTab, setSplitCompanionTab] = useState<"budget" | "tasks" | "runofshow">("budget");

  // User events list fetched from UserStatus model (/api/user-status)
  const [allUserEvents, setAllUserEvents] = useState<any[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);

  // Active event properties (supports switching between fetched events)
  const [activeEventName, setActiveEventName] = useState<string>(eventName);
  const [activeEventType, setActiveEventType] = useState<string>(eventType);
  const [activeEventBudget, setActiveEventBudget] = useState<string>(eventBudget);
  const [activeEventDate, setActiveEventDate] = useState<string>(eventDate);
  const [activeTier, setActiveTier] = useState<string | undefined>(tier);
  const [activeGuestCount, setActiveGuestCount] = useState<number | string | undefined>(guestCount);

  // Keep active event properties in sync if initial props change
  useEffect(() => {
    setActiveEventName(eventName);
    setActiveEventType(eventType);
    setActiveEventBudget(eventBudget);
    setActiveEventDate(eventDate);
    setActiveTier(tier);
    setActiveGuestCount(guestCount);
  }, [eventName, eventType, eventBudget, eventDate, tier, guestCount]);

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
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    (initialTasks || []).forEach((t, idx) => {
      if (t.isCompleted) {
        initial[t.id || `task-${idx}`] = true;
      }
    });
    return initial;
  });

  // Fallback default budget breakdown if event has no AI budget breakdown yet
  const defaultCategories = useMemo<IBudgetBreakdownItem[]>(() => {
    const total = Number(activeEventBudget || eventBudget) || 100000;
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

  const targetBudget = Number(activeEventBudget || eventBudget) || 100000;

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

  // Apply event document data to active calendar view
  const applyEventData = (eventDoc: any) => {
    if (!eventDoc) return;
    setActiveEventName(eventDoc.eventName || "Untitled Event");
    setActiveEventType(eventDoc.eventType || "Conference");
    setActiveEventBudget(String(eventDoc.budget || 50000));

    let formattedDate = "";
    if (eventDoc.endDate) {
      const d = new Date(eventDoc.endDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split("T")[0];
      }
    }
    const finalDateStr = formattedDate || new Date().toISOString().split("T")[0];
    setActiveEventDate(finalDateStr);
    setActiveTier(eventDoc.tier || "Starter");
    setActiveGuestCount(eventDoc.guestCount || 100);

    const newTasks: IPrepCalendarTask[] = eventDoc.prepCalendarTasks || [];
    setTasks(newTasks);
    setRunOfShow(eventDoc.dayOfRunOfShow || []);
    setBudgetList(eventDoc.budgetBreakdown || []);
    if (eventDoc.evaluationSummary) {
      setEvalSummary(eventDoc.evaluationSummary);
    }

    // Sync task completion state
    const newCompleted: Record<string, boolean> = {};
    newTasks.forEach((t: IPrepCalendarTask, idx: number) => {
      if (t.isCompleted) {
        newCompleted[t.id || `task-${idx}`] = true;
      }
    });
    setCompletedTaskIds(newCompleted);

    // Update calendar focus date
    if (finalDateStr) {
      const parts = finalDateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 10, 0, 0);
        if (!isNaN(d.getTime())) {
          setCurrentDate(d);
        }
      }
    }
  };

  // Effective list of user events: allUserEvents from DB with current draft included
  const effectiveEvents = useMemo(() => {
    if (!allUserEvents || allUserEvents.length === 0) {
      return [
        {
          eventName: activeEventName || eventName,
          eventType: activeEventType || eventType,
          budget: Number(activeEventBudget || eventBudget),
          endDate: activeEventDate || eventDate,
          tier: activeTier || tier,
          guestCount: activeGuestCount || guestCount,
          prepCalendarTasks: tasks,
          dayOfRunOfShow: runOfShow,
          budgetBreakdown: budgetList,
          evaluationSummary: evalSummary,
        },
      ];
    }
    const currentTitle = (activeEventName || eventName || "").trim().toLowerCase();
    const hasCurrent = allUserEvents.some(
      (ev) => ev.eventName?.trim().toLowerCase() === currentTitle
    );
    if (!hasCurrent && (activeEventName || eventName)) {
      return [
        {
          eventName: activeEventName || eventName,
          eventType: activeEventType || eventType,
          budget: Number(activeEventBudget || eventBudget),
          endDate: activeEventDate || eventDate,
          tier: activeTier || tier,
          guestCount: activeGuestCount || guestCount,
          prepCalendarTasks: tasks,
          dayOfRunOfShow: runOfShow,
          budgetBreakdown: budgetList,
          evaluationSummary: evalSummary,
        },
        ...allUserEvents,
      ];
    }
    return allUserEvents;
  }, [
    allUserEvents,
    activeEventName,
    eventName,
    activeEventType,
    eventType,
    activeEventBudget,
    eventBudget,
    activeEventDate,
    eventDate,
    activeTier,
    tier,
    activeGuestCount,
    guestCount,
    tasks,
    runOfShow,
    budgetList,
    evalSummary,
  ]);

  // Fetch all user events from UserStatus collection on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingEvents(true);
    fetch("/api/user-status")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data.success || !Array.isArray(data.userStatuses)) return;
        const list = data.userStatuses;
        setAllUserEvents(list);

        // Find index matching current eventName
        const targetName = (activeEventName || eventName || "").trim().toLowerCase();
        const foundIdx = list.findIndex(
          (us: any) => us.eventName?.trim().toLowerCase() === targetName
        );

        if (foundIdx !== -1) {
          setCurrentEventIndex(foundIdx);
          applyEventData(list[foundIdx]);
        } else if (list.length > 0) {
          setCurrentEventIndex(0);
          applyEventData(list[0]);
        }
      })
      .catch((err) => console.warn("Could not load user-status for calendar:", err))
      .finally(() => {
        if (isMounted) setIsLoadingEvents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [eventName]);

  // Event Switcher Navigation Handlers
  const handleSelectEventIndex = (index: number) => {
    const list = effectiveEvents;
    if (index < 0 || index >= list.length) return;
    setCurrentEventIndex(index);
    applyEventData(list[index]);
    setIsEventDropdownOpen(false);
  };

  const handlePrevEvent = () => {
    const list = effectiveEvents;
    if (list.length <= 1) return;
    const nextIdx = currentEventIndex > 0 ? currentEventIndex - 1 : list.length - 1;
    handleSelectEventIndex(nextIdx);
  };

  const handleNextEvent = () => {
    const list = effectiveEvents;
    if (list.length <= 1) return;
    const nextIdx = currentEventIndex < list.length - 1 ? currentEventIndex + 1 : 0;
    handleSelectEventIndex(nextIdx);
  };

  // Keyboard shortcut to switch between events: Alt + ArrowLeft / Alt + ArrowRight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevEvent();
      } else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        handleNextEvent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [effectiveEvents, currentEventIndex]);

  // Close event selector dropdown when clicking outside
  useEffect(() => {
    if (!isEventDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-event-dropdown]")) {
        setIsEventDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isEventDropdownOpen]);

  // Compute the parsed event Date
  const parsedEventDate = useMemo(() => {
    const raw = activeEventDate || eventDate;
    if (!raw) return new Date();
    const parts = raw.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day, 10, 0, 0);
      if (!isNaN(d.getTime())) return d;
    }
    const fallback = new Date(raw);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
  }, [activeEventDate, eventDate]);

  // Controlled date state so Next, Back, and Today buttons work properly
  const [currentDate, setCurrentDate] = useState<Date>(parsedEventDate);

  // Sync internal calendar date if parsedEventDate changes
  useEffect(() => {
    if (parsedEventDate && !isNaN(parsedEventDate.getTime())) {
      setCurrentDate(parsedEventDate);
    }
  }, [parsedEventDate.getTime()]);

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

  // Toggle task completion with instant optimistic UI + backend MongoDB persistence
  const handleToggleTaskCompleted = async (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextVal = !completedTaskIds[taskId];

    // 1. Optimistic UI update
    setCompletedTaskIds((prev) => ({
      ...prev,
      [taskId]: nextVal,
    }));
    setTasks((prev) =>
      prev.map((t, idx) => {
        const id = t.id || `task-${idx}`;
        if (id === taskId) {
          return { ...t, isCompleted: nextVal };
        }
        return t;
      })
    );

    // 2. Sync in-memory allUserEvents
    const currentDoc = effectiveEvents[currentEventIndex];
    setAllUserEvents((prev) =>
      prev.map((ev, idx) => {
        if (idx === currentEventIndex) {
          const updatedPrep = (ev.prepCalendarTasks || []).map((t: any, tIdx: number) => {
            const id = t.id || `task-${tIdx}`;
            if (id === taskId) {
              return { ...t, isCompleted: nextVal };
            }
            return t;
          });
          return {
            ...ev,
            prepCalendarTasks: updatedPrep,
          };
        }
        return ev;
      })
    );

    // 3. Persist to MongoDB backend via dedicated /api/tasks/toggle route
    try {
      const res = await fetch("/api/tasks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          isCompleted: nextVal,
          eventName: activeEventName || eventName,
          userStatusId: currentDoc?._id,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        console.warn("[Task Toggle] Backend warning:", data.message);
      }
    } catch (err) {
      console.error("[Task Toggle] Failed to sync task completion with backend:", err);
    }
  };

  // Build calendar events list: Main Event + Prep Calendar Tasks + Day-of-Run-of-Show
  const eventsList: CalendarEventItem[] = useMemo(() => {
    const mainTitle = (activeEventName || eventName).trim() || "Untitled Event";
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
        type: activeEventType || eventType,
        budget: activeEventBudget || eventBudget,
        plan: selectedPlan,
        isMainEvent: true,
        description: `Main Event Day for ${mainTitle}. Feasibility: ${evalSummary?.feasibilityAssessment || "High"}. Budget: ₹${Number(activeEventBudget || eventBudget || 0).toLocaleString("en-IN")}.`,
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
    activeEventName,
    eventType,
    activeEventType,
    eventBudget,
    activeEventBudget,
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
    if (event.isMainEvent) return { className: "kcal-ev kcal-ev--main" };
    if (event.runOfShowItem) return { className: "kcal-ev kcal-ev--show" };
    const done = completedTaskIds[event.id] ? " kcal-ev--done" : "";
    const tone = event.priority === "high" ? "high" : event.priority === "medium" ? "medium" : "low";
    return { className: `kcal-ev kcal-ev--${tone}${done}` };
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
                  className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer shrink-0 z-20 ${
                    isDone
                      ? "bg-[#0E2A24] border-[#0E2A24] text-[#F3E7C9]"
                      : "border-[#CBD5E1] bg-white hover:border-[#B08D4F]"
                  }`}
                  title={isDone ? "Mark as Incomplete" : "Mark as Completed"}
                >
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${meta.badgeBg}`}
                    >
                      <meta.icon className="w-3 h-3 shrink-0" />
                      <span>{meta.label}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${priority.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                      {priority.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5EFE2]/60 text-[#24352F] border border-[#E7EDE9]">
                      {task.department}
                    </span>
                  </div>

                  <h4
                    className={`text-xs font-bold leading-snug transition-colors line-clamp-1 ${
                      isDone ? "line-through text-[#7B8C86]" : "text-[#0E2A24]"
                    }`}
                  >
                    {task.title}
                  </h4>

                  <p className="text-[11px] text-[#7B8C86] line-clamp-2 leading-relaxed">
                    {task.actionBrief}
                  </p>
                </div>
              </div>

              {/* Countdown Badge */}
              <div className="text-right shrink-0">
                <span className="px-2 py-0.5 rounded-full bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/30 text-[10px] font-bold whitespace-nowrap block">
                  T - {days} Days
                </span>
                <span className="text-[10px] text-[#7B8C86] mt-0.5 block font-medium">
                  {format(taskDate, "MMM dd")}
                </span>
              </div>
            </div>

            {/* Card Bottom Meta */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#E7EDE9] text-[11px] mt-auto">
              <div className="flex items-center gap-1 font-bold text-[#0E2A24]">
                <IndianRupee className="w-3 h-3 text-[#B08D4F]" />
                <span className="font-serif">₹{Number(task.estimatedCost || 0).toLocaleString("en-IN")}</span>
              </div>

              <div className="text-[11px] font-bold text-[#B08D4F] hover:text-[#7D6230] flex items-center gap-1 cursor-pointer">
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
    const isDone = completedTaskIds[event.id];
    return (
      <div className="kcal-ev-inner">
        {event.isMainEvent ? (
          <Star className="w-3 h-3 shrink-0 fill-current" />
        ) : event.runOfShowItem ? (
          <Zap className="w-3 h-3 shrink-0" />
        ) : isDone ? (
          <CheckCircle2 className="w-3 h-3 shrink-0" />
        ) : null}
        <span className="truncate">{event.title}</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Executive Command Header Bar */}
      <div className="bg-[#FCFDFC] rounded-[28px] p-5 sm:p-6 border border-[#E7EDE9] shadow-[0_24px_48px_-32px_rgba(14,42,36,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={onBackToStepper}
            className="h-9 px-4 rounded-full bg-white hover:bg-[#F5EFE2] text-[#24352F] border border-[#E7EDE9] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs group font-semibold text-xs"
            title="Back to Stepper Setup"
          >
            <ArrowLeft className="w-4 h-4 text-[#7B8C86] group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-medium text-[#0E2A24] tracking-tight">
                {activeEventName || eventName || "Annual Global Tech Summit 2026"}
              </h1>

              {/* Event Switcher: Previous & Next Buttons */}
              {effectiveEvents.length > 1 ? (
                <div
                  data-event-dropdown
                  className="relative inline-flex items-center gap-1 bg-[#F5EFE2]/60 border border-[#E7EDE9] p-1 rounded-full shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={handlePrevEvent}
                    aria-label={`Switch to previous blueprint (${effectiveEvents[(currentEventIndex - 1 + effectiveEvents.length) % effectiveEvents.length]?.eventName || "Previous"})`}
                    className="p-1 sm:p-1.5 rounded-full hover:bg-white text-[#24352F] hover:text-[#0E2A24] transition-all cursor-pointer shadow-2xs active:scale-95 group"
                    title={`Previous Event (${effectiveEvents[(currentEventIndex - 1 + effectiveEvents.length) % effectiveEvents.length]?.eventName || "Previous"}) [Alt+←]`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEventDropdownOpen((prev) => !prev)}
                    aria-expanded={isEventDropdownOpen}
                    aria-label={`Current blueprint: ${activeEventName || eventName}, ${currentEventIndex + 1} of ${effectiveEvents.length}. Click to view all.`}
                    className="px-2.5 py-0.5 rounded-full hover:bg-white text-[11px] font-bold text-[#0E2A24] flex items-center gap-1.5 transition-all cursor-pointer select-none"
                    title="Click to view all events"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-[#B08D4F]" />
                    <span>{currentEventIndex + 1} of {effectiveEvents.length}</span>
                    <ChevronDown className="w-3 h-3 text-[#7B8C86]" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextEvent}
                    aria-label={`Switch to next blueprint (${effectiveEvents[(currentEventIndex + 1) % effectiveEvents.length]?.eventName || "Next"})`}
                    className="p-1 sm:p-1.5 rounded-full hover:bg-white text-[#24352F] hover:text-[#0E2A24] transition-all cursor-pointer shadow-2xs active:scale-95 group"
                    title={`Next Event (${effectiveEvents[(currentEventIndex + 1) % effectiveEvents.length]?.eventName || "Next"}) [Alt+→]`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu of All Events */}
                  {isEventDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-[#FCFDFC] rounded-2xl shadow-xl border border-[#E7EDE9] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 border-b border-[#E7EDE9] mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8C86]">
                          Saved Event Blueprints ({effectiveEvents.length})
                        </span>
                        <span className="text-[10px] text-[#7B8C86]/70">Alt + ← / →</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {effectiveEvents.map((ev, idx) => {
                          const isSelected = idx === currentEventIndex;
                          const evDateStr = ev.endDate ? new Date(ev.endDate).toLocaleDateString() : "";
                          return (
                            <button
                              key={ev._id || `ev-${idx}`}
                              type="button"
                              onClick={() => handleSelectEventIndex(idx)}
                              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-[#F5EFE2] text-[#0E2A24] font-bold border border-[#B08D4F]/40"
                                  : "hover:bg-[#F5EFE2]/50 text-[#24352F]"
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-xs font-bold truncate">
                                  {ev.eventName || "Untitled Event"}
                                </p>
                                <p className="text-[10px] text-[#7B8C86] truncate">
                                  {ev.eventType || "Event"} {evDateStr ? `• ${evDateStr}` : ""}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-[#B08D4F] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-[#F5EFE2]/60 border border-[#E7EDE9] px-3 py-1 rounded-full text-[11px] font-bold text-[#7B8C86]">
                  <CalendarDays className="w-3.5 h-3.5 text-[#B08D4F]" />
                  <span>1 Active Blueprint</span>
                </div>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/40">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B08D4F] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B08D4F]" />
                </span>
                Production Blueprint Active
              </span>

              {daysUntilEvent !== undefined && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F5EFE2]/70 text-[#24352F] border border-[#E7EDE9]">
                  <Clock className="w-3.5 h-3.5 text-[#B08D4F]" />
                  {daysUntilEvent > 0
                    ? `T - ${daysUntilEvent} Days To Go`
                    : daysUntilEvent === 0
                    ? "Target Event Day"
                    : "Event Concluded"}
                </span>
              )}
            </div>
            <p className="text-xs text-[#7B8C86]">
              Master schedule synchronized across {tasks.length} countdown milestones & {runOfShow.length} day-of execution items.
            </p>
          </div>
        </div>

        {/* Action Button Cluster */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {onNewEvent && (
            <button
              onClick={onNewEvent}
              className="h-10 px-4 rounded-full bg-[#F5EFE2] hover:bg-[#ede3cf] text-[#7D6230] border border-[#B08D4F] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs font-bold text-xs"
              title="Create New Event Blueprint"
            >
              <Plus className="w-4 h-4 text-[#7D6230] stroke-[2.5]" />
              <span>New Blueprint</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAiChatOpen(true)}
            className="h-10 px-4 rounded-full bg-[#0E2A24] hover:bg-[#163830] text-[#F3E7C9] transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-md font-bold text-xs group"
            title={isAuthenticated ? "Open AI Calendar Copilot (Ctrl+J)" : "AI Calendar Copilot (Sign In Required)"}
          >
            {isAuthenticated ? (
              <Sparkles className="w-4 h-4 text-[#F3E7C9] animate-pulse" />
            ) : (
              <Lock className="w-4 h-4 text-amber-200" />
            )}
            <span>Ask AI Copilot</span>
            {!isAuthenticated && (
              <span className="inline-flex items-center text-[10px] bg-amber-500/90 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                Locked
              </span>
            )}
            <span className="hidden sm:inline-block text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded-md border border-white/15 text-[#F3E7C9]">
              Ctrl+J
            </span>
          </button>
        </div>
      </div>

      {/* Executive Horizon Telemetry Ribbon */}
      <div className="bg-[#FCFDFC] rounded-[24px] sm:rounded-[28px] border border-[#E7EDE9] shadow-[0_12px_32px_-24px_rgba(14,42,36,0.12)] p-4 sm:p-5 transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E7EDE9] gap-3 sm:gap-0">
          {/* Segment 1: Target Date */}
          <div className="sm:px-4 first:sm:pl-1 flex flex-col justify-between py-1">
            <div className="flex items-center justify-between text-[#7B8C86] mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-[#7B8C86]">
                <CalendarIcon className="w-3.5 h-3.5 text-[#B08D4F]" /> Target Date
              </span>
              <span className="text-[10px] font-semibold bg-[#F5EFE2] text-[#7D6230] px-2.5 py-0.5 rounded-full border border-[#E7EDE9]">
                {activeEventType || eventType || "Event"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-[#0E2A24] font-serif tracking-tight">
                {format(parsedEventDate, "EEE, MMM dd, yyyy")}
              </p>
              {daysUntilEvent !== undefined && (
                <span className="text-[10px] font-bold text-[#7D6230] bg-[#F5EFE2] px-2 py-0.5 rounded-full border border-[#B08D4F]/30">
                  {daysUntilEvent > 0 ? `${daysUntilEvent}d to go` : daysUntilEvent === 0 ? "Today" : "Concluded"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#4F7D68] font-medium mt-1">
              <CheckCircle2 className="w-3 h-3 text-[#4F7D68]" />
              <span>Master Schedule Locked</span>
            </div>
          </div>

          {/* Segment 2: Blueprint Tier */}
          <div className="sm:px-4 flex flex-col justify-between py-1">
            <div className="flex items-center justify-between text-[#7B8C86] mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-[#7B8C86]">
                <Sparkles className="w-3.5 h-3.5 text-[#B08D4F]" /> Blueprint Tier
              </span>
              <span className="text-[10px] font-bold text-[#F3E7C9] bg-[#0E2A24] px-2.5 py-0.5 rounded-full border border-[#0E2A24]">
                {activeTier || tier || "Starter"}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#24352F] truncate">
              {evalSummary?.eventVibe ||
                `Optimized for ${activeGuestCount || guestCount || 100} guests`}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#3F5F8F] font-medium mt-1">
              <TrendingUp className="w-3 h-3 text-[#3F5F8F]" />
              <span>
                Feasibility: {evalSummary?.feasibilityAssessment || "Verified"}
              </span>
            </div>
          </div>

          {/* Segment 3: Budget Health */}
          <div className="sm:px-4 flex flex-col justify-between py-1">
            <div className="flex items-center justify-between text-[#7B8C86] mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-[#7B8C86]">
                <IndianRupee className="w-3.5 h-3.5 text-[#B08D4F]" /> Budget Health
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  budgetDelta > 0
                    ? "bg-[#F5EFE2] text-[#7D6230] border-[#B08D4F]/40"
                    : budgetDelta === 0
                    ? "bg-[#F5EFE2]/70 text-[#0E2A24] border-[#E7EDE9]"
                    : "bg-[#FDF2F0] text-[#B5473C] border-[#B5473C]/30"
                }`}
              >
                {budgetDelta > 0
                  ? `₹${budgetDelta.toLocaleString("en-IN")} Buffer`
                  : budgetDelta === 0
                  ? "Balanced"
                  : `+₹${Math.abs(budgetDelta).toLocaleString("en-IN")} Over`}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-bold text-[#0E2A24] font-serif">
                ₹{targetBudget.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-[#7B8C86]">
                ₹{totalAllocated.toLocaleString("en-IN")} mapped
              </span>
            </div>
            <div className="w-full bg-[#E7EDE9] h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  budgetDelta < 0 ? "bg-[#B5473C]" : "bg-[#0E2A24]"
                }`}
                style={{
                  width: `${Math.min(100, (totalAllocated / Math.max(1, targetBudget)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Segment 4: Prep Velocity */}
          <div className="sm:px-4 last:sm:pr-1 flex flex-col justify-between py-1">
            <div className="flex items-center justify-between text-[#7B8C86] mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-[#7B8C86]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4F7D68]" /> Prep Velocity
              </span>
              <span className="text-[10px] font-bold text-[#7D6230] bg-[#F5EFE2] px-2.5 py-0.5 rounded-full border border-[#B08D4F]/40">
                {completionPercent}% Done
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-bold text-[#0E2A24] font-serif">
                {completedCount} of {tasks.length} Done
              </p>
              <span className="text-[10px] text-[#7B8C86]">
                {tasks.length - completedCount} pending
              </span>
            </div>
            <div className="w-full bg-[#E7EDE9] h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-[#0E2A24] h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Workspace Segmented Tabs */}
      <div className="bg-[#FCFDFC] p-2 rounded-[24px] sm:rounded-full border border-[#E7EDE9] shadow-2xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 bg-[#E7EDE9]/50 p-1 rounded-full">
          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("calendar")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeWorkspaceTab === "calendar"
                ? "bg-[#0E2A24] text-[#F3E7C9] shadow-xs"
                : "text-[#7B8C86] hover:text-[#0E2A24] hover:bg-white/60"
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Master Schedule & Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("tasks")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeWorkspaceTab === "tasks"
                ? "bg-[#0E2A24] text-[#F3E7C9] shadow-xs"
                : "text-[#7B8C86] hover:text-[#0E2A24] hover:bg-white/60"
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Countdown Prep Tasks</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeWorkspaceTab === "tasks"
                  ? "bg-white/20 text-[#F3E7C9]"
                  : "bg-white text-[#7B8C86] border border-[#E7EDE9]"
              }`}
            >
              {tasks.length}
            </span>
          </button>

          {runOfShow.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab("runofshow")}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeWorkspaceTab === "runofshow"
                  ? "bg-[#0E2A24] text-[#F3E7C9] shadow-xs"
                  : "text-[#7B8C86] hover:text-[#0E2A24] hover:bg-white/60"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Day-of Run of Show</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeWorkspaceTab === "runofshow"
                    ? "bg-white/20 text-[#F3E7C9]"
                    : "bg-white text-[#7B8C86] border border-[#E7EDE9]"
                }`}
              >
                {runOfShow.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("budget")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeWorkspaceTab === "budget"
                ? "bg-[#0E2A24] text-[#F3E7C9] shadow-xs"
                : "text-[#7B8C86] hover:text-[#0E2A24] hover:bg-white/60"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Budget Allocator</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeWorkspaceTab === "budget"
                  ? "bg-white/20 text-[#F3E7C9]"
                  : "bg-white text-[#7B8C86] border border-[#E7EDE9]"
              }`}
            >
              {editableBudget.length}
            </span>
          </button>
        </div>

        {/* If in Calendar tab, provide Layout Mode Switcher */}
        {activeWorkspaceTab === "calendar" && (
          <div className="hidden lg:flex items-center gap-1 bg-[#E7EDE9]/50 p-1 rounded-full border border-[#E7EDE9]">
            <button
              type="button"
              onClick={() => setIsCalendarSplitView(true)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isCalendarSplitView
                  ? "bg-[#0E2A24] text-[#F3E7C9] shadow-2xs"
                  : "text-[#7B8C86] hover:text-[#0E2A24]"
              }`}
              title="Split View (Calendar + Budget Panel)"
            >
              <Columns className="w-3 h-3 text-[#B08D4F]" />
              <span>Split Companion</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCalendarSplitView(false)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                !isCalendarSplitView
                  ? "bg-[#0E2A24] text-[#F3E7C9] shadow-2xs"
                  : "text-[#7B8C86] hover:text-[#0E2A24]"
              }`}
              title="Full Calendar Stage (Expanded)"
            >
              <Maximize2 className="w-3 h-3 text-[#B08D4F]" />
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
            } kcal`}
          >
            {/* Calendar Command Strip */}
            <header className="kcal-head">
              <div>
                <h2 className="kcal-month">
                  {format(currentDate, "MMMM")}
                  <span className="kcal-year">{format(currentDate, "yyyy")}</span>
                </h2>
                <p className="kcal-sub">
                  {eventsList.filter(
                    (e) =>
                      e.start.getMonth() === currentDate.getMonth() &&
                      e.start.getFullYear() === currentDate.getFullYear()
                  ).length}{" "}
                  items this month
                </p>
              </div>

              <div className="kcal-controls">
                <div className="kcal-nav">
                  <button type="button" onClick={handleCalendarPrev} aria-label="Previous" className="kcal-icon-btn">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setCurrentDate(new Date())} className="kcal-text-btn">
                    Today
                  </button>
                  <button type="button" onClick={handleCalendarNext} aria-label="Next" className="kcal-icon-btn">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date(parsedEventDate))}
                  className="kcal-gold-btn"
                  title="Jump to the event month"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Event day
                </button>

                <div className="kcal-seg" role="tablist" aria-label="Calendar view">
                  {(["month", "week", "day", "agenda"] as View[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="tab"
                      aria-selected={currentView === v}
                      onClick={() => setCurrentView(v)}
                      className={currentView === v ? "is-active" : ""}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            {/* Big Calendar Canvas */}
            <div className="h-[660px] w-full calendar-container">
              <Calendar
                toolbar={false}
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
                  toolbar: () => null,
                }}
              />
            </div>

            <footer className="kcal-legend">
              <span><i style={{ background: "var(--k-gold)" }} />Event day</span>
              <span><i style={{ background: "var(--k-high)" }} />High</span>
              <span><i style={{ background: "var(--k-med)" }} />Medium</span>
              <span><i style={{ background: "var(--k-low)" }} />Low</span>
              {runOfShow.length > 0 && <span><i style={{ background: "var(--k-show)" }} />Run of show</span>}
            </footer>
          </div>

          {/* Right Companion: Operations Deck (when in split mode) */}
          {isCalendarSplitView && (
            <div className="xl:col-span-4 bg-[#FCFDFC] rounded-[28px] p-5 sm:p-6 border border-[#E7EDE9] shadow-[0_24px_48px_-32px_rgba(14,42,36,0.18)] space-y-4 xl:sticky xl:top-6">
              {/* Operations Deck Header & Micro-Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E7EDE9] gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/30 flex items-center justify-center font-bold">
                    {splitCompanionTab === "budget" ? (
                      <SlidersHorizontal className="w-4 h-4" />
                    ) : splitCompanionTab === "tasks" ? (
                      <ListChecks className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-[#0E2A24]">Operations Deck</h2>
                    <p className="text-[11px] text-[#7B8C86]">
                      {splitCompanionTab === "budget"
                        ? "Fine-tune allocations with Elastic Slider"
                        : splitCompanionTab === "tasks"
                        ? "Live countdown radar & milestone sync"
                        : "Day-of execution schedule & timing"}
                    </p>
                  </div>
                </div>

                {/* Micro Tab Switcher */}
                <div className="flex items-center gap-1 bg-[#E7EDE9]/60 p-1 rounded-full border border-[#E7EDE9] text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSplitCompanionTab("budget")}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      splitCompanionTab === "budget"
                        ? "bg-[#0E2A24] text-[#F3E7C9] shadow-2xs"
                        : "text-[#7B8C86] hover:text-[#0E2A24]"
                    }`}
                    title="Budget Breakdown Allocator"
                  >
                    <IndianRupee className="w-3 h-3 text-[#B08D4F]" />
                    <span>Budget</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitCompanionTab("tasks")}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      splitCompanionTab === "tasks"
                        ? "bg-[#0E2A24] text-[#F3E7C9] shadow-2xs"
                        : "text-[#7B8C86] hover:text-[#0E2A24]"
                    }`}
                    title="Countdown Prep Tasks Radar"
                  >
                    <ListChecks className="w-3 h-3 text-[#B08D4F]" />
                    <span>Tasks ({tasks.length})</span>
                  </button>
                  {runOfShow.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSplitCompanionTab("runofshow")}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        splitCompanionTab === "runofshow"
                          ? "bg-[#0E2A24] text-[#F3E7C9] shadow-2xs"
                          : "text-[#7B8C86] hover:text-[#0E2A24]"
                      }`}
                      title="Day-of Run of Show"
                    >
                      <Zap className="w-3 h-3 text-[#B08D4F]" />
                      <span>Day-of ({runOfShow.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Current Event / Selected Milestone Context */}
              <div className="p-3.5 rounded-2xl bg-[#F5EFE2]/40 border border-[#E7EDE9] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#7B8C86]">
                    Active Blueprint
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7D6230]">
                    <IndianRupee className="w-3 h-3 text-[#B08D4F]" />
                    ₹{targetBudget.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#0E2A24] truncate">
                  {activeEventName || eventName || "Current Event"}
                </p>
                {selectedEvent ? (
                  <div className="pt-2 mt-1.5 border-t border-[#E7EDE9] flex items-center justify-between text-[11px]">
                    <span className="text-[#0E2A24] font-medium truncate flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#B08D4F] inline-block shrink-0" />
                      <span className="truncate">Selected: <strong>{selectedEvent.title}</strong></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(null)}
                      className="text-[10px] text-[#7B8C86] hover:text-[#0E2A24] underline ml-2 shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#7B8C86]">
                    Click any calendar event to focus details here.
                  </p>
                )}
              </div>

              {/* TAB 1: BUDGET BREAKDOWN ALLOCATOR */}
              {splitCompanionTab === "budget" && (
                <div className="space-y-4">
                  {/* Budget Health Progress */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-gradient-to-br from-[#F5EFE2]/60 to-[#FFFFFF] border border-[#B08D4F]/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#24352F]">Total Allocated:</span>
                      <span className="font-serif font-bold text-sm text-[#0E2A24]">
                        ₹{totalAllocated.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#E7EDE9] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          budgetDelta < 0 ? "bg-[#B5473C]" : "bg-[#0E2A24]"
                        }`}
                        style={{
                          width: `${Math.min(100, (totalAllocated / Math.max(1, targetBudget)) * 100)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7B8C86]">
                        {((totalAllocated / Math.max(1, targetBudget)) * 100).toFixed(0)}% of target budget
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${
                          budgetDelta > 0
                            ? "bg-[#F5EFE2] text-[#7D6230] border-[#B08D4F]/40"
                            : budgetDelta === 0
                            ? "bg-[#F5EFE2]/70 text-[#0E2A24] border-[#E7EDE9]"
                            : "bg-[#FDF2F0] text-[#B5473C] border-[#B5473C]/30"
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
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
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
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isDepartmentMatch
                              ? "bg-[#F5EFE2]/40 border-[#B08D4F] shadow-xs ring-1 ring-[#B08D4F]/30"
                              : "bg-[#FCFDFC] hover:bg-[#F5EFE2]/20 border-[#E7EDE9]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`p-1.5 rounded-xl border shrink-0 ${meta.color}`}>
                                <CategoryIcon className="w-3.5 h-3.5" />
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#0E2A24] truncate">
                                  {item.category}
                                </h4>
                                {item.spendStrategy && (
                                  <p className="text-[10px] text-[#7B8C86] line-clamp-1">
                                    {item.spendStrategy}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold font-serif text-[#0E2A24] block">
                                ₹{Number(item.allocatedAmount).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-[#7B8C86] font-semibold">
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
                              thumbColor="#B08D4F"
                              valuePosition="bubble"
                              rangeColor="#0E2A24"
                              trackColor="#E7EDE9"
                              leftIcon={<IndianRupee className="w-3.5 h-3.5 text-[#B08D4F]" />}
                              rightIcon={<TrendingUp className="w-3.5 h-3.5 text-[#B08D4F]" />}
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
                  <div className="pt-2 border-t border-[#E7EDE9] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetBudget}
                      className="p-2.5 rounded-full text-[#7B8C86] hover:text-[#0E2A24] hover:bg-[#F5EFE2] border border-[#E7EDE9] transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Reset to Original Values"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isSavingBudget}
                      onClick={handleSaveBudget}
                      className={`flex-1 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                        saveSuccess
                          ? "bg-[#4F7D68] text-white"
                          : "bg-[#0E2A24] hover:bg-[#163830] text-[#F3E7C9]"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSavingBudget ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[#F3E7C9] border-t-transparent rounded-full animate-spin" />
                          <span>Saving Allocations...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Allocations Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Allocations</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TASKS RADAR CHECKLIST */}
              {splitCompanionTab === "tasks" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="text-[#7B8C86] font-medium">
                      {completedCount} of {tasks.length} Completed
                    </span>
                    <span className="font-bold text-[#7D6230] bg-[#F5EFE2] px-2.5 py-0.5 rounded-full border border-[#B08D4F]/40 text-[10px]">
                      {completionPercent}%
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {tasks.map((task, idx) => {
                      const taskId = task.id || `task-${idx}`;
                      const isDone = !!completedTaskIds[taskId];
                      const meta = getCategoryMeta(task.department || "");
                      const CategoryIcon = meta.icon;
                      const pMeta = getPriorityMeta(task.priority);

                      return (
                        <div
                          key={taskId}
                          onClick={() => handleToggleTaskCompleted(taskId)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            isDone
                              ? "bg-[#F5EFE2]/20 border-[#E7EDE9] opacity-75"
                              : "bg-white hover:bg-[#FAFCFB] border-[#E7EDE9] shadow-2xs"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleToggleTaskCompleted(taskId, e)}
                            className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isDone
                                ? "bg-[#0E2A24] border-[#0E2A24] text-[#F3E7C9] shadow-2xs"
                                : "border-[#CBD5E1] bg-white hover:border-[#B08D4F]"
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h4
                                className={`text-xs font-bold truncate ${
                                  isDone
                                    ? "line-through text-[#7B8C86]"
                                    : "text-[#24352F]"
                                }`}
                              >
                                {task.title}
                              </h4>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${pMeta.badge}`}
                              >
                                {task.priority || "Normal"}
                              </span>
                            </div>

                            <p className="text-[10px] text-[#7B8C86] line-clamp-1">
                              {task.actionBrief || (task as any).description}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#7B8C86]">
                              <span className="flex items-center gap-1 font-medium">
                                <CategoryIcon className="w-3 h-3 text-[#B08D4F]" />
                                {task.department || "General"}
                              </span>
                              <span>•</span>
                              <span className="font-mono">
                                T-{task.daysBeforeEvent || 0}d
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: RUN OF SHOW TIMELINE */}
              {splitCompanionTab === "runofshow" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="text-[#7B8C86] font-medium">Day-of Schedule</span>
                    <span className="font-bold text-[#6D5D96] bg-[#6D5D96]/10 px-2.5 py-0.5 rounded-full border border-[#6D5D96]/20 text-[10px]">
                      {runOfShow.length} Items
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {runOfShow.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white border border-[#E7EDE9] shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-[#6D5D96] bg-[#6D5D96]/10 px-2 py-0.5 rounded-full border border-[#6D5D96]/20">
                            {item.timeSlot || "TBD"}
                          </span>
                          <span className="text-[10px] font-semibold text-[#7B8C86] bg-[#F5EFE2]/60 px-2 py-0.5 rounded-full border border-[#E7EDE9]">
                            {item.departmentInCharge || "Operations"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#24352F]">
                          {item.activity}
                        </h4>
                        {item.operationalNotes && (
                          <p className="text-[10px] text-[#7B8C86] line-clamp-2">
                            {item.operationalNotes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Countdown Prep Tasks Section */}
      {activeWorkspaceTab === "tasks" && (
        <div className="bg-[#FCFDFC] rounded-[28px] p-5 sm:p-6 border border-[#E7EDE9] shadow-[0_24px_48px_-32px_rgba(14,42,36,0.18)] space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7EDE9] gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/30 flex items-center justify-center font-bold">
                  <ListChecks className="w-4 h-4" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[#0E2A24]">
                  Countdown Prep Tasks Checklist
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5EFE2]/70 text-[#7D6230] border border-[#E7EDE9]">
                  {tasks.length} Total
                </span>
              </div>
              <p className="text-xs text-[#7B8C86]">
                Operational milestones mapped by countdown days prior to event day.
              </p>
            </div>

            {/* Progress Pill */}
            <div className="flex items-center gap-3 bg-[#F5EFE2]/60 p-2.5 px-4 rounded-full border border-[#E7EDE9]">
              <div className="text-xs font-semibold text-[#24352F]">
                <span className="font-bold text-[#0E2A24]">{completedCount}</span> /{" "}
                {tasks.length} Completed
              </div>
              <div className="w-24 bg-[#E7EDE9] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0E2A24] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[#7D6230]">{completionPercent}%</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-[#7B8C86]" />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#E7EDE9] text-xs font-medium text-[#24352F] focus:outline-hidden focus:ring-1 focus:ring-[#B08D4F]"
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
                  className="px-3 py-1.5 rounded-full bg-white border border-[#E7EDE9] text-xs font-medium text-[#24352F] focus:outline-hidden focus:ring-1 focus:ring-[#B08D4F]"
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
                  className="px-3 py-1.5 rounded-full bg-white border border-[#E7EDE9] text-xs font-medium text-[#24352F] focus:outline-hidden focus:ring-1 focus:ring-[#B08D4F]"
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
              <Search className="w-3.5 h-3.5 text-[#7B8C86] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search prep tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 rounded-full bg-white border border-[#E7EDE9] text-xs font-medium text-[#24352F] placeholder-[#7B8C86] w-full sm:w-56 focus:outline-hidden focus:ring-1 focus:ring-[#B08D4F]"
              />
            </div>
          </div>

          {/* Bento Cards */}
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-[#F5EFE2]/30 rounded-2xl border border-dashed border-[#E7EDE9]">
              <p className="text-xs text-[#7B8C86] font-medium">
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
                radius={24}
                theme="light"
                glowColor="#B08D4F"
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
        <div className="bg-[#FCFDFC] rounded-[28px] p-5 sm:p-6 border border-[#E7EDE9] shadow-[0_24px_48px_-32px_rgba(14,42,36,0.18)] space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7EDE9] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#6D5D96]/10 text-[#6D5D96] border border-[#6D5D96]/20 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[#0E2A24]">
                  Day-of Execution Run of Show Timeline
                </h3>
                <p className="text-xs text-[#7B8C86]">
                  Synchronized hourly execution schedule for main event day ({format(parsedEventDate, "MMMM dd, yyyy")}).
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#6D5D96]/10 text-[#6D5D96] border border-[#6D5D96]/20">
              {runOfShow.length} Operational Sequence Items
            </span>
          </div>

          {runOfShow.length === 0 ? (
            <div className="p-8 text-center bg-[#F5EFE2]/30 rounded-2xl border border-dashed border-[#E7EDE9]">
              <p className="text-xs text-[#7B8C86] font-medium">
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
                  className="p-4 rounded-[20px] bg-white hover:bg-[#F5EFE2]/30 border border-[#E7EDE9] hover:border-[#B08D4F]/40 transition-all cursor-pointer shadow-2xs space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#6D5D96] bg-[#6D5D96]/10 px-2.5 py-0.5 rounded-full border border-[#6D5D96]/20">
                      {ros.timeSlot || "TBD"}
                    </span>
                    <span className="text-[11px] font-bold text-[#24352F] px-2.5 py-0.5 rounded-full bg-[#E7EDE9]/50 border border-[#E7EDE9]">
                      {ros.departmentInCharge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#0E2A24] group-hover:text-[#B08D4F] transition-colors">
                    {ros.activity}
                  </h4>

                  <p className="text-xs text-[#7B8C86] leading-relaxed">
                    {ros.operationalNotes}
                  </p>

                  {ros.dependency && (
                    <div className="pt-2 border-t border-[#E7EDE9] flex items-center justify-between text-[11px] text-[#7B8C86]">
                      <span>Dependency: <strong>{ros.dependency}</strong></span>
                      <span className="text-[#B08D4F] font-semibold group-hover:translate-x-0.5 transition-transform">
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
        <div className="bg-[#FCFDFC] rounded-[28px] p-5 sm:p-6 border border-[#E7EDE9] shadow-[0_24px_48px_-32px_rgba(14,42,36,0.18)] space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7EDE9] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F5EFE2] text-[#7D6230] border border-[#B08D4F]/30 flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[#0E2A24]">
                  Financial Allocation Dashboard & Elastic Slider
                </h3>
                <p className="text-xs text-[#7B8C86]">
                  Fine-tune departmental budget allocations and simulate contingency reserves.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetBudget}
              className="p-2 px-3.5 rounded-full text-[#7B8C86] hover:text-[#0E2A24] bg-white hover:bg-[#F5EFE2] border border-[#E7EDE9] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
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
                  className="p-4 rounded-[22px] bg-white border border-[#E7EDE9] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-xl border shrink-0 ${meta.color}`}>
                        <CategoryIcon className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-[#0E2A24]">{item.category}</h4>
                        <span className="text-[10px] text-[#7B8C86]">{item.spendStrategy}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-serif text-[#0E2A24] block">
                        ₹{Number(item.allocatedAmount).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-[#7B8C86] font-semibold">{item.percentage}%</span>
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
                      thumbColor="#B08D4F"
                      valuePosition="bubble"
                      rangeColor="#0E2A24"
                      trackColor="#E7EDE9"
                      leftIcon={<IndianRupee className="w-3.5 h-3.5 text-[#B08D4F]" />}
                      rightIcon={<TrendingUp className="w-3.5 h-3.5 text-[#B08D4F]" />}
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
              className="py-3 px-6 rounded-full bg-[#0E2A24] hover:bg-[#163830] text-[#F3E7C9] font-bold text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
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
              className={`fixed inset-0 bg-[#0E2A24]/30 backdrop-blur-[3px] transition-opacity duration-300 ease-out pointer-events-auto ${
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
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="drawer-event-title"
                className="bg-[#FCFDFC] rounded-[28px] border border-[#E7EDE9] shadow-[0_25px_70px_-12px_rgba(14,42,36,0.28)] flex flex-col h-full max-h-full overflow-hidden pointer-events-auto relative"
              >
                {/* Top Accent Gradient Line */}
                <div
                  className={`h-1.5 w-full shrink-0 ${
                    activeDrawerEvent.isMainEvent
                      ? "bg-gradient-to-r from-[#0E2A24] via-[#B08D4F] to-[#0E2A24]"
                      : activeDrawerEvent.priority === "high"
                      ? "bg-gradient-to-r from-[#B5473C] via-[#B08D4F] to-[#B5473C]"
                      : activeDrawerEvent.priority === "medium"
                      ? "bg-gradient-to-r from-[#3F5F8F] via-[#B08D4F] to-[#3F5F8F]"
                      : activeDrawerEvent.runOfShowItem
                      ? "bg-gradient-to-r from-[#6D5D96] via-[#B08D4F] to-[#6D5D96]"
                      : "bg-gradient-to-r from-[#0E2A24] to-[#B08D4F]"
                  }`}
                />

                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#E7EDE9] bg-white shrink-0">
                  <div className="flex items-center gap-2.5">
                    {/* Pulsing Status Dot */}
                    <span className="relative flex h-2.5 w-2.5">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          activeDrawerEvent.isMainEvent
                            ? "bg-[#B08D4F]"
                            : activeDrawerEvent.priority === "high"
                            ? "bg-[#B5473C]"
                            : activeDrawerEvent.priority === "medium"
                            ? "bg-[#3F5F8F]"
                            : "bg-[#0E2A24]"
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          activeDrawerEvent.isMainEvent
                            ? "bg-[#B08D4F]"
                            : activeDrawerEvent.priority === "high"
                            ? "bg-[#B5473C]"
                            : activeDrawerEvent.priority === "medium"
                            ? "bg-[#3F5F8F]"
                            : "bg-[#0E2A24]"
                        }`}
                      />
                    </span>
                    <h3 id="drawer-event-title" className="text-xs sm:text-sm font-bold text-[#0E2A24] tracking-tight">
                      {activeDrawerEvent.isMainEvent
                        ? "Target Event Details"
                        : activeDrawerEvent.runOfShowItem
                        ? "Day-of Run of Show Item"
                        : "Countdown Prep Task Details"}
                    </h3>
                    {currentEventIdx >= 0 && (
                      <span className="text-[10px] font-bold text-[#7D6230] bg-[#F5EFE2] px-2 py-0.5 rounded-full border border-[#E7EDE9]">
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
                      className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                        hasPrev
                          ? "text-[#24352F] hover:text-[#0E2A24] hover:bg-[#F5EFE2] border-[#E7EDE9]"
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
                      className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                        hasNext
                          ? "text-[#24352F] hover:text-[#0E2A24] hover:bg-[#F5EFE2] border-[#E7EDE9]"
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
                      className={`p-1.5 px-2 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                        copiedTask
                          ? "bg-[#F5EFE2] text-[#7D6230] border-[#B08D4F]"
                          : "text-[#7B8C86] hover:text-[#0E2A24] hover:bg-[#F5EFE2] border-[#E7EDE9]"
                      }`}
                      title="Copy Task Brief to Clipboard"
                      aria-label="Copy Task Details"
                    >
                      {copiedTask ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-[#7D6230]" />
                          <span className="text-[10px] font-bold text-[#7D6230] hidden sm:inline">
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
                      className="text-[#7B8C86] hover:text-[#0E2A24] cursor-pointer p-1.5 rounded-full hover:bg-[#F5EFE2] transition-colors border border-transparent hover:border-[#E7EDE9] flex items-center"
                      title="Close Panel (Esc)"
                      aria-label="Close Details"
                    >
                      <X className="w-4 h-4" />
                      <kbd className="text-[9px] font-bold text-[#7B8C86] bg-[#F5EFE2] border border-[#E7EDE9] px-1 py-0.5 rounded-md ml-1 hidden sm:inline-block">
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
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5EFE2]/60 border border-[#E7EDE9] text-[11px] font-bold text-[#24352F]">
                        <Building2 className="w-3.5 h-3.5 text-[#B08D4F]" />
                        <span>{extractedDept}</span>
                      </span>
                    ) : null}

                    {activeDrawerEvent.task && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isDone
                            ? "bg-[#F5EFE2] text-[#7D6230] border-[#B08D4F]/40"
                            : "bg-[#F5EFE2]/60 text-[#24352F] border-[#E7EDE9]"
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#7D6230]" />
                            <span>Completed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-[#B08D4F]" />
                            <span>Action Pending</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Clean Title */}
                  <div>
                    <p className="text-[#7B8C86] font-semibold uppercase text-[10px] tracking-wider">
                      Title
                    </p>
                    <h2 className="font-[family-name:var(--font-display)] text-base sm:text-lg font-medium text-[#0E2A24] mt-0.5 tracking-tight leading-snug">
                      {cleanTitle}
                    </h2>
                  </div>

                  {/* Countdown & Execution Timing Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[#F5EFE2]/40 p-3 rounded-2xl border border-[#E7EDE9] shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[#7B8C86]">
                        <Clock className="w-3 h-3 text-[#B08D4F]" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Timeline
                        </span>
                      </div>
                      <p className="font-bold text-xs text-[#0E2A24] mt-1.5">
                        {activeDrawerEvent.daysBeforeEvent !== undefined
                          ? `T - ${activeDrawerEvent.daysBeforeEvent} Days Before Event`
                          : "Main Event Execution Day"}
                      </p>
                      <span className="text-[10px] text-[#7B8C86] mt-0.5 block">
                        Milestone prep phase
                      </span>
                    </div>

                    <div className="bg-[#F5EFE2]/40 p-3 rounded-2xl border border-[#E7EDE9] shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[#7B8C86]">
                        <CalendarDays className="w-3 h-3 text-[#B08D4F]" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Scheduled Date
                        </span>
                      </div>
                      <p className="font-bold text-xs text-[#0E2A24] mt-1.5">
                        {format(activeDrawerEvent.start, "EEE, MMM dd, yyyy")}
                      </p>
                      <span className="text-[10px] text-[#7B8C86] mt-0.5 block">
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
                            className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${actionMeta.badgeBg}`}
                          >
                            <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{actionMeta.label}</span>
                          </span>
                        );
                      })()}
                      {activeDrawerEvent.priority && (
                        <span
                          className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
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
                  <div className="bg-[#F5EFE2]/50 p-3.5 rounded-2xl border border-[#B08D4F]/30 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#7D6230]">
                      <Sparkles className="w-3.5 h-3.5 text-[#B08D4F]" />
                      <span className="font-bold uppercase text-[10px] tracking-wider">
                        Operational Guidance / Brief
                      </span>
                    </div>
                    <div className="text-[#24352F] text-xs leading-relaxed font-normal">
                      {activeDrawerEvent.actionBrief ||
                        activeDrawerEvent.description ||
                        "Standard operational milestone execution."}
                    </div>
                  </div>

                  {/* Milestone Budget Allocation Card */}
                  {(activeDrawerEvent.estimatedCost !== undefined ||
                    activeDrawerEvent.budget) && (
                    <div className="bg-[#F5EFE2]/40 p-3.5 rounded-2xl border border-[#B08D4F]/30 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[#7D6230]">
                          <span className="w-5 h-5 rounded-full bg-[#B08D4F]/20 flex items-center justify-center font-bold">
                            <IndianRupee className="w-3 h-3 text-[#7D6230]" />
                          </span>
                          <span className="text-xs font-bold text-[#7D6230]">
                            {activeDrawerEvent.isMainEvent
                              ? "Total Event Budget"
                              : "Milestone Budget Allocation"}
                          </span>
                        </div>
                        <p className="font-bold font-serif text-base text-[#0E2A24]">
                          ₹{eventCostNum.toLocaleString("en-IN")}
                        </p>
                      </div>

                      {percentOfBudget > 0 && !activeDrawerEvent.isMainEvent && (
                        <div className="pt-1 border-t border-[#E7EDE9] space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-[#7B8C86] font-medium">
                            <span>Share of Total Budget</span>
                            <span className="font-bold text-[#0E2A24]">{percentOfBudget}%</span>
                          </div>
                          <div className="w-full bg-[#E7EDE9] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#0E2A24] h-1.5 rounded-full transition-all duration-500 ease-out"
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
                        className={`w-full py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-xs ${
                          isDone
                            ? "bg-[#E7EDE9] text-[#24352F] hover:bg-[#d8e0da] border-[#CBD5E1]"
                            : "bg-[#0E2A24] hover:bg-[#163830] text-[#F3E7C9] border-[#0E2A24] hover:shadow-md active:scale-[0.99]"
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
                <div className="px-5 sm:px-6 py-3 border-t border-[#E7EDE9] bg-white shrink-0 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleFocusCalendar(activeDrawerEvent.start)}
                    className="flex-1 py-2 rounded-full bg-[#0E2A24] text-[#F3E7C9] font-bold text-xs hover:bg-[#163830] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    title="Focus Calendar on this Date"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-[#B08D4F]" />
                    <span>Focus on Calendar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="flex-1 py-2 rounded-full bg-white text-[#7B8C86] hover:text-[#0E2A24] font-bold text-xs hover:bg-[#F5EFE2] transition-all cursor-pointer border border-[#E7EDE9]"
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
          title: activeEventName || eventName,
          eventType: activeEventType || eventType,
          eventBudget: activeEventBudget || eventBudget,
          eventDate: activeEventDate || eventDate,
          tier: activeTier || tier,
          guestCount: activeGuestCount || guestCount,
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
          // Update in-memory allUserEvents list
          setAllUserEvents((prev) =>
            prev.map((ev, idx) => {
              if (idx === currentEventIndex) {
                return {
                  ...ev,
                  ...updatedFields,
                };
              }
              return ev;
            })
          );
        }}
        onFocusDate={handleFocusCalendar}
      />
    </div>
  );
};
