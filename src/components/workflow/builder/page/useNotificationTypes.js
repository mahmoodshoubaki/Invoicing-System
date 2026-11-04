'use client';

import { useEffect, useState } from 'react';

import { notificationRepository } from '@/repositories/notificationRepository';

/**
 * @param {boolean} canRead
 * @returns {Array|null}
 */
export function useNotificationTypes(canRead) {
  const [notificationTypes, setNotificationTypes] = useState(null);

  useEffect(() => {
    if (!canRead) return undefined;
    let cancelled = false;
    notificationRepository.getTypes()
      .then((types) => { if (!cancelled) setNotificationTypes(types); })
      .catch(() => { /* left null: the number-box fallback */ });
    return () => { cancelled = true; };
  }, [canRead]);

  return notificationTypes;
}
