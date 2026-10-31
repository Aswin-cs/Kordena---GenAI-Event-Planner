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
  Loader2,
  Menu,
  ArrowUpRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  parseTargetEventDate,
  calculateDaysUntilEvent,
  parseTimeSlotToHours,
  computeTaskDate,
} from "@/lib/calendar-utils";
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
        badgeBg: "bg-[#FDF0F4] text-[#9F224E] border-[#D44372]/30",
      };
    case "arrange":
      return {
        label: "Logistics",
        icon: Handshake,
        badgeBg: "bg-[#FDF0F4] text-[#9F224E] border-[#D44372]/30",
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
        badgeBg: "bg-[#FDF0F4]/60 text-[#2E131E] border-[#F7D6DF]",
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
        badge: "bg-[#FDF0F4]/60 text-[#9F224E] border-[#F7D6DF]",
        dot: "bg-[#D44372]",
        border: "border-[#F7D6DF]",
      };
  }
}

export function getCategoryMeta(category: string) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("food") || cat.includes("cater") || cat.includes("dining") || cat.includes("beverage") || cat.includes("hospitality")) {
    return { icon: UtensilsCrossed, color: "text-[#9F224E] bg-[#FDF0F4] border-[#D44372]/30" };
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
    return { icon: Wrench, color: "text-[#2E131E] bg-[#FDF0F4] border-[#F7D6DF]" };
  }
  if (cat.includes("security") || cat.includes("permit") || cat.includes("license") || cat.includes("safety") || cat.includes("contingency")) {
    return { icon: ShieldCheck, color: "text-[#4F7D68] bg-[#F0F5F2] border-[#4F7D68]/30" };
  }
  return { icon: Layers, color: "text-[#8A6775] bg-[#FDF0F4]/60 border-[#F7D6DF]" };
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState<boolean>(false);
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState<boolean>(false);

  // User events list fetched from UserStatus model (/api/user-status)
  const [allUserEvents, setAllUserEvents] = useState<any[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);

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

  // Smooth mobile slide-over right menu animation lifecycle
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuMounted(true);
      const timer = setTimeout(() => {
        setIsMobileMenuVisible(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsMobileMenuVisible(false);
      const timer = setTimeout(() => {
        setIsMobileMenuMounted(false);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [isMobileMenuOpen]);

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
    const minDelay = new Promise((resolve) => setTimeout(resolve, 550));

    Promise.all([
      fetch("/api/user-status")
        .then((res) => res.json())
        .catch((err) => {
          console.warn("Could not load user-status for calendar:", err);
          return { success: false };
        }),
      minDelay,
    ])
      .then(([data]) => {
        if (!isMounted || !data?.success || !Array.isArray(data?.userStatuses)) return;
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

  // Compute the parsed event Date using centralized calendar utils
  const parsedEventDate = useMemo(() => {
    return parseTargetEventDate(activeEventDate || eventDate);
  }, [activeEventDate, eventDate]);

  // Controlled date state so Next, Back, and Today buttons work properly
  const [currentDate, setCurrentDate] = useState<Date>(parsedEventDate);

  // Sync internal calendar date if parsedEventDate changes
  useEffect(() => {
    if (parsedEventDate && !isNaN(parsedEventDate.getTime())) {
      setCurrentDate(parsedEventDate);
    }
  }, [parsedEventDate.getTime()]);

  // Days until target event countdown using centralized calendar utils
  const daysUntilEvent = useMemo(() => {
    return calculateDaysUntilEvent(parsedEventDate);
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
        const taskDate = computeTaskDate(task, parsedEventDate);

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
      if (e.key === "Escape") {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          return;
        }
        if (selectedEvent) {
          setSelectedEvent(null);
          return;
        }
      }
      if (!selectedEvent) return;
      if (e.key === "ArrowLeft" && currentEventIdx > 0) {
        handleNavigateEvent("prev");
      } else if (e.key === "ArrowRight" && currentEventIdx >= 0 && currentEventIdx < eventsList.length - 1) {
        handleNavigateEvent("next");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent, currentEventIdx, eventsList, isMobileMenuOpen]);

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
    const taskDate = computeTaskDate(task, parsedEventDate);

    setCurrentDate(taskDate);
    setCurrentView("month");

    // Open detail modal
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
      const taskDate = computeTaskDate(task, parsedEventDate);

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
                      ? "bg-[#D44372] border-[#D44372] text-white"
                      : "border-[#CBD5E1] bg-white hover:border-[#D44372]"
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDF0F4]/60 text-[#2E131E] border border-[#F7D6DF]">
                      {task.department}
                    </span>
                  </div>

                  <h4
                    className={`text-xs font-bold leading-snug transition-colors line-clamp-1 ${
                      isDone ? "line-through text-[#8A6775]" : "text-[#2E131E]"
                    }`}
                  >
                    {task.title}
                  </h4>

                  <p className="text-[11px] text-[#8A6775] line-clamp-2 leading-relaxed">
                    {task.actionBrief}
                  </p>
                </div>
              </div>

              {/* Countdown Badge */}
              <div className="text-right shrink-0">
                <span className="px-2 py-0.5 rounded-full bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/30 text-[10px] font-bold whitespace-nowrap block">
                  T - {days} Days
                </span>
                <span className="text-[10px] text-[#8A6775] mt-0.5 block font-medium">
                  {format(taskDate, "MMM dd")}
                </span>
              </div>
            </div>

            {/* Card Bottom Meta */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#F7D6DF] text-[11px] mt-auto">
              <div className="flex items-center gap-1 font-bold text-[#2E131E]">
                <IndianRupee className="w-3 h-3 text-[#D44372]" />
                <span className="font-serif">₹{Number(task.estimatedCost || 0).toLocaleString("en-IN")}</span>
              </div>

              <div className="text-[11px] font-bold text-[#D44372] hover:text-[#9F224E] flex items-center gap-1 cursor-pointer">
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

    // Select the best indicator icon for this event
    const EventIcon = useMemo(() => {
      if (event.isMainEvent) return Star;
      if (event.runOfShowItem) return Zap;
      if (isDone) return CheckCircle2;
      if (event.department) {
        return getCategoryMeta(event.department).icon;
      }
      if (event.actionType) {
        return getActionMeta(event.actionType).icon;
      }
      return ListChecks;
    }, [event.isMainEvent, event.runOfShowItem, isDone, event.department, event.actionType]);

    return (
      <div className="kcal-ev-inner justify-center sm:justify-start" title={event.title}>
        <EventIcon
          className={`w-3 h-3 sm:w-3 sm:h-3 shrink-0 ${
            event.isMainEvent ? "fill-current" : ""
          }`}
        />
        <span className="truncate hidden sm:inline">{event.title}</span>
      </div>
    );
  };

  if (isLoadingEvents) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-[580px] animate-in fade-in duration-300">
        <div className="bg-white rounded-[32px] p-8 sm:p-12 border border-[#F7D6DF] shadow-[0_24px_48px_-32px_rgba(212,67,114,0.18)] max-w-md w-full flex flex-col items-center text-center space-y-5">
          {/* Pulsing Icon */}
          <img
            src="/kordena-mark-reversed.svg"
            alt="Kordena Logo"
            className="w-16 h-16 rounded-2xl shadow-lg shadow-[#D44372]/25 object-contain animate-pulse"
          />

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D44372]" />
              Kordena Master Calendar
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[#2E131E] tracking-tight">
              Loading Calendar Architecture
            </h2>
            <p className="text-xs sm:text-sm text-[#8A6775] mt-1.5 leading-relaxed">
              Synchronizing countdown milestones, run-of-show timeline & department budgets for{" "}
              <strong className="text-[#2E131E]">{activeEventName || eventName || "your event"}</strong>...
            </p>
          </div>

          {/* Shimmer Bar */}
          <div className="w-full bg-[#F7D6DF] h-2 rounded-full overflow-hidden border border-[#F7D6DF]">
            <div className="h-full bg-gradient-to-r from-[#D44372] to-[#E05A87] rounded-full animate-pulse w-3/4" />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#2E131E]">
            <Loader2 className="w-4 h-4 animate-spin text-[#D44372]" />
            <span>Harmonizing schedule & live canvas...</span>
          </div>

          {/* Modules Preview Pills */}
          <div className="grid grid-cols-3 gap-2 w-full pt-3 border-t border-[#F7D6DF]">
            <div className="p-2.5 rounded-2xl bg-[#FDF0F4]/70 border border-[#F7D6DF]/60 text-center">
              <p className="text-[10px] text-[#8A6775] font-medium">Grid</p>
              <p className="text-xs font-bold text-[#2E131E] mt-0.5">Monthly</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#FDF0F4]/70 border border-[#F7D6DF]/60 text-center">
              <p className="text-[10px] text-[#8A6775] font-medium">Timeline</p>
              <p className="text-xs font-bold text-[#2E131E] mt-0.5">Run of Show</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#FDF0F4]/70 border border-[#F7D6DF]/60 text-center">
              <p className="text-[10px] text-[#8A6775] font-medium">Metrics</p>
              <p className="text-xs font-bold text-[#2E131E] mt-0.5">Budget</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Executive Command Header Bar */}
      <div className="bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 border border-[#F7D6DF] shadow-[0_24px_48px_-32px_rgba(212,67,114,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              onClick={onBackToStepper}
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-white hover:bg-[#FDF0F4] text-[#2E131E] border border-[#F7D6DF] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs group font-semibold text-xs"
              title="Back to Stepper Setup"
            >
              <ArrowLeft className="w-4 h-4 text-[#8A6775] group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <h1 className="font-[family-name:var(--font-display)] text-xl sm:text-3xl font-medium text-[#2E131E] tracking-tight">
              {activeEventName || eventName || "Annual Global Tech Summit 2026"}
            </h1>

            {/* Event Switcher: Previous & Next Buttons */}
            {effectiveEvents.length > 1 ? (
              <div
                data-event-dropdown
                className="relative inline-flex items-center gap-1 bg-[#FDF0F4]/60 border border-[#F7D6DF] p-1 rounded-full shadow-2xs"
              >
                <button
                  type="button"
                  onClick={handlePrevEvent}
                  aria-label={`Switch to previous blueprint (${effectiveEvents[(currentEventIndex - 1 + effectiveEvents.length) % effectiveEvents.length]?.eventName || "Previous"})`}
                  className="p-1 sm:p-1.5 rounded-full hover:bg-white text-[#2E131E] hover:text-[#2E131E] transition-all cursor-pointer shadow-2xs active:scale-95 group"
                  title={`Previous Event (${effectiveEvents[(currentEventIndex - 1 + effectiveEvents.length) % effectiveEvents.length]?.eventName || "Previous"}) [Alt+←]`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsEventDropdownOpen((prev) => !prev)}
                  aria-expanded={isEventDropdownOpen}
                  aria-label={`Current blueprint: ${activeEventName || eventName}, ${currentEventIndex + 1} of ${effectiveEvents.length}. Click to view all.`}
                  className="px-2.5 py-0.5 rounded-full hover:bg-white text-[11px] font-bold text-[#2E131E] flex items-center gap-1.5 transition-all cursor-pointer select-none"
                  title="Click to view all events"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-[#D44372]" />
                  <span>{currentEventIndex + 1} of {effectiveEvents.length}</span>
                  <ChevronDown className="w-3 h-3 text-[#8A6775]" />
                </button>

                <button
                  type="button"
                  onClick={handleNextEvent}
                  aria-label={`Switch to next blueprint (${effectiveEvents[(currentEventIndex + 1) % effectiveEvents.length]?.eventName || "Next"})`}
                  className="p-1 sm:p-1.5 rounded-full hover:bg-white text-[#2E131E] hover:text-[#2E131E] transition-all cursor-pointer shadow-2xs active:scale-95 group"
                  title={`Next Event (${effectiveEvents[(currentEventIndex + 1) % effectiveEvents.length]?.eventName || "Next"}) [Alt+→]`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dropdown Menu of All Events */}
                {isEventDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#F7D6DF] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-[#F7D6DF] mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A6775]">
                        Saved Event Blueprints ({effectiveEvents.length})
                      </span>
                      <span className="text-[10px] text-[#8A6775]/70">Alt + ← / →</span>
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
                                ? "bg-[#FDF0F4] text-[#2E131E] font-bold border border-[#D44372]/40"
                                : "hover:bg-[#FDF0F4]/50 text-[#2E131E]"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold truncate">
                                {ev.eventName || "Untitled Event"}
                              </p>
                              <p className="text-[10px] text-[#8A6775] truncate">
                                {ev.eventType || "Event"} {evDateStr ? `• ${evDateStr}` : ""}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#D44372] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-[#FDF0F4]/60 border border-[#F7D6DF] px-3 py-1 rounded-full text-[11px] font-bold text-[#8A6775]">
                <CalendarDays className="w-3.5 h-3.5 text-[#D44372]" />
                <span>1 Active Blueprint</span>
              </div>
            )}

            {/* Badges: Visible on Desktop, Hidden on Mobile */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D44372] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D44372]" />
              </span>
              Production Blueprint Active
            </span>

            {daysUntilEvent !== undefined && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDF0F4]/70 text-[#2E131E] border border-[#F7D6DF]">
                <Clock className="w-3.5 h-3.5 text-[#D44372]" />
                {daysUntilEvent > 0
                  ? `T - ${daysUntilEvent} Days To Go`
                  : daysUntilEvent === 0
                  ? "Target Event Day"
                  : "Event Concluded"}
              </span>
            )}
          </div>

          {/* Small Menu Button for Mobile Only with tactile animation */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open Event Options & Telemetry Menu"
            className="sm:hidden h-8 px-3 rounded-full bg-[#FDF0F4] hover:bg-[#FCE4EC] active:scale-95 text-[#9F224E] border border-[#D44372]/40 transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs font-bold text-xs group"
          >
            <Menu className="w-4 h-4 text-[#D44372] transition-transform duration-200 group-hover:rotate-12 group-active:scale-90" />
            <span>Menu</span>
          </button>
        </div>


        {/* Action Button Cluster - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {onNewEvent && (
            <button
              onClick={onNewEvent}
              className="h-10 px-4 rounded-full bg-[#FDF0F4] hover:bg-[#FCE4EC] text-[#9F224E] border border-[#D44372] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs font-bold text-xs"
              title="Create New Event Blueprint"
            >
              <Plus className="w-4 h-4 text-[#9F224E] stroke-[2.5]" />
              <span>New Blueprint</span>
            </button>
          )}

        </div>
      </div>

      {/* Executive Horizon Telemetry Ribbon */}
      <div className="hidden sm:block bg-white rounded-[24px] sm:rounded-[28px] border border-[#F7D6DF] shadow-[0_12px_32px_-24px_rgba(212,67,114,0.12)] p-4 sm:p-5 transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F7D6DF] gap-3 sm:gap-0">
          {/* Segment 1: Target Date */}
          <div className="sm:px-4 first:sm:pl-1 flex flex-col justify-between py-1">
            <div className="flex items-center justify-between text-[#8A6775] mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-[#8A6775]">
                <CalendarIcon className="w-3.5 h-3.5 text-[#D44372]" /> Target Date
              </span>
              <span className="text-[10px] font-semibold bg-[#FDF0F4] text-[#9F224E] px-2.5 py-0.5 rounded-full border border-[#F7D6DF]">
                {activeEventType || eventType || "Event"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-[#2E131E] font-serif tracking-tight">
                {format(parsedEventDate, "EEE, MMM dd, yyyy")}
              </p>
              {daysUntilEvent !== undefined && (
                <span className="text-[10px] font-bold text-[#9F224E] bg-[#FDF0F4] px-2 py-0.5 rounded-full border border-[#D44372]/30">
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
            <div className="flex items-center justify-between text-[#8A6775] mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-[#8A6775]">
                <Sparkles className="w-3.5 h-3.5 text-[#D44372]" /> Blueprint Tier
              </span>
              <span className="text-[10px] font-bold text-white bg-[#D44372] px-2.5 py-0.5 rounded-full border border-[#D44372]">
                {activeTier || tier || "Starter"}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#2E131E] truncate">
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
            <div className="flex items-center justify-between text-[#8A6775] mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-[#8A6775]">
                <IndianRupee className="w-3.5 h-3.5 text-[#D44372]" /> Budget Health
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  budgetDelta > 0
                    ? "bg-[#FDF0F4] text-[#9F224E] border-[#D44372]/40"
                    : budgetDelta === 0
                    ? "bg-[#FDF0F4]/70 text-[#2E131E] border-[#F7D6DF]"
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
              <p className="text-sm font-bold text-[#2E131E] font-serif">
                ₹{targetBudget.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-[#8A6775]">
                ₹{totalAllocated.toLocaleString("en-IN")} mapped
              </span>
            </div>
            <div className="w-full bg-[#F7D6DF] h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  budgetDelta < 0 ? "bg-[#B5473C]" : "bg-[#D44372]"
                }`}
                style={{
                  width: `${Math.min(100, (totalAllocated / Math.max(1, targetBudget)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Segment 4: Prep Velocity */}
          <div className="sm:px-4 last:sm:pr-1 flex flex-col justify-between py-1">
            <div className="flex items-center justify-between text-[#8A6775] mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-[#8A6775]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4F7D68]" /> Prep Velocity
              </span>
              <span className="text-[10px] font-bold text-[#9F224E] bg-[#FDF0F4] px-2.5 py-0.5 rounded-full border border-[#D44372]/40">
                {completionPercent}% Done
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-bold text-[#2E131E] font-serif">
                {completedCount} of {tasks.length} Done
              </p>
              <span className="text-[10px] text-[#8A6775]">
                {tasks.length - completedCount} pending
              </span>
            </div>
            <div className="w-full bg-[#F7D6DF] h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-[#D44372] h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Workspace Segmented Tabs */}
      <div className="hidden sm:flex bg-white p-2 rounded-[24px] sm:rounded-full border border-[#F7D6DF] shadow-2xs items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 bg-[#FDF0F4] p-1 rounded-full">
          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("calendar")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeWorkspaceTab === "calendar"
                ? "bg-[#D44372] text-white shadow-xs"
                : "text-[#8A6775] hover:text-[#2E131E] hover:bg-white/60"
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
                ? "bg-[#D44372] text-white shadow-xs"
                : "text-[#8A6775] hover:text-[#2E131E] hover:bg-white/60"
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Countdown Prep Tasks</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeWorkspaceTab === "tasks"
                  ? "bg-white/20 text-white"
                  : "bg-white text-[#8A6775] border border-[#F7D6DF]"
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
                  ? "bg-[#D44372] text-white shadow-xs"
                  : "text-[#8A6775] hover:text-[#2E131E] hover:bg-white/60"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Day-of Run of Show</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeWorkspaceTab === "runofshow"
                    ? "bg-white/20 text-white"
                    : "bg-white text-[#8A6775] border border-[#F7D6DF]"
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
                ? "bg-[#D44372] text-white shadow-xs"
                : "text-[#8A6775] hover:text-[#2E131E] hover:bg-white/60"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 hidden sm:inline-block" />
            <span>Budget Allocator</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeWorkspaceTab === "budget"
                  ? "bg-white/20 text-white"
                  : "bg-white text-[#8A6775] border border-[#F7D6DF]"
              }`}
            >
              {editableBudget.length}
            </span>
          </button>
        </div>

        {/* If in Calendar tab, provide Layout Mode Switcher (Visible on desktop XL+) */}
        {activeWorkspaceTab === "calendar" && (
          <div className="hidden xl:flex items-center gap-1 bg-[#FDF0F4] p-1 rounded-full border border-[#F7D6DF]">
            <button
              type="button"
              onClick={() => setIsCalendarSplitView(true)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isCalendarSplitView
                  ? "bg-[#D44372] text-white shadow-2xs"
                  : "text-[#8A6775] hover:text-[#2E131E]"
              }`}
              title="Split View (Calendar + Budget Panel)"
            >
              <Columns className="w-3 h-3 text-[#D44372]" />
              <span>Split Companion</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCalendarSplitView(false)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                !isCalendarSplitView
                  ? "bg-[#D44372] text-white shadow-2xs"
                  : "text-[#8A6775] hover:text-[#2E131E]"
              }`}
              title="Full Calendar Stage (Expanded)"
            >
              <Maximize2 className="w-3 h-3 text-[#D44372]" />
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
                <div className="kcal-controls-top flex items-center justify-between w-full sm:w-auto gap-2.5">
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
                    <span>Event day</span>
                  </button>
                </div>

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
            <div className="min-h-[580px] sm:min-h-[700px] lg:min-h-[780px] h-[600px] sm:h-[740px] lg:h-[800px] w-full calendar-container">
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
                popupOffset={{ x: 10, y: 10 }}
                views={["month", "week", "day", "agenda"]}
                formats={{
                  weekdayFormat: (date: Date) => format(date, "EEE"),
                }}
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

          {/* Right Companion: Operations Deck (when in split mode - hidden on mobile, visible on desktop XL+) */}
          {isCalendarSplitView && (
            <div className="hidden xl:block xl:col-span-4 bg-white rounded-[28px] p-5 sm:p-6 border border-[#F7D6DF] shadow-[0_24px_48px_-32px_rgba(212,67,114,0.18)] space-y-4 xl:sticky xl:top-6">
              {/* Operations Deck Header & Micro-Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F7D6DF] gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="hidden sm:flex w-8 h-8 rounded-full bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/30 items-center justify-center font-bold">
                    {splitCompanionTab === "budget" ? (
                      <SlidersHorizontal className="w-4 h-4" />
                    ) : splitCompanionTab === "tasks" ? (
                      <ListChecks className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-[#2E131E]">Operations Deck</h2>
                    <p className="text-[11px] text-[#8A6775]">
                      {splitCompanionTab === "budget"
                        ? "Fine-tune allocations with Elastic Slider"
                        : splitCompanionTab === "tasks"
                        ? "Live countdown radar & milestone sync"
                        : "Day-of execution schedule & timing"}
                    </p>
                  </div>
                </div>

                {/* Micro Tab Switcher */}
                <div className="flex items-center gap-1 bg-[#FDF0F4] p-1 rounded-full border border-[#F7D6DF] text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSplitCompanionTab("budget")}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      splitCompanionTab === "budget"
                        ? "bg-[#D44372] text-white shadow-2xs"
                        : "text-[#8A6775] hover:text-[#2E131E]"
                    }`}
                    title="Budget Breakdown Allocator"
                  >
                    <IndianRupee className="w-3 h-3 text-[#D44372]" />
                    <span>Budget</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitCompanionTab("tasks")}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      splitCompanionTab === "tasks"
                        ? "bg-[#D44372] text-white shadow-2xs"
                        : "text-[#8A6775] hover:text-[#2E131E]"
                    }`}
                    title="Countdown Prep Tasks Radar"
                  >
                    <ListChecks className="w-3 h-3 text-[#D44372]" />
                    <span>Tasks ({tasks.length})</span>
                  </button>
                  {runOfShow.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSplitCompanionTab("runofshow")}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        splitCompanionTab === "runofshow"
                          ? "bg-[#D44372] text-white shadow-2xs"
                          : "text-[#8A6775] hover:text-[#2E131E]"
                      }`}
                      title="Day-of Run of Show"
                    >
                      <Zap className="w-3 h-3 text-[#D44372]" />
                      <span>Day-of ({runOfShow.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Current Event / Selected Milestone Context */}
              <div className="p-3.5 rounded-2xl bg-[#FDF0F4]/40 border border-[#F7D6DF] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A6775]">
                    Active Blueprint
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9F224E]">
                    <IndianRupee className="w-3 h-3 text-[#D44372]" />
                    ₹{targetBudget.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#2E131E] truncate">
                  {activeEventName || eventName || "Current Event"}
                </p>
                {selectedEvent ? (
                  <div className="pt-2 mt-1.5 border-t border-[#F7D6DF] flex items-center justify-between text-[11px]">
                    <span className="text-[#2E131E] font-medium truncate flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#D44372] inline-block shrink-0" />
                      <span className="truncate">Selected: <strong>{selectedEvent.title}</strong></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(null)}
                      className="text-[10px] text-[#8A6775] hover:text-[#2E131E] underline ml-2 shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#8A6775]">
                    Click any calendar event to focus details here.
                  </p>
                )}
              </div>

              {/* TAB 1: BUDGET BREAKDOWN ALLOCATOR */}
              {splitCompanionTab === "budget" && (
                <div className="space-y-4">
                  {/* Budget Health Progress */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-gradient-to-br from-[#F5EFE2]/60 to-[#FFFFFF] border border-[#D44372]/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#2E131E]">Total Allocated:</span>
                      <span className="font-serif font-bold text-sm text-[#2E131E]">
                        ₹{totalAllocated.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#F7D6DF] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          budgetDelta < 0 ? "bg-[#B5473C]" : "bg-[#D44372]"
                        }`}
                        style={{
                          width: `${Math.min(100, (totalAllocated / Math.max(1, targetBudget)) * 100)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8A6775]">
                        {((totalAllocated / Math.max(1, targetBudget)) * 100).toFixed(0)}% of target budget
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${
                          budgetDelta > 0
                            ? "bg-[#FDF0F4] text-[#9F224E] border-[#D44372]/40"
                            : budgetDelta === 0
                            ? "bg-[#FDF0F4]/70 text-[#2E131E] border-[#F7D6DF]"
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
                              ? "bg-[#FDF0F4]/40 border-[#D44372] shadow-xs ring-1 ring-[#D44372]/30"
                              : "bg-white hover:bg-[#FDF0F4]/20 border-[#F7D6DF]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`p-1.5 rounded-xl border shrink-0 ${meta.color}`}>
                                <CategoryIcon className="w-3.5 h-3.5" />
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#2E131E] truncate">
                                  {item.category}
                                </h4>
                                {item.spendStrategy && (
                                  <p className="text-[10px] text-[#8A6775] line-clamp-1">
                                    {item.spendStrategy}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold font-serif text-[#2E131E] block">
                                ₹{Number(item.allocatedAmount).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-[#8A6775] font-semibold">
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
                              thumbColor="#D44372"
                              valuePosition="bubble"
                              rangeColor="#D44372"
                              trackColor="#E7EDE9"
                              leftIcon={<IndianRupee className="w-3.5 h-3.5 text-[#D44372]" />}
                              rightIcon={<TrendingUp className="w-3.5 h-3.5 text-[#D44372]" />}
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
                  <div className="pt-2 border-t border-[#F7D6DF] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetBudget}
                      className="p-2.5 rounded-full text-[#8A6775] hover:text-[#2E131E] hover:bg-[#FDF0F4] border border-[#F7D6DF] transition-all cursor-pointer flex items-center justify-center shrink-0"
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
                          : "bg-[#D44372] hover:bg-[#163830] text-white"
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
                    <span className="text-[#8A6775] font-medium">
                      {completedCount} of {tasks.length} Completed
                    </span>
                    <span className="font-bold text-[#9F224E] bg-[#FDF0F4] px-2.5 py-0.5 rounded-full border border-[#D44372]/40 text-[10px]">
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
                              ? "bg-[#FDF0F4]/20 border-[#F7D6DF] opacity-75"
                              : "bg-white hover:bg-[#FAFCFB] border-[#F7D6DF] shadow-2xs"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleToggleTaskCompleted(taskId, e)}
                            className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isDone
                                ? "bg-[#D44372] border-[#D44372] text-white shadow-2xs"
                                : "border-[#CBD5E1] bg-white hover:border-[#D44372]"
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h4
                                className={`text-xs font-bold truncate ${
                                  isDone
                                    ? "line-through text-[#8A6775]"
                                    : "text-[#2E131E]"
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

                            <p className="text-[10px] text-[#8A6775] line-clamp-1">
                              {task.actionBrief || (task as any).description}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#8A6775]">
                              <span className="flex items-center gap-1 font-medium">
                                <CategoryIcon className="w-3 h-3 text-[#D44372]" />
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
                    <span className="text-[#8A6775] font-medium">Day-of Schedule</span>
                    <span className="font-bold text-[#6D5D96] bg-[#6D5D96]/10 px-2.5 py-0.5 rounded-full border border-[#6D5D96]/20 text-[10px]">
                      {runOfShow.length} Items
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {runOfShow.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white border border-[#F7D6DF] shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-[#6D5D96] bg-[#6D5D96]/10 px-2 py-0.5 rounded-full border border-[#6D5D96]/20">
                            {item.timeSlot || "TBD"}
                          </span>
                          <span className="text-[10px] font-semibold text-[#8A6775] bg-[#FDF0F4]/60 px-2 py-0.5 rounded-full border border-[#F7D6DF]">
                            {item.departmentInCharge || "Operations"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#2E131E]">
                          {item.activity}
                        </h4>
                        {item.operationalNotes && (
                          <p className="text-[10px] text-[#8A6775] line-clamp-2">
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
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#F7D6DF] shadow-[0_24px_48px_-32px_rgba(212,67,114,0.18)] space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#F7D6DF] gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/30 flex items-center justify-center font-bold">
                  <ListChecks className="w-4 h-4" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[#2E131E]">
                  Countdown Prep Tasks Checklist
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FDF0F4]/70 text-[#9F224E] border border-[#F7D6DF]">
                  {tasks.length} Total
                </span>
              </div>
              <p className="text-xs text-[#8A6775]">
                Operational milestones mapped by countdown days prior to event day.
              </p>
            </div>

            {/* Progress Pill */}
            <div className="flex items-center gap-3 bg-[#FDF0F4]/60 p-2.5 px-4 rounded-full border border-[#F7D6DF]">
              <div className="text-xs font-semibold text-[#2E131E]">
                <span className="font-bold text-[#2E131E]">{completedCount}</span> /{" "}
                {tasks.length} Completed
              </div>
              <div className="w-24 bg-[#F7D6DF] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#D44372] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[#9F224E]">{completionPercent}%</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-[#8A6775]" />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#F7D6DF] text-xs font-medium text-[#2E131E] focus:outline-hidden focus:ring-1 focus:ring-[#D44372]"
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
                  className="px-3 py-1.5 rounded-full bg-white border border-[#F7D6DF] text-xs font-medium text-[#2E131E] focus:outline-hidden focus:ring-1 focus:ring-[#D44372]"
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
                  className="px-3 py-1.5 rounded-full bg-white border border-[#F7D6DF] text-xs font-medium text-[#2E131E] focus:outline-hidden focus:ring-1 focus:ring-[#D44372]"
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
              <Search className="w-3.5 h-3.5 text-[#8A6775] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search prep tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 rounded-full bg-white border border-[#F7D6DF] text-xs font-medium text-[#2E131E] placeholder-[#7B8C86] w-full sm:w-56 focus:outline-hidden focus:ring-1 focus:ring-[#D44372]"
              />
            </div>
          </div>

          {/* Bento Cards */}
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-[#FDF0F4]/30 rounded-2xl border border-dashed border-[#F7D6DF]">
              <p className="text-xs text-[#8A6775] font-medium">
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
                glowColor="#D44372"
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
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#F7D6DF] shadow-[0_24px_48px_-32px_rgba(212,67,114,0.18)] space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F7D6DF] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#6D5D96]/10 text-[#6D5D96] border border-[#6D5D96]/20 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[#2E131E]">
                  Day-of Execution Run of Show Timeline
                </h3>
                <p className="text-xs text-[#8A6775]">
                  Synchronized hourly execution schedule for main event day ({format(parsedEventDate, "MMMM dd, yyyy")}).
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#6D5D96]/10 text-[#6D5D96] border border-[#6D5D96]/20">
              {runOfShow.length} Operational Sequence Items
            </span>
          </div>

          {runOfShow.length === 0 ? (
            <div className="p-8 text-center bg-[#FDF0F4]/30 rounded-2xl border border-dashed border-[#F7D6DF]">
              <p className="text-xs text-[#8A6775] font-medium">
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
                  className="p-4 rounded-[20px] bg-white hover:bg-[#FDF0F4]/30 border border-[#F7D6DF] hover:border-[#D44372]/40 transition-all cursor-pointer shadow-2xs space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#6D5D96] bg-[#6D5D96]/10 px-2.5 py-0.5 rounded-full border border-[#6D5D96]/20">
                      {ros.timeSlot || "TBD"}
                    </span>
                    <span className="text-[11px] font-bold text-[#2E131E] px-2.5 py-0.5 rounded-full bg-[#FDF0F4] border border-[#F7D6DF]">
                      {ros.departmentInCharge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#2E131E] group-hover:text-[#D44372] transition-colors">
                    {ros.activity}
                  </h4>

                  <p className="text-xs text-[#8A6775] leading-relaxed">
                    {ros.operationalNotes}
                  </p>

                  {ros.dependency && (
                    <div className="pt-2 border-t border-[#F7D6DF] flex items-center justify-between text-[11px] text-[#8A6775]">
                      <span>Dependency: <strong>{ros.dependency}</strong></span>
                      <span className="text-[#D44372] font-semibold group-hover:translate-x-0.5 transition-transform">
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
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#F7D6DF] shadow-[0_24px_48px_-32px_rgba(212,67,114,0.18)] space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F7D6DF] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex w-8 h-8 rounded-full bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/30 items-center justify-center font-bold">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[#2E131E]">
                  Financial Allocation Dashboard & Elastic Slider
                </h3>
                <p className="text-xs text-[#8A6775]">
                  Fine-tune departmental budget allocations and simulate contingency reserves.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetBudget}
              className="p-2 px-3.5 rounded-full text-[#8A6775] hover:text-[#2E131E] bg-white hover:bg-[#FDF0F4] border border-[#F7D6DF] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
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
                  className="p-4 rounded-[22px] bg-white border border-[#F7D6DF] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-xl border shrink-0 ${meta.color}`}>
                        <CategoryIcon className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-[#2E131E]">{item.category}</h4>
                        <span className="text-[10px] text-[#8A6775]">{item.spendStrategy}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-serif text-[#2E131E] block">
                        ₹{Number(item.allocatedAmount).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-[#8A6775] font-semibold">{item.percentage}%</span>
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
                      thumbColor="#D44372"
                      valuePosition="bubble"
                      rangeColor="#D44372"
                      trackColor="#E7EDE9"
                      leftIcon={<IndianRupee className="w-3.5 h-3.5 text-[#D44372]" />}
                      rightIcon={<TrendingUp className="w-3.5 h-3.5 text-[#D44372]" />}
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
              className="py-3 px-6 rounded-full bg-[#D44372] hover:bg-[#163830] text-white font-bold text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
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
              className={`fixed inset-0 bg-[#D44372]/30 backdrop-blur-[3px] transition-opacity duration-300 ease-out pointer-events-auto ${
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
                className="bg-white rounded-[28px] border border-[#F7D6DF] shadow-[0_25px_70px_-12px_rgba(212,67,114,0.28)] flex flex-col h-full max-h-full overflow-hidden pointer-events-auto relative"
              >
                {/* Top Accent Gradient Line */}
                <div
                  className={`h-1.5 w-full shrink-0 ${
                    activeDrawerEvent.isMainEvent
                      ? "bg-gradient-to-r from-[#D44372] via-[#E05A87] to-[#D44372]"
                      : activeDrawerEvent.priority === "high"
                      ? "bg-gradient-to-r from-[#B5473C] via-[#E05A87] to-[#B5473C]"
                      : activeDrawerEvent.priority === "medium"
                      ? "bg-gradient-to-r from-[#3F5F8F] via-[#E05A87] to-[#3F5F8F]"
                      : activeDrawerEvent.runOfShowItem
                      ? "bg-gradient-to-r from-[#6D5D96] via-[#E05A87] to-[#6D5D96]"
                      : "bg-gradient-to-r from-[#D44372] to-[#E05A87]"
                  }`}
                />

                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#F7D6DF] bg-white shrink-0">
                  <div className="flex items-center gap-2.5">
                    {/* Pulsing Status Dot - hidden on mobile */}
                    <span className="hidden sm:inline-flex relative h-2.5 w-2.5">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          activeDrawerEvent.isMainEvent
                            ? "bg-[#D44372]"
                            : activeDrawerEvent.priority === "high"
                            ? "bg-[#B5473C]"
                            : activeDrawerEvent.priority === "medium"
                            ? "bg-[#3F5F8F]"
                            : "bg-[#D44372]"
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          activeDrawerEvent.isMainEvent
                            ? "bg-[#D44372]"
                            : activeDrawerEvent.priority === "high"
                            ? "bg-[#B5473C]"
                            : activeDrawerEvent.priority === "medium"
                            ? "bg-[#3F5F8F]"
                            : "bg-[#D44372]"
                        }`}
                      />
                    </span>
                    <h3 id="drawer-event-title" className="text-xs sm:text-sm font-bold text-[#2E131E] tracking-tight">
                      {activeDrawerEvent.isMainEvent ? (
                        "Target Event Details"
                      ) : activeDrawerEvent.runOfShowItem ? (
                        <>
                          <span className="sm:hidden">Task Detail</span>
                          <span className="hidden sm:inline">Day-of Run of Show Item</span>
                        </>
                      ) : (
                        <>
                          <span className="sm:hidden">Task Detail</span>
                          <span className="hidden sm:inline">Countdown Prep Task Details</span>
                        </>
                      )}
                    </h3>
                    {currentEventIdx >= 0 && (
                      <span className="text-[10px] font-bold text-[#9F224E] bg-[#FDF0F4] px-2 py-0.5 rounded-full border border-[#F7D6DF]">
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
                          ? "text-[#2E131E] hover:text-[#2E131E] hover:bg-[#FDF0F4] border-[#F7D6DF]"
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
                          ? "text-[#2E131E] hover:text-[#2E131E] hover:bg-[#FDF0F4] border-[#F7D6DF]"
                          : "text-[#CBD5E1] border-transparent cursor-not-allowed"
                      }`}
                      title="Next Milestone (→ Arrow Key)"
                      aria-label="Next Milestone"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy Summary - hidden on mobile */}
                    <button
                      type="button"
                      onClick={() => handleCopyTask(activeDrawerEvent)}
                      className={`hidden sm:flex p-1.5 px-2 rounded-full border transition-all cursor-pointer items-center gap-1 ${
                        copiedTask
                          ? "bg-[#FDF0F4] text-[#9F224E] border-[#D44372]"
                          : "text-[#8A6775] hover:text-[#2E131E] hover:bg-[#FDF0F4] border-[#F7D6DF]"
                      }`}
                      title="Copy Task Brief to Clipboard"
                      aria-label="Copy Task Details"
                    >
                      {copiedTask ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-[#9F224E]" />
                          <span className="text-[10px] font-bold text-[#9F224E] hidden sm:inline">
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
                      className="text-[#8A6775] hover:text-[#2E131E] cursor-pointer p-1.5 rounded-full hover:bg-[#FDF0F4] transition-colors border border-transparent hover:border-[#F7D6DF] flex items-center"
                      title="Close Panel (Esc)"
                      aria-label="Close Details"
                    >
                      <X className="w-4 h-4" />
                      <kbd className="text-[9px] font-bold text-[#8A6775] bg-[#FDF0F4] border border-[#F7D6DF] px-1 py-0.5 rounded-md ml-1 hidden sm:inline-block">
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
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDF0F4]/60 border border-[#F7D6DF] text-[11px] font-bold text-[#2E131E]">
                        <Building2 className="w-3.5 h-3.5 text-[#D44372]" />
                        <span>{extractedDept}</span>
                      </span>
                    ) : null}

                    {activeDrawerEvent.task && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isDone
                            ? "bg-[#FDF0F4] text-[#9F224E] border-[#D44372]/40"
                            : "bg-[#FDF0F4]/60 text-[#2E131E] border-[#F7D6DF]"
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#9F224E]" />
                            <span>Completed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-[#D44372]" />
                            <span>Action Pending</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Clean Title */}
                  <div>
                    <p className="text-[#8A6775] font-semibold uppercase text-[10px] tracking-wider">
                      Title
                    </p>
                    <h2 className="font-[family-name:var(--font-display)] text-base sm:text-lg font-medium text-[#2E131E] mt-0.5 tracking-tight leading-snug">
                      {cleanTitle}
                    </h2>
                  </div>

                  {/* Countdown & Execution Timing Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[#FDF0F4]/40 p-3 rounded-2xl border border-[#F7D6DF] shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[#8A6775]">
                        <Clock className="w-3 h-3 text-[#D44372]" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Timeline
                        </span>
                      </div>
                      <p className="font-bold text-xs text-[#2E131E] mt-1.5">
                        {activeDrawerEvent.daysBeforeEvent !== undefined
                          ? `T - ${activeDrawerEvent.daysBeforeEvent} Days Before Event`
                          : "Main Event Execution Day"}
                      </p>
                      <span className="text-[10px] text-[#8A6775] mt-0.5 block">
                        Milestone prep phase
                      </span>
                    </div>

                    <div className="bg-[#FDF0F4]/40 p-3 rounded-2xl border border-[#F7D6DF] shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[#8A6775]">
                        <CalendarDays className="w-3 h-3 text-[#D44372]" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Scheduled Date
                        </span>
                      </div>
                      <p className="font-bold text-xs text-[#2E131E] mt-1.5">
                        {format(activeDrawerEvent.start, "EEE, MMM dd, yyyy")}
                      </p>
                      <span className="text-[10px] text-[#8A6775] mt-0.5 block">
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
                  <div className="bg-[#FDF0F4]/50 p-3.5 rounded-2xl border border-[#D44372]/30 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#9F224E]">
                      <Sparkles className="w-3.5 h-3.5 text-[#D44372]" />
                      <span className="font-bold uppercase text-[10px] tracking-wider">
                        Operational Guidance / Brief
                      </span>
                    </div>
                    <div className="text-[#2E131E] text-xs leading-relaxed font-normal">
                      {activeDrawerEvent.actionBrief ||
                        activeDrawerEvent.description ||
                        "Standard operational milestone execution."}
                    </div>
                  </div>

                  {/* Milestone Budget Allocation Card */}
                  {(activeDrawerEvent.estimatedCost !== undefined ||
                    activeDrawerEvent.budget) && (
                    <div className="bg-[#FDF0F4]/40 p-3.5 rounded-2xl border border-[#D44372]/30 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[#9F224E]">
                          <span className="w-5 h-5 rounded-full bg-[#D44372]/20 flex items-center justify-center font-bold">
                            <IndianRupee className="w-3 h-3 text-[#9F224E]" />
                          </span>
                          <span className="text-xs font-bold text-[#9F224E]">
                            {activeDrawerEvent.isMainEvent
                              ? "Total Event Budget"
                              : "Milestone Budget Allocation"}
                          </span>
                        </div>
                        <p className="font-bold font-serif text-base text-[#2E131E]">
                          ₹{eventCostNum.toLocaleString("en-IN")}
                        </p>
                      </div>

                      {percentOfBudget > 0 && !activeDrawerEvent.isMainEvent && (
                        <div className="pt-1 border-t border-[#F7D6DF] space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-[#8A6775] font-medium">
                            <span>Share of Total Budget</span>
                            <span className="font-bold text-[#2E131E]">{percentOfBudget}%</span>
                          </div>
                          <div className="w-full bg-[#F7D6DF] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#D44372] h-1.5 rounded-full transition-all duration-500 ease-out"
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
                            ? "bg-[#F7D6DF] text-[#2E131E] hover:bg-[#d8e0da] border-[#CBD5E1]"
                            : "bg-[#D44372] hover:bg-[#163830] text-white border-[#D44372] hover:shadow-md active:scale-[0.99]"
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
                <div className="px-5 sm:px-6 py-3 border-t border-[#F7D6DF] bg-white shrink-0 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleFocusCalendar(activeDrawerEvent.start)}
                    className="flex-1 py-2 rounded-full bg-[#D44372] text-white font-bold text-xs hover:bg-[#163830] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    title="Focus Calendar on this Date"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-[#D44372]" />
                    <span>Focus on Calendar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="flex-1 py-2 rounded-full bg-white text-[#8A6775] hover:text-[#2E131E] font-bold text-xs hover:bg-[#FDF0F4] transition-all cursor-pointer border border-[#F7D6DF]"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Mobile Slide-Over Right-Side Popup Menu with Animated Transitions */}
      {isMobileMenuMounted && (
        <div
          className="fixed inset-0 z-50 overflow-hidden sm:hidden pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-label="Event Options & Telemetry Menu"
        >
          {/* Backdrop with soft blur and smooth fade animation */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className={`fixed inset-0 bg-[#2E131E]/40 backdrop-blur-[4px] transition-opacity duration-300 ease-out pointer-events-auto cursor-pointer ${
              isMobileMenuVisible ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden="true"
          />

          {/* Right Slide-Over Panel with smooth spring/cubic bezier slide animation */}
          <div
            className={`fixed top-0 bottom-0 right-0 z-50 w-full max-w-[340px] bg-white border-l border-[#F7D6DF] shadow-[-20px_0_50px_rgba(212,67,114,0.25)] p-5 flex flex-col justify-between overflow-y-auto pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isMobileMenuVisible
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
            }`}
          >
            <div className="space-y-5">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F7D6DF]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#FDF0F4] border border-[#F7D6DF] flex items-center justify-center">
                    <CalendarDays className="w-3.5 h-3.5 text-[#D44372]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2E131E]">
                      Event Workspace
                    </h3>
                    <p className="text-[10px] text-[#8A6775] truncate max-w-[180px]">
                      {activeEventName || eventName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[#FDF0F4] text-[#8A6775] hover:text-[#2E131E] active:scale-90 transition-all duration-200 cursor-pointer group"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
                </button>
              </div>

              {/* Quick Actions Cluster */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A6775]">
                  Quick Actions
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {onNewEvent && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNewEvent();
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl bg-[#FDF0F4] hover:bg-[#FCE4EC] active:scale-[0.98] text-[#9F224E] border border-[#D44372] font-bold text-xs transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#9F224E] stroke-[2.5]" />
                        <span>New Blueprint</span>
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-[#9F224E]" />
                    </button>
                  )}
                </div>
              </div>

              {/* Workspace Navigation Views */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A6775]">
                  Switch Workspace View
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceTab("calendar");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      activeWorkspaceTab === "calendar"
                        ? "bg-[#D44372] text-white shadow-xs"
                        : "bg-[#FDF0F4]/60 text-[#2E131E] hover:bg-[#FDF0F4]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CalendarRange className="w-3.5 h-3.5" />
                      <span>Master Schedule</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeWorkspaceTab === "calendar"
                          ? "bg-white/20 text-white"
                          : "bg-white text-[#8A6775] border border-[#F7D6DF]"
                      }`}
                    >
                      Calendar
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceTab("tasks");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      activeWorkspaceTab === "tasks"
                        ? "bg-[#D44372] text-white shadow-xs"
                        : "bg-[#FDF0F4]/60 text-[#2E131E] hover:bg-[#FDF0F4]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ListChecks className="w-3.5 h-3.5" />
                      <span>Countdown Prep Tasks</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeWorkspaceTab === "tasks"
                          ? "bg-white/20 text-white"
                          : "bg-white text-[#8A6775] border border-[#F7D6DF]"
                      }`}
                    >
                      {tasks.length}
                    </span>
                  </button>

                  {runOfShow.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveWorkspaceTab("runofshow");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                        activeWorkspaceTab === "runofshow"
                          ? "bg-[#D44372] text-white shadow-xs"
                          : "bg-[#FDF0F4]/60 text-[#2E131E] hover:bg-[#FDF0F4]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Day-of Run of Show</span>
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          activeWorkspaceTab === "runofshow"
                            ? "bg-white/20 text-white"
                            : "bg-white text-[#8A6775] border border-[#F7D6DF]"
                        }`}
                      >
                        {runOfShow.length}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceTab("budget");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      activeWorkspaceTab === "budget"
                        ? "bg-[#D44372] text-white shadow-xs"
                        : "bg-[#FDF0F4]/60 text-[#2E131E] hover:bg-[#FDF0F4]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Budget Allocator</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeWorkspaceTab === "budget"
                          ? "bg-white/20 text-white"
                          : "bg-white text-[#8A6775] border border-[#F7D6DF]"
                      }`}
                    >
                      {budgetList.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Status Badges & Info */}
              <div className="p-3 rounded-2xl bg-[#FDF0F4]/60 border border-[#F7D6DF] space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDF0F4] text-[#9F224E] border border-[#D44372]/40">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D44372] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D44372]" />
                    </span>
                    Blueprint Active
                  </span>

                  {daysUntilEvent !== undefined && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#2E131E] border border-[#F7D6DF]">
                      <Clock className="w-3 h-3 text-[#D44372]" />
                      {daysUntilEvent > 0
                        ? `T - ${daysUntilEvent} Days`
                        : daysUntilEvent === 0
                        ? "Event Day"
                        : "Concluded"}
                    </span>
                  )}
                </div>
              </div>

              {/* Executive Horizon Telemetry Cards */}
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A6775]">
                  Executive Telemetry
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {/* Card 1: Target Date */}
                  <div className="p-3 rounded-2xl bg-white border border-[#F7D6DF] shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-[#8A6775]">
                      <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-[#D44372]" /> Target Date
                      </span>
                      <span className="text-[10px] font-semibold bg-[#FDF0F4] text-[#9F224E] px-2 py-0.5 rounded-full border border-[#F7D6DF]">
                        {activeEventType || eventType || "Event"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#2E131E] font-serif">
                      {format(parsedEventDate, "EEE, MMM dd, yyyy")}
                    </p>
                  </div>

                  {/* Card 2: Blueprint Tier */}
                  <div className="p-3 rounded-2xl bg-white border border-[#F7D6DF] shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-[#8A6775]">
                      <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#D44372]" /> Blueprint Tier
                      </span>
                      <span className="text-[10px] font-bold text-white bg-[#D44372] px-2 py-0.5 rounded-full">
                        {activeTier || tier || "Starter"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#2E131E] truncate">
                      {evalSummary?.eventVibe || `Optimized for ${activeGuestCount || guestCount || 100} guests`}
                    </p>
                  </div>

                  {/* Card 3: Budget Health */}
                  <div className="p-3 rounded-2xl bg-white border border-[#F7D6DF] shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-[#8A6775]">
                      <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <IndianRupee className="w-3 h-3 text-[#D44372]" /> Budget Health
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          budgetDelta > 0
                            ? "bg-[#FDF0F4] text-[#9F224E] border-[#D44372]/40"
                            : budgetDelta === 0
                            ? "bg-[#FDF0F4]/70 text-[#2E131E] border-[#F7D6DF]"
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
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-[#2E131E] font-serif">₹{targetBudget.toLocaleString("en-IN")}</span>
                      <span className="text-[10px] text-[#8A6775]">₹{totalAllocated.toLocaleString("en-IN")} mapped</span>
                    </div>
                    <div className="w-full bg-[#F7D6DF] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${budgetDelta < 0 ? "bg-[#B5473C]" : "bg-[#D44372]"}`}
                        style={{ width: `${Math.min(100, (totalAllocated / Math.max(1, targetBudget)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Card 4: Prep Velocity */}
                  <div className="p-3 rounded-2xl bg-white border border-[#F7D6DF] shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-[#8A6775]">
                      <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#4F7D68]" /> Prep Velocity
                      </span>
                      <span className="text-[9px] font-bold text-[#9F224E] bg-[#FDF0F4] px-1.5 py-0.5 rounded-full border border-[#D44372]/40">
                        {completionPercent}%
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-[#2E131E] font-serif">{completedCount} of {tasks.length} Done</span>
                      <span className="text-[10px] text-[#8A6775]">{tasks.length - completedCount} pending</span>
                    </div>
                    <div className="w-full bg-[#F7D6DF] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#D44372] h-full rounded-full transition-all duration-300"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Close Button */}
            <div className="pt-4 border-t border-[#F7D6DF] mt-4">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-full bg-white text-[#8A6775] hover:text-[#2E131E] active:scale-95 font-bold text-xs hover:bg-[#FDF0F4] transition-all duration-200 cursor-pointer border border-[#F7D6DF] text-center"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}

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
