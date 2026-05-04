
// HerNest Emotional Context Layer
// Infers what she is carrying, avoiding, and needs
// Conservative by design — better to underestimate than project

export function buildEmotionalContext(ctx) {
  if(!ctx) return null;
  const load = calculateLoad(ctx);
  const state = deriveState(ctx, load);
  const avoidance = detectAvoidance(ctx);
  const reassurance = inferReassurance(ctx, load);
  const relief = identifyRelief(ctx);
  return { load, state, avoidance, reassurance, relief };
}

function calculateLoad(ctx) {
  let total = 0;
  const weights = [];

  // School stress
  if(ctx.school?.hasExam){
    total+=3;
    weights.push({source:"school",text:"Exam coming — performance pressure",intensity:3});
  }
  if(ctx.school?.urgentEvents?.length>0&&ctx.school.urgentEvents[0]?.daysUntil<=2){
    total+=2;
    weights.push({source:"school",text:"Urgent school action — preparation guilt",intensity:2});
  }
  if(ctx.school?.hasParentMeeting){
    total+=1;
    weights.push({source:"school",text:"Parent meeting — anxiety about being judged",intensity:1});
  }

  // Work-life collision
  if(ctx.tasks?.hasWorkTasks&&ctx.tasks?.hasFamilyTasks){
    total+=2;
    weights.push({source:"work-life",text:"Work deadlines + family needs simultaneously",intensity:2});
  }

  // Financial stress
  if(ctx.budget?.isNearLimit){
    total+=2;
    weights.push({source:"money",text:"Budget near limit — financial anxiety",intensity:2});
  }
  if(ctx.budget?.isNearLimit&&ctx.trips?.nextTrip){
    total+=2; // Extra weight for dream vs reality conflict
    weights.push({source:"money",text:"Trip dream vs budget reality — sacrifice stress",intensity:2});
  }

  // Sleep + mood compounding
  if(ctx.wellness?.sleepDebt&&ctx.wellness?.isStruggling){
    total+=4;
    weights.push({source:"health",text:"Exhausted and emotionally drained",intensity:4});
  } else if(ctx.wellness?.sleepDebt){
    total+=2;
    weights.push({source:"health",text:"Sleep debt accumulating",intensity:2});
  } else if(ctx.wellness?.isStruggling){
    total+=2;
    weights.push({source:"mood",text:"Low mood check-in",intensity:2});
  }

  // No me-time
  if(!ctx.calendar?.hasMeTime&&ctx.wellness?.habitsDone<2){
    total+=1;
    weights.push({source:"identity",text:"No personal time — self erasure risk",intensity:1});
  }

  const level = total>10?"critical":total>6?"heavy":total>3?"moderate":"light";
  return {total,weights,level};
}

function deriveState(ctx, load) {
  const mood = ctx.wellness?.mood||3;
  const sleep = ctx.wellness?.sleepLastNight||7;
  const habits = ctx.wellness?.habitsDone||0;
  const moodImproving = false; // Would need historical data

  if(load.level==="critical"||( mood<=2&&sleep<6)) return "overwhelmed";
  if(mood<=2) return "struggling";
  if(sleep<6&&mood<=3) return "tired";
  if(mood>=4&&habits>=3&&sleep>=7) return "thriving";
  if(moodImproving) return "recovering";
  if(load.level==="light"&&mood>=3) return "steady";
  return "steady";
}

function detectAvoidance(ctx) {
  const avoided = [];

  // School urgent but no task created
  const urgentSchool = ctx.school?.urgentEvents||[];
  urgentSchool.filter(e=>e.daysUntil<=3&&!e.taskCreated).forEach(e=>{
    avoided.push({
      what:"school prep",
      event:e,
      why:"fear of bad news or not enough time",
      suggestion:"Nora can draft the questions and email right now",
      action:"draft_school_email"
    });
  });

  // Wellness check-in skipped
  if(ctx.wellness?.needsCheckIn){
    avoided.push({
      what:"wellness check-in",
      why:"avoiding acknowledging how hard it is",
      suggestion:"One tap. No typing. Nora handles the rest.",
      action:"open_checkin"
    });
  }

  // Trip planned but savings gap
  if(ctx.trips?.nextTrip&&ctx.budget?.savingsGoal){
    const goal = ctx.budget.savingsGoal;
    const saved = goal.saved||0;
    const target = goal.target||0;
    const gap = target-saved;
    const daysLeft = ctx.trips.daysUntilNext||30;
    if(gap>0&&daysLeft>0){
      avoided.push({
        what:"trip savings",
        trip:ctx.trips.nextTrip,
        gap,
        daysLeft,
        why:"fear the numbers will say no",
        suggestion:"Nora did the math. It is closer than you think.",
        action:"show_savings_plan"
      });
    }
  }

  return avoided;
}

function inferReassurance(ctx, load) {
  if(ctx.wellness?.isStruggling&&(ctx.tasks?.todayCount||0)<3) return {
    type:"competence",
    text:"You are doing more than you think. Every task done today is real."
  };
  if(ctx.school?.hasParentMeeting) return {
    type:"preparedness",
    text:"You do not need to be the perfect parent. Showing up is 90% of it."
  };
  if(ctx.budget?.isNearLimit&&ctx.trips?.nextTrip) return {
    type:"permission",
    text:"The trip matters. Memories outlast spreadsheets."
  };
  if(!ctx.calendar?.hasMeTime&&(ctx.wellness?.habitsDone||0)===0) return {
    type:"selfworth",
    text:"You cannot pour from an empty cup. 15 minutes is not selfish — it is maintenance."
  };
  return null;
}

function identifyRelief(ctx) {
  // Draft email for parent meeting
  const parentMeeting = (ctx.school?.urgentEvents||[]).find(e=>e.type==="parent_meeting"||/parent/i.test(e.title||""));
  if(parentMeeting&&parentMeeting.daysUntil<=7) return {
    action:"draft_parent_questions",
    event:parentMeeting,
    text:"Draft parent meeting questions",
    impact:"high"
  };

  // Block me-time
  if(!ctx.calendar?.hasMeTime&&(ctx.tasks?.todayCount||0)>3) return {
    action:"block_me_time",
    text:"Block 20 min me-time tomorrow",
    impact:"medium"
  };

  // Trip savings plan
  if(ctx.trips?.nextTrip&&ctx.budget?.savingsGoal) return {
    action:"show_savings_plan",
    trip:ctx.trips.nextTrip,
    goal:ctx.budget.savingsGoal,
    text:"Show me how to make the trip work",
    impact:"medium"
  };

  // Simplify if overwhelmed
  if(ctx.wellness?.isStruggling) return {
    action:"simplify_week",
    text:"Help me simplify this week",
    impact:"medium"
  };

  return null;
}
