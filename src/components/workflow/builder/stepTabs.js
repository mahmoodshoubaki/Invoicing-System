import { STEP_TYPE } from '@/constants/workflow';

const ONE = [{ key: 'properties', label: 'Properties' }];

const STEP_TABS = {
  [STEP_TYPE.HUMAN_TASK]: [
    { key: 'task', label: 'Task' },
    { key: 'fields', label: 'Fields' },
    { key: 'notifications', label: 'Notifications' },
  ],
  [STEP_TYPE.SEND_NOTIFICATION]: [
    { key: 'message', label: 'Message' },
    { key: 'recipients', label: 'Recipients' },
  ],
};

export const stepTabs = (type) => STEP_TABS[type] ?? ONE;

export const activeStepTab = (type, asked) => {
  const tabs = stepTabs(type);
  return (tabs.find((t) => t.key === asked) ?? tabs[0]).key;
};
