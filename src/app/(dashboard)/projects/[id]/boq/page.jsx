'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  Banknote, CheckCircle, ChevronLeft, Edit2, Eye, FileDiff, History, LayoutList, Plus, Trash2, X,
} from 'lucide-react';

import SubPageHeader from '@/components/common/SubPageHeader';
import TabToolbar from '@/components/projects/TabToolbar';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import Table from '@/components/common/Table';
import { ConfirmModal } from '@/components/common/Modal';
import BOQItemHistoryModal from '@/components/boq/BOQItemHistoryModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { CHROME, SERIES_ROLE, STATUS } from '@/theme/vizPalette';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { waitingOnText } from '@/lib/waitingOn';
import { usePermission } from '@/hooks/usePermission';
import { ROUTES } from '@/constants/routes';
import {
  bulkRemoveBOQItems, fetchBOQByProjectCode, removeBOQItem,
  selectBOQItems, selectBOQLoading, selectCurrentBOQ,
} from '@/store/slices/boqSlice';
import { fetchMainProjectDetails, selectMainProjectDetails, selectMainDetailsLoading } from '@/store/slices/projectsSlice';
import {
  selectBillingFrequenciesMap, selectBoqItemStatusesMap, selectBoqItemStatusColorsMap,
} from '@/store/slices/lookupsSlice';
import { useToast } from '@/hooks/useToast';

