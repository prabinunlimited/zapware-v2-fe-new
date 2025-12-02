// src/features/Auth/SignUp/SignUpIndividual.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { RingLoader, ClipLoader } from "react-spinners";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UAParser } from "ua-parser-js";
import ErrorModal from "../../../components/PopupModal/ErrorModal";
import SuccessModal from "../../../components/PopupModal/SuccessModal";
import RegistrationLayout from "../../../components/ProgressBar/RegistrationLayout";
import SSNConfirmationPopup from "../../../components/PopupModal/SSNConfirmationPopup";
import { tokenService } from "../../../services/authService";

// Redux imports
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCountries,
  fetchStates,
  fetchCities,
  setSelectedCountry,
  setSelectedState,
  setSelectedCity,
  selectCountries,
  selectStates,
  selectCities,
  selectSelectedCountry,
  selectSelectedState,
  selectSelectedCity,
  selectLocationLoading,
  selectHasStates,
  selectHasCities,
} from "../slices/locationSlice"; // Update this import

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
  setFormField,
  setMetadataField,
  selectNationalities,
  selectIdDocumentTypes,
  selectShowSSNField,
  selectHasNamedAccounts,
  selectIsUSDSelected,
  selectSSNError,
  selectShowSSNConfirmation,
  selectNationalitiesLoading,
  selectIdDocumentTypesLoading,
  submitIndividualSignup,
} from "../slices/signupSlice";

const API_URL = import.meta.env.VITE_API_URL;

