import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

test("Accessibility Audit - Skip to Main Content (WCAG 2.4.1)", () => {
  const layoutPath = path.resolve(process.cwd(), "app/layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  // Skip link exists and points to #main-content
  assert.ok(
    layoutContent.includes('href="#main-content"'),
    "app/layout.tsx must contain a skip link pointing to #main-content"
  );
  assert.ok(
    layoutContent.includes("Skip to main content"),
    "app/layout.tsx must contain readable skip link text"
  );
  assert.ok(
    layoutContent.includes("sr-only focus:not-sr-only"),
    "Skip link must use screen-reader-only styling that reveals on keyboard focus"
  );

  // Main tag has matching id="main-content"
  const pagePath = path.resolve(process.cwd(), "app/page.tsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  assert.ok(
    pageContent.includes('id="main-content"'),
    "app/page.tsx main content container must have id='main-content'"
  );
});

test("Accessibility Audit - Focus Visible & Reduced Motion (WCAG 2.4.7 & 2.3.3)", () => {
  const cssPath = path.resolve(process.cwd(), "app/globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  // High contrast focus rings
  assert.ok(
    cssContent.includes(":focus-visible"),
    "app/globals.css must define high-contrast :focus-visible styles"
  );
  assert.ok(
    cssContent.includes("#10B981") || cssContent.includes("2px solid"),
    ":focus-visible must provide clear outline visibility"
  );

  // Prefers reduced motion media query
  assert.ok(
    cssContent.includes("prefers-reduced-motion: reduce"),
    "app/globals.css must respect users preferring reduced motion"
  );
  assert.ok(
    cssContent.includes("animation-duration: 0.01ms") || cssContent.includes("transition-duration: 0.01ms"),
    "Reduced motion must neutralize long transitions and animations"
  );
});

test("Accessibility Audit - Dialog Semantics & Modal Dismissal (WCAG 2.1.2 & 4.1.2)", () => {
  const aiChatbotPath = path.resolve(process.cwd(), "app/components/CalendarAiChatbot.tsx");
  const aiChatbotContent = fs.readFileSync(aiChatbotPath, "utf-8");
  assert.ok(
    aiChatbotContent.includes('role="dialog"') && aiChatbotContent.includes('aria-modal="true"'),
    "CalendarAiChatbot must declare role='dialog' and aria-modal='true'"
  );
  assert.ok(
    aiChatbotContent.includes('aria-live="polite"') || aiChatbotContent.includes('role="log"'),
    "CalendarAiChatbot message stream must announce updates politely"
  );

  const assistantModalPath = path.resolve(process.cwd(), "app/components/AiAssistantModal.tsx");
  const assistantModalContent = fs.readFileSync(assistantModalPath, "utf-8");
  assert.ok(
    assistantModalContent.includes('role="dialog"') && assistantModalContent.includes('aria-modal="true"'),
    "AiAssistantModal must declare role='dialog' and aria-modal='true'"
  );
  assert.ok(
    assistantModalContent.includes('"Escape"'),
    "AiAssistantModal must close on Escape key press"
  );

  const vendorsPath = path.resolve(process.cwd(), "app/components/VendorsSection.tsx");
  const vendorsContent = fs.readFileSync(vendorsPath, "utf-8");
  assert.ok(
    vendorsContent.includes('role="dialog"') && vendorsContent.includes('aria-modal="true"'),
    "VendorsSection inquiry modal must declare role='dialog' and aria-modal='true'"
  );
  assert.ok(
    vendorsContent.includes('"Escape"'),
    "VendorsSection modal must close on Escape key press"
  );

  const calendarPath = path.resolve(process.cwd(), "app/components/EventCalendarView.tsx");
  const calendarContent = fs.readFileSync(calendarPath, "utf-8");
  assert.ok(
    calendarContent.includes('role="dialog"') && calendarContent.includes('aria-modal="true"'),
    "EventCalendarView details drawer must declare role='dialog' and aria-modal='true'"
  );
});

test("Accessibility Audit - ARIA Checkboxes and Tab Navigation (WCAG 4.1.2)", () => {
  const tasksPath = path.resolve(process.cwd(), "app/components/TasksSection.tsx");
  const tasksContent = fs.readFileSync(tasksPath, "utf-8");
  assert.ok(
    tasksContent.includes('role="checkbox"'),
    "TasksSection interactive task toggles must declare role='checkbox'"
  );
  assert.ok(
    tasksContent.includes("aria-checked="),
    "TasksSection interactive task toggles must declare aria-checked state"
  );

  const timelinePath = path.resolve(process.cwd(), "app/components/TimelineSection.tsx");
  const timelineContent = fs.readFileSync(timelinePath, "utf-8");
  assert.ok(
    timelineContent.includes('role="tablist"') && timelineContent.includes('role="tab"'),
    "TimelineSection must declare role='tablist' and role='tab'"
  );
  assert.ok(
    timelineContent.includes("aria-selected="),
    "TimelineSection tab buttons must declare aria-selected"
  );
});

