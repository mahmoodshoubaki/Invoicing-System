'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { ChevronLeft, Check } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { Input, Select } from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  fetchProjectById,
  selectSelectedProject,
  selectProjectsLoading,
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

function toDateInput(iso) {
  if (!iso) return '';
  return iso.split('T')[0];
}

export default function EditProjectPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const dispatch  = useDispatch();

  /** @type {import('@/models/project').Project|null} */
  const project   = useSelector(selectSelectedProject);
  const isLoading = useSelector(selectProjectsLoading);

  const [form, setForm]           = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (!project || project.id !== id) return;
    setForm({
      contractName:      project.contractName       || '',
      contractNumber:    project.contractNumber != null ? String(project.contractNumber) : '',
      projectCode:       project.projectCode        || '',
      invoicingPlatform: project.invoicingPlatform  || 'Etimad',
      projectNameFocus:  project.projectName_Focus  || '',
      projectNameEPM:    project.projectName        || '',
      clientName:        project.clientName         || '',
      businessUnit:      project.businessUnit       || '',
      projectManager:    '',
      bdm:               project.bdm    || '',
      drm:               project.drm    || '',
      crp:               project.crp    || '',
      buHead:            project.buHead || '',
      projectValue:      project.projectValue   != null ? String(project.projectValue)   : '',
      vatPercent:        project.vatPercentage  != null ? String(project.vatPercentage)  : '15',
      poNumber:          project.poNumber       || '',
      startDate:         toDateInput(project.startDate),
      endDate:           toDateInput(project.endDate),
      durationMonths:    project.duration       != null ? String(project.duration)       : '',
      revenueSWLic:      project.revenueSWLicenses  != null ? String(project.revenueSWLicenses)  : '',
      revenueLogistics:  project.revenueLogistics   != null ? String(project.revenueLogistics)   : '',
      revenueTraining:   project.revenueTraining    != null ? String(project.revenueTraining)    : '',
      revenueExternalSubs: project.revenueExternalSubs != null ? String(project.revenueExternalSubs) : '',
    });
  }, [project, id]);

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
      setTimeout(() => router.push(`/projects/${id}`), 1200);
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
    <div className="page-container">
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check size={16} />
          Project updated successfully!
        </div>
      )}

      <PageHeader
        title="Edit Project"
        subtitle={form.contractName}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: form.contractName, href: `/projects/${id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Link href={`/projects/${id}`}>
            <Button variant="outline" icon={ChevronLeft} size="sm">Back</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section 1: Contract Info */}
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Contract Information
          </h2>
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
        </Card>

        {/* Section 2: Project Details */}
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Project Details
          </h2>
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
        </Card>

        {/* Section 3: Team */}
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Project Team
          </h2>
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
        </Card>

        {/* Section 4: Financial */}
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Financial Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Project Value (SAR)"
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
        </Card>

        {/* Section 5: Timeline */}
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Timeline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Start Date"
              required
              type="date"
              value={form.startDate}
              onChange={set('startDate')}
              error={errors.startDate}
            />
            <Input
              label="End Date"
              type="date"
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
        </Card>

        {/* Section 6: Revenue Breakdown */}
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Revenue Breakdown (SAR)
          </h2>
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
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href={`/projects/${id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
