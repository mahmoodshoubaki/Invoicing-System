import Link from 'next/link';

import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';

/** A table cell: the project code (opening the project) over its name. */
export default function ProjectCell({ code, name }) {
  if (!code) return <span className="text-xs" style={{ color: CHROME.textMuted }}>No project</span>;
  return (
    <div className="min-w-0">
      <Link
        href={ROUTES.PROJECT_DETAIL(encodeURIComponent(code))}
        onClick={(e) => e.stopPropagation()}
        className="font-mono text-xs underline-offset-2 hover:underline"
      >
        {code}
      </Link>
      {name && <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>{name}</p>}
    </div>
  );
}
