import type { Variants, Easing, Transition } from "framer-motion";

// cubic-bezier for an ease-out curve
export const easeOut: Easing = [0.16, 1, 0.3, 1];

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.0, // reduce initial delay to avoid late appears
    },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: easeOut,
    },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: easeOut,
    },
  },
};

// Use this for mapped lists so each child animates reliably, even if mounted later.
export function itemTransition(index = 0): Transition {
  return {
    duration: 0.32,
    ease: easeOut,
    delay: Math.min(0.6, index * 0.06),
  };
}