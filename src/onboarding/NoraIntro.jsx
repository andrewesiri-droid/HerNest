import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function NoraIntro({profile,onEnter}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),400);},[]);
  const msgs=[`I know you're ${profile.role?`a ${profile.role}`:"a super mum"}${profile.city?` in ${profile.city}`:""}. 👋`,profile.kids?.length?`I'll keep track of ${profile.kids.map(k=>k.name).join(" and ")} for you. 💛`:"I'll help you manage family life beautifully.",profile.priorities?.length?`Your focus: ${profile.priorities.slice(0,2).join(" & ")}. I've got you.`:"I'll adapt to your priorities every day.",profile.tripGoal?`I'll help you plan ${profile.tripGoal} ✈️`:"I'll help plan your next adventure."];
  return(<div style={{minHeight:"100vh",background:AIGRAD,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 28px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
    {vis&&<>
      <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24,boxShadow:`0 0 40px rgba(196,154,60,.5)`,animation:"breathe 3s ease-in-out infinite"}}><Ic.Star s={36} c="#fff" w={1.2}/></div>
      <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:30,color:"#fff",margin:"0 0 6px",textAlign:"center",animation:"fadeUp .5s ease both"}}>Hi {profile.name||"lovely"}, I'm Nora</h2>
      <p style={{fontFamily:FB,fontSize:14,color:"rgba(255,255,255,.5)",margin:"0 0 28px",textAlign:"center",animation:"fadeUp .5s .1s ease both"}}>Your personal AI, ready to go</p>
      <div style={{width:"100%",maxWidth:360}}>
        {msgs.map((m,i)=><div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:"rgba(255,255,255,.07)",borderRadius:14,padding:"12px 16px",marginBottom:10,border:"1px solid rgba(255,255,255,.08)",animation:`fadeUp .4s ${.2+i*.12}s ease both`}}><div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Check s={12} c="#fff" w={2.5}/></div><p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.8)",margin:0,lineHeight:1.6}}>{m}</p></div>)}
      </div>
      <div style={{width:"100%",maxWidth:360,marginTop:24,animation:"fadeUp .5s .7s ease both"}}>
        <button onClick={onEnter} className="lift" style={{width:"100%",padding:"16px",borderRadius:18,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${T.gold},#8B6914)`,fontFamily:FB,fontSize:15,fontWeight:700,color:"#fff",boxShadow:`0 8px 32px rgba(196,154,60,.4)`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>Enter HerNest →</button>
      </div>
    </>}
  </div>);}
