import { EMAILS } from "../config/constants";
import React, { useState } from "react";
import { T, FD, FB } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";

export function SettingsButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Settings"
      style={{position:"fixed",top:16,right:16,zIndex:200,width:38,height:38,borderRadius:"50%",background:"rgba(255,252,248,.95)",backdropFilter:"blur(12px)",border:`1px solid ${T.linen}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 12px rgba(46,31,20,.08)"}}
    >
      <Ic.Settings s={18} c={T.bark} w={1.5}/>
    </button>
  );
}

export function SettingsPanel({ onClose, onSignOut, user, profile }) {
  const [briefHour, setBriefHour]   = useState(() => { try { return localStorage.getItem("hn_brief_hour")||"7"; } catch(e) { return "7"; } });
  const [briefMin, setBriefMin]     = useState(() => { try { return localStorage.getItem("hn_brief_min")||"00"; } catch(e) { return "00"; } });
  const [saved, setSaved]           = useState(false);

  const saveTime = () => {
    try { localStorage.setItem("hn_brief_hour", briefHour); localStorage.setItem("hn_brief_min", briefMin); } catch(e) {}
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const exportData = async () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        profile,
        tasks:       JSON.parse(localStorage.getItem("hn_tasks")||"[]"),
        expenses:    JSON.parse(localStorage.getItem("hn_expenses")||"[]"),
        moods:       JSON.parse(localStorage.getItem("hn_moods")||"[]"),
        noraMemory:  JSON.parse(localStorage.getItem("hn_nora_memory_v2")||"[]"),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `hernest-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch(e) { alert("Export failed. Please contact privacy@hernest.app"); }
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",flexDirection:"column"}}>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",backdropFilter:"blur(4px)"}}/>

      {/* Bottom Sheet */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,maxHeight:"85vh",background:T.cream,borderRadius:"24px 24px 0 0",overflowY:"auto",animation:"slideFromBottom .3s ease both",boxShadow:"0 -8px 40px rgba(0,0,0,.15)"}}>
        <style>{`@keyframes slideFromBottom{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        {/* Pull handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}>
          <div style={{width:36,height:4,borderRadius:2,background:T.linen}}/>
        </div>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 20px 16px",borderBottom:`1px solid ${T.linen}`}}>
          <div>
            <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:22,color:T.esp,margin:0,fontWeight:400}}>Settings</h2>
            <p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:"2px 0 0"}}>{user?.email||""}</p>
          </div>
          <button onClick={onClose} aria-label="Close settings" style={{background:"none",border:"none",cursor:"pointer",padding:6}}><Ic.Close s={20} c={T.bark} w={2}/></button>
        </div>

        <div style={{padding:"16px 20px"}}>

          {/* Notifications */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.taupe,marginBottom:12}}>Notifications</div>
            <div style={{background:"#fff",borderRadius:16,padding:"16px",border:`1px solid ${T.linen}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <div style={{width:36,height:36,borderRadius:10,background:T.sageP,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>☀️</div>
                <div>
                  <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>Morning Briefing</div>
                  <div style={{fontFamily:FB,fontSize:11,color:T.taupe}}>Daily AI briefing from Nora</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <div style={{flex:1}}>
                  <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Hour</label>
                  <select value={briefHour} onChange={e=>setBriefHour(e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
                    {Array.from({length:24},(_,i)=><option key={i} value={String(i)}>{i===0?"12 AM":i<12?`${i} AM`:i===12?"12 PM":`${i-12} PM`}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Minute</label>
                  <select value={briefMin} onChange={e=>setBriefMin(e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
                    {["00","15","30","45"].map(m=><option key={m} value={m}>:{m}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={saveTime} style={{width:"100%",background:saved?T.sage:T.esp,color:"#fff",border:"none",borderRadius:10,padding:"10px",fontFamily:FB,fontSize:12,fontWeight:700,cursor:"pointer",transition:"background .3s"}}>
                {saved?"✓ Saved!":"Save briefing time"}
              </button>
              <button onClick={async()=>{
                if(!("Notification" in window)){alert("Not supported on this browser.");return;}
                const p=await Notification.requestPermission();
                if(p==="granted"){alert("✓ Notifications enabled!");}
                else{alert("Please enable notifications in your browser settings.");}
              }} style={{width:"100%",background:"none",border:`1px solid ${T.linen}`,borderRadius:10,padding:"9px",fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer",marginTop:8}}>
                🔔 Enable push notifications
              </button>
            </div>
          </div>

          {/* Privacy & Data */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.taupe,marginBottom:12}}>Privacy & Data</div>
            <div style={{background:"#fff",borderRadius:16,border:`1px solid ${T.linen}`,overflow:"hidden"}}>
              {[
                {icon:"🔒",label:"Privacy Policy",action:()=>window.open("/privacy.html","_blank")},
                {icon:"📄",label:"Terms of Service",action:()=>window.open("/terms.html","_blank")},
                {icon:"📦",label:"Download my data (GDPR)",action:exportData},
              ].map(({icon,label,action},i,arr)=>(
                <div key={i} onClick={action} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",borderBottom:i<arr.length-1?`1px solid ${T.linen}`:"none"}}>
                  <span style={{fontSize:18}}>{icon}</span>
                  <span style={{fontFamily:FB,fontSize:13,color:T.esp,flex:1}}>{label}</span>
                  <span style={{color:T.taupe,fontSize:16}}>›</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.taupe,marginBottom:12}}>Account</div>
            <div style={{background:"#fff",borderRadius:16,border:`1px solid ${T.linen}`,overflow:"hidden"}}>
              <div onClick={()=>{
                if(navigator.share){navigator.share({title:"HerNest",text:"I'm using HerNest — AI chief of staff for busy moms",url:window.location.origin}).catch(()=>{});}
                else{navigator.clipboard.writeText(window.location.origin).then(()=>alert("Link copied!")).catch(()=>{});}
              }} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",borderBottom:`1px solid ${T.linen}`}}>
                <span style={{fontSize:18}}>👨‍👩‍👧</span>
                <span style={{fontFamily:FB,fontSize:13,color:T.esp,flex:1}}>Share HerNest</span>
                <span style={{color:T.taupe,fontSize:16}}>›</span>
              </div>
              <div onClick={onSignOut} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",borderBottom:`1px solid ${T.linen}`}}>
                <span style={{fontSize:18}}>🚪</span>
                <span style={{fontFamily:FB,fontSize:13,color:T.esp,flex:1}}>Sign out</span>
                <span style={{color:T.taupe,fontSize:16}}>›</span>
              </div>
              <div onClick={()=>{
                if(!window.confirm("Delete your account and all data permanently?"))return;
                alert("Please use Profile → Delete my account to complete this action.");
              }} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}}>
                <span style={{fontSize:18}}>🗑️</span>
                <span style={{fontFamily:FB,fontSize:13,color:"#cc4444",flex:1}}>Delete account</span>
                <span style={{color:T.taupe,fontSize:16}}>›</span>
              </div>
            </div>
          </div>

          <p style={{fontFamily:FB,fontSize:10,color:T.taupe,textAlign:"center"}}>HerNest v1.0 · Made with 💛</p>
        </div>
      </div>
    </div>
  );
}
