// frontend/src/animations/StaggerGrid.tsx
// ============================================
// ONEDAY — Staggered Grid Component
// البطاقات تظهر واحدة ورى واحدة بحركة سلسة
// ============================================
//
// الاستخدام:
// <StaggerGrid>
//   {vendors.map(v => <VendorCard key={v.id} vendor={v} />)}
// </StaggerGrid>
//
// مع layout animation (للفلترة):
// <StaggerGrid layout>
//   {filteredVendors.map(v => <VendorCard key={v.id} vendor={v} />)}
// </StaggerGrid>

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  staggerContainer,
  staggerContainerSlow,
  staggerCardChild,
  cardHover,
  cardTap,
} from './motionVariants';

interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
  /** بطيء = بطاقات كبيرة، سريع = عناصر صغيرة */
  speed?: 'fast' | 'slow';
  /** فعّل layout animation (لما تتغير العناصر بالفلترة) */
  layout?: boolean;
  /** إضافة hover effect على كل عنصر */
  hoverable?: boolean;
}

const StaggerGrid: React.FC<StaggerGridProps> = ({
  children,
  className = '',
  speed = 'fast',
  layout = false,
  hoverable = true,
}) => {
  const containerVariant = speed === 'slow' ? staggerContainerSlow : staggerContainer;
  const childElements = React.Children.toArray(children);

  return (
    <motion.div
      className={className}
      variants={containerVariant}
      initial="initial"
      animate="animate"
      viewport={{ once: true, margin: '-50px' }}
    >
      <AnimatePresence mode="popLayout">
        {childElements.map((child, index) => (
          <motion.div
            key={(child as React.ReactElement).key || index}
            variants={staggerCardChild}
            layout={layout}
            whileHover={hoverable ? cardHover : undefined}
            whileTap={hoverable ? cardTap : undefined}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{ willChange: 'transform, opacity' }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default StaggerGrid;
