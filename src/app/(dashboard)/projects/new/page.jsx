'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import {
  CalendarRange, Check, ChevronLeft, FileSignature, FolderKanban, Layers, Users, Wallet,
} from 'lucide-react';

import SubPageHeader from '@/components/common/SubPageHeader';
import FormSection from '@/components/common/FormSection';
import Reveal from '@/components/motion/Reveal';
import Button from '@/components/common/Button';
import { Input, DatePicker, Select, Textarea, FormField } from '@/components/forms/FormField';
const BUSINESS_UNITS = [
  'Energy & Resources',
  'Telecom & Media',
  'Government & Public Sector',
  'Petrochemical & Industrial',
  'Real Estate & Infrastructure',
  'Logistics & Transport',
];

const INVOICING_PLATFORMS = ['Etimad', 'Other'];

// TODO: replace with real users API when available
const pmUsers = [];
const bdmUsers = [];
const buHeadUsers = [];
const allUsers = [];

const INITIAL_FORM = {
  contractName: '',
  contractNumber: '',
  projectCode: '',
  invoicingPlatform: 'Etimad',
  projectNameFocus: '',
  projectNameEPM: '',
  clientName: '',
  businessUnit: '',
  projectManager: '',
  bdm: '',
  drm: '',
  crp: '',
  buHead: '',
  projectValue: '',
  vatPercent: '15',
  poNumber: '',
  startDate: '',
  endDate: '',
  durationMonths: '',
  revenueSWLic: '',
  revenueLogistics: '',
  revenueTraining: '',
  revenueExternalSubs: '',
};

function calcDuration(start, end) {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s) || isNaN(e) || e <= s) return '';
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return String(months);
}

export default function NewProjectPage() {
  const router = useRouter();
  const currency = useSelector((s) => s.ui.currency);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === 'startDate' || field === 'endDate') {
        next.durationMonths = calcDuration(
          field === 'startDate' ? val : prev.startDate,
          field === 'endDate' ? val : prev.endDate
        );
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.contractName.trim()) e.contractName = 'Contract name is required';
    if (!form.contractNumber.trim()) e.contractNumber = 'Contract number is required';
    if (!form.clientName.trim()) e.clientName = 'Client name is required';
    if (!form.projectManager) e.projectManager = 'Project manager is required';
    if (!form.startDate) e.startDate = 'Start date is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setShowToast(true);
      setTimeout(() => {
        router.push('/projects');
      }, 1200);
    }, 600);
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="mx-auto max-w-4xl">
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <Check size={16} />
          Project created successfully!
        </div>
      )}

      <SubPageHeader
        icon={FolderKanban}
        eyebrow="New project"
        title="New Project"
        subtitle="Create a new project contract"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: 'New Project' },
        ]}
        actions={
          <Link href="/projects">
            <Button variant="outline" icon={ChevronLeft} size="sm">Back</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
       <Reveal className="flex flex-col gap-5">
        {/* Section 1: Contract Info */}
        <FormSection title="Contract Information" icon={FileSignature}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contract Name"
              required
              placeholder="e.g. Enterprise Digital Transformation Program"
              value={form.contractName}
              onChange={set('contractName')}
              error={errors.contractName}
            />
            <Input
              label="Contract Number"
              required
              placeholder="e.g. CON-2025-0001"
              value={form.contractNumber}
              onChange={set('contractNumber')}
              error={errors.contractNumber}
            />
            <Input
              label="Project Code"
              placeholder="e.g. DTI-001"
              value={form.projectCode}
              onChange={set('projectCode')}
            />
            <Select
              label="Invoicing Platform"
              value={form.invoicingPlatform}
              onChange={set('invoicingPlatform')}
              options={INVOICING_PLATFORMS.map((p) => ({ value: p, label: p }))}
            />
          </div>
        </FormSection>

        {/* Section 2: Project Details */}
        <FormSection title="Project Details" icon={FolderKanban}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Project Focus Name"
              placeholder="e.g. Cloud Migration & Process Automation"
              value={form.projectNameFocus}
              onChange={set('projectNameFocus')}
            />
            <Input
              label="EPM Project Name"
              placeholder="e.g. DTI-SA-2024"
              value={form.projectNameEPM}
              onChange={set('projectNameEPM')}
            />
            <Input
              label="Client Name"
              required
              placeholder="e.g. Saudi Aramco"
              value={form.clientName}
              onChange={set('clientName')}
              error={errors.clientName}
            />
            <Select
              label="Business Unit"
              placeholder="Select Business Unit"
              value={form.businessUnit}
              onChange={set('businessUnit')}
              options={BUSINESS_UNITS.map((b) => ({ value: b, label: b }))}
            />
          </div>
        </FormSection>

        {/* Section 3: Team */}
        <FormSection title="Project Team" icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Project Manager"
              required
              placeholder="Select PM"
              value={form.projectManager}
              onChange={set('projectManager')}
              error={errors.projectManager}
              options={pmUsers.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Select
              label="BDM"
              placeholder="Select BDM"
              value={form.bdm}
              onChange={set('bdm')}
              options={bdmUsers.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Select
              label="DRM"
              placeholder="Select DRM"
              value={form.drm}
              onChange={set('drm')}
              options={allUsers.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Select
              label="CRP"
              placeholder="Select CRP"
              value={form.crp}
              onChange={set('crp')}
              options={allUsers.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Select
              label="BU Head"
              placeholder="Select BU Head"
              value={form.buHead}
              onChange={set('buHead')}
              options={buHeadUsers.map((u) => ({ value: u.id, label: u.name }))}
            />
          </div>
        </FormSection>

        {/* Section 4: Financial */}
        <FormSection title="Financial Details" icon={Wallet}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={`Project Value (${currency})`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.projectValue}
              onChange={set('projectValue')}
            />
            <Input
              label="VAT %"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="15"
              value={form.vatPercent}
              onChange={set('vatPercent')}
            />
            <Input
              label="PO Number"
              placeholder="e.g. PO-ARAMCO-2024-00551"
              value={form.poNumber}
              onChange={set('poNumber')}
            />
          </div>
        </FormSection>

        {/* Section 5: Timeline */}
        <FormSection title="Timeline" icon={CalendarRange}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DatePicker
              label="Start Date"
              required
              value={form.startDate}
              onChange={set('startDate')}
              error={errors.startDate}
            />
            <DatePicker
              label="End Date"
              value={form.endDate}
              onChange={set('endDate')}
              min={form.startDate || undefined}
            />
            <Input
              label="Duration (Months)"
              type="number"
              readOnly
              value={form.durationMonths}
              hint="Auto-calculated from start and end dates"
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>
        </FormSection>

        {/* Section 6: Revenue Breakdown */}
        <FormSection title={`Revenue Breakdown (${currency})`} icon={Layers}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="SW Licenses Revenue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.revenueSWLic}
              onChange={set('revenueSWLic')}
            />
            <Input
              label="Logistics Revenue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.revenueLogistics}
              onChange={set('revenueLogistics')}
            />
            <Input
              label="Training Revenue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.revenueTraining}
              onChange={set('revenueTraining')}
            />
            <Input
              label="External Subs Revenue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.revenueExternalSubs}
              onChange={set('revenueExternalSubs')}
            />
          </div>
        </FormSection>
       </Reveal>

        {/* Actions */}
        <div className="sticky bottom-0 z-10 mt-5 flex items-center justify-end gap-3 rounded-2xl border border-[#e9e7e5] bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(60_60_58/0.18)]">
          <Link href="/projects">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" icon={Check} loading={saving}>
            Create project
          </Button>
        </div>
      </form>
    </div>
    </MotionConfig>
  );
}
