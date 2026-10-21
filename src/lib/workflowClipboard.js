/**
 * Copy and paste for the builder — stages, steps, and whatever they hold.
 *
 * Within one workflow only. Everything here is pure: it reads a definition and
 * returns new pieces for the reducer to insert, so one paste is one undo step
 * and every rule below is testable without a screen.
 *
 * The hard part is not the copying, it is the ids. Stage and step ids must be
 * unique across the whole definition, and things point at them — transitions,
 * deadlines, escalations, conditions reading `approve.outcome`, a loop walking a
 * query's results. A paste therefore:
 *
 *   1. gives every pasted stage and step a new id, at any depth;
 *   2. points links BETWEEN pasted things at the new copies — copy stages A and
 *      B where A goes to B, and the pasted A goes to the pasted B;
 *   3. leaves links to things that were NOT copied alone, as long as they still
 *      exist. One that no longer exists is cleared exactly the way deleting that
 *      stage would have cleared it.
 *
 * Kept at this address for the files that import it; each part lives under ./workflowClipboard/:
 *   kinds.js       what the clipboard holds (copy / cut, stages / steps)
 *   tree.js        finding a step in the tree
 *   selection.js   what is ticked, where a paste lands, how to say it
 *   branchRule.js  what may not go inside a parallel branch
 *   move.js        a cut, pasted
 *   paste.js       a copy, pasted
 */

export { CLIP_KIND, CLIP_MODE } from '@/lib/workflowClipboard/kinds';
export { locateStep, stageOfStep } from '@/lib/workflowClipboard/tree';
export {
  orderedSelection,
  NO_SELECTION,
  nextSelection,
  pasteTargetFor,
  copyItems,
  describeClip,
  joinNames,
} from '@/lib/workflowClipboard/selection';
export { refusedInBranch } from '@/lib/workflowClipboard/branchRule';
export { moveStages, moveSteps } from '@/lib/workflowClipboard/move';
export { prepareStagePaste, prepareStepPaste } from '@/lib/workflowClipboard/paste';
