import { useState, useRef, useEffect } from "react";

// ─── FONTS ────────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;700&display=swap";
fl.rel = "stylesheet";
document.head.appendChild(fl);

const gs = document.createElement("style");
gs.textContent = `
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  body{margin:0;background:#1a1410;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  @keyframes slideRight{from{opacity:0;transform:translateX(32px);}to{opacity:1;transform:translateX(0);}}
  @keyframes breathe{0%,100%{transform:scale(1);opacity:.8;}50%{transform:scale(1.08);opacity:1;}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
  @keyframes dot{0%,80%,100%{transform:scale(0);opacity:0;}40%{transform:scale(1);opacity:1;}}
  @keyframes shimmer{0%{opacity:.5;}50%{opacity:1;}100%{opacity:.5;}}
  .lift{transition:transform .18s,box-shadow .18s,background .15s;}
  .lift:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.12)!important;}
  input:focus,textarea:focus{border-color:#C49A3C!important;}
  ::-webkit-scrollbar{width:0;}
  textarea{resize:none;}
`;
document.head.appendChild(gs);

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const T = {
  cream:"#FAF6EF", sand:"#F2EBE0", linen:"#E5D9C9",
  taupe:"#B8A898", bark:"#7A6A5A", esp:"#2E1F14",
  sage:"#6B9E7A",  sageP:"#C8E0CE",
  gold:"#C49A3C",  goldP:"#F0E2B8",
  blush:"#D4826A", blushP:"#F2D4CA",
  sky:"#5E9AB8",   skyP:"#C4DCEA",
  teal:"#4A9E9E",  tealP:"#C4E8E8",
  lav:"#8B7EC8",   lavP:"#E0DCF5",
};
const FD = "'Cormorant Garamond','Georgia',serif";
const FB = "'DM Sans','Helvetica Neue',sans-serif";
const ESPGRAD = "linear-gradient(145deg,#2E1F14,#4a2e18)";
const AIGRAD  = "linear-gradient(135deg,#1a0e28,#2d1654,#0e1e28)";

// ═══════════════════════════════════════════════════════════════════
// ICON LIBRARY — all SVG, luxury minimal
// ═══════════════════════════════════════════════════════════════════
const Ic = {
  Star:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7H22l-6.2 4.5 2.4 7.2L12 17l-6.2 3.7 2.4-7.2L2 9h7.6L12 2z" stroke={p.c||T.gold} strokeWidth={p.w||1.4} strokeLinejoin="round"/></svg>,
  Home:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><path d="M9 22V12h6v10" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/></svg>,
  Sun:     p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke={p.c||T.gold} strokeWidth={p.w||1.5}/>{[0,45,90,135,180,225,270,315].map((a,i)=>{const r=a*Math.PI/180;return<line key={i} x1={12+6.5*Math.cos(r)} y1={12+6.5*Math.sin(r)} x2={12+9*Math.cos(r)} y2={12+9*Math.sin(r)} stroke={p.c||T.gold} strokeWidth={p.w||1.5} strokeLinecap="round"/>})}</svg>,
  Plan:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><line x1="3" y1="10" x2="21" y2="10" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><line x1="8" y1="3" x2="8" y2="7" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><line x1="16" y1="3" x2="16" y2="7" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><circle cx="8" cy="15" r="1.2" fill={p.c||T.esp}/><circle cx="12" cy="15" r="1.2" fill={p.c||T.esp}/><circle cx="16" cy="15" r="1.2" fill={p.c||T.esp} opacity=".35"/></svg>,
  Compass: p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M16 8l-2.5 6L8 16l2.5-6L16 8z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><circle cx="12" cy="12" r="1.5" fill={p.c||T.esp}/></svg>,
  Budget:  p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><line x1="3" y1="20" x2="21" y2="20" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><rect x="4" y="13" width="4" height="7" rx="1" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><rect x="10" y="9" width="4" height="11" rx="1" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><rect x="16" y="5" width="4" height="15" rx="1" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/></svg>,
  Hanger:  p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M12 4a2 2 0 012 2c0 1.5-2 2.5-2 4" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><path d="M12 10L4.5 16.5a2.5 2.5 0 002.5 3.5h10a2.5 2.5 0 002.5-3.5L12 10z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><circle cx="12" cy="4" r="1.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/></svg>,
  People:  p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M2 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><circle cx="17" cy="8" r="2.8" stroke={p.c||T.esp} strokeWidth={p.w||1.5} opacity=".5"/><path d="M17 14c2.5.5 5 2.2 5 5.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" opacity=".5"/></svg>,
  Leaf:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M12 22V12" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><path d="M12 12C9 12 5 10 5 5c4 0 7 3 7 7z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><path d="M12 12C15 12 19 10 19 5c-4 0-7 3-7 7z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/></svg>,
  Bell:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M6 10a6 6 0 0112 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><path d="M10 20a2 2 0 004 0" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/></svg>,
  Plus:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke={p.c||"#fff"} strokeWidth={p.w||2} strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke={p.c||"#fff"} strokeWidth={p.w||2} strokeLinecap="round"/></svg>,
  Arrow:   p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><line x1="12" y1="19" x2="12" y2="5" stroke={p.c||"#fff"} strokeWidth={p.w||2} strokeLinecap="round"/><polyline points="5,12 12,5 19,12" stroke={p.c||"#fff"} strokeWidth={p.w||2} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Send:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><line x1="12" y1="19" x2="12" y2="5" stroke={p.c||"#fff"} strokeWidth={p.w||2} strokeLinecap="round"/><polyline points="5,12 12,5 19,12" stroke={p.c||"#fff"} strokeWidth={p.w||2} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Check:   p=><svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke={p.c||"#fff"} strokeWidth={p.w||2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Back:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><line x1="19" y1="12" x2="5" y2="12" stroke={p.c||T.bark} strokeWidth={p.w||2} strokeLinecap="round"/><polyline points="12,19 5,12 12,5" stroke={p.c||T.bark} strokeWidth={p.w||2} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Heart:   p=><svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill={p.filled?p.c||T.blush:"none"}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={p.c||T.blush} strokeWidth={p.w||1.8} strokeLinejoin="round"/></svg>,
  Clock:   p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><polyline points="12,7 12,12 16,14" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Drop:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z" stroke={p.c||T.sky} strokeWidth={p.w||1.5} strokeLinejoin="round"/><path d="M8.5 16a3.5 3.5 0 003.5-3" stroke={p.c||T.sky} strokeWidth={p.w||1.5} strokeLinecap="round" opacity=".5"/></svg>,
  Bag:     p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M16 10a4 4 0 01-8 0" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/></svg>,
  Dumbbell:p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><path d="M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><rect x="6.5" y="9" width="11" height="6" rx="1.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><line x1="12" y1="6.5" x2="12" y2="17.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/></svg>,
  Suitcase:p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><rect x="2" y="8" width="20" height="13" rx="2.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M9 8V6a3 3 0 016 0v2" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><line x1="2" y1="13" x2="22" y2="13" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/></svg>,
  Kids:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="3" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M7 22v-5a5 5 0 0110 0v5" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><circle cx="5" cy="10" r="2" stroke={p.c||T.esp} strokeWidth={p.w||1.5} opacity=".45"/><circle cx="19" cy="10" r="2" stroke={p.c||T.esp} strokeWidth={p.w||1.5} opacity=".45"/></svg>,
  Fork:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M3 2v6a3 3 0 006 0V2" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><line x1="6" y1="8" x2="6" y2="22" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><path d="M20 2c0 0 1 4 1 7s-2 5-4 5v8" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Trend:   p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/><polyline points="17,6 23,6 23,12" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Flower:  p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={p.c||T.blush} strokeWidth={p.w||1.5}/><ellipse cx="12" cy="6.5" rx="2.5" ry="3.5" stroke={p.c||T.blush} strokeWidth={p.w||1.5}/><ellipse cx="12" cy="17.5" rx="2.5" ry="3.5" stroke={p.c||T.blush} strokeWidth={p.w||1.5}/><ellipse cx="6.5" cy="12" rx="3.5" ry="2.5" stroke={p.c||T.blush} strokeWidth={p.w||1.5}/><ellipse cx="17.5" cy="12" rx="3.5" ry="2.5" stroke={p.c||T.blush} strokeWidth={p.w||1.5}/></svg>,
  Moon:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={p.c||T.sky} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Bulb:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M9 21h6M12 3a6 6 0 00-3 11.2V17h6v-2.8A6 6 0 0012 3z" stroke={p.c||T.gold} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Refresh: p=><svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none"><polyline points="23,4 23,10 17,10" stroke={p.c||T.bark} strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" stroke={p.c||T.bark} strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Mail:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2.5" stroke={p.c||T.bark} strokeWidth={p.w||1.5}/><polyline points="2,4 12,13 22,4" stroke={p.c||T.bark} strokeWidth={p.w||1.5} strokeLinejoin="round"/></svg>,
  Lock:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2.5" stroke={p.c||T.bark} strokeWidth={p.w||1.5}/><path d="M7 11V7a5 5 0 0110 0v4" stroke={p.c||T.bark} strokeWidth={p.w||1.5} strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill={p.c||T.bark}/></svg>,
  Close:   p=><svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke={p.c||T.bark} strokeWidth={p.w||2} strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke={p.c||T.bark} strokeWidth={p.w||2} strokeLinecap="round"/></svg>,
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────
function Card({ch, sx={}}) {
  return <div className="lift" style={{background:"#fff",borderRadius:20,padding:"16px",
    boxShadow:"0 2px 14px rgba(30,20,10,.07)",border:`1px solid ${T.linen}`,marginBottom:12,...sx}}>{ch}</div>;
}
function H2({t, sub, light}) {
  return <div style={{marginBottom:14}}>
    <h2 style={{fontFamily:FD,fontWeight:600,fontSize:20,color:light?"#fff":T.esp,margin:0}}>{t}</h2>
    {sub&&<p style={{fontFamily:FB,fontSize:12,color:light?"rgba(255,255,255,.45)":T.taupe,margin:"3px 0 0"}}>{sub}</p>}
  </div>;
}
function Pill({ch, on, active}) {
  return <button onClick={on} style={{flexShrink:0,border:"none",cursor:"pointer",padding:"7px 14px",
    borderRadius:20,fontFamily:FB,fontSize:12,fontWeight:500,
    background:active?T.esp:T.sand,color:active?"#fff":T.bark,transition:"all .15s"}}>{ch}</button>;
}
function Tag({ch, c=T.bark}) {
  return <span style={{fontSize:10,fontFamily:FB,fontWeight:700,letterSpacing:1.1,textTransform:"uppercase",
    color:c,padding:"2px 8px",background:c+"18",borderRadius:20}}>{ch}</span>;
}
function AIBadge({t}) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,fontFamily:FB,fontSize:10,
    fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.gold,
    background:T.goldP,padding:"3px 10px",borderRadius:20}}>
    <Ic.Star s={10} c={T.gold} w={1.4}/> {t}
  </span>;
}
function Tile({ic:IC, c=T.bark, bg=T.sand, s=18, ts=36, r=11}) {
  return <div style={{width:ts,height:ts,borderRadius:r,background:bg,flexShrink:0,
    display:"flex",alignItems:"center",justifyContent:"center"}}><IC s={s} c={c} w={1.5}/></div>;
}
function Spinner() {
  return <div style={{width:18,height:18,border:"2.5px solid rgba(255,255,255,.25)",
    borderTop:"2.5px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>;
}
function Dots() {
  return <div style={{display:"flex",gap:4,padding:"4px 0"}}>
    {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,.4)",
      animation:`dot 1.2s ease-in-out ${i*.2}s infinite`}}/>)}
  </div>;
}
function FInput({label, placeholder, value, onChange, type="text", icon:IC}) {
  return <div style={{marginBottom:14}}>
    {label&&<label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,
      textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>{label}</label>}
    <div style={{position:"relative"}}>
      {IC&&<div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",display:"flex"}}><IC s={16} c={T.taupe} w={1.5}/></div>}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{width:"100%",fontFamily:FB,fontSize:14,padding:IC?"12px 14px 12px 42px":"12px 16px",
          borderRadius:14,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp,transition:"border-color .15s"}}/>
    </div>
  </div>;
}
function Btn({ch, on, sx={}, disabled=false, variant="primary"}) {
  const vs = {
    primary:{background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"},
    outline:{background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`},
    gold:{background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none"},
  };
  return <button onClick={on} disabled={disabled} className="lift"
    style={{width:"100%",padding:"15px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,
      cursor:disabled?"default":"pointer",display:"flex",alignItems:"center",
      justifyContent:"center",gap:8,opacity:disabled?.5:1,...vs[variant],...sx}}>{ch}</button>;
}
function ProgressDots({total, current}) {
  return <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:28}}>
    {Array.from({length:total},(_,i)=>(
      <div key={i} style={{height:4,borderRadius:4,transition:"all .3s",
        background:i===current?T.gold:i<current?T.sage:T.linen,width:i===current?24:8}}/>
    ))}
  </div>;
}

// ─── CLAUDE API ──────────────────────────────────────────────────
async function claude(sys, msg, hist=[]) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
      system:sys, messages:[...hist,{role:"user",content:msg}]})
  });
  const d = await res.json();
  return d.content?.map(b=>b.text||"").join("")||"";
}

// ═══════════════════════════════════════════════════════════════════
// ░░  ONBOARDING FLOW
// ═══════════════════════════════════════════════════════════════════

function SplashScreen({onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);
  return (
    <div style={{minHeight:"100vh",background:ESPGRAD,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-80,right:-80,width:300,height:300,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
      <div style={{position:"absolute",bottom:-100,left:-60,width:250,height:250,borderRadius:"50%",background:"rgba(107,158,122,.05)"}}/>
      <div style={{animation:"float 3s ease-in-out infinite",marginBottom:32}}>
        <div style={{width:90,height:90,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,
          display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 40px rgba(196,154,60,.4)`}}>
          <Ic.Star s={40} c="#fff" w={1.2}/>
        </div>
      </div>
      <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:48,color:"#fff",margin:"0 0 8px",fontWeight:400,textAlign:"center",animation:"fadeUp .6s ease both"}}>
        Her<strong style={{fontStyle:"normal",fontWeight:700}}>Nest</strong>
      </h1>
      <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",letterSpacing:3,textTransform:"uppercase",margin:"0 0 40px",animation:"fadeUp .6s .15s ease both"}}>
        Your world, beautifully organised
      </p>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",animation:"fadeUp .6s .3s ease both"}}>
        {["AI Mental Load","Trip Planning","Budget Coach","Style Stylist","Wellness"].map((f,i)=>(
          <span key={i} style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.5)",
            background:"rgba(255,255,255,.07)",borderRadius:20,padding:"5px 12px",border:"1px solid rgba(255,255,255,.08)"}}>{f}</span>
        ))}
      </div>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:"rgba(255,255,255,.1)"}}>
        <div style={{height:"100%",background:`linear-gradient(90deg,${T.gold},${T.sage})`,borderRadius:3,animation:"shimmer 2.8s ease"}}/>
      </div>
    </div>
  );
}

