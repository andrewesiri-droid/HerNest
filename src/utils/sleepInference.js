// Sleep inference from phone activity
// No HealthKit needed — works in any PWA

let lastActivity = Date.now();
let firstMorningActivity = null;
let sleepLoggedToday = false;

function trackActivity() {
  lastActivity = Date.now();
  const hour = new Date().getHours();
  if(hour>=5&&hour<=10&&!firstMorningActivity&&!sleepLoggedToday){
    firstMorningActivity = Date.now();
    const sleep = estimateSleep();
    if(sleep) saveInferredSleep(sleep);
  }
}

if(typeof document!=="undefined"){
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) trackActivity(); });
  ["click","scroll","touchstart","keydown"].forEach(e=>document.addEventListener(e,()=>{lastActivity=Date.now();},{passive:true}));
  // Persist every 2 minutes
  setInterval(()=>{
    const today=new Date().toISOString().split("T")[0];
    try{localStorage.setItem(`hn_activity_${today}`,JSON.stringify({lastActivity,firstMorningActivity,updatedAt:Date.now()}));}catch(e){}
  },120000);
  // Reset at midnight
  const now=new Date();
  const midnight=new Date(now);midnight.setHours(24,0,0,0);
  setTimeout(resetSleepFlag,midnight.getTime()-now.getTime());
}

function estimateSleep(){
  const now=new Date();
  const today=now.toISOString().split("T")[0];
  const yesterday=new Date(now);yesterday.setDate(yesterday.getDate()-1);
  const yestKey=`hn_activity_${yesterday.toISOString().split("T")[0]}`;
  try{
    const yestData=JSON.parse(localStorage.getItem(yestKey)||"{}");
    if(!yestData.lastActivity)return null;
    const sleepStart=new Date(yestData.lastActivity);
    const sleepHours=(now-sleepStart)/(1000*60*60);
    const startHour=sleepStart.getHours();
    const isReasonableBedtime=startHour>=20||startHour<=2;
    if(sleepHours>=4&&sleepHours<=12&&isReasonableBedtime){
      sleepLoggedToday=true;
      return{date:today,hours:Math.round(sleepHours*10)/10,inferred:true,confidence:sleepHours>=6&&sleepHours<=10?"high":"medium",source:"phone_activity"};
    }
  }catch(e){}
  return null;
}

async function saveInferredSleep(sleepData){
  try{
    const uid=JSON.parse(localStorage.getItem("hn_uid")||"null");
    if(!uid)return;
    const {saveData}=await import("./firebase.js");
    const sleepArr=JSON.parse(localStorage.getItem("hn_sleep_arr")||"[]");
    const filtered=sleepArr.filter(s=>s.date!==sleepData.date);
    const updated=[...filtered,sleepData];
    localStorage.setItem("hn_sleep_arr",JSON.stringify(updated));
    await saveData(uid,"wellness",{sleepArr:updated}).catch(()=>{});
    console.log("[SleepInference] Saved:",sleepData.hours,"hours");
  }catch(e){}
}

export function getTodaySleep(){
  const today=new Date().toISOString().split("T")[0];
  try{
    const arr=JSON.parse(localStorage.getItem("hn_sleep_arr")||"[]");
    return arr.find(s=>s.date===today)||null;
  }catch(e){return null;}
}

export function resetSleepFlag(){
  sleepLoggedToday=false;
  firstMorningActivity=null;
}
