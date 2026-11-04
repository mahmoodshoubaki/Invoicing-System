'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import ErrorNote from '@/components/ui/ErrorNote';
import InvoiceStatusTabs from '@/components/invoices/list/InvoiceStatusTabs';
import { invoiceHref, invoiceListColumns } from '@/components/invoices/list/invoiceListColumns';
import { useAllInvoices } from '@/components/invoices/list/useAllInvoices';
import { ROUTES } from '@/constants/routes';
import { pageInfo } from '@/lib/pageInfo';
import {
  selectInvoiceStatuses, selectInvoiceStatusesMap, selectInvoiceStatusColorsMap,
} from '@/store/slices/lookupsSlice';

/** `?status=<id>` as a status id, or null for every status. */
function statusFromUrl(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Every invoice the user can see, across projects, newest first. The open tab lives in the address. */
export default function InvoicesPage() {
  const router = useRouter();
  const currency = useSelector((s) => s.ui.currency);
  const statuses = useSelector(selectInvoiceStatuses);
  const statusesMap = useSelector(selectInvoiceStatusesMap);
  const colorsMap = useSelector(selectInvoiceStatusColorsMap);
  const searchParams = useSearchParams();
  const statusId = statusFromUrl(searchParams.get('status'));
  const setStatusId = (id) => router.replace(id == null ? ROUTES.INVOICES : ROUTES.INVOICES_WITH_STATUS(id), { scroll: false });
  const list = useAllInvoices(statusId);

  const columns = useMemo(
    () => invoiceListColumns({ currency, statusesMap, colorsMap }),
    [currency, statusesMap, colorsMap]
  );

  return (
    <div>
      <PageHeader
        title="Invoice Requests"
        subtitle={list.loading ? 'Loading…' : `${list.total} invoice${list.total === 1 ? '' : 's'}`}
      />
      <InvoiceStatusTabs statuses={statuses} value={statusId} onChange={setStatusId} />
      {list.error ? (
        <ErrorNote error={list.error} onRetry={list.reload} />
      ) : (
        <Table
          columns={columns}
          data={list.rows}
          isLoading={list.loading}
          onRowClick={(row) => router.push(invoiceHref(row))}
          sortable={false}
          emptyMessage="No invoices"
          pagination={pageInfo(list.page, list.pageSize, list.total, list.setPage, list.setPageSize)}
        />
      )}
    </div>
  );
}
