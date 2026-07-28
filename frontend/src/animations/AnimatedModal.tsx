// frontend/src/animations/AnimatedModal.tsx
// ============================================
// ONEDAY — Animated Modal / Drawer
// بديل أنيق للـ modals الحالية
// ============================================
//
// الاستخدام (Modal عادي):
// <AnimatedModal isOpen={showBooking} onClose={() => setShowBooking(false)}>
//   <BookingForm />
// </AnimatedModal>
//
// الاستخدام (Drawer من الأسفل — مناسب للموبايل):
// <AnimatedModal isOpen={show} onClose={onClose} type="drawer">
//   <MobileMenu />
// </AnimatedModal>

import React, { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { overlayVariants, modalVariants, drawerVariants } from './motionVariants';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** modal = وسط الشاشة، drawer = من الأسفل */
  type?: 'modal' | 'drawer';
  /** عرض الـ modal (افتراضي: max-w-lg) */
  maxWidth?: string;
  /** تمنع الإغلاق بالضغط على الخلفية */
  persistent?: boolean;
  className?: string;
}

const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  type = 'modal',
  maxWidth = 'max-w-lg',
  persistent = false,
  className = '',
}) => {
  // إغلاق بـ Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose();
    },
    [onClose, persistent]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = () => {
    if (!persistent) onClose();
  };

  const contentVariants = type === 'drawer' ? drawerVariants : modalVariants;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            ...(type === 'drawer' && {
              alignItems: 'flex-end',
            }),
          }}
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Overlay خلفية */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
            onClick={handleOverlayClick}
          />

          {/* المحتوى */}
          <motion.div
            className={`
              relative z-10 w-full ${maxWidth}
              ${type === 'drawer' ? 'rounded-t-2xl' : 'rounded-2xl mx-4'}
              ${className}
            `}
            style={{
              background: 'var(--glass-bg, rgba(255, 255, 255, 0.95))',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.2))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              maxHeight: type === 'drawer' ? '90vh' : '85vh',
              overflowY: 'auto',
            }}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModal;
