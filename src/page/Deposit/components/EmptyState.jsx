// src/features/BankAccounts/components/EmptyState.jsx - COMPLETE
import React from "react";
import { motion } from "framer-motion";
import { FaUniversity, FaCreditCard, FaPlus } from "react-icons/fa";

const EmptyState = ({ 
  onAction, 
  disabled, 
  showCardPaymentMessage, 
  onReturnToCard 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaUniversity className="text-blue-600 text-3xl" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Bank Accounts Linked
        </h3>
        
        <p className="text-gray-600 mb-6">
          {showCardPaymentMessage 
            ? "Link a bank account to enable card payments and deposits."
            : "Get started by linking your first bank account to make deposits."
          }
        </p>

        {showCardPaymentMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center">
              <FaCreditCard className="text-blue-500 mr-2" />
              <p className="text-blue-700 text-sm">
                Bank account required for card payment processing
              </p>
            </div>
          </div>
        )}

        <motion.button
          onClick={onAction}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
            disabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          }`}
        >
          <FaPlus className="mr-2" />
          Link Bank Account
        </motion.button>

        {showCardPaymentMessage && onReturnToCard && (
          <button
            onClick={onReturnToCard}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Return to Card Payment
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default EmptyState;