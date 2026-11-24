'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { decodeRouteParam } from '@/lib/routeParam';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import { useTranslations } from 'next-intl';
import { CalendarRange, ChevronLeft, ListPlus, Plus } from 'lucide-react';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

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
import { formatCurrency } from '@/utils';
import { BASE_CURRENCY } from '@/constants/currencies';
import {
  fetchMainProjectDetails, selectMainProjectDetails, selectMainDetailsLoading,
  fetchSubProjectsSummary, selectSubProjects, selectSubProjectsLoading,
} from '@/store/slices/projectsSlice';
import { useInvoicingPlanPreview } from '@/hooks/useInvoicingPlanPreview';
import { useToast } from '@/hooks/useToast';

export default function NewBOQItemPage() {
  const { id: rawId } = useParams();
  const projectCode = decodeRouteParam(rawId);
  const router    = useRouter();
  const dispatch    = useDispatch();
  const toast       = useToast();

  const billingFrequencies = useSelector(selectBillingFrequencies);
  const currentBOQ         = useSelector(selectCurrentBOQ);
  const currentProject     = useSelector(selectMainProjectDetails);
  const projectLoading     = useSelector(selectMainDetailsLoading);
  const subProjects        = useSelector(selectSubProjects);
  const subProjectsLoading = useSelector(selectSubProjectsLoading);
  const currency           = BASE_CURRENCY;
  const displayCurrency    = useSelector((s) => s.ui.currency);
  const tc                 = useTranslations('common');
  const t                  = useTranslations('boqForm');
  const format             = useLocaleFormat();
  const frequencyLabel     = useLookupLabel('billingFrequency');

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
  }, [dispatch, projectCode]);

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
    if (!form.englishName.trim())                           e.englishName           = t('errors.english');
    if (!form.arabicName.trim())                            e.arabicName            = t('errors.arabic');
    if (!form.quantity || Number(form.quantity) <= 0)       e.quantity              = t('errors.quantity');
    if (form.unitCost === '' || Number(form.unitCost) < 0)  e.unitCost              = t('errors.unitCost');
    if (!form.billingFrequencyId)                           e.billingFrequencyId    = t('errors.frequency');
    if (!form.baselineInvoicingDate)                        e.baselineInvoicingDate = t('errors.baseline');
    if (!contractStartDate || !contractFinishDate) {
      e.trackerCycles = t('errors.noContractDates');
    }

    const outOfRange = cycles.some((c) => !c.isCommitted && (
      !c.plannedDate || c.plannedDate < contractStartDate || c.plannedDate > contractFinishDate
    ));
    if (outOfRange) {
      e.trackerCycles = t('errors.cycleRange');
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
      toast.success(t('added'), t('addedBody'));
      router.push(`/projects/${encodeURIComponent(projectCode)}/boq`);
    } catch (err) {
      toast.error(t('addFailed'), err ?? t('tryAgain'));
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
        eyebrow={t('eyebrow')}
        title={t('newTitle')}
        subtitle={currentProject.contractName ?? projectCode}
        icon={ListPlus}
        breadcrumbs={[
          { label: t('home'), href: '/' },
          { label: t('projects'), href: '/projects' },
          { label: currentProject.contractName, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: t('boq'), href: `/projects/${encodeURIComponent(projectCode)}/boq` },
          { label: t('addItem') },
        ]}
        actions={
          <Link href={`/projects/${encodeURIComponent(projectCode)}/boq`}>
            <Button variant="ghost" icon={ChevronLeft} iconClassName="rtl:-scale-x-100" size="sm">{t('back')}</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
       <Reveal className="flex flex-col gap-5">
        <FormSection
          title={t('itemDetails')}
          subtitle={t('newSubtitle')}
          icon={ListPlus}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('englishDescription')}
              dir="ltr"
              required
              placeholder={t('englishPlaceholder')}
              value={form.englishName}
              onChange={set('englishName')}
              error={errors.englishName}
            />
            <Input
              label={t('arabicDescription')}
              dir="rtl"
              required
              placeholder="وصف العنصر بالعربية"
              value={form.arabicName}
              onChange={set('arabicName')}
              error={errors.arabicName}
            />
            <Input
              label={t('quantity')}
              required
              type="number"
              min="0"
              step=".01"
              value={form.quantity}
              onChange={set('quantity')}
              error={errors.quantity}
            />
            <NumberInput
              label={t('unitCostIn', { currency })}
              required
              placeholder="0.00"
              value={form.unitCost}
              onChange={set('unitCost')}
              error={errors.unitCost}
              hint={tc('amountsInUsd')}
            />
            <Input
              label={t('totalCost')}
              type="text"
              readOnly
              value={formatCurrency(form.totalCost, displayCurrency)}
              hint={t('totalHint')}
              className="bg-gray-50 cursor-not-allowed"
            />
            <Select
              label={t('billingFrequency')}
              required
              value={form.billingFrequencyId}
              onChange={set('billingFrequencyId')}
              placeholder={t('selectFrequency')}
              options={billingFrequencies.map((f) => ({ value: String(f.id), label: frequencyLabel(f.label) }))}
              error={errors.billingFrequencyId}
            />
            <DatePicker
              label={t('baselineDate')}
              required
              value={form.baselineInvoicingDate}
              onChange={set('baselineInvoicingDate')}
              error={errors.baselineInvoicingDate}
            />
            <Input
              label={t('contractStart')}
              type="text"
              readOnly
              value={subProjectsLoading ? t('loading') : (format.date(contractStartDate) || '—')}
              hint={t('minDateHint')}
              className="bg-gray-50 cursor-not-allowed"
            />
            <Input
              label={t('contractFinish')}
              type="text"
              readOnly
              value={subProjectsLoading ? t('loading') : (format.date(contractFinishDate) || '—')}
              hint={t('maxDateHint')}
              className="bg-gray-50 cursor-not-allowed"
            />
            <div className="md:col-span-2">
              <Textarea
                label={t('notes')}
                rows={3}
                placeholder={t('notesPlaceholder')}
                value={form.notes}
                onChange={set('notes')}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title={t('planTitle')}
          subtitle={t('newPlanSubtitle')}
          icon={CalendarRange}
        >
          {missingContractDates ? (
            <p className="py-8 text-center text-sm text-red-500">
              {t('noSubProjectDates')}
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

        <div className="sticky bottom-0 z-10 mt-5 flex items-center justify-end gap-3 rounded-2xl border border-[#e9e7e5] bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(60_60_58/0.18)]">
          <Link href={`/projects/${encodeURIComponent(projectCode)}/boq`}>
            <Button variant="ghost">{t('cancel')}</Button>
          </Link>
          <Button type="submit" icon={Plus} loading={saving} disabled={subProjectsLoading || missingContractDates}>
            {t('addItemButton')}
          </Button>
        </div>
      </form>
    </div>
    </MotionConfig>
  );
}
