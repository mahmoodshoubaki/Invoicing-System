'use client';

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import {
  buildUrl,
  hostnameOf,
  INTERNAL_API_LABEL,
  INTERNAL_API_ORIGIN,
  normalizeHost,
  splitUrl,
} from '@/utils/httpCallUrl';

import { controlClass, Label } from './shared';
import { TokenField } from './TokenField';

export const AddressInput = memo(function AddressInput({ input, value, fields, approvedHosts, onChange }) {
  const url = value ?? '';
  const parts = splitUrl(url);
  const host = parts?.host ?? '';
  const internal = host === INTERNAL_API_ORIGIN;

  const hostname = internal ? null : hostnameOf(url);
  const matched = hostname ? approvedHosts.find((d) => normalizeHost(d.host) === hostname) : null;
  const approved = internal || host === '' || Boolean(matched);

  return (
    <div>
      <Label hint={input.required ? '— required' : undefined}>{input.label}</Label>

      {parts ? (
        <div className="flex gap-1.5">
          <div className="w-52 shrink-0">
            <select
              value={internal ? INTERNAL_API_ORIGIN : (matched?.host ?? parts.host)}
              onChange={(e) => onChange(buildUrl(parts, { host: e.target.value }))}
              aria-label={`${input.label} — host`}
              className={`${controlClass} w-full`}
              style={!approved ? { borderColor: STATUS.warning } : undefined}
            >
              <option value="">Choose an approved host…</option>
              <option value={INTERNAL_API_ORIGIN}>{INTERNAL_API_LABEL}</option>
              {approvedHosts.map((d) => (
                <option key={d.id ?? d.host} value={d.host}>{d.host}</option>
              ))}
              {parts.host && !internal && !matched && (
                <option value={parts.host}>{parts.host} — not approved</option>
              )}
            </select>
          </div>

          <div className="min-w-0 flex-1">
            <TokenField
              value={parts.rest}
              onChange={(next) => onChange(buildUrl(parts, { rest: next }))}
              fields={fields}
              placeholder="/v1/invoices"
              aria-label={`${input.label} — path`}
            />
          </div>
        </div>
      ) : (
        <TokenField
          value={url}
          onChange={onChange}
          fields={fields}
          placeholder="https://api.example.com/v1/notify"
          aria-label={input.label}
          style={!approved ? { borderColor: STATUS.warning } : undefined}
        />
      )}

      {!approved && (
        <p
          className="mt-1.5 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px]"
          style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
        >
          <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
          <span>
            <strong>{hostname ?? host}</strong> is not on the approved list, so this call will be
            refused when it runs. An administrator can approve it in the workflow API domains screen.
          </span>
        </p>
      )}

      {internal && (
        <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
          The server fills in this system&rsquo;s address from its <code>InternalApi</code> setting.
          The host that points at still has to be approved — for <code>https://localhost:7135</code>,
          approve <code>localhost</code>.
        </p>
      )}

      {parts && !parts.host && (
        <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
          {approvedHosts.length === 0
            ? 'No domains approved yet. An administrator adds them in the workflow API domains screen.'
            : 'Pick where this call goes.'}
        </p>
      )}
    </div>
  );
});
