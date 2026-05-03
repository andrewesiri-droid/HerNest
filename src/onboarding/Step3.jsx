import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function Step3({data,onChange,onNext,onBack}){
  const pList=[{id:"family",lb:"Family",IC:Ic.People,c:T.sage},{id:"career",lb:"Career",IC:Ic.Budget,c:T.sky},{id:"fitness",lb:"Fitness",IC:Ic.Leaf,c:T.blush},{id:"travel",lb:"Travel",IC:Ic.Compass,c:T.teal},{id:"finances",lb:"Finances",IC:Ic.Budget,c:T.gold},{id:"selfcare",lb:"Self-care",IC:Ic.Flower,c:T.lav}];
  const toggle=id=>{const c=data.priorities||[];onChange("priorities",c.includes(id)?c.filter(p=>p!==id):c.length<3?[...c,id]:c);};
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:28}}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Ic.Star s={44} c={T.gold} w={1.2}/></div><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your priorities</h2><p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Pick up to 3 — Nora will focus on these</p></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>{pList.map(p=>{const active=(data.priorities||[]).includes(p.id);return(<button key={p.id} onClick={()=>toggle(p.id)} style={{padding:"16px 14px",borderRadius:18,cursor:"pointer",textAlign:"left",background:active?`${p.c}18`:"#fff",border:`2px solid ${active?p.c:T.linen}`,transition:"all .18s"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><p.IC s={20} c={active?p.c:T.taupe} w={1.5}/>{active&&<div style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",background:p.c,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Check s={11} c="#fff" w={2.5}/></div>}</div><div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:active?T.esp:T.bark}}>{p.lb}</div></button>);})}</div>
    <div style={{display:"flex",gap:10}}><button onClick={onBack} style={{flex:1,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`}}>← Back</button><button onClick={onNext} disabled={!(data.priorities||[]).length} className="lift" style={{flex:2,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",opacity:(data.priorities||[]).length?1:.5,background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"}}>Continue →</button></div>
  </div>);}
