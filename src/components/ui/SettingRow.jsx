'use client';

import { memo } from 'react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { SETTING_TYPE } from '@/constants/workflow';
import SettingValueControls from './SettingValueControls';
import { useSettingDraft } from './useSettingDraft';

/**
 * One setting: its key, what it means, and a control drawn from its `type` —
 * never from its key, so a future row of a new type gets the right box. The box
 * and its Save live in SettingValueControls, shared with the engine limits
 * table (2026-10-13).
 *
 * @param {{
 *   setting: { key: string, value: string, type: string, description?: string, isKnown?: boolean },
 *   canEdit: boolean, saving: boolean, onSave: (key: string, value: string) => void,
 * }} props
 */
function SettingRow({ setting, canEdit, saving, onSave }) {
  const draft = useSettingDraft(setting, canEdit);

  return (
    <li className="flex flex-wrap items-start gap-3 border-b border-[#f1f0ee] py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <SettingName setting={setting} retired={draft.retired} />
        {draft.problem && <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{draft.problem}</p>}
      </div>
      <SettingValueControls setting={setting} draft={draft} saving={saving} onSave={onSave} />
    </li>
  );
}

export default memo(SettingRow);

/**
 * A setting's key, its notes, and its description — the row's own words; a
 * local copy of what a key means would drift the moment the backend rewords it.
 *
 * @param {{ setting: Object, retired: boolean }} props
 */
export function SettingName({ setting, retired }) {
  return (
    <>
      <p className="flex flex-wrap items-center gap-1.5 font-mono text-xs" style={{ color: CHROME.textPrimary }}>
        {setting.key}
        {retired && (
          <span
            className="rounded px-1 py-0.5 font-sans text-[10px] font-medium"
            style={{ backgroundColor: '#f1f0ee', color: CHROME.textMuted }}
            title="Nothing reads this row any more."
          >
            not used
          </span>
        )}
        {setting.type === SETTING_TYPE.WHOLE_NUMBER && (
          <span className="font-sans text-[10px]" style={{ color: CHROME.textMuted }}>0 = off / for ever</span>
        )}
      </p>
      {setting.description && (
        <p className="mt-0.5 text-[11px] leading-snug" style={{ color: CHROME.textMuted }}>{setting.description}</p>
      )}
    </>
  );
}
