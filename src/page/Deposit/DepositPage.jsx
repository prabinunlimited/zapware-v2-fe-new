// src/page/Deposit/DepositPage.jsx - COMPLETE FIXED VERSION
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import {
  FaCheck,
  FaUniversity,
  FaTimes,
  FaCreditCard,
  FaExclamationTriangle,
} from "react-icons/fa";
import { RingLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";
import PaymentInitiation from "./components/PaymentInitiation/PaymentInitiation";

// Hooks
import { useDeposit } from "./hooks/useDeposit";
import { useCurrency } from "./hooks/useCurrency";
import { usePaymentMethods } from "./hooks/usePaymentMethods";
import { useBankAccounts } from "./hooks/useBankAccounts";
import { useUI } from "./hooks/useUI";

import Select from "react-select";
import { FaSearch, FaPlus } from "react-icons/fa";

// ✅ CORRECT: Import from depositSlice
import {
  fetchManualAccountDetails,
  setShowPaymentInitiation,
  selectShowPaymentInitiation,
} from "./slices/depositSlice";

// ✅ CORRECT: Import USD account actions and selectors from bankAccountSlice
import {
  fetchUSDBankAccounts,
  fetchManualBankDetails,
  selectUSDBankAccounts,
  selectUSDAccountsLoading,
  setUSDBankAccounts,
} from "./slices/bankAccountSlice";

// ✅ CORRECT: Import account selectors from AccountSlice (ONCE)
import {
  selectAccounts,
  selectAccountLoading,
  selectAccountError,
} from "../../components/Dashboard/Account/AccountSummary/AccountSlice";

import { tokenService } from "../../services/authService";

// Components
import StepIndicator from "./components/StepIndicator";
import CurrencySelection from "./components/CurrencySelection";
import PaymentMethodSelection from "./components/PaymentMethodSelection";
import DepositDetails from "./components/DepositDetails";
import USDBankDepositInfo from "./components/USDBankDepositInfo";
import ManualDepositInfo from "./components/ManualDepositInfo";
import SuccessPopup from "./components/SuccessPopup";
import CancelModal from "./components/CancelModal";
import ReceiptTemplate from "./components/ReceiptTemplate";
import ErrorBoundary from "../../components/ErrorBoundary/ErrorBoundary";

// Import BankLinkRedux component
import BankLink from "./components/BankLink";

// Shared
import { usePartnerConfig } from "../../hooks/usePartnerConfig";

// Fixed useCurrency hook that uses existing Redux account data
const useFixedCurrency = (initialCurrency) => {
  // Get accounts and loading state from Redux (same data used in AccountSummary)
  const accounts = useSelector(selectAccounts);
  const accountLoading = useSelector(selectAccountLoading);
  const accountError = useSelector(selectAccountError);

  console.log("🔍 useFixedCurrency - Raw accounts from Redux:", accounts);
  console.log("⏳ useFixedCurrency - Loading state:", accountLoading);
  console.log("❌ useFixedCurrency - Error state:", accountError);

  useEffect(() => {
    // Pre-check and ensure token is available before any API calls
    const ensureToken = async () => {
      console.log("🔐 Pre-checking token status...");

      const tokenInfo = tokenService.debugToken();
      console.log("📊 Token debug info:", tokenInfo);

      if (!tokenInfo.exists) {
        console.log("🔄 No token found, attempting to get partner token...");
        try {
          // ✅ SIMPLER: Use axios directly to get partner token
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/partner-login`,
            {
              client_id: "HK6V7709",
              client_secret: "057d433a-2d02-437b-a265-56114567aa44",
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 10000,
            }
          );

          if (response.data?.data?.token) {
            const newToken = response.data.data.token;
            tokenService.setToken(newToken);
            console.log("✅ Partner token obtained and stored");
          } else {
            console.error("❌ Failed to get partner token - invalid response");
          }
        } catch (error) {
          console.error("❌ Token pre-check failed:", error);
        }
      } else {
        console.log("✅ Token is available:", {
          isValid: tokenInfo.validation?.isValid,
          isJWT: tokenInfo.validation?.isJWT,
          isExpired: tokenInfo.validation?.isExpired,
        });
      }
    };

    ensureToken();
  }, []);

  // Transform accounts to currencies format
  const currencies = useMemo(() => {
    if (accountLoading) {
      console.log(
        "⏳ useFixedCurrency - Still loading accounts, returning empty array"
      );
      return [];
    }

    if (accountError) {
      console.log("❌ useFixedCurrency - Account error, returning empty array");
      return [];
    }

    const safeAccounts = Array.isArray(accounts) ? accounts : [];

    console.log(
      "🔄 useFixedCurrency - Transforming accounts to currencies. Account count:",
      safeAccounts.length
    );

    const transformed = safeAccounts.map((account, index) => {
      const currencyObj = {
        // Required fields for currency selection
        currency_code: account.currency,
        currency: account.currency,
        available_balance: account.available_balance || "0.00",
        account_name: account.account_name || `Account ${index + 1}`,
        account_number: account.account_number || "N/A",
        iban: account.iban || "N/A",
        flag_url: account.flag_url,
        account_id: account.account_id,

        // Include all original account properties for compatibility
        ...account,
      };

      console.log(`   Currency ${index + 1}:`, {
        currency_code: currencyObj.currency_code,
        currency: currencyObj.currency,
        balance: currencyObj.available_balance,
        account_name: currencyObj.account_name,
      });

      return currencyObj;
    });

    console.log(
      "✅ useFixedCurrency - Successfully transformed currencies:",
      transformed.length
    );
    console.log(
      "📋 Available currencies:",
      transformed.map((c) => c.currency_code).join(", ")
    );

    return transformed;
  }, [accounts, accountLoading, accountError]);

  // Handle initial currency selection
  useEffect(() => {
    console.log("🎯 useFixedCurrency - Initial currency effect:", {
      initialCurrency,
      currenciesCount: currencies.length,
      currencies: currencies.map((c) => c.currency_code),
    });

    if (
      initialCurrency &&
      currencies.length > 0 &&
      currencies.some((c) => c.currency_code === initialCurrency)
    ) {
      console.log(
        "✅ useFixedCurrency - Initial currency is available:",
        initialCurrency
      );
    } else if (currencies.length > 0) {
      console.log(
        "ℹ️ useFixedCurrency - No initial currency provided, but",
        currencies.length,
        "currencies available"
      );
    } else {
      console.log(
        "📭 useFixedCurrency - No currencies available for initial selection"
      );
    }
  }, [initialCurrency, currencies]);

  // Return the currency state
  const currencyState = useMemo(() => {
    const state = {
      currencies,
      loading: accountLoading,
      error: accountError,
    };

    console.log("📦 useFixedCurrency - Returning state:", {
      currenciesCount: state.currencies.length,
      loading: state.loading,
      error: state.error,
    });

    return state;
  }, [currencies, accountLoading, accountError]);

  return currencyState;
};

// Safe hook wrappers to prevent undefined errors
const useSafeCurrency = (initialCurrency) => {
  try {
    // Use the fixed currency hook instead of the original one
    const result = useFixedCurrency(initialCurrency);
    return {
      currencies: Array.isArray(result.currencies) ? result.currencies : [],
      loading: result.loading || false,
      error: result.error || null,
    };
  } catch (error) {
    console.error("Error in useCurrency hook:", error);
    return {
      currencies: [],
      loading: false,
      error: "Failed to load currencies",
    };
  }
};

const useSafeDeposit = () => {
  try {
    const result = useDeposit();

    // Enhanced safety check
    if (!result || typeof result !== "object") {
      console.warn("useDeposit returned invalid result:", result);
      return getDepositFallback();
    }

    return {
      selectedCurrency: result.selectedCurrency || "",
      paymentMethod: result.paymentMethod || "",
      amount: result.amount || "",
      purpose: result.purpose || "",
      selectedBankAccount: result.selectedBankAccount || null,
      formErrors: result.formErrors || {},
      isSubmitting: result.isSubmitting || false,
      transactionSuccess: result.transactionSuccess || null,
      activeStep: result.activeStep || 1,
      manualDetailsLoading: result.manualDetailsLoading || false,
      manualAccountDetails: result.manualAccountDetails || null,
      setSelectedCurrency:
        result.setSelectedCurrency ||
        (() => console.log("setSelectedCurrency called")),
      setPaymentMethod:
        result.setPaymentMethod ||
        (() => console.log("setPaymentMethod called")),
      setAmount: result.setAmount || (() => console.log("setAmount called")),
      setPurpose: result.setPurpose || (() => console.log("setPurpose called")),
      setSelectedBankAccount:
        result.setSelectedBankAccount ||
        (() => console.log("setSelectedBankAccount called")),
      handleSubmit:
        result.handleSubmit ||
        ((e) => {
          e.preventDefault();
          console.log("handleSubmit called");
        }),
      resetTransaction:
        result.resetTransaction ||
        (() => console.log("resetTransaction called")),
    };
  } catch (error) {
    console.error("Error in useDeposit hook:", error);
    return getDepositFallback();
  }
};

// Helper function for fallback
function getDepositFallback() {
  return {
    selectedCurrency: "",
    paymentMethod: "",
    amount: "",
    purpose: "",
    selectedBankAccount: null,
    formErrors: {},
    isSubmitting: false,
    transactionSuccess: null,
    activeStep: 1,
    manualDetailsLoading: false,
    manualAccountDetails: null,
    setSelectedCurrency: () => {},
    setPaymentMethod: () => {},
    setAmount: () => {},
    setPurpose: () => {},
    setSelectedBankAccount: () => {},
    handleSubmit: (e) => e.preventDefault(),
    resetTransaction: () => {},
  };
}

const useSafePaymentMethods = (selectedCurrency, currencies) => {
  try {
    const result = usePaymentMethods(selectedCurrency, currencies);
    return {
      loading: result.loading || false,
      error: result.error || null,
      methods: Array.isArray(result.methods) ? result.methods : [],
    };
  } catch (error) {
    console.error("Error in usePaymentMethods hook:", error);
    return {
      loading: false,
      error: "Failed to load payment methods",
      methods: [],
    };
  }
};

// FIXED useSafeBankAccounts Hook
const useSafeBankAccounts = (selectedCurrency, paymentMethod) => {
  try {
    const manualAccountDetails = useSelector(
      (state) => state.deposit?.manualAccountDetails
    );
    const manualDetailsLoading = useSelector(
      (state) => state.deposit?.manualDetailsLoading
    );
    const manualDetailsError = useSelector(
      (state) => state.deposit?.formErrors?.manualDetails || null
    );

    // ✅ CORRECTED: Use selectors from bankAccountSlice
    const usdBankAccounts = useSelector(selectUSDBankAccounts);
    const usdAccountsLoading = useSelector(selectUSDAccountsLoading);
    const usdAccountsError = useSelector(
      (state) => state.bankAccounts?.usdAccountsError || null
    );

    // ✅ ADD: Get bankLink accounts
    const bankLinkAccounts = useSelector(
      (state) => state.bankLink?.bankAccounts || []
    );
    const bankLinkLoading = useSelector(
      (state) => state.bankLink?.loading || false
    );
    const bankLinkError = useSelector((state) => state.bankLink?.error || null);

    const aedAccountDetails = useSelector(
      (state) => state.bankAccounts?.aedAccountDetails || null
    );
    const aedDetailsError = useSelector(
      (state) => state.bankAccounts?.aedDetailsError || null
    );
    const aedDetailsLoading = useSelector(
      (state) => state.bankAccounts?.aedDetailsLoading || false
    );

    // ✅ COMBINE: USD accounts from all sources
    const combinedUsdBankAccounts = useMemo(() => {
      const allAccounts = [...usdBankAccounts, ...bankLinkAccounts];

      // Filter for USD accounts and active accounts
      const usdAccounts = allAccounts.filter((account) => {
        const isUSD = account.currency === "USD" || !account.currency;
        const isActive = account.is_frozen !== 1 && account.status !== 1;
        const isNotDeleted = account.is_deleted !== 1;
        return isUSD && isActive && isNotDeleted;
      });

      // Remove duplicates by account number
      const uniqueAccounts = usdAccounts.filter(
        (account, index, self) =>
          index ===
          self.findIndex((a) => a.account_number === account.account_number)
      );

      console.log("🔍 COMBINED USD ACCOUNTS DEBUG:", {
        bankAccountsCount: usdBankAccounts.length,
        bankLinkCount: bankLinkAccounts.length,
        combinedCount: uniqueAccounts.length,
        accounts: uniqueAccounts.map((acc) => ({
          id: acc.id,
          account_name: acc.account_name,
          bank: acc.bank || acc.provider,
          currency: acc.currency,
          account_number: acc.account_number,
          is_frozen: acc.is_frozen,
          status: acc.status,
          is_deleted: acc.is_deleted,
          source: acc.source || "unknown",
        })),
      });

      return uniqueAccounts;
    }, [usdBankAccounts, bankLinkAccounts]);

    let filteredManualDetails = manualAccountDetails;

    if (
      filteredManualDetails &&
      filteredManualDetails.currency !== selectedCurrency
    ) {
      filteredManualDetails = null;
    }

    const safeResult = {
      usdBankAccounts: combinedUsdBankAccounts, // ✅ Use combined accounts
      usdAccountsLoading: usdAccountsLoading || bankLinkLoading,
      usdAccountsError: usdAccountsError || bankLinkError,
      aedAccountDetails,
      aedDetailsError,
      aedDetailsLoading,
      manualAccountDetails: filteredManualDetails,
      manualDetailsLoading,
      manualDetailsError,
    };

    return safeResult;
  } catch (error) {
    console.error("Error in useBankAccounts hook:", error);
    return {
      usdBankAccounts: [],
      usdAccountsLoading: false,
      usdAccountsError: "Failed to load bank accounts",
      aedAccountDetails: null,
      aedDetailsError: null,
      aedDetailsLoading: false,
      manualAccountDetails: null,
      manualDetailsLoading: false,
      manualDetailsError: null,
    };
  }
};

// Debug Panel Component
const DebugPanel = () => {
  const fullState = useSelector((state) => state);
  const params = useParams();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-md opacity-90 font-sans">
      <div>
        <strong>Debug Panel</strong>
      </div>
      <div>
        Route: {params.customerId} / {params.currency}
      </div>
      <div>Redux Slices: {Object.keys(fullState).join(", ")}</div>
    </div>
  );
};

// Loading State Component
const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="relative">
        <RingLoader
          color="#3B82F6"
          size={80}
          speedMultiplier={1}
          className="mx-auto mb-4"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-blue-200 border-t-blue-500 rounded-full"
        />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-700 font-medium text-lg mb-2"
      >
        Loading your accounts
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-500 text-sm"
      >
        Preparing your deposit experience...
      </motion.p>
    </motion.div>
  </div>
);

// Error State Component
const ErrorState = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl"
    >
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaExclamationTriangle className="text-red-500 text-2xl" />
      </div>
      <h2 className="text-xl font-bold text-red-600 mb-3">
        Unable to Load Accounts
      </h2>
      <p className="text-gray-700 mb-6 leading-relaxed">
        {error ||
          "We encountered an issue while loading your account information."}
      </p>
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </motion.div>
  </div>
);

// Empty State Component
const EmptyState = ({ navigate }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
    <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg font-sans">
      <h2 className="text-xl font-bold text-yellow-600 mb-4 font-sans">
        No Accounts Available for Deposits
      </h2>
      <p className="text-gray-700 mb-4 font-sans">
        You don't have any accounts set up for deposits. Please contact support
        to set up your accounts.
      </p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
        <p className="text-sm text-yellow-700 font-sans">
          If you just created an account, it may take a few moments to appear.
        </p>
      </div>
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans"
      >
        Back to Dashboard
      </button>
    </div>
  </div>
);

const CardPaymentHandler = ({ deposit, navigate, customerId }) => {
  const handleCardPayment = async () => {
    try {
      // ✅ SIMPLE: Direct navigation like original code
      const navigationState = {
        customerId: customerId,
        amount: parseFloat(deposit.amount),
        currency: deposit.selectedCurrency,
      };

      console.log("🚀 Navigating to card payment:", navigationState);
      navigate("/card", { state: navigationState });
    } catch (error) {
      console.error("❌ Error initiating card payment:", error);
      toast.error("Failed to initiate card payment. Please try again.");
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleCardPayment}
      disabled={!deposit.amount || deposit.isSubmitting}
      className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all font-sans"
    >
      <FaCreditCard className="mr-2" />
      Pay with Card
    </motion.button>
  );
};

// Main component content without error boundary
const DepositPageContent = () => {
  // ✅ ALL HOOKS AT THE TOP - BEFORE ANY CONDITIONALS
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fullReduxState = useSelector((state) => state);

  // ✅ TAB STATE
  const [activeTab, setActiveTab] = useState("deposit");

  // Safe parameter access with debugging
  const customerId = params.customerId;
  const initialCurrency = params.currency;

  console.log("🔍 ROUTE PARAMETERS:", { params, customerId, initialCurrency });
  console.log("🔍 FULL REDUX STATE STRUCTURE:", fullReduxState);

  // Custom hooks with safe access
  const deposit = useSafeDeposit();
  const currency = useSafeCurrency(initialCurrency);
  const paymentMethods = useSafePaymentMethods(
    deposit.selectedCurrency,
    currency.currencies
  );
  const bankAccounts = useSafeBankAccounts(
    deposit.selectedCurrency,
    deposit.paymentMethod
  );
  const ui = useUI();

  // ✅ CORRECT: USD Account Selectors from bankAccountSlice
  const allUsdBankAccounts = useSelector(selectUSDBankAccounts);
  const usdAccountsLoading = useSelector(selectUSDAccountsLoading);
  const bankLinkAccounts = useSelector(
    (state) => state.bankLink?.bankAccounts || []
  );

  const showPaymentInitiation = useSelector(selectShowPaymentInitiation);

  // ✅ ADD: Sync state
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Partner config
  const authtoken = localStorage.getItem("authtoken");
  const config = usePartnerConfig(authtoken);
  const headerColor =
    config?.header_color || localStorage.getItem("header_color");
  const textColor = config?.text_color || localStorage.getItem("text_color");

  // ✅ ADD: Combined USD accounts sync function
  const syncCombinedUSDAccounts = useCallback(async () => {
    try {
      setSyncInProgress(true);
      console.log("🔄 Syncing combined USD accounts...");

      // Fetch from both sources
      const [plaidAccounts, manualAccounts] = await Promise.all([
        dispatch(fetchUSDBankAccounts())
          .unwrap()
          .catch(() => []),
        dispatch(fetchManualBankDetails())
          .unwrap()
          .catch(() => []),
      ]);

      // Combine and filter accounts
      const allAccounts = [
        ...plaidAccounts,
        ...manualAccounts,
        ...bankLinkAccounts,
      ];

      const uniqueAccounts = allAccounts.filter(
        (account, index, self) =>
          index ===
          self.findIndex((a) => a.account_number === account.account_number)
      );

      console.log("✅ Combined USD accounts:", uniqueAccounts.length);

      // Update the state with combined accounts
      dispatch(setUSDBankAccounts(uniqueAccounts));
    } catch (error) {
      console.error("❌ Failed to sync USD accounts:", error);
    } finally {
      setSyncInProgress(false);
    }
  }, [dispatch, bankLinkAccounts]);

  // ✅ ADD: Auto-sync when component mounts
  useEffect(() => {
    console.log("🔄 Component mounted, syncing combined USD accounts");
    syncCombinedUSDAccounts();
  }, [syncCombinedUSDAccounts]);

  // ✅ FIXED: Auto-fetch based on payment method - Only for USD with correct methods
  useEffect(() => {
    console.log("🔄 Payment method change detected:", {
      paymentMethod: deposit.paymentMethod,
      selectedCurrency: deposit.selectedCurrency,
      shouldFetchUSDPlaid:
        deposit.selectedCurrency === "USD" &&
        deposit.paymentMethod === "bank_deposit",
      shouldFetchUSDManual:
        deposit.selectedCurrency === "USD" &&
        deposit.paymentMethod === "manual_deposit",
      shouldInitiateOpenBanking:
        (deposit.selectedCurrency === "EUR" ||
          deposit.selectedCurrency === "GBP" ||
          deposit.selectedCurrency === "DKK") &&
        deposit.paymentMethod === "bank_transfer",
    });

    // ✅ FIXED: Only fetch USD accounts for USD bank_deposit (Sila/Plaid)
    if (
      deposit.selectedCurrency === "USD" &&
      deposit.paymentMethod === "bank_deposit"
    ) {
      console.log("🔄 Fetching Plaid-linked accounts for USD bank deposit");
      dispatch(fetchUSDBankAccounts());
    } else if (
      deposit.selectedCurrency === "USD" &&
      deposit.paymentMethod === "manual_deposit"
    ) {
      console.log("🔄 Fetching manual bank details for USD manual deposit");
      dispatch(fetchManualBankDetails());
    }

    // ✅ FIXED: For EUR/GBP/DKK bank_transfer, do NOT call Sila - this should trigger Open Banking
    if (
      (deposit.selectedCurrency === "EUR" ||
        deposit.selectedCurrency === "GBP" ||
        deposit.selectedCurrency === "DKK") &&
      deposit.paymentMethod === "bank_transfer"
    ) {
      console.log(
        "🎯 Open Banking Bank Transfer selected for:",
        deposit.selectedCurrency
      );
      // This will be handled by your PaymentInitiation component
      // Do NOT call Sila endpoints for Open Banking currencies
    }
  }, [deposit.paymentMethod, deposit.selectedCurrency, dispatch]);

  // ✅ ADD: Sync for bankLink data
  useEffect(() => {
    if (bankLinkAccounts.length > 0 && allUsdBankAccounts.length === 0) {
      console.log(
        "🔄 BankLink accounts available but no USD accounts, triggering sync"
      );
      syncCombinedUSDAccounts();
    }
  }, [
    bankLinkAccounts.length,
    allUsdBankAccounts.length,
    syncCombinedUSDAccounts,
  ]);

  // ✅ ADD: Debug logging for USD accounts
  useEffect(() => {
    console.log("🔍 USD ACCOUNTS STATE:", {
      accountsCount: allUsdBankAccounts.length,
      loading: usdAccountsLoading,
      syncInProgress: syncInProgress,
      accounts: allUsdBankAccounts.map((acc) => ({
        id: acc.id,
        name: acc.account_name,
        bank: acc.bank,
        currency: acc.currency,
        source: acc.source || "unknown",
      })),
    });
  }, [allUsdBankAccounts, usdAccountsLoading, syncInProgress]);

  // Safe useEffect without useSelector calls
  useEffect(() => {
    console.log("🔍 DEPOSIT PAGE DEBUG:");
    console.log("Route params:", { customerId, initialCurrency });
    console.log("Currency hook:", currency);
    console.log("Deposit hook:", deposit);
    console.log("Payment methods:", paymentMethods);
    console.log("Bank accounts:", bankAccounts);
    console.log("Full Redux state available:", !!fullReduxState);
  }, [
    customerId,
    initialCurrency,
    currency,
    deposit,
    paymentMethods,
    bankAccounts,
    fullReduxState,
  ]);

  // Fixed currency auto-selection
  useEffect(() => {
    console.log("🔄 CURRENCY AUTO-SELECTION:", {
      hasCurrencies: currency.currencies?.length > 0,
      currencies: currency.currencies?.map((c) => c.currency_code),
      selectedCurrency: deposit.selectedCurrency,
      initialCurrency,
    });

    if (
      currency.currencies &&
      currency.currencies.length > 0 &&
      !deposit.selectedCurrency
    ) {
      let currencyToSelect;

      // Try to use initial currency from URL if available and valid
      if (
        initialCurrency &&
        currency.currencies.some((c) => c.currency_code === initialCurrency)
      ) {
        currencyToSelect = initialCurrency;
        console.log("🎯 Using currency from URL params:", currencyToSelect);
      } else {
        // Fallback to first available currency
        currencyToSelect = currency.currencies[0]?.currency_code;
        console.log("🔄 Falling back to first currency:", currencyToSelect);
      }

      if (currencyToSelect && deposit.setSelectedCurrency) {
        console.log("✅ Setting selected currency:", currencyToSelect);
        deposit.setSelectedCurrency(currencyToSelect);
      }
    }
  }, [
    currency.currencies,
    deposit.selectedCurrency,
    deposit.setSelectedCurrency,
    initialCurrency,
  ]);

  // Critical Fixes for Manual Deposit Data
  useEffect(() => {
    console.log("🎯 CURRENCY CHANGE HANDLER:", {
      selectedCurrency: deposit.selectedCurrency,
      paymentMethod: deposit.paymentMethod,
      manualDetails: bankAccounts.manualAccountDetails,
    });

    // When currency changes and we're on manual deposit, ensure data reloads
    if (
      deposit.paymentMethod === "manual_deposit" &&
      deposit.selectedCurrency
    ) {
      console.log(
        `🔄 Manual deposit active for ${deposit.selectedCurrency}, ensuring data consistency`
      );

      // If we have manual details but they don't match, they'll be cleared by useSafeBankAccounts
      if (
        bankAccounts.manualAccountDetails &&
        bankAccounts.manualAccountDetails.currency !== deposit.selectedCurrency
      ) {
        console.warn("🔄 Clearing mismatched manual deposit data");
      }
    }
  }, [
    deposit.selectedCurrency,
    deposit.paymentMethod,
    bankAccounts.manualAccountDetails,
  ]);

  useEffect(() => {
    console.log("🔄 PAYMENT METHOD CHANGE:", {
      paymentMethod: deposit.paymentMethod,
      selectedCurrency: deposit.selectedCurrency,
    });

    // Reset any manual deposit data if switching away from manual deposit
    if (deposit.paymentMethod !== "manual_deposit") {
      console.log("🔄 Not manual deposit, manual data should be cleared");
    }
  }, [deposit.paymentMethod, deposit.selectedCurrency]);

  useEffect(() => {
    console.log("🔍 MANUAL DEPOSIT DATA FLOW:", {
      selectedCurrency: deposit.selectedCurrency,
      paymentMethod: deposit.paymentMethod,
      manualAccountDetails: bankAccounts.manualAccountDetails,
      manualDetailsLoading: bankAccounts.manualDetailsLoading,
      manualDetailsError: bankAccounts.manualDetailsError,
      manualDetailsCurrency: bankAccounts.manualAccountDetails?.currency,
      currenciesMatch:
        bankAccounts.manualAccountDetails?.currency ===
        deposit.selectedCurrency,
      shouldShowManual:
        deposit.paymentMethod === "manual_deposit" && deposit.selectedCurrency,
    });

    // Log currency-specific data
    if (
      deposit.paymentMethod === "manual_deposit" &&
      bankAccounts.manualAccountDetails
    ) {
      console.log("💰 MANUAL DEPOSIT ACCOUNT DATA:", {
        currency: bankAccounts.manualAccountDetails.currency,
        bankName: bankAccounts.manualAccountDetails.bank_name,
        accountNumber: bankAccounts.manualAccountDetails.account_number,
        iban: bankAccounts.manualAccountDetails.iban,
      });
    }
  }, [
    deposit.selectedCurrency,
    deposit.paymentMethod,
    bankAccounts.manualAccountDetails,
    bankAccounts.manualDetailsLoading,
    bankAccounts.manualDetailsError,
  ]);

  // Also add this to see the account data structure
  useEffect(() => {
    if (currency.currencies && currency.currencies.length > 0) {
      console.log("📋 CURRENCY DATA STRUCTURE:");
      currency.currencies.forEach((curr, index) => {
        console.log(`Currency ${index + 1}:`, {
          currency_code: curr.currency_code,
          currency: curr.currency,
          available_balance: curr.available_balance,
          account_number: curr.account_number,
          keys: Object.keys(curr),
        });
      });
    }
  }, [currency.currencies]);

  // useEffect(() => {
  //   console.log("🔄 PAYMENT METHOD TRIGGER - Manual deposit detection:", {
  //     paymentMethod: deposit.paymentMethod,
  //     selectedCurrency: deposit.selectedCurrency,
  //     shouldFetch:
  //       deposit.paymentMethod === "manual_deposit" && deposit.selectedCurrency,
  //   });

  //   if (
  //     deposit.paymentMethod === "manual_deposit" &&
  //     deposit.selectedCurrency
  //   ) {
  //     console.log(
  //       "🎯 Triggering manual account details fetch for:",
  //       deposit.selectedCurrency
  //     );

  //     // Dispatch the action to fetch manual details
  //     dispatch(fetchManualAccountDetails(deposit.selectedCurrency));
  //   }
  // }, [deposit.paymentMethod, deposit.selectedCurrency, dispatch]);

  useEffect(() => {
    console.log("🎯 CURRENCY SELECTION DEBUG:");
    console.log("Selected Currency:", deposit.selectedCurrency);
    console.log("Safe Selected Currency:", deposit.selectedCurrency);
    console.log(
      "Should show payment methods:",
      deposit.selectedCurrency && currency.currencies?.length > 0
    );
    console.log("Payment Methods hook state:", paymentMethods);
  }, [deposit.selectedCurrency, currency.currencies?.length, paymentMethods]);

  // Text color styling
  const getTextColorStyle = () => {
    if (textColor && textColor.startsWith("text-")) {
      return { className: textColor };
    } else if (textColor && textColor.startsWith("#")) {
      return { style: { color: textColor } };
    }
    return {};
  };

  const textColorProps = getTextColorStyle();

  // Header color styling
  const getHeaderColorStyle = () => {
    if (headerColor && headerColor.startsWith("bg-")) {
      return { className: headerColor };
    } else if (headerColor && headerColor.startsWith("#")) {
      return { style: { backgroundColor: headerColor } };
    }
    return { className: "bg-blue-600" };
  };

  const headerColorProps = getHeaderColorStyle();

  // Safe currency access
  const safeCurrencies = currency.currencies;
  const safeSelectedCurrency = deposit.selectedCurrency || "";

  // Check if card deposit is selected
  const isCardDeposit = deposit.paymentMethod === "card_deposit";
  const isManualDeposit = deposit.paymentMethod === "manual_deposit";
  const isBankDeposit = deposit.paymentMethod === "bank_deposit";
  const isBankTransfer = deposit.paymentMethod === "bank_transfer";

  // ✅ CONDITIONAL RENDERING AFTER ALL HOOKS
  if (currency.loading) {
    return <LoadingState />;
  }

  if (currency.error) {
    return (
      <ErrorState
        error={currency.error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (safeCurrencies.length === 0 && !currency.loading) {
    return <EmptyState navigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 font-sans">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        toastClassName="font-sans"
        progressClassName="bg-gradient-to-r from-blue-500 to-blue-600"
      />
      <PaymentInitiation
        selectedCurrency={deposit.selectedCurrency}
        amount={deposit.amount}
        purpose={deposit.purpose}
        paymentMethod={deposit.paymentMethod}
        selectedBankAccount={deposit.selectedBankAccount}
        // For deposits, we don't need beneficiary data
        selectedBeneficiaryBank={null}
        selectedBeneficiary={null}
        customerId={customerId}
        showPaymentInitiation={showPaymentInitiation}
        transactionType="deposit" // ✅ IMPORTANT: Set to "deposit"
        onClose={() => dispatch(setShowPaymentInitiation(false))}
        onSuccess={(result) => {
          console.log("Open Banking success:", result);
          if (result.success) {
            toast.success("Open Banking deposit initiated successfully!");

            // ✅ Reset the form
            deposit.resetTransaction();

            // ✅ Optional: Close the modal after success
            setTimeout(() => {
              dispatch(setShowPaymentInitiation(false));
            }, 2000);
          } else {
            toast.error(result.error || "Open Banking failed");
          }
        }}
      />
      <DebugPanel />
      <ReceiptTemplate
        transactionSuccess={deposit.transactionSuccess}
        amount={deposit.amount}
        selectedCurrency={safeSelectedCurrency}
        paymentMethod={deposit.paymentMethod}
        purpose={deposit.purpose}
      />

      {/* ✅ UPDATED: Changed max-w-6xl to max-w-7xl for larger UI */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ✅ UPDATED HEADER WITH TABS */}
        <div className="mb-8">
          <button
            onClick={ui.handleCancel}
            className="flex items-center mb-4 text-gray-600 hover:text-gray-800 transition-colors font-medium font-sans"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>

          {/* ✅ TAB NAVIGATION */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "deposit"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FaUniversity className="inline mr-2" />
                Make Deposit
              </button>
              <button
                onClick={() => setActiveTab("bank-accounts")}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bank-accounts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FaUniversity className="inline mr-2" />
                Bank Accounts
              </button>
            </nav>
          </div>

          {/* ✅ TAB CONTENT */}
          {activeTab === "deposit" ? (
            // Your existing deposit form content
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-sans">
                Deposit Funds
              </h1>
              <p className="text-gray-600 mt-2 font-sans" {...textColorProps}>
                Add money to your account using any of the available methods
              </p>
            </div>
          ) : (
            // Bank Accounts Management
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-sans">
                Bank Accounts
              </h1>
              <p className="text-gray-600 mt-2 font-sans" {...textColorProps}>
                Manage your linked bank accounts and payment methods
              </p>
            </div>
          )}
        </div>

        {/* ✅ MAIN CONTENT WITH TAB SWITCHING */}
        {activeTab === "deposit" ? (
          /* Your existing deposit form */
          <>
            {/* Step Indicator - Only show for deposit tab */}
            <StepIndicator
              activeStep={deposit.activeStep}
              headerColorProps={headerColorProps}
            />

            {/* ✅ UPDATED: Added wider container class for deposit form */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 w-full">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-medium text-gray-900 font-sans">
                  Deposit Details
                </h2>
              </div>

              <form
                onSubmit={(e) => {
                  console.log("🔍 Form onSubmit triggered");
                  deposit.handleSubmit(e);
                }}
                className="px-8 py-8"
              >
                {/* ✅ UPDATED: Changed grid layout to use more columns for wider layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Currency Selection */}
                  {safeCurrencies.length > 0 && (
                    <div className="lg:col-span-2">
                      <CurrencySelection
                        currencies={safeCurrencies}
                        selectedCurrency={safeSelectedCurrency}
                        onCurrencyChange={deposit.setSelectedCurrency}
                        loading={currency.loading}
                        error={deposit.formErrors.currency}
                      />
                    </div>
                  )}

                  {/* Payment Method Selection */}
                  {safeSelectedCurrency && safeCurrencies.length > 0 && (
                    <div className="lg:col-span-2">
                      <PaymentMethodSelection
                        selectedCurrency={safeSelectedCurrency}
                        paymentMethod={deposit.paymentMethod}
                        onPaymentMethodSelect={deposit.setPaymentMethod}
                        loading={paymentMethods.loading}
                        error={
                          deposit.formErrors.paymentMethod ||
                          paymentMethods.error
                        }
                        availableMethods={paymentMethods.methods}
                        config={config}
                        textColorProps={textColorProps}
                        showTooltip={ui.helpTooltips}
                        onTooltipShow={ui.handleTooltipShow}
                        onTooltipHide={ui.handleTooltipHide}
                      />
                    </div>
                  )}
                </div>

                {/* Amount and Purpose Fields */}
                {deposit.paymentMethod && !isManualDeposit && (
                  <div className="mb-8">
                    <DepositDetails
                      amount={deposit.amount}
                      onAmountChange={deposit.setAmount}
                      purpose={deposit.purpose}
                      onPurposeChange={deposit.setPurpose}
                      selectedCurrency={safeSelectedCurrency}
                      errors={deposit.formErrors}
                      isAmountFocused={ui.isAmountFocused}
                      onAmountFocus={ui.setIsAmountFocused}
                    />
                  </div>
                )}

                {/* USD Bank Deposit Info */}
                <div className="mb-8">
                  <USDBankDepositInfo
                    selectedCurrency={safeSelectedCurrency}
                    paymentMethod={deposit.paymentMethod}
                    selectedBankAccount={deposit.selectedBankAccount}
                    onBankAccountSelect={deposit.setSelectedBankAccount}
                    usdBankAccounts={bankAccounts.usdBankAccounts}
                    loading={bankAccounts.usdAccountsLoading}
                    error={bankAccounts.usdAccountsError}
                    formErrors={deposit.formErrors}
                    copiedField={ui.copiedField}
                    onCopy={ui.copyToClipboard}
                    showTooltip={ui.helpTooltips}
                    onTooltipShow={ui.handleTooltipShow}
                    onTooltipHide={ui.handleTooltipHide}
                    navigate={navigate}
                  />
                </div>

                {/* Manual Deposit Info */}
                <div className="mb-8">
                  <ManualDepositInfo
                    paymentMethod={deposit.paymentMethod}
                    selectedCurrency={safeSelectedCurrency}
                    manualDetailsLoading={bankAccounts.manualDetailsLoading}
                    manualAccountDetails={bankAccounts.manualAccountDetails}
                    manualDetailsError={bankAccounts.manualDetailsError}
                    copiedField={ui.copiedField}
                    onCopy={ui.copyToClipboard}
                    showTooltip={ui.helpTooltips}
                    onTooltipShow={ui.handleTooltipShow}
                    onTooltipHide={ui.handleTooltipHide}
                    textColorProps={textColorProps}
                  />
                </div>

                {/* Info Box */}
                {deposit.paymentMethod && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-8 rounded-lg font-sans"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiInfo className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-base text-blue-700 font-sans">
                          <strong>Note:</strong> Processing times may vary
                          depending on the payment method selected. Manual
                          deposits may take 1-3 business days to process.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ✅ UPDATED: FIXED FORM ACTIONS SECTION */}
                {deposit.paymentMethod && (
                  <div className="mt-10 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
                    <motion.button
                      type="button"
                      onClick={ui.handleCancel}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-4 border border-gray-300 rounded-xl shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all font-sans"
                    >
                      <FaTimes className="mr-3" />
                      Cancel
                    </motion.button>

                    {/* ✅ FIXED: Different buttons for different payment methods */}
                    {isCardDeposit ? (
                      <CardPaymentHandler
                        deposit={deposit}
                        navigate={navigate}
                        customerId={customerId}
                        currency={currency}
                      />
                    ) : // ✅ OPEN BANKING: Show "Open Banking" button for EUR/GBP/DKK
                    (deposit.selectedCurrency === "EUR" ||
                        deposit.selectedCurrency === "GBP" ||
                        deposit.selectedCurrency === "DKK") &&
                      deposit.paymentMethod === "bank_transfer" ? (
                      <motion.button
                        type="button" // Change to button type, not submit
                        onClick={() => {
                          // First validate the form
                          const errors = {};
                          if (
                            !deposit.amount ||
                            parseFloat(deposit.amount) <= 0
                          ) {
                            errors.amount = "Please enter a valid amount";
                          }
                          if (!deposit.purpose) {
                            errors.purpose =
                              "Please enter a purpose for this deposit";
                          }

                          // For Open Banking deposits, you might also need to check for selected bank account
                          // Uncomment if needed:
                          // if (!deposit.selectedBankAccount) {
                          //   errors.bankAccount = "Please select a bank account";
                          // }

                          if (Object.keys(errors).length > 0) {
                            // You need to make sure deposit.setFormErrors exists
                            if (deposit.setFormErrors) {
                              deposit.setFormErrors(errors);
                            }
                            toast.error("Please fill all required fields");
                            return;
                          }

                          // Then trigger Open Banking
                          console.log(
                            "🎯 Initiating Open Banking for:",
                            deposit.selectedCurrency
                          );
                          dispatch(setShowPaymentInitiation(true));
                        }}
                        disabled={deposit.isSubmitting}
                        whileHover={{ scale: deposit.isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: deposit.isSubmitting ? 1 : 0.98 }}
                        className="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all font-sans"
                      >
                        {deposit.isSubmitting ? (
                          <>
                            <RingLoader
                              color="#ffffff"
                              size={20}
                              speedMultiplier={1}
                              className="mr-3"
                            />
                            Initializing...
                          </>
                        ) : (
                          <>
                            <FaUniversity className="mr-3" />
                            Open Banking
                          </>
                        )}
                      </motion.button>
                    ) : // ✅ USD BANK DEPOSIT: Show Submit or Link Account button
                    deposit.selectedCurrency === "USD" &&
                      deposit.paymentMethod === "bank_deposit" ? (
                      deposit.selectedBankAccount ? (
                        <motion.button
                          type="submit"
                          disabled={deposit.isSubmitting}
                          whileHover={{
                            scale: deposit.isSubmitting ? 1 : 1.02,
                          }}
                          whileTap={{ scale: deposit.isSubmitting ? 1 : 0.98 }}
                          className="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all font-sans"
                        >
                          {deposit.isSubmitting ? (
                            <>
                              <RingLoader
                                color="#ffffff"
                                size={20}
                                speedMultiplier={1}
                                className="mr-3"
                              />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FaCheck className="mr-3" />
                              Submit Deposit
                            </>
                          )}
                        </motion.button>
                      ) : (
                        <motion.button
                          type="button"
                          onClick={() => navigate(`/linkbank/${customerId}`)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all font-sans"
                        >
                          <FaUniversity className="mr-3" />
                          Link Bank Account
                        </motion.button>
                      )
                    ) : // ✅ OTHER CURRENCIES/NON-USD METHODS: Show Submit button
                    deposit.selectedCurrency && deposit.paymentMethod ? (
                      <motion.button
                        type="submit"
                        disabled={deposit.isSubmitting}
                        whileHover={{ scale: deposit.isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: deposit.isSubmitting ? 1 : 0.98 }}
                        className="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all font-sans"
                      >
                        {deposit.isSubmitting ? (
                          <>
                            <RingLoader
                              color="#ffffff"
                              size={20}
                              speedMultiplier={1}
                              className="mr-3"
                            />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaCheck className="mr-3" />
                            Submit Deposit
                          </>
                        )}
                      </motion.button>
                    ) : null}
                  </div>
                )}
              </form>
            </div>

            {/* Back to Dashboard Button */}
            <div className="flex justify-center items-center mt-8">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-3 px-6 py-3 rounded-xl text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200 font-sans text-base"
              >
                ← Back to Dashboard
              </button>
            </div>
          </>
        ) : (
          /* ✅ Bank Accounts Management */
          <BankLink />
        )}

        {/* Success Modal */}
        <AnimatePresence>
          {deposit.transactionSuccess && (
            <SuccessPopup
              transaction={deposit.transactionSuccess}
              isManualDeposit={isManualDeposit}
              // ✅ These are now fallbacks since transactionSuccess has the data
              amount={deposit.amount}
              selectedCurrency={safeSelectedCurrency}
              onClose={deposit.resetTransaction}
              onDownload={ui.downloadReceipt}
            />
          )}
        </AnimatePresence>

        {/* Cancel Confirmation Modal */}
        <AnimatePresence>
          {ui.showCancelModal && (
            <CancelModal
              onConfirm={ui.confirmCancel}
              onCancel={() => ui.setShowCancelModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Main component wrapped with error boundary
const DepositPage = () => {
  return (
    <ErrorBoundary>
      <DepositPageContent />
    </ErrorBoundary>
  );
};

export default DepositPage;
