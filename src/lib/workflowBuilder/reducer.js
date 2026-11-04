import { definitionHandlers } from './reducer/definitionHandlers';
import { stageHandlers } from './reducer/stageHandlers';
import { stepHandlers } from './reducer/stepHandlers';
import { transitionHandlers } from './reducer/transitionHandlers';

const HANDLERS = {
  ...definitionHandlers,
  ...stageHandlers,
  ...transitionHandlers,
  ...stepHandlers,
};

export function builderReducer(state, action) {
  return Object.hasOwn(HANDLERS, action.type) ? HANDLERS[action.type](state, action) : state;
}
