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

// Redux imports
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCountries,
  selectCountries,
  selectSelectedCountry,
  selectCountriesLoading,
  selectCountriesError,
} from "../slices/countrySlice";

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
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedResidentCountry, setSelectedResidentCountry] = useState(null);
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

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Redux selectors with safe defaults
  const countries = useSelector(selectCountries) || [];
  const countriesLoading = useSelector(selectCountriesLoading);
  const countriesError = useSelector(selectCountriesError);
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

  // Fix the validation schema
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

  // Handle form submission
  const handleFormSubmission = async (values) => {
    try {
      setShowFullScreenLoader(true);

      // No need to clean mobile_number now since it's already clean
      const updatedValues = {
        ...values,
        // mobile_number is already clean: "9813017273"
        mobilenumber_countrycode: values.mobilenumber_countrycode, // "+1"
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

      // Check if the action was successful
      if (submitIndividualSignup.fulfilled.match(resultAction)) {
        const responseData = resultAction.payload;
        

        setSuccessMessage(responseData.message || "Registration successful!");
        setIsSuccessModalOpen(true);

        if (responseData.status === "success") {
          toast.success(responseData.message || "Registration successful!");

          // Navigate to phone verification with clean mobile number
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
        // Handle rejection (error case)
        const error = resultAction.payload;
        

        if (error.message) {
          setErrorMessage(error.message);
          setIsModalOpen(true);
        } else if (error.errors) {
          // Handle field-specific errors from Redux
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

  // Handle SSN confirmation
  const handleSSNConfirmation = (confirmed) => {
    dispatch(setMetadataField({ field: "showSSNConfirmation", value: false }));
    if (confirmed) {
      // Proceed with form submission
      handleFormSubmission(formik.values);
    } else {
      // User cancelled, reset submitting state
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

        
        
        
        
        
        

        // Determine account types with error handling
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
          
        }

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

        // Create an array of promises for all API calls
        const apiPromises = [];

        // ALWAYS fetch countries
        
        apiPromises.push(
          dispatch(fetchCountries())
            .unwrap()
            .catch((error) => {
              
              return [];
            })
        );

        // ✅ ADD DATA EXISTENCE CHECKS HERE:
        // Fetch nationalities ONLY if not already loaded
        if (nationalities.length === 0) {
          
          apiPromises.push(
            dispatch(fetchNationalities())
              .unwrap()
              .catch((error) => {
                
                return [];
              })
          );
        } else {
          
        }

        // Fetch ID document types ONLY if not already loaded
        if (idDocumentTypes.length === 0) {
          
          apiPromises.push(
            dispatch(fetchIdDocumentTypes())
              .unwrap()
              .catch((error) => {
                
                return [];
              })
          );
        } else {
          
        }

        // Fetch terms if needed
        const bearertoken = localStorage.getItem("bearertoken");
        if (bearertoken && !termsFetched) {
          
          apiPromises.push(
            dispatch(fetchTermsAndConditions())
              .unwrap()
              .catch((error) => {
                
                return [];
              })
          );
        }

        // Only wait for promises if we actually have API calls to make
        if (apiPromises.length > 0) {
          // Wait for all API calls with timeout
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve("timeout"), 30000)
          );

          const results = await Promise.race([
            Promise.allSettled(apiPromises),
            timeoutPromise,
          ]);

          if (results === "timeout") {
            
          } else {
            
          }
        } else {
          
        }

        if (isMounted) {
          setIsLoading(false);
          
        }
      } catch (error) {
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
    if (countriesError) {
      setErrorMessage(`Failed to load countries: ${countriesError}`);
      setIsModalOpen(true);
    }
  }, [countriesError]);

  useEffect(() => {
    if (!isModalOpen && termsError) {
      dispatch(clearTermsError());
    }
  }, [isModalOpen, termsError, dispatch]);

  const handleCheckboxChange = useCallback(
    async (termId) => {
      try {
        // Get current date and time
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
        } catch (deviceError) {
          
        }

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

  // Handler functions
  const handleCountrySelect = (selectedOption) => {
    setSelectedCountry(selectedOption);
    formik.setFieldValue("country", selectedOption?.value || "");

    // Auto-set SSN field for US residents
    if (selectedOption?.label === "United States") {
      dispatch(setMetadataField({ field: "showSSNField", value: true }));
    }
  };

  const handleResidentCountrySelect = (selectedOption) => {
    setSelectedResidentCountry(selectedOption);
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
    // Remove all non-numeric characters and limit to 10 digits
    const rawValue = e.target.value.replace(/\D/g, "").slice(0, 10);

    // Set the raw numeric value directly (no formatting)
    formik.setFieldValue("mobile_number", rawValue);
  };

  // Prevent non-numeric input for phone
  const handlePhoneKeyPress = (e) => {
    // Only allow numbers (0-9)
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

  // Enhanced state validation for US
  const handleStateChange = (e) => {
    const isUS =
      formik.values.country === "US" ||
      (selectedCountry && selectedCountry.label === "United States");
    let value = e.target.value;

    if (isUS) {
      // Only allow uppercase letters and limit to 2 characters
      value = value
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 2);
    }

    formik.setFieldValue("state", value);
  };

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
  const countryOptions =
    Array.isArray(countries) && countries.length > 0
      ? countries.map((country) => ({
          value: country.id,
          label: country.name,
          flag_url: country.flag_url,
          phoneCode: country.phone_code,
          country_code: country.country_code,
        }))
      : [];

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

              {/* Contact Information Section */}
              <section className={`${activeSection !== 1 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm mr-3 shadow-sm">
                    2
                  </span>
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="resident_country"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      Country of Residence *
                    </label>
                    <Select
                      id="resident_country"
                      name="resident_country"
                      options={countryOptions}
                      onChange={handleResidentCountrySelect}
                      onBlur={formik.handleBlur}
                      styles={{
                        ...customStyles,
                        control: (provided, state) => ({
                          ...provided,
                          minHeight: "52px",
                          borderRadius: "12px",
                          borderColor:
                            formik.touched.resident_country &&
                            formik.errors.resident_country
                              ? "#f87171"
                              : "#e5e7eb",
                          boxShadow: state.isFocused
                            ? formik.touched.resident_country &&
                              formik.errors.resident_country
                              ? "0 0 0 3px rgba(248, 113, 113, 0.1)"
                              : "0 0 0 3px rgba(59, 130, 246, 0.1)"
                            : "none",
                          "&:hover": {
                            borderColor:
                              formik.touched.resident_country &&
                              formik.errors.resident_country
                                ? "#ef4444"
                                : "#3b82f6",
                          },
                        }),
                      }}
                      value={selectedResidentCountry}
                      placeholder="Select Country"
                    />
                    {formik.touched.resident_country &&
                    formik.errors.resident_country ? (
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
                        {formik.errors.resident_country}
                      </p>
                    ) : null}
                  </div>

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

                  <div className="relative">
                    <label
                      htmlFor="house_number"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      House Number
                    </label>
                    <input
                      id="house_number"
                      name="house_number"
                      type="text"
                      placeholder="Enter house number"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.house_number}
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        formik.touched.house_number &&
                        formik.errors.house_number
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                      } shadow-sm`}
                    />
                  </div>

                  {[
                    {
                      id: "street_address_1",
                      label: "Street Address *",
                      placeholder: "123 Main St",
                    },
                    {
                      id: "street_address_2",
                      label: "Street Address 2 (Optional)",
                      placeholder: "Apt, suite, unit, etc.",
                    },
                    {
                      id: "city",
                      label: "City *",
                      placeholder: "Enter your city",
                    },
                    {
                      id: "state",
                      label: "State/Province *",
                      placeholder: "Enter your state",
                    },
                    {
                      id: "zip_code",
                      label: "ZIP/Postal Code *",
                      placeholder: "12345",
                    },
                  ].map(({ id, label, placeholder }) => (
                    <div key={id} className="relative">
                      <label
                        htmlFor={id}
                        className="block text-sm font-medium text-gray-700 mb-2.5"
                      >
                        {id === "state" &&
                        (formik.values.country === "US" ||
                          selectedCountry?.label === "United States")
                          ? "State Code *"
                          : label}
                      </label>
                      <input
                        id={id}
                        name={id}
                        type="text"
                        placeholder={placeholder}
                        onChange={
                          id === "state"
                            ? handleStateChange
                            : formik.handleChange
                        }
                        onBlur={formik.handleBlur}
                        value={formik.values[id]}
                        maxLength={
                          id === "state" &&
                          (formik.values.country === "US" ||
                            selectedCountry?.label === "United States")
                            ? 2
                            : undefined
                        }
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

              {/* Identity Verification Section */}
              <section className={`${activeSection !== 2 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm mr-3 shadow-sm">
                    3
                  </span>
                  Identity Verification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SSN Field */}
                  {showSSNField && (
                    <div className="md:col-span-2">
                      <label
                        htmlFor="ssn"
                        className="block text-sm font-medium text-gray-700 mb-2.5"
                      >
                        Social Security Number (SSN){" "}
                        {hasNamedAccounts && (
                          <span className="text-red-500">*</span>
                        )}
                        {!hasNamedAccounts && (
                          <span className="text-gray-500 text-xs ml-2">
                            (optional for pooled accounts)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        id="ssn"
                        name="ssn"
                        onChange={handleSSNChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.ssn}
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                          (formik.touched.ssn && formik.errors.ssn) || ssnError
                            ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                            : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                        } shadow-sm`}
                        placeholder="XXX-XX-XXXX"
                        maxLength={11}
                      />
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
                    </div>
                  )}

                  {showSSNField && (
                    <div className="md:col-span-2">
                      <label
                        htmlFor="ssnIssuedState"
                        className="block text-sm font-medium text-gray-700 mb-2.5"
                      >
                        SSN Issued State
                      </label>
                      <input
                        type="text"
                        id="ssnIssuedState"
                        value={ssnIssuedState}
                        onChange={(e) => setSsnIssuedState(e.target.value)}
                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm"
                        placeholder="Enter state where SSN was issued"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2.5">
                      ID Document Type *
                    </label>

                    {isLoadingDocumentTypes ? (
                      <div className="flex items-center justify-center py-3 border border-gray-200 rounded-xl bg-gray-50">
                        <ClipLoader size={20} color="#3b82f6" />
                        <span className="ml-2 text-gray-600">
                          Loading document types...
                        </span>
                      </div>
                    ) : (
                      <select
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                          !selectedIdDocumentType
                            ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                            : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                        } shadow-sm`}
                        value={selectedIdDocumentType}
                        onChange={(e) =>
                          setSelectedIdDocumentType(e.target.value)
                        }
                        required
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
                  {selectedIdDocumentType === "other" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2.5">
                        ID Document Type (Other) *
                      </label>
                      <input
                        type="text"
                        value={idDocumentTypeOther}
                        onChange={(e) => setIdDocumentTypeOther(e.target.value)}
                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm"
                        placeholder="Specify document type"
                        required
                      />
                    </div>
                  )}

                  {/* Document Number */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2.5">
                      ID Document Number *
                    </label>
                    <input
                      type="text"
                      value={idDocumentNumber}
                      onChange={(e) => setIdDocumentNumber(e.target.value)}
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        !idDocumentNumber
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                      } shadow-sm`}
                      placeholder="Enter document number"
                      required
                    />
                  </div>

                  {/* Issuing Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2.5">
                      ID Issuing Country *
                    </label>
                    <select
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        !idIssuedCountryCode
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                      } shadow-sm`}
                      value={idIssuedCountryCode}
                      onChange={(e) => setIdIssuedCountryCode(e.target.value)}
                      required
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.country_code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Issue Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2.5">
                      ID Issue Date *
                    </label>
                    <input
                      type="date"
                      value={idIssuedDate}
                      onChange={(e) => setIdIssuedDate(e.target.value)}
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        !idIssuedDate
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                      } shadow-sm`}
                      required
                    />
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

              {/* Security Section - WITHOUT Terms & Conditions */}
              <section className={`${activeSection !== 3 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
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

              {/* Terms & Conditions Section - SEPARATE TAB */}
              <section className={`${activeSection !== 4 ? "hidden" : ""}`}>
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm mr-3 shadow-sm">
                    5
                  </span>
                  Terms & Conditions
                </h3>

                {termsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <ClipLoader color="#3b82f6" size={30} />
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
                          <ClipLoader
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
                        (termsConditions.length > 0 &&
                          acceptedTerms.length === 0)
                      }
                      className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center group"
                    >
                      {isSubmitting ? (
                        <>
                          <ClipLoader
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