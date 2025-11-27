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

  // Reset loading state when modal opens
  React.useEffect(() => {
    // Reset any stuck loading state when modal opens
    if (transferLoading) {
      
      // You might need to add a reset action to your slice
    }
  }, []);

  const { customerId } = useParams();
  const navigate = useNavigate();
  const customerBankAccounts = useSelector(selectCustomerBankAccounts);

  // DEBUG: Add these logs
  
  
  
  

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-confirmation-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div
            className={`px-6 py-5 text-white ${
              headerColorProps.className ||
              "bg-gradient-to-r from-blue-600 to-blue-700"
            }`}
            style={headerColorProps.style}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    id="transfer-confirmation-title"
                    className="text-xl font-bold"
                  >
                    Confirm Transfer
                  </h3>
                  <p className="text-blue-100 text-sm opacity-90 mt-1">
                    Please review the details before proceeding
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Amount Highlight */}
            <div className="text-center mb-6">
              <div className="inline-flex items-baseline bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl px-6 py-4 border border-blue-100">
                <span className="text-3xl font-bold text-gray-900 mr-2">
                  {selectedCurrency}
                </span>
                <span className="text-4xl font-bold text-gray-900">
                  {formatAmount(transferAmount)}
                </span>
              </div>
            </div>

            {/* Transfer Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
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
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Receiver
                    </p>
                    <p
                      className="font-semibold text-gray-900"
                      {...textColorProps}
                    >
                      {getReceiverDisplayName()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
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
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Mobile Number
                    </p>
                    <p
                      className="font-semibold text-gray-900"
                      {...textColorProps}
                    >
                      {receiverDetails?.mobile_number}
                    </p>
                  </div>
                </div>
              </div>

              {receiverDetails?.customer_type === "individual" && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p
                        className="font-semibold text-gray-900 text-sm"
                        {...textColorProps}
                      >
                        {receiverDetails?.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Security Notice
                  </p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Please verify all details before confirming. Transactions
                    cannot be reversed once processed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <button
                onClick={onClose}
                disabled={transferLoading}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2 order-2 sm:order-1"
              >
                <svg
                  className="w-4 h-4"
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
                <span>Cancel</span>
              </button>

              <button
                onClick={handleConfirmTransfer}
                disabled={transferLoading}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  headerColorProps.className ||
                  "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                } ${
                  transferLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:from-blue-700 hover:to-blue-800"
                }`}
                style={{
                  ...headerColorProps.style,
                  color: "#ffffff",
                  boxShadow: transferLoading
                    ? "none"
                    : "0 4px 14px 0 rgba(0, 118, 255, 0.39)",
                }}
              >
                {transferLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <RingLoader size={18} color="#fff" />
                    <span>Processing Transfer...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Confirm Transfer</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransferConfirmationModal;
