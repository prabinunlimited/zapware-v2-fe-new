// src/page/Deposit/DepositPage.jsx - COMPLETE FIXED VERSION WITH ADYEN INTEGRATION & LARGER UI
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { FaCheck, FaUniversity, FaTimes, FaCreditCard } from "react-icons/fa";
import { RingLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";

// Hooks
import { useDeposit } from "./hooks/useDeposit";
import { useCurrency } from "./hooks/useCurrency";
import { usePaymentMethods } from "./hooks/usePaymentMethods";
import { useBankAccounts } from "./hooks/useBankAccounts";
import { useUI } from "./hooks/useUI";
import { fetchManualAccountDetails } from "./slices/depositSlice";
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

// Import account selectors
import {
  selectAccounts,
  selectAccountLoading,
  selectAccountError,
} from "../../components/Dashboard/Account/AccountSummary/AccountSlice";

// Fixed useCurrency hook that uses existing Redux account data
const useFixedCurrency = (initialCurrency) => {
  // Get accounts and loading state from Redux (same data used in AccountSummary)
  const accounts = useSelector(selectAccounts);
  const accountLoading = useSelector(selectAccountLoading);
  const accountError = useSelector(selectAccountError);

  
  
  

  useEffect(() => {
    // Pre-check and ensure token is available before any API calls
    const ensureToken = async () => {
      

      const tokenInfo = tokenService.debugToken();
      

      if (!tokenInfo.exists) {
        
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
            
          } else {
            
          }
        } catch (error) {
          
        }
      } else {
        
      }
    };

    ensureToken();
  }, []);

  // Transform accounts to currencies format
  const currencies = useMemo(() => {
    if (accountLoading) {
      
      return [];
    }

    if (accountError) {
      
      return [];
    }

    const safeAccounts = Array.isArray(accounts) ? accounts : [];

    

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

      

      return currencyObj;
    });

    
     => c.currency_code).join(", ")
    );

    return transformed;
  }, [accounts, accountLoading, accountError]);

  // Handle initial currency selection
  useEffect(() => {
     => c.currency_code),
    });

    if (initialCurrency && currencies.length > 0) {
      const exists = currencies.some(
        (currency) => currency.currency_code === initialCurrency
      );
      

      if (exists) {
        
      } else {
        
      }
    } else if (currencies.length > 0) {
      
    } else {
      
    }
  }, [initialCurrency, currencies]);

  // Return the currency state
  const currencyState = useMemo(() => {
    const state = {
      currencies,
      loading: accountLoading,
      error: accountError,
    };

    

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
        (() => ),
      setPaymentMethod:
        result.setPaymentMethod ||
        (() => ),
      setAmount: result.setAmount || (() => ),
      setPurpose: result.setPurpose || (() => ),
      setSelectedBankAccount:
        result.setSelectedBankAccount ||
        (() => ),
      handleSubmit:
        result.handleSubmit ||
        ((e) => {
          e.preventDefault();
          
        }),
      resetTransaction:
        result.resetTransaction ||
        (() => ),
    };
  } catch (error) {
    
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
    
    return {
      loading: false,
      error: "Failed to load payment methods",
      methods: [],
    };
  }
};

// FIXED useSafeBankAccounts Hook - CORRECT VERSION
const useSafeBankAccounts = (selectedCurrency, paymentMethod) => {
  try {
    // ✅ CORRECT: Read from deposit slice, not bankAccounts slice
    const manualAccountDetails = useSelector(
      (state) => state.deposit?.manualAccountDetails
    );
    const manualDetailsLoading = useSelector(
      (state) => state.deposit?.manualDetailsLoading
    );
    const manualDetailsError = useSelector(
      (state) => state.deposit?.formErrors?.manualDetails || null
    );

    // Get other bank account data from the correct slices
    const usdBankAccounts = useSelector(
      (state) => state.bankAccounts?.usdBankAccounts || []
    );
    const usdAccountsLoading = useSelector(
      (state) => state.bankAccounts?.usdAccountsLoading || false
    );
    const usdAccountsError = useSelector(
      (state) => state.bankAccounts?.usdAccountsError || null
    );

    const aedAccountDetails = useSelector(
      (state) => state.bankAccounts?.aedAccountDetails || null
    );
    const aedDetailsError = useSelector(
      (state) => state.bankAccounts?.aedDetailsError || null
    );
    const aedDetailsLoading = useSelector(
      (state) => state.bankAccounts?.aedDetailsLoading || false
    );

    

    // ✅ ENHANCED: Clear data immediately on currency mismatch
    let filteredManualDetails = manualAccountDetails;

    if (
      filteredManualDetails &&
      filteredManualDetails.currency !== selectedCurrency
    ) {
      
      filteredManualDetails = null;
    }

    const safeResult = {
      usdBankAccounts,
      usdAccountsLoading,
      usdAccountsError,
      aedAccountDetails,
      aedDetailsError,
      aedDetailsLoading,

      // ✅ Use filtered manual details from CORRECT Redux slice
      manualAccountDetails: filteredManualDetails,
      manualDetailsLoading,
      manualDetailsError,
    };

    return safeResult;
  } catch (error) {
    
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
    <div className="text-center">
      <RingLoader
        color="#3B82F6"
        size={80}
        speedMultiplier={1}
        className="mx-auto mb-4"
      />
      <p className="text-gray-700 font-medium font-sans">
        Loading your accounts...
      </p>
      <p className="text-gray-500 text-sm mt-2 font-sans">
        Fetching your account information
      </p>
    </div>
  </div>
);

// Error State Component
const ErrorState = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
    <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg font-sans">
      <h2 className="text-xl font-bold text-red-600 mb-4 font-sans">
        Unable to Load Accounts
      </h2>
      <p className="text-gray-700 mb-4 font-sans">
        {error || "Failed to load your account information. Please try again."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans"
      >
        Try Again
      </button>
    </div>
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

      
      navigate("/card", { state: navigationState });
    } catch (error) {
      
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
  const fullReduxState = useSelector((state) => state); // ✅ Moved from useEffect

  // ✅ TAB STATE - Add this at the top with other hooks
  const [activeTab, setActiveTab] = useState("deposit"); // 'deposit' or 'bank-accounts'

  // Safe parameter access with debugging
  const customerId = params.customerId;
  const initialCurrency = params.currency;

  
  

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

  // Partner config
  const authtoken = localStorage.getItem("authtoken");
  const config = usePartnerConfig(authtoken);
  const headerColor =
    config?.header_color || localStorage.getItem("header_color");
  const textColor = config?.text_color || localStorage.getItem("text_color");

  // ✅ Safe useEffect without useSelector calls
  useEffect(() => {
    
    
    
    
    
    
    
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
     => c.currency_code),
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
        
      } else {
        // Fallback to first available currency
        currencyToSelect = currency.currencies[0]?.currency_code;
        
      }

      if (currencyToSelect && deposit.setSelectedCurrency) {
        
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
    

    // When currency changes and we're on manual deposit, ensure data reloads
    if (
      deposit.paymentMethod === "manual_deposit" &&
      deposit.selectedCurrency
    ) {
      

      // If we have manual details but they don't match, they'll be cleared by useSafeBankAccounts
      if (
        bankAccounts.manualAccountDetails &&
        bankAccounts.manualAccountDetails.currency !== deposit.selectedCurrency
      ) {
        
      }
    }
  }, [
    deposit.selectedCurrency,
    deposit.paymentMethod,
    bankAccounts.manualAccountDetails,
  ]);

  useEffect(() => {
    

    // Reset any manual deposit data if switching away from manual deposit
    if (deposit.paymentMethod !== "manual_deposit") {
      
    }
  }, [deposit.paymentMethod, deposit.selectedCurrency]);

  useEffect(() => {
    

    // Log currency-specific data
    if (
      deposit.paymentMethod === "manual_deposit" &&
      bankAccounts.manualAccountDetails
    ) {
      
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
      
      currency.currencies.forEach((curr, index) => {
        ,
        });
      });
    }
  }, [currency.currencies]);

  useEffect(() => {
    

    if (
      deposit.paymentMethod === "manual_deposit" &&
      deposit.selectedCurrency
    ) {
      

      // Dispatch the action to fetch manual details
      dispatch(fetchManualAccountDetails(deposit.selectedCurrency));
    }
  }, [deposit.paymentMethod, deposit.selectedCurrency, dispatch]);

  useEffect(() => {
    
    
    
    
    
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

  // ✅ CONDITIONAL RENDERING AFTER ALL HOOKS
  if (currency.loading) {
    return <LoadingState />;
  }

  if (currency.error) {
    return <ErrorState error={currency.error} />;
  }

  if (safeCurrencies.length === 0 && !currency.loading) {
    
    return <EmptyState navigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 font-sans">
      <ToastContainer position="top-right" autoClose={5000} />
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
                  
                  deposit.handleSubmit(e);
                }}
                className="px-8 py-8"
              >
                {/* ✅ UPDATED: Changed grid layout to use more columns for wider layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Currency Selection */}
                  {safeCurrencies.length > 0 ? (
                    <div className="lg:col-span-2">
                      <CurrencySelection
                        currencies={safeCurrencies}
                        selectedCurrency={safeSelectedCurrency}
                        onCurrencyChange={deposit.setSelectedCurrency}
                        loading={currency.loading}
                        error={deposit.formErrors.currency}
                      />
                    </div>
                  ) : (
                    <div className="lg:col-span-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-700 font-sans">
                        No currencies available. Please contact support.
                      </p>
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

                {/* Form Actions */}
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

                    {/* ✅ UPDATED: Show Card Payment button for card deposits */}
                    {isCardDeposit ? (
                      <CardPaymentHandler
                        deposit={deposit}
                        navigate={navigate}
                        customerId={customerId}
                        currency={currency}
                      />
                    ) : !isManualDeposit ? (
                      // Regular submit button for other non-manual deposits
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
              onCancel={ui.continueEditing}
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
