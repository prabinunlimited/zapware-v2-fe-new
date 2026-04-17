import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RingLoader } from "react-spinners";
import BaseBeneficiaryForm from "./BaseBeneficiaryForm";

// Import your verification popup
import BenefVerificationPopup from "../../../components/PopupModal/BenefVerificationPopup";

// Import redux actions
import {
  selectNationalities,
  selectBanks,
  selectIdTypes,
  selectCities,
  selectBankBranches,
  selectDropdownLoading,
  selectCreateLoading,
  selectCreateError,
  selectCreateSuccess,
  fetchNationalities,
  fetchBanksByCurrency,
  fetchIdTypesByCurrency,
  fetchCitiesByCountry,
  fetchBankBranches,
  clearCreateError,
  clearCreateSuccess,
  resetCreateState,
  createBeneficiaryRequestRemit,
  sendBeneficiaryRegistrationPasscode,
  validateBeneficiaryRegistrationPasscode,
  sendBeneficiaryRegistrationOTP,
  validateBeneficiaryRegistrationOTP,
} from "../AddBeneficiary/addBeneficiarySlice";

import {
  selectCountriesOptionsSafe,
  selectCountries,
  selectPhoneCodeOptions,
  fetchCountries,
} from "../../../features/Auth/slices/countrySlice";

const PublicBeneficiaryForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMounted = useRef(true);

  // ========== REDUX SELECTORS ==========
  const nationalities = useSelector(selectNationalities);
  const banks = useSelector(selectBanks);
  const idTypes = useSelector(selectIdTypes);
  const cities = useSelector(selectCities);
  const bankBranches = useSelector(selectBankBranches);
  const dropdownLoading = useSelector(selectDropdownLoading);

  const createLoading = useSelector(selectCreateLoading);
  const createError = useSelector(selectCreateError);
  const createSuccess = useSelector(selectCreateSuccess);

  const countriesOptions = useSelector(selectCountriesOptionsSafe);
  const countries = useSelector(selectCountries);
  const phoneCodeOptions = useSelector(selectPhoneCodeOptions);

  // ========== NEW STATE FROM REFERENCE CODE ==========
  // Password states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [emailVerificationLoading, setEmailVerificationLoading] =
    useState(false);
  const [phoneVerificationLoading, setPhoneVerificationLoading] =
    useState(false);
  const [resendEmailLoading, setResendEmailLoading] = useState(false);
  const [resendPhoneLoading, setResendPhoneLoading] = useState(false);

  // Verification codes
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  // Partner ID
  const [whiteLabelledPartnerId, setWhiteLabelledPartnerId] = useState(
    localStorage.getItem("whitelabelledpartnerid") || "0"
  );
  const whiteLabelledPartnerIdRef = useRef("");
  const [pageTitle, setPageTitle] = useState("Register Beneficiary");

  const lastEmailSent = useRef("");
  const lastPhoneDataSent = useRef({ countryCode: "", phoneNumber: "" });

  // ========== GLOBAL LOADING STATE ==========
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  // ========== EFFECTS ==========
  useEffect(() => {
    return () => {
      isMounted.current = false;
      dispatch(resetCreateState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (createError && isMounted.current) {
      toast.error(createError);
      dispatch(clearCreateError());
    }
  }, [createError, dispatch]);

  // Initialize partner ID
  useEffect(() => {
    const partnerId = localStorage.getItem("whitelabelledpartnerid");
    const bearertoken = localStorage.getItem("bearertoken");

    console.log("🔍 Initializing PublicBeneficiaryForm:");
    console.log("🔍 Partner ID from localStorage:", partnerId);
    console.log(
      "🔍 Bearer token from localStorage:",
      bearertoken ? "Exists" : "Missing"
    );

    if (
      partnerId &&
      partnerId !== "undefined" &&
      partnerId.trim() !== "" &&
      partnerId !== "0"
    ) {
      setWhiteLabelledPartnerId(partnerId);
      whiteLabelledPartnerIdRef.current = partnerId;
    }

    // Check if we have a bearer token
    if (!bearertoken) {
      console.error("❌ CRITICAL: No bearer token found in localStorage!");
      toast.error("Authentication token missing. Please login again.");
      // You could redirect to login page here if needed
      // navigate("/");
    }
  }, []);

  // ========== PASSWORD VALIDATION ==========
  const validatePassword = (password) => {
    const errors = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
    setPasswordErrors(errors);
    return Object.values(errors).every(Boolean);
  };

  // ========== SIMPLIFIED VERIFICATION HANDLERS ==========
  const handleSendEmailPasscode = async (email) => {
    console.log("📧 Sending email passcode for:", email);

    if (!email) {
      toast.error("Please enter email first");
      return;
    }

    lastEmailSent.current = email;
    setResendEmailLoading(true);

    try {
      // Get current partner ID
      const currentPartnerId = whiteLabelledPartnerIdRef.current || "0";
      console.log("📧 Using partner ID:", currentPartnerId);

      // Check if we have a bearer token
      const bearertoken = localStorage.getItem("bearertoken");
      if (!bearertoken) {
        throw new Error(
          "Authentication token missing. Please refresh the page."
        );
      }

      console.log("📧 Bearer token ready, dispatching...");

      // Dispatch the Redux action
      await dispatch(
        sendBeneficiaryRegistrationPasscode({
          email: email,
          partner_id: currentPartnerId,
        })
      ).unwrap();

      // Show popup only after successful API call
      setShowEmailPopup(true);
      setEmailCode(""); // Clear any previous code
      toast.success("Passcode sent to your email!");
    } catch (error) {
      console.error("❌ Error sending email passcode:", error);

      // Handle 302 redirect specifically
      if (error.includes("302") || error.includes("redirect")) {
        toast.error(
          "Authentication failed. The bearer token may be invalid. Please refresh the page."
        );
      } else {
        toast.error(error || "Failed to send passcode");
      }
    } finally {
      setResendEmailLoading(false);
    }
  };

  const handleVerifyEmailPasscode = async (passcode, email) => {
    console.log("✅ Verifying email passcode for:", email);

    // This will make the popup button show "Verifying..."
    setEmailVerificationLoading(true);

    try {
      await dispatch(
        validateBeneficiaryRegistrationPasscode({
          email: email || "",
          passcode: passcode,
        })
      ).unwrap();

      setEmailVerified(true);
      setShowEmailPopup(false);
      setEmailCode(""); // Clear code
      toast.success("Email verified successfully!");
    } catch (error) {
      console.error("❌ Error verifying email:", error);
      toast.error(error || "Invalid passcode");
    } finally {
      // This will hide the "Verifying..." state
      setEmailVerificationLoading(false);
    }
  };

  const handleSendPhoneOTP = async (countryPhoneCode, phoneNumber) => {
    console.log("📱 Sending phone OTP for:", countryPhoneCode, phoneNumber);

    if (!phoneNumber || !countryPhoneCode) {
      toast.error("Please enter phone number and country code");
      return;
    }

    lastPhoneDataSent.current = {
      countryCode: countryPhoneCode,
      phoneNumber: phoneNumber,
    };

    setResendPhoneLoading(true);
    try {
      const currentPartnerId = whiteLabelledPartnerIdRef.current || "0";
      console.log("📱 Using partner ID:", currentPartnerId);

      await dispatch(
        sendBeneficiaryRegistrationOTP({
          country_code: countryPhoneCode,
          mobile_number: phoneNumber,
          partner_id: currentPartnerId,
        })
      ).unwrap();

      setShowPhonePopup(true);
      setPhoneCode(""); // Clear any previous code
      toast.success("OTP sent to your phone!");
    } catch (error) {
      console.error("❌ Error sending phone OTP:", error);

      // Handle 302 redirect
      if (error.includes("302") || error.includes("redirect")) {
        toast.error("Authentication failed. Please refresh the page.");
      } else {
        toast.error(error || "Failed to send OTP");
      }
    } finally {
      setResendPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (otp, countryPhoneCode, phoneNumber) => {
    console.log("✅ Verifying phone OTP for:", countryPhoneCode, phoneNumber);

    // This will make the popup button show "Verifying..."
    setPhoneVerificationLoading(true);

    try {
      await dispatch(
        validateBeneficiaryRegistrationOTP({
          country_code: countryPhoneCode || "",
          mobile_number: phoneNumber || "",
          otp: otp,
        })
      ).unwrap();

      setPhoneVerified(true);
      setShowPhonePopup(false);
      setPhoneCode(""); // Clear code
      toast.success("Phone number verified successfully!");
    } catch (error) {
      console.error("❌ Error verifying phone:", error);
      toast.error(error || "Invalid OTP");
    } finally {
      // This will hide the "Verifying..." state
      setPhoneVerificationLoading(false);
    }
  };

  // ========== MODIFIED SUBMIT HANDLER ==========
  const handleSubmit = useCallback(
    async (formData) => {
      setIsGlobalLoading(true);
      try {
        // Transform the data to match the new API structure
        const beneficiaryData = {
          // Personal Information
          beneftype: formData.beneficiaryData.beneftype,
          first_name: formData.beneficiaryData.first_name || "",
          middle_name: formData.beneficiaryData.middle_name || "",
          last_name: formData.beneficiaryData.last_name || "",
          institution_name: formData.beneficiaryData.institution_name || "",

          // Contact Information
          email: formData.beneficiaryData.email,
          country_id: formData.beneficiaryData.country_id,
          country_phone_code: formData.countryCode,
          phone_number: formData.beneficiaryData.phone_number,

          // Address Information
          state: formData.beneficiaryData.state,
          city: formData.beneficiaryData.city,
          street: formData.beneficiaryData.street,
          postalcode: formData.beneficiaryData.postalcode,
          nationality_id: formData.beneficiaryData.nationality_id,

          // Account Information
          bic_ncc_code: formData.beneficiaryData.bic_ncc_code || "",
          password: formData.beneficiaryData.password,
          confirmPassword: formData.beneficiaryData.confirmPassword,

          // Additional fields
          status: 1,
          idType: formData.beneficiaryData.idType,
          idNumber: formData.beneficiaryData.idNumber,

          // Partner Information
          partner_id: whiteLabelledPartnerIdRef.current || "0",
          hostname: window.location.hostname,

          // Bank Accounts (transform to new structure)
          banks: formData.bankAccounts.map((account) => ({
            rails: account.rails,
            currency_code: account.currency || formData.currency,
            payment_method: account.paymentMethod || "",
            benef_iban: account.iban || "",
            swift_code: account.swift || "",
            intermediary_bank_swift: account.intermediarySwift || "",
            routing_number: account.routingNumber || "",
            bank_acc_no: account.accountNumber || "",
            sort_code: account.sortCode || "",
            bank_name: account.bankName || "",
            ifsc: account.ifsc || "",
            bankCode: account.bankCode || "",
            bic_ncc_code: formData.beneficiaryData.bic_ncc_code || "",
          })),
        };

        const result = await dispatch(
          createBeneficiaryRequestRemit(beneficiaryData)
        ).unwrap();

        // Return the beneficiary code to BaseBeneficiaryForm
        return {
          beneficiaryCode: result.beneficiaryCode || result.benefCode,
          // Add any other data you want to return
        };
      } catch (error) {
        throw error;
      } finally {
        setIsGlobalLoading(false);
      }
    },
    [dispatch, whiteLabelledPartnerIdRef]
  );

  const handleCancel = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // ========== MEMOIZED DROPDOWN FETCH FUNCTIONS ==========
  const handleFetchNationalities = useCallback(() => {
    dispatch(fetchNationalities());
  }, [dispatch]);

  const handleFetchCountries = useCallback(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  const handleFetchBanks = useCallback(
    ({ currency, bankType }) => {
      dispatch(fetchBanksByCurrency({ currency, bankType }));
    },
    [dispatch]
  );

  const handleFetchIdTypes = useCallback(
    (currency) => {
      if (["BDT", "INR", "PKR"].includes(currency)) {
        dispatch(fetchIdTypesByCurrency(currency));
      }
    },
    [dispatch]
  );

  const handleFetchCities = useCallback(
    (countryId) => {
      dispatch(fetchCitiesByCountry(countryId));
    },
    [dispatch]
  );

  const handleFetchBankBranches = useCallback(
    (bankCode) => {
      dispatch(fetchBankBranches(bankCode));
    },
    [dispatch]
  );

  // ========== RENDER LOADING OVERLAY ==========
  const renderLoadingOverlay = () => {
    if (!isGlobalLoading) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center">
          <RingLoader size={60} color="#3B82F6" />
          <p className="mt-4 text-lg font-semibold text-gray-700">
            Processing your request...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we save your beneficiary information
          </p>
        </div>
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <>
      {/* Global Loading Overlay */}
      {renderLoadingOverlay()}

      {/* Verification Popups */}
      <BenefVerificationPopup
        type="email"
        isOpen={showEmailPopup}
        onClose={() => {
          setShowEmailPopup(false);
          setEmailCode("");
        }}
        onVerify={(passcode) => {
          handleVerifyEmailPasscode(passcode, lastEmailSent.current);
        }}
        isLoading={emailVerificationLoading}
        resendLoading={resendEmailLoading}
        onResend={() => {
          // Resend with the last email
          if (lastEmailSent.current) {
            handleSendEmailPasscode(lastEmailSent.current);
          }
        }}
        code={emailCode}
        setCode={setEmailCode}
      />

      {/* Phone Verification Popup */}
      <BenefVerificationPopup
        type="phone"
        isOpen={showPhonePopup}
        onClose={() => {
          setShowPhonePopup(false);
          setPhoneCode("");
        }}
        onVerify={(otp) => {
          handleVerifyPhoneOTP(
            otp,
            lastPhoneDataSent.current?.countryCode,
            lastPhoneDataSent.current?.phoneNumber
          );
        }}
        isLoading={phoneVerificationLoading}
        resendLoading={resendPhoneLoading}
        onResend={() => {
          if (lastPhoneDataSent.current) {
            handleSendPhoneOTP(
              lastPhoneDataSent.current.countryCode,
              lastPhoneDataSent.current.phoneNumber
            );
          }
        }}
        code={phoneCode}
        setCode={setPhoneCode}
      />

      <BaseBeneficiaryForm
        // Configuration
        mode="create"
        isPublic={true}
        showPhoneSearch={false}
        // Functions
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onFetchNationalities={handleFetchNationalities}
        onFetchCountries={handleFetchCountries}
        onFetchBanks={handleFetchBanks}
        onFetchIdTypes={handleFetchIdTypes}
        onFetchCities={handleFetchCities}
        onFetchBankBranches={handleFetchBankBranches}
        // Data
        nationalities={nationalities}
        banks={banks}
        idTypes={idTypes}
        cities={cities}
        bankBranches={bankBranches}
        countries={countries}
        countriesOptions={countriesOptions}
        phoneCodeOptions={phoneCodeOptions}
        beneficiaries={[]}
        // State
        isLoading={createLoading || isGlobalLoading} // Combine loading states
        dropdownLoading={dropdownLoading}
        // NEW PROPS FOR PUBLIC REGISTRATION
        // Verification props
        emailVerified={emailVerified}
        phoneVerified={phoneVerified}
        onSendEmailPasscode={handleSendEmailPasscode}
        onSendPhoneOTP={handleSendPhoneOTP}
        setEmailVerified={setEmailVerified}
        setPhoneVerified={setPhoneVerified}
        // Password props
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        setShowPassword={setShowPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        passwordErrors={passwordErrors}
        setPasswordErrors={setPasswordErrors}
        validatePassword={validatePassword}
        // Partner ID
        partnerId={whiteLabelledPartnerIdRef.current}
        // Page title
        pageTitle={pageTitle}
        // ✅ ADD LOADING STATES FOR BUTTON DISABLED STATE
        resendEmailLoading={resendEmailLoading}
        resendPhoneLoading={resendPhoneLoading}
      />
    </>
  );
};

export default PublicBeneficiaryForm;
