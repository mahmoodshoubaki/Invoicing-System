'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { notificationRepository } from '@/repositories/notificationRepository';

/**
 * Opening a bell notification: mark it read, then follow its link.
 *
 * `actionUrl` is already a full link (the backend puts the FrontendBaseUrl
 * setting in front of the type's pattern). Pointing at this app, it is opened
 * in place by the router — no reload, no lost state. Anywhere else, it opens in
 * a new tab so the person keeps their place here.
 *
 * Marking read is fire-and-forget: the caller updates its own row at once, and
 * a failure costs nothing worse than the row looking unread on the next load.
 *
 * @returns {(notification: Object, onRead?: (deliveryId: string) => void) => void}
 */
export function useOpenNotification() {
  const router = useRouter();

  return useCallback((notification, onRead) => {
    if (!notification.isRead) {
      onRead?.(notification.deliveryId);
      notificationRepository.markRead(notification.deliveryId).catch(() => {});
    }

    const url = notification.actionUrl;
    if (!url) return;

    try {
      const target = new URL(url, window.location.origin);
      if (target.origin === window.location.origin) {
        router.push(`${target.pathname}${target.search}${target.hash}`);
      } else {
        window.open(target.href, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // Not a URL anything can open; the read mark still counts.
    }
  }, [router]);
}
