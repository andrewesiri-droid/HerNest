import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../../constants/theme";
import { Ic } from "../../constants/icons.jsx";
import { saveData, loadData } from "../../utils/firebase";
import { claude } from "../../utils/claude";
import { logEvent, EVENTS } from "../../utils/analytics";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar, PageTitle } from "../../components/shared";

export function SundayReset({ profile, calEvents, appContext }) {
  const [data, setData] = useState(null);

  const isWeekend = [0, 6].includes(new Date().getDay());

  const gen = async () => {
    if (!data) setLoading(true);  // only show skeleton on first load
    const schoolEventsRaw = localStorage.getItem("hn_school_events");
    const schoolEvents = schoolEventsRaw ? JSON.parse(schoolEventsRaw) : [];
    const weekAhead = schoolEvents.filter(e => {
      const diff = (new Date(e.date) - new Date()) / (1000*60*60*24);
      return diff >= 0 && diff <= 7;
    });

    // Birthdays this week
    const bdays = [];
    const today = new Date();
    [...(profile?.kids||[]),...(profile?.parents||[]),...(profile?.inlaws||[]),...(profile?.friends||[])].forEach(p => {
      if (!p?.bday) return;
      const parts = p.bday.split("/");
      if (parts.length !== 2) return;
      const next = new Date(today.getFullYear(), parseInt(parts[0])-1, parseInt(parts[1]));
      if (next < today) next.setFullYear(today.getFullYear()+1);
      const days = Math.round((next-today)/86400000);
      if (days <= 7) bdays.push(`${p.name} in ${days} day${days===1?"":"s"}`);
    });

    // Next 7 days calendar
    const nextWeek = (calEvents||[]).filter(e => {
      if (!e.start) return false;
      const diff = (new Date(e.start) - new Date()) / (1000*60*60*24);
      return diff >= 0 && diff <= 7;
    }).map(e => e.title).join(", ");

    const sys = `You are Nora. It's Sunday evening. Generate a warm, specific weekly reset for this mum. Return ONLY valid JSON no markdown:
{"headline":"one warm sentence about the week ahead","weekFocus":"one word or short phrase","familyPrep":["3 specific family prep items for the week"],"selfCare":"one self-care suggestion for the week","groceryHint":"one grocery or meal prep suggestion based on her family","schoolAlert":"one sentence about school events this week or empty string","budgetIntent":"one sentence about budget intention for the week","affirmation":"one warm personal sentence"}`;

    const ctx = `Name: ${profile?.name||"lovely"}, kids: ${profile?.kids?.map(k=>k.name).join(",")||"none"}, school events this week: ${weekAhead.map(e=>e.title).join(",")||"none"}, birthdays: ${bdays.join(",")||"none"}, calendar: ${nextWeek||"nothing scheduled"}, trip goal: ${profile?.tripGoal||"none"}, challenge: ${profile?.challenge||"mental load"}, budget context: ${appContext?.budget?.isNearLimit?"near budget limit":"on track"}.`;

    try {
      const raw = await claude(sys, ctx, [], "morning_briefing");
      const text = typeof raw === "string" ? raw : "";
      const cleaned = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(cleaned);
      setData(parsed);
      const weekKey = "hn_sunday_reset_" + new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});
      try { localStorage.setItem("hn_sunday_reset", JSON.stringify({...parsed, date: new Date().toDateString(), weekKey})); } catch(e) {}
    } catch(e) {
      console.error("[HerNest] Sunday Reset failed:", e?.message);
      // Fallback data so user sees something
      setData({
        headline: `${profile?.name ? profile.name + ", you" : "You"} have got this week handled.`,
        weekFocus: "Presence",
        familyPrep: ["Check the school calendar for the week ahead", "Prep lunches the night before to reduce morning stress", "Block 30 minutes for yourself — non-negotiable"],
        selfCare: "Even 10 minutes of quiet before the house wakes up counts as self-care.",
        groceryHint: "Batch cook one thing on Sunday — it makes the whole week easier.",
        schoolAlert: "",
        budgetIntent: "Spend intentionally this week — one treat that genuinely brings joy.",
        affirmation: "You carry so much, so gracefully. This week, notice how much you actually handle.",
      });
    }
    setLoading(false);
  };

  // Load cached reset — only use if from within last 7 days
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("hn_sunday_reset")||"null");
      if (cached?.date) {
        const age = (Date.now() - new Date(cached.date).getTime()) / (1000*60*60*24);
        if (age < 7) setData(cached);
        else localStorage.removeItem("hn_sunday_reset");
      }
    } catch(e) {}
  }, []);

  return (
    <div style={{animation:"fadeUp .4s ease both"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0e1e28,#1a3a28)",borderRadius:22,padding:"22px 20px",marginBottom:14}}>
        <AIBadge t="Sunday Reset"/>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:"#fff",margin:"10px 0 4px",fontWeight:400}}>Weekly Reset</h2>
        <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.45)",margin:0}}>Sunday evening family prep — get ahead of the week</p>
      </div>

      {!data && !loading && (
        <div style={{textAlign:"center",padding:"32px 20px",background:T.sand,borderRadius:18,marginBottom:14}}>
          <div style={{fontSize:48,marginBottom:12}}>🌿</div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:T.esp,margin:"0 0 8px"}}>Ready for your weekly reset?</p>
          <p style={{fontFamily:FB,fontSize:13,color:T.taupe,margin:"0 0 20px",lineHeight:1.6}}>Nora will prep your family for the week ahead — school, birthdays, meals, and more.</p>
          <button onClick={gen} style={{background:`linear-gradient(135deg,#0e1e28,#1a3a28)`,color:"#fff",border:"none",borderRadius:14,padding:"14px 28px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer"}}>✨ Generate my weekly reset</button>
        </div>
      )}

      {loading && (
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{width:40,height:40,border:`3px solid ${T.linen}`,borderTop:`3px solid ${T.sage}`,borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 16px"}}/>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.taupe}}>Nora is preparing your week…</p>
        </div>
      )}

      {data && !loading && (
        <div>
          {/* Headline */}
          <div style={{background:`linear-gradient(135deg,#0e1e28,#1a3a28)`,borderRadius:18,padding:"20px",marginBottom:14}}>
            <div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.4)",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Week ahead</div>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:"#fff",margin:"0 0 12px",lineHeight:1.6}}>"{data.headline}"</p>
            <div style={{display:"inline-block",background:"rgba(255,255,255,.1)",borderRadius:20,padding:"6px 16px"}}>
              <span style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.sage}}>Focus: {data.weekFocus}</span>
            </div>
          </div>

          {/* Family prep */}
          <Card ch={<div>
            <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.bark,marginBottom:12}}>👨‍👩‍👧 Family prep this week</div>
            {data.familyPrep?.map((item, i) => (
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:i<data.familyPrep.length-1?`1px solid ${T.linen}`:"none"}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:T.sageP,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:FD,fontSize:12,fontWeight:700,color:T.sage}}>{i+1}</div>
                <span style={{fontFamily:FB,fontSize:13,color:T.esp,lineHeight:1.6}}>{item}</span>
              </div>
            ))}
          </div>}/>

          {/* School alert */}
          {data.schoolAlert && (
            <div style={{background:T.skyP,borderRadius:14,padding:"12px 16px",marginBottom:12,borderLeft:`4px solid ${T.sky}`}}>
              <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.sky,marginBottom:4}}>📚 School this week</div>
              <p style={{fontFamily:FB,fontSize:13,color:T.esp,margin:0}}>{data.schoolAlert}</p>
            </div>
          )}

          {/* Self care + grocery */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <Card sx={{marginBottom:0}} ch={<div>
              <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.blush,marginBottom:6}}>🌸 You this week</div>
              <p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,lineHeight:1.6}}>{data.selfCare}</p>
            </div>}/>
            <Card sx={{marginBottom:0}} ch={<div>
              <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.sage,marginBottom:6}}>🛒 Meals & groceries</div>
              <p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,lineHeight:1.6}}>{data.groceryHint}</p>
            </div>}/>
          </div>

          {/* Budget intent */}
          {data.budgetIntent && (
            <div style={{background:T.goldP,borderRadius:14,padding:"12px 16px",marginBottom:12,borderLeft:`4px solid ${T.gold}`}}>
              <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.gold,marginBottom:4}}>💰 Budget intention</div>
              <p style={{fontFamily:FB,fontSize:13,color:T.esp,margin:0}}>{data.budgetIntent}</p>
            </div>
          )}

          {/* Affirmation */}
          <Card sx={{background:`linear-gradient(135deg,${T.esp},#1a0a04)`,border:"none"}} ch={<div style={{textAlign:"center",padding:"8px 0"}}>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:"#fff",margin:"0 0 16px",lineHeight:1.7}}>"{data.affirmation}"</p>
            <button onClick={gen} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,padding:"8px 20px",fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.7)",cursor:"pointer"}}>Regenerate ↺</button>
          </div>}/>
        </div>
      )}
    </div>
  );
}

// ─── Travel Brief Component ───────────────────────────────────────
