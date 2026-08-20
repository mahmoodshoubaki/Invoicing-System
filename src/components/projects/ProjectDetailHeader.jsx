'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';

/**
 * The project detail page's header — pulled into its own memoized component
 * so switching tabs (or opening/closing the archive modal) doesn't re-render
 * it. PageHeader itself is memoized too, but that only pays off if the
 * breadcrumbs array and actions element it's given are referentially stable
 * — inline `breadcrumbs={[...]}`/`actions={<>...</>}` literals in the parent
 * would defeat that on every render regardless, so both are built with
 * useMemo here instead.
 */
function ProjectDetailHeader({ project, projectCode }) {
  const breadcrumbs = useMemo(() => [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: project.contractName },
  ], [project.contractName]);

  const actions = useMemo(() => (
    <Link href="/projects">
      <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
    </Link>
  ), []);

  return (
    <PageHeader
      title={project.contractName}
      subtitle={`Project Code: ${projectCode}`}
      breadcrumbs={breadcrumbs}
      actions={actions}
    />
  );
}

export default memo(ProjectDetailHeader);
