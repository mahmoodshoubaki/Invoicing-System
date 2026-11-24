'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import ErrorNote from '@/components/ui/ErrorNote';
import MarkCollectedDialog from '@/components/invoices/collect/MarkCollectedDialog';
import InvoiceStatusTabs from '@/components/invoices/list/InvoiceStatusTabs';
import { invoiceHref, invoiceListColumns } from '@/components/invoices/list/invoiceListColumns';
import { useAllInvoices } from '@/components/invoices/list/useAllInvoices';
import { INVOICE_PERMISSIONS } from '@/constants/invoicePermissions';
import { ROUTES } from '@/constants/routes';
import { allow } from '@/constants/workflowPermissions';
import { usePermission } from '@/hooks/usePermission';
import { pageInfo } from '@/lib/pageInfo';
import {
  selectInvoiceStatuses, selectInvoiceStatusesMap, selectInvoiceStatusColorsMap,
} from '@/store/slices/lookupsSlice';

function statusFromUrl(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function InvoicesPage() {
  const router = useRouter();
  const t = useTranslations('invoices.list');
  const format = useLocaleFormat();
  const currency = useSelector((s) => s.ui.currency);
  const statuses = useSelector(selectInvoiceStatuses);
  const statusesMap = useSelector(selectInvoiceStatusesMap);
  const colorsMap = useSelector(selectInvoiceStatusColorsMap);
  const searchParams = useSearchParams();
  const statusId = statusFromUrl(searchParams.get('status'));
  const setStatusId = (id) => router.replace(id == null ? ROUTES.INVOICES : ROUTES.INVOICES_WITH_STATUS(id), { scroll: false });
  const list = useAllInvoices(statusId);
  const { can } = usePermission();
  const canMarkCollected = allow(can, INVOICE_PERMISSIONS.MARK_COLLECTED);
  const [collecting, setCollecting] = useState(null);

  const columns = useMemo(
    () => invoiceListColumns({ currency, statusesMap, colorsMap, canMarkCollected, onMarkCollected: setCollecting, t, format }),
    [currency, statusesMap, colorsMap, canMarkCollected, t, format]
  );

  const handleCollected = () => {
    setCollecting(null);
    list.reload();
  };

  return (
    <div>
      <PageHeader
        title={t('title')}
        subtitle={list.loading ? t('loading') : t('count', { count: list.total })}
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
          emptyMessage={t('noInvoices')}
          pagination={pageInfo(list.page, list.pageSize, list.total, list.setPage, list.setPageSize)}
        />
      )}
      {collecting && (
        <MarkCollectedDialog
          invoice={collecting}
          onClose={() => setCollecting(null)}
          onCollected={handleCollected}
        />
      )}
    </div>
  );
}
