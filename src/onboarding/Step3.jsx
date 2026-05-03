import React, { useState } from "react";
import { T, FD, FB } from "../constants/theme";

export function Step3({ data, onChange, onNext, onBack }) {
  const challenges = [
    {id:"mental_load",lb:"Too much in my head",em:"🧠"},
    {id:"time",lb:"Never enough time",em:"⏰"},
    {id:"balance",lb:"Work-life balance",em:"⚖️"},
    {id:"finances",lb:"Staying on budget",em:"💸"},
    {id:"energy",lb:"Low energy & burnout",em:"🔋"},
    {id:"self_care",lb:"No time for myself",em:"🌸"},
  ];
  return (
    <div style={{animation:"fadeUp .4s ease both"}}>
      <p style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.gold,marginBottom:8}}>Step 3 of 3</p>
      <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:28,color:T.esp,margin:"0 0 6px"}}>What's your biggest challenge?</h2>
      <p style={{fontFamily:FB,fontSize:14,color:T.bark,margin:"0 0 20px"}}>Nora will personalise everything around this</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>
        {challenges.map(c=>{
          const active=data.challenge===c.id;
          return <button key={c.id} onClick={()=>onChange("challenge",c.id)} style={{padding:"14px 12px",borderRadius:14,border:`2px solid ${active?T.esp:T.linen}`,background:active?T.esp:"#fff",cursor:"pointer",transition:"all .15s",textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>{c.em}</span>
            <span style={{fontFamily:FB,fontSize:12,fontWeight:700,color:active?"#fff":T.bark,lineHeight:1.3}}>{c.lb}</span>
          </button>;
        })}
      </div>

      {data.name&&<div style={{background:"linear-gradient(135deg,#1a3a6e11,#1a5a9e08)",borderRadius:16,padding:"16px",marginBottom:24,borderLeft:"3px solid #1a5a9e"}}>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:15,color:T.esp,margin:"0 0 4px",lineHeight:1.6}}>
          "Good morning, {data.name}. Nora is ready."
        </p>
        <p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:0}}>Your personalised morning briefing is waiting</p>
      </div>}

      <div style={{display:"flex",gap:10}}>
        <button onClick={onBack} style={{flex:1,background:"none",border:`1.5px solid ${T.linen}`,borderRadius:16,padding:"14px",fontFamily:FB,fontSize:14,fontWeight:700,color:T.bark,cursor:"pointer"}}>← Back</button>
        <button onClick={onNext} style={{flex:2,background:`linear-gradient(135deg,${T.esp},#1a0a04)`,border:"none",borderRadius:16,padding:"14px",fontFamily:FB,fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer"}}>
          Meet Nora →
        </button>
      </div>
    </div>
  );
}
