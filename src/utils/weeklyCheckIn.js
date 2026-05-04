// Weekly check-in logic
export const MOOD_LEVELS=[
  {value:1,emoji:"😔",label:"Really tough",color:"#c0392b"},
  {value:2,emoji:"😟",label:"Challenging",color:"#e67e22"},
  {value:3,emoji:"😐",label:"Mixed",color:"#B8860B"},
  {value:4,emoji:"🙂",label:"Good",color:"#27ae60"},
  {value:5,emoji:"😊",label:"Great!",color:"#2ecc71"},
];

export function getWeekStart(){
  const d=new Date();const day=d.getDay();
  const diff=d.getDate()-day+(day===0?-6:1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

export function hasCheckedInThisWeek(){
  try{const s=JSON.parse(localStorage.getItem("hn_weekly_checkin")||"{}");return s.weekStart===getWeekStart();}catch(e){return false;}
}

export function getWeeklyMood(){
  try{return JSON.parse(localStorage.getItem("hn_weekly_checkin")||"null");}catch(e){return null;}
}

export async function submitWeeklyCheckIn(moodValue,uid,saveData){
  const data={weekStart:getWeekStart(),date:new Date().toISOString().split("T")[0],value:moodValue,label:MOOD_LEVELS.find(m=>m.value===moodValue)?.label};
  try{localStorage.setItem("hn_weekly_checkin",JSON.stringify(data));}catch(e){}
  if(uid)await saveData(uid,"wellness",{weeklyMood:data}).catch(()=>{});
  return data;
}
