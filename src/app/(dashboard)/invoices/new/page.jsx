'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Check, CheckSquare, Square, AlertCircle } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { Input, Select, Textarea } from '@/components/forms/FormField';
import { StatusBadge } from '@/components/common/Badge';
import { ConfirmModal } from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { mockProjects } from '@/mock/projects';
import { mockBOQItems } from '@/mock/boq';
import { mockInvoices } from '@/mock/invoices';
import { INVOICE_STATUS } from '@/constants/statuses';
import { formatCurrency } from '@/utils/formatters';

// Statuses that count as "already committed" quantity (excluding DRAFT and REJECTED)
const COMMITTED_STATUSES = new Set([
  INVOICE_STATUS.SUBMITTED,
  INVOICE_STATUS.UNDER_REVIEW,
  INVOICE_STATUS.APPROVED,
  INVOICE_STATUS.DELAYED,
]);

function getCommittedQty(boqItemId) {
  return mockInvoices
    .filter((inv) => COMMITTED_STATUSES.has(inv.status) && inv.boqItemIds?.includes(boqItemId))
    .reduce((sum, inv) => sum + (inv.boqItemQuantities?.[boqItemId] ?? 0), 0);
}

const INITIAL_FORM = {
  // boqLineItems: { [boqItemId]: { quantity: '' } }
  boqLineItems: {},
  invoiceAmount: '',
  revenue: '',
  wip: '',
  reason: '',
  expectedDate: '',
  comments: '',
};

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get('projectId') || '';

  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const project = mockProjects.find((p) => p.id === selectedProjectId);
  const projectBOQItems = selectedProjectId
    ? mockBOQItems.filter((b) => b.projectId === selectedProjectId)
    : [];

  // Recompute invoice amount whenever any line item quantity changes
  const boqLineItemsKey = JSON.stringify(form.boqLineItems);
  useEffect(() => {
    const entries = Object.entries(form.boqLineItems);
    if (entries.length === 0) {
      setForm((prev) => ({ ...prev, invoiceAmount: '', revenue: '', wip: '' }));
      return;
    }
    const total = entries.reduce((sum, [id, { quantity }]) => {
      const boq = mockBOQItems.find((b) => b.id === id);
      return sum + (boq?.unitCost ?? 0) * (Number(quantity) || 0);
    }, 0);
    setForm((prev) => ({
      ...prev,
      invoiceAmount: total > 0 ? String(total) : '',
      revenue: total > 0 ? String(total) : '',
      wip: total > 0 ? '0' : '',
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boqLineItemsKey]);

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setForm((prev) => ({ ...prev, boqLineItems: {}, invoiceAmount: '', revenue: '', wip: '' }));
    setErrors((prev) => { const n = { ...prev }; delete n.projectId; return n; });
  };

  const toggleBOQItem = (boqId) => {
    setForm((prev) => {
      const next = { ...prev.boqLineItems };
      if (next[boqId]) {
        delete next[boqId];
      } else {
        next[boqId] = { quantity: '' };
      }
      return { ...prev, boqLineItems: next };
    });
    setErrors((prev) => {
      const n = { ...prev };
      delete n.boqLineItems;
      delete n[`qty_${boqId}`];
      return n;
    });
  };

  const setLineQty = (boqId, qty) => {
    setForm((prev) => ({
      ...prev,
      boqLineItems: { ...prev.boqLineItems, [boqId]: { quantity: qty } },
    }));
    setErrors((prev) => { const n = { ...prev }; delete n[`qty_${boqId}`]; return n; });
  };

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!selectedProjectId) e.projectId = 'Please select a project';

    const lineEntries = Object.entries(form.boqLineItems);
    if (lineEntries.length === 0) {
      e.boqLineItems = 'Select at least one BOQ item';
    } else {
      lineEntries.forEach(([id, { quantity }]) => {
        const boq = mockBOQItems.find((b) => b.id === id);
        if (!boq) return;
        const qty = Number(quantity);
        const committed = getCommittedQty(id);
        const available = boq.quantity - committed;

        if (!quantity || isNaN(qty) || qty <= 0) {
          e[`qty_${id}`] = 'Enter a quantity greater than 0';
        } else if (!Number.isInteger(qty)) {
          e[`qty_${id}`] = 'Quantity must be a whole number';
        } else if (qty > available) {
          e[`qty_${id}`] = `Only ${available} unit${available !== 1 ? 's' : ''} available (${committed} already committed)`;
        }
      });
    }

    if (!form.invoiceAmount || isNaN(Number(form.invoiceAmount)) || Number(form.invoiceAmount) <= 0) {
      e.invoiceAmount = 'Valid invoice amount is required';
    }
    if (!form.reason.trim()) e.reason = 'Reason / milestone description is required';
    if (!form.expectedDate) e.expectedDate = 'Expected date is required';
    return e;
  };

  const handleSubmitClick = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setConfirmOpen(false);
      setShowToast(true);
      setTimeout(() => router.push(urlProjectId ? `/projects/${urlProjectId}` : '/invoices'), 1200);
    }, 600);
  };

  const selectedIds = Object.keys(form.boqLineItems);
  const grandTotal = selectedIds.reduce((sum, id) => {
    const boq = mockBOQItems.find((b) => b.id === id);
    return sum + (boq?.unitCost ?? 0) * (Number(form.boqLineItems[id]?.quantity) || 0);
  }, 0);

  const showDelayReason = selectedIds.some((id) => {
    const boq = mockBOQItems.find((b) => b.id === id);
    return boq && ['Delayed', 'Pending Verification'].includes(boq.status);
  });

  const backHref = urlProjectId ? `/projects/${urlProjectId}` : '/invoices';

  return (
    <div>
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check size={16} />
          Invoice request submitted successfully!
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit Invoice Request"
        message={`Submit invoice request for ${formatCurrency(Number(form.invoiceAmount))}? This will be sent for review.`}
        confirmLabel="Submit Request"
        confirmVariant="primary"
        loading={saving}
      />

      <PageHeader
        title="New Invoice Request"
        subtitle={
          project
            ? `${project.contractName} · ${project.contractNumber}`
            : 'Create a new invoice request'
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          ...(urlProjectId && project
            ? [
                { label: 'Projects', href: '/projects' },
                { label: project.contractName, href: `/projects/${urlProjectId}` },
              ]
            : [{ label: 'Invoice Requests', href: '/invoices' }]),
          { label: 'New Request' },
        ]}
        actions={
          <Link href={backHref}>
            <Button variant="outline" icon={ChevronLeft} size="sm">Back</Button>
          </Link>
        }
      />

      <div className="max-w-3xl flex flex-col gap-6">
        {/* Project — read-only when navigating from project page, dropdown otherwise */}
        {urlProjectId && project ? (
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-3 pb-3 border-b border-gray-100">
              Project
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{project.contractName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {project.contractNumber} · {project.clientName}
                </p>
              </div>
              <Link href={`/projects/${urlProjectId}`}>
                <Button variant="ghost" size="xs">View Project</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
              Project
            </h2>
            <Select
              label="Project"
              required
              placeholder="Select a project"
              value={selectedProjectId}
              onChange={handleProjectChange}
              error={errors.projectId}
              options={mockProjects.map((p) => ({ value: p.id, label: p.contractName }))}
            />
          </Card>
        )}

        {/* BOQ line-item selection */}
        {selectedProjectId && (
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-1 pb-3 border-b border-gray-100">
              BOQ Items
            </h2>

            {projectBOQItems.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                No BOQ items found for this project.
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-500 pt-3 mb-3">
                  Select one or more items, then enter the quantity to invoice for each
                </p>

                <div className="flex flex-col border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
                  {projectBOQItems.map((boq) => {
                    const isSelected = !!form.boqLineItems[boq.id];
                    const committed = getCommittedQty(boq.id);
                    const available = boq.quantity - committed;
                    const fullyCommitted = available <= 0;
                    const lineQty = Number(form.boqLineItems[boq.id]?.quantity) || 0;
                    const lineTotal = boq.unitCost * lineQty;
                    const qtyError = errors[`qty_${boq.id}`];

                    return (
                      <div key={boq.id} className={isSelected ? 'bg-blue-50' : 'bg-white'}>
                        {/* Toggle row */}
                        <button
                          type="button"
                          onClick={() => !fullyCommitted && toggleBOQItem(boq.id)}
                          disabled={fullyCommitted}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                            ${fullyCommitted
                              ? 'opacity-50 cursor-not-allowed'
                              : isSelected
                              ? 'hover:bg-blue-100'
                              : 'hover:bg-gray-50'
                            }`}
                        >
                          <div className={`shrink-0 ${isSelected ? 'text-primary' : 'text-gray-300'}`}>
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{boq.englishItem}</p>
                            {boq.arabicItem && (
                              <p className="text-xs text-gray-400 truncate" dir="rtl">{boq.arabicItem}</p>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {fullyCommitted && (
                              <span className="text-xs text-amber-600 font-medium whitespace-nowrap">Fully committed</span>
                            )}
                            <StatusBadge status={boq.status} size="sm" />
                            <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
                              {boq.billingFrequency}
                            </span>
                            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                              {formatCurrency(boq.unitCost)}/unit
                            </span>
                          </div>
                        </button>

                        {/* Expanded detail + quantity input */}
                        {isSelected && (
                          <div className="px-4 pb-4 border-t border-blue-100">
                            {/* Item stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 text-xs">
                              <div>
                                <p className="text-gray-400 uppercase tracking-wide">Total Qty</p>
                                <p className="font-semibold text-gray-700 mt-0.5">{boq.quantity} units</p>
                              </div>
                              <div>
                                <p className="text-gray-400 uppercase tracking-wide">Unit Cost</p>
                                <p className="font-semibold text-gray-700 mt-0.5">{formatCurrency(boq.unitCost)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 uppercase tracking-wide">Committed</p>
                                <p className={`font-semibold mt-0.5 ${committed > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                                  {committed} units
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 uppercase tracking-wide">Available</p>
                                <p className={`font-semibold mt-0.5 ${available <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                                  {available} units
                                </p>
                              </div>
                            </div>

                            {/* Quantity input + line total */}
                            <div className="flex items-start gap-4">
                              <div className="w-44">
                                <Input
                                  label={`Invoice Quantity (max ${available})`}
                                  type="number"
                                  min="1"
                                  max={available}
                                  step="1"
                                  placeholder="0"
                                  value={form.boqLineItems[boq.id]?.quantity ?? ''}
                                  onChange={(e) => setLineQty(boq.id, e.target.value)}
                                  error={qtyError}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              {lineQty > 0 && (
                                <div className="mt-6 flex flex-col gap-0.5">
                                  <p className="text-xs text-gray-400">Line Total</p>
                                  <p className="text-base font-bold text-primary">{formatCurrency(lineTotal)}</p>
                                  <p className="text-xs text-gray-400">
                                    {lineQty} × {formatCurrency(boq.unitCost)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {qtyError && !form.boqLineItems[boq.id]?.quantity && (
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-red-500">
                                <AlertCircle size={12} />
                                {qtyError}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {errors.boqLineItems && (
                  <p className="text-xs text-red-500 mt-2">{errors.boqLineItems}</p>
                )}

                {selectedIds.length > 0 && (
                  <div className="mt-3 flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-blue-700">
                      {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-sm font-bold text-blue-800">
                      Grand Total: {formatCurrency(grandTotal)}
                    </span>
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* Invoice Details */}
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice Amount (SAR)"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.invoiceAmount}
              onChange={set('invoiceAmount')}
              error={errors.invoiceAmount}
              hint={selectedIds.length > 0 ? 'Auto-calculated · you may adjust if needed' : undefined}
            />
            <Input
              label="Expected Invoice Date"
              required
              type="date"
              value={form.expectedDate}
              onChange={set('expectedDate')}
              error={errors.expectedDate}
            />
            <Input
              label="Revenue (SAR)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.revenue}
              onChange={set('revenue')}
            />
            <Input
              label="WIP (SAR)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.wip}
              onChange={set('wip')}
            />
          </div>
        </Card>

        {/* Reason & Comments */}
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Reason & Comments
          </h2>
          <div className="flex flex-col gap-4">
            <Textarea
              label="Reason / Milestone Description"
              required
              rows={3}
              placeholder="Describe the milestone or deliverable that justifies this invoice..."
              value={form.reason}
              onChange={set('reason')}
              error={errors.reason}
            />

            {showDelayReason && (
              <Textarea
                label="Reason for Delay"
                rows={2}
                placeholder="Explain the cause of delay..."
                value={form.delayReason ?? ''}
                onChange={set('delayReason')}
                hint="Required for items with delayed or pending verification status"
              />
            )}

            <Textarea
              label="Additional Comments"
              rows={3}
              placeholder="Any additional notes or context..."
              value={form.comments}
              onChange={set('comments')}
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href={backHref}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSubmitClick} loading={saving}>
            Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    }>
      <NewInvoiceForm />
    </Suspense>
  );
}
