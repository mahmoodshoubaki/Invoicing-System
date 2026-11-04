'use client';

import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import { ROUTES } from '@/constants/routes';
import { withBasePath } from '@/constants/appConfig';
import { useHangfireFrame } from './useHangfireFrame';

const FRAME_SIZE = { height: 'calc(100vh - 16rem)', minHeight: '30rem' };

export default function HangfireFrame() {
  const { frameRef, frameKey, status, error, onLoad, retry } = useHangfireFrame();

  if (status === 'error') return <ErrorNote error={error} onRetry={retry} />;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#eceae4] bg-white" style={FRAME_SIZE}>
      {status === 'loading' && (
        <div className="absolute inset-0 p-4">
          <Skeleton rows={8} height={40} />
        </div>
      )}
      <iframe
        key={frameKey}
        ref={frameRef}
        src={withBasePath(ROUTES.HANGFIRE)}
        title="Hangfire dashboard"
        onLoad={onLoad}
        className="block size-full border-0"
        style={{ visibility: status === 'ready' ? 'visible' : 'hidden' }}
      />
    </div>
  );
}