// Error Boundary Component (keep as is)
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
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
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

  // New state variables for additional features
  const [selectedIdDocumentType, setSelectedIdDocumentType] = useState("");
  const [idDocumentTypeOther, setIdDocumentTypeOther] = useState("");
  const [idDocumentNumber, setIdDocumentNumber] = useState("");
  const [idIssuedCountryCode, setIdIssuedCountryCode] = useState("US");
  const [idIssuedDate, setIdIssuedDate] = useState("");
  const [ssnIssuedState, setSsnIssuedState] = useState("NY");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    console.log("🔍 Token check on mount:", {
      bearertoken: localStorage.getItem("bearertoken"),
      tokenServiceToken: tokenService.getToken(),
      authtoken: localStorage.getItem("authtoken"),
      timestamp: new Date().toISOString(),
    });
  }, []);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Redux selectors for location data
  const countries = useSelector(selectCountries) || [];
  const states = useSelector(selectStates) || [];
  const cities = useSelector(selectCities) || [];
  const selectedCountry = useSelector(selectSelectedCountry);
  const selectedState = useSelector(selectSelectedState);
  const selectedCity = useSelector(selectSelectedCity);
  const {
    countries: loadingCountries,
    states: loadingStates,
    cities: loadingCities,
  } = useSelector(selectLocationLoading);

  // Other Redux selectors
  const termsConditions = useSelector(selectTermsConditions) || [];
  const termsLoading = useSelector(selectTermsLoading);
  const termsError = useSelector(selectTermsError);
  const termsFetched = useSelector(selectTermsFetched);
  const acceptedTerms = useSelector(selectAcceptedTerms) || [];
  const nationalities = useSelector(selectNationalities) || [];
  const idDocumentTypes = useSelector(selectIdDocumentTypes) || [];

  const showSSNField = useSelector(selectShowSSNField);
  const hasNamedAccounts = useSelector(selectHasNamedAccounts);
  const isUSDSelected = useSelector(selectIsUSDSelected);
  const ssnError = useSelector(selectSSNError);
  const showSSNConfirmation = useSelector(selectShowSSNConfirmation);

  // Use proper selectors
  const isLoadingNationalities = useSelector(selectNationalitiesLoading);
  const isLoadingDocumentTypes = useSelector(selectIdDocumentTypesLoading);

  const hasStates = useSelector(selectHasStates);
  const hasCities = useSelector(selectHasCities);

  // Extract location state with defaults
  const {
    service_provide_ids = [],
    referral_code = "",
    agent_code = "",
    package_currencies = [],
    bank_accounts = [],
    kyc_verify = [],
    accountType = null,
    is_remit: isRemit = false,
    ssn_required = "N",
    show_remittance_only_on_registration = false,
    accountOptions = [],
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

  // Update validation schema for state/city
  const validationSchema = Yup.object({
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
    resident_country: Yup.string().required("Resident country is required"),
    street_address_1: Yup.string().required("Street address is required"),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State/Province is required"),
    zip_code: Yup.string().required("ZIP/Postal code is required"),
    country: Yup.string().required("Country is required"),
    nationality: Yup.string().required("Nationality is required"),
    gender: Yup.string().required("Gender is required"),
    dob: Yup.date()
      .required("Date of birth is required")
      .max(
        new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
        "You must be at least 18 years old"
      ),
    ssn: Yup.string().test(
      "ssn-conditional",
      "SSN must be in format XXX-XX-XXXX",
      function (value) {
        const { showSSNField, hasNamedAccounts } = this.parent;

        // If SSN is not required, don't validate
        if (!showSSNField || !hasNamedAccounts) {
          return true;
        }

        // If SSN is required, validate format
        if (!value) {
          return this.createError({
            message: "SSN is required for named accounts",
          });
        }

        const cleanSSN = value.replace(/-/g, "");
        return cleanSSN.length === 9 && /^\d+$/.test(cleanSSN);
      }
    ),
  });

  // Enhanced formik configuration
  const formik = useFormik({
    initialValues: {
      customer_type: "individual",
      first_name: "",
      last_name: "",
      email: "",
      resident_country: "",
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
      house_number: "",
      accept_sms: 0,
      accept_privacy_policy: 0,
      accept_disclosure: 0,
      accept_fees: 0,
      // Add metadata fields for validation
      showSSNField: showSSNField,
      hasNamedAccounts: hasNamedAccounts,
    },
    validationSchema: validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      try {
        setIsSubmitting(true);
        setShowFullScreenLoader(true);

        // Clear any previous SSN error
        dispatch(setMetadataField({ field: "ssnError", value: "" }));

        // Check if terms are accepted
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

        // Show SSN confirmation for named accounts
        if (
          showSSNField &&
          hasNamedAccounts &&
          values.ssn &&
          values.ssn.trim() !== ""
        ) {
          dispatch(
            setMetadataField({ field: "showSSNConfirmation", value: true })
          );
          setIsSubmitting(false);
          return;
        }

        await handleFormSubmission(values);
      } catch (error) {
        setErrorMessage("An error occurred during form validation");
        setIsModalOpen(true);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Handle form submission (keep as is)
  const handleFormSubmission = async (values) => {
    try {
      setShowFullScreenLoader(true);

      const updatedValues = {
        ...values,
        mobilenumber_countrycode: values.mobilenumber_countrycode,
        ssn: values.ssn ? values.ssn.replace(/-/g, "") : "",
        terms_and_conditions: termsFetched ? acceptedTerms : [],
        hostname: window.location.hostname,
        remit_customer: isRemit,
        bank_account_options: bank_accounts,
        isPartnerPackageModule: isPartnerPackageModule,
        package_currencies: package_currencies,
        whitelabelledpartnerid: whitelabelledpartnerid,
        kycVerify: kyc_verify,
        documentType: selectedIdDocumentType,
        idDocumentTypeOther: idDocumentTypeOther,
        ssnIssuedState: ssnIssuedState,
        issuingCountryCode: idIssuedCountryCode,
        documentNumber: idDocumentNumber,
        idIssuedDate: idIssuedDate,
      };

      // Use Redux action instead of direct fetch
      const resultAction = await dispatch(
        submitIndividualSignup(updatedValues)
      );

      if (submitIndividualSignup.fulfilled.match(resultAction)) {
        const responseData = resultAction.payload;

        setSuccessMessage(responseData.message || "Registration successful!");
        setIsSuccessModalOpen(true);

        if (responseData.status === "success") {
          toast.success(responseData.message || "Registration successful!");

          navigate("/phoneverification", {
            state: {
              mobileNumber: `${updatedValues.mobilenumber_countrycode} ${updatedValues.mobile_number}`,
              kyc_verify: kyc_verify,
              customerData: responseData.data || null,
            },
          });
        } else {
          setErrorMessage(
            responseData.message || "Something went wrong during registration!"
          );
          setIsModalOpen(true);
        }
      } else {
        const error = resultAction.payload;

        if (error.message) {
          setErrorMessage(error.message);
          setIsModalOpen(true);
        } else if (error.errors) {
          const formattedErrors = {};
          Object.keys(error.errors).forEach((key) => {
            formattedErrors[key] = error.errors[key].join(", ");
          });
          formik.setErrors(formattedErrors);
          toast.error("Please check the form for errors");
        } else {
          setErrorMessage("Submission Error: Please check all the inputs");
          setIsModalOpen(true);
        }
      }
    } catch (error) {
      setErrorMessage(
        error.message ||
          "An error occurred during submission. Please try again."
      );
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
      setShowFullScreenLoader(false);
    }
  };

  // Handle SSN confirmation (keep as is)
  const handleSSNConfirmation = (confirmed) => {
    dispatch(setMetadataField({ field: "showSSNConfirmation", value: false }));
    if (confirmed) {
      handleFormSubmission(formik.values);
    } else {
      setIsSubmitting(false);
    }
  };

  // FIXED: Single useEffect without nesting
  useEffect(() => {
    setIsClient(true);
    let isMounted = true;

    const initializeData = async () => {
      try {
        setIsLoading(true);
        setInitializationError(null);

        console.log("🔍 [initializeData] Starting initialization", {
          hasLocationState: !!location.state,
          service_provide_ids: service_provide_ids,
          accountOptions: accountOptions,
        });

        // ✅ STEP 1: GET PARTNER TOKEN & ID FIRST (CRITICAL!)
        try {
          console.log("🔄 Attempting to get partner token...");

          // Import getBearerToken dynamically to avoid import issues
          const { getBearerToken } = await import(
            "../../../services/authService"
          );

          const token = await getBearerToken();
          console.log("✅ Partner token obtained:", token ? "Yes" : "No");
        } catch (tokenError) {
          console.error("❌ Failed to get partner token:", tokenError.message);
        }

        // ✅ STEP 2: Determine account types
        let hasNamed = false;
        let hasUSD = false;

        try {
          hasNamed =
            service_provide_ids?.some((idWithType) => {
              const parts = idWithType.split("-");
              return parts.length > 1 && parts[1] === "named";
            }) || false;

          hasUSD =
            service_provide_ids?.some((idWithType) => {
              const id = parseInt(idWithType.split("-")[0]);
              const account = accountOptions?.find(
                (opt) => opt.service_provide_id === id
              );
              return account && account.currency === "USD";
            }) || false;
        } catch (error) {
          console.error("❌ Error determining account types:", error);
        }

        console.log("🔍 Account type analysis:", {
          hasNamed,
          hasUSD,
          ssn_required,
        });

        dispatch(
          setMetadataField({ field: "hasNamedAccounts", value: hasNamed })
        );
        dispatch(setMetadataField({ field: "isUSDSelected", value: hasUSD }));
        dispatch(
          setMetadataField({
            field: "showSSNField",
            value: ssn_required === "Y" || hasNamed,
          })
        );

        // ✅ STEP 3: Create array of promises for all API calls
        const apiPromises = [];

        // ALWAYS fetch countries
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

        // ✅ Fetch nationalities ONLY if not already loaded
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

        // ✅ Fetch ID document types ONLY if not already loaded
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

        // ✅ STEP 4: Fetch terms
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

        // ✅ STEP 5: Execute all API calls
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

        if (isMounted) {
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

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [
    dispatch,
    service_provide_ids,
    countries.length,
    termsFetched,
    ssn_required,
    accountOptions,
    nationalities.length,
    idDocumentTypes.length,
  ]);

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

  // NEW: Country change handler with state/city fetching
  const handleCountrySelect = async (selectedOption) => {
    const countryId = selectedOption?.value || "";

    // Update Redux state
    dispatch(setSelectedCountry(selectedOption));

    // Update formik values
    formik.setFieldValue("country", countryId);
    formik.setFieldValue("state", "");
    formik.setFieldValue("city", "");

    // Auto-set SSN field for US residents
    if (selectedOption?.label === "United States") {
      dispatch(setMetadataField({ field: "showSSNField", value: true }));
    }

    // Fetch states if country is selected
    if (countryId) {
      dispatch(fetchStates(countryId));
    }
  };

  // NEW: State change handler with city fetching
  const handleStateSelect = async (selectedOption) => {
    const stateId = selectedOption?.value || "";

    // Update Redux state
    dispatch(setSelectedState(selectedOption));

    // Update formik values
    formik.setFieldValue("state", stateId);
    formik.setFieldValue("city", "");

    // Fetch cities if state is selected
    if (stateId) {
      dispatch(fetchCities(stateId));
    }
  };

  // NEW: City change handler
  const handleCitySelect = (selectedOption) => {
    const cityId = selectedOption?.value || "";

    // Update Redux state
    dispatch(setSelectedCity(selectedOption));

    // Update formik value
    formik.setFieldValue("city", cityId);
  };

  const handleStateInputChange = (e) => {
    formik.setFieldValue("state", e.target.value);
    // Clear selected state from dropdown
    dispatch(setSelectedState(null));
  };

  const handleCityInputChange = (e) => {
    formik.setFieldValue("city", e.target.value);
    // Clear selected city from dropdown
    dispatch(setSelectedCity(null));
  };

  // Other handler functions (keep as is)
  const handleResidentCountrySelect = (selectedOption) => {
    formik.setFieldValue("resident_country", selectedOption?.value || "");
    formik.setFieldValue(
      "mobilenumber_countrycode",
      selectedOption?.phoneCode || ""
    );
    formik.setFieldValue("flag_url", selectedOption?.flag_url || "");
    setSelectedPhoneCode(selectedOption || null);

    // Auto-set SSN field for US residents
    if (selectedOption?.label === "United States") {
      dispatch(setMetadataField({ field: "showSSNField", value: true }));
    }
  };

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

    // Clear SSN error when user types
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
          // Fetch IP address
          const ipResponse = await fetch("https://api.ipify.org?format=json");
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            ip = ipData.ip;
          }

          // Fetch location data based on IP
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

          // Get device details
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
        // Fallback without device fingerprinting
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

  // Enhanced progress calculation
  useEffect(() => {
    const calculateProgress = () => {
      const personalFields = [
        "first_name",
        "last_name",
        "email",
        "dob",
        "nationality",
        "gender",
      ];
      const contactFields = [
        "resident_country",
        "mobile_number",
        "street_address_1",
        "city",
        "state",
        "zip_code",
        "country",
      ];
      const identityFields = showSSNField && hasNamedAccounts ? ["ssn"] : [];
      const securityFields = ["password", "confirmPassword"];

      let completed = 0,
        total = 0;

      total += personalFields.length;
      completed += personalFields.filter(
        (f) => formik.values[f] && formik.values[f].toString().trim()
      ).length;

      total += contactFields.length;
      completed += contactFields.filter(
        (f) => formik.values[f] && formik.values[f].toString().trim()
      ).length;

      total += identityFields.length;
      completed += identityFields.filter(
        (f) => formik.values[f] && formik.values[f].toString().trim()
      ).length;

      total += securityFields.length;
      completed += securityFields.filter(
        (f) => formik.values[f] && formik.values[f].toString().trim()
      ).length;

      total += 1;
      completed += acceptedTerms.length > 0 ? 1 : 0;

      return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    setProgress(calculateProgress());
  }, [formik.values, acceptedTerms, showSSNField, hasNamedAccounts]);

  // Options for selects with safe defaults
  const countryOptions = countries.map((country) => ({
    value: country.id,
    label: country.name,
    flag_url: country.flag_url,
    phoneCode: country.phone_code,
    country_code: country.country_code,
  }));

  const stateOptions = states.map((state) => ({
    value: state.id,
    label: state.name,
  }));

  const cityOptions = cities.map((city) => ({
    value: city.id,
    label: city.name,
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

  const idDocumentTypeOptions = idDocumentTypes.map((docType) => ({
    value: docType.name,
    label: docType.name,
  }));

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
          <ClipLoader color="#3b82f6" size={50} />
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
          <ClipLoader color="#3b82f6" size={50} />
          <p className="mt-4 text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  return (
    <RegistrationLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
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
                <ClipLoader color="#3b82f6" size={50} loading={isSubmitting} />
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
            <div className="flex overflow-x-auto mb-8 pb-1">
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
            <form onSubmit={formik.handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <section className={`${activeSection !== 0 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
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
                        <ClipLoader size={20} color="#3b82f6" />
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

              {/* Contact Information Section - UPDATED WITH STATE/CITY DROPDOWNS */}
              <section className={`${activeSection !== 1 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
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
                      styles={{
                        ...customStyles,
                        control: (provided, state) => ({
                          ...provided,
                          minHeight: "52px",
                          borderRadius: "12px",
                          borderColor:
                            formik.touched.country && formik.errors.country
                              ? "#f87171"
                              : "#e5e7eb",
                          boxShadow: state.isFocused
                            ? formik.touched.country && formik.errors.country
                              ? "0 0 0 3px rgba(248, 113, 113, 0.1)"
                              : "0 0 0 3px rgba(59, 130, 246, 0.1)"
                            : "none",
                          "&:hover": {
                            borderColor:
                              formik.touched.country && formik.errors.country
                                ? "#ef4444"
                                : "#3b82f6",
                          },
                        }),
                      }}
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
                          xmlns="http://www.w3.org/2000/svg"
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

                  {/* State Field - Hybrid: Dropdown if hasStates, Input field if not */}
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      State/Province *
                      {selectedCountry && (
                        <span className="ml-2 text-xs text-gray-500 font-normal">
                          {hasStates
                            ? "(Select from list)"
                            : "(Enter manually)"}
                        </span>
                      )}
                    </label>

                    {!selectedCountry ? (
                      // Show disabled input when no country selected
                      <input
                        type="text"
                        id="state"
                        name="state"
                        disabled
                        placeholder="Select country first"
                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 shadow-sm"
                      />
                    ) : loadingStates ? (
                      // Show loading when fetching states
                      <div className="flex items-center justify-center py-3 border border-gray-200 rounded-xl bg-gray-50">
                        <ClipLoader size={20} color="#3b82f6" />
                        <span className="ml-2 text-gray-600">
                          Checking for states...
                        </span>
                      </div>
                    ) : hasStates ? (
                      // Show dropdown if country has states
                      <Select
                        id="state"
                        name="state"
                        options={stateOptions}
                        onChange={handleStateSelect}
                        onBlur={formik.handleBlur}
                        className="basic-single"
                        classNamePrefix="select"
                        placeholder="Select State/Province"
                        styles={{
                          ...customStyles,
                          control: (provided, state) => ({
                            ...provided,
                            minHeight: "52px",
                            borderRadius: "12px",
                            borderColor:
                              formik.touched.state && formik.errors.state
                                ? "#f87171"
                                : "#e5e7eb",
                            boxShadow: state.isFocused
                              ? formik.touched.state && formik.errors.state
                                ? "0 0 0 3px rgba(248, 113, 113, 0.1)"
                                : "0 0 0 3px rgba(59, 130, 246, 0.1)"
                              : "none",
                            "&:hover": {
                              borderColor:
                                formik.touched.state && formik.errors.state
                                  ? "#ef4444"
                                  : "#3b82f6",
                            },
                          }),
                        }}
                        value={selectedState}
                        isClearable={true}
                        onClear={() => {
                          dispatch(setSelectedState(null));
                          formik.setFieldValue("state", "");
                        }}
                      />
                    ) : (
                      // Show input field if country has no states
                      <div className="relative">
                        <input
                          type="text"
                          id="state"
                          name="state"
                          onChange={handleStateInputChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.state}
                          className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                            formik.touched.state && formik.errors.state
                              ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                              : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                          } shadow-sm`}
                          placeholder="Enter state/province"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Show info message about state availability */}
                    {selectedCountry && !loadingStates && (
                      <p className="text-xs mt-2 text-gray-500">
                        {hasStates
                          ? `✓ This country has ${states.length} states/provinces available`
                          : `⚠ No pre-defined states found. Please enter manually.`}
                      </p>
                    )}

                    {formik.touched.state && formik.errors.state ? (
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
                        {formik.errors.state}
                      </p>
                    ) : null}
                  </div>

                  {/* City Field - Hybrid: Dropdown if hasCities, Input field if not */}
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      City *
                      {selectedState && (
                        <span className="ml-2 text-xs text-gray-500 font-normal">
                          {hasCities
                            ? "(Select from list)"
                            : "(Enter manually)"}
                        </span>
                      )}
                    </label>

                    {!selectedState && !formik.values.state ? (
                      // Show disabled input when no state selected/entered
                      <input
                        type="text"
                        id="city"
                        name="city"
                        disabled
                        placeholder={
                          selectedCountry && !hasStates
                            ? "Enter state first"
                            : "Select state first"
                        }
                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 shadow-sm"
                      />
                    ) : loadingCities && hasStates ? (
                      // Show loading when fetching cities (only if using dropdown)
                      <div className="flex items-center justify-center py-3 border border-gray-200 rounded-xl bg-gray-50">
                        <ClipLoader size={20} color="#3b82f6" />
                        <span className="ml-2 text-gray-600">
                          Checking for cities...
                        </span>
                      </div>
                    ) : hasCities && hasStates ? (
                      // Show dropdown if state has cities (and we're using state dropdown)
                      <Select
                        id="city"
                        name="city"
                        options={cityOptions}
                        onChange={handleCitySelect}
                        onBlur={formik.handleBlur}
                        className="basic-single"
                        classNamePrefix="select"
                        placeholder="Select City"
                        styles={{
                          ...customStyles,
                          control: (provided, state) => ({
                            ...provided,
                            minHeight: "52px",
                            borderRadius: "12px",
                            borderColor:
                              formik.touched.city && formik.errors.city
                                ? "#f87171"
                                : "#e5e7eb",
                            boxShadow: state.isFocused
                              ? formik.touched.city && formik.errors.city
                                ? "0 0 0 3px rgba(248, 113, 113, 0.1)"
                                : "0 0 0 3px rgba(59, 130, 246, 0.1)"
                              : "none",
                            "&:hover": {
                              borderColor:
                                formik.touched.city && formik.errors.city
                                  ? "#ef4444"
                                  : "#3b82f6",
                            },
                          }),
                        }}
                        value={selectedCity}
                        isClearable={true}
                        onClear={() => {
                          dispatch(setSelectedCity(null));
                          formik.setFieldValue("city", "");
                        }}
                      />
                    ) : (
                      // Show input field (either no cities OR manual state entry)
                      <div className="relative">
                        <input
                          type="text"
                          id="city"
                          name="city"
                          onChange={handleCityInputChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.city}
                          className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                            formik.touched.city && formik.errors.city
                              ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                              : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                          } shadow-sm`}
                          placeholder="Enter city name"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Show info message about city availability */}
                    {selectedState && !loadingCities && hasStates && (
                      <p className="text-xs mt-2 text-gray-500">
                        {hasCities
                          ? `✓ This state has ${cities.length} cities available`
                          : `⚠ No pre-defined cities found. Please enter manually.`}
                      </p>
                    )}

                    {formik.touched.city && formik.errors.city ? (
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
                        {formik.errors.city}
                      </p>
                    ) : null}
                  </div>

                  {/* ZIP Code */}
                  <div>
                    <label
                      htmlFor="zip_code"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      ZIP/Postal Code *
                    </label>
                    <input
                      id="zip_code"
                      name="zip_code"
                      type="text"
                      placeholder="12345"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.zip_code}
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        formik.touched.zip_code && formik.errors.zip_code
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                      } shadow-sm`}
                    />
                    {formik.touched.zip_code && formik.errors.zip_code ? (
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
                        {formik.errors.zip_code}
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
                          xmlns="http://www.w3.org/2000/svg"
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
                      Street Address 2 (Optional)
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
                          styles={{
                            ...customStyles,
                            control: (provided, state) => ({
                              ...provided,
                              minHeight: "52px",
                              borderRadius: "12px",
                              borderColor:
                                formik.touched.mobilenumber_countrycode &&
                                formik.errors.mobilenumber_countrycode
                                  ? "#f87171"
                                  : "#e5e7eb",
                              boxShadow: state.isFocused
                                ? formik.touched.mobilenumber_countrycode &&
                                  formik.errors.mobilenumber_countrycode
                                  ? "0 0 0 3px rgba(248, 113, 113, 0.1)"
                                  : "0 0 0 3px rgba(59, 130, 246, 0.1)"
                                : "none",
                              "&:hover": {
                                borderColor:
                                  formik.touched.mobilenumber_countrycode &&
                                  formik.errors.mobilenumber_countrycode
                                    ? "#ef4444"
                                    : "#3b82f6",
                              },
                            }),
                          }}
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
                              xmlns="http://www.w3.org/2000/svg"
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
                              xmlns="http://www.w3.org/2000/svg"
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
                    onClick={() => setActiveSection(2)}
                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center group"
                  >
                    Next: Identity Verification
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

              {/* Rest of the sections (Identity Verification, Security, Terms & Conditions) remain the same */}
              {/* ... Keep all other sections exactly as they were ... */}
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
