'use client';

import { useEffect, useState } from 'react';

import { notificationRepository } from '@/repositories/notificationRepository';

const FETCHERS = {
  channels: () => notificationRepository.getChannels(),
  priorities: () => notificationRepository.getPriorities(),
  languages: () => notificationRepository.getLanguages(),
  deliveryStatuses: () => notificationRepository.getDeliveryStatuses(),
  emailProviders: () => notificationRepository.getEmailProviders(),
  smtpSecurityModes: () => notificationRepository.getSmtpSecurityModes(),
  faultReasons: () => notificationRepository.getFaultReasons(),
};

const cache = new Map();

function fetchOnce(name) {
  if (!cache.has(name)) {
    const promise = FETCHERS[name]().catch((err) => {
      cache.delete(name);
      throw err;
    });
    cache.set(name, promise);
  }
  return cache.get(name);
}

const EMPTY = { list: [], byKey: {} };

/**
 * @param {keyof FETCHERS} name
 * @param {boolean} [enabled]
 * @returns {{ list: Array, byKey: Record<number, Object> }}
 */
export function useNotificationLookup(name, enabled = true) {
  const [value, setValue] = useState(EMPTY);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    fetchOnce(name)
      .then((list) => {
        if (!cancelled) setValue({ list, byKey: Object.fromEntries(list.map((row) => [row.key, row])) });
      })
      .catch(() => { /* badges fall back to the row's own text */ });
    return () => { cancelled = true; };
  }, [name, enabled]);

  return value;
}
