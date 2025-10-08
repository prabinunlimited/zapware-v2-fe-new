import React, { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/index';

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
  selectIsVerifyingOtp
} from '../../Auth/slices/authSlice';

// Import THUNK ACTIONS from authThunk
import { sendOtp, validateOtp } from '../../../features/Auth/authThunk';

import useFieldFocus from '../../../hooks/useFieldFocus';
import PopupModal from '../../../components/PopupModal/PopupModal';
import { ClipLoader } from 'react-spinners';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMobileAlt,
  faShieldAlt,
  faCopy,
  faPaperPlane,
  faCheckCircle,
  faExclamationTriangle,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

function PhoneVerification() {
  const dispatch = useAppDispatch();

  // Select state from Redux store
  const isLoading = useAppSelector(selectIsLoading);
  const isVerifyingOtp = useAppSelector(selectIsVerifyingOtp);
  const resendTimer = useAppSelector(selectResendTimer);
  const resendAttempts = useAppSelector(selectResendAttempts);
  const otp = useAppSelector(selectOtp);
  const modalData = useAppSelector((state) => state.auth.modalData);

  // Use field focus hook
  const { activeField, handleFocus, handleBlur: handleFieldBlur } = useFieldFocus();

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const bearertoken = localStorage.getItem('bearertoken');
  const navigate = useNavigate();
  const location = useLocation();

  const { kyc_verify = 1 } = location.state || {};
  const { mobileNumber } = location.state || { mobileNumber: [] };

  const otpRefs = useRef(new Array(6).fill(null));

  const initialValues = {
    mobile_number: mobileNumber,
    otp: '',
  };

  // Add useEffect to automatically close the modal after a delay
  useEffect(() => {
    if (modalData.isOpen) {
      const timer = setTimeout(() => {
        dispatch(closeModal());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [modalData.isOpen, dispatch]);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        dispatch(decrementTimer());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer, dispatch]);

  const {
    values,
    handleBlur: formikHandleBlur,
    handleChange,
    handleSubmit: formikSubmit,
    setFieldValue,
    errors,
    touched,
  } = useFormik({
    initialValues,
    validate: (values) => {
      const errors = {};
      if (!values.mobile_number) {
        errors.mobile_number = 'Mobile number is required';
      }
      return errors;
    },
    onSubmit: async (values) => {
      const currentDateTimeLocal = new Date().toLocaleString();

      // Extract phone code and number from the mobileNumber
      const mobileNumberParts = values.mobile_number.split(' ');
      const phone_code = mobileNumberParts[0] || '+1'; // Default to +1 if not available
      const mobile_number = mobileNumberParts.slice(1).join('').replace(/\D/g, "");

      const loginData = {
        phone_code: phone_code,
        mobile_number: mobile_number,
        otp: otp.join(''),
        password: 'defaultPassword', // You need to get this from somewhere
        sign_in_option: 'mobile',
        currentDate: currentDateTimeLocal,
      };

      console.log('🔄 Starting OTP validation with:', loginData);

      try {
        const result = await dispatch(validateOtp(loginData));

        console.log('📦 OTP validation result:', result);

        if (result.payload) {
          const data = result.payload;

          console.log('✅ OTP validation successful:', data);

          // Handle different response scenarios
          if (data.status === "success") {
            dispatch(setModalData({
              isOpen: true,
              title: 'Success',
              message: data.message || 'OTP verification successful!',
              type: 'success',
            }));

            // Store authentication data if available
            if (data.token) {
              localStorage.setItem('authtoken', data.token);
            }
            if (data.customer_id) {
              localStorage.setItem('authcustomer_id', data.customer_id);
            }

            // Handle different post-verification scenarios
            setTimeout(() => {
              if (data.redirected && data.plaid_url) {
                // Redirect to Plaid for KYC - UPDATED TO USE REACT ROUTER
                if (kyc_verify === '1') {
                  // Use window.location.href for external Plaid URL
                  window.location.href = data.plaid_url;
                } else {
                  navigate('/');
                }
              } else if (data.requiresKycVerification) {
                // Handle KYC requirement
                navigate('/kyc-verification');
              } else if (data.is_owner_login) {
                // Handle owner login
                navigate('/owner-dashboard');
              } else {
                // Regular successful login
                navigate('/');
              }
            }, 2000);
          } else if (data.redirected) {
            // Handle Plaid redirect
            dispatch(setModalData({
              isOpen: true,
              title: 'Redirecting',
              message: data.message || 'Redirecting to bank verification...',
              type: 'info',
            }));

            if (data.plaid_url) {
              setTimeout(() => {
                if (kyc_verify === '1') {
                  window.location.href = data.plaid_url;
                } else {
                  navigate('/');
                }
              }, 1000);
            }
          } else {
            // Handle other success cases
            dispatch(setModalData({
              isOpen: true,
              title: 'Success',
              message: data.message || 'Action completed successfully',
              type: 'success',
            }));
          }

        } else if (result.error) {
          // Handle rejected thunk
          console.error('❌ OTP validation failed:', result.error);
          const errorMessage = result.error.message || 'Failed to verify OTP. Please try again.';

          dispatch(setModalData({
            isOpen: true,
            title: 'Error',
            message: errorMessage,
            type: 'error',
          }));
        }
      } catch (error) {
        console.error('💥 Unexpected error during OTP validation:', error);
        dispatch(setModalData({
          isOpen: true,
          title: 'Error',
          message: 'An unexpected error occurred. Please try again.',
          type: 'error',
        }));
      }
    },
  });

  useEffect(() => {
    const storedMobileNumber = localStorage.getItem('fullMobileNumber');
    if (storedMobileNumber) {
      setFieldValue('mobile_number', storedMobileNumber);
      localStorage.removeItem('fullMobileNumber');
    }

    // Auto-focus first OTP input when component mounts
    if (otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0].focus(), 100);
    }

    return () => {
      dispatch(resetAuthOtpState());
    };
  }, [dispatch, setFieldValue]);

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

  const handleOtpFocus = (index) => {
    handleFocus(`otp-${index}`);
  };

  const handleOtpBlur = () => {
    handleFieldBlur();
  };

  const handleCopyOtp = async () => {
    const otpString = otp.join('');
    try {
      await navigator.clipboard.writeText(otpString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy OTP:', err);
    }
  };

  const handlePasteOtp = (e) => {
    const pastedValue = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d{6}$/.test(pastedValue)) {
      dispatch(setOtp(pastedValue.split('').map((char) => char)));
      otpRefs.current[5].focus();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleGenerateOTP = async () => {
    if (resendAttempts <= 0) return;

    const storedMobileNumber = localStorage.getItem('fullMobileNumber');
    if (!storedMobileNumber) {
      dispatch(setModalData({
        isOpen: true,
        title: 'Error',
        message: 'No mobile number found. Please try again.',
        type: 'error',
      }));
      return;
    }

    try {
      await dispatch(sendOtp(storedMobileNumber)).unwrap();
      setShowOtpInput(true);
      dispatch(setModalData({
        isOpen: true,
        title: 'OTP Sent',
        message: 'Verification code has been sent to your phone.',
        type: 'success',
      }));
    } catch (error) {
      console.error('Error generating OTP:', error);
      dispatch(setModalData({
        isOpen: true,
        title: 'Error',
        message: 'Failed to send OTP. Please try again.',
        type: 'error',
      }));
    }
  };

  const handleResendOTP = () => {
    if (resendAttempts > 0) {
      handleGenerateOTP();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if OTP is complete before submitting
    const isOtpComplete = otp.every(digit => digit !== '');
    if (!isOtpComplete) {
      dispatch(setModalData({
        isOpen: true,
        title: 'Error',
        message: 'Please enter the complete 6-digit OTP code.',
        type: 'error',
      }));
      return;
    }

    formikSubmit();
  };

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  const handleMobileNumberFocus = () => {
    handleFocus('mobile_number');
  };

  const handleMobileNumberBlur = (e) => {
    formikHandleBlur(e);
    handleFieldBlur();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const isSubmitting = isLoading || isVerifyingOtp;
  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-700 to-indigo-800 p-6 text-white text-center">
          <button
            onClick={handleGoBack}
            className="absolute left-4 top-4 text-white hover:text-blue-200 transition-colors"
            aria-label="Go back"
          >
            <FontAwesomeIcon icon={faArrowLeft} size="lg" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faShieldAlt} size="2x" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Phone Verification</h1>
          <p className="text-blue-100">Enter the verification code sent to your phone</p>
        </div>

        <div className="p-6">
          <PopupModal
            isOpen={modalData.isOpen}
            title={modalData.title}
            message={modalData.message}
            type={modalData.type}
            onClose={handleCloseModal}
          />

          {isSubmitting && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                <ClipLoader color="#3B82F6" size={50} />
                <p className="mt-4 text-gray-600">Verifying OTP...</p>
              </div>
            </div>
          )}

          {/* Wrap the content in a form element */}
          <form onSubmit={handleSubmit}>
            {/* Mobile Number Display */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faMobileAlt} className="mr-2 text-blue-600" />
                Mobile Number
              </label>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-lg font-semibold text-gray-800">{mobileNumber}</span>
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />
                </div>
              </div>
            </div>

            {/* OTP Input Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Enter 6-digit verification code
              </label>

              <div className="flex justify-between mb-4 relative">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleBackspace(e, index)}
                    onPaste={handlePasteOtp}
                    onFocus={() => handleOtpFocus(index)}
                    onBlur={handleOtpBlur}
                    className={`w-12 h-12 text-center border-2 rounded-lg text-xl font-bold transition-all duration-200 focus:outline-none focus:ring-0 ${activeField === `otp-${index}`
                      ? 'border-blue-500 ring-4 ring-blue-100 bg-blue-50 transform scale-105'
                      : digit ? 'border-green-400 bg-green-50' : 'border-gray-300'
                      }`}
                    disabled={isSubmitting}
                  />
                ))}
              </div>

              {/* Copy OTP Button */}
              <button
                type="button"
                onClick={handleCopyOtp}
                disabled={!isOtpComplete || copied}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} />
                {copied ? 'Copied to clipboard!' : 'Copy OTP code'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={!isOtpComplete || isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onFocus={() => handleFocus('verify-button')}
                onBlur={handleFieldBlur}
              >
                {isVerifyingOtp ? (
                  <>
                    <ClipLoader color="#ffffff" size={16} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Verify Code
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendAttempts <= 0 || resendTimer > 0}
                className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                onFocus={() => handleFocus('resend-button')}
                onBlur={handleFieldBlur}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
            </div>
          </form>

          {/* Status Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Attempts remaining:</span>
              <span className={`font-semibold ${resendAttempts <= 2 ? 'text-orange-500' : 'text-green-600'}`}>
                {resendAttempts}
              </span>
            </div>

            {resendAttempts <= 2 && resendAttempts > 0 && (
              <div className="mt-2 flex items-center gap-2 text-orange-600 text-sm">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>Only {resendAttempts} attempt{resendAttempts !== 1 ? 's' : ''} remaining</span>
              </div>
            )}

            {resendAttempts <= 0 && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>No more attempts remaining. Please contact support.</span>
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Quick Tips</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Check your SMS messages for the code</li>
              <li>• Codes expire after 10 minutes</li>
              <li>• Enter all 6 digits to auto-verify</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhoneVerification;