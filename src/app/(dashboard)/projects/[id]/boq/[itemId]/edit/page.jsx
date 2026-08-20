'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import { CalendarRange, ChevronLeft, PencilLine, Save } from 'lucide-react';

import SubPageHeader from '@/components/common/SubPageHeader';
import FormSection from '@/components/common/FormSection';
import Reveal from '@/components/motion/Reveal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Input, NumberInput, DatePicker, Select, Textarea } from '@/components/forms/FormField';
import InvoicingPlanTracker from '@/components/boq/InvoicingPlanTracker';
import { formatCurrency, formatDate } from '@/utils';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { boqRepository } from '@/repositories/boqRepository';
import {
  updateBOQItem,
  fetchBOQByProjectCode,
  fetchTrackerCycles,
  clearTrackerCycles,
  selectBOQItems,
  selectBOQLoading,
  selectCurrentBOQ,
  selectTrackerCyclesLoading,
} from '@/store/slices/boqSlice';
import {
  fetchMainProjectDetails, selectMainProjectDetails, selectMainDetailsLoading,
  fetchSubProjectsSummary, selectSubProjects, selectSubProjectsLoading,
} from '@/store/slices/projectsSlice';
import { useToast } from '@/hooks/useToast';

function toDateInput(iso) {
  if (!iso) return '';
  return iso.split('T')[0];
}

