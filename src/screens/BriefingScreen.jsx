import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { logEvent, EVENTS } from "../utils/analytics";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function BriefingScreen({profile,onAddTask,calEvents,appContext}){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [checkedPriorities,setCheckedPriorities]=useState([]);
  const [checkedReminders,setCheckedReminders]=useState([]);
  const [askInp,setAskInp]=useState("");
  const [askResp,setAskResp]=useState(null);
  const [askLoad,setAskLoad]=useState(false);
  const [shared,setShared]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [addedTasks,setAddedTasks]=useState([]);
  const tC=t=>t==="Work"?T.sky:t==="Family"?T.sage:t==="Me"?T.blush:T.gold;
  const tIC=t=>t==="Work"?Ic.Bag:t==="Family"?Ic.Kids:t==="Me"?Ic.Leaf:Ic.Home;

  // Upcoming birthdays in next 7 days
  const upcomingBdays=[];
  const today=new Date();
  [...(profile?.kids||[]),...(profile?.parents||[]),...(profile?.inlaws||[]),...(profile?.friends||[])].forEach(p=>{
    if(p?.bday){
      const parts=p.bday.split("/");
      if(parts.length===2){
        const next=new Date(today.getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
        if(next<today)next.setFullYear(today.getFullYear()+1);
        const days=Math.round((next-today)/86400000);
        if(days<=7)upcomingBdays.push({name:p.name,days});
      }
    }
  });
  if(profile?.partnerBday){
    const parts=profile.partnerBday.split("-");
    if(parts.length===3){
      const next=new Date(today.getFullYear(),parseInt(parts[1])-1,parseInt(parts[2]));
      if(next<today)next.setFullYear(today.getFullYear()+1);
      const days=Math.round((next-today)/86400000);
      if(days<=7)upcomingBdays.push({name:profile.partner||"Partner",days});
    }
  }

  const gen=async()=>{
    setLoading(true);setCheckedPriorities([]);setCheckedReminders([]);setAskResp(null);
    const bdayCtx=upcomingBdays.length?`IMPORTANT — upcoming birthdays: ${upcomingBdays.map(b=>`${b.name} in ${b.days} day${b.days===1?"":"s"}`).join(", ")}. Include a reminder about this.`:"";
    const schoolEventsRaw=localStorage.getItem("hn_school_events");
    const schoolEventsAll=schoolEventsRaw?JSON.parse(schoolEventsRaw):[];
    const todayStr2=new Date().toISOString().split("T")[0];
    const thisWeekSchool=schoolEventsAll.filter(e=>{const diff=(new Date(e.date)-new Date())/(1000*60*60*24);return diff>=0&&diff<=7;});
    const schoolCtx=thisWeekSchool.length?`SCHOOL EVENTS THIS WEEK: ${thisWeekSchool.map(e=>`${e.title} on ${e.date}${e.child?` (${e.child})`:""}`).join(", ")}. Mention any that require action.`:"";

    const nowB=new Date();const todayStrB=nowB.getFullYear()+"-"+String(nowB.getMonth()+1).padStart(2,"0")+"-"+String(nowB.getDate()).padStart(2,"0");
    const todayEvents=(calEvents||[]).filter(e=>{if(!e.start)return false;if(e.allDay)return e.start.startsWith(todayStrB);return new Date(e.start).toDateString()===nowB.toDateString();});



    const calCtx=todayEvents.length?`CALENDAR EVENTS TODAY: ${todayEvents.map(e=>{const t=e.allDay?"All day":new Date(e.start).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});return `${t} - ${e.title}${e.location?` at ${e.location}`:""}`;}).join(", ")}. Include these in priorities.`:"";
    const familyCtx=`Partner: ${profile?.partner||"none"}, kids: ${profile?.kids?.map(k=>`${k.name} (${k.age||"?"})`).join(",")||"none"}, parents: ${profile?.parents?.map(p=>p.name).join(",")||"none"}, in-laws: ${profile?.inlaws?.map(p=>p.name).join(",")||"none"}`;
    const weather=await fetchWeather();
    const weatherCtx=weather?`Current weather: ${weather.desc} (${weather.type}). Mention this naturally in the weatherNote field.`:"";
    const sys=`You are Nora inside HerNest. SELF-CORRECTION: Only reference information the user has actually provided. Never invent calendar events, birthdays or facts not in the context. Return ONLY valid JSON no markdown:
{"greeting":"","date":"","weatherNote":"","weatherType":"sunny|cloudy|rainy","priorities":[{"text":"","tag":"Work|Family|Me|Home"}],"reminders":["","",""],"budgetNote":"","tripNote":"","affirmation":"","energyTip":"","focusWord":""}
5 priorities, 3-4 reminders, include energyTip and a one-word focusWord for the day (e.g. "Focus", "Rest", "Connect").`;
    const energyCtx=profile?.energyPattern?`Energy pattern: ${profile.energyPattern} (${profile.energyPattern==="morning"?"schedule hardest tasks before noon — her energy peaks early":profile.energyPattern==="evening"?"she gets her second wind after 6pm — don't fill evenings with admin":"energy varies — suggest checking in with how she feels"}).`:"";
    const tripsCtx = appContext?.trips?.nextTrip ? `UPCOMING TRIP: ${appContext.trips.nextTrip.dest||"trip"} in ${appContext.trips.daysUntilNext} days.` : "";
    const budgetCtx2 = appContext?.budget?.isNearLimit ? `BUDGET ALERT: ${Math.round(appContext.budget.percentUsed*100)}% of monthly budget used, $${Math.round(appContext.budget.remaining)} remaining.` : "";
    const tasksCtx2 = appContext?.tasks?.urgentCount > 0 ? `URGENT TASKS: ${appContext.tasks.urgentCount} urgent tasks today.` : "";
    const wellnessCtx2 = appContext?.wellness?.sleepDebt ? `SLEEP DEBT: She slept ${appContext.wellness.sleepLastNight} hours — adjust energy tip accordingly.` : "";
    const ctx=`Name: ${profile?.name||"Sarah"}, role: ${profile?.role||"CFO"}, ${familyCtx}, trip: ${profile?.tripGoal||"none"}, fitness: ${profile?.fitnessGoal||"none"}, challenge: ${profile?.challenge||"mental load"}, priorities: ${profile?.priorities?.join(",")||"family,career,fitness"}. ${energyCtx} ${bdayCtx} ${calCtx} ${schoolCtx} ${weatherCtx} ${tripsCtx} ${budgetCtx2} ${tasksCtx2} ${wellnessCtx2}`;
    try{
      const raw=await claude(sys,ctx,[],"morning_briefing");
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setData(parsed);
      logEvent(EVENTS.BRIEFING_VIEWED,{focusWord:parsed.focusWord});
      const today=new Date().toDateString();
      try{localStorage.setItem("hn_brief_cache",JSON.stringify(parsed));localStorage.setItem("hn_brief_date",today);}catch(e){}
    }
    catch(e){setData({greeting:`Good morning${profile?.name?`, ${profile.name}`:""}!`,date:new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}),weatherNote:"Make today count — you've got this.",weatherType:"sunny",priorities:[{text:"Block 2hrs for deep work",tag:"Work"},{text:"School run 8:15am",tag:"Family"},{text:"30 min workout",tag:"Me"},{text:"Grocery order",tag:"Home"},{text:"Check budget",tag:"Work"}],reminders:["Check in with the kids tonight","Review tomorrow's calendar","Drink 8 glasses of water"],budgetNote:"Stay mindful of spending today.",tripNote:profile?.tripGoal?`${profile.tripGoal} — keep planning!`:"Start planning your next adventure.",affirmation:"You carry so much, so gracefully. Today, you have already won.",energyTip:"Start with your hardest task first — your energy is highest in the morning.",focusWord:"Focus"});}
    setLoading(false);
  };
  const refreshBriefing=()=>{
    try{localStorage.removeItem("hn_brief_cache");localStorage.removeItem("hn_brief_date");}catch(e){}
    setData(null);setLoading(true);setCachedDate("");
  };


  const speakBriefing=()=>{
    if(!data||!window.speechSynthesis)return;
    if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return;}
    const txt=`Good morning ${profile?.name||"lovely"}. Here is your briefing for today. Your focus word is ${data.focusWord||"today"}. ${data.weatherNote}. Your top priorities are: ${data.priorities?.slice(0,3).map((p,i)=>`${i+1}. ${p.text}`).join(". ")}. Don't forget: ${data.reminders?.slice(0,2).join(". And ")}. ${data.affirmation}`;
    const utt=new SpeechSynthesisUtterance(txt);
    utt.rate=0.92;utt.pitch=1.05;utt.volume=1;
    const voices=window.speechSynthesis.getVoices();
    const preferred=voices.find(v=>v.name.includes("Samantha")||v.name.includes("Karen")||v.name.includes("Moira")||v.name.includes("Female")||v.lang==="en-US"||v.lang==="en-GB");
    if(preferred)utt.voice=preferred;
    utt.onend=()=>setSpeaking(false);
    utt.onerror=()=>setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utt);
  };

  const quickAdd=(text,tag)=>{
    if(addedTasks.includes(text))return;
    setAddedTasks(p=>[...p,text]);
    if(onAddTask)onAddTask({tasks:[{text,tag,priority:"high"}]});
  };

  useEffect(()=>{gen();},[]);
  useEffect(()=>()=>{window.speechSynthesis?.cancel();},[]);

  const askNora=async()=>{
    if(!askInp.trim()||askLoad)return;
    const msg=askInp.trim();setAskInp("");setAskLoad(true);
    const ctx=data?`Briefing context: priorities=${data.priorities?.map(p=>p.text).join(",")}, reminders=${data.reminders?.join(",")}.`:"";
    try{const raw=await claude(`You are Nora, warm AI assistant. ${ctx} Answer in 2 sentences max, actionable and warm.`,msg);setAskResp(raw);}
    catch(e){setAskResp("I am here with you 💛");}
    setAskLoad(false);
  };

  const shareBriefing=()=>{
    if(!data)return;
    const nl="\n";const txt="My day — "+data.date+nl+nl+"Priorities:"+nl+data.priorities?.map((p,i)=>(i+1)+". "+p.text).join(nl)+nl+nl+"Reminders:"+nl+data.reminders?.map(r=>"• "+r).join(nl)+nl+nl+'Nora says: "'+data.affirmation+'"'+nl+nl+"Sent from HerNest ✨";
    if(navigator.share){navigator.share({title:"My Day",text:txt}).catch(()=>{});}
    else{navigator.clipboard.writeText(txt).catch(()=>{});setShared(true);setTimeout(()=>setShared(false),2000);}
  };

  if(loading) return(
    <div style={{textAlign:"center",padding:"50px 20px",animation:"fadeUp .4s ease both"}}>
      <div style={{width:60,height:60,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",animation:"breathe 2s ease-in-out infinite"}}><Ic.Sun s={28} c="#fff" w={1.4}/></div>
      <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:T.esp}}>Nora is preparing your morning…</p>
      <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:"6px 0 0"}}>Personalised just for you</p>
    </div>
  );
  if(!data) return null;

  const allPrioritiesDone=data.priorities&&checkedPriorities.length===data.priorities.length;

  return(
    <div style={{animation:"fadeUp .5s ease both"}}>
      {/* Hero */}
      <div style={{background:AIGRAD,borderRadius:24,padding:"24px 22px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <AIBadge t="Morning Briefing"/>
          <button onClick={shareBriefing} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:20,padding:"5px 12px",fontFamily:FB,fontSize:11,fontWeight:700,color:"rgba(255,255,255,.7)",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            {shared?<><Ic.Check s={11} c={T.sage} w={2.5}/>Copied!</>:<><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="rgba(255,255,255,.7)" strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke="rgba(255,255,255,.7)" strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke="rgba(255,255,255,.7)" strokeWidth="1.8"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="rgba(255,255,255,.7)" strokeWidth="1.8" strokeLinecap="round"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="rgba(255,255,255,.7)" strokeWidth="1.8" strokeLinecap="round"/></svg>Share</>}
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <div style={{flex:1}}>
            <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:"#fff",margin:"0 0 4px",fontWeight:400}}>{data.greeting}</h2>
            <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",margin:0}}>{data.date}</p>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            {data.focusWord&&<div style={{textAlign:"center",background:"rgba(196,154,60,.2)",borderRadius:14,padding:"10px 12px",border:"1px solid rgba(196,154,60,.3)"}}>
              <div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.gold}}>{data.focusWord}</div>
              <div style={{fontFamily:FB,fontSize:8,color:"rgba(255,255,255,.35)",letterSpacing:1,textTransform:"uppercase"}}>today</div>
            </div>}
          <button onClick={()=>{try{localStorage.removeItem("hn_brief_cache");localStorage.removeItem("hn_brief_date");}catch(e){}setData(null);setLoading(true);}} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,padding:"5px 10px",fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.5)",cursor:"pointer"}}>↻ Refresh</button>
            {"speechSynthesis" in window&&<button onClick={speakBriefing} style={{width:44,height:44,borderRadius:13,background:speaking?"rgba(196,154,60,.3)":"rgba(255,255,255,.1)",border:`1px solid ${speaking?"rgba(196,154,60,.5)":"rgba(255,255,255,.15)"}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}} title="Listen to briefing">
              {speaking?<div style={{display:"flex",gap:2,alignItems:"flex-end",height:16}}>{[10,16,12,18,10].map((h,i)=><div key={i} style={{width:3,height:h,background:T.gold,borderRadius:2,animation:`dot 1s ease-in-out ${i*.1}s infinite`}}/>)}</div>:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinejoin="round"/><path d="M15.54 8.46a5 5 0 010 7.07" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round"/><path d="M19.07 4.93a10 10 0 010 14.14" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            </button>}
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,.08)",borderRadius:13,padding:"12px 14px",borderLeft:`3px solid ${T.gold}`,display:"flex",alignItems:"center",gap:10}}>
          {data.weatherType==="rainy"?<Ic.Drop s={18} c={T.goldP} w={1.4}/>:<Ic.Sun s={18} c={T.goldP} w={1.4}/>}
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.75)",margin:0,lineHeight:1.6}}>{data.weatherNote}</p>
        </div>
      </div>

      {/* Birthday alerts */}
      {upcomingBdays.map((b,i)=>(
        <div key={i} style={{background:`linear-gradient(135deg,${T.blush},#a85040)`,borderRadius:14,padding:"12px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🎂</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>{b.name}'s birthday {b.days===0?"is TODAY!":b.days===1?"is tomorrow!":`is in ${b.days} days`}</div>
            <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.75)"}}>Don't forget to make it special 💛</div>
          </div>
        </div>
      ))}

      {/* Priorities — interactive checkboxes */}
      <Card sx={{borderLeft:`4px solid ${T.gold}`}} ch={<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <H2 t="Today's Priorities"/>
          {allPrioritiesDone&&<span style={{fontFamily:FB,fontSize:11,color:T.sage,fontWeight:700}}>All done! 🎉</span>}
        </div>
        {data.priorities.map((p,i)=>{
          const done=checkedPriorities.includes(i);
          const TC=tIC(p.tag);const tc=tC(p.tag);
          return(
            <div key={i} onClick={()=>setCheckedPriorities(prev=>done?prev.filter(x=>x!==i):[...prev,i])} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 12px",background:done?T.sageP:T.sand,borderRadius:12,marginBottom:8,cursor:"pointer",transition:"all .2s",border:`1.5px solid ${done?T.sage:T.linen}`}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:done?T.sage:T.linen,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s"}}>
                {done&&<Ic.Check s={13} c="#fff" w={2.5}/>}
              </div>
              <Tile ic={TC} c={done?T.sage:tc} bg={(done?T.sage:tc)+"18"} s={15} ts={30} r={9}/>
              <span style={{fontFamily:FB,fontSize:13,color:done?T.taupe:T.esp,flex:1,textDecoration:done?"line-through":"none"}}>{p.text}</span>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {!done&&<button onClick={e=>{e.stopPropagation();quickAdd(p.text,p.tag);}} style={{background:addedTasks.includes(p.text)?T.sageP:T.goldP,border:`1px solid ${addedTasks.includes(p.text)?T.sage:T.gold}30`,borderRadius:8,padding:"3px 8px",fontFamily:FB,fontSize:10,fontWeight:700,color:addedTasks.includes(p.text)?T.sage:T.gold,cursor:"pointer",whiteSpace:"nowrap"}}>
                  {addedTasks.includes(p.text)?"Added ✓":"+ Plan"}
                </button>}
                <Tag ch={p.tag} c={done?T.taupe:tc}/>
              </div>
            </div>
          );
        })}
      </div>}/>

      {/* Reminders — dismissable */}
      <Card ch={<div>
        <H2 t="Don't Forget"/>
        {data.reminders.map((r,i)=>{
          const dismissed=checkedReminders.includes(i);
          return !dismissed&&(
            <div key={i} style={{display:"flex",gap:12,padding:"10px 0",alignItems:"center",borderBottom:i<data.reminders.length-1?`1px solid ${T.linen}`:"none"}}>
              <Tile ic={Ic.Clock} c={T.gold} bg={T.goldP} s={14} ts={28} r={8}/>
              <span style={{fontFamily:FB,fontSize:13,color:T.bark,lineHeight:1.5,flex:1}}>{r}</span>
              <button onClick={()=>setCheckedReminders(p=>[...p,i])} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
            </div>
          );
        })}
        {checkedReminders.length===data.reminders.length&&<p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:T.sage,margin:0,textAlign:"center"}}>All reminders cleared ✓</p>}
      </div>}/>

      {/* Snapshot row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{lb:"Budget",note:data.budgetNote,c:T.gold,bg:T.goldP,IC:Ic.Budget},{lb:"Next Trip",note:data.tripNote,c:T.sky,bg:T.skyP,IC:Ic.Suitcase}].map(b=>(
          <div key={b.lb} style={{background:b.bg,borderRadius:16,padding:"14px",border:`1px solid ${b.c}25`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><b.IC s={14} c={b.c} w={1.5}/><span style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:b.c}}>{b.lb}</span></div>
            <p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,lineHeight:1.5}}>{b.note}</p>
          </div>
        ))}
      </div>

      {/* Energy tip */}
      {data.energyTip&&<Card sx={{background:`linear-gradient(135deg,${T.esp},#4a2e18)`,border:"none",marginBottom:14}} ch={<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Ic.Bulb s={16} c={T.gold} w={1.5}/><span style={{fontFamily:FB,fontSize:10,color:T.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>Energy Tip</span></div>
        <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.75)",margin:0,lineHeight:1.65}}>{data.energyTip}</p>
      </div>}/>}

      {/* Affirmation */}
      <div style={{background:`linear-gradient(135deg,${T.blushP},${T.goldP})`,borderRadius:18,padding:"20px",textAlign:"center",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Ic.Flower s={32} c={T.blush} w={1.2}/></div>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:17,color:T.esp,margin:0,lineHeight:1.7}}>"{data.affirmation}"</p>
      </div>

      {/* Ask Nora */}
      <Card sx={{background:AIGRAD,border:"none",marginBottom:14}} ch={<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic.Star s={13} c="#fff" w={1.5}/></div>
          <span style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)"}}>Ask Nora about your day</span>
        </div>
        {askResp&&<div style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 12px",marginBottom:10}}>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.85)",margin:0,lineHeight:1.6}}>{askResp}</p>
        </div>}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <input value={askInp} onChange={e=>setAskInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(askInp)} placeholder="Ask Nora anything about today…" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.08)",color:"#fff",outline:"none"}}/>
          <button onClick={()=>ask(askInp)} style={{background:T.gold,border:"none",borderRadius:12,padding:"10px 14px",fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp,cursor:"pointer"}}>Ask</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={askInp} onChange={e=>setAskInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askNora()} placeholder="e.g. How do I fit gym in today?" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.08)",color:"#fff",outline:"none"}}/>
          <button onClick={askNora} disabled={!askInp.trim()||askLoad} style={{background:askInp.trim()&&!askLoad?`linear-gradient(135deg,${T.gold},#8B6914)`:"rgba(255,255,255,.1)",border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {askLoad?<Spinner/>:<Ic.Send s={15} c="#fff" w={2}/>}
          </button>
        </div>
      </div>}/>

      <button onClick={gen} style={{width:"100%",background:"none",border:`1.5px solid ${T.linen}`,borderRadius:13,padding:"11px",fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <Ic.Refresh s={15} c={T.bark} w={1.8}/> Refresh briefing
      </button>
    </div>
  );
}
