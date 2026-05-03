import React, { useState, useEffect } from "react";
import { T, FD, FB } from "../constants/theme";
import { loadData } from "../utils/firebase";

export function PartnerView({ uid }) {
  const [profile, setProfile] = useState(null);
  const [calEvents, setCalEvents] = useState([]);
  const [schoolEvents, setSchoolEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) { setError("Invalid link"); setLoading(false); return; }
    Promise.all([
      loadData(uid, "profile"),
      loadData(uid, "tasks"),
      loadData(uid, "school"),
    ]).then(([prof, taskData, schoolData]) => {
      if (!prof) { setError("Link expired or invalid"); setLoading(false); return; }
      setProfile(prof);
      setTasks((taskData?.tasks || []).filter(t => !t.done).slice(0, 10));
      setSchoolEvents((schoolData?.events || []).filter(e => new Date(e.date) >= new Date()).slice(0, 10));
      setLoading(false);
    }).catch(() => { setError("Could not load family view"); setLoading(false); });
  }, [uid]);

  const today = new Date();
  const upcoming = [...schoolEvents].sort((a,b) => new Date(a.date) - new Date(b.date));

  const allPeople = profile ? [
    ...(profile.kids || []),
    ...(profile.parents || []),
    ...(profile.inlaws || []),
    ...(profile.friends || []),
  ] : [];

  const upcomingBdays = allPeople.filter(p => {
    if (!p?.bday) return false;
    const parts = p.bday.split("/");
    if (parts.length !== 2) return false;
    const next = new Date(today.getFullYear(), parseInt(parts[0])-1, parseInt(parts[1]));
    if (next < today) next.setFullYear(today.getFullYear()+1);
    return Math.round((next-today)/86400000) <= 14;
  }).map(p => {
    const parts = p.bday.split("/");
    const next = new Date(today.getFullYear(), parseInt(parts[0])-1, parseInt(parts[1]));
    if (next < today) next.setFullYear(today.getFullYear()+1);
    return { ...p, days: Math.round((next-today)/86400000) };
  }).sort((a,b) => a.days - b.days);

  if (loading) return (
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,#2E1F14,#1a0a04)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,#C49A3C,#8B6914)`,animation:"breathe 2s ease-in-out infinite"}}/>
    </div>
  );

  if (error) return (
    <div style={{minHeight:"100vh",background:"#FAF6EF",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>🔒</div>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:20,color:"#2E1F14"}}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#FAF6EF",padding:"0 0 40px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,400;1,600&family=DM+Sans:wght@400;500;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}`}</style>

      {/* Header */}
      <div style={{background:`linear-gradient(145deg,#2E1F14,#1a0a04)`,padding:"32px 20px 24px",marginBottom:20}}>
        <div style={{maxWidth:430,margin:"0 auto"}}>
          <p style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.4)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Family View · Shared by</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:28,color:"#fff",fontWeight:400,margin:"0 0 4px"}}>{profile?.name}'s HerNest</h1>
          <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.5)",margin:0}}>{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
        </div>
      </div>

      <div style={{maxWidth:430,margin:"0 auto",padding:"0 16px"}}>

        {/* Upcoming birthdays */}
        {upcomingBdays.length > 0 && (
          <div style={{background:"linear-gradient(135deg,#D4826A20,#F2D4CA)",borderRadius:16,padding:"14px 16px",marginBottom:14,border:"1.5px solid #D4826A30"}}>
            <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:"#D4826A",marginBottom:8,letterSpacing:1,textTransform:"uppercase"}}>🎂 Upcoming birthdays</div>
            {upcomingBdays.map((p,i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:i<upcomingBdays.length-1?8:0}}>
                <span style={{fontFamily:FB,fontSize:13,fontWeight:600,color:"#2E1F14"}}>{p.name}</span>
                <span style={{fontFamily:FB,fontSize:11,color:"#D4826A",fontWeight:700}}>{p.days===0?"Today! 🎉":p.days===1?"Tomorrow":` ${p.days} days`}</span>
              </div>
            ))}
          </div>
        )}

        {/* School events this week */}
        {upcoming.length > 0 && (
          <div style={{background:"#fff",borderRadius:16,padding:"14px 16px",marginBottom:14,border:"1px solid #E5D9C9",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
            <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:"#1a5a9e",marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>🎒 School events</div>
            {upcoming.slice(0,5).map((e,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<Math.min(upcoming.length,5)-1?"1px solid #E5D9C9":"none"}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:FB,fontSize:12,fontWeight:600,color:"#2E1F14"}}>{e.title}</div>
                  <div style={{fontFamily:FB,fontSize:10,color:"#B8A898",marginTop:1}}>{new Date(e.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}{e.child&&e.child!=="All"?` · ${e.child}`:""}</div>
                </div>
                {e.requiresAction&&<span style={{fontFamily:FB,fontSize:9,fontWeight:700,color:"#D4826A",background:"#F2D4CA",borderRadius:20,padding:"2px 8px"}}>Action</span>}
              </div>
            ))}
          </div>
        )}

        {/* Family tasks */}
        {tasks.filter(t=>t.tag==="Family"||t.tag==="Home").length > 0 && (
          <div style={{background:"#fff",borderRadius:16,padding:"14px 16px",marginBottom:14,border:"1px solid #E5D9C9",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
            <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:"#7A6A5A",marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>✅ Family tasks</div>
            {tasks.filter(t=>t.tag==="Family"||t.tag==="Home").slice(0,6).map((t,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<5?"1px solid #E5D9C9":"none"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:t.priority==="high"?"#D4826A":t.priority==="medium"?"#C49A3C":"#B8A898",flexShrink:0}}/>
                <span style={{fontFamily:FB,fontSize:12,color:"#2E1F14",flex:1}}>{t.text}</span>
                <span style={{fontFamily:FB,fontSize:9,color:"#B8A898",background:"#F2EBE0",borderRadius:10,padding:"2px 8px"}}>{t.tag}</span>
              </div>
            ))}
          </div>
        )}

        {/* Kids */}
        {/* Partner nudges */}
        <div style={{background:"#fff",borderRadius:16,padding:"14px 16px",marginBottom:14,border:"1px solid #E5D9C9",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <div style={{fontFamily:"'DM Sans','Helvetica Neue',sans-serif",fontSize:11,fontWeight:700,color:"#7A6A5A",marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>💛 Send encouragement</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            {["You're doing amazing 💛","I'm proud of you 🌟","Let's plan a date night 🌙","You've got this! 💪","I see how hard you work ❤️","Thank you for everything 🙏"].map((msg,i)=>(
              <button key={i} onClick={()=>{
                const txt=`${msg} — sent via HerNest`;
                if(navigator.share){navigator.share({text:txt}).catch(()=>{});}
                else{navigator.clipboard.writeText(txt).catch(()=>{});alert("Copied! Send via WhatsApp 💛");}
              }} style={{padding:"10px 8px",borderRadius:12,border:"1.5px solid #E5D9C9",background:"#FAF6EF",fontFamily:"'DM Sans','Helvetica Neue',sans-serif",fontSize:11,color:"#2E1F14",cursor:"pointer",textAlign:"left",lineHeight:1.4}}>{msg}</button>
            ))}
          </div>
          <p style={{fontFamily:"'DM Sans','Helvetica Neue',sans-serif",fontSize:10,color:"#B8A898",margin:0,textAlign:"center"}}>Tap any message to share via WhatsApp</p>
        </div>

        {(profile?.kids||[]).length > 0 && (
          <div style={{background:"#fff",borderRadius:16,padding:"14px 16px",marginBottom:14,border:"1px solid #E5D9C9",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
            <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:"#6B9E7A",marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>👨‍👩‍👧 The kids</div>
            {profile.kids.map((k,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<profile.kids.length-1?8:0}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"#C8E0CE",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FD,fontSize:16,fontWeight:600,color:"#6B9E7A"}}>{k.name?.[0]}</div>
                <div>
                  <div style={{fontFamily:FB,fontSize:13,fontWeight:600,color:"#2E1F14"}}>{k.name}</div>
                  {k.age&&<div style={{fontFamily:FB,fontSize:11,color:"#B8A898"}}>{k.age}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HerNest watermark */}
        <div style={{textAlign:"center",marginTop:24}}>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:"#B8A898",margin:"0 0 4px"}}>Powered by HerNest AI</p>
          <p style={{fontFamily:FB,fontSize:11,color:"#B8A898",margin:0}}>her-nest.vercel.app</p>
        </div>
      </div>
    </div>
  );
}
