'use client';

import { controlClass } from '@/components/ui/kit';
import { FALLBACK_SECURITY, Field } from './senderShared';

/**
 * An SMTP sender's server and sign-in. The password is never shown or kept
 * between saves, so it is asked for every time.
 *
 * @param {{ form: Object, set: (patch) => void, editing: boolean, securityModes: Array }} props
 */
export default function SmtpFields({ form, set, editing, securityModes }) {
  return (
    <>
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <Field label="Host">
          <input value={form.host} onChange={(e) => set({ host: e.target.value })} className={`${controlClass} w-full font-mono`} placeholder="smtp.office365.com" />
        </Field>
        <Field label="Port">
          <input type="number" min={1} value={form.port} onChange={(e) => set({ port: e.target.value })} className={`${controlClass} w-full`} />
        </Field>
      </div>
      <Field label="Security">
        <select value={form.securityKey} onChange={(e) => set({ securityKey: Number(e.target.value) })} className={`${controlClass} w-full`}>
          {(securityModes.length ? securityModes : FALLBACK_SECURITY).map((m) => (
            <option key={m.key} value={m.key}>{m.value}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="User name" hint="— optional">
          <input value={form.userName} onChange={(e) => set({ userName: e.target.value })} className={`${controlClass} w-full`} autoComplete="off" />
        </Field>
        <Field label="Password" hint={form.userName.trim() ? '— needed with a user name' : '— only with a user name'}>
          <input type="password" value={form.password} onChange={(e) => set({ password: e.target.value })} className={`${controlClass} w-full`} autoComplete="new-password" placeholder={editing ? 'Type it again to save' : ''} />
        </Field>
      </div>
    </>
  );
}
