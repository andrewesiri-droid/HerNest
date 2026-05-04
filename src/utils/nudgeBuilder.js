
// HerNest Psychic Nudge Builder
// Selects ONE nudge per session, builds card data
// Does real work — not just opens a screen

import { buildEmotionalContext } from "./emotionalContext.js";

const DEFER_KEY = "hn_nudge_defer";
const NUDGE_SHOWN_KEY = "hn_nudge_shown";

export function selectPsychicNudge(appContext) {
  if(!appContext) return null;

  // Build emotional layer
  const emotional = buildEmotionalContext(appContext);
  if(!emotional) return null;

  // Check if we already showed a nudge this session
  const sessionShown = sessionStorage.getItem(NUDGE_SHOWN_KEY);
  if(sessionShown) return null;

  const candidates = [];

  // P10: Avoidance relief (highest — she needs this most)
  if(emotional.avoidance.length>0){
    const top = emotional.avoidance[0];
    if(!isDeferredRecently(top.action,2)){
      candidates.push({priority:10,type:"relief",emotional,avoidance:top,state:emotional.state});
    }
  }

  // P9: Critical emotional load — reassurance
  if(emotional.load.level==="critical"&&emotional.reassurance&&!isDeferredRecently("reassurance",1)){
    candidates.push({priority:9,type:"reassurance",emotional,state:emotional.state});
  }

  // P8: Heavy load + proactive relief
  if((emotional.load.level==="heavy"||emotional.load.level==="critical")&&emotional.relief&&!isDeferredRecently(emotional.relief.action,3)){
    candidates.push({priority:8,type:"proactive",emotional,relief:emotional.relief,state:emotional.state});
  }

  // P5: Moderate — gentle nudge
  if(emotional.load.level==="moderate"&&!isDeferredRecently("gentle",1)){
    candidates.push({priority:5,type:"gentle",emotional,state:emotional.state});
  }

  // P1: Calm / celebration
  candidates.push({priority:1,type:"calm",emotional,state:emotional.state});

  const selected = candidates.sort((a,b)=>b.priority-a.priority)[0];
  return buildNudgeCard(selected, appContext);
}

