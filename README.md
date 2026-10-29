# Kordena Event Studio

Kordena Event Studio is an enterprise-grade, generative AI-powered event architecture and operations platform built on Next.js 16, React 19, Tailwind CSS v4, and MongoDB. The system converts high-level natural language event concepts into fully realized, operationally validated event blueprints. Each blueprint integrates milestone countdown schedules, 60-30-10 financial ledgers, day-of execution timelines, vendor matchmaker directories, and real-time generative AI copilot editing.

---

## Table of Contents

1. System Architecture
2. Core Capabilities
   - Blueprint Creation Stepper
   - Master Schedule and Calendar View
   - Multi-Blueprint Switcher
   - Countdown Prep Tasks and State Synchronization
   - Day-of Run of Show Execution Deck
   - Dynamic Budget Allocator
   - Kordena AI Copilot Assistant
   - Vendor Matchmaker and Inquiry Drafter
3. Design System and Visual Tokens
4. Security Architecture and Hardening
5. Accessibility Compliance (WCAG 2.1 and 2.2 AA)
6. Data Modeling and Database Performance
7. API Route Reference
8. Technology Stack
9. Getting Started and Environment Configuration
10. Verification and Automated Test Suites

---

## 1. System Architecture

Kordena follows a modern full-stack Next.js App Router architecture leveraging React Server Components alongside high-density client workspaces. Data persistence is managed through MongoDB using optimized Mongoose schemas, with user session management provided by NextAuth. Generative reasoning is powered by the official Google GenAI SDK (`@google/genai`) with structured JSON schema outputs and graceful local fallback models.

---

## 2. Core Capabilities

### Blueprint Creation Stepper
The multi-step event setup workflow guides planners through defining:
- Event Metadata: Name, event category (Wedding, Conference, Corporate, Birthday, Gala, etc.), target date, and guest count.
- Budget Allocation: Total expenditure budget in Indian Rupees (INR) or localized currencies.
- Tier Selection: Starter, Basic, or Professional service tiers.
- Planning Checklist: Customizable selection of priority decor, catering, audiovisual, and operational items.
- AI Architecture Evaluation: Submits parameters to Google Gemini to calculate feasibility assessments, vibe statements, cost per guest, and milestone breakdowns before finalizing the blueprint.

### Master Schedule and Calendar View
- Built with React Big Calendar and date-fns, providing Month, Week, Day, and Agenda views.
- Eliminates standard default browser toolbars in favor of a cohesive executive command strip.
- Allows jumping to today's date or the target event month with a single click.
- Visual priority color badges categorize events: Target Event (Emerald), High Priority (Red), Medium Priority (Blue), Low Priority (Green), and Day-of Items (Purple).
- Smooth slide-out inspection drawer displaying granular task briefs, allocated budgets, scheduled dates, and operational dependencies.

### Multi-Blueprint Switcher
- Persistent navigation widget (`< X of Y >`) that enables planners to alternate between multiple saved event blueprints without leaving the workspace.
- Keyboard shortcuts: `Alt + Left Arrow` (Previous Blueprint) and `Alt + Right Arrow` (Next Blueprint).
- Interactive dropdown menu listing all saved blueprints with their dates, categories, and active statuses.
- Full state synchronization: Switching blueprints updates all telemetry cards, calendar milestones, tasks, and budget allocations in real time.

### Countdown Prep Tasks and State Synchronization
- Chronologically sequenced milestone checklist counting down from months in advance to the event eve.
- Filter tasks by department (Logistics, Creative Design, Procurement, Vendor Calls, Tech and Staging), priority level, or action type.
- Instant toggle synchronization: Completing a task updates local state and asynchronously syncs with the database via dedicated rate-limited API endpoints.

### Day-of Run of Show Execution Deck
- Minute-by-minute operational run of show timeline.
- Identifies designated department leads, precise time slots, operational notes, and precursor dependencies.
- Toggleable status tracker (Pending, In-Progress, Completed) with visual status indicators.

### Dynamic Budget Allocator
- Implements the 60-30-10 financial allocation model: 60% Core Experience and Venue, 30% Operational Logistics, 10% Contingency Buffer.
- Interactive elasticity sliders for dynamic budget adjustments with automatic boundary enforcement.
- Real-time spend health meters indicating total allocated capital, remaining contingency cushions, and budget deficit warnings.

### Kordena AI Copilot Assistant
- Dedicated AI chat interface embedded directly into the calendar and stepper environments.
- Context-aware intelligence: Understands the active blueprint, current milestone deadlines, and budget allocations.
- Dual execution mode: Answers general logistical queries and performs direct structural updates to database documents (adjusting tasks, recalculating budgets, or reorganizing run-of-show sequences).
- Keyboard activation via `Ctrl + J` or floating action pill.

### Vendor Matchmaker and Inquiry Drafter
- AI-driven match scoring based on event vibe, capacity, and price tier.
- Status cycle management: Shortlisted -> Contacted -> Booked.
- One-click inquiry email drafting pre-populated with event details, dates, and attendee headcounts.

