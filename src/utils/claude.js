const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-20250514";

// Feature → model map (based on Silicon Valley audit)
const MODEL_MAP = {
  meal_planner:      HAIKU,   // Structured JSON, simple
  school_calendar:   HAIKU,   // Text → JSON extraction
  school_photo:      HAIKU,   // Vision → JSON extraction
  receipt_scanner:   HAIKU,   // Vision → JSON extraction
  csv_import:        HAIKU,   // Text → JSON extraction
  wellness_score:    HAIKU,   // Math + template
  wellness_coach:    HAIKU,   // Empathy via prompting
  budget_coach:      HAIKU,   // Templated advice
  briefing_ask:      HAIKU,   // Factual 2-sentence answer
  gift_advisor:      HAIKU,   // Simple recommendation
  circle_match:      HAIKU,   // Profile → JSON
  morning_briefing:  SONNET,  // Retention hook — don't cheap out
  nora_chat:         SONNET,  // Emotional intelligence
  trip_planner:      SONNET,  // Complex multi-day reasoning
  style_stylist:     SONNET,  // Creative outfit generation
};

export const claude = async (sys, prompt, hist = [], feature = "nora_chat") => {
  const model = MODEL_MAP[feature] || HAIKU;
  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: sys,
        prompt: prompt,
        messages: hist.length > 0 ? hist : undefined,
        max_tokens: 1000,
        model,
        feature
      })
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch (e) {
    return "";
  }
};

export const claudeVision = async (base64, mediaType, prompt, feature = "receipt_scanner") => {
  const model = MODEL_MAP[feature] || HAIKU;
  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: prompt }
          ]
        }],
        max_tokens: 1000,
        model,
        feature
      })
    });
    if (!res.ok) throw new Error("Vision API error");
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch (e) {
    return "";
  }
};
