'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Settings,
  Bell,
  Plug,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Building2,
  Mail,
  Globe,
  Key,
} from 'lucide-react';
import { addToast } from '@/store/slices/uiSlice';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';
import { Input, Select, Textarea, Checkbox } from '@/components/forms/FormField';

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'sla', label: 'SLA', icon: Clock },
];

const CURRENCY_OPTIONS = [
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
];

export default function SettingsPage() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // General
  const [general, setGeneral] = useState({
    appName: 'Enterprise Invoicing & Tracking System',
    companyName: 'Devoteam Middle East',
    companyEmail: 'billing@devoteam.com',
    companyPhone: '+966 11 000 0000',
    companyAddress: 'Riyadh, Saudi Arabia',
    defaultCurrency: 'SAR',
    defaultVAT: '15',
    fiscalYearStart: '01-01',
    language: 'en',
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    emailOnSubmit: true,
    emailOnApprove: true,
    emailOnReject: true,
    emailOnSLAWarning: true,
    emailOnSLABreach: true,
    systemOnAssign: true,
    systemOnRevision: true,
    escalationEmail: 'admin@devoteam.com',
    escalationCC: 'bu.head@devoteam.com',
    digestEnabled: false,
    digestFrequency: 'daily',
  });

  // Integrations
  const [integrations, setIntegrations] = useState({
    etimadEndpoint: 'https://api.etimad.sa/v1',
    etimadApiKey: '••••••••••••••••••••••••',
    etimadEnabled: true,
  });

  // SLA
  const [sla, setSla] = useState({
    warningDays: '7',
    escalation1Days: '1',
    escalation2Days: '7',
    escalation3Days: '14',
    escalation1Recipients: 'line_manager',
    escalation2Recipients: 'bu_head',
    escalation3Recipients: 'admin',
    workingDaysOnly: true,
  });

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    dispatch(addToast({ type: 'success', title: 'Settings saved', message: `${TABS.find((t) => t.id === activeTab)?.label} settings have been saved.` }));
  }

  return (
    <div>
      <PageHeader
        title="System Settings"
        subtitle="Configure application-wide settings and integrations"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Settings' }]}
      />

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white shadow-sm text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-gray-800">Application</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Application Name"
                value={general.appName}
                onChange={(e) => setGeneral((p) => ({ ...p, appName: e.target.value }))}
              />
              <Select
                label="Language"
                value={general.language}
                options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' }]}
                onChange={(e) => setGeneral((p) => ({ ...p, language: e.target.value }))}
              />
              <Select
                label="Default Currency"
                value={general.defaultCurrency}
                options={CURRENCY_OPTIONS}
                onChange={(e) => setGeneral((p) => ({ ...p, defaultCurrency: e.target.value }))}
              />
              <Input
                label="Default VAT %"
                type="number"
                min="0"
                max="100"
                value={general.defaultVAT}
                onChange={(e) => setGeneral((p) => ({ ...p, defaultVAT: e.target.value }))}
                hint="Applied to all new invoices by default"
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-gray-800">Company Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Company Name"
                value={general.companyName}
                onChange={(e) => setGeneral((p) => ({ ...p, companyName: e.target.value }))}
              />
              <Input
                label="Billing Email"
                type="email"
                value={general.companyEmail}
                onChange={(e) => setGeneral((p) => ({ ...p, companyEmail: e.target.value }))}
              />
              <Input
                label="Phone"
                value={general.companyPhone}
                onChange={(e) => setGeneral((p) => ({ ...p, companyPhone: e.target.value }))}
              />
              <Input
                label="Fiscal Year Start (MM-DD)"
                value={general.fiscalYearStart}
                onChange={(e) => setGeneral((p) => ({ ...p, fiscalYearStart: e.target.value }))}
                hint="Format: MM-DD e.g. 01-01"
              />
              <div className="col-span-2">
                <Textarea
                  label="Company Address"
                  value={general.companyAddress}
                  onChange={(e) => setGeneral((p) => ({ ...p, companyAddress: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button icon={Save} onClick={handleSave} loading={saving}>Save General Settings</Button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-gray-800">Email Notifications</h3>
            </div>
            <div className="space-y-3">
              <Checkbox
                label="Invoice Submitted"
                description="Send email when an invoice is submitted for review"
                checked={notifications.emailOnSubmit}
                onChange={(e) => setNotifications((p) => ({ ...p, emailOnSubmit: e.target.checked }))}
              />
              <Checkbox
                label="Invoice Approved"
                description="Send email when an invoice is approved by BU Head"
                checked={notifications.emailOnApprove}
                onChange={(e) => setNotifications((p) => ({ ...p, emailOnApprove: e.target.checked }))}
              />
              <Checkbox
                label="Invoice Rejected"
                description="Send email when an invoice is rejected with reason"
                checked={notifications.emailOnReject}
                onChange={(e) => setNotifications((p) => ({ ...p, emailOnReject: e.target.checked }))}
              />
              <Checkbox
                label="SLA Warning (T-7 days)"
                description="Notify assignee 7 days before SLA deadline"
                checked={notifications.emailOnSLAWarning}
                onChange={(e) => setNotifications((p) => ({ ...p, emailOnSLAWarning: e.target.checked }))}
              />
              <Checkbox
                label="SLA Breach Escalation"
                description="Notify escalation recipients when SLA is breached"
                checked={notifications.emailOnSLABreach}
                onChange={(e) => setNotifications((p) => ({ ...p, emailOnSLABreach: e.target.checked }))}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-gray-800">System Notifications</h3>
            </div>
            <div className="space-y-3">
              <Checkbox
                label="Workflow Step Assigned"
                description="In-app notification when a workflow step is assigned"
                checked={notifications.systemOnAssign}
                onChange={(e) => setNotifications((p) => ({ ...p, systemOnAssign: e.target.checked }))}
              />
              <Checkbox
                label="Revision Requested"
                description="In-app notification when revision is requested on BOQ or invoice"
                checked={notifications.systemOnRevision}
                onChange={(e) => setNotifications((p) => ({ ...p, systemOnRevision: e.target.checked }))}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-gray-800">Escalation Recipients</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Primary Escalation Email"
                type="email"
                value={notifications.escalationEmail}
                onChange={(e) => setNotifications((p) => ({ ...p, escalationEmail: e.target.value }))}
                hint="Receives all escalation alerts"
              />
              <Input
                label="CC Email (optional)"
                type="email"
                value={notifications.escalationCC}
                onChange={(e) => setNotifications((p) => ({ ...p, escalationCC: e.target.value }))}
                hint="Carbon-copied on escalation emails"
              />
            </div>
            <div className="mt-4">
              <Checkbox
                label="Enable Daily Digest"
                description="Send a daily summary email of pending actions"
                checked={notifications.digestEnabled}
                onChange={(e) => setNotifications((p) => ({ ...p, digestEnabled: e.target.checked }))}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button icon={Save} onClick={handleSave} loading={saving}>Save Notification Settings</Button>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Plug size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-gray-800">Etimad Integration</h3>
              </div>
              <Badge variant="warning" size="md" dot>Mock Mode</Badge>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                This integration is running in <strong>Mock Mode</strong>. API calls are simulated and no real data is sent to Etimad. Configure credentials below when ready to go live.
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-gray-600 font-medium">Connection Status: Mock / Disconnected</span>
              <button className="ml-auto text-xs text-primary font-medium hover:underline">Test Connection</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="API Endpoint URL"
                value={integrations.etimadEndpoint}
                onChange={(e) => setIntegrations((p) => ({ ...p, etimadEndpoint: e.target.value }))}
                placeholder="https://api.etimad.sa/v1"
              />
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Key size={13} className="text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">API Key</label>
                  <Badge variant="warning" size="sm">Mock</Badge>
                </div>
                <input
                  type="password"
                  value={integrations.etimadApiKey}
                  onChange={(e) => setIntegrations((p) => ({ ...p, etimadApiKey: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-primary focus:outline-none"
                  placeholder="Enter your Etimad API key"
                />
                <p className="text-xs text-gray-400 mt-1">API key is stored securely and never exposed in the UI.</p>
              </div>
              <Checkbox
                label="Enable Etimad Integration"
                description="When enabled, invoice submissions will be forwarded to the Etimad platform"
                checked={integrations.etimadEnabled}
                onChange={(e) => setIntegrations((p) => ({ ...p, etimadEnabled: e.target.checked }))}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-gray-300" />
              <h3 className="text-sm font-semibold text-gray-400">More Integrations</h3>
              <Badge variant="default" size="sm">Coming Soon</Badge>
            </div>
            <p className="text-xs text-gray-400">SAP integration, MS Dynamics, and Power BI connectors are planned for a future release.</p>
          </Card>

          <div className="flex justify-end">
            <Button icon={Save} onClick={handleSave} loading={saving}>Save Integration Settings</Button>
          </div>
        </div>
      )}

      {/* SLA Tab */}
      {activeTab === 'sla' && (
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-gray-800">SLA Thresholds</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Warning Threshold (days before due)"
                type="number"
                min="1"
                value={sla.warningDays}
                onChange={(e) => setSla((p) => ({ ...p, warningDays: e.target.value }))}
                hint="Assignee is notified this many days before the SLA deadline"
              />
              <div className="flex items-end gap-1">
                <Checkbox
                  label="Working Days Only"
                  description="Exclude weekends and public holidays from SLA calculations"
                  checked={sla.workingDaysOnly}
                  onChange={(e) => setSla((p) => ({ ...p, workingDaysOnly: e.target.checked }))}
                  className="mt-auto mb-0.5"
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold text-gray-800">Escalation Levels</h3>
            </div>
            <div className="space-y-4">
              {[
                { key: '1', label: 'Escalation Level 1', daysKey: 'escalation1Days', recipientsKey: 'escalation1Recipients', desc: 'Triggered when SLA is breached' },
                { key: '2', label: 'Escalation Level 2', daysKey: 'escalation2Days', recipientsKey: 'escalation2Recipients', desc: 'Triggered if no action taken after Level 1' },
                { key: '3', label: 'Escalation Level 3', daysKey: 'escalation3Days', recipientsKey: 'escalation3Recipients', desc: 'Critical escalation to senior management' },
              ].map(({ key, label, daysKey, recipientsKey, desc }) => (
                <div key={key} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${key === '1' ? 'bg-yellow-500' : key === '2' ? 'bg-orange-500' : 'bg-red-500'}`}>
                      {key}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Trigger After (days overdue)"
                      type="number"
                      min="0"
                      value={sla[daysKey]}
                      onChange={(e) => setSla((p) => ({ ...p, [daysKey]: e.target.value }))}
                    />
                    <Select
                      label="Notify"
                      value={sla[recipientsKey]}
                      options={[
                        { value: 'line_manager', label: 'Line Manager' },
                        { value: 'bu_head', label: 'BU Head' },
                        { value: 'admin', label: 'Administrator' },
                        { value: 'all', label: 'All of the above' },
                      ]}
                      onChange={(e) => setSla((p) => ({ ...p, [recipientsKey]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button icon={Save} onClick={handleSave} loading={saving}>Save SLA Settings</Button>
          </div>
        </div>
      )}
    </div>
  );
}
