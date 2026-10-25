"use client";

import React, { useState } from "react";
import { DollarSign, Plus, Sparkles, PieChart, TrendingUp, AlertCircle, CheckCircle2, Sliders } from "lucide-react";
import { BudgetItem, EventPlan } from "../types";

interface BudgetSectionProps {
  event: EventPlan;
  onUpdateBudget: (newBudget: BudgetItem[]) => void;
  onOpenAssistant: () => void;
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  event,
  onUpdateBudget,
  onOpenAssistant,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState("");
  const [allocated, setAllocated] = useState<number>(3000);
  const [spent, setSpent] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const totalAllocated = event.budget.reduce((acc, b) => acc + b.allocated, 0);
  const totalSpent = event.budget.reduce((acc, b) => acc + b.spent, 0);
  const remainingBudget = totalAllocated - totalSpent;
  const percentageSpent = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim()) return;

    const newItem: BudgetItem = {
      id: `b-${Date.now()}`,
      category: category.trim(),
      allocated: Number(allocated) || 0,
      spent: Number(spent) || 0,
      notes: notes.trim() || "Added via ledger",
    };

    onUpdateBudget([...event.budget, newItem]);
    setCategory("");
    setAllocated(3000);
    setSpent(0);
    setNotes("");
    setShowAddForm(false);
  };

  const handleUpdateSpent = (id: string, delta: number) => {
    const updated = event.budget.map((item) => {
      if (item.id === id) {
        const nextSpent = Math.max(0, item.spent + delta);
        return { ...item, spent: nextSpent };
      }
      return item;
    });
    onUpdateBudget(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Master Budget Metric Card */}
      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E2ECE5] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">
                Financial Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
                Balanced Split
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#2D3748]">
              Budget Ledger & Allocation
            </h2>
            <p className="text-xs sm:text-sm text-[#718096]">
              Real-time progress bars with emerald indicators for variance tracking
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2.5 rounded-xl bg-[#10B981] text-white text-xs sm:text-sm font-semibold hover:bg-[#059669] flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
            <button
              onClick={onOpenAssistant}
              className="px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-xs sm:text-sm font-semibold text-[#2D3748] hover:bg-[#EBF3EE] hover:border-[#10B981] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#10B981]" /> AI Optimizer
            </button>
          </div>
        </div>

        {/* Master Emerald Progress Bar */}
        <div className="space-y-3 bg-[#F4F7F5] p-5 rounded-2xl border border-[#E2ECE5]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <div className="flex items-center gap-3">
              <span className="text-[#2D3748]">
                Committed: <span className="text-base text-[#10B981] font-bold">${totalSpent.toLocaleString()}</span>
              </span>
              <span className="text-[#718096]">|</span>
              <span className="text-[#718096]">
                Target Ceiling: <span className="text-base text-[#2D3748] font-bold">${totalAllocated.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#718096]">Available Cushion:</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#E2ECE5] text-[#10B981] font-bold">
                ${remainingBudget.toLocaleString()}
              </span>
            </div>
          </div>

          {/* ACCENT PROGRESS BAR: #10B981 */}
          <div className="w-full h-4 bg-[#FFFFFF] rounded-full overflow-hidden border border-[#E2ECE5] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#34D399] to-[#10B981] rounded-full progress-fill shadow-inner"
              style={{ width: `${Math.min(percentageSpent, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#718096]">
            <span>0% Commenced</span>
            <span className="font-bold text-[#10B981]">{percentageSpent}% Utilized</span>
            <span>100% Fully Disbursed</span>
          </div>
        </div>
      </div>

      {/* Add Item Form Modal/Collapsible */}
      {showAddForm && (
        <form
          onSubmit={handleAddItem}
          className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#10B981]/50 shadow-md animate-in fade-in space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#2D3748]">
              Add New Budget Category
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[#718096] hover:text-[#2D3748] text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#718096] mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Acoustic Trio & Sound Tech"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#718096] mb-1">
                Allocated Budget ($)
              </label>
              <input
                type="number"
                value={allocated}
                onChange={(e) => setAllocated(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#718096] mb-1">
                Already Spent ($)
              </label>
              <input
                type="number"
                value={spent}
                onChange={(e) => setSpent(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#718096] mb-1">
              Scope & Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Covers 4 hours live performance + sound engineer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] cursor-pointer"
            >
              Save Line Item
            </button>
          </div>
        </form>
      )}

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {event.budget.map((item) => {
          const itemPct = item.allocated > 0 ? Math.round((item.spent / item.allocated) * 100) : 0;
          const isOver = item.spent > item.allocated;

          return (
            <div
              key={item.id}
              className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2ECE5] shadow-2xs hover:border-[#10B981]/50 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#2D3748]">
                    {item.category}
                  </h4>
                  <p className="text-xs text-[#718096] mt-0.5">{item.notes}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    isOver
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "bg-[#E6F7F0] text-[#10B981] border-[#A7F3D0]"
                  }`}
                >
                  {itemPct}%
                </span>
              </div>

              {/* Progress bar per category */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-[#2D3748]">
                    ${item.spent.toLocaleString()} spent
                  </span>
                  <span className="text-[#718096]">
                    cap: ${item.allocated.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F4F7F5] rounded-full overflow-hidden border border-[#E2ECE5]">
                  <div
                    className={`h-full rounded-full progress-fill ${
                      isOver ? "bg-rose-500" : "bg-[#10B981]"
                    }`}
                    style={{ width: `${Math.min(itemPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Quick adjustment buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E2ECE5]/70 text-xs">
                <span className="text-[11px] text-[#718096]">
                  Remaining: ${(item.allocated - item.spent).toLocaleString()}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateSpent(item.id, -250)}
                    className="px-2 py-1 rounded-md bg-[#F4F7F5] text-[#2D3748] hover:bg-[#E2ECE5] text-[11px] font-semibold cursor-pointer"
                    title="Decrease spent by $250"
                  >
                    -$250
                  </button>
                  <button
                    onClick={() => handleUpdateSpent(item.id, 250)}
                    className="px-2 py-1 rounded-md bg-[#E6F7F0] text-[#059669] hover:bg-[#A7F3D0] text-[11px] font-semibold cursor-pointer"
                    title="Increase spent by $250"
                  >
                    +$250
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
