'use client';

import { memo } from 'react';
import { Check, RotateCcw } from 'lucide-react';

import Button from '@/components/common/Button';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { SETTING_TYPE } from '@/constants/workflow';
import { controlClass } from './kit';

/**
 * A setting's box — drawn from its `type`, never from its key, so a future row
 * of a new type gets the right box — with its Save and Undo.
 *
 * Nothing saves on blur or on change. A setting is the kind of thing that
 * should take a deliberate click, and the Save button is always there,
 * disabled until there is something to save.
 *
 * @param {{
 *   setting: { key: string, value: string, type: string },
 *   draft: ReturnType<import('./useSettingDraft').useSettingDraft>,
 *   saving: boolean, onSave: (key: string, value: string) => void,
 * }} props
 */
function SettingValueControls({ setting, draft, saving, onSave }) {
  const numeric = setting.type === SETTING_TYPE.POSITIVE_INTEGER || setting.type === SETTING_TYPE.WHOLE_NUMBER;
  const wide = setting.type === SETTING_TYPE.URL || setting.type === SETTING_TYPE.TEXT;

  const control = setting.type === SETTING_TYPE.BOOLEAN ? (
    <select
      value={String(draft.draft).toLowerCase()}
      onChange={(e) => draft.setDraft(e.target.value)}
      disabled={!draft.editable}
      aria-label={setting.key}
      className={`${controlClass} w-28`}
    >
      <option value="true">On</option>
      <option value="false">Off</option>
    </select>
  ) : (
    <input
      type={numeric ? 'number' : setting.type === SETTING_TYPE.URL ? 'url' : 'text'}
      min={setting.type === SETTING_TYPE.POSITIVE_INTEGER ? 1 : setting.type === SETTING_TYPE.WHOLE_NUMBER ? 0 : undefined}
      value={draft.draft}
      onChange={(e) => draft.setDraft(e.target.value)}
      disabled={!draft.editable}
      aria-label={setting.key}
      className={`${controlClass} ${wide ? 'w-72 max-w-full' : 'w-28'} font-mono`}
      style={draft.problem ? { borderColor: STATUS.critical } : undefined}
    />
  );

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {control}
      {draft.editable && (
        <>
          <Button
            size="sm"
            icon={Check}
            onClick={() => onSave(setting.key, String(draft.draft).trim())}
            disabled={!draft.dirty || Boolean(draft.problem)}
            loading={saving}
          >
            Save
          </Button>
          <button
            type="button"
            onClick={draft.reset}
            disabled={!draft.dirty}
            aria-label="Undo this change"
            title="Undo this change"
            className="rounded-md p-1.5 transition-colors hover:bg-[#f1f0ee] disabled:cursor-not-allowed disabled:opacity-30"
            style={{ color: CHROME.textMuted }}
          >
            <RotateCcw size={13} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}

export default memo(SettingValueControls);
