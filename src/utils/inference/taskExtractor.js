
// Extracts tasks automatically from school events, birthdays, trips
// Adds to existing task list — never replaces

export function extractAutoTasks(profile, schoolEvents=[], trips=[]) {
  const newTasks = [];
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  // 1. School events needing action
  schoolEvents.filter(e=>e.requiresAction&&!e.taskCreated).forEach(e=>{
    try {
      const diff = Math.round((new Date(e.date)-today)/864e5);
      if(diff>=0&&diff<=14) {
        newTasks.push({
          id:`school_${e.title}_${e.date}`,
          text:`Prep for ${e.title}${e.child&&e.child!=="All"?` (${e.child})`:""}`,
          tag:"Family", priority:diff<=3?"high":"medium",
          dueDay:Math.max(0,diff-1),
          source:"school_auto", autoCreated:true, confirmed:false,
          createdAt:todayISO, eventDate:e.date
        });
      }
    }catch(err){}
  });

  // 2. Birthdays
  const allPeople=[
    ...(profile?.kids||[]).map(p=>({...p,rel:"child"})),
    ...(profile?.parents||[]).map(p=>({...p,rel:"parent"})),
    ...(profile?.inlaws||[]).map(p=>({...p,rel:"in-law"})),
    ...(profile?.friends||[]).map(p=>({...p,rel:"friend"})),
  ];
  allPeople.forEach(p=>{
    if(!p?.bday)return;
    const parts=p.bday.split("/");if(parts.length!==2)return;
    const bd=new Date(today.getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
    if(bd<today)bd.setFullYear(today.getFullYear()+1);
    const days=Math.round((bd-today)/864e5);
    if(days===7) newTasks.push({
      id:`bday_gift_${p.name}`,
      text:`Buy gift for ${p.name}'s birthday`,
      tag:"Family",priority:"medium",dueDay:5,
      source:"birthday_auto",autoCreated:true,confirmed:false,createdAt:todayISO
    });
    if(days===1) newTasks.push({
      id:`bday_msg_${p.name}`,
      text:`Send birthday message to ${p.name} 🎂`,
      tag:"Family",priority:"high",dueDay:1,
      source:"birthday_auto",autoCreated:true,confirmed:false,createdAt:todayISO
    });
  });

  // 3. Upcoming trips
  trips.filter(t=>t.departDate).forEach(t=>{
    const diff=Math.round((new Date(t.departDate)-today)/864e5);
    if(diff===7) newTasks.push({
      id:`trip_pack_${t.id}`,
      text:`Start packing for ${t.dest}`,
      tag:"Travel",priority:"medium",dueDay:5,
      source:"trip_auto",autoCreated:true,confirmed:false,createdAt:todayISO
    });
    if(diff===3) newTasks.push({
      id:`trip_prep_${t.id}`,
      text:`Final prep for ${t.dest} — check documents, pack essentials`,
      tag:"Travel",priority:"high",dueDay:2,
      source:"trip_auto",autoCreated:true,confirmed:false,createdAt:todayISO
    });
  });

  return newTasks;
}
