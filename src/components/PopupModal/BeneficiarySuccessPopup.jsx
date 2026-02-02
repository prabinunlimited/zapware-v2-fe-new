import React from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaCopy, FaCheckCircle } from "react-icons/fa";

const BeneficiarySuccessPopup = ({
  benefCode,
  onClose,
  onCopy,
  onContinue,
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(benefCode);
      toast.success("Beneficiary code copied to clipboard!");
      if (onCopy) onCopy();
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-11/12 p-8 rounded-2xl shadow-2xl bg-white text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <FaCheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Registration Successful!
        </h2>
        <p className="text-gray-600 mb-6">
          Your beneficiary has been created successfully
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5 mb-6"
        >
          <p className="text-sm text-gray-600 mb-3">Your Beneficiary Code:</p>
          <div className="flex items-center justify-between bg-white rounded-lg p-4 border-2 border-blue-200">
            <span className="font-mono text-xl font-bold text-blue-600 tracking-wider">
              {benefCode}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-all duration-200 p-2 rounded-lg hover:bg-blue-50"
            >
              <FaCopy className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        <p className="text-sm text-red-500 mb-6 flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Please store this code securely
        </p>

        <button
          onClick={onContinue}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
        >
          Proceed to Login
        </button>
      </motion.div>
    </motion.div>
  );
};

export default BeneficiarySuccessPopup;
