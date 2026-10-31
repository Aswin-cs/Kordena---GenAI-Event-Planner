import test from "node:test";
import assert from "node:assert/strict";
import { validateEventParameters } from "../lib/calendar-utils";
import { POST as evaluateHandler } from "../app/api/ai-evaluate/route";
import { POST as toggleHandler } from "../app/api/tasks/toggle/route";
import { POST as chatHandler } from "../app/api/chat/route";
import { POST as generateHandler } from "../app/api/generate/route";

test("Functional Validation - Event Parameters Boundary & Edge Cases", async (t) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  await t.test("budget minimum boundary: 0 and negative rejected, >0 accepted", () => {
    // Budget 0
    const zeroBudget = validateEventParameters({
      eventName: "Product Summit",
      eventType: "Conference",
      budget: 0,
      eventDate: tomorrowStr,
      guestCount: 50,
      planningItems: ["AV Equipment"],
    });
    assert.strictEqual(zeroBudget.isValid, false);
    assert.strictEqual(zeroBudget.isStep1Valid, false);
    assert.strictEqual(zeroBudget.errors.budget, "Estimated budget must be greater than ₹0.");
    assert.ok(zeroBudget.missingFields.includes("Estimated Budget"));

    // Negative budget
    const negativeBudget = validateEventParameters({
      eventName: "Product Summit",
      eventType: "Conference",
      budget: -500,
      eventDate: tomorrowStr,
      guestCount: 50,
      planningItems: ["AV Equipment"],
    });
    assert.strictEqual(negativeBudget.isValid, false);
    assert.strictEqual(negativeBudget.errors.budget, "Estimated budget must be greater than ₹0.");

    // Valid budget
    const validBudget = validateEventParameters({
      eventName: "Product Summit",
      eventType: "Conference",
      budget: 1000,
      eventDate: tomorrowStr,
      guestCount: 50,
      planningItems: ["AV Equipment"],
    });
    assert.strictEqual(validBudget.isValid, true);
    assert.strictEqual(validBudget.isStep1Valid, true);
    assert.strictEqual(validBudget.errors.budget, undefined);
  });

  await t.test("guestCount minimum boundary: 0 rejected, >=1 accepted", () => {
    const invalidZeroGuests = validateEventParameters({
      eventName: "VIP Strategy Session",
      eventType: "Retreat",
      budget: 25000,
      eventDate: tomorrowStr,
      guestCount: 0,
      planningItems: ["Private Room Booking"],
    });
    assert.strictEqual(invalidZeroGuests.isValid, false);
    assert.strictEqual(invalidZeroGuests.isStep1Valid, false);
    assert.strictEqual(invalidZeroGuests.errors.guestCount, "Guest count must be at least 1.");
    assert.ok(invalidZeroGuests.missingFields.includes("Guest Count"));

    const validSingleGuest = validateEventParameters({
      eventName: "VIP Strategy Session",
      eventType: "Retreat",
      budget: 25000,
      eventDate: tomorrowStr,
      guestCount: 1,
      planningItems: ["Private Room Booking"],
    });
    assert.strictEqual(validSingleGuest.isValid, true);
    assert.strictEqual(validSingleGuest.isStep1Valid, true);
    assert.strictEqual(validSingleGuest.errors.guestCount, undefined);
  });

  await t.test("eventDate temporal boundary: yesterday and today rejected, tomorrow accepted", () => {
    const pastRes = validateEventParameters({
      eventName: "Quarterly Meet",
      eventType: "Conference",
      budget: 50000,
      eventDate: yesterdayStr,
      guestCount: 20,
      planningItems: ["Projector"],
    });
    assert.strictEqual(pastRes.isValid, false);
    assert.ok(pastRes.errors.eventDate?.includes("past"));

    const todayRes = validateEventParameters({
      eventName: "Quarterly Meet",
      eventType: "Conference",
      budget: 50000,
      eventDate: todayStr,
      guestCount: 20,
      planningItems: ["Projector"],
    });
    assert.strictEqual(todayRes.isValid, false);
    assert.ok(todayRes.errors.eventDate?.includes("today"));

    const tomorrowRes = validateEventParameters({
      eventName: "Quarterly Meet",
      eventType: "Conference",
      budget: 50000,
      eventDate: tomorrowStr,
      guestCount: 20,
      planningItems: ["Projector"],
    });
    assert.strictEqual(tomorrowRes.isValid, true);
    assert.strictEqual(tomorrowRes.errors.eventDate, undefined);
  });

  await t.test("eventName required & default placeholder checks", () => {
    // Empty name
    const emptyName = validateEventParameters({
      eventName: "",
      eventType: "Conference",
      budget: 10000,
      eventDate: tomorrowStr,
      guestCount: 10,
      planningItems: ["Notes"],
    });
    assert.strictEqual(emptyName.isValid, false);
    assert.strictEqual(emptyName.isStep1Valid, false);
    assert.strictEqual(emptyName.errors.eventName, "Event name is required.");
    assert.ok(emptyName.missingFields.includes("Event Name"));

    // Whitespace only
    const whitespaceName = validateEventParameters({
      eventName: "     ",
      eventType: "Conference",
      budget: 10000,
      eventDate: tomorrowStr,
      guestCount: 10,
      planningItems: ["Notes"],
    });
    assert.strictEqual(whitespaceName.isValid, false);
    assert.strictEqual(whitespaceName.errors.eventName, "Event name is required.");

    // Default 'Untitled Event'
    const defaultPlaceholder = validateEventParameters({
      eventName: "Untitled Event",
      eventType: "Conference",
      budget: 10000,
      eventDate: tomorrowStr,
      guestCount: 10,
      planningItems: ["Notes"],
    });
    assert.strictEqual(defaultPlaceholder.isValid, false);
    assert.strictEqual(defaultPlaceholder.errors.eventName, "Event name is required.");

    // Valid name
    const validShort = validateEventParameters({
      eventName: "AI Summit",
      eventType: "Conference",
      budget: 10000,
      eventDate: tomorrowStr,
      guestCount: 10,
      planningItems: ["Notes"],
    });
    assert.strictEqual(validShort.isValid, true);
    assert.strictEqual(validShort.isStep1Valid, true);
    assert.strictEqual(validShort.errors.eventName, undefined);
  });

  await t.test("planning points: empty array vs whitespace items vs valid items", () => {
    // Empty array
    const emptyArray = validateEventParameters({
      eventName: "Tech Meetup",
      eventType: "Conference",
      budget: 15000,
      eventDate: tomorrowStr,
      guestCount: 30,
      planningItems: [],
    });
    assert.strictEqual(emptyArray.isStep1Valid, true);
    assert.strictEqual(emptyArray.isStep2Valid, false);
    assert.strictEqual(emptyArray.isValid, false);
    assert.strictEqual(emptyArray.errors.planningItems, "At least one planning requirement is required.");
    assert.ok(emptyArray.missingFields.includes("Planning Requirements"));

    // Array with only empty/whitespace items
    const blankItems = validateEventParameters({
      eventName: "Tech Meetup",
      eventType: "Conference",
      budget: 15000,
      eventDate: tomorrowStr,
      guestCount: 30,
      planningItems: ["   ", "", "\t"],
    });
    assert.strictEqual(blankItems.isStep2Valid, false);
    assert.strictEqual(blankItems.isValid, false);
    assert.strictEqual(blankItems.errors.planningItems, "At least one planning requirement is required.");

    // Valid populated array
    const validItems = validateEventParameters({
      eventName: "Tech Meetup",
      eventType: "Conference",
      budget: 15000,
      eventDate: tomorrowStr,
      guestCount: 30,
      planningItems: ["Catering Table", "Speaker Mic"],
    });
    assert.strictEqual(validItems.isStep1Valid, true);
    assert.strictEqual(validItems.isStep2Valid, true);
    assert.strictEqual(validItems.isValid, true);
  });
});

