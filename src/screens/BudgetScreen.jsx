import React, { useState } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { claude, claudeVision } from "../utils/claude";
import { Card, H2, Pill, AIBadge, Tile, Spinner, ProgressBar } from "../components/shared";
import { useBudget, CAT_META } from "../features/budget/useBudget.js";
import { TRACKING } from "../utils/tracking.js";

// ─── Overview Tab ─────────────────────────────────────────────────
function OverviewTab({ categories, setCategories, totalSpent, totalBudget, saveMonthSnapshot, expenses, setExpenses }) {
  const [editCat, setEditCat] = useState(null);
  const [editVal, setEditVal] = useState("");
  return (
    <div style={{animation:"slideRight .3s ease both"}}>
      <H2 t="Category Breakdown" sub="Tap amount to edit budget"/>
      {categories.map((s, idx) => {
        const pct = Math.round((s.spent / s.budget) * 100);
        return (
          <div key={s.lb} style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <Tile ic={s.IC} c={s.c} bg={s.c+"18"} s={16} ts={32} r={9}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontFamily:FB,fontSize:13,color:T.esp,fontWeight:700}}>{s.lb}</span>
                  {editCat===idx ? (
                    <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                      onBlur={()=>{const v=parseFloat(editVal);if(!isNaN(v))setCategories(p=>p.map((c,i)=>i===idx?{...c,budget:v}:c));setEditCat(null);}}
                      style={{width:80,fontFamily:FB,fontSize:12,padding:"2px 8px",borderRadius:8,border:`1.5px solid ${T.gold}`,textAlign:"right",color:T.esp}}/>
                  ) : (
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
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:"rgba(255,255,255,.8)",margin:"0 0 14px",lineHeight:1.75}}>"{totalSpent>0?`You have tracked $${totalSpent.toLocaleString()} this month — that awareness alone puts you ahead of most people.`:`Start tracking your spending and watch your financial confidence grow.`}"</p>
        <button onClick={()=>{if(window.confirm("Reset budget for a new month?")){saveMonthSnapshot();setExpenses([]);setCategories(p=>p.map(c=>({...c,spent:0})));}}} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,padding:"7px 14px",fontFamily:FB,fontSize:11,fontWeight:700,color:"rgba(255,255,255,.6)",cursor:"pointer"}}>Start fresh month →</button>
      </div>}/>
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────
function ExpensesTab({ categories, expenses, setExpenses, setCategories, ensureCategory, appContext }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newExp, setNewExp] = useState({cat:"Groceries",amount:"",note:""});
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const CATS = Object.keys(CAT_META);

  const addExpense = () => {
    if (!newExp.amount) return;
    const amt = parseFloat(newExp.amount);
    setExpenses(p => [{id:Date.now(),cat:newExp.cat,amount:amt,note:newExp.note,date:"Just now"}, ...p]);
    setCategories(p => p.map(c => c.lb===newExp.cat?{...c,spent:c.spent+amt}:c));
    TRACKING.expenseLogged(newExp.cat, amt);
    setNewExp({cat:"Groceries",amount:"",note:""});
    setShowAdd(false);
  };

  const processReceipt = async (base64, mediaType) => {
    setImporting(true);
    try {
      const text = await claudeVision(base64, mediaType, `Extract expense data from this receipt. Return ONLY valid JSON: {"merchant":"","amount":0,"category":"Groceries|Dining|Kids|Shopping|Travel|Fitness|Health|Transport|Entertainment|Bills|Other","date":"","items":["",""]}. If you cannot read the receipt return {"error":"cannot read"}`);
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      if (parsed.error) throw new Error(parsed.error);
      setImportResult(parsed);
    } catch (e) { alert("Could not read receipt. Please try a clearer photo."); }
    setImporting(false);
  };

  const processCSV = async (text) => {
    setImporting(true);
    try {
      const txt = await claude(null, `Analyse this bank statement CSV. Return ONLY valid JSON: {"transactions":[{"merchant":"","amount":0,"category":"Groceries|Dining|Kids|Shopping|Travel|Fitness|Health|Transport|Entertainment|Bills|Other","date":""}]} Only include debit/outgoing transactions. CSV:\n\n${text.slice(0,3000)}`);
      setImportResult(JSON.parse(txt.replace(/```json|```/g,"").trim()));
    } catch (e) { alert("Could not process CSV."); }
    setImporting(false);
  };

  const confirmImport = () => {
    if (!importResult) return;
    if (importResult.amount) {
      const cat = importResult.category||"Other";
      ensureCategory(cat);
      const exp = {id:Date.now(),cat,amount:importResult.amount,note:importResult.merchant||"Receipt scan",date:importResult.date||"Today"};
      setExpenses(p=>[exp,...p]);
      setCategories(p=>p.map(c=>c.lb===cat?{...c,spent:c.spent+exp.amount}:c));
    } else if (importResult.transactions) {
      const newExps = importResult.transactions.map((t,i)=>({id:Date.now()+i,cat:t.category||"Other",amount:Math.abs(t.amount),note:t.merchant||"Import",date:t.date||"Imported"}));
      [...new Set(newExps.map(e=>e.cat))].forEach(ensureCategory);
      setExpenses(p=>[...newExps,...p]);
      newExps.forEach(exp=>setCategories(p=>p.map(c=>c.lb===exp.cat?{...c,spent:c.spent+exp.amount}:c)));
    }
    setImportResult(null); setImportMode(null);
  };

  return (
    <div style={{animation:"slideRight .3s ease both"}}>
      <button onClick={()=>setShowAdd(!showAdd)} aria-label={showAdd?"Cancel":"Log an expense"} style={{width:"100%",background:showAdd?T.esp:T.sand,border:`1.5px solid ${showAdd?T.esp:T.linen}`,borderRadius:14,padding:"11px 16px",fontFamily:FB,fontSize:13,color:showAdd?"#fff":T.bark,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <Ic.Plus s={18} c={showAdd?"#fff":T.bark} w={2}/>{showAdd?"Cancel":"Log an expense"}
      </button>
      {showAdd && (
        <div style={{background:"#fff",borderRadius:18,padding:"16px",marginBottom:14,border:`1.5px solid ${T.gold}`}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            {categories.map(c=><button key={c.lb} onClick={()=>setNewExp(p=>({...p,cat:c.lb}))} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${newExp.cat===c.lb?c.c:T.linen}`,background:newExp.cat===c.lb?c.c+"18":"transparent",fontFamily:FB,fontSize:11,color:newExp.cat===c.lb?c.c:T.bark,cursor:"pointer"}}>{c.lb}</button>)}
          </div>
          <input type="number" placeholder="Amount $" value={newExp.amount} onChange={e=>setNewExp(p=>({...p,amount:e.target.value}))} style={{width:"100%",fontFamily:FB,fontSize:14,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:10}}/>
          <input placeholder="Note (optional)" value={newExp.note} onChange={e=>setNewExp(p=>({...p,note:e.target.value}))} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:12}}/>
          <button onClick={addExpense} style={{width:"100%",background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer"}}>Log Expense</button>
        </div>
      )}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <button onClick={()=>setImportMode("photo")} style={{flex:1,background:"linear-gradient(135deg,#1a2a4e,#1a4a8e)",color:"#fff",border:"none",borderRadius:13,padding:"11px 8px",fontFamily:FB,fontSize:12,fontWeight:700,cursor:"pointer"}}>📷 Scan Receipt</button>
        <button onClick={()=>setImportMode("csv")} style={{flex:1,background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none",borderRadius:13,padding:"11px 8px",fontFamily:FB,fontSize:12,fontWeight:700,cursor:"pointer"}}>📊 Import Statement</button>
      </div>
      {importMode==="photo" && !importResult && (
        <div style={{background:"#fff",borderRadius:16,padding:"16px",marginBottom:14,border:`1.5px solid ${T.sky}`}}>
          <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:"0 0 12px"}}>Take a photo of any receipt and Nora will extract the amount automatically.</p>
          <input type="file" accept="image/*" capture="environment" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=async ev=>{const b64=ev.target.result.split(",")[1];await processReceipt(b64,file.type);};r.readAsDataURL(file);}} style={{display:"none"}} id="receipt-input"/>
          <label htmlFor="receipt-input" style={{display:"block",width:"100%",background:"linear-gradient(135deg,#1a2a4e,#1a4a8e)",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer",textAlign:"center"}}>{importing?"Reading receipt...":"📷 Take Photo or Choose Image"}</label>
        </div>
      )}
      {importResult?.amount && (
        <div style={{background:"#fff",borderRadius:16,padding:"16px",marginBottom:14,border:`1.5px solid ${T.sage}`}}>
          <div style={{fontFamily:FD,fontSize:28,fontWeight:700,color:T.gold,marginBottom:4}}>${importResult.amount}</div>
          <div style={{fontFamily:FB,fontSize:12,color:T.bark,marginBottom:12}}>{importResult.merchant} · {importResult.category}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setImportResult(null)} style={{flex:1,background:T.sand,border:`1px solid ${T.linen}`,borderRadius:12,padding:"10px",fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer"}}>Retake</button>
            <button onClick={confirmImport} style={{flex:2,background:T.sage,border:"none",borderRadius:12,padding:"10px",fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>Add to Budget ✓</button>
          </div>
        </div>
      )}
      <H2 t="Recent Expenses"/>
      {expenses.length===0 && (
        <div style={{background:T.sand,borderRadius:16,padding:"20px",marginBottom:12}}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.taupe,marginBottom:12}}>Quick add</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {["☕ Coffee","🛒 Groceries","⛽ Petrol","🍕 Lunch","👗 Shopping","💊 Pharmacy"].map((item,i)=>(
              <button key={i} onClick={()=>{
                const cat=i<=1?"Groceries":i===2?"Transport":i===3?"Dining":i===4?"Shopping":"Health";
                setNewExp({cat,amount:"",note:item.split(" ")[1]});
                setShowAdd(true);
              }} style={{background:"#fff",border:`1px solid ${T.linen}`,borderRadius:12,padding:"10px 8px",fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer",textAlign:"center"}}>
                {item}
              </button>
            ))}
          </div>
          <button onClick={()=>setShowAdd(true)} style={{width:"100%",background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Log an expense</button>
        </div>
      )}
      {expenses.map((e) => (
        <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1px solid ${T.linen}`}}>
          <Tile ic={categories.find(c=>c.lb===e.cat)?.IC||Ic.Budget} c={categories.find(c=>c.lb===e.cat)?.c||T.bark} bg={(categories.find(c=>c.lb===e.cat)?.c||T.bark)+"18"} s={16} ts={34} r={10}/>
          <div style={{flex:1}}><div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{e.cat}</div>{e.note&&<div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:2}}>{e.note}</div>}</div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.esp}}>${e.amount}</div><div style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{e.date}</div></div>
        </div>
      ))}
    </div>
  );
}

