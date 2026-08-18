import { registerSW } from "virtual:pwa-register";

function isLovablePreview(hostname: string) {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterAppServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map(async (registration) => {
      const scriptUrl =
        registration.active?.scriptURL ??
        registration.waiting?.scriptURL ??
        registration.installing?.scriptURL;
      if (scriptUrl && new URL(scriptUrl).pathname === "/sw.js") {
        await registration.unregister();
      }
    }),
  );
}

export async function registerMoedimPwa() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const registrationBlocked =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    isLovablePreview(window.location.hostname) ||
    new URLSearchParams(window.location.search).get("sw") === "off";

  if (registrationBlocked) {
    await unregisterAppServiceWorker();
    return;
  }

  registerSW({ immediate: true });
}