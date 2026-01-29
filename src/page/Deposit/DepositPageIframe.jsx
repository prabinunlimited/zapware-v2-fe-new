// src/page/Deposit/DepositPageIframe.jsx - COMPLETE FIXED VERSION
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
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
  FaSync,
} from "react-icons/fa";
import { RingLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";

// Import components
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
import BankLink from "./components/BankLink";

// Import hooks and utilities
import { usePartnerConfig } from "../../hooks/usePartnerConfig";

// Import Redux actions
import {
  setSelectedCurrency,
  setPaymentMethod,
  setAmount,
  setPurpose,
  setSelectedBankAccount,
  submitDeposit,
} from "./slices/depositSlice";

// ✅ CORRECT: Import from the bankLinkSlice
import {
  fetchBankAccounts,
  selectBankAccounts,
  selectLoading,
  selectError,
  selectIsRefreshing,
  refreshAccountsAfterSuccess,
} from "./slices/bankLinkSlice";

// ✅ FIXED: Simple hooks with memoization
const useSimpleCurrency = () => {
  return useMemo(
    () => ({
      currencies: [],
      loading: false,
      error: null,
    }),
    []
  );
};

const useSimpleDeposit = () => {
  const dispatch = useDispatch();

  // ✅ Use simple selector to avoid complex memoization issues
  const selectedCurrency = useSelector(
    (state) => state.deposit?.selectedCurrency || ""
  );
  const paymentMethod = useSelector(
    (state) => state.deposit?.paymentMethod || ""
  );
  const amount = useSelector((state) => state.deposit?.amount || "");
  const purpose = useSelector((state) => state.deposit?.purpose || "");
  const selectedBankAccount = useSelector(
    (state) => state.deposit?.selectedBankAccount || null
  );
  const formErrors = useSelector((state) => state.deposit?.formErrors || {});
  const isSubmitting = useSelector(
    (state) => state.deposit?.isSubmitting || false
  );
  const transactionSuccess = useSelector(
    (state) => state.deposit?.transactionSuccess || null
  );
  const activeStep = useSelector((state) => state.deposit?.activeStep || 1);
  const manualDetailsLoading = useSelector(
    (state) => state.deposit?.manualDetailsLoading || false
  );
  const manualAccountDetails = useSelector(
    (state) => state.deposit?.manualAccountDetails || null
  );

  // ✅ Memoize handleSubmit to prevent recreation
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const depositData = {
        amount: amount,
        currency: selectedCurrency,
        purpose: purpose,
        payment_method: paymentMethod,
        customerBankAccountId: selectedBankAccount,
      };

      try {
        await dispatch(submitDeposit(depositData)).unwrap();
        toast.success("Deposit submitted successfully!");
      } catch (error) {
        toast.error(error.message || "Failed to submit deposit");
      }
    },
    [
      amount,
      selectedCurrency,
      purpose,
      paymentMethod,
      selectedBankAccount,
      dispatch,
    ]
  );

  // ✅ Use individual callbacks instead of complex memoization
  const setSelectedCurrencyCallback = useCallback(
    (currency) => dispatch(setSelectedCurrency(currency)),
    [dispatch]
  );
  const setPaymentMethodCallback = useCallback(
    (method) => dispatch(setPaymentMethod(method)),
    [dispatch]
  );
  const setAmountCallback = useCallback(
    (amount) => dispatch(setAmount(amount)),
    [dispatch]
  );
  const setPurposeCallback = useCallback(
    (purpose) => dispatch(setPurpose(purpose)),
    [dispatch]
  );
  const setSelectedBankAccountCallback = useCallback(
    (account) => dispatch(setSelectedBankAccount(account)),
    [dispatch]
  );

  return {
    selectedCurrency,
    paymentMethod,
    amount,
    purpose,
    selectedBankAccount,
    formErrors,
    isSubmitting,
    transactionSuccess,
    activeStep,
    manualDetailsLoading,
    manualAccountDetails,

    setSelectedCurrency: setSelectedCurrencyCallback,
    setPaymentMethod: setPaymentMethodCallback,
    setAmount: setAmountCallback,
    setPurpose: setPurposeCallback,
    setSelectedBankAccount: setSelectedBankAccountCallback,

    handleSubmit,
    resetTransaction: useCallback(() => {
      // Reset logic here
    }, []),
  };
};

