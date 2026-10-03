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

  var sent = (event.notification.data && event.notification.data.url) || "news.html";

  // The address carries the article's anchor, so an already open copy of
  // the page is almost never at exactly this address. Match on the page
  // itself and move that one to the article instead of opening a second.
  var page = sent.split("#")[0];
  var anchor = sent.split("#")[1];

  // Opened from a notification the page has to be fetched again, not shown
  // from the phone's cache: the article being pointed at is newer than the
  // copy standing open on the home screen, which would scroll to an anchor
  // it does not have. A query nobody reads is what makes it a new address,
  // and so a real load.
  var fresh = page + (page.indexOf("?") >= 0 ? "&" : "?") + "n=" + Date.now()
    + (anchor ? "#" + anchor : "");

  event.waitUntil((async function () {
    var open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

    for (var i = 0; i < open.length; i++) {
      if (open[i].url.split("#")[0] !== page) continue;

      if ("navigate" in open[i]) {
        try {
          var moved = await open[i].navigate(fresh);
          if (moved && "focus" in moved) return moved.focus();
        } catch (err) { /* Safari tillåter det inte alltid */ }
      }

      // Om sidan inte gick att flytta utifrån får den flytta sig själv.
      // Utan det hamnar du i appen men på den vy den stod på.
      open[i].postMessage({ type: "newsdesk-open", url: fresh });
      if ("focus" in open[i]) return open[i].focus();
    }

    if (self.clients.openWindow) return self.clients.openWindow(fresh);
  })());
});