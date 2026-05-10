import React from "react";
import { T, FB } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";

const TABS = [
  {id:"home",    lb:"Home",    IC:Ic.Home},
  {id:"nora",    lb:"Nora",    IC:Ic.Star, ai:true},
  {id:"plan",    lb:"Plan",    IC:Ic.Plan},
  {id:"budget",  lb:"Budget",  IC:Ic.Budget},
  {id:"brief",   lb:"Briefing",IC:Ic.Sun},
];

const MORE_TABS = [
  {id:"style",    lb:"Style",    IC:Ic.Hanger},
  {id:"trips",    lb:"Trips",    IC:Ic.Compass},
  {id:"circle",   lb:"Circle",   IC:Ic.People},
  {id:"wellness", lb:"Thrive",   IC:Ic.Leaf},
  {id:"settings", lb:"Settings", IC:Ic.Settings},
];

export function TabBar({ tab, setTab, showMore, setShowMore, profile, onSettings }) {
  const moreTabs = [...MORE_TABS.map(t => t.id), "profile"];

  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(255,252,248,.96)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:"1px solid rgba(229,217,201,.8)",zIndex:100,boxShadow:"0 -4px 24px rgba(46,31,20,.06)"}}>
      {/* More drawer */}
      {showMore && (
        <div style={{background:"rgba(255,252,248,.98)",borderTop:`1px solid ${T.linen}`,padding:"12px 16px 24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:"60vh",overflowY:"auto"}}>
          {MORE_TABS.map(t => (
            <button key={t.id} onClick={()=>{if(t.id==="settings"&&onSettings){onSettings();setShowMore(false);}else{setTab(t.id);setShowMore(false);}}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:14,background:tab===t.id?T.sand:"#fff",border:`1px solid ${tab===t.id?T.gold:T.linen}`,cursor:"pointer"}}>
              <t.IC s={18} c={tab===t.id?T.esp:T.taupe} w={tab===t.id?2:1.5}/>
              <span style={{fontFamily:FB,fontSize:12,fontWeight:tab===t.id?700:400,color:tab===t.id?T.esp:T.bark}}>{t.lb}</span>
            </button>
          ))}
          <button onClick={()=>{setTab("profile");setShowMore(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:14,background:tab==="profile"?T.sand:"#fff",border:`1px solid ${tab==="profile"?T.gold:T.linen}`,cursor:"pointer"}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:tab==="profile"?T.gold:T.linen,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>{profile?.avatar||"👩"}</div>
            <span style={{fontFamily:FB,fontSize:12,fontWeight:tab==="profile"?700:400,color:tab==="profile"?T.esp:T.bark}}>Profile</span>
          </button>
        </div>
      )}
      {/* Primary tabs */}
      <div style={{display:"flex",padding:"8px 4px 16px"}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>{setTab(t.id);setShowMore(false);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:14,transition:"all .2s",flex:1}}>
            <div style={{width:4,height:4,borderRadius:999,background:tab===t.id?T.gold:"transparent",marginBottom:1,transition:"all .2s"}}/>
            <t.IC s={22} c={tab===t.id?T.esp:T.stone2} w={tab===t.id?2:1.5}/>
            <span style={{fontFamily:FB,fontSize:9,fontWeight:tab===t.id?700:500,color:tab===t.id?T.esp:T.stone2,letterSpacing:.6}}>{t.lb}</span>
          </button>
        ))}
        {/* More button */}
        <button onClick={()=>setShowMore(p=>!p)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:14,flex:1}}>
          <div style={{width:4,height:4,borderRadius:999,background:showMore||moreTabs.includes(tab)?T.gold:"transparent",marginBottom:1,transition:"all .2s"}}/>
          <div style={{width:22,height:22,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}>
            {moreTabs.includes(tab)&&!showMore
              ? <div style={{width:22,height:22,borderRadius:"50%",background:T.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{profile?.avatar||"👩"}</div>
              : <>{[0,1,2].map(i=><div key={i} style={{width:16,height:2,borderRadius:2,background:showMore?T.esp:T.stone2}}/>)}</>
            }
          </div>
          <span style={{fontFamily:FB,fontSize:9,fontWeight:showMore||moreTabs.includes(tab)?700:500,color:showMore||moreTabs.includes(tab)?T.esp:T.stone2,letterSpacing:.6}}>{moreTabs.includes(tab)&&!showMore?"Me":"More"}</span>
        </button>
      </div>
    </div>
  );
}
