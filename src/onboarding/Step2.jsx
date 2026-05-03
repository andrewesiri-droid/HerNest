import React, { useState } from "react";
import { T, FD, FB } from "../constants/theme";

export function Step2({ data, onChange, onNext, onBack }) {
  const priorities = [
    {id:"family",lb:"Family time",em:"👨‍👩‍👧"},
    {id:"career",lb:"Career growth",em:"💼"},
    {id:"health",lb:"My health",em:"💪"},
    {id:"finances",lb:"Financial security",em:"💰"},
    {id:"travel",lb:"Travel",em:"✈️"},
    {id:"me",lb:"Me-time",em:"🧘"},
    {id:"kids",lb:"Kids success",em:"🎓"},
    {id:"home",lb:"Home & order",em:"🏠"},
    {id:"relationship",lb:"My relationship",em:"💛"},
  ];
  const selected = data.priorities || [];
  const toggle = (id) => {
    if(selected.includes(id)) onChange("priorities", selected.filter(p=>p!==id));
    else if(selected.length < 3) onChange("priorities", [...selected, id]);
  };
  const [kidName, setKidName] = useState("");
  const addKid = () => {
    if(!kidName.trim()) return;
    onChange("kids", [...(data.kids||[]), {name:kidName.trim(), age:"", bday:""}]);
    setKidName("");
  };
  return (
    <div style={{animation:"fadeUp .4s ease both"}}>
      <p style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.gold,marginBottom:8}}>Step 2 of 3</p>
      <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:28,color:T.esp,margin:"0 0 6px"}}>What matters most?</h2>
      <p style={{fontFamily:FB,fontSize:14,color:T.bark,margin:"0 0 20px"}}>Pick up to 3 — Nora will focus on these</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
        {priorities.map(p=>{
          const active=selected.includes(p.id);
          return <button key={p.id} onClick={()=>toggle(p.id)} style={{padding:"12px 8px",borderRadius:14,border:`2px solid ${active?T.gold:T.linen}`,background:active?T.goldP:"#fff",cursor:"pointer",transition:"all .15s",textAlign:"center",opacity:!active&&selected.length>=3?.4:1}}>
            <div style={{fontSize:22,marginBottom:4}}>{p.em}</div>
            <div style={{fontFamily:FB,fontSize:10,fontWeight:700,color:active?T.esp:T.bark,lineHeight:1.3}}>{p.lb}</div>
          </button>;
        })}
      </div>

      {selected.length>0&&<div style={{background:T.goldP,borderRadius:12,padding:"10px 14px",marginBottom:20,borderLeft:`3px solid ${T.gold}`}}>
        <p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0}}>Nora will focus on: <strong>{selected.map(s=>priorities.find(p=>p.id===s)?.lb).join(", ")}</strong></p>
      </div>}

      <div style={{marginBottom:24}}>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Any children? (optional)</label>
        {(data.kids||[]).map((k,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,background:T.sageP,borderRadius:10,padding:"8px 12px",marginBottom:6}}>
          <span style={{fontFamily:FB,fontSize:13,color:T.esp,flex:1}}>{k.name}</span>
          <button onClick={()=>onChange("kids",(data.kids||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:T.bark,cursor:"pointer",fontSize:16}}>×</button>
        </div>)}
        <div style={{display:"flex",gap:8}}>
          <input value={kidName} onChange={e=>setKidName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addKid()} placeholder="Child's name" style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp,outline:"none"}}/>
          <button onClick={addKid} disabled={!kidName.trim()} style={{background:kidName.trim()?T.sage:"#E5D9C9",border:"none",borderRadius:12,padding:"10px 16px",fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff",cursor:kidName.trim()?"pointer":"not-allowed"}}>Add</button>
        </div>
      </div>

      <div style={{display:"flex",gap:10}}>
        <button onClick={onBack} style={{flex:1,background:"none",border:`1.5px solid ${T.linen}`,borderRadius:16,padding:"14px",fontFamily:FB,fontSize:14,fontWeight:700,color:T.bark,cursor:"pointer"}}>← Back</button>
        <button onClick={onNext} disabled={selected.length===0} style={{flex:2,background:selected.length>0?`linear-gradient(135deg,${T.esp},#1a0a04)`:"#E5D9C9",border:"none",borderRadius:16,padding:"14px",fontFamily:FB,fontSize:14,fontWeight:700,color:selected.length>0?"#fff":T.taupe,cursor:selected.length>0?"pointer":"not-allowed",transition:"all .2s"}}>
          Continue →
        </button>
      </div>
    </div>
  );
}
