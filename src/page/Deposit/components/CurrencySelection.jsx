import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaUniversity } from 'react-icons/fa';

const CurrencySelection = ({ currencies, selectedCurrency, onCurrencyChange, loading, error }) => {
  const currencySymbols = {
    USD: '$', EUR: '€', GBP: '£', AED: 'AED', DKK: 'kr', CAD: 'C$'
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((n) => (
            <div key={n} className="p-4 border-2 border-gray-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900">
          Select Currency *
        </label>
        <span className="text-xs text-gray-500">
          {currencies?.length || 0} available
        </span>
      </div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-red-700 text-sm">{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currencies?.map((currency) => (
          <motion.button
            key={currency.currency_code}
            type="button"
            onClick={() => onCurrencyChange(currency.currency_code)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
              selectedCurrency === currency.currency_code
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-100'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedCurrency === currency.currency_code
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <span className="font-bold text-sm">
                    {currencySymbols[currency.currency_code] || currency.currency_code}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {currency.currency_code}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Balance: {parseFloat(currency.available_balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {selectedCurrency === currency.currency_code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <FaCheck className="text-white text-xs" />
                </motion.div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-mono">
                Acc: ••••{currency.account_number?.slice(-4) || 'N/A'}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {(!currencies || currencies.length === 0) && !loading && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
          <FaUniversity className="text-4xl text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No currency accounts available</p>
          <p className="text-gray-500 text-sm mt-1">
            Please contact support to set up your currency accounts
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrencySelection;