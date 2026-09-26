// Newsdesk. Takes a push and shows it; the choosing was done before sending.
"use strict";

self.addEventListener("push", function (event) {
  event.waitUntil((async function () {
    var data = {};
    try { data = event.data ? event.data.json() : {}; } catch (err) { data = {}; }

    // Always a notification, even when the message made no sense: a push
    // that shows nothing costs this site its permission to push at all.
    await self.registration.showNotification(data.title || "Newsdesk", {
      body: data.body || "",
      tag: data.tag || undefined,
      data: { url: data.url || "news.html" },
      icon: "news-icon.png",
      badge: "news-icon.png"
    });
  })());
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var target = (event.notification.data && event.notification.data.url) || "news.html";

  event.waitUntil((async function () {
    var open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (var i = 0; i < open.length; i++) {
      if (open[i].url === target && "focus" in open[i]) return open[i].focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});