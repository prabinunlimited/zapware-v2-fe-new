import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheckCircle,
  FaKey,
  FaEnvelope,
  FaExclamationCircle,
  FaLock,
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaChevronLeft,
  FaPhone,
  FaBuilding,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  requestPasscode,
  validatePasscode,
  resetPassword,
  handlePasscodeChange,
  handlePasscodePaste,
  setUsername,
  setNewPassword,
  setConfirmPassword,
  setShowPassword,
  setAccountType,
  setShowAccountTypeDropdown,
  selectUsername,
  selectPasscode,
  selectNewPassword,
  selectConfirmPassword,
  selectStep,
  selectError,
  selectSuccessMessage,
  selectIsLoading,
  selectShowPassword,
  selectProgressBarWidth,
  selectAccountType,
  selectShowAccountTypeDropdown,
  selectApiResponse,
  resetForgotPassword,
} from "./forgotPasswordActions";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputRefs = useRef(Array(6).fill(null));
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Selectors
  const username = useSelector(selectUsername);
  const passcode = useSelector(selectPasscode);
  const newPassword = useSelector(selectNewPassword);
  const confirmPassword = useSelector(selectConfirmPassword);
  const step = useSelector(selectStep);
  const error = useSelector(selectError);
  const successMessage = useSelector(selectSuccessMessage);
  const isLoading = useSelector(selectIsLoading);
  const showPassword = useSelector(selectShowPassword);
  const progressBarWidth = useSelector(selectProgressBarWidth);
  const accountType = useSelector(selectAccountType);
  const showAccountTypeDropdown = useSelector(selectShowAccountTypeDropdown);
  const apiResponse = useSelector(selectApiResponse);

  const bearertoken = localStorage.getItem("bearertoken");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.5,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*]/.test(password)) strength += 1;
    return Math.min(Math.floor((strength / 5) * 100), 100);
  };

  const handleNewPasswordChange = (e) => {
    dispatch(setNewPassword(e.target.value));
    setPasswordStrength(calculatePasswordStrength(e.target.value));
  };

  const handlePasscodeChangeLocal = (index, value) => {
    dispatch(handlePasscodeChange(index, value));
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !passcode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const isLastThreePasswordsError = (errorMsg) => {
    return errorMsg && errorMsg.toLowerCase().includes("last three");
  };

  const isValidUsername = (value) => {
    // Check if it's a valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Check if it's a valid phone number (adjust regex as needed)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full mx-auto px-3 sm:px-4">
        <motion.div
          className="bg-white shadow-xl rounded-xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 overflow-hidden relative border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gray-100">
            <motion.div
              className={`h-full ${step === 1
                ? "bg-blue-500"
                : step === 2
                  ? "bg-indigo-500"
                  : "bg-green-500"
                }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressBarWidth}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <motion.div className="flex justify-center items-center mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-600">
                <FaKey className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </motion.div>

            <motion.h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {step === 1
                ? "Reset Your Password"
                : step === 2
                  ? "Verify Your Identity"
                  : "Create New Password"}
            </motion.h1>
            <motion.p className="text-gray-500 mt-1 sm:mt-2 text-xs sm:text-sm">
              {step === 1
                ? "Enter your email or phone number to receive a verification code"
                : step === 2
                  ? "We sent a 6-digit code to your email or phone"
                  : "Your new password must be different from previous ones"}
            </motion.p>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg bg-red-50 border-l-4 border-red-500"
            >
              <div className="flex items-start">
                <FaExclamationCircle className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-800 break-words">
                    {error}
                  </p>
                  {isLastThreePasswordsError(error) && (
                    <div className="mt-1 sm:mt-2 text-xs text-red-700">
                      <p className="font-semibold">Password requirements:</p>
                      <ul className="list-disc pl-3 sm:pl-5 space-y-0.5 sm:space-y-1 mt-0.5 sm:mt-1">
                        <li>Must be at least 12 characters</li>
                        <li>Cannot be one of your last 3 passwords</li>
                        <li>
                          Should include uppercase, lowercase, numbers, and
                          symbols
                        </li>
                      </ul>
                      <p className="mt-1 sm:mt-2 font-medium">
                        Try these suggestions:
                      </p>
                      <ul className="list-disc pl-3 sm:pl-5 space-y-0.5 sm:space-y-1">
                        <li>Add numbers or symbols to your current password</li>
                        <li>Create a completely new password</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg bg-green-50 border-l-4 border-green-500 shadow-sm"
            >
              <div className="flex items-start">
                <FaCheckCircle className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 text-green-500 mr-2 sm:mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm sm:text-base font-semibold text-green-800">
                    Success!
                  </p>
                  <p className="text-xs sm:text-sm text-green-700 mt-1">
                    {successMessage}
                  </p>
                  {successMessage.includes("successfully") && (
                    <p className="text-xs text-green-600 mt-2 animate-pulse">
                      Redirecting to login page...
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={containerVariants}>
                <motion.div variants={itemVariants} className="mb-4 sm:mb-5">
                  <label
                    htmlFor="username"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                  >
                    Email Address or Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => dispatch(setUsername(e.target.value))}
                      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 bg-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm sm:text-base"
                      placeholder="Email address or mobile number"
                      autoFocus
                    />
                  </div>
                </motion.div>

                {/* Account Type Dropdown */}
                {showAccountTypeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 sm:mb-5"
                  >
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Select Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => dispatch(setAccountType("individual"))}
                        className={`p-3 rounded-lg border-2 transition-all ${accountType === "individual"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-blue-300 text-gray-600"
                          }`}
                      >
                        <FaUser className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-sm font-medium">Individual</span>
                      </button>
                      <button
                        onClick={() => dispatch(setAccountType("institution"))}
                        className={`p-3 rounded-lg border-2 transition-all ${accountType === "institution"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-blue-300 text-gray-600"
                          }`}
                      >
                        <FaBuilding className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-sm font-medium">Institution</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                <motion.button
                  variants={itemVariants}
                  onClick={() => dispatch(requestPasscode(username, accountType, setShowAccountTypeDropdown))}
                  disabled={isLoading || !username || !isValidUsername(username) || (showAccountTypeDropdown && !accountType)}
                  className={`w-full ${username && isValidUsername(username) && (!showAccountTypeDropdown || accountType)
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-300 cursor-not-allowed"
                    } text-white py-2.5 sm:py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending Code...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Continue
                      <FaArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </span>
                  )}
                </motion.button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={containerVariants}>
                <motion.div variants={itemVariants} className="mb-4 sm:mb-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 sm:mb-2 gap-1 sm:gap-0">
                    <label
                      htmlFor="passcode"
                      className="block text-xs sm:text-sm font-medium text-gray-700"
                    >
                      Verification Code
                    </label>
                    <span className="text-xs text-gray-500 truncate">
                      Sent to {username}
                    </span>
                  </div>
                  <div
                    className="flex space-x-2 sm:space-x-3 justify-center"
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasteData = e.clipboardData.getData('text');
                      dispatch(handlePasscodePaste(pasteData));
                      // Focus on the last input after paste
                      setTimeout(() => {
                        if (inputRefs.current[5]) {
                          inputRefs.current[5].focus();
                        }
                      }, 10);
                    }}
                  >
                    {passcode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePasscodeChangeLocal(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  onClick={() => dispatch(validatePasscode(username, passcode, accountType))}
                  disabled={isLoading || passcode.some((d) => !d)}
                  className={`w-full ${passcode.every((d) => d)
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-300 cursor-not-allowed"
                    } text-white py-2.5 sm:py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mb-2 sm:mb-3 text-sm sm:text-base`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Verify Code
                      <FaArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </span>
                  )}
                </motion.button>

                <motion.p
                  variants={itemVariants}
                  className="text-center text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3"
                >
                  Didn't receive the code?{" "}
                  <button
                    onClick={() => dispatch(requestPasscode(username, accountType, setShowAccountTypeDropdown))}
                    className="text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none text-xs sm:text-sm"
                    disabled={isLoading}
                  >
                    Resend Code
                  </button>
                </motion.p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={containerVariants}>
                <motion.div variants={itemVariants} className="mb-4 sm:mb-5">
                  <label
                    htmlFor="newPassword"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                      className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 rounded-lg border border-gray-300 bg-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 text-sm sm:text-base"
                      placeholder="Create a secure password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => dispatch(setShowPassword(!showPassword))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-500" />
                      ) : (
                        <FaEye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-500" />
                      )}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="mt-1 sm:mt-2">
                      <div className="flex justify-between text-xs mb-0.5 sm:mb-1">
                        <span className="text-gray-500">
                          Password Strength:
                        </span>
                        <span
                          className={`font-medium ${passwordStrength < 30
                            ? "text-red-500"
                            : passwordStrength < 70
                              ? "text-yellow-500"
                              : "text-green-500"
                            }`}
                        >
                          {passwordStrength < 30
                            ? "Weak"
                            : passwordStrength < 70
                              ? "Moderate"
                              : "Strong"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5">
                        <div
                          className={`h-1 sm:h-1.5 rounded-full ${passwordStrength < 30
                            ? "bg-red-500"
                            : passwordStrength < 70
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            }`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) =>
                        dispatch(setConfirmPassword(e.target.value))
                      }
                      className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 rounded-lg border border-gray-300 bg-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 text-sm sm:text-base"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => dispatch(setShowPassword(!showPassword))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-500" />
                      ) : (
                        <FaEye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-500" />
                      )}
                    </button>
                  </div>

                  {confirmPassword && (
                    <div className="mt-1 sm:mt-2 text-xs">
                      <div
                        className={`flex items-center ${newPassword === confirmPassword && newPassword
                          ? "text-green-500"
                          : "text-red-500"
                          }`}
                      >
                        {newPassword === confirmPassword && newPassword ? (
                          <>
                            <FaCheckCircle className="mr-2 h-3 w-3 flex-shrink-0" />
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <FaExclamationCircle className="mr-2 h-3 w-3 flex-shrink-0" />
                            <span>Passwords do not match</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
                <motion.button
                  variants={itemVariants}
                  onClick={() => {
                    console.log("Update Password button clicked");
                    console.log("apiResponse:", apiResponse);
                    console.log("customerId:", apiResponse?.customerId);

                    dispatch(
                      resetPassword(
                        username,
                        newPassword,
                        confirmPassword,
                        bearertoken,
                        navigate,
                        apiResponse?.customerId // Now apiResponse is defined
                      )
                    );
                  }}
                  disabled={
                    isLoading ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className={`w-full ${newPassword &&
                    confirmPassword &&
                    newPassword === confirmPassword
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-300 cursor-not-allowed"
                    } text-white py-2.5 sm:py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating Password...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Update Password
                      <FaArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </span>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div className="flex justify-between items-center mt-4 sm:mt-6 text-xs sm:text-sm">
            {step > 1 && (
              <button
                onClick={() => {
                  if (step === 2) {
                    // Complete reset - clears everything
                    dispatch(resetForgotPassword());
                    // Note: resetForgotPassword already sets step to 1
                  } else if (step === 3) {
                    // Go back to step 2
                    dispatch(setStep(2));
                  } else {
                    navigate(-1);
                  }
                }}
                className="text-gray-600 hover:text-gray-800 focus:outline-none flex items-center"
                disabled={isLoading}
              >
                <FaChevronLeft className="h-3 w-3 mr-1" />
                Back
              </button>
            )}
            <div
              className={`text-gray-500 ${step > 1 ? "ml-auto" : "w-full text-center"}`}
            >
              Step {step} of 3
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;