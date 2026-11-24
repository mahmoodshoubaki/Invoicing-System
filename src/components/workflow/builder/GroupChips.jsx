'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';

import CheckboxDropdown from '@/components/ui/CheckboxDropdown';
import { CHROME } from '@/theme/vizPalette';

/**
 * @param {{ groups: Array<{ id: string, name: string }>, loading?: boolean, selectedIds: string[], onChange: (ids: string[]) => void }} props
 */
function GroupChips({ groups, loading = false, selectedIds, onChange }) {
  const t = useTranslations('tasks.people');
  if (loading && groups.length === 0) {
    return <p className="text-[11px]" style={{ color: CHROME.textMuted }}>{t('loadingGroups')}</p>;
  }
  if (groups.length === 0) {
    return <p className="text-[11px]" style={{ color: CHROME.textMuted }}>{t('noGroups')}</p>;
  }

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((g) => g !== id) : [...selectedIds, id]);

  return (
    <CheckboxDropdown
      compact
      label={t('groups')}
      options={groups.map((group) => ({ value: group.id, label: group.name }))}
      selected={selectedIds}
      onToggle={toggle}
      placeholder={t('chooseGroups')}
    />
  );
}

export default memo(GroupChips);
