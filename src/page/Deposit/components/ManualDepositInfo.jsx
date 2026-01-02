// src/page/Deposit/components/ManualDepositInfo.jsx - COMPLETE FIXED VERSION
import React from "react";
import { motion } from "framer-motion";
import { RingLoader } from "react-spinners";
import {
  FaBuilding,
  FaRegFileAlt,
  FaMapMarkerAlt,
  FaUniversity,
  FaUser,
} from "react-icons/fa";
import BankDetailItem from "./BankDetailItem";

const ManualDepositInfo = ({
  paymentMethod,
  selectedCurrency,
  manualDetailsLoading,
  manualAccountDetails,
  manualDetailsError,
  copiedField,
  onCopy,
  showTooltip,
  onTooltipShow,
  onTooltipHide,
  textColorProps,
}) => {
  

  // Only show for manual deposit
  if (paymentMethod !== "manual_deposit") {
    return null;
  }

  // ✅ ENHANCED: Show loading if manually loading OR if we have data but currency doesn't match
  const shouldShowLoading = manualDetailsLoading || 
    (manualAccountDetails && manualAccountDetails.currency !== selectedCurrency);

  if (shouldShowLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl font-sans"
      >
        <div className="flex justify-center items-center py-4">
          <RingLoader color="#3B82F6" size={30} />
          <span className="ml-3 text-gray-600 font-sans">
            Loading {selectedCurrency} account details...
          </span>
        </div>
      </motion.div>
    );
  }

  if (manualDetailsLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl font-sans"
      >
        <div className="flex justify-center items-center py-4">
          <RingLoader color="#3B82F6" size={30} />
          <span className="ml-3 text-gray-600 font-sans">
            Loading {selectedCurrency} account details...
          </span>
        </div>
      </motion.div>
    );
  }

  if (manualDetailsError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl font-sans"
      >
        <p className="text-red-700 text-center font-sans">{manualDetailsError}</p>
      </motion.div>
    );
  }

  if (!manualAccountDetails) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-xl font-sans"
      >
        <p className="text-yellow-700 text-center font-sans">
          No account details available for {selectedCurrency} manual deposit.
        </p>
      </motion.div>
    );
  }

  // Enhanced currency validation with detailed logging
  if (manualAccountDetails.currency !== selectedCurrency) {
    
    
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-6 bg-orange-50 border border-orange-200 rounded-xl font-sans"
      >
        <div className="text-center">
          <div className="flex justify-center items-center py-2">
            <RingLoader color="#F59E0B" size={30} />
            <span className="ml-3 text-orange-700 font-sans">
              Loading {selectedCurrency} account details...
            </span>
          </div>
          <p className="text-orange-600 text-sm mt-2 font-sans">
            Currency mismatch detected. Expected: {selectedCurrency}, Got: {manualAccountDetails.currency}
          </p>
        </div>
      </motion.div>
    );
  }

  

  return (
    <motion.div
    key={selectedCurrency}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl overflow-hidden font-sans"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-center">
          <FaUniversity className="text-white text-xl mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-white font-sans">
              {selectedCurrency} Manual Deposit Details
            </h3>
            <p className="text-blue-100 text-sm mt-1 font-sans">
              Use these details to complete your bank transfer
            </p>
            {/* Debug info - remove in production */}
            <div className="text-blue-200 text-xs mt-1 font-sans">
              Account ID: {manualAccountDetails.account_id} | Currency: {manualAccountDetails.currency}
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="p-6 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800">
          {/* Bank Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center text-base font-sans">
              <FaBuilding className="text-blue-600 mr-2" />
              Bank Information
            </h4>

            <BankDetailItem
              label="Bank Name"
              value={manualAccountDetails.bank_name}
              onCopy={onCopy}
              copiedField={copiedField}
              fieldName="bankName"
              showTooltip={showTooltip}
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
            />

            <BankDetailItem
              label="Account Name"
              value={manualAccountDetails.account_name}
              onCopy={onCopy}
              copiedField={copiedField}
              fieldName="accountName"
              showTooltip={showTooltip}
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
            />

            <BankDetailItem
              label="Bank Address"
              value={manualAccountDetails.bank_address}
              onCopy={onCopy}
              copiedField={copiedField}
              fieldName="bankAddress"
              showTooltip={showTooltip}
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
            />

            <BankDetailItem
              label="Bank Country"
              value={manualAccountDetails.bank_country}
              onCopy={onCopy}
              copiedField={copiedField}
              fieldName="bankCountry"
              showTooltip={showTooltip}
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
            />
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 text-base font-sans">
              Account Details
            </h4>

            {/* Customer/Beneficiary Name */}
            <BankDetailItem
              label={
                manualAccountDetails.customer_type === "individual"
                  ? "Customer Name"
                  : "Business Name"
              }
              value={
                manualAccountDetails.customer_type === "individual"
                  ? `${manualAccountDetails.first_name || ""} ${
                      manualAccountDetails.middle_name || ""
                    } ${manualAccountDetails.last_name || ""}`.trim()
                  : manualAccountDetails.institution_name ||
                    manualAccountDetails.account_name
              }
              onCopy={onCopy}
              copiedField={copiedField}
              fieldName="customerName"
              showTooltip={showTooltip}
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
            />

            {/* Account Number */}
            <BankDetailItem
              label="Account Number"
              value={manualAccountDetails.account_number}
              onCopy={onCopy}
              copiedField={copiedField}
              fieldName="accountNumber"
              showTooltip={showTooltip}
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
            />

            {/* IBAN */}
            <BankDetailItem
              label="IBAN"
              value={manualAccountDetails.iban}
              onCopy={onCopy}
              copiedField={copiedField}
              fieldName="iban"
              showTooltip={showTooltip}
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
            />

            {/* BIC/SWIFT */}
            <BankDetailItem
              label="BIC/SWIFT"
              value={
                manualAccountDetails.bic_swift ||
                manualAccountDetails.swift_code
              }
              onCopy={onCopy}
              copiedField={copiedField}
              fieldName="bicSwift"
              showTooltip={showTooltip}
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
            />

            {/* Sort Code (for GBP) */}
            {selectedCurrency === "GBP" && manualAccountDetails.sort_code && (
              <BankDetailItem
                label="Sort Code"
                value={manualAccountDetails.sort_code}
                onCopy={onCopy}
                copiedField={copiedField}
                fieldName="sortCode"
                showTooltip={showTooltip}
                onTooltipShow={onTooltipShow}
                onTooltipHide={onTooltipHide}
              />
            )}

            {/* Reference/Description */}
            <BankDetailItem
              label="Transfer Reference"
              value={manualAccountDetails.description}
              onCopy={onCopy}
              copiedField={copiedField}
              fieldName="transferReference"
              showTooltip={showTooltip}
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-100">
          <h4 className="font-semibold text-blue-800 mb-3 text-base font-sans">
            Important Instructions:
          </h4>
          <ul className="text-sm text-blue-700 space-y-2 font-sans">
            <li>• Use the exact account details provided above</li>
            <li>• Include the transfer reference in your payment</li>
            <li>• Processing time: 1-3 business days</li>
            <li>• Contact support if transfer is not reflected after 3 days</li>
            <li>• Minimum transfer amount may apply</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default ManualDepositInfo;