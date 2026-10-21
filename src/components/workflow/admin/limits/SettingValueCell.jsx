'use client';

import { memo } from 'react';

import SettingValueControls from '@/components/ui/SettingValueControls';
import { useSettingDraft } from '@/components/ui/useSettingDraft';
import { STATUS } from '@/theme/vizPalette';

/**
 * An engine limit's value, its Save, and what is wrong with what was typed.
 * The table keys it on the saved value, so a saved row resets its draft to
 * what the server actually stored rather than keeping what was typed.
 *
 * @param {{ setting: Object, canEdit: boolean, saving: boolean, onSave: (key: string, value: string) => void }} props
 */
function SettingValueCell({ setting, canEdit, saving, onSave }) {
  const draft = useSettingDraft(setting, canEdit);
  return (
    <div>
      <SettingValueControls setting={setting} draft={draft} saving={saving} onSave={onSave} />
      {draft.problem && <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{draft.problem}</p>}
    </div>
  );
}

export default memo(SettingValueCell);
