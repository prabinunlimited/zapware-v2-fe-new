// CancelModal.jsx - FIXED VERSION
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaTimes, FaCheck, FaInfoCircle } from 'react-icons/fa';

const CancelModal = ({ onConfirm, onCancel, title = "Cancel Deposit?", description = "Are you sure you want to cancel this deposit? Any entered information will be lost." }) => {
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  // Focus trap for accessibility
  useEffect(() => {
    if (modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll('button');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      modalRef.current.addEventListener('keydown', handleTabKey);
      return () => modalRef.current?.removeEventListener('keydown', handleTabKey);
    }
  }, []);

  // Auto-focus on confirm button for better UX flow
  useEffect(() => {
    confirmButtonRef.current?.focus();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Backdrop click handler */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0" 
          onClick={onCancel}
          aria-label="Close modal"
        />

        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/20 max-w-sm w-full overflow-hidden border border-gray-200 dark:border-gray-800 z-[10000]"
        >
          {/* Header - FIXED: More space for icon */}
          <div className="relative pt-20 px-6 pb-6 text-center">
            {/* Icon container - Positioned with more space */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1 }}
                className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white dark:border-gray-900"
              >
                <FaExclamationTriangle className="text-white text-3xl" />
              </motion.div>
            </div>
            
            <h2 
              id="modal-title"
              className="text-xl font-bold text-gray-900 dark:text-white mt-4"
            >
              {title}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl p-4 mb-6 border border-amber-200 dark:border-amber-800">
              <FaInfoCircle className="mt-0.5 flex-shrink-0 text-lg" />
              <p id="modal-description" className="text-sm">
                {description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] border border-gray-300 dark:border-gray-700 hover:shadow-md"
                autoFocus={false}
              >
                <FaTimes className="text-sm" />
                Continue Editing
              </button>
              
              <button
                ref={confirmButtonRef}
                onClick={onConfirm}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg hover:shadow-xl shadow-red-500/30 hover:shadow-red-500/40"
              >
                <FaCheck className="text-sm" />
                Yes, Cancel
              </button>
            </div>

            {/* Additional Info */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono border border-gray-300 dark:border-gray-700">ESC</kbd> to close
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CancelModal;