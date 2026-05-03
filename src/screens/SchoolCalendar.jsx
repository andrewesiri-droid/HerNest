import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude, claudeVision } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function SchoolCalendar({profile,uid}){
  const [schoolEvents,setSchoolEvents]=useState(()=>{
    try{const s=localStorage.getItem("hn_school_events");return s?JSON.parse(s):[];}catch(e){return [];}
  });
  const [uploading,setUploading]=useState(false);
  const [showUpload,setShowUpload]=useState(false);
  const [pasteText,setPasteText]=useState("");
  const [showPaste,setShowPaste]=useState(false);
  const [selectedChild,setSelectedChild]=useState("");
  const [insight,setInsight]=useState("");
  const [filter,setFilter]=useState("All");

  const kids=(profile?.kids||[]).map(k=>k.name);

  const saveEvents=(events)=>{
    setSchoolEvents(events);
    try{localStorage.setItem("hn_school_events",JSON.stringify(events));}catch(e){ /* silent */ }
    if(uid)saveData(uid,"school",{events}).catch(()=>{});
  };

  useEffect(()=>{
    if(uid)loadData(uid,"school").then(d=>{if(d?.events?.length)setSchoolEvents(d.events);}).catch(()=>{});
  },[uid]);

  const processCalendar=async(text,child)=>{
    setUploading(true);
    const kidName=child||selectedChild||kids[0]||"your child";
    const sys=`You are a school calendar AI. Extract ALL school events from the text. Return ONLY valid JSON: {"events":[{"title":"","date":"YYYY-MM-DD","type":"holiday|early_dismissal|parent_meeting|exam|trip|performance|sport|closure|academic|other","priority":"critical|medium|low","requiresAction":true,"prep":"brief prep tip or empty string","child":"${kidName}"}],"insight":"one warm sentence about what this school year looks like"}. If year is missing assume ${new Date().getFullYear()}. Extract every event you can find.`;
    const prompt=`Extract all school events from this calendar text for ${kidName}:

${text.slice(0,4000)}`;
    try{
      const raw=await claude(sys,prompt);
      const data=JSON.parse(raw.replace(/```json|```/g,"").trim());
      if(data.events?.length){
        const newEvents=[...schoolEvents,...data.events].sort((a,b)=>new Date(a.date)-new Date(b.date));
        saveEvents(newEvents);
        if(data.insight)setInsight(data.insight);
      }
    }catch(e){ /* silent */ }
    setUploading(false);
    setShowUpload(false);
    setShowPaste(false);
    setPasteText("");
  };

  const processImage=async(base64,mediaType,child)=>{
    setUploading(true);
    const kidName=child||selectedChild||kids[0]||"your child";
    try{
      const prompt=`Extract all school calendar events for ${kidName}. Return ONLY valid JSON: {"events":[{"title":"","date":"YYYY-MM-DD","type":"holiday|early_dismissal|parent_meeting|exam|trip|performance|sport|closure|academic|other","priority":"critical|medium|low","requiresAction":true,"prep":"brief prep tip","child":"${kidName}"}],"insight":"one warm sentence about this school year"}. Assume year ${new Date().getFullYear()} if missing.`;
      const text=await claudeVision(base64,mediaType,prompt);
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      if(parsed.events?.length){
        const newEvents=[...schoolEvents,...parsed.events].sort((a,b)=>new Date(a.date)-new Date(b.date));
        saveEvents(newEvents);
        if(parsed.insight)setInsight(parsed.insight);
      }
    }catch(e){ /* silent */ }
    setUploading(false);
    setShowUpload(false);
  };

  const today=new Date();
  const upcoming=schoolEvents.filter(e=>new Date(e.date)>=today);
  const filteredEvents=filter==="All"?upcoming:upcoming.filter(e=>e.child===filter||e.type===filter);
  const thisWeek=upcoming.filter(e=>{const d=new Date(e.date);const diff=(d-today)/(1000*60*60*24);return diff<=7;});
  const urgent=upcoming.filter(e=>e.requiresAction&&(new Date(e.date)-today)/(1000*60*60*24)<=14);

  const TYPE_COLORS={holiday:T.sage,early_dismissal:T.gold,parent_meeting:T.blush,exam:T.lav,trip:T.teal,performance:T.sky,sport:T.bark,closure:T.taupe,academic:T.esp,other:T.bark};
  const TYPE_EMOJI={holiday:"🏖️",early_dismissal:"⏰",parent_meeting:"👥",exam:"📝",trip:"🚌",performance:"🎭",sport:"⚽",closure:"🔒",academic:"📚",other:"📅"};

  const formatDate=(dateStr)=>{
    const d=new Date(dateStr);
    return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
  };

  const daysUntil=(dateStr)=>{
    const diff=Math.ceil((new Date(dateStr)-today)/(1000*60*60*24));
    if(diff===0)return "Today";
    if(diff===1)return "Tomorrow";
    if(diff<=7)return `${diff} days`;
    return formatDate(dateStr);
  };

  return(
    <div style={{marginBottom:16}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#1a3a6e,#1a5a9e)",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plan s={16} c="#fff" w={1.5}/></div>
          <div>
            <div style={{fontFamily:FD,fontSize:17,fontWeight:600,color:T.esp,fontStyle:"italic"}}>School Calendar</div>
            <div style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{schoolEvents.length>0?`${upcoming.length} upcoming events`:"Nora will manage your school year"}</div>
          </div>
        </div>
        <button onClick={()=>setShowUpload(!showUpload)} style={{background:"linear-gradient(135deg,#1a3a6e,#1a5a9e)",border:"none",borderRadius:12,padding:"7px 14px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer"}}>
          {schoolEvents.length>0?"+ Add":"Set up 🎒"}
        </button>
      </div>

      {/* Nora insight */}
      {insight&&<div style={{background:"linear-gradient(135deg,#1a3a6e11,#1a5a9e11)",borderRadius:14,padding:"10px 14px",marginBottom:12,borderLeft:"3px solid #1a5a9e"}}>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:13,color:T.esp,margin:0,lineHeight:1.6}}>"{insight}"</p>
      </div>}

      {/* Upload panel */}
      {showUpload&&<div style={{background:"#fff",borderRadius:16,padding:"16px",marginBottom:12,border:`1.5px solid #1a5a9e30`,boxShadow:"0 4px 20px rgba(0,0,0,.08)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>🎒 Add school calendar</span>
          <button onClick={()=>{setShowUpload(false);setShowPaste(false);}} style={{background:"none",border:"none",cursor:"pointer"}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
        </div>

        {/* Child selector */}
        {kids.length>0&&<div style={{marginBottom:12}}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:6}}>Which child?</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {kids.map(k=><button key={k} onClick={()=>setSelectedChild(k)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${selectedChild===k?"#1a5a9e":T.linen}`,background:selectedChild===k?"#1a5a9e11":"#fff",fontFamily:FB,fontSize:11,fontWeight:selectedChild===k?700:400,color:selectedChild===k?"#1a3a6e":T.bark,cursor:"pointer"}}>{k}</button>)}
            <button onClick={()=>setSelectedChild("All")} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${selectedChild==="All"?"#1a5a9e":T.linen}`,background:selectedChild==="All"?"#1a5a9e11":"#fff",fontFamily:FB,fontSize:11,color:T.bark,cursor:"pointer"}}>All kids</button>
          </div>
        </div>}

        {/* Upload options */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div>
            <input type="file" accept="image/*,.pdf" id="school-img" onChange={async e=>{
              const file=e.target.files?.[0];if(!file)return;
              const reader=new FileReader();
              reader.onload=async ev=>{
                const base64=ev.target.result.split(",")[1];
                await processImage(base64,file.type,selectedChild);
              };
              reader.readAsDataURL(file);
            }} style={{display:"none"}}/>
            <label htmlFor="school-img" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"linear-gradient(135deg,#1a3a6e,#1a5a9e)",borderRadius:12,padding:"14px 10px",cursor:"pointer",textAlign:"center"}}>
              <span style={{fontSize:22}}>📷</span>
              <span style={{fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff"}}>{uploading?"Reading...":"Photo / PDF"}</span>
              <span style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.6)"}}>School newsletter</span>
            </label>
          </div>
          <button onClick={()=>setShowPaste(!showPaste)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:T.sand,borderRadius:12,padding:"14px 10px",border:`1.5px solid ${T.linen}`,cursor:"pointer"}}>
            <span style={{fontSize:22}}>📋</span>
            <span style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.esp}}>Paste text</span>
            <span style={{fontFamily:FB,fontSize:9,color:T.taupe}}>Copy & paste calendar</span>
          </button>
        </div>

        {showPaste&&<div>
          <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder="Paste your school calendar text here — dates, events, holidays, anything Nora can read..." style={{width:"100%",height:100,fontFamily:FB,fontSize:12,padding:"10px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp,resize:"none"}}/>
          <button onClick={()=>processCalendar(pasteText,selectedChild)} disabled={!pasteText.trim()||uploading} style={{width:"100%",background:pasteText.trim()?"linear-gradient(135deg,#1a3a6e,#1a5a9e)":T.linen,border:"none",borderRadius:10,padding:"10px",fontFamily:FB,fontSize:12,fontWeight:700,color:pasteText.trim()?"#fff":T.taupe,cursor:"pointer",marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {uploading?<><Spinner/>Nora is reading...</>:"✨ Let Nora extract events"}
          </button>
        </div>}
      </div>}

      {/* Empty state */}
      {schoolEvents.length===0&&!showUpload&&<div onClick={()=>setShowUpload(true)} style={{background:T.sand,borderRadius:16,padding:"20px",textAlign:"center",cursor:"pointer",border:`1.5px dashed ${T.linen}`}}>
        <div style={{fontSize:32,marginBottom:8}}>🎒</div>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:15,color:T.esp,margin:"0 0 4px"}}>Set up your school year</p>
        <p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:0}}>Upload a photo or paste your school calendar — Nora handles the rest</p>
      </div>}

      {/* This week alerts */}
      {thisWeek.length>0&&<div style={{marginBottom:10}}>
        <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:T.blush,display:"inline-block"}}/>This week
        </div>
        {thisWeek.map((e,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",borderRadius:12,padding:"10px 12px",marginBottom:6,border:`1px solid ${T.linen}`,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
            <span style={{fontSize:18,flexShrink:0}}>{TYPE_EMOJI[e.type]||"📅"}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.title}</div>
              <div style={{display:"flex",gap:6,marginTop:2,alignItems:"center"}}>
                {e.child&&e.child!=="All"&&<span style={{fontFamily:FB,fontSize:9,color:"#1a5a9e",background:"#1a5a9e11",borderRadius:20,padding:"1px 6px"}}>{e.child}</span>}
                <span style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{daysUntil(e.date)}</span>
              </div>
            </div>
            {e.requiresAction&&<span style={{fontFamily:FB,fontSize:9,fontWeight:700,color:T.blush,background:T.blushP,borderRadius:20,padding:"2px 7px",flexShrink:0}}>Action</span>}
          </div>
        ))}
      </div>}

      {/* Child filter */}
      {schoolEvents.length>0&&kids.length>1&&<div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        {["All",...kids].map(k=><button key={k} onClick={()=>setFilter(k)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${filter===k?"#1a5a9e":T.linen}`,background:filter===k?"#1a5a9e":"#fff",fontFamily:FB,fontSize:10,fontWeight:700,color:filter===k?"#fff":T.bark,cursor:"pointer"}}>{k}</button>)}
      </div>}

      {/* All upcoming events */}
      {filteredEvents.length>0&&<div>
        <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:8}}>Upcoming</div>
        {filteredEvents.slice(0,8).map((e,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<Math.min(filteredEvents.length,8)-1?`1px solid ${T.linen}`:"none"}}>
            <div style={{width:36,height:36,borderRadius:10,background:(TYPE_COLORS[e.type]||T.bark)+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>{TYPE_EMOJI[e.type]||"📅"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:FB,fontSize:12,fontWeight:600,color:T.esp,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.title}</div>
              <div style={{display:"flex",gap:6,marginTop:2}}>
                <span style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{formatDate(e.date)}</span>
                {e.prep&&<span style={{fontFamily:FB,fontSize:10,color:T.sage,fontStyle:"italic"}}>· {e.prep}</span>}
              </div>
            </div>
            {e.child&&e.child!=="All"&&kids.length>1&&<span style={{fontFamily:FB,fontSize:9,color:"#1a5a9e",background:"#1a5a9e11",borderRadius:20,padding:"2px 7px",flexShrink:0}}>{e.child}</span>}
          </div>
        ))}
        {filteredEvents.length>8&&<button onClick={()=>{}} style={{width:"100%",background:"none",border:"none",fontFamily:FB,fontSize:11,color:T.taupe,cursor:"pointer",padding:"8px 0"}}>+{filteredEvents.length-8} more events</button>}
      </div>}

      {/* Clear button */}
      {schoolEvents.length>0&&<button onClick={()=>{if(window.confirm("Clear all school events?"))saveEvents([]);}} style={{marginTop:10,background:"none",border:"none",fontFamily:FB,fontSize:10,color:T.taupe,cursor:"pointer",textDecoration:"underline"}}>Clear all events</button>}
    </div>
  );
}
