import React, { useState } from "react";
import { T, FD, FB } from "../constants/theme";
import { auth } from "../utils/firebase";

// ─── Feature flag — matches api/create-checkout.js ───────────────
const PRO_ENABLED = false;

export function UpgradeModal({ onClose, reason = "limit" }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!PRO_ENABLED) {
      alert("HerNest Pro is coming soon! You'll be first to know when it launches. 💛");
      onClose();
      return;
    }
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Something went wrong. Please try again.");
    } catch (e) {
      alert("Could not start checkout. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"32px 24px 48px",width:"100%",maxWidth:430,animation:"fadeUp .3s ease both"}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:48,marginBottom:12}}>✨</div>
          <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 8px",fontWeight:400}}>HerNest Pro</h2>
          <p style={{fontFamily:FB,fontSize:14,color:T.bark,margin:0,lineHeight:1.6}}>
            {reason === "limit"
              ? "You've used all 10 free AI requests today. Upgrade for unlimited access."
              : "Unlock the full power of Nora with HerNest Pro."}
          </p>
        </div>

        {/* Features */}
        <div style={{background:T.sand,borderRadius:16,padding:"16px",marginBottom:24}}>
          {[
            "Unlimited Nora AI conversations",
            "Unlimited style, budget & wellness AI",
            "Priority response speed",
            "Early access to new features",
          ].map((f, i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<3?`1px solid ${T.linen}`:"none"}}>
              <span style={{color:T.sage,fontSize:16}}>✓</span>
              <span style={{fontFamily:FB,fontSize:13,color:T.esp}}>{f}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:FD,fontSize:36,fontWeight:700,color:T.esp}}>$9.99<span style={{fontFamily:FB,fontSize:14,color:T.taupe}}>/month</span></div>
          <p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:"4px 0 0"}}>Cancel anytime · Secure payment via Stripe</p>
        </div>

        {/* CTA */}
        <button onClick={handleUpgrade} disabled={loading} style={{width:"100%",background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none",borderRadius:16,padding:"16px",fontFamily:FB,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:12,opacity:loading?.7:1}}>
          {loading ? "Loading…" : PRO_ENABLED ? "Upgrade to Pro →" : "Join the waitlist →"}
        </button>
        <button onClick={onClose} style={{width:"100%",background:"none",border:"none",fontFamily:FB,fontSize:13,color:T.taupe,cursor:"pointer"}}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
