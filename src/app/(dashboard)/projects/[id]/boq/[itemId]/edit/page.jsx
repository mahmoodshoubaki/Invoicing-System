'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Input, Select, Textarea } from '@/components/forms/FormField';
import { formatCurrency } from '@/utils';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import {
  updateBOQItem,
  fetchBOQByProjectCode,
  selectBOQItems,
  selectBOQLoading,
  selectCurrentBOQ,
} from '@/store/slices/boqSlice';
import { fetchProjectById, selectSelectedProject, selectProjectsLoading } from '@/store/slices/projectsSlice';
import { useToast } from '@/hooks/useToast';

function toDateInput(iso) {
  if (!iso) return '';
  return iso.split('T')[0];
}

export default function EditBOQItemPage() {
  const { id, itemId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const toast = useToast();

  const billingFrequencies = useSelector(selectBillingFrequencies);
  const currentProject = useSelector(selectSelectedProject);
  const projectLoading = useSelector(selectProjectsLoading);
  const currentBOQ = useSelector(selectCurrentBOQ);
  const boqItems = useSelector(selectBOQItems);
  const boqLoading = useSelector(selectBOQLoading);

  const item = boqItems.find((i) => String(i.id) === String(itemId));

  const [form, setForm]     = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProject?.projectCode && currentProject.id === id) {
      dispatch(fetchBOQByProjectCode(currentProject.projectCode));
    }
  }, [dispatch, id, currentProject?.projectCode]);

  useEffect(() => {
    if (item && !form) {
      setForm({
        englishName:           item.englishName ?? '',
        arabicName:            item.arabicName ?? '',
        quantity:              String(item.quantity ?? ''),
        unitCost:              String(item.unitCost ?? ''),
        totalCost:             String(item.totalCost ?? ''),
        billingFrequencyId:    item.billingFrequencyId != null ? String(item.billingFrequencyId) : '',
        baselineInvoicingDate: toDateInput(item.baselineInvoicingDate),
        expectedInvoicingDate: toDateInput(item.expectedInvoicingDate),
        notes:                 item.notes ?? '',
      });
    }
  }, [item, form]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === 'quantity' || field === 'unitCost') {
        const q = parseFloat(field === 'quantity' ? val : prev.quantity) || 0;
        const u = parseFloat(field === 'unitCost'  ? val : prev.unitCost)  || 0;
        next.totalCost = (q * u).toFixed(2);
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.englishName.trim())                           e.englishName        = 'English description is required';
    if (!form.arabicName.trim())                            e.arabicName         = 'Arabic description is required';
    if (!form.quantity || Number(form.quantity) <= 0)       e.quantity           = 'Valid quantity is required';
    if (form.unitCost === '' || Number(form.unitCost) < 0)  e.unitCost           = 'Valid unit cost is required';
    if (!form.billingFrequencyId)                           e.billingFrequencyId = 'Billing frequency is required';
    if (!form.baselineInvoicingDate)                        e.baselineInvoicingDate = 'Baseline invoicing date is required';
    if (!form.expectedInvoicingDate)                        e.expectedInvoicingDate = 'Expected invoicing date is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await dispatch(updateBOQItem({
        id: itemId,
        data: {
          boqId:                 currentBOQ?.id ?? item.boqId ?? null,
          englishName:           form.englishName,
          arabicName:            form.arabicName,
          quantity:              Number(form.quantity),
          unitCost:               Number(form.unitCost),
          expectedInvoicingDate: form.expectedInvoicingDate ?? null,
          baselineInvoicingDate: form.baselineInvoicingDate ?? null,
          billingFrequencyId:    Number(form.billingFrequencyId),
          notes:                 form.notes || null,
          statusId:              item.statusId ?? 1,
        },
      })).unwrap();
      toast.success('BOQ item updated', 'The item was updated successfully.');
      router.push(`/projects/${id}/boq`);
    } catch (err) {
      toast.error('Failed to update BOQ item', err ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (projectLoading || boqLoading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">BOQ item not found.</p>
        <Link href={`/projects/${id}/boq`}>
          <Button variant="outline" className="mt-4">Back to BOQ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Edit BOQ Item"
        subtitle={currentProject?.projectCode}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: currentProject?.projectName, href: `/projects/${id}` },
          { label: 'BOQ', href: `/projects/${id}/boq` },
          { label: 'Edit Item' },
        ]}
        actions={
          <Link href={`/projects/${id}/boq`}>
            <Button variant="outline" icon={ChevronLeft} size="sm">Back</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl flex flex-col gap-6">
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Item Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="English Description"
              required
              value={form.englishName}
              onChange={set('englishName')}
              error={errors.englishName}
            />
            <Input
              label="Arabic Description"
              required
              value={form.arabicName}
              onChange={set('arabicName')}
              error={errors.arabicName}
            />
            <Input
              label="Quantity"
              required
              type="number"
              min="0"
              step=".01"
              value={form.quantity}
              onChange={set('quantity')}
              error={errors.quantity}
            />
            <Input
              label="Unit Cost (SAR)"
              required
              type="number"
              min="0"
              step="0.01"
              value={form.unitCost}
              onChange={set('unitCost')}
              error={errors.unitCost}
            />
            <Input
              label="Total Cost (SAR)"
              type="text"
              readOnly
              value={formatCurrency(form.totalCost)}
              hint="Auto-calculated from quantity × unit cost"
              className="bg-gray-50 cursor-not-allowed"
            />
            <Select
              label="Billing Frequency"
              required
              value={form.billingFrequencyId}
              onChange={set('billingFrequencyId')}
              placeholder="Select frequency"
              options={billingFrequencies.map((f) => ({ value: String(f.id), label: f.label }))}
              error={errors.billingFrequencyId}
            />
            <Input
              label="Baseline Invoicing Date"
              type="date"
              readOnly
              disabled
              value={form.baselineInvoicingDate}
              error={errors.baselineInvoicingDate}
            />
            <Input
              label="Expected Invoicing Date"
              type="date"
              required
              value={form.expectedInvoicingDate}
              onChange={set('expectedInvoicingDate')}
              error={errors.expectedInvoicingDate}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Notes"
                rows={3}
                value={form.notes}
                onChange={set('notes')}
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href={`/projects/${id}/boq`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
