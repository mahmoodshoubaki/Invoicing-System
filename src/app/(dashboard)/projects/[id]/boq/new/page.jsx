'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import { CalendarRange, ChevronLeft, ListPlus, Plus } from 'lucide-react';

import SubPageHeader from '@/components/common/SubPageHeader';
import FormSection from '@/components/common/FormSection';
import Reveal from '@/components/motion/Reveal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Input, NumberInput, DatePicker, Select, Textarea } from '@/components/forms/FormField';
import InvoicingPlanTracker from '@/components/boq/InvoicingPlanTracker';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { addBOQItem, fetchBOQByProjectCode, selectCurrentBOQ } from '@/store/slices/boqSlice';
import { createBOQItemForm } from '@/models/boq';
import { formatCurrency, formatDate } from '@/utils';
import {
  fetchMainProjectDetails, selectMainProjectDetails, selectMainDetailsLoading,
  fetchSubProjectsSummary, selectSubProjects, selectSubProjectsLoading,
} from '@/store/slices/projectsSlice';
import { useInvoicingPlanPreview } from '@/hooks/useInvoicingPlanPreview';
import { useToast } from '@/hooks/useToast';

export default function NewBOQItemPage() {
  // See boq/page.jsx for why this is decoded defensively.
  const { id: rawId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const router    = useRouter();
  const dispatch    = useDispatch();
  const toast       = useToast();

  const billingFrequencies = useSelector(selectBillingFrequencies);
  const currentBOQ         = useSelector(selectCurrentBOQ);
  const currentProject     = useSelector(selectMainProjectDetails);
  const projectLoading     = useSelector(selectMainDetailsLoading);
  const subProjects        = useSelector(selectSubProjects);
  const subProjectsLoading = useSelector(selectSubProjectsLoading);
  const currency           = useSelector((s) => s.ui.currency);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  // Every sub-project under the same main project shares the same contract
  // start/finish date — any one of them is a valid source, so the first is
  // fine. These bound the tracker's editable dates but are never user-entered.
  const contractStartDate  = subProjects[0]?.contractStartDate  ?? null;
  const contractFinishDate = subProjects[0]?.contractFinishDate ?? null;
  const missingContractDates = !subProjectsLoading && subProjects.length > 0
    && (!contractStartDate || !contractFinishDate);

  const [form, setForm]     = useState(createBOQItemForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const {
    cycles, setCycles, loading: previewLoading, error: previewError, ready: previewReady,
  } = useInvoicingPlanPreview({
    // Baseline Invoicing Date can only be set at creation, so it's what
    // drives the preview here (edit mode uses Expected Invoicing Date
    // instead, since baseline is fixed after creation).
    anchorDate:          form.baselineInvoicingDate,
    billingFrequencyId:  form.billingFrequencyId,
    contractStartDate,
    contractFinishDate,
  });

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
    if (!form.englishName.trim())                           e.englishName           = 'English description is required';
    if (!form.arabicName.trim())                            e.arabicName            = 'Arabic description is required';
    if (!form.quantity || Number(form.quantity) <= 0)       e.quantity              = 'Valid quantity is required';
    if (form.unitCost === '' || Number(form.unitCost) < 0)  e.unitCost              = 'Valid unit cost is required';
    if (!form.billingFrequencyId)                           e.billingFrequencyId    = 'Billing frequency is required';
    if (!form.baselineInvoicingDate)                        e.baselineInvoicingDate = 'Baseline invoicing date is required';
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
      await dispatch(addBOQItem({
        form: { ...form, contractStartDate, contractFinishDate },
        boq: currentBOQ,
        cycles,
      })).unwrap();
      toast.success('BOQ item added', 'The item was added successfully.');
      router.push(`/projects/${encodeURIComponent(projectCode)}/boq`);
    } catch (err) {
      toast.error('Failed to add BOQ item', err ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (projectLoading || !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="mx-auto max-w-4xl">

      <SubPageHeader
        eyebrow="Bill of Quantities"
        title="Add BOQ Item"
        subtitle={currentProject.contractName ?? projectCode}
        icon={ListPlus}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: currentProject.contractName, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: 'BOQ', href: `/projects/${encodeURIComponent(projectCode)}/boq` },
          { label: 'Add Item' },
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
          subtitle="What is being delivered, and what it is worth"
          icon={ListPlus}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="English Description"
              required
              placeholder="e.g. Cloud Architecture Design"
              value={form.englishName}
              onChange={set('englishName')}
              error={errors.englishName}
            />
            <Input
              label="Arabic Description"
              required
              placeholder="وصف العنصر بالعربية"
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
            <DatePicker
              label="Baseline Expected Invoicing Date"
              required
              value={form.baselineInvoicingDate}
              onChange={set('baselineInvoicingDate')}
              error={errors.baselineInvoicingDate}
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
                placeholder="Additional notes or context..."
                value={form.notes}
                onChange={set('notes')}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Invoicing Plan Tracker"
          subtitle="Generated from the baseline date, billing frequency and contract dates above — edit, add or remove cycles as needed"
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
              loading={previewLoading}
              error={previewError}
              ready={previewReady}
              disabled={saving}
            />
          )}
          {errors.trackerCycles && (
            <p className="mt-3 text-xs text-red-500">{errors.trackerCycles}</p>
          )}
        </FormSection>
       </Reveal>

        {/* Sticky action bar — the form is long enough that a footer-only
            save button would sit below the fold for most of the session. */}
        <div className="sticky bottom-0 z-10 mt-5 flex items-center justify-end gap-3 rounded-2xl border border-[#e9e7e5] bg-white/85 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(60_60_58/0.18)] backdrop-blur-md">
          <Link href={`/projects/${encodeURIComponent(projectCode)}/boq`}>
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" icon={Plus} loading={saving} disabled={subProjectsLoading || missingContractDates}>
            Add item
          </Button>
        </div>
      </form>
    </div>
    </MotionConfig>
  );
}
