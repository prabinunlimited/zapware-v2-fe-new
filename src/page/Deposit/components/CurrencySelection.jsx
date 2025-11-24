import React from 'react';
import { motion } from 'framer-motion';
import { FaCoins, FaCheck } from 'react-icons/fa';

const CurrencySelection = ({ 
  currencies, 
  selectedCurrency, 
  onCurrencyChange, 
  loading, 
  error 
}) => {
  // Ensure currencies is always an array
  const safeCurrencies = Array.isArray(currencies) ? currencies : [];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Currency *
      </label>
      
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-600 text-sm mb-3"
        >
          {error}
        </motion.p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeCurrencies.map((currency) => (
          <motion.button
            key={currency.currency_code}
            type="button"
            onClick={() => onCurrencyChange(currency.currency_code)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 border-2 rounded-xl text-left transition-all ${
              selectedCurrency === currency.currency_code
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                  <FaCoins className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {currency.currency_code || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {currency.account_type || 'Account'}
                  </p>
                </div>
              </div>
              
              {selectedCurrency === currency.currency_code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <FaCheck className="text-white text-xs" />
                </motion.div>
              )}
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              Account: {currency.account_number || 'N/A'}
            </div>
          </motion.button>
        ))}
      </div>

      {safeCurrencies.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <FaCoins className="text-4xl text-gray-300 mx-auto mb-2" />
          <p>No currency accounts available</p>
          <p className="text-sm text-gray-400 mt-1">
            Please contact support to set up your currency accounts
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrencySelection;