// lib/tracker.ts
export const VISITOR_KEY = 'gex_visitor_id';
export const CONSENT_KEY = 'gex_cookie_consent';

export const getVisitorId = () => {
  if (typeof window === 'undefined') return null;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = 'v_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};

export function hasConsent() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'true';
}

export async function trackEvent(eventType: string, properties: Record<string, any> = {}) {
  try {
    if (typeof window === 'undefined') return;
    if (!hasConsent()) return; // only track when user consented

    const payload = {
      visitorId: getVisitorId(),
      eventType,
      eventProperties: properties,
      url: window.location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // fire-and-forget
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // silent failure
  }
}
