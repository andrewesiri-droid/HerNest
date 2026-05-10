import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";
import { T, FD, FB, AIGRAD } from "./constants/theme";
import { initSession, logEvent, EVENTS, identifyUser, resetUser, trackPage } from "./utils/analytics";
import { requestPushPermission } from "./utils/proactiveNotifications";


import { useStreak } from "./hooks/useStreak";
import { useCalendar } from "./hooks/useCalendar";
import { useAppContext } from "./hooks/useAppContext";

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
import { getScreens } from "./screens/index.jsx";
import { OfflineBanner } from "./screens/OfflineBanner";
import { PartnerView } from "./screens/PartnerView";
import { TabBar } from "./components/TabBar.jsx";
import { SettingsPanel } from "./components/SettingsPanel.jsx";
import { UpgradeModal } from "./components/UpgradeModal.jsx";

// ─── Onboarding ────────────────────────────────────────────────────
import { SplashScreen } from "./onboarding/SplashScreen";
import { LoginScreen } from "./onboarding/LoginScreen";
import { Step1 } from "./onboarding/Step1";
import { Step2 } from "./onboarding/Step2";
import { Step3 } from "./onboarding/Step3";
import { NoraIntro } from "./onboarding/NoraIntro";

// ─── Firebase ──────────────────────────────────────────────────────
import { auth, app, saveData, loadData } from "./utils/firebase";
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar.readonly");

// saveData/loadData — imported from utils/firebase.js

// fetchGCalEvents — moved to src/hooks/useCalendar.js

// ─── Tab Bar ───────────────────────────────────────────────────────
// TABS and MORE_TABS moved to components/TabBar.jsx

// ─── CSS ───────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;}
  @keyframes tabIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideRight{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
  @keyframes breathe{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.06);opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes dot{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
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


const wrap = (screen, key) => <ErrorBoundary key={key}>{screen}</ErrorBoundary>;

// ─── MAIN APP ──────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [screen, setScreen] = useState("loading");
  const [tab, setTabState] = useState("home");
  const [showMore, setShowMore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const setTab = (t) => { setTabState(t); navigate("/" + t, { replace: true }); trackPage(t); };
  // Sync tab from URL on load
  useEffect(() => {
    const path = location.pathname.replace("/", "") || "home";
    const validTabs = ["home","nora","plan","trips","budget","style","circle","wellness","profile","brief"];
    if (validTabs.includes(path)) setTabState(path);
  }, []);

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState({name:"",avatar:"👩",city:"",role:"",kids:[],partner:"",parents:[],inlaws:[],priorities:[],tripGoal:"",fitnessGoal:"",savingsGoal:"",challenge:"",soloParent:false});
  const [aiTasks, setAiTasks] = useState([]);
  const { calEvents, calConnected, connectCalendar } = useCalendar();
  const streak = useStreak(screen);
  const appContext = useAppContext(user?.uid, profile?.name, calEvents);

  // Context — managed by useAppContext hook
  const [showInstall, setShowInstall] = useState(false);
  useEffect(()=>{
    const handler = () => setShowInstall(true);
    window.addEventListener("hn_show_install", handler);
    return () => window.removeEventListener("hn_show_install", handler);
  }, []);

  // Show upgrade modal when AI limit is hit
  useEffect(() => {
    const handler = () => setShowUpgrade(true);
    window.addEventListener("hn_limit_reached", handler);
    return () => window.removeEventListener("hn_limit_reached", handler);
  }, []);

  const upd = (k,v) => setProfile(p=>({...p,[k]:v}));

  const handleAI = (p) => { if(p?.tasks) setAiTasks(prev=>[...prev,...p.tasks]); };

  // connectCalendar — managed by useCalendar hook

  const handleSaveProfile = (updated) => {
    setProfile(updated);
    if(user?.uid){
      saveData(user.uid, "profile", updated);
      try{localStorage.setItem("hn_uid", JSON.stringify(user.uid));}catch(e){}
    }
  };

  const reset = async () => {
    try{await signOut(auth);}catch(e){}
    resetUser();
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
        if(cred?.accessToken){sessionStorage.setItem("hn_gtoken",cred.accessToken);}
      }
    }).catch(()=>{});
    const timeout=setTimeout(()=>setAuthChecked(true),5000);
    const unsub=onAuthStateChanged(auth,(u)=>{
      clearTimeout(timeout);
      setUser(u||null);
      if(u){
        try{localStorage.setItem("hn_uid",JSON.stringify(u.uid));}catch(e){}
        identifyUser(u.uid,{email:u.email,name:u.displayName});
        loadData(u.uid,"profile").then(saved=>{
          if(saved&&saved.name){setProfile(saved);setScreen("app");}
          else{
            if(u.displayName)setProfile(p=>({...p,name:u.displayName.split(" ")[0]}));
            const savedStep=localStorage.getItem("hn_ob_step");
            setScreen(savedStep?`step${savedStep}`:"step1");
          }
        }).catch(()=>{setScreen("step1");});
      } else { setScreen("login"); }
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

  // Streak — managed by useStreak hook

  // Calendar — managed by useCalendar hook

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
  const STEPS=["step1","step2","step3"];
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
          {screen==="step3"&&<Step3 data={profile} onChange={upd} onNext={()=>{if(user?.uid)saveData(user.uid,"profile",profile);localStorage.removeItem("hn_ob_step");setScreen("intro");}} onBack={()=>setScreen("step2")}/>}
        </div>
      </div>
    );
  }

  if(screen==="login") return <><style>{css}</style><LoginScreen onLogin={handleLogin} auth={auth} googleProvider={googleProvider}/></>;
  if(screen==="intro") return <><style>{css}</style><NoraIntro profile={profile} onEnter={()=>{logEvent(EVENTS.ONBOARDING_COMPLETED,{name:profile.name,role:profile.role});
              requestPushPermission().catch(()=>{});localStorage.removeItem("hn_ob_step");setScreen("app");}}/></>;

  // Main app
  const screens = getScreens({
    setTab, aiTasks, profile, streak, calConnected, connectCalendar,
    calEvents, appContext, onTasks: handleAI, uid: user?.uid,
    onSaveProfile: handleSaveProfile, onSignOut: reset, user,
  });

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
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} reason="limit"/>}
      {showSettings && <SettingsPanel onClose={()=>setShowSettings(false)} onSignOut={reset} user={user} profile={profile}/>}
      <OfflineBanner/>
      <div key={tab} style={{padding:"16px 16px 90px",animation:"tabIn .25s ease both"}}>
        {screens[tab]||screens.home}
      </div>
      <TabBar tab={tab} setTab={setTab} showMore={showMore} setShowMore={setShowMore} profile={profile} onSettings={()=>setShowSettings(true)}/>
    </div>
  );
}
