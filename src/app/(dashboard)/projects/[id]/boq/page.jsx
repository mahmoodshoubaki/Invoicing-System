'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { Plus, Trash2, Edit2, CheckCircle, ChevronLeft, History } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import Table from '@/components/common/Table';
import { ConfirmModal } from '@/components/common/Modal';
import BOQItemHistoryModal from '@/components/boq/BOQItemHistoryModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';
import { bulkRemoveBOQItems, fetchBOQByProjectCode, removeBOQItem, selectBOQItems, selectBOQLoading, selectCurrentBOQ } from '@/store/slices/boqSlice';
import { fetchProjectById, selectSelectedProject, selectProjectsLoading } from '@/store/slices/projectsSlice';
import {
  selectBillingFrequenciesMap,
  selectBoqItemStatusesMap,
  selectBoqItemStatusColorsMap,
} from '@/store/slices/lookupsSlice';
import { useToast } from '@/hooks/useToast';

export default function ProjectBOQPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const dispatch = useDispatch();
  const project = useSelector(selectSelectedProject);
  const projectLoading = useSelector(selectProjectsLoading);
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

  const canApprove = user?.roles?.includes(ROLES.INVOICING_TEAM) || user?.roles?.includes(ROLES.ADMIN);

  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (project?.projectCode && project.id === id) {
      dispatch(fetchBOQByProjectCode(project.projectCode));
    }
  }, [dispatch, id, project?.projectCode]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(
      selected.size === boqItems.length
        ? new Set()
        : new Set(boqItems.map((i) => i.id))
    );
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

  const handleApprove = (_itemId) => {
    // TODO: dispatch approveBOQItem(_itemId) when endpoint is available
  };

  const totalCost = boqItems.reduce((s, i) => s + (i.totalCost || 0), 0);

  const columns = [
    {
      key: 'id',
      label: (
        <input
          type="checkbox"
          checked={selected.size === boqItems.length && boqItems.length > 0}
          onChange={toggleSelectAll}
          onClick={(e) => e.stopPropagation()}
          className="accent-primary"
        />
      ),
      sortable: false,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selected.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="accent-primary"
        />
      ),
    },
    {
      key: 'englishName',
      label: 'Item',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400 mt-0.5" dir="rtl">{row.arabicName}</p>
          {row.notes && (
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-50">{row.notes}</p>
          )}
        </div>
      ),
    },
    { key: 'quantity', label: 'Qty', align: 'right' },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      align: 'right',
      render: (val) => formatCurrency(val, currency),
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      align: 'right',
      render: (val) => <span className="font-semibold text-gray-800">{formatCurrency(val, currency)}</span>,
    },
    {
      key: 'statusId',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={boqStatusesMap[val] ?? String(val)} colors={boqStatusColorsMap[val]} />,
    },
    {
      key: 'expectedInvoicingDate',
      label: 'Expected Invoicing Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'billingFrequencyId',
      label: 'Billing',
      render: (val) => billingFrequenciesMap[val] ?? '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="xs"
            icon={History}
            onClick={() => setHistoryItemId(row.id)}
            title="History"
          />
          <Link href={`/projects/${id}/boq/${row.id}/edit`}>
            <Button variant="ghost" size="xs" icon={Edit2} title="Edit" />
          </Link>
          {canApprove && (
            <Button
              variant="ghost"
              size="xs"
              icon={CheckCircle}
              className="text-green-600 hover:bg-green-50"
              onClick={() => handleApprove(row.id)}
              title="Approve"
            />
          )}
          <Button
            variant="ghost"
            size="xs"
            icon={Trash2}
            className="text-red-500 hover:bg-red-50"
            onClick={() => { setDeletingId(row.id); setDeleteModal(true); }}
            title="Delete"
          />
        </div>
      ),
    },
  ];

  if (projectLoading || boqLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Project not found.</p>
        <Link href="/projects">
          <Button variant="outline" className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ConfirmModal
        open={deleteModal}
        onClose={() => { setDeleteModal(false); setDeletingId(null); }}
        onConfirm={handleDelete}
        title="Delete BOQ Item"
        message="Are you sure you want to delete this BOQ item? This action cannot be undone."
        confirmLabel="Delete Item"
        loading={saving}
      />

      <ConfirmModal
        open={bulkDeleteModal}
        onClose={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selected.size} selected item(s)? This action cannot be undone.`}
        confirmLabel={`Delete ${selected.size} Items`}
        loading={saving}
      />

      <BOQItemHistoryModal
        open={historyItemId != null}
        onClose={() => setHistoryItemId(null)}
        boqItemId={historyItemId}
      />

      <PageHeader
        title="BOQ Management"
        subtitle={`Project Code: ${project.projectCode}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: project.projectName, href: `/projects/${id}` },
          { label: 'BOQ' },
        ]}
        actions={
          <>
            <Link href={`/projects/${id}`}>
              <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
            </Link>
            <Link href={`/projects/${id}/boq/new`}>
              <Button icon={Plus}>Add Item</Button>
            </Link>
          </>
        }
      />

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 flex items-center gap-3">
          <span className="text-sm font-medium text-primary">{selected.size} item(s) selected</span>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setBulkDeleteModal(true)}>
            Delete Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}

      <Table
        columns={columns}
        data={boqItems}
        rowKey="id"
        isLoading={boqLoading}
        emptyMessage="No BOQ items yet. Click 'Add Item' to get started."
        sortable
      />

      {/* Summary Footer */}
      {boqItems.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-100 p-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Cost</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(totalCost, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Selected Items</p>
            <p className="text-lg font-bold text-primary">{selected.size} / {boqItems.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
