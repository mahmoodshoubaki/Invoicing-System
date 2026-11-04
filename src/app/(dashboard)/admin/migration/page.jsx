'use client';

import PageHeader from '@/components/common/PageHeader';
import FolderSection from '@/components/admin/migration/FolderSection';
import CheckSection from '@/components/admin/migration/CheckSection';
import ImportSection from '@/components/admin/migration/ImportSection';
import TemplateNote from '@/components/admin/migration/TemplateNote';
import { useMigrationFolder } from '@/components/admin/migration/useMigrationFolder';
import { useMigrationRun } from '@/components/admin/migration/useMigrationRun';

export default function DataMigrationPage() {
  const folder = useMigrationFolder();
  const run = useMigrationRun(folder);
  const busy = run.check.status === 'running' || run.upload.status === 'running';

  return (
    <div>
      <PageHeader
        title="Data migration"
        subtitle="Bring historical BOQ items, invoicing plans, invoices and their files in from a Migrations folder."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin' }, { label: 'Data migration' }]}
      />
      <TemplateNote />
      <div className="flex flex-col gap-5">
        <FolderSection folder={folder} disabled={busy} />
        <CheckSection run={run} />
        <ImportSection run={run} folder={folder} />
      </div>
    </div>
  );
}
