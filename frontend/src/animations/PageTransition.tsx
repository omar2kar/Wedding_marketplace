// frontend/src/animations/PageTransition.tsx
// ============================================
// ONEDAY — Page Transition Wrapper
// يلف كل صفحة ويعطيها أنيميشن دخول/خروج
// ============================================

import React from 'react';
import { motion } from 'motion/react';
import { pageVariants, pageSlideVariants } from './motionVariants';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  /** استخدم 'slide' للصفحات الداخلية مثل ServiceProfile */
  variant?: 'fade' | 'slide';
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  variant = 'fade',
}) => {
  const variants = variant === 'slide' ? pageSlideVariants : pageVariants;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
