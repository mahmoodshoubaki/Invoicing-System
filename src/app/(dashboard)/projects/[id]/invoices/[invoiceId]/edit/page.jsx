'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { decodeRouteParam } from '@/lib/routeParam';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import {
  ChevronLeft, FileText, User, Calendar, DollarSign, Percent, Trash2, RotateCcw, History, Download,
  ListChecks, Paperclip, PencilLine, Save, Upload,
} from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import SubPageHeader from '@/components/common/SubPageHeader';
import FormSection from '@/components/common/FormSection';
import Reveal from '@/components/motion/Reveal';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import VarianceBadge from '@/components/common/VarianceBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { DatePicker, Textarea } from '@/components/forms/FormField';
import ClaimReferenceInput from '@/components/invoices/ClaimReferenceInput';
import { claimReferenceText } from '@/lib/claimReference';
import { invoiceChanges, invoiceFormProblems, toDateInput } from '@/lib/invoiceUpdate';
import AttachmentUploader from '@/components/invoices/AttachmentUploader';
import InvoiceHistoryModal from '@/components/invoices/InvoiceHistoryModal';
import { formatCurrency, formatPercentage, formatFileSize } from '@/utils/formatters';
import { baselineDateOrPending, invoiceNumberOrPending } from '@/utils/invoiceDisplay';
import { iconForFileName } from '@/utils/attachmentIcon';
import { saveBlob } from '@/utils/saveBlob';
import { fetchInvoiceById, selectSelectedInvoice, selectInvoicesLoading, updateInvoice } from '@/store/slices/invoicesSlice';
import { selectInvoiceStatusesMap, selectInvoiceStatusColorsMap } from '@/store/slices/lookupsSlice';
import { fetchMainProjectDetails, selectMainProjectDetails } from '@/store/slices/projectsSlice';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import { useToast } from '@/hooks/useToast';

