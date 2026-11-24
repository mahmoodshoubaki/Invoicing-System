'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';

import CheckboxDropdown from '@/components/ui/CheckboxDropdown';
import { CHROME } from '@/theme/vizPalette';

/**
 * @param {{ roles: Array<{ id: string, name: string }>, loading?: boolean, selectedIds: string[], onChange: (ids: string[]) => void }} props
 */
function RoleChips({ roles, loading = false, selectedIds, onChange }) {
  const t = useTranslations('tasks.people');
  if (loading && roles.length === 0) {
    return <p className="text-[11px]" style={{ color: CHROME.textMuted }}>{t('loadingRoles')}</p>;
  }
  if (roles.length === 0) {
    return <p className="text-[11px]" style={{ color: CHROME.textMuted }}>{t('noRoles')}</p>;
  }

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((r) => r !== id) : [...selectedIds, id]);

  return (
    <CheckboxDropdown
      compact
      label={t('roles')}
      options={roles.map((role) => ({ value: role.id, label: role.name }))}
      selected={selectedIds}
      onToggle={toggle}
      placeholder={t('chooseRoles')}
    />
  );
}

export default memo(RoleChips);
