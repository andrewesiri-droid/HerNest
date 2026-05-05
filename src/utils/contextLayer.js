// HerNest Context Layer v1.0
// Builds unified context from all data sources
// Called once in App.jsx, passed to all screens

import { loadData } from "./firebase";

export async function buildContextLayer(uid, profile, calEvents = []) {
  if (!uid || !profile) return null;

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const hour = now.getHours();
  const day = now.getDay();

  const [wellness, budget, school, trips, tasks, noraMemory] = await Promise.all([
    loadData(uid, "wellness").catch(() => null),
    loadData(uid, "budget").catch(() => null),
    loadData(uid, "school").catch(() => null),
    loadData(uid, "trips").catch(() => null),
    loadData(uid, "tasks").catch(() => null),
    loadData(uid, "nora_memory").catch(() => null),
  ]);

  function daysUntil(dateStr) {
    try { return Math.ceil((new Date(dateStr) - now) / 864e5); } catch { return 999; }
  }

  function monthSpend(expenses = []) {
    return expenses.filter(e => {
      try { const d = new Date(e.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); } catch { return false; }
    }).reduce((s, e) => s + (e.amount || 0), 0);
  }

  function getUpcomingBirthdays(withinDays = 14) {
    const people = [...(profile.kids||[]),...(profile.parents||[]),...(profile.inlaws||[]),...(profile.friends||[])];
    return people.filter(p => {
      if (!p?.bday) return false;
      const parts = p.bday.split("/"); if (parts.length !== 2) return false;
      const d = new Date(now.getFullYear(), parseInt(parts[0])-1, parseInt(parts[1]));
      if (d < now) d.setFullYear(now.getFullYear() + 1);
      return Math.round((d - now) / 864e5) <= withinDays;
    }).map(p => {
      const parts = p.bday.split("/");
      const d = new Date(now.getFullYear(), parseInt(parts[0])-1, parseInt(parts[1]));
      if (d < now) d.setFullYear(now.getFullYear() + 1);
      return { ...p, daysUntil: Math.round((d - now) / 864e5) };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }

  const schoolEvents = school?.events || [];
  const urgentSchool = schoolEvents.filter(e => { const d=daysUntil(e.date); return d>=0&&d<=3&&e.requiresAction; });
  const nextSchool = schoolEvents.filter(e=>daysUntil(e.date)>=0).sort((a,b)=>daysUntil(a.date)-daysUntil(b.date))[0]||null;

  const allTrips = trips?.trips || [];
  const upcomingTrips = allTrips.filter(t => t.departDate && daysUntil(t.departDate) >= 0);
  const nextTrip = upcomingTrips.sort((a,b)=>daysUntil(a.departDate)-daysUntil(b.departDate))[0]||null;

  const expenses = budget?.expenses || [];
  const spent = monthSpend(expenses);
  const monthBudget = profile.monthlyBudget || 2000;
  const topCatMap = {};
  expenses.forEach(e => { topCatMap[e.category]=(topCatMap[e.category]||0)+(e.amount||0); });
  const topCategory = Object.entries(topCatMap).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;

  const allTasks = tasks?.tasks || [];
  const todayTasks = allTasks.filter(t => (t.dueDay||0)===0&&!t.done&&!t.dismissed);
  const urgentTasks = allTasks.filter(t => (t.dueDay||0)<=2&&!t.done&&!t.dismissed&&t.priority==="high");

  const weeklyMood = wellness?.weeklyMood || null;
  const sleepArr = wellness?.sleepArr || [];
  const lastSleep = sleepArr.filter(s=>s.date<=today).sort((a,b)=>b.date.localeCompare(a.date))[0]||null;
  const waterToday = (() => { try { return parseInt(localStorage.getItem("hn_water")||"3"); } catch { return 3; } })();
  const habits = wellness?.habits || {};
  const habitsDone = Object.values(habits).filter(h=>h.done).length;

  const todayISO = today;
  const calToday = calEvents.filter(e => e.start?.startsWith(todayISO));
  const hasWorkEvent = calToday.some(e => /meeting|call|deadline|presentation|client/i.test(e.title||""));
  const hasMeTime = calToday.some(e => /gym|yoga|walk|me time|self care/i.test(e.title||""));

  const facts = noraMemory?.facts || [];
  const dietaryFacts = facts.filter(f=>f.type==="dietary").map(f=>f.fact);

  const upcomingBirthdays = getUpcomingBirthdays(7);
  const todayBirthday = getUpcomingBirthdays(0).find(p=>p.daysUntil===0)||null;

  return {
    now, today, hour, day,
    time: {
      phase: hour<5?"night":hour<10?"morning":hour<14?"afternoon":hour<18?"evening":"night",
      isWeekend: day===0||day===6,
      isMorning: hour < 12,
    },
    profile,
    wellness: {
      mood: weeklyMood?.value||3,
      moodLabel: weeklyMood?.label||"Mixed",
      sleepLastNight: lastSleep?.hours||0,
      sleepDebt: (lastSleep?.hours||7)<6,
      waterToday,
      habitsDone,
      totalHabits: Object.keys(habits).length||5,
      isStruggling: (weeklyMood?.value||3)<=2,
      isThriving: (weeklyMood?.value||3)>=4,
      needsCheckIn: !weeklyMood,
      dietaryRestrictions: dietaryFacts,
    },
    budget: {
      spent, monthBudget,
      remaining: monthBudget-spent,
      percentUsed: spent/monthBudget,
      isNearLimit: spent/monthBudget>0.85,
      isOver: spent>monthBudget,
      savingsGoal: budget?.savingsGoal||null,
      topCategory,
    },
    school: {
      events: schoolEvents,
      urgentEvents: urgentSchool,
      nextEvent: nextSchool,
      eventsThisWeek: schoolEvents.filter(e=>{ const d=daysUntil(e.date); return d>=0&&d<=7; }),
      hasParentMeeting: schoolEvents.some(e=>e.type==="parent_meeting"&&daysUntil(e.date)>=0&&daysUntil(e.date)<=14),
      hasExam: schoolEvents.some(e=>e.type==="exam"&&daysUntil(e.date)>=0),
    },
    trips: {
      all: allTrips, upcoming: upcomingTrips, nextTrip,
      daysUntilNext: nextTrip?daysUntil(nextTrip.departDate):null,
      needsPrep: nextTrip?daysUntil(nextTrip.departDate)<=7:false,
      estimatedCost: nextTrip?Math.round((nextTrip.budget||3000)*0.7):0,
    },
    tasks: {
      all: allTasks, today: todayTasks, urgent: urgentTasks,
      todayCount: todayTasks.length, urgentCount: urgentTasks.length,
      hasWorkTasks: allTasks.some(t=>t.tag==="Work"&&!t.done),
      hasFamilyTasks: allTasks.some(t=>t.tag==="Family"&&!t.done),
    },
    calendar: {
      events: calEvents, eventsToday: calToday,
      hasWorkEvent, hasMeTime,
      workEventCount: calToday.filter(e=>/meeting|call|deadline/i.test(e.title||"")).length,
    },
    birthdays: {
      upcoming: upcomingBirthdays, todayBirthday,
      hasTodayBirthday: !!todayBirthday,
      hasSoonBirthday: upcomingBirthdays.length>0,
    },
    memory: { facts, factCount: facts.length, dietaryFacts },
    soloParent: !!(profile?.soloParent || profile?.role === "Single Mum"),
    briefing: { viewedToday: localStorage.getItem("hn_brief_date")===today },
  };
}
