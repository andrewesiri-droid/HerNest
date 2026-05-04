const CACHE = "hernest-v3.1";
const OFFLINE_URLS = ["/", "/index.html", "/manifest.json", "/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  if(e.request.url.includes("/api/")) return; // Never cache API calls
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if(res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});

// Push notifications
self.addEventListener("push", e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || "HerNest", {
      body: data.body || "Your briefing is ready",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "hernest",
      data: { url: data.url || "/" }
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:"window"}).then(clientList => {
      if(clientList.length > 0) return clientList[0].focus();
      return clients.openWindow(e.notification.data?.url || "/");
    })
  );
});