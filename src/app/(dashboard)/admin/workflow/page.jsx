'use client';

import { useRouter } from 'next/navigation';
import { GitBranch, Plus, Zap, CheckCircle, Settings } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { mockWorkflows } from '@/mock/workflows';

export default function AdminWorkflowPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Workflow Management"
        subtitle="Configure and manage approval workflows for all entities"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Workflow Management' },
        ]}
        actions={
          <Button
            icon={Plus}
            onClick={() => router.push('/workflow/builder')}
          >
            Create Workflow
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {mockWorkflows.filter((w) => w.status === 'Active').length}
              </p>
              <p className="text-sm text-gray-500">Active Workflows</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Settings size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {mockWorkflows.filter((w) => w.status === 'Inactive').length}
              </p>
              <p className="text-sm text-gray-500">Inactive Workflows</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {mockWorkflows.reduce((s, w) => s + (w.steps?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">Total Steps</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workflow cards */}
      <div className="grid grid-cols-1 gap-4">
        {mockWorkflows.map((wf) => (
          <Card key={wf.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <GitBranch size={20} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{wf.name}</h3>
                    <StatusBadge status={wf.status} />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{wf.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Entity: <strong className="text-gray-600">{wf.entity}</strong></span>
                    <span>Steps: <strong className="text-gray-600">{wf.steps?.length || 0}</strong></span>
                    <span>Notifications: <strong className="text-gray-600">{wf.notifications?.length || 0}</strong></span>
                  </div>

                  {/* Step flow preview */}
                  {wf.steps && wf.steps.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {wf.steps.map((step, idx) => (
                        <span key={step.id} className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                            {step.name}
                          </span>
                          {idx < wf.steps.length - 1 && (
                            <span className="text-gray-300 text-xs">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/workflow/builder?id=${wf.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant={wf.status === 'Active' ? 'ghost' : 'success'}
                  size="sm"
                >
                  {wf.status === 'Active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
