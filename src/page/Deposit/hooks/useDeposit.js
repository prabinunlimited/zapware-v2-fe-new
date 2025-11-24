// src/page/Deposit/hooks/useDeposit.js - COMPLETE FIXED VERSION
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  setSelectedCurrency,
  setPaymentMethod,
  setAmount,
  setPurpose,
  setSelectedBankAccount,
  setFormErrors,
  submitDeposit, // ✅ This should now work
  fetchManualAccountDetails,
  resetTransaction,
  setActiveStep,
} from "../slices/depositSlice";

// Import the useDepositApi hook
import { useDepositApi } from "../hooks/useDepositApi";

export const useDeposit = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Initialize the API hook
  const { fetchManualDepositDetails, fetchUSDAccounts, fetchAEDDetails } =
    useDepositApi();

  const depositState = useSelector((state) => state.deposit);

  const getCustomerId = () => {
    const customerId =
      localStorage.getItem("customerId") ||
      localStorage.getItem("authcustomer_id");
    if (!customerId) {
      toast.error("Please log in to continue");
      return null;
    }
    return customerId;
  };

  const getAuthToken = () => {
    return (
      localStorage.getItem("authToken") || localStorage.getItem("authtoken")
    );
  };

  const validateForm = () => {
    const errors = {};

    if (!depositState.selectedCurrency) {
      errors.currency = "Please select a currency";
    }

    if (!depositState.paymentMethod) {
      errors.paymentMethod = "Please select a payment method";
    }

    // Only validate amount and purpose for non-manual deposits
    if (depositState.paymentMethod !== "manual_deposit") {
      if (!depositState.amount || parseFloat(depositState.amount) <= 0) {
        errors.amount = "Please enter a valid amount";
      }

      if (!depositState.purpose) {
        errors.purpose = "Please enter a purpose for this deposit";
      }
    }

    // Validate bank account for USD bank transfers
    if (
      depositState.selectedCurrency === "USD" &&
      depositState.paymentMethod === "bank_deposit" &&
      !depositState.selectedBankAccount
    ) {
      errors.bankAccount = "Please select a bank account";
    }

    return errors;
  };

  const handlePaymentMethodAction = async (paymentMethod) => {
    const customerId = getCustomerId();

    if (!customerId) {
      toast.error("Please log in to continue");
      return;
    }

    console.log("🔄 Handling payment method:", paymentMethod);

    switch (paymentMethod) {
      case "bank_deposit":
        // ✅ ENHANCED: Add state to pass data
        console.log("📍 Navigating to linkbank page for customer:", customerId);
        navigate(`/linkbank/${customerId}`, {
          replace: true,
          state: {
            from: "deposit",
            currency: depositState.selectedCurrency,
            amount: depositState.amount,
            purpose: depositState.purpose,
            timestamp: new Date().toISOString(),
          },
        });
        break;

      case "card_deposit":
        const state = {
          customerId: customerId,
          amount: parseFloat(depositState.amount),
          currency: depositState.selectedCurrency,
        };
        console.log("📍 Navigating to card page with state:", state);
        navigate("/card", { state: state});
        break;

      case "manual_deposit":
        console.log("ℹ️ Manual deposit - showing account details");
        toast.info("Please use the account details provided below");
        break;

      default:
        console.warn("Unknown payment method:", paymentMethod);
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔄 Form submitted");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.log("❌ Form validation errors:", errors);
      dispatch(setFormErrors(errors));
      toast.error("Please fix the form errors before submitting");
      return;
    }

    console.log("✅ Form validated successfully");

    // ✅ FIX: Handle navigation-based payment methods FIRST
    if (
      depositState.paymentMethod === "bank_deposit" ||
      depositState.paymentMethod === "card_deposit"
    ) {
      console.log(
        "🚀 Processing payment method action:",
        depositState.paymentMethod
      );
      await handlePaymentMethodAction(depositState.paymentMethod);
      return; // ✅ CRITICAL: Stop further execution
    }

    // ✅ Only process API submissions for non-navigation methods
    if (depositState.paymentMethod === "manual_deposit") {
      console.log("ℹ️ Manual deposit - no API submission needed");
      dispatch(setFormErrors({}));
      toast.success("Account details loaded successfully!");
      return;
    }

    // ✅ Handle other transaction types that need API submission
    try {
      console.log(
        "📤 Submitting deposit to API for payment method:",
        depositState.paymentMethod
      );
      const depositData = {
        currency: depositState.selectedCurrency,
        payment_method: depositState.paymentMethod,
        amount: parseFloat(depositState.amount),
        purpose: depositState.purpose,
        ...(depositState.selectedBankAccount && {
          bank_account_id: depositState.selectedBankAccount,
        }),
      };

      console.log("📦 Deposit data:", depositData);
      const result = await dispatch(submitDeposit(depositData)).unwrap();

      if (result.success) {
        toast.success("Deposit submitted successfully!");
      }
    } catch (error) {
      console.error("Deposit submission error:", error);
      toast.error(error.message || "Failed to submit deposit");
    }
  };

  // Enhanced fetchManualDetails function using the new API hook
  const fetchManualDetails = async (currency) => {
    console.log(
      `🔄 useDeposit - Fetching manual details for currency: ${currency}`
    );

    try {
      const details = await fetchManualDepositDetails(currency);
      console.log(
        "✅ useDeposit - Manual details fetched successfully:",
        details
      );
      return details;
    } catch (error) {
      console.error("❌ useDeposit - Error fetching manual details:", error);
      throw error;
    }
  };

  // New function to fetch USD accounts
  const fetchUSDDetails = async () => {
    console.log("🔄 useDeposit - Fetching USD accounts");

    try {
      const accounts = await fetchUSDAccounts();
      console.log(
        "✅ useDeposit - USD accounts fetched successfully:",
        accounts
      );
      return accounts;
    } catch (error) {
      console.error("❌ useDeposit - Error fetching USD accounts:", error);
      throw error;
    }
  };

  // New function to fetch AED details
  const fetchAEDDetailsData = async () => {
    console.log("🔄 useDeposit - Fetching AED details");

    try {
      const details = await fetchAEDDetails();
      console.log("✅ useDeposit - AED details fetched successfully:", details);
      return details;
    } catch (error) {
      console.error("❌ useDeposit - Error fetching AED details:", error);
      throw error;
    }
  };

  // Additional utility functions
  const handleCurrencyChange = (currency) => {
    dispatch(setSelectedCurrency(currency));
    dispatch(setPaymentMethod("")); // Reset payment method when currency changes
    dispatch(setSelectedBankAccount(null)); // Reset bank account selection
    dispatch(setActiveStep(2)); // Move to next step
  };

  const handlePaymentMethodChange = (method) => {
    dispatch(setPaymentMethod(method));
    dispatch(setActiveStep(3)); // Move to details step

    // Reset amount and purpose if switching to manual deposit
    if (method === "manual_deposit") {
      dispatch(setAmount(""));
      dispatch(setPurpose(""));
    }
  };

  const resetForm = () => {
    dispatch(resetTransaction());
    dispatch(setFormErrors({}));
  };

  const clearFormErrors = () => {
    dispatch(setFormErrors({}));
  };

  return {
    // State
    ...depositState,

    // Actions
    setSelectedCurrency: (currency) => dispatch(setSelectedCurrency(currency)),
    setPaymentMethod: (method) => dispatch(setPaymentMethod(method)),
    setAmount: (amount) => dispatch(setAmount(amount)),
    setPurpose: (purpose) => dispatch(setPurpose(purpose)),
    setSelectedBankAccount: (account) =>
      dispatch(setSelectedBankAccount(account)),
    setActiveStep: (step) => dispatch(setActiveStep(step)),

    // Form handlers
    handleSubmit,
    handleCurrencyChange,
    handlePaymentMethodChange,

    // API actions - Updated with new functions
    fetchManualDetails,
    fetchUSDDetails,
    fetchAEDDetails: fetchAEDDetailsData,

    // Utility functions
    resetTransaction: () => dispatch(resetTransaction()),
    resetForm,
    clearFormErrors,

    // Payment method actions
    handlePaymentMethodAction,

    // Validation
    validateForm,

    // Getters
    getCustomerId,
    getAuthToken,

    // Computed properties
    isManualDeposit: depositState.paymentMethod === "manual_deposit",
    isBankDeposit: depositState.paymentMethod === "bank_deposit",
    isCardDeposit: depositState.paymentMethod === "card_deposit",
    hasSelectedCurrency: !!depositState.selectedCurrency,
    
    hasPaymentMethod: !!depositState.paymentMethod,
    hasAmount: !!depositState.amount && parseFloat(depositState.amount) > 0,
    hasPurpose: !!depositState.purpose,
    isFormValid: () => Object.keys(validateForm()).length === 0,

    // API functions from useDepositApi
    api: {
      fetchManualDepositDetails,
      fetchUSDAccounts,
      fetchAEDDetails: fetchAEDDetailsData,
    },
  };
};
