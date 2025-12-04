import React from "react";
import CurrencyInput from "../components/CurrencyInput";
import CurrencySelect from "../components/CurrencySelect";
import ExchangeRateDisplay from "../components/ExchangeRateDisplay";
import FeeBreakdown from "../components/FeeBreakdown";

const Step1Amount = ({
  formData,
  sendCurrencyOptions,
  receiveCurrencyOptions,
  onSendAmountChange,
  onReceiveAmountChange,
  onSendCurrencyChange,
  onReceiveCurrencyChange,
  exchangeRate,
  fee,
  loading,
  showFeeBreakdown,
  onToggleFeeBreakdown,
}) => {
  return (
    <div className="space-y-8">
      {/* Send Amount Section */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            You Send
          </h3>
          <span className="text-sm text-gray-500">Amount in your currency</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <CurrencyInput
              value={formData.sendAmount}
              onChange={onSendAmountChange}
              placeholder="0.00"
              className="text-3xl font-bold"
            />
          </div>
          <div className="w-40">
            <CurrencySelect
              options={sendCurrencyOptions}
              value={formData.sendCurrency}
              onChange={onSendCurrencyChange}
              placeholder="Currency"
            />
          </div>
        </div>
      </div>

      {/* Exchange Rate Display */}
      <ExchangeRateDisplay
        fromCurrency={formData.sendCurrency}
        toCurrency={formData.receiveCurrency}
        rate={exchangeRate}
        loading={loading}
      />

      {/* Receive Amount Section */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-green-600 text-white rounded-lg">
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
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            Recipient Receives
          </h3>
          <span className="text-sm text-gray-500">
            Amount in recipient's currency
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <CurrencyInput
              value={formData.receiveAmount}
              onChange={onReceiveAmountChange}
              placeholder="0.00"
              className="text-3xl font-bold"
            />
          </div>
          <div className="w-40">
            <CurrencySelect
              options={receiveCurrencyOptions}
              value={formData.receiveCurrency}
              onChange={onReceiveCurrencyChange}
              placeholder="Currency"
            />
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <FeeBreakdown
        sendAmount={formData.sendAmount}
        sendCurrency={formData.sendCurrency}
        receiveAmount={formData.receiveAmount}
        receiveCurrency={formData.receiveCurrency}
        exchangeRate={exchangeRate}
        fee={fee}
        show={showFeeBreakdown}
        onToggle={onToggleFeeBreakdown}
      />

      {/* Info Box */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Minimum transfer amount is {formData.sendCurrency?.value || "USD"}{" "}
              5. Amounts are converted at the real exchange rate with no hidden
              fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1Amount;
