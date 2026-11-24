'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Banknote, CheckCircle2, Clock, Edit2, Eye, FileText, History, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import InvoiceHistoryModal from '@/components/invoices/InvoiceHistoryModal';
import DeleteInvoicesDialog from '@/components/invoices/DeleteInvoicesDialog';
import MarkCollectedDialog from '@/components/invoices/collect/MarkCollectedDialog';
import TabToolbar from './TabToolbar';
import { CHROME, SERIES_ROLE, STATUS } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { DELETABLE_INVOICE_STATUS_IDS, INVOICE_STATUS_ID } from '@/constants/statuses';
import { INVOICE_PERMISSIONS } from '@/constants/invoicePermissions';
import { allow } from '@/constants/workflowPermissions';
import { isPartiallyCollected } from '@/lib/markCollectedForm';
import CollectedAmountCell from '@/components/invoices/list/CollectedAmountCell';

const CLOSED_INVOICE_STATUS_IDS = [
  INVOICE_STATUS_ID.COLLECTED,
  INVOICE_STATUS_ID.REJECTED,
  INVOICE_STATUS_ID.CANCELLED,
];

const isDeletable = (invoice) => DELETABLE_INVOICE_STATUS_IDS.includes(invoice.statusId);

function InvoicesTab({
  projectCode, invoices, invoicesLoading, invoiceStatusesMap, invoiceStatusColorsMap, currency, onInvoicesChanged,
}) {
  const router = useRouter();
  const t = useTranslations('invoices.tab');
  const format = useLocaleFormat();
  const { can } = usePermission();
  const toast = useToast();
  const money = (v) => formatCurrency(v, currency);
  const encoded = encodeURIComponent(projectCode);
  const canDelete = can('Invoices', 'Delete');
  const canMarkCollected = allow(can, INVOICE_PERMISSIONS.MARK_COLLECTED);

  const [tickedIds, setTickedIds] = useState(() => new Set());
  const deletableRows = useMemo(() => invoices.filter(isDeletable), [invoices]);
  const selected = useMemo(() => deletableRows.filter((i) => tickedIds.has(i.id)), [deletableRows, tickedIds]);
  const allTicked = deletableRows.length > 0 && selected.length === deletableRows.length;

  const [pendingDelete, setPendingDelete] = useState(null);
  const [collecting, setCollecting] = useState(null);

  const toggle = useCallback((id) => {
    setTickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setTickedIds(allTicked ? new Set() : new Set(deletableRows.map((i) => i.id)));
  }, [allTicked, deletableRows]);

  const handleDeleted = useCallback((deletedIds) => {
    const count = deletedIds.length;
    setPendingDelete(null);
    setTickedIds(new Set());
    toast.success(t('deleted', { count }), t('deletedBody'));
    onInvoicesChanged?.();
  }, [onInvoicesChanged, toast, t]);

  const handleCollected = useCallback(() => {
    setCollecting(null);
    onInvoicesChanged?.();
  }, [onInvoicesChanged]);

  const [historyInvoiceId, setHistoryInvoiceId] = useState(null);
  const summary = useMemo(() => {
    const totalAmount = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const pending = invoices.filter((i) => !CLOSED_INVOICE_STATUS_IDS.includes(i.statusId)).length;
    return { totalAmount, pending };
  }, [invoices]);

  const stats = useMemo(() => [
    {
      label: t('stats.invoices'),
      value: invoices.length,
      icon: FileText,
      accent: SERIES_ROLE.invoiced,
    },
    {
      label: t('stats.totalRaised'),
      value: money(summary.totalAmount),
      icon: Banknote,
      accent: SERIES_ROLE.revenue,
    },
    {
      label: t('stats.awaiting'),
      value: summary.pending,
      icon: Clock,
      accent: STATUS.warning,
      valueColor: summary.pending > 0 ? '#b07800' : undefined,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [invoices.length, summary, currency, t]);

  const columns = useMemo(() => [
    ...(canDelete ? [{
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={allTicked}
          disabled={deletableRows.length === 0}
          onChange={toggleAll}
          onClick={(e) => e.stopPropagation()}
          aria-label={t('selectAll')}
          title={t('selectHint')}
          style={{ accentColor: '#d03b3b' }}
        />
      ),
      sortable: false,
      resizable: false,
      width: 40,
      render: (_, row) => (isDeletable(row) ? (
        <input
          type="checkbox"
          checked={tickedIds.has(row.id)}
          onChange={() => toggle(row.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={t('selectOne', { name: row.invoiceNumber ?? t('thisInvoice') })}
          style={{ accentColor: '#d03b3b' }}
        />
      ) : null),
    }] : []),
    {
      key: 'invoiceNumber',
      label: t('columns.invoiceNumber'),
      render: (val) => (
        <span dir="auto" className="font-mono text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
          {val || t('pendingNumber')}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      label: t('columns.amount'),
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
          {money(val)}
        </span>
      ),
    },
    {
      key: 'collectedAmount',
      label: t('columns.collected'),
      align: 'right',
      render: (_, row) => <CollectedAmountCell invoice={row} currency={currency} />,
    },
    {
      key: 'statusId',
      label: t('columns.status'),
      sortable: false,
      render: (val) => (
        <StatusBadge status={invoiceStatusesMap[val] ?? '—'} colors={invoiceStatusColorsMap[val]} />
      ),
    },
    {
      key: 'submittedByName',
      label: t('columns.submittedBy'),
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val || '—'}</span>
      ),
    },
    {
      key: 'submissionDate',
      label: t('columns.submitted'),
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textMuted }}>{format.dateTime(val) || '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      resizable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="xs"
            icon={History}
            onClick={() => setHistoryInvoiceId(row.id)}
            title={t('revisionHistory')}
          />
          {can('System', 'Administrator') && (
            <Link href={`/projects/${encoded}/invoices/${row.id}/edit`}>
              <Button variant="ghost" size="xs" icon={Edit2} title={t('editInvoice')} />
            </Link>
          )}
          <Link href={`/invoices/${row.id}?projectCode=${encoded}`}>
            <Button variant="ghost" size="xs" icon={Eye} title={t('viewInvoice')} />
          </Link>
          {canMarkCollected && isPartiallyCollected(row) && (
            <Button
              variant="ghost"
              size="xs"
              icon={CheckCircle2}
              className="text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => setCollecting(row)}
              title={t('markCollected')}
              aria-label={t('markOne', { name: row.invoiceNumber ?? t('thisInvoice') })}
            />
          )}
          {canDelete && isDeletable(row) && (
            <Button
              variant="ghost"
              size="xs"
              icon={Trash2}
              onClick={() => setPendingDelete([row])}
              title={t('deleteInvoice')}
            />
          )}
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currency, invoiceStatusesMap, invoiceStatusColorsMap, can, canDelete, canMarkCollected, encoded, tickedIds, allTicked, deletableRows, toggle, toggleAll, t, format]);

  const actions = (
    <div className="flex items-center gap-2">
      {selected.length > 0 && (
        <Button size="sm" variant="danger" icon={Trash2} onClick={() => setPendingDelete(selected)}>
          {t('deleteSelected', { count: selected.length })}
        </Button>
      )}
      {can('Invoices', 'Create') && (
        <Link href={`/projects/${encoded}/invoices/new`}>
          <Button size="sm" icon={Plus}>{t('newRequest')}</Button>
        </Link>
      )}
    </div>
  );

  return (
    <div>
      <TabToolbar stats={stats} actions={actions} />

      <Table
        columns={columns}
        data={invoices}
        isLoading={invoicesLoading}
        rowKey="id"
        onRowClick={(row) => router.push(`/invoices/${row.id}?projectCode=${encoded}`)}
        emptyMessage={t('empty')}
      />

      <InvoiceHistoryModal
        open={historyInvoiceId != null}
        invoiceId={historyInvoiceId}
        currency={currency}
        onClose={() => setHistoryInvoiceId(null)}
      />

      {collecting && (
        <MarkCollectedDialog
          invoice={collecting}
          onClose={() => setCollecting(null)}
          onCollected={handleCollected}
        />
      )}

      {pendingDelete && (
        <DeleteInvoicesDialog
          open
          invoices={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

export default memo(InvoicesTab);
