// src/page/Deposit/hooks/usePaymentMethods.js - COMPLETE FIXED VERSION
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPaymentMethodsByCurrency,
  selectPaymentMethods,
  selectPaymentMethodsLoading,
  selectPaymentMethodsError,
} from "../slices/currencySlice";

// Payment method configuration based on specifications
const getPaymentMethodsByCurrency = (currency) => {
  const paymentMethodConfig = {
    EUR: ["card_deposit", "manual_deposit", "bank_transfer"],
    GBP: ["card_deposit", "manual_deposit", "bank_transfer"],
    DKK: ["card_deposit", "manual_deposit", "bank_transfer"],
    AED: ["card_deposit", "manual_deposit"],
    USD: ["card_deposit", "manual_deposit", "bank_deposit"],
  };

  return paymentMethodConfig[currency] || [];
};

// Transform API response to consistent format
const transformPaymentMethods = (apiResponse, selectedCurrency) => {
  console.log("🔄 Transforming API response:", apiResponse);

  if (!apiResponse) {
    console.log("❌ No API response to transform");
    return [];
  }

  let methodsData = [];

  if (Array.isArray(apiResponse)) {
    methodsData = apiResponse;
  } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
    methodsData = apiResponse.data;
  } else if (apiResponse.methods && Array.isArray(apiResponse.methods)) {
    methodsData = apiResponse.methods;
  } else if (
    apiResponse.deposit_types &&
    Array.isArray(apiResponse.deposit_types)
  ) {
    methodsData = apiResponse.deposit_types;
  } else {
    console.log("⚠️ Unknown API response structure, using empty array");
    return [];
  }

  console.log(`✅ Found ${methodsData.length} methods from API`);

  const transformedMethods = methodsData.map((method) => {
    const value =
      method.value || method.method_type || method.id || method.name;
    const label =
      method.label ||
      method.method_name ||
      method.display_name ||
      (value
        ? value.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
        : "Unknown");
    const description =
      method.description || method.method_description || `Deposit via ${label}`;

    return {
      value: value,
      label: label,
      description: description,
      original: method,
    };
  });

  console.log("✅ Transformed methods:", transformedMethods);
  return transformedMethods;
};

export const usePaymentMethods = (selectedCurrency, currencies) => {
  const dispatch = useDispatch();

  const paymentMethods = useSelector(selectPaymentMethods);
  const loading = useSelector(selectPaymentMethodsLoading);
  const error = useSelector(selectPaymentMethodsError);

  useEffect(() => {
    if (
      selectedCurrency &&
      currencies &&
      Array.isArray(currencies) &&
      currencies.length > 0
    ) {
      console.log(
        "🔄 Fetching payment methods for currency:",
        selectedCurrency
      );

      const selectedCurrencyObj = currencies.find(
        (currency) => currency.currency_code === selectedCurrency
      );

      let currencyIdentifier = null;

      if (selectedCurrencyObj?.currencyid) {
        currencyIdentifier = selectedCurrencyObj.currencyid;
      } else if (selectedCurrencyObj?.currency_id) {
        currencyIdentifier = selectedCurrencyObj.currency_id;
      } else if (selectedCurrencyObj?.account_id) {
        currencyIdentifier = selectedCurrencyObj.account_id;
      } else {
        currencyIdentifier = selectedCurrency;
      }

      if (currencyIdentifier) {
        dispatch(fetchPaymentMethodsByCurrency(currencyIdentifier));
      }
    }
  }, [selectedCurrency, currencies, dispatch, paymentMethods.length]);

  const filteredMethods = useMemo(() => {
    if (!selectedCurrency) {
      return [];
    }

    console.log("🎯 Filtering payment methods for:", selectedCurrency);
    console.log("📊 Raw payment methods from API:", paymentMethods);
    console.log("⏳ Loading state:", loading);
    console.log("❌ Error state:", error);

    if (error) {
      console.log("🚨 Error in payment methods, using fallback");
      return getFallbackMethods(selectedCurrency);
    }

    if (loading) {
      console.log("⏳ Still loading payment methods");
      return [];
    }

    const transformedMethods = transformPaymentMethods(
      paymentMethods,
      selectedCurrency
    );

    const allowedMethods = getPaymentMethodsByCurrency(selectedCurrency);
    console.log(
      "✅ Allowed methods for",
      selectedCurrency,
      ":",
      allowedMethods
    );

    const filtered = transformedMethods.filter((method) => {
      const isAllowed = allowedMethods.includes(method.value);
      return isAllowed;
    });

    console.log("✅ Final filtered methods:", filtered);

    if (filtered.length === 0 && !loading && !error) {
      console.log("🔄 No methods found after filtering, using fallback");
      return getFallbackMethods(selectedCurrency);
    }

    return filtered;
  }, [paymentMethods, selectedCurrency, loading, error]);

  return {
    methods: filteredMethods,
    loading: loading,
    error: error,
  };
};

const getFallbackMethods = (currency) => {
  console.log("🔄 Using fallback methods for:", currency);

  const fallbackMethods = {
    card_deposit: {
      value: "card_deposit",
      label: "Card Deposit",
      description: "Instant deposit using debit/credit card",
    },
    manual_deposit: {
      value: "manual_deposit",
      label: "Manual Deposit",
      description: "Bank transfer using account details",
    },
    bank_transfer: {
      value: "bank_transfer",
      label: "Bank Transfer",
      description: "Instant transfer via Open Banking",
    },
    bank_deposit: {
      value: "bank_deposit",
      label: "Link Bank Account",
      description: "Connect your bank account for deposits",
    },
  };

  const allowedMethods = getPaymentMethodsByCurrency(currency);
  return allowedMethods.map(
    (method) =>
      fallbackMethods[method] || {
        value: method,
        label: method
          .replace("_", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        description: `Deposit via ${method.replace("_", " ")}`,
      }
  );
};
