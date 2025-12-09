// src/features/Transfer/components/TransferForm.jsx - UPDATED
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

  // Find selected account for display (removed balance since not in API)
  const selectedAccount = customerBankAccounts.find(
    (account) => account.currency_code === selectedCurrency
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
            formErrors.currency
              ? "border-red-300 bg-red-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <option value="">Select currency</option>
          {customerBankAccounts.map((account) => (
            <option key={account.id} value={account.currency_code}>
              {account.currency_code}
            </option>
          ))}
        </select>
        {formErrors.currency && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
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
              formErrors.amount
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
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
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {formErrors.amount}
          </motion.p>
        )}
      </div>

      {/* Account Information (Updated based on API response) */}
      {selectedAccount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2.5 1A1.5 1.5 0 001 2.5v15A1.5 1.5 0 002.5 19h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0017.5 1h-15zm12 3a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1h-1zM5 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1V5zm10 8a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1h-1zM5 13a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1z" />
              </svg>
              <span className="text-sm text-blue-700 font-medium">
                Selected Account:
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-800">
                {selectedAccount.serviceprovidername}{" "}
                {/* Display service provider name */}
              </span>
              <p className="text-xs text-blue-600 mt-1">
                Currency:{" "}
                <span className="font-semibold">
                  {selectedAccount.currency_code}
                </span>
                <br />
                Status:{" "}
                <span className="font-semibold">
                  {selectedAccount.approved_status}
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TransferForm;
