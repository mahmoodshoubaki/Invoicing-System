'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Check } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { Input, Select } from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { mockProjects } from '@/mock/projects';
import { mockUsers } from '@/mock/users';
import { ROLES } from '@/constants/roles';

const BUSINESS_UNITS = [
  'Energy & Resources',
  'Telecom & Media',
  'Government & Public Sector',
  'Petrochemical & Industrial',
  'Real Estate & Infrastructure',
  'Logistics & Transport',
];

const INVOICING_PLATFORMS = ['Etimad', 'Other'];
const pmUsers = mockUsers.filter((u) => u.roles.includes(ROLES.PROJECT_MANAGER) || u.roles.includes(ROLES.BDM));
const bdmUsers = mockUsers.filter((u) => u.roles.includes(ROLES.BDM));
const buHeadUsers = mockUsers.filter((u) => u.roles.includes(ROLES.BU_HEAD));
const allUsers = mockUsers;

function calcDuration(start, end) {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s) || isNaN(e) || e <= s) return '';
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return String(months);
}

export default function EditProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const proj = mockProjects.find((p) => p.id === id);
      if (proj) {
        setForm({
          contractName: proj.contractName || '',
          contractNumber: proj.contractNumber || '',
          projectCode: proj.projectCode || '',
          invoicingPlatform: proj.invoicingPlatform || 'Etimad',
          projectNameFocus: proj.projectNameFocus || '',
          projectNameEPM: proj.projectNameEPM || '',
          clientName: proj.clientName || '',
          businessUnit: proj.businessUnit || '',
          projectManager: proj.projectManager || '',
          bdm: proj.bdm || '',
          drm: proj.drm || '',
          crp: proj.crp || '',
          buHead: proj.buHead || '',
          projectValue: proj.projectValue !== undefined ? String(proj.projectValue) : '',
          vatPercent: proj.vatPercent !== undefined ? String(proj.vatPercent) : '15',
          poNumber: proj.poNumber || '',
          startDate: proj.startDate || '',
          endDate: proj.endDate || '',
          durationMonths: proj.durationMonths !== undefined ? String(proj.durationMonths) : '',
          revenueSWLic: proj.revenueSWLic !== undefined ? String(proj.revenueSWLic) : '',
          revenueLogistics: proj.revenueLogistics !== undefined ? String(proj.revenueLogistics) : '',
          revenueTraining: proj.revenueTraining !== undefined ? String(proj.revenueTraining) : '',
          revenueExternalSubs: proj.revenueExternalSubs !== undefined ? String(proj.revenueExternalSubs) : '',
        });
      }
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [id]);

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
