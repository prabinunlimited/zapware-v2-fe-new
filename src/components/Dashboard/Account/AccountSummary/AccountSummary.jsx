import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiEye,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPiggyBank,
  FaUniversity,
  FaMoneyBillWave,
  FaChartLine,
} from "react-icons/fa";
import ClipLoader from "react-spinners/ClipLoader";

// Components
import Modal from "./Modal";
import TransactionDetails from "../Transaction/TransactionDetails";

// Redux - Import hooks from the same file
import {
  setSelectedAccount,
  setSelectedCurrency,
  setAccountDropdownOpen,
  selectAccounts,
  selectSelectedAccount,
  selectSelectedCurrency,
  selectAccountLoading,
  selectBalanceLoading,
  selectAccountError,
  selectHasFetchedAccount,
  selectAccountDropdown,
} from "./AccountSlice";

// Import hooks from separate file
import {
  useAccountData,
  useAccountSelection,
  useAccountBalance,
} from "./accountHooks";

// Import UI slice actions and selectors separately
import {
  openAccountDetailsModal,
  closeAccountDetailsModal,
  selectAccountDetailsModal,
} from "../../../../features/Auth/slices/uiSlice";

import {
  exportTransactionsToExcel,
  selectExporting,
} from "../../Account/Transaction/TransactionSlice";
import { usePartnerConfig } from "../../../../hooks/usePartnerConfig";

import { selectAuthToken } from "../../../../store/selectors";

import {
  extractErrorMessage,
  SafeErrorDisplay,
} from "../../../../utils/errorHandling";

// ✅ SAFE ARRAY UTILITIES
const safeArray = (data, fallback = []) => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (typeof data === "object" && !Array.isArray(data)) {
    if (data.accounts && Array.isArray(data.accounts)) return data.accounts;
    if (Object.keys(data).length > 0) return Object.values(data);
  }
  return fallback;
};

const safeMap = (array, callback, fallback = []) => {
  const safeArrayData = Array.isArray(array) ? array : [];
  return safeArrayData.map(callback);
};

// ✅ MEMOIZED UTILITY FUNCTIONS
const useCurrencyUtils = () => {
  const currencySymbols = useMemo(
    () => ({
      USD: "$",
      EUR: "€",
      GBP: "£",
      DKK: "kr",
      NOK: "kr",
      SEK: "kr",
      CHF: "CHF",
      CAD: "C$",
      AUD: "A$",
      JPY: "¥",
      CNY: "¥",
    }),
    []
  );

  const currencyNames = useMemo(
    () => ({
      USD: "US Dollar",
      EUR: "Euro",
      GBP: "British Pound",
      DKK: "Danish Krone",
      NOK: "Norwegian Krone",
      SEK: "Swedish Krona",
      CHF: "Swiss Franc",
      CAD: "Canadian Dollar",
      AUD: "Australian Dollar",
      JPY: "Japanese Yen",
      CNY: "Chinese Yuan",
    }),
    []
  );

  const formatCurrency = useCallback(
    (amount, currencyCode) => {
      const numericAmount = parseFloat(amount) || 0;
      const symbol = currencySymbols[currencyCode] || "";

      // For very large amounts, use compact notation
      if (numericAmount >= 1000000) {
        const millions = (numericAmount / 1000000).toFixed(2);
        return `${symbol}${millions}M`;
      } else if (numericAmount >= 10000) {
        const formatted = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numericAmount);
        return `${symbol}${formatted}`;
      } else {
        const formatted = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numericAmount);
        return `${symbol}${formatted}`;
      }
    },
    [currencySymbols]
  );

  const getFullFormattedAmount = useCallback(
    (amount, currencyCode) => {
      const numericAmount = parseFloat(amount) || 0;
      const symbol = currencySymbols[currencyCode] || "";

      return `${symbol}${new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount)}`;
    },
    [currencySymbols]
  );

  const getCurrencyName = useCallback(
    (currencyCode) => {
      return currencyNames[currencyCode] || currencyCode;
    },
    [currencyNames]
  );

  return {
    formatCurrency,
    getFullFormattedAmount,
    getCurrencyName,
  };
};

// ✅ TOKEN SYNCHRONIZATION HOOK
const useTokenSync = () => {
  const authtoken = useSelector(selectAuthToken);

  useEffect(() => {
    const localStorageToken = localStorage.getItem("authtoken");

    if (authtoken && localStorageToken && authtoken !== localStorageToken) {
      localStorage.setItem("authtoken", authtoken);
    }
  }, [authtoken]);
};

