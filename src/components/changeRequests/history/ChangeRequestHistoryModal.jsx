'use client';

import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import Modal from '@/components/common/Modal';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import ErrorNote from '@/components/ui/ErrorNote';
import ChangeRequestStatusBadge from '@/components/changeRequests/view/ChangeRequestStatusBadge';
import { pageInfo } from '@/lib/pageInfo';
import { CHROME } from '@/theme/vizPalette';
import ChangeRequestVersionDetails from './ChangeRequestVersionDetails';
import { useChangeRequestHistory } from './useChangeRequestHistory';

function changesOf(version, t) {
  const parts = [];
  if (version.fieldChanges.length) parts.push(t('holds.fields', { count: version.fieldChanges.length }));
  if (version.cycleChanges.length) parts.push(t('holds.cycles', { count: version.cycleChanges.length }));
  if (version.newItems.length) parts.push(t('holds.newItems', { count: version.newItems.length }));
  parts.push(t('holds.files', { count: version.attachments.length }));
  return parts.join(' · ');
}

/**
 * @param {{ open: boolean, onClose: () => void, changeRequest: Object, projectCode: string }} props
 */
export default function ChangeRequestHistoryModal({ open, onClose, changeRequest, projectCode }) {
  const t = useTranslations('changeRequests.history');
  const format = useLocaleFormat();
  const history = useChangeRequestHistory(changeRequest.id, open);

  const columns = [
    { key: 'version', label: t('version'), render: (v) => <span dir="ltr" className="font-mono text-xs font-semibold">v{v}</span> },
    { key: 'madeByName', label: t('madeBy'), render: (name) => name ?? t('unknown') },
    { key: 'madeOn', label: t('madeOn'), render: (on) => (on ? format.dateTime(on) : '—') },
    { key: 'statusId', label: t('status'), render: (id) => <ChangeRequestStatusBadge statusId={id} size="sm" /> },
    { key: 'replacedOn', label: t('replacedOn'), render: (on) => (on ? format.dateTime(on) : '—') },
    { key: 'changes', label: t('holds.label'), render: (_, row) => <span className="text-xs" style={{ color: CHROME.textMuted }}>{changesOf(row, t)}</span> },
    {
      key: 'view',
      label: '',
      align: 'right',
      render: (_, row) => (
        <Button size="sm" variant={history.selected?.version === row.version ? 'outline' : 'ghost'} onClick={() => history.pick(row.version)}>
          {history.selected?.version === row.version ? t('shown') : t('view')}
        </Button>
      ),
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title={t('title', { name: changeRequest.number || t('thisRequest') })} size="xl">
      <p className="mb-3 text-xs" style={{ color: CHROME.textMuted }}>
        {t('note')}
      </p>
      {history.error ? (
        <ErrorNote error={history.error} onRetry={history.reload} />
      ) : (
        <Table
          columns={columns}
          data={history.rows}
          rowKey="version"
          isLoading={history.loading}
          sortable={false}
          resizable={false}
          compact
          emptyMessage={t('empty')}
          pagination={pageInfo(history.page, history.pageSize, history.total, history.setPage, history.setPageSize)}
        />
      )}
      {history.selected && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{t('versionNumber', { number: history.selected.version })}</p>
          <ChangeRequestVersionDetails version={history.selected} changeRequestId={changeRequest.id} projectCode={projectCode} />
        </div>
      )}
    </Modal>
  );
}
