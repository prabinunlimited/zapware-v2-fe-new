import React from "react";
import { RingLoader } from "react-spinners";

const ExchangeRateDisplay = ({ fromCurrency, toCurrency, rate, loading }) => {
  if (!fromCurrency || !toCurrency) {
    return (
      <div className="text-center py-4 text-gray-500">
        Select currencies to see exchange rate
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-100 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <p className="text-sm text-gray-600 mb-1">Exchange Rate</p>
          {loading ? (
            <div className="flex items-center gap-2">
              <RingLoader color="#3b82f6" size={80} />
              <span className="text-gray-500">Loading rate...</span>
            </div>
          ) : rate ? (
            <p className="text-2xl font-bold text-gray-900">
              1 {fromCurrency.value} = {rate.toFixed(4)} {toCurrency.value}
            </p>
          ) : (
            <p className="text-gray-500">Rate not available</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <span className="font-semibold text-gray-900">
              {fromCurrency.value}
            </span>
          </div>
          <div className="p-2">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <span className="font-semibold text-gray-900">
              {toCurrency.value}
            </span>
          </div>
        </div>
      </div>

      {rate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Live mid-market rate</span>
            <span className="mx-2">•</span>
            <span>No markup fee</span>
            <span className="mx-2">•</span>
            <span>Updated just now</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeRateDisplay;
