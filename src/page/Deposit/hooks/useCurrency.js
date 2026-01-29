// src/page/Deposit/hooks/useCurrency.js - COMPLETE UPDATED VERSION
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  selectAccounts,
  selectAccountLoading,
  selectAccountError,
} from "../../../components/Dashboard/Account/AccountSummary/AccountSlice";

export const useCurrency = (initialCurrency, customerId = null) => {
  // Get accounts and loading state from Redux (same data used in AccountSummary)
  const accounts = useSelector(selectAccounts);
  const accountLoading = useSelector(selectAccountLoading);
  const accountError = useSelector(selectAccountError);

  console.log("🔍 useCurrency - Raw accounts from Redux:", accounts);
  console.log("🔍 useCurrency - Context:", {
    isIframe: window.self !== window.top,
    customerId,
    initialCurrency,
  });
  console.log("⏳ useCurrency - Loading state:", accountLoading);
  console.log("❌ useCurrency - Error state:", accountError);

  // ✅ ADDED: Iframe-specific initialization
  useEffect(() => {
    const isIframe = window.self !== window.top;

    if (isIframe) {
      console.log("🎯 Running in iframe context");

      if (customerId) {
        console.log("✅ Iframe customerId provided:", customerId);

        // ✅ OPTIONAL: Store customerId in sessionStorage for iframe session
        sessionStorage.setItem("iframe_customer_id", customerId);

        // ✅ OPTIONAL: Log to parent for debugging
        if (window.parent) {
          window.parent.postMessage(
            {
              type: "IFRAME_CUSTOMER_ID_SET",
              payload: { customerId },
            },
            "*"
          );
        }
      } else {
        console.warn("⚠️ Iframe context but no customerId provided");
      }
    } else {
      console.log("🌐 Running in main app context");

      // ✅ MAINTAIN ORIGINAL: Check for localStorage customerId in main app
      const localStorageCustomerId = localStorage.getItem("authcustomer_id");
      if (localStorageCustomerId) {
        console.log(
          "✅ Main app customerId from localStorage:",
          localStorageCustomerId
        );
      }
    }
  }, [customerId]);

  // ✅ MAINTAIN ORIGINAL LOGIC: Transform accounts to currencies format
  const currencies = useMemo(() => {
    if (accountLoading) {
      console.log(
        "⏳ useCurrency - Still loading accounts, returning empty array"
      );
      return [];
    }

    if (accountError) {
      console.log("❌ useCurrency - Account error, returning empty array");
      return [];
    }

    const safeAccounts = Array.isArray(accounts) ? accounts : [];

    console.log(
      "🔄 useCurrency - Transforming accounts to currencies. Account count:",
      safeAccounts.length
    );

    const transformed = safeAccounts.map((account, index) => {
      const currencyObj = {
        // ✅ REQUIRED FIELDS: Maintain original structure
        currency_code: account.currency,
        currency: account.currency,
        available_balance: account.available_balance || "0.00",
        account_name: account.account_name || `Account ${index + 1}`,
        account_number: account.account_number || "N/A",
        iban: account.iban || "N/A",
        flag_url: account.flag_url,
        account_id: account.account_id,

        // ✅ MAINTAIN COMPATIBILITY: Include all original account properties
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
      "✅ useCurrency - Successfully transformed currencies:",
      transformed.length
    );
    console.log(
      "📋 Available currencies:",
      transformed.map((c) => c.currency_code).join(", ")
    );

    return transformed;
  }, [accounts, accountLoading, accountError]);

  // ✅ MAINTAIN ORIGINAL LOGIC: Handle initial currency selection
  useEffect(() => {
    console.log("🎯 useCurrency - Initial currency effect:", {
      initialCurrency,
      currenciesCount: currencies.length,
      currencies: currencies.map((c) => c.currency_code),
      context: customerId ? `Iframe (${customerId})` : "Main App",
    });

    if (initialCurrency && currencies.length > 0) {
      const exists = currencies.some(
        (currency) => currency.currency_code === initialCurrency
      );
      console.log(
        "🔍 useCurrency - Initial currency exists:",
        exists,
        initialCurrency
      );

      if (exists) {
        console.log(
          "✅ useCurrency - Initial currency is available:",
          initialCurrency
        );

        // ✅ OPTIONAL: If in iframe, notify parent about currency availability
        const isIframe = window.self !== window.top;
        if (isIframe && window.parent) {
          window.parent.postMessage(
            {
              type: "CURRENCY_AVAILABLE",
              payload: {
                currency: initialCurrency,
                customerId,
                available: true,
              },
            },
            "*"
          );
        }
      } else {
        console.log(
          "⚠️ useCurrency - Initial currency not found in available currencies:",
          initialCurrency
        );

        // ✅ If currency not found, log available options
        if (currencies.length > 0) {
          console.log(
            "📋 Available currencies:",
            currencies.map((c) => c.currency_code)
          );
        }
      }
    } else if (currencies.length > 0) {
      console.log(
        "ℹ️ useCurrency - No initial currency provided, but",
        currencies.length,
        "currencies available"
      );
    } else {
      console.log(
        "📭 useCurrency - No currencies available for initial selection"
      );
    }
  }, [initialCurrency, currencies, customerId]);

  // ✅ ADDED: Optional debug effect to see full account structure
  useEffect(() => {
    if (currencies.length > 0 && process.env.NODE_ENV === "development") {
      console.log("🔍 FULL CURRENCY DATA STRUCTURE DEBUG:");
      currencies.forEach((currency, index) => {
        console.log(`Currency ${index + 1}:`, {
          currency_code: currency.currency_code,
          currency: currency.currency,
          available_balance: currency.available_balance,
          account_name: currency.account_name,
          account_number: currency.account_number,
          iban: currency.iban,
          account_id: currency.account_id,
          has_flag: !!currency.flag_url,
          all_keys: Object.keys(currency),
        });
      });
    }
  }, [currencies]);

  // ✅ MAINTAIN ORIGINAL LOGIC: Return the currency state
  const currencyState = useMemo(() => {
    const state = {
      currencies,
      loading: accountLoading,
      error: accountError,
      // ✅ ADDED: Context information for debugging
      context: {
        isIframe: window.self !== window.top,
        customerId,
        hasCustomerId: !!customerId,
        source: customerId ? "iframe_url_params" : "main_app_localstorage",
      },
    };

    console.log("📦 useCurrency - Returning state:", {
      currenciesCount: state.currencies.length,
      loading: state.loading,
      error: state.error,
      context: state.context,
    });

    return state;
  }, [currencies, accountLoading, accountError, customerId]);

  return currencyState;
};

// ✅ ADDED: Optional helper function for backward compatibility
export const useCurrencyWithDefault = (initialCurrency) => {
  // For main app usage without customerId parameter
  return useCurrency(initialCurrency, null);
};

// ✅ ADDED: Iframe-specific currency hook
export const useCurrencyForIframe = (initialCurrency, customerId) => {
  if (!customerId) {
    console.error("❌ useCurrencyForIframe requires customerId parameter");
    return {
      currencies: [],
      loading: false,
      error: "Customer ID is required for iframe context",
      context: { isIframe: true, hasCustomerId: false },
    };
  }

  return useCurrency(initialCurrency, customerId);
};

// ✅ ADDED: Utility function to detect iframe context
export const isInIframeContext = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    // Cross-origin error means we're in iframe
    return true;
  }
};

// ✅ ADDED: Utility to get customerId based on context
export const getContextCustomerId = () => {
  if (isInIframeContext()) {
    // Iframe: get from URL params or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlCustomerId = urlParams.get("customerId");
    const sessionCustomerId = sessionStorage.getItem("iframe_customer_id");

    return urlCustomerId || sessionCustomerId || null;
  } else {
    // Main app: get from localStorage
    return localStorage.getItem("authcustomer_id");
  }
};

export default useCurrency;
