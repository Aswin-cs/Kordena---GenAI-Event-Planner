import test from "node:test";
import assert from "node:assert/strict";

/**
 * Chat Response Type Contract Definition
 */
export interface ChatResponsePayload {
  type: "question" | "edit";
  reply: string;
  isEditApplied: boolean;
  updatedFields?: {
    budgetBreakdown?: Array<{
      category: string;
      allocatedAmount: number;
      percentage: number;
      sliderMin?: number;
      sliderMax?: number;
      spendStrategy?: string;
    }>;
    prepCalendarTasks?: Array<{
      id: string;
      title: string;
      department: string;
      actionType: "call" | "arrange" | "design" | "procure" | "setup";
      daysBeforeEvent: number;
      scheduledDate?: string;
      estimatedCost: number;
      actionBrief: string;
      priority: "high" | "medium" | "low";
    }>;
    dayOfRunOfShow?: Array<{
      timeSlot: string;
      activity: string;
      departmentInCharge: string;
      operationalNotes: string;
      dependency: string;
    }>;
    requirements?: string[];
  };
}

/**
 * Validates the structure and consistency of a chat response payload.
 */
export function validateChatResponse(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Payload must be a non-null object"] };
  }

  const payload = data as Partial<ChatResponsePayload>;

  if (payload.type !== "question" && payload.type !== "edit") {
    errors.push("Field 'type' must be either 'question' or 'edit'");
  }

  if (typeof payload.reply !== "string" || !payload.reply.trim()) {
    errors.push("Field 'reply' must be a non-empty string");
  }

  if (typeof payload.isEditApplied !== "boolean") {
    errors.push("Field 'isEditApplied' must be a boolean");
  }

  if (payload.type === "question") {
    if (payload.isEditApplied === true) {
      errors.push("Question response should have 'isEditApplied: false'");
    }
  }

  if (payload.type === "edit") {
    if (!payload.updatedFields || typeof payload.updatedFields !== "object") {
      errors.push("Edit response must provide an 'updatedFields' object");
    } else {
      const { budgetBreakdown, prepCalendarTasks, dayOfRunOfShow, requirements } = payload.updatedFields;

      if (budgetBreakdown) {
        if (!Array.isArray(budgetBreakdown)) {
          errors.push("'budgetBreakdown' must be an array");
        } else {
          for (let i = 0; i < budgetBreakdown.length; i++) {
            const b = budgetBreakdown[i];
            if (!b.category || typeof b.allocatedAmount !== "number" || typeof b.percentage !== "number") {
              errors.push(`budgetBreakdown item ${i} is missing required category/allocatedAmount/percentage`);
            }
          }
        }
      }

      if (prepCalendarTasks) {
        if (!Array.isArray(prepCalendarTasks)) {
          errors.push("'prepCalendarTasks' must be an array");
        } else {
          for (let i = 0; i < prepCalendarTasks.length; i++) {
            const t = prepCalendarTasks[i];
            if (!t.title || !t.department || typeof t.daysBeforeEvent !== "number" || !t.priority) {
              errors.push(`prepCalendarTasks item ${i} is missing required title/department/daysBeforeEvent/priority`);
            }
          }
        }
      }

      if (dayOfRunOfShow) {
        if (!Array.isArray(dayOfRunOfShow)) {
          errors.push("'dayOfRunOfShow' must be an array");
        } else {
          for (let i = 0; i < dayOfRunOfShow.length; i++) {
            const ros = dayOfRunOfShow[i];
            if (!ros.timeSlot || !ros.activity || !ros.departmentInCharge) {
              errors.push(`dayOfRunOfShow item ${i} is missing required timeSlot/activity/departmentInCharge`);
            }
          }
        }
      }

      if (requirements && !Array.isArray(requirements)) {
        errors.push("'requirements' must be an array of strings");
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

test("Chat API Response Schema Validation", async (t) => {
  await t.test("accepts a valid question response", () => {
    const validQuestion: ChatResponsePayload = {
      type: "question",
      reply: "The event is scheduled for November 15, 2026. AV load-in begins at 08:00 AM.",
      isEditApplied: false,
    };

    const result = validateChatResponse(validQuestion);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  await t.test("accepts a valid edit response with prep tasks and budget", () => {
    const validEdit: ChatResponsePayload = {
      type: "edit",
      reply: "I have added the AV load-in milestone to your preparation calendar.",
      isEditApplied: true,
      updatedFields: {
        prepCalendarTasks: [
          {
            id: "task-1",
            title: "Rigging and Soundcheck",
            department: "Tech & Staging",
            actionType: "setup",
            daysBeforeEvent: 1,
            scheduledDate: "2026-11-14",
            estimatedCost: 20000,
            actionBrief: "Ensure line arrays and stage monitor checks pass before evening.",
            priority: "high",
          },
        ],
        budgetBreakdown: [
          {
            category: "Audio/Visual",
            allocatedAmount: 20000,
            percentage: 20,
            spendStrategy: "Ensures concert-grade acoustic fidelity.",
          },
        ],
      },
    };

    const result = validateChatResponse(validEdit);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  await t.test("accepts run of show updates with valid schema", () => {
    const validRosEdit: ChatResponsePayload = {
      type: "edit",
      reply: "Updated the day-of run of show schedule.",
      isEditApplied: true,
      updatedFields: {
        dayOfRunOfShow: [
          {
            timeSlot: "08:00 AM - 09:00 AM",
            activity: "Stage & Lighting Crew Call",
            departmentInCharge: "Production Crew",
            operationalNotes: "Power check and console warmup",
            dependency: "Venue access open",
          },
          {
            timeSlot: "09:00 AM - 10:00 AM",
            activity: "Keynote Rehearsal",
            departmentInCharge: "Speakers & Stage",
            operationalNotes: "Slide deck and lapel mic check",
            dependency: "Stage & Lighting Crew Call",
          },
        ],
      },
    };

    const result = validateChatResponse(validRosEdit);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  await t.test("rejects malformed payload missing reply or invalid type", () => {
    const invalidPayload = {
      type: "unknown-type",
      isEditApplied: false,
    };

    const result = validateChatResponse(invalidPayload);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((err) => err.includes("type")));
    assert.ok(result.errors.some((err) => err.includes("reply")));
  });

  await t.test("rejects edit response missing required task fields", () => {
    const incompleteEdit = {
      type: "edit",
      reply: "Updating tasks...",
      isEditApplied: true,
      updatedFields: {
        prepCalendarTasks: [
          {
            id: "incomplete-task",
            // missing title, department, daysBeforeEvent, priority
          },
        ],
      },
    };

    const result = validateChatResponse(incompleteEdit);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((err) => err.includes("prepCalendarTasks item 0")));
  });
});

