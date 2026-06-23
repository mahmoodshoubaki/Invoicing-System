'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Edit2, CheckCircle, ChevronLeft, Check } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import { ConfirmModal } from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { mockBOQItems } from '@/mock/boq';
import { mockProjects } from '@/mock/projects';
import { BOQ_STATUS } from '@/constants/statuses';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

export default function ProjectBOQPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const canApprove = user?.roles?.includes(ROLES.INVOICING_TEAM) || user?.roles?.includes(ROLES.ADMIN);

  useEffect(() => {
    const timer = setTimeout(() => {
      const proj = mockProjects.find((p) => p.id === projectId);
      setProject(proj || null);
      setItems(mockBOQItems.filter((b) => b.projectId === projectId));
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [projectId]);

  const showToastMsg = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleDelete = () => {
    setSaving(true);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== deletingId));
      setSaving(false);
      setDeleteModal(false);
      setDeletingId(null);
      showToastMsg('BOQ item deleted');
    }, 400);
  };

  const handleBulkDelete = () => {
    setSaving(true);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => !selected.has(i.id)));
      setSelected(new Set());
      setSaving(false);
      setBulkDeleteModal(false);
      showToastMsg(`${selected.size} item(s) deleted`);
    }, 400);
  };

  const handleApprove = (itemId) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: BOQ_STATUS.APPROVED } : i))
    );
    showToastMsg('Item approved');
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i.id)));
  };

  const totalCost = items.reduce((s, i) => s + (i.totalCost || 0), 0);
  const totalInvoiced = items
    .filter((i) => i.status === BOQ_STATUS.INVOICED)
    .reduce((s, i) => s + (i.totalCost || 0), 0);
  const totalVAT = items.reduce((s, i) => s + (i.vatSAR || 0), 0);

  if (isLoading) {
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
        <Link href="/boq">
          <Button variant="outline" className="mt-4">Back to BOQ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check size={16} />
          {toastMessage}
        </div>
      )}

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

      <PageHeader
        title="BOQ Management"
        subtitle={project.contractName}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'BOQ', href: '/boq' },
          { label: project.contractName },
        ]}
        actions={
          <>
            <Link href="/boq">
              <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
            </Link>
            <Link href={`/boq/${projectId}/new`}>
              <Button icon={Plus}>Add Item</Button>
            </Link>
          </>
        }
      />

      {/* Project Summary */}
      <Card className="mb-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Client</p>
            <p className="font-semibold text-gray-800">{project.clientName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Contract #</p>
            <p className="font-mono text-gray-700">{project.contractNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Project Value</p>
            <p className="font-semibold text-primary">{formatCurrency(project.projectValue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Status</p>
            <StatusBadge status={project.status} />
          </div>
        </div>
      </Card>

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

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                  className="accent-primary"
                />
              </th>
              <th className="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Cost</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Cost</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">VAT (SAR)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Approved Invoices</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expected Invoicing Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Billing</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-gray-400">
                  No BOQ items yet. Click "Add Item" to get started.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={`transition-colors hover:bg-gray-50/60 ${selected.has(item.id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{item.englishItem}</p>
                    <p className="text-xs text-gray-400 mt-0.5" dir="rtl">{item.arabicItem}</p>
                    {item.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{item.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.unitCost)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(item.totalCost)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.vatSAR)}</td>
                  <td className="px-4 py-3">{formatNumber(item.approvedInvoices)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(item.expectedInvoicingDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{item.billingFrequency}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/boq/${projectId}/${item.id}/edit`}>
                        <Button variant="ghost" size="xs" icon={Edit2} title="Edit" />
                      </Link>
                      {canApprove && item.status !== BOQ_STATUS.APPROVED && item.status !== BOQ_STATUS.INVOICED && (
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={CheckCircle}
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => handleApprove(item.id)}
                          title="Approve"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Trash2}
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => { setDeletingId(item.id); setDeleteModal(true); }}
                        title="Delete"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      {items.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-100 p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Cost</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(totalCost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Cost with VAT</p>
            <p className="text-lg font-bold text-gray-700">{formatCurrency(totalVAT + totalCost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Invoiced</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(totalInvoiced)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
