// src/page/Deposit/hooks/useBankAccounts.js - COMPLETE FIXED VERSION
import { useState, useEffect, useRef, useCallback } from "react";
import { useDepositApi } from "./useDepositApi";
import { useDispatch, useSelector } from "react-redux";
import {
  clearManualAccountDetails,
  setCurrencyAndClearManualDetails,
  forceClearManualDetailsForCurrency,
} from "../slices/bankAccountSlice";
import { fetchManualAccountDetails, fetchAllManualAccounts } from "../slices/depositSlice";
import { depositAPI } from "../api/depositAPI";

export const useBankAccounts = (selectedCurrency, paymentMethod) => {
  const dispatch = useDispatch();

  // Get manual account details from Redux
  const manualAccountDetails = useSelector(
    (state) => state.bankAccounts?.manualAccountDetails
  );
  const manualDetailsLoading = useSelector(
    (state) => state.bankAccounts?.manualDetailsLoading
  );
  const manualDetailsError = useSelector(
    (state) => state.bankAccounts?.manualDetailsError
  );

  const prevFetchRef = useRef({ currency: null, paymentMethod: null });
  const abortControllerRef = useRef(null);

  // Local state for USD and AED accounts
  const [usdBankAccounts, setUsdBankAccounts] = useState([]);
  const [usdAccountsLoading, setUsdAccountsLoading] = useState(false);
  const [usdAccountsError, setUsdAccountsError] = useState(null);

  const [aedAccountDetails, setAedAccountDetails] = useState(null);
  const [aedDetailsLoading, setAedDetailsLoading] = useState(false);
  const [aedDetailsError, setAedDetailsError] = useState(null);

  const { fetchUSDAccounts, fetchAEDDetails } = useDepositApi();

  // Use ref to track previous currency and prevent unnecessary clears
  const prevCurrencyRef = useRef(selectedCurrency);
  const prevPaymentMethodRef = useRef(paymentMethod);

  // ✅ Cleanup function for aborting pending requests
  const cleanupPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("🛑 Aborting pending request");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // ✅ Debug function to see all available accounts
  const debugAvailableAccounts = useCallback(async () => {
    try {
      console.log("🔍 Debug: Checking all available accounts from API");
      const response = await depositAPI.getAllManualAccounts();
      
      if (response.data && response.data.account_details) {
        console.log("📊 All available accounts:", {
          total: response.data.count_account_details,
          currencies: response.data.account_details.map(acc => ({
            currency: acc.currency,
            account_id: acc.account_id,
            bank_name: acc.bank_name
          }))
        });
        
        // Check if selected currency is available
        if (selectedCurrency) {
          const hasCurrency = response.data.account_details.some(
            acc => acc.currency === selectedCurrency
          );
          console.log(`🎯 Selected currency ${selectedCurrency} available:`, hasCurrency);
        }
      }
    } catch (error) {
      console.error("❌ Debug: Error checking available accounts:", error);
    }
  }, [selectedCurrency]);

  // ✅ FIXED: Reset all states when currency changes
  useEffect(() => {
    console.log("🔄 useBankAccounts - Currency change detected:", {
      previous: prevCurrencyRef.current,
      current: selectedCurrency,
      paymentMethod: paymentMethod,
    });

    // Only clear if currency actually changed
    if (prevCurrencyRef.current !== selectedCurrency) {
      console.log(
        "🔄 useBankAccounts - Currency changed, clearing states for:",
        selectedCurrency
      );

      // Clean up any pending requests
      cleanupPendingRequests();

      // Clear local state
      setUsdBankAccounts([]);
      setUsdAccountsError(null);
      setUsdAccountsLoading(false);

      setAedAccountDetails(null);
      setAedDetailsError(null);
      setAedDetailsLoading(false);

      // ✅ Clear Redux state for manual details
      dispatch(setCurrencyAndClearManualDetails(selectedCurrency));

      // Update previous currency ref
      prevCurrencyRef.current = selectedCurrency;
    }

    // If payment method changed away from manual_deposit, clear manual details
    if (
      prevPaymentMethodRef.current === "manual_deposit" &&
      paymentMethod !== "manual_deposit"
    ) {
      console.log(
        "🔄 useBankAccounts - Payment method changed away from manual_deposit, clearing manual details"
      );
      cleanupPendingRequests();
      dispatch(clearManualAccountDetails());
    }

    prevPaymentMethodRef.current = paymentMethod;
  }, [selectedCurrency, paymentMethod, dispatch, cleanupPendingRequests]);

  // ✅ FIXED: Fetch manual deposit details using client-side filtering
  useEffect(() => {
    const fetchManualDetails = async () => {
      // Clean up any previous request
      cleanupPendingRequests();
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      if (paymentMethod === "manual_deposit" && selectedCurrency) {
        // ✅ PREVENT DUPLICATE CALLS
        const isDuplicateCall = 
          prevFetchRef.current.currency === selectedCurrency &&
          prevFetchRef.current.paymentMethod === paymentMethod;

        if (isDuplicateCall) {
          console.log("⏩ Skipping duplicate manual details fetch for:", selectedCurrency);
          return;
        }

        console.log("🔄 useBankAccounts - Fetching filtered manual details for:", {
          currency: selectedCurrency,
          paymentMethod
        });

        // Debug available accounts first
        await debugAvailableAccounts();

        prevFetchRef.current = { currency: selectedCurrency, paymentMethod };

        try {
          // ✅ Clear any existing mismatched data
          if (manualAccountDetails && manualAccountDetails.currency !== selectedCurrency) {
            console.log("🔄 Clearing mismatched manual details before fetch");
            dispatch(clearManualAccountDetails());
          }

          // ✅ Dispatch the fetch with currency parameter (now uses client-side filtering)
          const resultAction = await dispatch(fetchManualAccountDetails(selectedCurrency));
          
          // Check if the request was aborted
          if (abortControllerRef.current.signal.aborted) {
            console.log("↪️ Request aborted for:", selectedCurrency);
            return;
          }

          // ✅ Validate the result
          if (fetchManualAccountDetails.fulfilled.match(resultAction)) {
            const result = resultAction.payload;
            if (result && result.currency === selectedCurrency) {
              console.log("✅ useBankAccounts - Successfully loaded manual details for:", selectedCurrency);
            } else if (result) {
              console.warn("⚠️ useBankAccounts - Currency mismatch in response:", {
                expected: selectedCurrency,
                received: result.currency
              });
            } else {
              console.warn("⚠️ useBankAccounts - No account found for:", selectedCurrency);
            }
          } else if (fetchManualAccountDetails.rejected.match(resultAction)) {
            console.error("❌ useBankAccounts - Manual details fetch rejected:", resultAction.error);
          }
          
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log("↪️ Manual details fetch aborted for:", selectedCurrency);
          } else {
            console.error("❌ useBankAccounts - Error in manual details fetch:", error);
          }
        }
      } else if (paymentMethod !== "manual_deposit" && manualAccountDetails) {
        // Clear manual details if payment method changed away from manual_deposit
        console.log("🔄 Clearing manual details - payment method changed");
        dispatch(clearManualAccountDetails());
      }
    };

    // Use a small delay to prevent rapid successive calls
    const timer = setTimeout(fetchManualDetails, 300);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      cleanupPendingRequests();
    };
  }, [paymentMethod, selectedCurrency, dispatch, manualAccountDetails, cleanupPendingRequests, debugAvailableAccounts]);

  // ✅ FIXED: Fetch USD accounts for USD currency
  useEffect(() => {
    const fetchUSDData = async () => {
      if (selectedCurrency === "USD" && paymentMethod === "bank_transfer") {
        console.log("🔄 useBankAccounts - Fetching USD bank accounts");
        setUsdAccountsLoading(true);
        setUsdAccountsError(null);

        try {
          const accounts = await fetchUSDAccounts();
          setUsdBankAccounts(accounts);
          console.log(
            `✅ useBankAccounts - Loaded ${accounts.length} USD bank accounts`
          );
        } catch (error) {
          console.error(
            "❌ useBankAccounts - Error fetching USD accounts:",
            error
          );
          setUsdAccountsError("Failed to load USD bank accounts");
          setUsdBankAccounts([]);
        } finally {
          setUsdAccountsLoading(false);
        }
      } else {
        // Clear USD data if not needed
        if (
          usdBankAccounts.length > 0 ||
          usdAccountsLoading ||
          usdAccountsError
        ) {
          console.log(
            "🔄 useBankAccounts - Clearing USD bank accounts (not needed)"
          );
          setUsdBankAccounts([]);
          setUsdAccountsLoading(false);
          setUsdAccountsError(null);
        }
      }
    };

    fetchUSDData();
  }, [selectedCurrency, paymentMethod, fetchUSDAccounts, usdBankAccounts.length, usdAccountsLoading, usdAccountsError]);

  // ✅ FIXED: Fetch AED details for AED currency
  useEffect(() => {
    const fetchAEDData = async () => {
      if (selectedCurrency === "AED" && paymentMethod === "bank_transfer") {
        console.log("🔄 useBankAccounts - Fetching AED account details");
        setAedDetailsLoading(true);
        setAedDetailsError(null);

        try {
          const details = await fetchAEDDetails();
          setAedAccountDetails(details);
          console.log("✅ useBankAccounts - Loaded AED account details");
        } catch (error) {
          console.error(
            "❌ useBankAccounts - Error fetching AED details:",
            error
          );
          setAedDetailsError("Failed to load AED account details");
          setAedAccountDetails(null);
        } finally {
          setAedDetailsLoading(false);
        }
      } else {
        // Clear AED data if not needed
        if (aedAccountDetails || aedDetailsLoading || aedDetailsError) {
          console.log(
            "🔄 useBankAccounts - Clearing AED account details (not needed)"
          );
          setAedAccountDetails(null);
          setAedDetailsLoading(false);
          setAedDetailsError(null);
        }
      }
    };

    fetchAEDData();
  }, [selectedCurrency, paymentMethod, fetchAEDDetails, aedAccountDetails, aedDetailsLoading, aedDetailsError]);

  // ✅ IMPROVED: Final validation - should now always match with client-side filtering
  useEffect(() => {
    if (manualAccountDetails && manualAccountDetails.currency !== selectedCurrency) {
      console.error(
        `🚨 CRITICAL: Currency mismatch after client-side filtering! Expected ${selectedCurrency}, got ${manualAccountDetails.currency}. This should not happen with client-side filtering.`
      );
      dispatch(forceClearManualDetailsForCurrency(selectedCurrency));
    }
  }, [manualAccountDetails, selectedCurrency, dispatch]);

  // ✅ NEW: Manual refresh function
  const refreshManualDetails = useCallback(async () => {
    if (selectedCurrency && paymentMethod === "manual_deposit") {
      console.log("🔄 Manual refresh triggered for:", selectedCurrency);
      cleanupPendingRequests();
      dispatch(clearManualAccountDetails());
      prevFetchRef.current = { currency: null, paymentMethod: null };
      
      // Small delay to ensure cleanup completes
      setTimeout(() => {
        dispatch(fetchManualAccountDetails(selectedCurrency));
      }, 100);
    }
  }, [selectedCurrency, paymentMethod, dispatch, cleanupPendingRequests]);

  // ✅ NEW: Debug function to see all available accounts
  const debugAllAccounts = useCallback(async () => {
    try {
      console.log("🔍 Debug: Fetching all available accounts");
      const result = await dispatch(fetchAllManualAccounts());
      if (fetchAllManualAccounts.fulfilled.match(result)) {
        console.log("📊 All available accounts:", result.payload);
        return result.payload;
      }
    } catch (error) {
      console.error("❌ Debug: Error fetching all accounts:", error);
    }
  }, [dispatch]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPendingRequests();
    };
  }, [cleanupPendingRequests]);

  // ✅ Comprehensive logging for debugging
  useEffect(() => {
    console.log("📊 useBankAccounts - State update:", {
      selectedCurrency,
      paymentMethod,
      manualAccountDetails: manualAccountDetails ? {
        currency: manualAccountDetails.currency,
        accountId: manualAccountDetails.account_id,
        bankName: manualAccountDetails.bank_name,
      } : null,
      manualDetailsLoading,
      manualDetailsError,
      usdAccounts: {
        count: usdBankAccounts.length,
        loading: usdAccountsLoading,
        error: usdAccountsError
      },
      aedAccount: {
        exists: !!aedAccountDetails,
        loading: aedDetailsLoading,
        error: aedDetailsError
      }
    });
  }, [
    selectedCurrency,
    paymentMethod,
    manualAccountDetails,
    manualDetailsLoading,
    manualDetailsError,
    usdBankAccounts.length,
    usdAccountsLoading,
    usdAccountsError,
    aedAccountDetails,
    aedDetailsLoading,
    aedDetailsError
  ]);

  return {
    // Manual deposit accounts (client-side filtered)
    manualAccountDetails,
    manualDetailsLoading,
    manualDetailsError,
    
    // USD bank accounts
    usdBankAccounts,
    usdAccountsLoading,
    usdAccountsError,
    
    // AED account details
    aedAccountDetails,
    aedDetailsLoading,
    aedDetailsError,
    
    // ✅ Utility functions
    refreshManualDetails,
    debugAllAccounts,
    debugAvailableAccounts,
    
    // ✅ Derived state
    hasManualAccount: !!manualAccountDetails && manualAccountDetails.currency === selectedCurrency,
    hasUSDAccounts: usdBankAccounts.length > 0,
    hasAEDAccount: !!aedAccountDetails,
    
    // ✅ Loading states summary
    isLoading: manualDetailsLoading || usdAccountsLoading || aedDetailsLoading,
    hasError: manualDetailsError || usdAccountsError || aedDetailsError,
    
    // ✅ Current selection info
    currentCurrency: selectedCurrency,
    currentPaymentMethod: paymentMethod,
  };
};

export default useBankAccounts;