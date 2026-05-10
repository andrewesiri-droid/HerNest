import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function NotificationCard(){
  const [status,setStatus]=useState(()=>{
    if(!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });
  const [hour,setHour]=useState(()=>parseInt(localStorage.getItem("hn_brief_hour")||"7"));
  const [minute,setMinute]=useState(()=>parseInt(localStorage.getItem("hn_brief_min")||"0"));
  const [scheduling,setScheduling]=useState(false);
  const [scheduled,setScheduled]=useState(false);
  const [timeSaved,setTimeSaved]=useState(false);

  const HOURS=Array.from({length:24},(_,i)=>i);
  const MINUTES=[0,15,30,45];

  const saveTime=(h,m)=>{
    setHour(h);setMinute(m);
    localStorage.setItem("hn_brief_hour",String(h));
    localStorage.setItem("hn_brief_min",String(m));
    setTimeSaved(true);setTimeout(()=>setTimeSaved(false),2000);
  };

  const enable=async()=>{
    if(!("Notification" in window)){setStatus("unsupported");return;}
    const perm=await Notification.requestPermission();
    setStatus(perm);
    if(perm==="granted"){
      setTimeout(()=>{
        new Notification("HerNest ✨",{
          body:`Morning briefings enabled! Nora will greet you at ${hour}:${String(minute).padStart(2,"0")} every morning. 💛`,
          icon:"/icon.png",
          tag:"hernest-welcome"
        });
      },500);
    }
  };

  const sendTest=()=>{
    if(Notification.permission!=="granted")return;
    setScheduling(true);
    setTimeout(()=>{
      new Notification("Good morning ☀️",{
        body:"Nora has your daily briefing ready. Tap to see your priorities for today.",
        icon:"/icon.png",
        tag:"hernest-briefing"
      });
      setScheduling(false);setScheduled(true);
      setTimeout(()=>setScheduled(false),3000);
    },1500);
  };

  if(status==="unsupported") return null;

  const fmt=`${hour}:${String(minute).padStart(2,"0")} ${hour<12?"AM":"PM"}`;

  return(
    <Card sx={{background:status==="granted"?T.sageP:T.goldP,border:`1px solid ${status==="granted"?T.sage:T.gold}30`,marginBottom:12}} ch={<div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:44,height:44,borderRadius:13,background:status==="granted"?T.sage:T.gold,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 4px 12px ${status==="granted"?T.sage:T.gold}55`}}>
          <Ic.Bell s={22} c="#fff" w={1.5}/>
        </div>
        <div>
          <div style={{fontFamily:FB,fontSize:14,fontWeight:700,color:T.esp}}>Morning Briefing</div>
          <div style={{fontFamily:FB,fontSize:12,color:T.bark,marginTop:2}}>
            {status==="granted"?`Enabled · ${fmt} daily ✓`:"Get Nora's briefing every morning"}
          </div>
        </div>
      </div>

      {status!=="granted"?(
        <button onClick={enable} style={{width:"100%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none",borderRadius:13,padding:"13px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 16px ${T.gold}44`}}>
          <Ic.Bell s={18} c="#fff" w={1.5}/> Enable Morning Briefing
        </button>
      ):(
        <div>
          <div style={{background:"rgba(255,255,255,.6)",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
            <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:10}}>Briefing Time</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:FB,fontSize:10,color:T.taupe,marginBottom:4}}>Hour</div>
                <select value={hour} onChange={e=>setHour(parseInt(e.target.value))} style={{width:"100%",fontFamily:FB,fontSize:14,fontWeight:700,padding:"8px 10px",borderRadius:10,border:`1.5px solid ${T.sage}`,background:"#fff",color:T.esp,cursor:"pointer"}}>
                  {HOURS.map(h=><option key={h} value={h}>{h===0?"12 AM":h<12?`${h} AM`:h===12?"12 PM":`${h-12} PM`}</option>)}
                </select>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:FB,fontSize:10,color:T.taupe,marginBottom:4}}>Minute</div>
                <select value={minute} onChange={e=>setMinute(parseInt(e.target.value))} style={{width:"100%",fontFamily:FB,fontSize:14,fontWeight:700,padding:"8px 10px",borderRadius:10,border:`1.5px solid ${T.sage}`,background:"#fff",color:T.esp,cursor:"pointer"}}>
                  {MINUTES.map(m=><option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
                </select>
              </div>
            </div>
            <button onClick={()=>saveTime(hour,minute)} style={{width:"100%",background:timeSaved?T.sage:T.esp,color:"#fff",border:"none",borderRadius:10,padding:"9px",fontFamily:FB,fontSize:12,fontWeight:700,cursor:"pointer",transition:"background .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {timeSaved?<><Ic.Check s={13} c="#fff" w={2.5}/>Saved!</>:<>Save Briefing Time</>}
            </button>
          </div>
          <button onClick={sendTest} style={{width:"100%",background:scheduled?"#fff":T.sage,color:scheduled?T.sage:"#fff",border:`1.5px solid ${T.sage}`,borderRadius:12,padding:"11px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}>
            {scheduling?<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/> Sending…</>
            :scheduled?<><Ic.Check s={14} c={T.sage} w={2.5}/> Sent!</>
            :<><Ic.Bell s={16} c="#fff" w={1.5}/> Send Test Notification</>}
          </button>
        </div>
      )}
    </div>}/>
  );
}
