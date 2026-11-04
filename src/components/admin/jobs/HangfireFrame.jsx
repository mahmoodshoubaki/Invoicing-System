'use client';

import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import { ROUTES } from '@/constants/routes';
import { useHangfireFrame } from './useHangfireFrame';

/** Fills the window below the page header; the app shell's header, padding and footer take about 16rem. */
const FRAME_SIZE = { height: 'calc(100vh - 16rem)', minHeight: '30rem' };

/** The API's Hangfire dashboard in a frame, served from this origin through the proxy. */
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
        src={ROUTES.HANGFIRE}
        title="Hangfire dashboard"
        onLoad={onLoad}
        className="block size-full border-0"
        style={{ visibility: status === 'ready' ? 'visible' : 'hidden' }}
      />
    </div>
  );
}
