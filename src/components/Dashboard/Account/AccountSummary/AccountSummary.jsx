// src/components/Dashboard/Account/AccountSummary/AccountSummary.js - FIXED VERSION
import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
  useReducer,
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
import RingLoader from "react-spinners/RingLoader";

// Components
import Modal from "./Modal";
import TransactionDetails from "../Transaction/TransactionDetails";

// Redux - Import hooks from the same file
import {
  setSelectedAccount,
  setSelectedCurrency,
  setAccountDropdownOpen,
  selectAccountState,
  fetchAccountDetails,
  updateAccountBalance,
  clearSuccessfulFetch,
} from "./AccountSlice";

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

import { useBankLetter } from "../../../../page/BankLetter/hooks/useBankLetter";

// Custom hook for token synchronization
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

// Custom hook for auto-fetch with debouncing
const useAutoFetchAccounts = (customerId, authtoken) => {
  const dispatch = useDispatch();
  const [fetchTrigger, forceRefresh] = useReducer((x) => x + 1, 0);
  const fetchRef = useRef({
    hasAttempted: false,
    lastFetchTime: 0,
    cooldown: 5000,
  });

  const accountState = useSelector(selectAccountState);
  const { hasFetchedAccount, accountLoading, fetchAttempted } = accountState;

  const shouldFetch = useMemo(() => {
    if (accountLoading) return false;
    if (!customerId || !authtoken) return false;
    if (hasFetchedAccount && !fetchTrigger) return false;
    
    const now = Date.now();
    if (now - fetchRef.current.lastFetchTime < fetchRef.current.cooldown) {
      return false;
    }
    return true;
  }, [customerId, authtoken, hasFetchedAccount, accountLoading, fetchTrigger]);

  useEffect(() => {
    if (shouldFetch) {
      fetchRef.current.hasAttempted = true;
      fetchRef.current.lastFetchTime = Date.now();
      dispatch(
        fetchAccountDetails({
          customerId,
          authtoken,
          isRefresh: fetchTrigger > 0,
        })
      );
    }
  }, [shouldFetch, dispatch, customerId, authtoken, fetchTrigger]);

  const refreshAccounts = useCallback(() => {
    forceRefresh();
    if (customerId) {
      dispatch(clearSuccessfulFetch(customerId));
    }
  }, [dispatch, customerId]);

  return { refreshAccounts, isFetching: accountLoading };
};

// Memoized utility functions
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

// Animation variants
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

