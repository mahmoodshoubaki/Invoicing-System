import Link from 'next/link';
import { FolderKanban } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import Button from '@/components/common/Button';
import { formatCurrency } from '@/utils/formatters';

/** The project the request is for, with its revenue and WIP as reference while filling it in. */
export default function ProjectSummarySection({ project, projectCode, projectFinancials, currency }) {
  return (
    <FormSection
      title="Project"
      icon={FolderKanban}
      actions={
        <Link href={`/projects/${encodeURIComponent(projectCode)}`}>
          <Button variant="ghost" size="xs">View project</Button>
        </Link>
      }
    >
      <div>
        <p className="text-sm font-semibold text-[#0b0b0b]">{project.contractName}</p>
        <p className="mt-0.5 font-mono text-xs text-[#898781]">{projectCode}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#f1f0ee] pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#898781]">Project Revenue</p>
          <p className="mt-0.5 text-sm font-semibold text-[#0b0b0b]">
            {formatCurrency(projectFinancials.totalRevenue, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#898781]">Project WIP</p>
          <p className="mt-0.5 text-sm font-semibold text-[#0b0b0b]">
            {formatCurrency(projectFinancials.wip, currency)}
          </p>
        </div>
      </div>
    </FormSection>
  );
}
