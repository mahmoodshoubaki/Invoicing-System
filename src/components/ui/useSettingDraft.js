'use client';

import { useState } from 'react';

import { settingProblem } from '@/utils/settingValue';

/**
 * One setting's value being typed: the draft, whether it differs from what is
 * saved, and what is wrong with it. Shared by SettingRow and the engine limits
 * table, so both check a value the same way.
 *
 * A row the system no longer reads (`isKnown: false`) is shown, never edited.
 *
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
