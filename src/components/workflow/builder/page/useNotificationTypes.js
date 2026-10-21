'use client';

import { useEffect, useState } from 'react';

import { notificationRepository } from '@/repositories/notificationRepository';

/**
 * Notification types, for every type dropdown (Send notification steps, a
 * task's checkboxes, the run checkboxes). GetTypes needs Notifications.View,
 * which a workflow author may not hold: then this stays null and the dropdowns
 * become number boxes rather than failing.
 *
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
