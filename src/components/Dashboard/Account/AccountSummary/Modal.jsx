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
  FiPlus, // ADD THIS IMPORT
} from "react-icons/fi";
import AddBankAccountForm from "./AddBankAccountForm";

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

  // Determine colors based on section type
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
    <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between">
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
            className={`text-sm font-medium ${isSensitive && !isVisible
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
    <div className={`${colors.bg} rounded-xl p-4`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 ${colors.iconBg} rounded-lg`}>
          <Icon className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-base font-semibold ${colors.text}`}>{title}</h3>
          {isPriority && (
            <span className="mt-1 px-2 py-0.5 bg-white bg-opacity-20 text-white text-xs font-medium rounded-full">
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

  // MOVED THESE INSIDE THE COMPONENT - THIS IS THE FIX
  const [showAddForm, setShowAddForm] = React.useState(false);

  // Check if service_provider_id is 59
  const shouldShowAddButton = React.useMemo(() => {
    return accountData?.service_provider_id === 59;
  }, [accountData]);

  // Determine if this is a priority account (for styling purposes only)
  const isPriorityAccount = React.useMemo(() => {
    return (
      accountData?.priority_account === true ||
      accountData?.account_type === "priority" ||
      accountData?.account_number?.startsWith?.("IBAN") ||
      accountData?.iban_number ||
      (accountData?.iban && accountData.iban !== "N/A") ||
      accountData?.priority_iban // Also check for priority_iban
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
      "N/A"
      }
Bank Name: ${accountData.bank_name || "N/A"}
Bank Address: ${accountData.bank_address || "N/A"}

PRIORITY ACCOUNT DETAILS:
IBAN Number: ${accountData.iban_number ||
      accountData.iban ||
      accountData.priority_iban ||
      accountData.priority_acc_no ||
      "N/A"
      }
Account Holder Name: ${accountData.account_name || "N/A"}
Routing Code: ${accountData.priority_routing_no || // Fixed: use accountData.priority_routing_no
      accountData.routing_code ||
      accountData.routing_number ||
      accountData.swift_code ||
      "N/A"
      }
Bank Name: ${accountData.priority_bank_name || accountData.bank_name || "N/A"}
Bank Address: ${accountData.priority_bank_address || accountData.bank_address || "N/A"
      }
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
      "N/A"
      }
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
      "N/A"
      }
Account Holder Name: ${accountData.account_name || "N/A"}
Routing Code: ${accountData.priority_routing_no || // Fixed: use accountData.priority_routing_no
      accountData.routing_code ||
      accountData.routing_number ||
      accountData.swift_code ||
      "N/A"
      }
Bank Name: ${accountData.priority_bank_name || accountData.bank_name || "N/A"}
Bank Address: ${accountData.priority_bank_address || accountData.bank_address || "N/A"
      }
    `.trim();

    await copyToClipboard(priorityInfo);
  };

  const handleFieldCopy = (fieldName, value) => {
    console.log(`Copied ${fieldName}: ${value}`);
    // You can add analytics here
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
    // Call the parent callback if provided
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div
                className={`px-6 py-4 ${isPriorityAccount
                    ? "bg-gradient-to-r from-purple-600 to-purple-700"
                    : "bg-gradient-to-r from-blue-600 to-blue-700"
                  }`}
              >
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
                      <h2 className="text-lg font-bold text-white">
                        Account Details
                      </h2>
                      <p className="text-opacity-90 text-white text-sm">
                        {accountData.currency} Account
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 text-white hover:text-white transition-colors rounded-full hover:bg-opacity-30 hover:bg-white"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {/* ADD BANK ACCOUNT BUTTON - PLACED BELOW THE HEADER */}
                {shouldShowAddButton && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium rounded-lg transition-all flex items-center space-x-2 border border-white border-opacity-30"
                    >
                      <FiPlus size={18} />
                      <span>Add Bank Account</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Balance Card */}
                <div
                  className={`${isPriorityAccount
                      ? "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100"
                      : "bg-gradient-to-br from-green-50 to-blue-50 border-green-100"
                    } border rounded-xl p-4 text-center`}
                >
                  <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatBalance(accountData.available_balance)}{" "}
                    {accountData.currency}
                  </p>
                </div>

                {/* Side by Side Sections - Both Fully Visible */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Regular Account Details */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <SectionHeader
                      title="Regular Account Details"
                      isPriority={false}
                      icon={FiCreditCard}
                    />

                    <div className="space-y-4">
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
                      <div className="pt-2">
                        <button
                          onClick={handleCopyRegular}
                          disabled={copied}
                          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
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
                    className="space-y-4"
                  >
                    <SectionHeader
                      title="Priority Account Details"
                      isPriority={true}
                      icon={FiStar}
                    />

                    <div className="space-y-4">
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
                          accountData.priority_routing_no || // Fixed: use accountData.priority_routing_no
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
                      <div className="pt-2">
                        <button
                          onClick={handleCopyPriority}
                          disabled={copied}
                          className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
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
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-800 font-medium mb-1">
                        Account Comparison
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
                        <div className="space-y-1">
                          <p className="font-medium text-blue-700">
                            Regular Account:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Standard domestic transactions</li>
                            <li>Uses account number & routing code</li>
                            <li>Local currency only</li>
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-purple-700">
                            Priority Account:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>International transactions</li>
                            <li>Uses IBAN for global transfers</li>
                            <li>Multi-currency support</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 sticky bottom-0">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 flex items-center">
                      <FiInfo size={12} className="mr-1" />
                      Both account types are fully visible and interactive
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleCopyAll}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all flex items-center space-x-2 shadow-md hover:shadow-lg"
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
    </>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  accountData: PropTypes.shape({
    service_provider_id: PropTypes.number, // ADD THIS
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
    // Add priority fields
    priority_iban: PropTypes.string,
    priority_acc_no: PropTypes.string,
    priority_routing_no: PropTypes.string,
    priority_bank_name: PropTypes.string,
    priority_bank_address: PropTypes.string,
  }),
  onAccountAdded: PropTypes.func, // ADD THIS
};

export default Modal;