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
import { RingLoader } from "react-spinners";
import PaymentMethodCard from "./PaymentMethodCard";

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
      bank_transfer: {
        value: "bank_transfer",
        label: "Bank Transfer",
        icon: <FaUniversity />,
        description: "Instant transfer via Open Banking",
        help: "Secure instant transfer from your bank account using Open Banking technology. Available for EUR, GBP, and DKK currencies.",
      },
      bank_deposit: {
        value: "bank_deposit",
        label: "Bank Transfer",
        icon: <FaLink />,
        description: "Instant transfer via bank",
        help: "Secure bank transfer from your bank to enable secure USD deposits and transfers. Available for USD currency only.",
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

    // Default methods based on currency
    const defaultMethods = {
      USD: ["card_deposit", "manual_deposit", "bank_deposit"],
      EUR: ["card_deposit", "manual_deposit", "bank_transfer"],
      GBP: ["card_deposit", "manual_deposit", "bank_transfer"],
      DKK: ["card_deposit", "manual_deposit", "bank_transfer"],
      AED: ["manual_deposit", "card_deposit"],
    };

    const allowedMethods = defaultMethods[selectedCurrency] || ["card_deposit", "manual_deposit"];
    return allowedMethods
      .filter((method) => paymentMethodDefinitions[method])
      .map((method) => paymentMethodDefinitions[method]);
  }, [selectedCurrency, availableMethods]);

  const handlePaymentMethodSelect = (methodValue) => {
    console.log("🎯 Payment method selected:", {
      method: methodValue,
      currency: selectedCurrency,
    });
    onPaymentMethodSelect(methodValue);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl"
      >
        <RingLoader color="#3B82F6" size={30} className="mb-4" />
        <p className="text-gray-600 font-medium">Loading payment methods...</p>
        <p className="text-gray-500 text-sm mt-1">
          Fetching available options for {selectedCurrency}
        </p>
      </motion.div>
    );
  }

  const availableMethodsToShow = getAvailablePaymentMethods;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-semibold text-gray-900">
          Payment Method *
        </label>
        <span className="text-xs text-gray-500">
          {availableMethodsToShow.length} options
        </span>
      </div>

      {/* Currency-specific hints */}
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

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center">
            <FaExclamationTriangle className="text-yellow-500 mr-2" />
            <p className="text-yellow-700 text-sm">{error}</p>
          </div>
        </motion.div>
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
            currency={selectedCurrency}
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