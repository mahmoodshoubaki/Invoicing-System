'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle } from 'lucide-react';

import Table from '@/components/common/Table';
import { pageInfo } from '@/lib/pageInfo';
import { SettingName } from '@/components/ui/SettingRow';
import { useToast } from '@/hooks/useToast';
import { STATUS } from '@/theme/vizPalette';
import {
  fetchSettings, updateSetting,
  selectSettings, selectSettingsError, selectSettingsLoading, selectSavingSettingKey,
} from '@/store/slices/workflowSlice';
import SettingValueCell from './SettingValueCell';

const PAGE_SIZE = 10;

/**
 * The engine's limits, editable without SQL, a page at a time (2026-10-13).
 * The list comes whole from the server — it is short — so the paging is here.
 * A change applies to the next thing that reads it; nothing is cached and
 * nothing needs restarting.
 *
 * Reading is `Workflows.Manage`; changing needs `Workflows.ManageSettings`.
 *
 * @param {{ canEdit: boolean }} props
 */
export default function EngineLimitsTable({ canEdit }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const settings = useSelector(selectSettings);
  const loading = useSelector(selectSettingsLoading);
  const error = useSelector(selectSettingsError);
  const savingKey = useSelector(selectSavingSettingKey);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const handleSave = useCallback(async (key, value) => {
    const result = await dispatch(updateSetting({ key, value }));
    if (updateSetting.rejected.match(result)) {
      toast.error('Could not save this setting', result.payload);
      return;
    }
    toast.success('Saved', `${key} is now ${result.payload.value}. It applies from the next run.`);
  }, [dispatch, toast]);

  if (error) {
    return (
      <p className="flex items-start gap-1.5 rounded-xl border border-gray-100 bg-white px-4 py-4 text-sm" style={{ color: STATUS.critical }}>
        <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        {error}
      </p>
    );
  }

  const pagination = pageInfo(page, PAGE_SIZE, settings.length, setPage);
  const current = pagination?.page ?? 1;
  const rows = settings.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const columns = [
    {
      key: 'key',
      label: 'Limit',
      width: '60%',
      sortable: false,
      render: (_, setting) => <SettingName setting={setting} retired={setting.isKnown === false} />,
    },
    {
      key: 'value',
      label: 'Value',
      width: '40%',
      sortable: false,
      render: (_, setting) => (
        <SettingValueCell
          key={`${setting.key}:${setting.value}`}
          setting={setting}
          canEdit={canEdit}
          saving={savingKey === setting.key}
          onSave={handleSave}
        />
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={rows}
      rowKey="key"
      isLoading={loading && settings.length === 0}
      sortable={false}
      compact
      emptyMessage="No limits returned."
      pagination={pagination}
    />
  );
}
