'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Globe } from 'lucide-react';

import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { pageInfo } from '@/lib/pageInfo';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDate } from '@/utils/formatters';
import { useToast } from '@/hooks/useToast';
import {
  fetchApiDomains, setApiDomainEnabled, selectApiDomains, selectApiDomainsLoading,
} from '@/store/slices/workflowSlice';

const PAGE_SIZE = 10;

/**
 * Where a workflow's API calls may go — this application's own API included —
 * a page at a time (2026-10-13). Every host, not just the allowed ones: a
 * withdrawn host still has to be visible to be put back. The list comes whole
 * from the server, so the paging is here.
 *
 * @param {{ canManage: boolean }} props  Workflows.ManageApiDomains — withdraw and re-enable
 */
export default function ApiDomainsTable({ canManage }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const domains = useSelector(selectApiDomains);
  const loading = useSelector(selectApiDomainsLoading);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchApiDomains());
  }, [dispatch]);

  const toggle = useCallback(async (domain) => {
    const result = await dispatch(setApiDomainEnabled({ domainId: domain.id, isEnabled: !domain.isEnabled }));
    if (setApiDomainEnabled.rejected.match(result)) {
      toast.error('Could not update this host', result.payload);
      return;
    }
    dispatch(fetchApiDomains());
    toast.success(domain.isEnabled ? 'Host withdrawn' : 'Host re-enabled', domain.host);
  }, [dispatch, toast]);

  if (!loading && domains.length === 0) {
    return (
      <p
        className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
        style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
      >
        <Globe size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
        <span>
          Nothing approved yet, so every API call a workflow makes will be refused. Approve the host a workflow
          needs before drawing the step that calls it.
        </span>
      </p>
    );
  }

  const pagination = pageInfo(page, PAGE_SIZE, domains.length, setPage);
  const current = pagination?.page ?? 1;
  const rows = domains.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const columns = [
    {
      key: 'host',
      label: 'Host',
      sortable: false,
      render: (host, domain) => (
        <span className="font-mono text-xs" style={{ color: domain.isEnabled ? CHROME.textPrimary : CHROME.textMuted }}>{host}</span>
      ),
    },
    {
      key: 'description',
      label: 'What it is for',
      sortable: false,
      render: (description) => (
        <span className="text-xs" style={{ color: CHROME.textMuted }}>{description || 'No description'}</span>
      ),
    },
    {
      key: 'approvedOn',
      label: 'Approved',
      sortable: false,
      render: (approvedOn) => <span className="text-xs">{approvedOn ? formatDate(approvedOn) : '—'}</span>,
    },
    {
      key: 'isEnabled',
      label: 'Status',
      sortable: false,
      render: (isEnabled) => (
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={
            isEnabled
              ? { backgroundColor: withAlpha(STATUS.good, 0.12), color: STATUS.good }
              : { backgroundColor: '#f1f0ee', color: CHROME.textMuted }
          }
        >
          {isEnabled ? 'Allowed' : 'Withdrawn'}
        </span>
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      label: '',
      sortable: false,
      resizable: false,
      align: 'right',
      render: (_, domain) => (
        <Button size="sm" variant="outline" onClick={() => toggle(domain)}>
          {domain.isEnabled ? 'Withdraw' : 'Re-enable'}
        </Button>
      ),
    }] : []),
  ];

  return (
    <Table
      columns={columns}
      data={rows}
      rowKey="id"
      isLoading={loading && domains.length === 0}
      sortable={false}
      compact
      pagination={pagination}
    />
  );
}
