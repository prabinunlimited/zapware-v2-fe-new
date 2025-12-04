import React from "react";
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
} from "react-icons/fa";

const Step3Confirm = ({
  formData,
  selectedBeneficiary,
  selectedBank,
  manualAccountDetails,
  exchangeRateData,
  onAgreeToTerms,
  onSubmit,
  loading,
}) => {
  // Calculate total amount
  const totalAmount =
    parseFloat(formData.sendAmount || 0) + parseFloat(formData.fee || 0);

  // Format date
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format time
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <FaCheckCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Confirm Your Transfer
        </h2>
        <p className="text-gray-600">
          Please review all details before submitting your transfer
        </p>
      </div>

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
                      }
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
                      }
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
                  <span className="text-gray-600 font-semibold">Delivery:</span>
                  <span className="font-bold text-green-600">
                    1-2 Business Days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

              {selectedBank && formData.paymentMethod === "bank" && (
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
              {formData.paymentMethod === "manual" && manualAccountDetails && (
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
              {formData.paymentMethod === "bank" && (
                <FaUniversity className="w-6 h-6 text-blue-600" />
              )}
              {formData.paymentMethod === "manual" && (
                <FaMoneyBillWave className="w-6 h-6 text-green-600" />
              )}
              {formData.paymentMethod === "card" && (
                <svg
                  className="w-6 h-6 text-purple-600"
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
              )}
            </div>
            <div>
              <div className="font-medium">
                {formData.paymentMethod === "bank" && "Bank Transfer"}
                {formData.paymentMethod === "manual" && "Manual Deposit"}
                {formData.paymentMethod === "card" && "Card Payment"}
              </div>
              <div className="text-sm text-gray-500">
                {formData.paymentMethod === "manual" &&
                  "Please upload payment proof"}
                {formData.paymentMethod === "card" &&
                  "Instant payment processing"}
                {formData.paymentMethod === "bank" && "Direct bank transfer"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Processing Time</div>
            <div className="font-medium flex items-center gap-1">
              <FaClock className="text-blue-600" />
              {formData.paymentMethod === "card"
                ? "Instant"
                : "1-2 Business Days"}
            </div>
          </div>
        </div>

        {/* Document Upload Status for Manual Deposit */}
        {formData.paymentMethod === "manual" && formData.document && (
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

      {/* Schedule Information */}
      <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FaClock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                Scheduled Transfer
              </h4>
              <p className="text-sm text-gray-600">
                Your transfer will be processed on
              </p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="text-lg font-bold text-gray-900">
              {formattedDate}
            </div>
            <div className="text-sm text-gray-600">
              {formattedTime} • Immediate Processing
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => onAgreeToTerms(e.target.checked)}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="terms" className="text-sm text-gray-700">
              I confirm that all information provided is accurate and complete.
              I agree to the{" "}
              <a
                href="/terms"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Privacy Policy
              </a>
              .
            </label>
            <p className="text-xs text-gray-500 mt-1">
              By proceeding, you authorize us to process your transfer according
              to the provided instructions.
            </p>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
          <FaShieldAlt className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-800 font-medium">
              Your transfer is protected by bank-level security
            </p>
            <p className="text-xs text-green-600 mt-1">
              256-bit encryption • PCI DSS compliant • Funds protection
              guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Confirm;
