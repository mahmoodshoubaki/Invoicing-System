'use client';

/** One email sender, with what can be done to it. */

import { memo } from 'react';
import { Mail, Pencil, Send, Server, Star, StarOff, Trash2 } from 'lucide-react';

import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { EMAIL_PROVIDER } from '@/constants/notifications';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';

import { FALLBACK_SECURITY } from './senderShared';

export const SenderCard = memo(function SenderCard({ sender, providers, securityModes, canChange, onEdit, onTest, onDefault, onDelete }) {
  const providerLabel = providers[sender.providerKey]?.value ?? (sender.providerKey === EMAIL_PROVIDER.SES ? 'Amazon SES' : 'SMTP');
  const security = securityModes[sender.smtp?.securityKey]?.value
    ?? FALLBACK_SECURITY.find((m) => m.key === sender.smtp?.securityKey)?.value;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#f6f5f3', color: CHROME.textSecondary }}>
            {sender.providerKey === EMAIL_PROVIDER.SES ? <Server size={16} aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
              {sender.name}
              {sender.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: withAlpha(STATUS.warning, 0.15), color: CHROME.textPrimary }}>
                  <Star size={10} aria-hidden="true" /> Default
                </span>
              )}
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: '#f1f0ee', color: CHROME.textMuted }}>
                {providerLabel}
              </span>
            </p>
            <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textSecondary }}>
              {sender.fromName ? `${sender.fromName} <${sender.fromAddress}>` : sender.fromAddress}
            </p>
            <p className="mt-0.5 font-mono text-[11px]" style={{ color: CHROME.textMuted }}>
              {sender.smtp
                ? `${sender.smtp.host}:${sender.smtp.port}${security ? ` · ${security}` : ''}${sender.smtp.userName ? ` · ${sender.smtp.userName}` : ''}`
                : sender.ses
                  ? `${sender.ses.region}${sender.ses.configurationSet ? ` · ${sender.ses.configurationSet}` : ''}`
                  : ''}
            </p>
            {(sender.lastModifiedOn || sender.createdOn) && (
              <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
                {sender.lastModifiedOn
                  ? `Changed ${formatDateTime(sender.lastModifiedOn)}${sender.lastModifiedByName ? ` by ${sender.lastModifiedByName}` : ''}`
                  : `Added ${formatDateTime(sender.createdOn)}${sender.createdByName ? ` by ${sender.createdByName}` : ''}`}
              </p>
            )}
          </div>
        </div>

        {canChange && (
          <div className="flex flex-wrap items-center gap-1">
            <Button size="sm" variant="outline" icon={Send} onClick={() => onTest(sender)}>Test</Button>
            <Button size="sm" variant="ghost" icon={Pencil} onClick={() => onEdit(sender)}>Edit</Button>
            <Button size="sm" variant="ghost" icon={sender.isDefault ? StarOff : Star} onClick={() => onDefault(sender)}>
              {sender.isDefault ? 'Remove default' : 'Make default'}
            </Button>
            {!sender.isDefault && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onDelete(sender)} title="Delete" />}
          </div>
        )}
      </div>
    </Card>
  );
});
