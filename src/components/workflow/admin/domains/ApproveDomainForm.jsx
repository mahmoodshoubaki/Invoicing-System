'use client';

import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus } from 'lucide-react';

import Button from '@/components/common/Button';
import { controlClass } from '@/components/ui/kit';
import { STATUS } from '@/theme/vizPalette';
import { useToast } from '@/hooks/useToast';
import { approveApiDomain } from '@/store/slices/workflowSlice';
import { hostProblem } from './hostProblem';

/**
 * Approving a host a workflow's API calls may reach — Workflows.ManageApiDomains.
 * Re-approving a withdrawn host re-enables the same row rather than adding a
 * second one, so "approved" is the honest word either way.
 */
export default function ApproveDomainForm() {
  const dispatch = useDispatch();
  const toast = useToast();
  const [host, setHost] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const problem = touched ? hostProblem(host) : null;

  const approve = useCallback(async () => {
    setTouched(true);
    if (hostProblem(host)) return;

    setBusy(true);
    const result = await dispatch(approveApiDomain({ host: host.trim(), description: description.trim() }));
    setBusy(false);

    if (approveApiDomain.rejected.match(result)) {
      toast.error('Could not approve this host', result.payload);
      return;
    }
    setHost('');
    setDescription('');
    setTouched(false);
    toast.success('Host approved', `Workflows may now call ${host.trim()}.`);
  }, [description, dispatch, host, toast]);

  return (
    <div className="mb-3 flex flex-wrap items-start gap-1.5 rounded-xl border border-gray-100 bg-white p-2.5">
      <div className="min-w-44 flex-1">
        <input
          value={host}
          onChange={(e) => setHost(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="api.example.com"
          aria-label="Host"
          className={`${controlClass} w-full font-mono`}
          style={problem ? { borderColor: STATUS.critical } : undefined}
        />
        {problem && <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{problem}</p>}
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What is it for?"
        aria-label="Description"
        className={`${controlClass} min-w-40 flex-[2]`}
      />
      <Button size="sm" icon={Plus} onClick={approve} loading={busy}>Approve</Button>
    </div>
  );
}
