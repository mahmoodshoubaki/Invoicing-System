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
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { addBOQItem, fetchBOQByProjectCode, selectCurrentBOQ } from '@/store/slices/boqSlice';
import { createBOQItemForm } from '@/models/boq';
import { formatCurrency } from '@/utils';
import { fetchProjectById, selectSelectedProject, selectProjectsLoading } from '@/store/slices/projectsSlice';
import { useToast } from '@/hooks/useToast';

export default function NewBOQItemPage() {
  const { id } = useParams();
  const router    = useRouter();
  const dispatch    = useDispatch();
  const toast       = useToast();

  const billingFrequencies = useSelector(selectBillingFrequencies);
  const currentBOQ         = useSelector(selectCurrentBOQ);
  const currentProject     = useSelector(selectSelectedProject);
  const projectLoading     = useSelector(selectProjectsLoading);

  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProject?.projectCode && currentProject.id === id) {
      dispatch(fetchBOQByProjectCode(currentProject.projectCode));
    }
  }, [dispatch, id, currentProject?.projectCode]);

  const [form, setForm]     = useState(createBOQItemForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
    if (!form.englishName.trim())                           e.englishName           = 'English description is required';
    if (!form.arabicName.trim())                            e.arabicName            = 'Arabic description is required';
    if (!form.quantity || Number(form.quantity) <= 0)       e.quantity              = 'Valid quantity is required';
    if (form.unitCost === '' || Number(form.unitCost) < 0)  e.unitCost              = 'Valid unit cost is required';
    if (!form.billingFrequencyId)                           e.billingFrequencyId    = 'Billing frequency is required';
    if (!form.baselineInvoicingDate)                        e.baselineInvoicingDate = 'Baseline invoicing date is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await dispatch(addBOQItem({ form, boq: currentBOQ })).unwrap();
      toast.success('BOQ item added', 'The item was added successfully.');
      router.push(`/projects/${id}/boq`);
    } catch (err) {
      toast.error('Failed to add BOQ item', err ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const projectLabel = currentProject?.projectCode ?? 'BOQ';

  if (projectLoading || !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">

      <PageHeader
        title="Add BOQ Item"
        subtitle={projectLabel}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: currentProject.projectName, href: `/projects/${id}` },
          { label: 'BOQ', href: `/projects/${id}/boq` },
          { label: 'Add Item' },
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
              placeholder="e.g. Cloud Architecture Design"
              value={form.englishName}
              onChange={set('englishName')}
              error={errors.englishName}
            />
            <Input
              label="Arabic Description"
              required
              placeholder="وصف العنصر بالعربية"
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
              required
              type="date"
              value={form.baselineInvoicingDate}
              onChange={set('baselineInvoicingDate')}
              error={errors.baselineInvoicingDate}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Notes"
                rows={3}
                placeholder="Additional notes or context..."
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
          <Button type="submit" loading={saving}>Add Item</Button>
        </div>
      </form>
    </div>
  );
}
