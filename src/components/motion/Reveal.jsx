'use client';

import { motion } from 'motion/react';

/** Shared easing — mirrors --ease-out-expo from globals.css. */
const EASE = [0.16, 1, 0.3, 1];

/**
 * Stagger container. Children using `revealItem` below animate in sequence
 * rather than all at once. Motion skips the whole thing automatically when
 * the user prefers reduced motion (MotionConfig in the page sets that up).
 */
export const revealContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

/** A single staggered child — rises and settles. */
export const revealItem = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: EASE },
  },
};

/**
 * Convenience wrapper: staggers its children in.
 *
 * Uses `animate` rather than `whileInView`, deliberately. With a one-shot
 * `whileInView` the container stops listening once it has played — so any
 * child that mounts LATER (a section gated behind a fetch, say) inherits the
 * container's `initial="hidden"` and never receives the "show" signal. It
 * renders at opacity 0: invisible, but still taking up layout, leaving a
 * blank gap where the content should be.
 *
 * Keeping the container permanently in "show" means late-mounting children
 * animate in as soon as they appear, which is what you want on a form whose
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
