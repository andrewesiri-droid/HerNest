import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function StyleScreen({profile,uid,appContext}){
  const [prompt,setPrompt]=useState("");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [saved,setSaved]=useState([]);
  const [activeTab,setActiveTab]=useState("stylist");
  const [mood,setMood]=useState("");
  // Auto-detect occasion from calendar context
  const detectOccasion = () => {
    if(!appContext) return "";
    const events = appContext.calendar?.eventsToday || [];
    if(events.some(e=>/wedding|gala|formal/i.test(e.title||""))) return "Formal";
    if(events.some(e=>/meeting|presentation|interview|client/i.test(e.title||""))) return "Work";
    if(events.some(e=>/party|dinner|date|event|celebration/i.test(e.title||""))) return "Event";
    if(appContext.school?.hasParentMeeting) return "Smart Casual";
    if(appContext.time?.isWeekend) return "Casual";
    if(profile?.role==="Working Mum") return "Work";
    return "";
  };
  const [occasion,setOccasion]=useState(()=>detectOccasion());
  const [wishlist,setWishlist]=useState(()=>{
    try{const s=localStorage.getItem("hn_wishlist");return s?JSON.parse(s):[
      {id:1,name:"Lululemon Align HR",cat:"Activewear",price:128,color:T.sage},
      {id:2,name:"Reformation Linen Slip",cat:"Style",price:195,color:T.blush},
      {id:3,name:"Bala Bangles 1lb",cat:"Fitness",price:55,color:T.sky},
    ];}catch(e){return [];}
  });
  const [savedOutfits,setSavedOutfits]=useState(()=>{
    try{const s=localStorage.getItem("hn_outfits");return s?JSON.parse(s):[];}catch(e){return [];}
  });

  useEffect(()=>{
    try{localStorage.setItem("hn_wishlist",JSON.stringify(wishlist));}catch(e){ /* silent */ }
    if(uid)saveData(uid,"style",{wishlist,savedOutfits}).catch(()=>{});
  },[wishlist,uid]);
  useEffect(()=>{
    try{localStorage.setItem("hn_outfits",JSON.stringify(savedOutfits));}catch(e){ /* silent */ }
    if(uid)saveData(uid,"style",{wishlist,savedOutfits}).catch(()=>{});
  },[savedOutfits,uid]);

  const OCCASIONS=[
    {lb:"Board meeting",ic:<Ic.Budget s={14} c="currentColor" w={1.5}/>},
    {lb:"School run",ic:<Ic.People s={14} c="currentColor" w={1.5}/>},
    {lb:"Date night",ic:<Ic.Star s={14} c="currentColor" w={1.5}/>},
    {lb:"Weekend casual",ic:<Ic.Leaf s={14} c="currentColor" w={1.5}/>},
    {lb:"Gym",ic:<Ic.Dumbbell s={14} c="currentColor" w={1.5}/>},
    {lb:"Girls dinner",ic:<Ic.Fork s={14} c="currentColor" w={1.5}/>},
    {lb:"Holiday",ic:<Ic.Compass s={14} c="currentColor" w={1.5}/>},
    {lb:"Working from home",ic:<Ic.Plan s={14} c="currentColor" w={1.5}/>},
  ];
  const MOODS=["Powerful","Relaxed","Playful","Elegant","Sporty","Romantic"];

  const run=async(autoPrompt)=>{
    if(!occasion&&!mood&&!prompt.trim()&&!autoPrompt)return;
    setLoading(true);setResult(null);
    const profileCtx=profile?`User: ${profile.role||"working mum"}, ${profile.city||"USA"}, body shape: ${profile.bodyShape||"not specified"}, height: ${profile.height||"not specified"}, clothing size: ${profile.clothingSize||"not specified"}, style vibe: ${profile.styleVibe||"classic"}, work dress code: ${profile.dresscode||"business casual"}, favourite colours: ${(profile.favColours||[]).join(", ")||"neutrals"}, clothing budget: ${profile.styleBudget||"$100-200/month"}, has ${(profile.kids||[]).length} kids.`:"";
    const moodAdj = appContext?.wellness?.isStruggling ? "She had a tough week — prioritise comfort and ease over formality." : appContext?.wellness?.isThriving ? "She is thriving — suggest something confident and expressive." : "";
    const sleepAdj = appContext?.wellness?.sleepDebt ? "She slept poorly — avoid anything uncomfortable or high-maintenance." : "";
    const calendarNote = appContext?.calendar?.eventsToday?.length > 0 ? `Today she has: ${appContext.calendar.eventsToday.map(e=>e.title).join(", ")}.` : "";
    const finalPrompt=autoPrompt||((occasion?"Occasion: "+occasion+". ":"")+(mood?"Mood: "+mood+". ":"")+prompt+" "+profileCtx+" "+moodAdj+" "+sleepAdj+" "+calendarNote).trim();
    const sys=`You are a personal stylist. Return ONLY valid JSON with no extra text. SELF-CORRECTION: Only suggest real brands and products that exist. All prices are estimates — flag them as such. Never invent specific product SKUs or guarantee availability. If suggesting a brand you are uncertain about, use a well-known alternative. {"styleInsight":"one sentence","outfits":[{"name":"outfit name","occasion":"","mood":"","whyThisWorks":"","totalEstimate":"","note":"","items":[{"piece":"","brand":"","priceRange":"","why":"","searchQuery":""}]}]}. Return 2 outfits with 3 items each.`;
    try{
      const raw=await claude(sys,finalPrompt,[],"style_stylist");
      const cleaned=raw.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(cleaned);
      if(parsed?.outfits) setResult(parsed);
      else throw new Error("Invalid response");
    }catch(e){
            setResult({error:true});
    }
    setLoading(false);
  };

  const saveOutfit=(o)=>{
    setSavedOutfits(p=>[{...o,savedAt:new Date().toLocaleDateString("en-US",{day:"numeric",month:"short"})},...p.filter(s=>s.name!==o.name)]);
  };

  const saveItem=(item)=>{
    const newItem={id:Date.now(),name:item.piece,cat:"Style",price:parseInt(item.priceRange?.replace(/[^0-9]/g,"")||"0"),color:T.blush};
    setWishlist(p=>[newItem,...p.filter(w=>w.name!==newItem.name)]);
  };

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,#2d1428,#4a1a3a)`,borderRadius:22,padding:"20px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(242,212,202,.06)"}}/>
        <AIBadge t="Style Stylist"/>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:24,color:"#fff",margin:"10px 0 4px",fontWeight:400}}>Your Style, Elevated</h2>
        <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.45)",margin:0}}>Nora styles you for every moment of your life</p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {["stylist","saved","wishlist"].map(t=>(
          <Pill key={t} ch={t==="stylist"?"Style Me":t==="saved"?"Saved Outfits":"Wishlist"} active={activeTab===t} on={()=>setActiveTab(t)} color={T.blush}/>
        ))}
      </div>

      {/* STYLIST TAB */}
      {activeTab==="stylist"&&<div>
        {(profile?.styleVibe||profile?.bodyShape||profile?.dresscode)&&(
          <div style={{background:"#f0ebff",borderRadius:14,padding:"10px 14px",marginBottom:14,border:"1px solid #d4c5f9",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>✨</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:"#7c5cbf",marginBottom:2}}>Nora knows your style</div>
              <div style={{fontFamily:FB,fontSize:12,color:T.bark}}>{[profile?.styleVibe,profile?.dresscode,profile?.bodyShape].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
        )}
        {/* Occasion quick picks */}
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:10}}>What's the occasion?</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {OCCASIONS.map(o=>(
              <button key={o.lb} onClick={()=>{setOccasion(occasion===o.lb?"":o.lb);}} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:20,border:`1.5px solid ${occasion===o.lb?T.blush:T.linen}`,background:occasion===o.lb?T.blushP:"#fff",cursor:"pointer",transition:"all .15s",color:occasion===o.lb?T.esp:T.bark}}>
                {o.ic}
                <span style={{fontFamily:FB,fontSize:12,fontWeight:occasion===o.lb?700:400}}>{o.lb}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood selector */}
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:10}}>How do you want to feel?</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {MOODS.map(m=>(
              <button key={m} onClick={()=>setMood(mood===m?"":m)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${mood===m?T.lav:T.linen}`,background:mood===m?T.lavP:"#fff",fontFamily:FB,fontSize:12,color:mood===m?T.esp:T.bark,cursor:"pointer",fontWeight:mood===m?700:400}}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Custom prompt */}
        <div style={{marginBottom:12}}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:8}}>Add more detail (optional)</div>
          <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. I need to look authoritative but approachable…" style={{width:"100%",fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${T.linen}`,color:T.esp,background:"#fff"}}/>
        </div>

        <button onClick={()=>run()} aria-label="Get style recommendation" disabled={!occasion&&!mood&&!prompt.trim()||loading} style={{width:"100%",background:occasion||mood||prompt.trim()?`linear-gradient(135deg,#2d1428,#4a1a3a)`:T.linen,color:occasion||mood||prompt.trim()?"#fff":T.taupe,border:"none",borderRadius:14,padding:"13px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14,opacity:loading?.7:1}}>
          {loading?<><Spinner/>Styling you…</>:<>✨ Style Me</>}
        </button>

        {result&&!result.error&&<div style={{animation:"fadeUp .4s ease both"}}>
          {result.styleInsight&&<div style={{background:T.blushP,borderRadius:14,padding:"12px 16px",marginBottom:14,borderLeft:`4px solid ${T.blush}`}}>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:T.esp,margin:0,lineHeight:1.7}}>"{result.styleInsight}"</p>
          </div>}
          {result.outfits?.map((o,i)=>(
            <Card key={i} ch={<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontFamily:FD,fontSize:18,fontWeight:600,color:T.esp}}>{o.name}</div>
                  <div style={{display:"flex",gap:6,marginTop:4}}>
                    {o.occasion&&<span style={{fontFamily:FB,fontSize:10,color:T.blush,background:T.blushP,borderRadius:20,padding:"2px 8px"}}>{o.occasion}</span>}
                    {o.mood&&<span style={{fontFamily:FB,fontSize:10,color:T.lav,background:T.lavP,borderRadius:20,padding:"2px 8px"}}>{o.mood}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>saveOutfit(o)} style={{background:savedOutfits.find(s=>s.name===o.name)?T.blushP:T.sand,border:`1px solid ${savedOutfits.find(s=>s.name===o.name)?T.blush:T.linen}`,borderRadius:10,padding:"5px 10px",fontFamily:FB,fontSize:11,color:savedOutfits.find(s=>s.name===o.name)?T.blush:T.bark,cursor:"pointer"}}>
                    {savedOutfits.find(s=>s.name===o.name)?"❤️ Saved":"🤍 Save"}
                  </button>
                </div>
              </div>
              {o.whyThisWorks&&<p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:"0 0 10px",lineHeight:1.6,fontStyle:"italic"}}>{o.whyThisWorks}</p>}
              {o.items?.map((item,j)=>(
                <div key={j} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:j<o.items.length-1?`1px solid ${T.linen}`:"none",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{item.piece}</div>
                    <div style={{fontFamily:FB,fontSize:11,color:T.blush,marginTop:1}}>{item.brand}</div>
                    <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:1,fontStyle:"italic"}}>{item.why}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",flexShrink:0}}>
                    <span style={{fontFamily:FD,fontSize:14,fontWeight:700,color:T.gold}}>{item.priceRange}</span>
                    <button onClick={()=>{window.open("https://www.google.com/search?q="+encodeURIComponent((item.searchQuery||item.piece+" "+item.brand)+" buy"),"_blank");}} style={{background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"3px 8px",fontFamily:FB,fontSize:10,fontWeight:700,color:T.gold,cursor:"pointer"}}>Shop →</button>
                    <button onClick={()=>saveItem(item)} style={{background:T.blushP,border:`1px solid ${T.blush}30`,borderRadius:8,padding:"3px 8px",fontFamily:FB,fontSize:10,color:T.blush,cursor:"pointer"}}>+ Wishlist</button>
                  </div>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:10,padding:"8px 0",borderTop:`1px solid ${T.linen}`}}>
                <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>Total estimate</span>
                <span style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.gold}}>{o.totalEstimate}</span>
              </div>
              {o.note&&<p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:"6px 0 0",fontStyle:"italic"}}>{o.note}</p>}
            </div>}/>
          ))}
        </div>}
        {result?.error&&<Card ch={<p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Something went quiet — tap Style Me again 💛</p>}/>}
      </div>}

      {/* SAVED OUTFITS TAB */}
      {activeTab==="saved"&&<div>
        {savedOutfits.length===0?(
          <div style={{textAlign:"center",padding:"32px 20px",background:T.sand,borderRadius:16}}>
            <div style={{fontSize:36,marginBottom:10}}>👗</div>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 6px"}}>No saved outfits yet</p>
            <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:0}}>Style yourself and tap 🤍 Save on outfits you love</p>
          </div>
        ):savedOutfits.map((o,i)=>(
          <Card key={i} ch={<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontFamily:FD,fontSize:16,fontWeight:600,color:T.esp}}>{o.name}</div>
                <div style={{fontFamily:FB,fontSize:10,color:T.taupe,marginTop:2}}>Saved {o.savedAt}</div>
              </div>
              <button onClick={()=>setSavedOutfits(p=>p.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer"}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
            </div>
            {o.items?.slice(0,3).map((item,j)=>(
              <div key={j} style={{fontFamily:FB,fontSize:12,color:T.bark,padding:"4px 0",borderBottom:j<2?`1px solid ${T.linen}`:"none"}}>
                <span style={{fontWeight:600}}>{item.piece}</span> · {item.brand} · <span style={{color:T.gold}}>{item.priceRange}</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={()=>{setOccasion(o.occasion||"");setActiveTab("stylist");run(`Style me like this outfit: ${o.name} — ${o.items?.map(i=>i.piece).join(", ")}`);}} style={{flex:1,background:T.blushP,border:`1px solid ${T.blush}30`,borderRadius:10,padding:"8px",fontFamily:FB,fontSize:11,fontWeight:700,color:T.blush,cursor:"pointer"}}>Re-style this</button>
              <button onClick={()=>window.open("https://www.pinterest.com/search/pins/?q="+encodeURIComponent(o.name+" outfit"),"_blank")} style={{flex:1,background:T.sand,border:`1px solid ${T.linen}`,borderRadius:10,padding:"8px",fontFamily:FB,fontSize:11,color:T.bark,cursor:"pointer"}}>Pinterest →</button>
            </div>
          </div>}/>
        ))}
      </div>}

      {/* WISHLIST TAB */}
      {activeTab==="wishlist"&&<div>
        {wishlist.length===0?(
          <div style={{textAlign:"center",padding:"32px 20px",background:T.sand,borderRadius:16}}>
            <div style={{fontSize:36,marginBottom:10}}>🛍️</div>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 6px"}}>Your wishlist is empty</p>
            <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:0}}>Tap "+ Wishlist" on any item while styling</p>
          </div>
        ):wishlist.map((item,i)=>(
          <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1px solid ${T.linen}`}}>
            <div style={{width:40,height:40,borderRadius:12,background:item.color+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:20}}>🛍️</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{item.name}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:1}}>{item.cat}{item.price>0?` · $${item.price}`:""}</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>window.open("https://www.google.com/search?q="+encodeURIComponent(item.name+" buy online"),"_blank")} style={{background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"5px 10px",fontFamily:FB,fontSize:11,fontWeight:700,color:T.gold,cursor:"pointer"}}>Buy →</button>
              <button onClick={()=>setWishlist(p=>p.filter(w=>w.id!==item.id))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