export default function EditBOQItemPage() {
  // See boq/page.jsx for why this is decoded defensively.
  const { id: rawId, itemId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const router = useRouter();
  const dispatch = useDispatch();
  const toast = useToast();

  const billingFrequencies = useSelector(selectBillingFrequencies);
  const currentProject = useSelector(selectMainProjectDetails);
  const projectLoading = useSelector(selectMainDetailsLoading);
  const currentBOQ = useSelector(selectCurrentBOQ);
  const boqItems = useSelector(selectBOQItems);
  const boqLoading = useSelector(selectBOQLoading);
  const subProjects = useSelector(selectSubProjects);
  const subProjectsLoading = useSelector(selectSubProjectsLoading);
  const currency = useSelector((s) => s.ui.currency);
  const trackerCyclesLoading = useSelector(selectTrackerCyclesLoading);

  const item = boqItems.find((i) => String(i.id) === String(itemId));

  const [form, setForm]     = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  useEffect(() => {
    if (item && !form) {
      setForm({
        englishName:           item.englishName ?? '',
        arabicName:            item.arabicName ?? '',
        quantity:              String(item.quantity ?? ''),
        unitCost:              String(item.unitCost ?? ''),
        totalCost:             String(item.totalCost ?? ''),
        billingFrequencyId:    item.billingFrequencyId != null ? String(item.billingFrequencyId) : '',
        baselineInvoicingDate: toDateInput(item.baselineInvoicingDate),
        expectedInvoicingDate: toDateInput(item.expectedInvoicingDate),
        notes:                 item.notes ?? '',
      });
    }
  }, [item, form]);

  // Every sub-project under the same main project shares the same contract
  // start/finish date — any one of them is a valid source, so the first is
  // fine. These bound the tracker's editable dates but are never user-entered.
  const contractStartDate  = subProjects[0]?.contractStartDate  ?? null;
  const contractFinishDate = subProjects[0]?.contractFinishDate ?? null;
  const missingContractDates = !subProjectsLoading && subProjects.length > 0
    && (!contractStartDate || !contractFinishDate);

  const [cycles, setCycles]               = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState(null);

  // Seed the tracker from the item's existing plan (GetTrackerCycles) once
  // on mount — this is independent of the preview logic below entirely.
  useEffect(() => {
    let cancelled = false;
    dispatch(fetchTrackerCycles(itemId)).unwrap()
      .then((result) => { if (!cancelled) setCycles(result); })
      .catch((err) => { if (!cancelled) toast.error('Failed to load the invoicing plan', err ?? 'Please try again.'); });
    return () => {
      cancelled = true;
      dispatch(clearTrackerCycles());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, itemId]);

  // The exact values the item loaded with — captured once, the first time
  // `form` exists. Comparing the live form against this (rather than any
  // "first ready" timing trick) is what decides whether the user has
  // actually touched the schedule: unambiguous and doesn't depend on the
  // order async fetches happen to resolve in.
  const originalScheduleRef = useRef(null);
  useEffect(() => {
    if (form && !originalScheduleRef.current) {
      originalScheduleRef.current = {
        expectedInvoicingDate: form.expectedInvoicingDate,
        billingFrequencyId:    form.billingFrequencyId,
      };
    }
  }, [form]);

  // Once the user has changed Expected Invoicing Date or Billing Frequency
  // away from what the item loaded with, every further change to either
  // (including switching back) regenerates the plan via
  // GetTrackerCyclesPreview. Untouched, the seeded plan from GetTrackerCycles
  // above is left alone.
  const hasDivergedRef = useRef(false);
  const previewReady = Boolean(
    form?.expectedInvoicingDate && form?.billingFrequencyId && contractStartDate && contractFinishDate
  );

  useEffect(() => {
    const original = originalScheduleRef.current;
    if (!form || !original) return;

    if (!hasDivergedRef.current) {
      const changed = form.expectedInvoicingDate !== original.expectedInvoicingDate
        || form.billingFrequencyId !== original.billingFrequencyId;
      if (!changed) return;
      hasDivergedRef.current = true;
    }

    if (!previewReady) {
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    const timer = setTimeout(async () => {
      try {
        const result = await boqRepository.previewInvoicingPlan({
          anchorDate:         form.expectedInvoicingDate,
          billingFrequencyId: form.billingFrequencyId,
          contractStartDate,
          contractFinishDate,
          boqItemId:          itemId,
        });
        setCycles(result);
        setPreviewLoading(false);
      } catch (err) {
        setPreviewError(err.message || 'Failed to generate the invoicing plan.');
        setPreviewLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  // `form` itself is intentionally omitted — it changes on every keystroke
  // across all fields, and only expectedInvoicingDate/billingFrequencyId
  // (already listed below) should cause this effect to re-run.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.expectedInvoicingDate, form?.billingFrequencyId, contractStartDate, contractFinishDate, itemId, previewReady]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === 'quantity' || field === 'unitCost') {
        const q = parseFloat(field === 'quantity' ? val : prev.quantity) || 0;
        const u = parseFloat(field === 'unitCost'  ? val : prev.unitCost)  || 0;
        next.totalCost = (q * u).toFixed(2);
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.englishName.trim())                           e.englishName        = 'English description is required';
    if (!form.arabicName.trim())                            e.arabicName         = 'Arabic description is required';
    if (!form.quantity || Number(form.quantity) <= 0)       e.quantity           = 'Valid quantity is required';
    if (form.unitCost === '' || Number(form.unitCost) < 0)  e.unitCost           = 'Valid unit cost is required';
    if (!form.billingFrequencyId)                           e.billingFrequencyId = 'Billing frequency is required';
    if (!form.expectedInvoicingDate)                        e.expectedInvoicingDate = 'Expected invoicing date is required';
    if (!contractStartDate || !contractFinishDate) {
      e.trackerCycles = 'Contract start/finish dates are not available for this project yet — cycles cannot be generated.';
    }

    const outOfRange = cycles.some((c) => !c.isCommitted && (
      !c.plannedDate || c.plannedDate < contractStartDate || c.plannedDate > contractFinishDate
    ));
    if (outOfRange) {
      e.trackerCycles = 'Every cycle needs a planned date between the contract start and finish dates';
    }

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await dispatch(updateBOQItem({
        id: itemId,
        data: {
          boqId:                 currentBOQ?.id ?? item.boqId ?? null,
          englishName:           form.englishName,
          arabicName:            form.arabicName,
          quantity:              Number(form.quantity),
          unitCost:               Number(form.unitCost),
          expectedInvoicingDate: form.expectedInvoicingDate ?? null,
          baselineInvoicingDate: form.baselineInvoicingDate ?? null,
          billingFrequencyId:    Number(form.billingFrequencyId),
          notes:                 form.notes || null,
          statusId:              item.statusId ?? 1,
          contractStartDate,
          contractFinishDate,
        },
        cycles,
      })).unwrap();
      toast.success('BOQ item updated', 'The item was updated successfully.');
      router.push(`/projects/${encodeURIComponent(projectCode)}/boq`);
    } catch (err) {
      toast.error('Failed to update BOQ item', err ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (projectLoading || boqLoading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">BOQ item not found.</p>
        <Link href={`/projects/${encodeURIComponent(projectCode)}/boq`}>
          <Button variant="outline" className="mt-4">Back to BOQ</Button>
        </Link>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="mx-auto max-w-4xl">
      <SubPageHeader
        eyebrow="Bill of Quantities"
        title="Edit BOQ Item"
        subtitle={item.englishName ?? currentProject?.contractName ?? projectCode}
        icon={PencilLine}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: currentProject?.contractName, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: 'BOQ', href: `/projects/${encodeURIComponent(projectCode)}/boq` },
          { label: 'Edit Item' },
        ]}
        actions={
          <Link href={`/projects/${encodeURIComponent(projectCode)}/boq`}>
            <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
       <Reveal className="flex flex-col gap-5">
        <FormSection
          title="Item Details"
          subtitle="Baseline date and contract window are fixed after creation"
          icon={PencilLine}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="English Description"
              required
              value={form.englishName}
              onChange={set('englishName')}
              error={errors.englishName}
            />
            <Input
              label="Arabic Description"
              required
              value={form.arabicName}
              onChange={set('arabicName')}
              error={errors.arabicName}
            />
            <Input
              label="Quantity"
              required
              type="number"
              min="0"
              step=".01"
              value={form.quantity}
              onChange={set('quantity')}
              error={errors.quantity}
            />
            <NumberInput
              label={`Unit Cost (${currency})`}
              required
              placeholder="0.00"
              value={form.unitCost}
              onChange={set('unitCost')}
              error={errors.unitCost}
            />
            <Input
              label="Total Cost"
              type="text"
              readOnly
              value={formatCurrency(form.totalCost, currency)}
              hint="Auto-calculated from quantity × unit cost"
              className="bg-gray-50 cursor-not-allowed"
            />
            <Select
              label="Billing Frequency"
              required
              value={form.billingFrequencyId}
              onChange={set('billingFrequencyId')}
              placeholder="Select frequency"
              options={billingFrequencies.map((f) => ({ value: String(f.id), label: f.label }))}
              error={errors.billingFrequencyId}
            />
            <Input
              label="Baseline Expected Invoicing Date"
              type="text"
              readOnly
              value={formatDate(form.baselineInvoicingDate) || '—'}
              hint="Set once at creation — can't be changed on update"
              className="bg-gray-50 cursor-not-allowed"
            />
            <DatePicker
              label="Updated Expected Invoicing Date"
              required
              value={form.expectedInvoicingDate}
              onChange={set('expectedInvoicingDate')}
              error={errors.expectedInvoicingDate}
            />
            <Input
              label="Contract Start Date"
              type="text"
              readOnly
              value={subProjectsLoading ? 'Loading…' : (formatDate(contractStartDate) || '—')}
              hint="minimum allowed date for invoicing cycles"
              className="bg-gray-50 cursor-not-allowed"
            />
            <Input
              label="Contract Finish Date"
              type="text"
              readOnly
              value={subProjectsLoading ? 'Loading…' : (formatDate(contractFinishDate) || '—')}
              hint="maximum allowed date for invoicing cycles"
              className="bg-gray-50 cursor-not-allowed"
            />
            <div className="md:col-span-2">
              <Textarea
                label="Notes"
                rows={3}
                value={form.notes}
                onChange={set('notes')}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Invoicing Plan Tracker"
          subtitle="Cycles already invoiced are locked. Changing the expected invoicing date or billing frequency regenerates the remaining ones"
          icon={CalendarRange}
        >
          {missingContractDates ? (
            <p className="py-8 text-center text-sm text-red-500">
              This project has no start/finish dates set on its sub-projects yet — invoicing cycles can&apos;t be generated.
            </p>
          ) : (
            <InvoicingPlanTracker
              cycles={cycles}
              onChange={setCycles}
              minDate={contractStartDate}
              maxDate={contractFinishDate}
              loading={previewLoading || trackerCyclesLoading}
              error={previewError}
              ready={previewReady}
              disabled={saving}
              anchorDateLabel="Expected Invoicing Date"
            />
          )}
          {errors.trackerCycles && (
            <p className="mt-3 text-xs text-red-500">{errors.trackerCycles}</p>
          )}
        </FormSection>
       </Reveal>

        <div className="sticky bottom-0 z-10 mt-5 flex items-center justify-end gap-3 rounded-2xl border border-[#e9e7e5] bg-white/85 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(60_60_58/0.18)] backdrop-blur-md">
          <Link href={`/projects/${encodeURIComponent(projectCode)}/boq`}>
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" icon={Save} loading={saving} disabled={subProjectsLoading || missingContractDates}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
    </MotionConfig>
  );
}
