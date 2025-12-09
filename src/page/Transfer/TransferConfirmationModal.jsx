import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { RingLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";

import { executeTransfer } from "./transferThunks";
import {
  selectTransferLoading,
  selectCustomerBankAccounts,
} from "./transferSelectors";

const TransferConfirmationModal = ({
  receiverDetails,
  selectedCurrency,
  transferAmount,
  transferLoading,
  onClose,
  headerColorProps,
  textColorProps,
}) => {
  const dispatch = useDispatch();
  const { customerId } = useParams();
  const navigate = useNavigate();
  const customerBankAccounts = useSelector(selectCustomerBankAccounts);

  const handleConfirmTransfer = async () => {
    const selectedAccount = customerBankAccounts.find(
      (account) => account.currency_code === selectedCurrency
    );

    const payload = {
      currency: selectedCurrency,
      amount: transferAmount,
      bank_id: selectedAccount?.id || null,
      customer_id: customerId,
      receiver_customer_id: receiverDetails.id,
    };

    const result = await dispatch(executeTransfer(payload));

    if (result.payload?.success) {
      onClose();
    }
  };

  const maskName = (name) => {
    if (!name || name.length <= 2) return name;
    return name.slice(0, 2) + "*".repeat(name.length - 2);
  };

  const getReceiverDisplayName = () => {
    if (receiverDetails?.customer_type === "individual") {
      return `${maskName(receiverDetails?.first_name)} ${maskName(
        receiverDetails?.last_name
      )}`;
    }
    return maskName(receiverDetails?.institution_name);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount || 0));
  };

  const calculateTransferFee = () => {
    const amount = parseFloat(transferAmount || 0);
    const feeRate = 0.015;
    return amount * feeRate;
  };

  const calculateTotalAmount = () => {
    const amount = parseFloat(transferAmount || 0);
    const fee = calculateTransferFee();
    return amount + fee;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-confirmation-title"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl mx-auto my-2 sm:my-4 md:my-8 border border-gray-200 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div
            className={`px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b ${
              headerColorProps?.className || "bg-blue-600 text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white/20 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    id="transfer-confirmation-title"
                    className="text-sm sm:text-base md:text-lg font-bold"
                  >
                    Transfer Confirmation
                  </h3>
                  <p className="text-xs sm:text-sm opacity-90">
                    Review transfer details
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1"
                aria-label="Close modal"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
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

          {/* Main Content - Responsive Layout */}
          <div className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              {/* Left Column - Amount & Receiver Info */}
              <div className="space-y-4 sm:space-y-5">
                {/* Amount Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-blue-100">
                  <div className="text-center mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                      Transfer Amount
                    </p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-700 mr-1 sm:mr-2">
                        {selectedCurrency}
                      </span>
                      <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                        {formatAmount(transferAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Cost Breakdown
                    </p>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">
                          Transfer Amount
                        </span>
                        <span className="font-medium text-gray-900 text-sm sm:text-base">
                          {selectedCurrency} {formatAmount(transferAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">
                          Transfer Fee (1.5%)
                        </span>
                        <span className="font-medium text-gray-900 text-sm sm:text-base">
                          {selectedCurrency} {formatAmount(calculateTransferFee())}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900 text-sm sm:text-base">
                            Total to Pay
                          </span>
                          <span className="text-base sm:text-lg md:text-xl font-bold text-blue-700">
                            {selectedCurrency} {formatAmount(calculateTotalAmount())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-amber-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-amber-800 mb-0.5 sm:mb-1">
                        Important Notice
                      </p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Please verify all details carefully. Once confirmed, this
                        transaction cannot be reversed or modified.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Receiver Details */}
              <div className="space-y-4 sm:space-y-5">
                {/* Receiver Info Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-green-100">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide truncate">
                        Receiver Details
                      </p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                        {getReceiverDisplayName()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-white/80 rounded-lg border border-green-100">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span className="text-xs sm:text-sm text-gray-600">
                          Mobile
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base truncate ml-2">
                        {receiverDetails?.mobile_number}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-3 bg-white/80 rounded-lg border border-green-100">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs sm:text-sm text-gray-600">
                          Email
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[150px] md:max-w-[180px]">
                        {receiverDetails?.email || "Not provided"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-3 bg-white/80 rounded-lg border border-green-100">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span className="text-xs sm:text-sm text-gray-600">
                          Account Type
                        </span>
                      </div>
                      <span className="font-medium text-blue-700 text-xs sm:text-sm md:text-base">
                        {receiverDetails?.customer_type === "individual"
                          ? "Individual"
                          : "Business"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-3 bg-white/80 rounded-lg border border-green-100">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-xs sm:text-sm text-gray-600">
                          Currency
                        </span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">
                        {selectedCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transfer Summary */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-purple-100">
                  <p className="text-xs sm:text-sm font-semibold text-purple-700 mb-2 sm:mb-3">
                    Transfer Summary
                  </p>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">
                        From Account
                      </span>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm md:text-base">
                        Your Account
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">
                        To Receiver
                      </span>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm md:text-base truncate max-w-[100px] sm:max-w-[150px]">
                        {getReceiverDisplayName()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">
                        Transfer Method
                      </span>
                      <span className="font-medium text-blue-700 text-xs sm:text-sm md:text-base">
                        Instant Transfer
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">
                        Estimated Delivery
                      </span>
                      <span className="font-medium text-green-700 text-xs sm:text-sm md:text-base">
                        Within minutes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs sm:text-sm">256-bit SSL Secured</span>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  disabled={transferLoading}
                  className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-xs sm:text-sm flex-1 sm:flex-none text-center"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmTransfer}
                  disabled={transferLoading}
                  className={`px-4 sm:px-8 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-2 flex-1 sm:flex-none ${
                    headerColorProps?.className || "bg-blue-600 hover:bg-blue-700"
                  } ${
                    transferLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  style={{ color: "#ffffff" }}
                >
                  {transferLoading ? (
                    <>
                      <RingLoader size={14} color="#fff" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Confirm Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransferConfirmationModal;