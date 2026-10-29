import mongoose, { Schema, Document, Model, Types } from "mongoose";

// =========================================================================
// Single Source of Truth Constants & Domain Types
// =========================================================================

export const VALID_EVENT_TYPES = [
  "Birthday",
  "Wedding",
  "Conference",
  "Corporate",
  "Product Launch",
  "Gala",
  "Networking",
  "Retreat",
  "Exhibition",
  "Other",
] as const;

export type EventType = (typeof VALID_EVENT_TYPES)[number];

export const VALID_TIERS = ["Starter", "Basic", "Professional"] as const;
export type TierType = (typeof VALID_TIERS)[number];

export const VALID_ACTION_TYPES = [
  "call",
  "arrange",
  "design",
  "procure",
  "setup",
] as const;
export type ActionType = (typeof VALID_ACTION_TYPES)[number];

export const VALID_PRIORITIES = ["high", "medium", "low"] as const;
export type PriorityType = (typeof VALID_PRIORITIES)[number];

// =========================================================================
// Subdocument Interfaces
// =========================================================================

/**
 * High-level AI evaluation summary of the planned event.
 */
export interface IEvaluationSummary {
  eventVibe?: string;
  feasibilityAssessment?: string;
  costPerGuest?: number;
}

/**
 * Individual budget allocation item across distinct event spend categories.
 */
export interface IBudgetBreakdownItem {
  category: string;
  allocatedAmount: number;
  percentage: number;
  sliderMin: number;
  sliderMax: number;
  spendStrategy: string;
}

/**
 * Concrete prep task milestone synchronized onto the interactive master calendar.
 */
export interface IPrepCalendarTask {
  id: string;
  title: string;
  department: string;
  actionType: ActionType;
  daysBeforeEvent: number;
  scheduledDate?: string; // YYYY-MM-DD concrete calendar date
  estimatedCost: number;
  actionBrief: string;
  priority: PriorityType;
  isCompleted?: boolean;
}

/**
 * Scheduled operational item for the live day-of execution run-of-show.
 */
export interface IDayOfRunOfShowItem {
  timeSlot: string;
  activity: string;
  departmentInCharge: string;
  operationalNotes: string;
  dependency: string;
}

// =========================================================================
// Document & Model Interfaces
// =========================================================================

/**
 * Methods available on individual UserStatus document instances.
 */
export interface IUserStatusMethods {
  /**
   * Toggles or explicitly sets the completion status of a task by ID or task-index.
   * Returns true if a task was found and updated, false otherwise.
   */
  toggleTask(taskId: string, explicitStatus?: boolean): boolean;
  /**
   * Returns completion metrics for prep calendar tasks.
   */
  getCompletionMetrics(): {
    completedCount: number;
    totalCount: number;
    percentage: number;
  };
}

/**
 * Main Mongoose document interface for UserStatus.
 */
export interface IUserStatus extends Document, IUserStatusMethods {
  userId: Types.ObjectId;
  eventName: string;
  eventType: EventType;
  tier?: TierType;
  budget: number;
  guestCount: number;
  plannedItems: string[];
  endDate: Date;
  evaluationSummary?: IEvaluationSummary;
  budgetBreakdown: IBudgetBreakdownItem[];
  prepCalendarTasks: IPrepCalendarTask[];
  dayOfRunOfShow: IDayOfRunOfShowItem[];
  requirements: string[];
  aiResponse?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  // Computed virtual properties
  daysUntilEvent?: number;
  isPastEvent?: boolean;
  totalAllocatedBudget?: number;
}

/**
 * Static query helper interface on the UserStatus Mongoose Model.
 */
export interface IUserStatusModel extends Model<IUserStatus, {}, IUserStatusMethods> {
  /**
   * Retrieves active blueprints for a user with lean projection and reverse chronological sorting.
   */
  findActiveByUser(
    userId: Types.ObjectId | string,
    limit?: number
  ): Promise<IUserStatus[]>;
  /**
   * Retrieves the most recently modified blueprint document for a user.
   */
  findLatestByUser(
    userId: Types.ObjectId | string
  ): Promise<IUserStatus | null>;
}

// =========================================================================
// Subdocument Schemas (Configured with _id: false for memory & wire efficiency)
// =========================================================================

export const EvaluationSummarySchema = new Schema<IEvaluationSummary>(
  {
    eventVibe: { type: String, trim: true },
    feasibilityAssessment: { type: String, trim: true },
    costPerGuest: { type: Number, min: 0 },
  },
  { _id: false }
);

