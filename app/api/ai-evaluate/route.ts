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

export interface AiEvaluationResponse {
  success: boolean;
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
      planningItems = [],
    } = body;

    const trimmedName = String(eventName).trim() || "Untitled Event";
    const resolvedGuestCount = Math.max(1, Number(guestCount) || 100);
    const resolvedBudget = Math.max(0, Number(budget) || 250000);
    const resolvedType = String(eventType).trim() || "Conference";
    const perGuest = Math.round(resolvedBudget / resolvedGuestCount);
    const plannedList = Array.isArray(planningItems) ? planningItems.filter(Boolean) : [];

    // 1. Attempt Gemini API via geminiConfig (handles key retrieval, model cascade, and JSON parsing)
    const prompt = `You are Kordena, an elite GenAI Event Architect.
Analyze this upcoming event:
- Event Name: "${trimmedName}"
- Event Type: "${resolvedType}"
- Guest Count: ${resolvedGuestCount}
- Total Budget: ₹${resolvedBudget} (approx ₹${perGuest}/guest)
${eventDate ? `- Target Date: ${eventDate}` : ""}
${plannedList.length ? `- Specified Planning Items / Needs: ${plannedList.join(", ")}` : ""}

Evaluate the event and generate a structured JSON response to help the planner configure decorations, arrangements, and requirements.
Return ONLY valid JSON matching this exact structure:
{
  "aiSummary": {
    "headline": "concise punchy title highlighting budget per guest and event scale",
    "overview": "2-3 sentences evaluating event feasibility, atmosphere, and key suggestions",
    "budgetPerGuest": "₹${perGuest.toLocaleString("en-IN")}",
    "feasibility": "Comfortable & Well-Funded" | "Balanced & Practical" | "Lean & High-Efficiency",
    "recommendedVibe": "string describing visual & experiential theme"
  },
  "questions": {
    "decorations": {
      "question": "What are the decorations that you are planning?",
      "description": "Select the aesthetic accents and staging elements tailored for your event",
      "options": [
        { "id": "dec_1", "label": "string", "description": "string", "recommended": true },
        { "id": "dec_2", "label": "string", "description": "string", "recommended": true },
        { "id": "dec_3", "label": "string", "description": "string", "recommended": false },
        { "id": "dec_4", "label": "string", "description": "string", "recommended": false },
        { "id": "dec_5", "label": "string", "description": "string", "recommended": true }
      ]
    },
    "arrangements": {
      "question": "What are the arrangements that are done?",
      "description": "Mark what is already completed or currently in progress",
      "options": [
        { "id": "arr_1", "label": "string", "description": "string", "status": "Done" },
        { "id": "arr_2", "label": "string", "description": "string", "status": "In Progress" },
        { "id": "arr_3", "label": "string", "description": "string", "status": "Pending" },
        { "id": "arr_4", "label": "string", "description": "string", "status": "Done" },
        { "id": "arr_5", "label": "string", "description": "string", "status": "In Progress" }
      ]
    },
    "requirements": {
      "question": "What are the requirements that you need based on that?",
      "description": "Choose essential operational and technical requirements based on guest count and budget",
      "options": [
        { "id": "req_1", "label": "string", "description": "string", "tag": "Essential" },
        { "id": "req_2", "label": "string", "description": "string", "tag": "Recommended" },
        { "id": "req_3", "label": "string", "description": "string", "tag": "Add-on" },
        { "id": "req_4", "label": "string", "description": "string", "tag": "Essential" },
        { "id": "req_5", "label": "string", "description": "string", "tag": "Recommended" }
      ]
    }
  }
}`;

    try {
      const result = await geminiConfig({
        prompt,
        responseMimeType: "application/json",
      });

      if (result.success && result.data?.aiSummary && result.data?.questions) {
        return NextResponse.json({
          success: true,
          aiSummary: result.data.aiSummary,
          questions: result.data.questions,
          source: "gemini-api",
        });
      }
    } catch (geminiError) {
      console.warn("Gemini AI evaluation failed, falling back to smart engine:", geminiError);
    }

    // 2. Fallback: Domain-aware Intelligent Kordena AI Engine
    // const evaluation = generateSmartAiEvaluation(
    //   trimmedName,
    //   resolvedType,
    //   resolvedGuestCount,
    //   resolvedBudget,
    //   perGuest
    // );

    // return NextResponse.json({
    //   success: true,
    //   aiSummary: evaluation.aiSummary,
    //   questions: evaluation.questions,
    //   source: "kordena-ai-engine",
    // });
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
  perGuest: number
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

  return {
    aiSummary: {
      headline: `${eventName} — AI Feasibility Blueprint (₹${perGuest.toLocaleString("en-IN")}/guest)`,
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
