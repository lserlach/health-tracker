let testPushTimer = null;

self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_TEST_PUSH") {
    if (testPushTimer) {
      clearTimeout(testPushTimer);
    }

    const delayMs = Number(event.data.delayMs) || 60000;
    testPushTimer = setTimeout(() => {
      testPushTimer = null;
      fetch("/api/push/test", { method: "POST", credentials: "include" }).catch(() => undefined);
    }, delayMs);
  }

  if (event.data?.type === "CANCEL_TEST_PUSH" && testPushTimer) {
    clearTimeout(testPushTimer);
    testPushTimer = null;
  }
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() ?? {};
  const title = payload.title ?? payload.body ?? "Уведомление";
  const options = {
    body: payload.title && payload.body ? payload.body : "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url ?? "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
