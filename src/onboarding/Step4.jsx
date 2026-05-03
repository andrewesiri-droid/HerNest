import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function Step4({data,onChange,onFinish,onBack}){
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:28}}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Ic.Compass s={44} c={T.teal} w={1.2}/></div><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your goals</h2><p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Nora will help you get there</p></div>
    <FInput label="Next trip destination" placeholder="e.g. Bali, Indonesia" value={data.tripGoal||""} onChange={e=>onChange("tripGoal",e.target.value)}/>
    <FInput label="Fitness goal" placeholder="e.g. Work out 4x per week" value={data.fitnessGoal||""} onChange={e=>onChange("fitnessGoal",e.target.value)}/>
    <FInput label="Savings goal" placeholder="e.g. $10,000 vacation fund" value={data.savingsGoal||""} onChange={e=>onChange("savingsGoal",e.target.value)}/>
    <div style={{marginBottom:18}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Biggest challenge right now</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{["Mental load","Work-life balance","Staying fit","Budget management","Finding me-time"].map(c=><button key={c} onClick={()=>onChange("challenge",c)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.challenge===c?T.gold:T.linen}`,background:data.challenge===c?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:data.challenge===c?T.esp:T.bark,cursor:"pointer",transition:"all .15s"}}>{c}</button>)}</div></div>
    <div style={{display:"flex",gap:10}}><button onClick={onBack} style={{flex:1,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`}}>← Back</button><button onClick={onFinish} className="lift" style={{flex:2,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none"}}>Meet Nora ✨</button></div>
  </div>);}
