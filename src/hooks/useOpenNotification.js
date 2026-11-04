'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { notificationRepository } from '@/repositories/notificationRepository';

/**
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
