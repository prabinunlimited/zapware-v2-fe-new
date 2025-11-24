// src/page/Deposit/components/PaymentMethodSelection.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaCreditCard, FaUniversity, FaMoneyBillWave, FaInfoCircle, FaCheck  } from "react-icons/fa";
import { FiHelpCircle } from "react-icons/fi";

// PaymentMethodCard Component
const PaymentMethodCard = React.memo(({
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
));

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
  // Get available payment methods based on currency
  const getAvailablePaymentMethods = React.useMemo(() => {
    const paymentMethodDescriptions = {
      manual_deposit:
        config?.manual_deposit_description ||
        "Bank transfer using account details",
      bank_deposit:
        config?.bank_deposit_description ||
        "Instant transfer from linked bank account",
      card_deposit:
        config?.card_deposit_description ||
        "Instant deposit using debit/credit card",
    };

    switch (selectedCurrency) {
      case "GBP":
        return [
          {
            value: "card_deposit",
            label: "Card Deposit",
            icon: <FaCreditCard />,
            description: paymentMethodDescriptions.card_deposit,
            help: "Instant deposit using your debit or credit card. Processed immediately.",
          },
          {
            value: "manual_deposit",
            label: "Manual Deposit",
            icon: <FaMoneyBillWave />,
            description: paymentMethodDescriptions.manual_deposit,
            help: "Transfer from your bank using provided account details. May take 1-3 business days.",
          },
          {
            value: "bank_deposit",
            label: "Bank Deposit",
            icon: <FaUniversity />,
            description: paymentMethodDescriptions.bank_deposit,
            help: "Instant transfer from your linked bank account using secure connection.",
          },
        ];
      case "DKK":
        return [
          {
            value: "manual_deposit",
            label: "Manual Deposit",
            icon: <FaMoneyBillWave />,
            description: paymentMethodDescriptions.manual_deposit,
            help: "Transfer from your bank using provided account details. May take 1-3 business days.",
          },
        ];
      case "EUR":
        return [
          {
            value: "manual_deposit",
            label: "Manual Deposit",
            icon: <FaMoneyBillWave />,
            description: paymentMethodDescriptions.manual_deposit,
            help: "Transfer from your bank using provided account details. May take 1-3 business days.",
          },
          {
            value: "bank_deposit",
            label: "Bank Deposit",
            icon: <FaUniversity />,
            description: paymentMethodDescriptions.bank_deposit,
            help: "Instant transfer from your linked bank account using secure connection.",
          },
        ];
      case "USD":
        return [
          {
            value: "card_deposit",
            label: "Card Deposit",
            icon: <FaCreditCard />,
            description: paymentMethodDescriptions.card_deposit,
            help: "Instant deposit using your debit or credit card. Processed immediately.",
          },
          {
            value: "manual_deposit",
            label: "Manual Deposit",
            icon: <FaMoneyBillWave />,
            description: paymentMethodDescriptions.manual_deposit,
            help: "Transfer from your bank using provided account details. May take 1-3 business days.",
          },
          {
            value: "bank_deposit",
            label: "Bank Deposit",
            icon: <FaUniversity />,
            description: paymentMethodDescriptions.bank_deposit,
            help: "Instant transfer from your linked bank account using secure connection.",
          },
        ];
      case "AED":
        return [
          {
            value: "manual_deposit",
            label: "Manual Deposit",
            icon: <FaMoneyBillWave />,
            description: paymentMethodDescriptions.manual_deposit,
            help: "Transfer from your bank using provided account details. May take 1-3 business days.",
          },
        ];
      default:
        return [];
    }
  }, [selectedCurrency, config]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 bg-gray-50 rounded-xl">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3 w-full">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  const availableMethodsToShow = getAvailablePaymentMethods;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Payment Method
        <span className="text-red-500 ml-1">*</span>
      </label>
      
      <div className="grid gap-3">
        {availableMethodsToShow.map((method) => (
          <PaymentMethodCard
            key={method.value}
            method={method}
            isSelected={paymentMethod === method.value}
            onClick={() => onPaymentMethodSelect(method.value)}
            onTooltipShow={onTooltipShow}
            onTooltipHide={onTooltipHide}
            showTooltip={showTooltip?.[method.value]}
            {...textColorProps}
          />
        ))}
      </div>
      
      {availableMethodsToShow.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>No payment methods available for {selectedCurrency}</p>
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </motion.div>
  );
};

export default PaymentMethodSelection;