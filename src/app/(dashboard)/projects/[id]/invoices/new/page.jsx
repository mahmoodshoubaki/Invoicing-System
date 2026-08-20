'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { ChevronLeft, CheckSquare, Square } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Input, DatePicker } from '@/components/forms/FormField';
import { ConfirmModal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/Badge';
import VarianceBadge from '@/components/common/VarianceBadge';
import AttachmentUploader from '@/components/invoices/AttachmentUploader';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import {
  fetchMainProjectDetails, selectMainProjectDetails, selectMainDetailsLoading,
  fetchSubProjectsSummary, selectSubProjects,
} from '@/store/slices/projectsSlice';
import { aggregateSubProjectFinancials } from '@/models/project';
import {
  createInvoice,
  fetchInvoiceableBOQItems,
  clearInvoiceableBOQItems,
  selectInvoiceableBOQItems,
  selectInvoiceableBOQItemsLoading,
} from '@/store/slices/invoicesSlice';
import {
  selectBillingFrequenciesMap,
  selectTrackerCycleStatusesMap,
  selectTrackerCycleStatusColorsMap,
} from '@/store/slices/lookupsSlice';

const INITIAL_FORM = {
  // boqLineItems: { [boqItemId]: { quantity: '' } }
  boqLineItems: {},
  invoiceNumber: '',
  vat: '0.15',
  baselineCollectionDate: '',
};

export default function NewInvoicePage() {
  // See projects/[id]/boq/page.jsx for why this is decoded defensively.
  const { id: rawId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const toast = useToast();

  const currency = useSelector((s) => s.ui.currency);
  const project = useSelector(selectMainProjectDetails);
  const projectLoading = useSelector(selectMainDetailsLoading);
  const subProjects = useSelector(selectSubProjects);
  const boqItems = useSelector(selectInvoiceableBOQItems);
  const boqItemsLoading = useSelector(selectInvoiceableBOQItemsLoading);
  const billingFrequenciesMap = useSelector(selectBillingFrequenciesMap);
  const trackerCycleStatusesMap = useSelector(selectTrackerCycleStatusesMap);
  const trackerCycleStatusColorsMap = useSelector(selectTrackerCycleStatusColorsMap);

  // Same source as the project card's Financial Summary — shown here as
  // reference context while filling out an invoice, not fed into the
  // invoice's own Revenue/WIP fields below (project-to-date totals aren't
  // this invoice's revenue/WIP contribution).
  const projectFinancials = aggregateSubProjectFinancials(subProjects);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
  }, [dispatch, projectCode]);

  // Checked off the resolved fetch result (not the isLoading selector) so
  // there's no race with isLoading's initial `false` value on first render.
  useEffect(() => {
    dispatch(fetchInvoiceableBOQItems(projectCode))
      .unwrap()
      .then((items) => {
        if (items.length === 0) {
          toast.warning(
            'No invoiceable BOQ items',
            "This project has no invoiceable BOQ items, so an invoice request can't be created. Taking you back in a few seconds."
          );
          setRedirecting(true);
        }
      })
      .catch(() => {});
  }, [dispatch, projectCode]);

  useEffect(() => {
    if (!redirecting) return;
    if (!redirecting) return;
    const timer = setTimeout(() => router.back(), 10000);
    return () => clearTimeout(timer);
  }, [redirecting, router]);

  useEffect(() => {
    return () => { dispatch(clearInvoiceableBOQItems()); };
  }, [dispatch]);

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

    const lineEntries = Object.entries(form.boqLineItems);
    if (lineEntries.length === 0) {
      e.boqLineItems = 'Select at least one BOQ item';
    } else {
      lineEntries.forEach(([itemId, { quantity }]) => {
        const boq = boqItems.find((b) => String(b.id) === itemId);
        if (!boq) return;
        const qty = Number(quantity);
        const available = boq.availableQuantity;

        if (!quantity || isNaN(qty) || qty <= 0) {
          e[`qty_${itemId}`] = 'Enter a quantity greater than 0';
        }  else if (qty > available) {
          e[`qty_${itemId}`] = `Only ${available} unit${available !== 1 ? 's' : ''} available (${boq.committedQuantity} already committed)`;
        }
      });
    }

    if (!form.invoiceNumber.trim()) e.invoiceNumber = 'Invoice number is required';
    // if (form.vat === '' || isNaN(Number(form.vat)) || Number(form.vat) < 0) {
    //   e.vat = 'Valid VAT rate is required';
    // }
    if (!form.baselineCollectionDate) e.baselineCollectionDate = 'Baseline Expected collection date is required';
    return e;
  };

  const handleSubmitClick = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setSaving(true);
    try {
      const lines = selectedIds.map((itemId) => {
        const boq = boqItems.find((b) => String(b.id) === itemId);
        return {
          boqItemId: boq.id,
          quantity: Number(form.boqLineItems[itemId]?.quantity) || 0,
          billedUnitPrice: boq.unitCost,
          itemTitleArSnapshot: boq.arabicName,
          itemTitleEnSnapshot: boq.englishName,
          itemDescriptionSnapshot: boq.notes,
        };
      });

      await dispatch(createInvoice({
        invoiceNumber: form.invoiceNumber,
        projectCode,
        wip: projectFinancials.wip,
        revenue: projectFinancials.totalRevenue,
        submittedBy: user?.username ?? null,
        baselineCollectionDate: form.baselineCollectionDate,
        lines,
        // Anything still uploading is already blocked by the disabled
        // submit button below, so every entry here is ready to send.
        // `file` (a raw File object) is genuinely non-serializable — the
        // store is configured to allow that specifically for this field,
        // see store/index.js.
        attachments,
      })).unwrap();

      setConfirmOpen(false);
      toast.success('Invoice request submitted', 'The invoice request was created successfully.');
      router.push(`/projects/${encodeURIComponent(projectCode)}`);
    } catch (err) {
      toast.error('Failed to submit invoice request', err ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selectedIds = Object.keys(form.boqLineItems);
  const grandTotal = selectedIds.reduce((sum, itemId) => {
    const boq = boqItems.find((b) => String(b.id) === itemId);
    return sum + (boq?.unitCost ?? 0) * (Number(form.boqLineItems[itemId]?.quantity) || 0);
  }, 0);
  const attachmentsUploading = attachments.some((a) => a.status === 'uploading');

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit Invoice Request"
        message={`Submit invoice request for ${formatCurrency(grandTotal, currency)}? This will be sent for review.`}
        confirmLabel="Submit Request"
        confirmVariant="primary"
        loading={saving}
      />

      <PageHeader
        title="New Invoice Request"
        subtitle={`${project.contractName} · ${projectCode}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: project.contractName, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: 'New Request' },
        ]}
        actions={
          <Link href={`/projects/${encodeURIComponent(projectCode)}`}>
            <Button variant="outline" icon={ChevronLeft} size="sm">Back</Button>
          </Link>
        }
      />

      <div className="max-w-3xl flex flex-col gap-6">
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-3 pb-3 border-b border-gray-100">
            Project
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">{project.contractName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {projectCode}
              </p>
            </div>
            <Link href={`/projects/${encodeURIComponent(projectCode)}`}>
              <Button variant="ghost" size="xs">View Project</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Project Revenue</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {formatCurrency(projectFinancials.totalRevenue, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Project WIP</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {formatCurrency(projectFinancials.wip, currency)}
              </p>
            </div>
          </div>
        </Card>

        {/* BOQ line-item selection */}
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-1 pb-3 border-b border-gray-100">
            BOQ Items
          </h2>

          {boqItemsLoading ? (
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : boqItems.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-500">
                No invoiceable BOQ items found for this project — an invoice request can't be created.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Taking you back automatically in a few seconds...
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 pt-3 mb-3">
                Select one or more items, then enter the quantity to invoice for each
              </p>

              <div className="flex flex-col border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
                {boqItems.map((boq) => {
                  const isSelected = !!form.boqLineItems[boq.id];
                  const available = boq.availableQuantity;
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
                          <p className="text-sm font-medium text-gray-800 truncate">{boq.englishName}</p>
                          {boq.arabicName && (
                            <p className="text-xs text-gray-400 truncate" dir="rtl">{boq.arabicName}</p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {fullyCommitted && (
                            <span className="text-xs text-amber-600 font-medium whitespace-nowrap">Fully committed</span>
                          )}
                          {boq.trackerCycleNumber != null && (
                            <span className="hidden md:flex items-center gap-1.5" title={`Next cycle: ${boq.trackerCycleNumber}`}>
                              <StatusBadge
                                status={trackerCycleStatusesMap[boq.trackerCycleStatusId] ?? '—'}
                                colors={trackerCycleStatusColorsMap[boq.trackerCycleStatusId]}
                                size="sm"
                              />
                              <VarianceBadge days={boq.varianceDays} size="sm" />
                            </span>
                          )}
                          <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
                            {billingFrequenciesMap[boq.billingFrequencyId] ?? '—'}
                          </span>
                          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                            {formatCurrency(boq.unitCost, currency)}/unit
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
                              <p className="font-semibold text-gray-700 mt-0.5">{formatCurrency(boq.unitCost, currency)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 uppercase tracking-wide">Committed</p>
                              <p className={`font-semibold mt-0.5 ${boq.committedQuantity > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                                {boq.committedQuantity} units
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 uppercase tracking-wide">Available</p>
                              <p className={`font-semibold mt-0.5 ${available <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {available} units
                              </p>
                            </div>
                            {boq.trackerCycleNumber != null && (
                              <div className="col-span-2">
                                <p className="text-gray-400 uppercase tracking-wide">Next Invoicing Cycle</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="font-semibold text-gray-700">Cycle {boq.trackerCycleNumber}</span>
                                  <StatusBadge
                                    status={trackerCycleStatusesMap[boq.trackerCycleStatusId] ?? '—'}
                                    colors={trackerCycleStatusColorsMap[boq.trackerCycleStatusId]}
                                    size="sm"
                                  />
                                  <VarianceBadge days={boq.varianceDays} size="sm" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quantity input + line total */}
                          <div className="flex items-start gap-4">
                            <div className="w-2xs">
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
                                <p className="text-base font-bold text-primary">{formatCurrency(lineTotal, currency)}</p>
                                <p className="text-xs text-gray-400">
                                  {lineQty} × {formatCurrency(boq.unitCost, currency)}
                                </p>
                              </div>
                            )}
                          </div>
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
                    Grand Total: {formatCurrency(grandTotal, currency)}
                  </span>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Invoice Details */}
        {!boqItemsLoading && boqItems.length > 0 && 
        (<>
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              required
              placeholder="e.g. INV-2026-001"
              value={form.invoiceNumber}
              onChange={set('invoiceNumber')}
              error={errors.invoiceNumber}
            />
            <DatePicker
              label="Baseline Expected Collection Date"
              required
              value={form.baselineCollectionDate}
              onChange={set('baselineCollectionDate')}
              error={errors.baselineCollectionDate}
            />
            {/* <Input
              label="VAT Rate"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="0.15"
              value={form.vat}
              onChange={set('vat')}
              error={errors.vat}
              hint="Enter as a decimal, e.g. 0.15 for 15%"
            /> */}
          </div>
        </Card>

        {/* Attachments */}
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Attachments
          </h2>
          <AttachmentUploader
            files={attachments}
            onChange={setAttachments}
            disabled={saving}
            onRejected={(rejected) => {
              rejected.forEach(({ file, reason }) => {
                toast.error('Attachment not added', `${file.name}: ${reason}`);
              });
            }}
          />
        </Card>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href={`/projects/${encodeURIComponent(projectCode)}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSubmitClick} loading={saving} disabled={attachmentsUploading}>
            {attachmentsUploading ? 'Uploading attachments…' : 'Submit Request'}
          </Button>
        </div>
        </>
      )}
      </div>
    </div>
    
  );
}
