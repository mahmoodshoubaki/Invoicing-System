'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import {
  ChevronLeft, FileText, User, Calendar, DollarSign, Percent, Trash2, RotateCcw, History, Download,
  ListChecks, Paperclip, PencilLine, Save, Upload,
} from 'lucide-react';
import { MotionConfig } from 'motion/react';

import SubPageHeader from '@/components/common/SubPageHeader';
import FormSection from '@/components/common/FormSection';
import Reveal from '@/components/motion/Reveal';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import VarianceBadge from '@/components/common/VarianceBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { DatePicker, Textarea } from '@/components/forms/FormField';
import ClaimReferenceInput from '@/components/invoices/ClaimReferenceInput';
import { claimReferenceProblem, claimReferenceText, toClaimReference } from '@/lib/claimReference';
import AttachmentUploader from '@/components/invoices/AttachmentUploader';
import InvoiceHistoryModal from '@/components/invoices/InvoiceHistoryModal';
import { formatCurrency, formatDate, formatDateTime, formatPercentage, formatFileSize } from '@/utils/formatters';
import { baselineDateOrPending, invoiceNumberOrPending } from '@/utils/invoiceDisplay';
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
  // What was typed for the claim reference, or null while untouched — then the
  // saved one shows, and is what gets sent: UpdateInvoice CLEARS it when it is
  // left out (2026-10-13).
  const [claimDraft, setClaimDraft] = useState(null);
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
    const claimProblem = claimDraft === null ? null : claimReferenceProblem(claimDraft);
    if (claimProblem) e.financialClaimReference = claimProblem;
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
        financialClaimReference: claimDraft === null ? invoice.financialClaimReference : toClaimReference(claimDraft),
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
    <MotionConfig reducedMotion="user">
    <div className="mx-auto max-w-4xl">
      <InvoiceHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        invoiceId={invoice.id}
        currency={currency}
      />

      <SubPageHeader
        eyebrow="Invoicing"
        title={`Edit ${invoiceNumberOrPending(invoice)}`}
        subtitle={project?.contractName ?? projectCode}
        icon={PencilLine}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: project?.contractName ?? projectCode, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: invoiceNumberOrPending(invoice), href: viewInvoiceHref },
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

      <form onSubmit={handleSubmit}>
       <Reveal className="flex flex-col gap-5">
        {/* Read-only invoice info */}
        <FormSection
          title="Invoice Information"
          subtitle="Read-only — set when the request was submitted"
          icon={FileText}
          tone="muted"
          actions={
            <StatusBadge
              status={invoiceStatusesMap[invoice.statusId] ?? '—'}
              colors={invoiceStatusColorsMap[invoice.statusId]}
            />
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={FileText} label="Invoice Number" value={invoiceNumberOrPending(invoice)} valueClass="font-mono font-semibold" />
            <InfoItem icon={DollarSign} label="Total Amount" value={formatCurrency(invoice.totalAmount, currency)} valueClass="font-semibold text-primary" />
            <InfoItem icon={DollarSign} label="Revenue" value={formatCurrency(invoice.revenue, currency)} />
            <InfoItem icon={DollarSign} label="WIP" value={formatCurrency(invoice.wip, currency)} />
            <InfoItem icon={Percent} label="VAT Rate" value={formatPercentage(invoice.vat)} />
            <InfoItem icon={User} label="Submitted By" value={invoice.submittedByName} />
            <InfoItem icon={Calendar} label="Submission Date" value={formatDateTime(invoice.submissionDate)} />
            <InfoItem icon={Calendar} label="Baseline Expected Collection Date" value={baselineDateOrPending(invoice)} />
            <InfoItem icon={Calendar} label="Updated Expected Collection Date" value={formatDate(invoice.expectedCollectionDate)} />
          </div>
        </FormSection>

        {/* Read-only BOQ lines */}
        <FormSection
          title={`BOQ Line Items (${invoice.lines.length})`}
          subtitle="Line items are fixed once the invoice is raised"
          icon={ListChecks}
          tone="muted"
        >
          {invoice.lines.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No line items on this invoice.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {invoice.lines.map((line) => (
                <div key={line.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-800">{line.itemTitleEnSnapshot}</p>
                  <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
                    <div>
                      <p className="text-gray-400">Submission Variance</p>
                      <div className="mt-0.5"><VarianceBadge days={line.varianceDays} size="sm" /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        {/* Editable: update details */}
        <FormSection
          title="Update Details"
          subtitle="The only fields this request can change"
          icon={PencilLine}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Updated Expected Collection Date"
              required
              value={expectedCollectionDate}
              onChange={(e) => { setexpectedCollectionDate(e.target.value); setErrors((p) => ({ ...p, expectedCollectionDate: undefined })); }}
              error={errors.expectedCollectionDate}
            />
            <ClaimReferenceInput
              value={claimDraft ?? claimReferenceText(invoice.financialClaimReference)}
              onChange={(text) => { setClaimDraft(text); setErrors((p) => ({ ...p, financialClaimReference: undefined })); }}
              error={errors.financialClaimReference}
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
        </FormSection>

        {/* Editable: existing attachments — mark for deletion */}
        <FormSection
          title={`Existing Attachments (${invoice.attachments.length})`}
          subtitle="Download, or mark for removal on save"
          icon={Paperclip}
        >
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
        </FormSection>

        {/* Editable: add new attachments */}
        <FormSection
          title="Add Attachments"
          subtitle="New files are uploaded when you save"
          icon={Upload}
        >
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
        </FormSection>
       </Reveal>

        {/* Actions */}
        <div className="sticky bottom-0 z-10 mt-5 flex items-center justify-end gap-3 rounded-2xl border border-[#e9e7e5] bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(60_60_58/0.18)]">
          <Link href="" onClick={() => router.back()}>
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" icon={Save} loading={saving} disabled={attachmentsUploading}>
            {attachmentsUploading ? 'Uploading attachments…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
    </MotionConfig>
  );
}
