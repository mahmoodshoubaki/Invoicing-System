'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import {
  CalendarRange, Check, ChevronLeft, FileSignature, FolderKanban, Layers, Users, Wallet,
} from 'lucide-react';

import SubPageHeader from '@/components/common/SubPageHeader';
import FormSection from '@/components/common/FormSection';
import Reveal from '@/components/motion/Reveal';
import Button from '@/components/common/Button';
import { Input, DatePicker, Select } from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  fetchMainProjectDetails,
  selectMainProjectDetails,
  selectMainDetailsLoading,
} from '@/store/slices/projectsSlice';

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

function calcDuration(start, end) {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s) || isNaN(e) || e <= s) return '';
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return String(months);
}

export default function EditProjectPage() {
  // See projects/[id]/boq/page.jsx for why this is decoded defensively.
  const { id: rawId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const router    = useRouter();
  const dispatch  = useDispatch();

  const project   = useSelector(selectMainProjectDetails);
  const isLoading = useSelector(selectMainDetailsLoading);
  const currency  = useSelector((s) => s.ui.currency);

  const [form, setForm]           = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
  }, [dispatch, projectCode]);

  // GetMainProjectDetails currently only returns contractName — everything
  // below besides that and the route's own projectCode has no backing
  // endpoint yet, so those fields start blank rather than guessed/faked.
  useEffect(() => {
    if (!project) return;
    setForm({
      contractName:      project.contractName || '',
      contractNumber:    '',
      projectCode:       projectCode,
      invoicingPlatform: 'Etimad',
      projectNameFocus:  '',
      projectNameEPM:    '',
      clientName:        '',
      businessUnit:      '',
      projectManager:    '',
      bdm:               '',
      drm:               '',
      crp:               '',
      buHead:            '',
      projectValue:      '',
      vatPercent:        '15',
      poNumber:          '',
      startDate:         '',
      endDate:           '',
      durationMonths:    '',
      revenueSWLic:      '',
      revenueLogistics:  '',
      revenueTraining:   '',
      revenueExternalSubs: '',
    });
  }, [project, projectCode]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === 'startDate' || field === 'endDate') {
        next.durationMonths = calcDuration(
          field === 'startDate' ? val : prev.startDate,
          field === 'endDate'   ? val : prev.endDate
        );
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.contractName.trim())  e.contractName  = 'Contract name is required';
    if (!form.contractNumber.trim()) e.contractNumber = 'Contract number is required';
    if (!form.clientName.trim())    e.clientName    = 'Client name is required';
    if (!form.startDate)            e.startDate     = 'Start date is required';
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
    // TODO: dispatch updateProjectById thunk when endpoint is available
    setTimeout(() => {
      setSaving(false);
      setShowToast(true);
      setTimeout(() => router.push(`/projects/${encodeURIComponent(projectCode)}`), 1200);
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Project not found.</p>
        <Link href="/projects">
          <Button variant="outline" className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="mx-auto max-w-4xl">
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check size={16} />
          Project updated successfully!
        </div>
      )}

      <SubPageHeader
        icon={FileSignature}
        eyebrow="Edit project"
        title="Edit Project"
        subtitle={form.contractName}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: form.contractName, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: 'Edit' },
        ]}
        actions={
          <Link href={`/projects/${encodeURIComponent(projectCode)}`}>
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
              value={form.contractName}
              onChange={set('contractName')}
              error={errors.contractName}
            />
            <Input
              label="Contract Number"
              required
              value={form.contractNumber}
              onChange={set('contractNumber')}
              error={errors.contractNumber}
            />
            <Input
              label="Project Code"
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
              value={form.projectNameFocus}
              onChange={set('projectNameFocus')}
            />
            <Input
              label="EPM Project Name"
              value={form.projectNameEPM}
              onChange={set('projectNameEPM')}
            />
            <Input
              label="Client Name"
              required
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
              value={form.projectValue}
              onChange={set('projectValue')}
            />
            <Input
              label="VAT %"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.vatPercent}
              onChange={set('vatPercent')}
            />
            <Input
              label="PO Number"
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
              value={form.revenueSWLic}
              onChange={set('revenueSWLic')}
            />
            <Input
              label="Logistics Revenue"
              type="number"
              min="0"
              step="0.01"
              value={form.revenueLogistics}
              onChange={set('revenueLogistics')}
            />
            <Input
              label="Training Revenue"
              type="number"
              min="0"
              step="0.01"
              value={form.revenueTraining}
              onChange={set('revenueTraining')}
            />
            <Input
              label="External Subs Revenue"
              type="number"
              min="0"
              step="0.01"
              value={form.revenueExternalSubs}
              onChange={set('revenueExternalSubs')}
            />
          </div>
        </FormSection>
       </Reveal>

        {/* Actions */}
        <div className="sticky bottom-0 z-10 mt-5 flex items-center justify-end gap-3 rounded-2xl border border-[#e9e7e5] bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(60_60_58/0.18)]">
          <Link href={`/projects/${encodeURIComponent(projectCode)}`}>
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" icon={Check} loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
    </MotionConfig>
  );
}
