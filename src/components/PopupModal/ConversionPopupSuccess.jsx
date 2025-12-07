// components/PopupModal/ConversionPopupSuccess.jsx
import React, { useEffect } from "react";
import PropTypes from "prop-types";

const ConversionPopupSuccess = ({
  onClose,
  message,
  title = "Success!",
  transactionDetails,
  onViewDetails
}) => {
  // Close popup on escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Close popup when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target.id === "conversion-success-popup-backdrop") {
      onClose();
    }
  };

  // Format currency for display
  const formatCurrency = (amount, currencyCode) => {
    if (!amount) return `0.00 ${currencyCode}`;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div
      id="conversion-success-popup-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-60 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-green-100 font-medium">
                  Conversion Completed Successfully
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Success Message */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              Conversion Successful!
            </h4>
            <p className="text-gray-600">
              {message || "Your currency conversion has been processed successfully."}
            </p>
          </div>

          {/* Transaction Details */}
          {transactionDetails && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
              <h5 className="font-bold text-gray-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Transaction Details
              </h5>
              
              <div className="space-y-3">
                {/* Transaction ID */}
                <div className="flex justify-between items-center bg-white p-3 rounded border">
                  <span className="text-gray-600 font-medium">Transaction ID:</span>
                  <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {transactionDetails.transactionId}
                  </span>
                </div>

                {/* From/To Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-xs text-gray-500 mb-1">From</div>
                    <div className="font-bold text-gray-800">
                      {formatCurrency(transactionDetails.amount, transactionDetails.fromCurrency)}
                    </div>
                    <div className="text-sm text-gray-600">{transactionDetails.fromAccount}</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-xs text-gray-500 mb-1">To</div>
                    <div className="font-bold text-emerald-600">
                      {formatCurrency(transactionDetails.convertedAmount, transactionDetails.toCurrency)}
                    </div>
                    <div className="text-sm text-gray-600">{transactionDetails.toAccount}</div>
                  </div>
                </div>

                {/* Exchange Rate */}
                <div className="bg-white p-3 rounded border">
                  <div className="text-xs text-gray-500 mb-1">Exchange Rate</div>
                  <div className="font-bold text-gray-800">
                    1 {transactionDetails.fromCurrency} = {transactionDetails.exchangeRate} {transactionDetails.toCurrency}
                  </div>
                </div>

                {/* Fee and Total */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-xs text-gray-500 mb-1">Fee</div>
                    <div className="font-bold text-amber-600">
                      {formatCurrency(transactionDetails.fee, transactionDetails.fromCurrency)}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-xs text-gray-500 mb-1">Total</div>
                    <div className="font-bold text-gray-800">
                      {formatCurrency(
                        parseFloat(transactionDetails.amount) + parseFloat(transactionDetails.fee),
                        transactionDetails.fromCurrency
                      )}
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(transactionDetails.timestamp).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-700">
                <span className="font-semibold">Note:</span> The converted amount will reflect in your account within 1-2 business days. You can track this transaction in your transaction history.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Continue Converting
            </button>
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 border border-transparent rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ConversionPopupSuccess.propTypes = {
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string,
  title: PropTypes.string,
  transactionDetails: PropTypes.shape({
    transactionId: PropTypes.string,
    fromCurrency: PropTypes.string,
    toCurrency: PropTypes.string,
    amount: PropTypes.string,
    convertedAmount: PropTypes.string,
    exchangeRate: PropTypes.string,
    fee: PropTypes.number,
    timestamp: PropTypes.string,
    fromAccount: PropTypes.string,
    toAccount: PropTypes.string,
  }),
  onViewDetails: PropTypes.func,
};

export default ConversionPopupSuccess;