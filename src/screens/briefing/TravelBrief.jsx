import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../../constants/theme";
import { Ic } from "../../constants/icons.jsx";
import { saveData, loadData } from "../../utils/firebase";
import { claude } from "../../utils/claude";
import { logEvent, EVENTS } from "../../utils/analytics";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar, PageTitle } from "../../components/shared";

export function TravelBrief({ trip, daysUntil, profile }) {
  const [brief, setBrief] = useState(null);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(`hn_travel_brief_${trip?.id}`) || "null");
      if (cached) setBrief(cached);
    } catch(e) {}
  }, [trip?.id]);

  const gen = async () => {
    if (!trip) return;
    setLoading(true);

    // Get checklist completion
    let checklistDone = 0, checklistTotal = 0;
    try {
      const planData = JSON.parse(localStorage.getItem("hn_plan_data") || "{}");
      const plan = planData[trip.id];
      if (plan?.checklist) {
        checklistTotal = plan.checklist.length;
        checklistDone = plan.checklist.filter(c => c.done).length;
      } else {
        checklistTotal = trip.checklist?.length || 0;
        checklistDone = trip.checklist?.filter(c => c.done).length || 0;
      }
    } catch(e) {}

    const sys = `You are Nora, personal travel concierge. Return ONLY valid JSON no markdown:
{"countdown":"one exciting sentence about the trip countdown","urgentActions":["2-3 specific things to do before departure based on days remaining"],"packingReminder":"one packing tip specific to destination and season","kidsTip":"one tip for travelling with kids or empty string if no kids","budgetNote":"one budget reminder","excitement":"one warm sentence building excitement for the trip","weatherHint":"one weather/climate tip for the destination"}`;

    const ctx = `Trip: ${trip.dest}, departing in ${daysUntil} days, ${trip.nights} nights, budget $${trip.budget}, travellers: ${trip.whosComing?.join(", ")||"family"}, status: ${trip.status}. Checklist: ${checklistDone}/${checklistTotal} items done. Kids: ${profile?.kids?.map(k=>k.name).join(",")||"none"}.`;

    try {
      const raw = await claude(sys, ctx, [], "trip_planner");
      const text = typeof raw === "string" ? raw : "";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setBrief(parsed);
      try { localStorage.setItem(`hn_travel_brief_${trip.id}`, JSON.stringify(parsed)); } catch(e) {}
    } catch(e) {
      setBrief({
        countdown: `${daysUntil} days until ${trip.dest} — the excitement is building! ✈️`,
        urgentActions: daysUntil <= 7 ? ["Check all passports are valid", "Download offline maps", "Notify your bank"] : daysUntil <= 30 ? ["Book travel insurance if not done", "Check visa requirements", "Start packing list"] : ["Book flights if not done", "Research accommodation options", "Set a savings goal"],
        packingReminder: "Roll clothes instead of folding to save space and reduce wrinkles.",
        kidsTip: profile?.kids?.length ? "Pack a small activity bag for each child with their favourite things." : "",
        budgetNote: `$${trip.budget?.toLocaleString()} budget — track spending in the Budget tab.`,
        excitement: `${trip.dest} is going to be incredible. You deserve every moment of this. 💛`,
        weatherHint: "Check the weather forecast 7 days before departure and pack layers.",
      });
    }
    setLoading(false);
  };

  if (!trip) return (
    <div style={{textAlign:"center",padding:"40px 20px",background:T.sand,borderRadius:18}}>
      <div style={{fontSize:48,marginBottom:12}}>✈️</div>
      <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:T.esp,margin:"0 0 8px"}}>No upcoming trips</p>
      <p style={{fontFamily:FB,fontSize:13,color:T.taupe,margin:0}}>Add a trip in the Trips tab and Nora will brief you before you go.</p>
    </div>
  );

  return (
    <div style={{animation:"fadeUp .4s ease both"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0e2a1e,#1a5a3a)",borderRadius:22,padding:"22px 20px",marginBottom:14}}>
        <AIBadge t="Travel Brief"/>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:24,color:"#fff",margin:"10px 0 4px",fontWeight:400}}>{trip.dest}</h2>
        <div style={{display:"flex",gap:16,marginTop:8}}>
          {[
            [`${daysUntil}`, "days to go"],
            [`${trip.nights}`, "nights"],
            [`$${(trip.budget||0).toLocaleString()}`, "budget"],
          ].map(([v,l],i) => (
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:"#fff"}}>{v}</div>
              <div style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.45)",letterSpacing:1,textTransform:"uppercase"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {!brief && !loading && (
        <div style={{textAlign:"center",padding:"28px 20px",background:T.sand,borderRadius:18,marginBottom:14}}>
          <div style={{fontSize:36,marginBottom:10}}>🗺️</div>
          <p style={{fontFamily:FB,fontSize:13,color:T.taupe,margin:"0 0 16px",lineHeight:1.6}}>Nora will brief you on everything you need before {trip.dest}.</p>
          <button onClick={gen} style={{background:"linear-gradient(135deg,#0e2a1e,#1a5a3a)",color:"#fff",border:"none",borderRadius:14,padding:"13px 24px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer"}}>✨ Generate travel brief</button>
        </div>
      )}

      {loading && (
        <div style={{textAlign:"center",padding:"32px 20px"}}>
          <div style={{width:36,height:36,border:`3px solid ${T.linen}`,borderTop:`3px solid ${T.teal}`,borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 12px"}}/>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:15,color:T.taupe}}>Nora is preparing your travel brief…</p>
        </div>
      )}

      {brief && !loading && (
        <div>
          {/* Countdown */}
          <div style={{background:`linear-gradient(135deg,${T.tealP},#fff)`,borderRadius:16,padding:"14px 16px",marginBottom:12,borderLeft:`4px solid ${T.teal}`}}>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:15,color:T.esp,margin:0,lineHeight:1.6}}>"{brief.countdown}"</p>
          </div>

          {/* Urgent actions */}
          <Card ch={<div>
            <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.blush,marginBottom:10}}>⚡ Do before you go</div>
            {brief.urgentActions?.map((action,i) => (
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:i<brief.urgentActions.length-1?`1px solid ${T.linen}`:"none"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:T.blushP,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:FD,fontSize:11,fontWeight:700,color:T.blush}}>{i+1}</div>
                <span style={{fontFamily:FB,fontSize:13,color:T.esp,lineHeight:1.5}}>{action}</span>
              </div>
            ))}
          </div>}/>

          {/* Tips grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <Card sx={{marginBottom:0}} ch={<div>
              <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.sage,marginBottom:6}}>🎒 Packing</div>
              <p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,lineHeight:1.6}}>{brief.packingReminder}</p>
            </div>}/>
            <Card sx={{marginBottom:0}} ch={<div>
              <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.sky,marginBottom:6}}>🌤️ Weather</div>
              <p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,lineHeight:1.6}}>{brief.weatherHint}</p>
            </div>}/>
          </div>

          {brief.kidsTip && (
            <div style={{background:T.goldP,borderRadius:14,padding:"12px 16px",marginBottom:12,borderLeft:`4px solid ${T.gold}`}}>
              <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.gold,marginBottom:4}}>👶 Kids tip</div>
              <p style={{fontFamily:FB,fontSize:13,color:T.esp,margin:0}}>{brief.kidsTip}</p>
            </div>
          )}

          {/* Budget + excitement */}
          <Card sx={{background:`linear-gradient(135deg,#0e2a1e,#1a5a3a)`,border:"none"}} ch={<div>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:15,color:"#fff",margin:"0 0 12px",lineHeight:1.7}}>"{brief.excitement}"</p>
            <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.6)",margin:"0 0 14px"}}>{brief.budgetNote}</p>
            <button onClick={gen} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,padding:"8px 20px",fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.7)",cursor:"pointer"}}>Regenerate ↺</button>
          </div>}/>
        </div>
      )}
    </div>
  );
}
