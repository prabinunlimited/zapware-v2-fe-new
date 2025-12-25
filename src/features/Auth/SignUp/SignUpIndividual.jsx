import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faCheckCircle,
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

  const [isCancelling, setIsCancelling] = useState(false);
  const [showSSN, setShowSSN] = useState(false);

  const [zipDebounceTimer, setZipDebounceTimer] = useState(null);
  const [isZipLoading, setIsZipLoading] = useState(false);

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

  // Create validation schema with better error handling
const createValidationSchema = () => {
  try {
    return Yup.object({
      first_name: Yup.string().required("First name is required"),
      last_name: Yup.string().required("Last name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(12, "Password must be at least 12 characters")
        .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
        .matches(
          /[!@#$%^&*(),.?":{}|<>]/,
          "Password must contain at least one special character"
        )
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Confirm password is required"),
      mobile_number: Yup.string()
        .required("Phone number is required")
        .matches(/^\d{10}$/, "Phone number must be 10 digits"),
      street_address_1: Yup.string().required("Street address is required"),
      city: Yup.string().required("City is required"),
      state: Yup.string().required("State/Province is required"),
      zip_code: Yup.string().required("ZIP/Postal code is required"),
      country: Yup.mixed().required("Country is required"), // Changed to mixed
      nationality: Yup.mixed().required("Nationality is required"), // Changed to mixed
      gender: Yup.mixed().required("Gender is required"), // Changed to mixed
      dob: Yup.date()
        .required("Date of birth is required")
        .max(
          new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
          "You must be at least 18 years old"
        ),
      mobilenumber_countrycode: Yup.mixed().required("Country code is required"), // Changed to mixed
      idDocumentType: Yup.string().test(
        "id-document-type",
        "Please select an ID document type",
        function (value) {
          return value && value.trim() !== "";
        }
      ),
      idDocumentNumber: Yup.string().test(
        "id-document-number",
        "Please enter ID document number",
        function (value) {
          return value && value.trim() !== "";
        }
      ),
      idIssuedDate: Yup.string().test(
        "id-issued-date",
        "Please select ID expiry date",
        function (value) {
          return value && value.trim() !== "";
        }
      ),
      idIssuedCountryCode: Yup.string().test(
        "id-issued-country",
        "Please select issuing country",
        function (value) {
          return value && value.trim() !== "";
        }
      ),
      idDocumentTypeOther: Yup.string().when("idDocumentType", {
        is: "other",
        then: Yup.string()
          .required("Please specify document type for 'Other'")
          .min(2, "Document type must be at least 2 characters"),
        otherwise: Yup.string().notRequired(),
      }),
    });
  } catch (error) {
    console.error("❌ Error creating validation schema:", error);
    // Return a basic schema as fallback
    return Yup.object({
      first_name: Yup.string().required("First name is required"),
      last_name: Yup.string().required("Last name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string().required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Confirm password is required"),
    });
  }
};

  // Enhanced formik configuration with better error handling
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
      idIssuedCountryCode: "US",
      idDocumentTypeOther: "",
      accept_sms: 0,
      accept_privacy_policy: 0,
      accept_disclosure: 0,
      accept_fees: 0,
      showSSNField: showSSNField,
      isNamedAccount: isNamedAccount,
      selectedAccounts: selectedAccounts,
    },
    // validationSchema: createValidationSchema(),
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
          acceptedTerms.length === 0
        ) {
          setErrorMessage("Please accept the terms and conditions");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        // Check Formik values for ID fields
        if (!values.idDocumentType || values.idDocumentType.trim() === "") {
          setErrorMessage("Please select an ID document type");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        if (!values.idDocumentNumber || values.idDocumentNumber.trim() === "") {
          setErrorMessage("Please enter ID document number");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        if (!values.idIssuedDate || values.idIssuedDate.trim() === "") {
          setErrorMessage("Please select ID expiry date");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        if (
          !values.idIssuedCountryCode ||
          values.idIssuedCountryCode.trim() === ""
        ) {
          setErrorMessage("Please select issuing country");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        // Conditional validation for "other" document type
        if (
          values.idDocumentType === "other" &&
          (!values.idDocumentTypeOther ||
            values.idDocumentTypeOther.trim() === "")
        ) {
          setErrorMessage("Please specify document type for 'Other'");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        const hasUSDNamedAccount = isNamedAccount;
        const isRemittanceOnly = isRemit;

        // Determine if country is United States
        const isUSCountry =
          values.country === "United States" || values.country === 186;

        console.log("🔍 SSN Validation Check:", {
          hasUSDNamedAccount,
          isRemittanceOnly,
          isUSCountry,
          ssnValue: values.ssn,
          countryValue: values.country,
        });

        if (
          (hasUSDNamedAccount && isUSCountry) ||
          (isRemittanceOnly && isUSCountry)
        ) {
          const cleanSSN = values.ssn?.replace(/-/g, "") || "";

          if (!values.ssn || values.ssn.trim() === "") {
            setErrorMessage(
              hasUSDNamedAccount
                ? "SSN is required for USD Named Accounts with United States as registered country"
                : "SSN is required for Remittance Services with United States as registered country"
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
              setMetadataField({ field: "showSSNConfirmation", value: true })
            );
            setIsSubmitting(false);
            setShowFullScreenLoader(false);
            return;
          }
        }

        // Debug: log what's being validated
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
        setErrorMessage(`An error occurred during form validation: ${error.message}`);
        setIsModalOpen(true);
        setIsSubmitting(false);
        setShowFullScreenLoader(false);
      } finally {
        setSubmitting(false);
      }
    },
  });

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
        isPartnerPackageModule: "N",
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
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === "" || cleanedData[key] === null || cleanedData[key] === undefined) {
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

          // Navigate to phone verification
          navigate("/phoneverification", {
            state: {
              mobileNumber: `${cleanedData.mobilenumber_countrycode} ${cleanedData.mobile_number}`,
              kyc_verify: kyc_verify,
              customerData: responseData.data || null,
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
      setErrorMessage(error.message || "An unexpected error occurred during submission.");
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
          })
        );

        dispatch(
          setMetadataField({
            field: "isUSDSelected",
            value: isNamedAccount || false,
          })
        );

        // Sync isNamedAccount field for SSN logic
        dispatch(
          setMetadataField({
            field: "isNamedAccount",
            value: isNamedAccount || false,
          })
        );

        // Get partner token if needed
        try {
          console.log("🔄 Attempting to get partner token...");
          const { getBearerToken } = await import(
            "../../../services/authService"
          );
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
              })
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
              })
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
              })
          );
        } else {
          console.log(
            "✅ ID Document Types already loaded:",
            idDocumentTypes.length
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
                  terms?.length || 0
                );
                return terms;
              })
              .catch((error) => {
                console.error("❌ Terms fetch error in component:", error);
                return [];
              })
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
            }, 30000)
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
        setIsZipLoading(true);

        // Use Redux action to fetch location by ZIP
        const resultAction = await dispatch(
          fetchLocationByZip({ countryCode, zipCode })
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
      } finally {
        setIsZipLoading(false);
      }
    },
    [dispatch, formik]
  );

  const handleCountryCodeSelect = (selectedOption) => {
    formik.setFieldValue(
      "mobilenumber_countrycode",
      selectedOption?.phoneCode || ""
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
              `https://ipapi.co/${ip}/json/`
            );
            if (locationResponse.ok) {
              const locationData = await locationResponse.json();
              location = `${locationData.city || "Unknown"}, ${
                locationData.region || "Unknown"
              }, ${locationData.country_name || "Unknown"}`;
            }
          }

          if (typeof UAParser !== "undefined") {
            const parser = new UAParser();
            const deviceInfo = parser.getResult();
            device = `${deviceInfo.os.name || "Unknown"} on ${
              deviceInfo.device.model || "Unknown Device"
            }`;
          }
        } catch (deviceError) {}

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
          })
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
          })
        );
      }
    },
    [dispatch, acceptedTerms]
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

  // Progress calculation
  useEffect(() => {
    const calculateProgress = () => {
      const fieldChecks = [
        {
          name: "first_name",
          value: formik.values.first_name,
          filled: formik.values.first_name && formik.values.first_name.trim(),
        },
        {
          name: "last_name",
          value: formik.values.last_name,
          filled: formik.values.last_name && formik.values.last_name.trim(),
        },
        {
          name: "email",
          value: formik.values.email,
          filled: formik.values.email && formik.values.email.trim(),
        },
        {
          name: "dob",
          value: formik.values.dob,
          filled: formik.values.dob && formik.values.dob.trim(),
        },
        {
          name: "nationality",
          value: formik.values.nationality,
          filled:
            formik.values.nationality &&
            formik.values.nationality.toString().trim(),
        },
        {
          name: "gender",
          value: formik.values.gender,
          filled:
            formik.values.gender && formik.values.gender.toString().trim(),
        },
        {
          name: "mobilenumber_countrycode",
          value: formik.values.mobilenumber_countrycode,
          filled:
            formik.values.mobilenumber_countrycode &&
            formik.values.mobilenumber_countrycode.toString().trim(),
        },
        {
          name: "mobile_number",
          value: formik.values.mobile_number,
          filled:
            formik.values.mobile_number && formik.values.mobile_number.trim(),
        },
        {
          name: "street_address_1",
          value: formik.values.street_address_1,
          filled:
            formik.values.street_address_1 &&
            formik.values.street_address_1.trim(),
        },
        {
          name: "city",
          value: formik.values.city,
          filled: formik.values.city && formik.values.city.toString().trim(),
        },
        {
          name: "state",
          value: formik.values.state,
          filled: formik.values.state && formik.values.state.toString().trim(),
        },
        {
          name: "zip_code",
          value: formik.values.zip_code,
          filled: formik.values.zip_code && formik.values.zip_code.trim(),
        },
        {
          name: "country",
          value: formik.values.country,
          filled:
            formik.values.country && formik.values.country.toString().trim(),
        },
        // Formik values for ID fields
        {
          name: "idDocumentType",
          value: formik.values.idDocumentType,
          filled:
            formik.values.idDocumentType && formik.values.idDocumentType.trim(),
        },
        {
          name: "idDocumentNumber",
          value: formik.values.idDocumentNumber,
          filled:
            formik.values.idDocumentNumber &&
            formik.values.idDocumentNumber.trim(),
        },
        {
          name: "idIssuedDate",
          value: formik.values.idIssuedDate,
          filled:
            formik.values.idIssuedDate && formik.values.idIssuedDate.trim(),
        },
        {
          name: "idIssuedCountryCode",
          value: formik.values.idIssuedCountryCode,
          filled:
            formik.values.idIssuedCountryCode &&
            formik.values.idIssuedCountryCode.trim(),
        },
        {
          name: "password",
          value: formik.values.password,
          filled: formik.values.password && formik.values.password.trim(),
        },
        {
          name: "confirmPassword",
          value: formik.values.confirmPassword,
          filled:
            formik.values.confirmPassword &&
            formik.values.confirmPassword.trim(),
        },
      ];

      // Add idDocumentTypeOther if needed
      if (formik.values.idDocumentType === "other") {
        fieldChecks.push({
          name: "idDocumentTypeOther",
          value: formik.values.idDocumentTypeOther,
          filled:
            formik.values.idDocumentTypeOther &&
            formik.values.idDocumentTypeOther.trim(),
        });
      }

      // Use isNamedAccount and isRemit flags for SSN field requirement
      const hasUSDNamedAccount = isNamedAccount;
      const isRemittanceOnly = isRemit;
      const isUSCountry =
        formik.values.country === "United States" ||
        formik.values.country === 186;

      // Add SSN to required fields only if either condition is met
      if (
        (hasUSDNamedAccount && isUSCountry) ||
        (isRemittanceOnly && isUSCountry)
      ) {
        fieldChecks.push({
          name: "ssn",
          value: formik.values.ssn,
          filled: formik.values.ssn && formik.values.ssn.trim(),
        });
      }

      // Count filled fields
      let filledFields = fieldChecks.filter((field) => field.filled).length;
      const totalFields = fieldChecks.length;

      // Add terms and conditions to progress if applicable
      let termsField = 0;
      if (termsConditions.length > 0) {
        termsField = 1; // Terms section exists
        if (acceptedTerms.length > 0) {
          filledFields += 1; // Terms are accepted
        }
      }

      // Calculate percentage
      const totalWithTerms = totalFields + termsField;
      const percentage =
        totalWithTerms > 0
          ? Math.round((filledFields / totalWithTerms) * 100)
          : 0;

      // Optional: Debug log to see progress calculation
      console.log("📊 Progress Calculation:", {
        filledFields,
        totalFields,
        termsField,
        totalWithTerms,
        percentage,
        hasUSDNamedAccount,
        isRemittanceOnly,
        isUSCountry,
        ssnFilled: formik.values.ssn && formik.values.ssn.trim(),
        hasTerms: termsConditions.length > 0,
        termsAccepted: acceptedTerms.length > 0,
      });

      return percentage;
    };

    setProgress(calculateProgress());
  }, [
    formik.values,
    acceptedTerms,
    isNamedAccount, // Add isNamedAccount to dependencies
    isRemit, // Add isRemit to dependencies
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

  // Return loading state during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-lg text-center">
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
        <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-lg text-center">
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
          {isSubmitting && (
            <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
                <RingLoader color="#3b82f6" size={50} loading={isSubmitting} />
                <p className="mt-4 text-gray-600 font-medium">
                  Processing your request...
                </p>
              </div>
            </div>
          )}

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

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto mb-4 pb-1">
              {formSections.map((section, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSection(idx)}
                  className={`whitespace-nowrap px-5 py-3 text-sm font-medium transition-all duration-300 ${
                    activeSection === idx
                      ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50/50 rounded-t-lg"
                      : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
                  }`}
                >
                  {section}
                  {activeSection === idx && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {idx + 1}
                    </span>
                  )}
                </button>
              ))}
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
                        new Date().setFullYear(new Date().getFullYear() - 18)
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
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                          formik.touched[id] && formik.errors[id]
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
                            (opt) => opt.value === formik.values.nationality
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
                          (opt) => opt.value === formik.values.gender
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
                    onClick={() => setActiveSection(1)}
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
              {/* // Contact Information Section - ZIP CODE BASED ONLY (No dropdowns) */}
              <section className={`${activeSection !== 1 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm mr-3 shadow-sm">
                    2
                  </span>
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Country Dropdown */}
                  <div>
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

                  {/* ZIP Code - Auto-fills State and City */}
                  <div>
                    <label
                      htmlFor="zip_code"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      ZIP/Postal Code *
                      {selectedCountry && (
                        <span className="ml-2 text-xs text-green-600 font-normal">
                          ✓ Will auto-fill state & city
                        </span>
                      )}
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
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pr-12 ${
                          formik.touched.zip_code && formik.errors.zip_code
                            ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                            : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                        } shadow-sm`}
                      />

                      {/* Loading indicator for ZIP lookup */}
                      {zipLookup.loading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <RingLoader size={16} color="#3b82f6" />
                        </div>
                      )}
                      {(isZipLoading || zipLookup.loading) && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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

                  {/* State Field - Auto-filled by ZIP code API */}
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
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                          formik.touched.state && formik.errors.state
                            ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                            : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                        } shadow-sm`}
                        placeholder="Will auto-fill from ZIP code"
                        readOnly={false}
                      />
                      {zipLookup.loading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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

                  {/* City Field - Auto-filled by ZIP code API */}
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
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                          formik.touched.city && formik.errors.city
                            ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                            : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                        } shadow-sm`}
                        placeholder="Will auto-fill from ZIP code"
                        readOnly={false}
                      />
                      {zipLookup.loading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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

                  {/* Street Address 1 */}
                  <div>
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
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        formik.touched.street_address_1 &&
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

                  {/* Street Address 2 (Optional) */}
                  <div>
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

                  {/* Phone Number */}
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
                          className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                            formik.touched.mobile_number &&
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
                    onClick={() => setActiveSection(0)}
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
                    onClick={() => setActiveSection(2)}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(function () {
                    // Condition 1: Check if user has USD named account OR if it's remittance only
                    const hasUSDNamedAccount = isNamedAccount;
                    const isRemittanceOnly = isRemit; // Get from location state

                    // Condition 2: Check if user's country is United States
                    const selectedCountryOption = countryOptions.find(
                      (opt) => opt.value === formik.values.country
                    );
                    const isUSCountry =
                      formik.values.country === "United States" ||
                      formik.values.country === 186 ||
                      selectedCountryOption?.label === "United States";

                    // Render SSN field if EITHER:
                    // 1. Has USD named account AND is US country
                    // 2. OR is remittance only AND is US country
                    const shouldShowSSNField =
                      (hasUSDNamedAccount && isUSCountry) ||
                      (isRemittanceOnly && isUSCountry);

                    console.log("🔍 Individual SSN Field Conditions Check:", {
                      hasUSDNamedAccount,
                      isRemittanceOnly,
                      isUSCountry,
                      shouldShowSSNField,
                      countryValue: formik.values.country,
                      selectedCountryLabel: selectedCountryOption?.label,
                      isNamedAccount,
                    });

                    return shouldShowSSNField ? (
                      <div className="md:col-span-2">
                        <label
                          htmlFor="ssn"
                          className="block text-sm font-medium text-gray-700 mb-2.5"
                        >
                          Social Security Number (SSN) *
                          <span className="text-gray-500 text-xs ml-2">
                            {hasUSDNamedAccount
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
                            className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pr-12 ${
                              (formik.touched.ssn && formik.errors.ssn) ||
                              ssnError
                                ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                                : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                            } shadow-sm`}
                            placeholder="XXX-XX-XXXX"
                            maxLength={11}
                          />

                          {/* Eye toggle button */}
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                            onClick={() => setShowSSN(!showSSN)}
                            tabIndex={-1}
                            aria-label={showSSN ? "Hide SSN" : "Show SSN"}
                          >
                            <FontAwesomeIcon
                              icon={showSSN ? faEyeSlash : faEye}
                            />
                          </button>
                        </div>

                        {(formik.touched.ssn && formik.errors.ssn) ||
                        ssnError ? (
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
                          {hasUSDNamedAccount
                            ? "Social Security Number is required for USD Named Accounts with United States as registered country."
                            : "Social Security Number is required for Remittance Services with United States as registered country."}
                        </p>
                      </div>
                    ) : null;
                  })()}

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
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                          !formik.values.idDocumentType &&
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
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        !formik.values.idDocumentNumber &&
                        formik.touched.idDocumentNumber
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                      } shadow-sm`}
                      placeholder="Enter document number"
                    />
                  </div>

                  {/* Issuing Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Issuing Country *
                    </label>
                    <select
                      name="idIssuedCountryCode"
                      value={formik.values.idIssuedCountryCode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        !formik.values.idIssuedCountryCode &&
                        formik.touched.idIssuedCountryCode
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                      } shadow-sm`}
                    >
                      <option value="">Select Issuing Country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.country_code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    {formik.touched.idIssuedCountryCode &&
                      formik.errors.idIssuedCountryCode && (
                        <p className="text-red-500 text-xs mt-2">
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
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        !formik.values.idIssuedDate &&
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
                    onClick={() => setActiveSection(1)}
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
                    onClick={() => setActiveSection(3)}
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
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.password}
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pr-12 ${
                          formik.touched.password && formik.errors.password
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
                            className={`flex items-center ${
                              isRuleMet(rule.regex)
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
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.confirmPassword}
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pr-12 ${
                          formik.touched.confirmPassword &&
                          formik.errors.confirmPassword
                            ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
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
                    </div>
                    {formik.touched.confirmPassword &&
                      formik.errors.confirmPassword && (
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
                      )}
                    {formik.values.password &&
                      formik.values.confirmPassword &&
                      formik.values.password ===
                        formik.values.confirmPassword && (
                        <div className="text-green-600 text-sm mt-3 flex items-center bg-green-50/60 p-3 rounded-lg border border-green-200">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="mr-2"
                          />
                          Passwords match
                        </div>
                      )}
                  </div>
                </div>

                <div className="flex justify-between mt-10">
                  <button
                    type="button"
                    onClick={() => setActiveSection(2)}
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
                    onClick={() => setActiveSection(4)}
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
                              (item) => item.id === term.id
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

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveSection(3)}
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
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="px-6 py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center group"
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
                        progress < 100 ||
                        (termsConditions.length > 0 &&
                          acceptedTerms.length === 0)
                      }
                      className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center group"
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
              autoClose={5000}
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