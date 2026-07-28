// frontend/src/animations/ScrollReveal.tsx
// ============================================
// ONEDAY — Scroll Reveal Component
// العناصر تظهر بسلاسة عند الوصول لها بالـ scroll
// ============================================
//
// الاستخدام:
// <ScrollReveal>
//   <h2>عنوان القسم</h2>
// </ScrollReveal>
//
// <ScrollReveal direction="left" delay={0.2}>
//   <ServiceCard />
// </ScrollReveal>
//
// <ScrollReveal direction="scale">
//   <img src="..." />
// </ScrollReveal>

import React from 'react';
import { motion } from 'motion/react';
import { fadeInUp, fadeInLeft, fadeInRight, scaleIn } from './motionVariants';

interface ScrollRevealProps {
  children: React.ReactNode;
  /** اتجاه الظهور */
  direction?: 'up' | 'left' | 'right' | 'scale';
  /** تأخير إضافي (ثوانٍ) */
  delay?: number;
  /** يظهر مرة واحدة فقط (افتراضي: true) */
  once?: boolean;
  className?: string;
  /** مسافة قبل ما يبدأ التأثير */
  margin?: string;
}

const variantMap = {
  up: fadeInUp,
  left: fadeInLeft,
  right: fadeInRight,
  scale: scaleIn,
};

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  once = true,
  className = '',
  margin = '-80px',
}) => {
  const variants = variantMap[direction];

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once, margin }}
      transition={{ delay }}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
