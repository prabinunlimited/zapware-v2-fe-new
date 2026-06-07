import React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import {
  FaTimes,
  FaInfoCircle,
  FaCalendar,
  FaExchangeAlt,
  FaCheckCircle,
  FaMoneyBill,
  FaBalanceScale,
  FaHandshake,
  FaCreditCard,
  FaUser,
  FaBuilding,
  FaIdCard,
  FaReceipt,
  FaGlobe,
  FaTag,
} from "react-icons/fa";

const TransactionDetailsPopup = ({ closePopup, transaction }) => {
  if (!transaction) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
        <motion.div
          className="p-6 rounded-lg shadow-xl w-full max-w-2xl bg-white text-gray-800 mx-auto"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
        >
          <p className="text-base sm:text-lg">
            No transaction details available.
          </p>
          <button
            className="mt-4 sm:mt-6 px-4 py-2 rounded flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
            onClick={closePopup}
          >
            <FaTimes /> Close
          </button>
        </motion.div>
      </div>
    );
  }

  // Extract sender and beneficiary information with fallbacks
  const senderInfo = {
    name: transaction.sender_name || transaction.senderName || "Not Available",
    accountNumber: transaction.sender_account_number || transaction.senderAccountNumber || "Not Available",
    bank: transaction.sender_bank || "Not Available",
    country: transaction.sender_country || "Not Available"
  };

  const beneficiaryInfo = {
    name:
      transaction.beneficiary_name ||
      transaction.beneficiaryName ||
      "Not Available",
  
    accountNumber:
      transaction.beneficiary_account_number ||
      transaction.beneficiaryAccountNumber ||
      transaction.beneficiary_bank_acc_no ||
      "Not Available",
  
    bank:
      transaction.beneficiary_bank ||
      transaction.beneficiary_bank_name ||
      "Not Available",
  
    country:
      transaction.beneficiary_country ||
      "Not Available",
  };

  // Format currency amounts
  const formatCurrency = (amount, currency = transaction.currency_code) => {
    if (amount === null || amount === undefined || amount === "") {
      return "Not Available";
    }
  
    const numAmount = parseFloat(amount);
  
    return `${numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency || ""}`;
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-2 sm:p-4">
      <motion.div
        className="p-4 sm:p-6 md:p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-gray-800 mx-auto"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${transaction.direction === 'Inbound' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {transaction.direction === 'Inbound' ? (
                <FaExchangeAlt className="text-lg transform rotate-90" />
              ) : (
                <FaExchangeAlt className="text-lg transform -rotate-90" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
                Transaction Details
              </h2>
              <p className="text-sm text-gray-600">
                ID: {transaction.transaction_id || "N/A"}
              </p>
            </div>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
            onClick={closePopup}
            aria-label="Close"
          >
            <FaTimes className="text-lg sm:text-xl" />
          </button>
        </div>

        {/* Transaction Status Banner */}
        <div className={`mb-6 p-4 rounded-lg ${transaction.status === 'completed' || transaction.status === 'successful' ? 'bg-green-50 border border-green-200' :
          transaction.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
            transaction.status === 'failed' ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${transaction.status === 'completed' || transaction.status === 'successful' ? 'bg-green-100 text-green-600' :
                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                  transaction.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                <FaCheckCircle />
              </div>
              <div>
                <h3 className="font-semibold capitalize">{transaction.status || 'Unknown'}</h3>
                <p className="text-sm text-gray-600">
                  {transaction.transaction_datetime ? new Date(transaction.transaction_datetime).toLocaleString() : 'Date not available'}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${transaction.direction === 'Inbound' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {transaction.direction}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column: Financial Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <FaMoneyBill className="text-blue-600" />
              Financial Details
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <DetailItem
                icon={<FaTag />}
                label="Transaction ID"
                value={transaction.transaction_id || "N/A"}
                copyable
              />
              <DetailItem
                icon={<FaCalendar />}
                label="Date & Time"
                value={transaction.transaction_datetime ? new Date(transaction.transaction_datetime).toLocaleString() : "Not Available"}
              />
              <DetailItem
                icon={<FaGlobe />}
                label="Currency"
                value={transaction.currency_code || "Not Available"}
                highlight
              />
              <DetailItem
                icon={<FaMoneyBill />}
                label="Amount"
                value={formatCurrency(transaction.instructed_amount)}
                highlight
              />
              <DetailItem
                icon={<FaReceipt />}
                label="Fee Amount"
                value={formatCurrency(transaction.fee_amount)}
              />
              {/* <DetailItem
                icon={<FaBalanceScale />}
                label="Total Amount"
                value={formatCurrency(transaction.amount_with_fee)}
                highlight
              /> */}
              <DetailItem
                icon={<FaBalanceScale />}
                label="Total Amount"
                value={formatCurrency(
                  parseFloat(transaction.amount_with_fee || 0) > 0
                    ? transaction.amount_with_fee
                    : transaction.instructed_amount
                )}
                highlight
              />
              {transaction.service_provider_fee && (
                <DetailItem
                  icon={<FaReceipt />}
                  label="Service Provider Fee"
                  value={formatCurrency(transaction.service_provider_fee)}
                />
              )}
            </div>
          </div>

          {/* Right Column: Parties Involved */}
          <div className="space-y-6">
            {/* Sender Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FaUser />
                </div>
                Sender Information
              </h3>

              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <DetailItem
                  icon={<FaUser />}
                  label="Sender Name"
                  value={senderInfo.name}
                />
                <DetailItem
                  icon={<FaIdCard />}
                  label="Sender Account"
                  value={senderInfo.accountNumber}
                  copyable
                />
                {senderInfo.bank !== "Not Available" && (
                  <DetailItem
                    icon={<FaBuilding />}
                    label="Sender Bank"
                    value={senderInfo.bank}
                  />
                )}
                {senderInfo.country !== "Not Available" && (
                  <DetailItem
                    icon={<FaGlobe />}
                    label="Sender Country"
                    value={senderInfo.country}
                  />
                )}
                {/* Check for additional sender fields */}
                {transaction.sender_email && (
                  <DetailItem
                    icon={<FaInfoCircle />}
                    label="Sender Email"
                    value={transaction.sender_email}
                  />
                )}
                {transaction.sender_phone && (
                  <DetailItem
                    icon={<FaInfoCircle />}
                    label="Sender Phone"
                    value={transaction.sender_phone}
                  />
                )}
              </div>
            </div>

            {/* Beneficiary Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <FaUser />
                </div>
                Beneficiary Information
              </h3>

              <div className="bg-green-50 rounded-lg p-4 space-y-3">
                <DetailItem
                  icon={<FaUser />}
                  label="Beneficiary Name"
                  value={beneficiaryInfo.name}
                />
                <DetailItem
                  icon={<FaIdCard />}
                  label="Beneficiary Account"
                  value={beneficiaryInfo.accountNumber}
                  copyable
                />
                {beneficiaryInfo.bank !== "Not Available" && (
                  <DetailItem
                    icon={<FaBuilding />}
                    label="Beneficiary Bank"
                    value={beneficiaryInfo.bank}
                  />
                )}
                {beneficiaryInfo.country !== "Not Available" && (
                  <DetailItem
                    icon={<FaGlobe />}
                    label="Beneficiary Country"
                    value={beneficiaryInfo.country}
                  />
                )}
                {/* Check for additional beneficiary fields */}
                {transaction.beneficiary_email && (
                  <DetailItem
                    icon={<FaInfoCircle />}
                    label="Beneficiary Email"
                    value={transaction.beneficiary_email}
                  />
                )}
                {transaction.beneficiary_phone && (
                  <DetailItem
                    icon={<FaInfoCircle />}
                    label="Beneficiary Phone"
                    value={transaction.beneficiary_phone}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information (if available) */}
        {(transaction.state || transaction.description || transaction.reference) && (
          <div className="mb-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <FaInfoCircle className="text-gray-600" />
              Additional Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {transaction.state && (
                <DetailItem
                  icon={<FaInfoCircle />}
                  label="Transaction State"
                  value={transaction.state}
                />
              )}
              {transaction.description && (
                <DetailItem
                  icon={<FaInfoCircle />}
                  label="Description"
                  value={transaction.description}
                />
              )}
              {transaction.reference && (
                <DetailItem
                  icon={<FaInfoCircle />}
                  label="Reference"
                  value={transaction.reference}
                />
              )}
              {transaction.notes && (
                <DetailItem
                  icon={<FaInfoCircle />}
                  label="Notes"
                  value={transaction.notes}
                />
              )}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end gap-3">
          <button
            className="px-5 py-3 rounded-lg flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm sm:text-base font-medium transition-colors"
            onClick={closePopup}
          >
            <FaTimes /> Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Enhanced DetailItem Component with copy functionality
const DetailItem = ({ icon, label, value, highlight = false, copyable = false }) => {
  const handleCopy = () => {
    if (value && value !== "Not Available") {
      navigator.clipboard.writeText(value);
      // You could add a toast notification here
      alert(`Copied: ${value}`);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-all duration-300">
      <span className={`text-lg ${highlight ? 'text-blue-600' : 'text-gray-500'}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-600 truncate">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <p className={`text-sm break-words ${highlight ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
            {value ?? "Not Available"}
          </p>
          {copyable && value && value !== "Not Available" && (
            <button
              onClick={handleCopy}
              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
              title="Copy to clipboard"
            >
              Copy
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

TransactionDetailsPopup.propTypes = {
  closePopup: PropTypes.func.isRequired,
  transaction: PropTypes.object,
};

export default TransactionDetailsPopup;