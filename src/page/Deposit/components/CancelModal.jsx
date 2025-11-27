// CancelModal.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaExclamationTriangle, FaTimes, FaCheck } from "react-icons/fa";

// CancelModal.jsx - DEBUG VERSION
const CancelModal = ({ onConfirm, onCancel }) => {
  

  const handleContinue = () => {
    ");
    onCancel(); // This should call ui.continueEditing()
  };

  const handleCancel = () => {
    ");
    onConfirm(); // This should call ui.confirmCancel()
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <FaExclamationTriangle className="text-white text-2xl" />
          </motion.div>
          <h2 className="text-xl font-bold text-white">Cancel Deposit?</h2>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-6">
            Are you sure you want to cancel this deposit? Any entered
            information will be lost.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleContinue}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center"
            >
              <FaTimes className="mr-2" />
              Continue Editing
            </button>

            <button
              onClick={handleCancel}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center"
            >
              <FaCheck className="mr-2" />
              Yes, Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CancelModal;
