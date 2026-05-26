import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faCheckCircle,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { RingLoader } from "react-spinners";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UAParser } from "ua-parser-js";
import ErrorModal from "../../../components/PopupModal/ErrorModal";
import SuccessModal from "../../../components/PopupModal/SuccessModal";
import RegistrationLayout from "../../../components/ProgressBar/RegistrationLayout";
import SSNConfirmationPopup from "../../../components/PopupModal/SSNConfirmationPopup";

// Redux imports
import { useDispatch, useSelector } from "react-redux";
import {
  selectIsNamedAccount as selectIsNamedAccountFromCurrency,
  selectSelectedAccounts,
  selectAccountOptions,
} from "../SignUp/SelectCurrencyAccount/currencyAccountsSelectors";

import {
  fetchCountries,
  setSelectedCountry,
  clearZipLookupData,
  fetchLocationByZip,
  selectCountries,
  selectSelectedCountry,
  selectLocationLoading,
  selectZipLookup,
} from "../slices/locationSlice";

// Import from the slice file
import {
  fetchTermsAndConditions,
  fetchNationalities,
  fetchIdDocumentTypes,
  selectTermsConditions,
  selectTermsLoading,
  selectTermsError,
  selectTermsFetched,
  setTermsAccepted,
  selectAcceptedTerms,
  clearTermsError,
  setMetadataField,
  selectNationalities,
  selectIdDocumentTypes,
  selectShowSSNField,
  selectHasNamedAccounts,
  selectIsUSDSelected,
  selectIsNamedAccount as selectIsNamedAccountFromSignup,
  selectSSNError,
  selectShowSSNConfirmation,
  selectNationalitiesLoading,
  selectIdDocumentTypesLoading,
  submitIndividualSignup,
} from "../slices/signupSlice";

const API_URL = import.meta.env.VITE_API_URL;

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error?.toString() || "Unknown error",
    });
  }

  render() {
    if (this.state.hasError) {
      const errorMessage =
        this.state.error?.message ||
        this.state.error?.toString() ||
        "An unexpected error occurred";

      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper functions for section validation
const getSectionFields = (sectionIndex, values) => {
  switch (sectionIndex) {
    case 0: // Personal Information
      const fields = [
        "first_name",
        "last_name",
        "email",
        "dob",
        "nationality",
        "gender",
      ];
      if (values.middle_name && values.middle_name.trim() !== "") {
        fields.push("middle_name");
      }
      return fields;

    case 1: // Contact Information
      return [
        "country",
        "zip_code",
        "state",
        "city",
        "street_address_1",
        "mobile_number",
        "mobilenumber_countrycode",
      ];

    case 2: // Identity Verification
      const idFields = [
        "idDocumentType",
        "idDocumentNumber",
        "idIssuedDate",
        "idIssuedCountryCode",
      ];
      if (values.idDocumentType === "other") {
        idFields.push("idDocumentTypeOther");
      }

      // Only add SSN to required fields if it should be shown
      const hasUSDNamedAccount = true; // You'll need to pass this from props/state
      const isRemittanceOnly = true; // You'll need to pass this from props/state
      const isUSCountry = values.country === "United States" || values.country === 186;
      const shouldShowSSNField = (hasUSDNamedAccount && isUSCountry) || (isRemittanceOnly && isUSCountry);

      if (shouldShowSSNField) {
        idFields.push("ssn");
      }

      return idFields;

    case 3: // Security
      return ["password", "confirmPassword"];

    case 4: // Terms & Conditions
      return [];

    default:
      return [];
  }
};

const getSectionRequiredFields = (sectionIndex) => {
  switch (sectionIndex) {
    case 0: // Personal Information
      return [
        "first_name",
        "last_name",
        "email",
        "dob",
        "nationality",
        "gender",
      ];

    case 1: // Contact Information
      return [
        "country",
        "zip_code",
        "state",
        "city",
        "street_address_1",
        "mobile_number",
        "mobilenumber_countrycode",
      ];

    case 2: // Identity Verification
      return [
        "idDocumentType",
        "idDocumentNumber",
        "idIssuedDate",
        "idIssuedCountryCode",
      ];

    case 3: // Security
      return ["password", "confirmPassword"];

    case 4: // Terms & Conditions
      return [];

    default:
      return [];
  }
};

// SIMPLIFIED Validation schema - FIXED
const createValidationSchema = () => {
  return Yup.object({
    first_name: Yup.string()
      .required("First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters"),

    last_name: Yup.string()
      .required("Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name cannot exceed 50 characters"),

    middle_name: Yup.string().max(
      50,
      "Middle name cannot exceed 50 characters",
    ),

    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required")
      .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),

    dob: Yup.date()
      .required("Date of birth is required")
      .max(
        new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
        "You must be at least 18 years old",
      ),

    nationality: Yup.string().required("Nationality is required"),

    gender: Yup.string().required("Gender is required"),

    country: Yup.mixed().required("Country is required"),

    // REMOVED character count validation
    zip_code: Yup.string().required("ZIP/Postal code is required"),

    // REMOVED character count validation
    state: Yup.string().required("State/Province is required"),

    // REMOVED character count validation
    city: Yup.string().required("City is required"),

    // REMOVED character count validation
    street_address_1: Yup.string().required("Street address is required"),

    mobile_number: Yup.string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Phone number must be 10 digits"),

    mobilenumber_countrycode: Yup.string().required("Country code is required"),

    // Update the SSN validation in createValidationSchema()
    ssn: Yup.string().test(
      "ssn-validation",
      "SSN is required and must be in format XXX-XX-XXXX",
      function (value) {
        // Check if SSN is required based on the current values
        const { isNamedAccount, remit_customer, country } = this.parent;

        const hasUSDNamedAccount = isNamedAccount;
        const isRemittanceOnly = remit_customer === true || remit_customer === "true";
        const isUSCountry = country === "United States" || country === 186;
        const shouldShowSSNField = (hasUSDNamedAccount && isUSCountry) || (isRemittanceOnly && isUSCountry);

        // If SSN field should be shown, it becomes required
        if (shouldShowSSNField) {
          if (!value) return false;
          const cleanSSN = value.replace(/-/g, "");
          return cleanSSN.length === 9 && /^\d+$/.test(cleanSSN);
        }

        // If SSN field is not required, always return true
        return true;
      },
    ),

    idDocumentType: Yup.string().required("ID Document Type is required"),

    idDocumentNumber: Yup.string()
      .required("ID Document Number is required")
      .min(2, "Document number must be at least 2 characters"),

    idIssuedDate: Yup.string()
      .required("ID Expiry Date is required")
      .test(
        "future-date",
        "Expiry date must be in the future",
        function (value) {
          if (!value) return false;
          const expiryDate = new Date(value);
          const today = new Date();
          return expiryDate > today;
        },
      ),

    idIssuedCountryCode: Yup.string().required("Issuing Country is required"),

    idDocumentTypeOther: Yup.string().when("idDocumentType", {
      is: "other",
      then: Yup.string()
        .required("Please specify document type")
        .min(2, "Document type must be at least 2 characters"),
    }),

    password: Yup.string()
      .required("Password is required")
      .min(12, "Password must be at least 12 characters")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character",
      ),

    // FIXED: Simple and reliable confirmPassword validation
    confirmPassword: Yup.string()
      .required("Confirm password is required")
      .oneOf([Yup.ref("password")], "Passwords must match"),
  });
};

