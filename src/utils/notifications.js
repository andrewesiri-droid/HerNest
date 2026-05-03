// HerNest Push Notifications

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const sendNotification = (title, body, icon = "/favicon.ico") => {
  if (Notification.permission !== "granted") return;
  const n = new Notification(title, { body, icon, badge: "/favicon.ico" });
  n.onclick = () => { window.focus(); n.close(); };
  return n;
};

export const scheduleMorningBriefing = (profile, schoolEvents = [], calEvents = []) => {
  if (Notification.permission !== "granted") return;

  const now = new Date();
  const briefHour = parseInt(localStorage.getItem("hn_brief_hour") || "7");
  const briefMin = parseInt(localStorage.getItem("hn_brief_min") || "0");

  // Build personalised notification body
  const parts = [];
  const todayStr = now.toISOString().split("T")[0];

  // Birthday alerts
  const allPeople = [...(profile?.kids||[]),...(profile?.parents||[]),...(profile?.inlaws||[]),...(profile?.friends||[])];
  const todayBdays = allPeople.filter(p => {
    if (!p?.bday) return false;
    const parts2 = p.bday.split("/");
    if (parts2.length !== 2) return false;
    const d = new Date(now.getFullYear(), parseInt(parts2[0])-1, parseInt(parts2[1]));
    return Math.round((d - now) / 86400000) <= 1;
  });
  if (todayBdays.length) parts.push(`🎂 ${todayBdays.map(p=>p.name).join(" & ")} birthday${todayBdays.length>1?"s":""} soon`);

  // School events today
  const todaySchool = schoolEvents.filter(e => e.date === todayStr);
  if (todaySchool.length) parts.push(`🎒 ${todaySchool[0].title}${todaySchool.length>1?` +${todaySchool.length-1} more`:""}`);

  // Google calendar today
  const todayCal = calEvents.filter(e => e.start?.startsWith(todayStr));
  if (todayCal.length) parts.push(`📅 ${todayCal[0].title}${todayCal.length>1?` +${todayCal.length-1} more`:""}`);

  const body = parts.length
    ? parts.join(" · ")
    : `Good morning ${profile?.name||"lovely"} — your day is ready ✨`;

  const target = new Date();
  target.setHours(briefHour, briefMin, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target - now;
  return setTimeout(() => {
    sendNotification(
      `Good morning ${profile?.name||"lovely"} ✨`,
      body
    );
    // Reschedule for next day
    setTimeout(() => scheduleMorningBriefing(profile, schoolEvents, calEvents), 1000);
  }, delay);
};

export const sendBirthdayAlert = (name, days) => {
  const msg = days === 0 ? `Today is ${name}'s birthday! 🎉` :
              days === 1 ? `${name}'s birthday is tomorrow 🎂` :
              `${name}'s birthday is in ${days} days 🎂`;
  sendNotification("Birthday reminder 🎂", msg);
};
