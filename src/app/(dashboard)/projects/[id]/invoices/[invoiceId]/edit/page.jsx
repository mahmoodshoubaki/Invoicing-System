'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import {
  ChevronLeft, FileText, User, Calendar, DollarSign, Percent, Trash2, RotateCcw, History, Download,
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { DatePicker, Textarea } from '@/components/forms/FormField';
import AttachmentUploader from '@/components/invoices/AttachmentUploader';
import InvoiceHistoryModal from '@/components/invoices/InvoiceHistoryModal';
import { formatCurrency, formatDate, formatDateTime, formatPercentage, formatFileSize } from '@/utils/formatters';
import { iconForFileName } from '@/utils/attachmentIcon';
import { saveBlob } from '@/utils/saveBlob';
import { fetchInvoiceById, selectSelectedInvoice, selectInvoicesLoading, updateInvoice } from '@/store/slices/invoicesSlice';
import { selectInvoiceStatusesMap, selectInvoiceStatusColorsMap } from '@/store/slices/lookupsSlice';
import { fetchMainProjectDetails, selectMainProjectDetails } from '@/store/slices/projectsSlice';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import { useToast } from '@/hooks/useToast';

function toDateInput(iso) {
  if (!iso) return '';
  return iso.split('T')[0];
}

const InfoItem = ({ icon: Icon, label, value, valueClass = '' }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className="text-gray-500" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm text-gray-800 mt-0.5 ${valueClass}`}>{value || '—'}</p>
    </div>
  </div>
);

export default function EditInvoicePage() {
  // See boq/page.jsx for why the project code segment is decoded defensively.
  const { id: rawId, invoiceId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const router = useRouter();
  const dispatch = useDispatch();
  const toast = useToast();

  const currency = useSelector((s) => s.ui.currency);
  const project = useSelector(selectMainProjectDetails);
  const invoice = useSelector(selectSelectedInvoice);
  const isLoading = useSelector(selectInvoicesLoading);
  const invoiceStatusesMap = useSelector(selectInvoiceStatusesMap);
  const invoiceStatusColorsMap = useSelector(selectInvoiceStatusColorsMap);

  const [reasonsForUpdate, setReasonsForUpdate] = useState('');
  const [expectedCollectionDate, setexpectedCollectionDate] = useState('');
  const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState(new Set());
  const [attachmentsToAdd, setAttachmentsToAdd] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
  }, [dispatch, projectCode]);

  useEffect(() => {
    dispatch(fetchInvoiceById(invoiceId));
  }, [dispatch, invoiceId]);

  useEffect(() => {
    if (invoice?.id === invoiceId) {
      setexpectedCollectionDate(toDateInput(invoice.expectedCollectionDate));
    }
  }, [invoice, invoiceId]);

  const toggleDeleteAttachment = (attachmentId) => {
    setAttachmentIdsToDelete((prev) => {
      const next = new Set(prev);
      next.has(attachmentId) ? next.delete(attachmentId) : next.add(attachmentId);
      return next;
    });
  };

  const handleDownload = async (attachment) => {
    setDownloadingIds((prev) => new Set(prev).add(attachment.id));
    try {
      const { blob, fileName } = await invoiceRepository.downloadAttachment(
        invoice.id, attachment.contentId, attachment.fileName
      );
      saveBlob(blob, fileName);
    } catch (err) {
      toast.error('Download failed', err?.message ?? 'Please try again.');
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(attachment.id);
        return next;
      });
    }
  };

  // The detail page isn't nested under the project route, so it's still
  // reached with the project code passed along as a query param.
  const viewInvoiceHref = `/invoices/${invoiceId}?projectCode=${encodeURIComponent(projectCode)}`;
  const attachmentsUploading = attachmentsToAdd.some((a) => a.status === 'uploading');

  const validate = () => {
    const e = {};
    if (!reasonsForUpdate.trim()) e.reasonsForUpdate = 'A reason for this update is required';
    if (!expectedCollectionDate) e.expectedCollectionDate = 'Expected Collection date is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await dispatch(updateInvoice({
        invoiceId,
        reasonsForUpdate,
        expectedCollectionDate,
        attachmentIdsToDelete: Array.from(attachmentIdsToDelete),
        attachmentsToAdd,
      })).unwrap();

      toast.success('Invoice updated', 'The invoice was updated successfully.');
      await dispatch(fetchInvoiceById(invoiceId));
      router.push(viewInvoiceHref);
    } catch (err) {
      toast.error('Failed to update invoice', err ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Invoice not found.</p>
        <Link href={`/projects/${encodeURIComponent(projectCode)}`}>
          <Button variant="outline" className="mt-4">Back to Project</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <InvoiceHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        invoiceId={invoice.id}
        currency={currency}
      />

      <PageHeader
        title={`Edit ${invoice.invoiceNumber}`}
        subtitle={projectCode}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: project?.contractName ?? projectCode, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: invoice.invoiceNumber, href: viewInvoiceHref },
          { label: 'Edit' },
        ]}
        actions={
          <>
            <Button variant="ghost" icon={History} size="sm" onClick={() => setHistoryOpen(true)}>
              History
            </Button>
            <Link href="" onClick={() => router.back()}>
              <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
            </Link>
          </>
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Read-only invoice info */}
        <Card>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Invoice Information</h3>
            <StatusBadge
              status={invoiceStatusesMap[invoice.statusId] ?? '—'}
              colors={invoiceStatusColorsMap[invoice.statusId]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={FileText} label="Invoice Number" value={invoice.invoiceNumber} valueClass="font-mono font-semibold" />
            <InfoItem icon={DollarSign} label="Total Amount" value={formatCurrency(invoice.totalAmount, currency)} valueClass="font-semibold text-primary" />
            <InfoItem icon={DollarSign} label="Revenue" value={formatCurrency(invoice.revenue, currency)} />
            <InfoItem icon={DollarSign} label="WIP" value={formatCurrency(invoice.wip, currency)} />
            <InfoItem icon={Percent} label="VAT Rate" value={formatPercentage(invoice.vat)} />
            <InfoItem icon={User} label="Submitted By" value={invoice.submittedBy} />
            <InfoItem icon={Calendar} label="Submission Date" value={formatDateTime(invoice.submissionDate)} />
            <InfoItem icon={Calendar} label="Baseline Expected Collection Date" value={formatDate(invoice.baselineCollectionDate)} />
            <InfoItem icon={Calendar} label="Updated Expected Collection Date" value={formatDate(invoice.expectedCollectionDate)} />
          </div>
        </Card>

        {/* Read-only BOQ lines */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
            BOQ Line Items ({invoice.lines.length})
          </h3>
          {invoice.lines.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No line items on this invoice.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {invoice.lines.map((line) => (
                <div key={line.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-800">{line.itemTitleEnSnapshot}</p>
                  <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400">Quantity</p>
                      <p className="font-semibold text-gray-700">{line.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Billed Unit Price</p>
                      <p className="font-semibold text-gray-700">{formatCurrency(line.billedUnitPrice, currency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Line Total</p>
                      <p className="font-semibold text-primary">{formatCurrency(line.billedUnitPrice * line.quantity, currency)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Editable: update details */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
            Update Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Updated Expected Collection Date"
              required
              value={expectedCollectionDate}
              onChange={(e) => { setexpectedCollectionDate(e.target.value); setErrors((p) => ({ ...p, expectedCollectionDate: undefined })); }}
              error={errors.expectedCollectionDate}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Reason for Update"
                required
                rows={3}
                placeholder="Explain why this invoice is being updated..."
                value={reasonsForUpdate}
                onChange={(e) => { setReasonsForUpdate(e.target.value); setErrors((p) => ({ ...p, reasonsForUpdate: undefined })); }}
                error={errors.reasonsForUpdate}
              />
            </div>
          </div>
        </Card>

        {/* Editable: existing attachments — mark for deletion */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
            Existing Attachments ({invoice.attachments.length})
          </h3>
          {invoice.attachments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No existing attachments.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {invoice.attachments.map((attachment) => {
                const Icon = iconForFileName(attachment.fileName);
                const markedForDeletion = attachmentIdsToDelete.has(attachment.id);
                return (
                  <div
                    key={attachment.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors
                      ${markedForDeletion ? 'border-red-200 bg-red-50/60' : 'border-gray-100 bg-gray-50/60'}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${markedForDeletion ? 'text-red-400 line-through' : 'text-gray-800'}`}>
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatFileSize(attachment.fileSize)}
                        {attachment.uploadedBy && ` · Uploaded by ${attachment.uploadedBy}`}
                        {markedForDeletion && ' · Will be removed'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      icon={Download}
                      loading={downloadingIds.has(attachment.id)}
                      onClick={() => handleDownload(attachment)}
                      title="Download"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      icon={markedForDeletion ? RotateCcw : Trash2}
                      className={markedForDeletion ? '' : 'text-red-500 hover:bg-red-50'}
                      onClick={() => toggleDeleteAttachment(attachment.id)}
                      title={markedForDeletion ? 'Keep this attachment' : 'Remove this attachment'}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Editable: add new attachments */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
            Add Attachments
          </h3>
          <AttachmentUploader
            files={attachmentsToAdd}
            onChange={setAttachmentsToAdd}
            disabled={saving}
            onRejected={(rejected) => {
              rejected.forEach(({ file, reason }) => {
                toast.error('Attachment not added', `${file.name}: ${reason}`);
              });
            }}
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href="" onClick={() => router.back()}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={saving} disabled={attachmentsUploading}>
            {attachmentsUploading ? 'Uploading attachments…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
