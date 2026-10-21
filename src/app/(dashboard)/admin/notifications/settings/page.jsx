'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import SettingRow from '@/components/ui/SettingRow';
import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import { CHROME } from '@/theme/vizPalette';
import { useToast } from '@/hooks/useToast';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { usePermission } from '@/hooks/usePermission';
import { allow } from '@/constants/workflowPermissions';
import { NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { notificationRepository } from '@/repositories/notificationRepository';

/**
 * How notifications behave everywhere: the links' address, email retries,
 * tracking, how long things are kept. Reading is `Notifications.Manage`;
 * changing is `Manage Settings`. Values travel as strings and each row's
 * control comes from its type.
 */
export default function NotificationSettingsPage() {
  const toast = useToast();
  const { can } = usePermission();
  const canEdit = allow(can, NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS);

  const [settings, setSettings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const load = useCallback(async () => {
    try {
      setSettings(await notificationRepository.getSettings());
      setLoaded(true);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useLoadOnChange(load);

  const handleSave = useCallback(async (key, value) => {
    setSavingKey(key);
    setSaveError(null);
    try {
      const saved = await notificationRepository.updateSetting(key, value);
      setSettings((prev) => prev.map((s) => (s.key === key ? saved : s)));
      toast.success('Saved', `${key} is now ${saved.value}.`);
    } catch (err) {
      // NTF-027 among others — the message says what to change, so it is shown in full.
      setSaveError(err);
    } finally {
      setSavingKey(null);
    }
  }, [toast]);

  return (
    <div>
      <PageHeader
        title="Notification settings"
        subtitle="How every notification is sent, tracked and kept."
        actions={!canEdit && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: '#f1f0ee', color: CHROME.textMuted }}
          >
            <Lock size={10} aria-hidden="true" />
            Read only
          </span>
        )}
      />

      {saveError && <div className="mb-4"><ErrorNote error={saveError} /></div>}

      <Card>
        {error && !loaded ? (
          <ErrorNote error={error} onRetry={load} />
        ) : !loaded ? (
          <Skeleton rows={8} height={48} />
        ) : settings.length === 0 ? (
          <p className="text-xs" style={{ color: CHROME.textMuted }}>No settings returned.</p>
        ) : (
          <ul className="flex flex-col">
            {settings.map((setting) => (
              <SettingRow
                // Keyed on the value too: a saved row resets its draft to what was stored.
                key={`${setting.key}:${setting.value}`}
                setting={setting}
                canEdit={canEdit}
                saving={savingKey === setting.key}
                onSave={handleSave}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
