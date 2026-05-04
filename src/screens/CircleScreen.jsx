import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData, db } from "../utils/firebase";
import { suggestCommunity } from "../utils/inference/communityInference";
import { claude } from "../utils/claude";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function CircleScreen({profile,uid}){
  const [activeTab,setActiveTab]=useState("myCircle");
  const [communitySuggestions,setCommunitySuggestions]=useState([]);
  useEffect(()=>{
    try{
      const wellness=JSON.parse(localStorage.getItem("hn_weekly_checkin")||"null");
      const schoolEvents=JSON.parse(localStorage.getItem("hn_school_events")||"[]");
      const suggestions=suggestCommunity(profile,{weeklyMood:wellness},schoolEvents);
      setCommunitySuggestions(suggestions);
    }catch(e){}
  },[profile?.name]);
  const [myCircle,setMyCircle]=useState([
    {id:1,name:"Priya M",av:"👩🏽",role:"Marketing Director",kids:"Arjun 5, Isla 8",sharedInterests:["Working mums","Family travel","Pilates"],status:"online",lastMsg:"Just dropped the kids — finally some quiet!",time:"2m"},
    {id:2,name:"Sophie L",av:"👩🏼",role:"Teacher",kids:"Noah 6",sharedInterests:["Meal prep","Fitness","School stuff"],status:"online",lastMsg:"That meal prep tip you shared was a game changer",time:"1h"},
    {id:3,name:"Amara K",av:"👩🏿",role:"Lawyer",kids:"Zara 3, Leo 7",sharedInterests:["Back to work","Work-life balance","Travel"],status:"away",lastMsg:"How do you manage the mum guilt?",time:"3h"},
    {id:4,name:"Mei Zhang",av:"👩",role:"Entrepreneur",kids:"Lily 4",sharedInterests:["Business","Family travel","Wellness"],status:"away",lastMsg:"Bali recommendations?",time:"5h"},
  ]);
  const [activeMember,setActiveMember]=useState(null);
  const [chatMsg,setChatMsg]=useState("");
  const [chats,setChats]=useState({});
  const [realtimeMsgs,setRealtimeMsgs]=useState([]);
  const [activeRoom,setActiveRoom]=useState("general");
  const ROOMS=[
    {id:"general",name:"General 💬",desc:"Anything and everything"},
    {id:"career",name:"Career 💼",desc:"Work, ambition, balance"},
    {id:"parenting",name:"Parenting 👶",desc:"School, kids, the chaos"},
    {id:"wellness",name:"Wellness 🌿",desc:"Self-care, health, habits"},
    {id:"travel",name:"Travel ✈️",desc:"Trips, tips, adventures"},
  ];
  const [aiMatch,setAiMatch]=useState(null);
  const [matchLoading,setMatchLoading]=useState(false);
  const [weeklyQ,setWeeklyQ]=useState({q:"What is one thing you did just for YOU this week?",answers:[{av:"👩🏽",name:"Priya",txt:"Booked a massage — first one in 6 months!"},{av:"👩🏼",name:"Sophie",txt:"Read an actual book. Not a kids book. A real one."}]});
  const [myAnswer,setMyAnswer]=useState("");

  const sendChat=(memberId)=>{
    if(!chatMsg.trim())return;
    const msg={from:"me",txt:chatMsg,time:"Just now"};
    setChats(p=>({...p,[memberId]:[...(p[memberId]||[]),msg]}));
    setChatMsg("");
    // Simulate reply
    setTimeout(()=>{
      const replies=["That is so relatable!","You are doing amazing.","Tell me more!","I needed to hear this today.","Same! How do you handle it?"];
      const reply={from:"them",txt:replies[Math.floor(Math.random()*replies.length)],time:"Just now"};
      setChats(p=>({...p,[memberId]:[...(p[memberId]||[]),reply]}));
    },2000);
  };

  const findMatch=async()=>{
    setMatchLoading(true);
    const sys=`You are Nora, AI community matcher for HerNest. Return ONLY valid JSON: {"match":{"name":"","avatar":"👩🏽","role":"","kids":"","sharedInterests":["","",""],"icebreaker":"","whyMatch":""},"reason":""}`;
    const userCtx=`User: ${profile?.name||"Sarah"}, ${profile?.role||"Working Mum"}, kids: ${profile?.kids?.map(k=>k.name).join(",")||"2 kids"}, priorities: ${profile?.priorities?.join(",")||"family,career"}`;
    try{
      const raw=await claude(sys,`Find a perfect Circle match for ${userCtx}. Create a supportive mum profile for a practice conversation.`);
      const parsed=JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g,"").trim());
      if(parsed?.match)setAiMatch(parsed);
    }catch(e){
      setAiMatch({match:{name:"Amara K",avatar:"👩🏽",role:"Marketing Director",kids:"3 kids aged 4, 7 & 10",sharedInterests:["Working mums","Family wellness","Career growth"],icebreaker:"You both know what it feels like to run a team AND a household simultaneously.",whyMatch:"Amara understands the pull between ambition and presence better than anyone."},reason:"Strong match based on your profile."});
    }
    setMatchLoading(false);
  };

  const addToCircle=()=>{
    if(!aiMatch||myCircle.length>=8)return;
    const m=aiMatch.match;
    setMyCircle(p=>[...p,{id:Date.now(),name:m.name,av:m.avatar,role:m.role,kids:m.kids,sharedInterests:m.sharedInterests,status:"online",lastMsg:"Just joined your Circle! 👋",time:"Just now"}]);
    setAiMatch(null);
  };

  const member=myCircle.find(m=>m.id===activeMember);

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0e1428,#1a2a4e)",borderRadius:22,padding:"22px 20px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"rgba(100,160,255,.05)"}}/>
        <AIBadge t="AI Community"/>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:"#fff",margin:"10px 0 6px",fontWeight:400}}>The Circle</h2>
        <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.45)",margin:"0 0 14px"}}>Your curated group of mums who get it 💛</p>
        <div style={{display:"flex",gap:16}}>
          {[[myCircle.length,`of 8`,"Members"],[myCircle.filter(m=>m.status==="online").length,"online","Active now"],["5⭐","","Vibe"]].map(([v,sub,lb],i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:"#fff"}}>{v}<span style={{fontSize:12,color:"rgba(255,255,255,.4)",marginLeft:2}}>{sub}</span></div>
              <div style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase"}}>{lb}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {["myCircle","weekly","match"].map(t=>(
          <Pill key={t} ch={t==="myCircle"?"My Circle":t==="weekly"?"This Week":"Find Match"} active={activeTab===t} on={()=>setActiveTab(t)} color={T.sky}/>
        ))}
      </div>

      {/* My Circle tab */}
      {activeTab==="myCircle"&&<div>
        {activeMember?(
          <div>
            {/* Chat view */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <button onClick={()=>setActiveMember(null)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Back s={20} c={T.bark} w={2}/></button>
              <span style={{fontSize:28}}>{member?.av}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:FB,fontSize:14,fontWeight:700,color:T.esp}}>{member?.name}</div>
                <div style={{fontFamily:FB,fontSize:11,color:T.sage}}>{member?.status==="online"?"● Online":"○ Away"}</div>
              </div>
            </div>
            <div style={{background:"#fff",borderRadius:16,padding:"14px",marginBottom:12,minHeight:200,maxHeight:320,overflowY:"auto",border:`1px solid ${T.linen}`}}>
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{display:"inline-flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                  {member?.sharedInterests?.map((i,idx)=><span key={idx} style={{fontFamily:FB,fontSize:11,color:T.sky,background:T.skyP,borderRadius:20,padding:"3px 10px"}}>{i}</span>)}
                </div>
                <p style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:8}}>You have {member?.sharedInterests?.length} things in common</p>
              </div>
              {(chats[activeMember]||[]).map((msg,i)=>(
                <div key={i} style={{display:"flex",justifyContent:msg.from==="me"?"flex-end":"flex-start",marginBottom:8}}>
                  <div style={{maxWidth:"78%",background:msg.from==="me"?`linear-gradient(135deg,${T.esp},#4a3020)`:"#f5f5f5",borderRadius:msg.from==="me"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 13px"}}>
                    <p style={{fontFamily:FB,fontSize:13,color:msg.from==="me"?"rgba(255,255,255,.9)":T.esp,margin:0,lineHeight:1.5}}>{msg.txt}</p>
                  </div>
                </div>
              ))}
              {!(chats[activeMember]||[]).length&&<p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:T.taupe,textAlign:"center",margin:"20px 0"}}>Start the conversation 💛</p>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat(activeMember)} placeholder="Say something kind…" style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
              <button onClick={()=>sendChat(activeMember)} style={{background:`linear-gradient(135deg,${T.esp},#4a3020)`,border:"none",borderRadius:13,padding:"0 16px",cursor:"pointer",display:"flex",alignItems:"center"}}><Ic.Send s={16} c="#fff" w={2}/></button>
            </div>
          </div>
        ):(
          <div>
            <p style={{fontFamily:FB,fontSize:12,color:T.taupe,marginBottom:12}}>Your Circle · {myCircle.length}/8 members · Tap to chat</p>
            {myCircle.map(m=>(
              <div key={m.id} onClick={()=>setActiveMember(m.id)} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:16,padding:"13px 14px",marginBottom:8,cursor:"pointer",border:`1px solid ${T.linen}`,transition:"all .15s"}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <span style={{fontSize:32}}>{m.av}</span>
                  <div style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderRadius:"50%",background:m.status==="online"?T.sage:T.taupe,border:"2px solid #fff"}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{m.name}</span>
                    <span style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{m.time}</span>
                  </div>
                  <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:1}}>{m.role}</div>
                  <div style={{fontFamily:FB,fontSize:12,color:T.bark,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.lastMsg}</div>
                </div>
                <Ic.Arrow s={16} c={T.linen} w={1.5}/>
              </div>
            ))}
            {myCircle.length<8&&<button onClick={()=>setActiveTab("match")} style={{width:"100%",background:T.sand,border:`1.5px dashed ${T.linen}`,borderRadius:14,padding:"12px",fontFamily:FB,fontSize:13,color:T.taupe,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <Ic.Plus s={16} c={T.taupe} w={2}/>Add more mums ({8-myCircle.length} spots left)
            </button>}
          </div>
        )}
      </div>}

      {/* Weekly question tab */}
      {activeTab==="weekly"&&<div>
        <div style={{background:`linear-gradient(135deg,${T.esp},#4a2e18)`,borderRadius:18,padding:"20px",marginBottom:14}}>
          <div style={{fontFamily:FB,fontSize:10,color:T.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>This Week's Question</div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:"#fff",margin:"0 0 4px",lineHeight:1.5}}>"{weeklyQ.q}"</p>
          <p style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.4)",margin:0}}>Answer anonymously or with your name</p>
        </div>
        {weeklyQ.answers.map((a,i)=>(
          <Card key={i} ch={<div style={{display:"flex",gap:10}}>
            <span style={{fontSize:26,flexShrink:0}}>{a.av}</span>
            <div><span style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp}}>{a.name} · </span><span style={{fontFamily:FB,fontSize:13,color:T.bark,lineHeight:1.6}}>{a.txt}</span></div>
          </div>}/>
        ))}
        {!myAnswer?(
          <div style={{background:"#fff",borderRadius:16,padding:"16px",border:`1.5px solid ${T.gold}`}}>
            <textarea value={chatMsg} onChange={e=>setChatMsg(e.target.value)} placeholder="Share your answer with your Circle…" rows={3} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp,lineHeight:1.6,marginBottom:10}}/>
            <button onClick={()=>{if(!chatMsg.trim())return;setMyAnswer(chatMsg);setWeeklyQ(p=>({...p,answers:[...p.answers,{av:"👩",name:profile?.name||"You",txt:chatMsg}]}));setChatMsg("");}} style={{width:"100%",background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none",borderRadius:10,padding:"11px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer"}}>Share with my Circle</button>
          </div>
        ):(
          <Card sx={{background:T.sageP,border:`1px solid ${T.sage}`}} ch={<div style={{display:"flex",gap:10}}>
            <Ic.Check s={18} c={T.sage} w={2.5}/>
            <p style={{fontFamily:FB,fontSize:13,color:T.esp,margin:0,lineHeight:1.6}}>You shared your answer this week. Your Circle loved it 💛</p>
          </div>}/>
        )}
      </div>}

      {/* Match tab */}
      {activeTab==="match"&&<div>
        <div style={{background:AIGRAD,borderRadius:18,padding:"16px 18px",marginBottom:14}}>
          <AIBadge t="AI Matcher"/>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.6)",margin:"8px 0 0",lineHeight:1.6}}>Nora finds mums who truly get your life — same stage, same challenges, same vibe.</p>
        </div>
        {myCircle.length>=8&&<Card sx={{background:T.sageP,border:`1px solid ${T.sage}`}} ch={<div style={{display:"flex",gap:10}}>
          <span style={{fontSize:24}}>✨</span>
          <p style={{fontFamily:FB,fontSize:13,color:T.esp,margin:0,lineHeight:1.6}}>Your Circle is full (8/8). You can remove a member to add someone new.</p>
        </div>}/>}
        {myCircle.length<8&&!aiMatch&&<button onClick={findMatch} disabled={matchLoading} style={{width:"100%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:matchLoading?.7:1}}>
          {matchLoading?<><Spinner/>Finding your match…</>:<><Ic.Star s={18} c="#fff" w={1.4}/>Find My Next Circle Member</>}
        </button>}
        {aiMatch&&<Card sx={{border:`2px solid ${T.sky}30`,background:`linear-gradient(135deg,${T.skyP},#fff)`}} ch={<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <AIBadge t="Perfect Match"/>
            <button onClick={()=>setAiMatch(null)} style={{background:"none",border:"none",cursor:"pointer"}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
          </div>
          <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:44}}>{aiMatch.match.avatar}</div>
            <div>
              <div style={{fontFamily:FB,fontSize:15,fontWeight:700,color:T.esp}}>{aiMatch.match.name}</div>
              <div style={{fontFamily:FB,fontSize:12,color:T.bark,marginTop:2}}>{aiMatch.match.role}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:1}}>{aiMatch.match.kids}</div>
            </div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
            {aiMatch.match.sharedInterests?.map((i,idx)=><span key={idx} style={{fontFamily:FB,fontSize:11,color:T.sky,background:T.skyP,borderRadius:20,padding:"3px 10px"}}>{i}</span>)}
          </div>
          <div style={{background:T.goldP,borderRadius:12,padding:"10px 14px",marginBottom:12}}>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:T.esp,margin:0,lineHeight:1.6}}>"{aiMatch.match.icebreaker}"</p>
          </div>
          {aiMatch.match.whyMatch&&<p style={{fontFamily:FB,fontSize:12,color:T.bark,margin:"0 0 14px",lineHeight:1.6}}>{aiMatch.match.whyMatch}</p>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={findMatch} style={{flex:1,background:T.sand,border:`1px solid ${T.linen}`,borderRadius:12,padding:"10px",fontFamily:FB,fontSize:12,fontWeight:700,color:T.bark,cursor:"pointer"}}>Try another</button>
            <button onClick={addToCircle} style={{flex:2,background:`linear-gradient(135deg,${T.sky},#2d7aaa)`,border:"none",borderRadius:12,padding:"10px",fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>Add to my Circle 💛</button>
          </div>
        </div>}/>}
      </div>}
    </div>
  );
}
