/**
 * The tabs of a step's side panel. Most steps have one; a human task keeps what
 * its holder fills in, and who hears about it, apart from the task itself, and a
 * Send notification keeps what it says apart from who gets it.
 *
 * The card's menu offers one entry per tab: "Properties…" opens the first,
 * the rest are named after theirs ("Notifications…", "Recipients…").
 */

import { STEP_TYPE } from '@/constants/workflow';

const ONE = [{ key: 'properties', label: 'Properties' }];

const STEP_TABS = {
  [STEP_TYPE.HUMAN_TASK]: [
    { key: 'task', label: 'Task' },
    // What its holder fills in on the record (2026-10-11).
    { key: 'fields', label: 'Fields' },
    { key: 'notifications', label: 'Notifications' },
  ],
  [STEP_TYPE.SEND_NOTIFICATION]: [
    { key: 'message', label: 'Message' },
    { key: 'recipients', label: 'Recipients' },
  ],
};

export const stepTabs = (type) => STEP_TABS[type] ?? ONE;

/** The tab to show: the one asked for if the step has it, else its first. */
export const activeStepTab = (type, asked) => {
  const tabs = stepTabs(type);
  return (tabs.find((t) => t.key === asked) ?? tabs[0]).key;
};
