import { useEffect, useState } from "react";
import { requestNotificationPermission, scheduleMorningBriefing } from "../utils/notifications";
import { requestPushPermission, checkProactiveNotifications } from "../utils/proactiveNotifications";

export function useAppSetup(screen, user, profile, appContext) {
  const [showInstall, setShowInstall] = useState(false);

  // PWA install prompt
  useEffect(()=>{
    const handler = () => setShowInstall(true);
    window.addEventListener("hn_show_install", handler);
    return () => window.removeEventListener("hn_show_install", handler);
  }, []);

  // Notification scheduling
  useEffect(()=>{
    if(screen!=="app"||!user) return;
    requestPushPermission().then(granted=>{
      if(granted) scheduleMorningBriefing();
    });
    checkProactiveNotifications(appContext, profile);
  },[screen, user]);

  // Analytics session
  useEffect(()=>{ 
    import("../utils/analytics").then(({initSession})=>initSession());
  },[]);

  return { showInstall, setShowInstall };
}
