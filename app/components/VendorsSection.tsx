"use client";

import React, { useState, useEffect, useRef } from "react";
import { Star, Mail, CheckCircle2, Sparkles, Building2, ExternalLink, Copy, Check } from "lucide-react";
import { Vendor, EventPlan } from "../types";

interface VendorsSectionProps {
  event: EventPlan;
  onUpdateVendors: (vendors: Vendor[]) => void;
  onOpenAssistant: () => void;
}

export const VendorsSection: React.FC<VendorsSectionProps> = ({
  event,
  onUpdateVendors,
  onOpenAssistant,
}) => {
  const [draftedVendor, setDraftedVendor] = useState<Vendor | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close modal on Escape key press (WCAG 2.1.2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && draftedVendor) {
        setDraftedVendor(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draftedVendor]);

  // Clean up timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const toggleStatus = (vendorId: string) => {
    const updated = event.vendors.map((v) => {
      if (v.id === vendorId) {
        const nextStatus: Vendor["status"] =
          v.status === "Shortlisted"
            ? "Contacted"
            : v.status === "Contacted"
            ? "Booked"
            : "Shortlisted";
        return { ...v, status: nextStatus };
      }
      return v;
    });
    onUpdateVendors(updated);
  };

  const handleGenerateInquiry = (vendor: Vendor) => {
    setDraftedVendor(vendor);
    setCopied(false);
  };

  const getInquiryText = (vendor: Vendor) => {
    return `Subject: Inquiry: Availability & Proposal for ${event.title}

Dear ${vendor.contactPerson || vendor.name},

I hope this message finds you well.

We are curating "${event.title}", taking place on ${event.date} at ${event.location} for approximately ${event.guestCount} attendees.

Based on our GenAI design brief focusing on a serene aesthetic and high standards of execution, your services at ${vendor.name} emerged as an exceptional match (${vendor.aiMatchScore}% match score).

Could you please confirm your availability for this date and share your current package options aligned with our timeline?

Warm regards,
Kordena Event Planning Team`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E2ECE5] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">
                Curated Network
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
                AI Verified
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#2D3748]">
              AI Vendor Matchmaker
            </h2>
            <p className="text-xs sm:text-sm text-[#718096]">
              Partners specifically matched to your serene aesthetic, capacity, and budget tier
            </p>
          </div>

          <button
            onClick={onOpenAssistant}
            className="px-4 py-2.5 rounded-xl bg-[#E6F7F0] border border-[#A7F3D0] text-xs sm:text-sm font-semibold text-[#059669] hover:bg-[#A7F3D0]/70 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-[#10B981]" /> Request More AI Matches
          </button>
        </div>
      </div>

      {/* Inquiry Drafter Modal */}
      {draftedVendor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-modal-title"
          className="fixed inset-0 z-50 bg-[#2D3748]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#E2ECE5] shadow-2xl space-y-4 animate-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#10B981]" />
                <h3 id="vendor-modal-title" className="text-base font-bold text-[#2D3748]">
                  AI Inquiry for {draftedVendor.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDraftedVendor(null)}
                aria-label="Close inquiry modal"
                className="w-8 h-8 rounded-full bg-[#F4F7F5] text-[#718096] hover:text-[#2D3748] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <textarea
              readOnly
              rows={10}
              value={getInquiryText(draftedVendor)}
              aria-label={`Inquiry email draft for ${draftedVendor.name}`}
              className="w-full p-4 rounded-2xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs font-mono text-[#2D3748] resize-none"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#718096]">
                Recipient: <strong className="text-[#2D3748]">{draftedVendor.email}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(getInquiryText(draftedVendor))}
                  aria-label="Copy inquiry draft to clipboard"
                  className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied to Clipboard!" : "Copy Inquiry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {event.vendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E2ECE5] shadow-xs hover:border-[#10B981]/50 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F4F7F5] text-[#718096] border border-[#E2ECE5]">
                    {vendor.category}
                  </span>
                  <span className="text-xs font-bold text-[#718096]">
                    {vendor.priceTier}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#2D3748] mt-1">
                  {vendor.name}
                </h4>
              </div>

              {/* AI Match badge with emerald styling */}
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
                  <Sparkles className="w-3 h-3" /> {vendor.aiMatchScore}% Match
                </span>
                <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold justify-end mt-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{vendor.rating}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#718096] leading-relaxed bg-[#F4F7F5] p-3 rounded-xl border border-[#E2ECE5]">
              {vendor.notes}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2ECE5]/70 text-xs">
              <div>
                <span className="text-[#718096] block text-[11px]">Contact Lead:</span>
                <span className="font-semibold text-[#2D3748]">{vendor.contactPerson}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Status cycle button */}
                <button
                  type="button"
                  onClick={() => toggleStatus(vendor.id)}
                  aria-label={`Cycle status for ${vendor.name}. Current: ${vendor.status}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    vendor.status === "Booked"
                      ? "bg-[#E6F7F0] text-[#10B981] border-[#A7F3D0]"
                      : vendor.status === "Contacted"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-[#F4F7F5] text-[#718096] border-[#E2ECE5]"
                  }`}
                  title="Click to cycle status: Shortlisted -> Contacted -> Booked"
                >
                  {vendor.status}
                </button>

                {/* Draft Inquiry Email */}
                <button
                  type="button"
                  onClick={() => handleGenerateInquiry(vendor)}
                  aria-label={`Draft inquiry email for ${vendor.name}`}
                  className="px-3 py-1.5 rounded-xl bg-[#F4F7F5] hover:bg-[#EBF3EE] text-[#2D3748] border border-[#E2ECE5] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Draft</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
