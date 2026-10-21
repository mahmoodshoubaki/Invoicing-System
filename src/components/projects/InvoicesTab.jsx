'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Banknote, Clock, Edit2, Eye, FileText, History, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import InvoiceHistoryModal from '@/components/invoices/InvoiceHistoryModal';
import DeleteInvoicesDialog from '@/components/invoices/DeleteInvoicesDialog';
import TabToolbar from './TabToolbar';
import { CHROME, SERIES_ROLE, STATUS } from '@/theme/vizPalette';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { DELETABLE_INVOICE_STATUS_IDS, INVOICE_STATUS } from '@/constants/statuses';
import { PENDING_LABEL } from '@/utils/invoiceDisplay';

/** Only In Progress, Rejected and Cancelled invoices can be deleted. */
const isDeletable = (invoice) => DELETABLE_INVOICE_STATUS_IDS.includes(invoice.statusId);

function InvoicesTab({
  projectCode, invoices, invoicesLoading, invoiceStatusesMap, invoiceStatusColorsMap, currency, onInvoicesChanged,
}) {
  const router = useRouter();
  const { can } = usePermission();
  const toast = useToast();
  const money = (v) => formatCurrency(v, currency);
  const encoded = encodeURIComponent(projectCode);
  const canDelete = can('Invoices', 'Delete');

  /*
   * Ticked rows, by id. Read back through the current list, so a row that left
   * (deleted, or moved out of a deletable status) quietly stops counting
   * without anything having to clean the set up.
   */
  const [tickedIds, setTickedIds] = useState(() => new Set());
  const deletableRows = useMemo(() => invoices.filter(isDeletable), [invoices]);
  const selected = useMemo(() => deletableRows.filter((i) => tickedIds.has(i.id)), [deletableRows, tickedIds]);
  const allTicked = deletableRows.length > 0 && selected.length === deletableRows.length;

  /** The invoices the delete dialog is asking about, or null when it is shut. */
  const [pendingDelete, setPendingDelete] = useState(null);

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
    toast.success(count === 1 ? 'Invoice deleted' : `${count} invoices deleted`, 'Any workflow running on them was cancelled.');
    onInvoicesChanged?.();
  }, [onInvoicesChanged, toast]);

  /**
   * Which invoice's revisions are open, or null.
   *
   * The id IS the open/closed state — one piece of state rather than a boolean
   * beside it, so the two can never disagree. The modal fetches on open and
   * clears on close, so nothing has to be reset here.
   */
  const [historyInvoiceId, setHistoryInvoiceId] = useState(null);
  const summary = useMemo(() => {
    const totalAmount = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const pending = invoices.filter((i) => {
      const label = invoiceStatusesMap[i.statusId];
      return label === INVOICE_STATUS.SUBMITTED || label === INVOICE_STATUS.UNDER_REVIEW;
    }).length;
    return { totalAmount, pending };
  }, [invoices, invoiceStatusesMap]);

  const stats = useMemo(() => [
    {
      label: 'Invoices',
      value: invoices.length,
      icon: FileText,
      accent: SERIES_ROLE.invoiced,
    },
    {
      label: 'Total raised',
      value: money(summary.totalAmount),
      icon: Banknote,
      accent: SERIES_ROLE.revenue,
    },
    {
      label: 'Awaiting action',
      value: summary.pending,
      icon: Clock,
      accent: STATUS.warning,
      valueColor: summary.pending > 0 ? '#b07800' : undefined,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [invoices.length, summary, currency]);

  const columns = useMemo(() => [
    // Ticking is for deleting, so the column exists only for those who may.
    // A row that cannot be deleted has no box rather than a disabled one.
    ...(canDelete ? [{
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={allTicked}
          disabled={deletableRows.length === 0}
          onChange={toggleAll}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select every invoice that can be deleted"
          title="Only In Progress, Rejected and Cancelled invoices can be deleted"
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
          aria-label={`Select ${row.invoiceNumber ?? 'this invoice'}`}
          style={{ accentColor: '#d03b3b' }}
        />
      ) : null),
    }] : []),
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (val) => (
        <span className="font-mono text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
          {val || PENDING_LABEL}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
          {money(val)}
        </span>
      ),
    },
    {
      key: 'statusId',
      label: 'Status',
      sortable: false,
      render: (val) => (
        <StatusBadge status={invoiceStatusesMap[val] ?? '—'} colors={invoiceStatusColorsMap[val]} />
      ),
    },
    {
      key: 'submittedByName',
      label: 'Submitted By',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val || '—'}</span>
      ),
    },
    {
      key: 'submissionDate',
      label: 'Submitted',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textMuted }}>{formatDateTime(val) || '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      resizable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          {/* Every past revision of this invoice — the same timeline the
              invoice page shows, without leaving the project. */}
          <Button
            variant="ghost"
            size="xs"
            icon={History}
            onClick={() => setHistoryInvoiceId(row.id)}
            title="Revision history"
          />
          {can('Invoices', 'Update') && (
            <Link href={`/projects/${encoded}/invoices/${row.id}/edit`}>
              <Button variant="ghost" size="xs" icon={Edit2} title="Edit invoice" />
            </Link>
          )}
          <Link href={`/invoices/${row.id}?projectCode=${encoded}`}>
            <Button variant="ghost" size="xs" icon={Eye} title="View invoice" />
          </Link>
          {canDelete && isDeletable(row) && (
            <Button
              variant="ghost"
              size="xs"
              icon={Trash2}
              onClick={() => setPendingDelete([row])}
              title="Delete invoice"
            />
          )}
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currency, invoiceStatusesMap, invoiceStatusColorsMap, can, canDelete, encoded, tickedIds, allTicked, deletableRows, toggle, toggleAll]);

  const actions = (
    <div className="flex items-center gap-2">
      {selected.length > 0 && (
        <Button size="sm" variant="danger" icon={Trash2} onClick={() => setPendingDelete(selected)}>
          Delete {selected.length} selected
        </Button>
      )}
      {can('Invoices', 'Create') && (
        <Link href={`/projects/${encoded}/invoices/new`}>
          <Button size="sm" icon={Plus}>New invoice request</Button>
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
        emptyMessage="No invoice requests have been raised for this project yet."
      />

      <InvoiceHistoryModal
        open={historyInvoiceId != null}
        invoiceId={historyInvoiceId}
        currency={currency}
        onClose={() => setHistoryInvoiceId(null)}
      />

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
