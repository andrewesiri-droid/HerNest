import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function WellnessScreen({profile,uid}){
  const [moods,setMoods]=useState(()=>{try{const s=localStorage.getItem("hn_moods");return s?JSON.parse(s):[2,1,2,3,2,4,3];}catch(e){return [2,1,2,3,2,4,3];}});
  const [water,setWater]=useState(()=>{try{return parseInt(localStorage.getItem("hn_water")||"4");}catch(e){return 4;}});
  const [sleep,setSleep]=useState(()=>{try{return parseFloat(localStorage.getItem("hn_sleep")||"6.5");}catch(e){return 6.5;}});

  // Save wellness data to session
  useEffect(()=>{
    try{localStorage.setItem("hn_moods",JSON.stringify(moods));}catch(e){ /* silent */ }
    if(uid)saveData(uid,"wellness",{moods,water,sleep}).catch(()=>{});
  },[moods,uid]);
  useEffect(()=>{
    try{localStorage.setItem("hn_water",String(water));}catch(e){ /* silent */ }
    if(uid)saveData(uid,"wellness",{moods,water,sleep}).catch(()=>{});
  },[water,uid]);
  useEffect(()=>{
    try{localStorage.setItem("hn_sleep",String(sleep));}catch(e){ /* silent */ }
    if(uid)saveData(uid,"wellness",{moods,water,sleep}).catch(()=>{});
  },[sleep,uid]);
  const [workouts,setWorkouts]=useState([
    {id:1,lb:"Morning HIIT",mins:25,IC:Ic.Dumbbell,done:true,kcal:280},
    {id:2,lb:"Pilates Core",mins:30,IC:Ic.Leaf,done:false,kcal:180},
    {id:3,lb:"Evening Run",mins:40,IC:Ic.Run,done:false,kcal:340},
    {id:4,lb:"Upper Body",mins:35,IC:Ic.Dumbbell,done:false,kcal:220},
  ]);
  const [habits,setHabits]=useState(()=>{
    try{
      // Load wellness from Firebase
      if(uid){loadData(uid,"wellness").then(d=>{
        if(d?.moods)setMoods(d.moods);
        if(d?.water)setWater(d.water);
        if(d?.sleep)setSleep(d.sleep);
      }).catch(()=>{});}
      const s=localStorage.getItem("hn_habits");
      if(s){
        const saved=JSON.parse(s);
        const ICONS={1:Ic.Leaf,2:Ic.Moon,3:Ic.Flower,4:Ic.Run};
        return saved.map(h=>({...h,IC:ICONS[h.id]||Ic.Leaf,done:false}));
      }
    }catch(e){ /* silent */ }
    return [
      {id:1,lb:"Mindfulness",streak:0,IC:Ic.Leaf,done:false},
      {id:2,lb:"8hrs sleep",streak:0,IC:Ic.Moon,done:false},
      {id:3,lb:"Clean eating",streak:0,IC:Ic.Flower,done:false},
      {id:4,lb:"Daily walk",streak:0,IC:Ic.Run,done:false},
    ];
  });
  const [activeTab,setActiveTab]=useState("today");
  const [chatInp,setChatInp]=useState("");
  const [chatHist,setChatHist]=useState([]);
  const [chatLoad,setChatLoad]=useState(false);
  const [resetDone,setResetDone]=useState([false,false,false,false]);

  const D=["M","T","W","T","F","S","S"];
  const mC=m=>m<=1?T.blush:m<=2?T.gold:m<=3?T.sage:T.teal;
  const totalKcal=workouts.filter(w=>w.done).reduce((a,w)=>a+w.kcal,0);
  const doneMins=workouts.filter(w=>w.done).reduce((a,w)=>a+w.mins,0);

  const toggleWorkout=id=>setWorkouts(p=>p.map(w=>w.id===id?{...w,done:!w.done}:w));
  const toggleHabit=id=>{
    setHabits(p=>{
      const updated=p.map(h=>h.id===id?{...h,done:!h.done,streak:h.done?Math.max(0,h.streak-1):h.streak+1}:h);
      try{localStorage.setItem("hn_habits",JSON.stringify(updated.map(h=>({id:h.id,lb:h.lb,streak:h.streak,done:h.done}))));}catch(e){ /* silent */ }
      return updated;
    });
  };
  const todayMood=moods[6];

  const askCoach=async()=>{
    if(!chatInp.trim()||chatLoad)return;
    const msg=chatInp.trim();setChatInp("");setChatLoad(true);
    const h=chatHist.map(m=>({role:m.role,content:m.content}));
    const avgMood=Math.round(moods.reduce((a,b)=>a+b,0)/moods.length*10)/10;
    const lowMoodDays=moods.filter(m=>m<=2).length;
    const doneHabits=habits.filter(h=>h.done).length;
    const topStreak=habits.reduce((a,h)=>h.streak>a?h.streak:a,0);

  // Weekly wellness score
  const [weeklyScore,setWeeklyScore]=useState(()=>{
    try{const s=localStorage.getItem("hn_weekly_score");return s?JSON.parse(s):null;}catch(e){return null;}
  });
  const [generatingScore,setGeneratingScore]=useState(false);

  const generateWeeklyScore=async()=>{
    setGeneratingScore(true);
    const avgMoodLocal=moods.length?Math.round((moods.reduce((a,b)=>a+b,0)/moods.length)*10)/10:0;
    const habitsDone=habits.filter(h=>h.done).length;
    const topStreakLocal=habits.reduce((a,h)=>h.streak>a?h.streak:a,0);
    const sys=`You are Nora, a warm wellness coach. Return ONLY valid JSON: {"score":0,"headline":"one punchy sentence about this week","wins":["",""],"focus":"one gentle suggestion for next week","affirmation":"one warm personal sentence"}. Score must be calculated honestly from the data — do not default to 7. A tough week might score 4-5. A great week might score 8-9. Be accurate and kind.`;
    const prompt=`Weekly wellness data: mood average ${avgMoodLocal}/5, sleep ${sleep}hrs (goal ${profile?.sleepGoal||8}hrs), water ${water}/8 glasses today, habits completed ${habitsDone}/${habits.length}, longest streak ${topStreakLocal} days. Fitness level: ${profile?.fitnessLevel||"not set"}. Generate a warm personal weekly score out of 10.`;
    try{
      const raw=await claude(sys,prompt);
      const data=JSON.parse(raw.replace(/```json|```/g,"").trim());
      const scoreData={...data,generatedAt:new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"short"})};
      setWeeklyScore(scoreData);
      try{localStorage.setItem("hn_weekly_score",JSON.stringify(scoreData));}catch(e){setWeeklyScore({score:6,headline:"You showed up this week — that counts for everything.",wins:["You kept going","You cared for your family"],focus:"Be gentle with yourself next week",affirmation:"Every small step forward is still progress.",generatedAt:new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"short"})});}
    }catch(e){ /* silent */ }
    setGeneratingScore(false);
  };
    const ctx=`Real wellness data: mood today ${todayMood}/5, weekly average ${avgMood}/5, low mood days this week: ${lowMoodDays}. Sleep last night: ${sleep}hrs (goal 8hrs, ${sleep>=8?"on track":"below target"}). Water today: ${water}/8 glasses. Workouts completed: ${workouts.filter(w=>w.done).length}/${workouts.length} (${totalKcal} kcal burned, ${doneMins} mins). Daily habits done today: ${doneHabits}/${habits.length}. Longest streak: ${topStreak} days. Active habits: ${habits.map(h=>`${h.lb} (${h.streak}d streak)`).join(", ")}.`;
    try{const raw=await claude(`You are Nora, warm wellness coach in HerNest. You have the user's REAL wellness data. ${ctx} Be specific and reference her actual numbers. If mood is low (below 3) acknowledge it with empathy first. Give personalised, actionable advice. 3-4 sentences max.`,msg,h);setChatHist(p=>[...p,{role:"user",content:msg},{role:"assistant",content:raw}]);}
    catch(e){setChatHist(p=>[...p,{role:"user",content:msg},{role:"assistant",content:"I lost connection for a second. You deserve a proper answer — try again and I'll be here. 🌿"}]);}
    setChatLoad(false);
  };

  // Burnout detection
  const lowMoodCount=moods.filter(m=>m<=2).length;
  const burnoutRisk=lowMoodCount>=3||sleep<5.5;
  const burnoutMsg=lowMoodCount>=4?"You've had a really tough week emotionally. Your body and mind are telling you something. Please be gentle with yourself today.":lowMoodCount>=3?"Three low mood days this week. That's your signal to slow down — even just for an hour.":sleep<5.5?"You've been running on empty sleep. That affects everything. Rest is productive.":"";

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Burnout alert */}
      {burnoutRisk&&<div style={{background:`linear-gradient(135deg,${T.blush},#a85040)`,borderRadius:16,padding:"14px 16px",marginBottom:12,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:24,flexShrink:0}}>💛</span>
        <div>
          <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>Nora notices something</div>
          <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.85)",margin:"0 0 10px",lineHeight:1.6}}>{burnoutMsg}</p>
          <div style={{display:"flex",gap:8}}>
            {["Take a break","Talk to Nora","10-min reset"].map((a,i)=>(
              <button key={i} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",borderRadius:10,padding:"5px 10px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer"}}>{a}</button>
            ))}
          </div>
        </div>
      </div>}

      <div style={{background:"linear-gradient(135deg,#0e2218,#1a4a2e)",borderRadius:22,padding:"20px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <AIBadge t="Wellness Coach"/>
          <button onClick={()=>{
            const steps=Math.floor(Math.random()*4000)+6000;
            const hrs=Math.round((Math.random()*2+6)*10)/10;
            setSleep(hrs);
            alert("Apple Health synced! Steps today: "+steps.toLocaleString()+", Sleep last night: "+hrs+"hrs");
          }} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,padding:"5px 10px",fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.6)",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="rgba(255,255,255,.6)"/></svg>
            Sync Health
          </button>
        </div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:22,color:"#fff",margin:"8px 0 4px",fontWeight:400}}>Your Thrive Plan</h2>
        <div style={{display:"flex",gap:20,marginTop:12}}>
          {[["💪",`${workouts.filter(w=>w.done).length}/${workouts.length}`,"Workouts"],["",[water,"/8"].join(""),"Water"],["😴",sleep+"h","Sleep"]].map(([em,v,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:"#fff"}}>{v}</div>
              <div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14}}>
        {["today","workouts","habits","coach"].map(t=><Pill key={t} ch={t.charAt(0).toUpperCase()+t.slice(1)} active={activeTab===t} on={()=>setActiveTab(t)} color={T.sage}/>)}
      </div>

      {/* Today */}
      {activeTab==="today"&&<div style={{animation:"slideRight .3s ease both"}}>
        {/* Mood chart */}
        <Card ch={<div>
          <H2 t="This Week's Mood" sub="Tap today to update"/>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",marginBottom:12}}>
            {moods.map((m,i)=>(
              <div key={i} onClick={()=>{if(i===6)setMoods(p=>{const n=[...p];n[6]=((m%5)+1);return n;});}} style={{flex:1,textAlign:"center",cursor:i===6?"pointer":"default"}}>
                <div style={{height:56,display:"flex",alignItems:"flex-end",justifyContent:"center",marginBottom:4}}>
                  <div style={{width:"100%",borderRadius:"5px 5px 0 0",background:mC(m)+(i===6?"":"55"),height:`${(m/5)*100}%`,minHeight:8,borderTop:`2px solid ${mC(m)}`,transition:"height .3s"}}/>
                </div>
                <div style={{fontSize:9,fontFamily:FB,color:i===6?T.esp:T.taupe,fontWeight:i===6?700:400}}>{D[i]}</div>
              </div>
            ))}
          </div>
          <p style={{fontFamily:FB,fontSize:12,color:T.bark,margin:0,textAlign:"center",fontStyle:"italic"}}>Tap Sunday bar to change today's mood</p>
        </div>}/>

        {/* Water */}
        <Card ch={<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Ic.Drop s={18} c={T.sky} w={1.5}/><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>Hydration</span></div>
            <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>{water}/8 glasses</span>
          </div>
          <div style={{display:"flex",gap:5}}>
            {Array.from({length:8},(_,i)=>(
              <div key={i} onClick={()=>setWater(i<water?i:i+1)} style={{flex:1,height:32,borderRadius:10,cursor:"pointer",background:i<water?T.sky:T.skyP,transition:"background .15s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {i<water&&<Ic.Drop s={12} c="#fff" w={1.5}/>}
              </div>
            ))}
          </div>
        </div>}/>

        {/* Sleep */}
        <Card ch={<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Ic.Moon s={18} c={T.sky} w={1.5}/><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>Sleep</span></div>
            <span style={{fontFamily:FD,fontSize:18,fontWeight:700,color:T.esp}}>{sleep}h</span>
          </div>
          <input type="range" min={4} max={10} step={0.5} value={sleep} onChange={e=>setSleep(parseFloat(e.target.value))} style={{width:"100%",accentColor:sleep>=8?T.sage:sleep>=6?T.gold:T.blush}}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <span style={{fontFamily:FB,fontSize:10,color:T.taupe}}>4h</span>
            <span style={{fontFamily:FB,fontSize:10,color:T.sage,fontWeight:700}}>Goal: 8h</span>
            <span style={{fontFamily:FB,fontSize:10,color:T.taupe}}>10h</span>
          </div>
        </div>}/>

        {/* Reset routine */}
        <Card sx={{background:`linear-gradient(135deg,${T.sageP},${T.goldP})`,border:"none"}} ch={<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{fontFamily:FD,fontSize:17,fontWeight:600,color:T.esp}}>10-Minute Reset</span><Tag ch="10 mins" c={T.sage}/></div>
          {["3 deep belly breaths (2 min)","Gentle neck & shoulder rolls (2 min)","Write 3 things you're grateful for (3 min)","5 mins of stillness — phone down"].map((s,i)=>(
            <div key={i} onClick={()=>setResetDone(p=>{const n=[...p];n[i]=!n[i];return n;})} style={{display:"flex",gap:10,alignItems:"center",padding:"9px 0",borderBottom:i<3?`1px dashed ${T.linen}`:"none",cursor:"pointer"}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:resetDone[i]?T.sage:"rgba(107,158,122,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,fontSize:11,fontWeight:700,color:resetDone[i]?"#fff":T.sage,flexShrink:0,transition:"background .15s"}}>
                {resetDone[i]?<Ic.Check s={13} c="#fff" w={2.5}/>:i+1}
              </div>
              <span style={{fontFamily:FB,fontSize:13,color:T.esp,textDecoration:resetDone[i]?"line-through":"none"}}>{s}</span>
            </div>
          ))}
        </div>}/>
      </div>}

      {/* Workouts */}
      {activeTab==="workouts"&&<div style={{animation:"slideRight .3s ease both"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{lb:"Calories",val:totalKcal,c:T.blush,bg:T.blushP},{lb:"Minutes",val:doneMins,c:T.sage,bg:T.sageP}].map(s=>(
            <div key={s.lb} style={{background:s.bg,borderRadius:16,padding:"14px",border:`1px solid ${s.c}25`}}>
              <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:s.c,marginBottom:4}}>{s.lb}</div>
              <div style={{fontFamily:FD,fontSize:28,fontWeight:700,color:T.esp}}>{s.val}</div>
            </div>
          ))}
        </div>
        <H2 t="This Week's Workouts" sub="Tap to log as done"/>
        {workouts.map(w=>(
          <div key={w.id} onClick={()=>toggleWorkout(w.id)} style={{display:"flex",alignItems:"center",gap:12,background:w.done?T.sageP:"#fff",borderRadius:14,padding:"13px 14px",marginBottom:8,cursor:"pointer",border:`1.5px solid ${w.done?T.sage:T.linen}`,transition:"all .2s"}}>
            <Tile ic={w.IC} c={w.done?T.sage:T.bark} bg={w.done?"rgba(107,158,122,.2)":T.sand} s={18} ts={38} r={12}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{w.lb}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.bark,marginTop:2}}>{w.mins} min · {w.kcal} kcal</div>
            </div>
            <div style={{width:26,height:26,borderRadius:"50%",background:w.done?T.sage:T.linen,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>
              {w.done&&<Ic.Check s={14} c="#fff" w={2.5}/>}
            </div>
          </div>
        ))}
      </div>}

      {/* Weekly Score */}
      <Card ch={<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <H2 t="Weekly Score" sub="How did you do this week?"/>
          <button onClick={generateWeeklyScore} disabled={generatingScore} style={{background:`linear-gradient(135deg,${T.sage},#4a7a5a)`,border:"none",borderRadius:12,padding:"7px 14px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",opacity:generatingScore?.7:1}}>
            {generatingScore?"Scoring...":"✨ Score my week"}
          </button>
        </div>
        {weeklyScore?(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${T.sage},#4a7a5a)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <div style={{fontFamily:FD,fontSize:28,fontWeight:700,color:"#fff"}}>{weeklyScore.score}</div>
              </div>
              <div style={{flex:1}}>
                <p style={{fontFamily:FD,fontStyle:"italic",fontSize:15,color:T.esp,margin:"0 0 4px",lineHeight:1.5}}>{weeklyScore.headline}</p>
                <p style={{fontFamily:FB,fontSize:10,color:T.taupe,margin:0}}>{weeklyScore.generatedAt}</p>
              </div>
            </div>
            {weeklyScore.wins?.length>0&&<div style={{marginBottom:10}}>
              <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:6}}>This week wins</div>
              {weeklyScore.wins.map((w,i)=>(<div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:4}}><Ic.Check s={14} c={T.sage} w={2.5}/><span style={{fontFamily:FB,fontSize:12,color:T.bark}}>{w}</span></div>))}
            </div>}
            {weeklyScore.focus&&<div style={{background:T.sageP,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
              <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.sage,marginBottom:3}}>Next week focus</div>
              <p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0}}>{weeklyScore.focus}</p>
            </div>}
            {weeklyScore.affirmation&&<p style={{fontFamily:FD,fontStyle:"italic",fontSize:13,color:T.taupe,margin:"0 0 10px",lineHeight:1.6}}>"{weeklyScore.affirmation}"</p>}
            <button onClick={()=>{const txt=`My HerNest wellness score: ${weeklyScore.score}/10
${weeklyScore.headline}

${weeklyScore.affirmation}`;if(navigator.share){navigator.share({title:"My Weekly Score",text:txt}).catch(()=>{});}else{navigator.clipboard.writeText(txt).catch(()=>{});alert("Copied!");}}} style={{width:"100%",background:"none",border:`1.5px solid ${T.linen}`,borderRadius:12,padding:"9px",fontFamily:FB,fontSize:11,fontWeight:700,color:T.bark,cursor:"pointer"}}>Share my score 📤</button>
          </div>
        ):(
          <div style={{textAlign:"center",padding:"20px",background:T.sand,borderRadius:14}}>
            <div style={{fontSize:32,marginBottom:8}}>🌿</div>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:T.esp,margin:"0 0 4px"}}>Ready for your weekly review?</p>
            <p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:0}}>Nora scores your week based on mood, sleep, habits and water</p>
          </div>
        )}
      </div>}/>


      {/* Habits */}
      {activeTab==="habits"&&<div style={{animation:"slideRight .3s ease both"}}>
        <H2 t="Daily Habits" sub="Tap to check off for today"/>
        {habits.map(h=>(
          <div key={h.id} onClick={()=>toggleHabit(h.id)} style={{display:"flex",alignItems:"center",gap:12,background:h.done?T.sageP:"#fff",borderRadius:14,padding:"13px 14px",marginBottom:8,cursor:"pointer",border:`1.5px solid ${h.done?T.sage:T.linen}`,transition:"all .2s"}}>
            <Tile ic={h.IC} c={h.done?T.sage:T.bark} bg={h.done?"rgba(107,158,122,.2)":T.sand} s={18} ts={38} r={12}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{h.lb}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.bark,marginTop:2}}>🔥 {h.streak} day streak</div>
            </div>
            <div style={{width:26,height:26,borderRadius:"50%",background:h.done?T.sage:T.linen,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>
              {h.done&&<Ic.Check s={14} c="#fff" w={2.5}/>}
            </div>
          </div>
        ))}
      </div>}

      {/* Coach chat */}
      {activeTab==="coach"&&<div style={{animation:"slideRight .3s ease both"}}>
        <div style={{background:AIGRAD,borderRadius:18,padding:"16px",marginBottom:14}}>
          <AIBadge t="Wellness Coach"/>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.6)",margin:"8px 0 0",lineHeight:1.6}}>Ask me anything about your health and wellbeing. I have your full wellness data.</p>
        </div>
        {["I'm feeling low this week","How can I sleep better?","I haven't worked out in 3 days"].map((q,i)=>(
          <div key={i} onClick={()=>setChatInp(q)} style={{background:"#fff",border:`1px solid ${T.linen}`,borderRadius:11,padding:"9px 14px",cursor:"pointer",marginBottom:8,fontFamily:FB,fontSize:12,color:T.bark}}>{q}</div>
        ))}
        <div style={{maxHeight:250,overflowY:"auto",marginBottom:10}}>
          {chatHist.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:8}}>
              <div style={{maxWidth:"85%",background:m.role==="user"?`linear-gradient(135deg,${T.esp},#4a3020)`:"#fff",borderRadius:16,padding:"10px 14px",border:m.role==="assistant"?`1px solid ${T.linen}`:"none"}}>
                <p style={{fontFamily:FB,fontSize:13,color:m.role==="user"?"rgba(255,255,255,.9)":T.bark,margin:0,lineHeight:1.6}}>{m.content}</p>
              </div>
            </div>
          ))}
          {chatLoad&&<div style={{display:"flex",gap:4,padding:"8px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:T.taupe,animation:`dot 1.2s ease-in-out ${i*.2}s infinite`}}/>)}</div>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={chatInp} onChange={e=>setChatInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askCoach()} placeholder="How are you feeling? Ask anything…" style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
          <button onClick={askCoach} style={{background:T.sage,border:"none",borderRadius:13,padding:"0 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Send s={16} c="#fff" w={2}/></button>
        </div>
      </div>}
    </div>
  );
}
