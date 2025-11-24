// src/page/Deposit/components/DepositDetails.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaDollarSign, FaEdit, FaChevronDown } from "react-icons/fa";

const DepositDetails = ({
  amount,
  onAmountChange,
  purpose,
  onPurposeChange,
  selectedCurrency,
  errors,
  isAmountFocused,
  onAmountFocus
}) => {
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    DKK: 'kr',
    CAD: 'C$'
  };

  const currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
    >
      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount *
        </label>
        <div className="relative">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
            isAmountFocused ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <FaDollarSign className="text-lg" />
          </div>
          <input
            type="text"
            id="amount"
            value={amount}
            onChange={handleAmountChange}
            onFocus={() => onAmountFocus(true)}
            onBlur={() => onAmountFocus(false)}
            placeholder="0.00"
            className={`block w-full pl-10 pr-12 py-3 border-2 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.amount 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 font-medium">
              {selectedCurrency}
            </span>
          </div>
        </div>
        {errors.amount && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.amount}
          </motion.p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Minimum amount: 5 {selectedCurrency}
        </p>
      </div>

      {/* Purpose Input */}
      <div>
        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
          Purpose *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <FaEdit className="text-lg" />
          </div>
          <select
            id="purpose"
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value)}
            className={`block w-full pl-10 pr-10 py-3 border-2 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all ${
              errors.purpose 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <option value="">Select a purpose</option>
            <option value="BILL">Bill Payment</option>
            <option value="GOODS">Goods</option>
            <option value="PERSON_TO_PERSON">Person to Person</option>
            <option value="SERVICES">Services</option>
            <option value="OTHER">Other</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <FaChevronDown className="text-gray-400" />
          </div>
        </div>
        {errors.purpose && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.purpose}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default DepositDetails;