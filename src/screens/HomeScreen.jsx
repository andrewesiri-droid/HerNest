import React, { useState, useEffect } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { loadSummary } from "../utils/firebase";
import { selectPsychicNudge } from "../utils/nudgeBuilder";
import { getPendingFollowUp, closeFollowUp } from "../utils/followUpSystem";
import { isQuietMode, setQuietMode, clearQuietMode } from "../utils/quietMode";
import { buildEmotionalContext } from "../utils/emotionalContext";
import { PsychicNudge } from "../components/PsychicNudge";
import { ConciergeCard } from "../components/ConciergCard.jsx";
import { claude } from "../utils/claude";
import { Card, AIBadge, Tile, Spinner, Tag } from "../components/shared";

// ─── Greeting Generator ───────────────────────────────────────────
function buildGreeting(firstName, appContext) {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  if (!appContext) {
    const g = hour<5?"Still up,":hour<12?"Good morning,":hour<17?"Good afternoon,":hour<21?"Good evening,":"Good night,";
    return { line1: g, line2: firstName, sub: null, color: T.gold };
  }

  const emotional = buildEmotionalContext(appContext);
  const tasks = appContext.tasks;
  const wellness = appContext.wellness;
  const name = firstName;

  // Crisis
  if (emotional?.load?.level === "critical") return {
    line1: name + ".", line2: "One thing at a time.",
    sub: "Nora is here. Start with breathing.",
    color: "#9b59b6"
  };

  // Heavy
  if (emotional?.load?.level === "heavy") return {
    line1: days[day] + " morning,", line2: name,
    sub: `${tasks?.todayCount||0} things today — but only one matters right now.`,
    color: T.sage
  };

  // Thriving
  if (wellness?.isThriving) return {
    line1: name + ", you're on a roll.", line2: "Keep going.",
    sub: `${wellness.habitsDone||0}/5 habits this week. Strong.`,
    color: T.gold
  };

  // Weekend
  if (day === 0 || day === 6) return {
    line1: "Weekend,", line2: name,
    sub: "What does 'you time' look like today?",
    color: T.sage
  };

  // Monday
  if (day === 1) return {
    line1: "Monday morning,", line2: name,
    sub: "New week. Nora sorted the priorities.",
    color: T.gold
  };

  // Friday
  if (day === 5) return {
    line1: "Friday,", line2: name,
    sub: `${tasks?.todayCount||0} things, then rest.`,
    color: "#f39c12"
  };

  // Default — specific, never generic
  const g = hour<12?"morning,":hour<17?"afternoon,":"evening,";
  return {
    line1: `${days[day]} ${g}`, line2: name,
    sub: tasks?.todayCount > 0 ? `${tasks.todayCount} thing${tasks.todayCount>1?"s":""} today${tasks.urgentCount>0?`, ${tasks.urgentCount} urgent`:""}. Nora sorted them.` : "All clear today. Enjoy it.",
    color: T.gold
  };
}

// ─── Emotional background ─────────────────────────────────────────
function getBg(appContext) {
  if (!appContext) return "#f8f6f2";
  const emotional = buildEmotionalContext(appContext);
  const level = emotional?.load?.level;
  if (level === "critical") return "#faf8f5";
  if (level === "heavy") return "#f5f7fa";
  if (emotional?.state === "thriving") return "#f0f9f4";
  return "#f8f6f2";
}

