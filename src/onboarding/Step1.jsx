import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function Step1({data,onChange,onNext}){
  const avatars=["👩","👩🏻","👩🏼","👩🏽","👩🏾","👩🏿"];
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:28}}><div style={{fontSize:48,marginBottom:12,animation:"float 3s ease-in-out infinite"}}>{data.avatar||"👩"}</div><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Nice to meet you</h2><p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Let's personalise Nora for your life</p></div>
    <div style={{marginBottom:18}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Choose your avatar</label><div style={{display:"flex",gap:10,justifyContent:"center"}}>{avatars.map(a=><button key={a} onClick={()=>onChange("avatar",a)} style={{fontSize:26,background:data.avatar===a?T.goldP:"transparent",border:`2px solid ${data.avatar===a?T.gold:T.linen}`,borderRadius:12,padding:"7px",cursor:"pointer",transition:"all .15s"}}>{a}</button>)}</div></div>
    <FInput label="Your first name" placeholder="e.g. Sarah" value={data.name} onChange={e=>onChange("name",e.target.value)}/>
    <FInput label="Your city" placeholder="e.g. Melbourne" value={data.city} onChange={e=>onChange("city",e.target.value)}/>
    <div style={{marginBottom:18}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Your role</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{["Working Mum","Stay-at-Home Mum","Entrepreneur","Executive","Other"].map(r=><button key={r} onClick={()=>onChange("role",r)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.role===r?T.gold:T.linen}`,background:data.role===r?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:data.role===r?T.esp:T.bark,cursor:"pointer",transition:"all .15s"}}>{r}</button>)}</div></div>
    <button onClick={onNext} disabled={!data.name||!data.role} className="lift" style={{width:"100%",padding:"15px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:data.name&&data.role?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:data.name&&data.role?1:.5,background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"}}>Continue →</button>
  </div>);}
