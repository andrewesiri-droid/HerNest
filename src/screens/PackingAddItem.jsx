import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function PackingAddItem({packingPersons,onAdd}){
  const [newItem,setNewItem]=useState("");
  const [newPerson,setNewPerson]=useState(packingPersons[0]||"Everyone");
  const doAdd=()=>{if(!newItem.trim())return;onAdd(newItem,newPerson);setNewItem("");};
  return(
    <div style={{background:T.sand,borderRadius:14,padding:"12px",marginTop:8}}>
      <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.bark,marginBottom:8}}>+ Add your own item</div>
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        {packingPersons.map(p=>(
          <button key={p} onClick={()=>setNewPerson(p)} style={{padding:"5px 10px",borderRadius:10,border:`1.5px solid ${newPerson===p?T.gold:T.linen}`,background:newPerson===p?T.goldP:"#fff",fontFamily:FB,fontSize:10,fontWeight:700,color:newPerson===p?T.esp:T.bark,cursor:"pointer"}}>
            {p==="Mum"?"👩":p==="Dad"?"👨":p==="Kids"?"👧":"👜"} {p}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")doAdd();}} placeholder="e.g. Sunscreen SPF50" style={{flex:1,fontFamily:FB,fontSize:13,padding:"9px 12px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp,background:"#fff"}}/>
        <button onClick={doAdd} style={{background:T.esp,border:"none",borderRadius:10,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Ic.Plus s={18} c="#fff" w={2}/>
        </button>
      </div>
    </div>
  );
}
