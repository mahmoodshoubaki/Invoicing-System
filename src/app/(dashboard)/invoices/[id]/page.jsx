'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { ChevronLeft, FileText, User, Calendar, DollarSign, Percent } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime, formatPercentage } from '@/utils/formatters';
import { fetchInvoicesByProjectCode, selectInvoices, selectInvoicesLoading } from '@/store/slices/invoicesSlice';
import { selectInvoiceStatusesMap, selectInvoiceStatusColorsMap } from '@/store/slices/lookupsSlice';

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
  const projectId = searchParams.get('projectId');
  const projectCode = searchParams.get('projectCode');
  const dispatch = useDispatch();

  const currency = useSelector((s) => s.ui.currency);
  const invoices = useSelector(selectInvoices);
  const isLoading = useSelector(selectInvoicesLoading);
  const invoiceStatusesMap = useSelector(selectInvoiceStatusesMap);
  const invoiceStatusColorsMap = useSelector(selectInvoiceStatusColorsMap);

  useEffect(() => {
    if (projectCode) {
      dispatch(fetchInvoicesByProjectCode(projectCode));
    }
  }, [dispatch, projectCode]);

  const invoice = invoices.find((inv) => String(inv.id) === String(id));

  const backHref = projectId ? `/projects/${projectId}` : '/invoices';
  const backLabel = projectId ? 'Back to Project' : 'Back to Invoices';

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
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={invoice.projectCode}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          ...(projectId
            ? [{ label: 'Projects', href: '/projects' }, { label: invoice.projectCode, href: `/projects/${projectId}` }]
            : [{ label: 'Invoice Requests', href: '/invoices' }]),
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <Link href={backHref}>
            <Button variant="ghost" icon={ChevronLeft} size="sm">{backLabel}</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-5">
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
              <InfoItem icon={FileText} label="Invoice Number" value={invoice.invoiceNumber} valueClass="font-mono font-semibold" />
              <InfoItem icon={DollarSign} label="Total Amount" value={formatCurrency(invoice.totalAmount, currency)} valueClass="font-semibold text-primary" />
              <InfoItem icon={DollarSign} label="Revenue" value={formatCurrency(invoice.revenue, currency)} />
              <InfoItem icon={DollarSign} label="WIP" value={formatCurrency(invoice.wip, currency)} />
              <InfoItem icon={Percent} label="VAT Rate" value={formatPercentage(invoice.vat)} />
              <InfoItem icon={User} label="Submitted By" value={invoice.submittedBy} />
              <InfoItem icon={Calendar} label="Submission Date" value={formatDateTime(invoice.submissionDate)} />
              <InfoItem icon={Calendar} label="Baseline Collection Date" value={formatDate(invoice.baselineCollectionDate)} />
              <InfoItem icon={Calendar} label="Expected Invoicing Date" value={formatDate(invoice.expectedCollectionDate)} />
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
                        <p className="text-xs text-gray-400 mt-0.5" dir="rtl">{line.itemTitleArSnapshot}</p>
                      )}
                      {line.itemDescriptionSnapshot && (
                        <p className="text-xs text-gray-500 mt-1">{line.itemDescriptionSnapshot}</p>
                      )}
                    </div>
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
                        <p className="font-semibold text-primary">{formatCurrency(line.lineTotal, currency)}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
              <InfoItem icon={FileText} label="Project Code" value={invoice.projectCode} />
              {projectId && (
                <Link href={`/projects/${projectId}`}>
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
