'use client';

import { memo } from 'react';

import CheckboxDropdown from '@/components/ui/CheckboxDropdown';
import { CHROME } from '@/theme/vizPalette';

/**
 * Picking roles — who a task is assigned to, or who a notification goes to.
 * Same control in both places, so picking roles feels the same.
 *
 * A dropdown of checkboxes since 2026-10-20: a row of chips, one per role,
 * wrapped onto several lines once there were many roles. Closed, it is one
 * line ("Finance, Admin +3 more").
 *
 * @param {{ roles: Array<{ id: string, name: string }>, loading?: boolean, selectedIds: string[], onChange: (ids: string[]) => void }} props
 */
function RoleChips({ roles, loading = false, selectedIds, onChange }) {
  if (loading && roles.length === 0) {
    return <p className="text-[11px]" style={{ color: CHROME.textMuted }}>Loading roles…</p>;
  }
  if (roles.length === 0) {
    return <p className="text-[11px]" style={{ color: CHROME.textMuted }}>No roles available.</p>;
  }

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((r) => r !== id) : [...selectedIds, id]);

  return (
    <CheckboxDropdown
      compact
      label="Roles"
      options={roles.map((role) => ({ value: role.id, label: role.name }))}
      selected={selectedIds}
      onToggle={toggle}
      placeholder="Choose roles…"
    />
  );
}

export default memo(RoleChips);
