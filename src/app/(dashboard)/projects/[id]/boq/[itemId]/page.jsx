'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { decodeRouteParam } from '@/lib/routeParam';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import { CalendarRange, ChevronLeft, FileText, History, PencilLine } from 'lucide-react';
import { useTranslations } from 'next-intl';

import SubPageHeader from '@/components/common/SubPageHeader';
import FormSection from '@/components/common/FormSection';
import Reveal from '@/components/motion/Reveal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/Badge';
import InfoRow from '@/components/projects/InfoRow';
import InvoicingPlanTracker from '@/components/boq/InvoicingPlanTracker';
import BOQItemHistoryModal from '@/components/boq/BOQItemHistoryModal';
import BoqItemStepper from '@/components/boq/BoqItemStepper';
import BoqItemTaskPanel from '@/components/boq/BoqItemTaskPanel';
import { formatCurrency } from '@/utils';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import {
  selectBillingFrequenciesMap,
  selectBoqItemStatusesMap,
  selectBoqItemStatusColorsMap,
} from '@/store/slices/lookupsSlice';
import {
  fetchBOQByProjectCode,
  fetchTrackerCycles,
  clearTrackerCycles,
  selectBOQItems,
  selectBOQLoading,
  selectTrackerCyclesLoading,
} from '@/store/slices/boqSlice';
import {
  fetchMainProjectDetails, selectMainProjectDetails, selectMainDetailsLoading,
  fetchSubProjectsSummary, selectSubProjects, selectSubProjectsLoading,
} from '@/store/slices/projectsSlice';

