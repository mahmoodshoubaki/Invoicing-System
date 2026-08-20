'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

/**
 * Counts a number up once, the first time it scrolls into view.
 *
 * `format` receives the in-flight value so the tween can drive a currency or
 * percentage string, not just a bare integer. Honours prefers-reduced-motion
 * by rendering the final value immediately rather than animating to it.
 */
export default function AnimatedCounter({
  value,
  format = (v) => Math.round(v).toLocaleString(),
  duration = 1.2,
  className = '',
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) {
      setDisplay(value);
      return undefined;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // --ease-out-expo, matching the app's motion tokens
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
