// src/page/Deposit/components/Card/CardPaymentSuccess.jsx
import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaCheckCircle, FaHome, FaReceipt } from "react-icons/fa";
import { motion } from "framer-motion";

const CardPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { state } = location;

  // Get customer ID from params
  const customerId = params.customerId || state?.customerId;

  // Format date for display
  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle back to home
  const handleBackToHome = () => {
    if (customerId) {
      navigate(`/home/${customerId}`);
    } 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <FaCheckCircle className="text-white text-3xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-green-100 text-sm">
            Your card payment has been processed successfully
          </p>
        </div>

        {/* Payment Details */}
        <div className="p-6">
          {/* Date */}
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm">{formatDate()}</p>
          </div>

          {/* Amount */}
          <div className="bg-gray-50 rounded-xl p-5 mb-4 border border-gray-100">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Amount Paid</p>
              <p className="text-3xl font-bold text-gray-900">
                {state?.currency || "USD"}{" "}
                {state?.amount ? parseFloat(state.amount).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-medium text-gray-900 font-mono text-sm">
                {state?.transactionId || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium text-gray-900">Card Payment</span>
            </div>

            {state?.purpose && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Purpose</span>
                <span className="font-medium text-gray-900">
                  {state.purpose}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Completed
              </span>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700 text-center">
              Your funds will be available in your account shortly. 
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.button
              onClick={handleBackToHome}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <FaHome />
              Back to Home
            </motion.button>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team for assistance.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Thank you for your payment!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CardPaymentSuccess;
