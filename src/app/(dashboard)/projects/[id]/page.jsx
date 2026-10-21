'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';

import Button from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProjectDetailHeader from '@/components/projects/ProjectDetailHeader';
import ProjectStatCards from '@/components/projects/ProjectStatCards';
import ProjectTabs, { PROJECT_TABS, tabSlug } from '@/components/projects/ProjectTabs';
import OverviewTab from '@/components/projects/OverviewTab';
import SubProjectsTab from '@/components/projects/SubProjectsTab';
import BOQTab from '@/components/projects/BOQTab';
import InvoicesTab from '@/components/projects/InvoicesTab';
import ChangeRequestsTab from '@/components/projects/ChangeRequestsTab';
import { usePermission } from '@/hooks/usePermission';
import { allow } from '@/constants/workflowPermissions';
import { CR_PERMISSIONS } from '@/constants/changeRequests';
import {
  fetchMainProjectDetails,
  fetchSubProjectsSummary,
  selectMainProjectDetails,
  selectMainDetailsLoading,
  selectSubProjects,
  selectSubProjectsLoading,
} from '@/store/slices/projectsSlice';
import { aggregateSubProjectFinancials } from '@/models/project';
import { summariseProjectInvoices } from '@/models/invoice';
import { fetchBOQByProjectCode, selectBOQItems, selectCurrentBOQ } from '@/store/slices/boqSlice';
import { fetchInvoicesByProjectCode, selectInvoices, selectInvoicesLoading } from '@/store/slices/invoicesSlice';
import {
  selectBillingFrequenciesMap,
  selectBoqItemStatusesMap,
  selectBoqItemStatusColorsMap,
  selectInvoiceStatusesMap,
  selectInvoiceStatusColorsMap,
} from '@/store/slices/lookupsSlice';

