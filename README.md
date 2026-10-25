# Kordena — GenAI Event Planner

> **Serene, Balanced & Focused Event Architecture**

Kordena is an intelligent event planning application powered by Generative AI. It transforms natural language event concepts into structured, executable event blueprints—complete with milestone timelines, 60-30-10 budget allocations, predictive calendar alerts, and verified vendor matchmaker shortlists.

---

## 🎨 Color System & Visual Aesthetics

Kordena implements the **Fresh Sage & Mint** palette designed for calm, distraction-free coordination:

* **Background (60%)**: `#F4F7F5` (Subtle Sage Tint)
* **Surface & Cards (30%)**: `#FFFFFF` with `#2D3748` (Slate Gray Text)
* **Accent & Feedback (10%)**: `#10B981` (Emerald / Mint Green)
  * **Completed Tasks**: Distinct mint checkmarks and circular progress feedback
  * **Budget Progress Bar**: Dynamic visual utilization meter and cushion indicator
  * **Calendar Alerts**: Imminent deadline countdown tags (`T-3 Days`) and alert pulses

---

## 🚀 Key Capabilities

1. **Introductory Landing Page for Unauthenticated Users**:
   * Elegant hero presentation and product showcase.
   * **Log In** & **Sign Up Free** authentication modal.
   * **"Explore Live Interactive Demo"** for instant guest workspace evaluation.

2. **GenAI Prompt-to-Event Blueprint Engine**:
   * Turn any event vision into an operational plan in seconds.
   * Pre-configured presets: Botanical Garden Wedding, Tech Summit & Gala, Executive Wellness Retreat, Fresh Sage Soirée.

3. **60-30-10 Smart Budget Ledger**:
   * Real-time expenditure tracking with clear emerald progress indicators.
   * Interactive line item management and financial buffer calculations.

4. **Predictive Calendar Alerts & Day-of Schedule**:
   * Automated deadline alerts for headcounts, contracts, and rehearsals.
   * Chronological run-of-show timeline with assigned operational leads.

5. **AI Vendor Matchmaker**:
   * Match scores aligned with the event's theme and budget bracket.
   * One-click AI inquiry email generation.

6. **Kordena AI Copilot Assistant**:
   * Real-time conversational advisor for speech drafts, seating arrangements, and budget optimization.

---

## 💻 Tech Stack

* **Framework**: Next.js 16 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS v4 with custom Sage & Mint design tokens
* **Icons**: Lucide React
* **AI Engine**: Google GenAI (`@google/genai`) with intelligent fallback reasoning

---

## 🛠️ Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view Kordena.

### Environment Variables (.env.example)

* `MONGODB_URI`: MongoDB connection string (Atlas or local `mongodb://127.0.0.1:27017/kordena_event_planner`).
* `GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID for user sign-in.
* `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 Client Secret.
* `NEXTAUTH_URL`: Canonical site URL (e.g. `http://localhost:3000`).
* `NEXTAUTH_SECRET`: Random 32+ character string for token encryption.
* `GEMINI_API_KEY`: Google Gemini API key for GenAI event planning features.