function buildNudgeCard(candidate, ctx) {
  if(!candidate) return null;
  const {type, emotional, avoidance, relief, state} = candidate;
  const name = ctx.profile?.name||"lovely";

  // RELIEF nudges — do real work
  if(type==="relief"&&avoidance){
    if(avoidance.action==="draft_school_email"||avoidance.action==="draft_parent_questions"){
      const event = avoidance.event;
      const childName = event?.child||ctx.profile?.kids?.[0]?.name||"your child";
      const daysText = event?.daysUntil===0?"today":event?.daysUntil===1?"tomorrow":`in ${event?.daysUntil} days`;
      return {
        id:"school_prep",
        type:"relief",
        icon:"🤲",
        color:"#9b59b6",
        title:"Nora noticed",
        text:`${childName}'s ${event?.title||"school meeting"} is ${daysText}. You have been carrying the preparation — Nora drafted the questions.`,
        primaryAction:{label:"View questions →", action:"show_school_questions", data:{event,childName}},
        secondaryAction:{label:"I'll handle it", action:"defer", deferKey:"draft_school_email", deferDays:2},
        showDraft:true,
        draftContent: generateParentMeetingQuestions(childName, event, ctx),
      };
    }

    if(avoidance.action==="show_savings_plan"){
      const gap = avoidance.gap||0;
      const days = avoidance.daysLeft||30;
      const weeks = Math.ceil(days/7);
      const weeklyNeeded = weeks>0?Math.ceil(gap/weeks):gap;
      const dest = avoidance.trip?.dest||"your trip";
      return {
        id:"trip_savings",
        type:"relief",
        icon:"✨",
        color:"#C49A3C",
        title:"Nora did the math",
        text:`${dest} in ${days} days. Gap: $${gap.toFixed(0)}. At $${weeklyNeeded}/week for ${weeks} weeks you get there.`,
        primaryAction:{label:"Make this real →", action:"show_savings_detail", data:{gap,weeks,weeklyNeeded,dest}},
        secondaryAction:{label:"Let me think about it", action:"defer", deferKey:"show_savings_plan", deferDays:3},
        savingsPlan:{gap,weeks,weeklyNeeded,dest,days},
      };
    }

    if(avoidance.action==="open_checkin"){
      return {
        id:"wellness_checkin",
        type:"relief",
        icon:"💜",
        color:"#9b59b6",
        title:"One tap",
        text:`You have not checked in for a while. One tap to tell Nora how you are actually doing. No typing. No judgment.`,
        primaryAction:{label:"Check in now →", action:"open_tab", tab:"wellness"},
        secondaryAction:{label:"Not yet", action:"defer", deferKey:"open_checkin", deferDays:1},
      };
    }
  }

  // REASSURANCE nudges
  if(type==="reassurance"&&emotional.reassurance){
    return {
      id:"reassurance",
      type:"reassurance",
      icon:"💜",
      color:"#9b59b6",
      title:"Nora wants you to know",
      text:emotional.reassurance.text,
      subtext:emotional.load.weights.slice(0,2).map(w=>w.text).join(" · "),
      primaryAction:{label:"What can I do right now?", action:"open_tab", tab:"nora"},
      secondaryAction:{label:"I needed that", action:"dismiss"},
    };
  }

  // PROACTIVE nudges — already did the work
  if(type==="proactive"&&relief){
    if(relief.action==="block_me_time"){
      return {
        id:"me_time",
        type:"proactive",
        icon:"🌿",
        color:"#4a7a5a",
        title:"Nora insists",
        text:`You have had no me-time in days and ${ctx.tasks?.todayCount||0} tasks running. One thing: 20 minutes tomorrow. Nothing allowed in.`,
        primaryAction:{label:"Block it →", action:"block_me_time"},
        secondaryAction:{label:"Not now", action:"defer", deferKey:"block_me_time", deferDays:1},
      };
    }
    if(relief.action==="simplify_week"){
      return {
        id:"simplify",
        type:"proactive",
        icon:"🌿",
        color:"#4a7a5a",
        title:"This week is a lot",
        text:`Low mood, ${ctx.tasks?.todayCount||0} tasks, not enough sleep. Nora can help simplify. One conversation.`,
        primaryAction:{label:"Help me simplify →", action:"open_tab", tab:"nora"},
        secondaryAction:{label:"I'm okay", action:"dismiss"},
      };
    }
  }

  // GENTLE nudge
  if(type==="gentle"){
    return {
      id:"gentle",
      type:"gentle",
      icon:"⚡",
      color:"#f39c12",
      title:"One small thing",
      text: ctx.school?.urgentEvents?.length>0
        ? `${ctx.school.urgentEvents[0].title} needs action. Nora can help you start.`
        : ctx.tasks?.urgentCount>0
        ? `${ctx.tasks.urgentCount} urgent task${ctx.tasks.urgentCount>1?"s":""} today. Pick one.`
        : "Something is on your mind. Nora is here.",
      primaryAction:{label:"Let's do it →", action:"open_tab", tab:"plan"},
      secondaryAction:{label:"Later", action:"defer", deferKey:"gentle", deferDays:1},
    };
  }

  // CALM / THRIVING
  if(state==="thriving"){
    return {
      id:"thriving",
      type:"celebration",
      icon:"✨",
      color:"#C49A3C",
      title:`You are on a roll, ${name}`,
      text:`Good mood, ${emotional.load.level==="light"?"light load":"things handled"}. This is what a good week looks like.`,
      primaryAction:null,
      secondaryAction:{label:"Keep going", action:"dismiss"},
    };
  }

  return {
    id:"calm",
    type:"calm",
    icon:"✅",
    color:"#95a5a6",
    title:"All caught up",
    text:`Nothing urgent. Nora is watching. She will flag anything important.`,
    primaryAction:null,
    secondaryAction:{label:"Good", action:"dismiss"},
  };
}

function generateParentMeetingQuestions(childName, event, ctx) {
  const child = ctx.profile?.kids?.find(k=>k.name===childName)||ctx.profile?.kids?.[0];
  const age = child?.age||"school age";
  return [
    `What specific areas is ${childName} finding most challenging right now?`,
    `What support is available — tutoring, extra resources, or things we can do at home?`,
    `How can we stay in touch on progress — what works best for you?`,
  ];
}

function isDeferredRecently(key, days) {
  try{
    const defers = JSON.parse(localStorage.getItem(DEFER_KEY)||"{}");
    const deferredAt = defers[key];
    if(!deferredAt) return false;
    const daysSince = (Date.now()-new Date(deferredAt).getTime())/(1000*60*60*24);
    return daysSince < days;
  }catch(e){ return false; }
}

export function deferNudge(key, days) {
  try{
    const defers = JSON.parse(localStorage.getItem(DEFER_KEY)||"{}");
    defers[key] = new Date().toISOString();
    localStorage.setItem(DEFER_KEY, JSON.stringify(defers));
  }catch(e){}
}

export function markNudgeShown() {
  sessionStorage.setItem(NUDGE_SHOWN_KEY, "1");
}