const useSimplePaymentMethods = () => {
  return useMemo(
    () => ({
      loading: false,
      error: null,
      methods: [],
    }),
    []
  );
};

// ✅ FIXED: Simplified bank accounts hook
const useSimpleBankAccounts = (customerId, authtoken) => {
  const dispatch = useDispatch();

  // ✅ Get bank accounts from Redux store (Sila API)
  const bankAccounts = useSelector(selectBankAccounts);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const isRefreshing = useSelector(selectIsRefreshing);

  const [manualAccountDetails, setManualAccountDetails] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState(null);

  // ✅ Memoize fetchUSDAccounts to prevent recreation
  const fetchUSDAccounts = useCallback(async () => {
    if (!customerId) {
      console.log("⚠️ No customerId provided for fetching Sila accounts");
      return;
    }

    try {
      console.log("🔍 Fetching Sila bank accounts for customer:", customerId);

      // ✅ Use the existing fetchBankAccounts action from bankLinkSlice
      await dispatch(fetchBankAccounts(customerId)).unwrap();

      console.log("✅ Sila bank accounts fetched successfully");
    } catch (err) {
      console.error("❌ Failed to fetch Sila bank accounts:", err);
      // Error is already handled by Redux slice
    }
  }, [customerId, dispatch]);

  // ✅ Memoize fetchManualDetails to prevent recreation
  const fetchManualDetails = useCallback(
    async (currency) => {
      if (!currency || !customerId || !authtoken) return;

      try {
        setManualLoading(true);
        setManualError(null);

        const response = await axios.get(
          `https://zapware.unlimitedremit.com/api/manual-bank-details/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${authtoken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.status === "success" && response.data.data) {
          const currencyDetails = response.data.data.find(
            (detail) => detail.currency === currency
          );

          if (currencyDetails) {
            setManualAccountDetails(currencyDetails);
          } else {
            setManualError(`No manual details found for ${currency}`);
          }
        } else {
          setManualError("Failed to load manual deposit details");
        }
      } catch (err) {
        console.error("Failed to fetch manual details:", err);
        setManualError(
          err.response?.data?.message || "Failed to load manual deposit details"
        );
      } finally {
        setManualLoading(false);
      }
    },
    [customerId, authtoken]
  );

  // Initial fetch of Sila accounts
  useEffect(() => {
    if (customerId) {
      fetchUSDAccounts();
    }
  }, [customerId, fetchUSDAccounts]);

  return {
    usdBankAccounts: bankAccounts,
    usdAccountsLoading: loading,
    usdAccountsError: error,
    aedAccountDetails: null,
    aedDetailsError: null,
    aedDetailsLoading: false,
    manualAccountDetails,
    manualDetailsLoading: manualLoading,
    manualDetailsError: manualError,
    fetchUSDAccounts,
    fetchManualDetails,
    isRefreshing,
  };
};

const useSimpleUI = () => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [helpTooltips, setHelpTooltips] = useState({});

  // ✅ Memoize all callback functions
  const handleCancel = useCallback(() => setShowCancelModal(true), []);
  const confirmCancel = useCallback(() => window.history.back(), []);

  const copyToClipboard = useCallback((text, field) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success("Copied to clipboard!");
    }
  }, []);

  const handleTooltipShow = useCallback((field) => {
    setHelpTooltips((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleTooltipHide = useCallback((field) => {
    setHelpTooltips((prev) => ({ ...prev, [field]: false }));
  }, []);

  const downloadReceipt = useCallback(() => {
    toast.info("Receipt download feature coming soon!");
  }, []);

  return {
    showCancelModal,
    setShowCancelModal,
    isAmountFocused,
    setIsAmountFocused,
    copiedField,
    setCopiedField,
    helpTooltips,
    handleCancel,
    confirmCancel,
    copyToClipboard,
    handleTooltipShow,
    handleTooltipHide,
    downloadReceipt,
  };
};

// ✅ FIXED: Create a custom hook for sendToParentWindow
const useParentWindowCommunication = () => {
  const sendToParentWindow = useCallback(
    (messageType, payload, customerId, uniqueReference) => {
      if (window.self !== window.top) {
        window.parent.postMessage(
          {
            type: messageType,
            payload: {
              ...payload,
              customerId,
              uniqueReference,
              timestamp: new Date().toISOString(),
            },
          },
          "*"
        );
      }
    },
    []
  );

  return sendToParentWindow;
};

// Main component
const DepositPageContent = () => {
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const pathParts = window.location.pathname.split("/");
  const depositIframeIndex = pathParts.indexOf("depositiframe");

  let customerId = null;
  let authtoken = null;
  let uniqueReference = null;
  let instructedAmount = null;

  if (depositIframeIndex !== -1) {
    // Get customerId (position 1 after depositiframe)
    if (pathParts.length > depositIframeIndex + 1) {
      customerId = pathParts[depositIframeIndex + 1];
    }

    // Get authtoken (position 2 after depositiframe)
    if (pathParts.length > depositIframeIndex + 2) {
      authtoken = pathParts[depositIframeIndex + 2];
    }

    // Get uniqueReference (position 3 after depositiframe)
    if (pathParts.length > depositIframeIndex + 3) {
      uniqueReference = pathParts[depositIframeIndex + 3];
    }

    // Get instructedAmount (position 4 after depositiframe)
    if (pathParts.length > depositIframeIndex + 4) {
      instructedAmount = pathParts[depositIframeIndex + 4];
    }
  }

  console.log("🔍 URL PARSING DEBUG:", {
    fullPath: window.location.pathname,
    pathParts,
    depositIframeIndex,
    extracted: {
      customerId,
      authtoken: authtoken ? `${authtoken.substring(0, 20)}...` : null,
      uniqueReference,
      instructedAmount,
    },
  });

  // State for pre-filled transaction data
  const [prefilledTransaction, setPrefilledTransaction] = useState(null);
  const [loadingTransaction, setLoadingTransaction] = useState(true);
  const [transactionError, setTransactionError] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState("deposit");
  const [formBeforeBankLink, setFormBeforeBankLink] = useState(null);
  const [shouldAutoSwitchToBankAccounts, setShouldAutoSwitchToBankAccounts] =
    useState(false);

  // ✅ Use ref to track if transaction details have been fetched
  const hasFetchedTransactionRef = useRef(false);

  // Simple hooks
  const deposit = useSimpleDeposit();
  const currency = useSimpleCurrency();
  const paymentMethods = useSimplePaymentMethods();
  const bankAccounts = useSimpleBankAccounts(customerId, authtoken);
  const ui = useSimpleUI();

  // ✅ Use the custom hook for parent window communication
  const sendToParentWindow = useParentWindowCommunication();

  // Partner config
  const config = usePartnerConfig(authtoken);
  const headerColor = config?.header_color || "bg-blue-600";
  const textColor = config?.text_color || "text-gray-800";

  // ✅ Set authtoken for API calls
  useEffect(() => {
    if (authtoken) {
      localStorage.setItem("authtoken", authtoken);
      console.log(
        "✅ iFrame authtoken set:",
        `${authtoken.substring(0, 20)}...`
      );
    }
  }, [authtoken]);

  // ✅ FIXED: Fetch transaction details on mount
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (hasFetchedTransactionRef.current) {
        return;
      }

      if (!uniqueReference || !authtoken) {
        console.warn("Missing uniqueReference or authtoken");
        setLoadingTransaction(false);
        return;
      }

      try {
        setLoadingTransaction(true);
        setTransactionError(null);

        console.log("🔍 Fetching transaction details:", {
          uniqueReference,
          customerId,
        });

        const response = await axios.get(
          `https://zapware.unlimitedremit.com/api/transactions/detail-by-unique-reference/${uniqueReference}`,
          {
            headers: {
              Authorization: `Bearer ${authtoken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = response.data;
        console.log("✅ Transaction details fetched:", data);

        if (data.status === "success" && data.data) {
          const transactionData = data.data;
          setPrefilledTransaction(transactionData);
          hasFetchedTransactionRef.current = true;

          // Auto-fill form with transaction data
          if (transactionData.currency_code) {
            deposit.setSelectedCurrency(transactionData.currency_code);
          }

          if (transactionData.payment_method) {
            deposit.setPaymentMethod(transactionData.payment_method);
          }

          if (instructedAmount) {
            deposit.setAmount(instructedAmount);
          } else if (transactionData.instructed_amount) {
            deposit.setAmount(transactionData.instructed_amount);
          }

          if (transactionData.customerBankAccountId) {
            deposit.setSelectedBankAccount(
              transactionData.customerBankAccountId
            );
          }
        } else {
          setTransactionError("Failed to load transaction details");
        }
      } catch (error) {
        console.error("❌ Error fetching transaction details:", error);
        setTransactionError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load transaction details"
        );
        toast.error(
          "Failed to load transaction details. Please check the URL."
        );
      } finally {
        setLoadingTransaction(false);
      }
    };

    fetchTransactionDetails();
  }, [uniqueReference, authtoken, instructedAmount]);

  // ✅ FIXED: Check if we need to auto-switch to bank accounts tab
  useEffect(() => {
    if (
      prefilledTransaction &&
      !loadingTransaction &&
      bankAccounts.usdBankAccounts
    ) {
      const { payment_method, currency_code, customerBankAccountId } =
        prefilledTransaction;

      // If USD bank deposit but no linked account, set flag to switch
      if (
        currency_code === "USD" &&
        payment_method === "bank_deposit" &&
        !customerBankAccountId &&
        bankAccounts.usdBankAccounts.length === 0
      ) {
        console.log("⚠️ No linked bank account for USD deposit");
        setShouldAutoSwitchToBankAccounts(true);

        toast.info("Please link a bank account to complete this deposit", {
          autoClose: 5000,
        });
      }
    }
  }, [prefilledTransaction, loadingTransaction, bankAccounts.usdBankAccounts]);

  // Auto-switch to bank accounts when needed
  useEffect(() => {
    if (shouldAutoSwitchToBankAccounts && activeTab === "deposit") {
      console.log("🔄 Auto-switching to bank accounts tab");
      setActiveTab("bank-accounts");
      setShouldAutoSwitchToBankAccounts(false);
    }
  }, [shouldAutoSwitchToBankAccounts, activeTab]);

  // ✅ Handle manual deposit data fetching
  useEffect(() => {
    if (
      deposit.paymentMethod === "manual_deposit" &&
      deposit.selectedCurrency
    ) {
      bankAccounts.fetchManualDetails(deposit.selectedCurrency);
    }
  }, [
    deposit.paymentMethod,
    deposit.selectedCurrency,
    bankAccounts.fetchManualDetails,
  ]);

  // ✅ Handle bank account selection from pre-filled transaction
  useEffect(() => {
    if (
      prefilledTransaction?.customerBankAccountId &&
      bankAccounts.usdBankAccounts.length > 0
    ) {
      const matchingAccount = bankAccounts.usdBankAccounts.find(
        (account) =>
          account.id === prefilledTransaction.customerBankAccountId ||
          account.account_id === prefilledTransaction.customerBankAccountId
      );

      if (matchingAccount) {
        const accountId = matchingAccount.id || matchingAccount.account_id;
        deposit.setSelectedBankAccount(accountId);
        console.log(
          "✅ Auto-selected bank account:",
          matchingAccount.account_name,
          "ID:",
          accountId
        );
      } else {
        console.warn(
          "Bank account not found in available accounts:",
          prefilledTransaction.customerBankAccountId
        );
      }
    }
  }, [
    prefilledTransaction,
    bankAccounts.usdBankAccounts,
    deposit.setSelectedBankAccount,
  ]);

  // Handle switching to bank accounts tab
  const handleSwitchToBankAccounts = useCallback(() => {
    console.log("🔄 Switching to bank accounts tab");

    // Save current form state (optional)
    setFormBeforeBankLink({
      selectedCurrency: deposit.selectedCurrency,
      paymentMethod: deposit.paymentMethod,
      amount: deposit.amount,
      purpose: deposit.purpose,
      selectedBankAccount: deposit.selectedBankAccount,
    });

    // Switch to bank accounts tab
    setActiveTab("bank-accounts");

    // Optional: Notify parent if in iframe
    if (window.self !== window.top) {
      sendToParentWindow(
        "SWITCHING_TO_BANK_ACCOUNTS",
        {
          action: "switch_to_bank_accounts",
          transactionData: prefilledTransaction,
        },
        customerId,
        uniqueReference
      );
    }
  }, [
    deposit.selectedCurrency,
    deposit.paymentMethod,
    deposit.amount,
    deposit.purpose,
    deposit.selectedBankAccount,
    prefilledTransaction,
    customerId,
    uniqueReference,
    sendToParentWindow,
  ]);

  // Handle account linked from BankLink component
  const handleAccountLinked = useCallback(
    (account) => {
      console.log("✅ Account linked:", account);

      // Get the account ID (could be id or account_id)
      const accountId = account.id || account.account_id;

      if (!accountId) {
        toast.error("Invalid account data received");
        return;
      }

      // Update local state with new account
      deposit.setSelectedBankAccount(accountId);

      // Notify parent window
      sendToParentWindow(
        "BANK_ACCOUNT_LINKED",
        {
          accountId: accountId,
          accountNumber: account.account_number,
          bankName: account.bank_name || account.provider || account.bank,
          currency: account.currency || "USD",
          action: "account_linked",
        },
        customerId,
        uniqueReference
      );

      // ✅ Trigger refresh of bank accounts list using Redux action
      dispatch(refreshAccountsAfterSuccess());

      // Switch back to deposit tab
      setActiveTab("deposit");

      // Restore form state if we saved it
      if (formBeforeBankLink) {
        deposit.setSelectedCurrency(formBeforeBankLink.selectedCurrency);
        deposit.setPaymentMethod(formBeforeBankLink.paymentMethod);
        deposit.setAmount(formBeforeBankLink.amount);
        deposit.setPurpose(formBeforeBankLink.purpose);
        setFormBeforeBankLink(null);
      }

      toast.success("Bank account linked successfully!");
    },
    [
      deposit,
      dispatch,
      formBeforeBankLink,
      customerId,
      uniqueReference,
      sendToParentWindow,
    ]
  );

  // Handle refresh bank accounts
  const handleRefreshAccounts = useCallback(() => {
    console.log("🔄 Manually refreshing bank accounts");
    bankAccounts.fetchUSDAccounts();
    toast.info("Refreshing bank accounts...");
  }, [bankAccounts.fetchUSDAccounts]);

  // Render pre-filled transaction info
  const renderPrefilledInfo = useCallback(() => {
    if (!prefilledTransaction || loadingTransaction) return null;

    const paymentMethodDisplay = () => {
      const method = prefilledTransaction.payment_method;
      if (method === "bank_deposit") return "Bank Deposit";
      if (method === "card_deposit") return "Card Payment";
      if (method === "manual_deposit") return "Manual Deposit";
      return method || "Not specified";
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <FiInfo className="text-blue-500 mr-2" />
            <h3 className="text-sm font-medium text-blue-800 font-sans">
              Pre-filled Transaction Details
            </h3>
          </div>
          {deposit.selectedCurrency === "USD" &&
            deposit.paymentMethod === "bank_deposit" && (
              <button
                onClick={handleRefreshAccounts}
                disabled={bankAccounts.isRefreshing}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <FaSync
                  className={`mr-1 ${
                    bankAccounts.isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh Accounts
              </button>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-600 font-sans">Currency:</span>
            <span className="ml-2 font-medium text-gray-800 font-sans">
              {prefilledTransaction.currency_code || "Not specified"}
            </span>
          </div>
          <div>
            <span className="text-gray-600 font-sans">Method:</span>
            <span className="ml-2 font-medium text-gray-800 font-sans">
              {paymentMethodDisplay()}
            </span>
          </div>
          <div>
            <span className="text-gray-600 font-sans">Amount:</span>
            <span className="ml-2 font-medium text-gray-800 font-sans">
              {deposit.amount || prefilledTransaction.instructed_amount
                ? `${prefilledTransaction.currency_code || ""} ${
                    deposit.amount || prefilledTransaction.instructed_amount
                  }`
                : "Not specified"}
            </span>
          </div>
          <div>
            <span className="text-gray-600 font-sans">Status:</span>
            <span className="ml-2 font-medium text-gray-800 font-sans">
              {prefilledTransaction.status || "Pending"}
            </span>
          </div>
        </div>

        {prefilledTransaction.id && (
          <div className="mt-2 text-xs text-gray-500 font-sans">
            Transaction ID: {prefilledTransaction.id} | Reference:{" "}
            {uniqueReference}
          </div>
        )}

        {/* ✅ Show bank account status */}
        {deposit.selectedCurrency === "USD" &&
          deposit.paymentMethod === "bank_deposit" && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-sans text-sm">
                  Linked Accounts:
                </span>
                <span
                  className={`text-sm font-medium ${
                    bankAccounts.usdBankAccounts.length > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {bankAccounts.usdBankAccounts.length} account(s) available
                </span>
              </div>
              {bankAccounts.usdAccountsError && (
                <div className="mt-1 text-red-600 text-xs">
                  Error: {bankAccounts.usdAccountsError}
                </div>
              )}
            </div>
          )}
      </motion.div>
    );
  }, [
    prefilledTransaction,
    loadingTransaction,
    deposit,
    bankAccounts,
    handleRefreshAccounts,
    uniqueReference,
  ]);

  // Determine if we need to show link account button
  const needsBankAccountLink = useCallback(() => {
    return (
      deposit.selectedCurrency === "USD" &&
      deposit.paymentMethod === "bank_deposit" &&
      !deposit.selectedBankAccount &&
      bankAccounts.usdBankAccounts.length === 0
    );
  }, [
    deposit.selectedCurrency,
    deposit.paymentMethod,
    deposit.selectedBankAccount,
    bankAccounts.usdBankAccounts,
  ]);

  // Handle card payment
  const handleCardPayment = useCallback(() => {
    if (window.location.hostname === "sandbox-ourzap.unlimitedremit.com") {
      alert(
        "Card Payment is currently available only on production environment!"
      );
      return false;
    }

    const state = {
      customerId: customerId,
      amount: deposit.amount,
      currency: deposit.selectedCurrency,
      uniqueReference: uniqueReference,
      authtoken: authtoken,
    };

    navigate("/cardiframe", { state: state });
  }, [
    customerId,
    deposit.amount,
    deposit.selectedCurrency,
    uniqueReference,
    authtoken,
    navigate,
  ]);

  // Handle back button
  const handleBackToDashboard = useCallback(() => {
    if (window.self !== window.top) {
      sendToParentWindow(
        "CLOSE_IFRAME_OR_NAVIGATE",
        {
          action: "back_to_dashboard",
          transactionId: prefilledTransaction?.id,
          status: "cancelled",
        },
        customerId,
        uniqueReference
      );
    } else {
      navigate(-1);
    }
  }, [
    prefilledTransaction,
    customerId,
    uniqueReference,
    navigate,
    sendToParentWindow,
  ]);

  // Loading state
  if (loadingTransaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="relative">
            <RingLoader
              color="#3B82F6"
              size={80}
              speedMultiplier={1}
              className="mx-auto mb-4"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            Loading Transaction Details...
          </h2>
          <p className="text-gray-600 mb-4">Customer ID: {customerId}</p>

          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-700 font-medium mb-2">
              <strong>URL Parameters:</strong>
            </p>
            <div className="text-left text-xs text-blue-600 space-y-1">
              <div>
                <span className="font-medium">Customer ID:</span> {customerId}
              </div>
              <div>
                <span className="font-medium">Reference:</span>{" "}
                {uniqueReference || "Not provided"}
              </div>
              <div>
                <span className="font-medium">Amount:</span>{" "}
                {instructedAmount || "Not provided"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (transactionError && !prefilledTransaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-3">
            Unable to Load Transaction
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            {transactionError}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have required data
  if (!prefilledTransaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-yellow-500 text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-yellow-600 mb-3">
            No Transaction Data
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Unable to load transaction details. Please check the URL or contact
            support.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine payment method display
  const isCardDeposit = deposit.paymentMethod === "card_deposit";
  const isManualDeposit = deposit.paymentMethod === "manual_deposit";
  const isBankDeposit = deposit.paymentMethod === "bank_deposit";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 font-sans">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        toastClassName="font-sans"
        progressClassName="bg-gradient-to-r from-blue-500 to-blue-600"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pre-filled Transaction Info */}
        {renderPrefilledInfo()}

        {/* Header with Tabs */}
        <div className="mb-8">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center mb-4 text-gray-600 hover:text-gray-800 transition-colors font-medium font-sans"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>

          {/* Tab Navigation */}
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
                Make Payment
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
                {needsBankAccountLink() && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                    Required
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content Header */}
          {activeTab === "deposit" ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-sans">
                Payment
              </h1>
              <p className="text-gray-600 mt-2 font-sans">
                {needsBankAccountLink()
                  ? "Link a bank account to complete this deposit"
                  : "Add money to your account using any of the available methods"}
              </p>
              {needsBankAccountLink() && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-sm font-sans">
                    <strong>Note:</strong> You need to link a bank account to
                    complete this USD bank deposit. Click the "Bank Accounts"
                    tab above to get started.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-sans">
                Bank Accounts
              </h1>
              <p className="text-gray-600 mt-2 font-sans">
                Manage your linked bank accounts and payment methods
              </p>
              {formBeforeBankLink && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm font-sans">
                    <strong>Note:</strong> After linking your account, you'll be
                    returned to the payment form.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        {activeTab === "deposit" ? (
          <>
            {/* Step Indicator */}
            <StepIndicator
              activeStep={deposit.activeStep}
              headerColorProps={{ className: headerColor }}
            />

            {/* Deposit Form */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 w-full">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-medium text-gray-900 font-sans">
                  Payment Details
                </h2>
              </div>

              <form onSubmit={deposit.handleSubmit} className="px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Currency Selection - Read-only */}
                  <div className="lg:col-span-2">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <div className="relative">
                        <select
                          value={deposit.selectedCurrency}
                          onChange={(e) =>
                            deposit.setSelectedCurrency(e.target.value)
                          }
                          className="w-full px-5 py-3.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 bg-white"
                          disabled
                        >
                          <option value={deposit.selectedCurrency}>
                            {deposit.selectedCurrency}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection - Read-only */}
                  {deposit.selectedCurrency && (
                    <div className="lg:col-span-2">
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method
                        </label>
                        <div className="relative">
                          <select
                            value={deposit.paymentMethod}
                            onChange={(e) =>
                              deposit.setPaymentMethod(e.target.value)
                            }
                            className="w-full px-5 py-3.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 bg-white"
                            disabled
                          >
                            <option value={deposit.paymentMethod}>
                              {deposit.paymentMethod === "bank_deposit"
                                ? "Bank"
                                : deposit.paymentMethod === "card_deposit"
                                ? "Card"
                                : deposit.paymentMethod === "manual_deposit"
                                ? "Manual"
                                : deposit.paymentMethod}
                            </option>
                          </select>
                        </div>
                      </div>
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
                      selectedCurrency={deposit.selectedCurrency}
                      errors={deposit.formErrors}
                      isAmountFocused={ui.isAmountFocused}
                      onAmountFocus={ui.setIsAmountFocused}
                    />
                  </div>
                )}

                {/* USD Bank Deposit Info */}
                <div className="mb-8">
                  <USDBankDepositInfo
                    selectedCurrency={deposit.selectedCurrency}
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
                    selectedCurrency={deposit.selectedCurrency}
                    manualDetailsLoading={bankAccounts.manualDetailsLoading}
                    manualAccountDetails={bankAccounts.manualAccountDetails}
                    manualDetailsError={bankAccounts.manualDetailsError}
                    copiedField={ui.copiedField}
                    onCopy={ui.copyToClipboard}
                    showTooltip={ui.helpTooltips}
                    onTooltipShow={ui.handleTooltipShow}
                    onTooltipHide={ui.handleTooltipHide}
                    textColorProps={{ className: textColor }}
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

                    {/* Card Deposit Button */}
                    {isCardDeposit ? (
                      <motion.button
                        type="button"
                        onClick={handleCardPayment}
                        disabled={!deposit.amount || deposit.isSubmitting}
                        className="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all font-sans"
                      >
                        <FaCreditCard className="mr-3" />
                        Pay with Card
                      </motion.button>
                    ) : // USD Bank Deposit - Check if account needs linking
                    deposit.selectedCurrency === "USD" &&
                      deposit.paymentMethod === "bank_deposit" ? (
                      needsBankAccountLink() ? (
                        <motion.button
                          type="button"
                          onClick={() => setActiveTab("bank-accounts")}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all font-sans"
                        >
                          <FaUniversity className="mr-3" />
                          Link Bank Account
                        </motion.button>
                      ) : (
                        <motion.button
                          type="submit"
                          disabled={
                            deposit.isSubmitting || !deposit.selectedBankAccount
                          }
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
                      )
                    ) : // Other payment methods
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
                onClick={handleBackToDashboard}
                className="flex items-center gap-3 px-6 py-3 rounded-xl text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200 font-sans text-base"
              >
                ← Back to Dashboard
              </button>
            </div>
          </>
        ) : (
          /* Bank Accounts Management */
          <BankLink
            customerId={customerId}
            authtoken={authtoken}
            isIframe={true}
            onAccountLinked={handleAccountLinked}
            preSelectedCurrency={deposit.selectedCurrency}
            preSelectedPaymentMethod={deposit.paymentMethod}
            uniqueReference={uniqueReference}
          />
        )}

        {/* Success Modal */}
        <AnimatePresence>
          {deposit.transactionSuccess && (
            <SuccessPopup
              transaction={deposit.transactionSuccess}
              isManualDeposit={isManualDeposit}
              amount={deposit.amount}
              selectedCurrency={deposit.selectedCurrency}
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
const DepositPageIframe = () => {
  return (
    <ErrorBoundary>
      <DepositPageContent />
    </ErrorBoundary>
  );
};

export default DepositPageIframe;