function LoginScreen({onLogin}) {
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [mode,setMode]=useState("login");
  const handle=()=>{if(!email||!pass)return;setLoading(true);setTimeout(()=>{setLoading(false);onLogin({email});},1200);};
  return (
    <div style={{minHeight:"100vh",background:ESPGRAD,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
      <div style={{padding:"60px 32px 40px",textAlign:"center",animation:"fadeUp .5s ease both"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,
          display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",
          boxShadow:`0 0 30px rgba(196,154,60,.35)`}}>
          <Ic.Star s={28} c="#fff" w={1.3}/>
        </div>
        <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:36,color:"#fff",margin:"0 0 6px",fontWeight:400}}>
          Her<strong style={{fontStyle:"normal",fontWeight:700}}>Nest</strong>
        </h1>
        <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.45)",margin:0}}>
          {mode==="login"?"Welcome back, lovely.":"Join thousands of super mums."}
        </p>
      </div>
      <div style={{flex:1,background:T.cream,borderRadius:"28px 28px 0 0",padding:"32px 24px 40px",animation:"fadeUp .5s .15s ease both"}}>
        <p style={{fontFamily:FB,fontSize:11,color:T.taupe,textAlign:"center",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Continue with</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
          {[{lb:"Google",bg:"#fff",br:T.linen,col:T.esp,logo:<svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>},
           {lb:"Apple",bg:"#000",br:"#000",col:"#fff",logo:<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>},
          ].map(b=>(
            <button key={b.lb} className="lift" onClick={()=>{setLoading(true);setTimeout(()=>{setLoading(false);onLogin({email:b.lb});},1200);}}
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",
                borderRadius:14,border:`1.5px solid ${b.br}`,background:b.bg,cursor:"pointer",
                fontFamily:FB,fontSize:13,fontWeight:600,color:b.col}}>
              {b.logo}{b.lb}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{flex:1,height:1,background:T.linen}}/><span style={{fontFamily:FB,fontSize:11,color:T.taupe,letterSpacing:1,textTransform:"uppercase"}}>or</span><div style={{flex:1,height:1,background:T.linen}}/>
        </div>
        <FInput label="Email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} type="email" icon={Ic.Mail}/>
        <FInput label="Password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} type="password" icon={Ic.Lock}/>
        {mode==="login"&&<p style={{fontFamily:FB,fontSize:12,color:T.gold,textAlign:"right",marginBottom:20,marginTop:-6,cursor:"pointer"}}>Forgot password?</p>}
        <Btn ch={loading?<Spinner/>:mode==="login"?"Sign In":"Create Account"} on={handle} disabled={!email||!pass||loading}/>
        <p style={{fontFamily:FB,fontSize:13,color:T.bark,textAlign:"center",marginTop:20}}>
          {mode==="login"?"New to HerNest? ":"Already have an account? "}
          <span onClick={()=>setMode(mode==="login"?"signup":"login")} style={{color:T.gold,fontWeight:700,cursor:"pointer"}}>
            {mode==="login"?"Create account":"Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

function Step1({data,onChange,onNext}) {
  const avatars=["👩","👩🏻","👩🏼","👩🏽","👩🏾","👩🏿"];
  return (
    <div style={{animation:"slideRight .4s ease both"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:48,marginBottom:12,animation:"float 3s ease-in-out infinite"}}>{data.avatar||"👩"}</div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Nice to meet you</h2>
        <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Let's personalise Nora for your life</p>
      </div>
      <div style={{marginBottom:18}}>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Choose your avatar</label>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          {avatars.map(a=>(
            <button key={a} onClick={()=>onChange("avatar",a)} style={{fontSize:26,background:data.avatar===a?T.goldP:"transparent",border:`2px solid ${data.avatar===a?T.gold:T.linen}`,borderRadius:12,padding:"7px",cursor:"pointer",transition:"all .15s"}}>{a}</button>
          ))}
        </div>
      </div>
      <FInput label="Your first name" placeholder="e.g. Sarah" value={data.name} onChange={e=>onChange("name",e.target.value)}/>
      <FInput label="Your city" placeholder="e.g. Melbourne" value={data.city} onChange={e=>onChange("city",e.target.value)}/>
      <div style={{marginBottom:18}}>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Your role</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {["Working Mum","Stay-at-Home Mum","Entrepreneur","Executive","Other"].map(r=>(
            <button key={r} onClick={()=>onChange("role",r)} style={{padding:"8px 14px",borderRadius:20,
              border:`1.5px solid ${data.role===r?T.gold:T.linen}`,background:data.role===r?T.goldP:"#fff",
              fontFamily:FB,fontSize:12,color:data.role===r?T.esp:T.bark,cursor:"pointer",transition:"all .15s"}}>{r}</button>
          ))}
        </div>
      </div>
      <Btn ch={<>Continue <Ic.Arrow s={18} c="#fff" w={2}/></>} on={onNext} disabled={!data.name||!data.role}/>
    </div>
  );
}

function Step2({data,onChange,onNext,onBack}) {
  const [kn,setKn]=useState(""); const [ka,setKa]=useState("");
  const addKid=()=>{if(!kn.trim())return;onChange("kids",[...(data.kids||[]),{name:kn,age:ka}]);setKn("");setKa("");};
  const removeKid=i=>onChange("kids",(data.kids||[]).filter((_,idx)=>idx!==i));
  return (
    <div style={{animation:"slideRight .4s ease both"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Ic.People s={44} c={T.esp} w={1.2}/></div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your family</h2>
        <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Tell Nora about the people you love most</p>
      </div>
      <FInput label="Partner's name (optional)" placeholder="e.g. James" value={data.partner||""} onChange={e=>onChange("partner",e.target.value)}/>
      <div style={{marginBottom:18}}>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Your children</label>
        {(data.kids||[]).map((k,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.sageP,borderRadius:12,padding:"10px 14px",marginBottom:8,border:`1px solid ${T.sage}30`}}>
            <span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp,flex:1}}>{k.name}{k.age?`, ${k.age}`:""}</span>
            <button onClick={()=>removeKid(i)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button>
          </div>
        ))}
        <div style={{display:"flex",gap:8}}>
          <input placeholder="Name" value={kn} onChange={e=>setKn(e.target.value)} style={{flex:2,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
          <input placeholder="Age" value={ka} onChange={e=>setKa(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
          <button onClick={addKid} style={{background:T.esp,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button>
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn ch={<><Ic.Back s={18} c={T.bark} w={2}/> Back</>} on={onBack} variant="outline" sx={{flex:1}}/>
        <Btn ch={<>Continue <Ic.Arrow s={18} c="#fff" w={2}/></>} on={onNext} sx={{flex:2}}/>
      </div>
    </div>
  );
}

function Step3({data,onChange,onNext,onBack}) {
  const pList=[{id:"family",lb:"Family",IC:Ic.People,c:T.sage},{id:"career",lb:"Career",IC:Ic.Budget,c:T.sky},{id:"fitness",lb:"Fitness",IC:Ic.Leaf,c:T.blush},{id:"travel",lb:"Travel",IC:Ic.Compass,c:T.teal},{id:"finances",lb:"Finances",IC:Ic.Budget,c:T.gold},{id:"selfcare",lb:"Self-care",IC:Ic.Flower,c:T.lav}];
  const toggle=id=>{const c=data.priorities||[];onChange("priorities",c.includes(id)?c.filter(p=>p!==id):c.length<3?[...c,id]:c);};
  return (
    <div style={{animation:"slideRight .4s ease both"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Ic.Star s={44} c={T.gold} w={1.2}/></div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your priorities</h2>
        <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Pick up to 3 — Nora will focus on these</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        {pList.map(p=>{const active=(data.priorities||[]).includes(p.id);return(
          <button key={p.id} onClick={()=>toggle(p.id)} style={{padding:"16px 14px",borderRadius:18,cursor:"pointer",textAlign:"left",background:active?`${p.c}18`:"#fff",border:`2px solid ${active?p.c:T.linen}`,transition:"all .18s"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <p.IC s={20} c={active?p.c:T.taupe} w={1.5}/>
              {active&&<div style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",background:p.c,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Check s={11} c="#fff" w={2.5}/></div>}
            </div>
            <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:active?T.esp:T.bark}}>{p.lb}</div>
          </button>
        );})}
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn ch={<><Ic.Back s={18} c={T.bark} w={2}/> Back</>} on={onBack} variant="outline" sx={{flex:1}}/>
        <Btn ch={<>Continue <Ic.Arrow s={18} c="#fff" w={2}/></>} on={onNext} disabled={!(data.priorities||[]).length} sx={{flex:2}}/>
      </div>
    </div>
  );
}

function Step4({data,onChange,onFinish,onBack}) {
  return (
    <div style={{animation:"slideRight .4s ease both"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Ic.Compass s={44} c={T.teal} w={1.2}/></div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your goals</h2>
        <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Nora will help you get there</p>
      </div>
      <FInput label="Next trip destination" placeholder="e.g. Bali, Indonesia" value={data.tripGoal||""} onChange={e=>onChange("tripGoal",e.target.value)}/>
      <FInput label="Fitness goal" placeholder="e.g. Work out 4x per week" value={data.fitnessGoal||""} onChange={e=>onChange("fitnessGoal",e.target.value)}/>
      <FInput label="Savings goal" placeholder="e.g. $10,000 vacation fund" value={data.savingsGoal||""} onChange={e=>onChange("savingsGoal",e.target.value)}/>
      <div style={{marginBottom:18}}>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Biggest challenge right now</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {["Mental load","Work-life balance","Staying fit","Budget management","Finding me-time"].map(c=>(
            <button key={c} onClick={()=>onChange("challenge",c)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.challenge===c?T.gold:T.linen}`,background:data.challenge===c?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:data.challenge===c?T.esp:T.bark,cursor:"pointer",transition:"all .15s"}}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn ch={<><Ic.Back s={18} c={T.bark} w={2}/> Back</>} on={onBack} variant="outline" sx={{flex:1}}/>
        <Btn ch="Meet Nora ✨" on={onFinish} variant="gold" sx={{flex:2}}/>
      </div>
    </div>
  );
}

function NoraIntro({profile,onEnter}) {
  const [vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),400);},[]);
  const msgs=[
    `I know you're ${profile.role?`a ${profile.role}`:"a super mum"}${profile.city?` in ${profile.city}`:""}. 👋`,
    profile.kids?.length?`I'll keep track of ${profile.kids.map(k=>k.name).join(" and ")} for you. 💛`:"I'll help you manage family life beautifully.",
    profile.priorities?.length?`Your focus areas are ${profile.priorities.slice(0,2).join(" and ")}. I've got you.`:"I'll adapt to your priorities every day.",
    profile.tripGoal?`I'll help you plan ${profile.tripGoal} ✈️`:"I'll help plan your next adventure.",
  ];
  return (
    <div style={{minHeight:"100vh",background:AIGRAD,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 28px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
      {vis&&<>
        <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24,boxShadow:`0 0 40px rgba(196,154,60,.5)`,animation:"breathe 3s ease-in-out infinite"}}>
          <Ic.Star s={36} c="#fff" w={1.2}/>
        </div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:30,color:"#fff",margin:"0 0 6px",textAlign:"center",animation:"fadeUp .5s ease both"}}>Hi {profile.name||"lovely"}, I'm Nora</h2>
        <p style={{fontFamily:FB,fontSize:14,color:"rgba(255,255,255,.5)",margin:"0 0 28px",textAlign:"center",animation:"fadeUp .5s .1s ease both"}}>Your personal AI, ready to go</p>
        <div style={{width:"100%",maxWidth:360}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:"rgba(255,255,255,.07)",borderRadius:14,padding:"12px 16px",marginBottom:10,border:"1px solid rgba(255,255,255,.08)",animation:`fadeUp .4s ${.2+i*.12}s ease both`}}>
              <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Check s={12} c="#fff" w={2.5}/></div>
              <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.8)",margin:0,lineHeight:1.6}}>{m}</p>
            </div>
          ))}
        </div>
        <div style={{width:"100%",maxWidth:360,marginTop:24,animation:"fadeUp .5s .7s ease both"}}>
          <button onClick={onEnter} className="lift" style={{width:"100%",padding:"16px",borderRadius:18,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${T.gold},#8B6914)`,fontFamily:FB,fontSize:15,fontWeight:700,color:"#fff",boxShadow:`0 8px 32px rgba(196,154,60,.4)`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            Enter HerNest <Ic.Arrow s={20} c="#fff" w={2}/>
          </button>
        </div>
      </>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ░░  MAIN APP TABS
// ═══════════════════════════════════════════════════════════════════

const TABS=[
  {id:"home",    lb:"Home",   IC:Ic.Home},
  {id:"brief",   lb:"Morning",IC:Ic.Sun,  ai:true},
  {id:"nora",    lb:"Nora",   IC:Ic.Star, ai:true},
  {id:"plan",    lb:"Plan",   IC:Ic.Plan},
  {id:"trips",   lb:"Trips",  IC:Ic.Compass},
  {id:"budget",  lb:"Budget", IC:Ic.Budget},
  {id:"style",   lb:"Style",  IC:Ic.Hanger},
  {id:"circle",  lb:"Circle", IC:Ic.People},
  {id:"wellness",lb:"Thrive", IC:Ic.Leaf},
];

const FEATS=[
  {id:"brief",   lb:"Daily Briefing", sub:"Morning intelligence",   bg:"linear-gradient(135deg,#2d1a00,#5a3a10)",  IC:Ic.Sun,     ic:"#F0E2B8"},
  {id:"nora",    lb:"Nora AI",        sub:"Mental load manager",    bg:AIGRAD,                                      IC:Ic.Star,    ic:"#C49A3C"},
  {id:"trips",   lb:"Trip Planner",   sub:"Full itinerary builder", bg:"linear-gradient(135deg,#0e2a1e,#1a5a3a)",  IC:Ic.Compass, ic:"#C8E0CE"},
  {id:"budget",  lb:"Budget Coach",   sub:"CFO-level insights",     bg:"linear-gradient(135deg,#1a1400,#3a2e00)",  IC:Ic.Budget,  ic:"#F0E2B8"},
  {id:"style",   lb:"Style Stylist",  sub:"AI outfit curator",      bg:"linear-gradient(135deg,#2d1428,#4a1a3a)",  IC:Ic.Hanger,  ic:"#F2D4CA"},
  {id:"circle",  lb:"Circle AI",      sub:"Find your people",       bg:"linear-gradient(135deg,#0e2028,#1a3a2e)",  IC:Ic.People,  ic:"#C4DCEA"},
  {id:"wellness",lb:"Wellness",       sub:"Adapted for you",        bg:"linear-gradient(135deg,#0e2218,#1a4a2e)",  IC:Ic.Leaf,    ic:"#C8E0CE"},
];

// ── HOME ─────────────────────────────────────────────────────────
function HomeScreen({go, aiTasks, profile}) {
  const [water,setWater]=useState(3);
  const [mood,setMood]=useState(null);
  const moods=[{IC:Ic.Moon,c:T.blush,msg:"Sending you a big hug today."},{IC:Ic.Leaf,c:T.taupe,msg:"One step at a time."},{IC:Ic.Sun,c:T.gold,msg:"Good energy — keep it going!"},{IC:Ic.Flower,c:T.sage,msg:"Love that for you!"},{IC:Ic.Star,c:T.teal,msg:"You are absolutely glowing!"}];
  const hour=new Date().getHours();
  const greet=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  return (
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{background:ESPGRAD,borderRadius:24,padding:"24px 22px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,.03)"}}/>
        <p style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.35)",letterSpacing:3,textTransform:"uppercase",margin:0}}>{greet}</p>
        <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:32,color:"#fff",margin:"4px 0 2px",fontWeight:400}}>
          {profile?.name ? `${profile.name}'s` : "Her"}<strong style={{fontStyle:"normal",fontWeight:700}}>Nest</strong>
          <span style={{fontSize:11,color:T.gold,fontFamily:FB,fontStyle:"normal",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginLeft:10}}>AI</span>
        </h1>
        <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.35)",margin:0}}>Your world in one place</p>
        <div style={{marginTop:14,borderLeft:`3px solid ${T.gold}`,paddingLeft:14}}>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:13,color:"rgba(255,255,255,.7)",margin:0,lineHeight:1.65}}>"7 AI features. One beautiful app. Built for you."</p>
        </div>
      </div>
      <H2 t="Your AI Suite" sub="Powered by Nora"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {FEATS.map(f=>(
          <div key={f.id} onClick={()=>go(f.id)} className="lift" style={{background:f.bg,borderRadius:20,padding:"18px 16px",cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,.18)"}}>
            <div style={{position:"absolute",bottom:-20,right:-20,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
            <div style={{width:40,height:40,borderRadius:13,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,border:"1px solid rgba(255,255,255,.08)"}}>
              <f.IC s={20} c={f.ic} w={1.4}/>
            </div>
            <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>{f.lb}</div>
            <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.38)",marginTop:3}}>{f.sub}</div>
            {f.id==="nora"&&<div style={{position:"absolute",top:12,right:12,width:7,height:7,borderRadius:"50%",background:T.gold,animation:"breathe 2s ease-in-out infinite",boxShadow:`0 0 8px ${T.gold}`}}/>}
          </div>
        ))}
      </div>
      {aiTasks.length>0&&<Card sx={{borderLeft:`4px solid ${T.gold}`}} ch={
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>Nora organised</span>
            <AIBadge t={`${aiTasks.length} tasks`}/>
          </div>
          {aiTasks.slice(0,3).map((tk,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<2?`1px solid ${T.linen}`:"none"}}>
              <Tile ic={tk.tag==="Work"?Ic.Bag:tk.tag==="Me"?Ic.Leaf:Ic.Plan} c={tk.tag==="Work"?T.sky:tk.tag==="Me"?T.blush:T.sage} bg={tk.tag==="Work"?T.skyP:tk.tag==="Me"?T.blushP:T.sageP} s={15} ts={30} r={9}/>
              <span style={{fontFamily:FB,fontSize:13,color:T.esp,flex:1}}>{tk.text}</span>
              <Tag ch={tk.tag} c={tk.tag==="Work"?T.sky:tk.tag==="Me"?T.blush:T.sage}/>
            </div>
          ))}
        </div>
      }/>}
      <Card ch={
        <div>
          <p style={{fontFamily:FD,fontSize:16,fontWeight:600,color:T.esp,margin:"0 0 14px"}}>How are you today?</p>
          <div style={{display:"flex",gap:8}}>
            {moods.map((m,i)=>(
              <button key={i} onClick={()=>setMood(i)} style={{flex:1,border:`2px solid ${mood===i?m.c:T.linen}`,background:mood===i?m.c+"18":T.cream,borderRadius:13,padding:"10px 0",cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <m.IC s={18} c={mood===i?m.c:T.taupe} w={1.5}/>
              </button>
            ))}
          </div>
          {mood!==null&&<p style={{fontFamily:FB,fontSize:12,color:T.bark,margin:"10px 0 0",textAlign:"center",fontStyle:"italic"}}>{moods[mood].msg}</p>}
        </div>
      }/>
      <Card ch={
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Ic.Drop s={18} c={T.sky} w={1.5}/><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>Hydration</span></div>
            <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>{water}/8</span>
          </div>
          <div style={{display:"flex",gap:5}}>
            {Array.from({length:8},(_,i)=>(
              <div key={i} onClick={()=>setWater(i<water?i:i+1)} style={{flex:1,height:28,borderRadius:8,cursor:"pointer",background:i<water?T.sky:T.skyP,transition:"background .15s"}}/>
            ))}
          </div>
        </div>
      }/>
    </div>
  );
}

// ── BRIEFING ─────────────────────────────────────────────────────
function BriefingScreen({profile}) {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const gen=async()=>{
    setLoading(true);
    const sys=`You are Nora inside HerNest. Return ONLY valid JSON no markdown:
{"greeting":"","date":"","weatherNote":"","priorities":[{"text":"","tag":"Work|Family|Me|Home"}],"reminders":[],"budgetNote":"","tripNote":"","affirmation":""}
3 priorities, 3 reminders.`;
    try{const raw=await claude(sys,`Morning briefing for ${profile?.name||"Sarah"}, ${profile?.role||"CFO"}, ${profile?.kids?.length?`kids: ${profile.kids.map(k=>k.name).join(",")}`:""}, trip: ${profile?.tripGoal||"Bali in 47 days"}`);setData(JSON.parse(raw.replace(/```json|```/g,"").trim()));}
    catch(e){setData({greeting:`Good morning${profile?.name?`, ${profile.name}`:""}!`,date:"Today",weatherNote:"24°C and sunny — great day for a morning run",priorities:[{text:"CFO board deck — block 2hrs at 9am",tag:"Work"},{text:"School run 8:15am",tag:"Family"},{text:"Pilates 6:30am",tag:"Me"}],reminders:["Mia's recital Friday — keep Thursday free","Bali travel insurance not booked yet","Grocery order expires tonight"],budgetNote:"4% under budget this month. Well done!",tripNote:"Bali in 47 days — insurance is the only blocker",affirmation:"You carry so much, so gracefully. Today, you've already won."});}
    setLoading(false);
  };
  useEffect(()=>{gen();},[]);
  const tC=t=>t==="Work"?T.sky:t==="Family"?T.sage:t==="Me"?T.blush:T.gold;
  const tIC=t=>t==="Work"?Ic.Bag:t==="Family"?Ic.Kids:t==="Me"?Ic.Leaf:Ic.Home;
  if(loading)return<div style={{textAlign:"center",padding:"50px 20px",animation:"fadeUp .4s ease both"}}><div style={{width:54,height:54,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",animation:"breathe 2s ease-in-out infinite"}}><Ic.Sun s={26} c="#fff" w={1.4}/></div><p style={{fontFamily:FD,fontStyle:"italic",fontSize:17,color:T.esp}}>Preparing your morning…</p></div>;
  if(!data)return null;
  return(
    <div style={{animation:"fadeUp .5s ease both"}}>
      <div style={{background:AIGRAD,borderRadius:24,padding:"24px 22px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
        <AIBadge t="Morning Briefing"/>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:24,color:"#fff",margin:"10px 0 4px",fontWeight:400}}>{data.greeting}</h2>
        <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",margin:0}}>{data.date}</p>
        <div style={{marginTop:14,background:"rgba(255,255,255,.07)",borderRadius:13,padding:"12px 14px",borderLeft:`3px solid ${T.gold}`,display:"flex",alignItems:"center",gap:10}}>
          <Ic.Sun s={18} c={T.goldP} w={1.4}/>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.75)",margin:0,lineHeight:1.6}}>{data.weatherNote}</p>
        </div>
      </div>
      <Card ch={<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><H2 t="Today's Priorities"/><AIBadge t="AI"/></div>{data.priorities.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:T.sand,borderRadius:12,marginBottom:8}}><Tile ic={tIC(p.tag)} c={tC(p.tag)} bg={tC(p.tag)+"18"} s={16} ts={32} r={9}/><span style={{fontFamily:FB,fontSize:13,color:T.esp,flex:1}}>{p.text}</span><Tag ch={p.tag} c={tC(p.tag)}/></div>))}</div>}/>
      <Card ch={<div><H2 t="Don't Forget"/>{data.reminders.map((r,i)=>(<div key={i} style={{display:"flex",gap:12,padding:"9px 0",alignItems:"center",borderBottom:i<data.reminders.length-1?`1px solid ${T.linen}`:"none"}}><Tile ic={Ic.Clock} c={T.gold} bg={T.goldP} s={14} ts={28} r={8}/><span style={{fontFamily:FB,fontSize:13,color:T.bark,lineHeight:1.5}}>{r}</span></div>))}</div>}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{lb:"Budget",note:data.budgetNote,c:T.gold,bg:T.goldP,IC:Ic.Budget},{lb:"Next Trip",note:data.tripNote,c:T.sky,bg:T.skyP,IC:Ic.Suitcase}].map(b=>(
          <div key={b.lb} style={{background:b.bg,borderRadius:16,padding:"14px",border:`1px solid ${b.c}25`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><b.IC s={14} c={b.c} w={1.5}/><span style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:b.c}}>{b.lb}</span></div>
            <p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,lineHeight:1.5}}>{b.note}</p>
          </div>
        ))}
      </div>
      <div style={{background:`linear-gradient(135deg,${T.blushP},${T.goldP})`,borderRadius:18,padding:"18px 20px",textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Ic.Flower s={28} c={T.blush} w={1.3}/></div>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:0,lineHeight:1.7}}>"{data.affirmation}"</p>
      </div>
      <button onClick={gen} style={{width:"100%",marginTop:12,background:"none",border:`1.5px solid ${T.linen}`,borderRadius:13,padding:"10px",fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <Ic.Refresh s={15} c={T.bark} w={1.8}/> Refresh briefing
      </button>
    </div>
  );
}

// ── NORA CHAT ────────────────────────────────────────────────────
function NoraScreen({onTasks,profile}) {
  const [msgs,setMsgs]=useState([{role:"assistant",content:`Hello${profile?.name?`, ${profile.name}`:", lovely"}. I'm Nora, your AI Mental Load Manager.\n\nTalk to me naturally — tell me what's on your mind and I'll organise everything for you.`,parsed:null}]);
  const [inp,setInp]=useState("");
  const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  const SUGG=["Mia has a recital Friday, we fly to Bali in 47 days, board meeting Monday","I'm exhausted, haven't worked out, groceries are low","Plan my week — work Mon-Fri, kids swimming Wed, date night Sat"];
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);
  const send=async()=>{
    if(!inp.trim()||loading)return;
    const msg=inp.trim();setInp("");setLoading(true);
    const sys=`You are Nora, warm AI Mental Load Manager. Respond with 2-3 empathetic sentences, then: <ND>{"tasks":[{"text":"","tag":"Work|Family|Me|Home|Travel","priority":"high|medium|low"}],"reminders":[{"text":""}],"insight":""}</ND> Min 2 tasks.`;
    const hist=msgs.map(m=>({role:m.role,content:m.content}));
    try{
      const raw=await claude(sys,msg,hist);
      const match=raw.match(/<ND>([\s\S]*?)<\/ND>/);
      let parsed=null;if(match){try{parsed=JSON.parse(match[1].trim());}catch(e){}}
      const display=raw.replace(/<ND>[\s\S]*?<\/ND>/g,"").trim();
      setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:display,parsed}]);
      if(parsed&&onTasks)onTasks(parsed);
    }catch(e){setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:"I'm here with you. Try again in a moment.",parsed:null}]);}
    setLoading(false);
  };
  const tC=t=>t==="Work"?T.sky:t==="Me"?T.blush:t==="Travel"?T.teal:T.sage;
  const tIC=t=>t==="Work"?Ic.Bag:t==="Me"?Ic.Leaf:t==="Travel"?Ic.Suitcase:Ic.Plan;
  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",animation:"fadeUp .4s ease both"}}>
      <div style={{background:AIGRAD,borderRadius:22,padding:"18px 20px",marginBottom:12,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",animation:"breathe 3s ease-in-out infinite",boxShadow:`0 0 20px rgba(196,154,60,.4)`}}>
            <Ic.Star s={22} c="#fff" w={1.3}/>
          </div>
          <div>
            <h2 style={{fontFamily:FD,fontSize:20,fontWeight:600,color:"#fff",margin:0,fontStyle:"italic"}}>Nora AI</h2>
            <p style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.4)",margin:0,letterSpacing:1.5,textTransform:"uppercase"}}>Mental Load Manager</p>
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",paddingBottom:8}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12,animation:"fadeUp .3s ease both"}}>
            {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,marginRight:8,background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",alignSelf:"flex-end"}}><Ic.Star s={13} c="#fff" w={1.5}/></div>}
            <div style={{maxWidth:"82%",background:m.role==="user"?`linear-gradient(135deg,${T.esp},#4a3020)`:"#fff",borderRadius:m.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px",padding:"12px 16px",boxShadow:"0 2px 12px rgba(0,0,0,.08)",border:m.role==="assistant"?`1px solid ${T.linen}`:"none"}}>
              <div style={{color:m.role==="user"?"rgba(255,255,255,.9)":T.esp}}>
                {m.content.split("\n").filter(l=>l.trim()).map((line,j)=>(
                  <p key={j} style={{margin:"0 0 5px",lineHeight:1.65,fontSize:13,fontFamily:FB}}>{line}</p>
                ))}
              </div>
              {m.parsed&&<div style={{marginTop:12,borderTop:`1px solid ${T.linen}`,paddingTop:10}}>
                <AIBadge t="Organised for you"/>
                <div style={{marginTop:10}}>
                  {m.parsed.tasks?.slice(0,4).map((tk,k)=>(
                    <div key={k} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:T.sand,borderRadius:10,marginBottom:6}}>
                      <Tile ic={tIC(tk.tag)} c={tC(tk.tag)} bg={tC(tk.tag)+"18"} s={14} ts={28} r={8}/>
                      <span style={{fontFamily:FB,fontSize:12,color:T.esp,flex:1}}>{tk.text}</span>
                      <Tag ch={tk.tag} c={tC(tk.tag)}/>
                    </div>
                  ))}
                  {m.parsed.insight&&<div style={{padding:"10px",background:T.blushP,borderRadius:12,marginTop:6}}><p style={{fontFamily:FD,fontStyle:"italic",fontSize:13,color:T.esp,margin:0,lineHeight:1.6}}>"{m.parsed.insight}"</p></div>}
                </div>
              </div>}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:12}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Star s={13} c="#fff" w={1.5}/></div>
          <div style={{background:"#fff",borderRadius:"20px 20px 20px 4px",padding:"14px 18px",border:`1px solid ${T.linen}`}}><Dots/></div>
        </div>}
        <div ref={ref}/>
      </div>
      {msgs.length<2&&<div style={{flexShrink:0,marginBottom:8}}>{SUGG.map((s,i)=><div key={i} onClick={()=>setInp(s)} style={{background:"#fff",border:`1px solid ${T.linen}`,borderRadius:12,padding:"9px 14px",marginBottom:6,cursor:"pointer",fontFamily:FB,fontSize:12,color:T.bark,lineHeight:1.5}}>{s}</div>)}</div>}
      <div style={{flexShrink:0,display:"flex",gap:8,paddingTop:8,borderTop:`1px solid ${T.linen}`}}>
        <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Tell me what's on your mind…" rows={2}
          style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:16,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp,lineHeight:1.5}}/>
        <button onClick={send} disabled={!inp.trim()||loading} style={{width:46,height:46,borderRadius:14,border:"none",flexShrink:0,background:inp.trim()&&!loading?`linear-gradient(135deg,${T.esp},#4a3020)`:T.linen,cursor:inp.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:"flex-end"}}>
          {loading?<Spinner/>:<Ic.Send s={18} c={inp.trim()?"#fff":T.taupe} w={2}/>}
        </button>
      </div>
    </div>
  );
}

// ── PLAN ─────────────────────────────────────────────────────────
function PlanScreen({aiTasks}) {
  const base=[{id:1,text:"CFO board prep deck",done:false,tag:"Work"},{id:2,text:"School run — 8:15am",done:true,tag:"Family"},{id:3,text:"Pilates 6:30am",done:true,tag:"Me"},{id:4,text:"Grocery order",done:false,tag:"Home"}];
  const [tasks,setTasks]=useState(base);
  const [inp,setInp]=useState("");
  const [filter,setFilter]=useState("All");
  const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today=new Date();
  useEffect(()=>{setTasks(prev=>{const ex=prev.map(t=>t.text);const nw=(aiTasks||[]).filter(t=>!ex.includes(t.text)).map((t,i)=>({id:Date.now()+i,...t,done:false}));return [...prev,...nw];});},[aiTasks]);
  const toggle=id=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));
  const add=()=>{if(!inp.trim())return;setTasks(p=>[...p,{id:Date.now(),text:inp,done:false,tag:"Home"}]);setInp("");};
  const visible=filter==="All"?tasks:tasks.filter(t=>t.tag===filter);
  const tC=t=>t==="Work"?T.sky:t==="Family"?T.sage:t==="Me"?T.blush:t==="Travel"?T.teal:T.gold;
  const tIC=t=>t==="Work"?Ic.Bag:t==="Family"?Ic.Kids:t==="Me"?Ic.Leaf:t==="Travel"?Ic.Suitcase:Ic.Home;
  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><Ic.Plan s={24} c={T.esp} w={1.5}/><H2 t="Command Centre" sub="Family life, beautifully organised"/></div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>
        {Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-today.getDay()+i);const isT=d.toDateString()===today.toDateString();return(
          <div key={i} style={{flexShrink:0,width:44,borderRadius:13,padding:"8px 0",textAlign:"center",background:isT?T.esp:T.sand,border:isT?"none":`1px solid ${T.linen}`}}>
            <div style={{fontFamily:FB,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:isT?T.gold:T.bark}}>{DAYS[i]}</div>
            <div style={{fontFamily:FD,fontSize:18,fontWeight:600,color:isT?"#fff":T.esp,marginTop:2}}>{d.getDate()}</div>
          </div>
        );})}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Add a task…"
          style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
        <button onClick={add} style={{background:T.esp,border:"none",borderRadius:13,padding:"0 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={20} c="#fff" w={2}/></button>
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12}}>
        {["All","Family","Work","Me","Home","Travel"].map(t=><Pill key={t} ch={t} active={filter===t} on={()=>setFilter(t)}/>)}
      </div>
      {visible.map(t=>{const tc=tC(t.tag);const TIC=tIC(t.tag);return(
        <div key={t.id} onClick={()=>toggle(t.id)} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:13,padding:"12px 14px",marginBottom:8,cursor:"pointer",border:`1.5px solid ${t.done?T.sageP:T.linen}`,transition:"border-color .2s"}}>
          <Tile ic={TIC} c={tc} bg={tc+"18"} s={16} ts={34} r={10}/>
          <div style={{flex:1,fontFamily:FB,fontSize:13,color:t.done?T.taupe:T.esp,textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
          <Tag ch={t.tag} c={tc}/>
          <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:t.done?T.sage:T.linen,display:"flex",alignItems:"center",justifyContent:"center"}}>{t.done&&<Ic.Check s={12} c="#fff" w={2.5}/>}</div>
        </div>
      );})}
    </div>
  );
}

