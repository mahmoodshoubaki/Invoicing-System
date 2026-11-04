'use client';

import { motion } from 'motion/react';

export const revealContainer = {
  hidden: {},
  show: {},
};

export const revealItem = {
  hidden: {},
  show: {},
};

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
