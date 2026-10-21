'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FileDiff, Plus } from 'lucide-react';

import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import ErrorNote from '@/components/ui/ErrorNote';
import ChangeRequestStatusBadge from '@/components/changeRequests/view/ChangeRequestStatusBadge';
import { useBoqChangeRequests } from '@/components/changeRequests/useBoqChangeRequests';
import { CR_RULES } from '@/constants/changeRequests';
import { ROUTES } from '@/constants/routes';
import { selectChangeRequestReasonsMap } from '@/store/slices/lookupsSlice';
import { CHROME } from '@/theme/vizPalette';
import { formatDateTime } from '@/utils/formatters';

/**
 * @param {{ projectCode: string, boqId: string|null, canCreate: boolean }} props
 */
function ChangeRequestsTab({ projectCode, boqId, canCreate }) {
  const router = useRouter();
  const reasonsMap = useSelector(selectChangeRequestReasonsMap);
  const list = useBoqChangeRequests(boqId, true);
  const encoded = encodeURIComponent(projectCode);

  const columns = [
    { key: 'number', label: 'Request', render: (number) => <span className="text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{number}</span> },
    { key: 'statusId', label: 'Status', render: (statusId) => <ChangeRequestStatusBadge statusId={statusId} /> },
    {
      key: 'reasonKeys',
      label: 'Reasons',
      render: (keys) => <span className="text-xs">{keys.map((k) => reasonsMap[k]?.label ?? k).join(', ') || '—'}</span>,
    },
    { key: 'affectedAreas', label: 'Changes', render: (areas) => <span className="text-xs" style={{ color: CHROME.textMuted }}>{areas.join(', ') || '—'}</span> },
    { key: 'requestedByName', label: 'Raised by', render: (name) => <span className="text-xs">{name ?? '—'}</span> },
    { key: 'createdOn', label: 'Raised on', render: (on) => <span className="text-xs">{on ? formatDateTime(on) : '—'}</span> },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold" style={{ color: CHROME.textPrimary }}>Change requests</h3>
          <ul className="mt-1 list-disc pl-4 text-xs" style={{ color: CHROME.textMuted }}>
            {CR_RULES.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </div>
        {canCreate && (
          list.open ? (
            <p className="max-w-xs text-right text-xs" style={{ color: CHROME.textMuted }}>
              {list.open.number} is still open — a new request can be raised once it is Completed.
            </p>
          ) : (
            <Link href={ROUTES.PROJECT_CHANGE_REQUEST_NEW(encoded)}>
              <Button size="sm" icon={Plus} disabled={!boqId || !list.ready}>New change request</Button>
            </Link>
          )
        )}
      </div>

      {list.error ? (
        <ErrorNote error={list.error} onRetry={list.reload} />
      ) : (
        <Table
          columns={columns}
          data={list.rows}
          rowKey="id"
          isLoading={!list.ready}
          sortable={false}
          compact
          onRowClick={(row) => router.push(ROUTES.PROJECT_CHANGE_REQUEST(encoded, row.id))}
          emptyMessage={
            <span className="inline-flex flex-col items-center gap-2">
              <FileDiff size={22} className="text-gray-300" aria-hidden="true" />
              No change requests on this BOQ yet.
            </span>
          }
        />
      )}
    </div>
  );
}

export default memo(ChangeRequestsTab);
