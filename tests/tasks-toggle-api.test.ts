import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { PrepCalendarTaskSchema } from "../models/UserStatus.model";

test("PrepCalendarTaskSchema - isCompleted Field Persistence", async (t) => {
  const TestTaskModel = mongoose.models.TestTask || mongoose.model("TestTask", PrepCalendarTaskSchema);

  await t.test("defaults isCompleted to false when omitted", () => {
    const task = new TestTaskModel({
      id: "task-101",
      title: "Audio Soundcheck Rigging",
      department: "Tech & Staging",
      actionType: "setup",
      daysBeforeEvent: 2,
      estimatedCost: 15000,
      actionBrief: "Conduct technical soundcheck.",
      priority: "high",
    });

    assert.strictEqual(task.isCompleted, false);
    assert.strictEqual(task.id, "task-101");
  });

  await t.test("allows setting isCompleted to true explicitly", () => {
    const task = new TestTaskModel({
      id: "task-102",
      title: "Catering Menu Tasting",
      department: "Food & Beverage",
      actionType: "call",
      daysBeforeEvent: 7,
      estimatedCost: 8000,
      actionBrief: "Confirm dietary options.",
      priority: "medium",
      isCompleted: true,
    });

    assert.strictEqual(task.isCompleted, true);
  });

  await t.test("toggles isCompleted value dynamically", () => {
    const task = new TestTaskModel({
      id: "task-103",
      title: "Badge & Lanyard Printing",
      isCompleted: false,
    });

    assert.strictEqual(task.isCompleted, false);

    // Toggle to true
    task.isCompleted = !task.isCompleted;
    assert.strictEqual(task.isCompleted, true);

    // Toggle back to false
    task.isCompleted = !task.isCompleted;
    assert.strictEqual(task.isCompleted, false);
  });
});

test("Task Toggle Logic - In-Memory Array State Synchronization", async (t) => {
  const sampleTasks = [
    {
      id: "t-1",
      title: "Task 1",
      department: "Tech",
      isCompleted: false,
    },
    {
      id: "t-2",
      title: "Task 2",
      department: "Catering",
      isCompleted: true,
    },
    {
      id: "t-3",
      title: "Task 3",
      department: "Decor",
      isCompleted: false,
    },
  ];

  function toggleTaskInList(
    tasks: typeof sampleTasks,
    taskId: string,
    explicitCompleted?: boolean
  ) {
    const indexMatch = String(taskId).match(/^task-(\d+)$/i);
    const parsedIdx = indexMatch ? parseInt(indexMatch[1], 10) : -1;

    let updated = false;
    const nextList = tasks.map((t, idx) => {
      const matchById = t.id === taskId;
      const matchByIndex = idx === parsedIdx;

      if (matchById || matchByIndex) {
        updated = true;
        return {
          ...t,
          isCompleted:
            explicitCompleted !== undefined
              ? Boolean(explicitCompleted)
              : !Boolean(t.isCompleted),
        };
      }
      return t;
    });

    return { nextList, updated };
  }

  await t.test("toggles task from false to true by custom id", () => {
    const { nextList, updated } = toggleTaskInList(sampleTasks, "t-1");
    assert.strictEqual(updated, true);
    assert.strictEqual(nextList[0].isCompleted, true);
  });

  await t.test("toggles task from true to false by custom id", () => {
    const { nextList, updated } = toggleTaskInList(sampleTasks, "t-2");
    assert.strictEqual(updated, true);
    assert.strictEqual(nextList[1].isCompleted, false);
  });

  await t.test("toggles task using index identifier (task-2 -> item 2)", () => {
    const { nextList, updated } = toggleTaskInList(sampleTasks, "task-2");
    assert.strictEqual(updated, true);
    assert.strictEqual(nextList[2].isCompleted, true);
  });

  await t.test("sets explicit isCompleted status", () => {
    const { nextList, updated } = toggleTaskInList(sampleTasks, "t-1", true);
    assert.strictEqual(updated, true);
    assert.strictEqual(nextList[0].isCompleted, true);

    const { nextList: recheck } = toggleTaskInList(nextList, "t-1", true);
    assert.strictEqual(recheck[0].isCompleted, true); // remains true
  });

  await t.test("returns updated: false for non-existent taskId", () => {
    const { updated } = toggleTaskInList(sampleTasks, "unknown-id");
    assert.strictEqual(updated, false);
  });
});

