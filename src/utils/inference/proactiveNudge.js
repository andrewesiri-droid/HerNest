
// Generates ONE smart nudge for home screen
// Priority-ranked, personalised, actionable

import { buildContext } from "./contextEngine.js";

export async function generateProactiveNudge(uid, profile, calEvents=[]) {
  try {
    const ctx = await buildContext(uid, profile, calEvents);
    return pickBestNudge(ctx);
  } catch(e) {
    return null;
  }
}

function pickBestNudge(ctx) {
  const name = ctx.profile?.name || "lovely";
  const { time, mood, sleep, school, birthdays, budget, trips, briefing, wellness, tasks, calendar } = ctx;

  // P1: Crisis/urgent
  if (mood.isLow && sleep.isLow) return {
    icon:"💜", color:"#9b59b6", priority:10,
    text:`${name}, you're running on empty. Low mood and short sleep is hard. One thing today: 30 minutes earlier to bed tonight.`,
    action:"Open Thrive", tab:"wellness"
  };

  // P2: Birthday TODAY
  const todayBday = birthdays.upcoming.find(p=>{
    const parts=p.bday.split("/");const d=new Date(new Date().getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
    return Math.round((d-new Date())/864e5)===0;
  });
  if (todayBday) return {
    icon:"🎂", color:"#e91e63", priority:9,
    text:`Today is ${todayBday.name}'s birthday! Don't forget to reach out 💛`,
    action:"Find a gift", tab:"profile"
  };

  // P3: School urgent (next 3 days)
  if (school.urgentCount > 0 && school.nextEvent) return {
    icon:"📚", color:"#e67e22", priority:8,
    text:`${school.nextEvent.title} needs action${school.nextEvent.daysUntil===0?" — today":school.nextEvent.daysUntil===1?" — tomorrow":` in ${school.nextEvent.daysUntil} days`}. ${school.nextEvent.prep||""}`,
    action:"Handle it", tab:"plan"
  };

  // P4: Trip in 7 days
  if (trips.nextTrip && trips.daysUntil <= 7) return {
    icon:"✈️", color:"#3498db", priority:7,
    text:`${trips.nextTrip.dest} is in ${trips.daysUntil} day${trips.daysUntil===1?"":"s"}. Packing list ready?`,
    action:"View trip", tab:"trips"
  };

  // P5: Morning briefing not viewed
  if (time.phase==="morning" && !briefing.viewedToday) return {
    icon:"🌅", color:"#4a7a5a", priority:6,
    text:`Good morning, ${name}. Your briefing for today is ready — ${calendar.todayEvents.length} calendar events, ${tasks.pending} tasks.`,
    action:"Open briefing", tab:"nora"
  };

  // P6: Budget near limit
  if (budget.isNearLimit) return {
    icon:"💰", color:"#c0392b", priority:5,
    text:`Budget at ${Math.round(budget.percentUsed*100)}% this month. £${Math.max(0,budget.monthBudget-budget.spent).toFixed(0)} remaining.`,
    action:"Review budget", tab:"budget"
  };

  // P7: Urgent tasks
  if (tasks.urgent > 0) return {
    icon:"⚡", color:"#f39c12", priority:4,
    text:`${tasks.urgent} high-priority task${tasks.urgent>1?"s":""} need${tasks.urgent===1?"s":""} attention today.`,
    action:"View tasks", tab:"plan"
  };

  // P8: Low mood only
  if (mood.isLow) return {
    icon:"🌿", color:"#27ae60", priority:3,
    text:`This week has been tough. One small thing: a 10-minute walk. No agenda. Just air.`,
    action:"Track wellness", tab:"wellness"
  };

  // P9: Weekly check-in pending (Sunday)
  if (new Date().getDay()===0 && wellness.needsCheckIn) return {
    icon:"📊", color:"#8e44ad", priority:2,
    text:`Sunday check-in time. One tap to tell Nora how your week went.`,
    action:"Check in", tab:"wellness"
  };

  // P10: Upcoming birthday (2-3 days)
  if (birthdays.upcoming.length > 0) {
    const soonBday = birthdays.upcoming[0];
    const parts = soonBday.bday.split("/");
    const d = new Date(new Date().getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
    const days = Math.round((d-new Date())/864e5);
    return {
      icon:"🎁", color:"#e91e63", priority:1,
      text:`${soonBday.name}'s birthday is in ${days} day${days===1?"":"s"}. Get a gift sorted!`,
      action:"Find a gift", tab:"profile"
    };
  }

  // Default: all good
  return {
    icon:"✅", color:"#95a5a6", priority:0,
    text:`All caught up, ${name}. Nora will flag anything important.`,
    action:null, tab:null
  };
}
