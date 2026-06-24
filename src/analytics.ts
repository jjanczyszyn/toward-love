// Google Analytics (GA4), gated on explicit user consent.
// gtag is only loaded after the visitor accepts analytics cookies.
const GA_ID = import.meta.env.VITE_GA_ID;
const CONSENT_KEY = "tl-analytics-consent";

export type Consent = "granted" | "denied";

export function analyticsConfigured(): boolean {
  return !!GA_ID;
}

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* localStorage unavailable — fall back to in-session only */
  }
  if (value === "granted") loadGa();
}

let loaded = false;
export function loadGa(): void {
  if (!GA_ID || loaded) return;
  loaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  const w = window as unknown as {
    dataLayer: unknown[];
    gtag: (...a: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", GA_ID);
}
