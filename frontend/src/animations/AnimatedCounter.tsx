// frontend/src/animations/AnimatedCounter.tsx
// ============================================
// ONEDAY — Animated Counter
// أرقام تعد من 0 لقيمتها بحركة سلسة
// ============================================
//
// الاستخدام:
// <AnimatedCounter value={1250} />
// <AnimatedCounter value={4.8} decimals={1} prefix="⭐ " />
// <AnimatedCounter value={25000} suffix=" SAR" />

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  /** عدد الأرقام بعد الفاصلة */
  decimals?: number;
  /** نص قبل الرقم */
  prefix?: string;
  /** نص بعد الرقم */
  suffix?: string;
  /** مدة الأنيميشن (ثوانٍ) */
  duration?: number;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1.5,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState('0');

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 15,
    duration: duration,
  });

  const rounded = useTransform(spring, (latest) =>
    latest.toFixed(decimals)
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [rounded]);

  // Format with commas for large numbers
  const formattedValue = decimals === 0
    ? Number(displayValue).toLocaleString()
    : displayValue;

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
    >
      {prefix}{formattedValue}{suffix}
    </motion.span>
  );
};

export default AnimatedCounter;
