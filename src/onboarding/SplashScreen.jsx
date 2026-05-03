import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function SplashScreen({onDone}){useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);return(
  <div style={{minHeight:"100vh",background:ESPG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-80,right:-80,width:300,height:300,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
    <div style={{animation:"float 3s ease-in-out infinite",marginBottom:32}}>
      <div style={{width:90,height:90,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 40px rgba(196,154,60,.4)`}}><Ic.Star s={40} c="#fff" w={1.2}/></div>
    </div>
    <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:48,color:"#fff",margin:"0 0 8px",fontWeight:400,textAlign:"center",animation:"fadeUp .6s ease both"}}>Her<strong style={{fontStyle:"normal",fontWeight:700}}>Nest</strong></h1>
    <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",letterSpacing:3,textTransform:"uppercase",margin:"0 0 40px",animation:"fadeUp .6s .15s ease both"}}>Your world, beautifully organised</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",animation:"fadeUp .6s .3s ease both"}}>
      {["AI Mental Load","Trip Planning","Budget Coach","Style Stylist","Wellness"].map((f,i)=><span key={i} style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.5)",background:"rgba(255,255,255,.07)",borderRadius:20,padding:"5px 12px",border:"1px solid rgba(255,255,255,.08)"}}>{f}</span>)}
    </div>
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:"rgba(255,255,255,.1)"}}><div style={{height:"100%",background:`linear-gradient(90deg,${T.gold},${T.sage})`,borderRadius:3,animation:"breathe 2.8s ease"}}/></div>
  </div>
);}