// ─── Coach Tab ────────────────────────────────────────────────────
function CoachTab({ categories, expenses, savingsGoal, totalBudget, totalSpent, appContext }) {
  const [hist, setHist] = useState(() => {
    try { const s = localStorage.getItem("hn_budget_chat"); if(s){const p=JSON.parse(s);if(p.length>0)return p;} } catch(e){}
    return [{role:"assistant",content:"Hey! 💛 I've looked at your numbers and you're doing better than you think. Ask me anything — what are you wondering about?"}];
  });
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!inp.trim()||loading) return;
    const msg = inp.trim(); setInp(""); setLoading(true);
    const h = hist.map(m=>({role:m.role,content:m.content}));
    const overBudget = categories.filter(c=>c.spent>c.budget*0.9).map(c=>`${c.lb} (${Math.round((c.spent/c.budget)*100)}%)`).join(", ")||"none";
    const recentExp = expenses.slice(0,5).map(e=>`${e.cat} $${e.amount}${e.note?` (${e.note})`:""}`).join(", ");
    const remaining = totalBudget - totalSpent;
    const pctLeft = totalBudget>0?remaining/totalBudget:0;
    const tripContext = appContext?.trips?.nextTrip?`UPCOMING TRIP: ${appContext.trips.nextTrip.dest||appContext.trips.nextTrip.destination} in ${appContext.trips.daysUntilNext} days.`:"";
    const wellnessContext = appContext?.wellness?.isStruggling?"She is struggling — be extra gentle.":appContext?.wellness?.sleepDebt?"She is tired — suggest convenience.":"";
    const guiltFree = remaining>0?(pctLeft>0.2?`She has $${remaining.toLocaleString()} remaining — guilt-free money.`:pctLeft>0.1?`She has $${remaining.toLocaleString()} left — protect it.`:`Only $${remaining.toLocaleString()} left — essentials only.`):`Over budget by $${Math.abs(remaining).toLocaleString()}. Help her triage.`;
    const ctx = `Budget: $${totalBudget} total, $${totalSpent} spent. Categories: ${categories.map(c=>`${c.lb}: $${c.spent}/$${c.budget}`).join(", ")}. Near limit: ${overBudget}. Recent: ${recentExp}. ${tripContext} ${wellnessContext}`;
    try {
      const raw = await claude(`You are Nora, warm financial companion. ${ctx} ${guiltFree} Never judgmental. 3-4 sentences max. Reference her real numbers.`, msg, h, "budget_coach");
      const text = typeof raw === "string" ? raw : "Something went quiet — try again. 💛";
      const updated = [...hist, {role:"user",content:msg}, {role:"assistant",content:text}];
      setHist(updated);
      try{localStorage.setItem("hn_budget_chat",JSON.stringify(updated.slice(-20)));}catch(e){}
    } catch(e) { setHist(p=>[...p,{role:"user",content:msg},{role:"assistant",content:"Something went quiet — try again. 💛"}]); }
    setLoading(false);
  };

  return (
    <div style={{animation:"slideRight .3s ease both"}}>
      <div style={{background:AIGRAD,borderRadius:18,padding:"16px",marginBottom:14}}>
        <AIBadge t="Financial Companion"/>
        <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.6)",margin:"8px 0 0",lineHeight:1.6}}>I am on your side. Ask me anything — I will celebrate your wins and help you make the most of what you have.</p>
      </div>
      {hist.length<=1&&["How much can I spend guilt-free?","What are my biggest wins this month?","Help me save for my trip","What should I treat myself to?"].map((q,i)=>(
        <div key={i} onClick={()=>setInp(q)} style={{background:"#fff",border:`1px solid ${T.linen}`,borderRadius:11,padding:"9px 14px",cursor:"pointer",marginBottom:8,fontFamily:FB,fontSize:12,color:T.bark}}>💛 {q}</div>
      ))}
      <div style={{maxHeight:280,overflowY:"auto",marginBottom:10}}>
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
    </div>
  );
}

