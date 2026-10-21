'use client';

import { useSelector } from 'react-redux';
import { CheckSquare, Square } from 'lucide-react';

import { Input } from '@/components/forms/FormField';
import { StatusBadge } from '@/components/common/Badge';
import VarianceBadge from '@/components/common/VarianceBadge';
import { formatCurrency } from '@/utils/formatters';
import {
  selectBillingFrequenciesMap, selectTrackerCycleStatusColorsMap, selectTrackerCycleStatusesMap,
} from '@/store/slices/lookupsSlice';

/**
 * One invoiceable BOQ item: a row that ticks it, and — once ticked — its
 * figures and the quantity to invoice. An item with nothing left to commit
 * cannot be ticked.
 *
 * @param {{
 *   boq: Object, line: { quantity: string } | undefined, qtyError: string|undefined,
 *   currency: string, onToggle: (id) => void, onQuantity: (id, qty) => void,
 * }} props
 */
export default function BoqItemRow({ boq, line, qtyError, currency, onToggle, onQuantity }) {
  const billingFrequenciesMap = useSelector(selectBillingFrequenciesMap);
  const trackerCycleStatusesMap = useSelector(selectTrackerCycleStatusesMap);
  const trackerCycleStatusColorsMap = useSelector(selectTrackerCycleStatusColorsMap);

  const isSelected = !!line;
  const available = boq.availableQuantity;
  const fullyCommitted = available <= 0;
  const lineQty = Number(line?.quantity) || 0;
  const lineTotal = boq.unitCost * lineQty;

  return (
    <div className={isSelected ? 'bg-blue-50' : 'bg-white'}>
      {/* Toggle row */}
      <button
        type="button"
        onClick={() => !fullyCommitted && onToggle(boq.id)}
        disabled={fullyCommitted}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
          ${fullyCommitted
            ? 'opacity-50 cursor-not-allowed'
            : isSelected
            ? 'hover:bg-blue-100'
            : 'hover:bg-gray-50'
          }`}
      >
        <div className={`shrink-0 ${isSelected ? 'text-primary' : 'text-gray-300'}`}>
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{boq.englishName}</p>
          {boq.arabicName && (
            <p className="text-xs text-gray-400 truncate" dir="rtl">{boq.arabicName}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {fullyCommitted && (
            <span className="text-xs text-amber-600 font-medium whitespace-nowrap">Fully committed</span>
          )}
          {boq.trackerCycleNumber != null && (
            <span className="hidden md:flex items-center gap-1.5" title={`Next cycle: ${boq.trackerCycleNumber}`}>
              <StatusBadge
                status={trackerCycleStatusesMap[boq.trackerCycleStatusId] ?? '—'}
                colors={trackerCycleStatusColorsMap[boq.trackerCycleStatusId]}
                size="sm"
              />
              <VarianceBadge days={boq.varianceDays} size="sm" />
            </span>
          )}
          <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
            {billingFrequenciesMap[boq.billingFrequencyId] ?? '—'}
          </span>
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            {formatCurrency(boq.unitCost, currency)}/unit
          </span>
        </div>
      </button>

      {/* Expanded detail + quantity input */}
      {isSelected && (
        <div className="px-4 pb-4 border-t border-blue-100">
          {/* Item stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 text-xs">
            <div>
              <p className="text-gray-400 uppercase tracking-wide">Total Qty</p>
              <p className="font-semibold text-gray-700 mt-0.5">{boq.quantity} units</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide">Unit Cost</p>
              <p className="font-semibold text-gray-700 mt-0.5">{formatCurrency(boq.unitCost, currency)}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide">Committed</p>
              <p className={`font-semibold mt-0.5 ${boq.committedQuantity > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                {boq.committedQuantity} units
              </p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide">Available</p>
              <p className={`font-semibold mt-0.5 ${available <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                {available} units
              </p>
            </div>
            {boq.trackerCycleNumber != null && (
              <div className="col-span-2">
                <p className="text-gray-400 uppercase tracking-wide">Next Invoicing Cycle</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="font-semibold text-gray-700">Cycle {boq.trackerCycleNumber}</span>
                  <StatusBadge
                    status={trackerCycleStatusesMap[boq.trackerCycleStatusId] ?? '—'}
                    colors={trackerCycleStatusColorsMap[boq.trackerCycleStatusId]}
                    size="sm"
                  />
                  <VarianceBadge days={boq.varianceDays} size="sm" />
                </div>
              </div>
            )}
          </div>

          {/* Quantity input + line total */}
          <div className="flex items-start gap-4">
            <div className="w-2xs">
              <Input
                label={`Invoice Quantity (max ${available})`}
                type="number"
                min="1"
                max={available}
                step="1"
                placeholder="0"
                value={line?.quantity ?? ''}
                onChange={(e) => onQuantity(boq.id, e.target.value)}
                error={qtyError}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {lineQty > 0 && (
              <div className="mt-6 flex flex-col gap-0.5">
                <p className="text-xs text-gray-400">Line Total</p>
                <p className="text-base font-bold text-primary">{formatCurrency(lineTotal, currency)}</p>
                <p className="text-xs text-gray-400">
                  {lineQty} × {formatCurrency(boq.unitCost, currency)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
