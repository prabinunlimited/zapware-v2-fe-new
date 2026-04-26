import React, { useState, useEffect } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  FaExclamationTriangle,
  FaSpinner,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { RingLoader } from "react-spinners";

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
  onSubmit,
  onCancel,
  showConfirmPopup: externalShowPopup = false,
  loading = false,
}) => {
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [internalShowPopup, setInternalShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Use external state if provided, otherwise use internal
  const showPopup =
    externalShowPopup !== undefined ? externalShowPopup : internalShowPopup;

  const setShowPopup = (value) => {
    if (externalShowPopup !== undefined) {
      // If controlled externally, we need to notify parent
      if (value === false && onCancel) {
        onCancel();
      }
    } else {
      setInternalShowPopup(value);
    }
  };

  // Calculate total amount
  const totalAmount =
    parseFloat(formData.sendAmount || 0) + parseFloat(formData.fee || 0);

  const shouldShowRecurring = () => {
    const isSendCurrencyUSD = formData.sendCurrency?.value === "USD";
    const isReceiveCurrencyINR = formData.receiveCurrency?.value === "INR";
    const isBankTransfer = paymentMethod === "bank";

    const shouldShow =
      isBankTransfer && isSendCurrencyUSD && isReceiveCurrencyINR;

    return shouldShow;
  };

  const handleRecurringChange = (e) => {
    const checked = e.target.checked;
    setIsRecurring(checked);
    if (checked) {
      setShowDatePicker(true);
    } else {
      setSelectedDate(null);
      setShowDatePicker(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  // Send recurring data to parent component
  useEffect(() => {
    if (onRecurringDataChange) {
      const recurringData = {
        isRecurring: isRecurring ? "1" : "0",
        frequency: isRecurring ? "specific_day" : "",
      };

      if (isRecurring && selectedDate) {
        recurringData.custom_days = selectedDate.getDate().toString();
        recurringData.formatted_date = selectedDate.toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        );
      }

      console.log("🔄 Step3Confirm sending recurring data:", recurringData);
      onRecurringDataChange(recurringData);
    }
  }, [isRecurring, selectedDate, onRecurringDataChange]);

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setAnimationComplete(false);

    // Simulate loading animation
    setTimeout(() => {
      setAnimationComplete(true);
    }, 1000);

    // Actual submission
    setTimeout(async () => {
      try {
        await onSubmit();
        setShowPopup(false);
      } catch (error) {
        console.error("Submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }, 1500);
  };

  const handleCancelSubmit = () => {
    setShowPopup(false);
    setIsSubmitting(false);
    setAnimationComplete(false);
    if (onCancel) onCancel();
  };

  // Get today's date for display
  const today = new Date();
  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const todayDay = today.getDate();
  const daySuffix =
    todayDay === 1
      ? "st"
      : todayDay === 2
        ? "nd"
        : todayDay === 3
          ? "rd"
          : "th";

  // Format the selected date for display
  const formattedSelectedDate = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const selectedDay = selectedDate ? selectedDate.getDate() : null;
  const dayNumberSuffix =
    selectedDay === 1
      ? "st"
      : selectedDay === 2
        ? "nd"
        : selectedDay === 3
          ? "rd"
          : "th";

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

      {/* Main content - Single column layout */}
      <div className="space-y-6">
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* YOUR BANK ACCOUNT SECTION - For USD Bank Transfers */}
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
                          <span className="text-sm text-gray-600">Status:</span>
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
                            {selectedBankAccount.routing_number
                              ? `••••${selectedBankAccount.routing_number.slice(-4)}`
                              : "••••••••"}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Account #:
                        </span>
                        <span className="font-mono text-sm font-medium">
                          {selectedBankAccount.accountNumberHash ||
                            (selectedBankAccount.account_number
                              ? `••••${selectedBankAccount.account_number.slice(-4)}`
                              : "••••••••")}
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
                        {formData.incomeSource?.label ||
                          formData.incomeSource ||
                          "Not specified"}
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
                  {paymentMethod === "manual" && "Please upload payment proof"}
                  {paymentMethod === "bank" && "Direct bank transfer"}
                </div>
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

        {/* RECURRING PAYMENT SECTION */}
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

              {/* Show when recurring is enabled */}
              {isRecurring && (
                <div className="space-y-4">
                  {/* Date Picker Button */}
                  <div className="mt-4">
                    {!selectedDate ? (
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(true)}
                        className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaCalendarAlt className="w-4 h-4" />
                        Select Recurring Date
                      </button>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FaCheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Recurring Date Selected
                              </p>
                              <p className="text-base font-bold text-gray-900">
                                {formattedSelectedDate}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                This transfer will recur on the{" "}
                                <span className="font-semibold">
                                  {selectedDay}
                                  {dayNumberSuffix}
                                </span>{" "}
                                of each month
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(null);
                              setShowDatePicker(true);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Change Date
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date Picker Modal */}
                  {showDatePicker && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-bold text-gray-900">
                            Select Recurring Date
                          </h4>
                          <button
                            onClick={() => setShowDatePicker(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-4 bg-white">
                          <DatePicker
                            selected={selectedDate}
                            onChange={(date) => {
                              handleDateSelect(date);
                            }}
                            dateFormat="MMMM d, yyyy"
                            inline
                            minDate={new Date()}
                            calendarClassName="!border-0 !shadow-none"
                            dayClassName={(date) =>
                              date.getDate() === selectedDate?.getDate() &&
                              date.getMonth() === selectedDate?.getMonth() &&
                              date.getFullYear() === selectedDate?.getFullYear()
                                ? "!bg-blue-500 !text-white !rounded-full"
                                : "hover:!bg-blue-100 !rounded-full"
                            }
                          />
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <FaInfoCircle className="inline mr-2" />
                            Future payments will occur on the same day each
                            month
                          </p>
                        </div>
                      </div>
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
                          {selectedDate && (
                            <li className="font-medium">
                              • First payment: {formattedSelectedDate}
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
      </div>

      {/* ========== HEAVY ANIMATED CONFIRMATION POPUP ========== */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.4,
              }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Animated Header */}
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={
                      !animationComplete
                        ? {
                            scale: [1, 1.2, 1],
                            rotate: [0, 360],
                          }
                        : { scale: 1 }
                    }
                    transition={{
                      duration: 0.6,
                      repeat: isSubmitting ? Infinity : 0,
                      repeatDelay: 0.5,
                    }}
                    className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <FaSpinner className="w-6 h-6 text-white animate-spin" />
                    ) : animationComplete ? (
                      <FaCheck className="w-6 h-6 text-white" />
                    ) : (
                      <FaExclamationTriangle className="w-6 h-6 text-white" />
                    )}
                  </motion.div>
                  <div>
                    <motion.h3
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl font-bold text-white"
                    >
                      {isSubmitting
                        ? "Processing Transfer..."
                        : animationComplete
                          ? "Transfer Complete!"
                          : "Confirm Transfer"}
                    </motion.h3>
                    <motion.p
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-green-100 text-sm"
                    >
                      {isSubmitting
                        ? "Please wait while we process your request"
                        : animationComplete
                          ? "Your transfer has been submitted successfully"
                          : "Please review details before confirming"}
                    </motion.p>
                  </div>
                </div>
              </motion.div>

              {/* Content */}
              <div className="p-6">
                {!isSubmitting && !animationComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Transfer Summary */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 text-center">
                        Transfer Summary
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">You Send:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.sendCurrency?.value}{" "}
                            {parseFloat(
                              formData.sendAmount || 0,
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Recipient Gets:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.receiveCurrency?.value}{" "}
                            {parseFloat(
                              formData.receiveAmount || 0,
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Fee:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.sendCurrency?.value}{" "}
                            {formData.fee?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-900">
                              Total:
                            </span>
                            <span className="font-bold text-lg text-green-600">
                              {formData.sendCurrency?.value}{" "}
                              {totalAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Warning Message */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                    >
                      <div className="flex items-start gap-2">
                        <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-yellow-800">
                          This action cannot be undone. Please verify all
                          details are correct before confirming.
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                      }}
                      className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <FaSpinner className="w-10 h-10 text-blue-600 animate-spin" />
                    </motion.div>
                    <p className="text-gray-700 font-medium">
                      Processing your transfer...
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please do not close this window
                    </p>
                  </motion.div>
                )}

                {animationComplete && !isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <FaCheckCircle className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <p className="text-gray-900 font-bold text-lg">
                      Transfer Submitted!
                    </p>
                    <p className="text-gray-600 mt-2">
                      Your transfer has been successfully submitted.
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Reference ID:{" "}
                      <span className="font-mono">TXN{Date.now()}</span>
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer Buttons */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3"
              >
                {!animationComplete ? (
                  <>
                    <button
                      onClick={handleCancelSubmit}
                      disabled={isSubmitting}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                        isSubmitting
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      <FaArrowLeft className="text-sm" />
                      No, Go Back
                    </button>
                    <button
                      onClick={handleConfirmSubmit}
                      disabled={isSubmitting}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                        isSubmitting
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaCheck className="text-sm" />
                          Yes, Confirm Transfer
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCancelSubmit}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <FaArrowRight className="text-sm" />
                    Continue
                  </button>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Step3Confirm;
