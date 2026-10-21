'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { MotionConfig } from 'motion/react';
import { ChevronLeft, FileText, Paperclip, Send } from 'lucide-react';

import SubPageHeader from '@/components/common/SubPageHeader';
import FormSection from '@/components/common/FormSection';
import Reveal from '@/components/motion/Reveal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ConfirmModal } from '@/components/common/Modal';
import AttachmentUploader from '@/components/invoices/AttachmentUploader';
import ProjectSummarySection from '@/components/invoices/new/ProjectSummarySection';
import BoqItemPicker from '@/components/invoices/new/BoqItemPicker';
import InvoiceDetailsSection from '@/components/invoices/new/InvoiceDetailsSection';
import { useInvoiceSources } from '@/components/invoices/new/useInvoiceSources';
import { useNewInvoiceForm } from '@/components/invoices/new/useNewInvoiceForm';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/useToast';

/**
 * A new invoice request for one project. Each part lives in
 * components/invoices/new/ — this lays them out.
 */
export default function NewInvoicePage() {
  // See projects/[id]/boq/page.jsx for why this is decoded defensively.
  const { id: rawId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const toast = useToast();
  const currency = useSelector((s) => s.ui.currency);

  const sources = useInvoiceSources(projectCode);
  const { project, boqItems, boqItemsLoading } = sources;
  const invoice = useNewInvoiceForm({ projectCode, boqItems, projectFinancials: sources.projectFinancials });
  const projectHref = `/projects/${encodeURIComponent(projectCode)}`;

  if (sources.projectLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div>
        <ConfirmModal
          open={invoice.confirmOpen}
          onClose={invoice.closeConfirm}
          onConfirm={invoice.handleConfirmSubmit}
          title="Submit Invoice Request"
          message={`Submit invoice request for ${formatCurrency(invoice.grandTotal, currency)}? This will be sent for review.`}
          confirmLabel="Submit Request"
          confirmVariant="primary"
          loading={invoice.saving}
        />

        <SubPageHeader
          eyebrow="Invoicing"
          title="New Invoice Request"
          subtitle={project.contractName ?? projectCode}
          icon={FileText}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: project.contractName, href: projectHref },
            { label: 'New Request' },
          ]}
          actions={
            <Link href={projectHref}>
              <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
            </Link>
          }
        />

        <Reveal className="flex max-w-3xl flex-col gap-5">
          <ProjectSummarySection
            project={project}
            projectCode={projectCode}
            projectFinancials={sources.projectFinancials}
            currency={currency}
          />

          <BoqItemPicker boqItems={boqItems} loading={boqItemsLoading} currency={currency} invoice={invoice} />

          {!boqItemsLoading && boqItems.length > 0 && (
            <>
              <InvoiceDetailsSection form={invoice.form} errors={invoice.errors} set={invoice.set} />

              <FormSection title="Attachments" subtitle="Supporting documents for this request" icon={Paperclip}>
                <AttachmentUploader
                  files={invoice.attachments}
                  onChange={invoice.setAttachments}
                  disabled={invoice.saving}
                  onRejected={(rejected) => {
                    rejected.forEach(({ file, reason }) => {
                      toast.error('Attachment not added', `${file.name}: ${reason}`);
                    });
                  }}
                />
              </FormSection>

              <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-2xl border border-[#e9e7e5] bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(60_60_58/0.18)]">
                <Link href={projectHref}>
                  <Button variant="ghost">Cancel</Button>
                </Link>
                <Button
                  icon={Send}
                  onClick={invoice.handleSubmitClick}
                  loading={invoice.saving}
                  disabled={invoice.attachmentsUploading}
                >
                  {invoice.attachmentsUploading ? 'Uploading attachments…' : 'Submit request'}
                </Button>
              </div>
            </>
          )}
        </Reveal>
      </div>
    </MotionConfig>
  );
}
