// src/features/Auth/Login/Login.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { motion } from "framer-motion";
import * as Yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { AiOutlineClose } from "react-icons/ai";
import { MdDownload } from "react-icons/md";
import Select from "react-select";
import { RingLoader } from "react-spinners";
import { ArrowRight, UserPlus } from "lucide-react";

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
  selectIsRedirecting,
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
  setRedirecting,
} from "../../Auth/slices/authSlice";

// Other selectors
import {
  selectCountries,
  selectSelectedCountry,
  selectCountriesLoading,
} from "../../Auth/slices/countrySlice";

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

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ Double submission prevention
  const isSubmittingRef = useRef(false);
  const kycHandlingRef = useRef(false);

  // State for iframe management
  const [showPlaidIframe, setShowPlaidIframe] = useState(false);
  const [plaidUrl, setPlaidUrl] = useState("");
  const [showPlaidModal, setShowPlaidModal] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const iframeRef = useRef(null);

  // State for country selection
  const [selectedPhoneCode, setSelectedPhoneCode] = useState(null);

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
  const isRedirecting = useSelector(selectIsRedirecting);

  // Proper loading state handling
  const isLoading = auth.loading?.general || false;
  const isSubmitting = auth.isSubmitting || false;

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

  // ✅ Validation schema - defined before formik
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
    selected_country_id: Yup.string().when("inputType", {
      is: "mobile",
      then: (schema) => schema.required("Please select a country"),
    }),
    customerType: Yup.string().when([], {
      is: () => showCustomerType === "Y",
      then: (schema) => schema.required("Customer type is required"),
    }),
  });

  // ✅ Single initialization effect
  useEffect(() => {
    dispatch(initializeApp());
  }, [dispatch]);

  // ✅ Reset stuck loading state
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      if (isLoading && !isSubmittingRef.current) {
        dispatch(setLoading(false));
      }
    }, 15000);

    return () => clearTimeout(loadingTimer);
  }, [isLoading, dispatch]);

  // ✅ KYC callback handler with duplicate prevention
  useEffect(() => {
    const handleKycCallback = () => {
      if (kycHandlingRef.current) {
        return;
      }

      kycHandlingRef.current = true;

      const urlParams = new URLSearchParams(window.location.search);
      const kycStatus = urlParams.get("status");
      const kycMessage = urlParams.get("message");
      const customerId = urlParams.get("customer_id");
      const plaidStatus = urlParams.get("plaid_status");
      const plaidError = urlParams.get("plaid_error");

      // Only process if we have relevant parameters
      const hasKycParams = kycStatus || plaidStatus || plaidError;
      if (!hasKycParams) {
        kycHandlingRef.current = false;
        return;
      }

      // Handle successful KYC
      if (kycStatus === "success" || plaidStatus === "success") {
        // Try to restore auth from temp storage
        const tempAuth = sessionStorage.getItem("temp_auth_data");
        const pendingAuth = sessionStorage.getItem("pending_kyc_auth");

        let authData = null;

        if (tempAuth) {
          try {
            authData = JSON.parse(tempAuth);
          } catch (e) {
            console.error("Failed to parse temp auth data");
          }
        }

        if (!authData && pendingAuth) {
          try {
            authData = JSON.parse(pendingAuth);
          } catch (e) {
            console.error("Failed to parse pending auth data");
          }
        }

        // Clear the URL parameters
        window.history.replaceState({}, "", window.location.pathname);

        dispatch(
          openModal({
            title: "Verification Successful! 🎉",
            message:
              kycMessage ||
              "Your bank verification has been completed successfully.",
            type: "success",
            modalProps: {
              showCloseButton: true,
              onClose: () => {
                const redirectCustomerId = customerId || authData?.customer_id;
                if (redirectCustomerId && !isRedirecting) {
                  dispatch(setRedirecting(true));
                  sessionStorage.removeItem("temp_auth_data");
                  sessionStorage.removeItem("pending_kyc_auth");
                  navigate(`/home/${redirectCustomerId}`);
                } else {
                  navigate("/");
                }
                kycHandlingRef.current = false;
              },
            },
          })
        );
      }

      // Handle failed KYC
      else if (
        kycStatus === "failed" ||
        plaidStatus === "error" ||
        plaidError
      ) {
        dispatch(
          openModal({
            title: "Verification Failed",
            message:
              kycMessage ||
              plaidError ||
              "We were unable to complete your bank verification. Please try again.",
            type: "error",
            modalProps: {
              showCloseButton: true,
              onClose: () => {
                window.history.replaceState({}, "", window.location.pathname);
                sessionStorage.removeItem("temp_auth_data");
                sessionStorage.removeItem("pending_kyc_auth");
                kycHandlingRef.current = false;
              },
            },
          })
        );
      } else {
        kycHandlingRef.current = false;
      }
    };

    handleKycCallback();
  }, [dispatch, navigate, isRedirecting]);

  // ✅ Owner login redirect
  useEffect(() => {
    if (is_owner_login && owner_id && !isRedirecting) {
      dispatch(setRedirecting(true));
      navigate(`/signupowner/${owner_id}`);
    }
  }, [is_owner_login, owner_id, navigate, isRedirecting, dispatch]);

  // ✅ Download status handler
  useEffect(() => {
    if (downloadStatus === "succeeded" && lastDownloadUrl) {
      window.open(lastDownloadUrl, "_blank");
    }
  }, [downloadStatus, lastDownloadUrl]);

  // ✅ Auth state change handler with redirect prevention
  useEffect(() => {
    const shouldRedirect =
      auth.isAuthenticated && auth.customerId && auth.token && !isRedirecting;

    if (shouldRedirect) {
      dispatch(setRedirecting(true));
      handleSuccessfulLoginRedirect({
        customer_id: auth.customerId,
        isRemittanceOnlyCustomer: auth.user?.isRemittanceOnlyCustomer || false,
      });
    }
  }, [
    auth.isAuthenticated,
    auth.customerId,
    auth.token,
    auth.user,
    isRedirecting,
    dispatch,
  ]);

  // ========== HANDLER FUNCTIONS ==========

  const handleSuccessfulLoginRedirect = (processedData) => {
    const shouldRedirectToHomeRemit =
      processedData.isRemittanceOnlyCustomer === "Y" ||
      processedData.isRemittanceOnlyCustomer === true;

    const redirectPath = shouldRedirectToHomeRemit
      ? `/homeremit/${processedData.customer_id}`
      : `/home/${processedData.customer_id}`;

    navigate(redirectPath, { replace: true });
  };

  // ✅ KYC verification handler
  const handleKycVerification = async (response, values) => {
    // Check for owner login first with proper validation
    if (response.is_owner_login === true || response.is_owner_login === "1") {
      return response;
    }

    if (response.requiresPlaidRedirect && response.plaidUrl) {
      // Store data
      const pendingAuth = {
        email: values.email,
        customer_id: response.customer_id,
        timestamp: Date.now(),
        plaidUrl: response.plaidUrl,
      };
      sessionStorage.setItem("pending_kyc_auth", JSON.stringify(pendingAuth));

      // Show modal with Plaid options
      setPlaidUrl(response.plaidUrl);
      setShowPlaidModal(true);

      return null;
    }

    // Handle successful login
    if (response.token && response.customer_id) {
      return response;
    }

    throw new Error("Unexpected login response");
  };

  // Open Plaid in new window
  const openPlaidInNewWindow = () => {
    const plaidWindow = window.open(
      plaidUrl,
      "plaid_verification",
      "width=800,height=700,scrollbars=yes,resizable=yes,top=100,left=100"
    );

    if (plaidWindow) {
      // Set up monitoring for the Plaid window
      monitorPlaidWindow(plaidWindow);
      setShowPlaidModal(false);

      dispatch(
        openModal({
          title: "Bank Verification Started",
          message:
            "A new window has opened for bank verification. Please complete the verification process there. You can return to this page after completion.",
          type: "info",
          modalProps: {
            showCloseButton: true,
          },
        })
      );
    } else {
      // Popup blocked - show alternative options
      dispatch(
        openModal({
          title: "Popup Blocked",
          message:
            "Please allow popups for this site, or use the manual link below.",
          type: "warning",
          modalProps: {
            actions: [
              {
                label: "Copy Verification Link",
                primary: true,
                actionType: "CALLBACK",
                callback: () => {
                  navigator.clipboard.writeText(plaidUrl);
                  dispatch(
                    openModal({
                      title: "Link Copied",
                      message:
                        "Verification link copied to clipboard. Please paste it in a new browser tab.",
                      type: "success",
                    })
                  );
                },
              },
              {
                label: "Open Link Now",
                primary: false,
                actionType: "CALLBACK",
                callback: () => {
                  window.open(plaidUrl, "_blank");
                  setShowPlaidModal(false);
                },
              },
            ],
          },
        })
      );
    }
  };

  // Monitor Plaid window for completion
  const monitorPlaidWindow = (plaidWindow) => {
    let checkCount = 0;
    const maxChecks = 300;

    const checkWindow = setInterval(() => {
      checkCount++;

      if (plaidWindow.closed) {
        clearInterval(checkWindow);

        // Show completion message
        setTimeout(() => {
          dispatch(
            openModal({
              title: "Verification Completed",
              message:
                "Thank you for completing bank verification. You can now try logging in again.",
              type: "success",
              modalProps: {
                showCloseButton: true,
                onClose: () => {
                  dispatch(setPasscode(new Array(6).fill("")));
                  dispatch(setShowPasscodeInput(false));
                  dispatch(setPasscodeSent(false));
                },
              },
            })
          );
        }, 1000);
      } else if (checkCount >= maxChecks) {
        // Timeout after 5 minutes
        clearInterval(checkWindow);
      }
    }, 1000);
  };

  // Open Plaid in same tab
  const openPlaidInSameTab = () => {
    window.location.href = plaidUrl;
  };

  // Close Plaid modal
  const closePlaidModal = () => {
    setShowPlaidModal(false);
    setPlaidUrl("");
  };

  // ✅ Memoize country options - defined after formik will be but before it's used
  // We'll define these after formik is initialized

  // ✅ Formik setup with double-submission prevention
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      phone_code: "",
      selected_country_id: "",
      mobile_number: "",
      inputType: "email",
      customerType: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      // ✅ PREVENT DOUBLE SUBMISSION
      if (isSubmittingRef.current) {
        return;
      }

      isSubmittingRef.current = true;

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

        const processedData = await handleKycVerification(response, values);

        if (processedData) {
          if (processedData.is_owner_login === "1") {
            dispatch(
              setOwnerDetails({
                is_owner_login: true,
                owner_id: processedData.owner_id,
                owner_role_name: processedData.owner_role_name,
              })
            );
            dispatch(setRedirecting(true));
            navigate(`/signupowner/${processedData.owner_id}`);
            return;
          }

          if (processedData.bank_approve_status !== "1") {
            throw new Error(
              "Bank account not approved. Please contact support."
            );
          }

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
            dispatch(setRedirecting(true));
            handleSuccessfulLoginRedirect(processedData);
          }, 1500);
        }
      } catch (error) {
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
      } finally {
        // ✅ RESET SUBMISSION FLAG
        isSubmittingRef.current = false;
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

  // ✅ Memoize country options - AFTER formik is defined
  const countryOptions = useMemo(() => {
    return Array.isArray(countries)
      ? countries.map((country) => ({
          value: country.id,
          label: `${country.name} (${country.phone_code})`,
          countryName: country.name,
          phone_code: country.phone_code,
          flagUrl: country.flag_url,
        }))
      : [];
  }, [countries]);

  // ✅ Find current country option - AFTER formik is defined
  const currentCountryOption = useMemo(() => {
    if (!values.selected_country_id) {
      return null;
    }
    
    return countryOptions.find(
      (option) => option.value === values.selected_country_id
    ) || null;
  }, [countryOptions, values.selected_country_id]);

  // ✅ Country select handler - defined after setFieldValue is available
  const handleCountrySelect = (selectedOption) => {
    if (!selectedOption) return;
    
    setFieldValue("selected_country_id", selectedOption.value);
    setFieldValue("phone_code", selectedOption.phone_code);
    
    dispatch(
      setSelectedCountry({
        country: selectedOption.countryName,
        countryCode: selectedOption.phone_code,
        flagUrl: selectedOption.flagUrl,
      })
    );
  };

  // Handler functions
  const handleGeneratePasscode = async (e) => {
    e.preventDefault();

    if (isGeneratingPasscode) {
      return;
    }

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

      const payload = {
        email: values.email,
        password: values.password,
      };

      if (showCustomerType === "Y" && values.customerType) {
        payload.customer_type = values.customerType;
      }

      const result = await dispatch(generatePasscode(payload)).unwrap();

      if (result.status === "multiple_accounts") {
        dispatch(setShowPasscodeInput(false));
        dispatch(setPasscodeSent(false));
        dispatch(setPasscode([]));
        return;
      }

      dispatch(setShowPasscodeInput(true));
      dispatch(setPasscodeSent(true));
      dispatch(setPasscode(new Array(6).fill("")));

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
      console.log("🔍 Passcode Generation Error:", error);

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

      dispatch(
        openModal({
          title: "Error",
          message: error,
          type: "error",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGenerateOTP = async () => {
    if (isGeneratingOtp) {
      return;
    }

    try {
      if (!values.phone_code || !values.mobile_number || !values.password) {
        dispatch(
          openModal({
            title: "Error",
            message: "Please enter country code, mobile number, AND password",
            type: "error",
          })
        );
        return;
      }

      const payload = {
        phone_code: values.phone_code,
        mobile_number: values.mobile_number,
        password: values.password,
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
      if (error.requiresCustomerType) {
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
    const value = e.target.value.replace(/\D/g, "").slice(0, 1);
    const newPasscode = [...passcode];
    newPasscode[index] = value;
    dispatch(setPasscode(newPasscode));

    if (value && index < passcode.length - 1) {
      setTimeout(() => {
        const nextInput = document.getElementById(
          `passcode-input-${index + 1}`
        );
        if (nextInput) nextInput.focus();
      }, 10);
    }
  };

  const handlePasscodeKeyDown = (e, index) => {
    if (e.key === "Backspace" && !passcode[index] && index > 0) {
      const prevInput = document.getElementById(`passcode-input-${index - 1}`);
      if (prevInput) {
        setTimeout(() => prevInput.focus(), 10);
      }
    }

    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
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

  const handleVerifyPasscode = async () => {
    if (isVerifyingPasscode) {
      return;
    }

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
      if (!values.email) {
        throw new Error("Email is required for verification");
      }

      const verifyPayload = {
        email: values.email.trim().toLowerCase(),
        passcode: passcode,
        password: values.password,
        sign_in_option: inputType,
        context: "login_verification",
      };

      if (showCustomerType === "Y" && values.customerType) {
        verifyPayload.customer_type = values.customerType;
      }

      const result = await dispatch(verifyPasscode(verifyPayload)).unwrap();

      if (result.is_owner_login === true || result.is_owner_login === "1") {
        dispatch(setShowPasscodeInput(false));
        dispatch(setPasscodeSent(false));
        dispatch(setPasscode(new Array(6).fill("")));

        dispatch(
          setOwnerDetails({
            is_owner_login: true,
            owner_id: result.owner_id,
            owner_role_name: result.owner_role_name,
          })
        );
        dispatch(setRedirecting(true));
        navigate(`/signupowner/${result.owner_id}`);
        return;
      }

      if (result.requiresPlaidRedirect) {
        dispatch(setShowPasscodeInput(false));
        dispatch(setPasscodeSent(false));
        dispatch(setPasscode(new Array(6).fill("")));

        const processedData = await handleKycVerification(result, values);
        return;
      }

      const processedData = await handleKycVerification(result, values);

      if (processedData === null) {
        return;
      }

      if (processedData && processedData.token && processedData.customer_id) {
        const customerId = processedData.customer_id;

        await new Promise((resolve) => setTimeout(resolve, 100));

        dispatch(
          setAuthState({
            token: processedData.token,
            customerId: customerId,
            user: {
              email: values.email,
              isRemittanceOnlyCustomer:
                processedData.isRemittanceOnlyCustomer || false,
              customerType: processedData.customer_type || "individual",
            },
          })
        );

        dispatch(setPasscode(new Array(6).fill("")));
        dispatch(setShowPasscodeInput(false));
        dispatch(setPasscodeSent(false));

        dispatch(
          openModal({
            title: "Login Successful",
            message: "You're being redirected to your dashboard...",
            type: "success",
            modalProps: {
              showSpinner: true,
              autoClose: true,
              autoCloseDelay: 1500,
            },
            disableBackdropClick: true,
            disableEscapeKey: true,
          })
        );

        setTimeout(() => {
          dispatch(closeModal());
          dispatch(setRedirecting(true));
          handleSuccessfulLoginRedirect({
            customer_id: customerId,
            isRemittanceOnlyCustomer: processedData.isRemittanceOnlyCustomer,
          });
        }, 1500);
      } else {
        throw new Error("Login successful but missing required information");
      }
    } catch (error) {
      const firstInput = document.getElementById("passcode-input-0");
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }

      dispatch(setPasscode(new Array(6).fill("")));

      let displayMessage =
        error.message || "Verification failed. Please try again.";

      if (
        error.message &&
        !error.message.includes("KYC") &&
        !error.message.includes("bank verification") &&
        !error.message.includes("Plaid")
      ) {
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
                    dispatch(setPasscode(new Array(6).fill("")));
                    const firstInput =
                      document.getElementById("passcode-input-0");
                    if (firstInput) firstInput.focus();
                  },
                },
                {
                  label: "Request New Code",
                  primary: false,
                  actionType: "CALLBACK",
                  callback: () => {
                    dispatch(setShowPasscodeInput(false));
                    dispatch(setPasscodeSent(false));
                    dispatch(setPasscode(new Array(6).fill("")));
                    handleGeneratePasscode({ preventDefault: () => {} });
                  },
                },
              ],
            },
          })
        );
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (isVerifyingOtp) {
      return;
    }

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

      const result = await dispatch(verifyOTP(verifyPayload)).unwrap();

      if (result.requiresPlaidRedirect) {
        dispatch(setShowOtpInput(false));
        dispatch(setOtpSent(false));
        dispatch(setOtp(new Array(6).fill("")));

        const processedData = await handleKycVerification(result, values);
        return;
      }

      const processedData = await handleKycVerification(result, values);

      if (processedData === null) {
        return;
      }

      if (processedData) {
        if (processedData.is_owner_login) {
          return;
        }

        dispatch(
          setAuthState({
            token: processedData.token,
            customerId: processedData.customer_id,
            isAuthenticated: true,
            user: {
              mobile_number: values.mobile_number,
              phone_code: values.phone_code,
              isRemittanceOnlyCustomer:
                processedData.isRemittanceOnlyCustomer || false,
              customerType: processedData.customer_type || "individual",
            },
          })
        );

        dispatch(setOtp(new Array(6).fill("")));
        dispatch(setShowOtpInput(false));
        dispatch(setOtpSent(false));

        dispatch(
          openModal({
            title: "Login Successful",
            message: "Redirecting to your dashboard...",
            type: "success",
            modalProps: { showSpinner: true },
            disableBackdropClick: true,
          })
        );

        setTimeout(() => {
          dispatch(closeModal());
          dispatch(setRedirecting(true));
          handleSuccessfulLoginRedirect(processedData);
        }, 1500);
      }
    } catch (error) {
      dispatch(setOtp(new Array(6).fill("")));

      if (
        error.message &&
        !error.message.includes("bank verification") &&
        !error.message.includes("KYC") &&
        !error.message.includes("Plaid")
      ) {
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
    navigate("/selectaccounttype");
  };

  // Render the login form
  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* LEFT SIDE - MAIN LOGIN FORM */}
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
                  dispatch(setInputType(e.target.value));
                }}
                checked={inputType === "email"}
                className="absolute opacity-0 w-5 h-5"
                id="email-radio"
              />
              <span
                className={`w-5 h-5 rounded-full border-2 border-gray-600 mr-3 flex-shrink-0 transition-transform ${
                  inputType === "email"
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
                  dispatch(setInputType(e.target.value));
                }}
                checked={inputType === "mobile"}
                className="absolute opacity-0 w-5 h-5"
                id="mobile-radio"
              />
              <span
                className={`w-5 h-5 rounded-full border-2 border-gray-600 mr-3 flex-shrink-0 transition-transform ${
                  inputType === "mobile"
                    ? "bg-blue-500 border-transparent scale-75 shadow-[0_0_20px_rgba(76,139,245,0.5)]"
                    : ""
                }`}
              ></span>
              <label
                htmlFor="mobile-radio"
                className="font-semibold uppercase cursor-pointer transition-colors text-sm text-gray-500 hover:text-blue-400"
              >
                Mobile Number
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
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
                  <div className="relative w-full">
                    <Select
                      options={countryOptions}
                      value={currentCountryOption}
                      onChange={handleCountrySelect}
                      placeholder="Select country"
                      isSearchable
                      classNamePrefix="react-select"
                      isLoading={countriesLoading}
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
                disabled={isGeneratingPasscode}
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
                  disabled={isGeneratingOtp}
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
              >
                Forgot Password?
              </button>
            </div>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 flex justify-center"
          >
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNavigation}
              className="relative w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 transition-all bg-white overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100"
                initial={{ x: "-100%" }}
                whileHover={{
                  x: "100%",
                  transition: { duration: 0.8, ease: "easeInOut" },
                }}
              />

              <div className="absolute inset-0 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-blue-400 rounded-full"
                    initial={{
                      x: "-20px",
                      y: Math.random() * 40,
                      opacity: 0,
                      scale: 0,
                    }}
                    whileHover={{
                      x: "calc(100% + 20px)",
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      transition: {
                        duration: 0.6,
                        delay: i * 0.1,
                        times: [0, 0.5, 1],
                      },
                    }}
                  />
                ))}
              </div>

              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-transparent"
                whileHover={{
                  borderColor: "rgba(59, 130, 246, 0.3)",
                  scale: 1.02,
                  transition: {
                    duration: 0.3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 0.5,
                  },
                }}
              />

              <div className="relative z-10 flex items-center justify-center space-x-2">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <UserPlus className="w-5 h-5" />
                </motion.div>
                <span className="text-sm font-medium">Sign Up</span>
                <motion.div
                  initial={{ x: -5, opacity: 0 }}
                  whileHover={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </div>
            </motion.button>
          </motion.div>

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

      {/* ========== MODAL COMPONENT ========== */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => dispatch(closeModal())}
        title={modal.title}
        type={modal.type}
        message={modal.message}
        modalProps={modal.modalProps}
      />

      {/* ========== PLAID IFRAME MODAL ========== */}
      {showPlaidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                KYC Verification Required
              </h2>
              <button
                onClick={closePlaidModal}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2"
              >
                <AiOutlineClose size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon
                    icon={faExternalLinkAlt}
                    className="text-blue-600 text-2xl"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Secure KYC Verification
                </h3>
                <p className="text-gray-600 mb-4">
                  You need to complete kyc verification to access your account.
                  This is a secure process powered by Plaid.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={openPlaidInNewWindow}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  <span>Open in New Window (Recommended)</span>
                </button>

                <button
                  onClick={openPlaidInSameTab}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-3"
                >
                  <span>Open in This Tab</span>
                </button>

                <div className="text-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(plaidUrl);
                      dispatch(
                        openModal({
                          title: "Link Copied",
                          message: "Verification link copied to clipboard.",
                          type: "success",
                          modalProps: {
                            autoClose: true,
                            autoCloseDelay: 2000,
                          },
                        })
                      );
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Copy verification link instead
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-500 text-center">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========== OTP MODAL ========== */}
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

      {/* ========== PASSCODE MODAL ========== */}
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