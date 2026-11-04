import Link from 'next/link';
import { Eye } from 'lucide-react';

import Button from '@/components/common/Button';

/** The row's "View" button; the row click does the same. */
export default function ViewLink({ href, label = 'View' }) {
  return (
    <Link href={href} onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="xs" icon={Eye}>{label}</Button>
    </Link>
  );
}
