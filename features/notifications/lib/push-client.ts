"use client";

import { urlBase64ToUint8Array } from "@/features/notifications/lib/vapid";

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function getPushErrorMessage(cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause);

  if (
    message.includes("push service not available") ||
    (cause instanceof DOMException && cause.name === "AbortError")
  ) {
    return "Push-сервис недоступен в этом окне. Откройте приложение в Chrome или Safari по адресу http://localhost:3000 (не во встроенном превью редактора).";
  }

  if (cause instanceof DOMException && cause.name === "NotAllowedError") {
    return "Разрешите уведомления в настройках браузера";
  }

  return "Не удалось подключить push-уведомления";
}

async function getServiceWorkerRegistration() {
  try {
    const existing = await navigator.serviceWorker.getRegistration("/sw.js");
    if (existing) return existing;

    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (cause) {
    throw new Error(getPushErrorMessage(cause));
  }
}

export async function subscribeToPushNotifications() {
  if (!isPushSupported()) {
    return { error: "Push-уведомления не поддерживаются в этом браузере" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { error: "Разрешите уведомления в настройках браузера" };
    }

    const registration = await getServiceWorkerRegistration();
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        return { error: "Push-уведомления не настроены на сервере" };
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { error: payload?.error ?? "Не удалось сохранить подписку на уведомления" };
    }

    return { success: true as const };
  } catch (cause) {
    return {
      error: cause instanceof Error && cause.message.startsWith("Push-сервис")
        ? cause.message
        : getPushErrorMessage(cause),
    };
  }
}

export async function unsubscribeFromPushNotifications() {
  if (!isPushSupported()) {
    return { success: true as const };
  }

  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = registration ? await registration.pushManager.getSubscription() : null;

  if (subscription) {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
  }

  return { success: true as const };
}

export function getPushSupportStatus() {
  return isPushSupported();
}

export async function scheduleTestPushNotification(delayMs = 60_000) {
  if (!isPushSupported()) {
    return { error: "Push-уведомления не поддерживаются в этом браузере" };
  }

  try {
    if (Notification.permission !== "granted") {
      return { error: "Разрешите уведомления в настройках браузера" };
    }

    const registration = await getServiceWorkerRegistration();
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return { error: "Сначала включите уведомления и сохраните настройки" };
    }

    const worker = registration.active ?? navigator.serviceWorker.controller;
    if (worker) {
      worker.postMessage({ type: "SCHEDULE_TEST_PUSH", delayMs });
      return { success: true as const };
    }

    window.setTimeout(async () => {
      await fetch("/api/push/test", { method: "POST" });
    }, delayMs);

    return { success: true as const };
  } catch (cause) {
    return { error: getPushErrorMessage(cause) };
  }
}