// Main component function
function SignUpIndividualContent() {
  // State declarations
  const [isClient, setIsClient] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullScreenLoader, setShowFullScreenLoader] = useState(false);
  const [selectedPhoneCode, setSelectedPhoneCode] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sectionErrors, setSectionErrors] = useState({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
  });
  const [showAllErrors, setShowAllErrors] = useState(false);

  const [isCancelling, setIsCancelling] = useState(false);
  const [showSSN, setShowSSN] = useState(false);

  const [zipDebounceTimer, setZipDebounceTimer] = useState(null);

  // Currency account selectors
  const isNamedAccount = useSelector(selectIsNamedAccountFromCurrency);
  const selectedAccounts = useSelector(selectSelectedAccounts);
  const accountOptions = useSelector(selectAccountOptions);

  // Signup slice selectors (for backward compatibility)
  const showSSNField = useSelector(selectShowSSNField);
  const hasNamedAccounts = useSelector(selectHasNamedAccounts);
  const isUSDSelected = useSelector(selectIsUSDSelected);
  const ssnError = useSelector(selectSSNError);
  const showSSNConfirmation = useSelector(selectShowSSNConfirmation);

  useEffect(() => {
    console.log("🔍 Selector Debug:", {
      isNamedAccount,
      hasNamedAccounts,
      isUSDSelected,
      showSSNField,
      selectedAccounts,
      accountOptionsLength: accountOptions?.length || 0,
    });
  }, [
    isNamedAccount,
    hasNamedAccounts,
    isUSDSelected,
    showSSNField,
    selectedAccounts,
    accountOptions,
  ]);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const countryCodeRef = useRef("");

  // Redux selectors for location data
  const countries = useSelector(selectCountries) || [];
  const selectedCountry = useSelector(selectSelectedCountry);
  const { countries: loadingCountries } = useSelector(selectLocationLoading);

  // Other Redux selectors
  const termsConditions = useSelector(selectTermsConditions) || [];
  const termsLoading = useSelector(selectTermsLoading);
  const termsError = useSelector(selectTermsError);
  const termsFetched = useSelector(selectTermsFetched);
  const acceptedTerms = useSelector(selectAcceptedTerms) || [];
  const nationalities = useSelector(selectNationalities) || [];
  const idDocumentTypes = useSelector(selectIdDocumentTypes) || [];

  const isLoadingNationalities = useSelector(selectNationalitiesLoading);
  const isLoadingDocumentTypes = useSelector(selectIdDocumentTypesLoading);

  const zipLookup = useSelector(selectZipLookup);

  // Extract location state with defaults
  const locationState = location.state || {};
  console.log("📥 LOCATION STATE RECEIVED:", {
    locationState,
    remit_customer: locationState.remit_customer,
    isRemit: locationState.remit_customer,
    type: typeof locationState.remit_customer,
  });

  const {
    service_provide_ids = [],
    referral_code = "",
    agent_code = "",
    package_currencies = [],
    bank_accounts = [],
    kyc_verify = [],
    accountType = null,
    remit_customer: isRemit = false,
    ssn_required = "N",
    show_remittance_only_on_registration = false,
    accountOptions: locationAccountOptions = [],
  } = location.state || {};

  const formSections = [
    "Personal Information",
    "Contact Information",
    "Identity Verification",
    "Security",
    "Terms & Conditions",
  ];

  // Get configuration from localStorage
  const iswhitelabelledpartner = localStorage.getItem("iswhitelabelledpartner");
  const whitelabelledpartnerid = localStorage.getItem("whitelabelledpartnerid");
  const isPartnerPackageModule = localStorage.getItem("isPartnerPackageModule");
  const bearertoken = localStorage.getItem("bearertoken");

  // Enhanced formik configuration - REMOVED custom validation function
  const formik = useFormik({
    initialValues: {
      customer_type: "individual",
      first_name: "",
      last_name: "",
      email: "",
      mobilenumber_countrycode: "",
      flag_url: "",
      service_providers: service_provide_ids,
      referral_code: referral_code,
      agent_code: agent_code,
      middle_name: "",
      password: "",
      confirmPassword: "",
      mobile_number: "",
      zip_code: "",
      state: "",
      city: "",
      country: "",
      street_address_1: "",
      street_address_2: "",
      nationality: "",
      gender: "",
      dob: "",
      ssn: "",
      idDocumentType: "",
      idDocumentNumber: "",
      idIssuedDate: "",
      idIssuedCountryCode: "",
      idDocumentTypeOther: "",
      accept_sms: 0,
      accept_privacy_policy: 0,
      accept_disclosure: 0,
      accept_fees: 0,
      showSSNField: showSSNField,
      isNamedAccount: isNamedAccount,
      selectedAccounts: selectedAccounts,
      remit_customer: isRemit,
    },
    validationSchema: createValidationSchema(), // Use ONLY Yup validation
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      try {
        console.log("🚀 Form submission started");
        setIsSubmitting(true);
        setShowFullScreenLoader(true);

        dispatch(setMetadataField({ field: "ssnError", value: "" }));

        // Check terms and conditions
        if (
          termsFetched &&
          termsConditions.length > 0 &&
          acceptedTerms.length !== termsConditions.length
        ) {
          setErrorMessage("Please accept the terms and conditions");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        // Check if all sections are valid
        const allErrors = await formik.validateForm();
        const hasErrors = Object.keys(allErrors).length > 0;

        if (hasErrors) {
          setShowAllErrors(true);
          setActiveSection(0); // Go to first section with errors

          // Find first section with errors
          for (let i = 0; i < formSections.length - 1; i++) {
            const sectionFields = getSectionFields(i, values);
            const sectionHasError = sectionFields.some(
              (field) => allErrors[field],
            );
            if (sectionHasError) {
              setActiveSection(i);
              break;
            }
          }

          toast.error("Please fix all validation errors before submitting");
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        const hasUSDNamedAccount = isNamedAccount;
        const isRemittanceOnly = Boolean(isRemit);

        // Determine if country is United States
        const isUSCountry =
          values.country === "United States" || values.country === 186;

        const shouldShowSSNField =
          (hasUSDNamedAccount && isUSCountry) ||
          (isRemittanceOnly && isUSCountry);

        console.log("🔍 DEBUG - SSN Conditions:", {
          isRemit,
          isRemitBoolean: Boolean(isRemit),
          isRemittanceOnly,
          hasUSDNamedAccount,
          shouldShowSSN: shouldShowSSNField,
          locationState: location.state,
        });

        if (shouldShowSSNField) {
          const cleanSSN = values.ssn?.replace(/-/g, "") || "";

          if (!values.ssn || values.ssn.trim() === "") {
            setErrorMessage(
              hasUSDNamedAccount
                ? "SSN is required for USD Named Accounts with United States as registered country"
                : "SSN is required for Remittance Services with United States as registered country",
            );
            setIsModalOpen(true);
            setIsSubmitting(false);
            setShowFullScreenLoader(false);
            return;
          }

          if (cleanSSN.length !== 9 || !/^\d+$/.test(cleanSSN)) {
            setErrorMessage("SSN must be 9 digits in format XXX-XX-XXXX");
            setIsModalOpen(true);
            setIsSubmitting(false);
            setShowFullScreenLoader(false);
            return;
          }

          // Show confirmation popup
          if (values.ssn && values.ssn.trim() !== "") {
            console.log("📢 Showing SSN confirmation popup");
            dispatch(
              setMetadataField({ field: "showSSNConfirmation", value: true }),
            );
            setIsSubmitting(false);
            setShowFullScreenLoader(false);
            return;
          }
        }

        console.log("✅ Form validation passed. Proceeding to submission...", {
          idDocumentType: values.idDocumentType,
          idDocumentNumber: values.idDocumentNumber,
          idIssuedDate: values.idIssuedDate,
          idIssuedCountryCode: values.idIssuedCountryCode,
          idDocumentTypeOther: values.idDocumentTypeOther,
          ssn_required: ssn_required,
          hasSSN: !!values.ssn,
          ssnLength: values.ssn?.replace(/-/g, "").length || 0,
        });

        await handleFormSubmission(values);
      } catch (error) {
        console.error("❌ Form validation error:", error);
        setErrorMessage(
          `An error occurred during form validation: ${error.message}`,
        );
        setIsModalOpen(true);
        setIsSubmitting(false);
        setShowFullScreenLoader(false);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Calculate if SSN field should be shown - defined after formik
  const shouldShowSSNField = useMemo(() => {
    const hasUSDNamedAccount = isNamedAccount;
    const isRemittanceOnly = Boolean(isRemit);
    const isUSCountry = formik.values.country === "United States" || formik.values.country === 186;
    return (hasUSDNamedAccount && isUSCountry) || (isRemittanceOnly && isUSCountry);
  }, [formik.values.country, isNamedAccount, isRemit]);

  // DEBUG: Add useEffect to monitor password values and errors
  useEffect(() => {
    console.log("🔍 DEBUG - Formik state:", {
      password: formik.values.password,
      confirmPassword: formik.values.confirmPassword,
      areEqual: formik.values.password === formik.values.confirmPassword,
      passwordError: formik.errors.password,
      confirmPasswordError: formik.errors.confirmPassword,
      sectionErrors: sectionErrors[3], // Check section 3 (Security) errors
      allFormikErrors: formik.errors,
      touched: {
        password: formik.touched.password,
        confirmPassword: formik.touched.confirmPassword,
      },
    });
  }, [
    formik.values.password,
    formik.values.confirmPassword,
    formik.errors,
    sectionErrors,
  ]);

  // Function to validate a section
  // Update validateCurrentSection to check conditional requirements
  const validateCurrentSection = (sectionIndex) => {
    const sectionFields = getSectionFields(sectionIndex, formik.values);
    const errors = {};

    // Special handling for section 2 (Identity Verification) to check SSN requirement
    if (sectionIndex === 2) {
      const hasUSDNamedAccount = isNamedAccount;
      const isRemittanceOnly = Boolean(isRemit);
      const isUSCountry = formik.values.country === "United States" || formik.values.country === 186;
      const shouldShowSSNField = (hasUSDNamedAccount && isUSCountry) || (isRemittanceOnly && isUSCountry);

      if (shouldShowSSNField && (!formik.values.ssn || formik.values.ssn.replace(/-/g, "").length !== 9)) {
        errors.ssn = "SSN is required and must be 9 digits in format XXX-XX-XXXX";
      }
    }

    // Use Formik's validation results for other fields
    sectionFields.forEach((field) => {
      if (formik.errors[field]) {
        errors[field] = formik.errors[field];
      }
    });

    return errors;
  };
  // Handle navigation between sections with validation - UPDATED
  // Handle navigation between sections with validation - UPDATED with SSN check
  const handleNextSection = async (currentSection) => {
    // Mark all fields in current section as touched
    const sectionFields = getSectionFields(currentSection, formik.values, isNamedAccount, isRemit);
    sectionFields.forEach((field) => {
      formik.setFieldTouched(field, true);
    });

    // Special validation for SSN in section 2 (Identity Verification)
    if (currentSection === 2) {
      const hasUSDNamedAccount = isNamedAccount;
      const isRemittanceOnly = Boolean(isRemit);
      const isUSCountry = formik.values.country === "United States" || formik.values.country === 186;
      const shouldShowSSNField = (hasUSDNamedAccount && isUSCountry) || (isRemittanceOnly && isUSCountry);

      if (shouldShowSSNField) {
        const cleanSSN = formik.values.ssn?.replace(/-/g, "");
        if (!formik.values.ssn || formik.values.ssn.trim() === "") {
          toast.error("SSN is required. Please enter your Social Security Number.");
          formik.setFieldError("ssn", "SSN is required for this account type with United States as registered country");
          formik.setFieldTouched("ssn", true);
          return; // Stop navigation - prevents moving to next section
        }
        if (cleanSSN?.length !== 9 || !/^\d+$/.test(cleanSSN)) {
          toast.error("SSN must be 9 digits in format XXX-XX-XXXX");
          formik.setFieldError("ssn", "SSN must be 9 digits in format XXX-XX-XXXX");
          formik.setFieldTouched("ssn", true);
          return; // Stop navigation - prevents moving to next section
        }
      }
    }

    // Trigger Formik validation for current section
    await formik.validateForm();

    // Get errors from Formik instead of re-validating with Yup
    const sectionErrors = validateCurrentSection(currentSection);

    if (Object.keys(sectionErrors).length === 0) {
      // Clear any existing errors for this section
      setSectionErrors((prev) => ({
        ...prev,
        [currentSection]: [],
      }));

      // Move to next section
      if (currentSection < formSections.length - 1) {
        setActiveSection(currentSection + 1);
      }
    } else {
      // Show errors from Formik
      setSectionErrors((prev) => ({
        ...prev,
        [currentSection]: Object.entries(sectionErrors).map(
          ([field, error]) => ({
            field,
            error,
          }),
        ),
      }));

      // Show error message
      const errorCount = Object.keys(sectionErrors).length;
      toast.error(`Please fix ${errorCount} error(s) before proceeding`);

      // Scroll to first error
      const firstErrorField = Object.keys(sectionErrors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
    }
  };

  const handlePreviousSection = (currentSection) => {
    if (currentSection > 0) {
      setActiveSection(currentSection - 1);
    }
  };

  // Check if a section is complete
  const isSectionComplete = async (sectionIndex) => {
    const errors = await validateCurrentSection(sectionIndex);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmission = async (values) => {
    try {
      setShowFullScreenLoader(true);
      console.log("📝 Formik values before transformation:", values);
  
      // Prepare the data for submission
      const submissionData = {
        customer_type: "individual",
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        mobilenumber_countrycode: values.mobilenumber_countrycode,
        mobile_number: values.mobile_number,
        password: values.password,
        confirm_password: values.confirmPassword,
        street_address_1: values.street_address_1,
        street_address_2: values.street_address_2 || "",
        city: values.city,
        state: values.state,
        zip_code: values.zip_code,
        country: values.country,
        nationality: values.nationality,
        gender: values.gender,
        dob: values.dob,
        ssn: values.ssn ? values.ssn.replace(/-/g, "") : "",
        idDocumentType: values.idDocumentType,
        idDocumentNumber: values.idDocumentNumber,
        idIssuedDate: values.idIssuedDate,
        idIssuedCountryCode: values.idIssuedCountryCode,
        idDocumentTypeOther: values.idDocumentTypeOther || "",
        service_providers: service_provide_ids,
        referral_code: referral_code || "",
        agent_code: agent_code || "",
        hostname: window.location.hostname,
        remit_customer: isRemit,
        bank_account_options: service_provide_ids,
        isPartnerPackageModule: isPartnerPackageModule || "N",
        package_currencies: package_currencies,
        whitelabelledpartnerid: whitelabelledpartnerid,
        kycVerify: kyc_verify,
        terms_and_conditions: termsFetched ? acceptedTerms : [],
        accept_sms: values.accept_sms || 0,
        accept_privacy_policy: values.accept_privacy_policy || 0,
        accept_disclosure: values.accept_disclosure || 0,
        accept_fees: values.accept_fees || 0,
        is_named_account: isNamedAccount,
        has_usd_named_account: isNamedAccount,
        selected_accounts: selectedAccounts,
        service_provide_ids: service_provide_ids,
      };
  
      // Clean up empty optional fields
      const cleanedData = { ...submissionData };
      Object.keys(cleanedData).forEach((key) => {
        if (
          cleanedData[key] === "" ||
          cleanedData[key] === null ||
          cleanedData[key] === undefined
        ) {
          delete cleanedData[key];
        }
      });
  
      console.log("📤 Final payload being sent:", {
        ...cleanedData,
        password: "***HIDDEN***",
        confirm_password: "***HIDDEN***",
      });
  
      // Dispatch the submission action
      const resultAction = await dispatch(submitIndividualSignup(cleanedData));
  
      if (submitIndividualSignup.fulfilled.match(resultAction)) {
        const responseData = resultAction.payload;
        console.log("✅ Submission successful:", responseData);
  
        if (responseData.status === "success") {
          setSuccessMessage(responseData.message || "Registration successful!");
          setIsSuccessModalOpen(true);
  
          // Determine navigation based on account type
          const navigationState = {
            mobileNumber: `${cleanedData.mobilenumber_countrycode} ${cleanedData.mobile_number}`,
            kyc_verify: kyc_verify,
            customerData: responseData.data || null,
            hasSSN: !!cleanedData.ssn,
            isRemittanceOnly: isRemit,
            isMultiCurrency: !isRemit && selectedAccounts && selectedAccounts.length > 0,
            selectedAccounts: selectedAccounts,
            accountType: isRemit ? "remittance_only" : "multi_currency",
          };
  
          // Navigate to phone verification
          navigate("/phoneverification", {
            state: {
              mobileNumber: `${cleanedData.mobilenumber_countrycode} ${cleanedData.mobile_number}`,
              kyc_verify: kyc_verify,
              customerData: responseData.data || null,
              hasSSN: !!cleanedData.ssn,
              isRemittanceOnly: isRemit,  // ← ADD THIS
              selectedAccounts: selectedAccounts,  // ← ADD THIS
            },
          });
        } else {
          setErrorMessage(responseData.message || "Registration failed!");
          setIsModalOpen(true);
        }
      } else {
        const error = resultAction.payload || resultAction.error;
        console.error("❌ Submission rejected:", error);
  
        if (error?.message) {
          setErrorMessage(error.message);
          setIsModalOpen(true);
        } else if (error?.errors) {
          const formattedErrors = {};
          Object.keys(error.errors).forEach((key) => {
            formattedErrors[key] = Array.isArray(error.errors[key])
              ? error.errors[key].join(", ")
              : error.errors[key];
          });
          formik.setErrors(formattedErrors);
          toast.error("Please check the form for errors");
        } else {
          setErrorMessage("Submission failed. Please try again.");
          setIsModalOpen(true);
        }
      }
    } catch (error) {
      console.error("❌ Submission error:", error);
      setErrorMessage(
        error.message || "An unexpected error occurred during submission.",
      );
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
      setShowFullScreenLoader(false);
    }
  };

  // Handle SSN confirmation
  const handleSSNConfirmation = (confirmed) => {
    console.log("🔍 SSN confirmation:", confirmed);
    dispatch(setMetadataField({ field: "showSSNConfirmation", value: false }));
    if (confirmed) {
      handleFormSubmission(formik.values);
    } else {
      setIsSubmitting(false);
    }
  };

  // Initialize data
  const initializedRef = useRef(false);

  useEffect(() => {
    setIsClient(true);

    // Skip if already initialized
    if (initializedRef.current) {
      console.log("🔄 Already initialized, skipping");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initializeData = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setInitializationError(null);
        }

        console.log("🔍 [initializeData] Starting initialization", {
          hasLocationState: !!location.state,
          service_provide_ids: service_provide_ids,
          accountOptions: locationAccountOptions,
          isNamedAccount,
        });

        // Sync USD named account status to signupSlice for backward compatibility
        dispatch(
          setMetadataField({
            field: "hasNamedAccounts",
            value: isNamedAccount || false,
          }),
        );

        dispatch(
          setMetadataField({
            field: "isUSDSelected",
            value: isNamedAccount || false,
          }),
        );

        // Sync isNamedAccount field for SSN logic
        dispatch(
          setMetadataField({
            field: "isNamedAccount",
            value: isNamedAccount || false,
          }),
        );

        // Get partner token if needed
        try {
          console.log("🔄 Attempting to get partner token...");
          const { getBearerToken } =
            await import("../../../services/authService");
          const token = await getBearerToken();
          console.log("✅ Partner token obtained:", token ? "Yes" : "No");
        } catch (tokenError) {
          console.error("❌ Failed to get partner token:", tokenError.message);
        }

        // Check what data we need to fetch
        const apiPromises = [];

        if (countries.length === 0) {
          apiPromises.push(
            dispatch(fetchCountries())
              .unwrap()
              .catch((error) => {
                console.error("❌ Countries fetch error:", error);
                return [];
              }),
          );
        } else {
          console.log("✅ Countries already loaded:", countries.length);
        }

        if (nationalities.length === 0) {
          apiPromises.push(
            dispatch(fetchNationalities())
              .unwrap()
              .catch((error) => {
                console.error("❌ Nationalities fetch error:", error);
                return [];
              }),
          );
        } else {
          console.log("✅ Nationalities already loaded:", nationalities.length);
        }

        if (idDocumentTypes.length === 0) {
          apiPromises.push(
            dispatch(fetchIdDocumentTypes())
              .unwrap()
              .catch((error) => {
                console.error("❌ ID Document Types fetch error:", error);
                return [];
              }),
          );
        } else {
          console.log(
            "✅ ID Document Types already loaded:",
            idDocumentTypes.length,
          );
        }

        if (!termsFetched) {
          console.log("📡 Fetching terms and conditions...");
          apiPromises.push(
            dispatch(fetchTermsAndConditions())
              .unwrap()
              .then((terms) => {
                console.log(
                  "✅ Terms fetched successfully:",
                  terms?.length || 0,
                );
                return terms;
              })
              .catch((error) => {
                console.error("❌ Terms fetch error in component:", error);
                return [];
              }),
          );
        } else {
          console.log("✅ Terms already fetched");
        }

        // Execute API calls if needed
        if (apiPromises.length > 0) {
          console.log("🚀 Executing", apiPromises.length, "API calls...");
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => {
              console.log("⏰ API timeout after 30 seconds");
              resolve("timeout");
            }, 30000),
          );

          const results = await Promise.race([
            Promise.allSettled(apiPromises),
            timeoutPromise,
          ]);

          if (results === "timeout") {
            console.warn("⚠️ Some API calls timed out");
          } else {
            console.log("✅ All API calls completed:", results);
          }
        } else {
          console.log("✅ No API calls needed - all data already loaded");
        }

        // Mark as initialized and finish loading
        if (isMounted) {
          initializedRef.current = true;
          setIsLoading(false);
          console.log("✅ Initialization complete");
        }
      } catch (error) {
        console.error("❌ Initialization error:", error);
        if (isMounted) {
          setInitializationError(error.message);
          setIsLoading(false);
        }
      }
    };

    // Run initialization if we have location state
    if (location.state) {
      initializeData();
    } else {
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle errors
  useEffect(() => {
    if (termsError) {
      setErrorMessage(`Failed to load terms: ${termsError}`);
      setIsModalOpen(true);
    }
  }, [termsError]);

  useEffect(() => {
    if (!isModalOpen && termsError) {
      dispatch(clearTermsError());
    }
  }, [isModalOpen, termsError, dispatch]);

  useEffect(() => {
    return () => {
      if (zipDebounceTimer) {
        clearTimeout(zipDebounceTimer);
      }
    };
  }, [zipDebounceTimer]);

  // Country change handler with state/city fetching
  const handleCountrySelect = async (selectedOption) => {
    const countryId = selectedOption?.value || "";
    const countryCode = selectedOption?.country_code || "";

    // Update Redux state
    dispatch(setSelectedCountry(selectedOption));

    // Update formik values
    formik.setFieldValue("country", countryId);
    formik.setFieldValue("state", "");
    formik.setFieldValue("city", "");
    formik.setFieldValue("zip_code", "");

    // Store country code for ZIP lookup
    countryCodeRef.current = countryCode;

    // Clear ZIP lookup data
    dispatch(clearZipLookupData());

    // Auto-set SSN field for US residents (same logic as Institution component)
    if (selectedOption?.label === "United States") {
      dispatch(setMetadataField({ field: "showSSNField", value: true }));
    }
  };

  const handleZipCodeChange = (e) => {
    const zipCode = e.target.value;
    formik.handleChange(e);

    const countryCode = selectedCountry?.country_code || countryCodeRef.current;

    // Clear previous timer
    if (zipDebounceTimer) {
      clearTimeout(zipDebounceTimer);
    }

    // Set new timer for debounced lookup
    const timer = setTimeout(() => {
      if (zipCode && countryCode && zipCode.length >= 3) {
        handleZipCodeLookup(zipCode, countryCode);
      }
    }, 1000);

    setZipDebounceTimer(timer);
  };

  const handleZipCodeLookup = useCallback(
    async (zipCode, countryCode) => {
      if (!zipCode || !countryCode || zipCode.length < 3) {
        return;
      }

      try {
        // Use Redux action to fetch location by ZIP
        const resultAction = await dispatch(
          fetchLocationByZip({ countryCode, zipCode }),
        );

        if (fetchLocationByZip.fulfilled.match(resultAction)) {
          const data = resultAction.payload;
          console.log("✅ ZIP lookup success:", data);

          if (data.success) {
            // Update form values from API response
            if (data.state) {
              formik.setFieldValue("state", data.state);
            }

            if (data.city) {
              formik.setFieldValue("city", data.city);
            }

            // Show success message
            const locationMsg =
              data.city && data.state
                ? `${data.city}, ${data.state}`
                : data.city || data.state || "location";
            toast.success(`Auto-filled ${locationMsg} from ZIP code`);
          }
        } else if (fetchLocationByZip.rejected.match(resultAction)) {
          console.log("❌ ZIP lookup failed:", resultAction.payload);
          // Don't show error - just let user enter manually
        }
      } catch (error) {
        console.error("ZIP code lookup error:", error);
        // Don't show error - just let user enter manually
      }
    },
    [dispatch, formik],
  );

  const handleCountryCodeSelect = (selectedOption) => {
    formik.setFieldValue(
      "mobilenumber_countrycode",
      selectedOption?.phoneCode || "",
    );
    formik.setFieldValue("flag_url", selectedOption?.flag_url || "");
    setSelectedPhoneCode(selectedOption || null);
  };

  const handleNationalityChange = (selectedOption) => {
    formik.setFieldValue("nationality", selectedOption?.value || "");
  };

  const handleGenderChange = (selectedOption) => {
    formik.setFieldValue("gender", selectedOption?.value || "");
  };

  // Phone number handler - NO DASHES
  const handlePhoneChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "").slice(0, 10);
    formik.setFieldValue("mobile_number", rawValue);
  };

  // Prevent non-numeric input for phone
  const handlePhoneKeyPress = (e) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Custom password handlers with debugging
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    console.log("🔍 INPUT - Password changing to:", value);
    formik.setFieldValue("password", value);
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    console.log("🔍 INPUT - Confirm password changing to:", value);
    formik.setFieldValue("confirmPassword", value);
  };

  const handleSSNChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    let formattedValue = value;

    if (value.length > 3) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 5)}`;
      if (value.length > 5) {
        formattedValue += `-${value.slice(5, 9)}`;
      }
    }

    formattedValue = formattedValue.slice(0, 11);
    formik.setFieldValue("ssn", formattedValue);

    if (ssnError) {
      dispatch(setMetadataField({ field: "ssnError", value: "" }));
    }
  };

  const handleCheckboxChange = useCallback(
    async (termId) => {
      try {
        const currentDateTimeLocal = new Date().toLocaleString();

        let ip = "Unknown";
        let location = "Unknown";
        let device = "Unknown";

        try {
          const ipResponse = await fetch("https://api.ipify.org?format=json");
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            ip = ipData.ip;
          }

          if (ip !== "Unknown") {
            const locationResponse = await fetch(
              `https://ipapi.co/${ip}/json/`,
            );
            if (locationResponse.ok) {
              const locationData = await locationResponse.json();
              location = `${locationData.city || "Unknown"}, ${locationData.region || "Unknown"
                }, ${locationData.country_name || "Unknown"}`;
            }
          }

          if (typeof UAParser !== "undefined") {
            const parser = new UAParser();
            const deviceInfo = parser.getResult();
            device = `${deviceInfo.os.name || "Unknown"} on ${deviceInfo.device.model || "Unknown Device"
              }`;
          }
        } catch (deviceError) { }

        const termData = {
          accepted_at: currentDateTimeLocal,
          ip,
          location,
          device,
        };

        dispatch(
          setTermsAccepted({
            termId,
            accepted: !acceptedTerms.some((item) => item.id === termId),
            metadata: termData,
          }),
        );
      } catch (error) {
        dispatch(
          setTermsAccepted({
            termId,
            accepted: !acceptedTerms.some((item) => item.id === termId),
            metadata: {
              accepted_at: new Date().toLocaleString(),
              ip: "Unknown",
              location: "Unknown",
              device: "Unknown",
            },
          }),
        );
      }
    },
    [dispatch, acceptedTerms],
  );

  const validationRules = [
    { label: "At least 12 characters", regex: /^.{12,}$/ },
    { label: "At least one uppercase letter", regex: /[A-Z]/ },
    {
      label: "At least one special character",
      regex: /[!@#$%^&*(),.?":{}|<>]/,
    },
  ];

  const isRuleMet = (regex) => regex.test(formik.values.password);

  // Progress calculation with validation check
  useEffect(() => {
    const calculateProgress = async () => {
      let filledFields = 0;
      let totalFields = 0;

      // Check each section
      for (let i = 0; i < formSections.length - 1; i++) {
        const sectionFields = getSectionFields(i, formik.values);
        totalFields += sectionFields.length;

        // Check if each field is filled and valid
        for (const field of sectionFields) {
          const value = formik.values[field];
          const isFilled = value && value.toString().trim() !== "";
          const hasError = formik.errors[field];

          if (isFilled && !hasError) {
            filledFields++;
          }
        }
      }

      // Add terms and conditions
      if (termsConditions.length > 0) {
        totalFields += 1; // Terms section
        if (acceptedTerms.length > 0) {
          filledFields += 1; // Terms accepted
        }
      }

      // Calculate percentage
      const percentage =
        totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

      return percentage;
    };

    calculateProgress().then(setProgress);
  }, [
    formik.values,
    formik.errors,
    acceptedTerms,
    isNamedAccount,
    isRemit,
    termsConditions.length,
  ]);

  // Options for selects with safe defaults
  const countryOptions = countries.map((country) => ({
    value: country.id,
    label: country.name,
    flag_url: country.flag_url,
    phoneCode: country.phone_code,
    country_code: country.country_code,
  }));

  const nationalityOptions = nationalities.map((nat) => ({
    value: nat.id,
    label: nat.name,
  }));

  const genderOptions = [
    { value: "1", label: "Male" },
    { value: "2", label: "Female" },
    { value: "3", label: "Other" },
  ];

  // Custom styles for react-select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "white",
      border: state.isFocused ? "1px solid #3b82f6" : "1px solid #d1d5db",
      borderRadius: "0.375rem",
      padding: "0px",
      fontSize: "0.875rem",
      color: "#111827",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      minHeight: "44px",
      "&:hover": { borderColor: "#3b82f6" },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.375rem",
      boxShadow:
        "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
      zIndex: 20,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#dbeafe" : "white",
      color: state.isSelected ? "#1e40af" : "#111827",
      "&:hover": { backgroundColor: "#eff6ff", color: "#1e40af" },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  // Handle cancel
  const handleCancel = () => {
    setIsCancelling(true);
    navigate(-1);
  };

  // Render section errors
  const renderSectionErrors = (sectionIndex) => {
    const errors = sectionErrors[sectionIndex];
    if (!errors || errors.length === 0) return null;

    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-2">
          <FontAwesomeIcon
            icon={faExclamationCircle}
            className="text-red-500 mr-2"
          />
          <h4 className="text-red-700 font-semibold">
            Please fix the following errors:
          </h4>
        </div>
        <ul className="text-red-600 text-sm list-disc pl-5">
          {errors.map((err, index) => (
            <li key={index} className="mb-1">
              <span className="font-medium">
                {err.field.replace(/_/g, " ")}:
              </span>{" "}
              {err.error}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Check if form has errors
  const hasFormErrors = () => {
    return Object.keys(formik.errors).length > 0;
  };

  // Render all form errors in the last section
  const renderAllFormErrors = () => {
    if (!showAllErrors || !hasFormErrors()) return null;

    const allErrors = [];
    for (let i = 0; i < formSections.length - 1; i++) {
      const sectionFields = getSectionFields(i, formik.values);
      const sectionErrors = sectionFields
        .filter((field) => formik.errors[field])
        .map((field) => ({
          field,
          error: formik.errors[field],
          section: i,
        }));

      if (sectionErrors.length > 0) {
        allErrors.push({
          section: i,
          sectionName: formSections[i],
          errors: sectionErrors,
        });
      }
    }

    if (allErrors.length === 0) return null;

    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-3">
          <FontAwesomeIcon
            icon={faExclamationCircle}
            className="text-red-500 mr-2 text-lg"
          />
          <h4 className="text-red-700 font-semibold text-lg">
            Form Validation Errors
          </h4>
        </div>
        <p className="text-red-600 mb-3">
          Please fix the following errors in the indicated sections:
        </p>
        {allErrors.map((sectionError, idx) => (
          <div key={idx} className="mb-3 last:mb-0">
            <button
              type="button"
              onClick={() => setActiveSection(sectionError.section)}
              className="text-blue-600 hover:text-blue-800 font-medium mb-2 flex items-center"
            >
              {sectionError.sectionName}
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
            <ul className="text-red-600 text-sm list-disc pl-5">
              {sectionError.errors.map((err, errorIdx) => (
                <li key={errorIdx} className="mb-1">
                  <span className="font-medium">
                    {err.field.replace(/_/g, " ")}:
                  </span>{" "}
                  {err.error}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  // Return loading state during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-lg text-center flex flex-col items-center">
          <RingLoader color="#3b82f6" size={50} />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show initialization error
  if (initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-yellow-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Initialization Error</h3>
          <p className="text-gray-600 mb-4">{initializationError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-lg text-center flex flex-col items-center">
          <RingLoader color="#3b82f6" size={50} />
          <p className="mt-4 text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  return (
    <RegistrationLayout>
      <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        {showFullScreenLoader && (
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
              <RingLoader
                color="#3b82f6"
                size={80}
                loading={showFullScreenLoader}
              />
              <p className="mt-6 text-gray-700 font-medium text-lg">
                Creating your account...
              </p>
              <p className="mt-2 text-gray-500 text-sm">
                This may take a few moments
              </p>
            </div>
          </div>
        )}
        <div className="max-w-6xl w-full bg-white rounded-2xl shadow-lg overflow-hidden relative border border-gray-100">
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 h-1.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="p-6 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-sm">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    Create Your Individual Account
                  </h2>
                  <p className="text-gray-500 mt-1.5">
                    Complete your profile to get started with our platform
                  </p>
                </div>
              </div>
              <div className="bg-blue-50/60 px-4 py-2.5 rounded-xl border border-blue-100">
                <p className="text-blue-700 text-sm font-semibold flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                  Progress: {progress}% complete
                </p>
              </div>
            </div>

            {/* Navigation Tabs - WITH CLICKABLE SWIPE HINT */}
            <div className="mb-4">
              {/* Swipe hint text - Only shows on mobile */}
              <div className="flex justify-end mb-2 px-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => {
                    // Find the tabs container and scroll to the end
                    const tabsContainer = document.querySelector('.tabs-scroll-container');
                    if (tabsContainer) {
                      tabsContainer.scrollTo({
                        left: tabsContainer.scrollWidth,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors"
                >
                  <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Swipe to see more
                </button>
              </div>

              {/* Scrollable tabs */}
              <div className="tabs-scroll-container flex overflow-x-auto overflow-y-hidden scroll-smooth gap-1 md:gap-2 pb-2 hide-scrollbar">
                {formSections.map((section, idx) => {
                  const isSectionValid = sectionErrors[idx]?.length === 0;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        // Only allow navigation if previous sections are valid
                        let canNavigate = true;
                        for (let i = 0; i < idx; i++) {
                          if (sectionErrors[i]?.length > 0) {
                            canNavigate = false;
                            toast.error(`Please complete section ${i + 1} first`);
                            break;
                          }
                        }
                        if (canNavigate) {
                          setActiveSection(idx);
                        }
                      }}
                      className={`flex-shrink-0 whitespace-nowrap px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm font-medium transition-all duration-300 relative ${activeSection === idx
                          ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50/50 rounded-t-lg"
                          : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
                        } ${!isSectionValid ? "border-b-2 border-red-500" : ""}`}
                    >
                      {/* Show full text on tablet/desktop, abbreviated on mobile */}
                      <span className="hidden sm:inline">{section}</span>
                      <span className="sm:hidden">
                        {idx === 0 && "Personal"}
                        {idx === 1 && "Contact"}
                        {idx === 2 && "Identity"}
                        {idx === 3 && "Security"}
                        {idx === 4 && "Terms"}
                      </span>

                      {activeSection === idx && (
                        <span className="ml-1 md:ml-2 bg-blue-100 text-blue-800 text-xs px-1.5 md:px-2 py-0.5 rounded-full">
                          {idx + 1}
                        </span>
                      )}
                      {!isSectionValid && (
                        <span className="absolute -top-1 -right-1">
                          <FontAwesomeIcon
                            icon={faExclamationCircle}
                            className="text-red-500 text-xs"
                          />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Form */}
            <form
              onSubmit={formik.handleSubmit}
              className="space-y-6"
              noValidate
            >
              {/* Personal Information Section */}
              <section className={`${activeSection !== 0 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm mr-3 shadow-sm">
                    1
                  </span>
                  Personal Information
                </h3>

                {renderSectionErrors(0)}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      id: "first_name",
                      label: "First Name *",
                      type: "text",
                      placeholder: "Enter your first name",
                    },
                    {
                      id: "middle_name",
                      label: "Middle Name",
                      type: "text",
                      placeholder: "Enter your middle name (optional)",
                    },
                    {
                      id: "last_name",
                      label: "Last Name *",
                      type: "text",
                      placeholder: "Enter your last name",
                    },
                    {
                      id: "email",
                      label: "Email Address *",
                      type: "email",
                      placeholder: "your.email@example.com",
                    },
                    {
                      id: "dob",
                      label: "Date of Birth *",
                      type: "date",
                      max: new Date(
                        new Date().setFullYear(new Date().getFullYear() - 18),
                      )
                        .toISOString()
                        .split("T")[0],
                    },
                  ].map(({ id, label, type, placeholder, max }) => (
                    <div key={id} className="relative">
                      <label
                        htmlFor={id}
                        className="block text-sm font-medium text-gray-700 mb-2.5"
                      >
                        {label}
                      </label>
                      <input
                        id={id}
                        name={id}
                        type={type}
                        placeholder={placeholder}
                        max={max}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values[id]}
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${formik.touched[id] && formik.errors[id]
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                          } shadow-sm`}
                      />
                      {formik.touched[id] && formik.errors[id] ? (
                        <p className="text-red-500 text-xs mt-2 flex items-center">
                          <svg
                            className="w-3.5 h-3.5 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {formik.errors[id]}
                        </p>
                      ) : null}
                    </div>
                  ))}

                  <div>
                    <label
                      htmlFor="nationality"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      Nationality *
                    </label>

                    {isLoadingNationalities ? (
                      <div className="flex items-center justify-center py-3 border border-gray-200 rounded-xl bg-gray-50">
                        <RingLoader size={20} color="#3b82f6" />
                        <span className="ml-2 text-gray-600">
                          Loading nationalities...
                        </span>
                      </div>
                    ) : (
                      <Select
                        id="nationality"
                        name="nationality"
                        options={nationalityOptions}
                        onChange={handleNationalityChange}
                        onBlur={formik.handleBlur}
                        className="basic-single"
                        classNamePrefix="select"
                        placeholder="Select Nationality"
                        styles={{
                          ...customStyles,
                          control: (provided, state) => ({
                            ...provided,
                            minHeight: "52px",
                            borderRadius: "12px",
                            borderColor:
                              formik.touched.nationality &&
                                formik.errors.nationality
                                ? "#f87171"
                                : "#e5e7eb",
                            boxShadow: state.isFocused
                              ? formik.touched.nationality &&
                                formik.errors.nationality
                                ? "0 0 0 3px rgba(248, 113, 113, 0.1)"
                                : "0 0 0 3px rgba(59, 130, 246, 0.1)"
                              : "none",
                            "&:hover": {
                              borderColor:
                                formik.touched.nationality &&
                                  formik.errors.nationality
                                  ? "#ef4444"
                                  : "#3b82f6",
                            },
                          }),
                        }}
                        value={
                          nationalityOptions.find(
                            (opt) => opt.value === formik.values.nationality,
                          ) || null
                        }
                      />
                    )}

                    {formik.touched.nationality && formik.errors.nationality ? (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.nationality}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      Gender *
                    </label>
                    <Select
                      id="gender"
                      name="gender"
                      options={genderOptions}
                      onChange={handleGenderChange}
                      onBlur={formik.handleBlur}
                      className="basic-single"
                      classNamePrefix="select"
                      placeholder="Select Gender"
                      styles={{
                        ...customStyles,
                        control: (provided, state) => ({
                          ...provided,
                          minHeight: "52px",
                          borderRadius: "12px",
                          borderColor:
                            formik.touched.gender && formik.errors.gender
                              ? "#f87171"
                              : "#e5e7eb",
                          boxShadow: state.isFocused
                            ? formik.touched.gender && formik.errors.gender
                              ? "0 0 0 3px rgba(248, 113, 113, 0.1)"
                              : "0 0 0 3px rgba(59, 130, 246, 0.1)"
                            : "none",
                          "&:hover": {
                            borderColor:
                              formik.touched.gender && formik.errors.gender
                                ? "#ef4444"
                                : "#3b82f6",
                          },
                        }),
                      }}
                      value={
                        genderOptions.find(
                          (opt) => opt.value === formik.values.gender,
                        ) || null
                      }
                    />
                    {formik.touched.gender && formik.errors.gender ? (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.gender}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex justify-end mt-10">
                  <button
                    type="button"
                    onClick={() => handleNextSection(0)}
                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center group"
                  >
                    Next: Contact Information
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </section>

              {/* Contact Information Section - REORDERED ADDRESS FIELDS */}
              <section className={`${activeSection !== 1 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm mr-3 shadow-sm">
                    2
                  </span>
                  Contact Information
                </h3>

                {renderSectionErrors(1)}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Country Dropdown - FIRST as per requirements */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      Country *
                    </label>
                    <Select
                      id="country"
                      name="country"
                      options={countryOptions}
                      onChange={handleCountrySelect}
                      onBlur={formik.handleBlur}
                      className="basic-single"
                      classNamePrefix="select"
                      styles={customStyles}
                      placeholder="Select Country"
                      value={selectedCountry}
                      isLoading={loadingCountries}
                    />
                    {formik.touched.country && formik.errors.country ? (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.country}
                      </p>
                    ) : null}
                  </div>

                  {/* ZIP Code - SECOND as per requirements */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="zip_code"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      ZIP/Postal Code *
                      
                    </label>
                    <div className="relative">
                      <input
                        id="zip_code"
                        name="zip_code"
                        type="text"
                        placeholder={
                          selectedCountry?.label === "United States"
                            ? "e.g., 10155"
                            : "Postal code"
                        }
                        onChange={handleZipCodeChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.zip_code}
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pr-12 ${formik.touched.zip_code && formik.errors.zip_code
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                          } shadow-sm`}
                      />

                      {/* Loading indicator for ZIP lookup */}
                      {zipLookup.loading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                          <RingLoader size={16} color="#3b82f6" />
                        </div>
                      )}

                      {/* Success indicator */}
                      {!zipLookup.loading &&
                        formik.values.state &&
                        formik.values.city && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                            <FontAwesomeIcon icon={faCheckCircle} />
                          </div>
                        )}
                    </div>

                    {formik.touched.zip_code && formik.errors.zip_code ? (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.zip_code}
                      </p>
                    ) : null}

                    {zipLookup.error && (
                      <p className="text-yellow-600 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {zipLookup.error.message}
                      </p>
                    )}

                    {selectedCountry && (
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your {selectedCountry.label} ZIP/postal code to
                        auto-fill state and city
                      </p>
                    )}
                  </div>

                  {/* Street Address 1 - THIRD as per requirements */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="street_address_1"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      Street Address *
                    </label>
                    <input
                      id="street_address_1"
                      name="street_address_1"
                      type="text"
                      placeholder="123 Main St"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.street_address_1}
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${formik.touched.street_address_1 &&
                        formik.errors.street_address_1
                        ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                        : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                        } shadow-sm`}
                    />
                    {formik.touched.street_address_1 &&
                      formik.errors.street_address_1 ? (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.street_address_1}
                      </p>
                    ) : null}
                  </div>

                  {/* Street Address 2 (Optional) - FOURTH as per requirements */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="street_address_2"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      Street Address 2/Suite Address (Optional)
                    </label>
                    <input
                      id="street_address_2"
                      name="street_address_2"
                      type="text"
                      placeholder="Apt, suite, unit, etc."
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.street_address_2}
                      className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm"
                    />
                  </div>

                  {/* City - FIFTH as per requirements */}
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      City *
                      {formik.values.city && zipLookup.data && (
                        <span className="ml-2 text-xs text-green-600 font-normal">
                          ✓ Auto-filled
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="city"
                        name="city"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.city}
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${formik.touched.city && formik.errors.city
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                          } shadow-sm`}
                        placeholder="City"
                        readOnly={false}
                      />
                      {zipLookup.loading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                          <RingLoader size={16} color="#3b82f6" />
                        </div>
                      )}
                    </div>

                    {formik.touched.city && formik.errors.city ? (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.city}
                      </p>
                    ) : null}
                  </div>

                  {/* State - SIXTH as per requirements */}
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      State/Province *
                      {formik.values.state && zipLookup.data && (
                        <span className="ml-2 text-xs text-green-600 font-normal">
                          ✓ Auto-filled
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="state"
                        name="state"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.state}
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${formik.touched.state && formik.errors.state
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                          } shadow-sm`}
                        placeholder="State"
                        readOnly={false}
                      />
                      {zipLookup.loading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                          <RingLoader size={16} color="#3b82f6" />
                        </div>
                      )}
                    </div>

                    {formik.touched.state && formik.errors.state ? (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.state}
                      </p>
                    ) : null}
                  </div>

                  {/* Phone Number - SEVENTH as per requirements */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="mobile_number"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      Phone Number *
                    </label>
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="w-full md:w-1/3">
                        <Select
                          id="mobilenumber_countrycode"
                          name="mobilenumber_countrycode"
                          options={countryOptions}
                          onChange={handleCountryCodeSelect}
                          onBlur={formik.handleBlur}
                          className="basic-single"
                          classNamePrefix="select"
                          styles={customStyles}
                          placeholder="Country Code"
                          value={selectedPhoneCode}
                          formatOptionLabel={({ phoneCode, label }) => (
                            <div className="flex items-center">
                              <span className="text-gray-600 mr-2">
                                {phoneCode}
                              </span>
                              <span>{label}</span>
                            </div>
                          )}
                        />
                        {formik.touched.mobilenumber_countrycode &&
                          formik.errors.mobilenumber_countrycode ? (
                          <p className="text-red-500 text-xs mt-2 flex items-center">
                            <svg
                              className="w-3.5 h-3.5 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {formik.errors.mobilenumber_countrycode}
                          </p>
                        ) : null}
                      </div>
                      <div className="w-full md:w-2/3">
                        <input
                          type="text"
                          id="mobile_number"
                          name="mobile_number"
                          onChange={handlePhoneChange}
                          onKeyPress={handlePhoneKeyPress}
                          onBlur={formik.handleBlur}
                          value={formik.values.mobile_number}
                          className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${formik.touched.mobile_number &&
                            formik.errors.mobile_number
                            ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                            : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                            } shadow-sm`}
                          placeholder="9813017273"
                          maxLength={10}
                        />
                        {formik.touched.mobile_number &&
                          formik.errors.mobile_number ? (
                          <p className="text-red-500 text-xs mt-2 flex items-center">
                            <svg
                              className="w-3.5 h-3.5 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {formik.errors.mobile_number}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-10">
                  <button
                    type="button"
                    onClick={() => handlePreviousSection(1)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 shadow-sm flex items-center group"
                  >
                    <svg
                      className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNextSection(1)}
                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center group"
                  >
                    Next: Identity Verification
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </section>

              {/* Identity Verification Section */}
              <section className={`${activeSection !== 2 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm mr-3 shadow-sm">
                    3
                  </span>
                  Identity Verification
                </h3>

                {renderSectionErrors(2)}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shouldShowSSNField && (
                    <div className="md:col-span-2">
                      <label
                        htmlFor="ssn"
                        className="block text-sm font-medium text-gray-700 mb-2.5"
                      >
                        Social Security Number (SSN) *
                        <span className="text-gray-500 text-xs ml-2">
                          {isNamedAccount
                            ? "(Required for USD Named Accounts with US registration)"
                            : "(Required for Remittance Services with US registration)"}
                        </span>
                      </label>

                      <div className="relative">
                        <input
                          type={showSSN ? "text" : "password"}
                          id="ssn"
                          name="ssn"
                          onChange={handleSSNChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.ssn}
                          className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pr-12 ${(formik.touched.ssn && formik.errors.ssn) || ssnError
                            ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                            : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                            } shadow-sm`}
                          placeholder="XXX-XX-XXXX"
                          maxLength={11}
                        />

                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                          onClick={() => setShowSSN(!showSSN)}
                          tabIndex={-1}
                          aria-label={showSSN ? "Hide SSN" : "Show SSN"}
                        >
                          <FontAwesomeIcon icon={showSSN ? faEyeSlash : faEye} />
                        </button>
                      </div>

                      {(formik.touched.ssn && formik.errors.ssn) || ssnError ? (
                        <p className="text-red-500 text-xs mt-2 flex items-center">
                          <svg
                            className="w-3.5 h-3.5 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {formik.errors.ssn || ssnError}
                        </p>
                      ) : null}

                      <p className="text-xs text-gray-500 mt-1">
                        {isNamedAccount
                          ? "Social Security Number is required for USD Named Accounts with United States as registered country."
                          : "Social Security Number is required for Remittance Services with United States as registered country."}
                      </p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Document Type *
                    </label>

                    {isLoadingDocumentTypes ? (
                      <div className="flex items-center justify-center py-3 border border-gray-200 rounded-xl bg-gray-50">
                        <RingLoader size={20} color="#3b82f6" />
                        <span className="ml-2 text-gray-600">
                          Loading document types...
                        </span>
                      </div>
                    ) : (
                      <select
                        name="idDocumentType" // This name must match Formik field
                        value={formik.values.idDocumentType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${!formik.values.idDocumentType &&
                          formik.touched.idDocumentType
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                          } shadow-sm`}
                      >
                        <option value="">-- Select ID Document Type --</option>
                        {idDocumentTypes.map((docType) => (
                          <option key={docType.name} value={docType.name}>
                            {docType.name}
                          </option>
                        ))}
                        <option value="other">Other</option>
                      </select>
                    )}
                    {formik.touched.idDocumentType &&
                      formik.errors.idDocumentType ? (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.idDocumentType}
                      </p>
                    ) : null}
                  </div>

                  {/* Other Document Type Input */}
                  {formik.values.idDocumentType === "other" && (
                    <div className="md:col-span-2">
                      <label
                        htmlFor="idDocumentTypeOther"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        ID Document Type (Other) *
                      </label>
                      <input
                        type="text"
                        id="idDocumentTypeOther"
                        name="idDocumentTypeOther"
                        value={formik.values.idDocumentTypeOther}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm"
                        placeholder="Specify document type"
                      />
                      {formik.touched.idDocumentTypeOther &&
                        formik.errors.idDocumentTypeOther && (
                          <p className="text-red-500 text-xs mt-2">
                            {formik.errors.idDocumentTypeOther}
                          </p>
                        )}
                    </div>
                  )}

                  {/* Document Number */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Document Number *
                    </label>
                    <input
                      type="text"
                      name="idDocumentNumber"
                      value={formik.values.idDocumentNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${!formik.values.idDocumentNumber &&
                        formik.touched.idDocumentNumber
                        ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                        : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                        } shadow-sm`}
                      placeholder="Enter document number"
                    />
                    {formik.touched.idDocumentNumber &&
                      formik.errors.idDocumentNumber ? (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.idDocumentNumber}
                      </p>
                    ) : null}
                  </div>

                  {/* Issuing Country - Using react-select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Issuing Country *
                    </label>
                    <Select
                      id="idIssuedCountryCode"
                      name="idIssuedCountryCode"
                      options={countries.map((country) => ({
                        value: country.country_code,
                        label: country.name,
                      }))}
                      onChange={(selectedOption) => {
                        formik.setFieldValue(
                          "idIssuedCountryCode",
                          selectedOption?.value || "",
                        );
                      }}
                      onBlur={formik.handleBlur}
                      value={
                        countries
                          .map((country) => ({
                            value: country.country_code,
                            label: country.name,
                          }))
                          .find(
                            (option) =>
                              option.value ===
                              formik.values.idIssuedCountryCode,
                          ) || null
                      }
                      className="basic-single"
                      classNamePrefix="select"
                      placeholder="Select Issuing Country"
                      styles={{
                        ...customStyles,
                        control: (provided, state) => ({
                          ...provided,
                          minHeight: "52px",
                          borderRadius: "12px",
                          borderColor:
                            formik.touched.idIssuedCountryCode &&
                              formik.errors.idIssuedCountryCode
                              ? "#f87171"
                              : "#e5e7eb",
                          boxShadow: state.isFocused
                            ? formik.touched.idIssuedCountryCode &&
                              formik.errors.idIssuedCountryCode
                              ? "0 0 0 3px rgba(248, 113, 113, 0.1)"
                              : "0 0 0 3px rgba(59, 130, 246, 0.1)"
                            : "none",
                          "&:hover": {
                            borderColor:
                              formik.touched.idIssuedCountryCode &&
                                formik.errors.idIssuedCountryCode
                                ? "#ef4444"
                                : "#3b82f6",
                          },
                        }),
                      }}
                    />
                    {formik.touched.idIssuedCountryCode &&
                      formik.errors.idIssuedCountryCode && (
                        <p className="text-red-500 text-xs mt-2 flex items-center">
                          <svg
                            className="w-3.5 h-3.5 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {formik.errors.idIssuedCountryCode}
                        </p>
                      )}
                  </div>

                  {/* Issue Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="idIssuedDate"
                      value={formik.values.idIssuedDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${!formik.values.idIssuedDate &&
                        formik.touched.idIssuedDate
                        ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                        : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                        } shadow-sm`}
                    />
                    {formik.touched.idIssuedDate &&
                      formik.errors.idIssuedDate && (
                        <p className="text-red-500 text-xs mt-2">
                          {formik.errors.idIssuedDate}
                        </p>
                      )}
                  </div>
                </div>

                <div className="flex justify-between mt-10">
                  <button
                    type="button"
                    onClick={() => handlePreviousSection(2)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 shadow-sm flex items-center group"
                  >
                    <svg
                      className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNextSection(2)}
                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center group"
                  >
                    Next: Security
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </section>

              {/* Security Section */}
              <section className={`${activeSection !== 3 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm mr-3 shadow-sm">
                    4
                  </span>
                  Security
                </h3>

                {renderSectionErrors(3)}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        id="password"
                        name="password"
                        onChange={handlePasswordChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.password}
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pr-12 ${formik.touched.password && formik.errors.password
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                          } shadow-sm`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        tabIndex={-1}
                      >
                        <FontAwesomeIcon
                          icon={passwordVisible ? faEyeSlash : faEye}
                        />
                      </button>
                    </div>
                    {formik.touched.password && formik.errors.password && (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.password}
                      </p>
                    )}

                    <div className="mt-6 bg-blue-50/60 p-5 rounded-xl border border-blue-100">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Password Requirements:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-2.5">
                        {validationRules.map((rule, idx) => (
                          <li
                            key={idx}
                            className={`flex items-center ${isRuleMet(rule.regex)
                              ? "text-green-600"
                              : "text-gray-500"
                              }`}
                          >
                            {isRuleMet(rule.regex) ? (
                              <FontAwesomeIcon
                                icon={faCheckCircle}
                                className="mr-2.5 text-green-500"
                              />
                            ) : (
                              <svg
                                className="w-4 h-4 mr-2.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                            {rule.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={confirmPasswordVisible ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        onChange={handleConfirmPasswordChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.confirmPassword}
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pr-12 ${formik.touched.confirmPassword &&
                          formik.errors.confirmPassword
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : formik.values.confirmPassword &&
                            formik.values.password ===
                            formik.values.confirmPassword
                            ? "border-green-400 focus:ring-green-500/30 focus:border-green-500"
                            : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                          } shadow-sm`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={() =>
                          setConfirmPasswordVisible(!confirmPasswordVisible)
                        }
                        tabIndex={-1}
                      >
                        <FontAwesomeIcon
                          icon={confirmPasswordVisible ? faEyeSlash : faEye}
                        />
                      </button>

                      {/* Show green checkmark when passwords match */}
                      {formik.values.password &&
                        formik.values.confirmPassword &&
                        !formik.errors.confirmPassword &&
                        formik.values.password ===
                        formik.values.confirmPassword && (
                          <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-green-500">
                            <FontAwesomeIcon icon={faCheckCircle} />
                          </div>
                        )}
                    </div>

                    {/* Only show errors when passwords don't match */}
                    {formik.touched.confirmPassword &&
                      formik.errors.confirmPassword ? (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formik.errors.confirmPassword}
                      </p>
                    ) : null}

                    {/* Show green success message when passwords match and both fields have values */}
                    {formik.values.password &&
                      formik.values.confirmPassword &&
                      !formik.errors.confirmPassword &&
                      formik.values.password ===
                      formik.values.confirmPassword && (
                        <p className="text-green-600 text-xs mt-2 flex items-center">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="mr-1"
                          />
                          Passwords match
                        </p>
                      )}
                  </div>
                </div>

                <div className="flex justify-between mt-10">
                  <button
                    type="button"
                    onClick={() => handlePreviousSection(3)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 shadow-sm flex items-center group"
                  >
                    <svg
                      className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNextSection(3)}
                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center group"
                  >
                    Next: Terms & Conditions
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </section>

              {/* Terms & Conditions Section */}
              <section className={`${activeSection !== 4 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm mr-3 shadow-sm">
                    5
                  </span>
                  Terms & Conditions
                </h3>

                {/* Show all form errors if any */}
                {renderAllFormErrors()}

                {termsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <RingLoader color="#3b82f6" size={30} />
                    <span className="ml-3 text-gray-600">
                      Loading terms and conditions...
                    </span>
                  </div>
                ) : termsError ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-yellow-600 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-yellow-700 text-sm font-medium">
                          Unable to load terms and conditions
                        </p>
                        <p className="text-yellow-600 text-xs mt-1">
                          You can still proceed with registration. Please
                          contact support if you need to review the terms.
                        </p>
                        <button
                          onClick={() => dispatch(fetchTermsAndConditions())}
                          className="text-yellow-700 underline text-xs mt-2"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                ) : termsConditions.length > 0 ? (
                  <>
                    <div className="max-h-96 overflow-auto space-y-4 mb-8 p-1 border border-gray-200 rounded-xl bg-gray-50/30">
                      {termsConditions.map((term) => (
                        <div
                          key={term.id}
                          className="flex items-start bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <input
                            type="checkbox"
                            id={`term-${term.id}`}
                            checked={acceptedTerms.some(
                              (item) => item.id === term.id,
                            )}
                            onChange={() => handleCheckboxChange(term.id)}
                            className="mt-1 mr-4 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`term-${term.id}`}
                            className="text-sm text-gray-700 flex-1"
                          >
                            <span className="font-medium">{term.title}</span> -{" "}
                            <a
                              href={term.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                            >
                              View Details
                            </a>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <p className="text-blue-700 text-sm">
                        <strong>Note:</strong> You must accept all terms and
                        conditions to continue with registration.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg mb-6">
                    <p className="text-green-700 text-sm">
                      <strong>No additional terms required:</strong> You can
                      proceed with registration.
                    </p>
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-0">
                  <button
                    type="button"
                    onClick={() => handlePreviousSection(4)}
                    className="px-4 md:px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 shadow-sm flex items-center justify-center group order-2 md:order-1 w-full md:w-auto"
                  >
                    <svg
                      className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </button>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-1 md:order-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="px-4 md:px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center group w-full sm:w-auto"
                    >
                      {isCancelling ? (
                        <>
                          <RingLoader
                            size={20}
                            color="#ffffff"
                            className="mr-2"
                          />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Cancel
                        </>
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        progress < 95 ||
                        (termsConditions.length > 0 &&
                          acceptedTerms.length !== termsConditions.length) ||
                        (shouldShowSSNField && (!formik.values.ssn || formik.values.ssn.replace(/-/g, "").length !== 9))
                      }
                      className="px-4 md:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center group w-full sm:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <RingLoader
                            size={20}
                            color="#ffffff"
                            className="mr-2"
                          />
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Create Account
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>
            </form>

            <ToastContainer
              position="top-right"
              autoClose={1000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />

            {isModalOpen && (
              <ErrorModal
                message={errorMessage}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => navigate("/")}
              />
            )}

            {isSuccessModalOpen && (
              <SuccessModal
                message={successMessage}
                onClose={() => setIsSuccessModalOpen(false)}
              />
            )}

            {showSSNConfirmation && (
              <SSNConfirmationPopup
                onClose={() => handleSSNConfirmation(false)}
                onConfirm={() => handleSSNConfirmation(true)}
              />
            )}
          </div>
        </div>
      </div>
    </RegistrationLayout>
  );
}

// Main export with Error Boundary
export default function SignUpIndividual() {
  return (
    <ErrorBoundary>
      <SignUpIndividualContent />
    </ErrorBoundary>
  );
}