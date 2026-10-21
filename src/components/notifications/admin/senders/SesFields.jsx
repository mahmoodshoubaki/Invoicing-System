'use client';

import { controlClass } from '@/components/ui/kit';
import { Field } from './senderShared';

/**
 * An Amazon SES sender's region and keys. The secret key is never shown or
 * kept between saves, so it is asked for every time.
 *
 * @param {{ form: Object, set: (patch) => void, editing: boolean }} props
 */
export default function SesFields({ form, set, editing }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Region">
          <input value={form.region} onChange={(e) => set({ region: e.target.value })} className={`${controlClass} w-full font-mono`} placeholder="eu-west-1" />
        </Field>
        <Field label="Configuration set" hint="— optional">
          <input value={form.configurationSet} onChange={(e) => set({ configurationSet: e.target.value })} className={`${controlClass} w-full`} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Access key id">
          <input value={form.accessKeyId} onChange={(e) => set({ accessKeyId: e.target.value })} className={`${controlClass} w-full font-mono`} autoComplete="off" />
        </Field>
        <Field label="Secret access key">
          <input type="password" value={form.secretAccessKey} onChange={(e) => set({ secretAccessKey: e.target.value })} className={`${controlClass} w-full`} autoComplete="new-password" placeholder={editing ? 'Type it again to save' : ''} />
        </Field>
      </div>
    </>
  );
}
