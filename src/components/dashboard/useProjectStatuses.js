'use client';

import { useEffect, useState } from 'react';

import { projectRepository } from '@/repositories/projectRepository';

/** The EPM project statuses the user's projects hold, loaded once; [] until then or on failure. */
export function useProjectStatuses() {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    projectRepository.getProjectStatuses()
      .then((list) => { if (!cancelled) setStatuses(list); })
      .catch(() => { if (!cancelled) setStatuses([]); });
    return () => { cancelled = true; };
  }, []);

  return statuses;
}
