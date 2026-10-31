import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#2E131E] px-4">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300 text-center max-w-sm">
        <img
          src="/kordena-mark-reversed.svg"
          alt="Kordena Logo"
          className="w-14 h-14 rounded-2xl shadow-lg shadow-[#D44372]/20 object-contain animate-pulse"
        />
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[#2E131E]">
          <Loader2 className="w-4 h-4 animate-spin text-[#D44372]" />
          <span>Loading Kordena Event Studio...</span>
        </div>
        <div className="w-48 bg-[#F7D6DF] h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#D44372] to-[#E05A87] rounded-full animate-pulse w-3/4" />
        </div>
        <p className="text-xs text-[#8A6775]">
          Serene & focused event planning powered by Generative AI
        </p>
      </div>
    </div>
  );
}

