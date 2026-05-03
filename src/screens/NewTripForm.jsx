import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";
import { DestSearch } from "./DestSearch";

export function NewTripForm({profile,familyMembers,onAdd,onCancel,newDest,setNewDest,newDate,setNewDate,newNights,setNewNights,newBudget,setNewBudget,newStatus,setNewStatus,newTravellers,setNewTravellers}){
  return(
    <div style={{background:"#fff",borderRadius:18,padding:"18px",marginBottom:14,border:`1.5px solid ${T.gold}`,animation:"pop .2s ease both"}}>
      <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:T.esp,margin:"0 0 16px"}}>Plan a new trip ✈️</p>
      <div style={{marginBottom:12}}>
        <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Where to?</label>
        <DestSearch value={newDest} onChange={setNewDest}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Depart date</label>
          <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp,background:"#fff"}}/>
        </div>
        <div>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Nights</label>
          <input type="text" inputMode="numeric" value={newNights} onChange={e=>setNewNights(e.target.value)} placeholder="e.g. 7" style={{width:"100%",fontFamily:FB,fontSize:15,fontWeight:700,padding:"10px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp}}/>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Total budget ($)</label>
        <input type="text" inputMode="numeric" value={newBudget} onChange={e=>setNewBudget(e.target.value)} placeholder="e.g. 6000" style={{width:"100%",fontFamily:FB,fontSize:15,fontWeight:700,padding:"10px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Who is coming</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {familyMembers.map((person,i)=>{
            const selected=newTravellers>i;
            return(
              <button key={i} onClick={()=>setNewTravellers(selected?i:i+1)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:`1.5px solid ${selected?T.gold:T.linen}`,background:selected?T.goldP:"#fff",cursor:"pointer"}}>
                <span style={{fontSize:14}}>{person.emoji}</span>
                <span style={{fontFamily:FB,fontSize:12,color:selected?T.esp:T.bark}}>{person.name}</span>
                {selected&&<Ic.Check s={11} c={T.gold} w={2.5}/>}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Status</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["Dreaming","Planning","Booked"].map(s=><button key={s} onClick={()=>setNewStatus(s)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${newStatus===s?T.gold:T.linen}`,background:newStatus===s?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:newStatus===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>)}
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onCancel} style={{flex:1,background:T.sand,border:"none",borderRadius:12,padding:"12px",fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer"}}>Cancel</button>
        <button onClick={onAdd} disabled={!newDest.trim()} style={{flex:2,background:newDest.trim()?`linear-gradient(135deg,${T.gold},#8B6914)`:T.linen,border:"none",borderRadius:12,padding:"12px",fontFamily:FB,fontSize:13,fontWeight:700,color:newDest.trim()?"#fff":T.taupe,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <Ic.Compass s={16} c={newDest.trim()?"#fff":T.taupe} w={1.5}/>Add Trip & Plan with Nora
        </button>
      </div>
    </div>
  );
}
