// src/components/Dashboard/Account/AccountSummary/AccountSummary.js - COMPLETE FIXED VERSION
import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiRefreshCw,
  FiEye,
  FiCreditCard,
  FiTrendingUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { FaUniversity } from "react-icons/fa";
import RingLoader from "react-spinners/RingLoader";

// Components
import Modal from "./Modal";
import TransactionDetails from "../Transaction/TransactionDetails";

// ✅ FIXED: Import all from HomeSlice
import {
  setSelectedAccount,
  setSelectedCurrency,
  setAccountDropdownOpen,
  fetchAccountDetails,
  updateAccountBalance,
  clearSuccessfulFetch,
  selectAccounts,
  selectSelectedAccount,
  selectSelectedCurrency,
  selectAccountLoading,
  selectBalanceLoading,
  selectLastUpdated,
  selectHasFetchedAccount,
  selectAccountError,
  selectAccountDropdownOpen,
} from "../../../../page/Home/HomeSlice";

// Import UI slice actions and selectors
import {
  openAccountDetailsModal,
  closeAccountDetailsModal,
  selectAccountDetailsModal,
} from "../../../../features/Auth/slices/uiSlice";

import { selectExporting } from "../../Account/Transaction/TransactionSlice";
import { usePartnerConfig } from "../../../../hooks/usePartnerConfig";

import { selectAuthToken } from "../../../../store/selectors";

import { useBankLetter } from "../../../../page/BankLetter/hooks/useBankLetter";

const useTokenSync = () => {
  const authtoken = useSelector(selectAuthToken);

  useEffect(() => {
    if (authtoken) {
      const localStorageToken = localStorage.getItem("authtoken");
      if (authtoken !== localStorageToken) {
        localStorage.setItem("authtoken", authtoken);
      }
    }
  }, [authtoken]);
};

