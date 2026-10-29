"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, Plus, Sparkles, Filter, User, Calendar, Check } from "lucide-react";
import { TaskItem, EventPlan } from "../types";

interface TasksSectionProps {
  event: EventPlan;
  onUpdateTasks: (newTasks: TaskItem[]) => void;
  onOpenAssistant: () => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  event,
  onUpdateTasks,
  onOpenAssistant,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<TaskItem["category"]>("Venue");
  const [newPriority, setNewPriority] = useState<TaskItem["priority"]>("High");
  const [newDeadline, setNewDeadline] = useState("In 10 Days");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const completedCount = event.tasks.filter((t) => t.completed).length;
  const totalCount = event.tasks.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleTask = (taskId: string) => {
    const updated = event.tasks.map((task) => {
      if (task.id === taskId) {
        const nextState = !task.completed;
        if (nextState) {
          showToast(`Completed: "${task.title.slice(0, 30)}..." ✨`);
        }
        return { ...task, completed: nextState };
      }
      return task;
    });
    onUpdateTasks(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      deadline: newDeadline.trim() || "Upcoming",
      completed: false,
      assignee: "Event Lead",
    };

    onUpdateTasks([newTask, ...event.tasks]);
    setNewTitle("");
    setShowAddModal(false);
    showToast("New milestone task registered!");
  };

  const handleAiSuggestTasks = () => {
    const aiTasks: TaskItem[] = [
      {
        id: `ai-t-${Date.now()}-1`,
        title: "Audit spatial audio calibration for keynote echo reduction",
        category: "Venue",
        deadline: "T-4 Days",
        completed: false,
        priority: "High",
        assignee: "Audio Engineer",
      },
      {
        id: `ai-t-${Date.now()}-2`,
        title: "Reconfirm zero-waste compostable serviceware with catering vendor",
        category: "Catering",
        deadline: "T-2 Days",
        completed: false,
        priority: "Medium",
        assignee: "Sustainability Officer",
      },
      {
        id: `ai-t-${Date.now()}-3`,
        title: "Send personalized SMS entry codes & parking coordinates to VIPs",
        category: "Guests",
        deadline: "T-1 Day",
        completed: false,
        priority: "High",
        assignee: "Guest Relations",
      },
    ];

    onUpdateTasks([...aiTasks, ...event.tasks]);
    showToast("Kordena AI generated 3 optimized event tasks! 🌿");
  };

