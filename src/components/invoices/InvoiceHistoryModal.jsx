'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, DollarSign, User, Calendar, Percent, Paperclip, Download, BadgeQuestionMarkIcon } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/Badge';
import VarianceBadge from '@/components/common/VarianceBadge';
import { formatCurrency, formatDateTime, formatDate, formatPercentage, formatFileSize } from '@/utils/formatters';
import { iconForFileName } from '@/utils/attachmentIcon';
import { saveBlob } from '@/utils/saveBlob';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import { useToast } from '@/hooks/useToast';
import {
  fetchInvoiceHistory,
  clearInvoiceHistory,
  selectInvoiceHistory,
  selectInvoiceHistoryLoading,
} from '@/store/slices/invoicesSlice';
import { selectInvoiceStatusesMap, selectInvoiceStatusColorsMap } from '@/store/slices/lookupsSlice';

function HistoryEntry({ entry, isLatest, currency, invoiceId, invoiceStatusesMap, invoiceStatusColorsMap }) {
  const [expanded, setExpanded] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const toast = useToast();

  const handleDownload = async (attachment) => {
    setDownloadingIds((prev) => new Set(prev).add(attachment.id));
    try {
      // invoiceId (not entry.id) — every history entry is a snapshot of the
      // same live invoice, so the download endpoint's InvoiceId is constant
      // across the whole timeline.
      const { blob, fileName } = await invoiceRepository.downloadAttachment(
        invoiceId, attachment.contentId, attachment.fileName
      );
      saveBlob(blob, fileName);
    } catch (err) {
      toast.error('Download failed', err?.message ?? 'This file may no longer be available.');
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(attachment.id);
        return next;
      });
    }
  };

  return (
    <div className="relative pl-9">
      {/* Timeline rail */}
      <div className={`absolute left-2.25 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${isLatest ? 'bg-primary' : 'bg-gray-300'}`} />
      <div className="absolute left-3.5 top-4 bottom-0 w-px bg-gray-200 last:hidden" />

      <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50/70 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="min-w-0 flex items-center gap-3">
            <StatusBadge
              status={invoiceStatusesMap[entry.statusId] ?? '—'}
              colors={invoiceStatusColorsMap[entry.statusId]}
            />
            <p className="text-xs text-gray-500 truncate">{formatDateTime(entry.submissionDate)}</p>
            {isLatest && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                Latest
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-gray-800">{formatCurrency(entry.totalAmount, currency)}</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {expanded && (
          <div className="px-4 py-4 border-t border-gray-100 flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-gray-400 flex items-center gap-1"><DollarSign size={11} /> Revenue</p>
                <p className="font-semibold text-gray-700 mt-0.5">{formatCurrency(entry.revenue, currency)}</p>
              </div>
              <div>
                <p className="text-gray-400 flex items-center gap-1"><DollarSign size={11} /> WIP</p>
                <p className="font-semibold text-gray-700 mt-0.5">{formatCurrency(entry.wip, currency)}</p>
              </div>
              <div>
                <p className="text-gray-400 flex items-center gap-1"><Percent size={11} /> VAT</p>
                <p className="font-semibold text-gray-700 mt-0.5">{formatPercentage(entry.vat)}</p>
              </div>
              <div>
                <p className="text-gray-400 flex items-center gap-1"><User size={11} /> Submitted By</p>
                <p className="font-semibold text-gray-700 mt-0.5 truncate">{entry.submittedBy ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 flex items-center gap-1"><Calendar size={11} /> Baseline Collection</p>
                <p className="font-semibold text-gray-700 mt-0.5">{formatDate(entry.baselineCollectionDate) || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 flex items-center gap-1"><Calendar size={11} /> Expected Collection</p>
                <p className="font-semibold text-gray-700 mt-0.5">{formatDate(entry.expectedCollectionDate) || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 flex items-center gap-1"><BadgeQuestionMarkIcon size={11} /> Reasons For Update</p>
                <p className="font-semibold text-gray-700 mt-0.5">{entry.reasonsForUpdate || '—'}</p>
              </div>
            </div>

            {entry.lines.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  BOQ Line Items ({entry.lines.length})
                </p>
                <div className="flex flex-col gap-2">
                  {entry.lines.map((line) => (
                    <div key={line.id} className="p-2.5 bg-gray-50 rounded-lg text-xs">
                      <p className="font-medium text-gray-800">{line.itemTitleEnSnapshot}</p>
                      <div className="flex items-center gap-3 mt-1 text-gray-500">
                        <span>Qty: {line.quantity}</span>
                        <span>Unit: {formatCurrency(line.billedUnitPrice, currency)}</span>
                        <span className="font-semibold text-primary">
                          Total: {formatCurrency(line.billedUnitPrice * line.quantity, currency)}
                        </span>
                      </div>
                      {line.varianceDays != null && (
                        <div className="mt-1.5"><VarianceBadge days={line.varianceDays} size="sm" /></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entry.attachments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Paperclip size={11} /> Attachments ({entry.attachments.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {entry.attachments.map((attachment) => {
                    const Icon = iconForFileName(attachment.fileName);
                    return (
                      <div key={attachment.id} className="flex items-center gap-2 text-xs text-gray-600">
                        <Icon size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate flex-1">{attachment.fileName}</span>
                        <span className="text-gray-400 shrink-0">{formatFileSize(attachment.fileSize)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          icon={Download}
                          loading={downloadingIds.has(attachment.id)}
                          onClick={() => handleDownload(attachment)}
                          title="Download"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Shows past revisions of an invoice as a timeline — each entry is a full
 * snapshot (same shape as GetInvoiceById), sorted newest first. Sorted by
 * submissionDate rather than creationDate: real API responses have shown
 * creationDate defaulting to .NET's zero-date (0001-01-01) when unset,
 * while submissionDate is reliably populated.
 */
export default function InvoiceHistoryModal({ open, onClose, invoiceId, currency }) {
  const dispatch = useDispatch();
  const history = useSelector(selectInvoiceHistory);
  const isLoading = useSelector(selectInvoiceHistoryLoading);
  const invoiceStatusesMap = useSelector(selectInvoiceStatusesMap);
  const invoiceStatusColorsMap = useSelector(selectInvoiceStatusColorsMap);

  useEffect(() => {
    if (open && invoiceId) {
      dispatch(fetchInvoiceHistory(invoiceId));
    }
    if (!open) {
      dispatch(clearInvoiceHistory());
    }
  }, [dispatch, open, invoiceId]);

  const sorted = [...history].sort(
    (a, b) => new Date(b.submissionDate ?? 0) - new Date(a.submissionDate ?? 0)
  );

  return (
    <Modal open={open} onClose={onClose} title="Invoice History" size="xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16">No history recorded for this invoice yet.</p>
      ) : (
        <div className="flex flex-col">
          {sorted.map((entry, i) => (
            <HistoryEntry
              // Every entry is a snapshot of the same invoice, so `entry.id`
              // repeats across the list — index is the only stable key here.
              key={i}
              entry={entry}
              isLatest={i === 0}
              currency={currency}
              invoiceId={invoiceId}
              invoiceStatusesMap={invoiceStatusesMap}
              invoiceStatusColorsMap={invoiceStatusColorsMap}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
