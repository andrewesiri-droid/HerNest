import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function ShareButton(){
  const [copied,setCopied]=useState(false);
  const share=async()=>{
    const url="https://her-nest.vercel.app/landing.html";
    const msg="Hey! I found this amazing AI app for mums — meet Nora, your personal AI that manages your mental load, plans trips, tracks your budget and keeps you thriving. Try it free 💛 "+url;
    if(navigator.share){
      try{await navigator.share({title:"HerNest AI",text:msg,url});}catch(e){ /* silent */ }
    } else {
      try{await navigator.clipboard.writeText(url);}catch(e){
        const el=document.createElement("textarea");el.value=url;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);
      }
      setCopied(true);setTimeout(()=>setCopied(false),2000);
    }
  };
  return(
    <button onClick={share} className="lift" style={{display:"flex",alignItems:"center",gap:6,background:copied?T.sageP:T.goldP,border:`1px solid ${copied?T.sage:T.gold}30`,borderRadius:20,padding:"6px 12px",cursor:"pointer",transition:"all .2s"}}>
      {copied
        ?<><Ic.Check s={13} c={T.sage} w={2.5}/><span style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.sage}}>Copied!</span></>
        :<><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke={T.gold} strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke={T.gold} strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke={T.gold} strokeWidth="1.8"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round"/></svg><span style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.gold}}>Share</span></>
      }
    </button>
  );
}
