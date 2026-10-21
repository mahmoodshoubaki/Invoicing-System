import { TARGET_TYPE, TRIGGER_KIND } from '@/constants/workflow';
import { createStage } from '@/models/workflow';

import { eachStep } from './graph';

/**
 * Building the editing state: a blank workflow, one adopted from GetDefinition,
 * default titles, and the baseline the dirty flag is measured against.
 */

/**
 * The default title for a stage somebody adds: "Stage 1", "Stage 2", …
 *
 * One more than the HIGHEST of two numbers, never simply the count: the number
 * of stages, and the largest "Stage N" already on the canvas. Counting alone
 * would repeat a title — delete "Stage 1" out of "Stage 1, Stage 2" and the
 * count says the next is "Stage 2" again. Stages renamed to anything else still
 * count toward the number, so a new stage is numbered by position, not by how
 * many happen to keep their default name.
 *
 * @param {Array<{title?: string}>} stages
 */
export function nextStageTitle(stages = []) {
  let highest = stages.length;
  for (const stage of stages) {
    const match = /^stage\s+(\d+)$/i.exec(String(stage?.title ?? '').trim());
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `Stage ${highest + 1}`;
}

/** A title that is still the builder's own default: "Step 4". */
export const DEFAULT_STEP_TITLE = /^step\s+(\d+)$/i;

/**
 * Where step numbering stands in a workflow: how many steps there are, at any
 * depth, and the largest "Step N" among them.
 */
export function stepNumbering(graph) {
  let count = 0;
  let highest = 0;
  eachStep(graph, (step) => {
    count += 1;
    const match = DEFAULT_STEP_TITLE.exec(String(step?.title ?? '').trim());
    if (match) highest = Math.max(highest, Number(match[1]));
  });
  return { count, highest };
}

/**
 * The default title for a step somebody adds: "Step 1", "Step 2", …
 *
 * Numbered across the WHOLE workflow, not per stage, by the same rule as
 * stages: one more than the higher of the step count and the largest "Step N".
 * Two steps sharing a name were not only confusing — every problem either one
 * had was reported in identical words, and the lists showing those problems
 * cannot hold two identical rows.
 */
export function nextStepTitle(graph) {
  const { count, highest } = stepNumbering(graph);
  return `Step ${Math.max(count, highest) + 1}`;
}

/**
 * A blank workflow.
 *
 * Seeded with one stage because `startStageId` has to point at something for
 * the definition to be valid, and an empty canvas gives a new author nothing to
 * act on. It is "Stage 1" — the same numbering every added stage gets, so a new
 * workflow does not read "Draft, Stage 2, Stage 3".
 */
export function emptyDefinition() {
  const first = createStage({ id: 'stage-1', title: nextStageTitle([]), transitions: [] });

  return withBaseline({
    id: null,
    code: null,
    version: null,
    isActive: false,
    // Nothing saved yet: no draft, so a first save sends no stamp.
    isDraft: false,
    stamp: null,
    name: '',
    description: '',
    targetTypeKey: TARGET_TYPE.NONE,
    trigger: { kind: TRIGGER_KIND.MANUAL, inputs: [] },
    variables: [],
    graph: { startStageId: first.id, stages: [first] },
  });
}

/** Adopts a definition loaded from `GetDefinition` as the editing state. */
export function fromDefinition(definition) {
  if (!definition) return emptyDefinition();

  return withBaseline({
    id: definition.id ?? null,
    code: definition.code ?? null,
    version: definition.version ?? null,
    isActive: definition.isActive === true,
    // The draft (version null) or a numbered version. Only a draft's stamp is
    // what a save sends back — see useBuilderSave for the other cases.
    isDraft: definition.isDraft === true,
    stamp: definition.stamp ?? null,
    name: definition.name ?? '',
    description: definition.description ?? '',
    targetTypeKey: definition.targetTypeKey ?? TARGET_TYPE.NONE,
    trigger: definition.trigger ?? { kind: TRIGGER_KIND.MANUAL, inputs: [] },
    variables: definition.variables ?? [],
    graph: definition.graph ?? { startStageId: null, stages: [] },
  });
}

/**
 * What gets compared for the dirty flag and posted on save — the editable
 * content, without the identity fields the server owns or the baseline itself.
 */
export function editableSnapshot(state) {
  return JSON.stringify({
    name: state.name,
    description: state.description,
    targetTypeKey: state.targetTypeKey,
    trigger: state.trigger,
    variables: state.variables,
    graph: state.graph,
  });
}

/**
 * Stamps a state with its own snapshot as the clean baseline.
 *
 * The baseline lives INSIDE the reducer state rather than in a sibling
 * `useState`. Keeping them separate meant every load had to set two things at
 * once, which in an effect is a synchronous double-setState — cascading
 * renders, and the kind of thing that drifts the moment one path forgets the
 * second call. Here a state and the baseline it is measured against can never
 * disagree, because one action produces both.
 */
export function withBaseline(state) {
  return { ...state, baseline: editableSnapshot(state), removedAssignees: [] };
}

/** True when the author has changed something since the last load or save. */
export function isDirty(state) {
  return editableSnapshot(state) !== state.baseline;
}
