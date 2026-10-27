import { NextResponse } from "next/server";
import { geminiConfig } from "@/config/gemini";

export interface AiEvaluationOption {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
  tag?: string;
  status?: string;
}

export interface AiEvaluationQuestion {
  question: string;
  description: string;
  options: AiEvaluationOption[];
}

export interface EvaluationSummary {
  eventVibe: string;
  feasibilityAssessment: string;
  costPerGuest: number;
}

export interface BudgetBreakdownItem {
  category: string;
  allocatedAmount: number;
  percentage: number;
  sliderMin: number;
  sliderMax: number;
  spendStrategy: string;
}

export interface PrepCalendarTask {
  id: string;
  title: string;
  department: string;
  actionType: "call" | "arrange" | "design" | "procure" | "setup";
  daysBeforeEvent: number;
  estimatedCost: number;
  actionBrief: string;
  priority: "high" | "medium" | "low";
}

export interface DayOfRunOfShowItem {
  timeSlot: string;
  activity: string;
  departmentInCharge: string;
  operationalNotes: string;
  dependency: string;
}

export interface AiEvaluationResponse {
  success: boolean;
  evaluationSummary?: EvaluationSummary;
  budgetBreakdown?: BudgetBreakdownItem[];
  prepCalendarTasks?: PrepCalendarTask[];
  dayOfRunOfShow?: DayOfRunOfShowItem[];
  mediatorStarterPrompts?: string[];
  aiSummary: {
    headline: string;
    overview: string;
    budgetPerGuest: string;
    feasibility: string;
    recommendedVibe: string;
  };
  questions: {
    decorations: AiEvaluationQuestion;
    arrangements: AiEvaluationQuestion;
    requirements: AiEvaluationQuestion;
  };
  source: "gemini-api" | "kordena-ai-engine";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventName = "Untitled Event",
      eventType = "Conference",
      guestCount = 100,
      budget = 250000,
      eventDate = "",
      endDate = "",
      tier = "Starter",
      leadOrganizer = "",
      planningItems = [],
      plannedItems = [],
    } = body;

    const trimmedName = String(eventName).trim() || "Untitled Event";
    const resolvedGuestCount = Math.max(1, Number(guestCount) || 100);
    const resolvedBudget = Math.max(0, Number(budget) || 250000);
    const resolvedType = String(eventType).trim() || "Conference";
    const resolvedTier = String(tier).trim() || "Starter";
    const perGuest = Math.round(resolvedBudget / resolvedGuestCount);

    // Collect planning points from either planningItems or plannedItems
    const rawPlanned = Array.isArray(planningItems) && planningItems.length
      ? planningItems
      : Array.isArray(plannedItems)
      ? plannedItems
      : [];
    const plannedList = rawPlanned.filter(Boolean);

    const targetEndDate = endDate || eventDate || "Date TBD";
    const plannedItemsFormatted = plannedList.length
      ? plannedList.join(", ")
      : "camera department, catering service, decoration team, audio & stage, venue arrangements";

    // 1. Attempt Gemini API with new production-grade prompt and schema
    const prompt = `You are an expert event operations producer and financial planner. 

Analyze the following event constraints and output a production-grade, calendar-ready event schedule and budget breakdown:

[EVENT PARAMETERS]
- Event Name: ${trimmedName}
- Event Type: ${resolvedType}
- Tier: ${resolvedTier}
- Total Budget: ${resolvedBudget}
- Guest Count: ${resolvedGuestCount}
- Target Event Date (endDate): ${targetEndDate}
- Selected Planned Items / Departments: ${plannedItemsFormatted}

[EVALUATION RULES]
1. Budget Allocation:
   - Distribute the total budget across the selected 'plannedItems' (e.g., camera department, catering service, decoration team) plus a mandatory small contingency reserve.
   - For every category, supply recommended slider boundaries ('sliderMin' and 'sliderMax') so the user can freely fine-tune amounts in the UI later without breaking overall feasibility.
   - Sum of all 'allocatedAmount' must equal the total budget.

2. Prep Calendar Tasks (Countdown Days):
   - For every department in 'plannedItems', create concrete, sequential action items scheduled across practical lead times ('daysBeforeEvent' relative to 'endDate').
   - Categorize each task strictly into: 'call', 'arrange', 'design', 'procure', or 'setup'.
   - For any "call" actionType, write an actionable phone inquiry script or checklist in 'actionBrief' (e.g., exact quantities, budget limits, package requirements).
   - For "design" or "arrange" tasks, provide clear visual and structural instructions.

3. Day-of Run-of-Show:
   - Build a realistic, chronological time-slot breakdown (e.g., "03:30 PM", "05:00 PM") for the final event day.
   - Sequence logistics to prevent clashes (e.g., staging and decor setup must finish before photography equipment testing and guest arrival).

4. Mediator Chatbot Starter Prompts:
   - Provide 3 contextual prompts the upcoming AI mediator chatbot can display to the user (e.g., "Ask me to shift the photo shoot earlier", "Adjust catering if guest count rises", "Add rain contingency for decor").

Return ONLY a valid JSON object matching the requested schema.`;

    const responseSchema = {
      type: "object",
      properties: {
        evaluationSummary: {
          type: "object",
          properties: {
            eventVibe: { type: "string" },
            feasibilityAssessment: { type: "string" },
            costPerGuest: { type: "number" },
          },
          required: ["eventVibe", "feasibilityAssessment", "costPerGuest"],
        },
        budgetBreakdown: {
          type: "array",
          description: "Allocations mapped strictly to plannedItems with sliders limits",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              allocatedAmount: { type: "number" },
              percentage: { type: "number" },
              sliderMin: { type: "number" },
              sliderMax: { type: "number" },
              spendStrategy: { type: "string" },
            },
            required: [
              "category",
              "allocatedAmount",
              "percentage",
              "sliderMin",
              "sliderMax",
              "spendStrategy",
            ],
          },
        },
        prepCalendarTasks: {
          type: "array",
          description: "Pre-event countdown tasks mapped to calendar days",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              department: { type: "string" },
              actionType: {
                type: "string",
                enum: ["call", "arrange", "design", "procure", "setup"],
              },
              daysBeforeEvent: { type: "number" },
              estimatedCost: { type: "number" },
              actionBrief: {
                type: "string",
                description: "Vendor calling script, inquiry points, or design checklist",
              },
              priority: {
                type: "string",
                enum: ["high", "medium", "low"],
              },
            },
            required: [
              "id",
              "title",
              "department",
              "actionType",
              "daysBeforeEvent",
              "estimatedCost",
              "actionBrief",
              "priority",
            ],
          },
        },
        dayOfRunOfShow: {
          type: "array",
          description: "Minute-by-minute hourly timeline for the endDate",
          items: {
            type: "object",
            properties: {
              timeSlot: { type: "string" },
              activity: { type: "string" },
              departmentInCharge: { type: "string" },
              operationalNotes: { type: "string" },
              dependency: { type: "string" },
            },
            required: [
              "timeSlot",
              "activity",
              "departmentInCharge",
              "operationalNotes",
              "dependency",
            ],
          },
        },
        mediatorStarterPrompts: {
          type: "array",
          description: "Pre-crafted suggestions the chatbot offers to help the user fine-tune the calendar",
          items: { type: "string" },
        },
      },
      required: [
        "evaluationSummary",
        "budgetBreakdown",
        "prepCalendarTasks",
        "dayOfRunOfShow",
        "mediatorStarterPrompts",
      ],
    };

    try {
      const result = await geminiConfig({
        prompt,
        responseSchema,
        responseMimeType: "application/json",
      });

      if (result.success && result.data?.evaluationSummary) {
        const data = result.data;
        return NextResponse.json({
          success: true,
          evaluationSummary: data.evaluationSummary,
          budgetBreakdown: data.budgetBreakdown,
          prepCalendarTasks: data.prepCalendarTasks,
          dayOfRunOfShow: data.dayOfRunOfShow,
          mediatorStarterPrompts: data.mediatorStarterPrompts,
          // UI compatibility mappings
          aiSummary: {
            headline: `${trimmedName} — ${data.evaluationSummary.eventVibe || resolvedTier}`,
            overview: data.evaluationSummary.feasibilityAssessment || "",
            budgetPerGuest: `₹${Number(data.evaluationSummary.costPerGuest || perGuest).toLocaleString("en-IN")}`,
            feasibility: data.evaluationSummary.feasibilityAssessment || "Balanced & Practical",
            recommendedVibe: data.evaluationSummary.eventVibe || "",
          },
          questions: {
            decorations: {
              question: "What are the decorations that you are planning?",
              description: "Select the aesthetic accents and staging elements tailored for your event",
              options: data.prepCalendarTasks
                ?.filter((t: any) => t.actionType === "design" || (t.department && t.department.toLowerCase().includes("decor")))
                .map((t: any) => ({
                  id: t.id,
                  label: t.title,
                  description: t.actionBrief,
                  recommended: t.priority === "high",
                })) || [],
            },
            arrangements: {
              question: "What are the arrangements that are done?",
              description: "Mark what is already completed or currently in progress",
              options: data.prepCalendarTasks
                ?.filter((t: any) => t.actionType === "arrange" || t.actionType === "setup")
                .map((t: any) => ({
                  id: t.id,
                  label: t.title,
                  description: t.actionBrief,
                  status: t.daysBeforeEvent <= 2 ? "In Progress" : "Pending",
                })) || [],
            },
            requirements: {
              question: "What are the requirements that you need based on that?",
              description: "Choose essential operational and technical requirements based on guest count and budget",
              options: data.budgetBreakdown?.map((b: any, idx: number) => ({
                id: `req_${idx + 1}`,
                label: `${b.category} (₹${Number(b.allocatedAmount).toLocaleString("en-IN")})`,
                description: b.spendStrategy,
                tag: b.percentage >= 20 ? "Essential" : "Recommended",
              })) || [],
            },
          },
          source: "gemini-api",
        });
      }
    } catch (geminiError) {
      console.warn("Gemini AI evaluation failed, falling back to smart engine:", geminiError);
    }

    // 2. Fallback: Domain-aware Intelligent Kordena AI Engine
    const evaluation = generateSmartAiEvaluation(
      trimmedName,
      resolvedType,
      resolvedGuestCount,
      resolvedBudget,
      perGuest,
      resolvedTier,
      plannedList,
      leadOrganizer
    );

    return NextResponse.json({
      success: true,
      evaluationSummary: evaluation.evaluationSummary,
      budgetBreakdown: evaluation.budgetBreakdown,
      prepCalendarTasks: evaluation.prepCalendarTasks,
      dayOfRunOfShow: evaluation.dayOfRunOfShow,
      mediatorStarterPrompts: evaluation.mediatorStarterPrompts,
      aiSummary: evaluation.aiSummary,
      questions: evaluation.questions,
      source: "kordena-ai-engine",
    });
  } catch (error: any) {
    console.error("AI Evaluation route error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to execute AI evaluation",
      },
      { status: 500 }
    );
  }
}

