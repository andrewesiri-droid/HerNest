import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { extractAutoTasks } from "../utils/inference/taskExtractor";
import { claude } from "../utils/claude";
import { TRACKING } from "../utils/tracking.js";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar, PageTitle, HeroCard } from "../components/shared";
import { SchoolCalendar } from "./SchoolCalendar";
import { CalendarScreen } from "./CalendarScreen";

export function PlanScreen({aiTasks,profile,uid,calEvents}){
  const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today=new Date();
  const [selectedDay,setSelectedDay]=useState(today.getDay());
  const DEFAULT_TASKS=[];
  const [pendingAutoTasks,setPendingAutoTasks]=useState([]);

  // Extract auto tasks from school events + birthdays + trips
  useEffect(()=>{
    if(!profile)return;
    const schoolRaw=localStorage.getItem("hn_school_events");
    const tripsRaw=localStorage.getItem("hn_trips");
    const schoolEvents=schoolRaw?JSON.parse(schoolRaw):[];
    const trips=tripsRaw?JSON.parse(tripsRaw):[];
    const autoTasks=extractAutoTasks(profile,schoolEvents,trips);
    // Filter out ones already in tasks list
    const existingIds=new Set(tasks.map(t=>t.id).filter(Boolean));
    const newOnes=autoTasks.filter(t=>!existingIds.has(t.id));
    if(newOnes.length>0)setPendingAutoTasks(newOnes);
  },[profile?.name]);

  const confirmAutoTask=(task)=>{
    const confirmed={...task,confirmed:true,autoCreated:true};
    setTasks(p=>[...p,confirmed]);
    setPendingAutoTasks(p=>p.filter(t=>t.id!==task.id));
  };
  const dismissAutoTask=(task)=>setPendingAutoTasks(p=>p.filter(t=>t.id!==task.id));

  const [tasks,setTasks]=useState(()=>{
    try{const s=localStorage.getItem("hn_tasks");return s?JSON.parse(s):DEFAULT_TASKS;}catch(e){return DEFAULT_TASKS;}
  });
  const [inp,setInp]=useState("");
  const [selTag,setSelTag]=useState("Family");
  const [selPri,setSelPri]=useState("medium");
  const [filter,setFilter]=useState("All");
  const [showAdd,setShowAdd]=useState(false);
  const [selRecur,setSelRecur]=useState("none");
  const [planTab, setPlanTab] = useState("tasks");
  const [meals,setMeals]=useState({Mon:{b:"",l:"",d:""},Tue:{b:"",l:"",d:""},Wed:{b:"",l:"",d:""},Thu:{b:"",l:"",d:""},Fri:{b:"",l:"",d:""},Sat:{b:"",l:"",d:""},Sun:{b:"",l:"",d:""}});
  const [editMeal,setEditMeal]=useState(null);
  const [mealDay,setMealDay]=useState("Mon");
  const [generatingMeals,setGeneratingMeals]=useState(false);
  const [shoppingList,setShoppingList]=useState([]);
  const [showShopping,setShowShopping]=useState(false);

  const generateMealPlan=async()=>{
    setGeneratingMeals(true);
    const diet=profile?.diet||"No restrictions";
    const kids=(profile?.kids||[]).length;
    const sys=`Meal planner. Return ONLY valid JSON, no extra text: {"meals":{"Mon":{"b":"","l":"","d":""},"Tue":{"b":"","l":"","d":""},"Wed":{"b":"","l":"","d":""},"Thu":{"b":"","l":"","d":""},"Fri":{"b":"","l":"","d":""},"Sat":{"b":"","l":"","d":""},"Sun":{"b":"","l":"","d":""}},"shoppingList":[""]}. Keep each meal name under 5 words. Shopping list max 20 items.`;
    const energyNote=profile?.energyPattern==="morning"?" Big breakfast, lighter dinner — she has morning energy.":" Balanced meals throughout the day.";
    const prompt=`7-day meal plan. Diet: ${diet}. ${kids>0?`Has ${kids} kids.`:""}${energyNote} Quick practical meals. Short meal names only.`;
    try{
      const raw=await claude(sys,prompt,[],"meal_plan");
      const text=typeof raw==="string"?raw:JSON.stringify(raw);
      const data=JSON.parse(text.replace(/```json|```/g,"").trim());
      if(data.meals)setMeals(data.meals);
      if(data.shoppingList)setShoppingList(data.shoppingList);
    }catch(e){
      console.error("[MealPlan]",e?.message);
    }
    setGeneratingMeals(false);
  };

  // Save tasks to session storage whenever they change
  useEffect(()=>{
    try{localStorage.setItem("hn_tasks",JSON.stringify(tasks));}catch(e){ /* silent */ }
    if(uid) saveData(uid,"tasks",{tasks}).catch(()=>{});
  },[tasks]);

  // Load tasks from Firebase on mount
  useEffect(()=>{
    if(!uid)return;
    loadData(uid,"tasks").then(d=>{
      if(d?.tasks?.length) setTasks(d.tasks);
    }).catch(()=>{});
  },[uid]);

  useEffect(()=>{
    if(aiTasks?.length){
      setTasks(prev=>{const ex=prev.map(t=>t.text);const nw=aiTasks.filter(t=>!ex.includes(t.text)).map((t,i)=>({id:Date.now()+i,...t,done:false,priority:"medium",dueDay:today.getDay()}));return [...prev,...nw];});
    }
  },[aiTasks]);

  const add=()=>{
    if(!inp.trim())return;
    const base={id:Date.now(),text:inp,done:false,tag:selTag,priority:selPri,dueDay:selectedDay,recur:selRecur};
    if(selRecur==="daily"){
      const newTasks=[0,1,2,3,4,5,6].map((d,i)=>({...base,id:Date.now()+i,dueDay:d}));
      setTasks(p=>[...p,...newTasks]);
    } else if(selRecur==="weekdays"){
      const newTasks=[1,2,3,4,5].map((d,i)=>({...base,id:Date.now()+i,dueDay:d}));
      setTasks(p=>[...p,...newTasks]);
    } else if(selRecur==="weekly"){
      setTasks(p=>[...p,base]);
    } else {
      setTasks(p=>[...p,base]);
    }
    setInp("");setShowAdd(false);setSelRecur("none");
  };
  const toggle=id=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));
  const del=id=>setTasks(p=>p.filter(t=>t.id!==id));
  const tC=t=>t==="Work"?T.sky:t==="Family"?T.sage:t==="Me"?T.blush:t==="Travel"?T.teal:T.gold;
  const tIC=t=>t==="Work"?Ic.Bag:t==="Family"?Ic.Kids:t==="Me"?Ic.Leaf:t==="Travel"?Ic.Suitcase:Ic.Home;
  const pColor=p=>p==="high"?T.blush:p==="medium"?T.gold:T.sage;
  const dayTasks=tasks.filter(t=>t.dueDay===selectedDay);
  const visible=filter==="All"?dayTasks:dayTasks.filter(t=>t.tag===filter);
  const donePct=tasks.length?Math.round((tasks.filter(t=>t.done).length/tasks.length)*100):0;

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* ── PLAN TABS ─────────────────────────────────────────── */}
      <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
        <Pill ch="✓ Tasks" active={planTab==="tasks"} on={()=>setPlanTab("tasks")} color={T.esp}/>
        <Pill ch="📅 Calendar" active={planTab==="calendar"} on={()=>setPlanTab("calendar")} color={T.sky}/>
        <Pill ch="🎒 School" active={planTab==="school"} on={()=>setPlanTab("school")} color="#1a5a9e"/>
        <Pill ch="🍽️ Meals" active={planTab==="meals"} on={()=>setPlanTab("meals")} color={T.sage}/>
      </div>
      {/* Header */}
      <PageTitle eyebrow={new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}).toUpperCase()} title="Today's Plan"/>
      <HeroCard
        eyebrow="COMMAND CENTRE"
        title={donePct===100?"All done — you crushed it":donePct>50?"More than halfway there":"Three things, in this order"}
        subtitle={donePct===100?"Take a moment to celebrate.":"Focus on what matters most today."}
        metric={`${donePct}%`}
        metricLabel="Done"
      >
        <div style={{height:6,borderRadius:999,background:"rgba(252,250,245,.12)",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${donePct}%`,background:`linear-gradient(90deg,${T.gold},${T.sage})`,transition:"width .5s"}}/>
        </div>
      </HeroCard>

      {/* Day selector */}
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>
        {Array.from({length:7},(_,i)=>{
          const d=new Date(today);d.setDate(today.getDate()-today.getDay()+i);
          const isT=i===today.getDay();const isSel=i===selectedDay;
          const cnt=tasks.filter(t=>t.dueDay===i&&!t.done).length;
          return(
            <div key={i} onClick={()=>setSelectedDay(i)} style={{flexShrink:0,width:48,borderRadius:14,padding:"8px 0",textAlign:"center",cursor:"pointer",background:isSel?T.esp:isT?T.goldP:T.sand,border:isSel?"none":`1px solid ${T.linen}`,position:"relative"}}>
              <div style={{fontFamily:FB,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:isSel?T.gold:T.bark}}>{DAYS[i]}</div>
              <div style={{fontFamily:FD,fontSize:18,fontWeight:600,color:isSel?"#fff":T.esp,marginTop:2}}>{d.getDate()}</div>
              {cnt>0&&<div style={{position:"absolute",top:4,right:6,width:16,height:16,borderRadius:"50%",background:T.blush,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,fontSize:9,fontWeight:700,color:"#fff"}}>{cnt}</div>}
            </div>
          );
        })}
      </div>

      {/* Auto-detected tasks */}
      {pendingAutoTasks.length>0&&<div style={{background:T.goldP,borderRadius:16,padding:"12px 14px",marginBottom:12,border:`1.5px solid ${T.gold}30`}}>
        <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.gold,marginBottom:8}}>⚡ Nora noticed these — add or dismiss</div>
        {pendingAutoTasks.map((t,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <span style={{fontSize:14}}>{t.source==="school_auto"?"📚":t.source==="birthday_auto"?"🎂":"✈️"}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:12,fontWeight:600,color:T.esp}}>{t.text}</div>
              <div style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{t.dueDay===0?"Today":t.dueDay===1?"Tomorrow":`In ${t.dueDay} days`}</div>
            </div>
            <button onClick={()=>confirmAutoTask(t)} style={{background:T.sage,border:"none",borderRadius:8,padding:"4px 10px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer"}}>Add</button>
            <button onClick={()=>dismissAutoTask(t)} style={{background:"none",border:"none",fontFamily:FB,fontSize:16,color:T.taupe,cursor:"pointer"}}>×</button>
          </div>
        ))}
      </div>}

      {/* Add task */}
      <button onClick={()=>setShowAdd(!showAdd)} style={{width:"100%",background:showAdd?T.esp:T.sand,border:`1.5px solid ${showAdd?T.esp:T.linen}`,borderRadius:14,padding:"11px 16px",fontFamily:FB,fontSize:13,color:showAdd?"#fff":T.bark,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:10,transition:"all .15s"}}>
        <Ic.Plus s={18} c={showAdd?"#fff":T.bark} w={2}/>{showAdd?"Cancel":"Add a task"}
      </button>

      {showAdd&&(
        <div style={{background:"#fff",borderRadius:18,padding:"16px",marginBottom:12,border:`1.5px solid ${T.gold}`,animation:"pop .2s ease both"}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="What needs to get done?" autoFocus
            style={{width:"100%",fontFamily:FB,fontSize:14,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:12}}/>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            {["Family","Work","Me","Home","Travel"].map(t=>(
              <button key={t} onClick={()=>setSelTag(t)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${selTag===t?tC(t):T.linen}`,background:selTag===t?tC(t)+"18":"transparent",fontFamily:FB,fontSize:11,color:selTag===t?tC(t):T.bark,cursor:"pointer"}}>{t}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {["high","medium","low"].map(p=>(
              <button key={p} onClick={()=>setSelPri(p)} style={{flex:1,padding:"6px",borderRadius:10,border:`1.5px solid ${selPri===p?pColor(p):T.linen}`,background:selPri===p?pColor(p)+"18":"transparent",fontFamily:FB,fontSize:11,color:selPri===p?pColor(p):T.bark,cursor:"pointer",textTransform:"capitalize"}}>{p}</button>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Repeat</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["none","Once"],["weekdays","Weekdays"],["daily","Every day"],["weekly","Weekly"]].map(([v,lb])=>(
                <button key={v} onClick={()=>setSelRecur(v)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${selRecur===v?T.teal:T.linen}`,background:selRecur===v?T.tealP:"#fff",fontFamily:FB,fontSize:11,color:selRecur===v?T.teal:T.bark,cursor:"pointer"}}>{lb}</button>
              ))}
            </div>
          </div>
          <button onClick={add} disabled={!inp.trim()} style={{width:"100%",background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer",opacity:inp.trim()?1:.4}}>Add Task{selRecur!=="none"?" (Recurring)":""}</button>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12}}>
        {["All","Family","Work","Me","Home","Travel"].map(t=><Pill key={t} ch={t} active={filter===t} on={()=>setFilter(t)}/>)}
      </div>

      {planTab==="calendar" && <CalendarScreen profile={profile} calEvents={calEvents} uid={uid}/>}
      {planTab==="school" && <Card ch={<SchoolCalendar profile={profile} uid={uid}/>}/>}

      {/* Calendar events for today */}
      {(()=>{
        const today=new Date().toDateString();
        const now=new Date();const todayStr=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
        const todayCal=(calEvents||[]).filter(e=>{if(!e.start)return false;if(e.allDay)return e.start.startsWith(todayStr);return new Date(e.start).toDateString()===now.toDateString();});
        if(!todayCal.length)return null;
        return(
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              <span>📅</span> From your calendar today
            </div>
            {todayCal.map((e,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,#1a3a6e11,#1a5a9e11)",borderRadius:12,padding:"10px 14px",marginBottom:6,border:"1px solid #1a5a9e22"}}>
                <span style={{fontFamily:FB,fontSize:12,color:"#1a5a9e",fontWeight:700,flexShrink:0}}>{e.allDay?"All day":new Date(e.start).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</span>
                <span style={{fontFamily:FB,fontSize:13,color:T.esp,flex:1}}>{e.title}</span>
                {e.location&&<span style={{fontFamily:FB,fontSize:10,color:T.taupe}}>📍{e.location}</span>}
              </div>
            ))}
          </div>
        );
      })()}

      {visible.length===0?(
        <div style={{textAlign:"center",padding:"32px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>✨</div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:T.esp,margin:"0 0 8px"}}>Your day is clear</p>
          <p style={{fontFamily:FB,fontSize:13,color:T.taupe,margin:"0 0 16px",lineHeight:1.6}}>Add a task above or ask Nora to plan your day</p>
          <button onClick={()=>setShowAdd(true)} style={{background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add your first task</button>
        </div>
      ):visible.map(t=>{
        const tc=tC(t.tag);const TIC=tIC(t.tag);
        return(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1.5px solid ${t.done?T.sageP:T.linen}`,transition:"all .2s"}}>
            <button onClick={()=>toggle(t.id)} style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:t.done?T.sage:T.linen,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>
              {t.done&&<Ic.Check s={13} c="#fff" w={2.5}/>}
            </button>
            <Tile ic={TIC} c={tc} bg={tc+"18"} s={15} ts={30} r={9}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,color:t.done?T.taupe:T.esp,textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
              <div style={{display:"flex",gap:6,marginTop:4}}>
                <Tag ch={t.tag} c={tc}/>
                {t.recur&&t.recur!=="none"&&<span style={{fontFamily:FB,fontSize:9,color:T.teal,background:T.tealP,borderRadius:10,padding:"2px 7px"}}>🔁</span>}
                <Tag ch={t.priority} c={pColor(t.priority)}/>
              </div>
            </div>
            <button onClick={()=>del(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:4,flexShrink:0}}><Ic.Trash s={15} c={T.taupe} w={1.5}/></button>
          </div>
        );
      })}

      {planTab==="meals" && <div>{/* Meal Planner */}
      <div style={{marginTop:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <H2 t="Meal Planner" sub="Tap any meal to edit"/>
          <div style={{display:"flex",gap:6}}>
            {shoppingList.length>0&&<button onClick={()=>setShowShopping(!showShopping)} style={{background:T.sageP,border:`1px solid ${T.sage}30`,borderRadius:10,padding:"6px 10px",fontFamily:FB,fontSize:11,fontWeight:700,color:T.sage,cursor:"pointer"}}>🛒 List</button>}
            <button onClick={generateMealPlan} disabled={generatingMeals} style={{background:`linear-gradient(135deg,${T.esp},#4a2e18)`,border:"none",borderRadius:10,padding:"6px 12px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",opacity:generatingMeals?.7:1}}>
              {generatingMeals?"Planning...":"✨ Plan week"}
            </button>
          </div>
        </div>
        {showShopping&&shoppingList.length>0&&<div style={{background:"#fff",borderRadius:14,padding:"14px",marginBottom:14,border:`1.5px solid ${T.sage}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>🛒 Shopping List</span>
            <button onClick={()=>{const txt=shoppingList.join("\n");if(navigator.share){navigator.share({title:"Shopping List",text:txt}).catch(()=>{});}else{navigator.clipboard.writeText(txt).catch(()=>{});alert("Copied!");}}} style={{background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"4px 10px",fontFamily:FB,fontSize:10,fontWeight:700,color:T.gold,cursor:"pointer"}}>Share</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            {shoppingList.map((item,i)=>(
              <div key={i} style={{fontFamily:FB,fontSize:12,color:T.bark,padding:"4px 0",display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:T.sage,flexShrink:0,display:"inline-block"}}/>
                {item}
              </div>
            ))}
          </div>
        </div>}
        <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto"}}>
          {Object.keys(meals).map(d=><Pill key={d} ch={d} active={mealDay===d} on={()=>setMealDay(d)}/>)}
          <button onClick={()=>{const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];const next=days[days.indexOf(mealDay)+1]||days[0];if(!meals[next])setMeals(p=>({...p,[next]:{b:"",l:"",d:""}}));setMealDay(next);}} style={{flexShrink:0,border:`1px dashed ${T.linen}`,background:"transparent",borderRadius:20,padding:"7px 14px",fontFamily:FB,fontSize:12,color:T.taupe,cursor:"pointer"}}>+ Day</button>
        </div>
        <Card ch={
          <div>
            {[["🌅","Breakfast",meals[mealDay]?.b||""],["☀️","Lunch",meals[mealDay]?.l||""],["🌙","Dinner",meals[mealDay]?.d||""]].map(([em,lb,val])=>(
              <div key={lb} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:lb!=="Dinner"?`1px solid ${T.linen}`:"none"}}>
                <span style={{fontSize:18,flexShrink:0}}>{em}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.taupe,marginBottom:3}}>{lb}</div>
                  {editMeal===`${mealDay}-${lb}`?(
                    <input autoFocus defaultValue={val} onBlur={e=>{setMeals(p=>({...p,[mealDay]:{...p[mealDay],[lb==="Breakfast"?"b":lb==="Lunch"?"l":"d"]:e.target.value}}));setEditMeal(null);}} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${T.gold}`,color:T.esp}}/>
                  ):(
                    <div onClick={()=>setEditMeal(`${mealDay}-${lb}`)} style={{fontFamily:FB,fontSize:13,color:val?T.esp:T.taupe,fontStyle:val?"normal":"italic",cursor:"pointer"}}>{val||"Tap to add meal…"}</div>
                  )}
                </div>
                <button onClick={()=>setEditMeal(`${mealDay}-${lb}`)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Edit s={15} c={T.taupe} w={1.5}/></button>
              </div>
            ))}
          </div>
        }/>
      </div>
      </div>}
    </div>
  );
}