export default function ViewBOQItemPage() {
  const t = useTranslations('boq');
  const tn = useTranslations('nav');
  const th = useTranslations('projects');
  const tf = useTranslations('files');
  const format = useLocaleFormat();
  const frequencyLabel = useLookupLabel('billingFrequency');
  const { id: rawId, itemId } = useParams();
  const projectCode = decodeRouteParam(rawId);
  const dispatch = useDispatch();
  const toast = useToast();
  const { can } = usePermission();

  const currentProject = useSelector(selectMainProjectDetails);
  const projectLoading = useSelector(selectMainDetailsLoading);
  const boqItems = useSelector(selectBOQItems);
  const boqLoading = useSelector(selectBOQLoading);
  const subProjects = useSelector(selectSubProjects);
  const subProjectsLoading = useSelector(selectSubProjectsLoading);
  const currency = useSelector((s) => s.ui.currency);
  const trackerCyclesLoading = useSelector(selectTrackerCyclesLoading);
  const billingFrequenciesMap = useSelector(selectBillingFrequenciesMap);
  const boqStatusesMap = useSelector(selectBoqItemStatusesMap);
  const boqStatusColorsMap = useSelector(selectBoqItemStatusColorsMap);

  const [cycles, setCycles] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const item = boqItems.find((i) => String(i.id) === String(itemId));

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  useEffect(() => {
    let cancelled = false;
    dispatch(fetchTrackerCycles(itemId)).unwrap()
      .then((result) => { if (!cancelled) setCycles(result); })
      .catch((err) => { if (!cancelled) toast.error(t('toasts.loadPlanFailed'), err ?? tf('pleaseTryAgain')); });
    return () => {
      cancelled = true;
      dispatch(clearTrackerCycles());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, itemId]);

  const contractStartDate = subProjects[0]?.contractStartDate ?? null;
  const contractFinishDate = subProjects[0]?.contractFinishDate ?? null;

  const boqHref = ROUTES.PROJECT_BOQ(encodeURIComponent(projectCode));

  const reloadAfterTask = () => {
    dispatch(fetchBOQByProjectCode(projectCode));
    dispatch(fetchTrackerCycles(itemId)).unwrap()
      .then(setCycles)
      .catch((err) => toast.error(t('toasts.loadPlanFailed'), err ?? tf('pleaseTryAgain')));
  };

  if (projectLoading || boqLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t('item.notFound')}</p>
        <Link href={boqHref}>
          <Button variant="outline" className="mt-4">{t('item.backToBoq')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="mx-auto max-w-4xl">
      <SubPageHeader
        eyebrow={t('eyebrow')}
        title={t('item.title')}
        subtitle={item.englishName ?? currentProject?.contractName ?? projectCode}
        icon={FileText}
        breadcrumbs={[
          { label: th('home'), href: '/' },
          { label: tn('projects'), href: '/projects' },
          { label: currentProject?.contractName, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: t('breadcrumb'), href: boqHref },
          { label: t('breadcrumbItem') },
        ]}
        actions={
          <>
            <Link href={boqHref}>
              <Button variant="ghost" icon={ChevronLeft} iconClassName="rtl:-scale-x-100" size="sm">{t('actions.back')}</Button>
            </Link>
            <Button variant="outline" size="sm" icon={History} onClick={() => setShowHistory(true)}>
              {t('actions.history')}
            </Button>
            {can('System', 'Administrator') && (
              <Link href={ROUTES.PROJECT_BOQ_EDIT(encodeURIComponent(projectCode), item.id)}>
                <Button size="sm" icon={PencilLine}>{t('actions.edit')}</Button>
              </Link>
            )}
          </>
        }
      />

      <BoqItemStepper item={item} />

      <Reveal className="flex flex-col gap-5">
        <FormSection title={t('item.details')} icon={FileText}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow label={t('item.englishDescription')} value={item.englishName} />
            <InfoRow label={t('item.arabicDescription')} value={item.arabicName} />
            <InfoRow label={t('item.status')} value={
              item.statusId != null
                ? (
                  <StatusBadge
                    status={boqStatusesMap[item.statusId] ?? String(item.statusId)}
                    colors={boqStatusColorsMap[item.statusId]}
                  />
                )
                : null
            } />
            <InfoRow label={t('item.billingFrequency')} value={frequencyLabel(billingFrequenciesMap[item.billingFrequencyId])} />
            <InfoRow label={t('item.submittedBy')} value={item.submittedByName} />
            <InfoRow label={t('item.quantity')} value={item.quantity} />
            <InfoRow label={t('item.unitCostIn', { currency })} value={formatCurrency(item.unitCost, currency)} />
            <InfoRow label={t('item.totalCost')} value={formatCurrency(item.totalCost, currency)} />
            <InfoRow label={t('item.baselineInvoicing')} value={format.date(item.baselineInvoicingDate)} />
            <InfoRow label={t('item.updatedInvoicing')} value={format.date(item.expectedInvoicingDate)} />
            <InfoRow
              label={t('item.contractStart')}
              value={subProjectsLoading ? t('item.loading') : format.date(contractStartDate)}
            />
            <InfoRow
              label={t('item.contractFinish')}
              value={subProjectsLoading ? t('item.loading') : format.date(contractFinishDate)}
            />
            <div className="md:col-span-2">
              <InfoRow label={t('item.notes')} value={item.notes} />
            </div>
          </div>
        </FormSection>

        <FormSection
          title={t('item.planTitle')}
          subtitle={t('item.planSubtitle')}
          icon={CalendarRange}
        >
          <InvoicingPlanTracker
            cycles={cycles}
            onChange={setCycles}
            minDate={contractStartDate}
            maxDate={contractFinishDate}
            loading={trackerCyclesLoading}
            ready={cycles.length > 0}
            disabled
            anchorDateLabel={t('item.anchorExpected')}
          />
        </FormSection>

        <BoqItemTaskPanel
          item={item}
          contractStartDate={contractStartDate}
          contractFinishDate={contractFinishDate}
          onAnswered={reloadAfterTask}
        />
      </Reveal>

      <BOQItemHistoryModal
        open={showHistory}
        boqItemId={item.id}
        onClose={() => setShowHistory(false)}
      />
    </div>
    </MotionConfig>
  );
}
