'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import {
  ChevronLeft, FileText, User, Calendar, DollarSign, Percent, Download, Edit2, History, Paperclip, Trash2, Workflow,
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import VarianceBadge from '@/components/common/VarianceBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import InvoiceHistoryModal from '@/components/invoices/InvoiceHistoryModal';
import DeleteInvoicesDialog from '@/components/invoices/DeleteInvoicesDialog';
import InvoiceTaskPanel from '@/components/invoices/detail/InvoiceTaskPanel';
import InvoiceStepper from '@/components/invoices/detail/InvoiceStepper';
import AddAttachmentsDialog from '@/components/invoices/detail/AddAttachmentsDialog';
import { DELETABLE_INVOICE_STATUS_IDS, INVOICE_STATUS_ID } from '@/constants/statuses';
import { baselineDateOrPending, invoiceNumberOrPending } from '@/utils/invoiceDisplay';
import TargetRunsModal from '@/components/workflow/runs/TargetRunsModal';
import { TARGET_TYPE } from '@/constants/workflow';
import { formatCurrency, formatDate, formatDateTime, formatPercentage, formatFileSize } from '@/utils/formatters';
import { iconForFileName } from '@/utils/attachmentIcon';
import { saveBlob } from '@/utils/saveBlob';
import { fetchInvoiceById, selectSelectedInvoice, selectInvoicesLoading } from '@/store/slices/invoicesSlice';
import { selectInvoiceStatusesMap, selectInvoiceStatusColorsMap } from '@/store/slices/lookupsSlice';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS } from '@/constants/workflowPermissions';

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

function InvoiceDetailContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const queryProjectCode = searchParams.get('projectCode');
  const dispatch = useDispatch();
  const toast = useToast();
  const { can } = usePermission();
  const canViewRuns = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW);

  const currency = useSelector((s) => s.ui.currency);
  const invoice = useSelector(selectSelectedInvoice);
  const isLoading = useSelector(selectInvoicesLoading);
  const invoiceStatusesMap = useSelector(selectInvoiceStatusesMap);
  const invoiceStatusColorsMap = useSelector(selectInvoiceStatusColorsMap);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [runsOpen, setRunsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addingFiles, setAddingFiles] = useState(false);
  const router = useRouter();

  // The invoice itself carries its project code once loaded — prefer that
  // over the query param so this page (and the links it builds, including
  // Edit) works regardless of how it was navigated to, not only when a
  // caller happened to pass ?projectCode=.
  const projectCode = invoice?.projectCode ?? queryProjectCode;

  useEffect(() => {
    dispatch(fetchInvoiceById(id));
  }, [dispatch, id]);

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

  const backHref = projectCode ? `/projects/${encodeURIComponent(projectCode)}` : '/invoices';
  const backLabel = projectCode ? 'Back to Project' : 'Back to Invoices';

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
        <Link href={backHref}>
          <Button variant="outline" className="mt-4">{backLabel}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <InvoiceHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        invoiceId={invoice.id}
        currency={currency}
      />

      {deleteOpen && (
        <DeleteInvoicesDialog
          open
          invoices={[invoice]}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => {
            toast.success('Invoice deleted', 'Any workflow running on it was cancelled.');
            // The invoice no longer exists anywhere, so there is nothing to stay on.
            router.replace(backHref);
          }}
        />
      )}

      {/* Rendered only for someone who may see runs, so it never asks for them otherwise. */}
      {canViewRuns && (
        <TargetRunsModal
          open={runsOpen}
          onClose={() => setRunsOpen(false)}
          targetTypeKey={TARGET_TYPE.INVOICE}
          targetId={invoice.id}
          recordLabel={invoice.invoiceNumber ? `invoice ${invoice.invoiceNumber}` : 'this invoice'}
        />
      )}

      {addingFiles && (
        <AddAttachmentsDialog
          invoiceId={invoice.id}
          onClose={() => setAddingFiles(false)}
          onAdded={() => dispatch(fetchInvoiceById(id))}
        />
      )}

      <PageHeader
        title={invoiceNumberOrPending(invoice)}
        subtitle={projectCode}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          ...(projectCode
            ? [{ label: 'Projects', href: '/projects' }, { label: projectCode, href: `/projects/${encodeURIComponent(projectCode)}` }]
            : [{ label: 'Invoice Requests', href: '/invoices' }]),
          { label: invoiceNumberOrPending(invoice) },
        ]}
        actions={
          <>
            <Button variant="ghost" icon={History} size="sm" onClick={() => setHistoryOpen(true)}>
              History
            </Button>
            {/*
              Every workflow run on this invoice, to choose one to open.

              It used to open `workflowInstanceId` — the ONE run the invoice
              last pointed at. An invoice can be in two workflows at once, and
              has usually been through some before, so that was a guess; the
              modal groups them per workflow instead. See TargetRunsModal.

              Shown whether or not `workflowInstanceId` is set: an invoice whose
              runs have all finished still has a history worth reading.

              Hidden without WorkflowInstances.View: GetInstances and the run
              page both refuse anybody without it, and a button that leads
              straight to "you do not have permission" is worse than no button.
            */}
            {canViewRuns && (
              <Button variant="outline" icon={Workflow} size="sm" onClick={() => setRunsOpen(true)}>
                Workflow runs
              </Button>
            )}
            {can('Invoices', 'Update') && projectCode && (
              <Link href={`/projects/${encodeURIComponent(projectCode)}/invoices/${id}/edit`}>
                <Button variant="outline" icon={Edit2} size="sm">Edit</Button>
              </Link>
            )}
            {/* Only Rejected or Cancelled — an In Progress invoice still has its
                workflow running (cancel it first), and an Invoiced or Collected
                one is money billed or received. */}
            {can('Invoices', 'Delete') && DELETABLE_INVOICE_STATUS_IDS.includes(invoice.statusId) && (
              <Button variant="outline" icon={Trash2} size="sm" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
            <Link href={backHref}>
              <Button variant="ghost" icon={ChevronLeft} size="sm">{backLabel}</Button>
            </Link>
          </>
        }
      />

      {/* Where it is in its workflow and what comes next (2026-10-21), and who it
          is waiting on — anyone who can see the invoice sees that part. */}
      <InvoiceStepper invoice={invoice} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* The task waiting on it, when it is this person's to answer. Its
              fields land on the invoice, so the invoice is read again after. */}
          <InvoiceTaskPanel invoice={invoice} onAnswered={() => dispatch(fetchInvoiceById(id))} />

          {/* Invoice Info */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Invoice Information</h3>
              <StatusBadge
                status={invoiceStatusesMap[invoice.statusId] ?? '—'}
                colors={invoiceStatusColorsMap[invoice.statusId]}
              />
            </div>
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
              <InfoItem icon={Calendar} label="Reasons For Update" value={invoice.reasonsForUpdate} />
              <InfoItem icon={FileText} label="Financial Claim Reference" value={invoice.financialClaimReference} valueClass="font-mono" />
            </div>
          </Card>

          {/* BOQ Line Items */}
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
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{line.itemTitleEnSnapshot}</p>
                      {line.itemTitleArSnapshot && (
                        <p className="text-xs text-gray-400 mt-0.5" >{line.itemTitleArSnapshot}</p>
                      )}
                      {line.itemDescriptionSnapshot && (
                        <p className="text-xs text-gray-500 mt-1">{line.itemDescriptionSnapshot}</p>
                      )}
                    </div>
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
          </Card>

          {/* Attachments */}
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Attachments ({invoice.attachments.length})
              </h3>
              {/* At any stage while it is open (2026-10-11) — not once Collected or Cancelled. */}
              {can('Invoices', 'Add Attachments')
                && ![INVOICE_STATUS_ID.COLLECTED, INVOICE_STATUS_ID.CANCELLED].includes(invoice.statusId) && (
                <Button variant="outline" size="xs" icon={Paperclip} onClick={() => setAddingFiles(true)}>
                  Add files
                </Button>
              )}
            </div>
            {invoice.attachments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No attachments on this invoice.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {invoice.attachments.map((attachment) => {
                  const Icon = iconForFileName(attachment.fileName);
                  return (
                    <div key={attachment.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                        <Icon size={15} className="text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 truncate">{attachment.fileName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatFileSize(attachment.fileSize)}
                          {attachment.uploadedBy && ` · Uploaded by ${attachment.uploadedBy}`}
                        </p>
                      </div>
                      <Button
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
            )}
          </Card>
        </div>

        {/* Project reference */}
        <div>
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Project
            </h3>
            <div className="flex flex-col gap-3">
              <InfoItem icon={FileText} label="Project Code" value={projectCode} />
              {projectCode && (
                <Link href={`/projects/${encodeURIComponent(projectCode)}`}>
                  <Button variant="outline" size="sm" className="w-full">View Project</Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    }>
      <InvoiceDetailContent />
    </Suspense>
  );
}
