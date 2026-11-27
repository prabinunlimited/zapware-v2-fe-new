// src/page/Deposit/hooks/usePaymentMethods.js
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPaymentMethodsByCurrency,
  selectPaymentMethods,
  selectPaymentMethodsLoading,
  selectPaymentMethodsError,
} from "../slices/currencySlice";

const mapMethodNameToValue = (rawName, selectedCurrency) => {
  const normalized = rawName.toLowerCase().trim().replace(/\s+/g, "_");

  if (normalized === "manual" || normalized === "manual_deposit") {
    return "manual_deposit";
  }

  if (normalized === "bank" || normalized === "bank_transfer") {
    return selectedCurrency === "USD" ? "bank_deposit" : "bank_transfer";
  }

  if (
    normalized === "pay_by_link" ||
    normalized === "paybylink" ||
    normalized === "payment_link"
  ) {
    return "pay_by_link";
  }

  return normalized;
};

const getMethodDescription = (value, label) => {
  switch (value) {
    case "manual_deposit":
      return "Bank transfer using account details";
    case "bank_transfer":
      return "Instant transfer via Open Banking";
    case "bank_deposit":
      return "Connect your bank account for deposits";
    case "pay_by_link":
      return "Generate or pay using a secure payment link";
    default:
      return `Deposit via ${label}`;
  }
};

const transformPaymentMethods = (apiResponse, selectedCurrency) => {
  if (!apiResponse) return [];

  let methodsData = [];

  if (Array.isArray(apiResponse)) {
    methodsData = apiResponse;
  } else if (Array.isArray(apiResponse?.data?.lists)) {
    methodsData = apiResponse.data.lists;
  } else if (Array.isArray(apiResponse?.data)) {
    methodsData = apiResponse.data;
  }

  return methodsData.map((method) => {
    const rawName = (method.name || method.label || method.value || "").toString();
    const value = mapMethodNameToValue(rawName, selectedCurrency);
    const label = method.name || method.label || value;

    return {
      id: method.id,
      value,
      label,
      description: method.description || getMethodDescription(value, label),
      service_provider_id: method.service_provider_id,
      currency_id: method.currency_id,
      original: method,
    };
  });
};

export const usePaymentMethods = (selectedCurrency, currencies) => {
  const dispatch = useDispatch();

  const paymentMethods = useSelector(selectPaymentMethods);
  const loading = useSelector(selectPaymentMethodsLoading);
  const error = useSelector(selectPaymentMethodsError);

  useEffect(() => {
    if (
      selectedCurrency &&
      Array.isArray(currencies) &&
      currencies.length > 0
    ) {
      const selectedCurrencyObj = currencies.find(
        (currency) => currency.currency_code === selectedCurrency,
      );

      const currencyId =
        selectedCurrencyObj?.currency_id || selectedCurrencyObj?.currencyid;
      const serviceProviderId = selectedCurrencyObj?.service_provider_id;

      if (currencyId && serviceProviderId) {
        dispatch(
          fetchPaymentMethodsByCurrency({
            currencyId,
            serviceProviderId,
          }),
        );
      }
    }
  }, [selectedCurrency, currencies, dispatch]);

  const methods = useMemo(() => {
    if (!selectedCurrency || loading || error) {
      return [];
    }

    return transformPaymentMethods(paymentMethods, selectedCurrency);
  }, [paymentMethods, selectedCurrency, loading, error]);

  return {
    methods,
    loading,
    error,
  };
};