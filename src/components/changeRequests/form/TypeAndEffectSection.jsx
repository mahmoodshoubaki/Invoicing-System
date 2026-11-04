'use client';

import { useSelector } from 'react-redux';
import { Tags } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import { CR_OTHER_TYPE_MAX } from '@/constants/changeRequests';
import { needsTypeText } from '@/lib/changeRequest/typesDraft';
import {
  selectChangeRequestProjectEffects, selectChangeRequestTypes, selectChangeRequestTypesFailed,
} from '@/store/slices/lookupsSlice';
import { CHROME, STATUS } from '@/theme/vizPalette';

function Problem({ text }) {
  return text ? <p data-problem className="mt-1.5 text-xs" style={{ color: STATUS.critical }}>{text}</p> : null;
}

const choiceClass = (on) => `press-flat flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
  on ? 'border-[#f8485e] bg-[#f8485e]/5' : 'border-[#e9e7e5] bg-white hover:border-[#fca2ae]'
}`;

/**
 * What kind of change the request is (one or more types; "Other" asks for a
 * description) and what it does to the contract value (one effect).
 *
 * @param {{ form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm> }} props
 */
export default function TypeAndEffectSection({ form }) {
  const types = useSelector(selectChangeRequestTypes);
  const effects = useSelector(selectChangeRequestProjectEffects);
  const failed = useSelector(selectChangeRequestTypesFailed);
  const problems = form.shownProblems;
  const lockTypes = !form.asks.types;
  const lockText = !form.asks.types && !form.asks.typeText;
  const lockEffect = !form.asks.effect;
  const showText = needsTypeText(form.typeKeys, types);

  return (
    <FormSection title="Type and project effect" subtitle="What kind of change this is, and what it does to the contract value" icon={Tags}>
      {types.length === 0 || effects.length === 0 ? (
        <p className="text-xs" style={{ color: failed ? STATUS.critical : CHROME.textMuted }}>
          {failed ? 'The types and project effects could not be loaded. Reload the page to try again.' : 'Loading the types…'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div data-problem-scope>
            <fieldset disabled={lockTypes}>
              <legend className="mb-2 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Type — pick one or more</legend>
              <div className="flex flex-col gap-1.5">
                {types.map((type) => {
                  const on = form.typeKeys.includes(type.key);
                  return (
                    <label key={type.key} className={choiceClass(on)}>
                      <input type="checkbox" checked={on} onChange={() => form.toggleType(type.key)} />
                      <span style={{ color: CHROME.textPrimary }}>{type.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <Problem text={problems.typeKeys} />
            {showText && (
              <div className="mt-2">
                <label htmlFor="cr-other-type" className="mb-1 block text-xs font-medium" style={{ color: CHROME.textSecondary }}>
                  Describe the other type
                </label>
                <textarea
                  id="cr-other-type"
                  rows={2}
                  maxLength={CR_OTHER_TYPE_MAX}
                  value={form.otherTypeText}
                  disabled={lockText}
                  onChange={(e) => form.setOtherTypeText(e.target.value)}
                  placeholder="Like: split milestone 2 into two payments"
                  className="w-full resize-y rounded-lg border bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                  style={{ borderColor: problems.otherTypeText ? STATUS.critical : '#e4e2e2' }}
                />
                <p className="text-right text-[10px] tabular-nums" style={{ color: CHROME.textMuted }}>
                  {form.otherTypeText.length} / {CR_OTHER_TYPE_MAX}
                </p>
                <Problem text={problems.otherTypeText} />
              </div>
            )}
          </div>

          <fieldset data-problem-scope disabled={lockEffect}>
            <legend className="mb-2 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Project effect — pick one</legend>
            <div className="flex flex-col gap-1.5" role="radiogroup">
              {effects.map((effect) => {
                const on = form.projectEffectKey === effect.key;
                return (
                  <label key={effect.key} className={choiceClass(on)}>
                    <input type="radio" name="cr-project-effect" checked={on} onChange={() => form.setProjectEffect(effect.key)} />
                    <span style={{ color: CHROME.textPrimary }}>{effect.label}</span>
                  </label>
                );
              })}
            </div>
            <Problem text={problems.projectEffectKey} />
          </fieldset>
        </div>
      )}
    </FormSection>
  );
}
