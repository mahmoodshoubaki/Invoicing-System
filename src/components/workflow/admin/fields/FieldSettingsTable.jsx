'use client';

import { AlertTriangle } from 'lucide-react';

import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { pageInfo } from '@/lib/pageInfo';
import { useToast } from '@/hooks/useToast';
import { STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import FieldSettingsBar from './FieldSettingsBar';
import OffPageProblems from './OffPageProblems';
import { fieldSettingColumns } from './fieldSettingColumns';
import { useFieldSettings } from './useFieldSettings';

/**
 * One kind of thing's fields, editable (2026-10-13), drawn and paged like the
 * app's other tables. Mounted per kind — the page keys it — so edits to
 * invoice fields never ride along to BOQ items. Save sends only the rows that
 * changed, on every page; without Workflows.ManageSettings there is no Save at
 * all, and every control is read-only.
 *
 * @param {{ targetTypeKey: number, targetLabel: string, canEdit: boolean }} props
 */
export default function FieldSettingsTable({ targetTypeKey, targetLabel, canEdit }) {
  const toast = useToast();
  const page = useFieldSettings(targetTypeKey);
  const problemCount = Object.keys(page.problems).length;

  const save = async () => {
    if (await page.save()) toast.success('Fields saved', `The builder shows ${targetLabel.toLowerCase()} fields this way now.`);
  };

  const problemOf = (name) => page.serverErrors.byName[name] ?? page.problems[name] ?? null;

  // Problems on rows not on this page: a changed row elsewhere, or a refusal for one.
  const shown = new Set(page.rows.map((r) => r.name));
  const labels = new Map(page.changed.map((r) => [r.name, r.label]));
  const offPage = [...new Set([...page.changed.map((r) => r.name), ...Object.keys(page.serverErrors.byName)])]
    .filter((name) => !shown.has(name) && problemOf(name))
    .map((name) => ({ name, label: labels.get(name) ?? name, message: problemOf(name) }));

  const columns = fieldSettingColumns({ canEdit, onEdit: page.edit, changedNames: page.changedNames, problemOf });

  return (
    <div>
      <FieldSettingsBar
        total={page.total}
        changedCount={page.changed.length}
        query={page.query}
        onQuery={page.setQuery}
        canEdit={canEdit}
        saving={page.saving}
        canSave={page.changed.length > 0 && problemCount === 0}
        onDiscard={page.discard}
        onSave={save}
      />

      {page.serverErrors.other.length > 0 && (
        <div className="mb-3 rounded-lg px-3 py-2" style={{ backgroundColor: withAlpha(STATUS.critical, 0.07) }}>
          {page.serverErrors.other.map((m) => (
            <p key={m} className="text-xs" style={{ color: STATUS.critical }}>{m}</p>
          ))}
        </div>
      )}

      <OffPageProblems items={offPage} onShow={page.showField} />

      {page.error ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-6">
          <p className="flex items-start gap-1.5 text-sm" style={{ color: STATUS.critical }}>
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {page.error}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={page.reload}>Try again</Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={page.rows}
          rowKey="name"
          isLoading={!page.ready}
          sortable={false}
          compact
          emptyMessage={page.query.trim() ? `No field matches “${page.query.trim()}”.` : 'This kind of thing has no fields.'}
          pagination={pageInfo(page.page, page.pageSize, page.total, page.setPage, page.setPageSize)}
        />
      )}
    </div>
  );
}
