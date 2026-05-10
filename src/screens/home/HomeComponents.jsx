import React, { useState, useEffect } from "react";
import { T, FD, FB, AIGRAD } from "../../constants/theme";
import { Ic } from "../../constants/icons.jsx";
import { loadSummary } from "../../utils/firebase";
import { selectPsychicNudge } from "../../utils/nudgeBuilder";
import { getPendingFollowUp, closeFollowUp } from "../../utils/followUpSystem";
import { isQuietMode, setQuietMode, clearQuietMode } from "../../utils/quietMode";
import { buildEmotionalContext } from "../../utils/emotionalContext";
import { PsychicNudge } from "../../components/PsychicNudge";
import { ConciergeCard } from "../../components/ConciergCard.jsx";
import { claude } from "../../utils/claude";
import { Card, AIBadge, Tile, Spinner, Tag, NoraCallout } from "../../components/shared";

// ─── Greeting Generator ───────────────────────────────────────────
function buildGreeting(firstName, appContext) {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  if (!appContext) {
    const g = hour<5?"Still up,":hour<12?"Good morning,":hour<17?"Good afternoon,":hour<21?"Good evening,":"Good night,";
    return { line1: g, line2: firstName, sub: null, color: T.gold };
  }

  const emotional = buildEmotionalContext(appContext);
  const tasks = appContext.tasks;
  const wellness = appContext.wellness;
  const name = firstName;

  // Crisis
  if (emotional?.load?.level === "critical") return {
    line1: name + ".", line2: "One thing at a time.",
    sub: "Nora is here. Start with breathing.",
    color: "#9b59b6"
  };

  // Heavy
  if (emotional?.load?.level === "heavy") return {
    line1: days[day] + " morning,", line2: name,
    sub: `${tasks?.todayCount||0} things today — but only one matters right now.`,
    color: T.sage
  };

  // Thriving
  if (wellness?.isThriving) return {
    line1: name + ", you're on a roll.", line2: "Keep going.",
    sub: `${wellness.habitsDone||0}/5 habits this week. Strong.`,
    color: T.gold
  };

  // Weekend
  if (day === 0 || day === 6) return {
    line1: "Weekend,", line2: name,
    sub: "What does 'you time' look like today?",
    color: T.sage
  };

  // Monday
  if (day === 1) return {
    line1: "Monday morning,", line2: name,
    sub: "New week. Nora sorted the priorities.",
    color: T.gold
  };

  // Friday
  if (day === 5) return {
    line1: "Friday,", line2: name,
    sub: `${tasks?.todayCount||0} things, then rest.`,
    color: "#f39c12"
  };

  // Default — specific, never generic
  const g = hour<12?"morning,":hour<17?"afternoon,":"evening,";
  return {
    line1: `${days[day]} ${g}`, line2: name,
    sub: tasks?.todayCount > 0 ? `${tasks.todayCount} thing${tasks.todayCount>1?"s":""} today${tasks.urgentCount>0?`, ${tasks.urgentCount} urgent`:""}. Nora sorted them.` : "All clear today. Enjoy it.",
    color: T.gold
  };
}

// ─── Emotional background ─────────────────────────────────────────
function getBg(appContext) {
  if (!appContext) return "#f8f6f2";
  const emotional = buildEmotionalContext(appContext);
  const level = emotional?.load?.level;
  if (level === "critical") return "#faf8f5";
  if (level === "heavy") return "#f5f7fa";
  if (emotional?.state === "thriving") return "#f0f9f4";
  return "#f8f6f2";
}

// ─── Quick Glance tiles ───────────────────────────────────────────
function QuickGlance({ icon, value, label, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{background:"#fff",borderRadius:16,padding:"14px 12px",textAlign:"center",cursor:onClick?"pointer":"default",border:`1px solid ${T.linen}`,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
      <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
      <div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:color||T.esp}}>{value}</div>
      <div style={{fontFamily:FB,fontSize:10,color:T.bark,fontWeight:700,letterSpacing:.5}}>{label}</div>
      {sub&&<div style={{fontFamily:FB,fontSize:9,color:T.taupe,marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ─── Upcoming row ─────────────────────────────────────────────────
function UpcomingRow({ item, go }) {
  const icons = { birthday:"🎂", task:"✓", school:"📚", trip:"✈️" };
  const colors = { birthday:T.blush, task:T.gold, school:T.sky, trip:T.sage };
  const tabs = { birthday:"profile", task:"plan", school:"plan", trip:"trips" };
  const daysText = item.daysUntil===0?"Today":item.daysUntil===1?"Tomorrow":`${item.daysUntil}d`;
  return (
    <div onClick={()=>go(tabs[item.type]||"plan")} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${T.linen}`,cursor:"pointer"}}>
      <div style={{width:28,height:28,borderRadius:8,background:(colors[item.type]||T.gold)+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{icons[item.type]||"•"}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:FB,fontSize:13,fontWeight:600,color:T.esp,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title||item.name}</div>
        {item.child&&item.child!=="All"&&<div style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{item.child}</div>}
      </div>
      <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:colors[item.type]||T.gold,flexShrink:0}}>{daysText}</div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────

export { buildGreeting, getBg, QuickGlance, UpcomingRow };
