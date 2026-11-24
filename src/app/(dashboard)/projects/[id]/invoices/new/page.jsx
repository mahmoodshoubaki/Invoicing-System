'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { decodeRouteParam } from '@/lib/routeParam';
import { useSelector } from 'react-redux';
import { MotionConfig } from 'motion/react';
import { ChevronLeft, FileText, Paperclip, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
import ProjectNotReady from '@/components/projects/ProjectNotReady';
import { useProjectReadiness } from '@/components/projects/useProjectReadiness';
import { useNewInvoiceForm } from '@/components/invoices/new/useNewInvoiceForm';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/useToast';

export default function NewInvoicePage() {
  const { id: rawId } = useParams();
  const projectCode = decodeRouteParam(rawId);
  const toast = useToast();
  const t = useTranslations('invoices.form');
  const currency = useSelector((s) => s.ui.currency);

  const sources = useInvoiceSources(projectCode);
  const { project, boqItems, boqItemsLoading } = sources;
  const invoice = useNewInvoiceForm({ projectCode, boqItems, projectFinancials: sources.projectFinancials });
  const readiness = useProjectReadiness(projectCode);
  const projectHref = `/projects/${encodeURIComponent(projectCode)}`;

  if (sources.projectLoading || !project || readiness.checking) {
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
          title={t('submitTitle')}
          message={t.rich('submitMessage', { value: formatCurrency(invoice.grandTotal, currency), amount: (chunks) => <span dir="ltr">{chunks}</span> })}
          confirmLabel={t('submitRequestConfirm')}
          confirmVariant="primary"
          loading={invoice.saving}
        />

        <SubPageHeader
          eyebrow={t('eyebrow')}
          title={t('newTitle')}
          subtitle={project.contractName ?? projectCode}
          icon={FileText}
          breadcrumbs={[
            { label: t('home'), href: '/' },
            { label: t('projects'), href: '/projects' },
            { label: project.contractName, href: projectHref },
            { label: t('newRequest') },
          ]}
          actions={
            <Link href={projectHref}>
              <Button variant="ghost" icon={ChevronLeft} iconClassName="rtl:-scale-x-100" size="sm">{t('back')}</Button>
            </Link>
          }
        />

        {!readiness.ready && (
          <div className="max-w-3xl">
            <ProjectNotReady missing={readiness.missing} failed={readiness.failed} />
          </div>
        )}

        <Reveal className="flex max-w-3xl flex-col gap-5">
          <ProjectSummarySection
            project={project}
            projectCode={projectCode}
            projectFinancials={sources.projectFinancials}
            currency={currency}
          />

          {readiness.ready && <BoqItemPicker boqItems={boqItems} loading={boqItemsLoading} currency={currency} invoice={invoice} />}

          {readiness.ready && !boqItemsLoading && boqItems.length > 0 && (
            <>
              <InvoiceDetailsSection form={invoice.form} errors={invoice.errors} set={invoice.set} />

              <FormSection title={t('attachments')} subtitle={t('attachmentsHint')} icon={Paperclip}>
                <AttachmentUploader
                  files={invoice.attachments}
                  onChange={invoice.setAttachments}
                  disabled={invoice.saving}
                  onRejected={(rejected) => {
                    rejected.forEach(({ file, reason }) => {
                      toast.error(t('attachmentNotAdded'), `${file.name}: ${reason}`);
                    });
                  }}
                />
              </FormSection>

              <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-2xl border border-[#e9e7e5] bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(60_60_58/0.18)]">
                <Link href={projectHref}>
                  <Button variant="ghost">{t('cancel')}</Button>
                </Link>
                <Button
                  icon={Send}
                  onClick={invoice.handleSubmitClick}
                  loading={invoice.saving}
                  disabled={invoice.attachmentsUploading}
                >
                  {invoice.attachmentsUploading ? t('uploadingAttachments') : t('submitRequest')}
                </Button>
              </div>
            </>
          )}
        </Reveal>
      </div>
    </MotionConfig>
  );
}
