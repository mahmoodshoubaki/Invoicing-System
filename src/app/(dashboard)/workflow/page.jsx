'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  Plus,
  GitBranch,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  List,
  ArrowRight,
} from 'lucide-react';
import { addToast } from '@/store/slices/uiSlice';
import { mockWorkflows } from '@/mock/workflows';
import { WORKFLOW_STATUS } from '@/constants/statuses';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Badge, { StatusBadge } from '@/components/common/Badge';
import Card from '@/components/common/Card';
import { ConfirmModal } from '@/components/common/Modal';

const ENTITY_LABELS = {
  boq: 'BOQ',
  invoice: 'Invoice',
  project: 'Project',
};

const ENTITY_COLORS = {
  boq: 'bg-blue-50 text-blue-700',
  invoice: 'bg-green-50 text-green-700',
  project: 'bg-purple-50 text-purple-700',
};

export default function WorkflowPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [workflows, setWorkflows] = useState(() => mockWorkflows.map((w) => ({ ...w })));
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function handleToggle(wf) {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === wf.id
          ? {
              ...w,
              status:
                w.status === WORKFLOW_STATUS.ACTIVE
                  ? WORKFLOW_STATUS.INACTIVE
                  : WORKFLOW_STATUS.ACTIVE,
            }
          : w
      )
    );
    const next = wf.status === WORKFLOW_STATUS.ACTIVE ? 'deactivated' : 'activated';
    dispatch(addToast({ type: 'success', title: `Workflow ${next}`, message: `"${wf.name}" has been ${next}.` }));
  }

  async function handleDelete() {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 500));
    setWorkflows((prev) => prev.filter((w) => w.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
    dispatch(addToast({ type: 'success', title: 'Workflow deleted', message: `"${deleteTarget.name}" has been removed.` }));
  }

  function handleEdit(wf) {
    router.push(`/workflow/builder?id=${wf.id}`);
  }

  function handleCreate() {
    router.push('/workflow/builder');
  }

  return (
    <div>
      <PageHeader
        title="Workflow Engine"
        subtitle="Design and manage approval workflows for BOQ items, invoices, and projects"
        breadcrumbs={[{ label: 'Workflow' }]}
        actions={
          <Button icon={Plus} onClick={handleCreate}>
            Create Workflow
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
          <GitBranch size={15} className="text-gray-400" />
          <span className="text-sm text-gray-600">{workflows.length} total</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl">
          <CheckCircle size={15} className="text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            {workflows.filter((w) => w.status === WORKFLOW_STATUS.ACTIVE).length} active
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 border border-yellow-100 rounded-xl">
          <GitBranch size={15} className="text-yellow-600" />
          <span className="text-sm text-yellow-700 font-medium">
            {workflows.filter((w) => w.status === WORKFLOW_STATUS.DRAFT).length} draft
          </span>
        </div>
      </div>

      {/* Workflow cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {workflows.map((wf) => (
          <Card key={wf.id} className="flex flex-col hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <GitBranch size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight truncate">{wf.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ENTITY_COLORS[wf.entity]}`}>
                      {ENTITY_LABELS[wf.entity] || wf.entity}
                    </span>
                  </div>
                </div>
              </div>
              <StatusBadge status={wf.status} size="sm" />
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{wf.description}</p>

            {/* Steps preview */}
            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
              {wf.steps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-1">
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                    <span className="w-4 h-4 rounded-full bg-gray-400 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-gray-600 truncate max-w-[80px]">{step.name.split(' ')[0]}</span>
                  </div>
                  {idx < wf.steps.length - 1 && <ArrowRight size={10} className="text-gray-300 shrink-0" />}
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <List size={13} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Steps</span>
                </div>
                <p className="text-base font-bold text-gray-800 mt-0.5">{wf.steps.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <GitBranch size={13} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Notifications</span>
                </div>
                <p className="text-base font-bold text-gray-800 mt-0.5">{wf.notifications?.length || 0}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" icon={Edit2} onClick={() => handleEdit(wf)} className="flex-1">
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={wf.status === WORKFLOW_STATUS.ACTIVE ? ToggleRight : ToggleLeft}
                onClick={() => handleToggle(wf)}
                className={wf.status === WORKFLOW_STATUS.ACTIVE ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}
              >
                {wf.status === WORKFLOW_STATUS.ACTIVE ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => setDeleteTarget(wf)}
                className="text-red-500 hover:bg-red-50"
              />
            </div>
          </Card>
        ))}

        {/* New Workflow card */}
        <button
          onClick={handleCreate}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-red-50/30 transition-all group min-h-[260px]"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
            <Plus size={22} className="text-gray-400 group-hover:text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500 group-hover:text-primary">Create Workflow</p>
            <p className="text-xs text-gray-400 mt-0.5">Build a custom approval flow</p>
          </div>
        </button>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Workflow"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone and will affect all pending approvals.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
