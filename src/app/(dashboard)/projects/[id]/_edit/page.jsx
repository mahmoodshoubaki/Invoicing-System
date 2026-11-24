'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BASE_CURRENCY } from '@/constants/currencies';
import { useParams, useRouter } from 'next/navigation';
import { decodeRouteParam } from '@/lib/routeParam';
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
  const { id: rawId } = useParams();
  const projectCode = decodeRouteParam(rawId);
  const router    = useRouter();
  const dispatch  = useDispatch();

  const project   = useSelector(selectMainProjectDetails);
  const isLoading = useSelector(selectMainDetailsLoading);
  const currency  = BASE_CURRENCY;
  const tc        = useTranslations('common');
  const t         = useTranslations('projectForm');

  const [form, setForm]           = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
  }, [dispatch, projectCode]);

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
    if (!form.contractName.trim())  e.contractName  = t('errors.contractName');
    if (!form.contractNumber.trim()) e.contractNumber = t('errors.contractNumber');
    if (!form.clientName.trim())    e.clientName    = t('errors.clientName');
    if (!form.startDate)            e.startDate     = t('errors.startDate');
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
        <p className="text-gray-500">{t('notFound')}</p>
        <Link href="/projects">
          <Button variant="outline" className="mt-4">{t('backToProjects')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="mx-auto max-w-4xl">
      {showToast && (
        <div className="fixed top-5 inset-e-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check size={16} />
          {t('updated')}
        </div>
      )}

      <SubPageHeader
        icon={FileSignature}
        eyebrow={t('editEyebrow')}
        title={t('editTitle')}
        subtitle={form.contractName}
        breadcrumbs={[
          { label: t('home'), href: '/' },
          { label: t('projects'), href: '/projects' },
          { label: form.contractName, href: `/projects/${encodeURIComponent(projectCode)}` },
          { label: t('edit') },
        ]}
        actions={
          <Link href={`/projects/${encodeURIComponent(projectCode)}`}>
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
              value={form.contractName}
              onChange={set('contractName')}
              error={errors.contractName}
            />
            <Input
              label={t('contractNumber')}
              required
              value={form.contractNumber}
              onChange={set('contractNumber')}
              error={errors.contractNumber}
            />
            <Input
              label={t('projectCode')}
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
              value={form.projectNameFocus}
              onChange={set('projectNameFocus')}
            />
            <Input
              label={t('epmName')}
              value={form.projectNameEPM}
              onChange={set('projectNameEPM')}
            />
            <Input
              label={t('clientName')}
              required
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
              value={form.projectValue}
              onChange={set('projectValue')}
            />
            <Input
              label={t('vat')}
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.vatPercent}
              onChange={set('vatPercent')}
            />
            <Input
              label={t('poNumber')}
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
              value={form.revenueSWLic}
              onChange={set('revenueSWLic')}
            />
            <Input
              label={t('logisticsRevenue')}
              type="number"
              min="0"
              step="0.01"
              value={form.revenueLogistics}
              onChange={set('revenueLogistics')}
            />
            <Input
              label={t('trainingRevenue')}
              type="number"
              min="0"
              step="0.01"
              value={form.revenueTraining}
              onChange={set('revenueTraining')}
            />
            <Input
              label={t('externalRevenue')}
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
            <Button variant="ghost">{t('cancel')}</Button>
          </Link>
          <Button type="submit" icon={Check} loading={saving}>
            {t('saveChanges')}
          </Button>
        </div>
      </form>
    </div>
    </MotionConfig>
  );
}
