// BenefVerificationPopup.js
import React, { useState } from "react";
import PropTypes from "prop-types";
import { RingLoader } from "react-spinners";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";

const BenefVerificationPopup = ({
  type,
  onClose,
  onVerify,
  isOpen,
  isLoading = false,
  resendLoading = false,
  onResend,
  code: externalCode,
  setCode: externalSetCode,
}) => {
  const [internalCode, setInternalCode] = useState("");

  // Use external state if provided, otherwise use internal state
  const code = externalCode !== undefined ? externalCode : internalCode;
  const setCode = externalSetCode || setInternalCode;

  if (!isOpen) return null;

  const isEmail = type === "email";
  const title = isEmail ? "Email Verification" : "Phone Verification";
  const message = isEmail
    ? "A passcode has been sent to your email. Please verify your email before continuing your registration process."
    : "An OTP has been sent to your phone. Please verify your phone number before continuing your registration process.";
  const placeholder = isEmail ? "Enter passcode" : "Enter OTP";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim().length > 0) {
      onVerify(code);
    }
  };

  const handleResend = () => {
    if (onResend) {
      onResend();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <FaCheckCircle className="text-white text-lg" />
                </div>
                <h3 className="text-white text-xl font-semibold">{title}</h3>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all duration-200 disabled:opacity-50"
                aria-label="Close verification popup"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isEmail ? "Passcode" : "OTP"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || code.trim().length === 0}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg min-h-[48px]"
                >
                  {isLoading ? (
                    <>
                      <RingLoader size={20} color="#ffffff" className="mr-2" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleResend}
                disabled={resendLoading || isLoading}
                className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 flex items-center justify-center transition-colors duration-200"
              >
                {resendLoading ? (
                  <>
                    <RingLoader size={16} color="#2563eb" className="mr-2" />
                    Sending...
                  </>
                ) : (
                  `Resend ${isEmail ? "Passcode" : "OTP"}`
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

BenefVerificationPopup.propTypes = {
  type: PropTypes.oneOf(["email", "phone"]).isRequired,
  onClose: PropTypes.func.isRequired,
  onVerify: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool,
  resendLoading: PropTypes.bool,
  onResend: PropTypes.func,
  code: PropTypes.string,
  setCode: PropTypes.func,
};

BenefVerificationPopup.defaultProps = {
  isLoading: false,
  resendLoading: false,
};

export default BenefVerificationPopup;
