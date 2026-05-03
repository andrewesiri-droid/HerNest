import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function LoginScreen({onLogin}){
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [loading,setLoading]=useState(false); const [mode,setMode]=useState("login"); const [error,setError]=useState("");
  const handleGoogle=async()=>{
    setLoading(true);setError("");
    try{
      const result=await signInWithPopup(auth,googleProvider);
      const cred=GoogleAuthProvider.credentialFromResult(result);
      if(cred?.accessToken){sessionStorage.setItem("hn_gtoken",cred.accessToken);localStorage.setItem("hn_gtoken",cred.accessToken);}
      const u=result.user;
      onLogin({uid:u.uid,email:u.email,name:u.displayName?.split(" ")[0]||"",isGoogle:true});
    }catch(e){setError("Google sign in failed. Please try again.");setLoading(false);}
  };
  const handle=()=>{if(!email||!pass)return;setLoading(true);setTimeout(()=>{setLoading(false);onLogin({uid:email,email,name:email.split("@")[0]});},1200);};
  return(
    <div style={{minHeight:"100vh",background:AIGRAD,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
      <div style={{padding:"60px 32px 40px",textAlign:"center",animation:"fadeUp .5s ease both"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:`0 0 30px rgba(196,154,60,.35)`}}><Ic.Star s={28} c="#fff" w={1.3}/></div>
        <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:36,color:"#fff",margin:"0 0 6px",fontWeight:400}}>Her<strong style={{fontStyle:"normal",fontWeight:700}}>Nest</strong></h1>
        <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.45)",margin:0}}>{mode==="login"?"Welcome back, lovely.":"Join thousands of super mums."}</p>
      </div>
      <div style={{flex:1,background:T.cream,borderRadius:"28px 28px 0 0",padding:"32px 24px 40px",animation:"fadeUp .5s .15s ease both"}}>
        <p style={{fontFamily:FB,fontSize:11,color:T.taupe,textAlign:"center",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Continue with</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
          {[{lb:"Google",bg:"#fff",br:T.linen,col:T.esp,logo:<svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>},
           {lb:"Apple",bg:"#000",br:"#000",col:"#fff",logo:<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>},
          ].map(b=>(
            <button key={b.lb} className="lift" onClick={b.lb==="Google"?handleGoogle:()=>{setLoading(true);setTimeout(()=>{setLoading(false);onLogin({uid:b.lb,email:b.lb,name:b.lb});},1200);}} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",borderRadius:14,border:`1.5px solid ${b.br}`,background:b.bg,cursor:"pointer",fontFamily:FB,fontSize:13,fontWeight:600,color:b.col}}>{b.logo}{b.lb}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}><div style={{flex:1,height:1,background:T.linen}}/><span style={{fontFamily:FB,fontSize:11,color:T.taupe,letterSpacing:1,textTransform:"uppercase"}}>or</span><div style={{flex:1,height:1,background:T.linen}}/></div>
        <FInput label="Email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} type="email" icon={Ic.Mail}/>
        <FInput label="Password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} type="password" icon={Ic.Lock}/>
        {mode==="login"&&<p style={{fontFamily:FB,fontSize:12,color:T.gold,textAlign:"right",marginBottom:20,marginTop:-6,cursor:"pointer"}}>Forgot password?</p>}
        <button onClick={handle} disabled={!email||!pass||loading} className="lift" style={{width:"100%",padding:"15px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:email&&pass&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:email&&pass?1:.5,background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"}}>
          {loading?<div style={{width:20,height:20,border:"2.5px solid rgba(255,255,255,.3)",borderTop:"2.5px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>:mode==="login"?"Sign In":"Create Account"}
        </button>
        <p style={{fontFamily:FB,fontSize:13,color:T.bark,textAlign:"center",marginTop:20}}>
          {mode==="login"?"New to HerNest? ":"Already have an account? "}
          <span onClick={()=>setMode(mode==="login"?"signup":"login")} style={{color:T.gold,fontWeight:700,cursor:"pointer"}}>{mode==="login"?"Create account":"Sign in"}</span>
        </p>
      </div>
    </div>
  );
}
