'use client';

import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { localName } from '@/utils/localName';
import { selectLanguage } from '@/store/slices/uiSlice';

function Stamp({ name, on }) {
  const format = useLocaleFormat();
  if (!name && !on) return '—';
  return (
    <div className="min-w-0">
      <p className="text-sm text-gray-700 [overflow-wrap:anywhere]">{name ?? '—'}</p>
      <p className="whitespace-nowrap text-xs tabular-nums text-gray-400">{format.dateTime(on)}</p>
    </div>
  );
}

/**
 * @param {{ entries: object[], loading: boolean, canEdit: boolean, canDelete: boolean, onEdit: (entry: object) => void, onDelete: (entry: object) => void }} props
 */
function ClaimLogTable({ entries, loading, canEdit, canDelete, onEdit, onDelete }) {
  const t = useTranslations('claims.log');
  const format = useLocaleFormat();
  const language = useSelector(selectLanguage);

  const columns = useMemo(() => [
    { key: 'rowNumber', label: '#', width: 48 },
    {
      key: 'stageNameEn',
      label: t('stage'),
      render: (_, row) => <span dir="auto">{localName(row.stageNameEn, row.stageNameAr, language)}</span>,
    },
    {
      key: 'actionDate',
      label: t('date'),
      render: (value) => <span className="whitespace-nowrap tabular-nums">{format.date(value) || '—'}</span>,
    },
    {
      key: 'notes',
      label: t('notes'),
      render: (value) => (value ? <span dir="auto" className="whitespace-pre-line">{value}</span> : '—'),
    },
    { key: 'addedByName', label: t('addedBy'), render: (_, row) => <Stamp name={row.addedByName} on={row.addedOn} /> },
    { key: 'updatedByName', label: t('updatedBy'), render: (_, row) => <Stamp name={row.updatedByName} on={row.updatedOn} /> },
    ...(canEdit || canDelete ? [{
      key: 'actions',
      label: '',
      width: canEdit && canDelete ? 88 : 56,
      render: (_, row) => (
        <div className="flex justify-end gap-1">
          {canEdit && (
            <Button variant="ghost" size="xs" icon={Pencil} onClick={() => onEdit(row)} title={t('edit')} aria-label={t('editEntry', { number: row.rowNumber ?? '' })} />
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="xs"
              icon={Trash2}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(row)}
              title={t('delete')}
              aria-label={t('deleteEntry', { number: row.rowNumber ?? '' })}
            />
          )}
        </div>
      ),
    }] : []),
  ], [language, canEdit, canDelete, onEdit, onDelete, t, format]);

  return (
    <Table
      columns={columns}
      data={entries}
      isLoading={loading && entries.length === 0}
      rowKey="id"
      sortable={false}
      resizable={false}
      compact
      emptyMessage={t('empty')}
    />
  );
}

export default memo(ClaimLogTable);
