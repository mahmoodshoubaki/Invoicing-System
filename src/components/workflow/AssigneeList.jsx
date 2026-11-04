'use client';

import { Boxes, User, Users } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

export default function AssigneeList({ users = [], roles = [], groups = [], emptyText = null, compact = false }) {
  if (users.length === 0 && roles.length === 0 && groups.length === 0) {
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
      {groups.map((group) => (
        <span
          key={`g-${group.id ?? group.name}`}
          className={`inline-flex items-center gap-1 rounded-full font-medium ${chip}`}
          style={{ backgroundColor: withAlpha(STATUS.good, 0.12), color: STATUS.good }}
          title="A group — any member can answer"
        >
          <Boxes size={compact ? 9 : 10} aria-hidden="true" />
          {group.name}
        </span>
      ))}
    </span>
  );
}