// ─── Quick Glance tiles ───────────────────────────────────────────
function QuickGlance({ icon, value, label, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{background:"#fff",borderRadius:16,padding:"14px 12px",textAlign:"center",cursor:onClick?"pointer":"default",border:`1px solid ${T.linen}`,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
      <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
      <div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:color||T.esp}}>{value}</div>
      <div style={{fontFamily:FB,fontSize:10,color:T.bark,fontWeight:700,letterSpacing:.5}}>{label}</div>
      {sub&&<div style={{fontFamily:FB,fontSize:9,color:T.taupe,marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ─── Upcoming row ─────────────────────────────────────────────────
function UpcomingRow({ item, go }) {
  const icons = { birthday:"🎂", task:"✓", school:"📚", trip:"✈️" };
  const colors = { birthday:T.blush, task:T.gold, school:T.sky, trip:T.sage };
  const tabs = { birthday:"profile", task:"plan", school:"plan", trip:"trips" };
  const daysText = item.daysUntil===0?"Today":item.daysUntil===1?"Tomorrow":`${item.daysUntil}d`;
  return (
    <div onClick={()=>go(tabs[item.type]||"plan")} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${T.linen}`,cursor:"pointer"}}>
      <div style={{width:28,height:28,borderRadius:8,background:(colors[item.type]||T.gold)+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{icons[item.type]||"•"}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:FB,fontSize:13,fontWeight:600,color:T.esp,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title||item.name}</div>
        {item.child&&item.child!=="All"&&<div style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{item.child}</div>}
      </div>
      <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:colors[item.type]||T.gold,flexShrink:0}}>{daysText}</div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────
export function HomeScreen({go,aiTasks,profile,streak=1,calConnected,connectCalendar,calEvents,appContext}){
  const [water,setWater]=useState(()=>{try{return parseInt(localStorage.getItem("hn_hw")||"3");}catch(e){return 3;}});
  const [psychicNudge,setPsychicNudge]=useState(null);
  const [followUp,setFollowUp]=useState(null);
  const [quietMode,setQuietModeState]=useState(()=>isQuietMode());

  // Check for pending follow-ups on load
  useEffect(()=>{
    const pending = getPendingFollowUp();
    if(pending) setFollowUp(pending);
  },[]);
  const [smartNudge,setSmartNudge]=useState(null);
  const [summary,setSummary]=useState(()=>{
    try{const uid=JSON.parse(localStorage.getItem("hn_uid")||"null");return uid?JSON.parse(localStorage.getItem(`hn_summary_${uid}`)||"{}"):{};}catch(e){return {};}
  });
  const [noraInp,setNoraInp]=useState("");
  const [noraResp,setNoraResp]=useState(null);
  const [noraLoad,setNoraLoad]=useState(false);
  const [moodLogged,setMoodLogged]=useState(()=>localStorage.getItem("hn_mood_log_date")===new Date().toDateString());

  const firstName = profile?.name?.split(" ")[0]||"lovely";
  const uid = (() => { try { return JSON.parse(localStorage.getItem("hn_uid")||"null"); } catch { return null; } })();

  // Load summary
  useEffect(()=>{
    if(!uid)return;
    loadSummary(uid).then(s=>{
      if(!s)return;
      const merged=[...(s.upcomingBirthdays||[]),...(s.upcomingTasks||[]),...(s.upcomingSchool||[])]
        .sort((a,b)=>(a.daysUntil||0)-(b.daysUntil||0)).slice(0,3);
      setSummary({...s,upcomingMerged:merged});
    }).catch(()=>{});
  },[uid]);

  // Psychic nudge from context
  useEffect(()=>{
    if(!appContext)return;
    try{
      const pn=selectPsychicNudge(appContext);
      if(pn&&pn.type!=="calm")setPsychicNudge(pn);
    }catch(e){}
  },[appContext]);

  // Save water
  useEffect(()=>{try{localStorage.setItem("hn_hw",String(water));}catch(e){};},[water]);

  // Quick Nora
  // Detect quiet mode request in chat
  const checkForQuietMode=(msg)=>{
    const lower=msg.toLowerCase();
    const quietPhrases=["can't deal","leave me alone","too much","need space","i give up","can't do this","shut everything down"];
    if(quietPhrases.some(p=>lower.includes(p))){
      setQuietMode(24);
      setQuietModeState(true);
      return true;
    }
    return false;
  };

  const askNora=async()=>{
    if(!noraInp.trim()||noraLoad)return;
    const msg=noraInp.trim();setNoraInp("");
    if(checkForQuietMode(msg)){
      setNoraResp("I hear you. I'll give you space. Check in when you're ready 💛");
      setNoraLoad(false);
      return;
    }
    setNoraLoad(true);
    const ctx=profile?`User: ${profile.name}, ${profile.role}, priorities: ${profile.priorities?.join(",")}.`:"";
    try{
      const raw=await claude(`You are Nora. ${ctx} Reply in 2 warm sentences max. End with one emoji.`,msg,[],"nora_chat");
      setNoraResp(raw);
    }catch(e){setNoraResp("I am here with you 💛");}
    setNoraLoad(false);
  };

  // Log mood from home
  const logMood=(val)=>{
    try{
      const moods=JSON.parse(localStorage.getItem("hn_moods")||"[3,3,3,3,3,3,3]");
      moods[6]=val;
      localStorage.setItem("hn_moods",JSON.stringify(moods));
      localStorage.setItem("hn_mood_log_date",new Date().toDateString());
      setMoodLogged(true);
    }catch(e){}
  };

  const greeting = buildGreeting(firstName, appContext);
  const bg = getBg(appContext);
  const upcoming = summary.upcomingMerged||[];
  const PROMPTS = ["What should I focus on today?","I am feeling overwhelmed","Plan my week for me"];
  const isNewUser = !summary.pendingTasks && !appContext && !calConnected;

  return(
    <div style={{animation:"fadeUp .45s ease both",background:bg,minHeight:"100vh",margin:"-16px -16px 0",padding:"16px 16px 80px",transition:"background .6s ease"}}>

      {/* ── ZONE 1: GREETING ─────────────────────────────────── */}
      <div style={{marginBottom:20,paddingTop:4}}>
        <p style={{fontFamily:FB,fontSize:10,color:T.taupe,letterSpacing:2,textTransform:"uppercase",margin:"0 0 6px"}}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",day:"numeric",month:"long"})}
        </p>
        <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:28,color:T.esp,margin:"0 0 2px",fontWeight:300,lineHeight:1.2}}>{greeting.line1}</h1>
        <h1 style={{fontFamily:FD,fontSize:28,color:greeting.color,margin:0,fontWeight:700,fontStyle:"normal",lineHeight:1.2}}>{greeting.line2}</h1>
        {greeting.sub&&<p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:"8px 0 0",lineHeight:1.5}}>{greeting.sub}</p>}
      </div>

      {/* ── ZONE 2: THE ONE THING ────────────────────────────── */}
      {psychicNudge&&(
        <PsychicNudge nudge={psychicNudge} go={go} uid={uid} profile={profile} onDismiss={()=>setPsychicNudge(null)}/>
      )}

      {/* ── NEW USER VALUE PROP ─────────────────────────────── */}
      {!summary.pendingTasks&&!calConnected&&!appContext&&profile?.name&&(
        <div style={{background:`linear-gradient(135deg,${T.esp},#3a2010)`,borderRadius:20,padding:"20px",marginBottom:14}}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"rgba(255,255,255,.45)",marginBottom:10}}>Welcome to HerNest</div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:"#fff",margin:"0 0 14px",lineHeight:1.6}}>Hi {profile.name} — Nora is your AI chief of staff. The more you share, the more she helps.</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {em:"💬",text:"Tell Nora what's on your mind",tab:"nora"},
              {em:"☀️",text:"Read your morning briefing",tab:"brief"},
              {em:"📅",text:"Connect your calendar",tab:"plan"},
              {em:"💰",text:"Set up your budget",tab:"budget"},
            ].map(({em,text,tab})=>(
              <div key={tab} onClick={()=>go(tab)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"8px 12px",borderRadius:12,background:"rgba(255,255,255,.06)"}}>
                <span style={{fontSize:20,flexShrink:0}}>{em}</span>
                <span style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.8)"}}>{text}</span>
                <span style={{marginLeft:"auto",color:"rgba(255,255,255,.3)",fontSize:16}}>›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── NORA CONCIERGE ──────────────────────────────────── */}
      <ConciergeCard profile={profile} appContext={appContext} go={go}/>

      {/* Follow-up card */}
      {followUp&&!quietMode&&(
        <div style={{background:"#fff",borderRadius:18,padding:"14px 16px",marginBottom:14,border:`1.5px solid ${T.gold}40`,boxShadow:"0 2px 8px rgba(0,0,0,.05)",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22,flexShrink:0}}>{followUp.icon}</span>
          <div style={{flex:1}}>
            <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:"0 0 4px",lineHeight:1.5}}>{followUp.message}</p>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{go("nora");closeFollowUp(followUp.nudgeId);setFollowUp(null);}} style={{background:T.gold,border:"none",borderRadius:8,padding:"5px 12px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer"}}>Talk to Nora →</button>
              <button onClick={()=>{closeFollowUp(followUp.nudgeId);setFollowUp(null);}} style={{background:"none",border:"none",fontFamily:FB,fontSize:11,color:T.taupe,cursor:"pointer"}}>I'm good</button>
            </div>
          </div>
        </div>
      )}

      {/* Quiet mode banner */}
      {quietMode&&(
        <div style={{background:"linear-gradient(135deg,#2d1654,#1a0e28)",borderRadius:18,padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>🌙</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>Quiet mode on</div>
            <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.6)"}}>Nora will check in when you're ready</div>
          </div>
          <button onClick={()=>{clearQuietMode&&clearQuietMode();setQuietModeState(false);}} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,padding:"5px 10px",fontFamily:FB,fontSize:10,color:"#fff",cursor:"pointer"}}>I'm ready</button>
        </div>
      )}

      {/* Fallback: Smart nudge if no psychic */}
      {!psychicNudge&&smartNudge&&(
        <div onClick={()=>{if(smartNudge.tab&&go)go(smartNudge.tab);}} style={{background:"#fff",borderRadius:18,padding:"14px 16px",marginBottom:14,borderLeft:`4px solid ${smartNudge.color}`,boxShadow:"0 2px 12px rgba(0,0,0,.06)",cursor:smartNudge.tab?"pointer":"default",display:"flex",alignItems:"flex-start",gap:12}}>
          <span style={{fontSize:26,flexShrink:0}}>{smartNudge.icon}</span>
          <div style={{flex:1}}>
            <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:"0 0 6px",lineHeight:1.6}}>{smartNudge.text}</p>
            {smartNudge.action&&<span style={{fontFamily:FB,fontSize:11,fontWeight:700,color:smartNudge.color}}>{smartNudge.action} →</span>}
          </div>
        </div>
      )}

      {/* Mood check-in (if not done today) */}
      {!moodLogged&&!psychicNudge&&(
        <div style={{background:"#fff",borderRadius:18,padding:"14px 16px",marginBottom:14,border:`1px solid ${T.linen}`,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:15,color:T.esp,margin:"0 0 12px",textAlign:"center"}}>How are you feeling right now?</p>
          <div style={{display:"flex",justifyContent:"space-around"}}>
            {[["😔",1],["😟",2],["😐",3],["🙂",4],["😊",5]].map(([em,val])=>(
              <button key={val} onClick={()=>logMood(val)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 8px"}}>
                <span style={{fontSize:28}}>{em}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── NEW USER WELCOME ─────────────────────────────────── */}
      {isNewUser&&(
        <div style={{background:`linear-gradient(135deg,${T.goldP},#fff8e8)`,borderRadius:18,padding:"16px",marginBottom:14,border:`1.5px solid ${T.gold}30`}}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.gold,marginBottom:8}}>Getting started</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {em:"💬",text:"Tell Nora what's on your mind below"},
              {em:"📅",text:"Connect your calendar for smart planning"},
              {em:"💰",text:"Set up your budget in the Budget tab"},
              {em:"☀️",text:"Check your morning briefing every day"},
            ].map((h,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18,flexShrink:0}}>{h.em}</span>
                <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ZONE 3: NORA QUICK CHAT ──────────────────────────── */}
      <div style={{background:AIGRAD,borderRadius:20,padding:"16px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:100,height:100,borderRadius:"50%",background:"rgba(196,154,60,.05)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 0 14px rgba(196,154,60,.4)`,animation:"breathe 3s ease-in-out infinite"}}>
            <Ic.Star s={16} c="#fff" w={1.3}/>
          </div>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.85)",margin:0,lineHeight:1.5,flex:1}}>
            {noraResp||`What is on your mind, ${firstName}?`}
          </p>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:noraResp?8:0}}>
          <input value={noraInp} onChange={e=>setNoraInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askNora()} placeholder="Tell Nora anything..." style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:13,border:"1.5px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",color:"#fff",outline:"none"}}/>
          <button onClick={askNora} disabled={!noraInp.trim()||noraLoad} style={{width:42,height:42,borderRadius:12,border:"none",background:noraInp.trim()&&!noraLoad?`linear-gradient(135deg,${T.gold},#8B6914)`:"rgba(255,255,255,.1)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {noraLoad?<Spinner/>:<Ic.Send s={16} c={noraInp.trim()?"#fff":"rgba(255,255,255,.3)"} w={2}/>}
          </button>
        </div>
        {!noraResp&&(
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {PROMPTS.map((p,i)=><button key={i} onClick={()=>setNoraInp(p)} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",borderRadius:20,padding:"5px 12px",fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.65)",cursor:"pointer"}}>{p}</button>)}
          </div>
        )}
        {noraResp&&(
          <button onClick={()=>go("nora")} style={{width:"100%",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:11,padding:"8px",fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.7)",cursor:"pointer"}}>
            Continue with Nora →
          </button>
        )}
      </div>

      {/* ── ZONE 4-5: FAMILY COMMAND CENTER ─────────────────── */}
      <div style={{background:"#fff",borderRadius:22,padding:"16px",marginBottom:14,border:`1px solid ${T.linen}`,boxShadow:"0 4px 20px rgba(30,20,10,.06)"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.taupe}}>Family Command Center</span>
          <span style={{fontFamily:FD,fontSize:12,color:T.gold,cursor:"pointer"}} onClick={()=>go("plan")}>View all →</span>
        </div>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
          <div onClick={()=>setWater(w=>Math.min(8,w+1))} style={{background:T.skyP,borderRadius:14,padding:"12px 8px",textAlign:"center",cursor:"pointer"}}>
            <div style={{fontSize:20,marginBottom:2}}>💧</div>
            <div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:T.sky}}>{water}</div>
            <div style={{fontFamily:FB,fontSize:9,color:T.sky,fontWeight:700,letterSpacing:.5}}>WATER</div>
            <div style={{fontFamily:FB,fontSize:9,color:T.taupe}}>{8-water} to go</div>
          </div>
          <div style={{background:T.goldP,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:2}}>🔥</div>
            <div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:T.gold}}>{streak}</div>
            <div style={{fontFamily:FB,fontSize:9,color:T.gold,fontWeight:700,letterSpacing:.5}}>STREAK</div>
            <div style={{fontFamily:FB,fontSize:9,color:T.taupe}}>days</div>
          </div>
          <div onClick={()=>go("plan")} style={{background:T.sageP,borderRadius:14,padding:"12px 8px",textAlign:"center",cursor:"pointer"}}>
            <div style={{fontSize:20,marginBottom:2}}>✓</div>
            <div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:T.sage}}>{summary.pendingTasks||0}</div>
            <div style={{fontFamily:FB,fontSize:9,color:T.sage,fontWeight:700,letterSpacing:.5}}>TASKS</div>
            <div style={{fontFamily:FB,fontSize:9,color:T.taupe}}>pending</div>
          </div>
        </div>

        {/* Divider */}
        {upcoming.length>0&&<div style={{height:1,background:T.linen,marginBottom:12}}/>}

        {/* Upcoming events */}
        {upcoming.length>0&&(
          <div>
            <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.taupe,marginBottom:8}}>Coming up</div>
            {upcoming.map((item,i)=><UpcomingRow key={i} item={item} go={go}/>)}
          </div>
        )}

        {/* School events this week */}
        {(()=>{
          const schoolEvents=JSON.parse(localStorage.getItem("hn_school_events")||"[]");
          const thisWeek=schoolEvents.filter(e=>{
            const diff=(new Date(e.date)-new Date())/(1000*60*60*24);
            return diff>=0&&diff<=7&&(e.requiresAction||e.priority==="critical");
          }).slice(0,2);
          if(!thisWeek.length)return null;
          return(
            <div>
              <div style={{height:1,background:T.linen,margin:"12px 0 10px"}}/>
              <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.sky,marginBottom:8}}>🎒 School this week</div>
              {thisWeek.map((e,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<thisWeek.length-1?`1px solid ${T.linen}`:"none"}}>
                  <div style={{width:28,height:28,borderRadius:8,background:T.skyP,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>📚</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:FB,fontSize:13,fontWeight:600,color:T.esp,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
                    {e.child&&<div style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{e.child}</div>}
                  </div>
                  <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.sky,flexShrink:0}}>
                    {(()=>{const d=Math.round((new Date(e.date)-new Date())/86400000);return d===0?"Today":d===1?"Tomorrow":`${d}d`;})()}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── ZONE 6: BIRTHDAY ALERTS (today/tomorrow only) ────── */}
      {[...(profile?.kids||[]),...(profile?.parents||[]),...(profile?.inlaws||[]),...(profile?.friends||[])].filter(p=>{
        if(!p?.bday)return false;
        const parts=p.bday.split("/");if(parts.length!==2)return false;
        const today=new Date();
        const next=new Date(today.getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
        if(next<today)next.setFullYear(today.getFullYear()+1);
        return Math.round((next-today)/86400000)<=1;
      }).map((p,i)=>{
        const today=new Date();
        const parts=p.bday.split("/");
        const next=new Date(today.getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
        if(next<today)next.setFullYear(today.getFullYear()+1);
        const days=Math.round((next-today)/86400000);
        return(
          <div key={i} style={{background:`linear-gradient(135deg,${T.blush},#a85040)`,borderRadius:16,padding:"13px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22,flexShrink:0}}>🎂</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>{p.name} — {days===0?"TODAY!":"tomorrow"}</div>
              <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.75)"}}>Want Nora to handle the gift?</div>
            </div>
            <button onClick={()=>go("profile")} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",borderRadius:10,padding:"7px 12px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",flexShrink:0}}>Gift ideas 🎁</button>
          </div>
        );
      })}

      {/* ── ZONE 7: AI TASKS (if any) ────────────────────────── */}
      {aiTasks?.length>0&&(
        <div style={{background:"#fff",borderRadius:18,padding:"14px 16px",marginBottom:14,border:`1.5px solid ${T.gold}30`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp}}>Nora organised</span>
            <AIBadge t={`${aiTasks.length} tasks`}/>
          </div>
          {aiTasks.slice(0,3).map((tk,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<Math.min(aiTasks.length-1,2)?`1px solid ${T.linen}`:"none"}}>
              <Tile ic={tk.tag==="Work"?Ic.Bag:tk.tag==="Me"?Ic.Leaf:Ic.Plan} c={tk.tag==="Work"?T.sky:tk.tag==="Me"?T.blush:T.sage} bg={tk.tag==="Work"?T.skyP:tk.tag==="Me"?T.blushP:T.sageP} s={14} ts={28} r={8}/>
              <span style={{fontFamily:FB,fontSize:13,color:T.esp,flex:1}}>{tk.text}</span>
              <Tag ch={tk.tag} c={tk.tag==="Work"?T.sky:tk.tag==="Me"?T.blush:T.sage}/>
            </div>
          ))}
        </div>
      )}

      {/* ── ZONE 8: CALENDAR + NOTIFICATION (compact) ────────── */}
      {!calConnected&&(
        <div onClick={connectCalendar} style={{background:"linear-gradient(135deg,#1a3a6e,#1a5a9e)",borderRadius:14,padding:"11px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>📅</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff"}}>Connect Google Calendar</div>
            <div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.7)"}}>Nora reads your schedule daily</div>
          </div>
          <Ic.Arrow s={14} c="rgba(255,255,255,.6)" w={1.5}/>
        </div>
      )}
      {typeof Notification!=="undefined"&&Notification.permission!=="granted"&&(
        <div onClick={()=>go("profile")} style={{background:`linear-gradient(135deg,${T.gold},#8B6914)`,borderRadius:14,padding:"11px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
          <Ic.Bell s={16} c="#fff" w={1.5}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff"}}>Enable Morning Briefing</div>
            <div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.75)"}}>Nora greets you every morning</div>
          </div>
          <Ic.Arrow s={14} c="rgba(255,255,255,.6)" w={1.5}/>
        </div>
      )}
      {/* School newsletter quick upload */}
      {(profile?.kids||[]).length>0&&(()=>{
        const schoolEvents=JSON.parse(localStorage.getItem("hn_school_events")||"[]");
        const hasEvents=schoolEvents.length>0;
        return(
          <div onClick={()=>go("plan")} style={{background:"linear-gradient(135deg,#1a3a6e,#1a5a9e)",borderRadius:14,padding:"11px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>🎒</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff"}}>{hasEvents?`${schoolEvents.length} school events tracked`:"Add school calendar"}</div>
              <div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.7)"}}>{hasEvents?"Nora will flag important dates in your briefing":"Upload newsletter → Nora adds it to your calendar"}</div>
            </div>
            <Ic.Arrow s={14} c="rgba(255,255,255,.6)" w={1.5}/>
          </div>
        );
      })()}
    </div>
  );
}