---

## 3. Design System and Visual Tokens

Kordena utilizes the Fresh Sage and Mint visual language, engineered to minimize cognitive overload during complex logistical planning:

- Primary Canvas (60%): `#F4F7F5` (Subtle Sage Tint)
- Elevated Surface (30%): `#FFFFFF` with `#2D3748` (Slate Text) and `#E2ECE5` (Borders)
- Semantic Accent (10%): `#10B981` (Emerald Accent) and `#059669` (Forest Mint)
- High Priority / Risk: `#EF4444` (Rose Red) and `#FEF2F2` (Rose Tint)
- Operational Focus: `#3B82F6` (Cobalt Blue) and `#EFF6FF` (Blue Tint)
- Live Execution: `#8B5CF6` (Royal Violet) and `#F5F3FF` (Violet Tint)

---

## 4. Security Architecture and Hardening

Kordena implements enterprise security best practices across all layers:

### HTTP Security Headers
Configured in `next.config.ts`:
- Content-Security-Policy (CSP): Restricts script execution, frame ancestors, and object embeddings.
- Strict-Transport-Security (HSTS): Enforces HTTPS connections (`max-age=63072000; includeSubDomains; preload`).
- X-Frame-Options: Set to `DENY` to prevent clickjacking attacks.
- X-Content-Type-Options: Set to `nosniff` to eliminate MIME-type sniffing vulnerabilities.
- Referrer-Policy: Set to `strict-origin-when-cross-origin`.
- Permissions-Policy: Restricts camera, microphone, and geolocation access.
- Framework Fingerprint Elimination: `poweredByHeader` is explicitly disabled to conceal framework details.

### Input Sanitization and Validation
- String Sanitization: Strips non-printable ASCII control characters, trims whitespace, and enforces maximum string lengths.
- Regex Injection Protection: Metacharacter escaping (`escapeRegex`) prevents ReDoS and regex corruption on dynamic query parameters.
- Numeric Boundary Clamping: Numbers are strictly constrained to predefined minimum and maximum ranges.
- Safe Error Shielding: Internal database errors and stack traces are suppressed in production API responses, returning structured, safe error messages.

### Rate Limiting
- Custom in-memory sliding-window rate limiter (`lib/rate-limit.ts`).
- Enforces strict request quotas across all API endpoints (Task toggling: 120 req/min; AI chat: 30 req/min; AI evaluation: 20 req/min; General operations: 60 req/min).
- Transparent response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.

### Authentication and Session Security
- NextAuth configured with JSON Web Tokens (`jwt`) and a 30-day session lifespan.
- Cookies configured with `httpOnly: true`, `sameSite: "lax"`, and HTTPS `secure` flags in production.
- Database authorization checks enforce strict resource ownership on every mutation endpoint.

---

## 5. Accessibility Compliance (WCAG 2.1 and 2.2 AA)

Kordena has been audited and hardened against international web accessibility standards:

- Bypass Blocks (WCAG 2.4.1): Hidden skip link (`#main-content`) accessible via keyboard `Tab` navigation that targets the primary `<main>` landmark.
- Focus Visible (WCAG 2.4.7): Universal `:focus-visible` ring defined with a high-contrast 2px solid emerald outline (`#10B981`) and a 2px offset.
- Reduced Motion (WCAG 2.3.3): Global `@media (prefers-reduced-motion: reduce)` rule that suppresses transitions and animations for users sensitive to motion.
- Modal Dialog Semantics (WCAG 2.1.2 and 4.1.2):
  - Modals and slide-out drawers declare `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
  - Comprehensive keyboard trapping and instant dismissal via the `Escape` key.
- Dynamic Log Announcements: AI chat message viewports declare `role="log"` and `aria-live="polite"` for non-disruptive screen reader updates.
- Semantic Roles:
  - Task toggle buttons declare `role="checkbox"` and dynamic `aria-checked` states.
  - Subtab containers declare `role="tablist"` with `role="tab"`, `aria-selected`, and `aria-controls`.

---

## 6. Data Modeling and Database Performance

The core document model, `UserStatus` (`models/UserStatus.model.ts`), has been optimized for low-latency queries and minimal memory overhead:

### Compound Performance Indexes
- `{ userId: 1, createdAt: -1 }`: Covered index eliminating in-memory sorting for user blueprint listings.
- `{ userId: 1, updatedAt: -1 }`: Fast lookup index for retrieving recently modified event documents.
- `{ userId: 1, eventName: 1 }`: Accelerated compound index for exact event retrieval by name per user.
- `{ userId: 1, endDate: 1 }`: Index for chronological date range and timeline queries.

### Subdocument Architecture
- `EvaluationSummarySchema`, `BudgetBreakdownItemSchema`, `DayOfRunOfShowItemSchema`, and `PrepCalendarTaskSchema` all specify `{ _id: false }`.
- Eliminates 12-byte `ObjectId` allocation and tracking overhead on nested array items, reducing wire payload and memory consumption.
- Schema options: `minimize: true` strips empty objects; `autoIndex` is active in development and automated in test pipelines.

### Domain Encapsulation
- Single Source of Truth: Exports `VALID_EVENT_TYPES`, `VALID_TIERS`, `VALID_ACTION_TYPES`, and `VALID_PRIORITIES` as constant tuples with TypeScript union types.
- Instance Methods: `toggleTask(taskId, explicitStatus)` encapsulates task searching, index matching, and modification tracking directly on document instances.
- Computed Virtuals: `daysUntilEvent`, `isPastEvent`, and `totalAllocatedBudget` provide zero-storage calculated values on JSON serialization.
- Static Model Helpers: `UserStatus.findActiveByUser(userId)` and `UserStatus.findLatestByUser(userId)` enforce lean database projections.

---

## 7. API Route Reference

| Method | Endpoint | Description | Auth Required | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/generate` | Generates a full draft event plan from a prompt | Yes (401 if unauthorized) | 30 req / min |
| `POST` | `/api/ai-evaluate` | Performs structured Gemini evaluation of event parameters | Yes (401 if unauthorized) | 30 req / min |
| `POST` | `/api/chat` | Kordena AI Copilot interactive chat and blueprint editing | Yes (401 if unauthorized) | 30 req / min |
| `GET` | `/api/user-status` | Fetches saved blueprints for the authenticated account | Isolated per account | 100 req / min |
| `POST` | `/api/user-status` | Stores a completed event blueprint from the Stepper | Yes | 60 req / min |
| `PATCH` | `/api/user-status` | Updates budget allocations or specific blueprint sections | Yes (ownership enforced) | 60 req / min |
| `DELETE` | `/api/user-status` | Deletes a blueprint by ID with ownership verification | Yes (ownership enforced) | 30 req / min |
| `POST` | `/api/tasks/toggle` | Toggles or updates isCompleted on a prep calendar task | Yes (ownership enforced) | 120 req / min |
| `ALL` | `/api/auth/[...nextauth]` | NextAuth session authentication endpoints | Public | Unthrottled |

---

## 8. Technology Stack

- Application Framework: Next.js 16.4.3 (App Router with Turbopack)
- User Interface: React 19.3.0 and React DOM 19.3.0
- Type System: TypeScript 5
- Styling and Utility Classes: Tailwind CSS v4
- Database and ODM: MongoDB with Mongoose 9.11.4
- Authentication: NextAuth 4.24.15 (JWT session strategy, Google OAuth 2.0 provider)
- Artificial Intelligence: Google GenAI SDK (`@google/genai` v2.31.0)
- Calendar Components: React Big Calendar 1.20.0 and date-fns 4.4.0
- Iconography: Lucide React 1.61.0 and Hugeicons React 1.1.10
- Test Harness: Node.js Native Test Runner with Jiti runtime

---

## 9. Getting Started and Environment Configuration

### Prerequisites
- Node.js version 20.x or higher
- MongoDB instance (MongoDB Atlas connection string or local MongoDB daemon)
- Google Cloud Console Project (for Google OAuth credentials and Gemini API Key)

### Installation

1. Clone the repository and navigate into the project directory:
```bash
git clone <repository-url>
cd event_planner
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env.local` file in the root directory and populate the required parameters:

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/kordena_event_planner

# NextAuth Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-32-character-secret-string

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Google Gemini Artificial Intelligence
GEMINI_API_KEY=your-gemini-api-key
```

4. Launch the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Build for production:
```bash
npm run build
npm run start
```

---

## 10. Verification and Automated Test Suites

Kordena includes an extensive test suite executed via the native Node.js test runner and Jiti runtime.

Run all test suites:
```bash
npm test
```

### Test Coverage Overview

- `tests/calendar-utils.test.ts`: Validates date parsing, positive/negative days countdowns, 12-hour AM/PM timeslot arithmetic, budget metrics, and task filtering.
- `tests/chat-schema.test.ts`: Verifies Gemini copilot function schemas and structured JSON parameter constraints.
- `tests/gemini-config.test.ts`: Verifies Google GenAI SDK initialization, model selection, and fallback configurations.
- `tests/auth-provider.test.ts`: Validates NextAuth Session Provider resiliency and polling suppression.
- `tests/tasks-toggle-api.test.ts`: Tests `isCompleted` task persistence and in-memory array state updates.
- `tests/security.test.ts`: Audits string sanitization, regex escaping, numeric boundary clamping, sliding-window rate limiting, and Next.js security headers.
- `tests/a11y.test.ts`: Verifies WCAG 2.4.1 Skip Links, high-contrast focus indicators, reduced motion rules, ARIA dialog roles, and checkbox/tablist semantics.
- `tests/user-status-model.test.ts`: Audits Mongoose compound indexes, subdocument `_id: false` configurations, payload minimization, and document instance methods.

Run TypeScript static validation:
```bash
npx tsc --noEmit
```
All static type checks must pass with zero diagnostic errors.
