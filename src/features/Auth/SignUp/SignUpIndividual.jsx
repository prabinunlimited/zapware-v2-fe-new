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
  const [showSSN, setShowSSN] = useState(false);

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

        if (!showSSNField || !hasNamedAccounts) {
          return true;
        }

        if (!value) {
          return this.createError({
            message: "SSN is required for named accounts",
          });
        }

        const cleanSSN = value.replace(/-/g, "");
        return cleanSSN.length === 9 && /^\d+$/.test(cleanSSN);
      }
    ),
    mobilenumber_countrycode: Yup.string().required("Country code is required"),
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
      idDocumentType: "",
      idDocumentNumber: "",
      idIssuedDate: "",
      idIssuedCountryCode: "US",
      idDocumentTypeOther: "",
      ssnIssuedState: "NY",
      accept_sms: 0,
      accept_privacy_policy: 0,
      accept_disclosure: 0,
      accept_fees: 0,
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

        dispatch(setMetadataField({ field: "ssnError", value: "" }));

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

        if (!selectedIdDocumentType) {
          setErrorMessage("Please select an ID document type");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        if (!idDocumentNumber) {
          setErrorMessage("Please enter ID document number");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        if (!idIssuedDate) {
          setErrorMessage("Please select ID expiry date");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        if (!idIssuedCountryCode) {
          setErrorMessage("Please select issuing country");
          setIsModalOpen(true);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

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
          setShowFullScreenLoader(false);
          return;
        }

        await handleFormSubmission(values);
      } catch (error) {
        setErrorMessage("An error occurred during form validation");
        setIsModalOpen(true);
        setIsSubmitting(false);
        setShowFullScreenLoader(false);
      }
    },
  });

  // Handle form submission
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

  // Handle SSN confirmation
  const handleSSNConfirmation = (confirmed) => {
    dispatch(setMetadataField({ field: "showSSNConfirmation", value: false }));
    if (confirmed) {
      handleFormSubmission(formik.values);
    } else {
      setIsSubmitting(false);
    }
  };

  // Initialize data
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

  // Country change handler with state/city fetching
  const handleCountrySelect = async (selectedOption) => {
    const countryId = selectedOption?.value || "";

    dispatch(setSelectedCountry(selectedOption));

    formik.setFieldValue("country", countryId);
    formik.setFieldValue("state", "");
    formik.setFieldValue("city", "");

    if (selectedOption?.label === "United States") {
      dispatch(setMetadataField({ field: "showSSNField", value: true }));
    }

    if (countryId) {
      dispatch(fetchStates(countryId));
    }
  };

  // State change handler with city fetching
  const handleStateSelect = async (selectedOption) => {
    const stateId = selectedOption?.value || "";

    dispatch(setSelectedState(selectedOption));

    formik.setFieldValue("state", stateId);
    formik.setFieldValue("city", "");

    if (stateId) {
      dispatch(fetchCities(stateId));
    }
  };

  // City change handler
  const handleCitySelect = (selectedOption) => {
    const cityId = selectedOption?.value || "";

    dispatch(setSelectedCity(selectedOption));

    formik.setFieldValue("city", cityId);
  };

  const handleStateInputChange = (e) => {
    formik.setFieldValue("state", e.target.value);
    dispatch(setSelectedState(null));
  };

  const handleCityInputChange = (e) => {
    formik.setFieldValue("city", e.target.value);
    dispatch(setSelectedCity(null));
  };

  // Other handler functions
  const handleResidentCountrySelect = (selectedOption) => {
    formik.setFieldValue("resident_country", selectedOption?.value || "");
    formik.setFieldValue(
      "mobilenumber_countrycode",
      selectedOption?.phoneCode || ""
    );
    formik.setFieldValue("flag_url", selectedOption?.flag_url || "");
    setSelectedPhoneCode(selectedOption || null);

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

  // FIXED PROGRESS CALCULATION - Using let instead of const for mutable variables
  useEffect(() => {
    const calculateProgress = () => {
      const fieldChecks = [
        { name: "first_name", value: formik.values.first_name, filled: formik.values.first_name && formik.values.first_name.trim() },
        { name: "last_name", value: formik.values.last_name, filled: formik.values.last_name && formik.values.last_name.trim() },
        { name: "email", value: formik.values.email, filled: formik.values.email && formik.values.email.trim() },
        { name: "dob", value: formik.values.dob, filled: formik.values.dob && formik.values.dob.trim() },
        { name: "nationality", value: formik.values.nationality, filled: formik.values.nationality && formik.values.nationality.toString().trim() },
        { name: "gender", value: formik.values.gender, filled: formik.values.gender && formik.values.gender.toString().trim() },
        { name: "resident_country", value: formik.values.resident_country, filled: formik.values.resident_country && formik.values.resident_country.toString().trim() },
        { name: "mobilenumber_countrycode", value: formik.values.mobilenumber_countrycode, filled: formik.values.mobilenumber_countrycode && formik.values.mobilenumber_countrycode.toString().trim() },
        { name: "mobile_number", value: formik.values.mobile_number, filled: formik.values.mobile_number && formik.values.mobile_number.trim() },
        { name: "street_address_1", value: formik.values.street_address_1, filled: formik.values.street_address_1 && formik.values.street_address_1.trim() },
        { name: "city", value: formik.values.city, filled: formik.values.city && formik.values.city.toString().trim() },
        { name: "state", value: formik.values.state, filled: formik.values.state && formik.values.state.toString().trim() },
        { name: "zip_code", value: formik.values.zip_code, filled: formik.values.zip_code && formik.values.zip_code.trim() },
        { name: "country", value: formik.values.country, filled: formik.values.country && formik.values.country.toString().trim() },
        { name: "idDocumentType", value: selectedIdDocumentType, filled: selectedIdDocumentType && selectedIdDocumentType.trim() },
        { name: "idDocumentNumber", value: idDocumentNumber, filled: idDocumentNumber && idDocumentNumber.trim() },
        { name: "idIssuedDate", value: idIssuedDate, filled: idIssuedDate && idIssuedDate.trim() },
        { name: "idIssuedCountryCode", value: idIssuedCountryCode, filled: idIssuedCountryCode && idIssuedCountryCode.trim() },
        { name: "password", value: formik.values.password, filled: formik.values.password && formik.values.password.trim() },
        { name: "confirmPassword", value: formik.values.confirmPassword, filled: formik.values.confirmPassword && formik.values.confirmPassword.trim() },
      ];
      
      if (showSSNField && hasNamedAccounts) {
        fieldChecks.push({ 
          name: "ssn", 
          value: formik.values.ssn, 
          filled: formik.values.ssn && formik.values.ssn.trim() 
        });
      }
      
      let filledFields = fieldChecks.filter(field => field.filled).length;
      const totalFields = fieldChecks.length;
      
      let termsField = 0;
      if (termsConditions.length > 0) {
        termsField = 1;
        if (acceptedTerms.length > 0) {
          filledFields += 1;
        }
      }
      
      const totalWithTerms = totalFields + termsField;
      const percentage = totalWithTerms > 0 ? Math.round((filledFields / totalWithTerms) * 100) : 0;
      
      return percentage;
    };
    
    setProgress(calculateProgress());
  }, [
    formik.values,
    acceptedTerms,
    showSSNField,
    hasNamedAccounts,
    selectedIdDocumentType,
    idDocumentNumber,
    idIssuedDate,
    idIssuedCountryCode,
    termsConditions.length,
    formik.values.first_name,
    formik.values.last_name,
    formik.values.email,
    formik.values.dob,
    formik.values.nationality,
    formik.values.gender,
    formik.values.resident_country,
    formik.values.mobilenumber_countrycode,
    formik.values.mobile_number,
    formik.values.street_address_1,
    formik.values.city,
    formik.values.state,
    formik.values.zip_code,
    formik.values.country,
    formik.values.password,
    formik.values.confirmPassword,
    formik.values.ssn,
  ]);

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
            <form
              onSubmit={formik.handleSubmit}
              className="space-y-8"
              noValidate
            >
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

                  {/* Resident Country Field - CRITICAL FIELD THAT WAS MISSING */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="resident_country"
                      className="block text-sm font-medium text-gray-700 mb-2.5"
                    >
                      Resident Country *
                    </label>
                    <Select
                      id="resident_country"
                      name="resident_country"
                      options={countryOptions}
                      onChange={handleResidentCountrySelect}
                      onBlur={formik.handleBlur}
                      className="basic-single"
                      classNamePrefix="select"
                      placeholder="Select Resident Country"
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
                      value={
                        countryOptions.find(
                          (opt) => opt.value === formik.values.resident_country
                        ) || null
                      }
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

                  {/* State Field */}
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
                      <input
                        type="text"
                        id="state"
                        name="state"
                        disabled
                        placeholder="Select country first"
                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 shadow-sm"
                      />
                    ) : loadingStates ? (
                      <div className="flex items-center justify-center py-3 border border-gray-200 rounded-xl bg-gray-50">
                        <ClipLoader size={20} color="#3b82f6" />
                        <span className="ml-2 text-gray-600">
                          Checking for states...
                        </span>
                      </div>
                    ) : hasStates ? (
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

                  {/* City Field */}
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
                      <div className="flex items-center justify-center py-3 border border-gray-200 rounded-xl bg-gray-50">
                        <ClipLoader size={20} color="#3b82f6" />
                        <span className="ml-2 text-gray-600">
                          Checking for cities...
                        </span>
                      </div>
                    ) : hasCities && hasStates ? (
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
                        name="idDocumentType"
                        className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                          !selectedIdDocumentType
                            ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                            : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                        } shadow-sm`}
                        value={selectedIdDocumentType}
                        onChange={(e) =>
                          setSelectedIdDocumentType(e.target.value)
                        }
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
                      name="idDocumentNumber"
                      value={idDocumentNumber}
                      onChange={(e) => setIdDocumentNumber(e.target.value)}
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        !idDocumentNumber
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                      } shadow-sm`}
                      placeholder="Enter document number"
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
                      ID Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="idIssuedDate"
                      value={idIssuedDate}
                      onChange={(e) => setIdIssuedDate(e.target.value)}
                      className={`w-full px-4 py-3.5 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                        !idIssuedDate
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-500"
                      } shadow-sm`}
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

              {/* Security Section */}
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

              {/* Terms & Conditions Section */}
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
                        progress < 100 ||
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