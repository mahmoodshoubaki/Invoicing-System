'use client';

import { User, Users } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * Who a to-do is assigned to right now — people and roles.
 *
 * People and roles are drawn differently on purpose: a person is one specific
 * individual, a role is anybody holding it, and "Finance Approvers" reading the
 * same as "Sara" would hide that the second is a pool of people.
 *
 * Reads `assignedUsers` / `assignedRoles` off the row — see `mapAssignees` in
 * `models/workflow.js` for why these cannot be worked out from the definition,
 * and for the fact that the field names are proposed rather than confirmed.
 *
 * `emptyText` is what to say when nobody is listed. Omit it to render nothing,
 * which is right where an empty list only means the API has not sent the field.
 */
export default function AssigneeList({ users = [], roles = [], emptyText = null, compact = false }) {
  if (users.length === 0 && roles.length === 0) {
    return emptyText ? (
      <span className="text-[11px]" style={{ color: CHROME.textMuted }}>{emptyText}</span>
    ) : null;
  }

  const chip = compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {users.map((user) => (
        <span
          key={`u-${user.id ?? user.name}`}
          className={`inline-flex items-center gap-1 rounded-full font-medium ${chip}`}
          style={{ backgroundColor: withAlpha(STATUS.info, 0.12), color: STATUS.info }}
        >
          <User size={compact ? 9 : 10} aria-hidden="true" />
          {user.name}
        </span>
      ))}
      {roles.map((role) => (
        <span
          key={`r-${role.id ?? role.name}`}
          className={`inline-flex items-center gap-1 rounded-full font-medium ${chip}`}
          style={{ backgroundColor: '#f1f0ee', color: CHROME.textSecondary }}
          title="A role — anybody holding it can answer"
        >
          <Users size={compact ? 9 : 10} aria-hidden="true" />
          {role.name}
        </span>
      ))}
    </span>
  );
}
