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

  // Calculate transfer fee (example: 1.5%)
  const calculateTransferFee = () => {
    const amount = parseFloat(transferAmount || 0);
    const feeRate = 0.015; // 1.5%
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
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-confirmation-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100/50 backdrop-blur-lg"
        >
          {/* Enhanced Header */}
          <div
            className={`px-8 py-6 text-white relative overflow-hidden ${
              headerColorProps.className ||
              "bg-gradient-to-r from-emerald-600 to-green-600"
            }`}
            style={headerColorProps.style}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <svg
                    className="w-6 h-6"
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
                    className="text-2xl font-bold"
                  >
                    Confirm Transfer
                  </h3>
                  <p className="text-green-100 text-sm opacity-95 mt-1 font-medium">
                    Review all details before proceeding
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Body */}
          <div className="p-8">
            {/* Amount Highlight - Improved */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-8"
            >
              <div className="inline-flex flex-col items-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl px-8 py-6 border border-blue-100/50 shadow-sm">
                <span className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Transfer Amount
                </span>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-gray-600 mr-2">
                    {selectedCurrency}
                  </span>
                  <span className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {formatAmount(transferAmount)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Transfer Details */}
            <div className="space-y-4 mb-8">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100 shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shadow-sm">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                      Receiver
                    </p>
                    <p
                      className="text-lg font-bold text-gray-900"
                      {...textColorProps}
                    >
                      {getReceiverDisplayName()}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      {receiverDetails?.customer_type === "individual" ? "Individual Account" : "Business Account"}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100 shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                      Contact
                    </p>
                    <p
                      className="text-lg font-bold text-gray-900"
                      {...textColorProps}
                    >
                      {receiverDetails?.mobile_number}
                    </p>
                    {receiverDetails?.customer_type === "individual" && (
                      <p className="text-sm text-blue-600 mt-1">
                        {receiverDetails?.email}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Cost Breakdown */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-5 border border-purple-100 shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm">
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-3">
                      Cost Breakdown
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Transfer Amount</span>
                        <span className="font-semibold text-gray-900">
                          {selectedCurrency} {formatAmount(transferAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Transfer Fee</span>
                        <span className="font-semibold text-gray-900">
                          {selectedCurrency} {formatAmount(calculateTransferFee())}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold text-gray-900">Total</span>
                          <span className="text-lg font-bold text-purple-700">
                            {selectedCurrency} {formatAmount(calculateTotalAmount())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Security Notice */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-2 shadow-sm"
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg
                    className="w-5 h-5 text-amber-600"
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
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-2">
                    🔒 Secure Transaction
                  </p>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Please verify all details before confirming. This transaction is encrypted and secure, but cannot be reversed once processed.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Footer */}
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-200/50">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <motion.button
                onClick={onClose}
                disabled={transferLoading}
                whileHover={{ scale: transferLoading ? 1 : 1.02 }}
                whileTap={{ scale: transferLoading ? 1 : 0.98 }}
                className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center space-x-3 order-2 sm:order-1 shadow-sm"
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
                <span>Cancel</span>
              </motion.button>

              <motion.button
                onClick={handleConfirmTransfer}
                disabled={transferLoading}
                whileHover={transferLoading ? {} : { scale: 1.02, boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
                whileTap={transferLoading ? {} : { scale: 0.98 }}
                className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold transition-all duration-200 relative overflow-hidden group ${
                  headerColorProps.className ||
                  "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                } ${
                  transferLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "shadow-lg"
                }`}
                style={{
                  ...headerColorProps.style,
                  color: "#ffffff",
                }}
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {transferLoading ? (
                  <div className="flex items-center justify-center space-x-3 relative z-10">
                    <RingLoader size={20} color="#fff" />
                    <span className="font-semibold">Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3 relative z-10">
                    <svg
                      className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-200"
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
                    <span className="text-lg">Confirm Transfer</span>
                  </div>
                )}
              </motion.button>
            </div>

            {/* Additional Security Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-4 pt-4 border-t border-gray-200/50"
            >
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>256-bit SSL Encryption • PCI DSS Compliant</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransferConfirmationModal;