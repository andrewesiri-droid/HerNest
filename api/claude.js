import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminDb  = getFirestore();
const FREE_LIMIT = 100;

export default async function handler(req, res) {
  // Input validation
  const { prompt, system, feature } = req.body || {};
  if (prompt && prompt.length > 4000) {
    return res.status(400).json({ error: "Message too long. Please keep messages under 4000 characters." });
  }
  const ALLOWED_FEATURES = ["nora_chat","morning_briefing","style_advice","style_stylist","budget_coach","wellness_coach","meal_plan","meal_planner","trip_plan","trip_planner","school_extract","school_calendar","school_photo","receipt_scan","receipt_scanner","csv_import","gift_advisor","briefing_qa","briefing_ask","sunday_reset","travel_brief","weekly_score","wellness_score","debrief","circle_match"];
  if (feature && !ALLOWED_FEATURES.includes(feature)) {
    return res.status(400).json({ error: "Invalid feature." });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Access-Control-Allow-Origin", "https://her-nest.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  if (req.method === "OPTIONS") return res.status(200).end();

  const idToken = req.headers["authorization"]?.split("Bearer ")[1];
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  let uid;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const today = new Date().toISOString().split("T")[0];
  const usageRef = adminDb.doc(`users/${uid}/usage/${today}`);
  try {
    const snap  = await usageRef.get();
    const count = snap.exists ? (snap.data()?.count || 0) : 0;
    if (count >= FREE_LIMIT) {
      return res.status(429).json({ error: "daily_limit_reached", message: "You've used all 10 free daily AI requests. Upgrade to HerNest Pro for unlimited access.", count, limit: FREE_LIMIT });
    }
    usageRef.set({ count: count + 1, date: today }, { merge: true }).catch(() => {});
  } catch (e) {
    console.error("[HerNest] Usage check failed:", e?.message);
  }

  const { messages, max_tokens = 1000, model } = req.body;
  if (max_tokens > 2000) return res.status(400).json({ error: "max_tokens exceeds limit" });
  if (!prompt && !messages) return res.status(400).json({ error: "Missing prompt or messages" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:    model || "claude-haiku-4-5-20251001",
        max_tokens,
        system:   system || undefined,
        messages: messages || [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      let err = {};
      try { err = await response.json(); } catch(e) {}
      console.error("[HerNest API] Anthropic error:", response.status, JSON.stringify(err));
      return res.status(response.status).json({ error: err, status: response.status, model: req.body?.model });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[HerNest API] Caught error:", err?.message);
    return res.status(500).json({ error: "Internal server error", detail: err?.message });
  }
}
