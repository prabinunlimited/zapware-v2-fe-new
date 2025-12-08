import React from "react";
import Select from "react-select";

import {
  FaUser,
  FaUniversity,
  FaInfoCircle,
  FaMoneyBillWave,
  FaShieldAlt,
} from "react-icons/fa";

const Step2Details = ({
  formData,
  paymentOptions,
  selectedBeneficiary,
  selectedBank,
  onPaymentMethodChange,
  onFieldChange,
  onFileUpload,
  filePreview,
  onBeneficiarySelect,
  onBankSelect,
  purposeOptions,
  incomeSourceOptions,
  relationOptions,
  exchangeRateData,
  fee,
  totalToPay,
  // Payment method specific components
  paymentMethodComponent,
  manualAccountDetails,
  manualAccountError,
  manualDetailsLoading,
  beneficiaryLoading,
}) => {
  // Custom styles for select components
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: "56px",
      borderRadius: "12px",
      borderColor: "#e5e7eb",
      "&:hover": { borderColor: "#9ca3af" },
      boxShadow: "none",
    }),
    option: (base, { isSelected }) => ({
      ...base,
      backgroundColor: isSelected ? "#3b82f6" : "white",
      color: isSelected ? "white" : "#374151",
      "&:hover": {
        backgroundColor: "#3b82f6",
        color: "white",
      },
    }),
  };

  return (
    <div className="space-y-8">
      {/* Transfer Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaMoneyBillWave className="text-blue-600" />
          Transfer Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">You Send:</span>
              <span className="font-bold text-gray-900 text-lg">
                {formData.sendCurrency?.value}{" "}
                {parseFloat(formData.sendAmount || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Recipient Gets:</span>
              <span className="font-bold text-gray-900 text-lg">
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
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Exchange Rate:</span>
              <span className="font-bold text-gray-900">
                1 {formData.sendCurrency?.value} ={" "}
                {exchangeRateData?.fxRate?.toFixed(4) ||
                  formData.exchangeRate?.toFixed(4) ||
                  "0.0000"}{" "}
                {formData.receiveCurrency?.value}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transfer Fee:</span>
              <span className="font-bold text-gray-900">
                {formData.sendCurrency?.value} {fee?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaUniversity className="text-blue-600" />
          Payment Method
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPaymentMethodChange(option.value)}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200
                ${
                  formData.paymentMethod === option.value
                    ? `border-blue-500 bg-blue-50`
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
                flex flex-col items-center justify-center gap-3
              `}
            >
              <div
                className={`
                p-3 rounded-lg
                ${
                  formData.paymentMethod === option.value
                    ? `bg-blue-100 text-blue-600`
                    : "bg-gray-100 text-gray-600"
                }
              `}
              >
                {option.icon}
              </div>
              <div className="text-center">
                <span
                  className={`font-semibold block ${
                    formData.paymentMethod === option.value
                      ? `text-blue-700`
                      : "text-gray-700"
                  }`}
                >
                  {option.label}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {option.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method Specific Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h3 className="text-xl font-bold text-white">
            {formData.paymentMethod === "manual" && "Manual Deposit"}
            {formData.paymentMethod === "bank" && "Bank Transfer"}
            {formData.paymentMethod === "card" && "Card Payment"}
          </h3>
          <p className="text-blue-100 mt-1">
            Complete the details for your selected payment method
          </p>
        </div>

        {/* This includes the beneficiary selection for ManualDeposit */}
        <div className="p-6">{paymentMethodComponent}</div>
      </div>

      {/* Selected Beneficiary Summary - READ ONLY */}
      {selectedBeneficiary && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaUser className="text-emerald-600" />
            Selected Recipient
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Full Name</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedBeneficiary.name}
              </p>
            </div>
            {selectedBeneficiary.phone_number && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Phone Number
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedBeneficiary.phone_number}
                </p>
              </div>
            )}
            {selectedBeneficiary.benef_uuid && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Beneficiary Code
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedBeneficiary.benef_uuid}
                </p>
              </div>
            )}
            {selectedBeneficiary.email && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedBeneficiary.email}
                </p>
              </div>
            )}
            {selectedBank && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Bank Account
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedBank.bank_name}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedBank.account_number || selectedBank.bank_acc_no}
                </p>
              </div>
            )}
            {selectedBeneficiary.relationtobenef && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Relationship
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedBeneficiary.relationtobenef}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Note */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <FaShieldAlt className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Compliance & Security
            </h4>
            <p className="text-gray-700">
              For compliance purposes, we require information about the purpose
              of your transfer and source of funds. All information is kept
              confidential and secure. This helps us ensure the security and
              legitimacy of all transactions in compliance with international
              financial regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Details;
