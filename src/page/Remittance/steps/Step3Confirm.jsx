import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
  FaCheckCircle,
  FaFileAlt,
  FaShieldAlt,
  FaClock,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaUniversity,
  FaFileUpload,
  FaUser,
  FaBuilding,
  FaCalendarAlt,
  FaInfoCircle,
} from "react-icons/fa";

const Step3Confirm = ({
  formData,
  selectedBeneficiary,
  selectedBank,
  manualAccountDetails,
  exchangeRateData,
  onAgreeToTerms,
  onRecurringDataChange,
  paymentMethod,
  isOpenBankingAvailable,
  selectedBankAccount = null,
  // REMOVED: onSubmit, loading, onInitiateOpenBanking, openBankingProcessing
}) => {
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("");
  const [recurringCustomDays, setRecurringCustomDays] = useState("");

  // Frequency options
  const frequencyOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "specific_day", label: "Specific Day" },
  ];

  // Calculate total amount
  const totalAmount =
    parseFloat(formData.sendAmount || 0) + parseFloat(formData.fee || 0);

  const shouldShowRecurring = () => {
    const isSendCurrencyUSD = formData.sendCurrency?.value === "USD";
    const isReceiveCurrencyINR = formData.receiveCurrency?.value === "INR";
    const isBankTransfer = paymentMethod === "bank";

    const shouldShow =
      isBankTransfer && isSendCurrencyUSD && isReceiveCurrencyINR;

    console.log("🔍 Should show recurring?", {
      isBankTransfer,
      isSendCurrencyUSD,
      isReceiveCurrencyINR,
      shouldShow,
      sendCurrency: formData.sendCurrency?.value,
      receiveCurrency: formData.receiveCurrency?.value,
      paymentMethod,
    });

    return shouldShow;
  };

  const handleRecurringChange = (e) => {
    const checked = e.target.checked;
    setIsRecurring(checked);
    if (!checked) {
      setFrequency("");
      setRecurringCustomDays("");
    }
  };

  const handleFrequencyChange = (selectedOption) => {
    setFrequency(selectedOption.value);
    if (selectedOption.value !== "specific_day") {
      setRecurringCustomDays("");
    }
  };

  const handleCustomDaysChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setRecurringCustomDays(value);
  };

  const shouldShowFrequencyDropdown = isRecurring && shouldShowRecurring();
  const shouldShowCustomDaysInput = frequency === "specific_day";
  console.log("onRecurringDataChange data check",onRecurringDataChange);

  useEffect(() => {
    if (onRecurringDataChange) {
      const recurringData = {
        isRecurring: isRecurring ? "1" : "0",
        frequency: isRecurring ? frequency : "",
        recurring_custom_days:
          isRecurring && frequency === "specific_day"
            ? recurringCustomDays
            : "",
      };
      console.log("🔄 Step3Confirm sending recurring data:", recurringData);
      onRecurringDataChange(recurringData);
    }
  }, [isRecurring, frequency, recurringCustomDays, onRecurringDataChange]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <FaCheckCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Confirm Your{" "}
          {formData.paymentMethod === "manual" ? "Cash Deposit" : "Transfer"}
        </h2>
        <p className="text-gray-600">
          Please review all details before submitting your transfer
        </p>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Transfer Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transfer Details Card */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaMoneyBillWave />
                Transfer Details
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sender Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">You Send</h4>
                      <p className="text-sm text-gray-500">From your account</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-xl text-gray-900">
                        {formData.sendCurrency?.value}{" "}
                        {parseFloat(formData.sendAmount || 0).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-600">Transfer Fee:</span>
                      <span className="font-bold text-gray-900">
                        {formData.sendCurrency?.value}{" "}
                        {formData.fee?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-600 font-semibold">
                        Total to Pay:
                      </span>
                      <span className="font-bold text-2xl text-blue-600">
                        {formData.sendCurrency?.value}{" "}
                        {totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Receiver Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg
                        className="w-6 h-6 text-green-600"
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
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Recipient Receives
                      </h4>
                      <p className="text-sm text-gray-500">Estimated amount</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-xl text-gray-900">
                        {formData.receiveCurrency?.value}{" "}
                        {parseFloat(formData.receiveAmount || 0).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-600">Exchange Rate:</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">
                          1 {formData.sendCurrency?.value} ={" "}
                          {exchangeRateData?.fxRate?.toFixed(4) ||
                            formData.exchangeRate?.toFixed(4)}{" "}
                          {formData.receiveCurrency?.value}
                        </span>
                        <div className="text-xs text-green-600 mt-1">
                          <FaExchangeAlt className="inline mr-1" />
                          Best market rate
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-600 font-semibold">
                        Delivery:
                      </span>
                      <span className="font-bold text-green-600">
                        1-2 Business Days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ YOUR BANK ACCOUNT SECTION - For USD Bank Transfers */}
          {paymentMethod === "bank" &&
            formData.sendCurrency?.value === "USD" &&
            selectedBankAccount && (
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FaBuilding />
                    Your Bank Account
                  </h3>
                </div>

                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <FaUniversity className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">
                          {selectedBankAccount.account_name}
                        </h4>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              Provider:
                            </span>
                            <span className="font-medium">
                              {selectedBankAccount.provider || "Bank"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Type:</span>
                            <span className="font-medium">
                              {selectedBankAccount.account_type || "Checking"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              Status:
                            </span>
                            {selectedBankAccount.web_debit_verified ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                                <FaCheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                Pending Verification
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                      <p className="text-sm text-gray-600 mb-2">
                        Account Information
                      </p>
                      <div className="space-y-1">
                        {selectedBankAccount.routing_number && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Routing #:
                            </span>
                            <span className="font-mono text-sm font-medium">
                              {selectedBankAccount.routing_number}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Account #:
                          </span>
                          <span className="font-mono text-sm font-medium">
                            {selectedBankAccount.accountNumberHash ||
                              "••••••••"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Features */}
                  {(selectedBankAccount.fednow_credit_enabled ||
                    selectedBankAccount.rtp_credit_enabled) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Payment Features:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedBankAccount.fednow_credit_enabled && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            FedNow Enabled
                          </span>
                        )}
                        {selectedBankAccount.rtp_credit_enabled && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            RTP Enabled
                          </span>
                        )}
                        {selectedBankAccount.is_default && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Default Account
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Recipient Information */}
          {selectedBeneficiary && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaUser />
                  Recipient Information
                </h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Personal Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-500">
                          Full Name
                        </label>
                        <div className="font-medium">
                          {selectedBeneficiary.name}
                        </div>
                      </div>
                      {selectedBeneficiary.phone_number && (
                        <div>
                          <label className="block text-sm text-gray-500">
                            Phone Number
                          </label>
                          <div className="font-medium">
                            {selectedBeneficiary.phone_number}
                          </div>
                        </div>
                      )}
                      {selectedBeneficiary.email && (
                        <div>
                          <label className="block text-sm text-gray-500">
                            Email
                          </label>
                          <div className="font-medium">
                            {selectedBeneficiary.email}
                          </div>
                        </div>
                      )}
                      {selectedBeneficiary.country && (
                        <div>
                          <label className="block text-sm text-gray-500">
                            Country
                          </label>
                          <div className="font-medium">
                            {selectedBeneficiary.country}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedBank && paymentMethod === "bank" && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Bank Details
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-500">
                            Bank Name
                          </label>
                          <div className="font-medium">
                            {selectedBank.bank_name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500">
                            Account Number
                          </label>
                          <div className="font-medium">
                            {selectedBank.account_number ||
                              selectedBank.bank_acc_no}
                          </div>
                        </div>
                        {selectedBank.swift_code && (
                          <div>
                            <label className="block text-sm text-gray-500">
                              SWIFT/BIC
                            </label>
                            <div className="font-medium">
                              {selectedBank.swift_code}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manual Deposit Details */}
                  {paymentMethod === "manual" && manualAccountDetails && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Deposit Instructions
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-500">
                            Deposit Bank
                          </label>
                          <div className="font-medium">
                            {manualAccountDetails.bank_name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500">
                            Account Name
                          </label>
                          <div className="font-medium">
                            {manualAccountDetails.account_name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500">
                            Account Number
                          </label>
                          <div className="font-medium">
                            {manualAccountDetails.account_number}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transfer Purpose */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Purpose of Transfer
                      </label>
                      <div className="bg-gray-50 px-4 py-3 rounded-lg">
                        <span className="font-medium">
                          {formData.purpose?.label || "Not specified"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Source of Funds
                      </label>
                      <div className="bg-gray-50 px-4 py-3 rounded-lg">
                        <span className="font-medium">
                          {formData.income_source?.label || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaFileAlt className="text-blue-600" />
              Payment Method
            </h4>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {paymentMethod === "bank" && (
                    <FaUniversity className="w-6 h-6 text-blue-600" />
                  )}
                  {paymentMethod === "manual" && (
                    <FaMoneyBillWave className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {paymentMethod === "bank" && "Bank Transfer"}
                    {paymentMethod === "manual" && "Cash Deposit"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {paymentMethod === "manual" &&
                      "Please upload payment proof"}
                    {paymentMethod === "bank" && "Direct bank transfer"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Processing Time</div>
                <div className="font-medium flex items-center gap-1">
                  <FaClock className="text-blue-600" />
                  {"1-2 Business Days"}
                </div>
              </div>
            </div>

            {/* Document Upload Status for Manual Deposit */}
            {paymentMethod === "manual" && formData.document && (
              <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <FaFileUpload className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      Payment proof uploaded
                    </p>
                    <p className="text-sm text-green-600">
                      Document ready for processing
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🔄 RECURRING PAYMENT SECTION */}
          {shouldShowRecurring() && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-600" />
                Recurring Payment Options
              </h3>

              <div className="space-y-4">
                {/* Recurring Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={handleRecurringChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isRecurring"
                    className="text-gray-700 font-medium"
                  >
                    Set up as recurring payment
                  </label>
                </div>

                {shouldShowFrequencyDropdown && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recurring Frequency *
                      </label>
                      <Select
                        options={frequencyOptions}
                        value={frequencyOptions.find(
                          (opt) => opt.value === frequency,
                        )}
                        onChange={handleFrequencyChange}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "48px",
                            borderRadius: "0.5rem",
                            borderColor: "#e5e7eb",
                            "&:hover": { borderColor: "#9ca3af" },
                          }),
                        }}
                      />
                    </div>

                    {shouldShowCustomDaysInput && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Days Between Payments *
                        </label>
                        <input
                          type="text"
                          value={recurringCustomDays}
                          onChange={handleCustomDaysChange}
                          placeholder="e.g., 30 for monthly, 15 for bi-weekly"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Enter the number of days between each payment (minimum
                          7 days)
                        </p>
                      </div>
                    )}

                    {/* Info message */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <FaInfoCircle className="text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-800 font-medium">
                            Recurring Payment Information
                          </p>
                          <ul className="mt-1 text-xs text-blue-700 space-y-1">
                            <li>
                              • Payments will be automatically processed on the
                              scheduled dates
                            </li>
                            <li>
                              • A notification will be sent before each payment
                            </li>
                            <li>
                              • The same exchange rate will be used for all
                              payments
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Terms Only */}
        <div className="space-y-6">
          {/* Terms and Conditions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Terms & Conditions
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => onAgreeToTerms(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-1"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                  I agree to the{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms and Conditions
                  </a>{" "}
                  and confirm that all information provided is accurate.
                </label>
              </div>
            </div>
          </div>

          {/* REMOVED: All submit buttons - Parent handles submission */}
          {/* REMOVED: Open Banking button - Parent handles this */}
        </div>
      </div>
    </div>
  );
};

export default Step3Confirm;
