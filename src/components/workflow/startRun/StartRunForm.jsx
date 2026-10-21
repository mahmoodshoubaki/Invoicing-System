'use client';

import { useSelector } from 'react-redux';

import ProjectPicker from '@/components/workflow/ProjectPicker';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { TARGET_TYPE, TARGET_TYPE_LABELS, TRIGGER_KIND } from '@/constants/workflow';
import { selectEvents } from '@/store/slices/workflowSlice';
import InputField from './InputField';
import { controlClass } from './startRunShared';

/** An event's name as words: `InvoiceSubmitted` → "Invoice submitted". */
function eventNameLabel(name) {
  if (!name) return 'its event';
  const words = String(name).replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Before the run exists: the records it will be about, and the answers its
 * trigger asks for.
 *
 * @param {{
 *   start: ReturnType<import('./useStartRun').useStartRun>,
 *   presetTargetLabel: string|null,
 * }} props
 */
export default function StartRunForm({ start, presetTargetLabel }) {
  const { definition, declaredInputs, needsTarget, isEvent, preset, presetMismatch, picksProjects, targetIds, problems } = start;
  const events = useSelector(selectEvents);
  // The event catalog's own name when the builder has loaded it; else the key, as words.
  const eventLabel = events.find((e) => e.name === definition.trigger?.eventName)?.displayName
    ?? eventNameLabel(definition.trigger?.eventName);

  return (
    <div className="flex flex-col gap-3">
      {presetMismatch && (
        <p className="text-xs" style={{ color: STATUS.critical }}>
          This workflow tracks {TARGET_TYPE_LABELS[definition.targetTypeKey] ?? 'something else'} records,
          so it cannot run on {presetTargetLabel ?? 'this record'}.
        </p>
      )}

      {/* Already chosen: the record this was opened from. Shown so it is
          clear what the run will be about, not offered for editing. */}
      {needsTarget && preset && !presetMismatch && (
        <p
          className="rounded-md border border-[#f1f0ee] bg-[#fbfaf9] px-2.5 py-2 text-xs"
          style={{ color: CHROME.textSecondary }}
        >
          Runs on <strong style={{ color: CHROME.textPrimary }}>{presetTargetLabel ?? targetIds.join(', ')}</strong>.
        </p>
      )}

      {needsTarget && !preset && (
        <div>
          <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
            {definition.targetTypeKey === TARGET_TYPE.PROJECT
              ? 'Projects'
              : `${TARGET_TYPE_LABELS[definition.targetTypeKey] ?? 'Record'} ${isEvent ? 'id' : 'ids'}`}
            <span className="ml-1 font-normal" style={{ color: CHROME.textMuted }}>{isEvent ? '— one' : '— at least one'}</span>
          </p>
          {picksProjects ? (
            <ProjectPicker
              selectedCodes={start.pickedCodes}
              onChange={start.setPickedCodes}
              onUnavailable={start.markProjectListUnavailable}
            />
          ) : (
            <textarea
              value={start.targetText}
              onChange={(e) => start.setTargetText(e.target.value)}
              rows={2}
              placeholder={
                definition.targetTypeKey === TARGET_TYPE.PROJECT
                  ? 'project codes, one per line — a misspelled code still starts a run'
                  : 'one id per line, or separated by commas'
              }
              aria-label="Record ids"
              className={`${controlClass} resize-y font-mono`}
            />
          )}
          {/*
            Said plainly because it is the part people get wrong: several ids
            are ONE run, not one run each. Cancelling it later cancels the lot,
            and deleting any one of these records cancels it for all of them.
          */}
          {isEvent ? (
            <p className="mt-1 text-[11px]" style={{ color: targetIds.length > 1 ? STATUS.critical : CHROME.textMuted }}>
              {targetIds.length > 1
                ? 'One record only — this workflow runs on one record at a time, as its event would.'
                : 'One record — the run starts on it as its event would.'}
            </p>
          ) : (
            <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
              {targetIds.length > 1
                ? `One run covering all ${targetIds.length} of them — not ${targetIds.length} separate runs.`
                : 'This workflow tracks records, so it needs at least one. Several make a single run over the set.'}
            </p>
          )}
        </div>
      )}

      {declaredInputs.length > 0 ? (
        declaredInputs.map((variable) => (
          <InputField
            key={variable.name}
            variable={variable}
            value={start.answers[variable.name] ?? ''}
            onChange={(value) => start.setAnswer(variable.name, value)}
            problem={problems[variable.name]}
          />
        ))
      ) : (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          {definition.trigger?.kind === TRIGGER_KIND.MANUAL
            ? 'This workflow asks for nothing to start.'
            : isEvent
              ? `This workflow starts on “${eventLabel}”. Started here, it makes a new run as if that had just happened on this record — it asks for nothing. A record it is already running on is refused until that run finishes or is stopped.`
              : `This workflow normally starts on its own (${definition.trigger?.kind ?? 'a trigger'}).`}
        </p>
      )}

      {declaredInputs.length > 0 && (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          A box left alone uses what the workflow declares as its starting value.
        </p>
      )}
    </div>
  );
}
