import Link from 'next/link';
import { Eye } from 'lucide-react';

import Button from '@/components/common/Button';

export default function ViewLink({ href, label = 'View' }) {
  return (
    <Link href={href} onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="xs" icon={Eye}>{label}</Button>
    </Link>
  );
}
