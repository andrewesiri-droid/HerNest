
// Suggests relevant Circle rooms based on user context

export function suggestCommunity(profile, wellness, schoolEvents=[]) {
  const suggestions = [];
  const day = new Date().getDay();
  const weeklyMood = wellness?.weeklyMood?.value||3;
  const sleepHours = wellness?.sleepArr?.[6]?.hours||7;

  if(weeklyMood<=2) suggestions.push({
    room:"Wellness 🌿", roomId:"wellness", priority:"high",
    text:"This week was heavy. You're not alone — mums are talking about it.",
    reason:"low_mood"
  });

  if(sleepHours<6) suggestions.push({
    room:"Wellness 🌿", roomId:"wellness", priority:"medium",
    text:"Running on low sleep? 8 mums shared what actually helped.",
    reason:"sleep"
  });

  const hasParentMeeting=schoolEvents.some(e=>e.type==="parent_meeting"&&(new Date(e.date)-new Date())/864e5<=7);
  if(hasParentMeeting) suggestions.push({
    room:"Parenting 👶", roomId:"parenting", priority:"high",
    text:"Parent-teacher conference coming up. Get tips from mums who've been there.",
    reason:"school"
  });

  if(profile?.role==="Working Mum"&&day===1) suggestions.push({
    room:"Career 💼", roomId:"career", priority:"medium",
    text:"Monday motivation: how do you balance work and kids this week?",
    reason:"monday"
  });

  return suggestions.slice(0,2);
}
