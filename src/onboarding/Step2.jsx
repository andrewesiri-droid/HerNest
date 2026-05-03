import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function Step2({data,onChange,onNext,onBack}){
  const [kn,setKn]=useState(""); const [ka,setKa]=useState("");
  const [pn,setPn]=useState(""); const [pr,setPr]=useState("Mum");
  const addKid=()=>{if(!kn.trim())return;onChange("kids",[...(data.kids||[]),{name:kn,age:ka}]);setKn("");setKa("");};
  const addPerson=(field,name,role)=>{if(!name.trim())return;onChange(field,[...(data[field]||[]),{name,role}]);};
  const PARENT_ROLES=["Mum","Dad"];
  const INLAW_ROLES=["Mother-in-law","Father-in-law"];
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:24}}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Ic.People s={44} c={T.esp} w={1.2}/></div><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your family</h2><p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Tell Nora about the people you love most</p></div>
    
    <FInput label="Partner's name (optional)" placeholder="e.g. James" value={data.partner||""} onChange={e=>onChange("partner",e.target.value)}/>
    
    <div style={{marginBottom:16}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Your children</label>
      {(data.kids||[]).map((k,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.sageP,borderRadius:12,padding:"10px 14px",marginBottom:8}}><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp,flex:1}}>{k.name}{k.age?`, ${k.age}`:""}</span><button onClick={()=>onChange("kids",(data.kids||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button></div>)}
      <div style={{display:"flex",gap:8}}><input placeholder="Name" value={kn} onChange={e=>setKn(e.target.value)} style={{flex:2,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/><input placeholder="Age" value={ka} onChange={e=>setKa(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/><button onClick={addKid} style={{background:T.esp,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button></div>
    </div>

    <div style={{marginBottom:16}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Your parents</label>
      {(data.parents||[]).map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.goldP,borderRadius:12,padding:"10px 14px",marginBottom:8}}><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp,flex:1}}>{p.name}<span style={{fontFamily:FB,fontSize:11,color:T.bark,marginLeft:8}}>{p.role}</span></span><button onClick={()=>onChange("parents",(data.parents||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button></div>)}
      <div style={{display:"flex",gap:8,marginBottom:6}}>
        {PARENT_ROLES.map(r=><button key={r} onClick={()=>setPr(r)} style={{flex:1,padding:"6px",borderRadius:10,border:`1.5px solid ${pr===r?T.gold:T.linen}`,background:pr===r?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:pr===r?T.esp:T.bark,cursor:"pointer"}}>{r}</button>)}
      </div>
      <div style={{display:"flex",gap:8}}><input placeholder="Name" value={pn} onChange={e=>setPn(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/><button onClick={()=>{addPerson("parents",pn,pr);setPn("");}} style={{background:T.gold,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button></div>
    </div>

    <div style={{marginBottom:16}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>In-laws (optional)</label>
      {(data.inlaws||[]).map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.lavP,borderRadius:12,padding:"10px 14px",marginBottom:8}}><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp,flex:1}}>{p.name}<span style={{fontFamily:FB,fontSize:11,color:T.bark,marginLeft:8}}>{p.role}</span></span><button onClick={()=>onChange("inlaws",(data.inlaws||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button></div>)}
      <div style={{display:"flex",gap:8}}>
        <select onChange={e=>setPr(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
          {INLAW_ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
        <input placeholder="Name" value={pn} onChange={e=>setPn(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
        <button onClick={()=>{addPerson("inlaws",pn,pr);setPn("");}} style={{background:T.lav,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button>
      </div>
    </div>

    <div style={{display:"flex",gap:10}}><button onClick={onBack} style={{flex:1,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`}}>← Back</button><button onClick={onNext} className="lift" style={{flex:2,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"}}>Continue →</button></div>
  </div>);}
