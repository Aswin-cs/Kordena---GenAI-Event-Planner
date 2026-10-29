import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import UserStatus, {
  PrepCalendarTaskSchema,
  BudgetBreakdownItemSchema,
  DayOfRunOfShowItemSchema,
  EvaluationSummarySchema,
} from "../models/UserStatus.model";

test("UserStatus Model Efficiency & Schema Optimization Audit", async (t) => {
  await t.test("defines compound performance indexes to eliminate in-memory sorting and collection scans", () => {
    const indexes = UserStatus.schema.indexes();

    // Check compound index for /api/user-status GET: { userId: 1, createdAt: -1 }
    const hasUserCreatedAt = indexes.some(
      ([fields]) => fields.userId === 1 && fields.createdAt === -1
    );
    assert.ok(hasUserCreatedAt, "Must define { userId: 1, createdAt: -1 } compound index");

    // Check compound index for latest modified document: { userId: 1, updatedAt: -1 }
    const hasUserUpdatedAt = indexes.some(
      ([fields]) => fields.userId === 1 && fields.updatedAt === -1
    );
    assert.ok(hasUserUpdatedAt, "Must define { userId: 1, updatedAt: -1 } compound index");

    // Check compound index for named blueprint retrieval: { userId: 1, eventName: 1 }
    const hasUserEventName = indexes.some(
      ([fields]) => fields.userId === 1 && fields.eventName === 1
    );
    assert.ok(hasUserEventName, "Must define { userId: 1, eventName: 1 } compound index");

    // Check index for timeline / date range queries: { userId: 1, endDate: 1 }
    const hasUserEndDate = indexes.some(
      ([fields]) => fields.userId === 1 && fields.endDate === 1
    );
    assert.ok(hasUserEndDate, "Must define { userId: 1, endDate: 1 } compound index");
  });

  await t.test("subdocuments disable automatic _id generation to prevent memory and storage bloat", () => {
    assert.strictEqual(
      (PrepCalendarTaskSchema as any).options._id,
      false,
      "PrepCalendarTaskSchema must have _id: false"
    );
    assert.strictEqual(
      (BudgetBreakdownItemSchema as any).options._id,
      false,
      "BudgetBreakdownItemSchema must have _id: false"
    );
    assert.strictEqual(
      (DayOfRunOfShowItemSchema as any).options._id,
      false,
      "DayOfRunOfShowItemSchema must have _id: false"
    );
    assert.strictEqual(
      (EvaluationSummarySchema as any).options._id,
      false,
      "EvaluationSummarySchema must have _id: false"
    );
  });

  await t.test("schema enables minimize to strip empty objects and minimize BSON payload", () => {
    assert.strictEqual(
      (UserStatus.schema as any).options.minimize,
      true,
      "UserStatusSchema must have minimize: true"
    );
  });

  await t.test("static query optimization helpers exist on UserStatus model", () => {
    assert.strictEqual(typeof (UserStatus as any).findActiveByUser, "function");
    assert.strictEqual(typeof (UserStatus as any).findLatestByUser, "function");
  });
});

