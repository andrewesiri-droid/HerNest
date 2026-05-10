import { auth } from "./firebase";

const HAIKU  = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";

const MODEL_MAP = {
  meal_planner:     HAIKU,
  school_calendar:  HAIKU,
  school_photo:     HAIKU,
  receipt_scanner:  HAIKU,
  csv_import:       HAIKU,
  wellness_score:   HAIKU,
  wellness_coach:   HAIKU,
  budget_coach:     HAIKU,
  briefing_ask:     HAIKU,
  gift_advisor:     HAIKU,
  circle_match:     HAIKU,
  morning_briefing: SONNET,
  nora_chat:        SONNET,
  trip_planner:     SONNET,
  style_stylist:    SONNET,
};

async function getIdToken() {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (e) {
    return null;
  }
}

export function detectEmotionalSignal(message) {
  const lower = message.toLowerCase();
  if (["can't deal","leave me alone","too much","need space","shut down","I give up","can't do this"].some(w => lower.includes(w))) return "needs_quiet";
  if (["exhausted","drained","running on empty","can't cope","overwhelmed","burnt out","so tired","no energy","depleted"].some(w => lower.includes(w))) return "exhausted";
  if (["amazing","on fire","crushing it","best week","so good","proud of myself","nailed it","feeling great"].some(w => lower.includes(w))) return "thriving";
  return null;
}

export const claude = async (sys, prompt, hist = [], feature = "nora_chat") => {
  if (["nora_chat","morning_briefing","wellness_coach","budget_coach"].includes(feature)) {
    try {
      const ctxRaw = localStorage.getItem("hn_app_context");
      if (ctxRaw) {
        const appCtx = JSON.parse(ctxRaw);
        if (appCtx.soloParent) {
          const soloNote = "She is a solo parent. Never reference a partner or assume shared parenting. Double the empathy. When she is overwhelmed, give ONE thing only.";
          sys = sys ? soloNote + " " + sys : soloNote;
        }
      }
    } catch (e) {}
  }

  if (feature === "nora_chat" && prompt) {
    const signal = detectEmotionalSignal(prompt);
    let ep = "";
    if (signal === "needs_quiet")  ep = "TONE: She needs space. Acknowledge gently. Don't suggest tasks.";
    else if (signal === "exhausted") ep = "TONE: She is exhausted. Lead with 'I hear you.' One small thing only.";
    else if (signal === "thriving")  ep = "TONE: She is thriving. Match her energy. Be ambitious.";
    if (ep) sys = sys ? ep + " " + sys : ep;
  }

  const model   = MODEL_MAP[feature] || HAIKU;
  const idToken = await getIdToken();
  if (!idToken) return { error: true, code: "unauthenticated" };

  try {
    const res = await fetch("/api/claude", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ system: sys, prompt, messages: hist.length > 0 ? hist : undefined, max_tokens: 1000, model, feature }),
    });

    if (res.status === 429) {
      const data = await res.json();
      // Dispatch event so any screen can show the upgrade modal
      window.dispatchEvent(new CustomEvent("hn_limit_reached", { detail: data }));
      return { error: true, code: "daily_limit_reached", message: data.message };
    }
    if (!res.ok) return { error: true, code: `http_${res.status}` };
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch (e) {
    return { error: true, code: "network_error" };
  }
};

export const claudeVision = async (base64, mediaType, prompt, feature = "receipt_scanner") => {
  const model   = MODEL_MAP[feature] || HAIKU;
  const idToken = await getIdToken();
  if (!idToken) return { error: true, code: "unauthenticated" };

  try {
    const res = await fetch("/api/claude", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({
        messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: prompt }] }],
        max_tokens: 1000, model, feature,
      }),
    });
    if (!res.ok) return { error: true, code: `http_${res.status}` };
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch (e) {
    return { error: true, code: "network_error" };
  }
};
