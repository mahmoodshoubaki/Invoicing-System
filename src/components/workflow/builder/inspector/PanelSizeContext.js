'use client';

import { createContext } from 'react';

/**
 * The side panel's Expand control (2026-10-12) — `{ expanded, toggleExpand }`
 * from the builder's workspace, for the button in the panel's header. Null
 * outside the workspace, and then there is no button.
 */
export const PanelSizeContext = createContext(null);
