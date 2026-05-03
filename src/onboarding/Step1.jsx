import React, { useState } from "react";
import { T, FD, FB } from "../constants/theme";

export function Step1({ data, onChange, onNext }) {
  const roles = ["Working Mum","Stay-at-home","Entrepreneur","Single Mum"];
  const avatars = ["👩","👩🏻","👩🏼","👩🏽","👩🏾","👩🏿","👩‍💼","👩‍🍼"];
  return (
    <div style={{animation:"fadeUp .4s ease both"}}>
      <p style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.gold,marginBottom:8}}>Step 1 of 3</p>
      <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:28,color:T.esp,margin:"0 0 6px"}}>Let's get to know you</h2>
      <p style={{fontFamily:FB,fontSize:14,color:T.bark,margin:"0 0 28px"}}>What should Nora call you?</p>

      <input autoFocus value={data.name||""} onChange={e=>onChange("name",e.target.value)}
        placeholder="Your first name" style={{width:"100%",fontFamily:FD,fontStyle:"italic",fontSize:22,padding:"14px 16px",borderRadius:14,border:`2px solid ${data.name?T.gold:T.linen}`,background:"#fff",color:T.esp,marginBottom:20,outline:"none",transition:"border .2s"}}/>

      <div style={{marginBottom:20}}>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Choose your avatar</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {avatars.map(a=><button key={a} onClick={()=>onChange("avatar",a)} style={{fontSize:28,width:52,height:52,borderRadius:14,border:`2px solid ${data.avatar===a?T.gold:T.linen}`,background:data.avatar===a?T.goldP:"#fff",cursor:"pointer",transition:"all .15s"}}>{a}</button>)}
        </div>
      </div>

      <div style={{marginBottom:28}}>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Your role</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {roles.map(r=><button key={r} onClick={()=>onChange("role",r)} style={{padding:"12px",borderRadius:14,border:`2px solid ${data.role===r?T.gold:T.linen}`,background:data.role===r?T.goldP:"#fff",fontFamily:FB,fontSize:13,fontWeight:data.role===r?700:400,color:data.role===r?T.esp:T.bark,cursor:"pointer",transition:"all .15s",textAlign:"left"}}>{r}</button>)}
        </div>
      </div>

      <button onClick={onNext} disabled={!data.name?.trim()} style={{width:"100%",background:data.name?.trim()?`linear-gradient(135deg,${T.esp},#1a0a04)`:"#E5D9C9",border:"none",borderRadius:16,padding:"16px",fontFamily:FB,fontSize:15,fontWeight:700,color:data.name?.trim()?"#fff":T.taupe,cursor:data.name?.trim()?"pointer":"not-allowed",transition:"all .2s"}}>
        Continue →
      </button>
    </div>
  );
}
