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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  requestPasscode,
  validatePasscode,
  resetPassword,
  handlePasscodeChange,
  handlePasscodePaste,
  setEmail,
  setNewPassword,
  setConfirmPassword,
  setShowPassword,
  selectEmail,
  selectPasscode,
  selectNewPassword,
  selectConfirmPassword,
  selectStep,
  selectError,
  selectSuccessMessage,
  selectIsLoading,
  selectShowPassword,
  selectProgressBarWidth,
} from "./forgotPasswordActions";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputRefs = useRef(Array(6).fill(null));
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Selectors
  const email = useSelector(selectEmail);
  const passcode = useSelector(selectPasscode);
  const newPassword = useSelector(selectNewPassword);
  const confirmPassword = useSelector(selectConfirmPassword);
  const step = useSelector(selectStep);
  const error = useSelector(selectError);
  const successMessage = useSelector(selectSuccessMessage);
  const isLoading = useSelector(selectIsLoading);
  const showPassword = useSelector(selectShowPassword);
  const progressBarWidth = useSelector(selectProgressBarWidth);

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

  return (
    <div className="min-h-screen p-8 w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-xl w-full mx-auto px-4 sm:px-6">
        <motion.div
          className="bg-white shadow-xl rounded-xl px-8 py-10 overflow-hidden relative border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
            <motion.div
              className={`h-full ${
                step === 1 ? "bg-blue-500" : step === 2 ? "bg-indigo-500" : "bg-green-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressBarWidth}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          <div className="text-center mb-8">
            <motion.div className="flex justify-center items-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FaKey className="h-6 w-6" />
              </div>
            </motion.div>

            <motion.h1 className="text-2xl font-bold text-gray-900">
              {step === 1
                ? "Reset Your Password"
                : step === 2
                ? "Verify Your Identity"
                : "Create New Password"}
            </motion.h1>
            <motion.p className="text-gray-500 mt-2 text-sm">
              {step === 1
                ? "Enter your email to receive a verification code"
                : step === 2
                ? "We sent a 6-digit code to your email"
                : "Your new password must be different from previous ones"}
            </motion.p>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-50 border-l-4 border-red-500"
            >
              <div className="flex items-start">
                <FaExclamationCircle className="flex-shrink-0 h-5 w-5 text-red-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  {isLastThreePasswordsError(error) && (
                    <div className="mt-2 text-xs text-red-700">
                      <p className="font-semibold">Password requirements:</p>
                      <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Must be at least 12 characters</li>
                        <li>Cannot be one of your last 3 passwords</li>
                        <li>Should include uppercase, lowercase, numbers, and symbols</li>
                      </ul>
                      <p className="mt-2 font-medium">Try these suggestions:</p>
                      <ul className="list-disc pl-5 space-y-1">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 rounded-lg bg-green-50 border-l-4 border-green-500"
            >
              <div className="flex items-center">
                <FaCheckCircle className="flex-shrink-0 h-5 w-5 text-green-500 mr-3" />
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={containerVariants}>
                <motion.div variants={itemVariants} className="mb-5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => dispatch(setEmail(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      placeholder="your.email@example.com"
                      autoFocus
                    />
                  </div>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  onClick={() => dispatch(requestPasscode(email))}
                  disabled={isLoading || !email}
                  className={`w-full ${
                    email ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
                  } text-white py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Code...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Continue
                      <FaArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </motion.button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={containerVariants}>
                <motion.div variants={itemVariants} className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="passcode" className="block text-sm font-medium text-gray-700">
                      Verification Code
                    </label>
                    <span className="text-xs text-gray-500">Sent to {email}</span>
                  </div>
                  <div className="flex space-x-3 justify-center">
                    {passcode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePasscodeChangeLocal(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-xl font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  onClick={() => dispatch(validatePasscode(email, passcode))}
                  disabled={isLoading || passcode.some((d) => !d)}
                  className={`w-full ${
                    passcode.every((d) => d) ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-300 cursor-not-allowed"
                  } text-white py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mb-3`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Verify Code
                      <FaArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </motion.button>

                <motion.p variants={itemVariants} className="text-center text-sm text-gray-500 mt-3">
                  Didn't receive the code?{" "}
                  <button
                    onClick={() => dispatch(requestPasscode(email))}
                    className="text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none"
                    disabled={isLoading}
                  >
                    Resend Code
                  </button>
                </motion.p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={containerVariants}>
                <motion.div variants={itemVariants} className="mb-5">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                      className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 bg-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                      placeholder="Create a secure password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => dispatch(setShowPassword(!showPassword))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      )}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Password Strength:</span>
                        <span className={`font-medium ${
                          passwordStrength < 30 ? "text-red-500" :
                          passwordStrength < 70 ? "text-yellow-500" : "text-green-500"
                        }`}>
                          {passwordStrength < 30 ? "Weak" :
                           passwordStrength < 70 ? "Moderate" : "Strong"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            passwordStrength < 30 ? "bg-red-500" :
                            passwordStrength < 70 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => dispatch(setConfirmPassword(e.target.value))}
                      className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 bg-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => dispatch(setShowPassword(!showPassword))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      )}
                    </button>
                  </div>

                  {confirmPassword && (
                    <div className="mt-2 text-xs">
                      <div className={`flex items-center ${
                        newPassword === confirmPassword && newPassword ? "text-green-500" : "text-red-500"
                      }`}>
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
                  onClick={() => dispatch(resetPassword(email, newPassword, confirmPassword, bearertoken, navigate))}
                  disabled={
                    isLoading ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className={`w-full ${
                    newPassword && confirmPassword && newPassword === confirmPassword
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-300 cursor-not-allowed"
                  } text-white py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating Password...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Update Password
                      <FaArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div className="flex justify-between items-center mt-6 text-sm">
            {step > 1 && (
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800 focus:outline-none flex items-center"
                disabled={isLoading}
              >
                <FaChevronLeft className="h-3 w-3 mr-1" />
                Back
              </button>
            )}
            <div className="ml-auto text-gray-500">Step {step} of 3</div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};


export default ForgotPassword;