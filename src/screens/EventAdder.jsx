import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function EventAdder({onAdd}){
  const [name,setName]=useState("");
  const [date,setDate]=useState("");
  const [emoji,setEmoji]=useState("🎉");
  const [show,setShow]=useState(false);
  const EMOJIS=["🎉","🎂","🏫","⚽","🎭","💒","🎓","✈️","🏥","💝"];
  const add=()=>{
    if(!name.trim()||!date)return;
    onAdd({name,date,emoji});
    setName("");setDate("");setEmoji("🎉");setShow(false);
  };
  return(
    <div>
      <button onClick={()=>setShow(!show)} style={{width:"100%",background:show?T.esp:T.sand,border:`1.5px solid ${show?T.esp:T.linen}`,borderRadius:12,padding:"10px",fontFamily:FB,fontSize:12,color:show?"#fff":T.bark,cursor:"pointer",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
        <Ic.Plus s={16} c={show?"#fff":T.bark} w={2}/>{show?"Cancel":"Add family event"}
      </button>
      {show&&<div style={{background:T.sand,borderRadius:14,padding:"14px",marginTop:10,border:`1.5px solid ${T.gold}`}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {EMOJIS.map(e=><button key={e} onClick={()=>setEmoji(e)} style={{fontSize:20,background:emoji===e?T.goldP:"transparent",border:`1.5px solid ${emoji===e?T.gold:T.linen}`,borderRadius:8,padding:"4px",cursor:"pointer"}}>{e}</button>)}
        </div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mia first day of school" style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:8}}/>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:10,background:"#fff"}}/>
        <button onClick={add} disabled={!name.trim()||!date} style={{width:"100%",background:name.trim()&&date?T.esp:T.linen,border:"none",borderRadius:10,padding:"10px",fontFamily:FB,fontSize:13,fontWeight:700,color:name.trim()&&date?"#fff":T.taupe,cursor:"pointer"}}>Add Event</button>
      </div>}
    </div>
  );
}
