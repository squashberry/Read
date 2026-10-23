const CACHE_NAME = "squashberry-library-shell-v5";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./og-image.svg", "./upload-config.js", "./gptinstruction/"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      const isGuide = url.pathname.toLowerCase().includes("/gptinstruction");
      caches.open(CACHE_NAME).then((cache) => cache.put(isGuide ? "./gptinstruction/" : "./index.html", copy));
      return response;
    }).catch(() => {
      const isGuide = url.pathname.toLowerCase().includes("/gptinstruction");
      return caches.match(request).then((cached) => cached || caches.match(isGuide ? "./gptinstruction/" : "./index.html") || caches.match("./"));
    }));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = {body: event.data ? event.data.text() : ""}; }
  const title = payload.title || "A little study reminder";
  const options = {
    body: payload.body || "Open Squashberry Library and study one small thing today.",
    icon: "./icon.svg",
    badge: "./icon.svg",
    tag: payload.tag || "squashberry-daily-study",
    renotify: true,
    requireInteraction: false,
    data: {url: payload.url || "https://squashberry.github.io/Read/", shareUrl: payload.shareUrl || "https://squashberry.github.io/Read/?share=1"},
    actions: [
      {action: "open", title: "Open Library"},
      {action: "share", title: "Share with a friend"}
    ]
  };
  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    await new Promise((resolve) => setTimeout(resolve, 20000));
    const visible = await self.registration.getNotifications({tag: options.tag});
    visible.forEach((notification) => notification.close());
  })());
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const data = event.notification.data || {};
    const isShare = event.action === "share";
    const targetUrl = isShare ? (data.shareUrl || "https://squashberry.github.io/Read/?share=1") : (data.url || "https://squashberry.github.io/Read/");
    const windows = await self.clients.matchAll({type: "window", includeUncontrolled: true});
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        client.postMessage({type: isShare ? "LIBRARY_OPEN_SHARE" : "LIBRARY_OPEN_HOME"});
        return client.focus();
      }
    }
    return self.clients.openWindow(targetUrl);
  })());
});
