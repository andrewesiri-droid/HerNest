import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { buildEmotionalContext } from "../utils/emotionalContext";
import { claude } from "../utils/claude";
import { logEvent, EVENTS } from "../utils/analytics";
import { BriefingScreen } from "./BriefingScreen";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function NoraScreen({onTasks,profile,calEvents,onAddTask,uid}){
  const [showBriefing,setShowBriefing]=useState(false);
  // Nora Memory v2 — structured facts with types and expiration
  const FACT_TYPES = {
    dietary: {expires:false,label:"Diet"},
    medical: {expires:false,label:"Health"},
    family: {expires:false,label:"Family"},
    preference: {expires:false,label:"Preference"},
    goal: {expires:false,label:"Goal"},
    schedule: {expires:"3months",label:"Schedule"},
    event: {expires:"1day_after",label:"Event"},
    temporary: {expires:"7days",label:"Temporary"},
  };

  const [debriefMode,setDebriefMode]=useState(false);
  const [debriefHist,setDebriefHist]=useState(()=>{
    try{const s=localStorage.getItem("hn_debrief_chat");return s?JSON.parse(s):[];}catch(e){return [];}
  });
  const [noraMemory,setNoraMemory]=useState(()=>{
    try{
      const s=localStorage.getItem("hn_nora_memory_v2");
      if(s) return JSON.parse(s);
      // Migrate from old format
      const old=localStorage.getItem("hn_nora_memory");
      if(old){
        const oldFacts=JSON.parse(old);
        return oldFacts.map((f,i)=>({id:`legacy_${i}`,fact:f,type:"preference",confidence:0.9,createdAt:new Date().toISOString(),expiresAt:null,useCount:0}));
      }
      return [];
    }catch(e){return [];}
  });

  const saveMemory=(facts)=>{
    setNoraMemory(facts);
    try{localStorage.setItem("hn_nora_memory_v2",JSON.stringify(facts));}catch(e){ /* silent */ }
    if(uid)saveData(uid,"nora_memory",{facts}).catch(()=>{ /* silent */ });
  };

  const addMemory=(factText,type="preference")=>{
    // Check for contradictions (same type, similar content)
    const existing=noraMemory.find(f=>f.type===type&&f.fact.toLowerCase().includes(factText.toLowerCase().slice(0,10)));
    let updated;
    if(existing){
      // Update existing fact
      updated=noraMemory.map(f=>f.id===existing.id?{...f,fact:factText,confidence:0.95,updatedAt:new Date().toISOString()}:f);
    } else {
      const newFact={
        id:`fact_${Date.now()}`,
        fact:factText,
        type,
        confidence:0.9,
        createdAt:new Date().toISOString(),
        expiresAt:null,
        useCount:0,
        source:"user_explicit"
      };
      updated=[...noraMemory,newFact].slice(-30);
    }
    saveMemory(updated);
  };

  const forgetMemory=(factId)=>{
    const updated=noraMemory.filter(f=>f.id!==factId);
    saveMemory(updated);
  };

  // Filter out expired facts
  const activeMemory=noraMemory.filter(f=>{
    if(!f.expiresAt)return true;
    return new Date(f.expiresAt)>new Date();
  });

  const [msgs,setMsgs]=useState(()=>{
    try{
      const s=sessionStorage.getItem("hn_nora_msgs")||localStorage.getItem("hn_nora_msgs");
      if(s)return JSON.parse(s);
    }catch(e){ /* silent */ }
    return [{role:"assistant",content:`Hello${profile?.name?`, ${profile.name}`:", lovely"}. I'm Nora, your AI Mental Load Manager.\n\nTalk to me naturally — tell me what's on your mind and I'll organise everything for you.`,parsed:null}];
  });
  const [inp,setInp]=useState(""); const [loading,setLoading]=useState(false);
  const [listening,setListening]=useState(false);
  const recogRef=useRef(null);
  const ref=useRef(null);
  useEffect(()=>{
    if(uid){
      loadData(uid,"nora_memory").then(d=>{
        if(d?.facts?.length){
          setNoraMemory(d.facts);
          try{localStorage.setItem("hn_nora_memory",JSON.stringify(d.facts));}catch(e){ /* silent */ }
        }
      }).catch(()=>{ /* silent */ });
    }
  },[uid]);

  useEffect(()=>{
    try{const save=msgs.slice(-20).map(m=>({role:m.role,content:m.content}));sessionStorage.setItem("hn_nora_msgs",JSON.stringify(save));}catch(e){ /* silent */ }
  },[msgs]);

  const startVoice=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Voice input not supported on this browser. Try Chrome.");return;}
    if(listening){recogRef.current?.stop();setListening(false);return;}
    const r=new SR();
    r.continuous=false;r.interimResults=true;r.lang="en-US";
    r.onstart=()=>setListening(true);
    r.onresult=e=>{
      const t=Array.from(e.results).map(r=>r[0].transcript).join("");
      setInp(t);
    };
    r.onend=()=>setListening(false);
    r.onerror=()=>setListening(false);
    recogRef.current=r;
    r.start();
  };
  const kidName=profile?.kids?.[0]?.name||"my daughter";
  const trip=profile?.tripGoal||"our next trip";
  const SUGG=[
    `${kidName} has swimming Wednesday, I have a board meeting Monday and we haven't booked ${trip} yet`,
    `I'm exhausted, haven't worked out in a week, groceries are running low`,
    `Plan my week — work Mon-Fri, ${kidName}'s activities, need some me-time too`
  ];
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);
  const tC=t=>t==="Work"?T.sky:t==="Me"?T.blush:t==="Travel"?T.teal:T.sage;
  const tIC=t=>t==="Work"?Ic.Bag:t==="Me"?Ic.Leaf:t==="Travel"?Ic.Suitcase:Ic.Plan;
  const send=async()=>{
    if(!inp.trim()||loading)return;
    const msg=inp.trim();setInp("");setLoading(true);
    const profileCtx=profile?`User profile: name ${profile.name||"her"}, role ${profile.role||"mum"}, kids: ${profile.kids?.map(k=>`${k.name} (${k.age})`).join(",")||"none listed"}, partner: ${profile.partner||"none"}, parents: ${profile.parents?.map(p=>`${p.name} (${p.role})`).join(",")||"none listed"}, in-laws: ${profile.inlaws?.map(p=>`${p.name} (${p.role})`).join(",")||"none listed"}, trip goal: ${profile.tripGoal||"none"}, priorities: ${profile.priorities?.join(",")||"family"}, challenge: ${profile.challenge||"mental load"}, energy pattern: ${profile.energyPattern||"not set"} (use this to time suggestions — morning people do hard tasks early, evening people get second wind after 6pm), diet: ${profile.diet||"no restrictions"}, fitness level: ${profile.fitnessLevel||"not set"}.`:"";
    // Crisis detection — check before sending to AI
    const crisisWords = ["end my life","kill myself","don't want to be here","want to die","suicide","self harm","hurt myself","give up on life","can't go on","not worth living","disappear forever","everyone would be better without me","can't do this anymore","feeling hopeless","no reason to live","end it all","take my own life"];
    const isCrisis = crisisWords.some(w => msg.toLowerCase().includes(w));
    if(isCrisis){
      setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:`I hear you, and I'm really glad you reached out. What you're feeling matters deeply. Please reach out to someone who can truly support you right now:

🆘 **Crisis Text Line** — Text HOME to 741741
📞 **988 Suicide & Crisis Lifeline** — Call or text 988
📞 **Samaritans UK** — 116 123

You are not alone. 💛`,parsed:null}]);
      setLoading(false);
      return;
    }

    // Medical advice guardrail
    const medicalWords = ["should i take","what medication","dosage","prescription","diagnose","do i have","medical advice","should i see a doctor"];
    const isMedical = medicalWords.some(w => msg.toLowerCase().includes(w));

    // Financial advice guardrail  
    const financialWords = ["should i invest","buy stocks","buy crypto","which stock","investment advice","should i buy shares","portfolio","trade"];
    const isFinancial = financialWords.some(w => msg.toLowerCase().includes(w));

    // Detect memory commands
    const rememberTriggers = ["remember that","don't forget that","nora remember","always remember","note that","keep in mind"];
    const forgetTriggers = ["forget that","don't remember","remove from memory","that's wrong","not anymore"];
    const isRememberCmd = rememberTriggers.some(t => msg.toLowerCase().includes(t));
    const isForgetCmd = forgetTriggers.some(t => msg.toLowerCase().includes(t));

    if(isForgetCmd){
      const factHint = msg.replace(/nora,?\s*/i,"").replace(/forget that\s*/i,"").replace(/don't remember\s*/i,"").trim().toLowerCase();
      const toForget = activeMemory.find(f=>f.fact.toLowerCase().includes(factHint.slice(0,15)));
      if(toForget){
        forgetMemory(toForget.id);
        logEvent(EVENTS.NORA_MEMORY_REMOVED);
        setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:`Got it — I've forgotten: *"${toForget.fact}"* 💛 It's gone from my memory permanently.`,parsed:null}]);
        setLoading(false);
        return;
      } else if(activeMemory.length>0){
        const list=activeMemory.map((f,i)=>`${i+1}. ${f.fact}`).join("\n");
        setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:`I'm not sure which memory you mean. Here's what I remember:\n\n${list}\n\nTell me which one to forget and I'll remove it.`,parsed:null}]);
        setLoading(false);
        return;
      }
    }

    if(isRememberCmd){
      const clean = msg.replace(/nora,?\s*/i,"").replace(/remember that\s*/i,"").replace(/don't forget that\s*/i,"").replace(/always remember\s*/i,"").replace(/note that\s*/i,"").replace(/keep in mind\s*/i,"").trim();
      // Detect fact type from content
      let type = "preference";
      if(/eat|diet|food|gluten|dairy|vegan|vegetarian|allergic/i.test(clean)) type = "dietary";
      else if(/medical|condition|medication|health|doctor/i.test(clean)) type = "medical";
      else if(/kid|child|son|daughter|husband|wife|partner|mum|dad/i.test(clean)) type = "family";
      else if(/goal|want to|trying to|working on/i.test(clean)) type = "goal";
      else if(/every morning|every day|routine|schedule/i.test(clean)) type = "schedule";
      if(clean){
        addMemory(clean, type);
        logEvent(EVENTS.NORA_MEMORY_ADDED,{type});
        setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:`Got it — I'll always remember: *"${clean}"* 💛 This is now part of my permanent memory about you.`,parsed:null}]);
        setLoading(false);
        return;
      }
    }

    // Debrief mode detection + exit condition
    const debriefTriggers = ["how did today go","debrief","end of day","tell me about my day","i need to vent","how was my day","just listen"];
    const planningTriggers = ["plan my week","help me organize","what should i do","add a task","remind me","schedule","priorities"];
    const isDebriefTrigger = debriefTriggers.some(t => msg.toLowerCase().includes(t));
    const isPlanningTrigger = planningTriggers.some(t => msg.toLowerCase().includes(t));
    if(isDebriefTrigger && !debriefMode) {
      setDebriefMode(true);
    }
    if(debriefMode && isPlanningTrigger) {
      setDebriefMode(false);
    }

    // Build emotional tone from context
    let emotionalTone = "";

    // Debrief mode overrides everything
    if(debriefMode || isDebriefTrigger) {
      const noraName = profile?.name?.split(" ")?.[0] || "lovely";
      const kidCount = profile?.kids?.length || 0;
      const isSolo = profile?.soloParent || profile?.role === "Single Mum";
      const sys_debrief = `You are in debrief mode. ${noraName} has just put her ${kidCount > 0 ? kidCount + " kid" + (kidCount > 1 ? "s" : "") : "children"} to bed. She is exhausted. She does not want solutions.
RULES:
1. NEVER suggest an action item unless she explicitly asks
2. NEVER say "have you tried" or "you should" or "maybe you could"
3. ALWAYS reflect back what she said: start with "So today was..." or "That sounds like..."
4. ALWAYS validate the hard parts — say "That sounds really hard" not "That sounds hard but..."
5. ONE warm question only: "What was the hardest part?" or "What are you proud of from today?"
6. END with something specific and true: ${isSolo ? `"Solo. Kids fed. You did it."` : `"That was a full day. You handled it."`}
7. If she says "I'm fine" after listing hard things → acknowledge what you heard: "You say fine, but that was a lot."
8. Max 3 sentences per response. She is tired.`;
      try{
        const h = (debriefHist.length > 0 ? debriefHist : msgs).map(m=>({role:m.role,content:m.content}));
        const raw = await claude(sys_debrief, msg, h.slice(-6), "wellness_coach");
        const updated = [...debriefHist, {role:"user",content:msg}, {role:"assistant",content:raw}];
        setDebriefHist(updated);
        setMsgs(p=>[...p,{role:"user",content:msg,parsed:null},{role:"assistant",content:raw,parsed:null}]);
        try{localStorage.setItem("hn_debrief_chat",JSON.stringify(updated.slice(-20)));}catch(e){}
      }catch(e){
        setMsgs(p=>[...p,{role:"user",content:msg,parsed:null},{role:"assistant",content:"I'm here. What happened today?",parsed:null}]);
      }
      setLoading(false);
      return;
    }
    try{
      const ctxRaw=localStorage.getItem("hn_app_context");
      if(ctxRaw){
        const appCtx=JSON.parse(ctxRaw);
        const emotional=buildEmotionalContext(appCtx);
        if(emotional?.state==="overwhelmed") emotionalTone="IMPORTANT: She is overwhelmed right now. Do not open with a task or question. Open with acknowledgment. Keep responses short. Offer to take one thing off her plate.";
        else if(emotional?.state==="struggling") emotionalTone="She is struggling this week. Lead with empathy before any advice. Acknowledge before suggesting.";
        else if(emotional?.state==="tired") emotionalTone="She is tired. Favour simple, concrete suggestions over complex plans. Short responses.";
        else if(emotional?.state==="thriving") emotionalTone="She is thriving. Match her energy. Be ambitious with suggestions.";
        else if(emotional?.state==="recovering") emotionalTone="She had a hard stretch but is improving. Acknowledge the progress. Build on it.";
      }
    }catch(e){}
    const memoryCtx = activeMemory.length ? `IMPORTANT — things she has specifically asked Nora to always remember:\n${activeMemory.map((f,i)=>`${i+1}. [${f.type}] ${f.fact}`).join("\n")}\nAlways factor these into every response. If a fact seems outdated, gently check.` : "";

    const sys=`You are Nora, a warm, intelligent AI Mental Load Manager inside HerNest. ${profileCtx} ${memoryCtx}
You know this mum personally. Use her name, reference her kids by name, mention her real goals.
${isMedical?"IMPORTANT: If the question involves medical advice, symptoms or medication — acknowledge warmly then recommend she consult her GP or a healthcare professional. Never diagnose or prescribe.":""}
${isFinancial?"IMPORTANT: If the question involves investment, stocks, crypto or specific financial decisions — acknowledge warmly then recommend she consult a qualified financial advisor. Never recommend specific investments.":""}
PROGRESSIVE PROFILING: If the user mentions their partner by name but you don't know it, note it. If they mention a child's age or birthday, note it. Surface gaps naturally in conversation — never ask for a form. Examples: "What's his name? I'll remember." or "How old is she? I'd love to keep track."
PROGRESSIVE PROFILING: If the user mentions their partner by name but you don't know it, note it. If they mention a child's age or birthday, note it. Surface gaps naturally in conversation — never ask for a form. Examples: "What's his name? I'll remember." or "How old is she? I'd love to keep track."
SELF-CORRECTION RULES: If you are not certain about a specific fact, local business, law, or statistic — say "I believe" or "worth checking" before stating it. Never invent specific names, addresses, prices or medical facts. Only reference information the user has actually shared with you. If a question is outside your knowledge, say so warmly and suggest where she can find accurate help.
Respond with 2-3 warm, specific, empathetic sentences that show you KNOW her. Then output:
<ND>{"tasks":[{"text":"","tag":"Work|Family|Me|Home|Travel","priority":"high|medium|low"}],"reminders":[{"text":""}],"insight":"a short, warm, personal observation about what she shared"}</ND>
Min 3 tasks. Make tasks specific and actionable. The insight should feel like it came from a close friend who truly gets her life.`;
    // Context compression — after 12 messages, summarize older ones to save tokens
    let hist=msgs.map(m=>({role:m.role,content:m.content}));
    if(hist.length>12){
      const recentHist=hist.slice(-6);
      const olderHist=hist.slice(0,-6);
      const summary=olderHist.map(m=>`${m.role}: ${m.content.slice(0,100)}`).join(" | ");
      hist=[
        {role:"user",content:`[Earlier conversation summary: ${summary}]`},
        {role:"assistant",content:"I understand. Let me continue from where we were."},
        ...recentHist
      ];
      try{
        const compressed=[{role:"assistant",content:`[Summary: ${summary}]`,parsed:null},...msgs.slice(-6)];
        localStorage.setItem("hn_nora_msgs",JSON.stringify(compressed));
        sessionStorage.setItem("hn_nora_msgs",JSON.stringify(compressed));
      }catch(e){}
    }
    try{
      logEvent(EVENTS.NORA_MESSAGE_SENT,{msgLen:msg.length});
      // Freeform task extraction detection
    const taskWords = ["need to","must","should","book","call","reply","sort","buy","pick up","collect","remind","don't forget","have to"];
    const taskMatches = taskWords.filter(w => msg.toLowerCase().includes(w));
    if(taskMatches.length >= 2 && msg.length > 30) {
      // Extract tasks via AI
      try{
        const extractSys = `Extract tasks from this message. Return ONLY valid JSON: {"tasks":[{"text":"task description","tag":"Family|Work|Home|Me|School"}]}. Max 6 tasks. Be specific. Do not invent tasks not mentioned.`;
        const extracted = await claude(extractSys, msg, [], "briefing_ask");
        const parsed = JSON.parse(extracted.replace(/```json|```/g,"").trim());
        if(parsed.tasks && parsed.tasks.length >= 2) {
          const taskList = parsed.tasks.map((t,i)=>`${i+1}. ${t.text} — ${t.tag}`).join("\n");
          const confirmMsg = `I heard:\n${taskList}\n\nWant me to add these to your Plan?`;
          setMsgs(p=>[...p,{role:"user",content:msg,parsed:null},{role:"assistant",content:confirmMsg,parsed:{pendingTasks:parsed.tasks,awaitingConfirm:true}}]);
          setLoading(false);
          return;
        }
      }catch(e){ /* fall through to normal response */ }
    }

    // Check if confirming pending tasks
    const lastMsg = msgs[msgs.length-1];
    if(lastMsg?.parsed?.awaitingConfirm && /yes|yeah|go ahead|add them|please|do it/i.test(msg)) {
      const tasks = lastMsg.parsed.pendingTasks;
      if(tasks && onTasks) onTasks(tasks);
      setMsgs(p=>[...p,{role:"user",content:msg,parsed:null},{role:"assistant",content:`Done. ${tasks.length} task${tasks.length>1?"s":""} added to your Plan. 💛`,parsed:null}]);
      setLoading(false);
      return;
    }

    const raw=await claude(sys,msg,hist,"nora_chat");
      const match=raw.match(/<ND>([\s\S]*?)<\/ND>/);
      let parsed=null;if(match){try{parsed=JSON.parse(match[1].trim());}catch(e){ /* silent */ }}
      const display=raw.replace(/<ND>[\s\S]*?<\/ND>/g,"").trim();
      setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:display,parsed}]);
      if(parsed&&onTasks)onTasks(parsed);
    }catch(e){setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:"I had a quiet moment there — my connection dropped. Your message was heard though. Try again and I'll be right here. 💛",parsed:null}]);}
    setLoading(false);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",animation:"fadeUp .4s ease both"}}>
      {/* Morning Briefing toggle */}
      <div onClick={()=>setShowBriefing(!showBriefing)} style={{background:"linear-gradient(135deg,#2d1a00,#5a3a10)",borderRadius:16,padding:"13px 16px",marginBottom:12,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:38,height:38,borderRadius:11,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic.Sun s={20} c="#F0E2B8" w={1.4}/></div>
        <div style={{flex:1}}><div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>Morning Briefing</div><div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.5)"}}>Tap to {showBriefing?"hide":"open"} your daily brief ☀️</div></div>
        <span style={{color:"rgba(255,255,255,.4)",fontSize:18}}>{showBriefing?"▲":"▼"}</span>
      </div>
      {showBriefing&&<div style={{marginBottom:12}}><BriefingScreen profile={profile} onAddTask={onAddTask} calEvents={calEvents}/></div>}

      <div style={{background:`linear-gradient(135deg,${T.esp} 0%,#3D2E22 100%)`,borderRadius:22,padding:"18px 20px",marginBottom:12,flexShrink:0,boxShadow:"0 24px 48px -24px rgba(42,31,24,.35)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",animation:"breathe 3s ease-in-out infinite",boxShadow:`0 0 20px rgba(196,154,60,.4)`}}><Ic.Star s={22} c="#fff" w={1.3}/></div>
          <div style={{flex:1}}><h2 style={{fontFamily:FD,fontSize:20,fontWeight:600,color:"#fff",margin:0,fontStyle:"italic"}}>Nora AI</h2><p style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.4)",margin:0,letterSpacing:1.5,textTransform:"uppercase"}}>Mental Load Manager</p></div>
          <button onClick={()=>{setMsgs([{role:"assistant",content:`Hello again ${profile?.name||"lovely"} 💛 Fresh start — what's on your mind?`,parsed:null}]);try{sessionStorage.removeItem("hn_nora_msgs");}catch(e){ /* silent */ }}} aria-label="Clear conversation" style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,padding:"5px 10px",fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.5)",cursor:"pointer"}}>Clear</button>

        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",paddingBottom:8}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12,animation:"fadeUp .3s ease both"}}>
            {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,marginRight:8,background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",alignSelf:"flex-end"}}><Ic.Star s={13} c="#fff" w={1.5}/></div>}
            <div style={{maxWidth:"82%",background:m.role==="user"?`linear-gradient(135deg,${T.esp},#4a3020)`:"#fff",borderRadius:m.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px",padding:"12px 16px",boxShadow:"0 2px 12px rgba(0,0,0,.08)",border:m.role==="assistant"?`1px solid ${T.linen}`:"none"}}>
              <div style={{color:m.role==="user"?"rgba(255,255,255,.9)":T.esp}}>
                {m.content.split("\n").filter(l=>l.trim()).map((line,j)=><p key={j} style={{margin:"0 0 5px",lineHeight:1.65,fontSize:13,fontFamily:FB}}>{line}</p>)}
              </div>
              {m.parsed&&<div style={{marginTop:12,borderTop:`1px solid ${T.linen}`,paddingTop:10}}>
                <AIBadge t="Organised for you"/>
                <div style={{marginTop:10}}>
                  {m.parsed.tasks?.slice(0,4).map((tk,k)=>(
                    <div key={k} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:T.sand,borderRadius:10,marginBottom:6}}>
                      <Tile ic={tIC(tk.tag)} c={tC(tk.tag)} bg={tC(tk.tag)+"18"} s={14} ts={28} r={8}/>
                      <span style={{fontFamily:FB,fontSize:12,color:T.esp,flex:1}}>{tk.text}</span>
                      <Tag ch={tk.tag} c={tC(tk.tag)}/>
                    </div>
                  ))}
                  {m.parsed.insight&&<div style={{padding:"10px",background:T.blushP,borderRadius:12,marginTop:6}}><p style={{fontFamily:FD,fontStyle:"italic",fontSize:13,color:T.esp,margin:0,lineHeight:1.6}}>"{m.parsed.insight}"</p></div>}
                </div>
              </div>}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:12}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Star s={13} c="#fff" w={1.5}/></div>
          <div style={{background:"#fff",borderRadius:"20px 20px 20px 4px",padding:"14px 18px",border:`1px solid ${T.linen}`}}><Dots/></div>
        </div>}
        <div ref={ref}/>
      </div>
      {msgs.length<2&&<div style={{flexShrink:0,marginBottom:8}}>{SUGG.map((s,i)=><div key={i} onClick={()=>setInp(s)} style={{background:"#fff",border:`1px solid ${T.linen}`,borderRadius:12,padding:"9px 14px",marginBottom:6,cursor:"pointer",fontFamily:FB,fontSize:12,color:T.bark,lineHeight:1.5}}>{s}</div>)}</div>}
      <div style={{flexShrink:0,display:"flex",gap:8,paddingTop:8,borderTop:`1px solid ${T.linen}`}}>
        <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Tell me what's on your mind…" rows={2} style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:16,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp,lineHeight:1.5}}/>
        <button onClick={startVoice} aria-label={listening?"Stop listening":"Start voice input"} style={{width:46,height:46,borderRadius:14,border:`1.5px solid ${listening?T.blush:T.linen}`,flexShrink:0,background:listening?T.blushP:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:"flex-end",transition:"all .2s"}}>
          {listening?<div style={{display:"flex",gap:2,alignItems:"flex-end",height:16}}>{[8,14,10,16,8].map((h,i)=><div key={i} style={{width:3,height:h,background:T.blush,borderRadius:2,animation:`dot 1s ease-in-out ${i*.1}s infinite`}}/>)}</div>:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" stroke={T.bark} strokeWidth="1.5"/><path d="M5 10a7 7 0 0014 0" stroke={T.bark} strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="21" stroke={T.bark} strokeWidth="1.5" strokeLinecap="round"/></svg>}
        </button>
        <button onClick={send} disabled={!inp.trim()||loading} aria-label="Send message" style={{width:46,height:46,borderRadius:14,border:"none",flexShrink:0,background:inp.trim()&&!loading?`linear-gradient(135deg,${T.esp},#4a3020)`:T.linen,cursor:inp.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:"flex-end"}}>
          {loading?<Spinner/>:<Ic.Send s={18} c={inp.trim()?"#fff":T.taupe} w={2}/>}
        </button>
      </div>
    </div>
  );
}
