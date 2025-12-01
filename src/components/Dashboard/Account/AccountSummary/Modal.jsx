// src/components/AccountSummary/Modal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import { FiX, FiCopy, FiCheck, FiEye, FiEyeOff } from "react-icons/fi";

// Custom hook for copy functionality
const useCopyToClipboard = () => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async (text) => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return { copied, copyToClipboard };
};

// Account Field Component for better reusability
const AccountField = ({ label, value, isSensitive = false, onCopy }) => {
  const [isVisible, setIsVisible] = React.useState(!isSensitive);
  const { copied, copyToClipboard } = useCopyToClipboard();

  const handleCopy = () => {
    if (value && value !== "N/A") {
      copyToClipboard(value);
      onCopy?.(label, value);
    }
  };

  const toggleVisibility = () => {
    if (isSensitive) {
      setIsVisible(!isVisible);
    }
  };

  const displayValue = value || "N/A";
  const shouldShowVisibilityToggle = isSensitive && value && value !== "N/A";

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </label>
        <div className="flex items-center space-x-1">
          {shouldShowVisibilityToggle && (
            <button
              onClick={toggleVisibility}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              {isVisible ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!value || value === "N/A"}
            className={`p-1 transition-colors ${
              value && value !== "N/A"
                ? "text-gray-400 hover:text-blue-600"
                : "text-gray-300 cursor-not-allowed"
            }`}
            type="button"
          >
            {copied ? <FiCheck size={14} className="text-green-500" /> : <FiCopy size={14} />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p
          className={`text-sm font-medium ${
            isSensitive && !isVisible
              ? "bg-gray-200 text-transparent rounded select-none"
              : "text-gray-900"
          }`}
        >
          {isSensitive && !isVisible ? "••••••••" : displayValue}
        </p>
      </div>
    </div>
  );
};

AccountField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  isSensitive: PropTypes.bool,
  onCopy: PropTypes.func,
};

// Main Modal Component
const Modal = ({ isOpen, onClose, accountData }) => {
  const { copied, copyToClipboard } = useCopyToClipboard();

  const handleCopyAll = async () => {
    const accountInfo = `
Account Number: ${accountData.account_number || "N/A"}
IBAN: ${accountData.iban || "N/A"}
Available Balance: ${accountData.available_balance || "0"}
Currency: ${accountData.currency || "N/A"}
Bank: ${accountData.bank_name || "N/A"}
Branch: ${accountData.branch_name || "N/A"}
    `.trim();
    
    await copyToClipboard(accountInfo);
  };

  const handleFieldCopy = (fieldName, value) => {
    console.log(`Copied ${fieldName}: ${value}`);
    // You can add analytics here
  };

  const formatBalance = (balance) => {
    if (!balance && balance !== 0) return "0";
    const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numBalance);
  };

  return (
    <AnimatePresence>
      {isOpen && accountData && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {accountData.flag_url && (
                    <img
                      src={accountData.flag_url}
                      alt={`${accountData.currency} flag`}
                      className="w-8 h-8 object-cover rounded-full border-2 border-white shadow-sm"
                    />
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-white">Account Details</h2>
                    <p className="text-blue-100 text-sm">
                      {accountData.currency} Account
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-blue-100 hover:text-white transition-colors rounded-full hover:bg-blue-500"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-100 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatBalance(accountData.available_balance)} {accountData.currency}
                </p>
              </div>

              {/* Account Information Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Account Information
                  </h3>
                  <button
                    onClick={handleCopyAll}
                    disabled={copied}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    {copied ? (
                      <>
                        <FiCheck size={12} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <FiCopy size={12} />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <AccountField
                    label="Account Number"
                    value={accountData.account_number}
                    isSensitive={true}
                    onCopy={handleFieldCopy}
                  />
                  
                  <AccountField
                    label="IBAN"
                    value={accountData.iban}
                    isSensitive={true}
                    onCopy={handleFieldCopy}
                  />
                  
                  <AccountField
                    label="Currency"
                    value={accountData.currency}
                    onCopy={handleFieldCopy}
                  />

                  {accountData.bank_name && (
                    <AccountField
                      label="Bank Name"
                      value={accountData.bank_name}
                      onCopy={handleFieldCopy}
                    />
                  )}

                  {accountData.branch_name && (
                    <AccountField
                      label="Branch Name"
                      value={accountData.branch_name}
                      onCopy={handleFieldCopy}
                    />
                  )}
                </div>
              </div>

              {/* Additional Info Section - Expandable for future fields */}
              {(accountData.swift_code || accountData.sort_code || accountData.routing_number) && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {accountData.swift_code && (
                      <AccountField
                        label="SWIFT Code"
                        value={accountData.swift_code}
                        onCopy={handleFieldCopy}
                      />
                    )}
                    {accountData.sort_code && (
                      <AccountField
                        label="Sort Code"
                        value={accountData.sort_code}
                        onCopy={handleFieldCopy}
                      />
                    )}
                    {accountData.routing_number && (
                      <AccountField
                        label="Routing Number"
                        value={accountData.routing_number}
                        onCopy={handleFieldCopy}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleCopyAll}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiCopy size={14} />
                  <span>Copy All Details</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  accountData: PropTypes.shape({
    currency: PropTypes.string,
    account_number: PropTypes.string,
    iban: PropTypes.string,
    available_balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    flag_url: PropTypes.string,
    bank_name: PropTypes.string,
    branch_name: PropTypes.string,
    swift_code: PropTypes.string,
    sort_code: PropTypes.string,
    routing_number: PropTypes.string,
  }),
};

export default Modal;