'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Modal from '@/components/common/Modal';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
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

/**
 * Shows past revisions of a single BOQ item. Used from both the standalone
 * Manage BOQ page and the BOQ tab on the project detail page.
 */
export default function BOQItemHistoryModal({ open, onClose, boqItemId }) {
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
      label: 'Item',
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
    { key: 'quantity', label: 'Qty', align: 'right' },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      align: 'right',
      render: (val) => formatCurrency(val, currency),
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      align: 'right',
      render: (val) => formatCurrency(val, currency),
    },
    {
      key: 'statusId',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={boqStatusesMap[val] ?? String(val)} colors={boqStatusColorsMap[val]} />,
    },
    {
      key: 'baselineInvoicingDate',
      label: 'Baseline Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'billingFrequencyId',
      label: 'Billing Frequency',
      render: (val) => billingFrequenciesMap[val] ?? '—',
    },
    {
      key: 'updatedOn',
      label: 'Updated On',
      render: (val) => formatDateTime(val) ?? '—',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="BOQ Item History" size="full">
      <Table
        columns={columns}
        data={history}
        rowKey="id"
        isLoading={isLoading}
        emptyMessage="No history recorded for this item yet."
        sortable={false}
      />
    </Modal>
  );
}
