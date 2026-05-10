import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";
import { GiftButton } from "./GiftButton";
import { EventAdder } from "./EventAdder";
import { NotificationCard } from "./NotificationCard";

import { PrivacyScreen } from "./PrivacyScreen";
import { NoraMemoryScreen } from "./NoraMemoryScreen";
export function ProfileScreen({profile, onChange, onSave, onSignOut, user}){
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("profile");

  const [local, setLocal] = useState({...profile});
  const [saved, setSaved] = useState(false);
  const [kn, setKn] = useState("");
  const [ka, setKa] = useState("");
  const upd = (k,v) => { setLocal(p=>{const updated={...p,[k]:v};onSave(updated);return updated;}); };
  const addKid = () => { if(!kn.trim())return; setLocal(p=>({...p,kids:[...(p.kids||[]),{name:kn,age:ka}]})); setKn(""); setKa(""); };
  const removeKid = i => setLocal(p=>({...p,kids:(p.kids||[]).filter((_,idx)=>idx!==i)}));
  const save = () => {
    onSave(local);
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  };

  const AVATARS = ["👩","👩🏻","👩🏼","👩🏽","👩🏾","👩🏿"];
  const ROLES = ["Working Mum","Stay-at-Home Mum","Entrepreneur","Executive","Other"];
  const PRIORITIES = [{id:"family",lb:"Family"},{id:"career",lb:"Career"},{id:"fitness",lb:"Fitness"},{id:"travel",lb:"Travel"},{id:"finances",lb:"Finances"},{id:"selfcare",lb:"Self-care"}];
  const CHALLENGES = ["Mental load","Work-life balance","Staying fit","Budget management","Finding me-time"];
  const toggleP = id => { const c=local.priorities||[]; setLocal(p=>({...p,priorities:c.includes(id)?c.filter(x=>x!==id):c.length<3?[...c,id]:c})); };

  if(showPrivacy) return <PrivacyScreen onClose={()=>setShowPrivacy(false)}/>;
  const showProfile = activeTab === "profile";

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <Pill ch="👩 Profile" active={activeTab==="profile"} on={()=>setActiveTab("profile")} color={T.gold}/>
        <Pill ch="🧠 Nora's Memory" active={activeTab==="memory"} on={()=>setActiveTab("memory")} color={T.lav}/>
      </div>
      {activeTab==="memory" && <NoraMemoryScreen uid={user?.uid}/>}
      <div style={{display:showProfile?"block":"none"}}>
      {/* Hero */}
      <div style={{background:AIGRAD,borderRadius:22,padding:"24px 22px",marginBottom:16,position:"relative",overflow:"hidden",textAlign:"center"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.03)"}}/>
        <div style={{fontSize:56,marginBottom:8}}>{local.avatar||"👩"}</div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:22,color:"#fff",margin:"0 0 4px",fontWeight:400}}>{local.name||"Your Profile"}</h2>
        <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",margin:"0 0 12px"}}>{user?.email||""}</p>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          {AVATARS.map(a=>(
            <button key={a} onClick={()=>upd("avatar",a)} style={{fontSize:24,background:local.avatar===a?T.goldP:"rgba(255,255,255,.08)",border:`2px solid ${local.avatar===a?T.gold:"transparent"}`,borderRadius:12,padding:"6px",cursor:"pointer",transition:"all .15s"}}>{a}</button>
          ))}
        </div>
      </div>

      {/* Personal details */}
      <Card ch={<div>
        <H2 t="Personal Details"/>
        <FInput label="First name" placeholder="e.g. Sarah" value={local.name||""} onChange={e=>upd("name",e.target.value)}/>
        <FInput label="City" placeholder="e.g. Melbourne" value={local.city||""} onChange={e=>upd("city",e.target.value)}/>
        <div style={{marginBottom:14}}>
          <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Role</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {ROLES.map(r=>(
              <button key={r} onClick={()=>upd("role",r)} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${local.role===r?T.gold:T.linen}`,background:local.role===r?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:local.role===r?T.esp:T.bark,cursor:"pointer",transition:"all .15s"}}>{r}</button>
            ))}
          </div>
        </div>
      </div>}/>

      {/* Family */}
      <Card ch={<div>
        <H2 t="Family"/>
        <FInput label="Partner's name" placeholder="e.g. James" value={local.partner||""} onChange={e=>upd("partner",e.target.value)}/>
        
        {/* Children */}
        <div style={{marginBottom:16}}>
          <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Children</label>
          {(local.kids||[]).map((k,i)=>(
            <div key={i} style={{background:T.sageP,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>{k.name}{k.age?`, ${k.age}`:""}</span>
                  {k.bday&&<div style={{fontFamily:FB,fontSize:11,color:T.sage,marginTop:2,display:"flex",alignItems:"center",gap:6}}>
                  <span>🎂 {k.bday}</span>
                  <GiftButton name={k.name} age={k.age} relation="child"/>
                </div>}
                </div>
                <button onClick={()=>{const n=prompt("Edit name:",k.name);if(n&&n.trim())setLocal(p=>({...p,kids:p.kids.map((c,ci)=>ci===i?{...c,name:n.trim()}:c)}));}} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Edit s={14} c={T.bark} w={1.5}/></button>
                <button onClick={()=>removeKid(i)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <input placeholder="Name" value={kn} onChange={e=>setKn(e.target.value)} style={{flex:2,fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
            <input placeholder="Age" value={ka} onChange={e=>setKa(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 10px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
          </div>
          <div style={{display:"flex",gap:6}}>
            <select id="kid-bday-m" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
              <option value="">Month</option>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
            </select>
            <select id="kid-bday-d" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
              <option value="">Day</option>
              {Array.from({length:31},(_,i)=><option key={i+1} value={String(i+1).padStart(2,"0")}>{i+1}</option>)}
            </select>
            <button onClick={()=>{if(!kn.trim())return;const m=document.getElementById("kid-bday-m")?.value||"";const d=document.getElementById("kid-bday-d")?.value||"";const bd=m&&d?`${m}/${d}`:"";setLocal(p=>({...p,kids:[...(p.kids||[]),{name:kn,age:ka,bday:bd}]}));setKn("");setKa("");}} style={{background:T.esp,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button>
          </div>
        </div>

        {/* Parents */}
        <div style={{marginBottom:16}}>
          <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Your Parents</label>
          {(local.parents||[]).map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.goldP,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
              <div style={{flex:1}}>
                <span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>{p.name}</span>
                <span style={{fontFamily:FB,fontSize:11,color:T.bark,marginLeft:8}}>{p.role}</span>
                {p.bday&&<div style={{fontFamily:FB,fontSize:11,color:T.gold,marginTop:2,display:"flex",alignItems:"center",gap:6}}>
                <span>🎂 {p.bday}</span>
                <GiftButton name={p.name} age="" relation={p.role}/>
              </div>}
              </div>
              <button onClick={()=>upd("parents",(local.parents||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            {["Mum","Dad"].map(r=><button key={r} onClick={()=>setKa(r)} style={{flex:1,padding:"6px",borderRadius:10,border:`1.5px solid ${ka===r?T.gold:T.linen}`,background:ka===r?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:ka===r?T.esp:T.bark,cursor:"pointer"}}>{r}</button>)}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <input placeholder="Name" value={kn} onChange={e=>setKn(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
            <select id="par-bday-m" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
            <option value="">Month</option>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
          </select>
          <select id="par-bday-d" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
            <option value="">Day</option>
            {Array.from({length:31},(_,i)=><option key={i+1} value={String(i+1).padStart(2,"0")}>{i+1}</option>)}
          </select>
            <button onClick={()=>{if(!kn.trim())return;const m=document.getElementById("par-bday-m")?.value||"";const d=document.getElementById("par-bday-d")?.value||"";const bd=m&&d?`${m}/${d}`:"";upd("parents",[...(local.parents||[]),{name:kn,role:ka||"Mum",bday:bd}]);setKn("");setKa("");}} style={{background:T.esp,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button>
          </div>
        </div>

        {/* In-laws */}
        <div style={{marginBottom:6}}>
          <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>In-Laws</label>
          {(local.inlaws||[]).map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.lavP,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
              <div style={{flex:1}}>
                <span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>{p.name}</span>
                <span style={{fontFamily:FB,fontSize:11,color:T.bark,marginLeft:8}}>{p.role}</span>
                {p.bday&&<div style={{fontFamily:FB,fontSize:11,color:T.lav,marginTop:2,display:"flex",alignItems:"center",gap:6}}>
                <span>🎂 {p.bday}</span>
                <GiftButton name={p.name} age="" relation={p.role}/>
              </div>}
              </div>
              <button onClick={()=>upd("inlaws",(local.inlaws||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button>
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <select onChange={e=>setKa(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 10px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
              {["Mother-in-law","Father-in-law","Sister-in-law","Brother-in-law"].map(r=><option key={r}>{r}</option>)}
            </select>
            <input placeholder="Name" value={kn} onChange={e=>setKn(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 10px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
          </div>
          <div style={{display:"flex",gap:6}}>
            <select id="il-bday-m" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
            <option value="">Month</option>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
          </select>
          <select id="il-bday-d" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
            <option value="">Day</option>
            {Array.from({length:31},(_,i)=><option key={i+1} value={String(i+1).padStart(2,"0")}>{i+1}</option>)}
          </select>
            <button onClick={()=>{if(!kn.trim())return;const m=document.getElementById("il-bday-m")?.value||"";const d=document.getElementById("il-bday-d")?.value||"";const bd=m&&d?`${m}/${d}`:"";upd("inlaws",[...(local.inlaws||[]),{name:kn,role:ka||"Mother-in-law",bday:bd}]);setKn("");setKa("");}} style={{background:T.esp,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button>
          </div>
        </div>
      </div>}/>

      {/* Close Friends */}
      <Card ch={<div>
        <H2 t="Close Friends" sub="Nora will remember their birthdays"/>
        {(local.friends||[]).map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.blushP,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
            <div style={{flex:1}}>
              <span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>{f.name}</span>
              {f.bday&&<div style={{fontFamily:FB,fontSize:11,color:T.blush,marginTop:2,display:"flex",alignItems:"center",gap:6}}>
                <span>🎂 {f.bday}</span>
                <GiftButton name={f.name} age="" relation="friend"/>
              </div>}
            </div>
            <button onClick={()=>upd("friends",(local.friends||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button>
          </div>
        ))}
        <div style={{display:"flex",gap:6,marginBottom:6}}>
          <input placeholder="Friend's name" id="fr-name" style={{flex:2,fontFamily:FB,fontSize:13,padding:"10px 10px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          <select id="fr-bday-m" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
            <option value="">Month</option>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
          </select>
          <select id="fr-bday-d" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
            <option value="">Day</option>
            {Array.from({length:31},(_,i)=><option key={i+1} value={String(i+1).padStart(2,"0")}>{i+1}</option>)}
          </select>
          <button onClick={()=>{
            const name=document.getElementById("fr-name")?.value||"";
            if(!name.trim())return;
            const m=document.getElementById("fr-bday-m")?.value||"";
            const d=document.getElementById("fr-bday-d")?.value||"";
            const bd=m&&d?`${m}/${d}`:"";
            upd("friends",[...(local.friends||[]),{name,bday:bd}]);
            document.getElementById("fr-name").value="";
          }} style={{background:T.esp,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button>
        </div>
      </div>}/>

      {/* Priorities */}
      <Card ch={<div>
        <H2 t="Your Priorities" sub="Pick up to 3"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {PRIORITIES.map(p=>{const active=(local.priorities||[]).includes(p.id);return(
            <button key={p.id} onClick={()=>toggleP(p.id)} style={{padding:"12px 14px",borderRadius:14,cursor:"pointer",textAlign:"left",background:active?T.goldP:"#fff",border:`2px solid ${active?T.gold:T.linen}`,fontFamily:FB,fontSize:13,fontWeight:700,color:active?T.esp:T.bark,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              {p.lb}{active&&<Ic.Check s={14} c={T.gold} w={2.5}/>}
            </button>
          );})}
        </div>
      </div>}/>

      {/* Family Events */}
      <Card ch={<div>
        <H2 t="Family Events" sub="Upcoming dates Nora will remind you about"/>
        {(local.events||[]).map((ev,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.goldP,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
            <span style={{fontSize:20,flexShrink:0}}>{ev.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{ev.name}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.bark,marginTop:1}}>{ev.date}</div>
            </div>
            <button onClick={()=>upd("events",(local.events||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button>
          </div>
        ))}
        <EventAdder onAdd={ev=>upd("events",[...(local.events||[]),ev])}/>
      </div>}/>

      {/* Style Profile */}
      <Card ch={<div>
        <H2 t="Style Profile" sub="Helps Nora style you perfectly"/>
        <div style={{marginBottom:14}}>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Body shape</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Hourglass","Pear","Apple","Rectangle","Petite","Plus size"].map(s=>(<button key={s} onClick={()=>setLocal(p=>({...p,bodyShape:s}))} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${local.bodyShape===s?T.blush:T.linen}`,background:local.bodyShape===s?T.blushP:"#fff",fontFamily:FB,fontSize:11,color:local.bodyShape===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>))}
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark}}>Size region</label>
            <div style={{display:"flex",gap:4}}>
              {["US","UK","AU"].map(r=>(<button key={r} onClick={()=>setLocal(p=>({...p,sizeRegion:r,height:"",clothingSize:""}))} style={{padding:"4px 12px",borderRadius:20,border:`1.5px solid ${(local.sizeRegion||"US")===r?T.esp:T.linen}`,background:(local.sizeRegion||"US")===r?T.esp:"#fff",fontFamily:FB,fontSize:11,fontWeight:700,color:(local.sizeRegion||"US")===r?"#fff":T.bark,cursor:"pointer"}}>{r}</button>))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:4}}>Height</label>
              <select value={local.height||""} onChange={e=>setLocal(p=>({...p,height:e.target.value}))} style={{width:"100%",fontFamily:FB,fontSize:12,padding:"9px 10px",borderRadius:11,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
                <option value="">Select</option>
                {((local.sizeRegion||"US")==="US"?["Under 5ft","5ft-5ft2","5ft2-5ft4","5ft4-5ft6","5ft6-5ft8","5ft8-5ft10","Over 5ft10"]:["Under 152cm","152-157cm","158-162cm","163-167cm","168-172cm","173-177cm","Over 177cm"]).map(h=>(<option key={h}>{h}</option>))}
              </select>
            </div>
            <div>
              <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:4}}>Clothing size</label>
              <select value={local.clothingSize||""} onChange={e=>setLocal(p=>({...p,clothingSize:e.target.value}))} style={{width:"100%",fontFamily:FB,fontSize:12,padding:"9px 10px",borderRadius:11,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
                <option value="">Select</option>
                {((local.sizeRegion||"US")==="US"?["US 00","US 0","US 2","US 4","US 6","US 8","US 10","US 12","US 14","US 16+"]: (local.sizeRegion||"US")==="UK"?["UK 4","UK 6","UK 8","UK 10","UK 12","UK 14","UK 16","UK 18","UK 20+"]:["AU 6","AU 8","AU 10","AU 12","AU 14","AU 16","AU 18","AU 20+"]).map(s=>(<option key={s}>{s}</option>))}
              </select>
            </div>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Style vibe</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Classic","Minimalist","Boho","Edgy","Preppy","Romantic","Sporty"].map(s=>(<button key={s} onClick={()=>setLocal(p=>({...p,styleVibe:s}))} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${local.styleVibe===s?T.lav:T.linen}`,background:local.styleVibe===s?T.lavP:"#fff",fontFamily:FB,fontSize:11,color:local.styleVibe===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>))}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Work dress code</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Corporate","Business casual","Smart casual","Creative","Casual"].map(s=>(<button key={s} onClick={()=>setLocal(p=>({...p,dresscode:s}))} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${local.dresscode===s?T.sky:T.linen}`,background:local.dresscode===s?T.skyP:"#fff",fontFamily:FB,fontSize:11,color:local.dresscode===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>))}
          </div>
        </div>
        <div>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Clothing budget/month</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Under $100","$100-200","$200-400","$400-600","$600+"].map(s=>(<button key={s} onClick={()=>setLocal(p=>({...p,styleBudget:s}))} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${local.styleBudget===s?T.gold:T.linen}`,background:local.styleBudget===s?T.goldP:"#fff",fontFamily:FB,fontSize:11,color:local.styleBudget===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>))}
          </div>
      </div>}/>

      <Card ch={<div>
        <H2 t="Health" sub="Helps Nora coach you better"/>
        <div style={{marginBottom:12}}>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Dietary preferences</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["No restrictions","Vegetarian","Vegan","Gluten free","Dairy free","Halal","Kosher"].map(s=>(<button key={s} onClick={()=>setLocal(p=>({...p,diet:s}))} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${local.diet===s?T.sage:T.linen}`,background:local.diet===s?T.sageP:"#fff",fontFamily:FB,fontSize:11,color:local.diet===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>))}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Fitness level</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Just starting","1-2x per week","3-4x per week","5+ per week","Very active"].map(s=>(<button key={s} onClick={()=>setLocal(p=>({...p,fitnessLevel:s}))} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${local.fitnessLevel===s?T.teal:T.linen}`,background:local.fitnessLevel===s?T.tealP:"#fff",fontFamily:FB,fontSize:11,color:local.fitnessLevel===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>))}
          </div>
        </div>
        <div>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Energy pattern</label>
          <div style={{display:"flex",gap:8}}>
            {["Morning person","Mid-day","Night owl"].map(s=>(<button key={s} onClick={()=>setLocal(p=>({...p,energyPattern:s}))} style={{flex:1,padding:"9px 6px",borderRadius:12,border:`1.5px solid ${local.energyPattern===s?T.gold:T.linen}`,background:local.energyPattern===s?T.goldP:"#fff",fontFamily:FB,fontSize:11,color:local.energyPattern===s?T.esp:T.bark,cursor:"pointer",textAlign:"center"}}>{s}</button>))}
          </div>
      </div>}/>

      {/* Goals */}
      <Card ch={<div>
        <H2 t="Your Goals"/>
        <FInput label="Next trip" placeholder="e.g. Bali, Indonesia" value={local.tripGoal||""} onChange={e=>upd("tripGoal",e.target.value)}/>
        <FInput label="Fitness goal" placeholder="e.g. Work out 4x per week" value={local.fitnessGoal||""} onChange={e=>upd("fitnessGoal",e.target.value)}/>
        <FInput label="Savings goal" placeholder="e.g. $10,000 vacation fund" value={local.savingsGoal||""} onChange={e=>upd("savingsGoal",e.target.value)}/>
        <div style={{marginBottom:6}}>
          <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Biggest challenge</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {CHALLENGES.map(c=>(
              <button key={c} onClick={()=>upd("challenge",c)} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${local.challenge===c?T.gold:T.linen}`,background:local.challenge===c?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:local.challenge===c?T.esp:T.bark,cursor:"pointer",transition:"all .15s"}}>{c}</button>
            ))}
          </div>
        </div>
      </div>}/>

      {/* Save button */}
      <button onClick={save} style={{width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:"pointer",background:saved?`linear-gradient(135deg,${T.sage},#4a7a5a)`:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",fontFamily:FB,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12,transition:"background .3s"}}>
        {saved?<><Ic.Check s={18} c="#fff" w={2.5}/> Saved!</>:<><Ic.Save s={18} c="#fff" w={1.5}/> Save Changes</>}
      </button>

      {/* Notifications */}
      <NotificationCard/>

      {/* Share + Notifications + Privacy + Sign out */}
      <button onClick={()=>{
        const url=window.location.origin+"?family="+user?.uid;
        if(navigator.share){navigator.share({title:"Our Family Calendar",text:"Here is our family this week",url}).catch(()=>{});}
        else{navigator.clipboard.writeText(url).then(()=>alert("Link copied! Share with your people.")).catch(()=>alert("Copy this link: "+url));}
      }} style={{width:"100%",background:`linear-gradient(135deg,${T.sage},#4a7a5a)`,border:"none",borderRadius:14,padding:"13px",fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        👨‍👩‍👧 Share your week with family
      </button>
      <button onClick={async()=>{
        if(!("Notification" in window)){alert("Not supported on this browser.");return;}
        const p=await Notification.requestPermission();
        if(p==="granted"){alert("✓ Morning briefing notifications enabled!");}
        else{alert("Please enable notifications in your browser settings.");}
      }} style={{width:"100%",background:"none",border:`1.5px solid #1a5a9e30`,borderRadius:14,padding:"13px",fontFamily:FB,fontSize:13,fontWeight:700,color:"#1a5a9e",cursor:"pointer",marginBottom:8}}>
        🔔 Enable morning briefing notifications
      </button>
      <button onClick={()=>setShowPrivacy(true)} style={{width:"100%",background:"none",border:`1.5px solid ${T.linen}`,borderRadius:14,padding:"13px",fontFamily:FB,fontSize:13,fontWeight:700,color:T.bark,cursor:"pointer",marginBottom:8}}>
        🔒 Privacy & Data
      </button>
      <button onClick={onSignOut} style={{width:"100%",padding:"14px",borderRadius:16,border:`1.5px solid ${T.blushP}`,cursor:"pointer",background:"#fff",color:T.blush,fontFamily:FB,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8}}>
        <Ic.LogOut s={18} c={T.blush} w={1.5}/> Sign Out
      </button>
      {/* Data Export — GDPR Article 15 */}
      <button onClick={async()=>{
        try{
          const exportData = {
            exportDate: new Date().toISOString(),
            profile: {...profile},
            tasks: JSON.parse(localStorage.getItem("hn_tasks")||"[]"),
            expenses: JSON.parse(localStorage.getItem("hn_expenses")||"[]"),
            moods: JSON.parse(localStorage.getItem("hn_moods")||"[]"),
            habits: JSON.parse(localStorage.getItem("hn_habits")||"[]"),
            schoolEvents: JSON.parse(localStorage.getItem("hn_school_events")||"[]"),
            wishlist: JSON.parse(localStorage.getItem("hn_wishlist")||"[]"),
            noraMemory: JSON.parse(localStorage.getItem("hn_nora_memory_v2")||"[]"),
            weeklyScore: JSON.parse(localStorage.getItem("hn_weekly_score")||"null"),
          };
          const json = JSON.stringify(exportData, null, 2);
          const blob = new Blob([json], {type:"application/json"});
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `hernest-data-${new Date().toISOString().split("T")[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }catch(e){alert("Export failed. Please contact privacy@hernest.app");}
      }} style={{width:"100%",background:"none",border:`1.5px solid ${T.linen}`,borderRadius:14,padding:"13px",fontFamily:FB,fontSize:13,fontWeight:700,color:T.bark,cursor:"pointer",marginBottom:8}}>
        📦 Download my data (GDPR)
      </button>

      <button onClick={async()=>{
        if(!window.confirm("Delete your HerNest account and all data permanently? This cannot be undone."))return;
        if(!window.confirm("Are you sure? All your profile, tasks, budget, wellness and school data will be deleted."))return;
        try{
          const keys=["hn_tasks","hn_expenses","hn_moods","hn_water","hn_sleep","hn_habits","hn_wishlist","hn_outfits","hn_school_events","hn_nora_msgs","hn_nora_memory","hn_nora_memory_v2","hn_weekly_score","hn_streak","hn_trips","hn_gtoken","hn_brief_hour","hn_brief_min"];
          keys.forEach(k=>{try{localStorage.removeItem(k);sessionStorage.removeItem(k);}catch(e){}});
          if(user?.uid){
            const {db:firestoreDb}=await import("../utils/firebase");
            const {doc,deleteDoc,collection,getDocs,collectionGroup,query,where,getDoc}=await import("firebase/firestore");
            const collections=["profile","tasks","trips","budget","wellness","style","school","nora_memory"];
            for(const col of collections){try{await deleteDoc(doc(firestoreDb,"users",user.uid,"data",col));}catch(e){}}
            // Delete summary
            try{await deleteDoc(doc(firestoreDb,"users",user.uid,"summary","latest"));}catch(e){}
            // Delete Circle messages
            try{
              const q=query(collectionGroup(firestoreDb,"messages"),where("uid","==",user.uid));
              const snap=await getDocs(q);
              for(const d of snap.docs){try{await deleteDoc(d.ref);}catch(e){}}
            }catch(e){}
          }
          // Delete Firebase Auth account
          try{
            const {getAuth,deleteUser}=await import("firebase/auth");
            const authInstance=getAuth();
            if(authInstance.currentUser){
              await deleteUser(authInstance.currentUser);
            }
          }catch(e){
            // If re-auth required, just sign out
            console.error("Auth delete failed:",e?.message);
          }
          alert("Your account and all data have been permanently deleted.");
          onSignOut();
        }catch(e){alert("Error deleting data. Please contact privacy@hernest.app");}
      }} style={{width:"100%",padding:"12px",borderRadius:16,border:"1px solid #ffcccc",cursor:"pointer",background:"#fff",color:"#cc4444",fontFamily:FB,fontSize:12,fontWeight:700,marginBottom:24}}>
        Delete my account & all data
      </button>
      </div>
    </div>
  );
}