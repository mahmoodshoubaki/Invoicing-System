import { definitionHandlers } from './reducer/definitionHandlers';
import { stageHandlers } from './reducer/stageHandlers';
import { stepHandlers } from './reducer/stepHandlers';
import { transitionHandlers } from './reducer/transitionHandlers';

/**
 * The builder's editing state — a plain reducer over the definition being
 * edited, deliberately outside Redux.
 *
 * This is ephemeral, single-screen, high-frequency state (every keystroke in a
 * stage title lands here). Nothing else in the app reads it, and putting it in
 * the store would make every unrelated selector re-run on each character. It
 * lives and dies with the builder page.
 *
 * The shape mirrors SaveDefinition's body exactly, so saving is a payload
 * builder away and loading is an assignment — no translation layer to drift.
 *
 * Each action's handler lives with its area under ./reducer/.
 */

const HANDLERS = {
  ...definitionHandlers,
  ...stageHandlers,
  ...transitionHandlers,
  ...stepHandlers,
};

export function builderReducer(state, action) {
  // Own keys only: an action type that happened to name an Object method must not run it.
  return Object.hasOwn(HANDLERS, action.type) ? HANDLERS[action.type](state, action) : state;
}
