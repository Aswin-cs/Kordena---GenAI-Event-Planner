"use client";

import React, { useState } from "react";
import { Bot, Send, Sparkles, X, Key, Check, Loader2 } from "lucide-react";
import { EventPlan } from "../types";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventPlan;
}

interface ChatMessage {
  id: string;
  sender: "user" | "kordena";
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "Suggest 3 ways to cut budget without sacrificing aesthetics",
  "Draft an elegant invitation email for our guests",
  "Suggest signature herbal drinks for the Fresh Sage & Mint theme",
  "Optimize our timeline buffer between reception and dinner",
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      sender: "kordena",
      text: `Hello! I am your Kordena AI Copilot for "${event.title}". How can I assist you with your schedule, budget allocation, vendor terms, or guest experience today?`,
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

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
          eventContext: event,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "kordena",
        text: data.reply || "I am analyzing your event parameters. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "kordena",
        text: "I encountered a minor sync delay. Let me review your event data again.",
        timestamp: "Now",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D3748]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] rounded-3xl w-full max-w-2xl h-[620px] max-h-[90vh] border border-[#E2ECE5] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFFFFF] border-b border-[#E2ECE5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#2D3748]">
                  Kordena AI Copilot
                </h3>
                <span className="w-2 h-2 rounded-full bg-[#10B981] emerald-pulse" />
              </div>
              <p className="text-[11px] text-[#718096]">
                Context: {event.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="p-2 rounded-xl bg-[#F4F7F5] text-[#718096] hover:text-[#2D3748] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Configure Custom Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">API Key</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F4F7F5] text-[#718096] hover:text-[#2D3748] flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Custom API Key accordion */}
        {showKeyInput && (
          <div className="px-6 py-3 bg-[#F4F7F5] border-b border-[#E2ECE5] flex items-center gap-2 text-xs">
            <Key className="w-4 h-4 text-[#10B981] shrink-0" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter optional Google Gemini API key (or leave blank to use built-in Kordena engine)"
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2ECE5] text-xs text-[#2D3748] focus:border-[#10B981]"
            />
            {apiKey && (
              <span className="text-[11px] text-[#10B981] font-semibold flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F4F7F5]/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[#10B981] text-white shadow-xs font-medium rounded-tr-none"
                    : "bg-[#FFFFFF] text-[#2D3748] border border-[#E2ECE5] shadow-2xs rounded-tl-none whitespace-pre-line"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-[#718096] px-1 mt-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#718096] bg-[#FFFFFF] p-3 rounded-2xl border border-[#E2ECE5] max-w-[200px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#10B981]" />
              <span>Kordena AI is synthesizing...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-[#FFFFFF] border-t border-[#E2ECE5] flex items-center gap-2 overflow-x-auto">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F4F7F5] text-[#2D3748] border border-[#E2ECE5] hover:border-[#10B981] hover:text-[#059669] hover:bg-[#E6F7F0] transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-[#FFFFFF] border-t border-[#E2ECE5]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about this event, timeline, drinks, speeches..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs sm:text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981] transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