test("Functional Validation - Backend API Route Parameter & Auth Enforcement", async (t) => {
  await t.test("POST /api/ai-evaluate rejects missing parameters when auth mocked", async () => {
    const mockRequest = new Request("http://localhost:3000/api/ai-evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName: "Untitled Event",
        budget: 0,
        guestCount: 0,
        planningItems: [],
      }),
    });

    const response = await evaluateHandler(mockRequest);
    assert.ok(
      response.status === 400 || response.status === 401,
      `Expected 400 or 401 but received ${response.status}`
    );
    const body = await response.json();
    assert.strictEqual(body.success, false);
  });

  await t.test("POST /api/tasks/toggle requires taskId and returns 400 if missing", async () => {
    const mockRequest = new Request("http://localhost:3000/api/tasks/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const response = await toggleHandler(mockRequest);
    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, "A valid taskId is required");
  });

  await t.test("POST /api/chat rejects empty or invalid message payload", async () => {
    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const response = await chatHandler(mockRequest);
    assert.ok(response.status === 400 || response.status === 401);
    const body = await response.json();
    assert.strictEqual(body.success, false);
  });

  await t.test("POST /api/generate rejects empty or missing prompt payload", async () => {
    const mockRequest = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const response = await generateHandler(mockRequest);
    assert.ok(response.status === 400 || response.status === 401);
    const body = await response.json();
    assert.strictEqual(body.success, false);
  });
});

test("Chat Route - Temporal Anchoring & Today's Date Integration", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const chatRoutePath = path.resolve(process.cwd(), "app/api/chat/route.ts");
  const chatRouteContent = fs.readFileSync(chatRoutePath, "utf-8");

  // Injects today's date
  assert.ok(
    chatRouteContent.includes("todayDateStr") && chatRouteContent.includes('new Date().toISOString().split("T")[0]'),
    "Chat route must compute today's date in YYYY-MM-DD format as an anchor"
  );

  // System instruction mentions today's date and scheduling rules
  assert.ok(
    chatRouteContent.includes("Today's Date (Current Anchor Date)") &&
    chatRouteContent.includes("TASK SCHEDULING & TEMPORAL ANCHORING"),
    "Chat system instruction must explicitly anchor tasks to today's date"
  );

  // Scheduled date format and boundaries
  assert.ok(
    chatRouteContent.includes("scheduledDate") &&
    chatRouteContent.includes("daysBeforeEvent"),
    "Chat copilot must require scheduledDate and daysBeforeEvent for newly added tasks"
  );
});
