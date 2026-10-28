"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Bot,
  Send,
  Sparkles,
  X,
  RotateCcw,
  Key,
  Check,
  CheckCheck,
  Copy,
  Maximize2,
  Minimize2,
  Calendar as CalendarIcon,
  Clock,
  IndianRupee,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  ExternalLink,
  ChevronRight,
  FileText,
  Compass,
  CheckCircle2,
  Layers,
} from "lucide-react";
import {
  IPrepCalendarTask,
  IDayOfRunOfShowItem,
  IBudgetBreakdownItem,
  IEvaluationSummary,
} from "@/models/UserStatus.model";
import { CalendarEventItem } from "./EventCalendarView";

export interface CalendarAiChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  eventContext: {
    title: string;
    eventType: string;
    eventBudget: string | number;
    eventDate: string;
    tier?: string;
    guestCount?: number | string;
    prepCalendarTasks?: IPrepCalendarTask[];
    dayOfRunOfShow?: IDayOfRunOfShowItem[];
    budgetBreakdown?: IBudgetBreakdownItem[];
    evaluationSummary?: IEvaluationSummary;
    selectedEvent?: CalendarEventItem | null;
    userStatusId?: string;
  };
  onEventStatusUpdated?: (updatedFields: {
    prepCalendarTasks?: IPrepCalendarTask[];
    dayOfRunOfShow?: IDayOfRunOfShowItem[];
    budgetBreakdown?: IBudgetBreakdownItem[];
    requirements?: string[];
  }) => void;
  onFocusDate?: (date: Date) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "kordena";
  text: string;
  timestamp: string;
  actionType?: "milestones" | "budget" | "timeline" | "brief";
  isEditApplied?: boolean;
  savedToDb?: boolean;
}

type ModeFilter = "all" | "milestones" | "run-of-show" | "budget" | "vendors";

const MODE_TABS: { id: ModeFilter; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Intelligence", icon: Compass },
  { id: "milestones", label: "Countdown Tasks", icon: Zap },
  { id: "run-of-show", label: "Run of Show", icon: Clock },
  { id: "budget", label: "Budget Allocator", icon: IndianRupee },
  { id: "vendors", label: "Vendor Protocols", icon: FileText },
];

const QUICK_PROMPTS: Record<ModeFilter, string[]> = {
  all: [
    "⚡ Which prep tasks are high priority?",
    "⏱️ Optimize run-of-show buffer timing",
    "💰 Suggest 3 ways to optimize milestone budget",
    "📋 Draft a vendor load-in operational brief",
  ],
  milestones: [
    "⚡ List all urgent milestones due within T-3 days",
    "🔍 Check for prerequisite task dependencies",
    "✅ What tasks should I delegate first?",
  ],
  "run-of-show": [
    "⏱️ Insert a 15-minute buffer between stage changes",
    "🎙️ Optimize soundcheck and VIP arrival times",
    "🍽️ Best timeline placement for multi-course dining",
  ],
  budget: [
    "💰 Where can we negotiate a 10% vendor reduction?",
    "📊 Compare catering vs staging allocation percentages",
    "🛡️ Recommend an ideal contingency reserve amount",
  ],
  vendors: [
    "📋 Generate an AV equipment load-in checklist",
    "✉️ Draft a stage lighting requirements email",
    "🤝 Propose contractual arrival clauses for caterers",
  ],
};

const THINKING_STEPS = [
  "Analyzing master countdown milestones...",
  "Cross-referencing department budget allocations...",
  "Synthesizing operational protocol & recommendations...",
];

