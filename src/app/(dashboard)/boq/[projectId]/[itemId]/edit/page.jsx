'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Check } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { Input, Select, Textarea } from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { mockProjects } from '@/mock/projects';
import { mockBOQItems } from '@/mock/boq';
import { BILLING_FREQUENCY_LIST } from '@/constants/sla';

function calcCosts(qty, unit, vatPercent = 15) {
  const q = parseFloat(qty) || 0;
  const u = parseFloat(unit) || 0;
  const total = q * u;
  return { total: total.toFixed(2), vat: (total * (vatPercent / 100)).toFixed(2) };
}

export default function EditBOQItemPage() {
  const { projectId, itemId } = useParams();
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const proj = mockProjects.find((p) => p.id === projectId);
      const item = mockBOQItems.find((b) => b.id === itemId && b.projectId === projectId);
      if (!proj || !item) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      setProject(proj);
      setForm({
        arabicItem: item.arabicItem || '',
        englishItem: item.englishItem || '',
        quantity: String(item.quantity || ''),
        unitCost: String(item.unitCost || ''),
        totalCost: String(item.totalCost || ''),
        vatSAR: String(item.vatSAR || ''),
        expectedInvoicingDate: item.expectedInvoicingDate || '',
        billingFrequency: item.billingFrequency || 'Milestone',
        notes: item.notes || '',
      });
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [projectId, itemId]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === 'quantity' || field === 'unitCost') {
        const costs = calcCosts(
          field === 'quantity' ? val : prev.quantity,
          field === 'unitCost' ? val : prev.unitCost,
          project?.vatPercent || 15
        );
        next.totalCost = costs.total;
        next.vatSAR = costs.vat;
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.englishItem.trim()) e.englishItem = 'English item description is required';
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
      e.quantity = 'Valid quantity is required';
    if (!form.unitCost || isNaN(Number(form.unitCost)) || Number(form.unitCost) <= 0)
      e.unitCost = 'Valid unit cost is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setShowToast(true);
      setTimeout(() => router.push(`/boq/${projectId}`), 1200);
    }, 600);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">BOQ item not found.</p>
        <Link href={`/boq/${projectId}`}>
          <Button variant="outline" className="mt-4">Back to BOQ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check size={16} />
          BOQ item updated successfully!
        </div>
      )}

      <PageHeader
        title="Edit BOQ Item"
        subtitle={project.contractName}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'BOQ', href: '/boq' },
          { label: project.contractName, href: `/boq/${projectId}` },
          { label: 'Edit Item' },
        ]}
        actions={
          <Link href={`/boq/${projectId}`}>
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
              label="English Item Description"
              required
              placeholder="e.g. Cloud Architecture Design"
              value={form.englishItem}
              onChange={set('englishItem')}
              error={errors.englishItem}
            />
            <Input
              label="Arabic Item Description"
              placeholder="وصف العنصر بالعربية"
              value={form.arabicItem}
              onChange={set('arabicItem')}
            />
            <Input
              label="Quantity"
              required
              type="number"
              min="1"
              step="1"
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
              type="number"
              readOnly
              value={form.totalCost}
              hint="Auto-calculated"
              className="bg-gray-50 cursor-not-allowed"
            />
            <Input
              label="VAT (SAR)"
              type="number"
              readOnly
              value={form.vatSAR}
              hint={`Auto-calculated at ${project?.vatPercent || 15}%`}
              className="bg-gray-50 cursor-not-allowed"
            />
            <Input
              label="Expected Invoicing Date"
              type="date"
              value={form.expectedInvoicingDate}
              onChange={set('expectedInvoicingDate')}
            />
            <Select
              label="Billing Frequency"
              value={form.billingFrequency}
              onChange={set('billingFrequency')}
              options={BILLING_FREQUENCY_LIST.map((f) => ({ value: f, label: f }))}
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
          <Link href={`/boq/${projectId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
