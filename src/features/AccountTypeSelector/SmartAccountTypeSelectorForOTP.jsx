// src/features/AccountTypeSelector/SmartAccountTypeSelectorForOTP.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RingLoader } from "react-spinners";
import {
  Building2,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Zap,
  Clock,
  Shield,
  X,
  Smartphone,
} from "lucide-react";
import {
  setSelectedAccountType,
  clearMultipleAccounts,
  cacheAccountSelection,
} from "../../features/Auth/slices/authSlice";
import { generateOTP } from "../Auth/authThunk";

const SmartAccountTypeSelectorForOTP = ({
  isOpen,
  onClose,
  accounts,
  phone_code,
  mobile_number,
  password,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const [selectedType, setSelectedType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [rememberChoice, setRememberChoice] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const isGeneratingOtp = useSelector((state) => state.auth.isGeneratingOtp);

  // Auto-select based on cached preference
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedType) {
      // Create a unique key for mobile number
      const mobileKey = `${phone_code}${mobile_number}`;
      const cached = localStorage.getItem(
        `last_account_selection_otp_${mobileKey}`,
      );

      if (cached) {
        try {
          const {
            cachedMobileKey,
            selectedType: cachedType,
            timestamp,
          } = JSON.parse(cached);
          const isExpired = Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000;
          if (
            !isExpired &&
            cachedMobileKey === mobileKey &&
            accounts.some((acc) => acc.type === cachedType)
          ) {
            setSelectedType(cachedType);
          }
        } catch (e) {
          console.error("Failed to parse cache:", e);
        }
      }
    }
  }, [accounts, phone_code, mobile_number, selectedType]);

  // Auto-submit countdown
  useEffect(() => {
    if (selectedType && !isProcessing && countdown === 0 && !error) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleConfirm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedType]);

  const handleConfirm = async () => {
  if (!selectedType || isProcessing) return;

  setIsProcessing(true);
  setError(null);

  try {
    // Store selection in Redux
    const selectedAccount = accounts.find((acc) => acc.type === selectedType);
    dispatch(
      setSelectedAccountType({
        accountType: selectedType,
        accountData: selectedAccount,
      }),
    );

    // Cache the selection (optional, for UX)
    if (rememberChoice) {
      const mobileKey = `${phone_code}${mobile_number}`;
      const cacheData = {
        cachedMobileKey: mobileKey,
        selectedType: selectedType,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        `last_account_selection_otp_${mobileKey}`,
        JSON.stringify(cacheData),
      );
      dispatch(
        cacheAccountSelection({
          email: mobileKey,
          accountType: selectedType,
        }),
      );
    }

    // Retry OTP generation with selected type
    const result = await dispatch(
      generateOTP({
        phone_code: phone_code,
        mobile_number: mobile_number,
        password: password,
        customer_type: selectedType,
      }),
    ).unwrap();

    if (result.status === "success" || result.success === true) {
      // ✅ Pass the selectedType to onSuccess callback
      onSuccess?.({
        ...result,
        customer_type: selectedType,
      });
      onClose();
    } else if (result.status === "multiple_accounts") {
      setError("Still having issues. Please contact support.");
    } else {
      setError(result.message || "Failed to generate OTP");
    }
  } catch (err) {
    setError(
      err.message ||
        err.payload?.message ||
        "An error occurred. Please try again.",
    );
  } finally {
    setIsProcessing(false);
  }
};

  const handleSkip = () => {
    dispatch(clearMultipleAccounts());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={handleSkip}
        />

        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Select Account Type
                  </h2>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-white/80 hover:text-white transition-colors"
                  disabled={isProcessing}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Info Message */}
              <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">
                      Multiple accounts detected
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      We found multiple accounts associated with {phone_code}
                      {mobile_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Options */}
              <div className="space-y-3 mb-6">
                {accounts.map((account) => (
                  <motion.button
                    key={account.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType(account.type)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedType === account.type
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            selectedType === account.type
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {account.type === "individual" ? (
                            <User className="w-6 h-6" />
                          ) : (
                            <Building2 className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {account.label}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {account.description}
                          </p>
                        </div>
                      </div>
                      {selectedType === account.type && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Remember Choice Checkbox */}
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4 cursor-pointer">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    Remember my choice for this mobile number
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setRememberChoice(!rememberChoice);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    rememberChoice ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      rememberChoice ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Auto-submit indicator */}
              {selectedType && !isProcessing && countdown > 0 && !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 p-2 bg-green-50 rounded-lg text-center"
                >
                  <p className="text-sm text-green-700">
                    Auto-submitting in {countdown} seconds...
                  </p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleSkip}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedType || isProcessing}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <RingLoader size={20} color="#ffffff" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Having trouble?{" "}
                <button
                  onClick={() => {
                    // Clear cache and retry
                    const mobileKey = `${phone_code}${mobile_number}`;
                    localStorage.removeItem(
                      `last_account_selection_otp_${mobileKey}`,
                    );
                    setSelectedType(null);
                    setError(null);
                  }}
                  className="text-green-600 hover:underline"
                >
                  Clear selection and try again
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SmartAccountTypeSelectorForOTP;
