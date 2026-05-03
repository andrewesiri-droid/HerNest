import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function OfflineBanner(){
  const [offline,setOffline]=useState(!navigator.onLine);
  useEffect(()=>{
    const on=()=>setOffline(false);
    const off=()=>setOffline(true);
    window.addEventListener("online",on);
    window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);
  if(!offline)return null;
  return(
    <div style={{background:`linear-gradient(135deg,${T.blush},#a85040)`,padding:"8px 16px",display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span style={{fontFamily:FB,fontSize:12,color:"#fff",fontWeight:600}}>You're offline — app still works, AI features need connection</span>
    </div>
  );
}
