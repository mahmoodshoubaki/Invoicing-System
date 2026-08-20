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
 * Convenience wrapper: a section that staggers its children in when it
 * enters the viewport.
 */
export default function Reveal({ children, className = '', as = 'div', once = true }) {
  const Component = motion[as] ?? motion.div;
  return (
    <Component
      className={className}
      variants={revealContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-60px' }}
    >
      {children}
    </Component>
  );
}
