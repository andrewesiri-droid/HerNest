// Habit inference from calendar + activity
const EXERCISE_KEYWORDS=["gym","yoga","run","running","swim","swimming","class","training","pilates","crossfit","cycle","cycling","workout","exercise","fitness","bootcamp"];
const ME_KEYWORDS=["me time","self care","relax","bath","reading","meditation","massage","spa","walk","podcast"];

export function inferHabits(calEvents=[],steps=0,sleep=null,weeklyMood=null){
  const hour=new Date().getHours();
  const hasExerciseCal=calEvents.some(e=>EXERCISE_KEYWORDS.some(k=>(e.title||"").toLowerCase().includes(k)));
  const hasMeCal=calEvents.some(e=>ME_KEYWORDS.some(k=>(e.title||"").toLowerCase().includes(k)));
  return{
    morning:{done:!!(sleep?.hours>5&&hour<=10),detected:!!sleep?.hours,source:sleep?.source||"unknown",label:"Morning routine",icon:"🌅"},
    sleep:{done:!!(sleep?.hours>=7),detected:!!sleep?.hours,source:sleep?.source||"unknown",label:"Sleep goal",icon:"😴",actualHours:sleep?.hours||0},
    exercise:{done:!!(steps>8000||hasExerciseCal),detected:!!(steps>0||hasExerciseCal),source:steps>8000?"steps":hasExerciseCal?"calendar":"none",label:"Exercise",icon:"💪"},
    meTime:{done:!!(hasMeCal||(weeklyMood?.value>=4)),detected:!!(hasMeCal||weeklyMood),source:hasMeCal?"calendar":weeklyMood?"mood":"none",label:"Me-time",icon:"🧘"},
    reading:{done:false,detected:false,source:"manual",label:"Reading",icon:"📚"},
  };
}