// ── BUDGET ───────────────────────────────────────────────────────
function BudgetScreen() {
  const [inp,setInp]=useState(""); const [hist,setHist]=useState([]); const [loading,setLoading]=useState(false);
  const cats=[{lb:"Groceries",spent:620,budget:700,IC:Ic.Bag,c:T.sage},{lb:"Kids",spent:380,budget:400,IC:Ic.Kids,c:T.sky},{lb:"Fitness",spent:95,budget:120,IC:Ic.Dumbbell,c:T.blush},{lb:"Travel",spent:2100,budget:6400,IC:Ic.Suitcase,c:T.teal},{lb:"Shopping",spent:340,budget:500,IC:Ic.Hanger,c:T.lav},{lb:"Dining",spent:215,budget:300,IC:Ic.Fork,c:T.gold}];
  const cards=[{lb:"Family Budget",val:"$11,400",trend:"+4%",up:true,c:T.gold,bg:T.goldP,IC:Ic.Budget},{lb:"Savings",val:"72%",trend:"On Track",up:true,c:T.sage,bg:T.sageP,IC:Ic.Trend},{lb:"Investments",val:"$84.2k",trend:"+12%",up:true,c:T.sky,bg:T.skyP,IC:Ic.Trend},{lb:"Vacation Fund",val:"$3,200",trend:"$800 left",up:false,c:T.blush,bg:T.blushP,IC:Ic.Suitcase}];
  const ask=async()=>{if(!inp.trim()||loading)return;const msg=inp.trim();setInp("");setLoading(true);const h=hist.map(m=>({role:m.role,content:m.content}));try{const raw=await claude("You are Nora, CFO-level budget coach. Answer with empathy, 3-4 sentences max.",msg,h);setHist(p=>[...p,{role:"user",content:msg},{role:"assistant",content:raw}]);}catch(e){setHist(p=>[...p,{role:"user",content:msg},{role:"assistant",content:"I'm here to help. Try again in a moment."}]);}setLoading(false);};
  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{background:"linear-gradient(135deg,#1a1400,#3a2e00)",borderRadius:22,padding:"20px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div style={{width:42,height:42,borderRadius:13,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,.08)"}}><Ic.Budget s={22} c={T.goldP} w={1.4}/></div>
          <div><AIBadge t="Budget Coach"/><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:20,color:"#fff",margin:"4px 0 0"}}>Your Financial Pulse</h2></div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {cards.map(c=>(
          <div key={c.lb} className="lift" style={{background:c.bg,borderRadius:16,padding:"15px 13px",border:`1px solid ${c.c}22`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}><c.IC s={15} c={c.c} w={1.5}/><span style={{fontFamily:FB,fontSize:10,color:c.c,fontWeight:700,letterSpacing:1.1,textTransform:"uppercase"}}>{c.lb}</span></div>
            <div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:T.esp,marginBottom:2}}>{c.val}</div>
            <div style={{fontFamily:FB,fontSize:11,color:c.up?T.sage:T.blush}}>{c.up?"↑":"→"} {c.trend}</div>
          </div>
        ))}
      </div>
      <H2 t="Category Breakdown" sub="April spending"/>
      {cats.map(s=>{const pct=Math.round((s.spent/s.budget)*100);return(
        <div key={s.lb} style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <Tile ic={s.IC} c={s.c} bg={s.c+"18"} s={16} ts={32} r={9}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontFamily:FB,fontSize:13,color:T.esp,fontWeight:700}}>{s.lb}</span><span style={{fontFamily:FB,fontSize:12,color:T.bark}}>${s.spent}/${s.budget}</span></div>
              <div style={{background:T.linen,borderRadius:10,height:7}}><div style={{background:pct>90?T.blush:pct>70?T.gold:s.c,borderRadius:10,height:7,width:`${Math.min(pct,100)}%`,transition:"width .5s"}}/></div>
            </div>
          </div>
        </div>
      );})}
      <Card sx={{background:`linear-gradient(135deg,${T.esp},#5a3a22)`,border:"none"}} ch={<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Ic.Bulb s={16} c={T.gold} w={1.5}/><span style={{fontFamily:FB,fontSize:10,color:T.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>CFO Tip</span></div><p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:"rgba(255,255,255,.8)",margin:0,lineHeight:1.75}}>"Automate 20% of income to savings before spending. Your future self is your best investment."</p></div>}/>
      <H2 t="Ask Your Budget Coach"/>
      {["Am I on track for Bali?","Where am I overspending?","Build a 6-month emergency fund?"].map((q,i)=><div key={i} onClick={()=>setInp(q)} style={{background:"#fff",border:`1px solid ${T.linen}`,borderRadius:11,padding:"9px 14px",cursor:"pointer",marginBottom:7,display:"flex",alignItems:"center",gap:8,fontFamily:FB,fontSize:12,color:T.bark}}><Ic.Budget s={13} c={T.taupe} w={1.5}/>{q}</div>)}
      {hist.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:8}}><div style={{maxWidth:"85%",background:m.role==="user"?`linear-gradient(135deg,${T.esp},#4a3020)`:"#fff",borderRadius:16,padding:"10px 14px",border:m.role==="assistant"?`1px solid ${T.linen}`:"none"}}><p style={{fontFamily:FB,fontSize:13,color:m.role==="user"?"rgba(255,255,255,.9)":T.bark,margin:0,lineHeight:1.6}}>{m.content}</p></div></div>)}
      {loading&&<div style={{display:"flex",gap:4,padding:"8px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:T.taupe,animation:`dot 1.2s ease-in-out ${i*.2}s infinite`}}/>)}</div>}
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Ask anything about your finances…" style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
        <button onClick={ask} style={{background:T.esp,border:"none",borderRadius:13,padding:"0 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Send s={16} c="#fff" w={2}/></button>
      </div>
    </div>
  );
}

// ── TRIPS ────────────────────────────────────────────────────────
function TripsScreen() {
  const [prompt,setPrompt]=useState(""); const [result,setResult]=useState(null); const [loading,setLoading]=useState(false);
  const plan=async()=>{if(!prompt.trim())return;setLoading(true);setResult(null);const sys=`Expert family travel planner. Return ONLY valid JSON:{"destination":"","duration":"","overview":"","itinerary":[{"day":1,"title":"","morning":"","afternoon":"","evening":"","tip":""}],"budget":[{"category":"","amount":"","notes":""}],"packing":[{"person":"","items":[]}],"note":""}`;try{const raw=await claude(sys,prompt);setResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));}catch(e){setResult({error:true});}setLoading(false);};
  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{background:"linear-gradient(135deg,#0e2a1e,#1a5a3a)",borderRadius:22,padding:"20px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div style={{width:42,height:42,borderRadius:13,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,.08)"}}><Ic.Compass s={22} c="#C8E0CE" w={1.4}/></div>
          <div><AIBadge t="AI Trip Planner"/><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:20,color:"#fff",margin:"4px 0 0"}}>Plan Any Trip Instantly</h2></div>
        </div>
        <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.45)",margin:0,lineHeight:1.6}}>Describe your trip. Full itinerary, budget, packing lists.</p>
      </div>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. Family trip Japan, 10 days, 2 kids 6 & 9, $8,000, culture and food" rows={3} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"14px",borderRadius:16,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp,lineHeight:1.6,marginBottom:10}}/>
      {["Japan 10d, 2 kids, $8k","Paris weekend, $3k","Maldives family, $12k"].map((e,i)=><div key={i} onClick={()=>setPrompt(e)} style={{fontFamily:FB,fontSize:11,color:T.bark,background:T.sand,borderRadius:10,padding:"5px 12px",cursor:"pointer",border:`1px solid ${T.linen}`,display:"inline-block",marginRight:6,marginBottom:8}}>{e.split(",")[0]} ›</div>)}
      <button onClick={plan} disabled={!prompt.trim()||loading} style={{width:"100%",marginTop:4,background:prompt.trim()&&!loading?"linear-gradient(135deg,#0e2a1e,#1a5a3a)":T.linen,color:prompt.trim()&&!loading?"#fff":T.taupe,border:"none",borderRadius:16,padding:"14px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16}}>
        {loading?<><Spinner/> Planning…</>:<><Ic.Compass s={18} c="#fff" w={1.5}/> Plan My Trip</>}
      </button>
      {result&&!result.error&&<div style={{animation:"fadeUp .4s ease both"}}>
        <Card sx={{background:"linear-gradient(135deg,#1a3a2e,#2d6a54)",border:"none"}} ch={<div><h3 style={{fontFamily:FD,fontSize:22,color:"#fff",margin:"0 0 6px",fontStyle:"italic"}}>{result.destination}</h3><p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.75)",margin:0,lineHeight:1.65}}>{result.overview}</p></div>}/>
        <H2 t="Day-by-Day Itinerary"/>
        {result.itinerary?.map((d,i)=>(
          <Card key={i} ch={<div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:T.goldP,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FD,fontSize:15,fontWeight:700,color:T.gold,flexShrink:0}}>{d.day}</div>
              <span style={{fontFamily:FD,fontSize:17,fontWeight:600,color:T.esp}}>{d.title}</span>
            </div>
            {[["Morning",d.morning,Ic.Sun],["Afternoon",d.afternoon,Ic.Compass],["Evening",d.evening,Ic.Moon]].map(([lb,v,IC])=>v&&(
              <div key={lb} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <Tile ic={IC} c={T.gold} bg={T.goldP} s={13} ts={26} r={7}/>
                <div><div style={{fontFamily:FB,fontSize:10,fontWeight:700,color:T.gold,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>{lb}</div><div style={{fontFamily:FB,fontSize:13,color:T.bark,lineHeight:1.5}}>{v}</div></div>
              </div>
            ))}
            {d.tip&&<div style={{background:T.goldP,borderRadius:10,padding:"8px 12px",marginTop:4,display:"flex",gap:8,alignItems:"center"}}><Ic.Bulb s={14} c={T.gold} w={1.5}/><p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,fontStyle:"italic"}}>{d.tip}</p></div>}
          </div>}/>
        ))}
        <H2 t="Budget Breakdown"/>
        <Card ch={<div>{result.budget?.map((b,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:i<result.budget.length-1?`1px solid ${T.linen}`:"none"}}><div><div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{b.category}</div>{b.notes&&<div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:2}}>{b.notes}</div>}</div><div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.gold}}>{b.amount}</div></div>))}</div>}/>
      </div>}
    </div>
  );
}