// ─── Main BudgetScreen ────────────────────────────────────────────
export function BudgetScreen({ uid, appContext }) {
  const [activeTab, setActiveTab] = useState("overview");
  const budget = useBudget(uid);
  const { budgetLoading, categories, setCategories, expenses, setExpenses,
          savingsGoal, setSavingsGoal, monthHistory, totalBudget, totalSpent,
          ensureCategory, saveMonthSnapshot } = budget;

  if (budgetLoading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:16}}>
      <div style={{width:36,height:36,border:`3px solid ${T.linen}`,borderTop:`3px solid ${T.gold}`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <p style={{fontFamily:FB,fontSize:13,color:T.taupe}}>Loading your budget…</p>
    </div>
  );

  return (
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

      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14}}>
        {["overview","expenses","coach"].map(t=><Pill key={t} ch={t.charAt(0).toUpperCase()+t.slice(1)} active={activeTab===t} on={()=>setActiveTab(t)} color={T.gold}/>)}
      </div>

      {activeTab==="overview" && <OverviewTab categories={categories} setCategories={setCategories} totalSpent={totalSpent} totalBudget={totalBudget} saveMonthSnapshot={saveMonthSnapshot} expenses={expenses} setExpenses={setExpenses}/>}
      {activeTab==="expenses" && <ExpensesTab categories={categories} expenses={expenses} setExpenses={setExpenses} setCategories={setCategories} ensureCategory={ensureCategory} appContext={appContext}/>}
      {activeTab==="coach"    && <CoachTab categories={categories} expenses={expenses} savingsGoal={savingsGoal} totalBudget={totalBudget} totalSpent={totalSpent} appContext={appContext}/>}
    </div>
  );
}
