'use client';

import Modal from '@/components/common/Modal';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import ErrorNote from '@/components/ui/ErrorNote';
import ChangeRequestStatusBadge from '@/components/changeRequests/view/ChangeRequestStatusBadge';
import { pageInfo } from '@/lib/pageInfo';
import { CHROME } from '@/theme/vizPalette';
import { formatDateTime } from '@/utils';
import ChangeRequestVersionDetails from './ChangeRequestVersionDetails';
import { useChangeRequestHistory } from './useChangeRequestHistory';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function changesOf(version) {
  const parts = [];
  if (version.fieldChanges.length) parts.push(plural(version.fieldChanges.length, 'field'));
  if (version.cycleChanges.length) parts.push(plural(version.cycleChanges.length, 'cycle'));
  if (version.newItems.length) parts.push(plural(version.newItems.length, 'new item'));
  parts.push(plural(version.attachments.length, 'file'));
  return parts.join(' · ');
}

/**
 * @param {{ open: boolean, onClose: () => void, changeRequest: Object, projectCode: string }} props
 */
export default function ChangeRequestHistoryModal({ open, onClose, changeRequest, projectCode }) {
  const history = useChangeRequestHistory(changeRequest.id, open);

  const columns = [
    { key: 'version', label: 'Version', render: (v) => <span className="font-mono text-xs font-semibold">v{v}</span> },
    { key: 'madeByName', label: 'Made by', render: (name) => name ?? 'Unknown' },
    { key: 'madeOn', label: 'Made on', render: (on) => (on ? formatDateTime(on) : '—') },
    { key: 'statusId', label: 'Status', render: (id) => <ChangeRequestStatusBadge statusId={id} size="sm" /> },
    { key: 'replacedOn', label: 'Replaced on', render: (on) => (on ? formatDateTime(on) : '—') },
    { key: 'changes', label: 'Holds', render: (_, row) => <span className="text-xs" style={{ color: CHROME.textMuted }}>{changesOf(row)}</span> },
    {
      key: 'view',
      label: '',
      align: 'right',
      render: (_, row) => (
        <Button size="sm" variant={history.selected?.version === row.version ? 'outline' : 'ghost'} onClick={() => history.pick(row.version)}>
          {history.selected?.version === row.version ? 'Shown' : 'View'}
        </Button>
      ),
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title={`History of ${changeRequest.number || 'this change request'}`} size="xl">
      <p className="mb-3 text-xs" style={{ color: CHROME.textMuted }}>
        Earlier versions, oldest first. The current version is the one on this page.
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
          emptyMessage="No earlier versions. It hasn’t been edited since it was raised."
          pagination={pageInfo(history.page, history.pageSize, history.total, history.setPage, history.setPageSize)}
        />
      )}
      {history.selected && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>Version {history.selected.version}</p>
          <ChangeRequestVersionDetails version={history.selected} changeRequestId={changeRequest.id} projectCode={projectCode} />
        </div>
      )}
    </Modal>
  );
}
