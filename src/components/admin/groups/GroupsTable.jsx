'use client';

import { useMemo } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { CHROME } from '@/theme/vizPalette';

const SHOWN_MEMBERS = 3;

function Members({ members }) {
  if (members.length === 0) return <span className="text-xs" style={{ color: CHROME.textMuted }}>No members</span>;
  const shown = members.slice(0, SHOWN_MEMBERS);
  const rest = members.length - shown.length;
  return (
    <span className="text-xs" style={{ color: CHROME.textSecondary }} title={members.map((m) => m.displayName).join(', ')}>
      {shown.map((m, i) => (
        <span key={m.userId}>
          {i > 0 && ', '}
          <span style={m.isActive ? undefined : { color: CHROME.textMuted }}>
            {m.displayName}{m.isActive ? '' : ' (inactive)'}
          </span>
        </span>
      ))}
      {rest > 0 && <span style={{ color: CHROME.textMuted }}> +{rest} more</span>}
    </span>
  );
}

/**
 * @param {{ groups: Array, isLoading: boolean, canManage: boolean, onEdit: (group) => void, onDelete: (group) => void }} props
 */
export default function GroupsTable({ groups, isLoading, canManage, onEdit, onDelete }) {
  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Group',
      render: (val, row) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{val}</p>
          {row.description && <p className="truncate text-xs" style={{ color: CHROME.textMuted }}>{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'members',
      label: 'Members',
      sortable: false,
      render: (val) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>{val.length}</span>
          <Members members={val} />
        </div>
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="xs" icon={Edit2} onClick={() => onEdit(row)} title="Edit" aria-label={`Edit ${row.name}`} />
          <Button variant="ghost" size="xs" icon={Trash2} onClick={() => onDelete(row)} title="Delete" aria-label={`Delete ${row.name}`} />
        </div>
      ),
    }] : []),
  ], [canManage, onEdit, onDelete]);

  return (
    <Table
      columns={columns}
      data={groups}
      isLoading={isLoading}
      emptyMessage="No groups yet."
    />
  );
}
