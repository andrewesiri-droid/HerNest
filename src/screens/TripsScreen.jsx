import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";
import { NewTripForm } from "./NewTripForm";
import { PackingAddItem } from "./PackingAddItem";

export function TripsScreen({uid,profile}){
  const [trips,setTrips]=useState([]);
  const [activeTrip,setActiveTrip]=useState(null); // null = list view
  const [showNewTrip,setShowNewTrip]=useState(false);
  const [editMode,setEditMode]=useState(false);
  const [planning,setPlanning]=useState(false);
  const [planData,setPlanData]=useState({});
  const [openSection,setOpenSection]=useState("overview");

  // New trip form state
  const [newDest,setNewDest]=useState("");
  const [newDate,setNewDate]=useState("");
  const [newNights,setNewNights]=useState("");
  const [newBudget,setNewBudget]=useState("");
  const [newStatus,setNewStatus]=useState("Planning");
  const [newTravellers,setNewTravellers]=useState(2);

  useEffect(()=>{
    if(!uid)return;
    loadData(uid,"trips").then(d=>{if(d?.trips?.length){setTrips(d.trips);if(d.planData)setPlanData(d.planData);}}).catch(()=>{});
  },[uid]);
  useEffect(()=>{
    if(uid&&trips.length)saveData(uid,"trips",{trips,planData}).catch(()=>{});
  },[trips,planData,uid]);

  const trip=activeTrip!==null?trips[activeTrip]:null;
  const updateTrip=(f,v)=>setTrips(p=>p.map((t,i)=>i===activeTrip?{...t,[f]:v}:t));
  const deleteTrip=()=>{setTrips(p=>p.filter((_,i)=>i!==activeTrip));setActiveTrip(null);};

  const familyMembers=[
    {name:profile?.name?.split(" ")[0]||"Me",emoji:"👩"},
    ...(profile?.partner?[{name:profile.partner,emoji:"👨"}]:[]),
    ...(profile?.kids||[]).map(k=>({name:k.name,emoji:"👧"})),
    ...(profile?.parents||[]).map(p=>({name:p.name,emoji:"👴"})),
  ];

  const addTrip=async()=>{
    if(!newDest.trim())return;
    const who=[profile?.name?.split(" ")[0]||"Me",...(profile?.partner?[profile.partner]:[]),...(profile?.kids||[]).map(k=>k.name)];
    const t={id:Date.now(),dest:newDest,flag:"🌍",nights:parseInt(newNights)||7,travellers:newTravellers,budget:parseInt(newBudget)||5000,spent:0,status:newStatus,departDate:newDate,whosComing:who.slice(0,newTravellers),checklist:[{item:"Book flights",done:false},{item:"Book accommodation",done:false},{item:"Travel insurance",done:false},{item:"Visas and passports",done:false},{item:"Kids vaccinations check",done:false}],packing:{Mum:[],Kids:[],Everyone:[]}};
    const newIdx=trips.length;
    setTrips(p=>[...p,t]);
    setShowNewTrip(false);
    setNewDest("");setNewDate("");setNewNights("");setNewBudget("");setNewStatus("Planning");
    setActiveTrip(newIdx);
    await planTrip(t);
  };

  const planTrip=async(t)=>{
    const tripData=t||trip;
    if(!tripData)return;
    setPlanning(true);
    const whosComing=tripData.whosComing||[];
    const numTravellers=whosComing.length||tripData.travellers||1;
    const kidsOnTrip=(profile?.kids||[]).filter(k=>whosComing.includes(k.name));
    const hasKids=kidsOnTrip.length>0;
    const hasPartner=profile?.partner&&whosComing.includes(profile.partner);
    const isSolo=numTravellers===1;
    const isCouple=numTravellers===2&&hasPartner&&!hasKids;
    const tripType=isSolo?"SOLO TRIP — plan for one person. Focus on independence, flexibility, solo dining, safety tips.":
      isCouple?"COUPLE TRIP — romantic and adventurous. Include couple experiences, romantic dining, shared adventures.":
      hasKids?`FAMILY TRIP — kids: ${kidsOnTrip.map(k=>k.name+" age "+(k.age||"?")).join(", ")}. Child-friendly, nap schedules, kid restaurants, family rooms.`:
      `GROUP TRIP for ${numTravellers} (${whosComing.join(", ")}). Group activities, shared accommodation.`;
    const packingNames=isSolo?[profile?.name?.split(" ")[0]||"Me"]:hasKids?["Mum",...(hasPartner?["Dad"]:[]),"Kids"]:["Everyone"];
    const packingTemplate=packingNames.reduce((acc,name)=>({...acc,[name]:["","","",""]}),{});
    const sys=`You are Nora, expert travel concierge. Return ONLY valid JSON. All suggestions must be real, well-known places that actually exist. NEVER invent restaurant names, hotel names, or attractions. If unsure whether something exists, use general descriptions instead. All prices, opening hours and availability must be flagged as estimates that need verification. Say "worth checking" before any specific operational detail. {"overview":"","tripType":"","familyTip":"","highlights":["","",""],"days":[{"day":1,"title":"","plan":"","highlight":"","kidsFriendly":"","soloTip":""}],"packing":${JSON.stringify(packingTemplate)},"checklist":["","","","","",""],"budget":[{"cat":"","amount":"","tip":""}],"bookingTips":""}`;
    const prompt="Plan a "+(tripData.nights||7)+" night trip to "+tripData.dest+". TRIP TYPE: "+tripType+" Total: "+numTravellers+" travellers. Budget: $"+(tripData.budget||5000)+". Departure: "+(tripData.departDate||"soon")+". Be specific with real local recommendations.";
    try{
      const raw=await claude(sys,prompt);
      const data=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setPlanData(p=>({...p,[tripData.id]:data}));
    }catch(e){
      setPlanData(p=>({...p,[tripData.id]:{overview:`An incredible ${tripData.nights||7}-night adventure to ${tripData.dest}!`,familyTip:"Book accommodation with free cancellation for flexibility.",highlights:["Explore local culture","Incredible food scene","Unforgettable experiences"],days:[{day:1,title:"Arrival & Explore",plan:"Arrive and settle in. Take a gentle walk to explore the neighbourhood.",highlight:"First impressions",kidsFriendly:"Let the kids pick a local snack to try"},{day:2,title:"Main Attractions",plan:"Full day exploring the highlights. Start early to beat crowds.",highlight:"The main attraction",kidsFriendly:"Look for playgrounds nearby"}],packing:packingTemplate,checklist:["Book flights","Book accommodation","Travel insurance","Check visa requirements","Download offline maps","Notify your bank"],budget:[{cat:"Flights",amount:"$"+Math.round((tripData.budget||5000)*0.35).toLocaleString(),tip:"Book early for best prices"},{cat:"Accommodation",amount:"$"+Math.round((tripData.budget||5000)*0.3).toLocaleString(),tip:"Look for family rooms"},{cat:"Food",amount:"$"+Math.round((tripData.budget||5000)*0.2).toLocaleString(),tip:"Mix local and self-catering"},{cat:"Activities",amount:"$"+Math.round((tripData.budget||5000)*0.15).toLocaleString(),tip:"Book in advance"}],bookingTips:"Use Skyscanner for flights and Booking.com for accommodation."}}));
    }
    setPlanning(false);
  };

  const plan=trip?planData[trip.id]:null;
  const budgetPct=trip?Math.round(((trip.spent||0)/(trip.budget||5000))*100):0;

  const STATUS_COLOR={Dreaming:T.lav,Planning:T.sky,Booked:T.sage,Completed:T.gold};

  // ── LIST VIEW ──────────────────────────────────────────────────
  if(activeTrip===null) return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><Ic.Plane s={20} c={T.esp} w={1.5}/><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:24,color:T.esp,margin:0,fontWeight:400}}>My Trips</h2></div>
          <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:"4px 0 0"}}>{trips.length} {trips.length===1?"trip":"trips"} planned</p>
        </div>
        <button onClick={()=>setShowNewTrip(true)} style={{background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none",borderRadius:13,padding:"10px 16px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <Ic.Plus s={16} c="#fff" w={2}/>New trip
        </button>
      </div>

      {showNewTrip&&<NewTripForm profile={profile} familyMembers={familyMembers} onAdd={addTrip} onCancel={()=>setShowNewTrip(false)} newDest={newDest} setNewDest={setNewDest} newDate={newDate} setNewDate={setNewDate} newNights={newNights} setNewNights={setNewNights} newBudget={newBudget} setNewBudget={setNewBudget} newStatus={newStatus} setNewStatus={setNewStatus} newTravellers={newTravellers} setNewTravellers={setNewTravellers}/>}

      {trips.length===0&&!showNewTrip&&<div style={{textAlign:"center",padding:"40px 20px",background:T.sand,borderRadius:18}}>
        <div style={{fontSize:52,marginBottom:14}}>✈️</div>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:20,color:T.esp,margin:"0 0 8px"}}>Where to next?</p>
        <p style={{fontFamily:FB,fontSize:13,color:T.taupe,margin:"0 0 20px",lineHeight:1.6}}>Add your first trip and Nora will plan every detail.</p>
        <button onClick={()=>setShowNewTrip(true)} style={{background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none",borderRadius:14,padding:"13px 24px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer"}}>Plan my first trip</button>
      </div>}

      {trips.map((t,i)=>{
        const p=planData[t.id];
        const daysUntil=t.departDate?Math.ceil((new Date(t.departDate)-new Date())/86400000):null;
        return(
          <div key={t.id} onClick={()=>{setActiveTrip(i);setOpenSection("overview");}} style={{background:"#fff",borderRadius:18,padding:"16px",marginBottom:12,border:`1px solid ${T.linen}`,cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,.06)",transition:"all .15s"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
              <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#0e2a1e,#1a5a3a)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic.Globe s={26} c="rgba(255,255,255,.9)" w={1.3}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <h3 style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:T.esp,margin:0,fontWeight:400}}>{t.dest}</h3>
                  <span style={{fontFamily:FB,fontSize:10,fontWeight:700,color:STATUS_COLOR[t.status]||T.bark,background:(STATUS_COLOR[t.status]||T.bark)+"15",borderRadius:20,padding:"3px 10px",flexShrink:0,marginLeft:8}}>{t.status}</span>
                </div>
                <div style={{display:"flex",gap:12,marginTop:6,flexWrap:"wrap"}}>
                  <span style={{fontFamily:FB,fontSize:11,color:T.taupe}}>{t.nights||7} nights</span>
                  <span style={{fontFamily:FB,fontSize:11,color:T.taupe}}>{(t.whosComing||[]).length||t.travellers||1} travellers</span>
                  {t.departDate&&<span style={{fontFamily:FB,fontSize:11,color:daysUntil>0?T.gold:T.sage}}>{daysUntil>0?`${daysUntil} days away`:"Trip started!"}</span>}
                  {p&&<span style={{fontFamily:FB,fontSize:11,color:T.sage}}>✓ Planned</span>}
                </div>
              </div>
              <Ic.Arrow s={18} c={T.linen} w={1.5}/>
            </div>
            {t.departDate&&daysUntil>0&&daysUntil<=30&&<div style={{marginTop:10,background:T.goldP,borderRadius:10,padding:"6px 12px",fontFamily:FB,fontSize:11,color:T.esp,fontWeight:600}}>
              ⏰ {daysUntil} days to go — {(t.checklist||[]).filter(c=>c.done).length}/{(t.checklist||[]).length} checklist items done
            </div>}
          </div>
        );
      })}
    </div>
  );

  // ── DETAIL VIEW ────────────────────────────────────────────────
  const Section=({id,title,emoji,children})=>(
    <div style={{background:"#fff",borderRadius:18,marginBottom:10,border:`1px solid ${T.linen}`,overflow:"hidden"}}>
      <div onClick={()=>setOpenSection(openSection===id?null:id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}}>
        <div style={{width:32,height:32,borderRadius:9,background:T.sand,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{typeof emoji==="string"?<span style={{fontSize:16}}>{emoji}</span>:emoji}</div>
        <span style={{fontFamily:FB,fontSize:14,fontWeight:700,color:T.esp,flex:1}}>{title}</span>
        <span style={{fontSize:18,color:T.taupe,transform:openSection===id?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>⌄</span>
      </div>
      {openSection===id&&<div style={{padding:"0 16px 16px",borderTop:`1px solid ${T.linen}`}}>{children}</div>}
    </div>
  );

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Back button + header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <button onClick={()=>{setActiveTrip(null);setEditMode(false);}} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}>
          <Ic.Back s={22} c={T.esp} w={2}/>
        </button>
        <div style={{flex:1}}>
          <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:22,color:T.esp,margin:0,fontWeight:400}}>{trip.dest}</h2>
          <p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:"2px 0 0"}}>{trip.nights} nights · {(trip.whosComing||[]).join(", ")||`${trip.travellers} travellers`}</p>
        </div>
        <button onClick={()=>setEditMode(!editMode)} style={{background:editMode?T.goldP:T.sand,border:`1px solid ${editMode?T.gold:T.linen}`,borderRadius:10,padding:"7px 12px",fontFamily:FB,fontSize:11,fontWeight:700,color:editMode?T.esp:T.bark,cursor:"pointer"}}>
          {editMode?"Done":"Edit"}
        </button>
      </div>

      {/* Edit panel */}
      {editMode&&<div style={{background:"#fff",borderRadius:18,padding:"16px",marginBottom:12,border:`1.5px solid ${T.gold}`}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div>
            <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:4}}>Destination</label>
            <input value={trip.dest} onChange={e=>updateTrip("dest",e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp}}/>
          </div>
          <div>
            <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:4}}>Depart date</label>
            <input type="date" value={trip.departDate||""} onChange={e=>updateTrip("departDate",e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:12,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp,background:"#fff"}}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div>
            <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:4}}>Nights</label>
            <input type="text" inputMode="numeric" defaultValue={trip.nights||7} onBlur={e=>updateTrip("nights",parseInt(e.target.value)||7)} style={{width:"100%",fontFamily:FB,fontSize:14,fontWeight:700,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp}}/>
          </div>
          <div>
            <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:4}}>Budget ($)</label>
            <input type="text" inputMode="numeric" defaultValue={trip.budget||5000} onBlur={e=>updateTrip("budget",parseInt(e.target.value)||5000)} style={{width:"100%",fontFamily:FB,fontSize:14,fontWeight:700,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp}}/>
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Who is coming</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {familyMembers.map((person,i)=>{
              const coming=(trip.whosComing||[]).includes(person.name);
              return(<button key={i} onClick={()=>{const cur=trip.whosComing||[];const upd=coming?cur.filter(n=>n!==person.name):[...cur,person.name];updateTrip("whosComing",upd);updateTrip("travellers",Math.max(1,upd.length));}} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${coming?T.gold:T.linen}`,background:coming?T.goldP:"#fff",cursor:"pointer"}}>
                <span style={{fontSize:14}}>{person.emoji}</span>
                <span style={{fontFamily:FB,fontSize:11,color:coming?T.esp:T.bark}}>{person.name}</span>
                {coming&&<Ic.Check s={10} c={T.gold} w={2.5}/>}
              </button>);
            })}
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {["Dreaming","Planning","Booked","Completed"].map(s=><button key={s} onClick={()=>updateTrip("status",s)} style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${trip.status===s?T.gold:T.linen}`,background:trip.status===s?T.goldP:"#fff",fontFamily:FB,fontSize:11,color:trip.status===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>)}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setEditMode(false);planTrip();}} style={{flex:2,background:`linear-gradient(135deg,${T.gold},#8B6914)`,border:"none",borderRadius:12,padding:"11px",fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>✨ Re-plan with Nora</button>
          <button onClick={()=>{if(window.confirm("Delete this trip?"))deleteTrip();}} style={{flex:1,background:T.blushP,border:`1px solid ${T.blush}30`,borderRadius:12,padding:"11px",fontFamily:FB,fontSize:11,fontWeight:700,color:T.blush,cursor:"pointer"}}>Delete</button>
        </div>
      </div>}

      {/* Budget bar */}
      <div style={{background:"linear-gradient(135deg,#0e2a1e,#1a5a3a)",borderRadius:16,padding:"14px 16px",marginBottom:12,color:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.5)"}}>Budget</span>
          <span style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.8)"}}>${(trip.spent||0).toLocaleString()} / ${(trip.budget||5000).toLocaleString()}</span>
        </div>
        <div style={{background:"rgba(255,255,255,.2)",borderRadius:10,height:6}}>
          <div style={{background:T.gold,borderRadius:10,height:6,width:`${Math.min(budgetPct,100)}%`,transition:"width .5s"}}/>
        </div>
        <div style={{display:"flex",gap:16,marginTop:10}}>
          {[["🌙",trip.nights||7,"nights"],["👥",(trip.whosComing||[]).length||trip.travellers||1,"travellers"],[trip.departDate&&Math.ceil((new Date(trip.departDate)-new Date())/86400000)>0?"⏰":"✓",trip.departDate?Math.max(0,Math.ceil((new Date(trip.departDate)-new Date())/86400000)):"?",trip.departDate?"days away":"no date"]].map(([em,v,lb],i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:"#fff"}}>{em} {v}</div>
              <div style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase"}}>{lb}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Planning loader */}
      {planning&&<div style={{textAlign:"center",padding:"28px 20px",background:T.sand,borderRadius:18,marginBottom:12}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",animation:"breathe 2s ease-in-out infinite"}}><Ic.Compass s={20} c="#fff" w={1.4}/></div>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 4px"}}>Nora is planning your trip…</p>
        <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:0}}>Building itinerary, packing list and budget</p>
      </div>}

      {/* No plan yet */}
      {!plan&&!planning&&<div style={{textAlign:"center",padding:"24px 20px",background:T.sand,borderRadius:18,marginBottom:12}}>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 14px"}}>Let Nora plan this trip ✨</p>
        <button onClick={()=>planTrip()} style={{background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none",borderRadius:13,padding:"12px 24px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer"}}>Plan with Nora</button>
      </div>}

      {/* Collapsible sections */}
      {plan&&!planning&&<>
        {/* Overview */}
        <Section id="overview" title="Trip Overview" emoji={<Ic.Map s={18} c={T.esp} w={1.5}/>}>
          <div style={{paddingTop:14}}>
            <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:"0 0 12px",lineHeight:1.7}}>{plan.overview}</p>
            {plan.familyTip&&<div style={{background:T.sageP,borderRadius:12,padding:"10px 14px",display:"flex",gap:8,marginBottom:12}}>
              <span>💡</span><p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,lineHeight:1.5}}>{plan.familyTip}</p>
            </div>}
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {[{lb:"Flights",url:"https://www.skyscanner.com",emoji:"✈️"},{lb:"Hotels",url:"https://www.booking.com",emoji:"🏨"},{lb:"Activities",url:"https://www.viator.com",emoji:"🎡"}].map(b=>(
                <button key={b.lb} onClick={()=>window.open(b.url,"_blank")} style={{flex:1,background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:12,padding:"10px 6px",cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:18}}>{b.emoji}</div>
                  <div style={{fontFamily:FB,fontSize:10,color:T.esp,fontWeight:700,marginTop:3}}>{b.lb}</div>
                </button>
              ))}
            </div>
            <button onClick={()=>{const ls=[];ls.push(trip.dest+" "+trip.nights+" nights");(plan.days||[]).forEach(d=>ls.push("Day "+d.day+": "+d.title));(plan.budget||[]).forEach(b=>ls.push(b.cat+": "+b.amount));const txt=ls.join("\n");if(navigator.share){navigator.share({title:trip.dest,text:txt}).catch(()=>{});}else{navigator.clipboard.writeText(txt).catch(()=>{});alert("Copied!");}}} style={{width:"100%",background:"#fff",border:`1.5px solid ${T.linen}`,borderRadius:12,padding:"10px",fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp,cursor:"pointer"}}>Share trip plan</button>



          </div>
        </Section>

        {/* Itinerary */}
        <Section id="itinerary" title={`Itinerary · ${(plan.days||[]).length} days`} emoji="📅">
          <div style={{paddingTop:14}}>
            {plan.days?.map((d,i)=>(
              <div key={i} style={{marginBottom:16,paddingBottom:16,borderBottom:i<plan.days.length-1?`1px solid ${T.linen}`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:T.goldP,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FD,fontSize:13,fontWeight:700,color:T.gold,flexShrink:0}}>{d.day}</div>
                  <span style={{fontFamily:FB,fontSize:14,fontWeight:700,color:T.esp}}>{d.title}</span>
                </div>
                <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:"0 0 8px",lineHeight:1.7}}>{d.plan}</p>
                {d.highlight&&<div style={{background:T.goldP,borderRadius:10,padding:"6px 12px",marginBottom:6,display:"flex",gap:6}}><span>⭐</span><p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,fontStyle:"italic"}}>{d.highlight}</p></div>}
                {d.kidsFriendly&&<div style={{background:T.sageP,borderRadius:10,padding:"6px 12px",display:"flex",gap:6}}><span>👧</span><p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,fontStyle:"italic"}}>Kids: {d.kidsFriendly}</p></div>}
              </div>
            ))}
          </div>
        </Section>

        {/* Budget */}
        <Section id="budget" title="Budget Breakdown" emoji="💰">
          <div style={{paddingTop:14}}>
            {plan.budget?.map((b,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:i<plan.budget.length-1?`1px solid ${T.linen}`:"none"}}>
                <div>
                  <div style={{fontFamily:FB,fontSize:13,fontWeight:600,color:T.esp}}>{b.cat}</div>
                  {b.tip&&<div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:2,fontStyle:"italic"}}>{b.tip}</div>}
                </div>
                <span style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.gold,flexShrink:0,marginLeft:12}}>{b.amount}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Packing */}
        <Section id="packing" title={`Packing List · ${(planData[trip.id]?.packedItems||[]).length}/${Object.values(plan.packing||{}).flat().filter(Boolean).length+(planData[trip.id]?.customItems||[]).length} packed`} emoji="🎒">
          <div style={{paddingTop:14}}>
            {(()=>{
              const customItems=planData[trip.id]?.customItems||[];
              const allNormaItems=Object.entries(plan.packing||{}).flatMap(([person,items])=>items.filter(Boolean).map(item=>({person,item,key:person+"-"+item})));
              const totalItems=allNormaItems.length+customItems.length;
              const packed=planData[trip.id]?.packedItems||[];
              const pct=totalItems?Math.round((packed.length/totalItems)*100):0;
              const togglePacked=(key)=>{const cur=planData[trip.id]?.packedItems||[];const upd=cur.includes(key)?cur.filter(k=>k!==key):[...cur,key];setPlanData(p=>({...p,[trip.id]:{...p[trip.id],packedItems:upd}}));};
              const addCustomItem=(item,person)=>{if(!item.trim())return;const key=person+"-"+item+"-custom";setPlanData(p=>({...p,[trip.id]:{...p[trip.id],customItems:[...(p[trip.id]?.customItems||[]),{item,person,key}]}}));};
              const removeCustomItem=(key)=>{setPlanData(p=>({...p,[trip.id]:{...p[trip.id],customItems:(p[trip.id]?.customItems||[]).filter(i=>i.key!==key),packedItems:(p[trip.id]?.packedItems||[]).filter(k=>k!==key)}}));};
              const packingPersons=[...Object.keys(plan.packing||{})];

              return(<>
                <div style={{background:T.linen,borderRadius:10,height:6,marginBottom:14}}>
                  <div style={{background:pct===100?T.sage:T.gold,borderRadius:10,height:6,width:pct+"%",transition:"width .3s"}}/>
                </div>

                {Object.entries(plan.packing||{}).map(([person,items])=>(
                  <div key={person} style={{marginBottom:14}}>
                    <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.bark,marginBottom:8}}>{person==="Mum"?"👩":person==="Dad"?"👨":person==="Kids"?"👧":"👜"} {person}</div>
                    {items.filter(Boolean).map((item,i)=>{
                      const key=person+"-"+item;
                      const isPacked=packed.includes(key);
                      return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<items.length-1?`1px solid ${T.linen}`:"none"}}>
                        <div onClick={()=>togglePacked(key)} style={{width:22,height:22,borderRadius:"50%",background:isPacked?T.sage:T.linen,border:`2px solid ${isPacked?T.sage:T.taupe}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s",cursor:"pointer"}}>{isPacked&&<Ic.Check s={11} c="#fff" w={2.5}/>}</div>
                        <span onClick={()=>togglePacked(key)} style={{fontFamily:FB,fontSize:13,color:isPacked?T.taupe:T.esp,textDecoration:isPacked?"line-through":"none",flex:1,cursor:"pointer"}}>{item}</span>
                        <button onClick={()=>{const cur=planData[trip.id]?.removedItems||[];setPlanData(p=>({...p,[trip.id]:{...p[trip.id],removedItems:[...cur,key]}}));}} style={{background:"none",border:"none",cursor:"pointer",padding:4,opacity:.4}}><Ic.Close s={12} c={T.bark} w={2}/></button>
                      </div>);
                    }).filter((_,i)=>!(planData[trip.id]?.removedItems||[]).includes(person+"-"+items.filter(Boolean)[i]))}
                    {/* Custom items for this person */}
                    {customItems.filter(ci=>ci.person===person).map((ci,i)=>{
                      const isPacked=packed.includes(ci.key);
                      return(<div key={ci.key} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderTop:`1px solid ${T.linen}`}}>
                        <div onClick={()=>togglePacked(ci.key)} style={{width:22,height:22,borderRadius:"50%",background:isPacked?T.sage:T.linen,border:`2px solid ${isPacked?T.sage:T.taupe}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",transition:"all .15s"}}>{isPacked&&<Ic.Check s={11} c="#fff" w={2.5}/>}</div>
                        <span onClick={()=>togglePacked(ci.key)} style={{fontFamily:FB,fontSize:13,color:isPacked?T.taupe:T.esp,textDecoration:isPacked?"line-through":"none",flex:1,cursor:"pointer"}}>{ci.item} <span style={{fontSize:10,color:T.taupe}}>✏️</span></span>
                        <button onClick={()=>removeCustomItem(ci.key)} style={{background:"none",border:"none",cursor:"pointer",padding:4,flexShrink:0}}><Ic.Close s={12} c={T.taupe} w={2}/></button>
                      </div>);
                    })}
                  </div>
                ))}

                {/* Add custom item — using refs to avoid hooks-in-IIFE */}
                <PackingAddItem packingPersons={packingPersons} onAdd={addCustomItem}/>

                {pct===100&&<div style={{background:T.sageP,borderRadius:12,padding:"10px 14px",display:"flex",gap:8,marginTop:10}}><Ic.Check s={16} c={T.sage} w={2.5}/><span style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.sage}}>All packed! Ready to go 🎉</span></div>}
              </>);
            })()}
          </div>
        </Section>

        {/* Checklist */}
        <Section id="checklist" title={`Before You Go · ${(trip.checklist||[]).filter(c=>c.done).length}/${(trip.checklist||[]).length} done`} emoji="✅">
          <div style={{paddingTop:14}}>
            {(trip.checklist||[]).map((item,i)=>(
              <div key={i} onClick={()=>setTrips(p=>p.map((t,ti)=>ti===activeTrip?{...t,checklist:t.checklist.map((c,ci)=>ci===i?{...c,done:!c.done}:c)}:t))} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<trip.checklist.length-1?`1px solid ${T.linen}`:"none",cursor:"pointer"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:item.done?T.sage:T.linen,border:`2px solid ${item.done?T.sage:T.taupe}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>{item.done&&<Ic.Check s={11} c="#fff" w={2.5}/>}</div>
                <span style={{fontFamily:FB,fontSize:13,color:item.done?T.taupe:T.esp,textDecoration:item.done?"line-through":"none"}}>{item.item}</span>
              </div>
            ))}
          </div>
        </Section>
      </>}
    </div>
  );
}
