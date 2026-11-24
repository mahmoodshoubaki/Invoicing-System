'use client';

import { useLookupLabel } from './useLookupLabel';

/**
 * @returns {(value: string) => string} the translated EPM project status, or the value itself when unknown
 */
export function useProjectStatusLabel() {
  return useLookupLabel('projectStatus');
}
