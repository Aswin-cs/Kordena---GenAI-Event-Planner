import test from "node:test";
import assert from "node:assert/strict";
import {
  parseTargetEventDate,
  calculateDaysUntilEvent,
  parseTimeSlotToHours,
  calculateBudgetMetrics,
  calculateCompletionMetrics,
  filterPrepTasks,
} from "../lib/calendar-utils";
import { IPrepCalendarTask } from "../models/UserStatus.model";

test("Calendar Utils - parseTargetEventDate", async (t) => {
  await t.test("parses standard YYYY-MM-DD string accurately", () => {
    const result = parseTargetEventDate("2026-11-15");
    assert.strictEqual(result.getFullYear(), 2026);
    assert.strictEqual(result.getMonth(), 10); // 0-indexed: 10 is November
    assert.strictEqual(result.getDate(), 15);
  });

  await t.test("falls back to current date when empty or undefined", () => {
    const before = new Date();
    const result = parseTargetEventDate();
    const after = new Date();
    assert.ok(result.getTime() >= before.getTime() - 1000);
    assert.ok(result.getTime() <= after.getTime() + 1000);
  });

  await t.test("falls back gracefully when given invalid date string", () => {
    const result = parseTargetEventDate("invalid-date-string");
    assert.ok(!isNaN(result.getTime()));
  });
});

test("Calendar Utils - calculateDaysUntilEvent", async (t) => {
  await t.test("calculates positive days for future date", () => {
    const today = new Date(2026, 10, 1, 0, 0, 0); // Nov 1, 2026
    const target = new Date(2026, 10, 11, 0, 0, 0); // Nov 11, 2026
    const diff = calculateDaysUntilEvent(target, today);
    assert.strictEqual(diff, 10);
  });

  await t.test("returns 0 for today", () => {
    const today = new Date(2026, 10, 1, 10, 0, 0);
    const target = new Date(2026, 10, 1, 20, 0, 0);
    const diff = calculateDaysUntilEvent(target, today);
    assert.strictEqual(diff, 0);
  });

  await t.test("returns negative days for past event", () => {
    const today = new Date(2026, 10, 15, 0, 0, 0);
    const target = new Date(2026, 10, 10, 0, 0, 0);
    const diff = calculateDaysUntilEvent(target, today);
    assert.strictEqual(diff, -5);
  });
});

test("Calendar Utils - parseTimeSlotToHours", async (t) => {
  const baseDate = new Date(2026, 10, 10, 0, 0, 0);

  await t.test("parses morning AM to AM slot correctly", () => {
    const { start, end } = parseTimeSlotToHours(baseDate, "09:00 AM - 11:30 AM");
    assert.strictEqual(start.getHours(), 9);
    assert.strictEqual(start.getMinutes(), 0);
    assert.strictEqual(end.getHours(), 11);
    assert.strictEqual(end.getMinutes(), 30);
  });

  await t.test("parses afternoon PM to PM slot with 12-hour offset", () => {
    const { start, end } = parseTimeSlotToHours(baseDate, "02:00 PM - 04:30 PM");
    assert.strictEqual(start.getHours(), 14);
    assert.strictEqual(start.getMinutes(), 0);
    assert.strictEqual(end.getHours(), 16);
    assert.strictEqual(end.getMinutes(), 30);
  });

  await t.test("handles 12 PM (noon) and 12 AM (midnight) conversions", () => {
    const { start: noon } = parseTimeSlotToHours(baseDate, "12:00 PM - 01:00 PM");
    assert.strictEqual(noon.getHours(), 12);

    const { start: midnight } = parseTimeSlotToHours(baseDate, "12:00 AM - 01:00 AM");
    assert.strictEqual(midnight.getHours(), 0);
  });

  await t.test("provides 1-hour fallback when end time is omitted", () => {
    const { start, end } = parseTimeSlotToHours(baseDate, "10:00 AM");
    assert.strictEqual(start.getHours(), 10);
    assert.strictEqual(end.getHours(), 11);
  });

  await t.test("handles malformed string without throwing exceptions", () => {
    const { start, end } = parseTimeSlotToHours(baseDate, "invalid time slot");
    assert.ok(!isNaN(start.getTime()));
    assert.ok(!isNaN(end.getTime()));
    assert.ok(end.getTime() > start.getTime());
  });
});

