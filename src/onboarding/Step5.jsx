import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function Step5({data,onChange,onNext,onBack}){
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:44,marginBottom:12}}>👗</div>
      <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your style</h2>
      <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Nora will style you perfectly every time</p>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Body shape</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Hourglass","Pear","Apple","Rectangle","Petite","Plus size"].map(s=>(
          <button key={s} onClick={()=>onChange("bodyShape",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.bodyShape===s?T.blush:T.linen}`,background:data.bodyShape===s?T.blushP:"#fff",fontFamily:FB,fontSize:12,color:data.bodyShape===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      <div>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Height</label>
        <select value={data.height||""} onChange={e=>onChange("height",e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
          <option value="">Select</option>
            {["Under 5ft","5ft 1in-5ft 3in","5ft 3in-5ft 5in","5ft 5in-5ft 7in","5ft 7in-5ft 9in","Over 5ft 9in"].map(h=><option key={h}>{h}</option>)}
        </select>
      </div>
      <div>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Clothing size</label>
        <select value={data.clothingSize||""} onChange={e=>onChange("clothingSize",e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
          <option value="">Select</option>
          {["US 0 / AU 6","US 2 / AU 8","US 4 / AU 10","US 6 / AU 12","US 8 / AU 14","US 10 / AU 16","US 12 / AU 18","US 14+ / AU 20+"].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Style vibe</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Classic","Minimalist","Boho","Edgy","Preppy","Romantic","Sporty"].map(s=>(
          <button key={s} onClick={()=>onChange("styleVibe",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.styleVibe===s?T.lav:T.linen}`,background:data.styleVibe===s?T.lavP:"#fff",fontFamily:FB,fontSize:12,color:data.styleVibe===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Work dress code</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Corporate","Business casual","Smart casual","Creative","Casual","Uniform"].map(s=>(
          <button key={s} onClick={()=>onChange("dresscode",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.dresscode===s?T.sky:T.linen}`,background:data.dresscode===s?T.skyP:"#fff",fontFamily:FB,fontSize:12,color:data.dresscode===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:20}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Favourite colours</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {[{lb:"Neutrals",c:"#B8A898"},{lb:"Navy",c:"#1a2a4e"},{lb:"Black",c:"#2E1F14"},{lb:"Camel",c:"#C49A3C"},{lb:"Blush",c:"#D4826A"},{lb:"Forest",c:"#1a5a3a"},{lb:"White",c:"#f5f5f5"},{lb:"Bold colours",c:"#7a3aaa"}].map(({lb,c})=>(
          <button key={lb} onClick={()=>{const cur=data.favColours||[];onChange("favColours",cur.includes(lb)?cur.filter(x=>x!==lb):[...cur,lb]);}} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${(data.favColours||[]).includes(lb)?c:T.linen}`,background:(data.favColours||[]).includes(lb)?c+"22":"#fff",fontFamily:FB,fontSize:12,color:(data.favColours||[]).includes(lb)?T.esp:T.bark,cursor:"pointer"}}>{lb}</button>
        ))}
      </div>
    </div>

    <div style={{display:"flex",gap:10}}>
      <button onClick={onBack} style={{flex:1,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`}}>← Back</button>
      <button onClick={onNext} className="lift" style={{flex:2,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"}}>Continue →</button>
    </div>
  </div>);
}
