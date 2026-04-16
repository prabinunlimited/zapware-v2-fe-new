// src/features/BeneficiarySenders/components/DeleteConfirmationModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

const DeleteConfirmationModal = ({
  show,
  onClose,
  onConfirm,
  message,
  isLoading,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-60 z-50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg"
          >
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
              {message &&
              message !== "Do you really want to delete this sender?"
                ? "Success"
                : "Confirm Deletion"}
            </h2>
            <p className="text-gray-600 text-center text-lg mb-6">
              {message ||
                "Do you really want to delete this sender? This action cannot be undone."}
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              {message ? (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-200 font-medium"
                  disabled={isLoading}
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-200 font-medium"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 font-medium flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <FaSpinner className="animate-spin mr-2" />
                    ) : null}
                    {isLoading ? "Deleting..." : "Yes, Delete"}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;
