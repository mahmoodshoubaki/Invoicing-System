'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import {
  CalendarRange, Check, ChevronLeft, FileSignature, FolderKanban, Layers, Users, Wallet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BASE_CURRENCY } from '@/constants/currencies';

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
  const t = useTranslations('projectForm');
  const tc = useTranslations('common');
  const currency = BASE_CURRENCY;
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
    if (!form.contractName.trim()) e.contractName = t('errors.contractName');
    if (!form.contractNumber.trim()) e.contractNumber = t('errors.contractNumber');
    if (!form.clientName.trim()) e.clientName = t('errors.clientName');
    if (!form.projectManager) e.projectManager = t('errors.projectManager');
    if (!form.startDate) e.startDate = t('errors.startDate');
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
        <div className="fixed top-5 inset-e-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <Check size={16} />
          {t('created')}
        </div>
      )}

      <SubPageHeader
        icon={FolderKanban}
        eyebrow={t('newEyebrow')}
        title={t('newTitle')}
        subtitle={t('newSubtitle')}
        breadcrumbs={[
          { label: t('home'), href: '/' },
          { label: t('projects'), href: '/projects' },
          { label: t('newTitle') },
        ]}
        actions={
          <Link href="/projects">
            <Button variant="outline" icon={ChevronLeft} iconClassName="rtl:-scale-x-100" size="sm">{t('back')}</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
       <Reveal className="flex flex-col gap-5">
        <FormSection title={t('contractInfo')} icon={FileSignature}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('contractName')}
              required
              placeholder={t('placeholders.contractName')}
              value={form.contractName}
              onChange={set('contractName')}
              error={errors.contractName}
            />
            <Input
              label={t('contractNumber')}
              required
              placeholder={t('placeholders.contractNumber')}
              value={form.contractNumber}
              onChange={set('contractNumber')}
              error={errors.contractNumber}
            />
            <Input
              label={t('projectCode')}
              placeholder={t('placeholders.projectCode')}
              value={form.projectCode}
              onChange={set('projectCode')}
            />
            <Select
              label={t('invoicingPlatform')}
              value={form.invoicingPlatform}
              onChange={set('invoicingPlatform')}
              options={INVOICING_PLATFORMS.map((p) => ({ value: p, label: t(`platforms.${p}`) }))}
            />
          </div>
        </FormSection>

        <FormSection title={t('projectDetails')} icon={FolderKanban}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('focusName')}
              placeholder={t('placeholders.focusName')}
              value={form.projectNameFocus}
              onChange={set('projectNameFocus')}
            />
            <Input
              label={t('epmName')}
              placeholder={t('placeholders.epmName')}
              value={form.projectNameEPM}
              onChange={set('projectNameEPM')}
            />
            <Input
              label={t('clientName')}
              required
              placeholder={t('placeholders.client')}
              value={form.clientName}
              onChange={set('clientName')}
              error={errors.clientName}
            />
            <Select
              label={t('businessUnit')}
              placeholder={t('selectBusinessUnit')}
              value={form.businessUnit}
              onChange={set('businessUnit')}
              options={BUSINESS_UNITS.map((b) => ({ value: b, label: b }))}
            />
          </div>
        </FormSection>

        <FormSection title={t('team')} icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label={t('projectManager')}
              required
              placeholder={t('selectPm')}
              value={form.projectManager}
              onChange={set('projectManager')}
              error={errors.projectManager}
              options={pmUsers.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Select
              label={t('bdm')}
              placeholder={t('selectBdm')}
              value={form.bdm}
              onChange={set('bdm')}
              options={bdmUsers.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Select
              label="DRM"
              placeholder={t('selectDrm')}
              value={form.drm}
              onChange={set('drm')}
              options={allUsers.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Select
              label="CRP"
              placeholder={t('selectCrp')}
              value={form.crp}
              onChange={set('crp')}
              options={allUsers.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Select
              label={t('buHead')}
              placeholder={t('selectBuHead')}
              value={form.buHead}
              onChange={set('buHead')}
              options={buHeadUsers.map((u) => ({ value: u.id, label: u.name }))}
            />
          </div>
        </FormSection>

        {/* Section 4: Financial */}
        <FormSection title={t('financial')} subtitle={tc('amountsInUsd')} icon={Wallet}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t('projectValueIn', { currency })}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.projectValue}
              onChange={set('projectValue')}
            />
            <Input
              label={t('vat')}
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="15"
              value={form.vatPercent}
              onChange={set('vatPercent')}
            />
            <Input
              label={t('poNumber')}
              placeholder={t('placeholders.poNumber')}
              value={form.poNumber}
              onChange={set('poNumber')}
            />
          </div>
        </FormSection>

        {/* Section 5: Timeline */}
        <FormSection title={t('timeline')} icon={CalendarRange}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DatePicker
              label={t('startDate')}
              required
              value={form.startDate}
              onChange={set('startDate')}
              error={errors.startDate}
            />
            <DatePicker
              label={t('endDate')}
              value={form.endDate}
              onChange={set('endDate')}
              min={form.startDate || undefined}
            />
            <Input
              label={t('duration')}
              type="number"
              readOnly
              value={form.durationMonths}
              hint={t('durationHint')}
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>
        </FormSection>

        <FormSection title={t('revenueIn', { currency })} subtitle={tc('amountsInUsd')} icon={Layers}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label={t('swRevenue')}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.revenueSWLic}
              onChange={set('revenueSWLic')}
            />
            <Input
              label={t('logisticsRevenue')}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.revenueLogistics}
              onChange={set('revenueLogistics')}
            />
            <Input
              label={t('trainingRevenue')}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.revenueTraining}
              onChange={set('revenueTraining')}
            />
            <Input
              label={t('externalRevenue')}
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
            <Button variant="ghost">{t('cancel')}</Button>
          </Link>
          <Button type="submit" icon={Check} loading={saving}>
            {t('create')}
          </Button>
        </div>
      </form>
    </div>
    </MotionConfig>
  );
}
