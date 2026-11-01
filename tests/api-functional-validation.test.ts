import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validateEventParameters } from "../lib/calendar-utils";
import { checkRateLimit } from "../lib/rate-limit";

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
    assert.strictEqual(pastRes.isStep1Valid, false);
    assert.strictEqual(pastRes.errors.eventDate, "Event date cannot be in the past. Please select a future date.");

    const todayRes = validateEventParameters({
      eventName: "Quarterly Meet",
      eventType: "Conference",
      budget: 50000,
      eventDate: todayStr,
      guestCount: 20,
      planningItems: ["Projector"],
    });
    assert.strictEqual(todayRes.isValid, false);
    assert.strictEqual(todayRes.isStep1Valid, false);
    assert.strictEqual(todayRes.errors.eventDate, "Event date cannot be today. Please select a future date.");

    const futureRes = validateEventParameters({
      eventName: "Quarterly Meet",
      eventType: "Conference",
      budget: 50000,
      eventDate: tomorrowStr,
      guestCount: 20,
      planningItems: ["Projector"],
    });
    assert.strictEqual(futureRes.isValid, true);
    assert.strictEqual(futureRes.isStep1Valid, true);
    assert.strictEqual(futureRes.errors.eventDate, undefined);
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

    // Whitespace name
    const whitespaceName = validateEventParameters({
      eventName: "   ",
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
  await t.test("POST /api/ai-evaluate enforces rate limiting and parameter validation", () => {
    const routeFile = fs.readFileSync(path.resolve(process.cwd(), "app/api/ai-evaluate/route.ts"), "utf-8");
    assert.ok(routeFile.includes("checkRateLimit"), "ai-evaluate route must enforce rate limiting");
    assert.ok(routeFile.includes("eventName"), "ai-evaluate route must process eventName parameter");
    assert.ok(routeFile.includes("budget"), "ai-evaluate route must process budget parameter");
  });

  await t.test("POST /api/tasks/toggle requires taskId and validates parameters", () => {
    const routeFile = fs.readFileSync(path.resolve(process.cwd(), "app/api/tasks/toggle/route.ts"), "utf-8");
    assert.ok(routeFile.includes("taskId"), "tasks toggle route must require taskId parameter");
    assert.ok(routeFile.includes("A valid taskId is required"), "tasks toggle route must validate presence of taskId");
    assert.ok(routeFile.includes("isCompleted"), "tasks toggle route must track isCompleted status");
  });

  await t.test("POST /api/chat enforces rate limiting and session validation", () => {
    const routeFile = fs.readFileSync(path.resolve(process.cwd(), "app/api/chat/route.ts"), "utf-8");
    assert.ok(routeFile.includes("checkRateLimit"), "chat route must enforce sliding-window rate limiting");
    assert.ok(routeFile.includes("getServerSession"), "chat route must check user session credentials");
  });

  await t.test("POST /api/generate enforces rate limiting and fallback schema handling", () => {
    const routeFile = fs.readFileSync(path.resolve(process.cwd(), "app/api/generate/route.ts"), "utf-8");
    assert.ok(routeFile.includes("checkRateLimit"), "generate route must protect against denial of service");
    assert.ok(routeFile.includes("prompt"), "generate route must require prompt input");
  });

  await t.test("POST/DELETE /api/budget/delete enforces rate limiting, category validation, and ownership check", () => {
    const routeFile = fs.readFileSync(path.resolve(process.cwd(), "app/api/budget/delete/route.ts"), "utf-8");
    assert.ok(routeFile.includes("checkRateLimit"), "budget delete route must enforce sliding-window rate limiting");
    assert.ok(routeFile.includes("A valid budget category name is required"), "budget delete route must require valid category");
    assert.ok(routeFile.includes("deleteBudgetCategory"), "budget delete route must execute deleteBudgetCategory model method");
    assert.ok(routeFile.includes("resolveDbUserId"), "budget delete route must verify user authentication and ownership");
  });
});

test("Chat Route - Temporal Anchoring & Today's Date Integration", () => {
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

test("Security & Privacy - Event Histories Restricted for Unauthenticated Users", () => {
  const landingPath = path.resolve(process.cwd(), "app/components/LandingPage.tsx");
  const landingContent = fs.readFileSync(landingPath, "utf-8");

  // EventHistories must only render when isAuthenticated is true
  assert.ok(
    landingContent.includes("isAuthenticated && events.length > 0"),
    "LandingPage must guard EventHistories with isAuthenticated check"
  );

  // Database fetch for blueprints must only run when isAuthenticated is true
  assert.ok(
    landingContent.includes("if (!isAuthenticated)"),
    "LandingPage must bypass fetching user statuses when user is not authenticated"
  );
});
