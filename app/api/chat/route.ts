import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message, eventContext, apiKey } = await request.json();

    const geminiKey = apiKey || process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: geminiKey });

        const prompt = `You are Kordena, the intelligent GenAI Event Planner.
You maintain a serene, balanced, focused, and proactive tone.
Theme palette: Fresh Sage (#F4F7F5), Pure White Surfaces, Slate Gray text (#2D3748), Emerald / Mint accents (#10B981).

Current Event Context:
Title: ${eventContext?.title || "Event"}
Type: ${eventContext?.eventType || "Event"}
Guest Count: ${eventContext?.guestCount || "N/A"}
Budget: $${eventContext?.totalBudget || "N/A"}
Location: ${eventContext?.location || "N/A"}

User Question/Prompt:
"${message}"

Provide a crisp, actionable, elegant response. When suggesting changes (e.g. cutting budget, adjusting timeline, or drafting guest emails), format with bullet points and clear numbers.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const reply = response.text?.trim();
        if (reply) {
          return NextResponse.json({ success: true, reply });
        }
      } catch (err) {
        console.warn("Gemini chat error, falling back to smart advice engine:", err);
      }
    }

    // Smart fallback generator for contextual advice
    const reply = generateSmartAdvisorReply(message, eventContext);
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { success: false, reply: "I am ready to help refine your event. Could you rephrase your question?" },
      { status: 500 }
    );
  }
}

function generateSmartAdvisorReply(message: string, context: any): string {
  const lower = (message || "").toLowerCase();
  const eventTitle = context?.title || "your event";
  const budget = context?.totalBudget || 30000;
  const guests = context?.guestCount || 100;

  if (lower.includes("budget") || lower.includes("cost") || lower.includes("save") || lower.includes("cut")) {
    return `🌿 **Kordena AI Budget Optimization for ${eventTitle}**:

1. **Repurpose Floral Installations**: Use ceremony floral arches and olive garlands as the photo-wall and head table backdrop for reception (estimated savings: **$850 – $1,200**).
2. **Signature Drink Strategy**: Limit the open bar to 2 curated herbal sage & mint signature cocktails plus local wines instead of an unrestricted top-shelf liquor roster (estimated savings: **$1,400**).
3. **Digital & Sustainable Stationery**: Transition remaining paper collateral to digital RSVP and dynamic seat-finders with NFC/QR cards (savings: **$400**).

*This preserves your serene aesthetic while freeing up ~$2,600 into your contingency buffer.*`;
  }

  if (lower.includes("invite") || lower.includes("email") || lower.includes("draft") || lower.includes("message")) {
    return `✉️ **Bespoke Invitation Draft for ${eventTitle}**:

**Subject**: You are warmly invited to ${eventTitle}

Dear [Guest Name],

We invite you to join us for an evening designed around serenity, inspiration, and connection.

• **When**: ${context?.date || "Upcoming"}
• **Where**: ${context?.location || "San Francisco"}
• **Aesthetic & Attire**: Relaxed Elegance / Fresh Sage & Neutral Tones

Please confirm your attendance and dietary preferences by visiting your personal guest portal: [RSVP Link]

Warm regards,  
The Planning Host`;
  }

  if (lower.includes("timeline") || lower.includes("schedule") || lower.includes("run of show") || lower.includes("time")) {
    return `⏱️ **Kordena Optimal Schedule Recommendation**:

• **T - 3 Hours**: Vendor load-in, stage audio balance, lighting preset lock.
• **T - 30 Mins**: Ambient 432Hz soundscape & fresh mint mocktails ready at foyer.
• **Hour 0**: Welcome remarks & opening presentation (keep to 35 mins for peak executive retention).
• **Hour 1.5**: Multi-course dinner service with scheduled 15-minute intermezzo.
• **Hour 3.5**: Coffee, artisanal herbal infusions, and networking lounge.`;
  }

  if (lower.includes("drink") || lower.includes("food") || lower.includes("menu") || lower.includes("catering")) {
    return `🍸 **Sage & Mint Curated Beverage & Culinary Pairing**:

1. **The Emerald Solstice (Signature Mocktail)**: Muddled garden mint, fresh lime, cold-pressed cucumber juice, elderflower tonic, and bruised sage leaf garnish.
2. **Wild Botanist Spritz**: Prosecco, sparkling botanical water, bergamot, and dehydrated citrus wheel.
3. **Farm-to-Table Entrée**: Pan-seared sea bass or wild foraged mushroom risotto with herb oil and micro-greens.`;
  }

  return `✨ **Kordena AI Event Recommendation for ${eventTitle}**:

Based on your current plan for **${guests} guests** with a **$${budget.toLocaleString()}** allocation:

• **Ambiance**: Prioritize warm 2700K indirect lighting and living botanical foliage to reinforce your serene sage aesthetic.
• **Flow**: Ensure a 10-minute buffer between reception and seated dining to let guests comfortably find their places.
• **Task Status**: Keep track of high-priority calendar alerts to avoid surge vendor charges.

Feel free to ask me to draft announcements, negotiate vendor terms, or rebalance your budget categories!`;
}
