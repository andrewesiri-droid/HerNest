import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function Step6({data,onChange,onFinish,onBack}){
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:44,marginBottom:12}}>💚</div>
      <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Health & finances</h2>
      <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>The more Nora knows, the better she helps</p>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Dietary preferences</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["No restrictions","Vegetarian","Vegan","Gluten free","Dairy free","Halal","Kosher"].map(s=>(
          <button key={s} onClick={()=>onChange("diet",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.diet===s?T.sage:T.linen}`,background:data.diet===s?T.sageP:"#fff",fontFamily:FB,fontSize:12,color:data.diet===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Current fitness routine</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Just starting","1-2x per week","3-4x per week","5+ per week","Very active"].map(s=>(
          <button key={s} onClick={()=>onChange("fitnessLevel",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.fitnessLevel===s?T.teal:T.linen}`,background:data.fitnessLevel===s?T.tealP:"#fff",fontFamily:FB,fontSize:12,color:data.fitnessLevel===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Sleep goal (hours)</label>
      <div style={{display:"flex",gap:8}}>
        {["6","7","8","9"].map(h=>(
          <button key={h} onClick={()=>onChange("sleepGoal",parseInt(h))} style={{flex:1,padding:"10px",borderRadius:12,border:`1.5px solid ${data.sleepGoal===parseInt(h)?T.lav:T.linen}`,background:data.sleepGoal===parseInt(h)?T.lavP:"#fff",fontFamily:FD,fontSize:18,fontWeight:700,color:data.sleepGoal===parseInt(h)?T.esp:T.bark,cursor:"pointer"}}>{h}h</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Monthly household budget</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Under $3k","$3-5k","$5-8k","$8-12k","$12k+"].map(s=>(
          <button key={s} onClick={()=>onChange("monthlyBudget",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.monthlyBudget===s?T.gold:T.linen}`,background:data.monthlyBudget===s?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:data.monthlyBudget===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Clothing budget per month</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Under $100","$100-200","$200-400","$400-600","$600+"].map(s=>(
          <button key={s} onClick={()=>onChange("styleBudget",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.styleBudget===s?T.blush:T.linen}`,background:data.styleBudget===s?T.blushP:"#fff",fontFamily:FB,fontSize:12,color:data.styleBudget===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:20}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Energy pattern</label>
      <div style={{display:"flex",gap:8}}>
        {["🌅 Morning person","☀️ Mid-day","🌙 Night owl"].map(s=>(
          <button key={s} onClick={()=>onChange("energyPattern",s)} style={{flex:1,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${data.energyPattern===s?T.gold:T.linen}`,background:data.energyPattern===s?T.goldP:"#fff",fontFamily:FB,fontSize:11,color:data.energyPattern===s?T.esp:T.bark,cursor:"pointer",textAlign:"center"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{display:"flex",gap:10}}>
      <button onClick={onBack} style={{flex:1,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`}}>← Back</button>
      <button onClick={onFinish} className="lift" style={{flex:2,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none"}}>Meet Nora ✨</button>
    </div>
  </div>);
}
