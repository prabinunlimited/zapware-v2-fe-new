// src/features/Auth/components/Login.js
import React, { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { AiOutlineClose } from "react-icons/ai";
import { MdDownload } from "react-icons/md";
import Select from "react-select";
import { RingLoader } from "react-spinners";

// Components
import Modal from "../../../components/PopupModal/Modal";

// Thunks
import {
  initializeApp,
  loginUser,
  generatePasscode,
  generateOTP,
  verifyPasscode,
  verifyOTP,
  initiatePlaidFlow, // ✅ Make sure this is imported
  downloadManual,
} from "../../Auth/authThunk";

// Selectors
import {
  selectAuth,
  selectIsLoading,
  selectPasscode,
  selectOtp,
  selectShowPasscodeInput,
  selectShowOtpInput,
  selectPasscodeSent,
  selectOtpSent,
  selectRememberMe,
  selectCustomerType,
  selectInputType,
  selectIsVerifyingPasscode,
  selectIsGeneratingPasscode,
  selectIsGeneratingOtp,
  selectIsVerifyingOtp,
  selectRequiresKycVerification,
  selectShowCustomerType,
} from "../../Auth/slices/authSlice";

// Actions
import {
  setLoading,
  setPasscode,
  setOtp,
  setShowPasscodeInput,
  setShowOtpInput,
  setPasscodeSent,
  setOtpSent,
  setRememberMe,
  setCustomerType,
  setInputType,
  setError,
  setOwnerDetails,
  setAuthState,
  setShowCustomerType,
} from "../../Auth/slices/authSlice";

// Other selectors
import {
  selectCountries,
  selectSelectedCountry,
  selectCountriesLoading,
} from "../../Auth/slices/countrySlice";

import { selectPartnerConfig } from "../../Auth/slices/partnerSlice";

// UI Slice imports
import {
  openModal,
  closeModal,
  togglePasswordVisibility,
  selectUI,
} from "../../Auth/slices/uiSlice";

import {
  selectDownloadStatus,
  selectLastDownloadUrl,
} from "../../Auth/slices/downloadSlice";
import { setSelectedCountry } from "../../Auth/slices/countrySlice";

import { selectIsInitialized } from "../../Auth/slices/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Select state from Redux
  const auth = useSelector(selectAuth);
  const countries = useSelector(selectCountries);
  const countriesLoading = useSelector(selectCountriesLoading);
  const selectedCountry = useSelector(selectSelectedCountry);
  const ui = useSelector(selectUI);
  const downloadStatus = useSelector(selectDownloadStatus);
  const lastDownloadUrl = useSelector(selectLastDownloadUrl);
  const isVerifyingPasscode = useSelector(selectIsVerifyingPasscode);
  const isVerifyingOtp = useSelector(selectIsVerifyingOtp);
  const isGeneratingPasscode = useSelector(selectIsGeneratingPasscode);
  const isGeneratingOtp = useSelector(selectIsGeneratingOtp);
  const requiresKyc = useSelector(selectRequiresKycVerification);
  const showCustomerType = useSelector(selectShowCustomerType);

  // Destructure state with defaults
  const {
    passcode = [],
    otp = [],
    showPasscodeInput = false,
    showOtpInput = false,
    passcodeSent = false,
    otpSent = false,
    rememberMe = false,
    customerType = "",
    loading = false,
    is_owner_login = false,
    owner_id = null,
  } = auth;

  const {
    modal = {},
    passwordVisible = false,
    isCountriesLoading = "N",
    gifImages = [],
  } = ui;

  const inputType = useSelector(selectInputType);
  const hostName = window.location.hostname;

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
    mobile_number: Yup.string().when("inputType", {
      is: "mobile",
      then: (schema) =>
        schema
          .required("Mobile number is required")
          .matches(/^[0-9]+$/, "Must be only digits")
          .min(10, "Must be at least 10 digits")
          .max(15, "Must be at most 15 digits"),
    }),
    phone_code: Yup.string().when("inputType", {
      is: "mobile",
      then: (schema) => schema.required("Country code is required"),
    }),
    customerType: Yup.string().when([], {
      is: () => showCustomerType === "Y",
      then: (schema) => schema.required("Customer type is required"),
    }),
  });

  const formatPhoneForPlaid = (phoneCode, mobileNumber) => {
    // Remove any non-digit characters
    const cleanCode = phoneCode.replace(/\D/g, '');
    const cleanNumber = mobileNumber.replace(/\D/g, '');

    // Ensure proper E.164 format: +[country code][number] (max 15 digits total)
    const fullNumber = `+${cleanCode}${cleanNumber}`;

    // Validate length (country code + number should be max 15 digits)
    if (fullNumber.length > 16) { // + plus 15 digits
      console.warn('Phone number too long for Plaid:', fullNumber);
      // Truncate to max length while preserving country code
      const countryCodePart = `+${cleanCode}`;
      const maxNumberLength = 15 - countryCodePart.length;
      const truncatedNumber = cleanNumber.slice(0, maxNumberLength);
      return `${countryCodePart}${truncatedNumber}`;
    }

    return fullNumber;
  };

  const handleKycVerification = async (response, values) => {
    console.log('🔍 [KYC Handler] Processing response:', response);

    // ✅ Handle Plaid redirect from verifyPasscode response
    if (response.requiresPlaidRedirect && response.plaidUrl) {
      console.log('🎯 [KYC Handler] KYC required - redirecting to Plaid');

      const customerId = response.customer_id || response.customerData?.customer_id;

      if (!customerId) {
        throw new Error("Unable to start bank verification: Missing customer information");
      }

      // Store pending auth data for callback handling
      const pendingAuth = {
        email: values.email,
        mobile_number: values.mobile_number,
        phone_code: values.phone_code,
        inputType: values.inputType,
        customer_id: customerId,
        kyc_status: response.kyc_status,
        timestamp: Date.now()
      };

      sessionStorage.setItem('pending_kyc_auth', JSON.stringify(pendingAuth));

      // Show redirect message to user
      dispatch(
        openModal({
          title: "KYC Verification Required",
          message: "You must complete bank verification before accessing your account. Redirecting to verification system...",
          type: "info",
          modalProps: {
            showSpinner: true,
            autoClose: true,
            autoCloseDelay: 2000,
            onClose: () => {
              console.log('🔄 [KYC Handler] Redirecting to Plaid for KYC verification');
              window.location.href = response.plaidUrl;
            }
          },
          disableBackdropClick: true,
          disableEscapeKey: true
        })
      );

      return null; // Stop further processing - NO LOGIN ALLOWED
    }

    // ✅ Handle owner login (bypass KYC)
    if (response.is_owner_login) {
      console.log('👑 [KYC Handler] Owner login detected - bypassing KYC');
      dispatch(
        setOwnerDetails({
          is_owner_login: true,
          owner_id: response.owner_id,
          owner_role_name: response.owner_role_name,
        })
      );

      dispatch(
        openModal({
          title: "Owner Login Successful",
          message: "Redirecting to owner dashboard...",
          type: "success",
          modalProps: {
            showSpinner: true,
            autoClose: true,
            autoCloseDelay: 1500,
            onClose: () => {
              navigate(`/signupowner/${response.owner_id}`);
            }
          },
          disableBackdropClick: true,
          disableEscapeKey: true
        })
      );

      return response;
    }

    // ✅ CRITICAL: If we get a response with kyc_status "0" but no redirect, BLOCK LOGIN
    if (response.kyc_status === "0" || response.kyc_status === 0) {
      console.log('🚫 [KYC Handler] KYC status is 0 but no redirect - BLOCKING LOGIN');

      let errorMessage = "KYC verification is required before you can access your account. ";

      // Handle specific phone number format errors
      if (response.message && response.message.includes("phone_number must consist of +")) {
        errorMessage += "There's an issue with your phone number format. Please contact support to resolve this issue.";

        // Log detailed phone number info for debugging
        console.error('📞 Phone number format issue:', {
          phoneCode: values.phone_code,
          mobileNumber: values.mobile_number,
          formatted: formatPhoneForPlaid(values.phone_code, values.mobile_number),
          responseMessage: response.message
        });
      } else {
        errorMessage += "Please contact support to complete your KYC verification.";
      }

      dispatch(
        openModal({
          title: "KYC Verification Required",
          message: errorMessage,
          type: "error",
          modalProps: {
            actions: [
              {
                label: "Contact Support",
                primary: true,
                actionType: "NAVIGATE",
                path: "/contact-support"
              },
              {
                label: "Try Again",
                primary: false,
                actionType: "CALLBACK",
                callback: () => {
                  // Reset passcode/OTP states to allow retry
                  dispatch(setPasscode(new Array(6).fill("")));
                  dispatch(setOtp(new Array(6).fill("")));
                  dispatch(setShowPasscodeInput(false));
                  dispatch(setShowOtpInput(false));
                }
              }
            ]
          }
        })
      );

      throw new Error("KYC verification required"); // This will prevent login
    }

    // ✅ Handle bank approval pending
    if (response.bank_approve_status !== "1") {
      console.log('🚫 [KYC Handler] Bank approval pending - BLOCKING LOGIN');
      dispatch(
        openModal({
          title: "Bank Approval Pending",
          message: "Your bank account is pending approval. You cannot access your account until approval is complete. Please contact support.",
          type: "error",
          modalProps: {
            actions: [
              {
                label: "Contact Support",
                primary: true,
                actionType: "NAVIGATE",
                path: "/contact-support"
              }
            ]
          }
        })
      );

      throw new Error("Bank account not approved");
    }

    // ✅ ONLY if we get here, it's a successful login with completed KYC and bank approval
    console.log('✅ [KYC Handler] KYC verified - allowing login');
    return response;
  };

  // Add this useEffect to your Login component to handle KYC callbacks
  useEffect(() => {
    const handleKycCallback = () => {
      // Check URL parameters for KYC callback
      const urlParams = new URLSearchParams(window.location.search);
      const kycStatus = urlParams.get('status');
      const kycMessage = urlParams.get('message');
      const customerId = urlParams.get('customer_id');

      // Check for Plaid callback parameters
      const plaidStatus = urlParams.get('plaid_status');
      const plaidError = urlParams.get('plaid_error');

      console.log('🔍 Checking for KYC callback:', {
        kycStatus,
        kycMessage,
        customerId,
        plaidStatus,
        plaidError
      });

      // Handle successful KYC
      if (kycStatus === 'success' || plaidStatus === 'success') {
        console.log('✅ KYC/Plaid completed successfully');

        // Get pending auth data
        const pendingAuth = sessionStorage.getItem('pending_kyc_auth');
        let authData = null;

        if (pendingAuth) {
          try {
            authData = JSON.parse(pendingAuth);
          } catch (e) {
            console.error('Error parsing pending auth:', e);
          }
        }

        // Clear the URL parameters
        window.history.replaceState({}, '', window.location.pathname);

        dispatch(
          openModal({
            title: "Verification Successful! 🎉",
            message: kycMessage || "Your bank verification has been completed successfully.",
            type: "success",
            modalProps: {
              showCloseButton: true,
              onClose: () => {
                // Redirect to appropriate page
                const redirectCustomerId = customerId || authData?.customer_id;
                if (redirectCustomerId) {
                  navigate(`/home/${redirectCustomerId}`);
                } else {
                  navigate('/');
                }
                sessionStorage.removeItem('pending_kyc_auth');
              }
            },
          })
        );
      }

      // Handle failed KYC
      else if (kycStatus === 'failed' || plaidStatus === 'error' || plaidError) {
        console.error('❌ KYC/Plaid verification failed');

        dispatch(
          openModal({
            title: "Verification Failed",
            message: kycMessage || plaidError || "We were unable to complete your bank verification. Please try again.",
            type: "error",
            modalProps: {
              showCloseButton: true,
              onClose: () => {
                window.history.replaceState({}, '', window.location.pathname);
                sessionStorage.removeItem('pending_kyc_auth');
              }
            },
          })
        );
      }
    };

    handleKycCallback();
  }, [dispatch, navigate]);

  const handleSuccessfulLoginRedirect = (processedData) => {
    console.log('🔍 REDIRECT DEBUG:', {
      isRemittanceOnlyCustomer: processedData.isRemittanceOnlyCustomer,
      type: typeof processedData.isRemittanceOnlyCustomer,
      value: processedData.isRemittanceOnlyCustomer,
      customer_id: processedData.customer_id
    });

    // ✅ Consistent check for both string "Y" and boolean true
    const shouldRedirectToHomeRemit =
      processedData.isRemittanceOnlyCustomer === "Y" ||
      processedData.isRemittanceOnlyCustomer === true;

    const redirectPath = shouldRedirectToHomeRemit
      ? `/homeremit/${processedData.customer_id}`
      : `/home/${processedData.customer_id}`;

    console.log('🔍 FINAL REDIRECT PATH:', redirectPath);

    // ✅ Use replace: true to prevent back navigation issues
    navigate(redirectPath, { replace: true });
  };

  // ✅ Add this useEffect to handle auth state changes
  useEffect(() => {
    console.log('🔍 [Login] Auth state changed:', {
      token: auth.token,
      customerId: auth.customerId,
      isAuthenticated: auth.isAuthenticated
    });

    // ✅ If somehow we become authenticated while on login page, redirect
    if (auth.isAuthenticated && auth.customerId) {
      console.log('🔄 [Login] Already authenticated, redirecting to home');
      handleSuccessfulLoginRedirect({
        customer_id: auth.customerId,
        isRemittanceOnlyCustomer: auth.user?.isRemittanceOnlyCustomer
      });
    }
  }, [auth.token, auth.customerId, auth.isAuthenticated, auth.user]);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      phone_code: "",
      mobile_number: "",
      inputType: "email",
      customerType: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        let payload = {
          sign_in_option: inputType,
          email: values.email,
          mobile_number: values.mobile_number,
          phone_code: values.phone_code,
          password: values.password,
          passcode: Array.isArray(passcode) ? passcode.join("") : "",
          otp: Array.isArray(otp) ? otp.join("") : "",
        };

        // Add customer_type to payload when showCustomerType is "Y" and customerType is selected
        if (showCustomerType === "Y" && values.customerType) {
          payload.customer_type = values.customerType;
        }

        if (showCustomerType === "Y" && !values.customerType) {
          dispatch(
            openModal({
              title: "Error",
              message: "Please select a customer type",
              type: "error",
            })
          );
          return;
        }

        dispatch(setLoading(true));

        const response = await dispatch(loginUser(payload)).unwrap();

        if (showPasscodeInput || showOtpInput) {
          dispatch(setShowPasscodeInput(false));
          dispatch(setShowOtpInput(false));
        }

        // Handle verification requirements first
        if (!response.verified) {
          if (inputType === "email") {
            await dispatch(
              generatePasscode({
                email: values.email,
                password: values.password,
                ...(showCustomerType === "Y" &&
                  values.customerType && {
                  customer_type: values.customerType,
                }),
              })
            ).unwrap();
            dispatch(setShowPasscodeInput(true));
            dispatch(setPasscodeSent(true));
            return;
          } else {
            await dispatch(
              generateOTP({
                phone_code: values.phone_code,
                mobile_number: values.mobile_number,
                ...(showCustomerType === "Y" &&
                  values.customerType && {
                  customer_type: values.customerType,
                }),
              })
            ).unwrap();
            dispatch(setShowOtpInput(true));
            dispatch(setOtpSent(true));
            return;
          }
        }

        // MODIFIED: Handle KYC verification using the new approach
        const processedData = await handleKycVerification(response, values);

        // If handleKycVerification returned data, continue with normal flow
        if (processedData) {
          // Handle owner login
          if (processedData.is_owner_login === "1") {
            dispatch(
              setOwnerDetails({
                is_owner_login: true,
                owner_id: processedData.owner_id,
                owner_role_name: processedData.owner_role_name,
              })
            );
            navigate(`/signupowner/${processedData.owner_id}`);
            return;
          }

          // Bank approval check
          if (processedData.bank_approve_status !== "1") {
            throw new Error("Bank account not approved. Please contact support.");
          }

          // Auth state setup
          const authState = {
            token: processedData.token,
            customerId: processedData.customer_id,
            isAuthenticated: true,
            user: {
              customerType: processedData.customer_type,
              isRemittanceOnlyCustomer: processedData.isRemittanceOnlyCustomer,
              [inputType === "email" ? "email" : "mobile_number"]:
                inputType === "email" ? values.email : values.mobile_number,
            },
          };

          dispatch(setAuthState(authState));

          // Success flow
          dispatch(
            openModal({
              title: "Success",
              type: "success",
              modalComponent: "SuccessModal",
              modalProps: {
                message: "Login successful! Redirecting to your dashboard...",
                showSpinner: true,
              },
              disableBackdropClick: true,
              disableEscapeKey: true,
            })
          );

          setTimeout(() => {
            dispatch(closeModal());
            // USE CONSISTENT REDIRECT LOGIC
            handleSuccessfulLoginRedirect(processedData);
          }, 1500);
        }
      } catch (error) {
        console.error("Login error:", error);
        dispatch(setLoading(false));
        dispatch(setPasscode([]));
        dispatch(setOtp([]));
        dispatch(setShowPasscodeInput(false));
        dispatch(setShowOtpInput(false));
        dispatch(setPasscodeSent(false));
        dispatch(setOtpSent(false));

        dispatch(
          openModal({
            title: "Login Failed",
            message:
              error.message ||
              "An error occurred during login. Please try again.",
            type: "error",
          })
        );
      }
    },
  });

  const {
    values,
    handleBlur,
    handleChange,
    handleSubmit,
    errors,
    touched,
    setFieldValue,
  } = formik;

  // Memoize country options
  const countryOptions = useMemo(() => {
    return Array.isArray(countries)
      ? countries.map((country) => ({
        value: country.phone_code,
        label: `${country.name} (${country.phone_code})`,
        countryName: country.name,
        flagUrl: country.flag_url,
      }))
      : [];
  }, [countries]);

  const currentCountryOption = useMemo(() => {
    return (
      countryOptions.find((option) => option.value === values.phone_code) ||
      null
    );
  }, [countryOptions, values.phone_code]);

  // Initialization effect
  useEffect(() => {
    dispatch(initializeApp());
  }, [dispatch]);

  useEffect(() => {
    if (is_owner_login && owner_id) {
      navigate(`/signupowner/${owner_id}`);
    }
  }, [is_owner_login, owner_id, navigate]);

  useEffect(() => {
    if (downloadStatus === "succeeded" && lastDownloadUrl) {
      window.open(lastDownloadUrl, "_blank");
    }
  }, [downloadStatus, lastDownloadUrl]);

  useEffect(() => {
    const handleKycResults = () => {
      // Check for KYC result in URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const kycStatus = urlParams.get('kyc_status');
      const kycMessage = urlParams.get('kyc_message');
      const customerId = urlParams.get('customer_id');

      // Check session storage for pending auth
      const pendingAuth = sessionStorage.getItem('pending_kyc_auth');
      let pendingData = null;

      if (pendingAuth) {
        try {
          pendingData = JSON.parse(pendingAuth);
        } catch (e) {
          console.error('Error parsing pending auth:', e);
        }
      }

      console.log('🔍 Checking for KYC results:', {
        urlStatus: kycStatus,
        urlMessage: kycMessage,
        customerId,
        pendingData: !!pendingData
      });

      // Handle KYC success
      if (kycStatus === 'success' || kycStatus === 'completed') {
        console.log('✅ KYC completed successfully');

        // Clear pending auth
        sessionStorage.removeItem('pending_kyc_auth');

        // Update localStorage
        localStorage.setItem('kyc_status', '1');

        dispatch(
          openModal({
            title: "Verification Successful! 🎉",
            message: kycMessage || "Your identity has been successfully verified. You can now access your account.",
            type: "success",
            modalProps: {
              showCloseButton: true,
              onClose: () => {
                // Redirect to dashboard
                if (customerId) {
                  navigate(`/home/${customerId}`);
                } else if (pendingData?.customer_id) {
                  navigate(`/home/${pendingData.customer_id}`);
                } else {
                  navigate('/');
                }

                // Clean up URL
                window.history.replaceState({}, '', window.location.pathname);
              }
            },
          })
        );
      }

      // Handle KYC failure
      else if (kycStatus === 'failed' || kycStatus === 'error') {
        console.error('❌ KYC verification failed');

        dispatch(
          openModal({
            title: "Verification Failed",
            message: kycMessage || "We were unable to verify your identity. Please try again.",
            type: "error",
            modalProps: {
              showCloseButton: true,
              onClose: () => {
                // Clean up
                sessionStorage.removeItem('pending_kyc_auth');
                window.history.replaceState({}, '', window.location.pathname);
              }
            },
          })
        );
      }
    };

    handleKycResults();
  }, [dispatch, navigate]);

  useEffect(() => {
    if (is_owner_login && owner_id) {
      navigate(`/signupowner/${owner_id}`);
    }
  }, [is_owner_login, owner_id, navigate]);

  useEffect(() => {
    if (downloadStatus === "succeeded" && lastDownloadUrl) {
      window.open(lastDownloadUrl, "_blank");
    }
  }, [downloadStatus, lastDownloadUrl]);

  const handleGeneratePasscode = async (e) => {
    e.preventDefault();

    if (!values.email || !values.password) {
      dispatch(
        openModal({
          title: "Error",
          message: "Please fill all fields",
          type: "error",
        })
      );
      return;
    }

    try {
      dispatch(setLoading(true));

      // Create payload with customer_type if available
      const payload = {
        email: values.email,
        password: values.password,
      };

      // Add customer_type when available and showCustomerType is Y
      if (showCustomerType === "Y" && values.customerType) {
        payload.customer_type = values.customerType;
      }

      const result = await dispatch(generatePasscode(payload)).unwrap();

      // Handle multiple accounts scenario
      if (result.status === "multiple_accounts") {
        // Reset passcode states to prevent the verification popup from showing
        dispatch(setShowPasscodeInput(false));
        dispatch(setPasscodeSent(false));
        dispatch(setPasscode([]));
        return;
      }

      // If we get here, passcode was generated successfully (no multiple accounts)
      dispatch(setShowPasscodeInput(true));
      dispatch(setPasscodeSent(true));
      dispatch(setPasscode(new Array(6).fill("")));

      // Show success message
      dispatch(
        openModal({
          title: "Passcode Sent",
          message: "A 6-digit passcode has been sent to your email address.",
          type: "success",
          modalProps: {
            autoClose: true,
            autoCloseDelay: 3000,
          },
        })
      );
    } catch (error) {
      console.error("Passcode generation error:", error);

      // Handle blocked account case
      if (
        error.data?.blocked_status === 1 ||
        error.payload?.data?.blocked_status === 1
      ) {
        dispatch(
          openModal({
            title: "Account Blocked",
            message: "Your account has been blocked. Please contact support.",
            type: "error",
            modalProps: {
              actions: [
                {
                  label: "Contact Support",
                  primary: true,
                  actionType: "NAVIGATE",
                  path: "/contact-support",
                },
              ],
            },
          })
        );
        return;
      }

      // Extract the message from the API response
      let displayMessage = "Failed to generate passcode";

      if (error.message) {
        displayMessage = error.message;
      } else if (error.payload?.message) {
        displayMessage = error.payload.message;
      } else if (error.response?.data?.message) {
        displayMessage = error.response.data.message;
      }

      dispatch(
        openModal({
          title: "Error",
          message: displayMessage,
          type: "error",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGenerateOTP = async () => {
    try {
      if (!values.phone_code || !values.mobile_number) {
        dispatch(
          openModal({
            title: "Error",
            message: "Please enter both country code and mobile number",
            type: "error",
          })
        );
        return;
      }

      // Create payload with customer_type if needed
      const payload = {
        phone_code: values.phone_code,
        mobile_number: values.mobile_number,
        // Add customer_type when available
        ...(showCustomerType === "Y" &&
          values.customerType && {
          customer_type: values.customerType,
        }),
      };

      const result = await dispatch(generateOTP(payload)).unwrap();

      if (!result.message || result.message === "OTP sent successfully") {
        dispatch(setShowOtpInput(true));
        dispatch(setOtpSent(true));
        dispatch(setOtp(new Array(6).fill("")));
      }

      if (result.message) {
        dispatch(
          openModal({
            title: result.message.includes("Invalid") ? "Error" : "Success",
            message: result.message,
            type: result.message.includes("Invalid") ? "error" : "success",
          })
        );
      }
    } catch (error) {
      // Handle multiple accounts scenario
      if (error.requiresCustomerType) {
        // The thunk already dispatched setShowCustomerType("Y")
        dispatch(
          openModal({
            title: "Select Account Type",
            message: error.message,
            type: "info",
          })
        );
        return;
      }

      dispatch(
        openModal({
          title: "Error",
          message: error.message || "Failed to generate OTP",
          type: "error",
        })
      );
    }
  };

  useEffect(() => {
    console.log("showCustomerType:", showCustomerType);
    console.log("values.customerType:", values.customerType);
  }, [showCustomerType, values.customerType]);

  const handleManualDownload = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(
        downloadManual({
          placement: "Login Page",
        })
      ).unwrap();

      window.open(result.file_path, "_blank");
    } catch (error) {
      let errorMessage = "Failed to download manual";
      if (error.includes("Manual file path not found")) {
        errorMessage = "The manual file is currently unavailable";
      } else if (error.includes("Authentication")) {
        errorMessage = "Please login to download the manual";
      }

      dispatch(
        openModal({
          title: "Download Error",
          message: errorMessage,
          type: "error",
        })
      );
    }
  };

  const handlePasscodeChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 1); // Only digits, max 1 char
    const newPasscode = [...passcode];
    newPasscode[index] = value;
    dispatch(setPasscode(newPasscode));

    // Auto-advance to next input
    if (value && index < passcode.length - 1) {
      setTimeout(() => {
        const nextInput = document.getElementById(`passcode-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }, 10);
    }
  };

  const handlePasscodeKeyDown = (e, index) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === "Backspace" && !passcode[index] && index > 0) {
      const prevInput = document.getElementById(`passcode-input-${index - 1}`);
      if (prevInput) {
        setTimeout(() => prevInput.focus(), 10);
      }
    }

    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const pasteData = text.replace(/\D/g, "").slice(0, 6);
        if (pasteData.length === 6) {
          const newPasscode = pasteData.split("");
          dispatch(setPasscode(newPasscode));
          setTimeout(() => {
            document.getElementById(`passcode-input-5`)?.focus();
          }, 10);
        }
      });
    }
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value.slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = value;
    dispatch(setOtp(newOtp));

    if (value && index < otp.length - 1) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }
  };

  const handleBackspace = (e, index, isPasscode = true) => {
    if (e.key === "Backspace") {
      if (isPasscode) {
        if (!passcode[index] && index > 0) {
          document.getElementById(`passcode-input-${index - 1}`).focus();
        }
      } else {
        if (!otp[index] && index > 0) {
          document.getElementById(`otp-input-${index - 1}`).focus();
        }
      }
    }
  };

  const handleVerifyPasscode = async () => {
    // Validate passcode length
    if (passcode.join("").length !== 6) {
      dispatch(
        openModal({
          title: "Incomplete Code",
          message: "Please enter all 6 digits to continue",
          type: "error",
        })
      );
      return;
    }

    try {
      console.log('🔄 [handleVerifyPasscode] Starting verification...');

      // ✅ CRITICAL: Ensure we have all required data
      if (!values.email) {
        throw new Error("Email is required for verification");
      }

      const verifyPayload = {
        email: values.email.trim().toLowerCase(),
        passcode: passcode,
        password: values.password, // Include password for initial verification
        sign_in_option: inputType,
      };

      // Add customer_type if available and required
      if (showCustomerType === "Y" && values.customerType) {
        verifyPayload.customer_type = values.customerType;
      }

      console.log('📤 [handleVerifyPasscode] Calling verifyPasscode with:', {
        email: verifyPayload.email,
        passcodeLength: verifyPayload.passcode.length,
        hasPassword: !!verifyPayload.password,
        customerType: verifyPayload.customer_type
      });

      const result = await dispatch(verifyPasscode(verifyPayload)).unwrap();

      console.log('🔍 [handleVerifyPasscode] Thunk result:', result);

      // ✅ Use the STRICTER KYC verification handling
      const processedData = await handleKycVerification(result, values);

      // If processedData is null, it means we redirected to Plaid (NO LOGIN)
      if (processedData === null) {
        console.log('🔄 [handleVerifyPasscode] Redirected to Plaid for KYC - NO LOGIN ALLOWED');
        return;
      }

      // ✅ Handle owner login
      if (processedData.is_owner_login) {
        console.log('👑 [handleVerifyPasscode] Owner login flow completed');
        return;
      }

      // ✅ ONLY proceed if we have valid data AND KYC is not 0
      if (processedData && processedData.token && processedData.customer_id) {
        const customerId = processedData.customer_id;

        console.log('✅ [handleVerifyPasscode] Successful login for customer:', customerId);

        // Set auth state
        dispatch(
          setAuthState({
            token: processedData.token,
            customerId: customerId,
            user: {
              email: values.email,
              isRemittanceOnlyCustomer: processedData.isRemittanceOnlyCustomer || false,
              customerType: processedData.customer_type || "individual",
            },
          })
        );

        // Clear passcode state
        dispatch(setPasscode(new Array(6).fill("")));
        dispatch(setShowPasscodeInput(false));
        dispatch(setPasscodeSent(false));

        // Show success message
        dispatch(
          openModal({
            title: "Login Successful",
            message: "You're being redirected to your dashboard...",
            type: "success",
            modalProps: {
              showSpinner: true,
              autoClose: true,
              autoCloseDelay: 1500
            },
            disableBackdropClick: true,
            disableEscapeKey: true,
          })
        );

        // Redirect after delay
        setTimeout(() => {
          dispatch(closeModal());
          handleSuccessfulLoginRedirect({
            customer_id: customerId,
            isRemittanceOnlyCustomer: processedData.isRemittanceOnlyCustomer
          });
        }, 1500);
      } else {
        // This should never happen with the stricter checks above
        console.error('❌ [handleVerifyPasscode] Missing token or customer_id:', processedData);
        throw new Error("Login successful but missing required information");
      }
    } catch (error) {
      console.error("❌ [handleVerifyPasscode] Verification error:", error);

      // Reset focus to first input for retry
      const firstInput = document.getElementById("passcode-input-0");
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }

      // Clear passcode for security
      dispatch(setPasscode(new Array(6).fill("")));

      // Show appropriate error message
      let displayMessage = error.message || "Verification failed. Please try again.";

      // Don't show modal for KYC-related errors (they're handled in the KYC handler)
      if (error.message &&
        !error.message.includes("KYC") &&
        !error.message.includes("bank verification") &&
        !error.message.includes("Plaid")) {
        dispatch(
          openModal({
            title: "Verification Failed",
            message: displayMessage,
            type: "error",
            modalProps: {
              actions: [
                {
                  label: "Try Again",
                  primary: true,
                  actionType: "CALLBACK",
                  callback: () => {
                    // Reset state for retry
                    dispatch(setPasscode(new Array(6).fill("")));
                    const firstInput = document.getElementById("passcode-input-0");
                    if (firstInput) firstInput.focus();
                  }
                },
                {
                  label: "Request New Code",
                  primary: false,
                  actionType: "CALLBACK",
                  callback: () => {
                    dispatch(setShowPasscodeInput(false));
                    dispatch(setPasscodeSent(false));
                    dispatch(setPasscode(new Array(6).fill("")));
                    handleGeneratePasscode({ preventDefault: () => { } });
                  }
                }
              ]
            }
          })
        );
      }
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (otp.length !== 6 || otp.some((digit) => !digit)) {
        dispatch(setError("Please enter a valid 6-digit OTP"));
        return;
      }

      const verifyPayload = {
        phone_code: values.phone_code,
        mobile_number: values.mobile_number,
        otp: otp.join(""),
        password: values.password,
        sign_in_option: inputType,
      };

      if (showCustomerType === "Y" && values.customerType) {
        verifyPayload.customer_type = values.customerType;
      }

      console.log('🔄 [handleVerifyOtp] Calling verifyOTP thunk');
      const result = await dispatch(verifyOTP(verifyPayload)).unwrap();

      console.log('🔍 [handleVerifyOtp] Thunk result:', result);

      // ✅ Use the same KYC verification handling
      const processedData = await handleKycVerification(result, values);

      // If processedData is null, it means we redirected to Plaid
      if (processedData === null) {
        console.log('🔄 [handleVerifyOtp] Redirected to Plaid, stopping further processing');
        return;
      }

      if (processedData) {
        // Handle owner login
        if (processedData.is_owner_login) {
          console.log('👑 [handleVerifyOtp] Owner login flow');
          return;
        }

        // Successful login
        dispatch(
          setAuthState({
            token: processedData.token,
            customerId: processedData.customer_id,
            isAuthenticated: true,
            user: {
              mobile_number: values.mobile_number,
              phone_code: values.phone_code,
              isRemittanceOnlyCustomer: processedData.isRemittanceOnlyCustomer || false,
              customerType: processedData.customer_type || "individual",
            },
          })
        );

        // Clear OTP state
        dispatch(setOtp(new Array(6).fill("")));
        dispatch(setShowOtpInput(false));
        dispatch(setOtpSent(false));

        // Show success
        dispatch(
          openModal({
            title: "Login Successful",
            message: "Redirecting to your dashboard...",
            type: "success",
            modalProps: { showSpinner: true },
            disableBackdropClick: true,
          })
        );

        // Redirect
        setTimeout(() => {
          dispatch(closeModal());
          handleSuccessfulLoginRedirect(processedData);
        }, 1500);
      }
    } catch (error) {
      console.error("❌ [handleVerifyOtp] Verification failed:", error);
      dispatch(setOtp(new Array(6).fill("")));

      // Only show modal for non-KYC related errors
      if (error.message &&
        !error.message.includes("bank verification") &&
        !error.message.includes("KYC") &&
        !error.message.includes("Plaid")) {
        dispatch(
          openModal({
            title: "Verification Error",
            message: error.message,
            type: "error",
          })
        );
      }
    }
  };

  const handleNavigation = () => {
    console.log('🚀 [Login] handleNavigation triggered');
    console.log('📍 [Login] Current path before navigation:', window.location.pathname);
    console.log('🎯 [Login] Navigating to: /selectaccounttype');

    navigate("/selectaccounttype");

    // Log after navigation attempt
    setTimeout(() => {
      console.log('⏱️ [Login] Post-navigation check - current path:', window.location.pathname);
    }, 100);
  };

  useEffect(() => {
    console.log('🔍 [Login] Auth state changed:', {
      token: auth.token,
      customerId: auth.customerId,
      isAuthenticated: auth.isAuthenticated
    });
  }, [auth.token, auth.customerId, auth.isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-1/2 flex-1 flex flex-col items-center justify-center p-10 md:p-8 lg:p-12">
        <div className="w-full max-w-md bg-white md:p-8">
          <h1 className="text-3xl font-bold mb-8">
            {hostName === "b4b.unlimitedremit.com"
              ? "Sign in to your Business Account"
              : "Sign in to your Account"}
          </h1>

          <div className="mb-6 flex items-center gap-6">
            <div className="relative flex items-center cursor-pointer">
              <input
                type="radio"
                name="sign_in_option"
                value="email"
                onChange={(e) => {
                  if (!loading) {
                    dispatch(setInputType(e.target.value));
                  }
                }}
                checked={inputType === "email"}
                className="absolute opacity-0 w-5 h-5"
                id="email-radio"
              />
              <span
                className={`w-5 h-5 rounded-full border-2 border-gray-600 mr-3 flex-shrink-0 transition-transform ${inputType === "email"
                  ? "bg-blue-500 border-transparent scale-75 shadow-[0_0_20px_rgba(76,139,245,0.5)]"
                  : ""
                  }`}
              ></span>
              <label
                htmlFor="email-radio"
                className="font-semibold text-gray-500 uppercase cursor-pointer transition-colors hover:text-blue-400 text-sm"
              >
                Email
              </label>
            </div>

            <div className="relative flex items-center cursor-pointer">
              <input
                type="radio"
                name="sign_in_option"
                value="mobile"
                onChange={(e) => {
                  if (!loading) {
                    dispatch(setInputType(e.target.value));
                  }
                }}
                checked={inputType === "mobile"}
                className="absolute opacity-0 w-5 h-5"
                disabled={loading}
                id="mobile-radio"
              />
              <span
                className={`w-5 h-5 rounded-full border-2 border-gray-600 mr-3 flex-shrink-0 transition-transform ${inputType === "mobile"
                  ? "bg-blue-500 border-transparent scale-75 shadow-[0_0_20px_rgba(76,139,245,0.5)]"
                  : loading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                  }`}
              ></span>
              <label
                htmlFor="mobile-radio"
                className={`font-semibold uppercase cursor-pointer transition-colors text-sm ${loading
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-500 hover:text-blue-400"
                  }`}
              >
                Mobile Number
              </label>
            </div>
          </div>

          {inputType === "email" ? (
            <div className="relative mb-6">
              <input
                id="email"
                type="email"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-gray-600 peer"
                placeholder=" "
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.email}
                name="email"
                autoComplete="off"
                disabled={loading}
              />
              <label
                htmlFor="email"
                className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 left-3 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:bg-white peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2"
              >
                Email
              </label>
              {errors.email && touched.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
            </div>
          ) : (
            <div className="relative mb-6">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                {isCountriesLoading === "Y" && (
                  <div className="flex justify-center items-center h-full">
                    <RingLoader size={24} color="#36d7b7" />
                  </div>
                )}
                {isCountriesLoading === "N" && (
                  <div className="relative w-full">
                    <Select
                      key={`country-select-${inputType}`}
                      options={countryOptions}
                      value={currentCountryOption}
                      onChange={(option) => {
                        dispatch(
                          setSelectedCountry({
                            country: option.countryName,
                            countryCode: option.value,
                            flagUrl: option.flagUrl,
                          })
                        );
                        setFieldValue("phone_code", option.value);
                      }}
                      placeholder="Select country"
                      isSearchable
                      classNamePrefix="react-select"
                      isLoading={isCountriesLoading === "Y"}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minHeight: "48px",
                          borderColor:
                            errors.phone_code && touched.phone_code
                              ? "#f87171"
                              : "#d1d5db",
                          "&:hover": {
                            borderColor:
                              errors.phone_code && touched.phone_code
                                ? "#f87171"
                                : "#9ca3af",
                          },
                        }),
                        option: (provided) => ({
                          ...provided,
                          padding: "10px",
                          display: "flex",
                          alignItems: "center",
                        }),
                      }}
                      formatOptionLabel={(option) => (
                        <div className="flex items-center">
                          {option.flagUrl && (
                            <img
                              src={option.flagUrl}
                              alt={option.label}
                              className="w-5 h-4 object-cover mr-2"
                            />
                          )}
                          <span>{option.label}</span>
                        </div>
                      )}
                    />
                    {errors.phone_code && touched.phone_code && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.phone_code}
                      </p>
                    )}
                  </div>
                )}

                <div className="w-full">
                  <input
                    id="mobile_number"
                    type="number"
                    className="block px-4 py-3 w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 peer"
                    placeholder=" "
                    onChange={(e) =>
                      setFieldValue("mobile_number", e.target.value)
                    }
                    value={values.mobile_number}
                    name="mobile_number"
                    disabled={loading}
                  />
                  <label
                    htmlFor="mobile_number"
                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 left-2 z-10 origin-[0] bg-white px-2"
                  >
                    Phone Number
                  </label>
                  {errors.mobile_number && touched.mobile_number && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.mobile_number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="relative mb-6">
            <input
              id="password"
              type={passwordVisible ? "text" : "password"}
              className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-gray-600 peer"
              placeholder=" "
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.password}
              name="password"
              autoComplete="current-password"
              disabled={loading}
            />
            <label
              htmlFor="password"
              className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 left-3 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:bg-white peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => dispatch(togglePasswordVisibility())}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={passwordVisible ? faEyeSlash : faEye} />
            </button>
            {errors.password && touched.password && (
              <p className="text-red-500 text-xs">{errors.password}</p>
            )}
          </div>

          {showCustomerType === "Y" && (
            <div className="relative mb-6">
              <label
                htmlFor="customerType"
                className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 left-3 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:bg-white peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2"
              >
                Customer Type
              </label>
              <select
                id="customerType"
                name="customerType"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-gray-600 peer"
                placeholder=" "
                onChange={(e) => {
                  setFieldValue("customerType", e.target.value);
                }}
                onBlur={handleBlur}
                value={values.customerType}
              >
                <option value="">--Select Customer Type--</option>
                <option value="individual">Individual</option>
                <option value="institution">Institution</option>
              </select>
              {errors.customerType && touched.customerType && (
                <p className="text-red-500 text-xs">{errors.customerType}</p>
              )}
            </div>
          )}

          {inputType === "email" ? (
            <button
              type="button"
              onClick={handleGeneratePasscode}
              className="w-full bg-green-600 text-white py-2 mb-1 rounded-lg hover:bg-green-700 focus:outline-none flex items-center justify-center gap-2"
              disabled={isGeneratingPasscode || loading}
            >
              {isGeneratingPasscode ? (
                <>
                  <RingLoader size={20} color="#ffffff" />
                  <span>Requesting Passcode...</span>
                </>
              ) : (
                "Request Passcode"
              )}
            </button>
          ) : (
            !showOtpInput && (
              <button
                type="button"
                onClick={handleGenerateOTP}
                className="w-full bg-green-600 text-white py-2 mb-1 rounded-lg hover:bg-green-700 focus:outline-none flex items-center justify-center gap-2"
                disabled={isGeneratingOtp || loading}
              >
                {isGeneratingOtp ? (
                  <>
                    <RingLoader size={20} color="#ffffff" />
                    <span>Requesting OTP...</span>
                  </>
                ) : (
                  "Request OTP"
                )}
              </button>
            )
          )}

          <div className="flex justify-between items-center my-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => dispatch(setRememberMe(!rememberMe))}
                className="mr-2"
              />
              Remember Me
            </label>
            <button
              onClick={() => navigate("/forgotpassword")}
              type="button"
              className="text-sm text-red-600 hover:underline"
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={handleNavigation}
                disabled={loading}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign Up
              </button>
            </p>
          </div>

          <button
            onClick={handleManualDownload}
            disabled={downloadStatus === "loading"}
            className="mt-4 w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2 min-h-[44px]"
            type="button"
          >
            {downloadStatus === "loading" ? (
              <>
                <RingLoader size={20} color="#ffffff" />
                <span className="ml-2">Downloading...</span>
              </>
            ) : (
              <>
                <MdDownload className="w-5 h-5" />
                <span>Download Manual</span>
              </>
            )}
          </button>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => dispatch(closeModal())}
        title={modal.title}
        type={modal.type}
        message={modal.message}
        modalProps={modal.modalProps}
      />

      {showOtpInput && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative">
            <button
              onClick={() => {
                dispatch(setShowOtpInput(false));
                dispatch(setOtp(new Array(6).fill("")));
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              disabled={isVerifyingOtp}
            >
              <AiOutlineClose size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">Enter OTP</h2>
            <p className="text-gray-600 mb-6">
              Please enter the OTP sent to your mobile number
            </p>

            <div className="flex justify-center gap-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={digit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 1);
                    const newOtp = [...otp];
                    newOtp[index] = value;
                    dispatch(setOtp(newOtp));

                    if (value && index < otp.length - 1) {
                      setTimeout(() => {
                        document
                          .getElementById(`otp-input-${index + 1}`)
                          .focus();
                      }, 10);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                      document.getElementById(`otp-input-${index - 1}`).focus();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasteData = e.clipboardData
                      .getData("text/plain")
                      .replace(/\D/g, "")
                      .slice(0, 6);
                    if (pasteData.length === 6) {
                      const newOtp = pasteData.split("");
                      dispatch(setOtp(newOtp));
                      document.getElementById(`otp-input-5`)?.focus();
                    }
                  }}
                  className="w-12 h-12 text-center text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={1}
                  autoFocus={index === 0}
                  disabled={isVerifyingOtp}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2"
              disabled={isVerifyingOtp || otp.join("").length !== 6}
            >
              {isVerifyingOtp ? (
                <>
                  <RingLoader size={20} color="#ffffff" />
                  <span>Verifying...</span>
                </>
              ) : (
                "Verify & Continue"
              )}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleGenerateOTP}
                className="text-blue-600 hover:text-blue-800"
                disabled={isGeneratingOtp || isVerifyingOtp}
              >
                {isGeneratingOtp
                  ? "Sending..."
                  : "Didn't receive code? Resend OTP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasscodeInput && passcodeSent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              onClick={() => {
                dispatch(setShowPasscodeInput(false));
                dispatch(setPasscode(new Array(6).fill("")));
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <AiOutlineClose size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Enter Verification Code
              </h2>
              <p className="text-gray-600">
                We've sent a 6-digit code to your email
              </p>
            </div>

            {auth.error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
                {auth.error}
              </div>
            )}

            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  id={`passcode-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={passcode[index] || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 1);
                    const newPasscode = [...passcode];
                    newPasscode[index] = value;
                    dispatch(setPasscode(newPasscode));

                    if (value && index < 5) {
                      setTimeout(() => {
                        document
                          .getElementById(`passcode-input-${index + 1}`)
                          ?.focus();
                      }, 10);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Backspace" &&
                      !passcode[index] &&
                      index > 0
                    ) {
                      document
                        .getElementById(`passcode-input-${index - 1}`)
                        ?.focus();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasteData = e.clipboardData
                      .getData("text/plain")
                      .replace(/\D/g, "")
                      .slice(0, 6);
                    if (pasteData.length === 6) {
                      const newPasscode = pasteData.split("");
                      dispatch(setPasscode(newPasscode));

                      setTimeout(() => {
                        document.getElementById(`passcode-input-5`)?.focus();
                      }, 10);
                    }
                  }}
                  className="w-14 h-14 text-center text-2xl font-medium border-2 border-gray-200 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-150"
                  maxLength={1}
                  autoFocus={index === 0}
                  disabled={isVerifyingPasscode}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleVerifyPasscode}
              className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-700 
  disabled:opacity-70 transition-colors flex items-center justify-center gap-3"
              disabled={isVerifyingPasscode || passcode.join("").length !== 6}
            >
              {isVerifyingPasscode ? (
                <>
                  <RingLoader size={20} color="#ffffff" />
                  <span>Verifying...</span>
                </>
              ) : (
                "Verify"
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm mb-2">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleGeneratePasscode}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center gap-2 mx-auto"
                disabled={isGeneratingPasscode}
              >
                {isGeneratingPasscode ? (
                  <>
                    <RingLoader size={16} color="#3b82f6" />
                    <span>Resending...</span>
                  </>
                ) : (
                  "Resend Verification Code"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;