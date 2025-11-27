import React from "react";
import { motion } from "framer-motion";
import { FaUniversity, FaCheck, FaInfoCircle } from "react-icons/fa";
import BankDetailItem from "./BankDetailItem";

const USDBankDepositInfo = ({
  selectedCurrency,
  paymentMethod,
  selectedBankAccount,
  onBankAccountSelect,
  usdBankAccounts = [],
  loading,
  error,
  formErrors,
  copiedField,
  onCopy,
  showTooltip,
  onTooltipShow,
  onTooltipHide,
  navigate,
}) => {
  const isUSDTransfer =
    selectedCurrency === "USD" && paymentMethod === "bank_transfer";

  // Debug logging (remove in production)
  

  if (!isUSDTransfer) {
    return null;
  }

  // Ensure usdBankAccounts is always an array
  const safeUsdBankAccounts = Array.isArray(usdBankAccounts)
    ? usdBankAccounts
    : [];

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-blue-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-4 bg-blue-200 rounded"></div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl"
      >
        <p className="text-red-700 text-sm">
          Failed to load bank accounts: {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  // Find selected account safely
  const selectedAccount = selectedBankAccount
    ? safeUsdBankAccounts.find((acc) => acc && acc.id === selectedBankAccount)
    : null;

  // Debug selected account
  
  

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      {/* Bank Account Selection */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Select Bank Account *
          </label>
          <div className="relative ml-2">
            <button
              type="button"
              onMouseEnter={() => onTooltipShow("bankAccount")}
              onMouseLeave={() => onTooltipHide("bankAccount")}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaInfoCircle className="text-sm" />
            </button>
            {showTooltip?.bankAccount && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-10"
              >
                Choose the bank account where you want to receive USD funds
                <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
              </motion.div>
            )}
          </div>
        </div>

        {formErrors?.bankAccount && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-600 text-sm mb-3"
          >
            {formErrors.bankAccount}
          </motion.p>
        )}

        <div className="grid grid-cols-1 gap-4">
          {safeUsdBankAccounts.map((account) => {
            // Ensure account has required properties
            if (!account || !account.id) {
              
              return null;
            }

            return (
              <motion.button
                key={account.id}
                type="button"
                onClick={() => onBankAccountSelect(account.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  selectedBankAccount === account.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                      <FaUniversity className="text-white text-lg" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {account.bank_name || "Bank Account"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Account: {account.account_number || "N/A"}
                      </p>
                    </div>
                  </div>

                  {selectedBankAccount === account.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <FaCheck className="text-white text-xs" />
                    </motion.div>
                  )}
                </div>

                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500">
                  <div>
                    <strong>Currency:</strong> {account.currency || "USD"}
                  </div>
                  <div>
                    <strong>SWIFT:</strong> {account.swift_code || "N/A"}
                  </div>
                  <div>
                    <strong>Country:</strong> {account.country || "N/A"}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {safeUsdBankAccounts.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <FaUniversity className="text-4xl text-gray-300 mx-auto mb-2" />
            <p>No USD bank accounts available</p>
            <button
              onClick={() => navigate("/bank-accounts")}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Add bank account
            </button>
          </div>
        )}
      </div>

      {/* Selected Account Details */}
      {selectedBankAccount && selectedAccount && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">
              Transfer Instructions
            </h3>
            <p className="text-green-100 text-sm mt-1">
              Use these details for your bank transfer
            </p>
          </div>

          <div className="p-6">
            {/* Safe access to bank details */}
            {(() => {
              const bankDetails = selectedAccount?.bank_details || [];

              if (bankDetails.length === 0) {
                return (
                  <div className="text-center py-4 text-gray-500">
                    <p>No bank details available for the selected account</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Please contact support for transfer instructions
                    </p>
                  </div>
                );
              }

              return bankDetails.map((detail, index) => (
                <BankDetailItem
                  key={index}
                  label={detail.label}
                  value={detail.value}
                  onCopy={onCopy}
                  copiedField={copiedField}
                  fieldName={`bankDetail-${index}`}
                  showTooltip={showTooltip}
                  onTooltipShow={onTooltipShow}
                  onTooltipHide={onTooltipHide}
                />
              ));
            })()}

            <div className="mt-4 p-4 bg-white rounded-lg border border-green-100">
              <h4 className="font-semibold text-green-800 mb-2">
                Important Notes:
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Include your account number in the transfer reference</li>
                <li>• Transfers typically take 2-5 business days</li>
                <li>
                  • Contact support if transfer is not reflected after 5 days
                </li>
                <li>• Minimum transfer amount: $50 USD</li>
                <li>• Bank fees may apply depending on your institution</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Show message if selected account is not found */}
      {selectedBankAccount && !selectedAccount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
        >
          <div className="flex items-center">
            <FaInfoCircle className="text-yellow-500 mr-2" />
            <p className="text-yellow-700 text-sm">
              The selected bank account is no longer available. Please select a
              different account.
            </p>
          </div>
          <button
            onClick={() => onBankAccountSelect(null)}
            className="mt-2 text-yellow-700 hover:text-yellow-800 text-sm font-medium underline"
          >
            Clear selection
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default USDBankDepositInfo;
