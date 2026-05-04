import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function GiftButton({name,age,relation}){
  const [open,setOpen]=useState(false);
  const [gifts,setGifts]=useState(null);
  const [loading,setLoading]=useState(false);

  const suggest=async()=>{
    if(gifts){setOpen(!open);return;}
    setOpen(true);setLoading(true);
    try{
      const raw=await claude(
        `You are a thoughtful gift advisor. Return ONLY valid JSON: {"gifts":[{"name":"","price":"","why":"","where":""}]}. 4 gift ideas.`,
        `Suggest 4 thoughtful gift ideas for ${name}, who is ${relation}${age?`, age ${age}`:""}.  Mix of prices from budget to splurge. Be specific with product names.`
      );
      setGifts(JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g,"").trim()).gifts);
    }catch(e){
      setGifts([{name:"Personalised photo book",price:"$40",why:"Memories they will treasure forever",where:"Chatbooks or Snapfish"},{name:"Spa day voucher",price:"$120",why:"Everyone deserves to be pampered",where:"Local spa"},{name:"Favourite restaurant dinner",price:"$80",why:"Quality time and a delicious meal",where:"OpenTable"},{name:"Heartfelt handwritten letter",price:"Free",why:"The most meaningful gift of all",where:"From the heart"}]);
    }
    setLoading(false);
  };

  return(
    <div style={{display:"inline-block"}}>
      <button onClick={suggest} style={{background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"2px 8px",fontFamily:FB,fontSize:10,fontWeight:700,color:T.gold,cursor:"pointer"}}>
        🎁 Gift ideas
      </button>
      {open&&<div style={{background:"#fff",borderRadius:14,padding:"14px",marginTop:8,border:`1.5px solid ${T.gold}`,boxShadow:"0 4px 20px rgba(0,0,0,.08)",animation:"pop .2s ease both"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp}}>Gift ideas for {name}</span>
          <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",cursor:"pointer"}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
        </div>
        {loading?<div style={{display:"flex",justifyContent:"center",padding:"16px 0"}}><Spinner/></div>:
        gifts?.map((g,i)=>(
          <div key={i} style={{padding:"8px 0",borderBottom:i<gifts.length-1?`1px solid ${T.linen}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp}}>{g.name}</div>
                <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:1}}>{g.why}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                <span style={{fontFamily:FB,fontSize:10,color:T.sage}}>📍 {g.where}</span>
                <span style={{fontFamily:FB,fontSize:9,color:T.taupe,display:"block",marginTop:2}}>· Prices are estimates, verify before purchasing</span>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>window.open("https://www.amazon.com/s?k="+encodeURIComponent(g.name)+"&tag=hernest-20","_blank")} style={{background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"2px 8px",fontFamily:FB,fontSize:9,fontWeight:700,color:T.gold,cursor:"pointer"}}>Amazon →</button>
                  <button onClick={()=>window.open("https://www.google.com/search?q=buy+"+encodeURIComponent(g.name),"_blank")} style={{background:T.sand,border:`1px solid ${T.linen}`,borderRadius:8,padding:"2px 8px",fontFamily:FB,fontSize:9,color:T.bark,cursor:"pointer"}}>Search →</button>
                </div>
              </div>
              </div>
              <span style={{fontFamily:FD,fontSize:14,fontWeight:700,color:T.gold,flexShrink:0,marginLeft:8}}>{g.price}</span>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
