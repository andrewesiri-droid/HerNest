import React, { useState, useEffect } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { T, FD, FB, AIGRAD } from "./constants/theme";
import { initSession, logEvent, EVENTS } from "./utils/analytics";
import { checkProactiveNotifications, checkQuietModeExit, requestPushPermission } from "./utils/proactiveNotifications";
import { isQuietMode } from "./utils/quietMode";
import { buildContextLayer } from "./utils/contextLayer";

// Register service worker
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("/sw.js").catch(()=>{});
  });
}

// Capture Add to Home Screen prompt
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install banner after 30 seconds of use
  setTimeout(() => {
    if(deferredPrompt) window.dispatchEvent(new CustomEvent("hn_show_install"));
  }, 30000);
});
import { requestNotificationPermission, scheduleMorningBriefing } from "./utils/notifications";
import { Ic } from "./constants/icons.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary";

// ─── Screens ───────────────────────────────────────────────────────
import { HomeScreen } from "./screens/HomeScreen";
import { NoraScreen } from "./screens/NoraScreen";
import { BriefingScreen } from "./screens/BriefingScreen";
import { PlanScreen } from "./screens/PlanScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { TripsScreen } from "./screens/TripsScreen";
import { BudgetScreen } from "./screens/BudgetScreen";
import { StyleScreen } from "./screens/StyleScreen";
import { CircleScreen } from "./screens/CircleScreen";
import { WellnessScreen } from "./screens/WellnessScreen";
import { PartnerView } from "./screens/PartnerView";
import { ProfileScreen } from "./screens/ProfileScreen";
import { OfflineBanner } from "./screens/OfflineBanner";
import { NotificationCard } from "./screens/NotificationCard";

// ─── Onboarding ────────────────────────────────────────────────────
import { SplashScreen } from "./onboarding/SplashScreen";
import { LoginScreen } from "./onboarding/LoginScreen";
import { Step1 } from "./onboarding/Step1";
import { Step2 } from "./onboarding/Step2";
import { Step3 } from "./onboarding/Step3";
import { NoraIntro } from "./onboarding/NoraIntro";

// ─── Firebase ──────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBxUCbZT4sJbsu7tjiJPQSLpFCfhr9gUJg",
  authDomain: "hernest-af2e0.firebaseapp.com",
  projectId: "hernest-af2e0",
  storageBucket: "hernest-af2e0.firebasestorage.app",
  messagingSenderId: "910407116452",
  appId: "1:910407116452:web:376e23e5a8230a0d166831"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar.readonly");

const saveData = async (uid, key, data) => {
  if (!uid) return;
  try { await setDoc(doc(db,"users",uid,"data",key), data, {merge:true}); } catch(e) {  }
};
const loadData = async (uid, key) => {
  if (!uid) return null;
  try { const snap = await getDoc(doc(db,"users",uid,"data",key)); return snap.exists()?snap.data():null; } catch(e) { return null; }
};

async function fetchGCalEvents() {
  const token = sessionStorage.getItem("hn_gtoken") || localStorage.getItem("hn_gtoken");
  if (!token) return null;
  const now = new Date();
  const end = new Date(now.getTime() + 7*24*60*60*1000);
  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin="+now.toISOString()+"&timeMax="+end.toISOString()+"&singleEvents=true&orderBy=startTime&maxResults=20";
  try {
    const res = await fetch(url, {headers:{Authorization:"Bearer "+token}});
    if (!res.ok) return null;
    const data = await res.json();
    return (data.items||[]).map(e=>({id:e.id,title:e.summary||"Untitled",start:e.start?.dateTime||e.start?.date,end:e.end?.dateTime||e.end?.date,location:e.location||"",allDay:!e.start?.dateTime}));
  } catch(e) { return null; }
}

// ─── Tab Bar ───────────────────────────────────────────────────────
const TABS=[
  {id:"home",    lb:"Home",   IC:Ic.Home},
  {id:"nora",    lb:"Nora",   IC:Ic.Star, ai:true},
  {id:"plan",    lb:"Plan",   IC:Ic.Plan},
  {id:"trips",   lb:"Trips",  IC:Ic.Compass},
  {id:"budget",  lb:"Budget", IC:Ic.Budget},
  {id:"style",   lb:"Style",  IC:Ic.Hanger},
  {id:"circle",  lb:"Circle", IC:Ic.People},
  {id:"wellness",lb:"Thrive", IC:Ic.Leaf},
];

