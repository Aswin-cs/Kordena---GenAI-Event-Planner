"use client";

import React, { useState } from "react";
import { CheckCircle2, Plus, Sparkles, Check, X } from "lucide-react";
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
          showToast(`Completed: ${task.title.slice(0, 30)}${task.title.length > 30 ? "…" : ""}`);
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
    showToast("Task added to your checklist");
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
    showToast("Copilot added 3 suggested tasks");
  };

  const filteredTasks = event.tasks.filter((task) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Pending") return !task.completed;
    if (activeFilter === "Completed") return task.completed;
    if (activeFilter === "High Priority") return task.priority === "High";
    return task.category === activeFilter;
  });

  const STATUS_FILTERS = ["All", "Pending", "Completed", "High Priority"];
  const CATEGORY_FILTERS = ["Venue", "Catering", "Program", "Decor", "Guests"];
  const pending = totalCount - completedCount;

  return (
    <div className="ktask">
      {/* Toast */}
      {toastMessage && (
        <div className="ktask-toast" role="status">
          <span><Check className="w-3 h-3" /></span>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="ktask-head">
        <div className="ktask-headrow">
          <div>
            <h2 className="ktask-title">
              Tasks<span>{pct}%</span>
            </h2>
            <p className="ktask-sub">
              {completedCount} of {totalCount} complete · {pending} pending
            </p>
          </div>
          <div className="ktask-actions">
            <button type="button" onClick={handleAiSuggestTasks} className="ktask-btn ktask-btn--gold">
              <Sparkles className="w-4 h-4" /> Suggest with AI
            </button>
            <button type="button" onClick={() => setShowAddModal(!showAddModal)} className="ktask-btn ktask-btn--ink">
              <Plus className="w-4 h-4" /> Add task
            </button>
          </div>
        </div>

        <div
          className="ktask-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Task completion"
        >
          <i style={{ width: `${pct}%` }} />
        </div>

        <div className="ktask-filters">
          <div className="ktask-seg" role="group" aria-label="Status filter">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={activeFilter === f}
                onClick={() => setActiveFilter(f)}
                className={activeFilter === f ? "is-active" : ""}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="ktask-cats" role="group" aria-label="Category filter">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={activeFilter === f}
                onClick={() => setActiveFilter(activeFilter === f ? "All" : f)}
                className={activeFilter === f ? "is-active" : ""}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Add task form */}
      {showAddModal && (
        <form onSubmit={handleAddTask} className="ktask-form">
          <div className="ktask-formhead">
            <h3>New task</h3>
            <button type="button" onClick={() => setShowAddModal(false)} aria-label="Close form">
              <X className="w-4 h-4" />
            </button>
          </div>

          <label>
            <span>What needs to happen?</span>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Review emergency exit plan with the venue manager"
              required
              autoFocus
            />
          </label>

          <div className="ktask-formgrid">
            <label>
              <span>Category</span>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as TaskItem["category"])}>
                {CATEGORY_FILTERS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Priority</span>
              <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskItem["priority"])}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label>
              <span>Deadline</span>
              <input
                type="text"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                placeholder="e.g. Nov 10, 2026"
              />
            </label>
          </div>

          <div className="ktask-formfoot">
            <button type="submit" className="ktask-btn ktask-btn--ink">Add to checklist</button>
          </div>
        </form>
      )}

      {/* Task list */}
      <div className="ktask-list" role="list">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            role="listitem"
            onClick={() => toggleTask(task.id)}
            className={`ktask-row ktask-row--${task.priority.toLowerCase()} ${task.completed ? "is-done" : ""}`}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={task.completed}
              aria-label={`Mark task ${task.title} as ${task.completed ? "pending" : "completed"}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleTask(task.id);
              }}
              className="ktask-check"
            >
              {task.completed && <Check className="w-3.5 h-3.5" />}
            </button>

            <div className="ktask-info">
              <p className="ktask-name">{task.title}</p>
              <p className="ktask-meta">
                <span className="ktask-cat">{task.category}</span>
                <span>{task.deadline}</span>
                {task.assignee && <span>{task.assignee}</span>}
              </p>
            </div>

            {task.completed ? (
              <span className="ktask-state">Done</span>
            ) : (
              <span className={`ktask-prio ktask-prio--${task.priority.toLowerCase()}`}>
                <i />
                {task.priority}
              </span>
            )}
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="ktask-empty">
            <CheckCircle2 className="w-8 h-8" />
            <p>Nothing here</p>
            <span>Try another filter, or add a new task.</span>
          </div>
        )}
      </div>
    </div>
  );
};
