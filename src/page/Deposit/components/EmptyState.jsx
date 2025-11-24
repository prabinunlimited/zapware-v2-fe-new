// src/features/BankAccounts/components/EmptyState.jsx - ENHANCED
import React from "react";
import { FaUniversity, FaCreditCard, FaExclamationTriangle } from "react-icons/fa";

const EmptyState = ({ onAction, disabled, showCardPaymentMessage, onReturnToCard }) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-6">
        {showCardPaymentMessage ? (
          <FaExclamationTriangle className="h-12 w-12 text-blue-600" />
        ) : (
          <FaUniversity className="h-12 w-12 text-blue-600" />
        )}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {showCardPaymentMessage ? "Bank Account Required" : "No Bank Accounts Linked"}
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {showCardPaymentMessage 
          ? "To process card deposits, you need to link a bank account first. This ensures secure payment processing for your card transactions."
          : "Link your bank account to enable seamless deposits and transfers. Your accounts will be connected securely via our banking partners."
        }
      </p>

      {/* Card Payment Specific Info */}
      {showCardPaymentMessage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
          <div className="flex items-center">
            <FaCreditCard className="text-yellow-500 mr-2" />
            <span className="text-sm text-yellow-700 font-medium">
              Card deposits require linked bank accounts
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onAction}
          disabled={disabled}
          className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
            disabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          }`}
        >
          <FaUniversity className="mr-2" />
          Link Bank Account
        </button>

        {onReturnToCard && (
          <button
            onClick={onReturnToCard}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaCreditCard className="mr-2" />
            Back to Card Payment
          </button>
        )}
      </div>

      {/* Security Note */}
      <div className="mt-8 text-xs text-gray-400 max-w-md mx-auto">
        <p>Bank connections are secured with bank-level encryption and we never store your login credentials.</p>
      </div>
    </div>
  );
};

export default EmptyState;