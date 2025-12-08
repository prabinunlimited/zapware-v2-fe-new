// src/features/Transfer/components/TransferForm.jsx - COMPLETE
import React from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { selectFormErrors } from "./transferSelectors";

const TransferForm = ({
  customerBankAccounts,
  selectedCurrency,
  transferAmount,
  onCurrencyChange,
  onAmountChange,
  headerColorProps,
  textColorProps,
}) => {
  const formErrors = useSelector(selectFormErrors);

  // Find selected account for balance display
  const selectedAccount = customerBankAccounts.find(
    account => account.currency_code === selectedCurrency
  );

  return (
    <div className="space-y-6">
      {/* Currency Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Currency *
        </label>
        <select
          value={selectedCurrency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
            formErrors.currency ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <option value="">Select currency</option>
          {customerBankAccounts.map((account) => (
            <option key={account.id} value={account.currency_code}>
              {account.currency_code} - {account.available_balance || '0.00'}
            </option>
          ))}
        </select>
        {formErrors.currency && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {formErrors.currency}
          </motion.p>
        )}
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount *
        </label>
        <div className="relative">
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              formErrors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          />
          {selectedCurrency && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-500 font-medium bg-white px-2 py-1 rounded-lg">
                {selectedCurrency}
              </span>
            </div>
          )}
        </div>
        {formErrors.amount && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {formErrors.amount}
          </motion.p>
        )}
      </div>

      {/* Balance Information */}
      {selectedAccount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-blue-700 font-medium">Available Balance:</span>
            </div>
            <span className="text-lg font-bold text-blue-800">
              {selectedCurrency} {selectedAccount.available_balance || '0.00'}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TransferForm;