'use client';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { CHANNEL_TABS, NO_STATUS } from './typeTabs';

/**
 * Which channel's words are being edited. Each shows what is sent today (the
 * live version, or "off"), a newer draft if there is one, and a dot when it has
 * unsaved edits — the other channel's editor keeps them while out of sight.
 *
 * @param {{
 *   value: number, onChange: (channelKey: number) => void,
 *   channels: Array<{ channelKey: number, liveVersion: number|null, latestVersion: number|null }>,
 *   status: Record<number, { dirty: boolean }>,
 * }} props
 */
export default function ChannelSwitch({ value, onChange, channels, status }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-[#f6f5f3] p-1" role="group" aria-label="Channel">
      {CHANNEL_TABS.map(({ key, label, icon: Icon }) => {
        const info = channels.find((c) => c.channelKey === key) ?? { liveVersion: null, latestVersion: null };
        const active = value === key;
        const draft = info.latestVersion != null && info.latestVersion !== info.liveVersion;
        const unsaved = (status[key] ?? NO_STATUS).dirty;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={active
              ? { backgroundColor: '#fff', color: CHROME.textPrimary, boxShadow: '0 1px 2px rgb(60 60 58 / 0.12)' }
              : { color: CHROME.textMuted }}
          >
            <Icon size={13} aria-hidden="true" />
            {label}
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: info.liveVersion != null ? withAlpha(STATUS.good, 0.14) : '#ecebe8',
                color: info.liveVersion != null ? CHROME.textPrimary : CHROME.textMuted,
              }}
            >
              {info.liveVersion != null ? `v${info.liveVersion} live` : 'off'}
            </span>
            {draft && (
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: withAlpha(STATUS.info, 0.14), color: CHROME.textPrimary }}>
                draft v{info.latestVersion}
              </span>
            )}
            {unsaved && <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS.warning }} title="Unsaved changes" />}
          </button>
        );
      })}
    </div>
  );
}
