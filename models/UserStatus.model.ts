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

export interface IUserStatus extends Document {
  userId: Types.ObjectId;
  eventName: string;
  eventType: EventType;
  tier?: TierType;
  budget: number;
  guestCount: number;
  plannedItems?: string[];
  endDate: Date;
  selectedPlan?: string;
  decorations?: string[];
  arrangements?: string[];
  requirements?: string[];
  aiSummary?: string;
  aiResponse?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const UserStatusSchema = new Schema<IUserStatus>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    eventName: {
      type: String,
      required: [true, "eventName is required"],
      trim: true,
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
    // decorations: {
    //   type: [String],
    //   default: [],
    // },
    // arrangements: {
    //   type: [String],
    //   default: [],
    // },
    // requirements: {
    //   type: [String],
    //   default: [],
    // },
    aiResponse: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt on create & update
  }
);

const UserStatus: Model<IUserStatus> =
  mongoose.models.UserStatus ||
  mongoose.model<IUserStatus>("UserStatus", UserStatusSchema);

export default UserStatus;