// ── STYLE ────────────────────────────────────────────────────────
function StyleScreen() {
  const [prompt,setPrompt]=useState(""); const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState({});
  const run=async()=>{if(!prompt.trim())return;setLoading(true);setResult(null);const sys=`AI personal stylist. Return ONLY valid JSON:{"intro":"","outfits":[{"name":"","occasion":"","items":[{"piece":"","brand":"","priceRange":"","why":""}],"totalEstimate":"","note":""}],"budgetCheck":""}2-4 outfits, 3-4 items each.`;try{const raw=await claude(sys,prompt);setResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));}catch(e){setResult({error:true});}setLoading(false);};
  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{background:"linear-gradient(135deg,#2d1428,#4a1a3a)",borderRadius:22,padding:"20px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div style={{width:42,height:42,borderRadius:13,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,.08)"}}><Ic.Hanger s={22} c="#F2D4CA" w={1.4}/></div>
          <div><AIBadge t="Style Stylist"/><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:20,color:"#fff",margin:"4px 0 0"}}>Your AI Stylist</h2></div>
        </div>
      </div>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. 3 outfits for Bali — beach, dinner, day trip, budget $300" rows={3} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"14px",borderRadius:16,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp,lineHeight:1.6,marginBottom:10}}/>
      {["Bali outfits, $300","Work capsule, $500","Weekend casual, $200"].map((e,i)=><div key={i} onClick={()=>setPrompt(e)} style={{fontFamily:FB,fontSize:11,color:T.bark,background:T.sand,borderRadius:10,padding:"5px 12px",cursor:"pointer",border:`1px solid ${T.linen}`,display:"inline-block",marginRight:6,marginBottom:8}}>{e.split(",")[0]} ›</div>)}
      <button onClick={run} disabled={!prompt.trim()||loading} style={{width:"100%",marginTop:4,background:prompt.trim()&&!loading?"linear-gradient(135deg,#4a1a3a,#2d1428)":T.linen,color:prompt.trim()&&!loading?"#fff":T.taupe,border:"none",borderRadius:16,padding:"14px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16}}>
        {loading?<><Spinner/> Curating…</>:<><Ic.Hanger s={18} c="#fff" w={1.5}/> Style Me</>}
      </button>
      {result&&!result.error&&<div style={{animation:"fadeUp .4s ease both"}}>
        <Card sx={{background:"linear-gradient(135deg,#2d1428,#4a1a3a)",border:"none"}} ch={<div><p style={{fontFamily:FD,fontStyle:"italic",fontSize:15,color:"rgba(255,255,255,.85)",margin:"0 0 8px",lineHeight:1.7}}>{result.intro}</p><AIBadge t={result.budgetCheck||"Within budget"}/></div>}/>
        {result.outfits?.map((o,i)=>(
          <Card key={i} ch={<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div><div style={{fontFamily:FD,fontSize:18,fontWeight:600,color:T.esp}}>{o.name}</div><div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:2}}>{o.occasion}</div></div>
              <div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.gold}}>{o.totalEstimate}</div>
            </div>
            {o.items?.map((it,j)=>(
              <div key={j} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 0",borderBottom:j<o.items.length-1?`1px solid ${T.linen}`:"none"}}>
                <Tile ic={Ic.Hanger} c={T.lav} bg={T.lavP} s={18} ts={40} r={12}/>
                <div style={{flex:1}}><div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{it.piece}</div><div style={{fontFamily:FB,fontSize:11,color:T.gold,marginTop:1}}>{it.brand} · {it.priceRange}</div><div style={{fontFamily:FB,fontSize:11,color:T.bark,marginTop:3,lineHeight:1.5}}>{it.why}</div></div>
                <button onClick={()=>setSaved(p=>({...p,[`${i}-${j}`]:!p[`${i}-${j}`]}))} style={{background:"none",border:"none",cursor:"pointer",flexShrink:0,padding:4}}><Ic.Heart s={18} c={T.blush} filled={saved[`${i}-${j}`]} w={1.8}/></button>
              </div>
            ))}
            {o.note&&<div style={{background:T.blushP,borderRadius:10,padding:"8px 12px",marginTop:10}}><p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,fontStyle:"italic"}}>{o.note}</p></div>}
          </div>}/>
        ))}
      </div>}
    </div>
  );
}

