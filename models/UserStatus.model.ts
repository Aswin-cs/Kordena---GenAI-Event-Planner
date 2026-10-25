import mongoose, { Schema, Document, Model } from "mongoose";

const UserStatusSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    eventName: {
        type: String,
        required: true,
    },
    eventType: {
        type: String,
        required: true,
        enum: ["Birthday", "Wedding", "Conference", "Corporate", "Other"]
    },
    budget: {
        type: Number,
        required: true,
    },
    guestCount: {
        type: Number,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },

})

const UserStatus =
    mongoose.models.UserStatus || mongoose.model("UserStatus", UserStatusSchema);

export default UserStatus;

