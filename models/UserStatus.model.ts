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

export interface IUserStatus extends Document {
  userId: Types.ObjectId;
  eventName: string;
  eventType: EventType;
  budget: number;
  guestCount: number;
  endDate: Date;
  selectedPlan?: string;
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
    selectedPlan: {
      type: String,
      default: "Professional Suite",
      trim: true,
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
    endDate: {
      type: Date,
      required: [true, "endDate is required"],
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
