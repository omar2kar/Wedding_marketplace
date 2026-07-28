// frontend/src/animations/index.ts
// ============================================
// ONEDAY — Animation Components & Variants
// ============================================

// Components
export { default as PageTransition } from './PageTransition';
export { default as StaggerGrid } from './StaggerGrid';
export { default as AnimatedModal } from './AnimatedModal';
export { default as ScrollReveal } from './ScrollReveal';
export { default as AnimatedCounter } from './AnimatedCounter';

// Variants (للاستخدام المباشر مع motion)
export {
  // Transitions
  transitions,
  // Pages
  pageVariants,
  pageSlideVariants,
  // Stagger
  staggerContainer,
  staggerContainerSlow,
  staggerChild,
  staggerCardChild,
  // Scroll
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  // Modal
  overlayVariants,
  modalVariants,
  drawerVariants,
  // Hover
  cardHover,
  cardTap,
  // Toast
  toastVariants,
  // Hero
  heroTitle,
  heroSubtitle,
  heroCTA,
  // Counter
  counterSpring,
} from './motionVariants';