// ─── CSS ───────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;}
  body{background:#FAF6EF;overflow-x:hidden;}
  select,input,textarea{font-family:'DM Sans','Helvetica Neue',sans-serif;}
  .lift{transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s ease;}
  .lift:active{transform:scale(.96);box-shadow:0 1px 6px rgba(0,0,0,.1);}
  input:focus{border-color:#C49A3C !important;box-shadow:0 0 0 3px rgba(196,154,60,.12) !important;}
  button{-webkit-tap-highlight-color:transparent;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideRight{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes dot{0%,80%,100%{transform:scale(0.6);opacity:.4}40%{transform:scale(1);opacity:1}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
`;

// ─── ERROR BOUNDARY ────────────────────────────────────────────────
class ErrorBoundaryClass extends React.Component {
  constructor(props){super(props);this.state={hasError:false};}
  static getDerivedStateFromError(){return{hasError:true};}
  componentDidCatch(error,info){console.error("Screen error:",error,info);}
  render(){
    if(this.state.hasError){
      return(
        <div style={{padding:"24px 20px",textAlign:"center",background:"#FAF6EF",borderRadius:20,margin:"12px 0"}}>
          <div style={{fontSize:36,marginBottom:12}}>✦</div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:T.esp,margin:"0 0 8px"}}>Something went quiet</p>
          <p style={{fontFamily:FB,fontSize:13,color:T.taupe,margin:"0 0 16px"}}>Tap below to try again.</p>
          <button onClick={()=>this.setState({hasError:false})} style={{background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer"}}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const wrap = (screen, key) => <ErrorBoundaryClass key={key}>{screen}</ErrorBoundaryClass>;

// ─── MAIN APP ──────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState({name:"",avatar:"👩",city:"",role:"",kids:[],partner:"",parents:[],inlaws:[],priorities:[],tripGoal:"",fitnessGoal:"",savingsGoal:"",challenge:"",soloParent:false});
  const [aiTasks, setAiTasks] = useState([]);
  const [calEvents, setCalEvents] = useState([]);
  const [calConnected, setCalConnected] = useState(false);
  const [streak, setStreak] = useState(1);
  const [appContext, setAppContext] = useState(null);

  // Build unified context — once on load, refresh every 5 min + on focus
  useEffect(() => {
    if(!user?.uid || !profile?.name) return;
    buildContextLayer(user.uid, profile, calEvents).then(ctx => {
      if(ctx){
        setAppContext(ctx);
        // Run proactive notification check
        if(!isQuietMode()) checkProactiveNotifications(ctx, profile);
        checkQuietModeExit(profile);
        try{localStorage.setItem("hn_app_context",JSON.stringify({
          wellness:ctx.wellness,school:ctx.school,tasks:ctx.tasks,
          budget:ctx.budget,trips:ctx.trips,calendar:ctx.calendar
        }));}catch(e){}
      }
    }).catch(() => {});
  }, [user?.uid, profile?.name, calEvents.length]);

  useEffect(() => {
    const refresh = () => {
      if(user?.uid && profile?.name) buildContextLayer(user.uid, profile, calEvents).then(ctx => { if(ctx) setAppContext(ctx); }).catch(() => {});
    };
    const interval = setInterval(refresh, 300000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [user?.uid, profile?.name]);
  const [showInstall, setShowInstall] = useState(false);
  useEffect(()=>{
    const handler = () => setShowInstall(true);
    window.addEventListener("hn_show_install", handler);
    return () => window.removeEventListener("hn_show_install", handler);
  }, []);

  const upd = (k,v) => setProfile(p=>({...p,[k]:v}));

  const handleAI = (p) => { if(p?.tasks) setAiTasks(prev=>[...prev,...p.tasks]); };

  const connectCalendar = async () => {
    const events = await fetchGCalEvents();
    if(events){setCalEvents(events);setCalConnected(true);sessionStorage.setItem("hn_cal_connected","1");}
    else{alert("Could not connect. Please sign out and sign back in to grant calendar access.");}
  };

  const handleSaveProfile = (updated) => {
    setProfile(updated);
    if(user?.uid){
      saveData(user.uid, "profile", updated);
      try{localStorage.setItem("hn_uid", JSON.stringify(user.uid));}catch(e){}
    }
  };

  const reset = async () => {
    try{await signOut(auth);}catch(e){}
    setProfile({avatar:"👩",name:"",city:"",role:"",partner:"",kids:[],parents:[],inlaws:[],siblings:[],priorities:[],tripGoal:"",fitnessGoal:"",savingsGoal:"",challenge:""});
    setTab("home");setAiTasks([]);setUser(null);setScreen("login");
  };

  const handleLogin = (userData) => {
    if(userData.name) setProfile(p=>({...p,name:userData.name}));
    setScreen("step1");
    if(userData.uid){
      loadData(userData.uid,"profile").then(saved=>{
        if(saved&&saved.name){setProfile(saved);setScreen("app");}
      }).catch(()=>{});
    }
  };

  // Auth state
  useEffect(()=>{
    getRedirectResult(auth).then(result=>{
      if(result?.user){
        const cred=GoogleAuthProvider.credentialFromResult(result);
        if(cred?.accessToken){sessionStorage.setItem("hn_gtoken",cred.accessToken);localStorage.setItem("hn_gtoken",cred.accessToken);}
      }
    }).catch(()=>{});

    const timeout=setTimeout(()=>setAuthChecked(true),5000);
    const unsub=onAuthStateChanged(auth,(u)=>{
      clearTimeout(timeout);
      setUser(u||null);
      if(u){try{localStorage.setItem("hn_uid",JSON.stringify(u.uid));}catch(e){}}
      if(u){
        loadData(u.uid,"profile").then(saved=>{
          if(saved&&saved.name){setProfile(saved);setScreen("app");}
          else{
            if(u.displayName)setProfile(p=>({...p,name:u.displayName.split(" ")[0]}));
            const savedStep=localStorage.getItem("hn_ob_step");
            setScreen(savedStep?`step${savedStep}`:"step1");
          }
        }).catch(()=>{setScreen("step1");});
      } else {
        setScreen("login");
      }
      setAuthChecked(true);
    });
    return()=>{unsub();clearTimeout(timeout);};
  },[]);

  // Auto-save profile
  useEffect(()=>{
    if(user?.uid&&profile.name) saveData(user.uid,"profile",profile).catch(()=>{});
  },[profile,user]);

  // Analytics — init session
  useEffect(()=>{ initSession(); },[]);

  // Push notifications — request permission and schedule briefing
  useEffect(()=>{
    if(screen!=="app") return;
    requestNotificationPermission().then(granted=>{
      if(granted){
        const schoolRaw=localStorage.getItem("hn_school_events");
        const schoolEvents=schoolRaw?JSON.parse(schoolRaw):[];
        scheduleMorningBriefing(profile,schoolEvents,calEvents);
      }
    });
  },[screen]);

  // Streak
  useEffect(()=>{
    if(screen!=="app") return;
    const today=new Date().toDateString();
    try{
      const s=JSON.parse(localStorage.getItem("hn_streak")||"{}");
      if(s.lastDate===today){setStreak(s.count||1);}
      else if(s.lastDate===new Date(Date.now()-86400000).toDateString()){
        const newCount=(s.count||1)+1;
        setStreak(newCount);
        localStorage.setItem("hn_streak",JSON.stringify({count:newCount,lastDate:today}));
      } else {
        localStorage.setItem("hn_streak",JSON.stringify({count:1,lastDate:today}));
        setStreak(1);
      }
    }catch(e){}
  },[screen]);

  // Calendar reconnect
  useEffect(()=>{
    if(sessionStorage.getItem("hn_cal_connected")==="1"){
      fetchGCalEvents().then(events=>{if(events){setCalEvents(events);setCalConnected(true);}});
    }
  },[]);

  // Splash
  // Show splash only on first load before auth check
  // Partner view — shared family calendar
  const urlParams = new URLSearchParams(window.location.search);
  const partnerUid = urlParams.get("family");
  if(partnerUid) return <PartnerView uid={partnerUid}/>;

  if(!authChecked) return(
    <div style={{minHeight:"100vh",background:AIGRAD,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:FD,fontSize:42,fontWeight:600,color:"#fff",fontStyle:"italic",marginBottom:8}}>HerNest</div>
        <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,animation:"breathe 2s ease-in-out infinite",margin:"0 auto"}}/>
      </div>
    </div>
  );


  // Onboarding
  const STEPS=["step1","step2","step3","step4","step5","step6"];
  if(STEPS.includes(screen)){
    const idx=STEPS.indexOf(screen);
    const total=STEPS.length;
    return(
      <div style={{minHeight:"100vh",background:T.cream,padding:"24px 20px 40px"}}>
        <style>{css}</style>
        <div style={{maxWidth:430,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
            {idx>0&&<button onClick={()=>setScreen(["login",...STEPS][idx])} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}><Ic.Back s={20} c={T.bark} w={2}/></button>}
            <div style={{flex:1,marginLeft:8}}>
              <div style={{display:"flex",gap:6}}>
                {STEPS.map((_,i)=><div key={i} style={{height:3,borderRadius:3,flex:1,background:i<=idx?T.gold:T.linen,transition:"background .3s"}}/>)}
              </div>
            </div>
          </div>
          {screen==="step1"&&<Step1 data={profile} onChange={upd} onNext={()=>{localStorage.setItem("hn_ob_step","2");if(user?.uid)saveData(user.uid,"profile",{...profile,_onboardingStep:2});setScreen("step2");}}/>}
          {screen==="step2"&&<Step2 data={profile} onChange={upd} onNext={()=>{localStorage.setItem("hn_ob_step","3");if(user?.uid)saveData(user.uid,"profile",{...profile,_onboardingStep:3});setScreen("step3");}} onBack={()=>setScreen("step1")}/>}
          {screen==="step3"&&<Step3 data={profile} onChange={upd} onNext={()=>{if(user?.uid)saveData(user.uid,"profile",profile);setScreen("intro");}} onBack={()=>setScreen("step2")}/>}
        </div>
      </div>
    );
  }

  if(screen==="login") return <><style>{css}</style><LoginScreen onLogin={handleLogin} auth={auth} googleProvider={googleProvider}/></>;
  if(screen==="intro") return <><style>{css}</style><NoraIntro profile={profile} onEnter={()=>{logEvent(EVENTS.ONBOARDING_COMPLETED,{name:profile.name,role:profile.role});
              requestPushPermission().catch(()=>{});localStorage.removeItem("hn_ob_step");setScreen("app");}}/></>;

  // Main app
  const screens={
    home:    wrap(<HomeScreen go={setTab} aiTasks={aiTasks} profile={profile} streak={streak} calConnected={calConnected} connectCalendar={connectCalendar} calEvents={calEvents} appContext={appContext}/>, "home"),
    nora:    wrap(<NoraScreen onTasks={handleAI} profile={profile} calEvents={calEvents} onAddTask={handleAI} uid={user?.uid}/>, "nora"),
    brief:   wrap(<BriefingScreen profile={profile} appContext={appContext}/>, "brief"),
    plan:    wrap(<PlanScreen aiTasks={aiTasks} profile={profile} uid={user?.uid} calEvents={calEvents}/>, "plan"),
    trips:   wrap(<TripsScreen uid={user?.uid} profile={profile}/>, "trips"),
    budget:  wrap(<BudgetScreen uid={user?.uid} appContext={appContext}/>, "budget"),
    style:   wrap(<StyleScreen profile={profile} uid={user?.uid} appContext={appContext}/>, "style"),
    circle:  wrap(<CircleScreen profile={profile} uid={user?.uid} appContext={appContext}/>, "circle"),
    wellness:wrap(<WellnessScreen profile={profile} uid={user?.uid}/>, "wellness"),
    profile: wrap(<ProfileScreen profile={profile} onChange={upd} onSave={handleSaveProfile} onSignOut={reset} user={user}/>, "profile"),
  };

  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:T.cream,position:"relative"}}>
      <style>{css}</style>
    {/* Add to Home Screen */}
    {showInstall&&<div style={{position:"fixed",bottom:80,left:16,right:16,background:`linear-gradient(135deg,${T.esp},#1a0a04)`,borderRadius:16,padding:"14px 16px",zIndex:999,display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,.4)"}}>
      <span style={{fontSize:24}}>📱</span>
      <div style={{flex:1}}>
        <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>Add HerNest to home screen</div>
        <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.6)"}}>Opens like an app, works offline</div>
      </div>
      <button onClick={()=>{if(typeof deferredPrompt!=="undefined"&&deferredPrompt){deferredPrompt.prompt();}setShowInstall(false);logEvent(EVENTS.FEATURE_FIRST_USE,{feature:"pwa_install"});}} style={{background:T.gold,border:"none",borderRadius:10,padding:"8px 14px",fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp,cursor:"pointer"}}>Add</button>
      <button onClick={()=>setShowInstall(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
    </div>}
      <OfflineBanner/>
      <div style={{padding:"16px 16px 90px"}}>
        {screens[tab]||screens.home}
      </div>
      {/* Tab Bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(255,252,248,.96)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:"1px solid rgba(229,217,201,.8)",display:"flex",overflowX:"auto",padding:"8px 4px 16px",scrollbarWidth:"none",zIndex:100,boxShadow:"0 -4px 24px rgba(46,31,20,.06)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:14,transition:"all .2s",opacity:tab===t.id?1:.45,transform:tab===t.id?"scale(1.05)":"scale(1)",flex:"1 0 auto"}}>
            <t.IC s={22} c={tab===t.id?(t.ai?T.gold:T.esp):T.taupe} w={tab===t.id?2:1.5}/>
            <span style={{fontFamily:FB,fontSize:9,fontWeight:tab===t.id?700:400,color:tab===t.id?(t.ai?T.gold:T.esp):T.taupe,letterSpacing:.6}}>{t.lb}</span>
          </button>
        ))}
        {/* Profile avatar */}
        <button onClick={()=>setTab("profile")} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"4px 8px",flex:"1 0 auto",opacity:tab==="profile"?1:.45}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:tab==="profile"?T.gold:T.linen,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{profile.avatar||"👩"}</div>
          <span style={{fontFamily:FB,fontSize:9,fontWeight:tab==="profile"?700:400,color:tab==="profile"?T.gold:T.taupe,letterSpacing:.6}}>Me</span>
        </button>
      </div>
    </div>
  );
}