export default function ProjectDetailPage() {
  // The route param is the project code (GetProjectsList no longer returns
  // an id) — used directly as the key for every per-project fetch below.
  // Client-side navigations (router.push/<Link>) don't decode %2F etc. back
  // out of the segment the way server-side rendering does, so decode it
  // ourselves here. Safe either way: a value Next already decoded (no % left)
  // passes through decodeURIComponent unchanged.
  const { id: rawId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const router   = useRouter();
  const dispatch = useDispatch();

  const project          = useSelector(selectMainProjectDetails);
  const mainLoading      = useSelector(selectMainDetailsLoading);
  const subProjects      = useSelector(selectSubProjects);
  const subProjectsLoading = useSelector(selectSubProjectsLoading);
  const currency  = useSelector((s) => s.ui.currency);

  const boqItems              = useSelector(selectBOQItems);
  const currentBOQ            = useSelector(selectCurrentBOQ);
  const billingFrequenciesMap = useSelector(selectBillingFrequenciesMap);
  const boqItemStatusesMap    = useSelector(selectBoqItemStatusesMap);
  const boqItemStatusColorsMap = useSelector(selectBoqItemStatusColorsMap);
  const invoiceStatusesMap    = useSelector(selectInvoiceStatusesMap);
  const invoiceStatusColorsMap = useSelector(selectInvoiceStatusColorsMap);
  const invoices              = useSelector(selectInvoices);
  const invoicesLoading       = useSelector(selectInvoicesLoading);
  // `?tab=change-requests` opens the page on that tab — the change request form's Back and Cancel land there.
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab]       = useState(
    () => PROJECT_TABS.find((t) => tabSlug(t) === searchParams.get('tab')) ?? 'Overview'
  );
  const { can } = usePermission();
  // Change requests are ChangeRequests.View's to read (2026-10-19).
  const canViewChangeRequests = allow(can, CR_PERMISSIONS.VIEW);
  const hiddenTabs = useMemo(() => (canViewChangeRequests ? [] : ['Change requests']), [canViewChangeRequests]);
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiving, setArchiving]       = useState(false);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
    dispatch(fetchInvoicesByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  // After a delete: the invoice list, and the BOQ — a deleted In Progress
  // invoice stops holding its items, so their editability changes too.
  const reloadInvoices = useCallback(() => {
    dispatch(fetchInvoicesByProjectCode(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  // aggregateSubProjectFinancials builds a fresh object every call — without
  // this useMemo, ProjectStatCards (and OverviewTab) would get a new `totals`
  // reference on every render of this page (e.g. every tab click), which
  // defeats their React.memo regardless of whether subProjects actually
  // changed.
  /*
   * The sub-project summaries carry every figure except the three about
   * invoices, which are counted from the project's invoices themselves:
   * rejected and cancelled ones are money nobody will pay, so they count
   * towards nothing. See summariseProjectInvoices.
   */
  const totals = useMemo(() => {
    const subTotals = aggregateSubProjectFinancials(subProjects);

    /*
     * Kept to THIS project's invoices. The invoices slice holds one list,
     * shared with the invoices page, so arriving here from there leaves every
     * project's invoices in the store until this project's fetch lands — and a
     * money tile must never show another project's total, even for a moment.
     * Rows that carry no `projectCode` are trusted, since then the fetch is all
     * there is to go on.
     */
    const invoiceTotals = summariseProjectInvoices(
      invoices.filter((i) => !i.projectCode || i.projectCode === projectCode)
    );

    return {
      ...subTotals,
      ...invoiceTotals,
      // Work in progress: revenue earned that the money has not arrived for
      // yet. Counted from what was actually collected rather than from the
      // sub-project summaries, so it moves the moment an invoice is collected.
      wip: subTotals.totalRevenue - invoiceTotals.collectedValue,
    };
  }, [subProjects, invoices, projectCode]);

  // Memoised so ProjectTabs — which is memo'd — isn't handed a brand-new
  // object on every render of this page.
  const tabCounts = useMemo(() => ({
    'EPM Sub-Projects': subProjects.length,
    BOQ: boqItems.length,
    Invoices: invoices.length,
  }), [subProjects.length, boqItems.length, invoices.length]);

  const handleArchive = () => {
    setArchiving(true);
    setTimeout(() => {
      setArchiving(false);
      setArchiveModal(false);
      router.push('/projects');
    }, 600);
  };

  if (mainLoading) {
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
    <MotionConfig reducedMotion="user">
      <div>
        <ConfirmModal
          open={archiveModal}
          onClose={() => setArchiveModal(false)}
          onConfirm={handleArchive}
          title="Archive Project"
          message={`Are you sure you want to archive "${project.contractName}"? This action will move the project to archived status.`}
          confirmLabel="Archive Project"
          loading={archiving}
        />

        <ProjectDetailHeader project={project} projectCode={projectCode} />

        <ProjectStatCards totals={totals} currency={currency} />

        <ProjectTabs activeTab={activeTab} onChange={setActiveTab} counts={tabCounts} hidden={hiddenTabs} />

        {/* Panels cross-fade on switch. Only the active one is mounted, so the
            memoised tabs below still skip re-rendering entirely. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'Overview' && (
              <OverviewTab
                project={project}
                projectCode={projectCode}
                subProjects={subProjects}
                totals={totals}
                currency={currency}
              />
            )}

            {activeTab === 'EPM Sub-Projects' && (
              <SubProjectsTab
                subProjects={subProjects}
                subProjectsLoading={subProjectsLoading}
                currency={currency}
              />
            )}

            {activeTab === 'BOQ' && (
              <BOQTab
                projectCode={projectCode}
                boqItems={boqItems}
                currentBOQ={currentBOQ}
                billingFrequenciesMap={billingFrequenciesMap}
                boqItemStatusesMap={boqItemStatusesMap}
                boqItemStatusColorsMap={boqItemStatusColorsMap}
                currency={currency}
              />
            )}

            {activeTab === 'Invoices' && (
              <InvoicesTab
                projectCode={projectCode}
                invoices={invoices}
                invoicesLoading={invoicesLoading}
                invoiceStatusesMap={invoiceStatusesMap}
                invoiceStatusColorsMap={invoiceStatusColorsMap}
                currency={currency}
                // A delete changes the list and the money totals above it.
                onInvoicesChanged={reloadInvoices}
              />
            )}

            {activeTab === 'Change requests' && canViewChangeRequests && (
              <ChangeRequestsTab
                projectCode={projectCode}
                boqId={currentBOQ?.id ?? null}
                canCreate={allow(can, CR_PERMISSIONS.CREATE)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
