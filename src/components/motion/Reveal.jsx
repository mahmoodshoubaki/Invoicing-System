'use client';

import { motion } from 'motion/react';

/**
 * The container. No stagger and no delay (2026-10-08): sections used to wait
 * their turn — 70 ms each, on top of a 50 ms start — so the last one on a form
 * appeared well after the data was ready. Everything now fades in together.
 */
export const revealContainer = {
  hidden: {},
  show: {},
};

/**
 * A single child — currently no animation at all (2026-10-08).
 *
 * It used to rise 18px out of a 6px blur over 550 ms, then a 150 ms fade. Both
 * are off while animations are reintroduced one at a time; cards and sections
 * render in place on the first frame. Keep the variant names — every card and
 * form section points at them, so a fade can come back here in one line.
 */
export const revealItem = {
  hidden: {},
  show: {},
};

/**
 * Wraps sections that fade in as they appear. Motion skips it entirely when the
 * user prefers reduced motion (MotionConfig in the page sets that up).
 *
 * Uses `animate` rather than `whileInView`, deliberately. With a one-shot
 * `whileInView` the container stops listening once it has played — so any
 * child that mounts LATER (a section gated behind a fetch, say) inherits the
 * container's `initial="hidden"` and never receives the "show" signal. It
 * renders at opacity 0: invisible, but still taking up layout, leaving a
 * blank gap where the content should be.
 *
 * Keeping the container permanently in "show" means late-mounting children
 * fade in as soon as they appear, which is what you want on a form whose
 * sections unlock progressively.
 */
export default function Reveal({ children, className = '', as = 'div' }) {
  const Component = motion[as] ?? motion.div;
  return (
    <Component
      className={className}
      variants={revealContainer}
      initial="hidden"
      animate="show"
    >
      {children}
    </Component>
  );
}
