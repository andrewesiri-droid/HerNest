
// HerNest Psychic Nudge Card
// The one thing she needs to see, right now

import React, { useState } from "react";
import { T, FD, FB } from "../constants/theme";
import { deferNudge, markNudgeShown } from "../utils/nudgeBuilder";
import { claude } from "../utils/claude";

export function PsychicNudge({ nudge, go, uid, profile, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftText, setDraftText] = useState(null);
  const [done, setDone] = useState(false);
  const [savingsDetail, setSavingsDetail] = useState(false);
  const [meTimeBlocked, setMeTimeBlocked] = useState(false);

  if(!nudge||done) return null;

  const handlePrimary = async () => {
    if(!nudge.primaryAction) return;
    const {action, tab, data, deferKey} = nudge.primaryAction;

    if(action==="open_tab"&&go) { go(tab); markNudgeShown(); setDone(true); return; }

    if(action==="show_school_questions") {
      if(nudge.draftContent) {
        setExpanded(true);
        return;
      }
      setDraftLoading(true);
      const childName = data?.childName||profile?.kids?.[0]?.name||"your child";
      const event = data?.event;
      try{
        const raw = await claude(
          `You are Nora, warm AI assistant for ${profile?.name||"a mother"}. Generate 3 specific, warm parent-teacher meeting questions for ${childName}. Return ONLY a JSON array: ["question1","question2","question3"]. Be specific to the meeting context: ${event?.title||"parent meeting"}. Age context: child named ${childName}.`,
          `Generate 3 parent meeting questions for ${childName}'s ${event?.title||"meeting"}`,
          [], "briefing_ask"
        );
        const questions = JSON.parse(raw.replace(/```json|```/g,"").trim());
        setDraftText(questions);
      }catch(e){
        setDraftText([
          `What specific areas is ${childName} finding most challenging right now?`,
          `What support is available — extra resources or things we can do at home?`,
          `How can we track progress together over the coming weeks?`,
        ]);
      }
      setDraftLoading(false);
      setExpanded(true);
      return;
    }

    if(action==="show_savings_detail") { setSavingsDetail(true); return; }

    if(action==="block_me_time") {
      // Set a localStorage reminder for tomorrow
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
      const tomorrowStr = tomorrow.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"short"});
      try{
        localStorage.setItem("hn_me_time_block", JSON.stringify({date:tomorrowStr,time:"7:00 PM",duration:20}));
      }catch(e){}
      setMeTimeBlocked(true);
      markNudgeShown();
      return;
    }

    if(action==="dismiss") { markNudgeShown(); setDone(true); onDismiss?.(); return; }
  };

  const handleSecondary = () => {
    if(!nudge.secondaryAction) { markNudgeShown(); setDone(true); return; }
    const {action, deferKey, deferDays} = nudge.secondaryAction;
    if(action==="defer"&&deferKey) deferNudge(deferKey, deferDays||2);
    markNudgeShown(); setDone(true); onDismiss?.();
  };

  const copyQuestions = () => {
    const questions = draftText||nudge.draftContent||[];
    navigator.clipboard.writeText(questions.map((q,i)=>`${i+1}. ${q}`).join("
")).catch(()=>{});
  };

  const emailQuestions = () => {
    const questions = draftText||nudge.draftContent||[];
    const body = encodeURIComponent(`Hi,

I wanted to reach out ahead of our meeting. A few things I'd love to discuss:

${questions.map((q,i)=>`${i+1}. ${q}`).join("

")}

Looking forward to connecting.

${profile?.name||""}`);
    const subject = encodeURIComponent(`Parent-Teacher Meeting — ${nudge.primaryAction?.data?.childName||""}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const c = nudge.color;

  // Expanded state — questions drafted
  if(expanded) return (
    <div style={{background:"#fff",borderRadius:18,padding:"18px",marginBottom:12,border:`1.5px solid ${c}30`,boxShadow:`0 4px 20px ${c}20`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{fontSize:20}}>📋</span>
        <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>Drafted for you</div>
      </div>
      {draftLoading?(
        <div style={{display:"flex",gap:4,padding:"8px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:c,animation:`dot 1.2s ease-in-out ${i*.2}s infinite`}}/>)}</div>
      ):(
        <div>
          {(draftText||nudge.draftContent||[]).map((q,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:10,padding:"10px 12px",background:T.sand,borderRadius:12}}>
              <span style={{fontFamily:FD,fontSize:15,color:c,flexShrink:0,fontWeight:700}}>{i+1}</span>
              <p style={{fontFamily:FB,fontSize:12,color:T.bark,margin:0,lineHeight:1.6}}>{q}</p>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={copyQuestions} style={{flex:1,background:T.sand,border:`1px solid ${T.linen}`,borderRadius:10,padding:"9px",fontFamily:FB,fontSize:11,fontWeight:700,color:T.bark,cursor:"pointer"}}>📋 Copy</button>
            <button onClick={emailQuestions} style={{flex:1,background:c,border:"none",borderRadius:10,padding:"9px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer"}}>✉️ Email teacher</button>
            <button onClick={()=>{markNudgeShown();setDone(true);}} style={{flex:1,background:T.linen,border:"none",borderRadius:10,padding:"9px",fontFamily:FB,fontSize:11,color:T.taupe,cursor:"pointer"}}>Done ✓</button>
          </div>
        </div>
      )}
    </div>
  );

  // Me-time blocked state
  if(meTimeBlocked) return (
    <div style={{background:`linear-gradient(135deg,${T.sage},#2a5a3a)`,borderRadius:18,padding:"16px 18px",marginBottom:12}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:24}}>✅</span>
        <div>
          <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff",marginBottom:3}}>Me-time blocked</div>
          <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.7)"}}>Tomorrow 7:00 PM — 20 minutes. Nothing allowed in.</div>
        </div>
      </div>
    </div>
  );

  // Savings detail
  if(savingsDetail&&nudge.savingsPlan) {
    const {gap,weeks,weeklyNeeded,dest,days} = nudge.savingsPlan;
    return (
      <div style={{background:"#fff",borderRadius:18,padding:"18px",marginBottom:12,border:`1.5px solid ${c}30`,boxShadow:`0 4px 20px ${c}20`}}>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 14px"}}>"{dest} is possible."</p>
        {[
          {label:`Save $${weeklyNeeded}/week`, sub:`For ${weeks} weeks → $${weeklyNeeded*weeks} ✓`, icon:"💳"},
          {label:"Skip one takeaway/week", sub:`+$35/week extra → there faster`, icon:"🍕"},
          {label:"Birthday money", sub:"Put it straight to the fund", icon:"🎁"},
        ].map((r,i)=>(
          <div key={i} style={{display:"flex",gap:10,marginBottom:8,padding:"8px 12px",background:T.sand,borderRadius:12}}>
            <span style={{fontSize:18}}>{r.icon}</span>
            <div>
              <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp}}>{r.label}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.taupe}}>{r.sub}</div>
            </div>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={()=>{markNudgeShown();setDone(true);go("budget");}} style={{flex:1,background:c,border:"none",borderRadius:10,padding:"10px",fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>Set up savings →</button>
          <button onClick={()=>{markNudgeShown();setDone(true);}} style={{flex:2,background:T.sand,border:"none",borderRadius:10,padding:"10px",fontFamily:FB,fontSize:11,color:T.taupe,cursor:"pointer"}}>I'll think about it</button>
        </div>
      </div>
    );
  }

  // Default card
  return (
    <div style={{background:"#fff",borderRadius:18,padding:"16px",marginBottom:12,borderLeft:`4px solid ${c}`,boxShadow:"0 2px 16px rgba(0,0,0,.07)"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
        <span style={{fontSize:26,flexShrink:0}}>{nudge.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:c,marginBottom:4}}>{nudge.title}</div>
          <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:"0 0 6px",lineHeight:1.65}}>{nudge.text}</p>
          {nudge.subtext&&<p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:"0 0 8px",lineHeight:1.5,fontStyle:"italic"}}>{nudge.subtext}</p>}
          {nudge.reassurance&&<p style={{fontFamily:FD,fontStyle:"italic",fontSize:13,color:c,margin:"0 0 10px"}}>"{nudge.reassurance}"</p>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {nudge.primaryAction&&<button onClick={handlePrimary} style={{background:c,border:"none",borderRadius:10,padding:"8px 14px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer"}}>{nudge.primaryAction.label}</button>}
            {nudge.secondaryAction&&<button onClick={handleSecondary} style={{background:"none",border:"none",fontFamily:FB,fontSize:11,color:T.taupe,cursor:"pointer",padding:"8px 4px"}}>{nudge.secondaryAction.label}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
