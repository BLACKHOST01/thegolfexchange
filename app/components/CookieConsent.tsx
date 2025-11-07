// components/CookieConsent.tsx
'use client';
import { useEffect, useState } from 'react';
import { CONSENT_KEY, getVisitorId } from '@/lib/tracker';

export default function CookieConsent() {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    const val = typeof window !== 'undefined' ? localStorage.getItem(CONSENT_KEY) : null;
    setAccepted(val === 'true' ? true : val === 'false' ? false : null);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    getVisitorId(); // ensure visitor id exists
    setAccepted(true);
    // optionally trigger an initial pageview event here
    // (but tracker handles it elsewhere)
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'false');
    setAccepted(false);
  };

  if (accepted !== null) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: 16,
      right: 16,
      background: 'white',
      border: '1px solid #ddd',
      padding: 12,
      borderRadius: 8,
      zIndex: 9999,
      boxShadow: '0 6px 18px rgba(0,0,0,0.08)'
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <strong>The Golf Exchange</strong>
          <div style={{ fontSize: 13 }}>We use cookies to improve your experience. Accept analytics cookies?</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={decline} style={{ padding: '6px 10px' }}>Decline</button>
          <button onClick={accept} style={{ padding: '6px 10px' }}>Accept</button>
        </div>
      </div>
    </div>
  );
}