  const filteredTasks = event.tasks.filter((task) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Pending") return !task.completed;
    if (activeFilter === "Completed") return task.completed;
    if (activeFilter === "High Priority") return task.priority === "High";
    return task.category === activeFilter;
  });

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFFFFF] border-2 border-[#10B981] text-[#2D3748] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <div className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-3" />
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Task Summary & Action Bar */}
      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E2ECE5] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">
                Operational Execution
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0]">
                {pct}% Complete
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#2D3748]">
              Milestone Checklist & Tasks
            </h2>
            <p className="text-xs sm:text-sm text-[#718096]">
              Clear visual feedback in mint green (#10B981) for fulfilled commitments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAiSuggestTasks}
              className="px-3.5 py-2.5 rounded-xl bg-[#E6F7F0] border border-[#A7F3D0] text-xs sm:text-sm font-semibold text-[#059669] hover:bg-[#A7F3D0]/70 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#10B981]" /> AI Suggest Tasks
            </button>
            <button
              onClick={() => setShowAddModal(!showAddModal)}
              className="px-4 py-2.5 rounded-xl bg-[#10B981] text-white text-xs sm:text-sm font-semibold hover:bg-[#059669] flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>

        {/* Visual Progress Bar for Tasks */}
        <div className="space-y-2 bg-[#F4F7F5] p-4 rounded-2xl border border-[#E2ECE5]">
          <div className="flex justify-between items-center text-xs font-semibold text-[#2D3748]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              {completedCount} of {totalCount} completed
            </span>
            <span className="text-[#10B981] font-bold">
              {totalCount - completedCount} tasks pending
            </span>
          </div>

          {/* ACCENT VISUAL FEEDBACK: #10B981 */}
          <div className="w-full h-3 bg-[#FFFFFF] rounded-full overflow-hidden border border-[#E2ECE5]">
            <div
              className="h-full bg-[#10B981] rounded-full progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {["All", "Pending", "Completed", "High Priority", "Venue", "Catering", "Program", "Decor", "Guests"].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === cat
                    ? "bg-[#10B981] text-white shadow-xs"
                    : "bg-[#F4F7F5] text-[#2D3748] border border-[#E2ECE5] hover:border-[#10B981]/50"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Add Task Modal / Collapse */}
      {showAddModal && (
        <form
          onSubmit={handleAddTask}
          className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#10B981]/50 shadow-md animate-in fade-in space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#2D3748]">
              Create New Event Milestone Task
            </h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-[#718096] hover:text-[#2D3748] text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#718096] mb-1">
              Task Description
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Review emergency exit plan with pavilion manager"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#718096] mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981]"
              >
                <option value="Venue">Venue</option>
                <option value="Catering">Catering</option>
                <option value="Program">Program</option>
                <option value="Decor">Decor</option>
                <option value="Guests">Guests</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#718096] mb-1">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981]"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#718096] mb-1">
                Target Deadline
              </label>
              <input
                type="text"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                placeholder="e.g., Nov 10, 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] border border-[#E2ECE5] text-sm text-[#2D3748] focus:bg-[#FFFFFF] focus:border-[#10B981]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] cursor-pointer"
            >
              Add to Checklist
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`group bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer flex items-center justify-between gap-4 ${
              task.completed
                ? "border-[#A7F3D0] bg-[#FFFFFF]/80"
                : "border-[#E2ECE5] hover:border-[#10B981]/60 hover:shadow-xs"
            }`}
          >
            {/* Left: Interactive Checkbox & Details */}
            <div className="flex items-start sm:items-center gap-3.5">
              {/* CLEAR VISUAL FEEDBACK: ACCENT #10B981 */}
              <button
                type="button"
                role="checkbox"
                aria-checked={task.completed}
                aria-label={`Mark task ${task.title} as ${task.completed ? "pending" : "completed"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTask(task.id);
                }}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all mt-0.5 sm:mt-0 ${
                  task.completed
                    ? "bg-[#10B981] text-white shadow-xs scale-105"
                    : "border-2 border-[#CBD5E1] group-hover:border-[#10B981] bg-[#F4F7F5]"
                }`}
              >
                {task.completed && <Check className="w-4 h-4 stroke-3 text-white" />}
              </button>

              <div className="space-y-1">
                <p
                  className={`text-sm font-semibold transition-all ${
                    task.completed
                      ? "line-through text-[#718096]"
                      : "text-[#2D3748] group-hover:text-[#10B981]"
                  }`}
                >
                  {task.title}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[#718096]">
                  <span className="px-2 py-0.5 rounded-md bg-[#F4F7F5] border border-[#E2ECE5] font-medium">
                    {task.category}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3 text-[#10B981]" /> {task.deadline}
                  </span>
                  {task.assignee && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#718096]" /> {task.assignee}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Status and Priority Pills */}
            <div className="flex items-center gap-2 shrink-0">
              {task.completed ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E6F7F0] text-[#10B981] border border-[#A7F3D0] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                </span>
              ) : (
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    task.priority === "High"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-[#F4F7F5] text-[#718096] border border-[#E2ECE5]"
                  }`}
                >
                  {task.priority} Priority
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="p-12 text-center bg-[#FFFFFF] rounded-3xl border border-[#E2ECE5]">
            <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-[#2D3748]">No tasks found</p>
            <p className="text-xs text-[#718096] mt-1">
              Switch filter view or create a new milestone task.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