// ── CIRCLE ───────────────────────────────────────────────────────
function CircleScreen() {
  const posts=[{user:"Priya M",av:"👩🏽",msg:"Anyone know a great child-friendly dentist near Oakwood?",time:"2h",h:4},{user:"Sophie L",av:"👩🏼",msg:"Sharing my weekly meal prep — total game changer!",time:"4h",h:11},{user:"Mei Zhang",av:"👩",msg:"Bali with kids recommendations? Going in June!",time:"8h",h:5}];
  const [liked,setLiked]=useState(posts.map(()=>false));
  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><Ic.People s={24} c={T.esp} w={1.5}/><H2 t="The Circle" sub="Because mums lift each other up"/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {[[Ic.Bell,"Ask for help",T.skyP,T.sky],[Ic.Heart,"Offer support",T.sageP,T.sage]].map(([IC,lb,bg,c],i)=>(
          <button key={i} style={{background:bg,border:`1.5px solid ${c}30`,borderRadius:14,padding:"16px",cursor:"pointer",textAlign:"center"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><IC s={22} c={c} w={1.5}/></div>
            <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp}}>{lb}</div>
          </button>
        ))}
      </div>
      {posts.map((p,i)=>(
        <Card key={i} ch={<div style={{display:"flex",gap:10}}>
          <div style={{fontSize:28,flexShrink:0}}>{p.av}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp}}>{p.user}</span>
              <div style={{display:"flex",alignItems:"center",gap:4}}><Ic.Clock s={11} c={T.taupe} w={1.5}/><span style={{fontFamily:FB,fontSize:11,color:T.taupe}}>{p.time}</span></div>
            </div>
            <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:"6px 0 10px",lineHeight:1.55}}>{p.msg}</p>
            <button onClick={()=>setLiked(prev=>{const n=[...prev];n[i]=!n[i];return n;})} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontFamily:FB,fontSize:13,color:liked[i]?T.blush:T.taupe}}>
              <Ic.Heart s={16} c={liked[i]?T.blush:T.taupe} filled={liked[i]} w={1.8}/>{p.h+(liked[i]?1:0)}
            </button>
          </div>
        </div>}/>
      ))}
    </div>
  );
}

// ── WELLNESS ─────────────────────────────────────────────────────
function WellnessScreen() {
  const [moods,setMoods]=useState([1,2,1,3,2,4,3]);
  const [done,setDone]=useState([true,false,false,false]);
  const workouts=[{lb:"Morning HIIT",mins:25,IC:Ic.Dumbbell},{lb:"Pilates Core",mins:30,IC:Ic.Leaf},{lb:"Evening Run",mins:40,IC:Ic.Drop},{lb:"Upper Body",mins:35,IC:Ic.Dumbbell}];
  const mC=m=>m<=1?T.blush:m<=2?T.gold:m<=3?T.sage:T.teal;
  const D=["M","T","W","T","F","S","S"];
  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{background:"linear-gradient(135deg,#0e2218,#1a4a2e)",borderRadius:22,padding:"20px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div style={{width:42,height:42,borderRadius:13,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,.08)"}}><Ic.Leaf s={22} c="#C8E0CE" w={1.4}/></div>
          <div><AIBadge t="Wellness Coach"/><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:20,color:"#fff",margin:"4px 0 0"}}>Your Thrive Plan</h2></div>
        </div>
        <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.55)",margin:0,lineHeight:1.6}}>4 lower-mood days this week. Nora has lightened your plan.</p>
      </div>
      <Card ch={<div><H2 t="This Week's Mood"/><div style={{display:"flex",gap:6,alignItems:"flex-end"}}>{moods.map((m,i)=><div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:56,display:"flex",alignItems:"flex-end",justifyContent:"center",marginBottom:4}}><div style={{width:"100%",borderRadius:"5px 5px 0 0",background:mC(m)+"28",height:`${(m/5)*100}%`,minHeight:8,borderTop:`2px solid ${mC(m)}`}}/></div><div style={{fontSize:10,fontFamily:FB,color:T.taupe}}>{D[i]}</div></div>)}</div></div>}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[[Ic.Moon,"Sleep","6.2h",T.skyP,T.sky],[Ic.Dumbbell,"Workouts","1/4",T.sageP,T.sage],[Ic.Drop,"Water","4/8",T.blushP,T.blush]].map(([IC,lb,v,bg,c])=>(
          <div key={lb} style={{background:bg,borderRadius:13,padding:"12px 10px",textAlign:"center",border:`1px solid ${c}22`}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:4}}><IC s={20} c={c} w={1.5}/></div>
            <div style={{fontFamily:FB,fontSize:9,color:c,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>{lb}</div>
            <div style={{fontFamily:FD,fontSize:15,fontWeight:700,color:T.esp,marginTop:2}}>{v}</div>
          </div>
        ))}
      </div>
      <H2 t="Adapted Workouts" sub="Lighter this week — you've earned it"/>
      {workouts.map((w,i)=>(
        <div key={i} onClick={()=>setDone(p=>{const n=[...p];n[i]=!n[i];return n;})} style={{display:"flex",alignItems:"center",gap:12,background:done[i]?T.sageP:"#fff",borderRadius:13,padding:"12px 14px",marginBottom:8,cursor:"pointer",border:`1.5px solid ${done[i]?T.sage:T.linen}`,transition:"all .2s"}}>
          <Tile ic={w.IC} c={done[i]?T.sage:T.bark} bg={done[i]?"rgba(107,158,122,.2)":T.sand} s={18} ts={38} r={12}/>
          <div style={{flex:1}}><div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{w.lb}</div><div style={{fontFamily:FB,fontSize:11,color:T.bark,marginTop:2}}>{w.mins} min</div></div>
          {done[i]&&<div style={{display:"flex",alignItems:"center",gap:4,fontFamily:FB,fontSize:12,color:T.sage,fontWeight:700}}><Ic.Check s={13} c={T.sage} w={2.5}/> Done</div>}
        </div>
      ))}
      <Card sx={{background:`linear-gradient(135deg,${T.sageP},${T.goldP})`,border:"none"}} ch={<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{fontFamily:FD,fontSize:17,fontWeight:600,color:T.esp}}>10-Minute Reset</span><Tag ch="10 mins" c={T.sage}/></div>
        {["3 deep belly breaths","Gentle neck & shoulder rolls","Write 3 things you're grateful for","5 mins of stillness — phone down"].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:i<3?`1px dashed ${T.linen}`:"none"}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:T.sage,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{i+1}</div>
            <span style={{fontFamily:FB,fontSize:13,color:T.esp}}>{s}</span>
          </div>
        ))}
      </div>}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ░░  ROOT — FULL FLOW CONTROLLER
