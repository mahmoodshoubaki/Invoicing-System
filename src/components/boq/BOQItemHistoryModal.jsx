'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useDispatch, useSelector } from 'react-redux';

import Modal from '@/components/common/Modal';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { formatCurrency } from '@/utils/formatters';
import {
  selectBillingFrequenciesMap,
  selectBoqItemStatusesMap,
  selectBoqItemStatusColorsMap,
} from '@/store/slices/lookupsSlice';
import {
  fetchBOQItemHistory,
  clearBOQItemHistory,
  selectBOQItemHistory,
  selectBOQItemHistoryLoading,
} from '@/store/slices/boqSlice';

export default function BOQItemHistoryModal({ open, onClose, boqItemId }) {
  const t = useTranslations('boq');
  const format = useLocaleFormat();
  const frequencyLabel = useLookupLabel('billingFrequency');
  const dispatch = useDispatch();
  const currency = useSelector((s) => s.ui.currency);
  const billingFrequenciesMap = useSelector(selectBillingFrequenciesMap);
  const boqStatusesMap = useSelector(selectBoqItemStatusesMap);
  const boqStatusColorsMap = useSelector(selectBoqItemStatusColorsMap);
  const history = useSelector(selectBOQItemHistory);
  const isLoading = useSelector(selectBOQItemHistoryLoading);

  useEffect(() => {
    if (open && boqItemId) {
      dispatch(fetchBOQItemHistory(boqItemId));
    }
    if (!open) {
      dispatch(clearBOQItemHistory());
    }
  }, [dispatch, open, boqItemId]);
  const columns = [
    {
      key: 'englishName',
      label: t('columns.item'),
      render: (val, row) => (
        <>
        <div className={row.isDeleted ? 'opacity-50 line-through' : ''}>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400 mt-0.5" dir="rtl">{row.arabicName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mt-0.5">{row.notes}</p>
        </div>
        </>
      ),
    },
    { key: 'quantity', label: t('columns.qty'), align: 'right' },
    {
      key: 'unitCost',
      label: t('columns.unitCost'),
      align: 'right',
      render: (val) => formatCurrency(val, currency),
    },
    {
      key: 'totalCost',
      label: t('columns.totalCost'),
      align: 'right',
      render: (val) => formatCurrency(val, currency),
    },
    {
      key: 'statusId',
      label: t('columns.status'),
      sortable: false,
      render: (val) => <StatusBadge status={boqStatusesMap[val] ?? String(val)} colors={boqStatusColorsMap[val]} />,
    },
    {
      key: 'baselineInvoicingDate',
      label: t('columns.baselineDate'),
      render: (val) => format.date(val),
    },
    {
      key: 'billingFrequencyId',
      label: t('columns.billingFrequency'),
      render: (val) => frequencyLabel(billingFrequenciesMap[val]) ?? '—',
    },
    {
      key: 'submittedByName',
      label: t('columns.submittedBy'),
      render: (val) => val || '—',
    },
    {
      key: 'updatedOn',
      label: t('columns.updatedOn'),
      render: (val) => format.dateTime(val) || '—',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title={t('history.title')} size="full">
      <Table
        columns={columns}
        data={history}
        rowKey="id"
        isLoading={isLoading}
        emptyMessage={t('history.empty')}
        sortable={false}
      />
    </Modal>
  );
}
