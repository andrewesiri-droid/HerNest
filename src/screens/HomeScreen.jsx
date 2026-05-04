import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData, loadSummary } from "../utils/firebase";
import { generateProactiveNudge } from "../utils/inference/proactiveNudge";
import { selectPsychicNudge } from "../utils/nudgeBuilder";
import { PsychicNudge } from "../components/PsychicNudge";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function HomeScreen({go,aiTasks,profile,streak=1,calConnected,connectCalendar,calEvents}){
  const [water,setWater]=useState(()=>{try{return parseInt(localStorage.getItem("hn_hw")||"3");}catch(e){return 3;}});
  const [smartNudge,setSmartNudge]=useState(null);
  const [psychicNudge,setPsychicNudge]=useState(null);
  useEffect(()=>{
    if(appContext){
      const pn=selectPsychicNudge(appContext);
      if(pn)setPsychicNudge(pn);
    }
  },[appContext]);
  useEffect(()=>{
    const uidRaw=localStorage.getItem("hn_uid");
    const uid=uidRaw?JSON.parse(uidRaw):null;
    if(uid&&profile?.name){
      generateProactiveNudge(uid,profile,calEvents).then(n=>{if(n&&n.priority>0)setSmartNudge(n);}).catch(()=>{});
    }
  },[profile?.name]);
  const [summary,setSummary]=useState(()=>{try{const uid=JSON.parse(localStorage.getItem("hn_uid")||"null");return uid?JSON.parse(localStorage.getItem(`hn_summary_${uid}`)||"{}"):{};}catch(e){return {};}});

  // Load summary — ONE read for all home screen data
  useEffect(()=>{
    const uidRaw=localStorage.getItem("hn_uid");
    if(!uidRaw)return;
    const uid=JSON.parse(uidRaw);
    if(uid){loadSummary(uid).then(s=>{
      if(s){
        // Merge upcoming from all sub-fields
        const merged=[
          ...(s.upcomingBirthdays||[]),
          ...(s.upcomingTasks||[]),
          ...(s.upcomingSchool||[]),
        ].sort((a,b)=>(a.daysUntil||0)-(b.daysUntil||0)).slice(0,3);
        setSummary({...s,upcomingMerged:merged});
      }
    }).catch(()=>{});}
  },[]);
  const [noraInp,setNoraInp]=useState("");
  const [noraResp,setNoraResp]=useState(null);
  const [noraLoad,setNoraLoad]=useState(false);
  const hour=new Date().getHours();
  const date=new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"});
  const greet=hour<5?"Still up?":hour<12?"Good morning":hour<17?"Good afternoon":hour<21?"Good evening":"Good night";
  const firstName=profile?.name?.split(" ")[0]||"lovely";
  const tripGoal=profile?.tripGoal;
  const FEATS=[
    {id:"nora",lb:"Briefing",sub:"Your morning",bg:"linear-gradient(135deg,#2d1a00,#5a3a10)",IC:Ic.Sun,ic:"#F0E2B8"},
    {id:"plan",lb:"Plan",sub:"Tasks & meals",bg:"linear-gradient(135deg,#0e1a2e,#1a3a5a)",IC:Ic.Plan,ic:"#C4DCEA"},
    {id:"trips",lb:"Trips",sub:"Plan & pack",bg:"linear-gradient(135deg,#0e2a1e,#1a5a3a)",IC:Ic.Compass,ic:"#C8E0CE"},
    {id:"budget",lb:"Budget",sub:"CFO insights",bg:"linear-gradient(135deg,#1a1400,#3a2e00)",IC:Ic.Budget,ic:"#F0E2B8"},
    {id:"style",lb:"Style",sub:"AI stylist",bg:"linear-gradient(135deg,#2d1428,#4a1a3a)",IC:Ic.Hanger,ic:"#F2D4CA"},
    {id:"circle",lb:"Circle",sub:"Your people",bg:"linear-gradient(135deg,#0e1428,#1a2a4e)",IC:Ic.People,ic:"#C4DCEA"},
    {id:"wellness",lb:"Thrive",sub:"Mind & body",bg:"linear-gradient(135deg,#0e2218,#1a4a2e)",IC:Ic.Leaf,ic:"#C8E0CE"},
  ];
  useEffect(()=>{try{localStorage.setItem("hn_hw",String(water));}catch(e){ /* silent */ };},[water]);
  const askNora=async()=>{
    if(!noraInp.trim()||noraLoad)return;
    const msg=noraInp.trim();setNoraInp("");setNoraLoad(true);
    const profileCtx=profile?`User: ${profile.name}, ${profile.role}, kids: ${profile.kids?.map(k=>k.name).join(",")}, priorities: ${profile.priorities?.join(",")}.`:"";
    try{
      const raw=await claude(`You are Nora, warm AI life assistant. ${profileCtx} Reply in 2 sentences max — warm, specific, actionable. End with one emoji.`,msg);
      setNoraResp(raw);
    }catch(e){setNoraResp("I am here with you. Let us tackle this together 💛");}
    setNoraLoad(false);
  };
  const PROMPTS=["What should I focus on today?","I am feeling overwhelmed","Plan my week for me"];
  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Hero — Nora front and centre */}
      <div style={{background:AIGRAD,borderRadius:24,padding:"22px 20px 18px",marginBottom:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
        <div style={{position:"absolute",bottom:-30,left:-30,width:100,height:100,borderRadius:"50%",background:"rgba(107,158,122,.04)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <p style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",margin:"0 0 4px"}}>{date}</p>
            <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:"#fff",margin:"0 0 2px",fontWeight:300}}>{greet},</h1>
            <h1 style={{fontFamily:FD,fontSize:26,color:T.gold,margin:0,fontWeight:700,fontStyle:"normal"}}>{firstName} ✨</h1>
          </div>
          <div style={{display:"flex",gap:6}}>
            <div style={{textAlign:"center",background:"rgba(255,255,255,.08)",borderRadius:14,padding:"8px 10px"}}>
              <div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:"#fff"}}>{water}</div>
              <div style={{fontFamily:FB,fontSize:8,color:"rgba(255,255,255,.35)",letterSpacing:1,textTransform:"uppercase"}}>water</div>
            </div>
            <div style={{textAlign:"center",background:"rgba(196,154,60,.15)",borderRadius:14,padding:"8px 10px",border:`1px solid rgba(196,154,60,.25)`}}>
              <div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:T.gold}}>{streak}🔥</div>
              <div style={{fontFamily:FB,fontSize:8,color:"rgba(255,255,255,.35)",letterSpacing:1,textTransform:"uppercase"}}>streak</div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 0 20px rgba(196,154,60,.5)`,animation:"breathe 3s ease-in-out infinite"}}><Ic.Star s={20} c="#fff" w={1.3}/></div>
          <div style={{flex:1,background:"rgba(255,255,255,.08)",borderRadius:"16px 16px 16px 4px",padding:"10px 14px"}}>
            <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.85)",margin:0,lineHeight:1.5}}>{noraResp||`What is on your mind today, ${firstName}?`}</p>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input value={noraInp} onChange={e=>setNoraInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askNora()} placeholder="Tell Nora anything..." style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:14,border:"1.5px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",color:"#fff",outline:"none"}}/>
          <button onClick={askNora} disabled={!noraInp.trim()||noraLoad} style={{width:44,height:44,borderRadius:13,border:"none",background:noraInp.trim()&&!noraLoad?`linear-gradient(135deg,${T.gold},#8B6914)`:"rgba(255,255,255,.1)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s"}}>
            {noraLoad?<Spinner/>:<Ic.Send s={18} c={noraInp.trim()?"#fff":"rgba(255,255,255,.3)"} w={2}/>}
          </button>
        </div>
        {!noraResp&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {PROMPTS.map((p,i)=><button key={i} onClick={()=>setNoraInp(p)} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",borderRadius:20,padding:"5px 12px",fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.65)",cursor:"pointer"}}>{p}</button>)}
        </div>}
        {noraResp&&<button onClick={()=>go("nora")} style={{width:"100%",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:12,padding:"9px",fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.7)",cursor:"pointer",marginTop:4}}>Continue with Nora →</button>}
      </div>
      {/* Psychic nudge — emotional context aware */}
      {psychicNudge&&<PsychicNudge nudge={psychicNudge} go={go} uid={uid} profile={profile} onDismiss={()=>setPsychicNudge(null)}/>}
      {/* Fallback smart nudge */}
      {!psychicNudge&&smartNudge&&<div onClick={()=>{if(smartNudge.tab&&go)go(smartNudge.tab);}} style={{background:"#fff",borderRadius:18,padding:"14px 16px",marginBottom:12,borderLeft:`4px solid ${smartNudge.color}`,boxShadow:"0 2px 12px rgba(0,0,0,.06)",cursor:smartNudge.tab?"pointer":"default",display:"flex",alignItems:"flex-start",gap:12}}>
        <span style={{fontSize:26,flexShrink:0}}>{smartNudge.icon}</span>
        <div style={{flex:1}}>
          <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:"0 0 6px",lineHeight:1.6}}>{smartNudge.text}</p>
          {smartNudge.action&&<span style={{fontFamily:FB,fontSize:11,fontWeight:700,color:smartNudge.color}}>{smartNudge.action} →</span>}
        </div>
      </div>}
      {/* Proactive birthday alerts */}
      {[...(profile?.kids||[]),...(profile?.parents||[]),...(profile?.inlaws||[]),...(profile?.friends||[])].filter(p=>{
        if(!p?.bday)return false;
        const parts=p.bday.split("/");
        if(parts.length!==2)return false;
        const today=new Date();
        const next=new Date(today.getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
        if(next<today)next.setFullYear(today.getFullYear()+1);
        return Math.round((next-today)/86400000)<=7;
      }).map((p,i)=>{
        const today=new Date();
        const parts=p.bday.split("/");
        const next=new Date(today.getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
        if(next<today)next.setFullYear(today.getFullYear()+1);
        const days=Math.round((next-today)/86400000);
        return(
          <div key={i} style={{background:`linear-gradient(135deg,${T.blush},#a85040)`,borderRadius:16,padding:"13px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24,flexShrink:0}}>🎂</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>{p.name} — {days===0?"TODAY!":days===1?"tomorrow":`in ${days} days`}</div>
              <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.75)"}}>Want Nora to handle the gift?</div>
            </div>
            <button onClick={()=>go("profile")} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",borderRadius:10,padding:"7px 12px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",flexShrink:0}}>Gift ideas 🎁</button>
          </div>
        );
      })}

      {!calConnected&&<div onClick={connectCalendar} style={{background:"linear-gradient(135deg,#1a3a6e,#1a5a9e)",borderRadius:16,padding:"12px 16px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:22}}>📅</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff"}}>Connect Google Calendar</div>
          <div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.75)"}}>Nora reads your schedule and briefs you daily</div>
        </div>
        <Ic.Arrow s={16} c="rgba(255,255,255,.7)" w={1.5}/>
      </div>}
      {calConnected&&<div style={{background:"linear-gradient(135deg,#1a3a6e,#1a5a9e)",borderRadius:16,padding:"12px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:22}}>📅</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff"}}>Calendar connected · {calEvents.length} events this week ✓</div>
          <div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.75)"}}>Nora is reading your schedule</div>
        </div>
        <button onClick={connectCalendar} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,padding:"4px 10px",fontFamily:FB,fontSize:10,color:"#fff",cursor:"pointer"}}>Refresh</button>
      </div>}

      {typeof Notification!=="undefined"&&Notification.permission!=="granted"&&<div onClick={()=>go("profile")} style={{background:`linear-gradient(135deg,${T.gold},#8B6914)`,borderRadius:16,padding:"12px 16px",marginBottom:12,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
        <Ic.Bell s={18} c="#fff" w={1.5}/>
        <div style={{flex:1}}><div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff"}}>Enable Morning Briefing</div><div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.75)"}}>Nora greets you every morning</div></div>
        <Ic.Arrow s={16} c="rgba(255,255,255,.7)" w={1.5}/>
      </div>}
      {tripGoal&&<div onClick={()=>go("trips")} style={{background:`linear-gradient(135deg,#0e2a1e,#1a5a3a)`,borderRadius:16,padding:"13px 16px",marginBottom:12,cursor:"pointer",display:"flex",alignItems:"center",gap:12,border:"1px solid rgba(107,158,122,.2)"}}>
        <Tile ic={Ic.Compass} c="#C8E0CE" bg="rgba(107,158,122,.2)" s={18} ts={40} r={12}/>
        <div style={{flex:1}}><div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Next Adventure</div><div style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:"#fff",fontWeight:400}}>{tripGoal}</div></div>
        <Ic.Arrow s={16} c="rgba(255,255,255,.4)" w={1.5}/>
      </div>}
      {aiTasks?.length>0&&<Card sx={{borderLeft:`4px solid ${T.gold}`,marginBottom:12}} ch={<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>Nora organised</span><AIBadge t={`${aiTasks.length} tasks`}/></div>
        {aiTasks.slice(0,3).map((tk,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<2?`1px solid ${T.linen}`:"none"}}>
            <Tile ic={tk.tag==="Work"?Ic.Bag:tk.tag==="Me"?Ic.Leaf:Ic.Plan} c={tk.tag==="Work"?T.sky:tk.tag==="Me"?T.blush:T.sage} bg={tk.tag==="Work"?T.skyP:tk.tag==="Me"?T.blushP:T.sageP} s={15} ts={30} r={9}/>
            <span style={{fontFamily:FB,fontSize:13,color:T.esp,flex:1}}>{tk.text}</span>
            <Tag ch={tk.tag} c={tk.tag==="Work"?T.sky:tk.tag==="Me"?T.blush:T.sage}/>
          </div>
        ))}
      </div>}/>}
      <H2 t="Everything else" sub="All your tools in one place"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {FEATS.map(f=>(
          <div key={f.id} onClick={()=>go(f.id)} className="lift" style={{background:f.bg,borderRadius:18,padding:"16px 14px",cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,.15)"}}>
            <div style={{position:"absolute",bottom:-16,right:-16,width:50,height:50,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
            <div style={{width:36,height:36,borderRadius:11,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10,border:"1px solid rgba(255,255,255,.08)"}}><f.IC s={17} c={f.ic} w={1.4}/></div>
            <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff"}}>{f.lb}</div>
            <div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.38)",marginTop:2}}>{f.sub}</div>
          </div>
        ))}
      </div>
      <Card ch={<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><Ic.Drop s={16} c={T.sky} w={1.5}/><span style={{fontFamily:FD,fontSize:14,fontWeight:600,color:T.esp}}>Hydration</span></div>
          <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>{water}/8</span>
        </div>
        <div style={{display:"flex",gap:4}}>
          {Array.from({length:8},(_,i)=><div key={i} onClick={()=>setWater(i<water?i:i+1)} style={{flex:1,height:26,borderRadius:7,cursor:"pointer",background:i<water?T.sky:T.skyP,transition:"background .15s"}}/>)}
        </div>
      </div>}/>
    </div>
  );
}
