// Concept I Gym — Owner Audit PWA Service Worker
const CACHE_NAME = "concept-1-audit-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications
self.addEventListener("push", (event) => {
  let data = {
    title: "🔔 Staff Activity Alert",
    body: "New activity detected on Gym CRM.",
    url: "/audit",
    tag: "audit-notification",
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || "New staff action detected.",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    tag: data.tag || "audit-alert",
    vibrate: [250, 100, 250, 100, 250],
    data: {
      url: data.url || "/audit",
      timestamp: data.timestamp || Date.now(),
    },
    requireInteraction: true,
    actions: [
      { action: "open_logs", title: "View Activity Logs" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title || "Gym Alert", options));
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || "/audit";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open with /audit, focus it
      for (const client of clientList) {
        if (client.url.includes("/audit") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