export default function ProjectBOQPage() {
  // The route param is the project code — client-side navigations don't
  // decode %2F etc. back out of the segment the way SSR does, so decode it
  // ourselves. Safe either way: an already-decoded value passes through
  // decodeURIComponent unchanged.
  const { id: rawId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const encoded = encodeURIComponent(projectCode);
  const { can } = usePermission();
  const toast = useToast();

  const dispatch = useDispatch();
  const project = useSelector(selectMainProjectDetails);
  const projectLoading = useSelector(selectMainDetailsLoading);
  const currentBOQ = useSelector(selectCurrentBOQ);
  const boqItems = useSelector(selectBOQItems);
  const boqLoading = useSelector(selectBOQLoading);
  const currency = useSelector((s) => s.ui.currency);
  const billingFrequenciesMap = useSelector(selectBillingFrequenciesMap);
  const boqStatusesMap = useSelector(selectBoqItemStatusesMap);
  const boqStatusColorsMap = useSelector(selectBoqItemStatusColorsMap);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyItemId, setHistoryItemId] = useState(null);

  const canCreate = can('Boqs', 'Create');
  const canUpdate = can('Boqs', 'Update');
  const canDelete = can('Boqs', 'Delete');
  const money = (v) => formatCurrency(v, currency);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(selected.size === boqItems.length ? new Set() : new Set(boqItems.map((i) => i.id)));
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      await dispatch(removeBOQItem({ id: deletingId, boqId: currentBOQ?.id })).unwrap();
      setDeleteModal(false);
      setDeletingId(null);
      toast.success('BOQ item deleted', 'The item was deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete BOQ item', err ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    setSaving(true);
    try {
      const count = selected.size;
      await dispatch(bulkRemoveBOQItems({ ids: Array.from(selected), boqId: currentBOQ?.id })).unwrap();
      setSelected(new Set());
      setBulkDeleteModal(false);
      toast.success('BOQ items deleted', `${count} item(s) were deleted successfully.`);
    } catch (err) {
      toast.error('Failed to delete BOQ items', err ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalCost = boqItems.reduce((s, i) => s + (i.totalCost || 0), 0);

  const stats = useMemo(() => [
    { label: 'BOQ items', value: boqItems.length, icon: LayoutList, accent: SERIES_ROLE.wip },
    { label: 'Total value', value: money(totalCost), icon: Banknote, accent: SERIES_ROLE.revenue },
    {
      label: 'Selected',
      value: `${selected.size} / ${boqItems.length}`,
      icon: CheckCircle,
      accent: selected.size > 0 ? STATUS.good : STATUS.neutral,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [boqItems.length, totalCost, selected.size, currency]);

  const breadcrumbs = useMemo(() => [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: project?.contractName ?? projectCode, href: `/projects/${encoded}` },
    { label: 'BOQ' },
  ], [project?.contractName, projectCode, encoded]);

  const columns = useMemo(() => [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selected.size === boqItems.length && boqItems.length > 0}
          onChange={toggleSelectAll}
          onClick={(e) => e.stopPropagation()}
          className="accent-[#f8485e]"
          aria-label="Select all BOQ items"
        />
      ),
      sortable: false,
      resizable: false,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selected.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="accent-[#f8485e]"
          aria-label={`Select ${row.englishName}`}
        />
      ),
    },
    {
      key: 'englishName',
      label: 'Item',
      render: (val, row) => (
        <div className="min-w-0 max-w-xs">
          {/* The name opens the item. Read-only, so it is offered to everyone
              who can see the list rather than only to whoever may edit. */}
          <Link
            href={ROUTES.PROJECT_BOQ_ITEM(encoded, row.id)}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold leading-tight underline-offset-2 hover:underline"
            style={{ color: CHROME.textPrimary }}
          >
            {val}
          </Link>
          {row.arabicName && (
            <p className="mt-0.5 truncate text-xs" dir="rtl" style={{ color: CHROME.textMuted }}>{row.arabicName}</p>
          )}
          {row.notes && (
            <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>{row.notes}</p>
          )}
        </div>
      ),
    },
    { key: 'quantity', label: 'Qty', align: 'center' },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      align: 'right',
      render: (val) => <span className="text-sm tabular-nums">{money(val)}</span>,
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>{money(val)}</span>
      ),
    },
    {
      key: 'statusId',
      label: 'Status',
      sortable: false,
      // Who its workflow is waiting on, under the status (2026-10-21) — on every item row.
      render: (val, row) => {
        const waiting = waitingOnText(row.waitingOn);
        return (
          <div className="flex min-w-0 flex-col items-start gap-1">
            <StatusBadge status={boqStatusesMap[val] ?? String(val)} colors={boqStatusColorsMap[val]} />
            {waiting && (
              <span className="max-w-[14rem] truncate text-[11px]" style={{ color: CHROME.textMuted }} title={`Waiting on: ${waiting}`}>
                Waiting on: {waiting}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'expectedInvoicingDate',
      label: 'Expected Date',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>{formatDate(val) || '—'}</span>
      ),
    },
    {
      key: 'billingFrequencyId',
      label: 'Billing',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>{billingFrequenciesMap[val] ?? '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      resizable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Link href={ROUTES.PROJECT_BOQ_ITEM(encoded, row.id)}>
            <Button variant="ghost" size="xs" icon={Eye} title="View" />
          </Link>
          <Button variant="ghost" size="xs" icon={History} onClick={() => setHistoryItemId(row.id)} title="History" />
          {canUpdate && (
            <Link href={`/projects/${encoded}/boq/${row.id}/edit`}>
              <Button variant="ghost" size="xs" icon={Edit2} title="Edit" />
            </Link>
          )}
          {/* No per-row Approve: approving BOQ items is moving to a workflow run
              over the selected items (parked — see WORKFLOW-PLAN.md,
              "Parked feature — BOQ items approval"). The button here was a stub. */}
          {canDelete && (
            <Button
              variant="ghost" size="xs" icon={Trash2}
              className="text-red-500 hover:bg-red-50"
              onClick={() => { setDeletingId(row.id); setDeleteModal(true); }}
              title="Delete"
            />
          )}
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [selected, boqItems.length, currency, boqStatusesMap, boqStatusColorsMap, billingFrequenciesMap, canUpdate, canDelete, encoded]);

  if (projectLoading || boqLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: CHROME.textMuted }}>Project not found.</p>
        <Link href="/projects">
          <Button variant="outline" className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div>
        <ConfirmModal
          open={deleteModal}
          onClose={() => { setDeleteModal(false); setDeletingId(null); }}
          onConfirm={handleDelete}
          title="Delete BOQ Item"
          message="Are you sure you want to delete this BOQ item? This action cannot be undone. An item that any invoice points at, or that is waiting for approval, cannot be deleted."
          confirmLabel="Delete Item"
          loading={saving}
        />

        <ConfirmModal
          open={bulkDeleteModal}
          onClose={() => setBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
          title="Delete Selected Items"
          message={`Are you sure you want to delete ${selected.size} selected item(s)? This action cannot be undone. It is all or nothing: if any item has an invoice or is waiting for approval, none are deleted and the message names them.`}
          confirmLabel={`Delete ${selected.size} Items`}
          loading={saving}
        />

        <BOQItemHistoryModal
          open={historyItemId != null}
          onClose={() => setHistoryItemId(null)}
          boqItemId={historyItemId}
        />

        <SubPageHeader
          eyebrow="Bill of Quantities"
          title={project.contractName ?? projectCode}
          subtitle={`Project code ${projectCode}`}
          icon={LayoutList}
          breadcrumbs={breadcrumbs}
          actions={
            <>
              <Link href={`/projects/${encoded}`}>
                <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
              </Link>
              {/* A formal change to the approved BOQ, decided by an approver (2026-10-18). */}
              {can('ChangeRequests', 'Create') && (
                <Link href={ROUTES.PROJECT_CHANGE_REQUEST_NEW(encoded)}>
                  <Button variant="outline" icon={FileDiff} size="sm">New change request</Button>
                </Link>
              )}
              {canCreate && (
                <Link href={`/projects/${encoded}/boq/new`}>
                  <Button icon={Plus} size="sm">Add item</Button>
                </Link>
              )}
            </>
          }
        />

        <TabToolbar stats={stats} />

        {/* Bulk action bar — slides in only when a selection exists */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#f8485e]/25 bg-[#f8485e]/6 px-4 py-3">
                <span className="text-sm font-semibold text-[#d9304a]">
                  {selected.size} item{selected.size !== 1 ? 's' : ''} selected
                </span>
                <div className="ml-auto flex items-center gap-2">
                  {canDelete && (
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => setBulkDeleteModal(true)}>
                      Delete selected
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon={X} onClick={() => setSelected(new Set())}>
                    Clear
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Table
          columns={columns}
          data={boqItems}
          rowKey="id"
          isLoading={boqLoading}
          emptyMessage="No BOQ items yet — use “Add item” to get started."
          sortable
        />
      </div>
    </MotionConfig>
  );
}
