import { Bell, Braces, Eye, FileText, Info, Mail } from 'lucide-react';

import { CHANNEL } from '@/constants/notifications';

export const TYPE_TABS = [
  { key: 'details', label: 'Details', icon: Info },
  { key: 'placeholders', label: 'Placeholders', icon: Braces, issues: 'placeholderIssues' },
  { key: 'body', label: 'Body', icon: FileText, issues: 'bodyIssues' },
  { key: 'preview', label: 'Preview & test', icon: Eye },
];

export const CHANNEL_TABS = [
  { key: CHANNEL.EMAIL, label: 'Email', icon: Mail },
  { key: CHANNEL.IN_APP, label: 'In-app', icon: Bell },
];

export const NO_STATUS = { dirty: false, placeholderIssues: 0, bodyIssues: 0 };
