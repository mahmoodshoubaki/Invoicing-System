'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  DollarSign,
  MessageSquare,
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Textarea } from '@/components/forms/FormField';
import { mockInvoices } from '@/mock/invoices';
import { mockProjects } from '@/mock/projects';
import { mockBOQItems } from '@/mock/boq';
import { INVOICE_STATUS } from '@/constants/statuses';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import { getUserName } from '@/mock/users';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

function WorkflowStep({ label, status, date, user: userName, active, completed }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
            completed
              ? 'bg-green-500 text-white'
              : active
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {completed ? <CheckCircle size={16} /> : active ? <Clock size={14} /> : ''}
        </div>
        <div className="w-0.5 h-8 bg-gray-200 mt-1 last:hidden" />
      </div>
      <div className="pb-6">
        <p className={`text-sm font-medium ${completed || active ? 'text-gray-800' : 'text-gray-400'}`}>
          {label}
        </p>
        {(date || userName) && (
          <p className="text-xs text-gray-400 mt-0.5">
            {userName && <span>{userName}</span>}
            {date && <span className="ml-2">{formatDateTime(date)}</span>}
          </p>
        )}
        {status && <StatusBadge status={status} size="sm" />}
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const canApprove =
    user?.roles?.includes(ROLES.INVOICING_TEAM) ||
    user?.roles?.includes(ROLES.ADMIN) ||
    user?.roles?.includes(ROLES.BU_HEAD);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInvoice(mockInvoices.find((i) => i.id === id) || null);
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [id]);

  const showToastMsg = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleApprove = () => {
    setProcessing(true);
    setTimeout(() => {
      setInvoice((prev) => ({
        ...prev,
        status: INVOICE_STATUS.APPROVED,
        approvedBy: user?.id || 'usr-001',
        approvedAt: new Date().toISOString(),
      }));
      setProcessing(false);
      setApproveModal(false);
      showToastMsg('Invoice approved successfully');
    }, 500);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setRejectReasonError('Rejection reason is required');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setInvoice((prev) => ({
        ...prev,
        status: INVOICE_STATUS.REJECTED,
        rejectedBy: user?.id || 'usr-001',
        rejectedAt: new Date().toISOString(),
        comments: rejectReason,
      }));
      setProcessing(false);
      setRejectModal(false);
      setRejectReason('');
      showToastMsg('Invoice rejected');
    }, 500);
  };

  if (isLoading) {
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
        <Link href="/invoices">
          <Button variant="outline" className="mt-4">Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  const project = mockProjects.find((p) => p.id === invoice.projectId);
  const boqItems = (invoice.boqItemIds ?? [])
    .map((id) => mockBOQItems.find((b) => b.id === id))
    .filter(Boolean);

  const isSubmitted = invoice.status === INVOICE_STATUS.SUBMITTED;
  const isUnderReview = invoice.status === INVOICE_STATUS.UNDER_REVIEW;
  const isApproved = invoice.status === INVOICE_STATUS.APPROVED;
  const isRejected = invoice.status === INVOICE_STATUS.REJECTED;

  const workflowSteps = [
    {
      label: 'Submitted',
      completed: !!invoice.submittedAt,
      active: isSubmitted,
      date: invoice.submittedAt,
      user: getUserName(invoice.submittedBy),
      status: null,
    },
    {
      label: 'Under Review',
      completed: isApproved || isRejected,
      active: isUnderReview,
      date: isUnderReview || isApproved || isRejected ? invoice.updatedAt : null,
      user: null,
      status: null,
    },
    {
      label: isRejected ? 'Rejected' : 'Approved',
      completed: isApproved || isRejected,
      active: false,
      date: isApproved ? invoice.approvedAt : isRejected ? invoice.rejectedAt : null,
      user: isApproved ? getUserName(invoice.approvedBy) : isRejected ? getUserName(invoice.rejectedBy) : null,
      status: isApproved ? INVOICE_STATUS.APPROVED : isRejected ? INVOICE_STATUS.REJECTED : null,
    },
  ];

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

  return (
    <div>
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle size={16} />
          {toastMessage}
        </div>
      )}

      {/* Approve modal */}
      <ConfirmModal
        open={approveModal}
        onClose={() => setApproveModal(false)}
        onConfirm={handleApprove}
        title="Approve Invoice"
        message={`Approve invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.invoiceAmount)}?`}
        confirmLabel="Approve Invoice"
        confirmVariant="success"
        loading={processing}
      />

      {/* Reject modal */}
      <Modal
        open={rejectModal}
        onClose={() => { setRejectModal(false); setRejectReason(''); setRejectReasonError(''); }}
        title="Reject Invoice"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModal(false)} disabled={processing}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} loading={processing}>Reject Invoice</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Please provide a reason for rejecting invoice <strong>{invoice.invoiceNumber}</strong>.
        </p>
        <Textarea
          label="Rejection Reason"
          required
          rows={3}
          placeholder="Explain why this invoice is being rejected..."
          value={rejectReason}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (rejectReasonError) setRejectReasonError('');
          }}
          error={rejectReasonError}
        />
      </Modal>

      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={project?.contractName || invoice.projectId}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Invoice Requests', href: '/invoices' },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <>
            <Link href="/invoices">
              <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
            </Link>
            {canApprove && (isSubmitted || isUnderReview) && (
              <>
                <Button
                  variant="success"
                  icon={CheckCircle}
                  size="sm"
                  onClick={() => setApproveModal(true)}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  icon={XCircle}
                  size="sm"
                  onClick={() => setRejectModal(true)}
                >
                  Reject
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Invoice Info */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Invoice Information</h3>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={FileText} label="Invoice Number" value={invoice.invoiceNumber} valueClass="font-mono font-semibold" />
              <InfoItem icon={DollarSign} label="Invoice Amount" value={formatCurrency(invoice.invoiceAmount)} valueClass="font-semibold text-primary" />
              <InfoItem icon={DollarSign} label="Revenue" value={formatCurrency(invoice.revenue)} />
              <InfoItem icon={DollarSign} label="WIP" value={formatCurrency(invoice.wip)} />
              <InfoItem icon={Calendar} label="Expected Invoicing Date" value={formatDate(invoice.expectedDate)} />
              <InfoItem icon={User} label="Submitted By" value={getUserName(invoice.submittedBy)} />
              <InfoItem icon={Calendar} label="Submitted At" value={formatDateTime(invoice.submittedAt)} />
            </div>
          </Card>

          {/* Reason & Comments */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Reason / Milestone
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.reason || '—'}</p>

            {invoice.comments && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={14} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Comments</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{invoice.comments}</p>
              </div>
            )}
          </Card>

          {/* Project & BOQ References */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              References
            </h3>
            <div className="flex flex-col gap-4">
              {project && (
                <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Project</p>
                    <p className="text-sm font-semibold text-gray-800">{project.contractName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{project.contractNumber} · {project.clientName}</p>
                  </div>
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" size="xs">View Project</Button>
                  </Link>
                </div>
              )}
              {boqItems.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    BOQ Item{boqItems.length !== 1 ? 's' : ''} ({boqItems.length})
                  </p>
                  {boqItems.map((boqItem) => {
                    const invoicedQty = invoice.boqItemQuantities?.[boqItem.id];
                    const lineTotal = invoicedQty != null ? invoicedQty * boqItem.unitCost : null;
                    return (
                      <div key={boqItem.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{boqItem.englishItem}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {boqItem.billingFrequency} · {formatCurrency(boqItem.unitCost)}/unit
                            </p>
                          </div>
                          <Link href={`/boq/${invoice.projectId}`}>
                            <Button variant="outline" size="xs">View BOQ</Button>
                          </Link>
                        </div>
                        {invoicedQty != null && (
                          <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-gray-400">Invoiced Qty</p>
                              <p className="font-semibold text-gray-700">{invoicedQty} units</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Unit Cost</p>
                              <p className="font-semibold text-gray-700">{formatCurrency(boqItem.unitCost)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Line Total</p>
                              <p className="font-semibold text-primary">{formatCurrency(lineTotal)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Workflow Timeline */}
        <div>
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Workflow Status
            </h3>
            <div className="flex flex-col">
              {workflowSteps.map((step, idx) => (
                <WorkflowStep key={idx} {...step} />
              ))}
            </div>

            {isRejected && invoice.comments && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
                <p className="text-xs text-red-600">{invoice.comments}</p>
              </div>
            )}

            {isApproved && (
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-xs font-semibold text-green-700 mb-1">Approved By</p>
                <p className="text-xs text-green-600">{getUserName(invoice.approvedBy)}</p>
                <p className="text-xs text-green-500 mt-0.5">{formatDateTime(invoice.approvedAt)}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
