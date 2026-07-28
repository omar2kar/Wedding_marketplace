// frontend/src/animations/motionVariants.ts
// ============================================
// ONEDAY — Centralized Motion Variants
// كل أنماط الأنيميشن في مكان واحد
// ============================================

import type { Variants, Transition } from 'motion/react';

// ─── الـ Transitions الأساسية ───────────────────────
// luxury = بطيء وناعم (للـ hero والعناصر الكبيرة)
// snappy = سريع ومحسوس (للأزرار والعناصر الصغيرة)
// spring = حركة طبيعية مرنة (للبطاقات والقوائم)

export const transitions = {
  luxury: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } as Transition,
  snappy: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } as Transition,
  spring: { type: 'spring', stiffness: 300, damping: 24 } as Transition,
  gentle: { type: 'spring', stiffness: 120, damping: 20 } as Transition,
};

// ─── Page Transitions ───────────────────────────────
// تُستخدم مع AnimatePresence في App.tsx

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.luxury,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
};

// نسخة بـ slide من اليمين (للصفحات الداخلية)
export const pageSlideVariants: Variants = {
  initial: {
    opacity: 0,
    x: 60,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: transitions.luxury,
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
};

// ─── Stagger Container + Children ────────────────────
// الأب يتحكم بتأخير ظهور الأبناء واحد بعد واحد

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// تأخير أبطأ (للبطاقات الكبيرة)
export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

// العنصر الابن — fade up
export const staggerChild: Variants = {
  initial: {
    opacity: 0,
    y: 24,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.spring,
  },
};

// العنصر الابن — fade + scale (للبطاقات)
export const staggerCardChild: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.gentle,
  },
};

// ─── Scroll Reveal ──────────────────────────────────
// تُستخدم مع whileInView

export const fadeInUp: Variants = {
  offscreen: {
    opacity: 0,
    y: 40,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: transitions.luxury,
  },
};

export const fadeInLeft: Variants = {
  offscreen: {
    opacity: 0,
    x: -40,
  },
  onscreen: {
    opacity: 1,
    x: 0,
    transition: transitions.luxury,
  },
};

export const fadeInRight: Variants = {
  offscreen: {
    opacity: 0,
    x: 40,
  },
  onscreen: {
    opacity: 1,
    x: 0,
    transition: transitions.luxury,
  },
};

export const scaleIn: Variants = {
  offscreen: {
    opacity: 0,
    scale: 0.9,
  },
  onscreen: {
    opacity: 1,
    scale: 1,
    transition: transitions.luxury,
  },
};

// ─── Modal / Overlay ────────────────────────────────

export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.92,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

// Drawer (من الأسفل — مثل mobile booking)
export const drawerVariants: Variants = {
  initial: {
    y: '100%',
  },
  animate: {
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    y: '100%',
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
};

// ─── Card Hover (للاستخدام مع whileHover) ────────────

export const cardHover = {
  y: -6,
  transition: transitions.snappy,
};

export const cardTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

// ─── Notification / Toast ───────────────────────────

export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: -20,
    x: 20,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    x: 40,
    transition: { duration: 0.2 },
  },
};

// ─── Hero Section Variants ──────────────────────────

export const heroTitle: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
  },
};

export const heroSubtitle: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 },
  },
};

export const heroCTA: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.6 },
  },
};

// ─── Counter Animation Helper ───────────────────────
// ليست variant — helper function للأرقام المتحركة

export const counterSpring = {
  type: 'spring' as const,
  stiffness: 50,
  damping: 15,
};
