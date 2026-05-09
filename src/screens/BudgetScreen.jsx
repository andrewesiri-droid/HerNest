import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude, claudeVision } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function BudgetScreen({uid,appContext}){
  const CAT_META={Groceries:{IC:Ic.Bag,c:T.sage,budget:700},Kids:{IC:Ic.Kids,c:T.sky,budget:400},Fitness:{IC:Ic.Dumbbell,c:T.blush,budget:120},Travel:{IC:Ic.Suitcase,c:T.teal,budget:2000},Shopping:{IC:Ic.Hanger,c:T.lav,budget:500},Dining:{IC:Ic.Fork,c:T.gold,budget:300},Health:{IC:Ic.Leaf,c:T.sage,budget:200},Transport:{IC:Ic.Compass,c:T.sky,budget:300},Entertainment:{IC:Ic.Star,c:T.lav,budget:200},Bills:{IC:Ic.Budget,c:T.bark,budget:1000},Other:{IC:Ic.Bag,c:T.taupe,budget:200}};
  const DEFAULT_CATS = [
    {lb:"Groceries",spent:0,budget:700,IC:Ic.Bag,c:T.sage},
    {lb:"Kids",spent:0,budget:400,IC:Ic.Kids,c:T.sky},
    {lb:"Fitness",spent:0,budget:120,IC:Ic.Dumbbell,c:T.blush},
    {lb:"Travel",spent:0,budget:2000,IC:Ic.Suitcase,c:T.teal},
    {lb:"Shopping",spent:0,budget:500,IC:Ic.Hanger,c:T.lav},
    {lb:"Dining",spent:0,budget:300,IC:Ic.Fork,c:T.gold},
  ];
  const [budgetLoading,setBudgetLoading]=useState(true);
  const [categories,setCategories]=useState(()=>{
    // Try localStorage as read-ahead cache only
    try{const s=localStorage.getItem("hn_budget_cats");if(s){const saved=JSON.parse(s);return saved.map(c=>({...c,IC:CAT_META[c.lb]?.IC||Ic.Bag}));}}catch(e){}
    return DEFAULT_CATS;
  });
  const [savingsGoal,setSavingsGoal]=useState({name:"",target:0,saved:0});
  const [editingGoal,setEditingGoal]=useState(false);
  const [monthHistory,setMonthHistory]=useState(()=>{
    try{const s=localStorage.getItem("hn_month_history");return s?JSON.parse(s):[];}catch(e){return [];}
  });

  const saveMonthSnapshot=()=>{
    const month=new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"});
    const snapshot={month,categories:categories.map(c=>({lb:c.lb,spent:c.spent,budget:c.budget})),totalSpent:categories.reduce((a,c)=>a+c.spent,0),totalBudget:categories.reduce((a,c)=>a+c.budget,0)};
    setMonthHistory(p=>{
      const updated=[snapshot,...p.filter(m=>m.month!==month)].slice(0,6);
      try{localStorage.setItem("hn_month_history",JSON.stringify(updated));}catch(e){ /* silent */ }
      return updated;
    });
  };
  const [inp,setInp]=useState("");
  const [hist,setHist]=useState(()=>{
    try{
      const saved=localStorage.getItem("hn_budget_chat");
      if(saved){const parsed=JSON.parse(saved);if(parsed.length>0)return parsed;}
    }catch(e){}
    return [{role:"assistant",content:"Hey! 💛 I've looked at your numbers and you're doing better than you think. Ask me anything — what are you wondering about?"}];
  });
  const [loading,setLoading]=useState(false);
  const [activeTab,setActiveTab]=useState("overview");
  const [editCat,setEditCat]=useState(null);
  const [editVal,setEditVal]=useState("");
  const [showAddExp,setShowAddExp]=useState(false);
  const [newExp,setNewExp]=useState({cat:"Groceries",amount:"",note:""});
  const [importing,setImporting]=useState(false);
  const [importMode,setImportMode]=useState(null); // "photo" or "csv"
  const [importResult,setImportResult]=useState(null);

  const CATS=["Groceries","Dining","Kids","Shopping","Travel","Fitness","Health","Transport","Entertainment","Bills","Other"];

  const processReceipt=async(base64,mediaType)=>{
    setImporting(true);
    try{
      const text=await claudeVision(base64,mediaType,`Extract expense data from this receipt. Return ONLY valid JSON: {"merchant":"","amount":0,"category":"Groceries|Dining|Kids|Shopping|Travel|Fitness|Health|Transport|Entertainment|Bills|Other","date":"","items":["",""]}. If you cannot read the receipt return {"error":"cannot read"}`);
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      if(parsed.error)throw new Error(parsed.error);
      setImportResult(parsed);
    }catch(e){alert("Could not read receipt. Please try a clearer photo.");}
    setImporting(false);
  };

  const processCSV=async(text)=>{
    setImporting(true);
    try{
      const txt=await claude(null,`Analyse this bank statement CSV and extract transactions. Return ONLY valid JSON: {"transactions":[{"merchant":"","amount":0,"category":"Groceries|Dining|Kids|Shopping|Travel|Fitness|Health|Transport|Entertainment|Bills|Other","date":""}]} Only include debit/outgoing transactions. Here is the CSV:\n\n${text.slice(0,3000)}`);
      const parsed=JSON.parse(txt.replace(/```json|```/g,"").trim());
      setImportResult(parsed);
    }catch(e){alert("Could not process CSV. Please check the file format.");}
    setImporting(false);
  };

  const ensureCategory=(catName)=>{
    setCategories(p=>{
      if(p.find(c=>c.lb===catName))return p;
      const meta=CAT_META[catName]||{IC:Ic.Bag,c:T.taupe,budget:200};
      return [...p,{lb:catName,spent:0,budget:meta.budget,IC:meta.IC,c:meta.c}];
    });
  };

  const confirmImport=()=>{
    if(!importResult)return;
    if(importResult.amount){
      const cat=importResult.category||"Other";
      ensureCategory(cat);
      const exp={id:Date.now(),cat,amount:importResult.amount,note:importResult.merchant||"Receipt scan",date:importResult.date||"Today"};
      setExpenses(p=>[exp,...p]);
      setCategories(p=>p.map(c=>c.lb===cat?{...c,spent:c.spent+exp.amount}:c));
    } else if(importResult.transactions){
      const newExps=importResult.transactions.map((t,i)=>({id:Date.now()+i,cat:t.category||"Other",amount:Math.abs(t.amount),note:t.merchant||"Import",date:t.date||"Imported"}));
      const uniqueCats=[...new Set(newExps.map(e=>e.cat))];
      uniqueCats.forEach(ensureCategory);
      setExpenses(p=>[...newExps,...p]);
      newExps.forEach(exp=>setCategories(p=>p.map(c=>c.lb===exp.cat?{...c,spent:c.spent+exp.amount}:c)));
    }
    setImportResult(null);
    setImportMode(null);
    alert("Imported successfully! "+( importResult.transactions?importResult.transactions.length+" transactions added.":"Receipt added."));
  };
  const [expenses,setExpenses]=useState([]);

  // Save expenses + categories on change
  useEffect(()=>{
    try{
      localStorage.setItem("hn_expenses",JSON.stringify(expenses));
      localStorage.setItem("hn_budget_cats",JSON.stringify(categories.map(c=>({lb:c.lb,spent:c.spent,budget:c.budget,c:c.c}))));
    }catch(e){ /* silent */ }
    if(uid) saveData(uid,"budget",{expenses,categories:categories.map(c=>({...c,ICname:Object.keys(Ic).find(k=>Ic[k]===c.IC)||"Bag"})),savingsGoal}).catch(()=>{});
  },[expenses,categories,uid]);

  // Load budget from Firebase — Firestore is source of truth
  useEffect(()=>{
    if(!uid){setBudgetLoading(false);return;}
    loadData(uid,"budget").then(d=>{
      if(d?.expenses) setExpenses(d.expenses);
      if(d?.categories) setCategories(d.categories.map(c=>({...c,IC:Ic[c.ICname]||Ic.Bag})));
      else setCategories(DEFAULT_CATS);
      if(d?.savingsGoal) setSavingsGoal(d.savingsGoal);
      // Update localStorage cache
      try{if(d?.expenses)localStorage.setItem("hn_expenses",JSON.stringify(d.expenses));}catch(e){}
      try{if(d?.categories)localStorage.setItem("hn_budget_cats",JSON.stringify(d.categories));}catch(e){}
    }).catch(()=>{}).finally(()=>setBudgetLoading(false));
  },[uid]);

  const totalBudget=categories.reduce((a,c)=>a+c.budget,0);
  const totalSpent=categories.reduce((a,c)=>a+c.spent,0);
  const savingsPct=savingsGoal.target>0?Math.min(100,Math.round((savingsGoal.saved/savingsGoal.target)*100)):0;

  const addExpense=()=>{
    if(!newExp.amount)return;
    const amt=parseFloat(newExp.amount);
    setExpenses(p=>[{id:Date.now(),cat:newExp.cat,amount:amt,note:newExp.note,date:"Just now"},...p]);
    setCategories(p=>p.map(c=>c.lb===newExp.cat?{...c,spent:c.spent+amt}:c));
    setNewExp({cat:"Groceries",amount:"",note:""});
    setShowAddExp(false);
  };

  const ask=async()=>{
    if(!inp.trim()||loading)return;
    const msg=inp.trim();setInp("");setLoading(true);
    // Auto-scroll to bottom
    setTimeout(()=>{const el=document.getElementById("budget-chat");if(el)el.scrollTop=el.scrollHeight;},100);
    const h=hist.map(m=>({role:m.role,content:m.content}));
    const overBudget=categories.filter(c=>c.spent>c.budget*0.9).map(c=>`${c.lb} (${Math.round((c.spent/c.budget)*100)}%)`).join(", ")||"none";
    const recentExp=expenses.slice(0,5).map(e=>`${e.cat} $${e.amount}${e.note?` (${e.note})`:""}`).join(", ");
    const tripContext = appContext?.trips?.nextTrip ? `UPCOMING TRIP: ${appContext.trips.nextTrip.dest||appContext.trips.nextTrip.destination} in ${appContext.trips.daysUntilNext} days, estimated cost ~$${appContext.trips.estimatedCost}. Factor this into advice.` : "";
    const wellnessContext = appContext?.wellness?.isStruggling ? "She is struggling this week — be extra gentle, celebrate any win." : appContext?.wellness?.sleepDebt ? "She is tired — suggest convenience over frugality for meals." : "";
    const savingsContext = appContext?.budget?.savingsGoal ? `Savings goal: ${appContext.budget.savingsGoal.name||"goal"} — $${appContext.budget.savingsGoal.saved||0} of $${appContext.budget.savingsGoal.target||0}. Reference this when relevant.` : "";
    const ctx=`Real budget data: total budget $${totalBudget}, spent $${totalSpent} (${Math.round((totalSpent/totalBudget)*100)}%). Categories: ${categories.map(c=>`${c.lb}: $${c.spent}/$${c.budget}`).join(", ")}. Savings goal: ${savingsGoal.name||"not set"} $${savingsGoal.saved}/$${savingsGoal.target} (${savingsGoal.target>0?Math.round((savingsGoal.saved/savingsGoal.target)*100):0}%). Near budget limit: ${overBudget}. Recent expenses: ${recentExp}. ${tripContext} ${wellnessContext} ${savingsContext}`;
    const remaining=totalBudget-totalSpent;
    const pctLeft=totalBudget>0?remaining/totalBudget:0;
    const guiltFree=remaining>0
      ? pctLeft>0.2
        ? `She has ${remaining.toLocaleString()} remaining — this is genuinely guilt-free money she can enjoy.`
        : pctLeft>0.1
        ? `She has ${remaining.toLocaleString()} left — breathing room. Focus on essentials, protect it carefully.`
        : `She has only ${remaining.toLocaleString()} left — tight month. Essentials only. Be practical, not positive.`
      : `She is over budget by ${Math.abs(remaining).toLocaleString()}. Do not say anything positive about spending. Help her triage.`;
    try{const raw=await claude(`You are Nora, a warm and supportive financial companion inside HerNest. You are NEVER judgmental about spending — money is for living. ${ctx} ${guiltFree} IMPORTANT: Never recommend specific stocks, crypto, or investment products. If asked for investment advice, warmly redirect to a qualified financial advisor. SELF-CORRECTION: Only reference spending numbers the user has actually provided. Never invent or estimate figures not in the data. If uncertain about a financial fact, say "I believe" and recommend she verify with a professional.
Your tone is like a brilliant, encouraging best friend who happens to be a CFO. Celebrate wins first. Adapt tone to budget reality: if plenty remaining — celebrate and encourage; if tight — be practical and specific, never say "guilt-free" or "treat yourself"; if emergency — be direct and kind, one clear action only. Never use "overspending" or "should cut back". Reference her real numbers every time. Be specific with her numbers. 3-4 sentences max.`,msg,h,"budget_coach");setHist(p=>{
        const updated=[...p,{role:"user",content:msg},{role:"assistant",content:raw}];
        try{localStorage.setItem("hn_budget_chat",JSON.stringify(updated.slice(-20)));}catch(e){}
        return updated;
      });
    }
    catch(e){setHist(p=>[...p,{role:"user",content:msg},{role:"assistant",content:"Something went quiet on my end — but your question was a great one. Give me another go in a moment. 💳"}]);}
    setLoading(false);
  };

  if(budgetLoading) return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:16}}>
      <div style={{width:36,height:36,border:`3px solid ${T.linen}`,borderTop:`3px solid ${T.gold}`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <p style={{fontFamily:FB,fontSize:13,color:T.taupe}}>Loading your budget…</p>
    </div>
  );
  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{background:"linear-gradient(135deg,#1a1400,#3a2e00)",borderRadius:22,padding:"20px",marginBottom:14}}>
        <AIBadge t="Budget Coach"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:10}}>
          <div>
            <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:24,color:"#fff",margin:"0 0 4px",fontWeight:400}}>Financial Pulse</h2>
            <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",margin:0}}>{new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"})} {totalSpent<totalBudget*0.8?"· 🎉 On track!":totalSpent<totalBudget?"· ✓ Looking good":""}</p>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:FD,fontSize:28,fontWeight:700,color:T.gold}}>${totalSpent.toLocaleString()}</div>
            <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.4)"}}>of ${totalBudget.toLocaleString()}</div>
          </div>
        </div>
        <div style={{marginTop:14,background:"rgba(255,255,255,.12)",borderRadius:10,height:6}}>
          <div style={{background:`linear-gradient(90deg,${T.sage},${T.gold})`,height:"100%",borderRadius:10,width:`${Math.min((totalSpent/totalBudget)*100,100)}%`,transition:"width .5s"}}/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14}}>
        {["overview","expenses","trends","savings","coach"].map(t=><Pill key={t} ch={t.charAt(0).toUpperCase()+t.slice(1)} active={activeTab===t} on={()=>setActiveTab(t)} color={T.gold}/>)}
      </div>

      {/* Overview */}
      {activeTab==="overview"&&<div style={{animation:"slideRight .3s ease both"}}>
        <H2 t="Category Breakdown" sub="Tap amount to edit budget"/>
        {categories.map((s,idx)=>{
          const pct=Math.round((s.spent/s.budget)*100);
          return(
            <div key={s.lb} style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <Tile ic={s.IC} c={s.c} bg={s.c+"18"} s={16} ts={32} r={9}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontFamily:FB,fontSize:13,color:T.esp,fontWeight:700}}>{s.lb}</span>
                    {editCat===idx?(
                      <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                        onBlur={()=>{const v=parseFloat(editVal);if(!isNaN(v))setCategories(p=>p.map((c,i)=>i===idx?{...c,budget:v}:c));setEditCat(null);}}
                        style={{width:80,fontFamily:FB,fontSize:12,padding:"2px 8px",borderRadius:8,border:`1.5px solid ${T.gold}`,textAlign:"right",color:T.esp}}/>
                    ):(
                      <span onClick={()=>{setEditCat(idx);setEditVal(String(s.budget));}} style={{fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer"}}>${s.spent}<span style={{color:T.taupe}}>/${s.budget}</span></span>
                    )}
                  </div>
                  <ProgressBar value={s.spent} max={s.budget} color={s.c}/>
                </div>
              </div>
            </div>
          );
        })}
        <Card sx={{background:`linear-gradient(135deg,${T.esp},#5a3a22)`,border:"none"}} ch={<div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Ic.Bulb s={16} c={T.gold} w={1.5}/><span style={{fontFamily:FB,fontSize:10,color:T.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>Nora Says</span></div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:"rgba(255,255,255,.8)",margin:"0 0 14px",lineHeight:1.75}}>"You are doing better than you think. ${totalSpent>0?`You have tracked $${totalSpent.toLocaleString()} this month — that awareness alone puts you ahead of most people.`:`Start tracking your spending and watch your financial confidence grow.`}"</p>
          <button onClick={()=>{if(window.confirm("Reset budget for a new month? This will save this month's data and clear expenses.")){saveMonthSnapshot();setExpenses([]);setCategories(p=>p.map(c=>({...c,spent:0})));}}} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,padding:"7px 14px",fontFamily:FB,fontSize:11,fontWeight:700,color:"rgba(255,255,255,.6)",cursor:"pointer"}}>Start fresh month →</button>
        </div>}/>
      </div>}

      {/* Expenses */}
      {activeTab==="expenses"&&<div style={{animation:"slideRight .3s ease both"}}>
        <button onClick={()=>setShowAddExp(!showAddExp)} aria-label={showAddExp?"Cancel expense":"Log an expense"} style={{width:"100%",background:showAddExp?T.esp:T.sand,border:`1.5px solid ${showAddExp?T.esp:T.linen}`,borderRadius:14,padding:"11px 16px",fontFamily:FB,fontSize:13,color:showAddExp?"#fff":T.bark,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:12,transition:"all .15s"}}>
          <Ic.Plus s={18} c={showAddExp?"#fff":T.bark} w={2}/>{showAddExp?"Cancel":"Log an expense"}
        </button>
        {showAddExp&&(
          <div style={{background:"#fff",borderRadius:18,padding:"16px",marginBottom:14,border:`1.5px solid ${T.gold}`,animation:"pop .2s ease both"}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {categories.map(c=><button key={c.lb} onClick={()=>setNewExp(p=>({...p,cat:c.lb}))} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${newExp.cat===c.lb?c.c:T.linen}`,background:newExp.cat===c.lb?c.c+"18":"transparent",fontFamily:FB,fontSize:11,color:newExp.cat===c.lb?c.c:T.bark,cursor:"pointer"}}>{c.lb}</button>)}
            </div>
            <input type="number" placeholder="Amount $" value={newExp.amount} onChange={e=>setNewExp(p=>({...p,amount:e.target.value}))} style={{width:"100%",fontFamily:FB,fontSize:14,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:10}}/>
            <input placeholder="Note (optional)" value={newExp.note} onChange={e=>setNewExp(p=>({...p,note:e.target.value}))} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:12}}/>
            <button onClick={addExpense} style={{width:"100%",background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer"}}>Log Expense</button>
          </div>
        )}
        {/* Import buttons */}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <button onClick={()=>setImportMode("photo")} style={{flex:1,background:"linear-gradient(135deg,#1a2a4e,#1a4a8e)",color:"#fff",border:"none",borderRadius:13,padding:"11px 8px",fontFamily:FB,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            📷 Scan Receipt
          </button>
          <button onClick={()=>setImportMode("csv")} style={{flex:1,background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none",borderRadius:13,padding:"11px 8px",fontFamily:FB,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            📊 Import Statement
          </button>
        </div>

        {/* Photo receipt scanner */}
        {importMode==="photo"&&<div style={{background:"#fff",borderRadius:16,padding:"16px",marginBottom:14,border:`1.5px solid ${T.sky}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>📷 Scan Receipt</span>
            <button onClick={()=>{setImportMode(null);setImportResult(null);}} style={{background:"none",border:"none",cursor:"pointer"}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
          </div>
          {!importResult&&<div>
            <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:"0 0 12px",lineHeight:1.6}}>Take a photo of any receipt and Nora will extract the amount and category automatically.</p>
            <input type="file" accept="image/*" capture="environment" onChange={async e=>{
              const file=e.target.files?.[0];
              if(!file)return;
              const reader=new FileReader();
              reader.onload=async ev=>{
                const base64=ev.target.result.split(",")[1];
                const mediaType=file.type;
                await processReceipt(base64,mediaType);
              };
              reader.readAsDataURL(file);
            }} style={{display:"none"}} id="receipt-input"/>
            <label htmlFor="receipt-input" style={{display:"block",width:"100%",background:"linear-gradient(135deg,#1a2a4e,#1a4a8e)",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer",textAlign:"center"}}>
              {importing?"Reading receipt...":"📷 Take Photo or Choose Image"}
            </label>
          </div>}
          {importResult&&importResult.amount&&<div>
            <div style={{background:T.sageP,borderRadius:12,padding:"14px",marginBottom:12}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp,marginBottom:4}}>{importResult.merchant||"Receipt"}</div>
              <div style={{fontFamily:FD,fontSize:28,fontWeight:700,color:T.gold,marginBottom:4}}>${importResult.amount}</div>
              <div style={{fontFamily:FB,fontSize:12,color:T.bark}}>{importResult.category} · {importResult.date||"Today"}</div>
              {importResult.items?.length>0&&<div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:4}}>{importResult.items.slice(0,3).join(", ")}</div>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setImportResult(null)} style={{flex:1,background:T.sand,border:`1px solid ${T.linen}`,borderRadius:12,padding:"10px",fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer"}}>Retake</button>
              <button onClick={confirmImport} style={{flex:2,background:T.sage,border:"none",borderRadius:12,padding:"10px",fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>Add to Budget ✓</button>
            </div>
          </div>}
        </div>}

        {/* CSV import */}
        {importMode==="csv"&&<div style={{background:"#fff",borderRadius:16,padding:"16px",marginBottom:14,border:`1.5px solid ${T.gold}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>📊 Import Bank Statement</span>
            <button onClick={()=>{setImportMode(null);setImportResult(null);}} style={{background:"none",border:"none",cursor:"pointer"}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
          </div>
          {!importResult&&<div>
            <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:"0 0 8px",lineHeight:1.6}}>Download your bank statement as CSV and upload it. Nora will categorise every transaction automatically.</p>
            <div style={{background:T.sand,borderRadius:10,padding:"10px 12px",marginBottom:12}}>
              <p style={{fontFamily:FB,fontSize:11,color:T.bark,margin:0,fontWeight:700}}>How to get your CSV:</p>
              <p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:"4px 0 0",lineHeight:1.6}}>Login to your bank → Statements → Download as CSV</p>
            </div>
            <input type="file" accept=".csv,.txt" onChange={async e=>{
              const file=e.target.files?.[0];
              if(!file)return;
              const text=await file.text();
              await processCSV(text);
            }} style={{display:"none"}} id="csv-input"/>
            <label htmlFor="csv-input" style={{display:"block",width:"100%",background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none",borderRadius:12,padding:"12px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer",textAlign:"center"}}>
              {importing?"Analysing transactions...":"📊 Upload Bank Statement CSV"}
            </label>
          </div>}
          {importResult?.transactions&&<div>
            <div style={{background:T.goldP,borderRadius:12,padding:"12px",marginBottom:12}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp,marginBottom:8}}>{importResult.transactions.length} transactions found</div>
              {importResult.transactions.slice(0,5).map((t,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<4?`1px solid ${T.linen}`:"none"}}>
                  <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>{t.merchant}</span>
                  <span style={{fontFamily:FB,fontSize:12,color:T.esp,fontWeight:700}}>${Math.abs(t.amount)}</span>
                </div>
              ))}
              {importResult.transactions.length>5&&<p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:"6px 0 0"}}>+{importResult.transactions.length-5} more transactions</p>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setImportResult(null)} style={{flex:1,background:T.sand,border:`1px solid ${T.linen}`,borderRadius:12,padding:"10px",fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer"}}>Cancel</button>
              <button onClick={confirmImport} style={{flex:2,background:T.sage,border:"none",borderRadius:12,padding:"10px",fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>Import All ✓</button>
            </div>
          </div>}
        </div>}

        <H2 t="Recent Expenses"/>
        {expenses.length===0&&<div style={{textAlign:"center",padding:"28px 20px",background:T.sand,borderRadius:16,marginBottom:12}}>
          <div style={{fontSize:36,marginBottom:10}}>💳</div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 6px"}}>No expenses logged yet</p>
          <p style={{fontFamily:FB,fontSize:12,color:T.bark,margin:"0 0 14px",lineHeight:1.5}}>Start tracking your spending and Nora will give you CFO-level insights</p>
          <button onClick={()=>setShowAddExp(true)} style={{background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontFamily:FB,fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Log First Expense</button>
        </div>}
        {expenses.map((e,i)=>(
          <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1px solid ${T.linen}`}}>
            <Tile ic={categories.find(c=>c.lb===e.cat)?.IC||Ic.Budget} c={categories.find(c=>c.lb===e.cat)?.c||T.bark} bg={(categories.find(c=>c.lb===e.cat)?.c||T.bark)+"18"} s={16} ts={34} r={10}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{e.cat}</div>
              {e.note&&<div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:2}}>{e.note}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.esp}}>${e.amount}</div>
              <div style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{e.date}</div>
            </div>
          </div>
        ))}
      </div>}

      {/* Savings */}
      {activeTab==="savings"&&<div style={{animation:"slideRight .3s ease both"}}>
        <Card sx={{background:`linear-gradient(135deg,#1a1400,#3a2e00)`,border:"none"}} ch={<div>
          {editingGoal?(
            <div style={{marginBottom:8}}>
              <input value={savingsGoal.name} onChange={e=>setSavingsGoal(p=>({...p,name:e.target.value}))} placeholder="Goal name e.g. Bali Trip" style={{width:"100%",fontFamily:FB,fontSize:12,padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff",marginBottom:6}}/>
              <div style={{display:"flex",gap:6}}>
                <input type="number" value={savingsGoal.saved} onChange={e=>setSavingsGoal(p=>({...p,saved:Number(e.target.value)}))} placeholder="Saved $" style={{flex:1,fontFamily:FB,fontSize:12,padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff"}}/>
                <input type="number" value={savingsGoal.target} onChange={e=>setSavingsGoal(p=>({...p,target:Number(e.target.value)}))} placeholder="Target $" style={{flex:1,fontFamily:FB,fontSize:12,padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff"}}/>
              </div>
              <button onClick={()=>setEditingGoal(false)} style={{width:"100%",background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,padding:"6px",fontFamily:FB,fontSize:11,color:"#fff",cursor:"pointer",marginTop:6}}>Save goal</button>
            </div>
          ):(
            <p onClick={()=>setEditingGoal(true)} style={{fontFamily:FB,fontSize:11,color:T.gold,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,margin:"0 0 6px",cursor:"pointer"}}>Goal — {savingsGoal.name} ✏️</p>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:12}}>
            <div style={{fontFamily:FD,fontSize:36,fontWeight:700,color:"#fff"}}>{savingsPct}%</div>
            <div style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.5)"}}>${savingsGoal.saved.toLocaleString()} / ${savingsGoal.target.toLocaleString()}</div>
          </div>
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:10,height:10}}>
            <div style={{background:`linear-gradient(90deg,${T.gold},${T.sage})`,height:"100%",borderRadius:10,width:`${savingsPct}%`,transition:"width .5s"}}/>
          </div>
          <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",margin:"10px 0 0"}}>
            {(()=>{
              const remaining=savingsGoal.target-savingsGoal.saved;
              const surplus=totalBudget>0?Math.max(0,totalBudget-totalSpent):0;
              const monthly=surplus||200;
              const months=monthly>0?Math.ceil(remaining/monthly):null;
              if(remaining<=0)return "🎉 Goal reached!";
              if(!savingsGoal.target)return "Set a target to see your timeline";
              return `At your current rate, you'll reach your goal in ${months||"?"} months`;
            })()}
          </p>
        </div>}/>
        <Card ch={<div>
          <H2 t="Add to Savings" sub="Tap to log a contribution"/>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {[100,200,500,1000].map(amt=>(
              <button key={amt} onClick={()=>{
                setSavingsGoal(p=>({...p,saved:Math.min(p.saved+amt,p.target)}));
                // Log contribution to history
                const today=new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});
                const hist=JSON.parse(localStorage.getItem("hn_savings_hist")||"[]");
                hist.unshift({amt,date:today});
                if(hist.length>10)hist.pop();
                localStorage.setItem("hn_savings_hist",JSON.stringify(hist));
              }} style={{flex:1,background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:12,padding:"10px 0",fontFamily:FD,fontSize:16,fontWeight:700,color:T.esp,cursor:"pointer"}}>+${amt}</button>
            ))}
          </div>
          {(()=>{
            const hist=JSON.parse(localStorage.getItem("hn_savings_hist")||"[]");
            if(!hist.length)return null;
            const monthTotal=hist.reduce((s,h)=>s+h.amt,0);
            return(
              <div>
                <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:6}}>Recent contributions · ${monthTotal} total</div>
                {hist.slice(0,4).map((h,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<3?`1px solid ${T.linen}`:"none"}}>
                    <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>{h.date}</span>
                    <span style={{fontFamily:FD,fontSize:13,fontWeight:700,color:T.sage}}>+${h.amt}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>}/>
        {savingsPct>=100&&<Card sx={{background:`linear-gradient(135deg,${T.sage},#2a5a3a)`,border:"none"}} ch={<div style={{textAlign:"center",padding:"8px 0"}}>
          <div style={{fontSize:36,marginBottom:8}}>🎉</div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:"#fff",margin:"0 0 4px"}}>Goal reached!</p>
          <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.7)",margin:"0 0 12px"}}>You saved ${savingsGoal.target.toLocaleString()} for {savingsGoal.name}. Nora is so proud of you.</p>
          <button onClick={()=>{const txt=`I just hit my savings goal of $${savingsGoal.target.toLocaleString()} for ${savingsGoal.name} with HerNest 🎉`;if(navigator.share){navigator.share({text:txt}).catch(()=>{});}else{navigator.clipboard.writeText(txt).catch(()=>{});}}} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,padding:"8px 16px",fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>Share achievement 🌟</button>
        </div>}/>}
        <Card ch={<div>
          <H2 t="Savings Milestones"/>
          {[25,50,75,100].map(pct=>(
            <div key={pct} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:pct!==100?`1px solid ${T.linen}`:"none"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:savingsPct>=pct?T.sage:T.linen,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {savingsPct>=pct?<Ic.Check s={14} c="#fff" w={2.5}/>:<span style={{fontFamily:FD,fontSize:13,fontWeight:700,color:T.taupe}}>{pct}</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{pct}% — ${Math.round(savingsGoal.target*pct/100).toLocaleString()}</div>
                <div style={{fontFamily:FB,fontSize:11,color:savingsPct>=pct?T.sage:T.taupe}}>
                  {savingsPct>=pct
                    ? pct===100?"🎉 Goal complete! You did it!":pct===75?"💪 Almost there!":pct===50?"🌟 Halfway there!":"✓ First milestone reached!"
                    : `${pct-savingsPct}% away · $${Math.round((savingsGoal.target*(pct/100))-savingsGoal.saved).toLocaleString()} to go`}
                </div>
              </div>
            </div>
          ))}
        </div>}/>
      </div>}

      {/* Coach */}
      {activeTab==="trends"&&<div style={{animation:"slideRight .3s ease both"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <H2 t="Monthly Trends" sub="How you are tracking over time"/>
          <button onClick={()=>{saveMonthSnapshot();alert("This month saved!");}} style={{background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:10,padding:"6px 12px",fontFamily:FB,fontSize:11,fontWeight:700,color:T.gold,cursor:"pointer"}}>Save month</button>
        </div>

        {monthHistory.length<2?(
          <div style={{textAlign:"center",padding:"28px 20px",background:T.sand,borderRadius:16}}>
            <div style={{fontSize:36,marginBottom:10}}>📊</div>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 8px"}}>No trends yet</p>
            <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:"0 0 16px",lineHeight:1.6}}>At the end of each month tap "Save month" to start tracking your trends.</p>
          </div>
        ):<>
          {/* Month vs month total */}
          {monthHistory.length>=2&&(()=>{
            const cur=monthHistory[0];
            const prev=monthHistory[1];
            const diff=cur.totalSpent-prev.totalSpent;
            const pct=Math.round(Math.abs(diff)/prev.totalSpent*100);
            return(
              <Card ch={<div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:FB,fontSize:12,color:T.taupe,marginBottom:4}}>{cur.month} vs {prev.month}</div>
                    <div style={{fontFamily:FD,fontSize:28,fontWeight:700,color:diff<0?T.sage:T.blush}}>{diff<0?"▼":"▲"} ${Math.abs(diff).toLocaleString()}</div>
                    <div style={{fontFamily:FB,fontSize:12,color:diff<0?T.sage:T.blush,marginTop:2}}>{diff<0?`${pct}% less than last month 🎉`:`${pct}% more than last month`}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:FB,fontSize:11,color:T.taupe}}>This month</div>
                    <div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:T.esp}}>${cur.totalSpent.toLocaleString()}</div>
                    <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:4}}>Last month</div>
                    <div style={{fontFamily:FD,fontSize:16,color:T.bark}}>${prev.totalSpent.toLocaleString()}</div>
                  </div>
                </div>
                {/* Category comparison */}
                {cur.categories.map((cat,i)=>{
                  const prevCat=prev.categories.find(c=>c.lb===cat.lb);
                  if(!prevCat)return null;
                  const catDiff=cat.spent-prevCat.spent;
                  if(Math.abs(catDiff)<5)return null;
                  return(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderTop:`1px solid ${T.linen}`}}>
                      <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>{cat.lb}</span>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontFamily:FB,fontSize:11,color:T.taupe}}>${prevCat.spent} → ${cat.spent}</span>
                        <span style={{fontFamily:FB,fontSize:11,fontWeight:700,color:catDiff<0?T.sage:T.blush}}>{catDiff<0?"▼":"▲"}${Math.abs(catDiff)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>}/>
            );
          })()}

          {/* Last 6 months bar chart */}
          <Card ch={<div>
            <H2 t="Last 6 months" sub="Total spending"/>
            <div style={{display:"flex",alignItems:"flex-end",gap:6,height:100,marginTop:14}}>
              {[...monthHistory].reverse().map((m,i)=>{
                const maxSpent=Math.max(...monthHistory.map(h=>h.totalSpent));
                const h=maxSpent?Math.round((m.totalSpent/maxSpent)*80):20;
                return(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <span style={{fontFamily:FB,fontSize:9,color:T.taupe}}>${Math.round(m.totalSpent/1000)}k</span>
                    <div style={{width:"100%",height:h,background:i===monthHistory.length-1?T.gold:T.linen,borderRadius:"4px 4px 0 0",transition:"height .3s"}}/>
                    <span style={{fontFamily:FB,fontSize:9,color:T.bark,textAlign:"center"}}>{m.month.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>}/>
        </>}
      </div>}

      {activeTab==="coach"&&<div style={{animation:"slideRight .3s ease both"}}>

        {/* Budget status card — tiered by remaining % */}
        {(()=>{
          const remaining = totalBudget - totalSpent;
          const pct = totalBudget > 0 ? remaining / totalBudget : 0;
          if(pct > 0.2) return (
            <div style={{background:`linear-gradient(135deg,${T.sage},#4a7a5a)`,borderRadius:18,padding:"16px 18px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:28}}>✅</span>
                <div>
                  <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>Guilt-free money this month</div>
                  <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.7)"}}>You can spend this without any worry</div>
                </div>
              </div>
              <div style={{fontFamily:FD,fontSize:36,fontWeight:700,color:"#fff",marginBottom:4}}>${remaining.toLocaleString()}</div>
              <div style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.6)"}}>That is ${Math.round(remaining/30)} a day to enjoy 💛</div>
            </div>
          );
          if(pct > 0.1) return (
            <div style={{background:"linear-gradient(135deg,#5a4a1a,#8a7a2a)",borderRadius:18,padding:"16px 18px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:28}}>🌿</span>
                <div>
                  <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>Breathing room: ${remaining.toLocaleString()}</div>
                  <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.7)"}}>Protect it for essentials this week</div>
                </div>
              </div>
            </div>
          );
          if(pct > 0.05) return (
            <div style={{background:"linear-gradient(135deg,#5a3a1a,#8a5a2a)",borderRadius:18,padding:"16px 18px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:28}}>⚠️</span>
                <div>
                  <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>Tight month: ${remaining.toLocaleString()} left</div>
                  <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.7)"}}>Essentials first. Nora is watching your back.</div>
                </div>
              </div>
            </div>
          );
          if(pct > 0) return (
            <div style={{background:"linear-gradient(135deg,#5a1a1a,#8a2a2a)",borderRadius:18,padding:"16px 18px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:28}}>🔴</span>
                <div>
                  <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>Emergency month: ${remaining.toLocaleString()} left</div>
                  <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.7)"}}>What is the one must-pay this week?</div>
                </div>
              </div>
            </div>
          );
          return (
            <div style={{background:"linear-gradient(135deg,#3a1a1a,#6a2a2a)",borderRadius:18,padding:"16px 18px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:28}}>🆘</span>
                <div>
                  <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>Over budget by ${Math.abs(remaining).toLocaleString()}</div>
                  <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.7)"}}>Nora can help you triage. Talk to her.</div>
                </div>
              </div>
            </div>
          );
        })()}

        <div style={{background:AIGRAD,borderRadius:18,padding:"16px",marginBottom:14}}>
          <AIBadge t="Financial Companion"/>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.6)",margin:"8px 0 0",lineHeight:1.6}}>I am on your side. Ask me anything — I will celebrate your wins and help you make the most of what you have.</p>
        </div>
        {hist.length<=1&&["How much can I spend guilt-free?","What are my biggest wins this month?","Help me save for my trip","What should I treat myself to?"].map((q,i)=>(
          <div key={i} onClick={()=>setInp(q)} style={{background:"#fff",border:`1px solid ${T.linen}`,borderRadius:11,padding:"9px 14px",cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",gap:8,fontFamily:FB,fontSize:12,color:T.bark}}>
            <Ic.Budget s={13} c={T.taupe} w={1.5}/>{q}
          </div>
        ))}
        <div id="budget-chat" style={{maxHeight:280,overflowY:"auto",marginBottom:10}}>
          {hist.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:8}}>
              <div style={{maxWidth:"85%",background:m.role==="user"?`linear-gradient(135deg,${T.esp},#4a3020)`:"#fff",borderRadius:16,padding:"10px 14px",border:m.role==="assistant"?`1px solid ${T.linen}`:"none"}}>
                <p style={{fontFamily:FB,fontSize:13,color:m.role==="user"?"rgba(255,255,255,.9)":T.bark,margin:0,lineHeight:1.6}}>{m.content}</p>
              </div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",gap:4,padding:"8px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:T.taupe,animation:`dot 1.2s ease-in-out ${i*.2}s infinite`}}/>)}</div>}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
          <button onClick={()=>{setHist([{role:"assistant",content:"Hey! 💛 Fresh start — what's on your mind?"}]);try{localStorage.removeItem("hn_budget_chat");}catch(e){}}} style={{background:"none",border:"none",fontFamily:FB,fontSize:10,color:T.taupe,cursor:"pointer",textDecoration:"underline"}}>Clear chat</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Ask anything about your finances…" style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
          <button onClick={ask} aria-label="Send message" style={{background:T.esp,border:"none",borderRadius:13,padding:"0 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Send s={16} c="#fff" w={2}/></button>
        </div>
      </div>}
    </div>
  );
}