// ═══════════════════════════════════════════════════════════════════
export default function HerNest() {
  // Always start fresh — never cache screen state
  const [screen, setScreen] = useState("splash");
  const [profile, setProfile] = useState({avatar:"👩",name:"",city:"",role:"",partner:"",kids:[],priorities:[],tripGoal:"",fitnessGoal:"",savingsGoal:"",challenge:""});
  const [tab, setTab] = useState("home");
  const [aiTasks, setAiTasks] = useState([]);

  const upd = (k,v) => setProfile(p=>({...p,[k]:v}));
  const handleAI = p => { if(p?.tasks) setAiTasks(prev=>[...prev,...p.tasks]); };

  // ── Onboarding flow ──────────────────────────────────────────
  if(screen==="splash") return <SplashScreen onDone={()=>setScreen("login")}/>;
  if(screen==="login")  return <LoginScreen  onLogin={()=>setScreen("step1")}/>;

  const STEPS=["step1","step2","step3","step4"];
  if(STEPS.includes(screen)) {
    const idx=STEPS.indexOf(screen);
    return (
      <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:T.cream,boxShadow:"0 0 80px rgba(0,0,0,.3)"}}>
        <div style={{padding:"16px 24px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>setScreen(["login",...STEPS][idx])} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}>
            <Ic.Back s={20} c={T.bark} w={2}/>
          </button>
          <span style={{fontFamily:FB,fontSize:12,color:T.taupe}}>Step {idx+1} of 4</span>
          <button onClick={()=>setScreen("intro")} style={{background:"none",border:"none",cursor:"pointer",fontFamily:FB,fontSize:12,color:T.taupe}}>Skip</button>
        </div>
        <div style={{padding:"16px 24px 40px"}}>
          <ProgressDots total={4} current={idx}/>
          {screen==="step1"&&<Step1 data={profile} onChange={upd} onNext={()=>setScreen("step2")}/>}
          {screen==="step2"&&<Step2 data={profile} onChange={upd} onNext={()=>setScreen("step3")} onBack={()=>setScreen("step1")}/>}
          {screen==="step3"&&<Step3 data={profile} onChange={upd} onNext={()=>setScreen("step4")} onBack={()=>setScreen("step2")}/>}
          {screen==="step4"&&<Step4 data={profile} onChange={upd} onFinish={()=>setScreen("intro")} onBack={()=>setScreen("step3")}/>}
        </div>
      </div>
    );
  }

  if(screen==="intro") return <NoraIntro profile={profile} onEnter={()=>setScreen("app")}/>;

  // ── Main App ─────────────────────────────────────────────────
  const screens = {
    home:    <HomeScreen go={setTab} aiTasks={aiTasks} profile={profile}/>,
    brief:   <BriefingScreen profile={profile}/>,
    nora:    <NoraScreen onTasks={handleAI} profile={profile}/>,
    plan:    <PlanScreen aiTasks={aiTasks}/>,
    trips:   <TripsScreen/>,
    budget:  <BudgetScreen/>,
    style:   <StyleScreen/>,
    circle:  <CircleScreen/>,
    wellness:<WellnessScreen/>,
  };

  return (
    <div style={{fontFamily:FB,background:T.cream,minHeight:"100vh",maxWidth:430,margin:"0 auto",boxShadow:"0 0 80px rgba(0,0,0,.3)"}}>
      {/* Top bar */}
      <div style={{padding:"12px 20px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",background:T.cream,position:"sticky",top:0,zIndex:50,borderBottom:`1px solid ${T.linen}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Ic.Home s={18} c={T.gold} w={1.6}/>
          <span style={{fontFamily:FD,fontSize:22,fontStyle:"italic",color:T.esp}}>
            {profile.name?`${profile.name}'s `:"Her"}<strong style={{fontStyle:"normal"}}>Nest</strong>
            <span style={{fontSize:10,color:T.gold,fontFamily:FB,fontStyle:"normal",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginLeft:8}}>AI</span>
          </span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {aiTasks.length>0&&<div style={{background:T.goldP,borderRadius:20,padding:"4px 10px",fontFamily:FB,fontSize:11,color:T.gold,fontWeight:700,display:"flex",alignItems:"center",gap:4}}><Ic.Star s={10} c={T.gold} w={1.4}/>{aiTasks.length}</div>}
          <button onClick={()=>{setScreen("splash");setProfile({avatar:"👩",name:"",city:"",role:"",partner:"",kids:[],priorities:[],tripGoal:"",fitnessGoal:"",savingsGoal:"",challenge:""});setTab("home");setAiTasks([]);}} style={{background:T.sand,border:`1px solid ${T.linen}`,borderRadius:20,padding:"5px 10px",fontFamily:FB,fontSize:10,fontWeight:700,color:T.bark,cursor:"pointer"}}>↺ Preview</button>
          <Ic.Bell s={22} c={T.esp} w={1.5}/>
        </div>
      </div>

      {/* Content */}
      <div style={{padding:"14px 16px 110px",overflowY:"auto",maxHeight:"calc(100vh - 112px)"}}>
        {screens[tab]}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(250,246,239,.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${T.linen}`,display:"flex",overflowX:"auto",padding:"8px 4px 16px",scrollbarWidth:"none",zIndex:100}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:"0 0 auto",minWidth:54,display:"flex",flexDirection:"column",alignItems:"center",gap:3,border:"none",background:"transparent",cursor:"pointer",padding:"4px 5px",position:"relative"}}>
              {t.ai&&<div style={{position:"absolute",top:2,right:8,width:6,height:6,borderRadius:"50%",background:T.gold,animation:"breathe 2s ease-in-out infinite",boxShadow:`0 0 5px ${T.gold}`}}/>}
              <div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:active?T.goldP:"transparent",transition:"background .15s"}}>
                <t.IC s={active?21:19} c={active?T.esp:T.taupe} w={active?1.6:1.4}/>
              </div>
              <span style={{fontFamily:FB,fontSize:8.5,letterSpacing:.5,textTransform:"uppercase",color:active?T.esp:T.taupe,fontWeight:active?700:400,borderBottom:active?`2px solid ${T.gold}`:"2px solid transparent",paddingBottom:1}}>
                {t.lb}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
