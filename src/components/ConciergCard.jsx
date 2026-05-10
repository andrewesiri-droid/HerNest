import React, { useState, useEffect } from "react";
import { T, FD, FB } from "../constants/theme";
import { claude } from "../utils/claude";
import { Ic } from "../constants/icons.jsx";

// ─── Nora Concierge Card ──────────────────────────────────────────
// Shows ONE proactive insight Nora generated for today
// Refreshes daily. This is the concierge tier foundation.

export function ConciergeCard({ profile, appContext, go }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [actioned, setActioned] = useState(false);

  useEffect(() => {
    // Load cached insight for today
    try {
      const cached = JSON.parse(localStorage.getItem("hn_concierge") || "null");
      const today = new Date().toDateString();
      if (cached?.date === today) { setInsight(cached); return; }
    } catch(e) {}

    // Check if dismissed today
    try {
      const dis = localStorage.getItem("hn_concierge_dismissed");
      if (dis === new Date().toDateString()) { setDismissed(true); return; }
    } catch(e) {}

    // Generate new insight
    generateInsight();
  }, [profile?.name]);

  const generateInsight = async () => {
    if (!profile?.name || loading) return;
    setLoading(true);

    // Gather context
    const schoolEvents = (() => { try { return JSON.parse(localStorage.getItem("hn_school_events")||"[]"); } catch(e) { return []; } })();
    const urgentSchool = schoolEvents.filter(e => { const d = (new Date(e.date)-new Date())/864e5; return d>=0&&d<=3&&e.requiresAction; });
    
    const allPeople = [...(profile?.kids||[]),...(profile?.parents||[]),...(profile?.inlaws||[]),...(profile?.friends||[])];
    const upcomingBdays = allPeople.filter(p => {
      if (!p?.bday) return false;
      const parts = p.bday.split("/"); if (parts.length!==2) return false;
      const today = new Date();
      const next = new Date(today.getFullYear(), parseInt(parts[0])-1, parseInt(parts[1]));
      if (next < today) next.setFullYear(today.getFullYear()+1);
      return Math.round((next-today)/86400000) <= 5;
    }).map(p => { const parts=p.bday.split("/"); const d=new Date(new Date().getFullYear(),parseInt(parts[0])-1,parseInt(parts[1])); if(d<new Date())d.setFullYear(new Date().getFullYear()+1); return {...p, daysUntil:Math.round((d-new Date())/86400000)}; });

    const wellness = appContext?.wellness;
    const budget = appContext?.budget;

    const sys = `You are Nora, a proactive AI concierge. Based on the context, identify the SINGLE most important thing this mum should know or do TODAY. Return ONLY valid JSON:
{"type":"birthday|school|wellness|budget|trip|general","urgency":"high|medium|low","headline":"short punchy observation (max 8 words)","detail":"one warm specific sentence","action":"what she can do right now","actionLabel":"2-3 word button label","tab":"plan|budget|wellness|trips|profile|nora","emoji":"one emoji"}
Be specific. Reference real names and dates. If nothing urgent, give a warm general insight.`;

    const ctx = `Name: ${profile.name}, kids: ${profile.kids?.map(k=>k.name).join(",")||"none"}.
Urgent school events (next 3 days): ${urgentSchool.map(e=>`${e.title} on ${e.date} for ${e.child}`).join(", ")||"none"}.
Upcoming birthdays (next 5 days): ${upcomingBdays.map(p=>`${p.name} in ${p.daysUntil} days`).join(", ")||"none"}.
Wellness: mood ${wellness?.mood||"unknown"}, sleep debt: ${wellness?.sleepDebt||false}.
Budget: ${budget?.isNearLimit?"near limit":"on track"}.
Day of week: ${new Date().toLocaleDateString("en-US",{weekday:"long"})}.`;

    try {
      const raw = await claude(sys, ctx, [], "briefing_ask");
      const text = typeof raw === "string" ? raw : "";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      const data = { ...parsed, date: new Date().toDateString() };
      setInsight(data);
      try { localStorage.setItem("hn_concierge", JSON.stringify(data)); } catch(e) {}
    } catch(e) {
      // Fallback
      if (upcomingBdays.length > 0) {
        const b = upcomingBdays[0];
        setInsight({ type:"birthday", urgency:"high", headline:`${b.name}'s birthday in ${b.daysUntil} days`, detail:`Don't forget — ${b.name}'s birthday is coming up. Nora can help find the perfect gift.`, action:"Find gift ideas", actionLabel:"Gift ideas", tab:"nora", emoji:"🎂", date:new Date().toDateString() });
      } else if (urgentSchool.length > 0) {
        const e = urgentSchool[0];
        setInsight({ type:"school", urgency:"high", headline:`${e.title} needs action`, detail:`${e.title} on ${e.date} requires your attention${e.child?` for ${e.child}`:""}.`, action:"View school calendar", actionLabel:"View calendar", tab:"plan", emoji:"📚", date:new Date().toDateString() });
      }
    }
    setLoading(false);
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("hn_concierge_dismissed", new Date().toDateString()); } catch(e) {}
  };

  const handleAction = () => {
    if (insight?.tab && go) go(insight.tab);
    setActioned(true);
  };

  if (dismissed || actioned || loading || !insight) return null;

  const urgencyColor = insight.urgency === "high" ? T.blush : insight.urgency === "medium" ? T.gold : T.sage;
  const urgencyBg    = insight.urgency === "high" ? T.blushP : insight.urgency === "medium" ? T.goldP : T.sageP;

  return (
    <div style={{ background: urgencyBg, borderRadius: 18, padding: "14px 16px", marginBottom: 14, borderLeft: `4px solid ${urgencyColor}`, animation: "fadeUp .4s ease both" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 26, flexShrink: 0 }}>{insight.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: urgencyColor, marginBottom: 4 }}>Nora noticed</div>
          <div style={{ fontFamily: FB, fontSize: 14, fontWeight: 700, color: T.esp, marginBottom: 4 }}>{insight.headline}</div>
          <p style={{ fontFamily: FB, fontSize: 12, color: T.bark, margin: "0 0 10px", lineHeight: 1.6 }}>{insight.detail}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAction} style={{ background: urgencyColor, border: "none", borderRadius: 10, padding: "7px 14px", fontFamily: FB, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>{insight.actionLabel} →</button>
            <button onClick={dismiss} style={{ background: "none", border: "none", fontFamily: FB, fontSize: 11, color: T.taupe, cursor: "pointer" }}>Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  );
}
