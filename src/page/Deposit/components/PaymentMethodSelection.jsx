// src/page/Deposit/components/PaymentMethodSelection.jsx - FIXED VERSION
import React from "react";
import { motion } from "framer-motion";
import {
  FaCreditCard,
  FaUniversity,
  FaMoneyBillWave,
  FaInfoCircle,
  FaCheck,
  FaExclamationTriangle,
  FaLink,
} from "react-icons/fa";
import { FiHelpCircle } from "react-icons/fi";
import { ClipLoader } from "react-spinners";

const PaymentMethodCard = React.memo(
  ({
    method,
    isSelected,
    onClick,
    onTooltipShow,
    onTooltipHide,
    showTooltip,
    ...textColorProps
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`border rounded-xl p-5 cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start">
        <div
          className={`p-3 rounded-full ${
            isSelected
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {method.icon}
        </div>
        <div className="ml-4 flex-1">
          <h3 className="font-medium text-gray-900">{method.label}</h3>
          <p className="text-sm mt-1" {...textColorProps}>
            {method.description}
          </p>
          <div
            className="mt-2 flex items-center text-xs text-blue-500 cursor-pointer"
            onMouseEnter={(e) => {
              e.stopPropagation();
              onTooltipShow(method.value);
            }}
            onMouseLeave={() => onTooltipHide(method.value)}
          >
            <FiHelpCircle className="mr-1" /> More info
            {showTooltip === method.value && (
              <div className="absolute left-0 mt-6 w-64 p-3 bg-gray-800 text-white text-sm rounded shadow-lg z-10">
                {method.help}
              </div>
            )}
          </div>
        </div>
        <div className="ml-2">
          {isSelected ? (
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <FaCheck className="text-white text-xs" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
          )}
        </div>
      </div>
    </motion.div>
  )
);

// ✅ FIXED: Proper payment method configuration by currency
const getPaymentMethodsByCurrency = (currency) => {
  const paymentMethodConfig = {
    // EUR, GBP, DKK - Use Open Banking (bank_transfer)
    EUR: ["card_deposit", "manual_deposit", "bank_transfer"],
    GBP: ["card_deposit", "manual_deposit", "bank_transfer"],
    DKK: ["card_deposit", "manual_deposit", "bank_transfer"],
    
    // AED - Manual deposits only
    AED: ["manual_deposit"],
    
    // ✅ FIXED: USD - Use bank_deposit (Sila/Plaid) instead of bank_transfer (Open Banking)
    USD: ["card_deposit", "manual_deposit", "bank_deposit"],
  };

  return paymentMethodConfig[currency] || [];
};

const PaymentMethodSelection = ({
  selectedCurrency,
  paymentMethod,
  onPaymentMethodSelect,
  loading,
  error,
  availableMethods,
  config,
  textColorProps,
  showTooltip,
  onTooltipShow,
  onTooltipHide,
}) => {
  const getAvailablePaymentMethods = React.useMemo(() => {
    if (!selectedCurrency) {
      return [];
    }

    // ✅ FIXED: Updated payment method definitions with proper descriptions
    const paymentMethodDefinitions = {
      card_deposit: {
        value: "card_deposit",
        label: "Card Deposit",
        icon: <FaCreditCard />,
        description: "Instant deposit using debit/credit card",
        help: "Instant deposit using your debit or credit card. Processed immediately with secure encryption.",
      },
      manual_deposit: {
        value: "manual_deposit",
        label: "Manual Deposit",
        icon: <FaMoneyBillWave />,
        description: "Bank transfer using account details",
        help: "Transfer from your bank using provided account details. May take 1-3 business days to process.",
      },
      // ✅ FIXED: Open Banking for EUR/GBP/DKK
      bank_transfer: {
        value: "bank_transfer",
        label: "Bank Transfer",
        icon: <FaUniversity />,
        description: "Instant transfer via Open Banking",
        help: "Secure instant transfer from your bank account using Open Banking technology. Available for EUR, GBP, and DKK currencies.",
      },
      // ✅ FIXED: Sila/Plaid for USD
      bank_deposit: {
        value: "bank_deposit",
        label: "Link Bank Account",
        icon: <FaLink />, // Different icon to distinguish from Open Banking
        description: "Connect your US bank account via Plaid",
        help: "Link your US bank account using Plaid integration to enable secure USD deposits and transfers. Available for USD currency only.",
      },
    };

    if (availableMethods && availableMethods.length > 0) {
      return availableMethods.map((method) => {
        const definition = paymentMethodDefinitions[method.value] || {
          value: method.value,
          label:
            method.label ||
            method.value
              .replace("_", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
          description:
            method.description ||
            `Deposit via ${method.value.replace("_", " ")}`,
          icon: <FaUniversity />,
          help:
            method.description ||
            `Deposit via ${method.value.replace("_", " ")}`,
        };
        return definition;
      });
    }

    const allowedMethods = getPaymentMethodsByCurrency(selectedCurrency);
    return allowedMethods
      .filter((method) => paymentMethodDefinitions[method])
      .map((method) => paymentMethodDefinitions[method]);
  }, [selectedCurrency, availableMethods, loading, error, config]);

  // ✅ ADDED: Handle payment method selection with proper flow detection
  const handlePaymentMethodSelect = (methodValue) => {
    console.log("🎯 Payment method selected:", {
      method: methodValue,
      currency: selectedCurrency,
      isOpenBanking: (selectedCurrency === "EUR" || selectedCurrency === "GBP" || selectedCurrency === "DKK") && methodValue === "bank_transfer",
      isSilaPlaid: selectedCurrency === "USD" && methodValue === "bank_deposit"
    });

    onPaymentMethodSelect(methodValue);

    // Auto-trigger flows based on currency and method
    if ((selectedCurrency === "EUR" || selectedCurrency === "GBP" || selectedCurrency === "DKK") && methodValue === "bank_transfer") {
      console.log("🚀 Auto-initiating Open Banking flow for:", selectedCurrency);
      // This will be handled by your PaymentInitiation component
    }
    
    if (selectedCurrency === "USD" && methodValue === "bank_deposit") {
      console.log("🇺🇸 Auto-initiating Sila/Plaid flow for USD");
      // This will trigger the USD account fetching in DepositPage
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl"
      >
        <ClipLoader color="#3B82F6" size={30} className="mb-4" />
        <p className="text-gray-600 font-medium">Loading payment methods...</p>
        <p className="text-gray-500 text-sm mt-1">
          Fetching available options for {selectedCurrency}
        </p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-50 border border-yellow-200 rounded-xl p-6"
      >
        <div className="flex items-center mb-3">
          <FaExclamationTriangle className="text-yellow-500 mr-2" />
          <h3 className="text-yellow-800 font-medium">Payment Methods</h3>
        </div>
        <p className="text-yellow-700 text-sm mb-4">
          {error === "Failed to load payment methods"
            ? "Using default payment methods for your currency."
            : error}
        </p>
        <div className="grid gap-3">
          {getAvailablePaymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.value}
              method={method}
              isSelected={paymentMethod === method.value}
              onClick={() => handlePaymentMethodSelect(method.value)}
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
              showTooltip={showTooltip?.[method.value]}
              {...textColorProps}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  const availableMethodsToShow = getAvailablePaymentMethods;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Payment Method
        <span className="text-red-500 ml-1">*</span>
      </label>

      {/* ✅ ADDED: Currency-specific hints */}
      {selectedCurrency === "USD" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>USD Deposits:</strong> Use "Link Bank Account" to connect your US bank via Plaid
          </p>
        </div>
      )}
      
      {(selectedCurrency === "EUR" || selectedCurrency === "GBP" || selectedCurrency === "DKK") && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>{selectedCurrency} Deposits:</strong> Use "Bank Transfer" for instant Open Banking transfers
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {availableMethodsToShow.map((method) => (
          <PaymentMethodCard
            key={method.value}
            method={method}
            isSelected={paymentMethod === method.value}
            onClick={() => handlePaymentMethodSelect(method.value)}
            onTooltipShow={onTooltipShow}
            onTooltipHide={onTooltipHide}
            showTooltip={showTooltip?.[method.value]}
            {...textColorProps}
          />
        ))}
      </div>

      {availableMethodsToShow.length === 0 && selectedCurrency && !loading && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
          <FaExclamationTriangle className="text-3xl text-gray-300 mx-auto mb-2" />
          <p>No payment methods available for {selectedCurrency}</p>
          <p className="text-sm text-gray-400 mt-1">
            Please contact support to enable deposits for this currency.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentMethodSelection;