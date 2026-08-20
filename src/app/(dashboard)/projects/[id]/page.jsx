'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';

import Button from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProjectDetailHeader from '@/components/projects/ProjectDetailHeader';
import ProjectStatCards from '@/components/projects/ProjectStatCards';
import ProjectTabs from '@/components/projects/ProjectTabs';
import OverviewTab from '@/components/projects/OverviewTab';
import SubProjectsTab from '@/components/projects/SubProjectsTab';
import BOQTab from '@/components/projects/BOQTab';
import InvoicesTab from '@/components/projects/InvoicesTab';
import {
  fetchMainProjectDetails,
  fetchSubProjectsSummary,
  selectMainProjectDetails,
  selectMainDetailsLoading,
  selectSubProjects,
  selectSubProjectsLoading,
} from '@/store/slices/projectsSlice';
import { aggregateSubProjectFinancials } from '@/models/project';
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
  const [activeTab, setActiveTab]       = useState('Overview');
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiving, setArchiving]       = useState(false);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
    dispatch(fetchInvoicesByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  // aggregateSubProjectFinancials builds a fresh object every call — without
  // this useMemo, ProjectStatCards (and OverviewTab) would get a new `totals`
  // reference on every render of this page (e.g. every tab click), which
  // defeats their React.memo regardless of whether subProjects actually
  // changed.
  const totals = useMemo(() => aggregateSubProjectFinancials(subProjects), [subProjects]);

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

      <ProjectTabs activeTab={activeTab} onChange={setActiveTab} />

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
        />
      )}
    </div>
  );
}