// Main Component
const AccountSummary = React.memo(({ textColor, onCurrencyChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerId } = useParams();
  const { navigateToBankLetter } = useBankLetter();

  useTokenSync();

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const [displayBalance, setDisplayBalance] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);

  const accountState = useSelector(selectAccountState);
  const {
    accounts,
    selectedAccount,
    selectedCurrency,
    accountLoading,
    balanceLoading,
    accountError,
    hasFetchedAccount,
    fetchAttempted,
  } = accountState;

  const authtoken = useSelector(selectAuthToken);
  const exporting = useSelector(selectExporting);
  const accountDetailsModal = useSelector(selectAccountDetailsModal);
  const accountDropdown = useSelector(
    (state) => state.account?.accountDropdownOpen || false
  );

  const { refreshAccounts, isFetching } = useAutoFetchAccounts(
    customerId,
    authtoken
  );
  const { formatCurrency, getFullFormattedAmount, getCurrencyName } =
    useCurrencyUtils();
  const config = usePartnerConfig(authtoken);

  const isRemittanceOnlyCustomer =
    localStorage.getItem("isRemittanceOnlyCustomer") === "Y";

  const safeAccounts = useMemo(() => {
    return Array.isArray(accounts) ? accounts : [];
  }, [accounts]);

  const hasAccounts = useMemo(() => {
    return safeAccounts.length > 0;
  }, [safeAccounts]);

  const headerColor = useMemo(
    () => config?.header_color || localStorage.getItem("header_color"),
    [config?.header_color]
  );

  const textColorFromConfig = useMemo(
    () => config?.text_color || localStorage.getItem("text_color") || textColor,
    [config?.text_color, textColor]
  );

  useEffect(() => {
    if (selectedAccount?.available_balance !== undefined) {
      const newBalance = parseFloat(selectedAccount.available_balance) || 0;
      setPreviousBalance(displayBalance);
      setDisplayBalance(newBalance);
    }
  }, [selectedAccount?.available_balance]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        accountDropdown
      ) {
        dispatch(setAccountDropdownOpen(false));
      }
    };

    if (accountDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [dispatch, accountDropdown]);

  const handleTransactionComplete = useCallback(
    async (shouldRefresh = false) => {
      if (shouldRefresh) {
        refreshAccounts();
      }
    },
    [refreshAccounts]
  );

  const handleDropdownToggle = useCallback(() => {
    dispatch(setAccountDropdownOpen(!accountDropdown));
  }, [dispatch, accountDropdown]);

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
    navigateToBankLetter(customerId);
  };

  const handleBalanceUpdate = useCallback(async () => {
    if (customerId && authtoken) {
      dispatch(updateAccountBalance({ customerId, authtoken }));
    }
  }, [customerId, authtoken, dispatch]);

  // Loading, Empty, and Error States
  
  // Check if we're currently loading
  const isLoading = accountLoading || (!hasFetchedAccount && !accountError);
  
  // Check if fetch is complete but no accounts
  const isEmpty = !accountLoading && hasFetchedAccount && !hasAccounts;
  
  // Check if there's an error
  const hasError = !accountLoading && accountError && !hasFetchedAccount;
  
  // Check if we should show account section (has accounts AND not remittance-only)
  const shouldShowAccountSection = hasAccounts && !isRemittanceOnlyCustomer;

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center w-full space-y-6">
        <div className="w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center items-center h-32">
            <RingLoader color="#3B82F6" size={40} />
          </div>
          <p className="text-gray-500 mt-4 font-medium">
            Please wait while we fetch your accounts...
          </p>
          <p className="text-gray-400 text-sm mt-2">
            This may take a few moments
          </p>
        </div>
      </div>
    );
  }

  // Render error state
  if (hasError) {
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

  // When fetch is complete but no accounts found - show ONLY transactions
  // No "No Accounts Found" message - just show transaction history directly
  if (isEmpty) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col justify-center items-center w-full space-y-6"
      >
        {/* No account banner - just show transaction history */}
        <motion.div
          variants={itemVariants}
          className="w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-y-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-6">
            <TransactionDetails
              customerId={customerId}
              selectedCurrencyCode="all"
              onTransactionComplete={handleTransactionComplete}
            />
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // MAIN RENDER (With accounts - Show both account section and transactions)
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col justify-center items-center w-full space-y-6"
    >
      {/* Main Account Card - Only show if NOT remittance-only AND has accounts */}
      {shouldShowAccountSection && (
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
                      animate={{ rotate: accountDropdown ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FiChevronDown className="text-gray-400 group-hover:text-gray-600" />
                    </motion.div>
                  </div>
                </motion.button>

                <AnimatePresence>
                  {accountDropdown && hasAccounts && (
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
                      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
                        <div className="text-sm font-semibold text-gray-700">
                          Available Accounts ({safeAccounts.length})
                        </div>
                      </div>

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
                              key={`${account.account_id || account.currency
                                }-${index}`}
                              onClick={() => handleAccountChange(account)}
                              className={`w-full p-3 hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 rounded-lg ${selectedAccount?.currency === account.currency
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
      )}

      {/* Transaction Details Section - Always shown when fetch is complete */}
      <motion.div
        variants={itemVariants}
        className="w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: hasAccounts ? 0.2 : 0 }}
      >
        <div className="p-6">
          <TransactionDetails
            customerId={customerId}
            selectedCurrencyCode={selectedCurrency || "all"}
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