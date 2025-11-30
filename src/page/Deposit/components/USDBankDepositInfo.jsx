// src/page/Deposit/components/USDBankDepositInfo.jsx - COMPLETE
import React from "react";
import { motion } from "framer-motion";
import {
  FaUniversity,
  FaCheck,
  FaInfoCircle,
  FaPlus,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useSelector } from "react-redux";

const USDBankDepositInfo = ({
  selectedCurrency,
  paymentMethod,
  selectedBankAccount,
  onBankAccountSelect,
  formErrors,
  copiedField,
  onCopy,
  showTooltip,
  onTooltipShow,
  onTooltipHide,
  navigate,
  onSwitchToBankAccounts,
}) => {
  const { bankAccounts, loading, error } = useSelector((state) => ({
    bankAccounts: state.bankAccounts?.usdBankAccounts || [],
    loading: state.bankAccounts?.usdAccountsLoading || false,
    error: state.bankAccounts?.usdAccountsError || null,
  }));

  // ✅ COMPLETE: Only show for USD bank deposits
  const isUSDBankDeposit =
    selectedCurrency === "USD" && paymentMethod === "bank_deposit";

  // ✅ COMPLETE: Enhanced debugging
  console.log("🔍 USDBankDepositInfo Debug:", {
    selectedCurrency,
    paymentMethod,
    isUSDBankDeposit,
    rawAccounts: bankAccounts,
    accountsCount: bankAccounts?.length || 0,
    loading,
    error,
    selectedBankAccount,
  });

  // ✅ COMPLETE: Normalize account data structure
  const safeUsdBankAccounts = Array.isArray(bankAccounts)
    ? bankAccounts.map((account) => ({
        id: account.id,
        account_id: account.id,
        bank_name: account.provider || account.bank || "Bank Account",
        account_name: account.account_name,
        account_number: account.accountNumberHash || account.account_number,
        currency: account.currency || "USD",
        routing_number: account.routing_number,
        bank: account.provider || account.bank,
        provider: account.provider,
        account_type: account.account_type,
        status: account.status,
        is_frozen: account.is_frozen,
        isLinkedOnSila: account.isLinkedOnSila,
        isPlaid: account.isPlaid,
        // Include all original properties for compatibility
        ...account,
      }))
    : [];

  // ✅ ADD: Enhanced debug logging
  console.log("🔍 USD BANK ACCOUNTS MAPPING:", {
    rawAccounts: bankAccounts,
    mappedAccounts: safeUsdBankAccounts,
    mappingDetails: safeUsdBankAccounts.map((acc) => ({
      id: acc.id,
      bank_name: acc.bank_name,
      account_number: acc.account_number,
      currency: acc.currency,
      is_frozen: acc.is_frozen,
      status: acc.status,
    })),
  });

  // ✅ ADD: Debug logging to see what's happening
  console.log("🔍 USD BANK ACCOUNTS MAPPING:", {
    rawAccounts: bankAccounts,
    mappedAccounts: safeUsdBankAccounts,
    mappingDetails: safeUsdBankAccounts.map((acc) => ({
      id: acc.id,
      bank_name: acc.bank_name,
      account_number: acc.account_number,
      currency: acc.currency,
    })),
  });

  // ✅ COMPLETE: Handle Add Bank Account click
  const handleAddBankAccount = () => {
    console.log("🔄 Switching to bank accounts tab to add new account");
    if (onSwitchToBankAccounts) {
      onSwitchToBankAccounts();
    } else {
      navigate("/bank-accounts");
    }
  };

  // ✅ COMPLETE: Find selected account safely
  const selectedAccount = selectedBankAccount
    ? safeUsdBankAccounts.find((acc) => acc && acc.id === selectedBankAccount)
    : null;

  if (!isUSDBankDeposit) {
    return null;
  }

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
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-2" />
          <p className="text-red-700 text-sm">
            Failed to load bank accounts: {error}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      {/* ✅ COMPLETE: Bank Account Selection Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
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
                Choose the US bank account you want to link for deposits
                <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.button
          type="button"
          onClick={handleAddBankAccount}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <FaPlus className="mr-2" />
          Add Bank Account
        </motion.button>
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

      {/* ✅ COMPLETE: Accounts List */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {safeUsdBankAccounts.map((account) => {
          if (!account || !account.id) {
            console.warn("Invalid account data:", account);
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

      {/* ✅ COMPLETE: Empty State with Enhanced Debug Info */}
      {safeUsdBankAccounts.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
          <FaUniversity className="text-4xl text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">
            No USD bank accounts available
          </p>
          <p className="text-gray-500 text-sm mt-1 mb-4">
            {error
              ? `Error: ${error}`
              : "You need to link a bank account to proceed with USD deposits"}
          </p>

          {/* Enhanced Debug Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left max-w-md mx-auto">
            <p className="text-yellow-700 text-xs font-mono">
              <strong>Debug Information:</strong>
              <br />
              Payment Method: {paymentMethod}
              <br />
              Selected Currency: {selectedCurrency}
              <br />
              Accounts Found: {safeUsdBankAccounts.length}
              <br />
              Loading: {loading ? "Yes" : "No"}
              <br />
              Error: {error || "None"}
              <br />
              Bank Deposit: {isUSDBankDeposit ? "Yes" : "No"}
            </p>
          </div>

          <motion.button
            type="button"
            onClick={handleAddBankAccount}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <FaPlus className="mr-2" />
            Add Your First Bank Account
          </motion.button>
        </div>
      )}

      {/* ✅ COMPLETE: Selected Account Details */}
      {selectedBankAccount && selectedAccount && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl overflow-hidden mt-4"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">
              Bank Account Linked
            </h3>
            <p className="text-green-100 text-sm mt-1">
              Your US bank account is ready for deposits
            </p>
          </div>

          <div className="p-6">
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-green-800 mb-2">
                Account Information:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Bank Name:</strong> {selectedAccount.bank_name}
                </div>
                <div>
                  <strong>Account Number:</strong>{" "}
                  {selectedAccount.account_number}
                </div>
                <div>
                  <strong>Account Type:</strong>{" "}
                  {selectedAccount.account_type || "Checking"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span className="text-green-600">Verified</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg border border-green-100">
              <h4 className="font-semibold text-green-800 mb-2">Next Steps:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>
                  • Your bank account is now linked and ready for deposits
                </li>
                <li>• You can now proceed with USD deposits</li>
                <li>• Deposits typically process within 1-2 business days</li>
                <li>• Contact support if you encounter any issues</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* ✅ COMPLETE: Show message if selected account is not found */}
      {selectedBankAccount && !selectedAccount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
        >
          <div className="flex items-center">
            <FaExclamationTriangle className="text-yellow-500 mr-2" />
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
