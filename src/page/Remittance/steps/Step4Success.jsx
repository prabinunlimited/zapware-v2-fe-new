import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaDownload,
  FaShareAlt,
  FaPrint,
  FaEnvelope,
  FaClock,
  FaShieldAlt,
  FaUniversity,
  FaFileUpload,
  FaArrowRight,
  FaPhone,
  FaPhoneAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { RingLoader } from "react-spinners";

const Step4Success = ({
  transactionResult,
  formData,
  selectedBeneficiary,
  manualAccountDetails,
  exchangeRateData,
  onReset,
  onDownloadReceipt,
}) => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [showRedirectLoader, setShowRedirectLoader] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  // Format date and time
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Generate transaction ID
  const transactionId =
    transactionResult?.transaction_id ||
    `TRX${Date.now().toString(36).toUpperCase()}`;

  // Auto-redirect to dashboard after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRedirectLoader(true);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Redirect after 2 seconds of showing loader
      const redirectTimer = setTimeout(() => {
        if (customerId) {
          navigate(`/home/${customerId}`);
        } else {
          navigate("/dashboard");
        }
      }, 2000);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(redirectTimer);
      };
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, customerId]);

  // Share transaction
  const handleShare = async () => {
    const shareData = {
      title: "Money Transfer Receipt",
      text: `I just sent ${formData.receiveCurrency?.value} ${formData.receiveAmount} to ${selectedBeneficiary?.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Print receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Handle manual redirect (if user wants to go now)
  const handleGoToDashboard = () => {
    setShowRedirectLoader(true);
    setTimeout(() => {
      if (customerId) {
        navigate(`/home/${customerId}`);
      } else {
        navigate("/dashboard");
      }
    }, 500);
  };

  return (
    <>
      {/* Redirect Loader Overlay */}
      <AnimatePresence>
        {showRedirectLoader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl"
            >
              <div className="flex flex-col items-center justify-center space-y-6">
                {/* Animated Checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <FaCheckCircle className="w-12 h-12 text-white" />
                </motion.div>

                {/* Loading Spinner */}
                <RingLoader color="#10b981" size={50} />

                {/* Text Content */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Transfer Complete!
                  </h3>
                  <p className="text-gray-600">Redirecting to your dashboard</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">
                      Taking you home in
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {redirectCountdown}
                    </span>
                    <span className="text-sm text-gray-500">
                      second{redirectCountdown !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  />
                </div>

                {/* Manual Redirect Option */}
                <button
                  onClick={handleGoToDashboard}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  Go to dashboard now
                  <FaArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Success Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Success Header */}
        <motion.div variants={itemVariants} className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-100 to-green-50 rounded-full mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full blur opacity-20"></div>
            <FaCheckCircle className="w-12 h-12 text-green-600 relative z-10" />
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-green-200"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Transfer Successful!
          </h1>
          <p className="text-gray-600 text-lg">
            Your money is on its way to {selectedBeneficiary?.name}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting to dashboard in 3 seconds...
          </p>
        </motion.div>

        {/* Transaction Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        >
          {/* Card Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Transaction Receipt
                </h2>
                <p className="text-green-100 text-sm">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="p-6">
            {/* Transaction ID */}
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-mono font-bold text-gray-900">
                  {transactionId}
                </p>
              </div>
              <button
                onClick={() => handleCopyToClipboard(transactionId)}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Copy
              </button>
            </div>

            {/* Amount Details */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sent Amount */}
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Amount Sent
                      </h4>
                      <p className="text-sm text-gray-500">Including fees</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formData.sendCurrency?.value}{" "}
                    {parseFloat(formData.sendAmount || 0).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Transfer Fee: {formData.sendCurrency?.value}{" "}
                    {formData.fee?.toFixed(2)}
                  </div>
                </div>

                {/* Received Amount */}
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
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
                        Amount Received
                      </h4>
                      <p className="text-sm text-gray-500">
                        Estimated delivery
                      </p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formData.receiveCurrency?.value}{" "}
                    {parseFloat(formData.receiveAmount || 0).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Exchange Rate: 1 {formData.sendCurrency?.value} ={" "}
                    {exchangeRateData?.fxRate?.toFixed(4) ||
                      formData.exchangeRate?.toFixed(4)}{" "}
                    {formData.receiveCurrency?.value}
                  </div>
                </div>
              </div>

              {/* Manual Deposit Instructions */}
              {formData.paymentMethod === "manual" && manualAccountDetails && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-3 mb-3">
                    <FaUniversity className="w-6 h-6 text-yellow-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Deposit Instructions
                      </h4>
                      <p className="text-sm text-gray-600">
                        Complete your deposit to finalize the transfer
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Bank Name
                      </label>
                      <div className="font-medium">
                        {manualAccountDetails.bank_name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Account Name
                      </label>
                      <div className="font-medium">
                        {manualAccountDetails.account_name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Account Number
                      </label>
                      <div className="font-medium">
                        {manualAccountDetails.account_number}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Amount to Deposit
                      </label>
                      <div className="font-medium">
                        {formData.sendCurrency?.value}{" "}
                        {parseFloat(formData.sendAmount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Please complete your deposit
                      within 24 hours and upload the payment proof if not
                      already done.
                    </p>
                  </div>
                </div>
              )}

              {/* Recipient Details */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Recipient Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Name
                    </label>
                    <div className="font-medium">
                      {selectedBeneficiary?.name}
                    </div>
                  </div>
                  {selectedBeneficiary?.phone_number && (
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Phone
                      </label>
                      <div className="font-medium">
                        {selectedBeneficiary.phone_number}
                      </div>
                    </div>
                  )}
                  {selectedBeneficiary?.email && (
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Email
                      </label>
                      <div className="font-medium">
                        {selectedBeneficiary.email}
                      </div>
                    </div>
                  )}
                  {selectedBeneficiary?.country && (
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Country
                      </label>
                      <div className="font-medium">
                        {selectedBeneficiary.country}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Transfer Timeline
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Transfer Initiated</div>
                      <div className="text-sm text-gray-500">
                        {formattedTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Processing Payment</div>
                      <div className="text-sm text-gray-500">Within 1 hour</div>
                    </div>
                  </div>
                  {formData.paymentMethod === "manual" && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <FaFileUpload className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Awaiting Deposit</div>
                        <div className="text-sm text-gray-500">
                          Complete deposit within 24 hours
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Funds Delivered</div>
                      <div className="text-sm text-gray-500">
                        {formData.paymentMethod === "manual"
                          ? "After deposit confirmation"
                          : "1-2 business days"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <button
            onClick={onDownloadReceipt}
            className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex flex-col items-center justify-center gap-2"
          >
            <FaDownload className="w-6 h-6" />
            <span>Download Receipt</span>
          </button>
        </motion.div>

        {/* New Transfer Button */}
        <motion.div variants={itemVariants} className="text-center">
          <button
            onClick={onReset}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
          >
            Send Another Transfer
          </button>
        </motion.div>

        {/* Security and Support */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-blue-50 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <FaShieldAlt className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-semibold text-gray-900">
                  Transaction Security
                </h4>
                <p className="text-sm text-gray-600">
                  Your transfer is protected
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                256-bit SSL encryption
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                PCI DSS compliant
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Fraud protection guarantee
              </li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-900">Need Help?</h4>
                <p className="text-sm text-gray-600">
                  Our support team is here for you
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {/* International Support */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FaPhoneAlt className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      International Support
                    </p>
                    <p className="text-xs text-gray-500">Available 24/7</p>
                  </div>
                </div>
                <a
                  href="tel:+18882260712"
                  className="text-green-700 hover:text-green-900 font-medium text-sm flex items-center gap-2"
                >
                  +1-888-226-0712
                  <FaPhone className="w-3 h-3" />
                </a>
              </div>

              {/* National Support */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FaPhoneAlt className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      National Support
                    </p>
                    <p className="text-xs text-gray-500">
                      Local call rates apply
                    </p>
                  </div>
                </div>
                <a
                  href="tel:015970800"
                  className="text-green-700 hover:text-green-900 font-medium text-sm flex items-center gap-2"
                >
                  01-5970800
                  <FaPhone className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Step4Success;
