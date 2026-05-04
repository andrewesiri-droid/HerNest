import React, { useState, useEffect, useCallback } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { logEvent, EVENTS } from "../utils/analytics";
import { Card, H2, Pill, AIBadge, Spinner } from "../components/shared";
import { getTodaySleep } from "../utils/sleepInference";
import { inferHabits } from "../utils/habitInference";
import { MOOD_LEVELS, getWeekStart, hasCheckedInThisWeek, getWeeklyMood, submitWeeklyCheckIn } from "../utils/weeklyCheckIn";

// ─── Nora Insight Generator ────────────────────────────────────────
function generateInsight(sleep, weeklyMood, steps, habits, profile) {
  const mood = weeklyMood?.value || 3;
  const hrs = sleep?.hours || 0;
  const name = profile?.name || "you";
  const energy = profile?.energyPattern || "morning";

  if (mood <= 2 && hrs < 6) return `${name}, this week was genuinely hard. Low mood and short sleep is a tough combo. One thing: get to bed 30 minutes earlier tonight. Your ${energy} energy means rest now pays off tomorrow.`;
  if (mood <= 2) return `This week was emotionally heavy. But you checked in — that takes honesty. One small thing next week: a 10-minute walk with no agenda. Just movement. No pressure.`;
  if (mood >= 4 && hrs >= 7) return `Strong week, ${name}. Good mood and good sleep — everything else follows from these two. This is what consistency looks like.`;
  if (hrs > 0 && hrs < 6) return `Your sleep was short this week (${hrs} hours). Everything is harder when you're tired. Priority one: protect bedtime. Even 30 extra minutes changes the week.`;
  if (steps > 8000) return `You moved this week — ${steps.toLocaleString()} steps. That's not nothing. Movement is the most underrated mood tool there is.`;
  return `Steady week, ${name}. Nothing dramatic — and that's okay. Most good weeks are boring. Nora is here if next week gets interesting.`;
}

