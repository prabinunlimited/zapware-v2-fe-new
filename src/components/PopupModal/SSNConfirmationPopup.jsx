import React from "react";
import PropTypes from "prop-types";
import { ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

function SSNConfirmationPopup({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md mx-4 border-t-4 border-blue-600"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-blue-600 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7" /> SSN Confirmation
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 focus:outline-none text-xl font-bold"
            onClick={onClose}
            aria-label="Close confirmation"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-800 text-base leading-relaxed">
            Please make sure your entered data matches your official SSN (Social Security Number) information to avoid verification issues.
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm font-medium">
              <strong>Important:</strong> Your SSN will be encrypted and stored securely for verification purposes only.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            className="px-6 py-3 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 transition-all duration-200 flex-1 sm:flex-none"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex-1 sm:flex-none"
            onClick={onConfirm}
            type="button"
          >
            Confirm and Submit
          </button>
        </div>
      </motion.div>
    </div>
  );
}

SSNConfirmationPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default SSNConfirmationPopup;