test("Calendar Utils - calculateBudgetMetrics", async (t) => {
  await t.test("calculates total allocated and remaining buffer accurately", () => {
    const totalBudget = 100000;
    const items = [
      { allocatedAmount: 35000 },
      { allocatedAmount: 25000 },
      { allocatedAmount: 15000 },
    ];
    const metrics = calculateBudgetMetrics(totalBudget, items);

    assert.strictEqual(metrics.totalBudget, 100000);
    assert.strictEqual(metrics.totalAllocated, 75000);
    assert.strictEqual(metrics.remainingBuffer, 25000);
    assert.strictEqual(metrics.allocatedPercentage, 75);
    assert.strictEqual(metrics.isOverBudget, false);
  });

  await t.test("detects over budget condition accurately", () => {
    const totalBudget = 50000;
    const items = [
      { allocatedAmount: 40000 },
      { allocatedAmount: 20000 },
    ];
    const metrics = calculateBudgetMetrics(totalBudget, items);

    assert.strictEqual(metrics.totalAllocated, 60000);
    assert.strictEqual(metrics.remainingBuffer, -10000);
    assert.strictEqual(metrics.allocatedPercentage, 120);
    assert.strictEqual(metrics.isOverBudget, true);
  });

  await t.test("handles 0 budget and empty array safely", () => {
    const metrics = calculateBudgetMetrics(0, []);
    assert.strictEqual(metrics.totalBudget, 0);
    assert.strictEqual(metrics.totalAllocated, 0);
    assert.strictEqual(metrics.remainingBuffer, 0);
    assert.strictEqual(metrics.allocatedPercentage, 0);
    assert.strictEqual(metrics.isOverBudget, false);
  });
});

test("Calendar Utils - calculateCompletionMetrics", async (t) => {
  const sampleTasks = [
    { id: "task-1", title: "Task 1" },
    { id: "task-2", title: "Task 2" },
    { id: "task-3", title: "Task 3" },
    { id: "task-4", title: "Task 4" },
  ];

  await t.test("returns 0% when no tasks completed", () => {
    const result = calculateCompletionMetrics(sampleTasks, {});
    assert.strictEqual(result.total, 4);
    assert.strictEqual(result.completed, 0);
    assert.strictEqual(result.percentage, 0);
  });

  await t.test("calculates 50% when half completed", () => {
    const result = calculateCompletionMetrics(sampleTasks, { "task-1": true, "task-3": true });
    assert.strictEqual(result.total, 4);
    assert.strictEqual(result.completed, 2);
    assert.strictEqual(result.percentage, 50);
  });

  await t.test("calculates 100% when all completed", () => {
    const result = calculateCompletionMetrics(sampleTasks, {
      "task-1": true,
      "task-2": true,
      "task-3": true,
      "task-4": true,
    });
    assert.strictEqual(result.completed, 4);
    assert.strictEqual(result.percentage, 100);
  });

  await t.test("recognizes isCompleted property directly on tasks", () => {
    const tasksWithCompleted = [
      { id: "task-1", title: "Task 1", isCompleted: true },
      { id: "task-2", title: "Task 2", isCompleted: false },
      { id: "task-3", title: "Task 3", isCompleted: true },
      { id: "task-4", title: "Task 4" },
    ];
    const result = calculateCompletionMetrics(tasksWithCompleted);
    assert.strictEqual(result.total, 4);
    assert.strictEqual(result.completed, 2);
    assert.strictEqual(result.percentage, 50);
  });

  await t.test("returns 0 when task list is empty", () => {
    const result = calculateCompletionMetrics([], {});
    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.completed, 0);
    assert.strictEqual(result.percentage, 0);
  });
});

test("Calendar Utils - filterPrepTasks", async (t) => {
  const mockTasks: IPrepCalendarTask[] = [
    {
      id: "t-1",
      title: "Audio Soundcheck Rigging",
      department: "Tech & Staging",
      actionType: "setup",
      daysBeforeEvent: 2,
      estimatedCost: 15000,
      actionBrief: "Supervise staging and sound check.",
      priority: "high",
    },
    {
      id: "t-2",
      title: "Catering Menu Tasting",
      department: "Food & Beverage",
      actionType: "call",
      daysBeforeEvent: 7,
      estimatedCost: 8000,
      actionBrief: "Confirm dietary options and dessert setup.",
      priority: "medium",
    },
    {
      id: "t-3",
      title: "Badge & Lanyard Printing",
      department: "Guest Experience",
      actionType: "design",
      daysBeforeEvent: 5,
      estimatedCost: 5000,
      actionBrief: "Finalize attendee badge branding.",
      priority: "low",
    },
  ];

  await t.test("filters by department", () => {
    const filtered = filterPrepTasks(mockTasks, { department: "Tech & Staging" });
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, "t-1");
  });

  await t.test("filters by priority", () => {
    const filtered = filterPrepTasks(mockTasks, { priority: "high" });
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].priority, "high");
  });

  await t.test("filters by actionType", () => {
    const filtered = filterPrepTasks(mockTasks, { actionType: "call" });
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].actionType, "call");
  });

  await t.test("filters by text search across title and brief", () => {
    const filteredByTitle = filterPrepTasks(mockTasks, { searchQuery: "Rigging" });
    assert.strictEqual(filteredByTitle.length, 1);
    assert.strictEqual(filteredByTitle[0].id, "t-1");

    const filteredByBrief = filterPrepTasks(mockTasks, { searchQuery: "dietary" });
    assert.strictEqual(filteredByBrief.length, 1);
    assert.strictEqual(filteredByBrief[0].id, "t-2");
  });

  await t.test("returns all tasks when filters are set to 'all'", () => {
    const filtered = filterPrepTasks(mockTasks, {
      department: "all",
      priority: "all",
      actionType: "all",
      searchQuery: "",
    });
    assert.strictEqual(filtered.length, 3);
  });
});

