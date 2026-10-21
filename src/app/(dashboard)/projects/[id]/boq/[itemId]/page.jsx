'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import { CalendarRange, ChevronLeft, FileText, History, PencilLine } from 'lucide-react';

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
import { formatCurrency, formatDate } from '@/utils';
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

/**
 * One BOQ item, read only.
 *
 * The same content as the edit page — details and the invoicing plan — with
 * nothing to type in. It exists because a BOQ item is something to LINK to: a
 * workflow run tracking BOQ items needs somewhere to send a reader, and sending
 * them to an edit form means only people who may change an item can look at
 * one. Editing is a button away for whoever holds `Boqs.Update`.
 *
 * A task the item's workflow is waiting on, when it is the signed-in person's
 * to answer, sits above the details (2026-10-13) — answering it can change the
 * item and its plan, so both are read again afterwards.
 */
export default function ViewBOQItemPage() {
  // See boq/page.jsx for why this is decoded defensively.
  const { id: rawId, itemId } = useParams();
  const projectCode = decodeURIComponent(rawId);
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

  // The item's saved plan. Read only here, so unlike the edit page there is no
  // preview to regenerate — what is shown is what is stored.
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

  // Every sub-project under the same main project shares the contract window;
  // it bounds the plan's dates and is shown for the same reason as on the form.
  const contractStartDate = subProjects[0]?.contractStartDate ?? null;
  const contractFinishDate = subProjects[0]?.contractFinishDate ?? null;

  const boqHref = ROUTES.PROJECT_BOQ(encodeURIComponent(projectCode));

  const reloadAfterTask = () => {
    dispatch(fetchBOQByProjectCode(projectCode));
    dispatch(fetchTrackerCycles(itemId)).unwrap()
      .then(setCycles)
      .catch((err) => toast.error('Failed to load the invoicing plan', err ?? 'Please try again.'));
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
        <p className="text-gray-500">BOQ item not found.</p>
        <Link href={boqHref}>
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
        title="BOQ Item"
        subtitle={item.englishName ?? currentProject?.contractName ?? projectCode}
        icon={FileText}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: currentProject?.contractName, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: 'BOQ', href: boqHref },
          { label: 'Item' },
        ]}
        actions={
          <>
            <Link href={boqHref}>
              <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
            </Link>
            <Button variant="outline" size="sm" icon={History} onClick={() => setShowHistory(true)}>
              History
            </Button>
            {can('Boqs', 'Update') && (
              <Link href={ROUTES.PROJECT_BOQ_EDIT(encodeURIComponent(projectCode), item.id)}>
                <Button size="sm" icon={PencilLine}>Edit</Button>
              </Link>
            )}
          </>
        }
      />

      {/* Where it is in its review and what comes next (2026-10-21), and who it waits on. */}
      <BoqItemStepper item={item} />

      <Reveal className="flex flex-col gap-5">
        <FormSection title="Item Details" icon={FileText}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow label="English Description" value={item.englishName} />
            <InfoRow label="Arabic Description" value={item.arabicName} />
            <InfoRow label="Status" value={
              item.statusId != null
                ? (
                  <StatusBadge
                    status={boqStatusesMap[item.statusId] ?? String(item.statusId)}
                    colors={boqStatusColorsMap[item.statusId]}
                  />
                )
                : null
            } />
            <InfoRow label="Billing Frequency" value={billingFrequenciesMap[item.billingFrequencyId]} />
            <InfoRow label="Submitted By" value={item.submittedByName} />
            <InfoRow label="Quantity" value={item.quantity} />
            <InfoRow label={`Unit Cost (${currency})`} value={formatCurrency(item.unitCost, currency)} />
            <InfoRow label="Total Cost" value={formatCurrency(item.totalCost, currency)} />
            <InfoRow label="Baseline Expected Invoicing Date" value={formatDate(item.baselineInvoicingDate)} />
            <InfoRow label="Updated Expected Invoicing Date" value={formatDate(item.expectedInvoicingDate)} />
            <InfoRow
              label="Contract Start Date"
              value={subProjectsLoading ? 'Loading…' : formatDate(contractStartDate)}
            />
            <InfoRow
              label="Contract Finish Date"
              value={subProjectsLoading ? 'Loading…' : formatDate(contractFinishDate)}
            />
            <div className="md:col-span-2">
              <InfoRow label="Notes" value={item.notes} />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Invoicing Plan Tracker"
          subtitle="The cycles this item is scheduled to be invoiced in"
          icon={CalendarRange}
        >
          {/* `disabled` is what makes every row read-only — the same tracker the
              edit page uses, so a plan reads identically in both places. */}
          <InvoicingPlanTracker
            cycles={cycles}
            onChange={setCycles}
            minDate={contractStartDate}
            maxDate={contractFinishDate}
            loading={trackerCyclesLoading}
            ready={cycles.length > 0}
            disabled
            anchorDateLabel="Expected Invoicing Date"
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
