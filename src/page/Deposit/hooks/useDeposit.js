// src/page/Deposit/hooks/useDeposit.js - COMPLETE FIXED VERSION
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

// Import bank account actions
import {
  fetchUSDBankAccounts,
  fetchManualBankDetails,
  fetchCombinedUSDAccounts,
} from "../slices/bankAccountSlice";

// Import deposit slice actions and selectors
import {
  setSelectedCurrency,
  setPaymentMethod,
  setAmount,
  setPurpose,
  setSelectedBankAccount,
  setFormErrors,
  submitDeposit,
  resetTransaction,
  setActiveStep,
  fetchManualAccountDetails,
  selectSelectedCurrency,
  selectPaymentMethod,
  selectAmount,
  selectPurpose,
  selectSelectedBankAccount,
  selectFormErrors,
  selectIsSubmitting,
  selectTransactionSuccess,
  selectActiveStep,
  selectManualDetailsLoading,
  selectManualAccountDetails,
} from "../slices/depositSlice";

export const useDeposit = () => {
  const dispatch = useDispatch();

  // Select state from Redux
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const paymentMethod = useSelector(selectPaymentMethod);
  const amount = useSelector(selectAmount);
  const purpose = useSelector(selectPurpose);
  const selectedBankAccount = useSelector(selectSelectedBankAccount);
  const formErrors = useSelector(selectFormErrors);
  const isSubmitting = useSelector(selectIsSubmitting);
  const transactionSuccess = useSelector(selectTransactionSuccess);
  const activeStep = useSelector(selectActiveStep);
  const manualDetailsLoading = useSelector(selectManualDetailsLoading);
  const manualAccountDetails = useSelector(selectManualAccountDetails);

  // Get bank accounts state for USD accounts check
  const usdBankAccounts = useSelector(
    (state) => state.bankAccounts?.usdBankAccounts || []
  );
  const usdAccountsLoading = useSelector(
    (state) => state.bankAccounts?.usdAccountsLoading || false
  );
  const bankLinkAccounts = useSelector(
    (state) => state.bankLink?.bankAccounts || []
  );

  // ✅ Fetch manual account details when manual deposit is selected
  useEffect(() => {
    if (
      paymentMethod === "manual_deposit" &&
      selectedCurrency &&
      !manualAccountDetails
    ) {
      console.log(
        "🔄 useDeposit: Fetching manual account details for",
        selectedCurrency
      );
      dispatch(fetchManualAccountDetails(selectedCurrency));
    }
  }, [paymentMethod, selectedCurrency, manualAccountDetails, dispatch]);

  // ✅ Auto-advance steps based on user selections
  useEffect(() => {
    let newStep = 1;

    if (selectedCurrency) {
      newStep = 2;
    }

    if (selectedCurrency && paymentMethod) {
      newStep = 3;
    }

    if (activeStep !== newStep) {
      dispatch(setActiveStep(newStep));
    }
  }, [selectedCurrency, paymentMethod, activeStep, dispatch]);

  // ✅ Form validation
  const validateForm = useCallback(() => {
    const errors = {};

    if (!selectedCurrency) {
      errors.currency = "Please select a currency";
    }

    if (!paymentMethod) {
      errors.paymentMethod = "Please select a payment method";
    }

    // Only validate amount and purpose for non-manual deposits
    if (paymentMethod !== "manual_deposit") {
      if (!amount || parseFloat(amount) <= 0) {
        errors.amount = "Please enter a valid amount";
      }

      if (!purpose) {
        errors.purpose = "Please enter a purpose for this deposit";
      }
    }

    // Validate bank account selection for USD bank deposits
    if (
      selectedCurrency === "USD" &&
      paymentMethod === "bank_deposit" &&
      !selectedBankAccount
    ) {
      errors.bankAccount = "Please select a bank account";
    }

    return errors;
  }, [selectedCurrency, paymentMethod, amount, purpose, selectedBankAccount]);

  // ✅ Form submission handler
  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      console.log("🔄 useDeposit: Form submission started", {
        selectedCurrency,
        paymentMethod,
        amount,
        purpose,
        selectedBankAccount,
      });

      // Validate form
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        console.log("❌ useDeposit: Form validation failed", errors);
        dispatch(setFormErrors(errors));

        // Scroll to first error
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.querySelector(
          `[data-field="${firstErrorField}"]`
        );
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        toast.error("Please fix the form errors before submitting");
        return;
      }

      // Clear any previous errors
      dispatch(setFormErrors({}));

      try {
        console.log("✅ useDeposit: Form validation passed, submitting...");

        const depositData = {
          currency: selectedCurrency,
          payment_method: paymentMethod,
          amount: parseFloat(amount),
          purpose: purpose,
          ...(selectedBankAccount && { bank_account_id: selectedBankAccount }),
        };

        console.log("📦 useDeposit: Deposit data prepared", depositData);

        const result = await dispatch(submitDeposit(depositData)).unwrap();

        console.log("✅ useDeposit: Deposit submitted successfully", result);

        // Show success message based on payment method
        if (paymentMethod === "manual_deposit") {
          toast.success("Deposit instructions generated successfully!");
        } else {
          toast.success("Deposit submitted successfully!");
        }
      } catch (error) {
        console.error("❌ useDeposit: Deposit submission failed", error);

        let errorMessage = "Failed to submit deposit";

        if (typeof error === "string") {
          errorMessage = error;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        dispatch(setFormErrors({ submission: errorMessage }));
        toast.error(errorMessage);
      }
    },
    [
      selectedCurrency,
      paymentMethod,
      amount,
      purpose,
      selectedBankAccount,
      validateForm,
      dispatch,
    ]
  );

  // ✅ Action handlers
  const setSelectedCurrencyHandler = useCallback(
    (currency) => {
      console.log("🔄 useDeposit: Setting currency to", currency);
      dispatch(setSelectedCurrency(currency));

      // Clear bank account selection when currency changes
      if (selectedBankAccount) {
        dispatch(setSelectedBankAccount(null));
      }

      // Clear form errors
      if (formErrors.currency) {
        dispatch(setFormErrors({ ...formErrors, currency: "" }));
      }
    },
    [dispatch, selectedBankAccount, formErrors]
  );

  const setPaymentMethodHandler = useCallback(
    (method) => {
      console.log("🔄 useDeposit: Setting payment method to", method);
      dispatch(setPaymentMethod(method));

      // Clear amount and purpose for manual deposits
      if (method === "manual_deposit") {
        dispatch(setAmount(""));
        dispatch(setPurpose(""));
      }

      // Clear bank account selection when payment method changes
      if (selectedBankAccount && method !== "bank_deposit") {
        dispatch(setSelectedBankAccount(null));
      }

      // Clear form errors
      if (formErrors.paymentMethod) {
        dispatch(setFormErrors({ ...formErrors, paymentMethod: "" }));
      }
    },
    [dispatch, selectedBankAccount, formErrors]
  );

  const setAmountHandler = useCallback(
    (newAmount) => {
      dispatch(setAmount(newAmount));

      // Clear form errors
      if (formErrors.amount) {
        dispatch(setFormErrors({ ...formErrors, amount: "" }));
      }
    },
    [dispatch, formErrors]
  );

  const setPurposeHandler = useCallback(
    (newPurpose) => {
      dispatch(setPurpose(newPurpose));

      // Clear form errors
      if (formErrors.purpose) {
        dispatch(setFormErrors({ ...formErrors, purpose: "" }));
      }
    },
    [dispatch, formErrors]
  );

  const setSelectedBankAccountHandler = useCallback(
    (accountId) => {
      console.log("🔄 useDeposit: Setting selected bank account to", accountId);
      dispatch(setSelectedBankAccount(accountId));

      // Clear form errors
      if (formErrors.bankAccount) {
        dispatch(setFormErrors({ ...formErrors, bankAccount: "" }));
      }
    },
    [dispatch, formErrors]
  );

  const resetTransactionHandler = useCallback(() => {
    console.log("🔄 useDeposit: Resetting transaction");
    dispatch(resetTransaction());
  }, [dispatch]);

  // ✅ Computed values
  const hasUSDAccounts = useMemo(() => {
    const allAccounts = [...usdBankAccounts, ...bankLinkAccounts];
    const activeUSDAccounts = allAccounts.filter(
      (account) =>
        (account.currency === "USD" || !account.currency) &&
        account.is_frozen !== 1 &&
        account.status !== 1
    );
    return activeUSDAccounts.length > 0;
  }, [usdBankAccounts, bankLinkAccounts]);

  const isManualDeposit = useMemo(
    () => paymentMethod === "manual_deposit",
    [paymentMethod]
  );
  const isUSDBankDeposit = useMemo(
    () => selectedCurrency === "USD" && paymentMethod === "bank_deposit",
    [selectedCurrency, paymentMethod]
  );
  const isCardDeposit = useMemo(
    () => paymentMethod === "card_deposit",
    [paymentMethod]
  );

  // ✅ Debug logging
  useEffect(() => {
    console.log("🔍 useDeposit: State update", {
      selectedCurrency,
      paymentMethod,
      amount,
      purpose,
      selectedBankAccount,
      activeStep,
      isSubmitting,
      hasTransactionSuccess: !!transactionSuccess,
      manualDetailsLoading,
      hasManualDetails: !!manualAccountDetails,
      hasUSDAccounts,
      usdBankAccountsCount: usdBankAccounts.length,
      bankLinkAccountsCount: bankLinkAccounts.length,
    });
  }, [
    selectedCurrency,
    paymentMethod,
    amount,
    purpose,
    selectedBankAccount,
    activeStep,
    isSubmitting,
    transactionSuccess,
    manualDetailsLoading,
    manualAccountDetails,
    hasUSDAccounts,
    usdBankAccounts,
    bankLinkAccounts,
  ]);

  // Return the hook interface
  return {
    // Form state
    selectedCurrency,
    paymentMethod,
    amount,
    purpose,
    selectedBankAccount,

    // UI state
    formErrors,
    isSubmitting,
    transactionSuccess,
    activeStep,
    manualDetailsLoading,
    manualAccountDetails,

    // Action handlers
    setSelectedCurrency: setSelectedCurrencyHandler,
    setPaymentMethod: setPaymentMethodHandler,
    setAmount: setAmountHandler,
    setPurpose: setPurposeHandler,
    setSelectedBankAccount: setSelectedBankAccountHandler,
    handleSubmit,
    resetTransaction: resetTransactionHandler,

    // Computed values
    hasUSDAccounts,
    isManualDeposit,
    isUSDBankDeposit,
    isCardDeposit,

    // Loading states
    usdAccountsLoading,
  };
};

export default useDeposit;
