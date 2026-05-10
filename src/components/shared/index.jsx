import React from "react";
import { T, FD, FB } from "../../constants/theme";
import { Ic } from "../../constants/icons";

export function Card({ch,sx={}}){return <div className="lift" style={{background:"#fff",borderRadius:22,padding:"18px",boxShadow:"0 4px 20px rgba(30,20,10,.08)",border:`1px solid ${T.linen}`,marginBottom:12,...sx}}>{ch}</div>;}
export function H2({t,sub,light}){return <div style={{marginBottom:14}}><h2 style={{fontFamily:FD,fontWeight:600,fontSize:21,letterSpacing:".01em",color:light?"#fff":T.esp,margin:0,fontStyle:"italic"}}>{t}</h2>{sub&&<p style={{fontFamily:FB,fontSize:12,color:light?"rgba(255,255,255,.45)":T.taupe,margin:"4px 0 0",letterSpacing:".01em"}}>{sub}</p>}</div>;}
export function Pill({ch,on,active,color}){return <button onClick={on} style={{flexShrink:0,border:`1.5px solid ${active?(color||T.esp):"transparent"}`,cursor:"pointer",padding:"7px 16px",borderRadius:22,fontFamily:FB,fontSize:12,fontWeight:600,background:active?(color||T.esp):T.sand,color:active?"#fff":T.bark,transition:"all .2s",letterSpacing:".01em"}}>{ch}</button>;}
export function Tag({ch,c=T.bark}){return <span style={{fontSize:10,fontFamily:FB,fontWeight:700,letterSpacing:1.1,textTransform:"uppercase",color:c,padding:"2px 8px",background:c+"18",borderRadius:20}}>{ch}</span>;}
export function AIBadge({t}){return <span style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.4,textTransform:"uppercase",color:T.gold,background:`linear-gradient(135deg,${T.goldP},#fff8e8)`,padding:"4px 12px",borderRadius:22,border:`1px solid ${T.gold}30`,boxShadow:`0 2px 8px ${T.gold}20`}}><Ic.Star s={10} c={T.gold} w={1.8}/> {t}</span>;}
export function Tile({ic:IC,c=T.bark,bg=T.sand,s=18,ts=36,r=11}){return <div style={{width:ts,height:ts,borderRadius:r,background:bg,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><IC s={s} c={c} w={1.5}/></div>;}
export function Spinner(){return <div style={{width:18,height:18,border:"2.5px solid rgba(255,255,255,.25)",borderTop:"2.5px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>;}
export function Dots(){return <div style={{display:"flex",gap:4,padding:"4px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,.4)",animation:`dot 1.2s ease-in-out ${i*.2}s infinite`}}/>)}</div>;}
export function FInput({label,placeholder,value,onChange,type="text",icon:IC}){return <div style={{marginBottom:16}}>{label&&<label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:7}}>{label}</label>}<div style={{position:"relative"}}>{IC&&<div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",display:"flex"}}><IC s={16} c={T.taupe} w={1.5}/></div>}<input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{width:"100%",fontFamily:FB,fontSize:14,padding:IC?"13px 14px 13px 42px":"13px 16px",borderRadius:14,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp,transition:"all .2s",outline:"none"}}/></div></div>;}
export function ProgressBar({value,max,color=T.sage}){const pct=Math.min(Math.round((value/max)*100),100);return <div style={{background:T.linen,borderRadius:10,height:8,overflow:"hidden"}}><div style={{background:pct>90?T.blush:pct>70?T.gold:color,height:"100%",width:`${pct}%`,borderRadius:10,transition:"width .5s"}}/></div>;}

// ─── NoraCallout ─────────────────────────────────────────────────
export function NoraCallout({ eyebrow="NORA NOTICED", title, children, style={} }) {
  return (
    <div style={{background:"#DDE5DA",borderRadius:16,padding:18,borderLeft:"3px solid #8FA68E",...style}}>
      <div style={{fontFamily:FB,fontWeight:600,fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:"#8FA68E",marginBottom:6}}>{eyebrow}</div>
      {title&&<div style={{fontFamily:FB,fontWeight:600,fontSize:15,color:T.esp,marginBottom:4}}>{title}</div>}
      <div style={{fontFamily:FB,fontSize:13.5,lineHeight:1.5,color:T.esp}}>{children}</div>
    </div>
  );
}

// ─── PageTitle ────────────────────────────────────────────────────
export function PageTitle({ eyebrow, title, style={} }) {
  return (
    <div style={{padding:"4px 4px 0",...style}}>
      {eyebrow&&<div style={{fontFamily:FB,fontWeight:600,fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:T.taupe,marginBottom:6}}>{eyebrow}</div>}
      <div style={{fontFamily:FD,fontStyle:"italic",fontWeight:500,fontSize:32,lineHeight:1.1,color:T.esp}}>{title}</div>
    </div>
  );
}
// ─── HeroCard ─────────────────────────────────────────────────────
export function HeroCard({ eyebrow, title, subtitle, metric, metricLabel, children }) {
  return (
    <div style={{background:`linear-gradient(135deg,${T.esp} 0%,#3D2E22 100%)`,borderRadius:22,padding:24,boxShadow:"0 24px 48px -24px rgba(42,31,24,.35)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,169,97,.13) 0%,transparent 70%)"}}/>
      <div style={{position:"relative",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
        <div style={{flex:1,minWidth:0}}>
          {eyebrow&&<div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:999,background:"rgba(201,169,97,.15)",color:T.gold,fontFamily:FB,fontWeight:600,fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>✦ {eyebrow}</div>}
          <div style={{fontFamily:FD,fontStyle:"italic",fontWeight:500,fontSize:28,lineHeight:1.15,color:"#FCFAF5",marginBottom:6}}>{title}</div>
          {subtitle&&<div style={{fontFamily:FB,fontSize:13,lineHeight:1.45,color:"rgba(252,250,245,.65)"}}>{subtitle}</div>}
        </div>
        {metric&&<div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:FB,fontWeight:500,fontSize:26,color:T.gold,lineHeight:1}}>{metric}</div>
          {metricLabel&&<div style={{fontFamily:FB,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(252,250,245,.5)",marginTop:6}}>{metricLabel}</div>}
        </div>}
      </div>
      {children&&<div style={{position:"relative",marginTop:16}}>{children}</div>}
    </div>
  );
}
