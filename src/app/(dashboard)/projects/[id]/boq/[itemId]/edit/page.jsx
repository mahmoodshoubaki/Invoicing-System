'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { decodeRouteParam } from '@/lib/routeParam';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import { useTranslations } from 'next-intl';
import { CalendarRange, ChevronLeft, PencilLine, Save } from 'lucide-react';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import SubPageHeader from '@/components/common/SubPageHeader';
import FormSection from '@/components/common/FormSection';
import Reveal from '@/components/motion/Reveal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Input, NumberInput, DatePicker, Select, Textarea } from '@/components/forms/FormField';
import InvoicingPlanTracker from '@/components/boq/InvoicingPlanTracker';
import { formatCurrency } from '@/utils';
import { BASE_CURRENCY } from '@/constants/currencies';
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
  const { id: rawId, itemId } = useParams();
  const projectCode = decodeRouteParam(rawId);
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
  const currency = BASE_CURRENCY;
  const displayCurrency = useSelector((s) => s.ui.currency);
  const tc = useTranslations('common');
  const t = useTranslations('boqForm');
  const format = useLocaleFormat();
  const frequencyLabel = useLookupLabel('billingFrequency');
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

  const contractStartDate  = subProjects[0]?.contractStartDate  ?? null;
  const contractFinishDate = subProjects[0]?.contractFinishDate ?? null;
  const missingContractDates = !subProjectsLoading && subProjects.length > 0
    && (!contractStartDate || !contractFinishDate);

  const [cycles, setCycles]               = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    dispatch(fetchTrackerCycles(itemId)).unwrap()
      .then((result) => { if (!cancelled) setCycles(result); })
      .catch((err) => { if (!cancelled) toast.error(t('loadPlanFailed'), err ?? t('tryAgain')); });
    return () => {
      cancelled = true;
      dispatch(clearTrackerCycles());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, itemId]);

  const originalScheduleRef = useRef(null);
  useEffect(() => {
    if (form && !originalScheduleRef.current) {
      originalScheduleRef.current = {
        expectedInvoicingDate: form.expectedInvoicingDate,
        billingFrequencyId:    form.billingFrequencyId,
      };
    }
  }, [form]);

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
        setPreviewError(err.message || t('generatePlanFailed'));
        setPreviewLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
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
    if (!form.englishName.trim())                           e.englishName        = t('errors.english');
    if (!form.arabicName.trim())                            e.arabicName         = t('errors.arabic');
    if (!form.quantity || Number(form.quantity) <= 0)       e.quantity           = t('errors.quantity');
    if (form.unitCost === '' || Number(form.unitCost) < 0)  e.unitCost           = t('errors.unitCost');
    if (!form.billingFrequencyId)                           e.billingFrequencyId = t('errors.frequency');
    if (!form.expectedInvoicingDate)                        e.expectedInvoicingDate = t('errors.expected');
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
      toast.success(t('updated'), t('updatedBody'));
      router.push(`/projects/${encodeURIComponent(projectCode)}/boq`);
    } catch (err) {
      toast.error(t('updateFailed'), err ?? t('tryAgain'));
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
        <p className="text-gray-500">{t('notFound')}</p>
        <Link href={`/projects/${encodeURIComponent(projectCode)}/boq`}>
          <Button variant="outline" className="mt-4">{t('backToBoq')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="mx-auto max-w-4xl">
      <SubPageHeader
        eyebrow={t('eyebrow')}
        title={t('editTitle')}
        subtitle={item.englishName ?? currentProject?.contractName ?? projectCode}
        icon={PencilLine}
        breadcrumbs={[
          { label: t('home'), href: '/' },
          { label: t('projects'), href: '/projects' },
          { label: currentProject?.contractName, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: t('boq'), href: `/projects/${encodeURIComponent(projectCode)}/boq` },
          { label: t('editItem') },
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
          subtitle={t('editSubtitle')}
          icon={PencilLine}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('englishDescription')}
              dir="ltr"
              required
              value={form.englishName}
              onChange={set('englishName')}
              error={errors.englishName}
            />
            <Input
              label={t('arabicDescription')}
              dir="rtl"
              required
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
            <Input
              label={t('baselineDate')}
              type="text"
              readOnly
              value={format.date(form.baselineInvoicingDate) || '—'}
              hint={t('baselineFixedHint')}
              className="bg-gray-50 cursor-not-allowed"
            />
            <DatePicker
              label={t('updatedDate')}
              required
              value={form.expectedInvoicingDate}
              onChange={set('expectedInvoicingDate')}
              error={errors.expectedInvoicingDate}
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
                value={form.notes}
                onChange={set('notes')}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title={t('planTitle')}
          subtitle={t('editPlanSubtitle')}
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
              loading={previewLoading || trackerCyclesLoading}
              error={previewError}
              ready={previewReady}
              disabled={saving}
              anchorDateLabel={t('anchorExpected')}
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
          <Button type="submit" icon={Save} loading={saving} disabled={subProjectsLoading || missingContractDates}>
            {t('saveChanges')}
          </Button>
        </div>
      </form>
    </div>
    </MotionConfig>
  );
}
