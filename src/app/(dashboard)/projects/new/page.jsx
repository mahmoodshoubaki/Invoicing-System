import { notFound } from 'next/navigation';

// Claims this URL so it does not fall through to /projects/[id]; the form is kept in ../_new.
export default function NewProjectDisabledPage() {
  notFound();
}