const AccountSummary = React.memo(({ textColor, onCurrencyChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerId } = useParams();

  // ✅ ALL HOOKS CALLED UNCONDITIONALLY AT TOP LEVEL
  useTokenSync();

  // Refs
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // State for balance animation
  const [displayBalance, setDisplayBalance] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);

  // Redux Selectors with safety checks - ALL CALLED UNCONDITIONALLY
  const accounts = useSelector(selectAccounts);
  const selectedAccount = useSelector(selectSelectedAccount);
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const accountLoading = useSelector(selectAccountLoading);
  const balanceLoading = useSelector(selectBalanceLoading);
  const accountError = useSelector(selectAccountError);
  const exporting = useSelector(selectExporting);
  const accountDropdown = useSelector(selectAccountDropdown);
  const accountDetailsModal = useSelector(selectAccountDetailsModal);
  const authtoken = useSelector(selectAuthToken);
  const bearertoken = useSelector(selectAuthToken);
  const hasFetchedAccount = useSelector(selectHasFetchedAccount);

  // ✅ USE CUSTOM HOOKS FROM ACCOUNT SLICE
  const { fetchAccountData } = useAccountData();
  const { setAccount, setCurrency, getAvailableCurrencies } =
    useAccountSelection();
  const { updateBalance, formatBalance } = useAccountBalance();

  // ✅ SAFE ACCOUNTS DATA - MEMOIZED
  const safeAccounts = useMemo(() => safeArray(accounts), [accounts]);
  const hasAccounts = safeAccounts.length > 0;

  // Hooks - ALL CALLED UNCONDITIONALLY
  const config = usePartnerConfig(authtoken);
  const { formatCurrency, getFullFormattedAmount, getCurrencyName } =
    useCurrencyUtils();

  // Memoized header and text colors
  const headerColor = useMemo(
    () => config?.header_color || localStorage.getItem("header_color"),
    [config?.header_color]
  );

  const textColorFromConfig = useMemo(
    () => config?.text_color || localStorage.getItem("text_color") || textColor,
    [config?.text_color, textColor]
  );

  // Balance animation effect - optimized
  useEffect(() => {
    if (selectedAccount?.available_balance !== undefined) {
      const newBalance = parseFloat(selectedAccount.available_balance) || 0;
      setPreviousBalance(displayBalance);
      setDisplayBalance(newBalance);
    }
  }, [selectedAccount?.available_balance]); // Remove displayBalance dependency

  // Close dropdown when clicking outside - optimized
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        accountDropdown.isOpen // Only run if dropdown is actually open
      ) {
        dispatch(setAccountDropdownOpen(false));
      }
    };

    // Only add listener if dropdown is open
    if (accountDropdown.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [dispatch, accountDropdown.isOpen]);

  // ✅ FIXED: Transaction completion handler - NO ACCOUNT REFRESH
  const handleTransactionComplete = useCallback(
    async (shouldRefresh = false) => {
      if (shouldRefresh) {
        // Only refresh if explicitly requested (e.g., after a new transaction)
        fetchAccountData(true); // Force refresh
      } else {
        // Just update the transaction data without refreshing accounts
      }
    },
    [fetchAccountData]
  );

  // ✅ OPTIMIZED HANDLERS WITH useCallback
  const handleDropdownToggle = useCallback(() => {
    dispatch(setAccountDropdownOpen(!accountDropdown.isOpen));
  }, [dispatch, accountDropdown.isOpen, safeAccounts.length]);

  const handleAccountChange = useCallback(
    (account) => {
      setAccount(account);
      const newCurrency = account.currency || "all";
      setCurrency(newCurrency);

      if (onCurrencyChange) {
        onCurrencyChange(newCurrency);
      }

      dispatch(setAccountDropdownOpen(false));
    },
    [setAccount, setCurrency, onCurrencyChange, dispatch]
  );

  const handleAccountDetailsClick = useCallback(() => {
    if (selectedAccount) {
      dispatch(openAccountDetailsModal(selectedAccount));
    }
  }, [dispatch, selectedAccount]);

  const handleCloseModal = useCallback(() => {
    dispatch(closeAccountDetailsModal());
  }, [dispatch]);

  const handleBankLetter = useCallback(() => {
    if (!customerId) {
      alert("Customer ID not found!");
      return;
    }

    navigate(`/bankletter/${customerId}`, {
      state: { accountData: selectedAccount },
    });
  }, [customerId, navigate, selectedAccount]);

  const handleExcelExport = useCallback(() => {
    if (customerId && bearertoken) {
      dispatch(exportTransactionsToExcel({ customerId, bearertoken }));
    }
  }, [customerId, bearertoken, dispatch]);

  const handleBalanceUpdate = useCallback(async () => {
    updateBalance();
  }, [updateBalance]);

  // Style helpers - memoized
  const getTextColorStyle = useCallback(() => {
    if (textColorFromConfig && textColorFromConfig.startsWith("text-")) {
      return { className: textColorFromConfig };
    } else if (textColorFromConfig && textColorFromConfig.startsWith("#")) {
      return { style: { color: textColorFromConfig } };
    }
    return {};
  }, [textColorFromConfig]);

  const getHeaderColorStyle = useCallback(() => {
    if (headerColor && headerColor.startsWith("bg-")) {
      return { className: headerColor };
    } else if (headerColor && headerColor.startsWith("#")) {
      return { style: { backgroundColor: headerColor } };
    }
    return { className: "bg-gradient-to-r from-blue-600 to-purple-600" };
  }, [headerColor]);

  const textColorProps = useMemo(
    () => getTextColorStyle(),
    [getTextColorStyle]
  );
  const headerColorProps = useMemo(
    () => getHeaderColorStyle(),
    [getHeaderColorStyle]
  );

  // Animation variants - memoized
  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    }),
    []
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: {
          duration: 0.5,
        },
      },
    }),
    []
  );

  const balanceVariants = useMemo(
    () => ({
      initial: { scale: 1 },
      update: {
        scale: [1, 1.05, 1],
        transition: {
          duration: 0.6,
          ease: "easeOut",
        },
      },
    }),
    []
  );

  // ✅ Show empty state if no accounts and not loading
  if (!hasAccounts && !accountLoading) {
    return (
      <div className="flex flex-col justify-center items-center w-full space-y-6">
        <div className="w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <FiCreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Accounts Found
          </h3>
          <p className="text-gray-500">Account data is being loaded...</p>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">
              Debug: No accounts in safeAccounts array
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIX: Safe error handling - AFTER all hooks
  if (accountError) {
    return (
      <SafeErrorDisplay
        error={accountError}
        className="text-red-500 text-center p-4"
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col justify-center items-center w-full space-y-6"
    >
      {/* Main Account Card */}
      <motion.div
        variants={itemVariants}
        className="w-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Account Selector */}
            <div className="relative flex-1 max-w-md">
              <motion.button
                ref={buttonRef}
                onClick={handleDropdownToggle}
                className="w-full p-4 rounded-xl bg-white border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={accountLoading}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedAccount?.flag_url ? (
                      <motion.img
                        src={selectedAccount.flag_url}
                        alt={`${selectedAccount.currency} flag`}
                        className="w-8 h-8 object-cover rounded-full shadow-sm"
                        whileHover={{ scale: 1.1 }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <FiCreditCard className="text-gray-500" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm text-gray-600 font-medium">
                        {selectedAccount
                          ? getCurrencyName(selectedAccount.currency)
                          : "Select Account"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedAccount
                          ? selectedAccount.currency
                          : "Choose your account"}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: accountDropdown.isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FiChevronDown className="text-gray-400 group-hover:text-gray-600" />
                  </motion.div>
                </div>
              </motion.button>

              <AnimatePresence>
                {accountDropdown.isOpen && hasAccounts && (
                  <motion.div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] overflow-y-auto"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      maxHeight: "320px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Fixed Header */}
                    <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
                      <div className="text-sm font-semibold text-gray-700">
                        Available Accounts ({safeAccounts.length})
                      </div>
                    </div>

                    {/* Scrollable Content */}
                    <div
                      ref={scrollContainerRef}
                      className="flex-1 overflow-y-auto custom-scrollbar"
                      style={{
                        maxHeight: "250px",
                      }}
                    >
                      <div className="p-2">
                        {safeMap(safeAccounts, (account, index) => (
                          <motion.button
                            key={`${account.currency}-${index}`}
                            onClick={() => handleAccountChange(account)}
                            className={`w-full p-3 hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 rounded-lg ${
                              selectedAccount?.currency === account.currency
                                ? "bg-blue-50 border-blue-200"
                                : ""
                            }`}
                            whileHover={{
                              x: 4,
                              backgroundColor: "rgba(59, 130, 246, 0.05)",
                            }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="flex items-center gap-3">
                              {account.flag_url && (
                                <img
                                  src={account.flag_url}
                                  alt={`${account.currency} flag`}
                                  className="w-6 h-6 object-cover rounded-full flex-shrink-0"
                                />
                              )}
                              <div className="text-left flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {getCurrencyName(account.currency)}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-700 ml-2 flex-shrink-0">
                                    {formatCurrency(
                                      account.available_balance,
                                      account.currency
                                    )}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <p className="text-xs text-gray-500">
                                    {account.currency}
                                  </p>
                                  <p
                                    className="text-xs text-gray-400 truncate ml-2 max-w-[120px]"
                                    title={getFullFormattedAmount(
                                      account.available_balance,
                                      account.currency
                                    )}
                                  >
                                    {getFullFormattedAmount(
                                      account.available_balance,
                                      account.currency
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Optional: Scroll indicator */}
                    {safeAccounts.length > 5 && (
                      <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-4 py-2">
                        <div className="text-xs text-gray-500 text-center">
                          Scroll for more accounts
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Balance Display */}
            <motion.div
              variants={balanceVariants}
              animate="update"
              key={displayBalance}
              className="text-center lg:text-right min-w-0"
            >
              <p className="text-sm text-gray-600 font-medium mb-1">
                Available Balance
              </p>
              <motion.div
                className="text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-all"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                title={
                  selectedAccount
                    ? getFullFormattedAmount(
                        displayBalance,
                        selectedAccount.currency
                      )
                    : ""
                }
              >
                {selectedAccount
                  ? formatCurrency(displayBalance, selectedAccount.currency)
                  : "—"}
              </motion.div>
              {selectedAccount && (
                <div className="flex flex-col items-center lg:items-end mt-2">
                  <p className="text-sm text-gray-500">
                    {getCurrencyName(selectedAccount.currency)}
                  </p>
                  <p
                    className="text-xs text-gray-400 mt-1"
                    title={getFullFormattedAmount(
                      displayBalance,
                      selectedAccount.currency
                    )}
                  >
                    {getFullFormattedAmount(
                      displayBalance,
                      selectedAccount.currency
                    )}
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="w-full">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4" />
                Account Actions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Account Details */}
                <motion.button
                  onClick={handleAccountDetailsClick}
                  className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-start space-x-3 w-full"
                  disabled={!selectedAccount}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                    <FiEye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      Account Details
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      View account information
                    </p>
                  </div>
                </motion.button>

                {/* Bank Letter */}
                <motion.button
                  onClick={handleBankLetter}
                  className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-start space-x-3 w-full"
                  disabled={!selectedAccount}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors flex-shrink-0">
                    <FaUniversity className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      Bank Letter
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Generate bank document
                    </p>
                  </div>
                </motion.button>

                {/* Export Excel */}
                <motion.button
                  onClick={handleExcelExport}
                  className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-start space-x-3 w-full"
                  disabled={exporting}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors flex-shrink-0">
                    {exporting ? (
                      <ClipLoader color="#9333EA" size={16} />
                    ) : (
                      <FiDownload className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {exporting ? "Exporting..." : "Export Excel"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Download transactions
                    </p>
                  </div>
                </motion.button>

                {/* Update Balance (Conditional) */}
                {customerId && Number(customerId) === 167 && (
                  <motion.button
                    onClick={handleBalanceUpdate}
                    className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-start space-x-3 w-full"
                    disabled={balanceLoading}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors flex-shrink-0">
                      {balanceLoading ? (
                        <ClipLoader color="#EA580C" size={16} />
                      ) : (
                        <FiRefreshCw className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {balanceLoading ? "Updating..." : "Update Balance"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Refresh account balance
                      </p>
                    </div>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Transaction Details Section */}
      <motion.div
        variants={itemVariants}
        className="w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <FaChartLine className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Transaction History
            </h2>
          </div>

          {accountLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-center">
                <ClipLoader color="#3B82F6" size={40} />
                <p className="text-gray-500 mt-2">Loading transactions...</p>
              </div>
            </div>
          ) : (
            <TransactionDetails
              customerId={customerId}
              selectedCurrencyCode={selectedCurrency}
              onTransactionComplete={handleTransactionComplete}
              // Removed key prop to prevent unnecessary remounts
            />
          )}
        </div>
      </motion.div>

      {/* Account Details Modal */}
      <AnimatePresence>
        {accountDetailsModal.isOpen && accountDetailsModal.data && (
          <Modal
            isOpen={accountDetailsModal.isOpen}
            onClose={handleCloseModal}
            accountData={accountDetailsModal.data}
          />
        )}
      </AnimatePresence>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </motion.div>
  );
});

AccountSummary.displayName = "AccountSummary";

export default AccountSummary;