export const CalendarAiChatbot: React.FC<CalendarAiChatbotProps> = ({
  isOpen,
  onToggle,
  onClose,
  eventContext,
  onEventStatusUpdated,
  onFocusDate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "msg-welcome",
      sender: "kordena",
      text: `Hello! I am **Kordena AI Copilot**, synchronized with your master production calendar for **${
        eventContext.title || "your event"
      }**.\n\nI actively monitor your **${
        eventContext.prepCalendarTasks?.length || 0
      } countdown milestones**, department budgets, and day-of execution run-of-show. How can I optimize your production schedule today?`,
      timestamp: "Just now",
      actionType: "milestones",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ModeFilter>("all");
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Ctrl+J or Cmd+J to toggle copilot anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        onToggle();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggle, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Animated multi-step thinking indicator
  useEffect(() => {
    if (!loading) {
      setThinkingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingStep((prev) => (prev + 1) % THINKING_STEPS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  // Derived calendar metrics for live canvas
  const highPriorityTasks = useMemo(() => {
    return (eventContext.prepCalendarTasks || []).filter(
      (t) => t.priority === "high"
    );
  }, [eventContext.prepCalendarTasks]);

  const targetBudgetNum = useMemo(() => {
    return Number(eventContext.eventBudget) || 100000;
  }, [eventContext.eventBudget]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    let actionType: ChatMessage["actionType"] = "milestones";
    const lower = textToSend.toLowerCase();
    if (lower.includes("budget") || lower.includes("cost") || lower.includes("save")) {
      actionType = "budget";
    } else if (lower.includes("time") || lower.includes("run of show") || lower.includes("buffer")) {
      actionType = "timeline";
    } else if (lower.includes("vendor") || lower.includes("email") || lower.includes("brief")) {
      actionType = "brief";
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          eventContext: {
            title: eventContext.title,
            eventType: eventContext.eventType,
            eventBudget: eventContext.eventBudget,
            eventDate: eventContext.eventDate,
            tier: eventContext.tier,
            guestCount: eventContext.guestCount,
            prepCalendarTasks: eventContext.prepCalendarTasks,
            dayOfRunOfShow: eventContext.dayOfRunOfShow,
            budgetBreakdown: eventContext.budgetBreakdown,
            evaluationSummary: eventContext.evaluationSummary,
          },
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.isEditApplied && data.updatedFields) {
        onEventStatusUpdated?.(data.updatedFields);
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "kordena",
        text:
          data.reply ||
          "I have reviewed your production schedule. Let me know which milestone or budget item you wish to fine-tune.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionType,
        isEditApplied: Boolean(data.isEditApplied),
        savedToDb: Boolean(data.savedToDb),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Calendar chat error:", err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "kordena",
        text: "I experienced a brief synchronization delay with the intelligence server. Let me re-examine your calendar parameters.",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: "kordena",
        text: `Workspace restarted. Ready to inspect milestones, buffer strategies, and budgets for **${
          eventContext.title || "your event"
        }**.`,
        timestamp: "Just now",
        actionType: "milestones",
      },
    ]);
  };

  // Render markdown-like bold, bullet points, and headers with rich UI tokens
  const renderFormattedText = (raw: string) => {
    const lines = raw.split("\n");
    return lines.map((line, i) => {
      // Bullet points
      if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
        const clean = line.replace(/^[•\-*]\s*/, "");
        return (
          <div key={i} className="flex items-start gap-2 my-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
            <span className="leading-relaxed">{renderInlineFormatting(clean)}</span>
          </div>
        );
      }
      // Numbered items
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={i} className="my-1.5 pl-1 text-xs leading-relaxed">
            {renderInlineFormatting(line)}
          </div>
        );
      }
      // Section breaks
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      return (
        <p key={i} className="my-0.5 text-xs leading-relaxed">
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-extrabold text-[#1A202C]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Pill (When Chat is Closed) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 group">
          <button
            type="button"
            onClick={onToggle}
            className="cursor-pointer flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] text-white shadow-[0_12px_35px_-5px_rgba(16,185,129,0.5),0_0_0_1px_rgba(255,255,255,0.2)] hover:shadow-[0_18px_45px_-5px_rgba(16,185,129,0.7)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
            aria-label="Open AI Calendar Copilot"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </div>

            <span className="font-extrabold text-xs sm:text-sm tracking-tight drop-shadow-xs">
              AI Calendar Copilot
            </span>

            {/* Keyboard shortcut badge */}
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded-md border border-white/20">
              Ctrl+J
            </span>

            {highPriorityTasks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-red-500/90 text-white font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                <Flame className="w-3 h-3" />
                {highPriorityTasks.length} Urgent
              </span>
            )}
          </button>
        </div>
      )}

      {/* Floating Modern AI Copilot Window */}
      {isOpen && (
        <div
          className={`fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded
              ? "w-[840px] max-w-[calc(100vw-1.5rem)] h-[680px] max-h-[90vh]"
              : "w-[440px] max-w-[calc(100vw-1.5rem)] h-[620px] max-h-[85vh]"
          } bg-[#FFFFFF]/95 backdrop-blur-2xl rounded-3xl border border-[#E2ECE5] shadow-[0_25px_70px_-15px_rgba(20,40,30,0.28),0_0_0_1px_rgba(226,236,229,0.9),0_10px_30px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5`}
        >
          {/* Top Multi-Chromatics Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 shrink-0" />

          {/* Copilot Header */}
          <div className="px-5 py-3.5 bg-[#FFFFFF] border-b border-[#E2ECE5] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#2D3748] tracking-tight">
                    Kordena AI Copilot
                  </h3>
                  <span className="text-[10px] font-bold text-[#059669] bg-[#E6F7F0] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                    Operations
                  </span>
                </div>
                <p className="text-[10px] text-[#718096]">
                  Synchronized with Production Calendar
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1.5">
              {/* Expand / Minimize Window */}
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="hidden md:inline-flex p-1.5 rounded-xl text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5] border border-transparent hover:border-[#E2ECE5] transition-all cursor-pointer"
                title={isExpanded ? "Collapse to Compact View" : "Expand to Operations Canvas"}
                aria-label="Toggle Window Size"
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Reset Thread */}
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-xl text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5] border border-transparent hover:border-[#E2ECE5] transition-all cursor-pointer"
                title="Restart Chat Conversation"
                aria-label="Restart Conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* API Key Modal Toggle */}
              <button
                type="button"
                onClick={() => setShowKeyInput((prev) => !prev)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                  showKeyInput || apiKey
                    ? "bg-[#E6F7F0] text-[#059669] border-[#A7F3D0]"
                    : "text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5] border-transparent hover:border-[#E2ECE5]"
                }`}
                title="Configure Custom Gemini API Key"
                aria-label="Custom API Key"
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F7F5] transition-colors cursor-pointer border border-transparent hover:border-[#E2ECE5] flex items-center gap-1"
                title="Close Copilot (Esc / Ctrl+J)"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
                <kbd className="text-[9px] font-mono text-[#718096] bg-[#F4F7F5] px-1 py-0.5 rounded border border-[#E2ECE5] hidden sm:inline-block">
                  ESC
                </kbd>
              </button>
            </div>
          </div>

          {/* Optional Gemini API Key Drawer */}
          {showKeyInput && (
            <div className="px-5 py-2.5 bg-[#F4F7F5] border-b border-[#E2ECE5] text-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-[#2D3748] flex items-center gap-1">
                  <Key className="w-3 h-3 text-[#10B981]" /> Optional Gemini API Key:
                </span>
                <span className="text-[10px] text-[#718096]">Stored in memory</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white rounded-lg border border-[#E2ECE5] focus:outline-hidden focus:ring-1 focus:ring-[#10B981]"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyInput(false)}
                  className="px-2.5 py-1.5 bg-[#10B981] text-white rounded-lg font-bold text-xs hover:bg-[#059669] cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Telemetry Context Bar */}
          <div className="px-5 py-2 bg-[#FAFCFB] border-b border-[#E2ECE5] flex items-center justify-between text-[11px] text-[#718096] shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
              <span className="font-bold text-[#2D3748] truncate max-w-[210px]">
                {eventContext.title || "Target Event Blueprint"}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3 text-[#10B981]" />
                {eventContext.eventDate ? eventContext.eventDate : "Schedule Active"}
              </span>
              <span className="text-[#CBD5E1]">•</span>
              <span className="font-extrabold text-[#059669]">
                ₹{targetBudgetNum.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Mode Capability Filter Tabs */}
          <div className="px-4 py-2 bg-[#FFFFFF] border-b border-[#E2ECE5] overflow-x-auto no-scrollbar shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {MODE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#10B981] text-white shadow-2xs"
                        : "bg-[#F4F7F5] text-[#718096] hover:text-[#2D3748] hover:bg-[#E2ECE5]"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Dual-Pane or Single-Pane Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Chat Pane */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3.5 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    } group`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl p-3.5 relative shadow-2xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-br-xs font-medium"
                          : "bg-[#F8FAFA] text-[#2D3748] border border-[#E2ECE5] rounded-bl-xs"
                      }`}
                    >
                      {msg.isEditApplied && (
                        <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6F7F0] border border-[#A7F3D0] text-[#059669] text-[10px] font-extrabold shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                          <span>Blueprint Updated & Saved to DB</span>
                        </div>
                      )}

                      {msg.sender === "kordena" ? (
                        <div>{renderFormattedText(msg.text)}</div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}

                      {/* Bot Response Actions Footer */}
                      {msg.sender === "kordena" && (
                        <div className="pt-2 mt-2 border-t border-[#E2ECE5]/60 flex items-center justify-between text-[10px] text-[#718096]">
                          <span className="font-mono">{msg.timestamp}</span>

                          <div className="flex items-center gap-2">
                            {/* Copy Draft button */}
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.id, msg.text)}
                              className="hover:text-[#2D3748] cursor-pointer flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-[#E2ECE5]"
                              title="Copy AI Output"
                            >
                              {copiedMsgId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-[#059669]" />
                                  <span className="text-[#059669] font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {msg.sender === "user" && (
                      <span className="text-[10px] text-[#718096] mt-1 mr-1 font-mono">
                        {msg.timestamp}
                      </span>
                    )}
                  </div>
                ))}

                {/* Agentic Reasoning Tracker */}
                {loading && (
                  <div className="p-3.5 bg-gradient-to-br from-[#F0FDF4] to-[#FFFFFF] border border-[#A7F3D0] rounded-2xl w-fit max-w-[85%] shadow-2xs space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span className="text-[11px] font-extrabold text-[#059669] uppercase tracking-wider">
                        Copilot Reasoning
                      </span>
                    </div>

                    <p className="text-xs text-[#2D3748] font-semibold">
                      {THINKING_STEPS[thinkingStep]}
                    </p>

                    <div className="w-full bg-[#A7F3D0]/40 rounded-full h-1 overflow-hidden">
                      <div className="bg-[#10B981] h-1 rounded-full animate-pulse w-3/4" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="px-4 py-2 bg-[#FAFCFB] border-t border-[#E2ECE5] overflow-x-auto no-scrollbar shrink-0">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  {QUICK_PROMPTS[activeFilter].map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      disabled={loading}
                      className="px-2.5 py-1 rounded-xl bg-white border border-[#E2ECE5] text-[11px] font-medium text-[#4A5568] hover:text-[#10B981] hover:border-[#A7F3D0] hover:bg-[#F0FDF4] transition-all cursor-pointer shadow-2xs"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 bg-[#FFFFFF] border-t border-[#E2ECE5] flex items-center gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about countdown prep, run of show, budget..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs font-medium text-[#2D3748] placeholder-[#718096] focus:outline-hidden focus:ring-1 focus:ring-[#10B981]"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className={`p-2.5 rounded-2xl transition-all cursor-pointer shadow-xs ${
                    input.trim() && !loading
                      ? "bg-[#10B981] hover:bg-[#059669] text-white active:scale-95"
                      : "bg-[#F4F7F5] text-[#CBD5E1] cursor-not-allowed border border-[#E2ECE5]"
                  }`}
                  aria-label="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Right Pane: Live Operations Canvas (When Expanded) */}
            {isExpanded && (
              <div className="w-[360px] border-l border-[#E2ECE5] bg-[#FAFCFB] flex flex-col overflow-y-auto p-4 space-y-4 shrink-0 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2ECE5]">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#2D3748]">
                    <Layers className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Operations Canvas</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#059669] bg-[#E6F7F0] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                    Real-time
                  </span>
                </div>

                {/* Urgent Milestones Radar */}
                <div className="p-3 bg-white rounded-2xl border border-[#E2ECE5] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#718096] tracking-wider flex items-center gap-1">
                      <Flame className="w-3 h-3 text-red-500" /> Urgent Milestones
                    </span>
                    <span className="text-[10px] font-bold text-red-600">
                      {highPriorityTasks.length} High Priority
                    </span>
                  </div>

                  {highPriorityTasks.length === 0 ? (
                    <p className="text-[11px] text-[#718096]">
                      All critical countdown paths are verified.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {highPriorityTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="p-2 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-between gap-2"
                        >
                          <div className="truncate">
                            <p className="text-[11px] font-bold text-[#991B1B] truncate">
                              {task.title}
                            </p>
                            <span className="text-[10px] text-[#B91C1C]">
                              T - {task.daysBeforeEvent} Days ({task.department})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleSend(
                                `Review high priority task: "${task.title}" and suggest risk mitigation.`
                              )
                            }
                            className="p-1 rounded-lg bg-white text-[#991B1B] hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                            title="Analyze with AI"
                          >
                            <Sparkles className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Budget Health Overview */}
                <div className="p-3 bg-white rounded-2xl border border-[#E2ECE5] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#718096] tracking-wider flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 text-[#10B981]" /> Budget Health
                    </span>
                    <span className="text-[11px] font-extrabold text-[#059669]">
                      ₹{targetBudgetNum.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {(eventContext.budgetBreakdown || []).slice(0, 4).map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-[#4A5568]">
                          <span className="truncate">{item.category}</span>
                          <span className="font-bold">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-[#F4F7F5] rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-[#10B981] h-1 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day-of Run of Show Quick Glance */}
                {(eventContext.dayOfRunOfShow || []).length > 0 && (
                  <div className="p-3 bg-white rounded-2xl border border-[#E2ECE5] shadow-2xs space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#718096] tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#3B82F6]" /> Day-of Execution Highlights
                    </span>

                    <div className="space-y-1.5">
                      {(eventContext.dayOfRunOfShow || []).slice(0, 3).map((ros, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2ECE5] text-[11px] flex items-center justify-between gap-1"
                        >
                          <span className="font-bold text-[#2D3748] truncate">
                            {ros.activity}
                          </span>
                          <span className="text-[10px] font-mono text-[#718096] shrink-0">
                            {ros.timeSlot || "TBD"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
