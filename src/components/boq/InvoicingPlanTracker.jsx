'use client';

import { useSelector } from 'react-redux';
import { Plus, Trash2, Lock } from 'lucide-react';
import Button from '@/components/common/Button';
import { DatePicker } from '@/components/forms/FormField';
import { StatusBadge } from '@/components/common/Badge';
import VarianceBadge from '@/components/common/VarianceBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/formatters';
import { selectTrackerCycleStatusesMap, selectTrackerCycleStatusColorsMap } from '@/store/slices/lookupsSlice';
import { TRACKER_CYCLE_STATUS } from '@/constants/statuses';

function recalculate(cycles) {
  const total = cycles.length;
  return cycles.map((c, i) => ({ ...c, cycleNumber: i + 1, totalCycles: total }));
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addOneDay(dateStr) {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

function latestDate(...dates) {
  return dates.filter(Boolean).reduce((latest, d) => (!latest || d > latest ? d : latest), null);
}

function lastWorkingDayOnOrBefore(dateStr) {
  if (!dateStr) return dateStr;
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0 = Sunday ... 5 = Friday, 6 = Saturday
  if (day === 5) date.setDate(date.getDate() - 1);
  else if (day === 6) date.setDate(date.getDate() - 2);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * @param {object} props
 * @param {Array} props.cycles
 * @param {(cycles: Array) => void} props.onChange
 * @param {string} [props.minDate]
 * @param {string} [props.maxDate]
 * @param {boolean} [props.loading]
 * @param {string|null} [props.error]
 * @param {boolean} [props.ready]
 * @param {boolean} [props.disabled]
 * @param {string} [props.anchorDateLabel]
 */
export default function InvoicingPlanTracker({
  cycles, onChange, minDate, maxDate, loading = false, error = null, ready = false, disabled = false,
  anchorDateLabel = 'Baseline Invoicing Date',
}) {
  const statusesMap = useSelector(selectTrackerCycleStatusesMap);
  const statusColorsMap = useSelector(selectTrackerCycleStatusColorsMap);

  const effectiveMaxDate = maxDate ? lastWorkingDayOnOrBefore(maxDate) : maxDate;

  const scheduledStatusId = (() => {
    const entry = Object.entries(statusesMap).find(([, label]) => label === TRACKER_CYCLE_STATUS.SCHEDULED);
    return entry ? Number(entry[0]) : null;
  })();

  const statusLabel = (cycle) => statusesMap[cycle.statusId] ?? null;
  const isLocked = (cycle) => {
    if (cycle.isCommitted) return true;
    const label = statusLabel(cycle);
    return label ? label !== TRACKER_CYCLE_STATUS.SCHEDULED : false;
  };

  const rowMinDate = (index) => {
    const previous = cycles[index - 1];
    return latestDate(minDate, todayIso(), previous?.plannedDate ? addOneDay(previous.plannedDate) : null);
  };

  const updateDate = (index, value) => {
    onChange(cycles.map((c, i) => (i === index ? { ...c, plannedDate: value } : c)));
  };

  const removeRow = (index) => {
    onChange(recalculate(cycles.filter((_, i) => i !== index)));
  };

  const addRow = () => {
    onChange(recalculate([
      ...cycles,
      { id: null, cycleNumber: 0, totalCycles: 0, plannedDate: '', isCommitted: false, statusId: scheduledStatusId },
    ]));
  };

  const lastCycle = cycles[cycles.length - 1];
  const canAddRow = cycles.length === 0 || Boolean(
    lastCycle?.plannedDate && (!effectiveMaxDate || lastCycle.plannedDate < effectiveMaxDate)
  );

  if (loading && cycles.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 text-center py-8">{error}</p>;
  }

  if (!ready && cycles.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        Fill in the {anchorDateLabel} and Billing Frequency above to generate the invoicing plan.
      </p>
    );
  }

  return (
    <div>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/75 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
            <LoadingSpinner size="sm" message="Regenerating invoicing plan…" />
          </div>
        )}
        {cycles.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No cycles generated yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Cycle</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Planned Date</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Variance</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cycles.map((cycle, index) => {
                const locked = isLocked(cycle);
                const label = statusLabel(cycle);
                return (
                  <tr key={cycle.id ?? `new-${index}`} className={locked ? 'bg-gray-50/70' : ''}>
                    <td className={`px-3 py-2.5 font-medium whitespace-nowrap ${locked ? 'text-gray-400' : 'text-gray-700'}`}>
                      {cycle.cycleNumber} / {cycle.totalCycles}
                    </td>
                    <td className="px-3 py-2.5">
                      {locked ? (
                        <span className="text-gray-400">{formatDate(cycle.plannedDate)}</span>
                      ) : (
                        <DatePicker
                          value={cycle.plannedDate ? String(cycle.plannedDate).slice(0, 10) : ''}
                          min={rowMinDate(index) || undefined}
                          max={effectiveMaxDate || undefined}
                          disabled={disabled}
                          onChange={(e) => updateDate(index, e.target.value)}
                          className="py-1.5"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {label ? (
                        <StatusBadge status={label} colors={statusColorsMap[cycle.statusId]} size="sm" />
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <VarianceBadge days={cycle.varianceDays} size="sm" />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {locked ? (
                        <span className="inline-flex items-center justify-center text-gray-300" title="Locked">
                          <Lock size={13} />
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          icon={Trash2}
                          className="text-red-500 hover:bg-red-50"
                          disabled={disabled}
                          onClick={() => removeRow(index)}
                          title="Delete cycle"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3">
        {!canAddRow && cycles.length > 0 && (
          <span className="text-xs text-gray-400">
            {lastCycle?.plannedDate
              ? "The last cycle is already on the contract finish date — no room for another."
              : 'Set a date for the last cycle to add another.'}
          </span>
        )}
        {canAddRow && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Plus}
            disabled={disabled || loading}
            onClick={addRow}
          >
            Add Cycle
          </Button>
        )}
      </div>
    </div>
  );
}
