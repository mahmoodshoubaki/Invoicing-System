'use client';

import { useState, useEffect, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Save,
  ArrowLeft,
  GripVertical,
  X,
  ChevronDown,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowDown,
  Zap,
  User,
  GitBranch,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addToast } from '@/store/slices/uiSlice';
import { mockWorkflows } from '@/mock/workflows';
import { ROLES, ROLE_LIST } from '@/constants/roles';
import { WORKFLOW_STATUS } from '@/constants/statuses';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Input, Select, Textarea } from '@/components/forms/FormField';

const ACTIONS = ['approve', 'review', 'verify', 'validate', 'compliance_check'];
const ACTION_LABELS = {
  approve: 'Approve',
  review: 'Review',
  verify: 'Verify',
  validate: 'Validate',
  compliance_check: 'Compliance Check',
};

const ROLE_BADGE = {
  [ROLES.ADMIN]: 'danger',
  [ROLES.PROJECT_MANAGER]: 'info',
  [ROLES.INVOICING_TEAM]: 'success',
  [ROLES.BDM]: 'purple',
  [ROLES.DRM]: 'warning',
  [ROLES.CRP]: 'accent',
  [ROLES.BU_HEAD]: 'dark',
  [ROLES.VIEWER]: 'default',
};

const TEMPLATES = [
  {
    id: 'tpl-boq',
    name: 'BOQ Approval',
    entity: 'boq',
    steps: [
      { id: 's1', name: 'Project Manager Review', role: ROLES.PROJECT_MANAGER, action: 'review', order: 1 },
      { id: 's2', name: 'Invoicing Team Verification', role: ROLES.INVOICING_TEAM, action: 'verify', order: 2 },
      { id: 's3', name: 'BU Head Approval', role: ROLES.BU_HEAD, action: 'approve', order: 3 },
    ],
  },
  {
    id: 'tpl-invoice',
    name: 'Invoice Request',
    entity: 'invoice',
    steps: [
      { id: 's1', name: 'Invoicing Team Initial Review', role: ROLES.INVOICING_TEAM, action: 'review', order: 1 },
      { id: 's2', name: 'CRP Compliance Check', role: ROLES.CRP, action: 'compliance_check', order: 2 },
      { id: 's3', name: 'BU Head Final Approval', role: ROLES.BU_HEAD, action: 'approve', order: 3 },
    ],
  },
  {
    id: 'tpl-project',
    name: 'Project Onboarding',
    entity: 'project',
    steps: [
      { id: 's1', name: 'BDM Validation', role: ROLES.BDM, action: 'validate', order: 1 },
      { id: 's2', name: 'DRM Commercial Review', role: ROLES.DRM, action: 'review', order: 2 },
      { id: 's3', name: 'BU Head Final Approval', role: ROLES.BU_HEAD, action: 'approve', order: 3 },
    ],
  },
];

function generateId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function StepNode({ step, isSelected, onClick, onRemove, index, total }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Connector line above (except first) */}
      {index > 0 && (
        <div className="flex flex-col items-center mb-1">
          <div className="w-px h-6 bg-gray-200" />
          <ArrowDown size={14} className="text-gray-300 -mt-1" />
        </div>
      )}

      <div
        onClick={onClick}
        className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
          isSelected
            ? 'border-primary bg-red-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>

        {/* Remove */}
        {total > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(step.id); }}
            className="absolute right-2 top-2 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X size={13} />
          </button>
        )}

        <div className="pl-5 pr-5">
          {/* Step number + name */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
              {index + 1}
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">{step.name}</p>
          </div>

          {/* Role & Action */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User size={11} />
              <Badge variant={ROLE_BADGE[step.role] || 'default'} size="sm">{step.role}</Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Zap size={11} />
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 capitalize">
                {ACTION_LABELS[step.action] || step.action}
              </span>
            </div>
          </div>
        </div>

        {/* Approve/Reject flow indicators */}
        <div className="flex gap-2 mt-3 pl-5">
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
            <CheckCircle size={10} />
            Approved → {index < total - 1 ? `Step ${index + 2}` : 'Complete'}
          </div>
          <div className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
            <XCircle size={10} />
            Rejected → End
          </div>
        </div>
      </div>

      {/* End node after last step */}
      {index === total - 1 && (
        <div className="flex flex-col items-center mt-1">
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl border border-gray-200">
            <CheckCircle size={14} className="text-green-600" />
            <span className="text-xs font-medium text-gray-600">Workflow Complete</span>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowBuilderContent() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [saving, setSaving] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Workflow config
  const [wfName, setWfName] = useState('');
  const [wfEntity, setWfEntity] = useState('boq');
  const [wfStatus, setWfStatus] = useState(WORKFLOW_STATUS.INACTIVE);
  const [wfDescription, setWfDescription] = useState('');
  const [steps, setSteps] = useState([
    { id: generateId(), name: 'New Step', role: ROLES.PROJECT_MANAGER, action: 'review', order: 1 },
  ]);

  // Load existing workflow if editing
  useEffect(() => {
    if (editId) {
      const existing = mockWorkflows.find((w) => w.id === editId);
      if (existing) {
        setWfName(existing.name);
        setWfEntity(existing.entity);
        setWfStatus(existing.status);
        setWfDescription(existing.description || '');
        setSteps(existing.steps.map((s) => ({ ...s, id: s.id || generateId() })));
        setSelectedStepId(existing.steps[0]?.id || null);
      }
    }
  }, [editId]);

  const selectedStep = steps.find((s) => s.id === selectedStepId);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setSteps((prev) => {
        const oldIdx = prev.findIndex((s) => s.id === active.id);
        const newIdx = prev.findIndex((s) => s.id === over.id);
        const reordered = arrayMove(prev, oldIdx, newIdx);
        return reordered.map((s, i) => ({ ...s, order: i + 1 }));
      });
    }
  }

  function addStep() {
    const newStep = {
      id: generateId(),
      name: `Step ${steps.length + 1}`,
      role: ROLES.PROJECT_MANAGER,
      action: 'review',
      order: steps.length + 1,
    };
    setSteps((prev) => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  }

  function removeStep(id) {
    setSteps((prev) => {
      const updated = prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }));
      return updated;
    });
    if (selectedStepId === id) {
      setSelectedStepId(steps.find((s) => s.id !== id)?.id || null);
    }
  }

  function updateStep(field, value) {
    setSteps((prev) =>
      prev.map((s) => (s.id === selectedStepId ? { ...s, [field]: value } : s))
    );
  }

  function applyTemplate(tpl) {
    setWfName(tpl.name);
    setWfEntity(tpl.entity);
    setSteps(tpl.steps.map((s) => ({ ...s, id: generateId() })));
    setSelectedStepId(null);
    setShowTemplates(false);
    dispatch(addToast({ type: 'info', title: 'Template applied', message: `"${tpl.name}" template loaded.` }));
  }

  async function handleSave() {
    if (!wfName.trim()) {
      dispatch(addToast({ type: 'error', title: 'Validation', message: 'Workflow name is required.' }));
      return;
    }
    if (!steps.length) {
      dispatch(addToast({ type: 'error', title: 'Validation', message: 'At least one step is required.' }));
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    dispatch(addToast({ type: 'success', title: editId ? 'Workflow updated' : 'Workflow created', message: `"${wfName}" has been saved successfully.` }));
    router.push('/workflow');
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => router.push('/workflow')}>
            Back
          </Button>
          <div className="w-px h-5 bg-gray-200" />
          <GitBranch size={16} className="text-primary" />
          <h1 className="text-base font-bold text-gray-800">
            {editId ? 'Edit Workflow' : 'New Workflow'}
          </h1>
          {wfName && <span className="text-sm text-gray-500">— {wfName}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates((v) => !v)}
          >
            Templates
          </Button>
          <Button size="sm" icon={Save} onClick={handleSave} loading={saving}>
            {editId ? 'Save Changes' : 'Save Workflow'}
          </Button>
        </div>
      </div>

      {/* Templates dropdown */}
      {showTemplates && (
        <div className="absolute top-16 right-6 z-30 bg-white rounded-xl border border-gray-200 shadow-xl p-3 w-64 mt-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Preset Templates</p>
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyTemplate(tpl)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-red-50 hover:text-primary transition-colors"
            >
              <p className="text-sm font-medium">{tpl.name}</p>
              <p className="text-xs text-gray-400">{tpl.steps.length} steps · {tpl.entity}</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 bg-white border-r border-gray-100 flex flex-col overflow-y-auto shrink-0">
          <div className="p-5 space-y-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Workflow Config</p>
            <Input
              label="Workflow Name"
              required
              value={wfName}
              onChange={(e) => setWfName(e.target.value)}
              placeholder="e.g. BOQ Approval Workflow"
            />
            <Select
              label="Entity Type"
              value={wfEntity}
              options={[
                { value: 'boq', label: 'BOQ' },
                { value: 'invoice', label: 'Invoice' },
                { value: 'project', label: 'Project' },
              ]}
              onChange={(e) => setWfEntity(e.target.value)}
            />
            <Select
              label="Status"
              value={wfStatus}
              options={[
                { value: WORKFLOW_STATUS.ACTIVE, label: 'Active' },
                { value: WORKFLOW_STATUS.INACTIVE, label: 'Inactive' },
                { value: WORKFLOW_STATUS.DRAFT, label: 'Draft' },
              ]}
              onChange={(e) => setWfStatus(e.target.value)}
            />
            <Textarea
              label="Description"
              value={wfDescription}
              onChange={(e) => setWfDescription(e.target.value)}
              placeholder="Describe the purpose of this workflow..."
              rows={2}
            />
          </div>

          {/* Steps list */}
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Steps</p>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{steps.length}</span>
            </div>
            <div className="space-y-1.5 mb-3">
              {steps.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedStepId === step.id
                      ? 'bg-red-50 text-primary border border-primary/20'
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <span className="font-medium text-xs text-gray-400 mr-1.5">{idx + 1}.</span>
                  {step.name}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" icon={Plus} fullWidth onClick={addStep}>
              Add Step
            </Button>
          </div>

          {/* Selected step editor */}
          {selectedStep && (
            <div className="p-5 border-t border-gray-100 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Edit Step</p>
              <Input
                label="Step Name"
                value={selectedStep.name}
                onChange={(e) => updateStep('name', e.target.value)}
              />
              <Select
                label="Assigned Role"
                value={selectedStep.role}
                options={ROLE_LIST.map((r) => ({ value: r, label: r }))}
                onChange={(e) => updateStep('role', e.target.value)}
              />
              <Select
                label="Action"
                value={selectedStep.action}
                options={ACTIONS.map((a) => ({ value: a, label: ACTION_LABELS[a] || a }))}
                onChange={(e) => updateStep('action', e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Main Canvas */}
        <div className="flex-1 bg-gray-50 overflow-auto p-8">
          <div className="max-w-lg mx-auto">
            {/* Start node */}
            <div className="flex flex-col items-center mb-1">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border-2 border-primary shadow-sm">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wide">Start</span>
              </div>
              <div className="w-px h-6 bg-gray-200 mt-1" />
            </div>

            {/* Steps */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0">
                  {steps.map((step, idx) => (
                    <StepNode
                      key={step.id}
                      step={step}
                      index={idx}
                      total={steps.length}
                      isSelected={selectedStepId === step.id}
                      onClick={() => setSelectedStepId(step.id)}
                      onRemove={removeStep}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add step button in canvas */}
            <div className="flex flex-col items-center mt-4">
              <button
                onClick={addStep}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary hover:bg-red-50 transition-all text-sm font-medium"
              >
                <Plus size={15} />
                Add Step
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs space-y-1.5">
            <p className="font-semibold text-gray-500 uppercase tracking-wide text-[10px] mb-2">Legend</p>
            <div className="flex items-center gap-2">
              <GripVertical size={12} className="text-gray-400" />
              <span className="text-gray-500">Drag to reorder</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={12} className="text-green-500" />
              <span className="text-gray-500">Approve → next step</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle size={12} className="text-red-500" />
              <span className="text-gray-500">Reject → end</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw size={12} className="text-yellow-500" />
              <span className="text-gray-500">Revision → previous</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowBuilderPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading builder...</div>}>
      <WorkflowBuilderContent />
    </Suspense>
  );
}
