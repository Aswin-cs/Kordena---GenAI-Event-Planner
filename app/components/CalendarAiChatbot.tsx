"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Send,
  Sparkles,
  X,
  RotateCcw,
  Check,
  Copy,
  Maximize2,
  Minimize2,
  Clock,
  Flame,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquare,
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
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
  isUnauthorized?: boolean;
}

type ModeFilter = "all" | "milestones" | "run-of-show" | "budget" | "vendors";

const MODE_TABS: { id: ModeFilter; label: string }[] = [
  { id: "all", label: "Overview" },
  { id: "milestones", label: "Tasks" },
  { id: "run-of-show", label: "Event day" },
  { id: "budget", label: "Budget" },
  { id: "vendors", label: "Vendors" },
];

// Strip the leading emoji from the suggestion strings
const cleanPrompt = (p: string) => p.replace(/^[^A-Za-z0-9]+/, "").trim();

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
  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated";

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
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Close chatbot when clicking anywhere outside the chat window
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (chatContainerRef.current?.contains(target)) return;
      if (target.closest(".kchat-fab")) return;
      onClose();
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen, onClose]);

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

    // Frontend Check: Guard against unauthenticated invocation before dispatching network request
    if (!isAuthenticated) {
      const lockMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "kordena",
        text: "Kordena AI Copilot is currently locked for unauthorized sessions. Please sign in to ask questions, optimize dates, or modify blueprints.",
        timestamp: "Just now",
        isUnauthorized: true,
      };
      setMessages((prev) => [...prev, lockMsg]);
      return;
    }

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
        }),
      });

      const data = await res.json();

      if (res.status === 401 || data.code === "UNAUTHORIZED") {
        const unauthMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "kordena",
          text: data.message || "Unauthorized: You must be signed in to converse with Kordena AI Copilot.",
          timestamp: "Just now",
          isUnauthorized: true,
        };
        setMessages((prev) => [...prev, unauthMsg]);
        return;
      }

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

  // Render markdown-like bold, bullet points, and numbered lines
  const renderFormattedText = (raw: string) => {
    const lines = raw.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
        const clean = line.replace(/^[•\-*]\s*/, "");
        return (
          <div key={i} className="kchat-li">
            <span className="kchat-li-dot" />
            <span>{renderInlineFormatting(clean)}</span>
          </div>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={i} className="kchat-num">
            {renderInlineFormatting(line)}
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="kchat-p">{renderInlineFormatting(line)}</p>;
    });
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    );
  };

  const urgentCount = highPriorityTasks.length;
  const showStarters = messages.length <= 1 && !loading;

  return (
    <>
      {/* Floating round trigger button with chat icon */}
      <button
        type="button"
        onClick={onToggle}
        className={`kchat-fab ${isOpen ? "kchat-fab--hidden" : ""}`}
        aria-label="Open AI Calendar Copilot"
        title={isAuthenticated ? "Open AI Calendar Copilot (Ctrl+J)" : "AI Calendar Copilot (Sign In Required)"}
        tabIndex={isOpen ? -1 : 0}
        aria-hidden={isOpen}
      >
        {isAuthenticated ? (
          <MessageSquare className="w-5 h-5 text-white" />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
            <Lock className="w-2.5 h-2.5 text-amber-300 absolute -bottom-1 -right-1" />
          </div>
        )}
        
      </button>

      {/* Copilot window with opening and closing animation */}
      <div
        ref={chatContainerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Kordena AI Copilot"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        className={`kchat ${isOpen ? "kchat--open" : ""} ${isExpanded ? "kchat--wide" : ""}`}
        >
          {/* Header */}
          <header className="kchat-head">
            <span className="kchat-mark" aria-hidden="true">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="kchat-headtext">
              <h3>Copilot</h3>
              <p>
                {eventContext.title || "Your event"}
                {eventContext.eventDate ? ` · ${eventContext.eventDate}` : ""}
                {` · ₹${targetBudgetNum.toLocaleString("en-IN")}`}
              </p>
            </div>
            <div className="kchat-tools">
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="kchat-ghost kchat-ghost--md"
                title={isExpanded ? "Collapse" : "Expand with live canvas"}
                aria-label="Toggle window size"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button type="button" onClick={handleResetChat} className="kchat-ghost" title="Start over" aria-label="Restart conversation">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="kchat-ghost kchat-ghost--close"
                title="Close (Esc)"
                aria-label="Close chat"
              >
                <X className="w-4 h-4 pointer-events-none" />
              </button>
            </div>
          </header>


          {/* Scope tabs */}
          <nav className="kchat-tabs" role="tablist" aria-label="Copilot focus">
            {MODE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={activeFilter === tab.id ? "is-active" : ""}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="kchat-main">
            <section className="kchat-col">
              {!isAuthenticated && (
                <div className="kchat-lock">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Sign in to ask questions or edit your schedule.</span>
                  <button type="button" onClick={() => signIn("google", { callbackUrl: "/" })}>Sign in</button>
                </div>
              )}

              <div role="log" aria-live="polite" aria-relevant="additions" className="kchat-log">
                {messages.map((msg) => (
                  <article key={msg.id} className={`kchat-msg ${msg.sender === "user" ? "kchat-msg--user" : "kchat-msg--bot"}`}>
                    {msg.sender === "kordena" && (
                      <span className="kchat-avatar" aria-hidden="true">
                        <Sparkles className="w-3 h-3" />
                      </span>
                    )}
                    <div className="kchat-body">
                      {msg.isEditApplied && (
                        <div className="kchat-applied">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Schedule updated and saved</span>
                        </div>
                      )}

                      {msg.sender === "kordena" ? (
                        <div>{renderFormattedText(msg.text)}</div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}

                      {msg.isUnauthorized && (
                        <button type="button" className="kchat-cta" onClick={() => signIn("google", { callbackUrl: "/" })}>
                          Sign in with Google
                        </button>
                      )}

                      {msg.sender === "kordena" && (
                        <footer className="kchat-meta">
                          <span>{msg.timestamp}</span>
                          <button type="button" onClick={() => handleCopyMessage(msg.id, msg.text)} title="Copy reply">
                            {copiedMsgId === msg.id ? (
                              <>
                                <Check className="w-3 h-3" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy
                              </>
                            )}
                          </button>
                        </footer>
                      )}
                    </div>
                    {msg.sender === "user" && <span className="kchat-time">{msg.timestamp}</span>}
                  </article>
                ))}

                {loading && (
                  <div className="kchat-think" role="status">
                    <span className="kchat-dots"><i /><i /><i /></span>
                    <span>{THINKING_STEPS[thinkingStep]}</span>
                  </div>
                )}

                {showStarters && (
                  <div className="kchat-starters">
                    <p>Try asking</p>
                    {QUICK_PROMPTS[activeFilter].map((prompt, idx) => (
                      <button key={idx} type="button" onClick={() => handleSend(cleanPrompt(prompt))}>
                        <span>{cleanPrompt(prompt)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {!showStarters && (
                <div className="kchat-chips">
                  {QUICK_PROMPTS[activeFilter].map((prompt, idx) => (
                    <button key={idx} type="button" disabled={loading} onClick={() => handleSend(cleanPrompt(prompt))}>
                      {cleanPrompt(prompt)}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="kchat-composer"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={isAuthenticated ? "Ask about tasks, timing or budget" : "Sign in to ask Copilot"}
                  aria-label="Ask Kordena Copilot a question or request an edit"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 shadow-none border-0"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  title={!isAuthenticated ? "Sign in required" : "Send"}
                >
                  {!isAuthenticated ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </section>

            {/* Live canvas (expanded) */}
            {isExpanded && (
              <aside className="kchat-canvas">
                <h4>Live canvas</h4>

                <section>
                  <div className="kchat-canvas-row">
                    <span>Needs attention</span>
                    <b>{urgentCount} high priority</b>
                  </div>
                  {urgentCount === 0 ? (
                    <p className="kchat-muted">Every critical task is on track.</p>
                  ) : (
                    highPriorityTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="kchat-task">
                        <div className="min-w-0">
                          <p className="truncate">{task.title}</p>
                          <span>{task.daysBeforeEvent} days before · {task.department}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSend(`Review high priority task: "${task.title}" and suggest risk mitigation.`)}
                          title="Ask Copilot about this task"
                          aria-label={`Ask Copilot about ${task.title}`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </section>

                <section>
                  <div className="kchat-canvas-row">
                    <span>Budget</span>
                    <b>₹{targetBudgetNum.toLocaleString("en-IN")}</b>
                  </div>
                  {(eventContext.budgetBreakdown || []).slice(0, 4).map((item, idx) => (
                    <div key={idx} className="kchat-bar">
                      <div>
                        <span className="truncate">{item.category}</span>
                        <b>{item.percentage}%</b>
                      </div>
                      <i><u style={{ width: `${item.percentage}%` }} /></i>
                    </div>
                  ))}
                </section>

                {(eventContext.dayOfRunOfShow || []).length > 0 && (
                  <section>
                    <div className="kchat-canvas-row">
                      <span>Event day</span>
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    {(eventContext.dayOfRunOfShow || []).slice(0, 3).map((ros, idx) => (
                      <div key={idx} className="kchat-ros">
                        <span className="truncate">{ros.activity}</span>
                        <time>{ros.timeSlot || "TBD"}</time>
                      </div>
                    ))}
                  </section>
                )}
              </aside>
            )}
          </div>
        </div>
    </>
  );
};
