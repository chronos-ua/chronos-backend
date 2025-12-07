// Service worker for push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Notification";
  const options = {
    body: data.message || data.body || "You have a new notification",
    icon: data.icon || "/icon.png",
    badge: data.badge || "/badge.png",
    tag: data.tag || "notification",
    requireInteraction: false,
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUnowned: true })
      .then((clientList) => {
        for (const client of clientList)
          if (client.url === url && "focus" in client) return client.focus();
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