// ─── Weekly Check-in Card ─────────────────────────────────────────
function CheckInCard({ uid, onComplete }) {
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState(null);

  if (submitted) return (
    <div style={{ background: `linear-gradient(135deg,${T.sage},#2a5a3a)`, borderRadius: 18, padding: "20px", marginBottom: 12, textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🙏</div>
      <p style={{ fontFamily: FD, fontStyle: "italic", fontSize: 16, color: "#fff", margin: "0 0 4px" }}>Thanks for checking in</p>
      <p style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,.7)", margin: 0 }}>Nora will use this to shape your week ahead</p>
    </div>
  );

  return (
    <Card sx={{ border: `2px solid ${T.sage}`, background: "linear-gradient(135deg,#f0f7f4,#fff)" }} ch={<div>
      <p style={{ fontFamily: FD, fontStyle: "italic", fontSize: 18, color: T.esp, margin: "0 0 4px" }}>How was your week?</p>
      <p style={{ fontFamily: FB, fontSize: 12, color: T.taupe, margin: "0 0 16px" }}>One tap — takes 2 seconds</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
        {MOOD_LEVELS.map(m => (
          <button key={m.value} onClick={async () => {
            setSelected(m.value);
            await submitWeeklyCheckIn(m.value, uid, saveData);
            setSubmitted(true);
            if (onComplete) onComplete(m.value);
          }} style={{
            flex: 1, padding: "12px 4px", borderRadius: 14,
            border: `2px solid ${selected === m.value ? m.color : T.linen}`,
            background: selected === m.value ? m.color + "20" : "#fff",
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            transition: "all .15s"
          }}>
            <span style={{ fontSize: 26 }}>{m.emoji}</span>
            <span style={{ fontFamily: FB, fontSize: 9, fontWeight: 700, color: T.bark, textAlign: "center", lineHeight: 1.2 }}>{m.label}</span>
          </button>
        ))}
      </div>
      <p style={{ fontFamily: FB, fontSize: 10, color: T.taupe, margin: "12px 0 0", textAlign: "center", fontStyle: "italic" }}>
        💡 Nora uses this to personalise your score and next week's focus
      </p>
    </div>}/>
  );
}

// ─── Sleep Card ───────────────────────────────────────────────────
function SleepCard({ sleep, onEstimate }) {
  const has = sleep?.hours > 0;
  const good = sleep?.hours >= 7;
  const low = sleep?.hours > 0 && sleep?.hours < 6;

  return (
    <Card ch={<div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <H2 t="Sleep" sub={sleep?.inferred ? "⚡ Inferred from phone activity" : sleep?.source === "user_estimate" ? "Your estimate" : "Log your sleep"} />
        {has && <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FD, fontSize: 32, fontWeight: 700, color: good ? T.sage : low ? T.blush : T.gold }}>{sleep.hours}</div>
          <div style={{ fontFamily: FB, fontSize: 10, color: T.taupe }}>hours</div>
        </div>}
      </div>
      {!has && (
        <div>
          <p style={{ fontFamily: FB, fontSize: 12, color: T.bark, marginBottom: 10 }}>Roughly how long did you sleep?</p>
          <div style={{ display: "flex", gap: 8 }}>
            {[[5, "~5hrs", "Late night"], [6, "~6hrs", "Okay"], [7, "~7hrs", "Good"], [8, "~8hrs", "Great"]].map(([hrs, label, sub]) => (
              <button key={hrs} onClick={() => onEstimate(hrs)} style={{ flex: 1, padding: "10px 4px", borderRadius: 12, border: `1.5px solid ${T.linen}`, background: T.sand, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: T.esp }}>{label}</span>
                <span style={{ fontFamily: FB, fontSize: 9, color: T.taupe }}>{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {has && (
        <div>
          {good && <div style={{ background: T.sageP, borderRadius: 10, padding: "8px 12px", fontFamily: FB, fontSize: 12, color: T.sage }}>✅ Great sleep range — {sleep.hours >= 8 ? "you hit your goal!" : "nearly there"}</div>}
          {low && <div style={{ background: T.blushP, borderRadius: 10, padding: "8px 12px", fontFamily: FB, fontSize: 12, color: T.blush }}>⚠️ Less than 6 hours — prioritise rest today</div>}
          {!good && !low && <div style={{ background: T.goldP, borderRadius: 10, padding: "8px 12px", fontFamily: FB, fontSize: 12, color: T.esp }}>Sleep goal: {sleep.hours >= 7 ? "✓" : `${(7 - sleep.hours).toFixed(1)} hours short of 7hrs`}</div>}
          <button onClick={() => onEstimate(null)} style={{ marginTop: 8, background: "none", border: "none", fontFamily: FB, fontSize: 10, color: T.taupe, cursor: "pointer", textDecoration: "underline" }}>Update estimate</button>
        </div>
      )}
    </div>}/>
  );
}

// ─── Habits Card ──────────────────────────────────────────────────
function HabitsCard({ habits, onMarkDone }) {
  return (
    <Card ch={<div>
      <H2 t="Habits" sub="Auto-detected · tap to mark done" />
      {Object.entries(habits || {}).map(([id, h]) => (
        <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.linen}` }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: h.done ? T.sageP : T.sand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{h.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FB, fontSize: 13, fontWeight: 600, color: T.esp }}>{h.label}</div>
            <div style={{ fontFamily: FB, fontSize: 10, color: T.taupe }}>
              {h.done ? `✅ Done${h.source !== "manual" ? ` · via ${h.source}` : ""}` : h.detected ? `⚡ Detected via ${h.source}` : "Not detected today"}
            </div>
          </div>
          {!h.done && (
            <button onClick={() => onMarkDone(id)} style={{ background: T.sand, border: `1px solid ${T.linen}`, borderRadius: 8, padding: "4px 10px", fontFamily: FB, fontSize: 10, color: T.bark, cursor: "pointer" }}>
              I did this
            </button>
          )}
          {h.done && <Ic.Check s={16} c={T.sage} w={2.5} />}
        </div>
      ))}
    </div>}/>
  );
}

// ─── Water Card ───────────────────────────────────────────────────
function WaterCard({ water, onEstimate }) {
  const glasses = water || 0;
  return (
    <Card ch={<div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <H2 t="Water today" sub="Tap to log" />
        <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: T.sky }}>{glasses}<span style={{ fontFamily: FB, fontSize: 12, color: T.taupe }}>/8</span></div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} onClick={() => onEstimate(i < glasses ? i : i + 1)} style={{ flex: 1, height: 28, borderRadius: 7, cursor: "pointer", background: i < glasses ? T.sky : T.skyP, transition: "background .15s" }} />
        ))}
      </div>
      <p style={{ fontFamily: FB, fontSize: 10, color: T.taupe, margin: 0, textAlign: "center" }}>Tell Nora: "I've had 6 glasses today" to auto-update</p>
    </div>}/>
  );
}

// ─── Weekly Score Card ────────────────────────────────────────────
function WeeklyScoreCard({ score, onGenerate, generating, checkedIn }) {
  if (!checkedIn) return (
    <Card sx={{ background: T.sand, textAlign: "center" }}>
      <p style={{ fontFamily: FD, fontStyle: "italic", fontSize: 15, color: T.taupe, margin: "0 0 4px" }}>Check in above to unlock your score</p>
      <p style={{ fontFamily: FB, fontSize: 11, color: T.taupe, margin: 0 }}>Nora needs your weekly mood to calculate honestly</p>
    </div>}/>
  );

  if (!score && !generating) return (
    <Card sx={{ textAlign: "center" }}>
      <AIBadge t="Weekly Score" />
      <p style={{ fontFamily: FB, fontSize: 12, color: T.taupe, margin: "10px 0 14px", lineHeight: 1.6 }}>Nora will rate your week honestly — no defaults, no padding. Based on your real data.</p>
      <button onClick={onGenerate} style={{ background: `linear-gradient(135deg,${T.sage},#2a5a3a)`, border: "none", borderRadius: 12, padding: "11px 24px", fontFamily: FB, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>✨ Score my week</button>
    </div>}/>
  );

  if (generating) return (
    <Card sx={{ textAlign: "center" }}>
      <div style={{ display: "flex", gap: 4, justifyContent: "center", padding: "8px 0" }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: T.sage, animation: `dot 1.2s ease-in-out ${i * .2}s infinite` }} />)}
      </div>
      <p style={{ fontFamily: FB, fontSize: 12, color: T.taupe, margin: "8px 0 0" }}>Nora is looking at your week...</p>
    </div>}/>
  );

  const scoreColor = score.score >= 7 ? T.sage : score.score >= 4 ? T.gold : T.blush;
  return (
    <Card sx={{ background: `linear-gradient(135deg,${T.esp},#1a0a04)`, border: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <AIBadge t="Weekly Score" />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FD, fontSize: 36, fontWeight: 700, color: "#fff" }}>{score.score}<span style={{ fontFamily: FB, fontSize: 14, color: "rgba(255,255,255,.5)" }}>/10</span></div>
          <div style={{ fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,.4)" }}>{score.generatedAt}</div>
        </div>
      </div>
      <p style={{ fontFamily: FD, fontStyle: "italic", fontSize: 15, color: "#fff", margin: "0 0 12px", lineHeight: 1.6 }}>"{score.headline}"</p>
      {score.wins?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: T.gold, marginBottom: 6 }}>Wins this week</div>
          {score.wins.map((w, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><Ic.Check s={12} c={T.sage} w={2.5} /><span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,.8)" }}>{w}</span></div>)}
        </div>
      )}
      {score.focus && <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 10, padding: "8px 12px", marginBottom: 8, fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,.7)" }}>🎯 Next week: {score.focus}</div>}
      {score.affirmation && <p style={{ fontFamily: FD, fontStyle: "italic", fontSize: 13, color: T.gold, margin: "0 0 10px" }}>"{score.affirmation}"</p>}
      <button onClick={() => {
        const txt = `My HerNest wellness score this week: ${score.score}/10\n"${score.headline}"\n\nWins: ${score.wins?.join(", ")}\n\nTracked with HerNest — her-nest.vercel.app`;
        if (navigator.share) { navigator.share({ text: txt }).catch(() => {}); }
        else { navigator.clipboard.writeText(txt).catch(() => {}); alert("Copied!"); }
      }} style={{ width: "100%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 10, padding: "8px", fontFamily: FB, fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Share my score 📤</button>
    </div>}/>
  );
}

// ─── Nora Insight Card ────────────────────────────────────────────
function InsightCard({ sleep, weeklyMood, steps, habits, profile }) {
  const insight = generateInsight(sleep, weeklyMood, steps, habits, profile);
  return (
    <Card sx={{ background: "linear-gradient(135deg,#f0f7f4,#fff)", border: `1px solid ${T.sage}30` }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>🌿</div>
        <div>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: T.sage, marginBottom: 6 }}>Nora's observation</div>
          <p style={{ fontFamily: FB, fontSize: 13, color: T.bark, margin: 0, lineHeight: 1.7 }}>{insight}</p>
        </div>
      </div>
    </div>}/>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────
export function WellnessScreen({ profile, uid }) {
  const [sleep, setSleep] = useState(() => getTodaySleep());
  const [water, setWater] = useState(() => { try { return parseInt(localStorage.getItem("hn_water") || "3"); } catch (e) { return 3; } });
  const [habits, setHabits] = useState({});
  const [weeklyMood, setWeeklyMood] = useState(() => getWeeklyMood());
  const [checkedIn, setCheckedIn] = useState(() => hasCheckedInThisWeek());
  const [weeklyScore, setWeeklyScore] = useState(() => { try { return JSON.parse(localStorage.getItem("hn_weekly_score") || "null"); } catch (e) { return null; } });
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [steps, setSteps] = useState(0);

  // Load from Firebase on mount
  useEffect(() => {
    if (!uid) return;
    loadData(uid, "wellness").then(d => {
      if (!d) return;
      if (d.sleepArr) {
        const today = new Date().toISOString().split("T")[0];
        const todaySleep = d.sleepArr.find(s => s.date === today);
        if (todaySleep) setSleep(todaySleep);
      }
      if (d.water) setWater(d.water);
      if (d.weeklyMood && d.weeklyMood.weekStart === getWeekStart()) {
        setWeeklyMood(d.weeklyMood);
        setCheckedIn(true);
      }
      if (d.weeklyScore && d.weeklyScore.weekStart === getWeekStart()) {
        setWeeklyScore(d.weeklyScore);
      }
      if (d.habits) {
        // Merge saved habit streaks with inferred
        const inferred = inferHabits([], steps, sleep, weeklyMood);
        const merged = {};
        Object.entries(inferred).forEach(([id, h]) => {
          merged[id] = { ...h, ...(d.habits[id] || {}), done: h.done || d.habits[id]?.done };
        });
        setHabits(merged);
        return;
      }
    }).catch(() => {});
  }, [uid]);

  // Infer habits when data changes
  useEffect(() => {
    setHabits(inferHabits([], steps, sleep, weeklyMood));
  }, [sleep, weeklyMood, steps]);

  // Save water
  const handleWater = (n) => {
    const val = Math.max(0, Math.min(8, n));
    setWater(val);
    try { localStorage.setItem("hn_water", String(val)); } catch (e) {}
    if (uid) saveData(uid, "wellness", { water: val, moods: [3, 3, 3, 3, 3, 3, 3], sleep: sleep?.hours || 0 }).catch(() => {});
  };

  // Save sleep estimate
  const handleSleepEstimate = (hrs) => {
    if (!hrs) { setSleep(null); return; }
    const sleepData = { date: new Date().toISOString().split("T")[0], hours: hrs, inferred: false, source: "user_estimate" };
    setSleep(sleepData);
    try {
      const arr = JSON.parse(localStorage.getItem("hn_sleep_arr") || "[]");
      const filtered = arr.filter(s => s.date !== sleepData.date);
      const updated = [...filtered, sleepData];
      localStorage.setItem("hn_sleep_arr", JSON.stringify(updated));
    } catch (e) {}
    if (uid) saveData(uid, "wellness", { sleepArr: (() => { try { return JSON.parse(localStorage.getItem("hn_sleep_arr") || "[]"); } catch (e) { return []; } })() }).catch(() => {});
  };

  // Mark habit done
  const handleMarkHabit = (id) => {
    setHabits(p => {
      const updated = { ...p, [id]: { ...p[id], done: true, source: "manual" } };
      if (uid) saveData(uid, "wellness", { habits: updated }).catch(() => {});
      return updated;
    });
  };

  // Check-in complete
  const handleCheckInComplete = (moodValue) => {
    const mood = { weekStart: getWeekStart(), value: moodValue, label: MOOD_LEVELS.find(m => m.value === moodValue)?.label };
    setWeeklyMood(mood);
    setCheckedIn(true);
  };

  // Generate weekly score
  const handleGenerateScore = async () => {
    setGenerating(true);
    const avgSleep = sleep?.hours || 0;
    const doneHabits = Object.values(habits).filter(h => h.done).length;
    const sys = `You are Nora, a warm wellness coach. Return ONLY valid JSON: {"score":0,"headline":"one punchy sentence about this week","wins":["",""],"focus":"one gentle suggestion for next week","affirmation":"one warm personal sentence"}. Score honestly from data. A tough week might score 4-5. A great week 8-9.`;
    const prompt = `Weekly data: mood ${weeklyMood?.value || 3}/5 (${weeklyMood?.label || "mixed"}), sleep ${avgSleep}hrs, water ${water}/8 glasses, habits done ${doneHabits}/5, steps ${steps}. Profile: ${profile?.energyPattern || "not set"} energy, fitness ${profile?.fitnessLevel || "not set"}. Generate score.`;
    try {
      const raw = await claude(sys, prompt, [], "wellness_score");
      const data = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const scoreData = { ...data, weekStart: getWeekStart(), generatedAt: new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" }) };
      setWeeklyScore(scoreData);
      try { localStorage.setItem("hn_weekly_score", JSON.stringify(scoreData)); } catch (e) {}
      if (uid) saveData(uid, "wellness", { weeklyScore: scoreData }).catch(() => {});
      logEvent(EVENTS.WELLNESS_SCORE_GENERATED);
    } catch (e) {
      const fallback = { score: 6, headline: "You showed up this week — that counts.", wins: ["You kept going", "You checked in"], focus: "Be gentle with yourself next week", affirmation: "Every small step forward is still progress.", weekStart: getWeekStart(), generatedAt: new Date().toLocaleDateString() };
      setWeeklyScore(fallback);
    }
    setGenerating(false);
  };

  const tabs = ["today", "score", "coach"];

  return (
    <div style={{ animation: "fadeUp .45s ease both" }}>
      {/* Header */}
      <div style={{ background: AIGRAD, borderRadius: 22, padding: "20px", marginBottom: 14 }}>
        <AIBadge t="Thrive" />
        <h2 style={{ fontFamily: FD, fontStyle: "italic", fontSize: 24, color: "#fff", margin: "10px 0 4px", fontWeight: 400 }}>Your wellness</h2>
        <p style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,.4)", margin: 0 }}>Auto-tracked · one tap check-in · no forms</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["today","score","coach"].map(t => <Pill key={t} ch={t === "today" ? "Today" : t === "score" ? "Weekly Score" : "Nora Coach"} active={activeTab === t} on={() => setActiveTab(t)} color={T.sage} />)}
      </div>

      {/* Today tab */}
      {activeTab === "today" && (
        <div>
          {/* Weekly check-in — if not done */}
          {!checkedIn && <CheckInCard uid={uid} onComplete={handleCheckInComplete} />}

          {/* Nora insight */}
          <InsightCard sleep={sleep} weeklyMood={weeklyMood} steps={steps} habits={habits} profile={profile} />

          {/* Sleep */}
          <SleepCard sleep={sleep} onEstimate={handleSleepEstimate} />

          {/* Water */}
          <WaterCard water={water} onEstimate={handleWater} />

          {/* Habits */}
          <HabitsCard habits={habits} onMarkDone={handleMarkHabit} />
        </div>
      )}

      {/* Weekly Score tab */}
      {activeTab === "score" && (
        <div>
          {!checkedIn && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontFamily: FB, fontSize: 12, color: T.taupe, textAlign: "center", marginBottom: 10 }}>Check in first to unlock your score</p>
              <CheckInCard uid={uid} onComplete={handleCheckInComplete} />
            </div>
          )}
          <WeeklyScoreCard score={weeklyScore} onGenerate={handleGenerateScore} generating={generating} checkedIn={checkedIn} />
        </div>
      )}

      {/* Coach tab */}
      {activeTab === "coach" && <CoachTab profile={profile} sleep={sleep} water={water} habits={habits} weeklyMood={weeklyMood} steps={steps} uid={uid} />}
    </div>
  );
}

// ─── Coach Tab ────────────────────────────────────────────────────
function CoachTab({ profile, sleep, water, habits, weeklyMood, steps, uid }) {
  const [hist, setHist] = useState(() => {
    try { const s = localStorage.getItem("hn_wellness_chat"); if (s) return JSON.parse(s); } catch (e) {}
    return [{ role: "assistant", content: "Hey! 🌿 I'm looking at your week. Ask me anything — I'll be specific and honest." }];
  });
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!inp.trim() || loading) return;
    const msg = inp.trim(); setInp(""); setLoading(true);
    const h = hist.map(m => ({ role: m.role, content: m.content }));
    const doneHabits = Object.values(habits || {}).filter(h => h.done).length;
    const ctx = `Mood this week: ${weeklyMood?.value || "not checked in"}/5. Sleep: ${sleep?.hours || "unknown"}hrs. Water: ${water}/8 glasses. Steps: ${steps}. Habits done: ${doneHabits}/5. Energy pattern: ${profile?.energyPattern || "not set"}. Fitness level: ${profile?.fitnessLevel || "not set"}.`;
    try {
      const raw = await claude(`You are Nora, warm wellness coach in HerNest. Real data: ${ctx}. Be specific. Reference her actual numbers. If mood is low, acknowledge first. 3-4 sentences max. Never judgmental.`, msg, h, "wellness_coach");
      const updated = [...hist, { role: "user", content: msg }, { role: "assistant", content: raw }];
      setHist(updated);
      try { localStorage.setItem("hn_wellness_chat", JSON.stringify(updated.slice(-20))); } catch (e) {}
    } catch (e) {
      setHist(p => [...p, { role: "user", content: msg }, { role: "assistant", content: "Lost connection for a second — try again. 🌿" }]);
    }
    setLoading(false);
  };

  const prompts = ["How do I get more energy?", "Help me sleep better", "I feel burnt out", "What should I focus on this week?"];

  return (
    <div>
      <div style={{ background: AIGRAD, borderRadius: 18, padding: "16px", marginBottom: 14 }}>
        <AIBadge t="Wellness Coach" />
        <p style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,.6)", margin: "8px 0 0", lineHeight: 1.6 }}>I know your week. Ask me anything — I'll be honest, specific, and on your side.</p>
      </div>
      {hist.length <= 1 && prompts.map((q, i) => (
        <div key={i} onClick={() => setInp(q)} style={{ background: "#fff", border: `1px solid ${T.linen}`, borderRadius: 11, padding: "9px 14px", cursor: "pointer", marginBottom: 8, fontFamily: FB, fontSize: 12, color: T.bark }}>🌿 {q}</div>
      ))}
      <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 10 }}>
        {hist.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
            <div style={{ maxWidth: "85%", background: m.role === "user" ? `linear-gradient(135deg,${T.esp},#2a1a0a)` : "#fff", borderRadius: 16, padding: "10px 14px", border: m.role === "assistant" ? `1px solid ${T.linen}` : "none" }}>
              <p style={{ fontFamily: FB, fontSize: 13, color: m.role === "user" ? "rgba(255,255,255,.9)" : T.bark, margin: 0, lineHeight: 1.6 }}>{m.content}</p>
            </div>
          </div>
        ))}
        {loading && <div style={{ display: "flex", gap: 4, padding: "8px 0" }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.sage, animation: `dot 1.2s ease-in-out ${i * .2}s infinite` }} />)}</div>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && ask()} placeholder="Ask Nora about your wellness…" style={{ flex: 1, fontFamily: FB, fontSize: 13, padding: "11px 14px", borderRadius: 13, border: `1.5px solid ${T.linen}`, background: "#fff", color: T.esp }} />
        <button onClick={ask} style={{ background: T.sage, border: "none", borderRadius: 13, padding: "0 16px", cursor: "pointer" }}><Ic.Send s={16} c="#fff" w={2} /></button>
      </div>
      <button onClick={() => { setHist([{ role: "assistant", content: "Fresh start 🌿 What's on your mind?" }]); try { localStorage.removeItem("hn_wellness_chat"); } catch (e) {} }} style={{ marginTop: 8, background: "none", border: "none", fontFamily: FB, fontSize: 10, color: T.taupe, cursor: "pointer", textDecoration: "underline" }}>Clear chat</button>
    </div>
  );
}
