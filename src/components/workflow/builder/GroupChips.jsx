'use client';

import { memo } from 'react';

import CheckboxDropdown from '@/components/ui/CheckboxDropdown';
import { CHROME } from '@/theme/vizPalette';

/**
 * @param {{ groups: Array<{ id: string, name: string }>, loading?: boolean, selectedIds: string[], onChange: (ids: string[]) => void }} props
 */
function GroupChips({ groups, loading = false, selectedIds, onChange }) {
  if (loading && groups.length === 0) {
    return <p className="text-[11px]" style={{ color: CHROME.textMuted }}>Loading groups…</p>;
  }
  if (groups.length === 0) {
    return <p className="text-[11px]" style={{ color: CHROME.textMuted }}>No groups available.</p>;
  }

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((g) => g !== id) : [...selectedIds, id]);

  return (
    <CheckboxDropdown
      compact
      label="Groups"
      options={groups.map((group) => ({ value: group.id, label: group.name }))}
      selected={selectedIds}
      onToggle={toggle}
      placeholder="Choose groups…"
    />
  );
}

export default memo(GroupChips);