function generateSmartAiEvaluation(
  eventName: string,
  eventType: string,
  guestCount: number,
  budget: number,
  perGuest: number,
  tier: string = "Starter",
  plannedList: string[] = [],
  leadOrganizer: string = ""
) {
  const lowerType = eventType.toLowerCase();
  const lowerName = eventName.toLowerCase();
  const isWedding = lowerType.includes("wedding") || lowerName.includes("wedding");
  const isBirthday = lowerType.includes("birthday") || lowerName.includes("birthday") || lowerType.includes("party");
  const isGala = lowerType.includes("gala") || lowerType.includes("dinner") || lowerName.includes("gala");
  const isLaunch = lowerType.includes("launch") || lowerName.includes("launch");
  const isExhibition = lowerType.includes("exhibition") || lowerType.includes("trade") || lowerName.includes("expo");

  // Feasibility assessment
  let feasibility = "Balanced & Practical";
  if (perGuest >= 5000) {
    feasibility = "Comfortable & Well-Funded (Premium)";
  } else if (perGuest < 1500) {
    feasibility = "Lean & High-Efficiency Budget";
  }

  // Tailored AI summary & vibe
  let recommendedVibe = "Minimalist Sage & Contemporary Mint Aesthetic";
  let overview = `A structured ${eventType} planned for ${guestCount} attendees with ₹${budget.toLocaleString("en-IN")} allocated (approx ₹${perGuest.toLocaleString("en-IN")} per guest). Budget proportion is ${feasibility.toLowerCase()}, enabling strong core experiences.`;

  if (isWedding) {
    recommendedVibe = "Romantic Botanical, Champagne Gold & Soft Fairylights";
    overview = `An exquisite wedding celebration honoring ${eventName} for ${guestCount} guests. At ₹${perGuest.toLocaleString("en-IN")} per guest, your budget provides a serene floral canopy, bespoke seating, and memorable guest hospitality.`;
  } else if (isBirthday) {
    recommendedVibe = "Vibrant Pastel, Neon Accents & Dynamic Photo-Op Corners";
    overview = `A high-energy birthday celebration for ${guestCount} close friends and family. Your budget accommodates custom dessert tables, interactive ambient lighting, and personalized entertainment.`;
  } else if (isLaunch) {
    recommendedVibe = "High-Tech Minimalist, Cobalt Glow & Projection Mapping";
    overview = `A brand milestone product launch for ${guestCount} industry leaders and press. Budget enables impactful demo pedestals, dynamic LED stage backgrounds, and synchronized media releases.`;
  } else if (isGala) {
    recommendedVibe = "Emerald Black-Tie Elegance with Crystal Table Accents";
    overview = `An upscale gala evening hosting ${guestCount} distinguished patrons. Budget supports curated multi-course dining, live quartet/ambient acoustics, and commemorative recognition setups.`;
  } else {
    // Default Conference / Summit
    recommendedVibe = "Modern Tech-Executive, Sage Green Accents & Dynamic Digital Signage";
    overview = `A focused ${eventType} for ${guestCount} professionals. Budget allocation of ₹${perGuest.toLocaleString("en-IN")}/attendee allows for dual-screen AV stage setups, dedicated breakout areas, and seamless networking refreshments.`;
  }

  // Tailored Decoration Options
  let decorationOptions: AiEvaluationOption[] = [];
  if (isWedding) {
    decorationOptions = [
      { id: "dec_1", label: "Botanical Floral Arches & White Jasmine Canopies", description: "Natural flora entrance arch with fragrant blooming jasmine and olive branches", recommended: true },
      { id: "dec_2", label: "Warm Fairylight Canopy & Moroccan Amber Lanterns", description: "Suspended ambient warm lighting across the main seating and stage lawn", recommended: true },
      { id: "dec_3", label: "Personalized Monogram Photo-Op Backdrop", description: "Custom engraved backdrop wall with floral accents for guest photo memories", recommended: true },
      { id: "dec_4", label: "Sage & Ivory Velvet Table Linens with Brass Centerpieces", description: "Curated dinner tables with organic textures and scented tapered candles", recommended: false },
      { id: "dec_5", label: "Aisle Floral Runners & Custom Welcome Easel Stand", description: "Matching entryway welcome signage with fresh foliage framing", recommended: false },
    ];
  } else if (isBirthday) {
    decorationOptions = [
      { id: "dec_1", label: "Organic Balloon Garland & Neon Light Feature Wall", description: "Pastel balloon arch paired with custom neon signature phrase", recommended: true },
      { id: "dec_2", label: "Thematic Stage Backdrop & Geometric Dessert Pedestals", description: "Custom focal backdrop with tiered stands for cake and artisanal pastries", recommended: true },
      { id: "dec_3", label: "Interactive Instant Print Photo Booth Corner", description: "Props, instant mini-polaroid printing, and festive floral-foil backdrop", recommended: true },
      { id: "dec_4", label: "Color-Coordinated Table Runners & Confetti Accents", description: "Thematic paper goods, personalized menus, and party favor boxes", recommended: false },
      { id: "dec_5", label: "Custom Ceiling Streamer Chandelier & Uplighting", description: "Vibrant overhead cascading ribbons with perimeter color-wash lighting", recommended: false },
    ];
  } else {
    decorationOptions = [
      { id: "dec_1", label: "Minimalist LED Stage Backdrop & Dynamic Keynote Podiums", description: "High-definition backdrop with ambient stage wash and presenter lectern", recommended: true },
      { id: "dec_2", label: "Branded Digital Totems & Sponsor Display Stands", description: "Sleek signage totems displaying agenda, partner logos, and QR codes", recommended: true },
      { id: "dec_3", label: "Ergonomic Sage Accent Lounge & Networking Pods", description: "Comfortable sectional lounges accented with indoor plants and charging docks", recommended: true },
      { id: "dec_4", label: "Eco-Friendly Recycled Badge & Registration Check-in Desk", description: "Minimalist timber check-in counters with digital scanning stations", recommended: false },
      { id: "dec_5", label: "Directional Floor Vinyl & Illuminated Wayfinding Pillars", description: "Clean architectural pathway lighting guiding attendees between session halls", recommended: false },
    ];
  }

  // Tailored Arrangement Options
  let arrangementOptions: AiEvaluationOption[] = [];
  if (isWedding) {
    arrangementOptions = [
      { id: "arr_1", label: "Wedding Venue & Lawn Reserved with Deposit Paid", description: "Sanctuary / banquet hall confirmed for full event timeline", status: "Done" },
      { id: "arr_2", label: "Catering Menu Curated with Live Cooking Counters", description: "Multi-course feast and beverage station locked with tasting complete", status: "In Progress" },
      { id: "arr_3", label: "Photography & Cinematic Videography Team Contracted", description: "Candid photographers, drone operator, and same-day highlights reel", status: "Done" },
      { id: "arr_4", label: "Bridal Suite & Guest Room Blocks Reserved", description: "On-site hospitality rooms secured for primary family and wedding party", status: "In Progress" },
      { id: "arr_5", label: "Music & Live Acoustic / DJ Sound System Scheduled", description: "Curated playlists, ceremonial mics, and dance floor lighting package", status: "Pending" },
    ];
  } else {
    arrangementOptions = [
      { id: "arr_1", label: "Conference Venue & Main Auditorium Booked", description: "Contract signed, deposit cleared, and hall access timing established", status: "Done" },
      { id: "arr_2", label: "Keynote Speakers & Panelist Agenda Locked", description: "Confirmed presentation schedule and speaker bio directory", status: "In Progress" },
      { id: "arr_3", label: "Catering & High-Protein Barista Coffee Package Finalized", description: "Mid-morning snacks, executive lunch buffet, and artisan coffee bar", status: "Done" },
      { id: "arr_4", label: "Audio/Visual Dual Projectors, Lapel Mics & Tech Crew", description: "Pro sound engineer and live streaming switchers secured", status: "In Progress" },
      { id: "arr_5", label: "Attendee Registration & QR Ticket Check-in System Active", description: "Digital check-in portal with real-time head-count tracking", status: "Pending" },
    ];
  }

  // Tailored Requirement Options
  let requirementOptions: AiEvaluationOption[] = [];
  if (isWedding) {
    requirementOptions = [
      { id: "req_1", label: "Dedicated Bridal & Groom VIP Green Rooms", description: "Private air-conditioned suites with refreshments and full-length mirrors", tag: "Essential" },
      { id: "req_2", label: "Valet Parking & Chauffeur Coordination Desk", description: "Professional valet staff managing up to 60 guest vehicles smoothly", tag: "Essential" },
      { id: "req_3", label: "Dietary-Specific Catering Counters (Jain / Vegan / Halal)", description: "Clearly labeled buffet counters catering to specific dietary choices", tag: "Recommended" },
      { id: "req_4", label: "Generator Backup & Emergency Electrical Safeguards", description: "Dual diesel generator backup to prevent any disruption during rituals", tag: "Essential" },
      { id: "req_5", label: "Custom Favors & Handwritten Welcome Hampers", description: "Handcrafted gift boxes presented to each family upon arrival", tag: "Add-on" },
    ];
  } else {
    requirementOptions = [
      { id: "req_1", label: `High-Speed Dedicated Wi-Fi for ${guestCount} Concurrent Devices`, description: "Gigabit symmetrical network with captive portal for attendee access", tag: "Essential" },
      { id: "req_2", label: "Multi-Camera 4K Live Stream & Cloud Master Recording", description: "Broadcast-quality streaming for remote viewers with synchronized slides", tag: "Recommended" },
      { id: "req_3", label: "Speaker Green Room with High-Speed Internet & Hospitality", description: "Quiet preparation room with refreshments, presentation clickers, and monitors", tag: "Recommended" },
      { id: "req_4", label: "Dietary-Specific Catering Options (Vegan, Gluten-Free, Halal)", description: "Separate clearly labeled meal boxes and allergen notices for attendees", tag: "Essential" },
      { id: "req_5", label: "Live AI Real-time Audio Transcription & Q&A Wall", description: "Interactive audience Q&A screen with live speech-to-text captions", tag: "Add-on" },
    ];
  }

  // Prepend user's custom planned points as Essential requirements
  if (plannedList.length > 0) {
    overview += ` Prioritized by ${leadOrganizer || "planner"}: ${plannedList.join(", ")}.`;
    plannedList.forEach((item, idx) => {
      requirementOptions.unshift({
        id: `planned_${idx + 1}`,
        label: item,
        description: `Custom requirement specified during planning setup (${tier} Tier)`,
        tag: "Essential",
      });
    });
  }

  const budgetBreakdown: BudgetBreakdownItem[] = [
    {
      category: "Catering & Hospitality",
      allocatedAmount: Math.round(budget * 0.38),
      percentage: 38,
      sliderMin: Math.round(budget * 0.25),
      sliderMax: Math.round(budget * 0.5),
      spendStrategy: "Multi-course service and beverage provisions",
    },
    {
      category: "Venue & Infrastructure",
      allocatedAmount: Math.round(budget * 0.25),
      percentage: 25,
      sliderMin: Math.round(budget * 0.15),
      sliderMax: Math.round(budget * 0.35),
      spendStrategy: "Main event space, technical utilities & seating",
    },
    {
      category: "Decorations & Ambience",
      allocatedAmount: Math.round(budget * 0.18),
      percentage: 18,
      sliderMin: Math.round(budget * 0.1),
      sliderMax: Math.round(budget * 0.28),
      spendStrategy: "Floral styling, stage backdrop and lighting",
    },
    {
      category: "Audio, Visual & Media",
      allocatedAmount: Math.round(budget * 0.12),
      percentage: 12,
      sliderMin: Math.round(budget * 0.08),
      sliderMax: Math.round(budget * 0.2),
      spendStrategy: "Sound engineering, camera operators and recording",
    },
    {
      category: "Contingency & Incidentals",
      allocatedAmount: Math.round(budget * 0.07),
      percentage: 7,
      sliderMin: Math.round(budget * 0.03),
      sliderMax: Math.round(budget * 0.12),
      spendStrategy: "Emergency buffer and last-minute requests",
    },
  ];

  const prepCalendarTasks: PrepCalendarTask[] = [
    {
      id: "prep_1",
      title: "Contract Catering & Menu Finalization",
      department: "Catering",
      actionType: "call",
      daysBeforeEvent: 14,
      estimatedCost: Math.round(budget * 0.38),
      actionBrief: `Verify exact head count of ${guestCount} and lock live counter requirements.`,
      priority: "high",
    },
    {
      id: "prep_2",
      title: "Stage & Lighting Architecture Review",
      department: "Decor",
      actionType: "design",
      daysBeforeEvent: 10,
      estimatedCost: Math.round(budget * 0.18),
      actionBrief: "Review visual stage backdrop schematics and power load distribution.",
      priority: "high",
    },
    {
      id: "prep_3",
      title: "Vendor Tech Alignment Call",
      department: "Production",
      actionType: "call",
      daysBeforeEvent: 5,
      estimatedCost: 0,
      actionBrief: "Align mic frequencies, presentation feeds, and camera vantage points.",
      priority: "medium",
    },
    {
      id: "prep_4",
      title: "Final Venue Setup & Rehearsal",
      department: "Operations",
      actionType: "setup",
      daysBeforeEvent: 1,
      estimatedCost: Math.round(budget * 0.1),
      actionBrief: "Execute dry-run walk-through and verify security check-in protocols.",
      priority: "high",
    },
  ];

  const dayOfRunOfShow: DayOfRunOfShowItem[] = [
    {
      timeSlot: "08:00 AM",
      activity: "Vendor Load-in & Power Checks",
      departmentInCharge: "Production Crew",
      operationalNotes: "Verify power distribution, stage trusses, and AV patch bays.",
      dependency: "Venue doors open",
    },
    {
      timeSlot: "10:30 AM",
      activity: "Stage Decoration & Floral Rigging",
      departmentInCharge: "Decor Team",
      operationalNotes: "Complete backdrop styling before camera balance and dry run.",
      dependency: "Production truss clearance",
    },
    {
      timeSlot: "01:00 PM",
      activity: "Audio/Visual Line Check & Tech Rehearsal",
      departmentInCharge: "Tech Crew",
      operationalNotes: "Sound check lapels and test display projections.",
      dependency: "Stage decor completion",
    },
    {
      timeSlot: "03:00 PM",
      activity: "Guest Registration & Welcome Refreshments",
      departmentInCharge: "Hospitality",
      operationalNotes: "Open registration desks with badge scanning and beverage service.",
      dependency: "Audio check pass",
    },
    {
      timeSlot: "04:30 PM",
      activity: "Main Ceremony / Keynote Session Commences",
      departmentInCharge: "Operations Lead",
      operationalNotes: "Execute timed schedule with MC cues and presentation decks.",
      dependency: "Guest seating complete",
    },
  ];

  const mediatorStarterPrompts: string[] = [
    "Ask me to shift the photo shoot earlier",
    "Adjust catering if guest count rises",
    "Add rain contingency for decor",
  ];

  return {
    evaluationSummary: {
      eventVibe: recommendedVibe,
      feasibilityAssessment: overview,
      costPerGuest: perGuest,
    },
    budgetBreakdown,
    prepCalendarTasks,
    dayOfRunOfShow,
    mediatorStarterPrompts,
    aiSummary: {
      headline: `${eventName} — ${tier} AI Blueprint (₹${perGuest.toLocaleString("en-IN")}/guest)`,
      overview,
      budgetPerGuest: `₹${perGuest.toLocaleString("en-IN")}`,
      feasibility,
      recommendedVibe,
    },
    questions: {
      decorations: {
        question: "What are the decorations that you are planning?",
        description: "Select the aesthetic accents and staging elements tailored for your event",
        options: decorationOptions,
      },
      arrangements: {
        question: "What are the arrangements that are done?",
        description: "Mark what is already completed or currently in progress",
        options: arrangementOptions,
      },
      requirements: {
        question: "What are the requirements that you need based on that?",
        description: "Choose essential operational and technical requirements based on guest count and budget",
        options: requirementOptions,
      },
    },
  };
}