// ✅ Helper function for error display
const SafeErrorDisplay = ({ error, className = "" }) => {
  const errorMessage =
    typeof error === "string"
      ? error
      : error?.message || "An unknown error occurred";

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{errorMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const useAutoFetchAccounts = (customerId, authtoken) => {
  const dispatch = useDispatch(); // ✅ Add this
  const accountLoading = useSelector(selectAccountLoading); // ✅ Add this

  const refreshAccounts = useCallback(() => {
    if (customerId && authtoken) {
      dispatch(fetchAccountDetails({ customerId, authtoken }));
    }
  }, [customerId, authtoken, dispatch]);

  return {
    refreshAccounts,
    isFetching: accountLoading,
    fetchAccounts: refreshAccounts,
  };
};

// ✅ Memoized utility functions
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
      AED: "د.إ",
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
      AED: "UAE Dirham",
    }),
    []
  );

  const formatCurrency = useCallback(
    (amount, currencyCode) => {
      const numericAmount = parseFloat(amount) || 0;
      const symbol = currencySymbols[currencyCode] || "";

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

// ✅ Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const balanceVariants = {
  initial: { scale: 1 },
  update: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// ✅ Main Component
const AccountSummary = React.memo(({ textColor, onCurrencyChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { navigateToBankLetter } = useBankLetter();

  // Get customerId from localStorage
  const customerId = localStorage.getItem("authcustomer_id");

  // ✅ All hooks called unconditionally at top
  useTokenSync();

  // Refs
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // State for balance animation
  const [displayBalance, setDisplayBalance] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [componentError, setComponentError] = useState(null);

  // ✅ Use HomeSlice selectors
  const accounts = useSelector(selectAccounts);
  const selectedAccount = useSelector(selectSelectedAccount);
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const accountLoading = useSelector(selectAccountLoading);
  const balanceLoading = useSelector(selectBalanceLoading);
  const accountError = useSelector(selectAccountError);
  const hasFetchedAccount = useSelector(selectHasFetchedAccount);
  const lastUpdated = useSelector(selectLastUpdated);
  const accountDropdownOpen = useSelector(selectAccountDropdownOpen);

  // ✅ Other selectors
  const authtoken = useSelector(selectAuthToken);
  const accountDetailsModal = useSelector(selectAccountDetailsModal);

  // ✅ Custom hooks
  const refreshAccounts = useCallback(() => {
    if (customerId && authtoken) {
      dispatch(fetchAccountDetails({ customerId, authtoken }));
    }
  }, [customerId, authtoken, dispatch]);
  const { formatCurrency, getFullFormattedAmount, getCurrencyName } =
    useCurrencyUtils();
  const config = usePartnerConfig(authtoken);

  // ✅ Debug log to verify data flow
  useEffect(() => {
    console.log("🔍 AccountSummary - HomeSlice State:", {
      accountsCount: accounts?.length || 0,
      hasFetchedAccount,
      accountLoading,
      selectedAccount,
      selectedCurrency,
      customerId,
      lastUpdated,
      balanceLoading,
    });
  }, [
    accounts,
    hasFetchedAccount,
    accountLoading,
    selectedAccount,
    selectedCurrency,
    customerId,
    lastUpdated,
    balanceLoading,
  ]);

  useEffect(() => {
    if (selectedCurrency) {
      localStorage.setItem("selectedCurrency", selectedCurrency);
      console.log(
        "💾 Saved selectedCurrency to localStorage:",
        selectedCurrency
      );
    }
  }, [selectedCurrency]);

  // ✅ Error boundary effect
  useEffect(() => {
    const handleError = (error) => {
      console.error("Global error caught:", error);
      setComponentError(error);
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  // ✅ Memoized computed values
  const safeAccounts = useMemo(() => {
    return Array.isArray(accounts) ? accounts : [];
  }, [accounts]);

  const hasAccounts = useMemo(() => {
    return safeAccounts.length > 0;
  }, [safeAccounts]);

  // ✅ Balance animation with cleanup
  useEffect(() => {
    if (selectedAccount?.available_balance !== undefined) {
      const newBalance = parseFloat(selectedAccount.available_balance) || 0;
      setPreviousBalance(displayBalance);
      setDisplayBalance(newBalance);
    }
  }, [selectedAccount?.available_balance]);

  // ✅ Close dropdown handler with cleanup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        accountDropdownOpen
      ) {
        dispatch(setAccountDropdownOpen(false));
      }
    };

    if (accountDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [dispatch, accountDropdownOpen]);

  // ✅ Event handlers with proper dependencies
  const handleTransactionComplete = useCallback(
    async (shouldRefresh = false) => {
      if (shouldRefresh) {
        refreshAccounts();
      }
    },
    [refreshAccounts]
  );

  const handleDropdownToggle = useCallback(() => {
    dispatch(setAccountDropdownOpen(!accountDropdownOpen));
  }, [dispatch, accountDropdownOpen]);

  const handleAccountChange = useCallback(
    (account) => {
      dispatch(setSelectedAccount(account));
      const newCurrency = account.currency || "all";
      dispatch(setSelectedCurrency(newCurrency));

      if (onCurrencyChange) {
        onCurrencyChange(newCurrency);
      }

      dispatch(setAccountDropdownOpen(false));
    },
    [dispatch, onCurrencyChange]
  );

  const handleAccountDetailsClick = useCallback(() => {
    if (selectedAccount) {
      dispatch(openAccountDetailsModal(selectedAccount));
    }
  }, [dispatch, selectedAccount]);

  const handleCloseModal = useCallback(() => {
    dispatch(closeAccountDetailsModal());
  }, [dispatch]);

  const handleBankLetter = () => {
    console.log("🔍 AccountSummary - handleBankLetter clicked:", {
      timestamp: new Date().toISOString(),
      customerId,
      selectedAccount,
      selectedAccountCurrency: selectedAccount?.currency,
      selectedAccountNumber: selectedAccount?.account_number,
      selectedCurrency, // This is the currently selected currency
      safeAccountsCount: safeAccounts.length,
      hasSelectedAccount: !!selectedAccount,
    });

    // Find the account that matches the currently selected currency
    const accountToUse =
      safeAccounts.find((account) => account.currency === selectedCurrency) ||
      selectedAccount;

    if (!accountToUse) {
      console.error("❌ AccountSummary: No selected account for bank letter!");

      if (safeAccounts.length > 0) {
        console.log(
          "🔄 AccountSummary: Using first available account:",
          safeAccounts[0]
        );

        navigate(`/bankletter/${customerId}`, {
          state: {
            accountData: safeAccounts[0],
            selectedCurrency: safeAccounts[0].currency, // Pass currency
            source: "AccountSummary-fallback",
          },
        });
        return;
      }

      alert("Please select an account first to generate a bank letter.");
      return;
    }

    console.log("✅ AccountSummary - Using account for bank letter:", {
      currency: accountToUse.currency,
      accountNumber: accountToUse.account_number,
      matchesSelectedCurrency: accountToUse.currency === selectedCurrency,
    });

    // Navigate with both account data AND selected currency
    navigate(`/bankletter/${customerId}`, {
      state: {
        accountData: accountToUse,
        selectedCurrency: selectedCurrency, // CRITICAL: Pass the selected currency
        source: "AccountSummary-direct",
      },
    });
  };

  const handleBalanceUpdate = useCallback(async () => {
    if (customerId && authtoken) {
      dispatch(updateAccountBalance({ customerId, authtoken }));
    }
  }, [customerId, authtoken, dispatch]);

  // ✅ Loading states
  const isLoading = useMemo(() => {
    return accountLoading && !hasFetchedAccount;
  }, [accountLoading, hasFetchedAccount]);

  const shouldShowEmptyState = useMemo(() => {
    return hasFetchedAccount && !accountLoading && !hasAccounts;
  }, [hasFetchedAccount, accountLoading, hasAccounts]);

  const shouldShowErrorState = useMemo(() => {
    return accountError && !hasFetchedAccount && !accountLoading;
  }, [accountError, hasFetchedAccount, accountLoading]);

  const shouldShowContent = useMemo(() => {
    return hasFetchedAccount && hasAccounts;
  }, [hasFetchedAccount, hasAccounts]);

  if (componentError) {
    return (
      <SafeErrorDisplay
        error={componentError}
        className="flex items-center justify-center min-h-screen p-4"
      />
    );
  }

  // ✅ Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center w-full space-y-6">
        <div className="w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center items-center h-32">
            <RingLoader color="#3B82F6" size={40} />
          </div>
          <p className="text-gray-500 mt-4">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  // ✅ Show empty state
  if (shouldShowEmptyState) {
    return (
      <div className="flex flex-col justify-center items-center w-full space-y-6">
        <div className="w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <FiCreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Accounts Found
          </h3>
          <p className="text-gray-500">You don't have any accounts yet.</p>
          <button
            onClick={refreshAccounts}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ Show error state
  if (shouldShowErrorState) {
    return (
      <div className="flex flex-col justify-center items-center w-full space-y-6">
        <div className="w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-lg font-semibold mb-4">
            Error Loading Accounts
          </div>
          <p className="text-gray-700 mb-4">{accountError}</p>
          <button
            onClick={refreshAccounts}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ✅ Don't render until we have content
  if (!shouldShowContent) {
    return (
      <div className="flex flex-col justify-center items-center w-full space-y-6">
        <div className="w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center items-center h-32">
            <RingLoader color="#3B82F6" size={40} />
          </div>
          <p className="text-gray-500 mt-4">Preparing your accounts...</p>
          <div className="mt-4 space-y-2">
            <button
              onClick={refreshAccounts}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Load Accounts Now
            </button>
            <div className="text-xs text-gray-500">
              Status: {hasFetchedAccount ? "Fetched" : "Not fetched"} |
              Accounts: {safeAccounts.length} | Loading:{" "}
              {accountLoading ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main render
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
                        {getCurrencyName(selectedAccount?.currency)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedAccount?.currency || "Choose your account"}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: accountDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FiChevronDown className="text-gray-400 group-hover:text-gray-600" />
                  </motion.div>
                </div>
              </motion.button>

              <AnimatePresence>
                {accountDropdownOpen && hasAccounts && (
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
                        {safeAccounts.map((account, index) => (
                          <motion.button
                            key={`${
                              account.account_id || account.currency
                            }-${index}`}
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
                {formatCurrency(displayBalance, selectedAccount?.currency)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                {/* Account Details */}
                <motion.button
                  onClick={handleAccountDetailsClick}
                  className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-start space-x-3 w-full min-w-[250px] sm:min-w-[300px]"
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
                  className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-start space-x-3 w-full min-w-[250px] sm:min-w-[300px]"
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
                        <RingLoader color="#EA580C" size={16} />
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
          <TransactionDetails
            customerId={customerId}
            selectedCurrencyCode={selectedCurrency}
            onTransactionComplete={handleTransactionComplete}
          />
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
    </motion.div>
  );
});

AccountSummary.displayName = "AccountSummary";

export default AccountSummary;