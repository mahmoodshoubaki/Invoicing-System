'use client';

import { memo } from 'react';
import Card from '@/components/common/Card';
import InfoRow from './InfoRow';
import { formatCurrency, formatDate } from '@/utils/formatters';

function OverviewTab({ project, projectCode, subProjects, totals, currency }) {
  // Every sub-project shares the same contract dates — any one is a valid
  // source, same convention as the BOQ invoicing tracker.
  const contractInfo = subProjects[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="flex flex-col gap-5">
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
            Contract Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Contract Name" value={project.contractName} />
            <InfoRow label="Project Code" value={projectCode} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
            Contract Timeline
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Contract Start Date" value={formatDate(contractInfo?.contractStartDate)} />
            <InfoRow label="Contract Finish Date" value={formatDate(contractInfo?.contractFinishDate)} />
            <InfoRow label="Contract Signature Date" value={formatDate(contractInfo?.contractSignatureDate)} />
            <InfoRow label="Site Receipt Date" value={formatDate(contractInfo?.siteReceiptDate)} />
            <InfoRow label="Contract Duration" value={contractInfo?.contractDuration} />
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
          Financial Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Project Value" value={formatCurrency(totals.projectValue, currency)} />
          <InfoRow label="VAT Value" value={formatCurrency(totals.vatValue, currency)} />
          <InfoRow label="Total Revenue" value={formatCurrency(totals.totalRevenue, currency)} />
          <InfoRow label="Revenue (P.S)" value={formatCurrency(totals.revenuePS, currency)} />
          <InfoRow label="Revenue SW Licenses" value={formatCurrency(totals.revenueSWLicenses, currency)} />
          <InfoRow label="Revenue Logistics" value={formatCurrency(totals.revenueLogistics, currency)} />
          <InfoRow label="Revenue Training" value={formatCurrency(totals.revenueTraining, currency)} />
          <InfoRow label="Revenue External Sub-Contractors" value={formatCurrency(totals.revenueExternalSubs, currency)} />
          <InfoRow label="Total Invoices" value={formatCurrency(totals.totalInvoicesValue, currency)} />
          <InfoRow label="Collected" value={formatCurrency(totals.collectedValue, currency)} />
          <InfoRow label="Non-Collected" value={formatCurrency(totals.nonCollectedValue, currency)} />
          <InfoRow label="Work in Progress (WIP)" value={formatCurrency(totals.wip, currency)} />
        </div>
      </Card>
    </div>
  );
}

export default memo(OverviewTab);
