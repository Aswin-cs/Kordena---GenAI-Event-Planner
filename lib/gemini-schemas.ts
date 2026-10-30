/**
 * Shared Gemini JSON Response Schema definitions for event planning API endpoints.
 * Used across /api/ai-evaluate and /api/chat to guarantee consistent structure and prevent schema drift.
 */

export const geminiBudgetBreakdownSchema = {
  type: "array" as const,
  description: "Allocations mapped strictly to plannedItems with sliders limits",
  items: {
    type: "object" as const,
    properties: {
      category: { type: "string" as const },
      allocatedAmount: { type: "number" as const },
      percentage: { type: "number" as const },
      sliderMin: { type: "number" as const },
      sliderMax: { type: "number" as const },
      spendStrategy: { type: "string" as const },
    },
    required: [
      "category",
      "allocatedAmount",
      "percentage",
      "sliderMin",
      "sliderMax",
      "spendStrategy",
    ],
  },
};

export const geminiPrepCalendarTasksSchema = {
  type: "array" as const,
  description: "Pre-event countdown prep tasks scheduled leading up to the event",
  items: {
    type: "object" as const,
    properties: {
      id: { type: "string" as const },
      title: { type: "string" as const },
      department: { type: "string" as const },
      actionType: {
        type: "string" as const,
        enum: ["call", "arrange", "design", "procure", "setup"],
      },
      scheduledDate: {
        type: "string" as const,
        description: "Actual calendar date in YYYY-MM-DD format",
      },
      daysBeforeEvent: {
        type: "number" as const,
        description: "Countdown days before the event date",
      },
      estimatedCost: { type: "number" as const },
      actionBrief: {
        type: "string" as const,
        description: "Vendor calling script, inquiry points, or checklist",
      },
      priority: {
        type: "string" as const,
        enum: ["high", "medium", "low"],
      },
      isCompleted: { type: "boolean" as const },
    },
    required: [
      "id",
      "title",
      "department",
      "actionType",
      "scheduledDate",
      "daysBeforeEvent",
      "estimatedCost",
      "actionBrief",
      "priority",
    ],
  },
};

export const geminiDayOfRunOfShowSchema = {
  type: "array" as const,
  description: "Minute-by-minute hourly timeline for the event day",
  items: {
    type: "object" as const,
    properties: {
      timeSlot: { type: "string" as const },
      activity: { type: "string" as const },
      departmentInCharge: { type: "string" as const },
      operationalNotes: { type: "string" as const },
      dependency: { type: "string" as const },
    },
    required: [
      "timeSlot",
      "activity",
      "departmentInCharge",
      "operationalNotes",
      "dependency",
    ],
  },
};

export const geminiMediatorStarterPromptsSchema = {
  type: "array" as const,
  description:
    "Pre-crafted suggestions the chatbot offers to help the user fine-tune the calendar",
  items: { type: "string" as const },
};

