'use client';

import { useRouter } from 'next/navigation';

import Table from '@/components/common/Table';
import LookupBadge from '@/components/ui/LookupBadge';
import { CHROME } from '@/theme/vizPalette';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';

/**
 * Every copy a notification was resent as (2026-10-13), oldest first — one per
 * person — each row opening that copy. A typed address has no name, so its
 * email stands in. Each copy is also its own row in the delivery monitor,
 * where it can be found by address.
 *
 * @param {{ copies: Array, statuses: { byKey: Object } }} props
 */
export default function ResentAsTable({ copies, statuses }) {
  const router = useRouter();

  const columns = [
    {
      key: 'recipientName',
      label: 'Sent to',
      render: (name, copy) => (
        <span className="text-xs" style={{ color: CHROME.textPrimary }}>
          {name || copy.recipientEmail || '—'}
          {name && copy.recipientEmail && (
            <span className="block text-[11px]" style={{ color: CHROME.textMuted }}>{copy.recipientEmail}</span>
          )}
        </span>
      ),
    },
    { key: 'line', label: 'Line', render: (line) => <span className="text-xs">{line || '—'}</span> },
    {
      key: 'statusKey',
      label: 'Status',
      render: (statusKey, copy) => {
        const status = statuses.byKey[statusKey];
        return <LookupBadge label={copy.status || status?.value || '—'} colorHex={status?.colorHex} size="sm" />;
      },
    },
    { key: 'createdOn', label: 'When', render: (on) => <span className="text-xs">{on ? formatDateTime(on) : '—'}</span> },
    { key: 'createdByName', label: 'By', render: (by) => <span className="text-xs">{by ?? '—'}</span> },
  ];

  return (
    <Table
      columns={columns}
      data={copies}
      rowKey="notificationId"
      onRowClick={(copy) => router.push(ROUTES.MONITORING_DELIVERY(copy.notificationId))}
      sortable={false}
      resizable={false}
      compact
    />
  );
}
