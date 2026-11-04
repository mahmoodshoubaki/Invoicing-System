'use client';

import { AlertTriangle, Info } from 'lucide-react';

import { STATUS } from '@/theme/vizPalette';
import { problemTarget } from '@/lib/workflowProblems';
import ProblemList from './ProblemList';

/**
 * @param {{ errors: string[], warnings: string[], serverProblems: Array|null, canvas: ReturnType<import('./useCanvasActions').useCanvasActions>, }} props
 */
export default function BuilderProblems({ errors, warnings, serverProblems, canvas }) {
  const go = (problem) => {
    const target = problemTarget(problem);
    if (target.kind === 'workflow') canvas.showWorkflow(target.tab, { focus: true });
    else canvas.inspect(target.kind, target.id, null, { focus: true });
  };

  const blocking = serverProblems
    ? serverProblems.map((p) => ({ message: p.message, onClick: () => go(p), where: p.area }))
    : errors;

  return (
    <>
      <ProblemList
        tone={STATUS.critical}
        icon={AlertTriangle}
        title="Fix these before publishing"
        note={serverProblems ? 'Found when the draft was saved. Click one to open it.' : 'Saving still works — these only stop a publish.'}
        items={blocking}
      />
      <ProblemList tone={STATUS.warning} icon={Info} title="Worth checking" items={warnings} />
    </>
  );
}
