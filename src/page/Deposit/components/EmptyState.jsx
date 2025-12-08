import React from "react";
import { motion } from "framer-motion";
import { FaUniversity, FaCreditCard, FaPlus, FaArrowLeft } from "react-icons/fa";

const EmptyState = ({ navigate, message, actionText, onAction }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl"
    >
      <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaUniversity className="text-yellow-500 text-3xl" />
      </div>
      
      <h2 className="text-xl font-bold text-yellow-600 mb-4">
        No Accounts Available for Deposits
      </h2>
      
      <p className="text-gray-700 mb-6 leading-relaxed">
        {message || "You don't have any accounts set up for deposits. Please contact support to set up your accounts."}
      </p>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-yellow-700">
          If you just created an account, it may take a few moments to appear.
        </p>
      </div>

      <div className="space-y-3">
        {onAction && (
          <motion.button
            onClick={onAction}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
          >
            <FaPlus className="mr-2" />
            {actionText || "Contact Support"}
          </motion.button>
        )}
        
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center"
        >
          <FaArrowLeft className="mr-2" />
          Back to Dashboard
        </button>
      </div>
    </motion.div>
  </div>
);

export default EmptyState;