const InfoItem = ({ icon: Icon, label, value, valueClass = '' }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className="text-gray-500" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm text-gray-800 mt-0.5 ${valueClass}`}><span dir="auto">{value || '—'}</span></p>
    </div>
  </div>
);

export default function EditInvoicePage() {
  const { id: rawId, invoiceId } = useParams();
  const t = useTranslations('invoices.form');
  const format = useLocaleFormat();
  const projectCode = decodeRouteParam(rawId);
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
  const [dateDraft, setDateDraft] = useState(null);
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
      toast.error(t('downloadFailed'), err?.message ?? t('tryAgain'));
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(attachment.id);
        return next;
      });
    }
  };

  const viewInvoiceHref = `/invoices/${invoiceId}?projectCode=${encodeURIComponent(projectCode)}`;
  const attachmentsUploading = attachmentsToAdd.some((a) => a.status === 'uploading');
  const showsThisInvoice = invoice?.id === invoiceId;
  const expectedCollectionDate = dateDraft ?? (showsThisInvoice ? toDateInput(invoice.expectedCollectionDate) : '');
  const claimReference = claimDraft ?? (showsThisInvoice ? claimReferenceText(invoice.financialClaimReference) : '');
  const form = {
    expectedCollectionDate,
    claimReference,
    reasonsForUpdate,
    attachmentIdsToDelete: Array.from(attachmentIdsToDelete),
    attachmentsToAdd,
  };
  const changes = showsThisInvoice ? invoiceChanges(invoice, form) : {};
  const hasChanges = Object.keys(changes).length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = invoiceFormProblems(invoice, form, t);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!hasChanges) return;
    setSaving(true);
    try {
      await dispatch(updateInvoice({ invoiceId, ...changes })).unwrap();

      toast.success(t('updated'), t('updatedBody'));
      await dispatch(fetchInvoiceById(invoiceId));
      router.push(viewInvoiceHref);
    } catch (err) {
      toast.error(t('updateFailed'), err ?? t('tryAgain'));
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
        <p className="text-gray-500">{t('notFound')}</p>
        <Link href={`/projects/${encodeURIComponent(projectCode)}`}>
          <Button variant="outline" className="mt-4">{t('backToProject')}</Button>
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
        eyebrow={t('eyebrow')}
        title={t('editInvoice', { number: invoiceNumberOrPending(invoice, t('pendingNumber')) })}
        subtitle={project?.contractName ?? projectCode}
        icon={PencilLine}
        breadcrumbs={[
          { label: t('home'), href: '/' },
          { label: t('projects'), href: '/projects' },
          { label: project?.contractName ?? projectCode, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: invoiceNumberOrPending(invoice, t('pendingNumber')), href: viewInvoiceHref },
          { label: t('edit') },
        ]}
        actions={
          <>
            <Button variant="ghost" icon={History} size="sm" onClick={() => setHistoryOpen(true)}>
              {t('history')}
            </Button>
            <Link href="" onClick={() => router.back()}>
              <Button variant="ghost" icon={ChevronLeft} iconClassName="rtl:-scale-x-100" size="sm">{t('back')}</Button>
            </Link>
          </>
        }
      />

      <form onSubmit={handleSubmit}>
       <Reveal className="flex flex-col gap-5">
        <FormSection
          title={t('invoiceInfo')}
          subtitle={t('readOnlyHint')}
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
            <InfoItem icon={FileText} label={t('invoiceNumber')} value={invoiceNumberOrPending(invoice, t('pendingNumber'))} valueClass="font-mono font-semibold" />
            <InfoItem icon={DollarSign} label={t('totalAmount')} value={formatCurrency(invoice.totalAmount, currency)} valueClass="font-semibold text-primary" />
            <InfoItem icon={DollarSign} label={t('revenue')} value={formatCurrency(invoice.revenue, currency)} />
            <InfoItem icon={DollarSign} label={t('wip')} value={formatCurrency(invoice.wip, currency)} />
            <InfoItem icon={Percent} label={t('vatRate')} value={formatPercentage(invoice.vat)} />
            <InfoItem icon={User} label={t('submittedBy')} value={invoice.submittedByName} />
            <InfoItem icon={Calendar} label={t('submissionDate')} value={format.dateTime(invoice.submissionDate)} />
            <InfoItem icon={Calendar} label={t('baselineCollection')} value={baselineDateOrPending(invoice, t('pendingDate'), format.date)} />
            <InfoItem icon={Calendar} label={t('updatedCollection')} value={format.date(invoice.expectedCollectionDate)} />
          </div>
        </FormSection>

        <FormSection
          title={t('lineItems', { count: invoice.lines.length })}
          subtitle={t('linesFixedHint')}
          icon={ListChecks}
          tone="muted"
        >
          {invoice.lines.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('noLines')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {invoice.lines.map((line) => (
                <div key={line.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-800">{line.itemTitleEnSnapshot}</p>
                  <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400">{t('quantity')}</p>
                      <p className="font-semibold text-gray-700">{line.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">{t('billedUnitPrice')}</p>
                      <p className="font-semibold text-gray-700">{formatCurrency(line.billedUnitPrice, currency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">{t('lineTotal')}</p>
                      <p className="font-semibold text-primary">{formatCurrency(line.billedUnitPrice * line.quantity, currency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">{t('submissionVariance')}</p>
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
          title={t('updateDetails')}
          subtitle={t('updateDetailsHint')}
          icon={PencilLine}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label={t('updatedCollection')}
              value={expectedCollectionDate}
              onChange={(e) => { setDateDraft(e.target.value); setErrors((p) => ({ ...p, expectedCollectionDate: undefined })); }}
              error={errors.expectedCollectionDate}
            />
            <ClaimReferenceInput
              value={claimReference}
              onChange={(text) => { setClaimDraft(text); setErrors((p) => ({ ...p, financialClaimReference: undefined })); }}
              error={errors.financialClaimReference}
              disabled={saving}
            />
            <div className="md:col-span-2">
              <Textarea
                label={t('reasonForUpdate')}
                rows={3}
                placeholder={t('reasonPlaceholder')}
                value={reasonsForUpdate}
                onChange={(e) => { setReasonsForUpdate(e.target.value); setErrors((p) => ({ ...p, reasonsForUpdate: undefined })); }}
                error={errors.reasonsForUpdate}
              />
            </div>
          </div>
        </FormSection>

        {/* Editable: existing attachments — mark for deletion */}
        <FormSection
          title={t('existingAttachments', { count: invoice.attachments.length })}
          subtitle={t('attachmentsActionsHint')}
          icon={Paperclip}
        >
          {invoice.attachments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('noExisting')}</p>
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
                        {attachment.uploadedBy && ` · ${t('uploadedBy', { name: attachment.uploadedBy })}`}
                        {markedForDeletion && ` · ${t('willBeRemoved')}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      icon={Download}
                      loading={downloadingIds.has(attachment.id)}
                      onClick={() => handleDownload(attachment)}
                      title={t('download')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      icon={markedForDeletion ? RotateCcw : Trash2}
                      className={markedForDeletion ? '' : 'text-red-500 hover:bg-red-50'}
                      onClick={() => toggleDeleteAttachment(attachment.id)}
                      title={markedForDeletion ? t('keepAttachment') : t('removeAttachment')}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </FormSection>

        {/* Editable: add new attachments */}
        <FormSection
          title={t('addAttachments')}
          subtitle={t('addAttachmentsHint')}
          icon={Upload}
        >
          <AttachmentUploader
            files={attachmentsToAdd}
            onChange={setAttachmentsToAdd}
            disabled={saving}
            onRejected={(rejected) => {
              rejected.forEach(({ file, reason }) => {
                toast.error(t('attachmentNotAdded'), `${file.name}: ${reason}`);
              });
            }}
          />
        </FormSection>
       </Reveal>

        {/* Actions */}
        <div className="sticky bottom-0 z-10 mt-5 flex items-center justify-end gap-3 rounded-2xl border border-[#e9e7e5] bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(60_60_58/0.18)]">
          {!hasChanges && !attachmentsUploading && (
            <p className="me-auto text-sm text-gray-500">{t('nothingToSave')}</p>
          )}
          <Link href="" onClick={() => router.back()}>
            <Button variant="ghost">{t('cancel')}</Button>
          </Link>
          <Button type="submit" icon={Save} loading={saving} disabled={attachmentsUploading || !hasChanges}>
            {attachmentsUploading ? t('uploadingAttachments') : t('saveChanges')}
          </Button>
        </div>
      </form>
    </div>
    </MotionConfig>
  );
}
