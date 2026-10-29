import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type EventType =
  | "Birthday"
  | "Wedding"
  | "Conference"
  | "Corporate"
  | "Product Launch"
  | "Gala"
  | "Networking"
  | "Retreat"
  | "Exhibition"
  | "Other";

export type TierType = "Starter" | "Basic" | "Professional";

export interface IEvaluationSummary {
  eventVibe?: string;
  feasibilityAssessment?: string;
  costPerGuest?: number;
}

export interface IBudgetBreakdownItem {
  category: string;
  allocatedAmount: number;
  percentage: number;
  sliderMin: number;
  sliderMax: number;
  spendStrategy: string;
}

export interface IPrepCalendarTask {
  id: string;
  title: string;
  department: string;
  actionType: "call" | "arrange" | "design" | "procure" | "setup";
  daysBeforeEvent: number;
  scheduledDate?: string; // YYYY-MM-DD concrete calendar date
  estimatedCost: number;
  actionBrief: string;
  priority: "high" | "medium" | "low";
  isCompleted?: boolean;
}

export interface IDayOfRunOfShowItem {
  timeSlot: string;
  activity: string;
  departmentInCharge: string;
  operationalNotes: string;
  dependency: string;
}

export interface IUserStatus extends Document {
  userId: Types.ObjectId;
  eventName: string;
  eventType: EventType;
  tier?: TierType;
  budget: number;
  guestCount: number;
  plannedItems?: string[];
  endDate: Date;
  evaluationSummary?: IEvaluationSummary;
  budgetBreakdown?: IBudgetBreakdownItem[];
  prepCalendarTasks?: IPrepCalendarTask[];
  dayOfRunOfShow?: IDayOfRunOfShowItem[];
  requirements?: string[];
  aiResponse?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserStatusModel extends Model<IUserStatus> {
  findActiveByUser(
    userId: Types.ObjectId | string,
    limit?: number
  ): Promise<IUserStatus[]>;
  findLatestByUser(
    userId: Types.ObjectId | string
  ): Promise<IUserStatus | null>;
}

// Subdocument Schema: Evaluation Summary
export const EvaluationSummarySchema = new Schema<IEvaluationSummary>(
  {
    eventVibe: { type: String, trim: true },
    feasibilityAssessment: { type: String, trim: true },
    costPerGuest: { type: Number, min: 0 },
  },
  { _id: false }
);

// Subdocument Schema: Budget Breakdown Item
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

// Subdocument Schema: Prep Calendar Task
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

// Subdocument Schema: Day Of Run Of Show Item
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

const UserStatusSchema = new Schema<IUserStatus, IUserStatusModel>(
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
        values: [
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
        ],
        message: "{VALUE} is not a supported event type",
      },
    },
    tier: {
      type: String,
      enum: {
        values: ["Starter", "Basic", "Professional"],
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
      default: [],
    },
    endDate: {
      type: Date,
      required: [true, "endDate is required"],
    },
    evaluationSummary: {
      type: EvaluationSummarySchema,
      default: () => ({}),
    },
    budgetBreakdown: {
      type: [BudgetBreakdownItemSchema],
      default: [],
    },
    prepCalendarTasks: {
      type: [PrepCalendarTaskSchema],
      default: [],
    },
    dayOfRunOfShow: {
      type: [DayOfRunOfShowItemSchema],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
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
  }
);

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

// Static Helper: Lean query for fetching user blueprints
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

// Static Helper: Fetch most recent blueprint for a user
UserStatusSchema.statics.findLatestByUser = function (
  userId: Types.ObjectId | string
) {
  return this.findOne({ userId }).sort({ updatedAt: -1 });
};

const UserStatus: IUserStatusModel =
  (mongoose.models.UserStatus as IUserStatusModel) ||
  mongoose.model<IUserStatus, IUserStatusModel>("UserStatus", UserStatusSchema);

export default UserStatus;
