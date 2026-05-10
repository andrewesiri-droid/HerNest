
// Lightweight context engine — reads from localStorage + Firebase
// No external dependencies, no useAuth

export async function buildContext(uid, profile, calEvents=[]) {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const phase = hour<5?"night":hour<10?"morning":hour<14?"afternoon":hour<18?"evening":"night";

  // Read from localStorage (fast, no network)
  const safe = (key, fallback) => {
    try{ const s=localStorage.getItem(key); return s?JSON.parse(s):fallback; }catch(e){ return fallback; }
  };

  const moods = safe("hn_moods",[3,3,3,3,3,3,3]);
  const avgMood = moods.length ? moods.reduce((a,b)=>a+b,0)/moods.length : 3;
  const sleepArr = safe("hn_sleep_arr",[]);
  const todaySleep = sleepArr.find(s=>s.date===new Date().toISOString().split("T")[0]);
  const water = safe("hn_water",4);
  const tasks = safe("hn_tasks",[]);
  const schoolEvents = safe("hn_school_events",[]);
  const weeklyMood = safe("hn_weekly_checkin",null);
  const moodLogDate = localStorage.getItem("hn_mood_log_date");
  const briefDate = localStorage.getItem("hn_brief_date");
  const todayStr = new Date().toDateString();
  const todayISO = new Date().toISOString().split("T")[0];

  const pendingTasks = tasks.filter(t=>!t.done&&(t.dueDay||0)<=1);
  const urgentTasks = pendingTasks.filter(t=>t.priority==="high");
  const urgentSchool = schoolEvents.filter(e=>{
    try{ const diff=(new Date(e.date)-new Date())/864e5; return diff>=0&&diff<=3&&e.requiresAction; }catch(e){ return false; }
  });

  // Birthday alerts
  const allPeople=[...(profile?.kids||[]),...(profile?.parents||[]),...(profile?.inlaws||[]),...(profile?.friends||[])];
  const upcomingBdays = allPeople.filter(p=>{
    if(!p?.bday)return false;
    const parts=p.bday.split("/");if(parts.length!==2)return false;
    const now=new Date();
    const d=new Date(now.getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
    if(d<now)d.setFullYear(now.getFullYear()+1);
    return Math.round((d-now)/864e5)<=3;
  });

  // Budget
  const expenses = safe("hn_expenses",[]);
  const monthBudget = profile?.monthlyBudget||2000;
  const spent = expenses.filter(e=>{
    try{const d=new Date(e.date);const n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}catch{return false;}
  }).reduce((s,e)=>s+(e.amount||0),0);

  // Trips
  const trips = safe("hn_trips",[]);
  const upcomingTrip = trips.find(t=>{
    if(!t.departDate)return false;
    const diff=(new Date(t.departDate)-new Date())/864e5;
    return diff>=0&&diff<=7;
  });

  return {
    time: { hour, day, phase, isWeekend: day===0||day===6 },
    mood: { avg: avgMood, isLow: avgMood<2.5, isHigh: avgMood>4, checkedInToday: moodLogDate===todayStr },
    sleep: { hours: todaySleep?.hours||0, hasData: !!todaySleep, isLow: todaySleep?.hours<6 },
    water: { glasses: water, isLow: water<4 },
    tasks: { pending: pendingTasks.length, urgent: urgentTasks.length, hasFamilyTask: pendingTasks.some(t=>t.tag==="Family") },
    school: { urgentCount: urgentSchool.length, nextEvent: urgentSchool[0]||null },
    birthdays: { upcoming: upcomingBdays, hasToday: upcomingBdays.some(p=>{const parts=p.bday.split("/");const d=new Date(new Date().getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));return Math.round((d-new Date())/864e5)===0;}) },
    budget: { spent, monthBudget, percentUsed: spent/monthBudget, isNearLimit: spent>monthBudget*0.85 },
    trips: { nextTrip: upcomingTrip, daysUntil: upcomingTrip?Math.round((new Date(upcomingTrip.departDate)-new Date())/864e5):null },
    briefing: { viewedToday: briefDate===todayISO },
    wellness: { needsCheckIn: !weeklyMood||weeklyMood.weekStart!==getWeekStart() },
    calendar: { eventCount: calEvents.length, todayEvents: calEvents.filter(e=>e.start?.startsWith(todayISO)) },
    profile,
  };
}

function getWeekStart(){
  const d=new Date();const day=d.getDay();
  const diff=d.getDate()-day+(day===0?-6:1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}
