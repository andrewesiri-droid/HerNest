import { useState, useEffect } from "react";

async function fetchGCalEvents() {
  const token = sessionStorage.getItem("hn_gtoken");
  if (!token) return null;
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin="
    + now.toISOString() + "&timeMax=" + end.toISOString()
    + "&singleEvents=true&orderBy=startTime&maxResults=20";
  try {
    const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.items || []).map(e => ({
      id: e.id,
      title: e.summary || "Untitled",
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location || "",
      allDay: !e.start?.dateTime,
    }));
  } catch (e) { return null; }
}

export function useCalendar() {
  const [calEvents, setCalEvents]       = useState([]);
  const [calConnected, setCalConnected] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("hn_cal_connected") === "1") {
      fetchGCalEvents().then(events => {
        if (events) { setCalEvents(events); setCalConnected(true); }
      });
    }
  }, []);

  const connectCalendar = async () => {
    const events = await fetchGCalEvents();
    if (events) {
      setCalEvents(events);
      setCalConnected(true);
      sessionStorage.setItem("hn_cal_connected", "1");
    } else {
      alert("Could not connect. Please sign out and sign back in to grant calendar access.");
    }
  };

  return { calEvents, calConnected, connectCalendar };
}
