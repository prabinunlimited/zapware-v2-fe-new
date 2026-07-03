// src/components/AccountSummary/Modal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import {
  FiX,
  FiCopy,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiCreditCard,
  FiStar,
  FiPlus,
} from "react-icons/fi";
import AddBankAccountForm from "./AddBankAccountForm";
import ViewBankAccounts from "./ViewBankAccounts";

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
      console.error("Failed to copy text: ", err);
    }
  };

  return { copied, copyToClipboard };
};

// Account Field Component for better reusability
const AccountField = ({
  label,
  value,
  isSensitive = false,
  onCopy,
  sectionType = "regular",
}) => {
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

  const sectionColors = {
    regular: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
      hover: "hover:text-blue-700",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    priority: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-600",
      hover: "hover:text-purple-700",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  };

  const colors = sectionColors[sectionType] || sectionColors.regular;

  return (
    <div className={`p-3 sm:p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <label
            className={`text-xs font-medium ${colors.text} uppercase tracking-wide`}
          >
            {label}
          </label>
          <div className="flex items-center space-x-1">
            {shouldShowVisibilityToggle && (
              <button
                onClick={toggleVisibility}
                className={`p-1 ${colors.text} ${colors.hover} transition-colors`}
                type="button"
                aria-label="Toggle visibility"
              >
                {isVisible ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            )}
            <button
              onClick={handleCopy}
              disabled={!value || value === "N/A"}
              className={`p-1 transition-colors ${value && value !== "N/A"
                  ? `${colors.text} ${colors.hover}`
                  : "text-gray-300 cursor-not-allowed"
                }`}
              type="button"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <FiCheck size={14} className="text-green-500" />
              ) : (
                <FiCopy size={14} />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p
            className={`text-sm font-medium break-words ${isSensitive && !isVisible
                ? "bg-gray-200 text-transparent rounded select-none"
                : "text-gray-900"
              }`}
          >
            {isSensitive && !isVisible ? "••••••••" : displayValue}
          </p>
        </div>
      </div>
    </div>
  );
};

AccountField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  isSensitive: PropTypes.bool,
  onCopy: PropTypes.func,
  sectionType: PropTypes.oneOf(["regular", "priority"]),
};

// Section Header Component
const SectionHeader = ({
  title,
  isPriority = false,
  icon: Icon = FiCreditCard,
}) => {
  const colors = isPriority
    ? {
      bg: "bg-gradient-to-r from-purple-600 to-purple-700",
      text: "text-white",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      accent: "bg-purple-500",
    }
    : {
      bg: "bg-gradient-to-r from-blue-600 to-blue-700",
      text: "text-white",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      accent: "bg-blue-500",
    };

  return (
    <div className={`${colors.bg} rounded-xl p-3 sm:p-4`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 ${colors.iconBg} rounded-lg flex-shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm sm:text-base font-semibold ${colors.text} truncate`}>
            {title}
          </h3>
          {isPriority && (
            <span className="mt-0.5 sm:mt-1 px-1.5 sm:px-2 py-0.5 bg-white bg-opacity-20 text-white text-[10px] sm:text-xs font-medium rounded-full inline-block">
              International Banking
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Modal Component
const Modal = ({ isOpen, onClose, accountData, onAccountAdded }) => {
  const { copied, copyToClipboard } = useCopyToClipboard();
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [showViewBanks, setShowViewBanks] = React.useState(false);

  const shouldShowAddButton = React.useMemo(() => {
    return accountData?.service_provider_id === 59;
  }, [accountData]);

  const isPriorityAccount = React.useMemo(() => {
    return (
      accountData?.priority_account === true ||
      accountData?.account_type === "priority" ||
      accountData?.account_number?.startsWith?.("IBAN") ||
      accountData?.iban_number ||
      (accountData?.iban && accountData.iban !== "N/A") ||
      accountData?.priority_iban
    );
  }, [accountData]);

  const handleCopyAll = async () => {
    let accountInfo = `
REGULAR ACCOUNT DETAILS:
Account Number: ${accountData.account_number || "N/A"}
Account Holder Name: ${accountData.account_name || "N/A"}
Routing Code: ${accountData.routing_code ||
      accountData.routing_number ||
      accountData.swift_code ||
      "N/A"}
Bank Name: ${accountData.bank_name || "N/A"}
Bank Address: ${accountData.bank_address || "N/A"}

PRIORITY ACCOUNT DETAILS:
IBAN Number: ${accountData.iban_number ||
      accountData.iban ||
      accountData.priority_iban ||
      accountData.priority_acc_no ||
      "N/A"}
Account Holder Name: ${accountData.account_name || "N/A"}
Routing Code: ${accountData.priority_routing_no ||
      accountData.routing_code ||
      accountData.routing_number ||
      accountData.swift_code ||
      "N/A"}
Bank Name: ${accountData.priority_bank_name || accountData.bank_name || "N/A"}
Bank Address: ${accountData.priority_bank_address || accountData.bank_address || "N/A"}
    `.trim();

    await copyToClipboard(accountInfo);
  };

  const handleCopyRegular = async () => {
    const regularInfo = `
Account Number: ${accountData.account_number || "N/A"}
Account Holder Name: ${accountData.account_name || "N/A"}
Routing Code: ${accountData.routing_code ||
      accountData.routing_number ||
      accountData.swift_code ||
      "N/A"}
Bank Name: ${accountData.bank_name || "N/A"}
Bank Address: ${accountData.bank_address || "N/A"}
    `.trim();

    await copyToClipboard(regularInfo);
  };

  const handleCopyPriority = async () => {
    const priorityInfo = `
IBAN Number: ${accountData.iban_number ||
      accountData.iban ||
      accountData.priority_iban ||
      accountData.priority_acc_no ||
      "N/A"}
Account Holder Name: ${accountData.account_name || "N/A"}
Routing Code: ${accountData.priority_routing_no ||
      accountData.routing_code ||
      accountData.routing_number ||
      accountData.swift_code ||
      "N/A"}
Bank Name: ${accountData.priority_bank_name || accountData.bank_name || "N/A"}
Bank Address: ${accountData.priority_bank_address || accountData.bank_address || "N/A"}
    `.trim();

    await copyToClipboard(priorityInfo);
  };

  const handleFieldCopy = (fieldName, value) => {
    console.log(`Copied ${fieldName}: ${value}`);
  };

  const formatBalance = (balance) => {
    if (!balance && balance !== 0) return "0";
    const numBalance =
      typeof balance === "string" ? parseFloat(balance) : balance;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numBalance);
  };

  const handleAddAccountSuccess = (newAccount) => {
    if (onAccountAdded) {
      onAccountAdded(newAccount);
    }
    setShowAddForm(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && accountData && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-4"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div
                className={`px-4 sm:px-6 py-3 sm:py-4 ${isPriorityAccount
                    ? "bg-gradient-to-r from-purple-600 to-purple-700"
                    : "bg-gradient-to-r from-blue-600 to-blue-700"
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    {accountData.flag_url && (
                      <img
                        src={accountData.flag_url}
                        alt={`${accountData.currency} flag`}
                        className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg font-bold text-white truncate">
                        Account Details
                      </h2>
                      <p className="text-white text-opacity-90 text-xs sm:text-sm truncate">
                        {accountData.currency} Account
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-1 text-white hover:text-white transition-colors rounded-full hover:bg-opacity-30 hover:bg-white flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {/* ADD BANK ACCOUNT BUTTON - PLACED BELOW THE HEADER */}
                {shouldShowAddButton && (
                  <div className="mt-3 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center space-x-2 border border-white border-opacity-30"
                    >
                      <FiPlus size={18} />
                      <span>Add Bank Account</span>
                    </button>
                    <button
                      onClick={() => setShowViewBanks(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center space-x-2 border border-white border-opacity-30"
                    >
                      <FiEye size={18} />
                      <span>View Added Banks</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-180px)]">
                {/* Balance Card */}
                <div
                  className={`${isPriorityAccount
                      ? "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100"
                      : "bg-gradient-to-br from-green-50 to-blue-50 border-green-100"
                    } border rounded-xl p-3 sm:p-4 text-center`}
                >
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Available Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                    {formatBalance(accountData.available_balance)}{" "}
                    {accountData.currency}
                  </p>
                </div>

                {/* Side by Side Sections - Both Fully Visible */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Left Column - Regular Account Details */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <SectionHeader
                      title="Regular Account Details"
                      isPriority={false}
                      icon={FiCreditCard}
                    />

                    <div className="space-y-3 sm:space-y-4">
                      <AccountField
                        label="Account Number"
                        value={accountData.account_number}
                        isSensitive={true}
                        onCopy={handleFieldCopy}
                        sectionType="regular"
                      />

                      <AccountField
                        label="Account Holder Name"
                        value={accountData.account_name}
                        onCopy={handleFieldCopy}
                        sectionType="regular"
                      />

                      <AccountField
                        label="Routing Code"
                        value={
                          accountData.routing_code ||
                          accountData.routing_number ||
                          accountData.swift_code ||
                          "N/A"
                        }
                        onCopy={handleFieldCopy}
                        sectionType="regular"
                      />

                      <AccountField
                        label="Bank Name"
                        value={accountData.bank_name}
                        onCopy={handleFieldCopy}
                        sectionType="regular"
                      />

                      <AccountField
                        label="Bank Address"
                        value={accountData.bank_address}
                        onCopy={handleFieldCopy}
                        sectionType="regular"
                      />

                      {/* Regular Section Copy Button */}
                      <div className="pt-1 sm:pt-2">
                        <button
                          onClick={handleCopyRegular}
                          disabled={copied}
                          className="w-full px-4 py-2.5 sm:py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          {copied ? (
                            <>
                              <FiCheck size={14} />
                              <span>Copied Regular Details</span>
                            </>
                          ) : (
                            <>
                              <FiCopy size={14} />
                              <span>Copy Regular Details</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Right Column - Priority Account Details */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <SectionHeader
                      title="Priority Account Details"
                      isPriority={true}
                      icon={FiStar}
                    />

                    <div className="space-y-3 sm:space-y-4">
                      <AccountField
                        label="IBAN Number"
                        value={
                          accountData.iban_number ||
                          accountData.iban ||
                          accountData.priority_iban ||
                          accountData.priority_acc_no ||
                          "N/A"
                        }
                        isSensitive={true}
                        onCopy={handleFieldCopy}
                        sectionType="priority"
                      />

                      <AccountField
                        label="Account Holder Name"
                        value={accountData.account_name}
                        onCopy={handleFieldCopy}
                        sectionType="priority"
                      />

                      <AccountField
                        label="Routing Code"
                        value={
                          accountData.priority_routing_no ||
                          accountData.routing_code ||
                          accountData.routing_number ||
                          accountData.swift_code ||
                          "N/A"
                        }
                        onCopy={handleFieldCopy}
                        sectionType="priority"
                      />

                      <AccountField
                        label="Bank Name"
                        value={
                          accountData.priority_bank_name ||
                          accountData.bank_name ||
                          "N/A"
                        }
                        onCopy={handleFieldCopy}
                        sectionType="priority"
                      />

                      <AccountField
                        label="Bank Address"
                        value={
                          accountData.priority_bank_address ||
                          accountData.bank_address ||
                          "N/A"
                        }
                        onCopy={handleFieldCopy}
                        sectionType="priority"
                      />

                      {/* Priority Section Copy Button */}
                      <div className="pt-1 sm:pt-2">
                        <button
                          onClick={handleCopyPriority}
                          disabled={copied}
                          className="w-full px-4 py-2.5 sm:py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          {copied ? (
                            <>
                              <FiCheck size={14} />
                              <span>Copied Priority Details</span>
                            </>
                          ) : (
                            <>
                              <FiCopy size={14} />
                              <span>Copy Priority Details</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Comparison Info */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  {/* Mobile Version - Enhanced Design (visible on mobile only) */}
                  <div className="block sm:hidden p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <FiInfo className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">
                          Account Comparison
                        </h4>

                        <div className="grid grid-cols-1 gap-4">
                          {/* Regular Account */}
                          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <p className="text-sm font-semibold text-blue-700">
                                Regular Account
                              </p>
                            </div>
                            <ul className="space-y-2">
                              <li className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-blue-400 mt-1">•</span>
                                <span className="break-words">Standard domestic transactions</span>
                              </li>
                              <li className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-blue-400 mt-1">•</span>
                                <span className="break-words">Uses account number &amp; routing code</span>
                              </li>
                              <li className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-blue-400 mt-1">•</span>
                                <span className="break-words">Local currency only</span>
                              </li>
                            </ul>
                          </div>

                          {/* Priority Account */}
                          <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                              <p className="text-sm font-semibold text-purple-700">
                                Priority Account
                              </p>
                            </div>
                            <ul className="space-y-2">
                              <li className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-purple-400 mt-1">•</span>
                                <span className="break-words">International transactions</span>
                              </li>
                              <li className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-purple-400 mt-1">•</span>
                                <span className="break-words">Uses IBAN for global transfers</span>
                              </li>
                              <li className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-purple-400 mt-1">•</span>
                                <span className="break-words">Multi-currency support</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Info Badge */}
                        <div className="mt-4 flex items-center justify-center gap-2 bg-blue-50/80 rounded-lg px-4 py-2 border border-blue-100">
                          <FiInfo className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-gray-600 text-center">
                            Both account types are fully visible and interactive
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Version - Original Design (visible on desktop only) */}
                  <div className="hidden sm:block p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FiInfo className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 font-medium mb-1">
                          Account Comparison
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs text-gray-700">
                          <div className="space-y-1">
                            <p className="font-medium text-blue-700">
                              Regular Account:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              <li className="break-words">Standard domestic transactions</li>
                              <li className="break-words">Uses account number & routing code</li>
                              <li className="break-words">Local currency only</li>
                            </ul>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-purple-700">
                              Priority Account:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              <li className="break-words">International transactions</li>
                              <li className="break-words">Uses IBAN for global transfers</li>
                              <li className="break-words">Multi-currency support</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 sticky bottom-0">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2">
                    <FiInfo className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs text-gray-500 text-center sm:text-left">
                      Both account types are fully visible and interactive
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <button
                      onClick={onClose}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleCopyAll}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                    >
                      <FiCopy size={16} />
                      <span>Copy All Details</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Bank Account Form Modal */}
      <AddBankAccountForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={handleAddAccountSuccess}
        accountData={accountData}
      />

      {/* View Bank Accounts Modal */}
      <ViewBankAccounts
        isOpen={showViewBanks}
        onClose={() => setShowViewBanks(false)}
        customerId={accountData?.customer_id || accountData?.customerId}
      />
    </>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  accountData: PropTypes.shape({
    service_provider_id: PropTypes.number,
    currency: PropTypes.string,
    account_number: PropTypes.string,
    iban: PropTypes.string,
    iban_number: PropTypes.string,
    available_balance: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    flag_url: PropTypes.string,
    bank_name: PropTypes.string,
    bank_address: PropTypes.string,
    account_name: PropTypes.string,
    routing_code: PropTypes.string,
    routing_number: PropTypes.string,
    swift_code: PropTypes.string,
    sort_code: PropTypes.string,
    priority_account: PropTypes.bool,
    account_type: PropTypes.string,
    priority_iban: PropTypes.string,
    priority_acc_no: PropTypes.string,
    priority_routing_no: PropTypes.string,
    priority_bank_name: PropTypes.string,
    priority_bank_address: PropTypes.string,
  }),
  onAccountAdded: PropTypes.func,
};

export default Modal;