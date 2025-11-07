// components/TrackerClient.tsx
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent, hasConsent } from '@/lib/tracker';

export default function TrackerClient() {
  const pathname = usePathname();

  useEffect(() => {
    if (hasConsent()) {
      trackEvent('page_view', { path: pathname });
    }
  }, [pathname]);

  return null;
}