export const BudgetBreakdownItemSchema = new Schema<IBudgetBreakdownItem>(
  {
    category: { type: String, required: true, trim: true },
    allocatedAmount: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    sliderMin: { type: Number, default: 0 },
    sliderMax: { type: Number, default: 0 },
    spendStrategy: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

export const PrepCalendarTaskSchema = new Schema(
  {
    id: { type: String, index: true },
    title: { type: String, trim: true },
    department: { type: String, trim: true },
    actionType: { type: String, trim: true },
    daysBeforeEvent: { type: Number, default: 0 },
    scheduledDate: { type: String, trim: true },
    estimatedCost: { type: Number, default: 0, min: 0 },
    actionBrief: { type: String, trim: true },
    priority: { type: String, trim: true, default: "medium" },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false, strict: false }
);

export const DayOfRunOfShowItemSchema = new Schema<IDayOfRunOfShowItem>(
  {
    timeSlot: { type: String, required: true, trim: true },
    activity: { type: String, required: true, trim: true },
    departmentInCharge: { type: String, trim: true, default: "Event Operations" },
    operationalNotes: { type: String, trim: true, default: "" },
    dependency: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// =========================================================================
// Main UserStatus Schema Definition
// =========================================================================

const UserStatusSchema = new Schema<IUserStatus, IUserStatusModel, IUserStatusMethods>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
    eventName: {
      type: String,
      required: [true, "eventName is required"],
      trim: true,
      maxlength: [120, "eventName cannot exceed 120 characters"],
    },
    eventType: {
      type: String,
      required: [true, "eventType is required"],
      enum: {
        values: VALID_EVENT_TYPES as unknown as string[],
        message: "{VALUE} is not a supported event type",
      },
    },
    tier: {
      type: String,
      enum: {
        values: VALID_TIERS as unknown as string[],
        message: "tier must be Starter, Basic or Professional",
      },
      default: "Starter",
    },
    budget: {
      type: Number,
      required: [true, "budget is required"],
      min: [0, "budget cannot be negative"],
    },
    guestCount: {
      type: Number,
      required: [true, "guestCount is required"],
      min: [1, "guestCount must be at least 1"],
    },
    plannedItems: {
      type: [String],
      default: () => [],
    },
    endDate: {
      type: Date,
      required: [true, "endDate is required"],
      validate: {
        validator: (v: any) => v instanceof Date && !isNaN(v.getTime()),
        message: "endDate must be a valid calendar date",
      },
    },
    evaluationSummary: {
      type: EvaluationSummarySchema,
      default: () => ({}),
    },
    budgetBreakdown: {
      type: [BudgetBreakdownItemSchema],
      default: () => [],
    },
    prepCalendarTasks: {
      type: [PrepCalendarTaskSchema],
      default: () => [],
    },
    dayOfRunOfShow: {
      type: [DayOfRunOfShowItemSchema],
      default: () => [],
    },
    requirements: {
      type: [String],
      default: () => [],
    },
    aiResponse: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt on create & update
    minimize: true,   // Efficiently drops empty objects to minimize BSON payload
    autoIndex: process.env.NODE_ENV !== "production", // Builds indexes in dev/test; prevents blocking locks in prod
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =========================================================================
// Virtual Properties
// =========================================================================

// Days remaining until the target event date
UserStatusSchema.virtual("daysUntilEvent").get(function () {
  if (!this.endDate) return undefined;
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUtc = Date.UTC(
    this.endDate.getFullYear(),
    this.endDate.getMonth(),
    this.endDate.getDate()
  );
  return Math.ceil((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
});

// Whether the event has concluded
UserStatusSchema.virtual("isPastEvent").get(function () {
  if (!this.endDate) return false;
  return new Date() > this.endDate;
});

// Total allocated budget computed across budget breakdown categories
UserStatusSchema.virtual("totalAllocatedBudget").get(function () {
  if (!Array.isArray(this.budgetBreakdown)) return 0;
  return this.budgetBreakdown.reduce(
    (sum, item) => sum + (Number(item?.allocatedAmount) || 0),
    0
  );
});

// =========================================================================
// Instance Methods
// =========================================================================

UserStatusSchema.methods.toggleTask = function (
  taskId: string,
  explicitStatus?: boolean
): boolean {
  if (!Array.isArray(this.prepCalendarTasks)) return false;

  const indexMatch = String(taskId).match(/^task-(\d+)$/i);
  let taskFound = false;

  const updatedTasks = this.prepCalendarTasks.map((task: any, index: number) => {
    const isTarget =
      task.id === taskId ||
      (indexMatch && parseInt(indexMatch[1], 10) === index);

    if (isTarget) {
      taskFound = true;
      const newStatus =
        explicitStatus !== undefined ? Boolean(explicitStatus) : !task.isCompleted;
      return { ...task, isCompleted: newStatus };
    }
    return task;
  });

  if (taskFound) {
    this.prepCalendarTasks = updatedTasks;
    this.markModified("prepCalendarTasks");
  }

  return taskFound;
};

UserStatusSchema.methods.getCompletionMetrics = function () {
  const tasks = this.prepCalendarTasks || [];
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t: any) => Boolean(t.isCompleted)).length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  return { completedCount, totalCount, percentage };
};

// =========================================================================
// Compound Performance Indexes for High-Frequency Queries
// =========================================================================

// 1. Covered index for listing user blueprints sorted by newest first (/api/user-status GET)
UserStatusSchema.index({ userId: 1, createdAt: -1 });

// 2. Index for retrieving the most recently modified blueprint (/api/tasks/toggle, /api/chat)
UserStatusSchema.index({ userId: 1, updatedAt: -1 });

// 3. Compound index for exact blueprint retrieval by name per user
UserStatusSchema.index({ userId: 1, eventName: 1 });

// 4. Index for chronological timeline and calendar date range queries
UserStatusSchema.index({ userId: 1, endDate: 1 });

// =========================================================================
// Static Model Helpers
// =========================================================================

UserStatusSchema.statics.findActiveByUser = function (
  userId: Types.ObjectId | string,
  limit = 50
) {
  return this.find({ userId })
    .populate("userId", "name email image")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

UserStatusSchema.statics.findLatestByUser = function (
  userId: Types.ObjectId | string
) {
  return this.findOne({ userId }).sort({ updatedAt: -1 });
};

// =========================================================================
// Model Export
// =========================================================================

const UserStatus: IUserStatusModel =
  (mongoose.models.UserStatus as unknown as IUserStatusModel) ||
  mongoose.model<IUserStatus, IUserStatusModel>("UserStatus", UserStatusSchema);

export default UserStatus;
