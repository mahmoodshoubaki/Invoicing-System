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
import { hasMainProject } from '@/lib/changeRequest/projectDraft';
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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab]       = useState(
    () => PROJECT_TABS.find((t) => tabSlug(t) === searchParams.get('tab')) ?? 'Overview'
  );
  const { can } = usePermission();
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

  const reloadInvoices = useCallback(() => {
    dispatch(fetchInvoicesByProjectCode(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  const totals = useMemo(() => {
    const subTotals = aggregateSubProjectFinancials(subProjects);

    const invoiceTotals = summariseProjectInvoices(
      invoices.filter((i) => !i.projectCode || i.projectCode === projectCode)
    );

    return {
      ...subTotals,
      ...invoiceTotals,
      wip: subTotals.totalRevenue - invoiceTotals.collectedValue,
    };
  }, [subProjects, invoices, projectCode]);

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
                onInvoicesChanged={reloadInvoices}
              />
            )}

            {activeTab === 'Change requests' && canViewChangeRequests && (
              <ChangeRequestsTab
                projectCode={projectCode}
                boqId={currentBOQ?.id ?? null}
                canCreate={allow(can, CR_PERMISSIONS.CREATE) && hasMainProject(subProjects)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
