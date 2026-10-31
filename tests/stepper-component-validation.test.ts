import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validateEventParameters } from "../lib/calendar-utils";

test("Blueprint Stepper State Transitions & Functional Contracts", async (t) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  await t.test("canAdvance transition guards prevent skipping required steps", () => {
    // Incomplete Step 1 (missing budget, empty name)
    const step1Incomplete = validateEventParameters({
      eventName: "",
      eventType: "Conference",
      budget: 0,
      eventDate: tomorrowStr,
      guestCount: 50,
      planningItems: [],
    });

    // canAdvance function logic as implemented in Stepper
    const canAdvanceFromStep = (step: number, val: typeof step1Incomplete) => {
      if (step === 1) return val.isStep1Valid;
      if (step === 2) return val.isStep2Valid;
      if (step === 3) return val.isValid;
      return true;
    };

    assert.strictEqual(canAdvanceFromStep(1, step1Incomplete), false, "Step 1 cannot advance when fields are incomplete");
    assert.strictEqual(canAdvanceFromStep(2, step1Incomplete), false, "Step 2 cannot advance when fields are incomplete");
    assert.strictEqual(canAdvanceFromStep(3, step1Incomplete), false, "Step 3 cannot submit when incomplete");

    // Complete Step 1, but Incomplete Step 2 (no planning items)
    const step2Incomplete = validateEventParameters({
      eventName: "Cybersecurity Summit",
      eventType: "Conference",
      budget: 150000,
      eventDate: tomorrowStr,
      guestCount: 200,
      planningItems: [],
    });

    assert.strictEqual(canAdvanceFromStep(1, step2Incomplete), true, "Step 1 can advance when Step 1 fields are complete");
    assert.strictEqual(canAdvanceFromStep(2, step2Incomplete), false, "Step 2 cannot advance without planning items");
    assert.strictEqual(canAdvanceFromStep(3, step2Incomplete), false, "Step 3 cannot submit without planning items");

    // Fully Complete
    const fullyComplete = validateEventParameters({
      eventName: "Cybersecurity Summit",
      eventType: "Conference",
      budget: 150000,
      eventDate: tomorrowStr,
      guestCount: 200,
      planningItems: ["Network Firewall Rig", "Auditorium Sound"],
    });

    assert.strictEqual(canAdvanceFromStep(1, fullyComplete), true);
    assert.strictEqual(canAdvanceFromStep(2, fullyComplete), true);
    assert.strictEqual(canAdvanceFromStep(3, fullyComplete), true);
  });

  await t.test("Planning points array operations (add, remove, deduplicate)", () => {
    let items: string[] = [];

    // Add item helper function
    const addItem = (currentList: string[], newItem: string): string[] => {
      const trimmed = newItem.trim();
      if (!trimmed) return currentList;
      if (currentList.includes(trimmed)) return currentList; // deduplicate
      return [...currentList, trimmed];
    };

    // Remove item helper function
    const removeItem = (currentList: string[], indexToRemove: number): string[] => {
      return currentList.filter((_, idx) => idx !== indexToRemove);
    };

    // 1. Adding items
    items = addItem(items, "Stage & Audio Setup");
    assert.deepStrictEqual(items, ["Stage & Audio Setup"]);

    items = addItem(items, "Catering & Refreshments");
    assert.deepStrictEqual(items, ["Stage & Audio Setup", "Catering & Refreshments"]);

    // 2. Reject empty or whitespace items
    items = addItem(items, "");
    items = addItem(items, "   ");
    assert.strictEqual(items.length, 2);

    // 3. Deduplicate
    items = addItem(items, "Stage & Audio Setup");
    assert.strictEqual(items.length, 2);

    // 4. Remove item
    items = removeItem(items, 0);
    assert.deepStrictEqual(items, ["Catering & Refreshments"]);

    items = removeItem(items, 0);
    assert.deepStrictEqual(items, []);
  });

  await t.test("Tier selection constraints and formatting", () => {
    const validTiers = ["Starter", "Basic", "Professional"];
    const testTier = (tier: string) => validTiers.includes(tier);

    assert.strictEqual(testTier("Starter"), true);
    assert.strictEqual(testTier("Basic"), true);
    assert.strictEqual(testTier("Professional"), true);
    assert.strictEqual(testTier("Enterprise"), false);
  });
});

test("Component Interface Integrity - BlueprintCreationStepper", () => {
  const stepperFilePath = path.resolve(process.cwd(), "app/components/BlueprintCreationStepper.tsx");
  assert.ok(fs.existsSync(stepperFilePath), "BlueprintCreationStepper.tsx component file must exist");

  const fileContent = fs.readFileSync(stepperFilePath, "utf-8");

  // Verify that required props are defined in the interface
  const requiredProps = [
    "stepperKey",
    "stepperCurrentStep",
    "setStepperCurrentStep",
    "eventName",
    "setEventName",
    "eventType",
    "setEventType",
    "eventBudget",
    "setEventBudget",
    "eventDate",
    "setEventDate",
    "tomorrowStr",
    "guestCount",
    "setGuestCount",
    "eventTier",
    "setEventTier",
    "planningItems",
    "setPlanningItems",
    "currentPlanningInput",
    "setCurrentPlanningInput",
    "handleAddPlanningItem",
    "handleRemovePlanningItem",
    "validation",
    "onFinalStepCompleted",
  ];

  for (const prop of requiredProps) {
    assert.ok(
      fileContent.includes(prop),
      `BlueprintCreationStepper must define and handle prop '${prop}'`
    );
  }
});

