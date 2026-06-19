import React, { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../hooks/index";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AiOutlineClose } from "react-icons/ai";
import { FaExternalLinkAlt } from "react-icons/fa";

// Import REGULAR ACTIONS from authSlice
import {
  setOtp,
  setResendTimer,
  setResendAttempts,
  setModalData,
  closeModal,
  decrementTimer,
  resetAuthOtpState,
  selectResendTimer,
  selectResendAttempts,
  selectOtp,
  selectIsLoading,
  selectIsVerifyingOtp,
} from "../../Auth/slices/authSlice";

// Import THUNK ACTIONS from authThunk
import { sendOtp, validateOtp } from "../../../features/Auth/authThunk";

import {
  FiCheckCircle,
  FiArrowLeft,
  FiRefreshCw,
  FiSend,
  FiSmartphone,
  FiCopy,
  FiShield,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

function PhoneVerification() {
  const dispatch = useAppDispatch();

  // Select state from Redux store
  const isLoading = useAppSelector(selectIsLoading);
  const isVerifyingOtp = useAppSelector(selectIsVerifyingOtp);
  const resendTimer = useAppSelector(selectResendTimer);
  const resendAttempts = useAppSelector(selectResendAttempts);
  const otp = useAppSelector(selectOtp);

  const [copied, setCopied] = useState(false);
  const [showPlaidModal, setShowPlaidModal] = useState(false);
  const [plaidUrl, setPlaidUrl] = useState("");
  const [isPlaidLoading, setIsPlaidLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);  // ← ADD THIS
  const [redirectMessage, setRedirectMessage] = useState("")
  

  const navigate = useNavigate();
  const location = useLocation();

  const {
    mobileNumber,
    hasSSN = false, // ← Extract it
    customerData,
    isRemittanceOnly = false,  // ← ADD THIS
    isMultiCurrency = false,   // ← ADD THIS
    selectedAccounts = [],     // ← ADD THIS
    accountType = null,
  } = location.state || {};
  const otpRefs = useRef(new Array(6).fill(null));

  // Extract country code and number for display and submission
  const extractPhoneParts = (fullNumber) => {
    if (!fullNumber) return { country_code: "+1", number: "" };

    if (fullNumber.includes("+")) {
      const parts = fullNumber.split(" ");
      if (parts.length > 1) {
        return {
          country_code: parts[0],
          number: parts.slice(1).join("").replace(/\D/g, ""),
        };
      }
      // If no space but has +, try to extract country code
      const match = fullNumber.match(/^(\+\d+)(\d+)$/);
      if (match) {
        return { country_code: match[1], number: match[2] };
      }
    }
    return { country_code: "+1", number: fullNumber.replace(/\D/g, "") };
  };

  const { country_code, number } = extractPhoneParts(mobileNumber);

  // ========== NEW: UNDER REVIEW MODAL LOGIC ==========
  const showUnderReviewModal = () => {
    // Show a toast notification first
    toast.info(
      "Your account is under review. Please see details in the modal.",
    );

    // Then open the modal with the same message as Login component
    dispatch(
      setModalData({
        title: "Account Application Submitted",
        message: (
          <div className="text-left space-y-4">
            <p className="text-gray-700">
              Your account opening request has been received and is currently
              under review. The approval process may take 24–48 hours.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-800 mb-2">
                For any queries, please contact Customer Service:
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center">
                  <span className="mr-2">📞</span>
                  <span className="font-medium text-blue-600">
                    +977-1-5970800
                  </span>
                  <span className="ml-1">(Nepal)</span>
                </p>
                <p className="flex items-center">
                  <span className="mr-2">📞</span>
                  <span className="font-medium text-blue-600">
                    +1-888-226-0712
                  </span>
                  <span className="ml-1">(International)</span>
                </p>
              </div>
            </div>
          </div>
        ),
        type: "info",
        modalProps: {
          showCloseButton: true,
          onClose: () => {
            // Reset OTP state when modal is closed
            dispatch(setOtp(new Array(6).fill("")));
            // Optionally navigate to home or stay on page
            // navigate("/");
          },
        },
      }),
    );
  };
  // ===================================================

  const initialValues = {
    mobile_number: mobileNumber,
    otp: "",
  };

  // Add useEffect to automatically close the modal after a delay
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        dispatch(decrementTimer());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer, dispatch]);

  // ========== UPDATED: PLAID HANDLER FUNCTIONS WITH UNDER REVIEW LOGIC ==========

  const handleKycVerification = async (response) => {
    // ✅ IMPORTANT: Check if account is under review (plaid_kyc_required: "N")
    if (response.plaid_kyc_required === "N") {
      console.log("⏳ Account is under review (plaid_kyc_required: N)");

      // Reset OTP state immediately
      dispatch(setOtp(new Array(6).fill("")));

      // Show the under review modal
      setTimeout(() => {
        showUnderReviewModal();
      }, 100);

      return null;
    }

    // ⚠️ CRITICAL CHANGE: If user provided SSN, skip Plaid and go directly to home
    if (hasSSN) {
      console.log("✅ User provided SSN, skipping Plaid verification");
      toast.success("SSN verification will be processed separately!");

      // Store authentication data if available
      if (response.token) {
        localStorage.setItem("authtoken", response.token);
      }
      if (response.customer_id) {
        localStorage.setItem("authcustomer_id", response.customer_id);
      }

      // Navigate to home immediately
      setTimeout(() => {
        navigate("/");
      }, 1500);

      return null; // Return null to prevent further processing
    }

    // ✅ Check if KYC verification is required (plaid_kyc_required: "Y")
    if (
      response.plaid_kyc_required === "Y" &&
      response.plaid_url &&
      response.plaid_url !== ""
    ) {
      console.log("✅ KYC verification required (plaid_kyc_required: Y)");

      setPlaidUrl(response.plaid_url);

      // For whitelabeled partners, open directly in new tab
      if (response.is_whitelabelled_partner_customer === "1") {
        window.open(response.plaid_url, "_blank");
        toast.info("Bank verification opened in new tab");

        // Store auth data temporarily
        if (response.token) {
          localStorage.setItem("authtoken", response.token);
        }
        if (response.customer_id) {
          localStorage.setItem("authcustomer_id", response.customer_id);
          sessionStorage.setItem(
            "pending_kyc_auth",
            JSON.stringify({
              customer_id: response.customer_id,
              timestamp: Date.now(),
              plaidUrl: response.plaid_url,
            }),
          );
        }

        return null;
      } else {
        // For regular customers, show modal with options
        setShowPlaidModal(true);
        return null;
      }
    }

    // If KYC is already completed, proceed to home
    // If KYC is already completed, navigate based on account type
    if (response.kyc_status === 1 || response.kyc_status === "1") {
      if (isRemittanceOnly) {
        toast.success("Verification complete! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        toast.success("Verification complete! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
      return response;
    }

    // If no Plaid URL and KYC not completed, proceed normally
    // If no Plaid URL and KYC not completed, navigate based on account type
    if (isRemittanceOnly) {
      toast.success("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      toast.success("Registration successful! Redirecting to KYC verification...");
      setTimeout(() => {
        navigate("/kyc-verification", {
          state: {
            customerData: customerData || response.customer_data,
            selectedAccounts: selectedAccounts,
            fromRegistration: true
          }
        });
      }, 2000);
    }
    return response;
  };

  const openPlaidInNewWindow = () => {
    if (!plaidUrl) {
      toast.error("No verification URL available");
      return;
    }

    const plaidWindow = window.open(
      plaidUrl,
      "plaid_verification",
      "width=800,height=700,scrollbars=yes,resizable=yes,top=100,left=100",
    );

    if (plaidWindow) {
      monitorPlaidWindow(plaidWindow);
      setShowPlaidModal(false);
      setIsPlaidLoading(true);
      toast.info("Bank verification started in new window");
    } else {
      toast.warning(
        "Popup blocked! Please allow popups or use the manual link.",
      );
    }
  };

  const openPlaidInSameTab = () => {
    if (!plaidUrl) {
      toast.error("No verification URL available");
      return;
    }
    window.location.href = plaidUrl;
  };

  const closePlaidModal = () => {
    setShowPlaidModal(false);
    setPlaidUrl("");
    setIsPlaidLoading(false);
  };

  const monitorPlaidWindow = (plaidWindow) => {
    let checkCount = 0;
    const maxChecks = 300; // 5 minutes

    const checkWindow = setInterval(() => {
      checkCount++;
      if (plaidWindow.closed) {
        clearInterval(checkWindow);
        setIsPlaidLoading(false);

        setTimeout(() => {
          toast.success("Bank verification completed!");

          // Check if we have stored auth data
          const customerId = localStorage.getItem("authcustomer_id");
          const token = localStorage.getItem("authtoken");

          if (customerId && token) {
            navigate(`/home/${customerId}`);
          } else {
            navigate("/");
          }
        }, 1000);
      } else if (checkCount >= maxChecks) {
        clearInterval(checkWindow);
        setIsPlaidLoading(false);
        toast.info("Verification timeout. You can retry later.");
      }
    }, 1000);
  };

  const handleCopyPlaidLink = () => {
    if (!plaidUrl) {
      toast.error("No verification URL available");
      return;
    }

    navigator.clipboard.writeText(plaidUrl);
    setCopied(true);
    toast.success("Verification link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const { values, handleSubmit: formikSubmit } = useFormik({
    initialValues,
    onSubmit: async (values) => {
      // ✅ Create loginData with the correct format
      const loginData = {
        country_code: country_code,
        mobile_number: number,
        otp: otp.join(""),
      };
  
      try {
        const result = await dispatch(validateOtp(loginData));
  
        if (result.payload) {
          const data = result.payload;
  
          if (data.status === "success") {
            toast.success(data.message || "OTP verification successful!");
  
            // Store auth data
            if (data.token) localStorage.setItem("authtoken", data.token);
            if (data.customer_id) localStorage.setItem("authcustomer_id", data.customer_id);
  
            // ✅ FIRST CHECK: If plaid_kyc_required is "N", redirect to login
            if (data.plaid_kyc_required === "N") {
              console.log("🔄 plaid_kyc_required is N - Redirecting to login");
              
              // Show loading state
              setIsRedirecting(true);
              setRedirectMessage("OTP verified! Redirecting to login...");
              
              toast.info("OTP verified! Redirecting to login...", {
                autoClose: 2000,
              });
              
              // Redirect to login after 2 seconds
              setTimeout(() => {
                navigate("/login", {
                  state: {
                    message: "Verification complete! Please login to continue.",
                  }
                });
              }, 2000);
              return; // ⚠️ IMPORTANT: This return prevents further execution
            }
  
            // ✅ SECOND CHECK: For Remittance Only - go to login
            if (isRemittanceOnly) {
              console.log("🔄 isRemittanceOnly is true - Redirecting to login");
              setIsRedirecting(true);
              setRedirectMessage("Redirecting to login...");
              
              toast.info("Redirecting to login...");
              setTimeout(() => navigate("/login"), 2000);
              return; // ⚠️ IMPORTANT: This return prevents further execution
            }
  
            // ✅ THIRD CHECK: For Multi-Currency with Plaid URL - go to KYC
            if (data.plaid_url && data.plaid_url !== "") {
              console.log("🔄 Has Plaid URL - Redirecting to KYC verification");
              setIsRedirecting(true);
              setRedirectMessage("Redirecting to KYC verification...");
              
              toast.info("Redirecting to KYC verification...");
              setTimeout(() => {
                navigate("/kyc-verification", {
                  state: {
                    plaidUrl: data.plaid_url,
                    customerId: data.customer_id,
                    isWhitelabelled: data.is_whitelabelled_partner_customer === "1",
                    selectedAccounts: selectedAccounts,
                  }
                });
              }, 1500);
              return; // ⚠️ IMPORTANT: This return prevents further execution
            }
  
            // ✅ FINAL FALLBACK: Default - go to home
            console.log("🔄 No specific condition met - Redirecting to home");
            setIsRedirecting(true);
            setRedirectMessage("Redirecting to login...");
            
            setTimeout(() => navigate("/"), 1500);
            
          } else {
            toast.error(data.message || "OTP verification failed");
          }
        } else if (result.error) {
          const errorMessage =
            result.error.message ||
            result.error.payload?.message ||
            "Failed to verify OTP. Please try again.";
          toast.error(errorMessage);
        }
      } catch (error) {
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
  });
  useEffect(() => {
    const storedMobileNumber = localStorage.getItem("fullMobileNumber");
    if (storedMobileNumber) {
      localStorage.removeItem("fullMobileNumber");
    }

    // Auto-focus first OTP input when component mounts
    if (otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0].focus(), 100);
    }

    return () => {
      dispatch(resetAuthOtpState());
    };
  }, [dispatch]);

  const handleOtpChange = (e, index) => {
    const value = e.target.value.slice(0, 1);
    if (!isNaN(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      dispatch(setOtp(newOtp));

      if (value && index < otp.length - 1) {
        setTimeout(() => otpRefs.current[index + 1].focus(), 10);
      }
    }
  };

  const handleCopyOtp = async () => {
    const otpString = otp.join("");
    try {
      await navigator.clipboard.writeText(otpString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("OTP copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy OTP");
    }
  };

  const handlePasteOtp = (e) => {
    const pastedValue = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d{6}$/.test(pastedValue)) {
      dispatch(setOtp(pastedValue.split("").map((char) => char)));
      otpRefs.current[5].focus();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleGenerateOTP = async () => {
    if (resendAttempts <= 0) return;

    const storedMobileNumber = localStorage.getItem("fullMobileNumber");
    if (!storedMobileNumber) {
      toast.error("No mobile number found. Please try again.");
      return;
    }

    try {
      await dispatch(sendOtp(storedMobileNumber)).unwrap();
      toast.success("Verification code has been sent to your phone!");
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  const handleResendOTP = () => {
    if (resendAttempts > 0) {
      handleGenerateOTP();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const isOtpComplete = otp.every((digit) => digit !== "");
    if (!isOtpComplete) {
      toast.error("Please enter the complete 6-digit OTP code.");
      return;
    }

    const loginData = {
      country_code: country_code,
      mobile_number: number,
      otp: otp.join(""),
    };

    formikSubmit();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const isSubmitting = isLoading || isVerifyingOtp;
  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6"
    >
      <ToastContainer position="top-right" autoClose={1000} />

      {isRedirecting && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-700 font-medium text-center">
              {redirectMessage || "Please wait..."}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      </div>
    )}

      <div className="w-full flex flex-col items-center justify-between max-w-md sm:max-w-xl lg:max-w-2xl bg-white rounded-xl shadow-xl p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <button
            onClick={handleGoBack}
            className="text-gray-600 hover:text-gray-800 transition-colors p-1 sm:p-2"
            disabled={isSubmitting}
          >
            <FiArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 text-center">
            Phone Verification
          </h1>
          <FiSmartphone className="text-3xl sm:text-4xl lg:text-5xl text-blue-600" />
        </div>

        {/* PLAID MODAL - Enhanced from Login component */}
        {showPlaidModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md mx-auto">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  KYC Verification Required
                </h2>
                <button
                  onClick={closePlaidModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 sm:p-2"
                  disabled={isPlaidLoading}
                >
                  <AiOutlineClose size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FiShield className="text-blue-600 text-xl sm:text-2xl" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">
                    Secure KYC Verification
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">
                    You need to complete KYC verification to access your
                    account. This is a secure process powered by Plaid.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-start">
                    <FiShield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-800">
                        Secure & Encrypted
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Your information is protected with bank-level security.
                        We never store your banking credentials.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={openPlaidInNewWindow}
                    disabled={isPlaidLoading}
                    className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-70 text-sm sm:text-base"
                  >
                    {isPlaidLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    ) : (
                      <FaExternalLinkAlt className="text-sm sm:text-lg" />
                    )}
                    <span>
                      {isPlaidLoading ? "Opening..." : "Open in New Window"}
                    </span>
                  </button>

                  <button
                    onClick={openPlaidInSameTab}
                    disabled={isPlaidLoading}
                    className="w-full bg-gray-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-70 text-sm sm:text-base"
                  >
                    <span>Open in This Tab</span>
                  </button>

                  <div className="text-center">
                    <button
                      onClick={handleCopyPlaidLink}
                      disabled={isPlaidLoading}
                      className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm disabled:opacity-50"
                    >
                      {copied ? "Copied!" : "Copy verification link instead"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <p className="text-xs text-gray-500 text-center">
                  By continuing, you agree to our Terms of Service and Privacy
                  Policy
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="w-full space-y-6 sm:space-y-8">
          {/* Mobile Number Display */}
          <div className="text-center">
            <label className="block text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-4">
              Verification code sent to:
            </label>
            <div className="flex items-center justify-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-base sm:text-xl font-semibold text-gray-800 break-all">
                {country_code} {number}
              </span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center ml-2 sm:ml-3">
                <FiCheckCircle className="text-white text-xs" />
              </div>
            </div>
          </div>

          {/* OTP Input Section */}
          <div className="space-y-4 sm:space-y-6">
            <label className="block text-base sm:text-lg font-medium text-gray-700 text-center">
              Enter 6-digit verification code
            </label>

            <div
              className="flex justify-center gap-2 sm:gap-3 lg:gap-4 my-4 sm:my-6 md:my-8"
              onPaste={handlePasteOtp}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleBackspace(e, index)}
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 border border-gray-300 rounded-lg text-center text-xl sm:text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={isSubmitting}
                />
              ))}
            </div>

            {/* Copy OTP Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleCopyOtp}
              disabled={!isOtpComplete || copied || isSubmitting}
              className="w-full flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-sm sm:text-base"
            >
              <FiCopy className="w-4 h-4 sm:w-5 sm:h-5" />
              {copied ? "Copied to clipboard!" : "Copy OTP code"}
            </motion.button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 sm:space-y-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!isOtpComplete || isSubmitting}
              className="w-full bg-green-600 text-white py-3 sm:py-4 rounded-lg hover:bg-green-700 transition duration-300 flex items-center justify-center font-semibold text-base sm:text-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isVerifyingOtp ? (
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiCheckCircle className="mr-2 sm:mr-3 text-lg sm:text-2xl" />
                  Verify Code
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResendOTP}
              disabled={resendAttempts <= 0 || resendTimer > 0 || isSubmitting}
              className={`w-full py-3 sm:py-4 rounded-lg ${resendTimer > 0 || resendAttempts <= 0
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gray-600 text-white hover:bg-gray-700 transition duration-300"
                } flex items-center justify-center font-semibold text-base sm:text-xl`}
            >
              <FiRefreshCw className="mr-2 sm:mr-3 text-lg sm:text-2xl" />
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
            </motion.button>
          </div>

          {/* Status Information */}
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between text-sm sm:text-lg text-gray-600">
              <span>Attempts remaining:</span>
              <span
                className={`font-semibold ${resendAttempts <= 2 ? "text-orange-500" : "text-green-600"
                  }`}
              >
                {resendAttempts}
              </span>
            </div>

            {resendAttempts <= 2 && resendAttempts > 0 && (
              <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2 text-orange-600 text-sm sm:text-lg">
                ⚠️ Only {resendAttempts} attempt
                {resendAttempts !== 1 ? "s" : ""} remaining
              </div>
            )}

            {resendAttempts <= 0 && (
              <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2 text-red-600 text-sm sm:text-lg">
                ⚠️ No more attempts remaining. Please contact support.
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 text-base sm:text-lg">
              💡 Quick Tips
            </h4>
            <ul className="text-blue-600 space-y-1 sm:space-y-2 text-sm sm:text-base lg:text-lg">
              <li>• Check your SMS messages for the code</li>
              <li>• Codes expire after 10 minutes</li>
              <li>• Enter all 6 digits to verify automatically</li>
              <li>• Complete KYC verification if required</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PhoneVerification;
