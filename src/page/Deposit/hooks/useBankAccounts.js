// src/page/Deposit/hooks/useBankAccounts.js - COMPLETE
import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearManualAccountDetails,
  setCurrencyAndClearManualDetails,
  forceClearManualDetailsForCurrency,
  fetchManualAccountDetails,
} from "../slices/bankAccountSlice";

export const useBankAccounts = (selectedCurrency, paymentMethod) => {
  const dispatch = useDispatch();

  // Get all account data from Redux
  const {
    usdBankAccounts,
    usdAccountsLoading,
    usdAccountsError,
    aedAccountDetails,
    aedDetailsLoading,
    aedDetailsError,
    manualAccountDetails,
    manualDetailsLoading,
    manualDetailsError,
    hasSilaAccounts,
  } = useSelector((state) => state.bankAccounts);

  const prevFetchRef = useRef({ currency: null, paymentMethod: null });
  const abortControllerRef = useRef(null);
  const prevCurrencyRef = useRef(selectedCurrency);
  const prevPaymentMethodRef = useRef(paymentMethod);

  // ✅ COMPLETE: Cleanup function
  const cleanupPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // ✅ COMPLETE: Reset states when currency changes
  useEffect(() => {
    if (prevCurrencyRef.current !== selectedCurrency) {
      cleanupPendingRequests();
      dispatch(setCurrencyAndClearManualDetails(selectedCurrency));
      prevCurrencyRef.current = selectedCurrency;
    }

    if (
      prevPaymentMethodRef.current === "manual_deposit" &&
      paymentMethod !== "manual_deposit"
    ) {
      cleanupPendingRequests();
      dispatch(clearManualAccountDetails());
    }

    prevPaymentMethodRef.current = paymentMethod;
  }, [selectedCurrency, paymentMethod, dispatch, cleanupPendingRequests]);

  // ✅ COMPLETE: Fetch manual deposit details
  useEffect(() => {
    const fetchManualDetails = async () => {
      cleanupPendingRequests();
      abortControllerRef.current = new AbortController();

      if (paymentMethod === "manual_deposit" && selectedCurrency) {
        const isDuplicateCall = 
          prevFetchRef.current.currency === selectedCurrency &&
          prevFetchRef.current.paymentMethod === paymentMethod;

        if (isDuplicateCall) {
          return;
        }

        prevFetchRef.current = { currency: selectedCurrency, paymentMethod };

        try {
          if (manualAccountDetails && manualAccountDetails.currency !== selectedCurrency) {
            dispatch(clearManualAccountDetails());
          }

          const resultAction = await dispatch(fetchManualAccountDetails(selectedCurrency));
          
          if (abortControllerRef.current.signal.aborted) {
            return;
          }

          if (fetchManualAccountDetails.fulfilled.match(resultAction)) {
            console.log("✅ Manual details loaded for:", selectedCurrency);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("❌ Manual details fetch error:", error);
          }
        }
      } else if (paymentMethod !== "manual_deposit" && manualAccountDetails) {
        dispatch(clearManualAccountDetails());
      }
    };

    const timer = setTimeout(fetchManualDetails, 300);
    
    return () => {
      clearTimeout(timer);
      cleanupPendingRequests();
    };
  }, [paymentMethod, selectedCurrency, dispatch, manualAccountDetails, cleanupPendingRequests]);

  // ✅ COMPLETE: Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPendingRequests();
    };
  }, [cleanupPendingRequests]);

  // ✅ COMPLETE: Manual refresh function
  const refreshManualDetails = useCallback(async () => {
    if (selectedCurrency && paymentMethod === "manual_deposit") {
      cleanupPendingRequests();
      dispatch(clearManualAccountDetails());
      prevFetchRef.current = { currency: null, paymentMethod: null };
      
      setTimeout(() => {
        dispatch(fetchManualAccountDetails(selectedCurrency));
      }, 100);
    }
  }, [selectedCurrency, paymentMethod, dispatch, cleanupPendingRequests]);

  // ✅ COMPLETE: Utility functions
  const shouldShowUSDBankSelection = useCallback(() => {
    return (
      selectedCurrency === "USD" && 
      paymentMethod === "bank_deposit" && 
      usdBankAccounts && 
      usdBankAccounts.length > 0
    );
  }, [selectedCurrency, paymentMethod, usdBankAccounts]);

  const shouldRedirectToLinkBank = useCallback(() => {
    return (
      selectedCurrency === "USD" && 
      paymentMethod === "bank_deposit" && 
      (!usdBankAccounts || usdBankAccounts.length === 0) &&
      !usdAccountsLoading
    );
  }, [selectedCurrency, paymentMethod, usdBankAccounts, usdAccountsLoading]);

  // ✅ COMPLETE: Return object
  return {
    // Manual deposit accounts
    manualAccountDetails,
    manualDetailsLoading,
    manualDetailsError,
    
    // USD bank accounts
    usdBankAccounts: usdBankAccounts || [],
    usdAccountsLoading,
    usdAccountsError,
    
    // AED account details
    aedAccountDetails,
    aedDetailsLoading,
    aedDetailsError,
    
    // Utility functions
    refreshManualDetails,
    shouldShowUSDBankSelection,
    shouldRedirectToLinkBank,
    
    // Derived state
    hasManualAccount: !!manualAccountDetails && manualAccountDetails.currency === selectedCurrency,
    hasUSDAccounts: usdBankAccounts && usdBankAccounts.length > 0,
    hasAEDAccount: !!aedAccountDetails,
    hasSilaAccounts,
    
    // Payment method specific states
    isManualDeposit: paymentMethod === "manual_deposit",
    isUSDBankDeposit: selectedCurrency === "USD" && paymentMethod === "bank_deposit",
    isAEDManualDeposit: selectedCurrency === "AED" && paymentMethod === "manual_deposit",
    
    // Loading states summary
    isLoading: manualDetailsLoading || usdAccountsLoading || aedDetailsLoading,
    hasError: manualDetailsError || usdAccountsError || aedDetailsError,
    
    // Current selection info
    currentCurrency: selectedCurrency,
    currentPaymentMethod: paymentMethod,
  };
};

export default useBankAccounts;