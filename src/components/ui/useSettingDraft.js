'use client';

import { useState } from 'react';

import { settingProblem } from '@/utils/settingValue';

/**
 * @param {{ value: string, type: string, isKnown?: boolean }} setting
 * @param {boolean} canEdit
 */
export function useSettingDraft(setting, canEdit) {
  const [draft, setDraft] = useState(setting.value);
  const dirty = draft !== setting.value;
  const retired = setting.isKnown === false;
  return {
    draft,
    setDraft,
    dirty,
    problem: dirty ? settingProblem(draft, setting.type) : null,
    retired,
    editable: canEdit && !retired,
    reset: () => setDraft(setting.value),
  };
}
