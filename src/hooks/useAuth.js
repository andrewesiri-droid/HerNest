import { useState, useEffect } from "react";
import { onAuthStateChanged, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../utils/firebase";
import { loadData } from "../utils/firebase";
import { identifyUser } from "../utils/analytics";

export function useAuth(onProfileLoaded, onNewUser) {
  const [user, setUser]           = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).then(result => {
      if (result?.user) {
        const cred = GoogleAuthProvider.credentialFromResult(result);
        if (cred?.accessToken) {
          sessionStorage.setItem("hn_gtoken", cred.accessToken);
        }
      }
    }).catch(() => {});

    const timeout = setTimeout(() => setAuthChecked(true), 5000);
    const unsub = onAuthStateChanged(auth, async (u) => {
      clearTimeout(timeout);
      setUser(u || null);
      if (u) {
        try { localStorage.setItem("hn_uid", JSON.stringify(u.uid)); } catch (e) {}
        identifyUser(u.uid, { email: u.email, name: u.displayName });
        try {
          const saved = await loadData(u.uid, "profile");
          if (saved?.name) {
            onProfileLoaded(saved);
          } else {
            if (u.displayName) onNewUser(u.displayName.split(" ")[0]);
          }
        } catch (e) {
          onNewUser(null);
        }
      }
      setAuthChecked(true);
    });
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  return { user, authChecked };
}
