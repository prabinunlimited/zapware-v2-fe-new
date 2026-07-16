import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useFormik } from "formik";
import { RingLoader } from "react-spinners";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import {
  FaMoneyBillWave,
  FaArrowLeft,
  FaUser,
  FaUniversity,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
  FaTrash,
  FaChevronRight,
  FaChevronLeft,
  FaSearch,
  FaPhone,
} from "react-icons/fa";

// Import Redux actions and selectors
import {
  selectCreateLoading,
  selectCreateError,
  selectCreateSuccess,
  selectNationalities,
  selectBanks,
  selectIdTypes,
  selectCities,
  selectBankBranches,
  selectDropdownLoading,
  selectUpdateLoading,
  selectUpdateError,
  selectUpdateSuccess,
  selectBeneficiaryData,
  fetchNationalities,
  fetchBanksByCurrency,
  fetchIdTypesByCurrency,
  fetchCitiesByCountry,
  fetchBankBranches,
  createBeneficiaryWithBanks,
  updateBeneficiary,
  fetchBeneficiaryById,
  clearCreateError,
  clearCreateSuccess,
  resetCreateState,
  clearUpdateState,
  updateBeneficiaryBank,
  selectBankUpdateLoading,
  selectBankUpdateError,
  selectBankUpdateSuccess,
  selectBankDeleteLoading,
  selectBankDeleteError,
  selectBankDeleteSuccess,
  deleteBeneficiaryBank,
  addBeneficiaryBank,
  validateBeneficiaryCreate,
  selectValidateLoading,
  selectValidateError,
  selectValidateSuccess,
} from "../AddBeneficiary/addBeneficiarySlice";

// Import from beneficiarySlice for phone search
import {
  searchBeneficiaryByPhone,
  selectPhoneSearch,
  selectPhoneSearchLoading,
  selectPhoneExists,
  selectPhoneSearchData,
  clearPhoneSearch,
  createAndAddBeneficiary,
  fetchBeneficiaries,
  selectCreateLoading as selectBeneficiariesCreateLoading,
  selectCreateError as selectBeneficiariesCreateError,
  selectCreateSuccess as selectBeneficiariesCreateSuccess,
  clearCreateState as clearBeneficiariesCreateState,
  selectBeneficiaries,
  setPhoneSearchProcessed,
  addExistingBeneficiary,
  selectAddExistingBeneficiaryLoading,
  selectAddExistingBeneficiaryError,
  selectAddExistingBeneficiarySuccess,
} from "../MyBeneficiaries/BeneficiariesSlice";

import {
  selectCountriesOptionsSafe,
  selectCountries,
  selectPhoneCodeOptions,
  fetchCountries,
} from "../../../features/Auth/slices/countrySlice";

import PropTypes from "prop-types";

const AlertBox = ({ message = "Please log in to continue!", onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-labelledby="alert-title"
      aria-describedby="alert-message"
    >
      <div className="max-w-lg w-11/12 md:w-1/2 p-6 rounded-lg shadow-xl bg-red-600 text-white text-center">
        <h2
          id="alert-title"
          className="text-xl font-extrabold mb-4 tracking-wide"
        >
          Action Required!
        </h2>
        <p id="alert-message" className="text-sm md:text-base mb-6">
          {message}
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white text-red-600 rounded-md font-medium hover:bg-gray-100 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

AlertBox.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

AlertBox.defaultProps = {
  message: "Please log in to continue!",
};

const ValidationErrorModal = ({ isOpen, onClose, errors, title = "Validation Error" }) => {
  if (!isOpen) return null;

  // Format error messages from API response
  const formatErrors = (errorData) => {
    console.log("🔍 Formatting errors - Input:", errorData);
    console.log("🔍 ErrorData type:", typeof errorData);

    // If it's a string, return as single error
    if (typeof errorData === 'string') {
      return [errorData];
    }

    // If it's an array, return as is
    if (Array.isArray(errorData)) {
      return errorData;
    }

    // If it's an object
    if (typeof errorData === 'object' && errorData !== null) {
      const messages = [];

      // Handle the specific API response format: { status: "error", message: { field: ["error"] } }
      if (errorData.status === "error" && errorData.message && typeof errorData.message === 'object') {
        console.log("📦 Found status:error with message object:", errorData.message);
        Object.entries(errorData.message).forEach(([field, fieldErrors]) => {
          // Format field name for display (but we'll only show the error message)
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach(err => {
              // Only show the error message, not the field name
              messages.push(err);
            });
          } else if (typeof fieldErrors === 'string') {
            // Only show the error message, not the field name
            messages.push(fieldErrors);
          } else if (typeof fieldErrors === 'object') {
            if (fieldErrors.message) {
              messages.push(fieldErrors.message);
            } else {
              try {
                messages.push(JSON.stringify(fieldErrors));
              } catch (e) {
                messages.push('Invalid error format');
              }
            }
          }
        });
        return messages.length > 0 ? messages : ['Validation failed. Please check your details.'];
      }

      // Handle { message: { field: ["error"] } } format
      if (errorData.message && typeof errorData.message === 'object') {
        console.log("📦 Found message object:", errorData.message);
        Object.entries(errorData.message).forEach(([field, fieldErrors]) => {
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach(err => {
              // Only show the error message, not the field name
              messages.push(err);
            });
          } else if (typeof fieldErrors === 'string') {
            messages.push(fieldErrors);
          } else if (typeof fieldErrors === 'object') {
            if (fieldErrors.message) {
              messages.push(fieldErrors.message);
            } else {
              try {
                messages.push(JSON.stringify(fieldErrors));
              } catch (e) {
                messages.push('Invalid error format');
              }
            }
          }
        });
        return messages.length > 0 ? messages : ['Validation failed. Please check your details.'];
      }

      // Handle { message: "error string" } format
      if (errorData.message && typeof errorData.message === 'string') {
        return [errorData.message];
      }

      // Handle { errors: { field: ["error"] } } format
      if (errorData.errors && typeof errorData.errors === 'object') {
        console.log("📦 Found errors object:", errorData.errors);
        Object.entries(errorData.errors).forEach(([field, fieldErrors]) => {
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach(err => {
              // Only show the error message, not the field name
              messages.push(err);
            });
          } else if (typeof fieldErrors === 'string') {
            messages.push(fieldErrors);
          } else if (typeof fieldErrors === 'object') {
            if (fieldErrors.message) {
              messages.push(fieldErrors.message);
            } else {
              try {
                messages.push(JSON.stringify(fieldErrors));
              } catch (e) {
                messages.push('Invalid error format');
              }
            }
          }
        });
        return messages.length > 0 ? messages : ['Validation failed. Please check your details.'];
      }

      // Handle { error: "error string" } format
      if (errorData.error && typeof errorData.error === 'string') {
        return [errorData.error];
      }

      // If none of the above, try to extract any string values
      const stringValues = Object.values(errorData).filter(val => typeof val === 'string');
      if (stringValues.length > 0) {
        return stringValues;
      }

      // Last resort: convert object to string
      try {
        return [JSON.stringify(errorData)];
      } catch (e) {
        return ['Validation failed. Please check your details.'];
      }
    }

    return ['Validation failed. Please check your details.'];
  };

  const errorMessages = formatErrors(errors);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="error-modal-title"
      aria-describedby="error-modal-message"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-11/12 md:w-1/2 p-6 rounded-lg shadow-xl bg-white text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <FaExclamationTriangle className="text-red-600 text-xl" />
            </div>
          </div>
          <div className="flex-1">
            <h2 id="error-modal-title" className="text-xl font-bold text-red-600">
              {title}
            </h2>
          </div>
        </div>

        <div className="mt-4 max-h-60 overflow-y-auto">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <ul className="space-y-2">
              {errorMessages.map((error, index) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="text-red-500 mr-2 mt-0.5">•</span>
                  <span className="text-red-700">{error}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

ValidationErrorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  errors: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.array
  ]),
  title: PropTypes.string,
};

ValidationErrorModal.defaultProps = {
  errors: 'Validation failed. Please check your details.',
  title: 'Validation Error',
};

const BeneficiaryForm = ({ mode = "create", initialData = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const params = useParams();

  // Add useRef to track mounted state
  const isMounted = useRef(true);
  const bankDataInitialized = useRef(false);

  // Handle different route patterns
  let customerId, beneficiaryId;

  if (mode === "create") {
    customerId = params.customerId;
    beneficiaryId = null;
  } else {
    beneficiaryId = params.beneficiaryId;
    customerId =
      location.state?.customerId || localStorage.getItem("currentCustomerId");
  }

  const is_payout = location.state?.is_payout || "n";

  // Redux selectors
  const {
    createLoading,
    createError,
    createSuccess,
    updateLoading,
    updateError,
    updateSuccess,
    nationalities,
    banks,
    idTypes,
    cities,
    bankBranches,
    dropdownLoading,
    beneficiaryDetails,
  } = useSelector((state) => ({
    createLoading: state.addBeneficiary?.createLoading || false,
    createError: state.addBeneficiary?.createError || null,
    createSuccess: state.addBeneficiary?.createSuccess || false,
    updateLoading: state.addBeneficiary?.updateLoading || false,
    updateError: state.addBeneficiary?.updateError || null,
    updateSuccess: state.addBeneficiary?.updateSuccess || false,
    nationalities: state.addBeneficiary?.nationalities || [],
    banks: state.addBeneficiary?.banks || {},
    idTypes: state.addBeneficiary?.idTypes || {},
    cities: state.addBeneficiary?.cities || {},
    bankBranches: state.addBeneficiary?.bankBranches || {},
    dropdownLoading: state.addBeneficiary?.dropdownLoading || false,
    beneficiaryDetails: state.addBeneficiary?.beneficiaryData || null,
  }), shallowEqual);

  // Add these after your existing useSelector
  const bankUpdateLoading = useSelector(selectBankUpdateLoading);
  const bankUpdateSuccess = useSelector(selectBankUpdateSuccess);
  const bankUpdateError = useSelector(selectBankUpdateError);
  const bankDeleteLoading = useSelector(selectBankDeleteLoading);
  const bankDeleteError = useSelector(selectBankDeleteError);
  const bankDeleteSuccess = useSelector(selectBankDeleteSuccess);
  const beneficiaries = useSelector(selectBeneficiaries);

  // Phone search selectors from beneficiarySlice
  const phoneSearch = useSelector(selectPhoneSearch);
  const phoneSearchLoading = useSelector(selectPhoneSearchLoading);
  const phoneExists = useSelector(selectPhoneExists);
  const phoneSearchData = useSelector(selectPhoneSearchData);
  const [isCurrentCustomerBenef, setIsCurrentCustomerBenef] = useState(null);

  const addExistingBeneficiaryLoading = useSelector(selectAddExistingBeneficiaryLoading);
  const addExistingBeneficiarySuccess = useSelector(selectAddExistingBeneficiarySuccess);
  const addExistingBeneficiaryError = useSelector(selectAddExistingBeneficiaryError);

  const validateLoading = useSelector(selectValidateLoading);
  const validateError = useSelector(selectValidateError);
  const validateSuccess = useSelector(selectValidateSuccess);

  // Create state from beneficiarySlice
  const beneficiariesCreateLoading = useSelector(
    selectBeneficiariesCreateLoading
  );
  const beneficiariesCreateError = useSelector(selectBeneficiariesCreateError);
  const beneficiariesCreateSuccess = useSelector(
    selectBeneficiariesCreateSuccess
  );

  // Countries from Redux
  const countriesOptions = useSelector(selectCountriesOptionsSafe);
  const countries = useSelector(selectCountries);
  const phoneCodeOptions = useSelector(selectPhoneCodeOptions);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(() => {
    if (mode === "create") {
      return 0;
    }
    if (mode === "edit" && location.state?.editBankOnly) {
      return 2;
    }
    return 1;
  });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState(null);

  const [editBankOnlyMode, setEditBankOnlyMode] = useState(() => {
    return mode === "edit" && location.state?.editBankOnly;
  });
  const isAddBankOnlyMode = location.state?.addBankOnly || false;

  const [beneficiariesLoaded, setBeneficiariesLoaded] = useState(false);
  const [usingExistingBeneficiary, setUsingExistingBeneficiary] = useState(false);
  const [existingBeneficiaryId, setExistingBeneficiaryId] = useState(null);

  // Phone search state
  const [phoneInput, setPhoneInput] = useState("");
  const [countryCodeInput, setCountryCodeInput] = useState("+1");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [foundBeneficiary, setFoundBeneficiary] = useState(null);
  const [selectedBeneficiaryType, setSelectedBeneficiaryType] = useState("");

  // Beneficiary Bank States
  const [currency, setCurrency] = useState(
    mode === "edit" && initialData?.banks?.[0]?.currency_code
      ? initialData.banks[0].currency_code
      : "INR"
  );
  const [paymentMethod, setPaymentMethod] = useState("ACH");
  const [loading, setLoading] = useState(false);
  const [showOtherRelationship, setShowOtherRelationship] = useState(false);
  const [branchCode, setBranchCode] = useState("");
  const [fieldTouched, setFieldTouched] = useState({});
  const [selectedCountryCode, setSelectedCountryCode] = useState("");

  const [validationError, setValidationError] = useState(null);

  // Swift support function
  const isSwiftSupportedForCurrency = (currency) => {
    const swiftSupportedCurrencies = ["USD", "EUR", "GBP", "CAD"];
    return swiftSupportedCurrencies.includes(currency);
  };

  // Define steps array - ADD STEP 0 FOR PHONE SEARCH
  const steps =
    mode === "create"
      ? [
        {
          number: 0,
          title: "Search Beneficiary",
          icon: <FaSearch className="mr-2" />,
          description: "Search by phone number",
        },
        {
          number: 1,
          title: "Beneficiary Details",
          icon: <FaUser className="mr-2" />,
          description: "Personal & Contact Information",
        },
        {
          number: 2,
          title: "Bank Information",
          icon: <FaUniversity className="mr-2" />,
          description: "Account & Payment Details",
        },
      ]
      : [
        {
          number: 1,
          title: "Beneficiary Details",
          icon: <FaUser className="mr-2" />,
          description: "Personal & Contact Information",
        },
      ];

  const relationshipOptions = [
    { value: "father", label: "Father" },
    { value: "mother", label: "Mother" },
    { value: "sister", label: "Sister" },
    { value: "brother", label: "Brother" },
    { value: "cousin", label: "Cousin" },
    { value: "friend", label: "Friend" },
    { value: "customer", label: "Customer" },
    { value: "other", label: "Other" },
  ];

  const swiftSupportedCurrencies = ["USD", "EUR", "GBP", "CAD"];

  const localCurrencies = [
    "AED",
    "AUD",
    "BDT",
    "CAD",
    "DKK",
    "SEK",
    "EUR",
    "GBP",
    "INR",
    "KES",
    "NGN",
    "NPR",
    "PKR",
    "USD",
  ];

  // State to handle multiple bank accounts
  const [bankAccounts, setBankAccounts] = useState(() => {
    if (mode === "edit" && initialData?.banks) {
      return initialData.banks.map((bank) => ({
        id: bank.id,
        rails: bank.rails || "",
        iban: bank.benef_iban || "",
        swift: bank.swift_code || "",
        intermediarySwift: bank.intermediary_bank_swift || "",
        routingNumber: bank.routing_number || "",
        accountNumber: bank.bank_acc_no || "",
        bankName: bank.bank_name || "",
        ifsc: bank.ifsc || "",
        bankCode: bank.bankCode || "",
        paymentMethod: bank.payment_method || paymentMethod,
        bankState: bank.bankState || "",
        branchCode: bank.branchCode || "",
        accountName: bank.account_name || "",
        accountTitle: bank.account_title || "",
        walletProvider: bank.wallet_provider || "",
        mobileNumber: bank.mobile_number || "",
        otherProvider: bank.other_provider || "",
        accountType: bank.account_type || "",
        sortCode: bank.sort_code || "",
        bankCountry: bank.bank_country || "",
      }));
    }

    return [
      {
        id: null,
        rails: "Local",
        iban: "",
        swift: "",
        intermediarySwift: "",
        routingNumber: "",
        accountNumber: "",
        bankName: "",
        ifsc: "",
        bankCode: "",
        paymentMethod: paymentMethod,
        bankState: "",
        branchCode: "",
        accountName: "",
        accountTitle: "",
        walletProvider: "",
        mobileNumber: "",
        otherProvider: "",
        accountType: "",
        sortCode: "",
        bankCountry: "",
      },
    ];
  });

  // Debug monitoring for NPR/KES/NGN currencies
  useEffect(() => {
    if (bankAccounts.length > 0 && ["NPR", "KES", "NGN"].includes(currency)) {
      console.log("🔍 Current bank account state:", {
        bankName: bankAccounts[0]?.bankName,
        bankCode: bankAccounts[0]?.bankCode,
        currency: currency,
        rails: bankAccounts[0]?.rails
      });
    }
  }, [bankAccounts, currency]);

  // Debug banks for NPR/KES/NGN
  useEffect(() => {
    if (["NPR", "KES", "NGN"].includes(currency)) {
      console.log(`🔍 Debugging ${currency} banks:`, {
        currency,
        banks: banks[currency],
        banksInt: banks[`${currency}_int`],
        allBanks: banks
      });
    }
  }, [currency, banks]);

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "white",
      border: state.isFocused ? "2px solid #3b82f6" : "1px solid #d1d5db",
      borderRadius: "0.5rem",
      padding: "4px 8px",
      fontSize: "0.875rem",
      color: "#111827",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      minHeight: "48px",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "#9ca3af",
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.5rem",
      boxShadow:
        "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      zIndex: 20,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#6b7280",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
          ? "#eff6ff"
          : "white",
      color: state.isSelected ? "white" : "#1f2937",
      padding: "12px 16px",
      fontSize: "0.875rem",
      "&:active": {
        backgroundColor: "#3b82f6",
        color: "white",
      },
    }),
  };

  // Formik initialization
  const formik = useFormik({
    initialValues: {
      name: initialData?.name || "",
      country_id: initialData?.country_id?.toString() || "",
      country_phone_code: initialData?.country_phone_code || "+1",
      phone_number: initialData?.phone_number || "",
      email: initialData?.email || "",
      beneftype: initialData?.beneftype || "",
      state: initialData?.state || "",
      city: initialData?.city || "",
      street: initialData?.street || "",
      postalcode: initialData?.postalcode || "",
      relationtobenef: initialData?.relationtobenef || "",
      otherRelationship: initialData?.otherRelationship || "",
      nationality_id: initialData?.nationality_id?.toString() || "",
      status: initialData?.status?.toString() || "1",
      nic_bcc_code: initialData?.nic_bcc_code || "",
      beneficiary_id_type: initialData?.beneficiary_id_type || "",
      beneficiary_id_number: initialData?.beneficiary_id_number || "",
    },
    onSubmit: () => {
      // Empty function - we'll handle submission in Step 2
    },
    enableReinitialize: mode === "edit",
  });

  // Cleanup function to handle component unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
      dispatch(resetCreateState());
      dispatch(clearUpdateState());
      dispatch(clearPhoneSearch());
      dispatch(clearBeneficiariesCreateState());
    };
  }, [dispatch]);

  // Debug mount
  useEffect(() => {
    console.log("🔍 BeneficiaryForm Component mounted with:");
    console.log("   Mode:", mode);
    console.log("   customerId:", customerId);
    console.log("   beneficiaryId:", beneficiaryId);
    console.log("   location.state:", location.state);
    console.log("   is_payout:", is_payout);
  }, [mode, customerId, beneficiaryId, location.state, is_payout]);

  // Fetch beneficiary data for edit mode
  useEffect(() => {
    if (mode === "create" && customerId && isMounted.current) {
      console.log("📥 Fetching beneficiaries for customer:", customerId);
      const fetchData = async () => {
        try {
          await dispatch(fetchBeneficiaries(customerId)).unwrap();
          if (isMounted.current) {
            setBeneficiariesLoaded(true);
            console.log(
              "✅ Beneficiaries loaded, count:",
              beneficiaries.length
            );
          }
        } catch (error) {
          console.error("Failed to fetch beneficiaries:", error);
          if (isMounted.current) {
            setBeneficiariesLoaded(true);
          }
        }
      };
      fetchData();
    }
  }, [dispatch, customerId, mode]);

  useEffect(() => {
    if (isAddBankOnlyMode && location.state?.existingBeneficiaryId) {
      console.log("📝 Add bank only mode - fetching beneficiary data:", location.state.existingBeneficiaryId);
      dispatch(fetchBeneficiaryById(location.state.existingBeneficiaryId));
      setStep(2); // Skip to bank information step
      setUsingExistingBeneficiary(true);
      setExistingBeneficiaryId(location.state.existingBeneficiaryId);

      // ✅ RESET bank accounts to a completely empty state for adding new bank
      setBankAccounts([{
        id: null,
        rails: "",
        iban: "",
        swift: "",
        intermediarySwift: "",
        routingNumber: "",
        accountNumber: "",
        bankName: "",
        ifsc: "",
        bankCode: "",
        paymentMethod: "",
        bankState: "",
        branchCode: "",
        accountName: "",
        accountTitle: "",
        walletProvider: "",
        mobileNumber: "",
        otherProvider: "",
        accountType: "",
        sortCode: "",
        bankCountry: "",
        currency: "" // Empty currency - user must select
      }]);

      // ✅ Reset currency to empty so user must select
      setCurrency("");
    }
  }, [isAddBankOnlyMode, location.state, dispatch]);

  // Sync countryCodeInput with formik value in edit mode
  useEffect(() => {
    if (mode === "edit" && formik.values.country_phone_code) {
      let phoneCode = formik.values.country_phone_code;

      // Find the matching option in phoneCodeOptions that starts with this phone code
      if (phoneCodeOptions.length > 0) {
        const matchingOption = phoneCodeOptions.find(option =>
          option.value.startsWith(phoneCode) ||
          option.value === phoneCode ||
          option.value.split('_')[0] === phoneCode
        );

        if (matchingOption) {
          console.log("📱 Found matching option:", matchingOption.value);
          setCountryCodeInput(matchingOption.value);
          setSelectedCountryCode(matchingOption.value);
        } else {
          // If no match found, keep the original
          setCountryCodeInput(phoneCode);
          setSelectedCountryCode(phoneCode);
        }
      } else {
        setCountryCodeInput(phoneCode);
        setSelectedCountryCode(phoneCode);
      }

      console.log("🔄 Synced countryCodeInput with formik value:", phoneCode);
    }
  }, [mode, formik.values.country_phone_code, phoneCodeOptions]);

  // Populate form when beneficiary data is loaded
  useEffect(() => {
    if (
      ((mode === "edit" && beneficiaryDetails && !initialData) ||
        (isAddBankOnlyMode && beneficiaryDetails)) &&
      isMounted.current
    ) {
      console.log(
        "📝 Populating form with beneficiary data:",
        beneficiaryDetails
      );

      formik.setValues({
        name: beneficiaryDetails.name || "",
        country_id: beneficiaryDetails.country_id?.toString() || "",
        country_phone_code: beneficiaryDetails.country_phone_code || "+1",
        phone_number: beneficiaryDetails.phone_number || "",
        email: beneficiaryDetails.email || "",
        beneftype: beneficiaryDetails.beneftype || "",
        state: beneficiaryDetails.state || "",
        city: beneficiaryDetails.city || "",
        street: beneficiaryDetails.street || "",
        postalcode: beneficiaryDetails.postalcode || "",
        relationtobenef: beneficiaryDetails.relationtobenef || "",
        otherRelationship: beneficiaryDetails.otherRelationship || "",
        nationality_id: beneficiaryDetails.nationality_id?.toString() || "",
        status: beneficiaryDetails.status?.toString() || "1",
        nic_bcc_code: beneficiaryDetails.nic_bcc_code || "",
        beneficiary_id_type: beneficiaryDetails.beneficiary_id_type || "",
        beneficiary_id_number: beneficiaryDetails.beneficiary_id_number || "",
      });

      // For addBankOnly mode, start with empty bank account
      if (isAddBankOnlyMode) {
        setBankAccounts([{
          id: null,
          rails: "",
          iban: "",
          swift: "",
          intermediarySwift: "",
          routingNumber: "",
          accountNumber: "",
          bankName: "",
          ifsc: "",
          bankCode: "",
          paymentMethod: paymentMethod,
          bankState: "",
          branchCode: "",
          accountName: "",
          accountTitle: "",
          walletProvider: "",
          mobileNumber: "",
          otherProvider: "",
          accountType: "",
          sortCode: "",
          bankCountry: "",
          currency: currency
        }]);
      } else if (
        beneficiaryDetails.banks &&
        beneficiaryDetails.banks.length > 0 &&
        isMounted.current
      ) {
        const firstBank = beneficiaryDetails.banks[0];
        setCurrency(firstBank.currency_code || firstBank.currency || "USD");
        setBankAccounts(
          beneficiaryDetails.banks.map((bank) => ({
            id: bank.id,
            rails: bank.rails || "",
            currency: bank.currency_code || currency,
            iban: bank.benef_iban || "",
            swift: bank.swift_code || "",
            intermediarySwift: bank.intermediary_bank_swift || "",
            routingNumber: bank.routing_number || "",
            accountNumber: bank.bank_acc_no || "",
            bankName: bank.bank_name || "",
            ifsc: bank.ifsc || "",
            bankCode: bank.bankCode || "",
            paymentMethod: bank.payment_method || paymentMethod,
            bankState: bank.bankState || "",
            branchCode: bank.branchCode || "",
            accountName: bank.account_name || "",
            accountTitle: bank.account_title || "",
            walletProvider: bank.wallet_provider || "",
            mobileNumber: bank.mobile_number || "",
            otherProvider: bank.other_provider || "",
            accountType: bank.account_type || "",
            sortCode: bank.sort_code || "",
            bankCountry: bank.bank_country || "",
          }))
        );
      }
    }
  }, [beneficiaryDetails, mode, initialData, isAddBankOnlyMode, formik.setValues, currency, paymentMethod]);

  // Fetch nationalities and countries immediately when component mounts
  useEffect(() => {
    if (isMounted.current) {
      console.log("🌍 Fetching nationalities and countries on mount...");
      dispatch(fetchNationalities());
      dispatch(fetchCountries());
    }
  }, [dispatch]);

  // Fetch banks and ID types based on step and currency
  useEffect(() => {
    if (step > 0 && isMounted.current && mode === "create") {
      console.log("🏦 Fetching banks and ID types for step:", step);
      console.log("🏦 Current currency:", currency);

      // Fetch banks based on currency
      if (["BDT", "LKR", "AUD", "PKR", "CAD"].includes(currency)) {
        dispatch(
          fetchBanksByCurrency({
            currency: currency,
            bankType: "int-banks"
          })
        );
      } else {
        // This includes NPR, KES, NGN, USD, EUR, GBP, etc.
        dispatch(
          fetchBanksByCurrency({
            currency: currency,
            bankType: "currency-payout-banks"
          })
        );
      }

      // Fetch ID types if needed
      if (["BDT", "INR", "PKR"].includes(currency)) {
        const benefType = formik.values.beneftype || "individual";
        console.log(`Fetching ID types for ${currency} with benefType: ${benefType}`);
        dispatch(fetchIdTypesByCurrency({
          currency: currency,
          benefType: benefType
        }));
      }
    }
  }, [step, dispatch, currency, mode]);

  // Handle errors and success with navigation - FIXED with mounted check
  useEffect(() => {
    console.log("🔄 DEBUG - Error handling useEffect triggered");

    // Store the current mounted state
    const mounted = isMounted.current;

    if (mode === "create") {
      // Only handle errors here, not success navigation
      // Success navigation is handled in handleSubmit immediately
      if (beneficiariesCreateError && mounted) {
        console.log(
          "❌ DEBUG - Create error detected in useEffect:",
          beneficiariesCreateError
        );
        toast.error(beneficiariesCreateError);
        dispatch(clearBeneficiariesCreateState());
      }
    } else if (mode === "edit") {
      // Edit mode error handling
      if (updateError && mounted) {
        toast.error(updateError);
        dispatch(clearUpdateState());
      }
    }
  }, [updateError, beneficiariesCreateError, dispatch, mode]);

  useEffect(() => {
    console.log("📊 State Debug:", {
      beneficiariesCreateSuccess,
      beneficiariesCreateError,
      createSuccess,
      createError,
      updateSuccess,
      updateError,
      mode,
    });
  }, [
    beneficiariesCreateSuccess,
    beneficiariesCreateError,
    createSuccess,
    createError,
    updateSuccess,
    updateError,
    mode,
  ]);

  // Handle edit bank only mode
  useEffect(() => {
    if (mode === "edit" && location.state?.editBankOnly && !bankDataInitialized.current) {
      bankDataInitialized.current = true;  // <-- Prevent re-running
      setEditBankOnlyMode(true);
      setStep(2);

      // If specific bank data is passed, pre-populate the bank account
      if (location.state?.bankData) {
        const bankData = location.state.bankData;
        const initialCurrency = bankData.currency_code || bankData.currency || "USD";

        setBankAccounts([{
          id: bankData.id,
          rails: bankData.rails || "",
          iban: bankData.benef_iban || "",
          swift: bankData.swift_code || "",
          intermediarySwift: bankData.intermediary_bank_swift || "",
          routingNumber: bankData.routing_number || "",
          accountNumber: bankData.bank_acc_no || "",
          bankName: bankData.bank_name || "",
          ifsc: bankData.ifsc || "",
          bankCode: bankData.bankCode || "",
          paymentMethod: bankData.payment_method || paymentMethod,
          bankState: bankData.bankState || "",
          branchCode: bankData.branchCode || "",
          accountName: bankData.account_name || "",
          accountTitle: bankData.account_title || "",
          walletProvider: bankData.wallet_provider || "",
          mobileNumber: bankData.mobile_number || "",
          otherProvider: bankData.other_provider || "",
          accountType: bankData.account_type || "",
          sortCode: bankData.sort_code || "",
          bankCountry: bankData.bank_country || "",
          currency: initialCurrency  // <-- Use local variable, not state
        }]);

        // Set the currency
        setCurrency(initialCurrency);
      }
    }
  }, [mode, location.state, paymentMethod]);  // <-- REMOVED currency from deps

  // Fetch cities when country changes
  useEffect(() => {
    if (formik.values.country_id && step > 0 && isMounted.current) {
      dispatch(fetchCitiesByCountry(formik.values.country_id));
    }
  }, [formik.values.country_id, dispatch, step]);

  // Get cities for selected country
  const getCitiesForCountry = () => {
    return cities[formik.values.country_id] || [];
  };

  const isFormValid = useCallback(() => {
    if (formik.values.beneftype === "") return false;

    if (
      formik.values.name === "" ||
      // formik.values.country_id === "" ||
      formik.values.country_phone_code === "" ||
      formik.values.phone_number === "" ||
      formik.values.city === "" ||
      formik.values.street === ""
    )
      return false;

    // if (formik.values.beneftype === "individual") {
    //   if (formik.values.relationtobenef === "") return false;
    // }

    if (currency === "BDT" || currency === "INR" || currency === "PKR") {
      if (
        formik.values.beneficiary_id_type === "" ||
        formik.values.beneficiary_id_number === ""
      )
        return false;

      if (currency === "INR" && formik.values.city === "") return false;
    }

    return true;
  }, [formik.values, currency]);

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;

    console.log("=== CURRENCY CHANGE START ===");
    console.log("New currency selected:", newCurrency);
    console.log("Previous currency:", currency);

    setCurrency(newCurrency);

    formik.setFieldValue("beneficiary_id_type", "");
    formik.setFieldValue("beneficiary_id_number", "");

    if (["BDT", "INR", "PKR"].includes(newCurrency)) {
      console.log(`Dispatching fetchIdTypesByCurrency for ${newCurrency}...`);
      dispatch(fetchIdTypesByCurrency({
        currency: newCurrency,
        benefType: formik.values.beneftype || "individual"
      }));
    }

    if (["BDT", "LKR", "AUD", "PKR", "CAD"].includes(newCurrency)) {
      dispatch(
        fetchBanksByCurrency({ currency: newCurrency, bankType: "int-banks" })
      );
    } else {
      dispatch(
        fetchBanksByCurrency({
          currency: newCurrency,
          bankType: "currency-payout-banks",
        })
      );
    }

    setBankAccounts((prevAccounts) =>
      prevAccounts.map((account) => ({
        ...account,
        currency: newCurrency,
      }))
    );

    console.log("=== CURRENCY CHANGE END ===");
  };

  const handleCancel = () => {
    const locationState = location.state || {};

    console.log("🔙 Cancel button clicked, locationState:", locationState);

    // Get the return path and step from location state
    const returnPath = locationState.cancelReturnTo || locationState.returnTo;
    const returnStep = locationState.cancelStep || locationState.returnStep || 2;
    const fromPage = locationState.from || "beneficiaries";

    console.log("🔙 Returning to:", returnPath, "step:", returnStep, "from:", fromPage);

    // Clear any search state
    if (phoneSearch.searched) {
      dispatch(clearPhoneSearch());
    }

    // If we have a return path from navigation state, use it
    if (returnPath) {
      // For Remittance, pass the step
      if (fromPage === "remittance") {
        navigate(returnPath, {
          state: {
            returnToStep: returnStep,
            from: "remittance",
          },
          replace: true
        });
      } else {
        // For Beneficiaries page, just go back
        navigate(returnPath, {
          replace: true
        });
      }
    } else {
      // Fallback: go back in history
      navigate(-1);
    }
  };

  const mapNationalityToId = (nationalityName, nationalitiesList) => {
    if (!nationalityName) return "";

    const found = nationalitiesList.find(
      (nat) => nat.name.toLowerCase() === nationalityName.toLowerCase()
    );

    return found ? found.id.toString() : "";
  };

  // Refetch ID types when beneficiary type changes for BDT/INR/PKR currencies
  useEffect(() => {
    if (formik.values.beneftype && ["BDT", "INR", "PKR"].includes(currency)) {
      console.log("Beneficiary type changed, refetching ID types...");
      dispatch(fetchIdTypesByCurrency({
        currency: currency,
        benefType: formik.values.beneftype
      }));
    }
  }, [formik.values.beneftype, currency, dispatch]);

  // Update the phone search results useEffect
  useEffect(() => {
    // Only run if we have searched AND we haven't already processed this data
    if (
      phoneSearch.searched &&
      phoneInput &&
      isMounted.current &&
      !phoneSearch.processed
    ) {
      console.log("📱 Phone search state changed:", phoneSearch);
      console.log("Does phone exist?", phoneSearch.exists);
      console.log("Phone search data:", phoneSearch.data);

      // IMPORTANT: Mark as processed immediately to prevent infinite loop
      dispatch(setPhoneSearchProcessed());

      // Handle found beneficiary
      if (phoneSearch.exists && phoneSearch.data) {
        const isCurrentCustomerBenefValue = phoneSearch.isCurrentCustomerBenef || "N";
        const beneficiaryData = phoneSearch.data;
        console.log("✅ Found beneficiary data:", beneficiaryData);

        // Map nationality if needed
        let nationalityId = beneficiaryData.nationality_id;

        // Store the flag
        setIsCurrentCustomerBenef(isCurrentCustomerBenefValue);

        // If nationality_id is empty but we have nationalities loaded, try to find by name
        if (
          !nationalityId &&
          beneficiaryData.nationality &&
          nationalities.length > 0
        ) {
          nationalityId = mapNationalityToId(
            beneficiaryData.nationality,
            nationalities
          );
          console.log(
            "🌍 Mapped nationality:",
            beneficiaryData.nationality,
            "→",
            nationalityId
          );
        }

        // Map relationship if needed
        let relationshipValue = beneficiaryData.relationtobenef;
        const relationshipMap = {
          Father: "father",
          Mother: "mother",
          Sister: "sister",
          Brother: "brother",
          Cousin: "cousin",
          Friend: "friend",
          Other: "other",
        };

        if (relationshipValue && relationshipMap[relationshipValue]) {
          relationshipValue = relationshipMap[relationshipValue];
          console.log(
            "👥 Mapped relationship:",
            beneficiaryData.relationtobenef,
            "→",
            relationshipValue
          );
        }

        // Get the first active bank to display currency
        const activeBanks = beneficiaryData.banks?.filter(bank => bank.deleted_at === null) || [];
        const firstBank = activeBanks.length > 0 ? activeBanks[0] : null;
        const displayCurrency = firstBank?.currency_code || beneficiaryData.currency || "N/A";

        // Get country name from countries list
        const countryName = countries.find(
          (c) => c.id === parseInt(beneficiaryData.country_id)
        )?.name || "N/A";

        // Prepare display data for the UI
        const displayData = {
          name: beneficiaryData.name || "N/A",
          email: beneficiaryData.email || "N/A",
          phone: beneficiaryData.full_phone_number || beneficiaryData.phone_number || phoneInput,
          country: countryName,
          currency: displayCurrency,
          id: beneficiaryData.id,
          banks: beneficiaryData.banks || []
        };

        console.log("📋 Display data for UI:", displayData);

        const formValues = {
          name: beneficiaryData.name || "",
          country_id: beneficiaryData.country_id?.toString() || "",
          country_phone_code:
            beneficiaryData.country_phone_code || countryCodeInput,
          phone_number: beneficiaryData.phone_number || phoneInput,
          email: beneficiaryData.email || "",
          beneftype: beneficiaryData.beneftype || "individual",
          state: beneficiaryData.state || "",
          city: beneficiaryData.city || "",
          street: beneficiaryData.street || "",
          postalcode: beneficiaryData.postalcode || "",
          relationtobenef: relationshipValue || "",
          otherRelationship: beneficiaryData.otherRelationship || "",
          nationality_id: nationalityId?.toString() || "",
          status: beneficiaryData.status?.toString() || "1",
          nic_bcc_code: beneficiaryData.nic_bcc_code || "",
          beneficiary_id_type: beneficiaryData.beneficiary_id_type || "",
          beneficiary_id_number: beneficiaryData.beneficiary_id_number || "",
        };

        console.log("📝 Form values to set:", formValues);

        // Set the form values
        formik.setValues(formValues);

        // Store beneficiary ID for later use
        if (beneficiaryData.id) {
          setExistingBeneficiaryId(beneficiaryData.id);

          // Also store in localStorage or state for display
          setFoundBeneficiary({
            ...beneficiaryData,
            displayName: displayData.name,
            displayEmail: displayData.email,
            displayPhone: displayData.phone,
            displayCountry: displayData.country,
            displayCurrency: displayData.currency
          });
        }

        // Set usingExistingBeneficiary based on the flag
        if (isCurrentCustomerBenefValue === "Y") {
          // This is already your beneficiary - cannot use or create new
          setUsingExistingBeneficiary(false);
          toast.info("This beneficiary is already associated with your account.");
        } else if (isCurrentCustomerBenefValue === "N") {
          // Beneficiary found but not yours - can use existing
          setUsingExistingBeneficiary(false);
          toast.success(`Beneficiary found: ${displayData.name}`);
        }

        // Important: Set showSearchResults to true to show the "Beneficiary Found" UI
        setShowSearchResults(true);

        toast.success(`Beneficiary found: ${displayData.name}`);

        // Don't automatically move to next step - let user choose

      } else if (
        phoneSearch.searched &&
        !phoneSearch.exists &&
        isMounted.current
      ) {
        // BENEFICIARY NOT FOUND - Show the "Create New" UI
        console.log("ℹ️ No beneficiary found, showing create new UI");

        // Don't show error toast, just info
        toast.info(
          "No existing beneficiary found with this phone number. You can create a new one."
        );

        // Set phone in formik for new beneficiary
        formik.setFieldValue("phone_number", phoneInput);
        formik.setFieldValue("country_phone_code", countryCodeInput);

        // Reset states for new beneficiary
        setFoundBeneficiary(null);
        setUsingExistingBeneficiary(false);
        setExistingBeneficiaryId(null);

        // Show the search results container with the "Create New" option
        setShowSearchResults(true);
      }
    }
  }, [
    phoneSearch,
    phoneInput,
    formik,
    nationalities,
    paymentMethod,
    dispatch,
    countryCodeInput,
    currency,
    countries, // Add countries to dependencies
  ]);

  // PHONE SEARCH FUNCTIONS

  const handlePhoneSearch = () => {
    if (!selectedBeneficiaryType) {
      toast.error("Please select beneficiary type (Individual or Institution)");
      return;
    }

    if (!phoneInput.trim()) {
      toast.error("Please enter a phone number to search");
      return;
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[+]?[0-9\s\-\(\)\.]+$/;
    if (!phoneRegex.test(phoneInput)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Clear previous search results first
    dispatch(clearPhoneSearch());
    setShowSearchResults(false);
    setFoundBeneficiary(null);
    setUsingExistingBeneficiary(false);
    setExistingBeneficiaryId(null);

    try {
      console.log("🔍 Dispatching phone search with:", {
        phoneNumber: phoneInput,
        countryPhoneCode: countryCodeInput,
        beneficiaryType: selectedBeneficiaryType,
      });

      dispatch(
        searchBeneficiaryByPhone({
          phoneNumber: phoneInput,
          countryPhoneCode: countryCodeInput,
          beneficiaryType: selectedBeneficiaryType,
        })
      );
    } catch (error) {
      console.error("Phone search error:", error);
      if (isMounted.current) {
        toast.error(error.message || "Failed to search for beneficiary");
      }
    }
  };

  const handleUseFoundBeneficiary = async () => {
    const beneficiaryToUse = foundBeneficiary || phoneSearch.data;

    if (!beneficiaryToUse) {
      toast.error("Beneficiary data not found. Please search again.");
      return;
    }

    const beneficiaryUuid = beneficiaryToUse.benef_uuid || beneficiaryToUse.uuid;

    if (!beneficiaryUuid) {
      toast.error("Beneficiary UUID not found. Cannot add this beneficiary.");
      return;
    }

    let customerUuid = localStorage.getItem("userUuid") || localStorage.getItem("customerUuid");

    if (!customerUuid) {
      const state = store.getState();
      customerUuid = state?.auth?.user?.uuid;
    }

    if (!customerUuid) {
      toast.error("Customer UUID not found. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      const result = await dispatch(addExistingBeneficiary({
        beneficiaryUuid: beneficiaryUuid,
        customerUuid: customerUuid
      })).unwrap();

      if (result.success) {
        toast.success("Beneficiary added successfully!");

        // Get the return path from location state
        const locationState = location.state || {};
        const fromPage = locationState.from || "beneficiaries"; // Default to beneficiaries page
        const returnPath = locationState.returnTo || `/beneficiaries/${customerId}`;
        const returnStep = locationState.returnStep || 2;

        console.log("🔄 Use Existing Beneficiary - From page:", fromPage);
        console.log("🔄 Returning to:", returnPath);

        // Check if we came from Remittance page
        if (fromPage === "remittance") {
          // Navigate back to Remittance with the new beneficiary
          navigate(returnPath, {
            state: {
              returnToStep: returnStep,
              from: "remittance",
              newBeneficiary: {
                id: result.beneficiaryId || beneficiaryToUse.id,
                uuid: beneficiaryUuid,
                name: beneficiaryToUse.name,
                phone_number: beneficiaryToUse.phone_number,
                email: beneficiaryToUse.email,
              }
            },
            replace: true
          });
        } else {
          // Navigate back to Beneficiaries page
          navigate(`/beneficiaries/${customerId}`, {
            state: {
              refresh: true,
              newBeneficiaryAdded: true,
              beneficiaryId: result.beneficiaryId || beneficiaryToUse.id
            },
            replace: true
          });
        }
      } else {
        toast.error(result.message || "Failed to add beneficiary. Please try again.");
      }
    } catch (error) {
      console.error("❌ Failed to add existing beneficiary:", error);
      toast.error(error.message || "Failed to add beneficiary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewBeneficiary = () => {
    setUsingExistingBeneficiary(false);
    setExistingBeneficiaryId(null);
    setFoundBeneficiary(null);
    setShowSearchResults(false);
    setPhoneInput("");
    dispatch(clearPhoneSearch());

    // Check if beneficiary was found or not
    const wasBeneficiaryFound = phoneSearch.exists === true;

    if (wasBeneficiaryFound) {
      // Beneficiary WAS found - DO NOT populate phone number
      console.log("Beneficiary was found, NOT populating phone number for new beneficiary");
      // Optionally clear the phone fields
      formik.setFieldValue("phone_number", "");
      formik.setFieldValue("country_phone_code", "");
      // Also clear the local state
      setCountryCodeInput("");
    } else {
      // Beneficiary was NOT found - populate the phone number they searched with
      console.log("Beneficiary not found, populating phone number for new beneficiary");
      formik.setFieldValue("phone_number", phoneInput);
      formik.setFieldValue("country_phone_code", countryCodeInput);
    }

    setStep(1);
  };

  const nextStep = async () => {
    // If in phone search step (step 0), handle differently
    if (step === 0) {
      // Check if beneficiary is already yours (Y) - prevent proceeding
      if (phoneSearch.isCurrentCustomerBenef === "Y") {
        toast.error("This beneficiary is already associated with your account. You cannot proceed.");
        return false;
      }

      // Check if beneficiary was found but not yours (N) - force use existing
      if (phoneSearch.isCurrentCustomerBenef === "N") {
        toast.error("Please click 'Use Existing Beneficiary' to proceed with this beneficiary.");
        return false;
      }

      if (!selectedBeneficiaryType) {
        toast.error("Please select beneficiary type");
        return false;
      }
      if (!phoneInput.trim()) {
        toast.error("Please enter a phone number to search");
        return false;
      }

      // Validate phone number (basic validation)
      const phoneRegex = /^[+]?[0-9\s\-\(\)\.]+$/;
      if (!phoneRegex.test(phoneInput)) {
        toast.error("Please enter a valid phone number");
        return false;
      }

      // If we have found a beneficiary and are using it
      if (usingExistingBeneficiary && foundBeneficiary) {
        console.log("Using existing beneficiary, moving to step 1");
        setStep(1);
        return true;
      }

      // If we have showSearchResults true and not using existing, we need to decide
      if (showSearchResults && !usingExistingBeneficiary) {
        // User chose to create new OR no beneficiary found
        console.log("Creating new beneficiary, moving to step 1");
        formik.setFieldValue("phone_number", phoneInput);
        formik.setFieldValue("country_phone_code", countryCodeInput);
        setStep(1);
        return true;
      }

      // If we haven't searched yet, perform the search
      if (!phoneSearch.searched && !showSearchResults) {
        console.log("Performing phone search...");
        handlePhoneSearch();
        return false; // Don't proceed yet, wait for search results
      }

      // If we've searched and found a beneficiary but user hasn't chosen
      if (phoneSearch.searched && phoneSearch.exists && !usingExistingBeneficiary && !showSearchResults) {
        toast.info("Please choose to use the existing beneficiary or create a new one");
        return false;
      }

      // Default fallback - just move to step 1
      console.log("Default case, moving to step 1");
      formik.setFieldValue("phone_number", phoneInput);
      formik.setFieldValue("country_phone_code", countryCodeInput);
      setStep(1);
      return true;
    }

    // For step 1 - VALIDATE BEFORE PROCEEDING
    if (step === 1) {
      // Currency-specific validations
      if (currency === "BDT" || currency === "INR" || currency === "PKR") {
        const countryInput = formik.values.country_id;
        if (countryInput === "" || countryInput === " ") {
          toast.error(`Country Required for Currency: ${currency}`);
          return false;
        }
        const streetInput = formik.values.street;
        if (streetInput === "" || streetInput === " ") {
          toast.error(`Street Required for Currency: ${currency}`);
          return false;
        }
        const idTypeInput = formik.values.beneficiary_id_type;
        if (idTypeInput === "" || idTypeInput === " ") {
          toast.error(`ID Type Required for Currency: ${currency}`);
          return false;
        }

        const idNumber = formik.values.beneficiary_id_number;
        if (idNumber === "" || idNumber === " ") {
          toast.error(`ID Number Required for Currency: ${currency}`);
          return false;
        }

        if (currency === "INR") {
          const cityInput = formik.values.city;
          if (cityInput === "" || cityInput === " ") {
            toast.error(`City Required for Currency: ${currency}`);
            return false;
          }
        }
      }

      // General form validation
      if (!isFormValid()) {
        toast.error("Please fill all required fields before proceeding");
        return false;
      }

      // NEW VALIDATION STEP - Only for new beneficiary creation
      if (mode === "create" && !usingExistingBeneficiary && !editBankOnlyMode && !isAddBankOnlyMode) {
        try {
          // Prepare validation payload
          let cleanedCountryCode = formik.values.country_phone_code || "";
          if (cleanedCountryCode.includes('_')) {
            cleanedCountryCode = cleanedCountryCode.split('_')[0];
          }
          if (cleanedCountryCode && !cleanedCountryCode.startsWith('+')) {
            cleanedCountryCode = `+${cleanedCountryCode}`;
          }

          // Get customer UUID from localStorage
          const customerUuid = localStorage.getItem("userUuid") ||
            localStorage.getItem("customerUuid") ||
            localStorage.getItem("uuid");

          console.log("🔍 Customer UUID from localStorage:", customerUuid);

          const validationPayload = {
            customer_id: customerUuid,  // Send customer UUID as customer_id value
            beneftype: formik.values.beneftype,
            name: formik.values.name,
            phone_number: formik.values.phone_number,
            email: formik.values.email,
            country_phone_code: cleanedCountryCode,
          };

          console.log("🔍 Validating beneficiary data:", validationPayload);

          // Show loading indicator
          setLoading(true);

          // Call the validation API
          const result = await dispatch(validateBeneficiaryCreate(validationPayload)).unwrap();

          console.log("✅ Validation successful:", result);

          // Validation passed - proceed to next step
          setValidationError(null);
          setLoading(false);
          setStep(step + 1);
          return true;

        } catch (error) {
          // Validation failed - Show error modal
          console.error("❌ Validation failed:", error);
          console.log("🔍 Error object:", error);

          // Format the error data for the modal
          let errorData = { message: 'Validation failed. Please check your details.' };

          // Check if error has response.data (from axios/fetch)
          if (error?.response?.data) {
            errorData = error.response.data;
            console.log("📦 Error from response.data:", errorData);
          }
          // Check if error is already the API response
          else if (error?.data) {
            errorData = error.data;
            console.log("📦 Error from data:", errorData);
          }
          // Check if error has message property
          else if (error?.message) {
            // If message is an object (like { customer_id: ["error"] })
            if (typeof error.message === 'object') {
              errorData = { message: error.message };
            } else {
              errorData = { message: error.message };
            }
            console.log("📦 Error with message:", errorData);
          }
          // If error is a string, try to parse it
          else if (typeof error === 'string') {
            try {
              const parsed = JSON.parse(error);
              errorData = parsed;
              console.log("📦 Parsed error string:", errorData);
            } catch (e) {
              errorData = { message: error };
              console.log("📦 Error as string:", errorData);
            }
          }

          console.log("📦 Final error data being passed to modal:", errorData);

          // Set error data and show modal
          setErrorModalData(errorData);
          setShowErrorModal(true);
          setValidationError(
            typeof errorData.message === 'object'
              ? JSON.stringify(errorData.message)
              : errorData.message || 'Validation failed'
          );
          setLoading(false);
          return false;
        }
      }
    }

    // For step 2, handle as before
    if (step === 2) {
      // Check if we can proceed to submit
      const invalidSwiftAccounts = bankAccounts.filter(
        (account) =>
          account.rails === "Swift" &&
          !isSwiftSupportedForCurrency(account.currency || currency)
      );

      if (invalidSwiftAccounts.length > 0) {
        toast.error(
          "SWIFT is not available for the selected currency(s). Please fix before proceeding."
        );
        return false;
      }

      // For edit mode or existing beneficiary, you might want to submit directly
      // or just proceed with the current logic
      return true;
    }

    // Default - move to next step
    setStep(step + 1);
    return true;
  };

  const prevStep = () => {
    if (step === 0) {
      // If at phone search step, go back
      navigate(-1);
    } else {
      setStep(step - 1);
    }
  };

  const resetForm = () => {
    setBankAccounts([
      {
        rails: "",
        iban: "",
        swift: "",
        intermediarySwift: "",
        routingNumber: "",
        accountNumber: "",
        sortCode: "",
        bankName: "",
        ifsc: "",
        bankCode: "",
        branchCode: branchCode,
        bankState: "",
        bankCountry: "",
      },
    ]);
  };

  const handleBankAccountChange = (index, field, value) => {
    const newBankAccounts = [...bankAccounts];
    newBankAccounts[index][field] = value;

    // Debug logging for bank name changes
    if (field === "bankName") {
      console.log(`🔄 Bank name updated for account ${index}:`, value);
      console.log("Updated bank account object:", newBankAccounts[index]);
    }

    setBankAccounts(newBankAccounts);
    if (field === "branchCode") {
      setBranchCode(value);
    }
  };

  // UPDATED: Handle submit for both new and existing beneficiaries
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔴 DEBUG - handleSubmit FUNCTION CALLED!");
    console.log(`🔄 Starting beneficiary ${mode}...`);
    console.log("Using existing beneficiary:", usingExistingBeneficiary);
    console.log("Existing beneficiary ID:", existingBeneficiaryId);

    setLoading(true);

    // For existing beneficiary flow, allow empty bank accounts
    if (usingExistingBeneficiary) {
      // Check if ANY bank account has rails selected
      const hasAnyRails = bankAccounts.some(account => account.rails && account.rails !== "");

      if (!hasAnyRails) {
        // No rails selected - this means user doesn't want to add a bank account
        console.log("ℹ️ No rails selected for existing beneficiary - will save without bank account");
        // Skip all bank validation and proceed to save
      } else {
        // User wants to add a bank account, so validate the selected rails
        console.log("🔍 Rails detected, validating bank details...");

        // Check if rails is missing for accounts that have other details
        const isRailsMissing = bankAccounts.some((account) => {
          const hasOtherDetails = account.accountNumber || account.iban || account.swift || account.bankName;
          if (hasOtherDetails && !account.rails) {
            return true;
          }
          return false;
        });

        if (isRailsMissing) {
          toast.error("Please select rails for the bank account you're adding");
          setLoading(false);
          return;
        }

        // Validate required fields for each selected rails
        for (const account of bankAccounts) {
          if (!account.rails) continue;

          const accountCurrency = account.currency || currency;

          if (account.rails === "Local") {
            if (accountCurrency === "USD" && !account.routingNumber) {
              toast.error("Routing Number is required for USD Local transfers");
              setLoading(false);
              return;
            }
            if ((accountCurrency === "EUR" || accountCurrency === "GBP" || accountCurrency === "AED") && !account.iban) {
              toast.error(`IBAN Number is required for ${accountCurrency} Local transfers`);
              setLoading(false);
              return;
            }
            if (accountCurrency === "INR" && (!account.ifsc || !account.accountNumber)) {
              toast.error("IFSC Code and Account Number are required for INR transfers");
              setLoading(false);
              return;
            }
            if ((accountCurrency === "NPR" || accountCurrency === "KES" || accountCurrency === "NGN") && !account.bankCode) {
              toast.error(`Bank selection is required for ${accountCurrency} transfers`);
              setLoading(false);
              return;
            }
            if ((accountCurrency === "GBP" || accountCurrency === "DKK" || accountCurrency === "SEK") && !account.sortCode) {
              toast.error(`Sort Code is required for ${accountCurrency} transfers`);
              setLoading(false);
              return;
            }
          } else if (account.rails === "Swift") {
            if (!account.swift) {
              toast.error("SWIFT/BIC Code is required for Swift transfers");
              setLoading(false);
              return;
            }
            if (!account.bankCountry) {
              toast.error("Bank Country is required for Swift transfers");
              setLoading(false);
              return;
            }
            const swiftCurrency = account.currency || currency;
            if ((swiftCurrency === "EUR" || swiftCurrency === "GBP") && !account.iban) {
              toast.error(`IBAN Number is required for ${swiftCurrency} Swift transfers`);
              setLoading(false);
              return;
            }
            if ((swiftCurrency === "USD" || swiftCurrency === "CAD") && !account.accountNumber) {
              toast.error(`Account Number is required for ${swiftCurrency} Swift transfers`);
              setLoading(false);
              return;
            }
          } else if (account.rails === "Mobile") {
            if (!account.walletProvider) {
              toast.error("Wallet Provider is required for Mobile transfers");
              setLoading(false);
              return;
            }
            if (!account.mobileNumber) {
              toast.error("Mobile Number is required for Mobile transfers");
              setLoading(false);
              return;
            }
          }
        }
      }
    } else {
      // Original validation for new beneficiary (non-existing)
      const isRailsMissing = bankAccounts.some((account) => !account.rails);
      if (isRailsMissing) {
        console.log("❌ DEBUG - Early return due to missing rails");
        toast.error("Please select rails for all bank accounts.");
        setLoading(false);
        return;
      }

      // Check invalid Swift accounts
      const invalidSwiftAccounts = bankAccounts.filter(
        (account) =>
          account.rails === "Swift" &&
          !isSwiftSupportedForCurrency(account.currency || currency)
      );
      if (invalidSwiftAccounts.length > 0) {
        toast.error("SWIFT is not available for the selected currency(s). Please fix before proceeding.");
        setLoading(false);
        return;
      }

      // Currency-specific validations
      if (currency === "BDT" || currency === "INR" || currency === "PKR") {
        if (!formik.values.beneficiary_id_type) {
          toast.error("Beneficiary ID Type is required");
          setLoading(false);
          return;
        }
        if (!formik.values.beneficiary_id_number) {
          toast.error("Beneficiary ID Number is required");
          setLoading(false);
          return;
        }
      }
    }

    const finalRelationship =
      formik.values.relationtobenef === "other" && formik.values.otherRelationship.trim() !== ""
        ? formik.values.otherRelationship.trim()
        : formik.values.relationtobenef;

    // Clean country phone code
    let cleanedCountryCode = formik.values.country_phone_code || "";
    if (cleanedCountryCode.includes('_')) {
      cleanedCountryCode = cleanedCountryCode.split('_')[0];
    }
    if (cleanedCountryCode && !cleanedCountryCode.startsWith('+')) {
      cleanedCountryCode = `+${cleanedCountryCode}`;
    }

    const beneficiaryData = {
      name: formik.values.name,
      country_id: formik.values.country_id,
      phone_number: formik.values.phone_number,
      email: formik.values.email,
      beneftype: formik.values.beneftype,
      state: formik.values.state,
      city: formik.values.city,
      street: formik.values.street,
      postalcode: formik.values.postalcode,
      relationtobenef: finalRelationship,
      nationality_id: formik.values.nationality_id,
      idType: formik.values.beneficiary_id_type,
      idNumber: formik.values.beneficiary_id_number,
      status: 1,
      address: "",
      nic_bcc_code: formik.values.nic_bcc_code,
      country_phone_code: cleanedCountryCode,
    };

    // Prepare bank accounts - filter out empty ones for existing beneficiary
    let bankAccountsToSend = [];

    if (usingExistingBeneficiary) {
      // For existing beneficiary, ONLY include bank accounts that have rails selected
      // This means if no rails, we send empty array (null payload)
      bankAccountsToSend = bankAccounts
        .filter(account => account.rails && account.rails !== "") // Only keep accounts with rails
        .map(account => ({
          ...account,
          currency_code: account.currency || currency,
        }));

      console.log(`📦 Bank accounts to send: ${bankAccountsToSend.length} (${bankAccountsToSend.length === 0 ? 'empty payload - no bank will be added' : 'with bank details'})`);
    } else {
      // For new beneficiary, include all bank accounts (already validated)
      bankAccountsToSend = bankAccounts.map(account => ({
        ...account,
        currency_code: account.currency || currency,
      }));
    }

    try {
      if (mode === "create" || isAddBankOnlyMode) {
        console.log("✨ Creating new beneficiary or adding bank to existing");
        console.log("Is add bank only mode:", isAddBankOnlyMode);
        console.log("Existing beneficiary ID:", existingBeneficiaryId);
        console.log("Bank accounts to add:", bankAccountsToSend.length);

        let result;

        if (isAddBankOnlyMode && existingBeneficiaryId) {
          // CALL THE ADD BENEF BANK API FOR ADDING BANK TO EXISTING BENEFICIARY
          console.log("📤 Calling addBeneficiaryBank API");

          // Prepare bank data for the API
          const bankData = bankAccountsToSend[0] || {};
          const currentCurrency = bankData.currency || currency;

          const payload = {
            benef_id: existingBeneficiaryId,
            benef_iban: bankData.iban || "",
            bic_code: bankData.swift || "",
            bank_name: bankData.bankName || "",
            bank_branch: bankData.branchCode || "",
            bank_address: bankData.bankState || "",
            bank_city: bankData.bankCity || "",
            bank_state: bankData.bankState || "",
            bank_country: bankData.bankCountry || "",
            ifsc: bankData.ifsc || "",
            sort_code: bankData.sortCode || "",
            account_number: bankData.accountNumber || "",
            account_type: bankData.accountType || "",
            payment_method: bankData.paymentMethod || "Local",
            routing_number: bankData.routingNumber || "",
            bank_acc_no: bankData.accountNumber || "",
            description: "",
            beneficiary_wallet: bankData.walletProvider || "",
            swift: bankData.swift || "",
            intermediary_bank_swift: bankData.intermediarySwift || "",
            rails: bankData.rails || "Local",
            currency_code: currentCurrency,
          };

          // Add ID fields for specific currencies
          if (["BDT", "INR", "PKR"].includes(currentCurrency)) {
            payload.beneficiary_id_type = formik.values.beneficiary_id_type;
            payload.beneficiary_id_number = formik.values.beneficiary_id_number;
          }

          // Special handling for NPR, KES, NGN currencies
          if (["NPR", "KES", "NGN"].includes(currentCurrency)) {
            if (bankData.bankCode) {
              payload.bank_code = bankData.bankCode;
            }
            if (bankData.accountName) {
              payload.account_name = bankData.accountName;
            }
          }

          // Remove empty values
          Object.keys(payload).forEach(key => {
            if (payload[key] === undefined || payload[key] === "") {
              delete payload[key];
            }
          });

          console.log("📤 Payload for addBeneficiaryBank:", payload);

          // Call the API to add bank to existing beneficiary
          result = await dispatch(addBeneficiaryBank({
            customerId: customerId,
            bankData: payload
          })).unwrap();

          console.log("📦 Add bank result:", result);

          toast.success("Bank account added successfully!");
          setTimeout(() => {
            navigate(-1);
          }, 1500);

        } else {
          // Original flow - create new beneficiary with banks
          result = await dispatch(
            createAndAddBeneficiary({
              customerId,
              beneficiaryData: {
                ...beneficiaryData,
                country_phone_code: cleanedCountryCode,
              },
              bankAccounts: bankAccountsToSend,
              currency: currency,
              country_code: cleanedCountryCode,
            })
          ).unwrap();

          console.log("📦 Create result:", result);

          // Handle different response scenarios
          if (result?.success === false) {
            toast.error(result.message || result.error || "Failed to create beneficiary.");
            setLoading(false);
            return;
          } else if (result?.success === true || result?.beneficiaryId || result?.warning) {
            if (bankAccountsToSend.length === 0) {
              toast.success("Beneficiary created successfully!");
            } else {
              toast.success("Beneficiary created successfully with bank account!");
            }
            setTimeout(() => {
              navigate(-1);
            }, 1500);
          } else if (result?.error) {
            toast.error(result.error);
            setLoading(false);
            return;
          } else {
            toast.success("Beneficiary created successfully!");
            setTimeout(() => {
              navigate(-1);
            }, 1500);
          }
        }
      } else if (mode === "edit") {
        // CHECK IF THIS IS BANK-ONLY EDIT MODE
        const isBankOnlyEdit = editBankOnlyMode || location.state?.editBankOnly;

        if (isBankOnlyEdit) {
          // Bank-only update requires bank details
          if (bankAccountsToSend.length === 0) {
            toast.error("No bank account details provided to update");
            setLoading(false);
            return;
          }

          // Get the bank ID
          const bankId = location.state?.bankId ||
            beneficiaryDetails?.banks?.[0]?.id ||
            initialData?.banks?.[0]?.id;

          if (!bankId) {
            toast.error("Bank ID not found. Cannot update bank details.");
            setLoading(false);
            return;
          }

          // Get the current currency
          const currentCurrency = bankAccounts[0]?.currency || currency;

          // Prepare base payload for bank update
          let bankData = {
            benef_id: beneficiaryId,
            benef_iban: bankAccounts[0]?.iban || "",
            bic_code: bankAccounts[0]?.swift || "",
            bank_name: bankAccounts[0]?.bankName || bankAccounts[0]?.bank_name || "",
            bank_branch: bankAccounts[0]?.branchCode || "",
            bank_address: bankAccounts[0]?.bankState || "",
            bank_city: bankAccounts[0]?.bankCity || "",
            bank_state: bankAccounts[0]?.bankState || "",
            bank_country: bankAccounts[0]?.bankCountry || "",
            ifsc: bankAccounts[0]?.ifsc || "",
            sort_code: bankAccounts[0]?.sortCode || "",
            account_number: bankAccounts[0]?.accountNumber || "",
            account_type: bankAccounts[0]?.accountType || "",
            payment_method: bankAccounts[0]?.paymentMethod || "Local",
            routing_number: bankAccounts[0]?.routingNumber || "",
            bank_acc_no: bankAccounts[0]?.accountNumber || "",
            description: "",
            beneficiary_wallet: bankAccounts[0]?.walletProvider || "",
            swift: bankAccounts[0]?.swift || "",
            intermediary_bank_swift: bankAccounts[0]?.intermediarySwift || "",
            rails: bankAccounts[0]?.rails || "Local",
            currency_code: currentCurrency,

            ...(currentCurrency === "INR" && {
              beneficiary_id_type: formik.values.beneficiary_id_type,
              beneficiary_id_number: formik.values.beneficiary_id_number,
            }),
          };

          // Special handling for NPR, KES, NGN currencies
          if (["NPR", "KES", "NGN"].includes(currentCurrency)) {
            console.log(`💰 Processing ${currentCurrency} bank update`);

            if (!bankData.bank_name && bankAccounts[0]?.bankName) {
              bankData.bank_name = bankAccounts[0].bankName;
            }

            if (bankAccounts[0]?.bankCode) {
              bankData.bank_code = bankAccounts[0].bankCode;
            }

            if (bankAccounts[0]?.branchCode) {
              bankData.branch_code = bankAccounts[0].branchCode;
            }

            if (bankAccounts[0]?.accountName) {
              bankData.account_name = bankAccounts[0].accountName;
            }

            console.log(`📤 ${currentCurrency} Bank Data:`, {
              bank_name: bankData.bank_name,
              bank_code: bankData.bank_code,
              account_number: bankData.account_number,
              branch_code: bankData.branch_code,
              currency_code: bankData.currency_code
            });
          }

          // Remove empty values
          Object.keys(bankData).forEach(key => {
            if (bankData[key] === undefined || bankData[key] === "") {
              delete bankData[key];
            }
          });

          console.log("📤 Dispatching updateBeneficiaryBank...");
          console.log("📤 Bank ID:", bankId);
          console.log("📤 Bank Data:", bankData);

          await dispatch(
            updateBeneficiaryBank({
              bankId: bankId,
              bankData: bankData,
            })
          ).unwrap();

          toast.success("Bank details updated successfully!");

          setTimeout(() => {
            navigate(-1);
          }, 1500);

        } else {
          // Full beneficiary update
          console.log("📤 Dispatching updateBeneficiary...");

          const result = await dispatch(
            updateBeneficiary({
              customerId,
              beneficiaryId,
              beneficiaryData: {
                ...beneficiaryData,
                country_phone_code: cleanedCountryCode,
              },
              bankAccounts: bankAccountsToSend,
              currency: currency,
            })
          ).unwrap();

          console.log("📦 Update result:", result);

          toast.success("Beneficiary updated successfully!");

          setTimeout(() => {
            navigate(-1);
          }, 1500);
        }
      }
    } catch (error) {
      console.error(`❌ ${mode} error:`, error);
      const errorMessage = typeof error === "string" ? error : error?.message;
      console.error("Error details:", error.message || error);

      // Show more specific error message
      if (errorMessage && errorMessage.includes("newBeneficiaryId")) {
        toast.error("Beneficiary created successfully! (ID retrieval pending)");
        // Still navigate back after a short delay
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error(`Failed to ${mode} beneficiary. Please try again.`);
      }
      setLoading(false);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const addBankAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      {
        id: null,
        rails: "",
        iban: "",
        swift: "",
        intermediarySwift: "",
        routingNumber: "",
        accountNumber: "",
        bankName: "",
        ifsc: "",
        bankCode: "",
        paymentMethod: paymentMethod,
        branchCode: "",
        accountName: "",
        accountTitle: "",
        walletProvider: "",
        mobileNumber: "",
        otherProvider: "",
        accountType: "",
        sortCode: "",
        bankCountry: "",
      },
    ]);
  };

  const removeBankAccount = async (index) => {
    console.log("🗑️ Remove bank account called at index:", index);

    // ADD THIS CHECK - Prevent deletion if only one bank account
    if (bankAccounts.length === 1) {
      toast.error("Cannot delete the only bank account. At least one bank account is required.");
      return;
    }

    const accountToRemove = bankAccounts[index];

    if (mode === "edit" && accountToRemove.id) {
      try {
        setLoading(true);
        await dispatch(deleteBeneficiaryBank({
          beneficiaryId: beneficiaryId,
          bankId: accountToRemove.id,
          customerId: customerId
        })).unwrap();

        const newBankAccounts = bankAccounts.filter((_, i) => i !== index);
        setBankAccounts(newBankAccounts);
        toast.success("Bank account removed successfully!");

        if (editBankOnlyMode && newBankAccounts.length === 0) {
          setTimeout(() => {
            navigate(-1);
          }, 1500);
        }
      } catch (error) {
        console.error("❌ Failed to delete bank account:", error);
        toast.error(error.message || "Failed to remove bank account");
      } finally {
        setLoading(false);
      }
    } else {
      const newBankAccounts = bankAccounts.filter((_, i) => i !== index);
      setBankAccounts(newBankAccounts);
      toast.info("Bank account removed from form");
    }
  };

  const handleBdtBankAccountChange = async (index, field, value) => {
    const newBankAccounts = [...bankAccounts];
    newBankAccounts[index][field] = value;
    setBankAccounts(newBankAccounts);

    if (field === "bankCode") {
      dispatch(fetchBankBranches(value));
    }
  };

  const handlePkrBankAccountChange = async (index, field, value) => {
    const newBankAccounts = [...bankAccounts];
    newBankAccounts[index][field] = value;
    setBankAccounts(newBankAccounts);
  };

  const handleCADBankAccountChange = async (index, field, value) => {
    const newBankAccounts = [...bankAccounts];
    newBankAccounts[index][field] = value;
    setBankAccounts(newBankAccounts);

    // If changing bank code, fetch branches for CAD
    if (field === "bankCode") {
      dispatch(fetchBankBranches(value));
    }
  };

  const getBanksForCurrency = useMemo(() => {
    // NPR, KES, NGN should use regular currency-payout-banks
    if (["BDT", "LKR", "AUD", "PKR", "CAD"].includes(currency)) {
      return banks[`${currency}_int`] || [];
    }
    // NPR, KES, NGN, USD, EUR, GBP, etc. will fall through to this
    return banks[currency] || [];
  }, [banks, currency]);

  const getIdTypesForCurrency = useMemo(() => {
    const currentBenefType = formik.values.beneftype || "individual";

    // Try to get from compound key first (new way)
    const compoundKey = `${currency}_${currentBenefType}`;
    let types = idTypes[compoundKey];

    // If not found, try with just currency (old way for backward compatibility)
    if (!types || types.length === 0) {
      types = idTypes[currency];
    }

    console.log(`Getting ID types for ${compoundKey}:`, types);

    if (!types || types.length === 0) {
      return [];
    }

    // Return the array of ID types
    return types;
  }, [idTypes, currency, formik.values.beneftype]);

  // Get bank branches for selected bank
  const getBankBranches = useMemo(() => {
    const currentBankCode = bankAccounts[0]?.bankCode;
    return currentBankCode ? bankBranches[currentBankCode] || [] : [];
  }, [bankBranches, bankAccounts]);

  // Phone code selector
  const renderPhoneCodeSelector = () => (
    <div className="w-full md:w-1/3">
      <Select
        className="text-sm"
        classNamePrefix="select"
        options={phoneCodeOptions}
        placeholder="Code..."
        isSearchable
        onChange={(selectedOption) => {
          setCountryCodeInput(selectedOption?.value || "+1");
          // Also update formik
          formik.setFieldValue(
            "country_phone_code",
            selectedOption?.value || "+1"
          );
        }}
        value={phoneCodeOptions.find(
          (option) => option.value === formik.values.country_phone_code
        )}
        formatOptionLabel={({ country, label }) => (
          <div className="flex items-center">
            {country?.flag_url && (
              <img
                src={country.flag_url}
                alt="Flag"
                className="w-6 h-4 mr-2 rounded-sm"
              />
            )}
            <span>{label}</span>
          </div>
        )}
        styles={customStyles}
      />
    </div>
  );

  // Country dropdown
  const renderCountryDropdown = () => (
    <select
      className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
      onChange={(e) => {
        const selectedCountryId = e.target.value;
        const selectedCountry = countries.find(
          (country) => country.id === parseInt(selectedCountryId)
        );

        formik.setFieldValue("country_id", selectedCountryId);

        if (selectedCountry) {
          // Get phone code from selected country - ensure it has + sign
          let countryPhoneCode = selectedCountry.phone_code || "+1";

          // If it doesn't start with +, add it
          if (!countryPhoneCode.startsWith("+")) {
            countryPhoneCode = `+${countryPhoneCode}`;
          }

          // Update formik with the correct phone code
          formik.setFieldValue("country_phone_code", countryPhoneCode);

          // Also update the phoneInput country code for search
          setCountryCodeInput(countryPhoneCode);
        }
      }}
      value={formik.values.country_id}
      name="country_id"
    >
      <option value="">Select Country</option>
      {countriesOptions.map((country) => (
        <option key={country.value} value={country.id}>
          {country.label} ({country.country_code})
        </option>
      ))}
    </select>
  );

  // Field label with optional indicator
  const FieldLabel = ({ children, required = false, info = null }) => (
    <div className="flex items-center justify-between mb-1">
      <label className="block text-sm font-medium text-gray-700">
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {info && (
        <div className="group relative">
          <FaInfoCircle
            className="text-gray-400 hover:text-gray-600 cursor-help"
            size={14}
          />
          <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            {info}
          </div>
        </div>
      )}
    </div>
  );

  // Render bank account fields
  const renderBankAccountFields = (index) => {
    const account = bankAccounts[index];
    const accountCurrency = account.currency || currency;
    const currentBanks = getBanksForCurrency;
    const currentIdTypes = getIdTypesForCurrency;
    const currentBankBranches = getBankBranches;

    return (
      <div
        key={index}
        className="p-6 border border-gray-200 rounded-xl bg-white mb-6 shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3">
              <FaUniversity size={16} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Bank Account {index + 1}
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs font-normal text-green-600">
                    (New Bank Account)
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                Fill in the banking details
                {usingExistingBeneficiary &&
                  " - Adding new bank account for existing beneficiary"}
              </p>
            </div>
          </div>
          {!editBankOnlyMode && (mode === "edit" || index > 0) && (
            <button
              type="button"
              onClick={() => removeBankAccount(index)}
              disabled={bankAccounts.length === 1}
              className={`flex items-center text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200 p-2 hover:bg-red-50 rounded-lg ${bankAccounts.length === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              title={bankAccounts.length === 1 ? "Cannot delete the only bank account" : "Delete this bank account"}
            >
              <FaTrash className="mr-2" size={14} />
              Remove
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Select Rails */}
          <div className="mb-4">
            <FieldLabel required={!usingExistingBeneficiary}>
              Select Rails
              {/* {usingExistingBeneficiary && (
                <span className="ml-1 text-xs text-gray-500">(Optional - Skip if no bank account to add)</span>
              )} */}
            </FieldLabel>
            <select
              className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
              value={account.rails || ""}
              onChange={(e) =>
                handleBankAccountChange(index, "rails", e.target.value)
              }
              required={!usingExistingBeneficiary}
            >
              <option value="">{usingExistingBeneficiary ? "Select Rails " : "Select Rails"}</option>
              <option value="Local">
                {accountCurrency === "GBP"
                  ? "FPS"
                  : accountCurrency === "EUR"
                    ? "SEPA"
                    : accountCurrency === "USD"
                      ? "ACH"
                      : "Bank"}
              </option>

              {/* CONDITIONAL SWIFT OPTION */}
              {isSwiftSupportedForCurrency(accountCurrency) ? (
                <option value="Swift">Swift</option>
              ) : (
                <option value="Swift" disabled>
                  Swift (Not available for {accountCurrency})
                </option>
              )}

              <option value="Mobile">Mobile</option>
            </select>
            {/* {usingExistingBeneficiary && !account.rails && (
              <div className="flex items-center mt-2 text-gray-500 text-sm">
                <FaInfoCircle className="mr-1" size={12} />
                <span>No rails selected - beneficiary will be saved without a bank account</span>
              </div>
            )} */}
            {account.rails && (
              <div className="flex items-center mt-2 text-green-600 text-sm">
                <FaCheckCircle className="mr-1" size={12} />
                <span>Rails selected: {account.rails}</span>
              </div>
            )}
          </div>

          {/* Select Currency */}
          {account.rails !== "Mobile" && (
            <div className="mb-4">
              <FieldLabel required>
                Select Currency
                {usingExistingBeneficiary && (
                  <span className="ml-1 text-xs text-green-600">(Select for this account)</span>
                )}
              </FieldLabel>
              <select
                className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                value={accountCurrency}
                onChange={(e) => {
                  handleCurrencyChange(e);
                }}
                required
              >
                <option value="">Select Currency</option>
                {localCurrencies.map((cur, i) => (
                  <option key={i} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Currency-Specific ID Fields */}
        {(accountCurrency === "BDT" ||
          accountCurrency === "INR" ||
          accountCurrency === "PKR") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="mb-4">
                <FieldLabel required info="Required for regulatory compliance">
                  Beneficiary ID Type
                  {usingExistingBeneficiary && (
                    <span className="ml-1 text-xs text-green-600">(Fill for this account)</span>
                  )}
                </FieldLabel>
                <select
                  className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                  value={formik.values.beneficiary_id_type}
                  onChange={formik.handleChange}
                  name="beneficiary_id_type"
                  required
                >
                  <option value="">Select ID Type</option>
                  {currentIdTypes.map((idType) => (
                    <option key={idType.name} value={idType.name}>
                      {idType.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <FieldLabel
                  required
                  info="Enter the ID number exactly as on the document"
                >
                  Beneficiary ID Number
                  {usingExistingBeneficiary && (
                    <span className="ml-1 text-xs text-green-600">(Fill for this account)</span>
                  )}
                </FieldLabel>
                <input
                  type="text"
                  className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                  placeholder="Enter ID Number"
                  value={formik.values.beneficiary_id_number}
                  onChange={formik.handleChange}
                  name="beneficiary_id_number"
                  required
                />
              </div>
            </div>
          )}

        {/* SWIFT TRANSFERS */}
        {account.rails === "Swift" && (
          <div>
            {isSwiftSupportedForCurrency(accountCurrency) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bank Country - MANDATORY for all */}
                <div className="mb-4">
                  <FieldLabel required>
                    Bank Country
                  </FieldLabel>
                  <select
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    value={account.bankCountry || ""}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "bankCountry",
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">-- Select Bank Country --</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SWIFT Code - MANDATORY for all */}
                <div className="mb-4">
                  <FieldLabel required info="Bank Identifier Code">
                    SWIFT/BIC Code
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter SWIFT/BIC code"
                    value={account.swift || ""}
                    onChange={(e) =>
                      handleBankAccountChange(index, "swift", e.target.value)
                    }
                    required
                  />
                </div>

                {/* For EUR and GBP: IBAN */}
                {(accountCurrency === "EUR" || accountCurrency === "GBP") && (
                  <div className="mb-4">
                    <FieldLabel required info="International Bank Account Number">
                      IBAN Number
                    </FieldLabel>
                    <input
                      type="text"
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      placeholder="Enter IBAN number"
                      value={account.iban || ""}
                      onChange={(e) =>
                        handleBankAccountChange(index, "iban", e.target.value)
                      }
                      required
                    />
                  </div>
                )}

                {/* For USD and CAD: Account Number */}
                {(accountCurrency === "USD" || accountCurrency === "CAD") && (
                  <div className="mb-4">
                    <FieldLabel required>Bank Account Number</FieldLabel>
                    <input
                      type="text"
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      placeholder="Enter account number"
                      value={account.accountNumber || ""}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "accountNumber",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                )}

                {/* Intermediary Bank SWIFT - OPTIONAL for all */}
                <div className="mb-4 md:col-span-2">
                  <FieldLabel info="Only if your bank requires an intermediary">
                    Intermediary Bank SWIFT (Optional)
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter intermediary bank SWIFT"
                    value={account.intermediarySwift || ""}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "intermediarySwift",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
                <div className="flex items-center text-yellow-700">
                  <FaExclamationTriangle className="mr-3" size={24} />
                  <div>
                    <h3 className="font-bold text-lg">SWIFT Not Available</h3>
                    <p className="text-sm">
                      Currently, SWIFT is not available for the selected currency.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOCAL TRANSFERS */}
        {account.rails === "Local" && (
          <div className="space-y-6">
            {/* USD Local Transfer */}
            {accountCurrency === "USD" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>
                    Payment Method
                  </FieldLabel>
                  <select
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    value={account.paymentMethod || ""}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "paymentMethod",
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="ACH">ACH</option>
                    <option value="Domestic Wire">Domestic Wire</option>
                  </select>
                </div>

                <div className="mb-4">
                  <FieldLabel required info="9-digit routing number">
                    Routing Number
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter routing number"
                    value={account.routingNumber || ""}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "routingNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>
                    Bank Account Number
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter account number"
                    value={account.accountNumber || ""}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "accountNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>
                    Bank Country
                  </FieldLabel>
                  <select
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    value={account.bankCountry || ""}
                    onChange={(e) => {
                      handleBankAccountChange(
                        index,
                        "bankCountry",
                        e.target.value
                      );
                    }}
                    required
                  >
                    <option value="">-- Select Bank Country --</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {account.paymentMethod === "ACH" && (
                  <div className="mb-4">
                    <FieldLabel required>
                      Account Type
                    </FieldLabel>
                    <select
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      value={account.accountType || ""}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "accountType",
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">Select Account Type</option>
                      <option value="Business Savings">Business Savings</option>
                      <option value="Business Checkings">
                        Business Checkings
                      </option>
                      <option value="Personal Checkings">
                        Personal Checkings
                      </option>
                      <option value="Personal Savings">Personal Savings</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* INR Local Transfer */}
            {accountCurrency === "INR" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>
                    Bank Name
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter Bank Name"
                    value={account.bankName || ""}
                    onChange={(e) =>
                      handleBankAccountChange(index, "bankName", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>
                    Account Number
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter Account Number"
                    value={account.accountNumber || ""}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "accountNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required info="Indian Financial System Code">
                    IFSC Code
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter IFSC Code"
                    value={account.ifsc || ""}
                    onChange={(e) =>
                      handleBankAccountChange(index, "ifsc", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>
                    Bank Country
                  </FieldLabel>
                  <Select
                    className="text-sm"
                    classNamePrefix="select"
                    options={countries.map(country => ({
                      value: country.id.toString(),
                      label: country.name
                    }))}
                    placeholder="Search and select bank country..."
                    isSearchable
                    value={
                      account.bankCountry
                        ? {
                          value: account.bankCountry,
                          label: countries.find(c => c.id.toString() === account.bankCountry)?.name || account.bankCountry
                        }
                        : null
                    }
                    onChange={(selectedOption) => {
                      handleBankAccountChange(index, "bankCountry", selectedOption?.value || "");
                    }}
                    styles={customStyles}
                    required
                  />
                </div>
              </div>
            )}

            {/* EUR Local Transfer */}
            {accountCurrency === "EUR" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>
                    IBAN Number
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter IBAN number"
                    value={account.iban || ""}
                    onChange={(e) =>
                      handleBankAccountChange(index, "iban", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>
                    Bank Country
                  </FieldLabel>
                  <select
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    value={account.bankCountry || ""}
                    onChange={(e) => {
                      handleBankAccountChange(
                        index,
                        "bankCountry",
                        e.target.value
                      );
                    }}
                    required
                  >
                    <option value="">-- Select Bank Country --</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* AED Local Transfer */}
            {accountCurrency === "AED" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>
                    IBAN Number
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter IBAN number"
                    value={account.iban || ""}
                    onChange={(e) =>
                      handleBankAccountChange(index, "iban", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>
                    SWIFT/BIC Code
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter SWIFT/BIC code"
                    value={account.swift || ""}
                    onChange={(e) =>
                      handleBankAccountChange(index, "swift", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            )}

            {/* NPR/KES/NGN Local Transfer - FIXED VERSION */}
            {(accountCurrency === "NPR" ||
              accountCurrency === "KES" ||
              accountCurrency === "NGN") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="mb-4">
                    <FieldLabel required>
                      Bank Name
                    </FieldLabel>
                    <select
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      value={account.bankCode || ""}
                      onChange={(e) => {
                        const selectedBankCode = e.target.value;
                        console.log("Selected bank code:", selectedBankCode);
                        console.log("Available banks:", currentBanks);

                        // Find the selected bank by matching the value
                        const selectedBank = currentBanks.find(
                          (bank) => {
                            const bankValue = bank.id || bank.bank_code;
                            console.log("Comparing:", bankValue, "with:", selectedBankCode);
                            return String(bankValue) === String(selectedBankCode);
                          }
                        );

                        if (selectedBank) {
                          const bankNameValue = selectedBank.name || selectedBank.bank_name;
                          console.log(`🏦 Bank selected - Code: ${selectedBankCode}, Name: ${bankNameValue}`);

                          // Update both bankCode and bankName
                          handleBankAccountChange(index, "bankCode", selectedBankCode);
                          handleBankAccountChange(index, "bankName", bankNameValue);
                        } else {
                          console.error("Bank not found for code:", selectedBankCode);
                        }
                      }}
                      required
                    >
                      <option value="">Select Bank</option>
                      {currentBanks && currentBanks.length > 0 ? (
                        currentBanks.map((bank) => {
                          const bankValue = bank.id || bank.bank_code;
                          const bankLabel = bank.name || bank.bank_name;
                          return (
                            <option key={bankValue} value={bankValue}>
                              {bankLabel}
                            </option>
                          );
                        })
                      ) : (
                        <option value="" disabled>No banks available</option>
                      )}
                    </select>
                  </div>

                  <div className="mb-4">
                    <FieldLabel required>
                      Account Number
                    </FieldLabel>
                    <input
                      type="text"
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      placeholder="Enter account number"
                      value={account.accountNumber || ""}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "accountNumber",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  {accountCurrency === "NGN" && (
                    <div className="mb-4">
                      <FieldLabel>
                        Account Name
                      </FieldLabel>
                      <input
                        type="text"
                        className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                        placeholder="Enter account name"
                        value={account.accountName || ""}
                        onChange={(e) =>
                          handleBankAccountChange(
                            index,
                            "accountName",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}

            {/* BDT/LKR/AUD/PKR/CAD Local Transfer */}
            {(accountCurrency === "BDT" ||
              accountCurrency === "LKR" ||
              accountCurrency === "AUD" ||
              accountCurrency === "PKR" ||
              accountCurrency === "CAD") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bank Name field */}
                  <div className="mb-4">
                    <FieldLabel required>
                      Bank Name
                    </FieldLabel>
                    {currentBanks && currentBanks.length > 0 ? (
                      <select
                        className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                        value={account.bankCode || ""}
                        onChange={(e) => {
                          if (
                            accountCurrency === "BDT" ||
                            accountCurrency === "LKR" ||
                            accountCurrency === "AUD"
                          ) {
                            handleBdtBankAccountChange(index, "bankCode", e.target.value);
                          } else if (accountCurrency === "CAD") {
                            handleCADBankAccountChange(index, "bankCode", e.target.value);
                          } else {
                            handlePkrBankAccountChange(index, "bankCode", e.target.value);
                          }

                          const selectedBank = currentBanks.find(
                            (bank) => bank.bank_code === e.target.value
                          );
                          if (selectedBank) {
                            handleBankAccountChange(
                              index,
                              "bankName",
                              selectedBank.bank_name || selectedBank.name
                            );
                          }
                        }}
                        required
                      >
                        <option value="">Select Bank</option>
                        {currentBanks.map((bank) => (
                          <option key={bank.bank_code} value={bank.bank_code}>
                            {bank.bank_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <input
                          type="text"
                          className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                          placeholder="Enter Bank Name"
                          value={account.bankName || ""}
                          onChange={(e) =>
                            handleBankAccountChange(index, "bankName", e.target.value)
                          }
                          required
                        />
                        {accountCurrency === "CAD" && (
                          <p className="text-xs text-amber-600 mt-1">
                            <FaExclamationTriangle className="inline mr-1" size={10} />
                            No bank list available. Please enter the bank name manually.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Account Number field */}
                  <div className="mb-4">
                    <FieldLabel required>
                      Account Number
                    </FieldLabel>
                    <input
                      type="text"
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      placeholder="Enter account number"
                      value={account.accountNumber || ""}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "accountNumber",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  {/* Branch Code field */}
                  <div className="mb-4">
                    <FieldLabel>
                      Branch Code
                    </FieldLabel>
                    {(accountCurrency === "BDT" ||
                      accountCurrency === "LKR" ||
                      accountCurrency === "AUD" ||
                      accountCurrency === "CAD") ? (
                      <select
                        className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                        value={account.branchCode || ""}
                        onChange={(e) =>
                          handleBankAccountChange(
                            index,
                            "branchCode",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select Branch</option>
                        {currentBankBranches.map((branch) => (
                          <option
                            key={branch.branch_code}
                            value={branch.branch_code}
                          >
                            {branch.bank_branch_name} - {branch.branch_code}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                        placeholder="Enter branch code"
                        value={account.branchCode || ""}
                        onChange={(e) =>
                          handleBankAccountChange(
                            index,
                            "branchCode",
                            e.target.value
                          )
                        }
                      />
                    )}
                  </div>

                  {/* Bank State field */}
                  <div className="mb-4">
                    <FieldLabel>
                      Bank State
                    </FieldLabel>
                    <input
                      type="text"
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      placeholder="Enter bank state"
                      value={account.bankState || ""}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "bankState",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  {/* BANK COUNTRY FIELD - ADD THIS FOR CAD */}
                  <div className="mb-4">
                    <FieldLabel required>
                      Bank Country
                    </FieldLabel>
                    <select
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      value={account.bankCountry || ""}
                      onChange={(e) => {
                        handleBankAccountChange(
                          index,
                          "bankCountry",
                          e.target.value
                        );
                      }}
                      required
                    >
                      <option value="">-- Select Bank Country --</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Conditional IBAN and Account Title for PKR and CAD */}
                  {(accountCurrency === "PKR" || accountCurrency === "CAD") && (
                    <>
                      <div className="mb-4">
                        <FieldLabel>
                          IBAN Number
                        </FieldLabel>
                        <input
                          type="text"
                          className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                          placeholder="Enter IBAN number"
                          value={account.iban || ""}
                          onChange={(e) =>
                            handleBankAccountChange(index, "iban", e.target.value)
                          }
                        />
                      </div>
                      <div className="mb-4">
                        <FieldLabel>
                          Account Title
                        </FieldLabel>
                        <input
                          type="text"
                          className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                          placeholder="Enter account title"
                          value={account.accountTitle || ""}
                          onChange={(e) =>
                            handleBankAccountChange(
                              index,
                              "accountTitle",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

            {/* GBP/DKK/SEK Local Transfer */}
            {(accountCurrency === "GBP" || accountCurrency === "DKK" || accountCurrency === "SEK") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>
                    Account Number
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter Account Number"
                    value={account.accountNumber || ""}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "accountNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>
                    Sort Code
                  </FieldLabel>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                    placeholder="Enter Sort Code"
                    value={account.sortCode || ""}
                    onChange={(e) =>
                      handleBankAccountChange(index, "sortCode", e.target.value)
                    }
                    required
                  />
                </div>

                {["GBP", "EUR", "CAD", "DKK", "SEK"].includes(accountCurrency) && (
                  <div className="mb-4">
                    <FieldLabel required>
                      Bank Country
                    </FieldLabel>
                    <select
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      value={account.bankCountry || ""}
                      onChange={(e) => {
                        handleBankAccountChange(
                          index,
                          "bankCountry",
                          e.target.value
                        );
                      }}
                      required
                    >
                      <option value="">-- Select Bank Country --</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* IBAN for DKK */}
                {(accountCurrency === "DKK") && (
                  <div className="mb-4">
                    <FieldLabel required>
                      IBAN Number
                    </FieldLabel>
                    <input
                      type="text"
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      placeholder="Enter IBAN number"
                      value={account.iban || ""}
                      onChange={(e) =>
                        handleBankAccountChange(index, "iban", e.target.value)
                      }
                      required
                    />
                  </div>
                )}

                {/* SWIFT Code for DKK*/}
                {(accountCurrency === "DKK") && (
                  <div className="mb-4">
                    <FieldLabel required info="Bank Identifier Code">
                      SWIFT/BIC Code
                    </FieldLabel>
                    <input
                      type="text"
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                      placeholder="Enter SWIFT/BIC code"
                      value={account.swift || ""}
                      onChange={(e) =>
                        handleBankAccountChange(index, "swift", e.target.value)
                      }
                      // required
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MOBILE TRANSFERS */}
        {account.rails === "Mobile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <FieldLabel required info="Mobile wallet service provider">
                Mobile Wallet Provider
              </FieldLabel>
              <select
                className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                value={account.walletProvider || ""}
                onChange={(e) =>
                  handleBankAccountChange(
                    index,
                    "walletProvider",
                    e.target.value
                  )
                }
                required
              >
                <option value="">Select Provider</option>
                <option value="M-Pesa">M-Pesa (Kenya)</option>
                <option value="EasyPaisa">EasyPaisa (Pakistan)</option>
                <option value="bKash">bKash (Bangladesh)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <FieldLabel required>
                Mobile Number
              </FieldLabel>
              <input
                type="text"
                className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                placeholder="Enter mobile number"
                value={account.mobileNumber || ""}
                onChange={(e) =>
                  handleBankAccountChange(index, "mobileNumber", e.target.value)
                }
                required
              />
            </div>

            {account.walletProvider === "Other" && (
              <div className="mb-4 md:col-span-2">
                <FieldLabel required>
                  Provider Name
                </FieldLabel>
                <input
                  type="text"
                  className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white`}
                  placeholder="Enter provider name"
                  value={account.otherProvider || ""}
                  onChange={(e) =>
                    handleBankAccountChange(
                      index,
                      "otherProvider",
                      e.target.value
                    )
                  }
                  required
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Step 0 - Phone Search
  const renderPhoneSearchStep = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-2xl border border-blue-200">
        <div className="flex flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
            <FaPhone size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base sm:text-xl font-bold text-gray-800">
              Search Existing Beneficiary
            </h2>
            <p className="text-xs sm:text-base text-gray-600">
              Enter the beneficiary's phone number to check if they already
              exist in the system.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Beneficiary Type Selector */}
        <div>
          <FieldLabel required info="Select whether you're searching for an individual or institution">
            Select Beneficiary Type
          </FieldLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedBeneficiaryType("individual");
                formik.setFieldValue("beneftype", "individual");
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${selectedBeneficiaryType === "individual"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
            >
              <div className="font-medium">Individual</div>
              <div className="text-sm text-gray-500">Personal beneficiary</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedBeneficiaryType("institution");
                formik.setFieldValue("beneftype", "institution");
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${selectedBeneficiaryType === "institution"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
            >
              <div className="font-medium">Institution</div>
              <div className="text-sm text-gray-500">Company or organization</div>
            </button>
          </div>
        </div>

        {/* Phone Input */}
        <div>
          <FieldLabel
            required
            info="Enter the phone number of the beneficiary you want to add"
          >
            Beneficiary Phone Number
          </FieldLabel>

          {/* Country Code and Phone Number Row */}
          <div className="flex flex-col md:flex-row gap-2">
            {/* Country Code Selector */}
            <div className="w-full md:w-1/3">
              <Select
                className="text-sm"
                classNamePrefix="select"
                options={phoneCodeOptions}
                placeholder="Search Country Code..."
                isSearchable
                onChange={(selectedOption) => {
                  setCountryCodeInput(selectedOption?.value || "+1");
                  setSelectedCountryCode(selectedOption?.value || "+1");
                }}
                value={phoneCodeOptions.find(
                  (option) => option.value === countryCodeInput
                )}
                formatOptionLabel={({ country, label }) => (
                  <div className="flex items-center">
                    {country?.flag_url && (
                      <img
                        src={country.flag_url}
                        alt="Flag"
                        className="w-6 h-4 mr-2 rounded-sm"
                      />
                    )}
                    <span>{label}</span>
                  </div>
                )}
                styles={customStyles}
              />
            </div>

            {/* Phone Number Input and Search Button - Maintain original desktop layout */}
            <div className="flex gap-2 w-full md:flex-1">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  if (phoneSearch.searched) {
                    dispatch(clearPhoneSearch());
                    setShowSearchResults(false);
                    setFoundBeneficiary(null);
                    setUsingExistingBeneficiary(false);
                    setExistingBeneficiaryId(null);
                  }
                }}
                className="flex-1 px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                placeholder="Enter phone number"
                disabled={phoneSearchLoading}
              />
              {/* Desktop Search Button - Visible on all screens, but we'll add mobile version below */}
              <button
                type="button"
                onClick={handlePhoneSearch}
                disabled={!phoneInput.trim() || phoneSearchLoading || !selectedBeneficiaryType}
                className={`hidden md:flex px-6 py-3 rounded-xl transition-all duration-300 whitespace-nowrap items-center ${phoneSearchLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : !phoneInput.trim() || !selectedBeneficiaryType
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
              >
                {phoneSearchLoading ? (
                  <>
                    <RingLoader size={16} color="#ffffff" className="mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <FaSearch className="mr-2" />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Button - Only visible on mobile */}
          <div className="mt-3 md:hidden">
            <button
              type="button"
              onClick={handlePhoneSearch}
              disabled={!phoneInput.trim() || phoneSearchLoading || !selectedBeneficiaryType}
              className={`w-full px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center ${phoneSearchLoading
                ? "bg-gray-300 cursor-not-allowed"
                : !phoneInput.trim() || !selectedBeneficiaryType
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
            >
              {phoneSearchLoading ? (
                <>
                  <RingLoader size={16} color="#ffffff" className="mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <FaSearch className="mr-2" />
                  Search
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            We'll check if a beneficiary with this phone number already exists
          </p>
        </div>

        {/* Search Results */}
        {(showSearchResults || (phoneSearch.searched && !phoneSearchLoading)) && (
          <div
            className={`p-4 sm:p-6 rounded-xl border-2 ${phoneSearch.isCurrentCustomerBenef === "Y"
              ? "border-red-200 bg-red-50"
              : phoneSearch.isCurrentCustomerBenef === "N"
                ? "border-yellow-200 bg-yellow-50"
                : "border-green-200 bg-green-50"
              }`}
          >
            {phoneSearch.isCurrentCustomerBenef === "Y" ? (
              // Case Y: Already your beneficiary - Cannot use or create new
              <div>
                <div className="flex flex-row items-start sm:items-center text-red-700 mb-4 gap-3">
                  <FaExclamationTriangle size={18} className="sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Beneficiary Already Exists!</h3>
                    <p className="text-xs sm:text-sm">
                      A beneficiary is already associated with this phone number. We cannot create a new beneficiary with the same phone number
                    </p>
                  </div>
                </div>

                {/* Beneficiary Details */}
                <div className="mb-6 p-3 sm:p-4 bg-white rounded-lg border border-red-100 overflow-x-auto">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                    Beneficiary Details:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs sm:text-sm text-gray-500">Name:</span>
                      <p className="font-medium text-sm sm:text-base break-words">
                        {foundBeneficiary?.displayName || foundBeneficiary?.name || phoneSearch.data?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm text-gray-500">Email:</span>
                      <p className="font-medium text-sm sm:text-base break-words">
                        {foundBeneficiary?.displayEmail || foundBeneficiary?.email || phoneSearch.data?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm text-gray-500">Phone:</span>
                      <p className="font-medium text-sm sm:text-base break-words">
                        {foundBeneficiary?.displayPhone || foundBeneficiary?.full_phone_number || foundBeneficiary?.phone_number || phoneSearch.data?.full_phone_number || phoneSearch.data?.phone_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm text-gray-500">Country:</span>
                      <p className="font-medium text-sm sm:text-base break-words">
                        {foundBeneficiary?.displayCountry || (() => {
                          const countryId = foundBeneficiary?.country_id || phoneSearch.data?.country_id;
                          if (countryId) {
                            const country = countries.find(c => c.id === parseInt(countryId));
                            return country?.name || "N/A";
                          }
                          return "N/A";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearchResults(false);
                      setPhoneInput("");
                      setFoundBeneficiary(null);
                      setUsingExistingBeneficiary(false);
                      setExistingBeneficiaryId(null);
                      setIsCurrentCustomerBenef(null);
                      dispatch(clearPhoneSearch());
                    }}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center justify-center font-medium text-sm sm:text-base"
                  >
                    <FaSearch className="mr-2" size={14} />
                    Search Again
                  </button>
                </div>
              </div>
            ) : phoneSearch.isCurrentCustomerBenef === "N" ? (
              // Case N: Beneficiary found but not yours - Show Use Existing Beneficiary
              <div>
                <div className="flex flex-row items-start sm:items-center text-yellow-700 mb-4 gap-3">
                  <FaExclamationTriangle size={18} className="sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Beneficiary Found!</h3>
                    <p className="text-xs sm:text-sm">
                      We found an existing beneficiary with this phone number
                    </p>
                  </div>
                </div>

                {/* Beneficiary Details */}
                <div className="mb-6 p-3 sm:p-4 bg-white rounded-lg border border-yellow-100 overflow-x-auto">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                    Existing Beneficiary Details:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs sm:text-sm text-gray-500">Name:</span>
                      <p className="font-medium text-sm sm:text-base break-words">
                        {foundBeneficiary?.displayName || foundBeneficiary?.name || phoneSearch.data?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm text-gray-500">Email:</span>
                      <p className="font-medium text-sm sm:text-base break-words">
                        {foundBeneficiary?.displayEmail || foundBeneficiary?.email || phoneSearch.data?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm text-gray-500">Phone:</span>
                      <p className="font-medium text-sm sm:text-base break-words">
                        {foundBeneficiary?.displayPhone || foundBeneficiary?.full_phone_number || foundBeneficiary?.phone_number || phoneSearch.data?.full_phone_number || phoneSearch.data?.phone_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm text-gray-500">Country:</span>
                      <p className="font-medium text-sm sm:text-base break-words">
                        {foundBeneficiary?.displayCountry || (() => {
                          const countryId = foundBeneficiary?.country_id || phoneSearch.data?.country_id;
                          if (countryId) {
                            const country = countries.find(c => c.id === parseInt(countryId));
                            return country?.name || "N/A";
                          }
                          return "N/A";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={handleUseFoundBeneficiary}
                    disabled={loading || addExistingBeneficiaryLoading}
                    className={`w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-300 flex items-center justify-center font-medium text-sm sm:text-base ${loading || addExistingBeneficiaryLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-yellow-500 hover:bg-yellow-600 text-white"
                      }`}
                  >
                    {loading || addExistingBeneficiaryLoading ? (
                      <>
                        <RingLoader size={16} color="#ffffff" className="mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" size={14} />
                        Use Existing Beneficiary
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (!phoneSearch.exists && phoneSearch.searched) || (!usingExistingBeneficiary && showSearchResults && !phoneSearch.exists) ? (
              // No beneficiary found - Show Create New
              <div>
                <div className="flex flex-row items-start sm:items-center text-green-700 mb-4 gap-3">
                  <FaCheckCircle size={18} className="sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">
                      No Existing Beneficiary Found
                    </h3>
                    <p className="text-xs sm:text-sm">
                      You can create a new beneficiary with this phone number
                    </p>
                  </div>
                </div>

                <div className="mb-6 p-3 sm:p-4 bg-white rounded-lg border border-green-100">
                  <p className="text-sm sm:text-base text-gray-700 break-words">
                    No beneficiary was found with the phone number{" "}
                    <span className="font-semibold">{phoneInput}</span>. You can
                    proceed to create a new beneficiary.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateNewBeneficiary}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 flex items-center justify-center font-medium text-sm sm:text-base"
                >
                  <FaUser className="mr-2" size={14} />
                  Create New Beneficiary
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex-1 flex items-center justify-center font-medium text-sm sm:text-base order-2 sm:order-1"
          >
            <FaArrowLeft className="mr-2" size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={
              phoneSearchLoading ||
              !phoneInput.trim() ||
              !selectedBeneficiaryType ||
              phoneSearch.isCurrentCustomerBenef === "Y" ||  // DISABLE WHEN Y
              phoneSearch.isCurrentCustomerBenef === "N"     // DISABLE WHEN N - force use existing beneficiary
            }
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 font-medium text-sm sm:text-base order-1 sm:order-2 ${phoneSearchLoading ||
              !phoneInput.trim() ||
              !selectedBeneficiaryType ||
              phoneSearch.isCurrentCustomerBenef === "Y" ||  // DISABLE WHEN Y
              phoneSearch.isCurrentCustomerBenef === "N"     // DISABLE WHEN N - force use existing beneficiary
              ? "bg-gray-300 cursor-not-allowed text-gray-500"
              : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
              }`}
          >
            {phoneSearchLoading ? (
              <>
                <RingLoader size={16} color="#ffffff" className="mr-2" />
                Searching...
              </>
            ) : phoneSearch.isCurrentCustomerBenef === "Y" ? (
              <>
                <FaExclamationTriangle className="mr-2" size={14} />
                Cannot Proceed
              </>
            ) : phoneSearch.isCurrentCustomerBenef === "N" ? (
              <>
                <FaInfoCircle className="mr-2" size={14} />
                Use Existing
              </>
            ) : (
              <>
                Continue
                <FaChevronRight className="ml-2" size={12} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Add this check early in the render
  if (!customerId) {
    return (
      <AlertBox
        message="Customer ID is missing. Please navigate to this page through the proper route."
        onClose={() => navigate("/dashboard")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Loading spinner - Overlay */}
      {(isLoading ||
        createLoading ||
        updateLoading ||
        beneficiariesCreateLoading ||
        bankUpdateLoading ||
        bankDeleteLoading) && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-75 z-50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center transform transition-all duration-300 scale-105">
              <RingLoader size={60} color="#3B82F6" />
              <p className="mt-6 text-gray-700 font-medium">
                {bankUpdateLoading ? "Updating bank details..." :
                  bankDeleteLoading ? "Removing bank account..." :
                    "Processing your request..."}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                This may take a few moments
              </p>
            </div>
          </div>
        )}

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <FaMoneyBillWave className="mr-3" size={24} />
                {isAddBankOnlyMode ? "Add Bank Account" :
                  mode === "create"
                    ? usingExistingBeneficiary
                      ? "Add Bank Account to Existing Beneficiary"
                      : "Add New Beneficiary"
                    : editBankOnlyMode
                      ? "Edit Bank Details"
                      : "Edit Beneficiary"}
              </h1>
              <p className="text-blue-100 mt-1 text-sm">
                {isAddBankOnlyMode ? "Add a new bank account to an existing beneficiary" :
                  mode === "create"
                    ? usingExistingBeneficiary
                      ? "Add a new bank account to an existing beneficiary"
                      : "Fill in the details to add a new beneficiary"
                    : editBankOnlyMode
                      ? "Update the bank account information for this beneficiary"
                      : "Update beneficiary information"}
              </p>
              {/* <p className="text-blue-100 mt-1 text-sm">
                {mode === "create"
                  ? usingExistingBeneficiary
                    ? "Add a new bank account to an existing beneficiary"
                    : "Fill in the details to add a new beneficiary"
                  : editBankOnlyMode
                    ? "Update the bank account information for this beneficiary"
                    : "Update beneficiary information"}
              </p> */}
            </div>
            <button
              onClick={handleCancel}
              className="flex items-center text-white hover:text-blue-100 transition-colors duration-200 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg mt-4 md:mt-0"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>
          </div>

          {/* Progress Steps - Only show for create mode */}
          {mode === "create" && !isAddBankOnlyMode && (
            <div className="relative pt-4">
              {/* Mobile Version - Simplified */}
              <div className="md:hidden">
                <div className="flex justify-between mb-2">
                  {steps.map((stepItem) => (
                    <div
                      key={stepItem.number}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 border-white ${step === stepItem.number
                          ? "bg-blue-500"
                          : step > stepItem.number
                            ? "bg-blue-400"
                            : "bg-blue-300"
                          } text-white font-bold text-sm shadow-lg`}
                      >
                        {stepItem.number}
                      </div>
                      <div className="text-center mt-2">
                        <div className="text-xs font-semibold text-white">
                          {stepItem.title.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute top-6 left-0 right-0 h-1 bg-blue-400 -z-10">
                  <div
                    className="h-full bg-white transition-all duration-500 ease-out"
                    style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                  />
                </div>
                <div className="text-center mt-3">
                  <div className="text-xs text-blue-200">
                    {steps[step]?.description}
                  </div>
                </div>
              </div>

              {/* Desktop Version - Original Layout */}
              <div className="hidden md:block">
                <div className="flex justify-between mb-2">
                  {steps.map((stepItem) => (
                    <div
                      key={stepItem.number}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${step === stepItem.number
                          ? "bg-blue-500"
                          : step > stepItem.number
                            ? "bg-blue-400"
                            : "bg-blue-300"
                          } text-white font-bold text-lg shadow-lg`}
                      >
                        {step === stepItem.number ? (
                          <div className="animate-pulse">{stepItem.number}</div>
                        ) : (
                          stepItem.number
                        )}
                      </div>
                      <div className="text-center mt-3">
                        <div className="text-sm font-semibold text-white">
                          {stepItem.title}
                        </div>
                        <div className="text-xs text-blue-200">
                          {stepItem.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute top-8 left-0 right-0 h-2 bg-blue-400 -z-10">
                  <div
                    className="h-full bg-white transition-all duration-500 ease-out"
                    style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* Step Indicator - Only show for create mode */}
          {mode === "create" && !isAddBankOnlyMode && (
            <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${step === 0 && mode === "create"
                    ? "bg-blue-600 text-white"
                    : step >= 1
                      ? step === 1
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-600"
                      : "bg-blue-100 text-blue-600"
                    }`}
                >
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {usingExistingBeneficiary && step === 2
                      ? "Add New Bank Account"
                      : steps[step]?.title || steps[1]?.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {usingExistingBeneficiary && step === 2
                      ? "Fill in the bank account details for the existing beneficiary"
                      : steps[step]?.description || steps[1]?.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 0: Phone Search - Hide in editBankOnlyMode and isAddBankOnlyMode */}
          {mode === "create" && step === 0 && !editBankOnlyMode && !isAddBankOnlyMode && renderPhoneSearchStep()}

          {/* STEP 1: Beneficiary Details - Hide in editBankOnlyMode and isAddBankOnlyMode */}
          {!editBankOnlyMode && !isAddBankOnlyMode && (step === 1 || mode === "edit") && (
            <form
              onSubmit={(e) => {
                if (mode === "create") {
                  e.preventDefault();
                  nextStep();
                } else {
                  handleSubmit(e);
                }
              }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Beneficiary Type */}
                <div className="md:col-span-2">
                  <FieldLabel
                    required
                    info="Select whether the beneficiary is an individual or an institution"
                  >
                    Beneficiary Type
                  </FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formik.values.beneftype === "individual"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        } ${usingExistingBeneficiary
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                        }`}
                      onClick={() => {
                        if (!usingExistingBeneficiary) {
                          formik.setFieldValue("beneftype", "individual");
                          setShowOtherRelationship(false);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${formik.values.beneftype === "individual"
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                            } ${usingExistingBeneficiary ? "opacity-50" : ""}`}
                        >
                          {formik.values.beneftype === "individual" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            Individual
                            {usingExistingBeneficiary && (
                              <span className="ml-2 text-xs text-gray-500">
                                (Pre-filled - Cannot Edit)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Personal beneficiary
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formik.values.beneftype === "institution"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        } ${usingExistingBeneficiary
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                        }`}
                      onClick={() => {
                        if (!usingExistingBeneficiary) {
                          formik.setFieldValue("beneftype", "institution");
                          setShowOtherRelationship(false);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${formik.values.beneftype === "institution"
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                            } ${usingExistingBeneficiary ? "opacity-50" : ""}`}
                        >
                          {formik.values.beneftype === "institution" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            Institution
                            {usingExistingBeneficiary && (
                              <span className="ml-2 text-xs text-gray-500">
                                (Pre-filled - Cannot Edit)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Company or organization
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {usingExistingBeneficiary && (
                    <p className="text-sm text-yellow-600 mt-2">
                      <FaInfoCircle className="inline mr-1" />
                      Using existing beneficiary information. Personal details cannot be edited.
                    </p>
                  )}
                </div>

                {/* Currency Selection */}
                {mode === "create" && !usingExistingBeneficiary && (
                  <div className="md:col-span-2">
                    <FieldLabel required>
                      Select Currency
                    </FieldLabel>
                    <div className="relative">
                      <select
                        className={`w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none ${usingExistingBeneficiary
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                          }`}
                        onChange={handleCurrencyChange}
                        value={currency}
                        disabled={usingExistingBeneficiary}
                      >
                        <option value="">Select Currency</option>
                        {localCurrencies.map((cur, i) => (
                          <option key={i} value={cur}>
                            {cur}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <FaChevronRight className="text-gray-400 rotate-90" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ALWAYS SHOW THESE FIELDS */}
                <>
                  {/* Name */}
                  <div>
                    <FieldLabel required>
                      Name
                      {usingExistingBeneficiary && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Pre-filled - Cannot Edit)
                        </span>
                      )}
                    </FieldLabel>
                    <input
                      id="name"
                      type="text"
                      className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${usingExistingBeneficiary
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white"
                        }`}
                      placeholder="Enter beneficiary name"
                      value={formik.values.name}
                      name="name"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={usingExistingBeneficiary}
                      readOnly={usingExistingBeneficiary}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <FieldLabel info="For notifications and receipts" required>
                      Email
                      {usingExistingBeneficiary && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Pre-filled - Cannot Edit)
                        </span>
                      )}
                    </FieldLabel>
                    <div className="flex gap-2">
                      <input
                        id="email"
                        type="email"
                        value={formik.values.email}
                        onChange={(e) => {
                          if (!usingExistingBeneficiary) {
                            formik.handleChange(e);
                          }
                        }}
                        onBlur={formik.handleBlur}
                        className={`flex-1 px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${usingExistingBeneficiary
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                          }`}
                        placeholder="email@example.com"
                        disabled={usingExistingBeneficiary}
                        readOnly={usingExistingBeneficiary}
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="md:col-span-2">
                    <FieldLabel required>
                      Phone Number
                      {usingExistingBeneficiary && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Pre-filled - Cannot Edit)
                        </span>
                      )}
                    </FieldLabel>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div
                        className={`w-full md:w-1/3 ${usingExistingBeneficiary ? "opacity-70" : ""
                          }`}
                      >
                        <Select
                          className="text-sm"
                          classNamePrefix="select"
                          options={phoneCodeOptions}
                          placeholder="Code..."
                          isSearchable
                          onChange={(selectedOption) => {
                            if (!usingExistingBeneficiary) {
                              const selectedValue = selectedOption?.value || "+1";
                              setCountryCodeInput(selectedValue);
                              setSelectedCountryCode(selectedValue);
                              formik.setFieldValue("country_phone_code", selectedValue);
                            }
                          }}
                          value={phoneCodeOptions.find(
                            (option) => option.value === countryCodeInput
                          )}
                          formatOptionLabel={({ country, label }) => (
                            <div className="flex items-center">
                              {country?.flag_url && (
                                <img
                                  src={country.flag_url}
                                  alt="Flag"
                                  className="w-6 h-4 mr-2 rounded-sm"
                                />
                              )}
                              <span>{label}</span>
                            </div>
                          )}
                          styles={customStyles}
                          isDisabled={usingExistingBeneficiary}
                        />
                      </div>
                      <div className="flex gap-2 w-full md:flex-1">
                        <input
                          id="phone_number"
                          type="tel"
                          className={`flex-1 px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${usingExistingBeneficiary
                            ? "bg-gray-100 cursor-not-allowed"
                            : "bg-white"
                            }`}
                          placeholder="Enter phone number"
                          value={formik.values.phone_number}
                          name="phone_number"
                          onChange={(e) => {
                            if (!usingExistingBeneficiary) {
                              formik.handleChange(e);
                            }
                          }}
                          onBlur={formik.handleBlur}
                          disabled={usingExistingBeneficiary}
                          readOnly={usingExistingBeneficiary}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nationality - Only show for individuals, not institutions */}
                  {formik.values.beneftype === "individual" && (
                    <div>
                      <FieldLabel>
                        Nationality
                        {usingExistingBeneficiary && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Pre-filled - Cannot Edit)
                          </span>
                        )}
                      </FieldLabel>
                      <Select
                        className="text-sm"
                        classNamePrefix="select"
                        options={nationalities.map((nationality) => ({
                          value: nationality.id.toString(),
                          label: nationality.name,
                        }))}
                        placeholder="Search and select nationality..."
                        isSearchable
                        isDisabled={usingExistingBeneficiary}
                        value={
                          formik.values.nationality_id
                            ? {
                              value: formik.values.nationality_id,
                              label:
                                nationalities.find(
                                  (n) => n.id.toString() === formik.values.nationality_id
                                )?.name || formik.values.nationality_id,
                            }
                            : null
                        }
                        onChange={(selectedOption) => {
                          if (!usingExistingBeneficiary) {
                            formik.setFieldValue("nationality_id", selectedOption?.value || "");
                          }
                        }}
                        styles={customStyles}
                      />
                    </div>
                  )}

                  {/* Country */}
                  <div>
                    <FieldLabel >
                      Country
                      {usingExistingBeneficiary && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Pre-filled - Cannot Edit)
                        </span>
                      )}
                    </FieldLabel>
                    <Select
                      className="text-sm"
                      classNamePrefix="select"
                      options={countriesOptions.map((country) => ({
                        value: country.id.toString(),
                        label: `${country.label} (${country.country_code})`,
                      }))}
                      placeholder="Search and select country..."
                      isSearchable
                      isDisabled={usingExistingBeneficiary}
                      value={
                        formik.values.country_id
                          ? {
                            value: formik.values.country_id,
                            label: (() => {
                              const c = countriesOptions.find(
                                (country) => country.id.toString() === formik.values.country_id
                              );
                              return c ? `${c.label} (${c.country_code})` : formik.values.country_id;
                            })(),
                          }
                          : null
                      }
                      onChange={(selectedOption) => {
                        if (!usingExistingBeneficiary) {
                          const selectedCountryId = selectedOption?.value || "";
                          const selectedCountry = countries.find(
                            (country) => country.id === parseInt(selectedCountryId)
                          );

                          formik.setFieldValue("country_id", selectedCountryId);

                          if (selectedCountry) {
                            formik.setFieldValue(
                              "country_phone_code",
                              selectedCountry.phone_code || "+1"
                            );
                          }
                        }
                      }}
                      styles={customStyles}
                    />
                  </div>

                  {/* City */}
                  {formik.values.country_id === "88" ||
                    formik.values.country_id === "185" ? (
                    <div>
                      <FieldLabel required>
                        City
                        {usingExistingBeneficiary && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Pre-filled - Cannot Edit)
                          </span>
                        )}
                      </FieldLabel>
                      <div className="relative">
                        <select
                          id="city"
                          name="city"
                          value={formik.values.city}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none ${usingExistingBeneficiary
                            ? "bg-gray-100 cursor-not-allowed"
                            : "bg-white"
                            }`}
                          disabled={usingExistingBeneficiary}
                        >
                          <option value="">Select City</option>
                          {getCitiesForCountry().map((city) => (
                            <option key={city.id} value={city.city_name}>
                              {city.city_name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <FaChevronRight className="text-gray-400 rotate-90" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <FieldLabel required>
                        City
                        {usingExistingBeneficiary && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Pre-filled - Cannot Edit)
                          </span>
                        )}
                      </FieldLabel>
                      <input
                        id="city"
                        type="text"
                        value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${usingExistingBeneficiary
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                          }`}
                        placeholder="Enter city"
                        disabled={usingExistingBeneficiary}
                        readOnly={usingExistingBeneficiary}
                      />
                    </div>
                  )}

                  {/* State */}
                  <div>
                    <FieldLabel>
                      State / Province
                      {usingExistingBeneficiary && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Pre-filled - Cannot Edit)
                        </span>
                      )}
                    </FieldLabel>
                    <input
                      id="state"
                      type="text"
                      value={formik.values.state}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${usingExistingBeneficiary
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white"
                        }`}
                      placeholder="Enter state or province"
                      disabled={usingExistingBeneficiary}
                      readOnly={usingExistingBeneficiary}
                    />
                  </div>

                  {/* Street */}
                  <div>
                    <FieldLabel required>
                      Street Address
                      {usingExistingBeneficiary && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Pre-filled - Cannot Edit)
                        </span>
                      )}
                    </FieldLabel>
                    <input
                      id="street"
                      type="text"
                      value={formik.values.street}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${usingExistingBeneficiary
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white"
                        }`}
                      placeholder="Enter street address"
                      disabled={usingExistingBeneficiary}
                      readOnly={usingExistingBeneficiary}
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <FieldLabel>
                      Zip Code / Postal Code
                      {usingExistingBeneficiary && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Pre-filled - Cannot Edit)
                        </span>
                      )}
                    </FieldLabel>
                    <input
                      id="postalcode"
                      type="text"
                      value={formik.values.postalcode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${usingExistingBeneficiary
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white"
                        }`}
                      placeholder="Enter postal code"
                      disabled={usingExistingBeneficiary}
                      readOnly={usingExistingBeneficiary}
                    />
                  </div>

                  {/* Beneficiary ID Type (for specific currencies) */}
                  {/* {(currency === "BDT" || currency === "INR" || currency === "PKR") && (
                    <div>
                      <FieldLabel required>
                        Beneficiary ID Type
                        {usingExistingBeneficiary && (
                          <span className="ml-2 text-xs text-gray-500">
                            (New - Fill for this bank account)
                          </span>
                        )}
                      </FieldLabel>
                      <div className="relative">
                        <select
                          className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none ${usingExistingBeneficiary ? "bg-gray-100" : "bg-white"}`}
                          value={formik.values.beneficiary_id_type}
                          onChange={formik.handleChange}
                          name="beneficiary_id_type"
                          required
                        >
                          <option value="">Select ID Type</option>
                          {getIdTypesForCurrency.map((idType) => (
                            <option key={idType.id} value={idType.name}>
                              {idType.name.charAt(0).toUpperCase() + idType.name.slice(1).replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <FaChevronRight className="text-gray-400 rotate-90" />
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* Beneficiary ID Number (for specific currencies) */}
                  {/* Beneficiary ID Fields - Conditional based on beneficiary type */}
                  {(currency === "BDT" || currency === "INR" || currency === "PKR") && (
                    <>
                      <div>
                        <FieldLabel required>
                          {formik.values.beneftype === "institution" ? "Company ID Type" : "Beneficiary ID Type"}
                          {usingExistingBeneficiary && (
                            <span className="ml-2 text-xs text-gray-500">
                              (New - Fill for this bank account)
                            </span>
                          )}
                        </FieldLabel>
                        <div className="relative">
                          <select
                            className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none ${usingExistingBeneficiary ? "bg-gray-100" : "bg-white"}`}
                            value={formik.values.beneficiary_id_type}
                            onChange={formik.handleChange}
                            name="beneficiary_id_type"
                            required
                          >
                            <option value="">Select ID Type</option>
                            {getIdTypesForCurrency.map((idType) => (
                              <option key={idType.id} value={idType.name}>
                                {idType.name.charAt(0).toUpperCase() + idType.name.slice(1).replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <FaChevronRight className="text-gray-400 rotate-90" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <FieldLabel required>
                          {formik.values.beneftype === "institution" ? "Company ID Number" : "Beneficiary ID Number"}
                          {usingExistingBeneficiary && (
                            <span className="ml-2 text-xs text-gray-500">
                              (New - Fill for this bank account)
                            </span>
                          )}
                        </FieldLabel>
                        <input
                          type="text"
                          className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${usingExistingBeneficiary ? "bg-gray-100" : "bg-white"}`}
                          placeholder={formik.values.beneftype === "institution" ? "Enter Company Registration Number" : "Enter ID Number"}
                          value={formik.values.beneficiary_id_number}
                          onChange={formik.handleChange}
                          name="beneficiary_id_number"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Relation to Beneficiary (only for individual) */}
                  {formik.values.beneftype === "individual" && (
                    <div className="md:col-span-2">
                      <FieldLabel>
                        Relation to Beneficiary
                        {usingExistingBeneficiary && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Pre-filled - Cannot Edit)
                          </span>
                        )}
                      </FieldLabel>
                      <div className="relative">
                        <select
                          id="relationtobenef"
                          name="relationtobenef"
                          value={formik.values.relationtobenef}
                          onChange={(e) => {
                            if (!usingExistingBeneficiary) {
                              formik.handleChange(e);
                              setShowOtherRelationship(
                                e.target.value === "other"
                              );
                            }
                          }}
                          onBlur={formik.handleBlur}
                          className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none ${usingExistingBeneficiary
                            ? "bg-gray-100 cursor-not-allowed"
                            : "bg-white"
                            }`}
                          disabled={usingExistingBeneficiary}
                        >
                          <option value="">-- Select Relationship --</option>
                          {relationshipOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <FaChevronRight className="text-gray-400 rotate-90" />
                        </div>
                      </div>

                      {/* Show input field when "Other" is selected */}
                      {showOtherRelationship && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                          <FieldLabel>Please specify relationship</FieldLabel>
                          <input
                            id="otherRelationship"
                            type="text"
                            className={`w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${usingExistingBeneficiary
                              ? "bg-gray-100 cursor-not-allowed"
                              : "bg-white"
                              }`}
                            placeholder="Enter relationship"
                            value={formik.values.otherRelationship || ""}
                            name="otherRelationship"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={usingExistingBeneficiary}
                            readOnly={usingExistingBeneficiary}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse md:flex-row justify-between pt-8 gap-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    console.log("🔙 Back button clicked");
                    navigate(-1);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex-1 md:flex-none flex items-center justify-center font-medium"
                >
                  <FaChevronLeft className="mr-2" />
                  Back
                </button>
                {mode === "create" ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={isLoading || validateLoading}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 md:flex-none font-medium ${isLoading || validateLoading
                      ? "bg-gray-300 cursor-not-allowed text-gray-500"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
                      }`}
                  >
                    {isLoading || validateLoading ? (
                      <>
                        <RingLoader size={20} color="#ffffff" className="mr-2" />
                        {validateLoading ? "Validating..." : "Loading..."}
                      </>
                    ) : (
                      <>
                        Next Step
                        <FaChevronRight className="ml-2" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading || updateLoading || bankUpdateLoading}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 md:flex-none font-medium ${isLoading || updateLoading || bankUpdateLoading
                      ? "bg-gray-300 cursor-not-allowed text-gray-500"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                      }`}
                  >
                    {isLoading || updateLoading || bankUpdateLoading ? (
                      <>
                        <RingLoader color="#ffffff" size={20} className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" />
                        Update Beneficiary
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Step 2 - Bank Information - Shows for editBankOnlyMode and isAddBankOnlyMode */}
          {((mode === "create" && step === 2) || editBankOnlyMode || isAddBankOnlyMode) && (
            <div className="space-y-8">
              {/* Info banner for bank-only edit mode or existing beneficiary */}
              {editBankOnlyMode && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaInfoCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        You are in bank details edit mode. Update the bank account information below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {usingExistingBeneficiary && !editBankOnlyMode && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaCheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        You are adding a new bank account to an existing beneficiary.
                        Fill in the bank details below to add a new account for this beneficiary.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {bankAccounts.map((account, index) =>
                  renderBankAccountFields(index)
                )}

                {/* Add Bank Account Button */}
                {mode === "create" && (
                  <button
                    type="button"
                    onClick={addBankAccount}
                    disabled={usingExistingBeneficiary}
                    className={`w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center ${usingExistingBeneficiary
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-blue-400 hover:bg-blue-50"
                      }`}
                  >
                    <div
                      className={`flex items-center ${usingExistingBeneficiary
                        ? "text-gray-400"
                        : "text-blue-600"
                        }`}
                    >
                      <FaPlus className="mr-3" size={20} />
                      <span className="font-medium">
                        Add Another Bank Account
                      </span>
                    </div>
                    <p
                      className={`text-sm mt-2 ${usingExistingBeneficiary
                        ? "text-gray-400"
                        : "text-gray-500"
                        }`}
                    >
                      {usingExistingBeneficiary
                        ? "Cannot add multiple accounts at once for existing beneficiary"
                        : "Add multiple accounts for different currencies or payment methods"}
                    </p>
                  </button>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (editBankOnlyMode || isAddBankOnlyMode) {
                        navigate(-1);
                      } else {
                        setStep(1);
                      }
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex-1 flex items-center justify-center font-medium"
                  >
                    <FaChevronLeft className="mr-2" />
                    {editBankOnlyMode || isAddBankOnlyMode ? "Back to Beneficiaries" : "Back to Details"}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || createLoading || updateLoading || bankUpdateLoading}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 font-medium ${loading || createLoading || updateLoading || bankUpdateLoading
                      ? "bg-gray-300 cursor-not-allowed text-gray-500"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                      }`}
                  >
                    {loading || createLoading || updateLoading || bankUpdateLoading ? (
                      <>
                        <RingLoader color="#ffffff" size={20} className="mr-2" />
                        Processing...
                      </>
                    ) : mode === "create" ? (
                      usingExistingBeneficiary ? (
                        <>
                          <FaCheckCircle className="mr-2" />
                          Save
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="mr-2" />
                          Create Beneficiary
                        </>
                      )
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" />
                        {editBankOnlyMode ? "Update Bank Details" : "Update Beneficiary"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={8000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <ValidationErrorModal
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          setErrorModalData(null);
        }}
        errors={errorModalData}
        title="Validation Error"
      />

    </div>
  );
};

BeneficiaryForm.propTypes = {
  mode: PropTypes.oneOf(["create", "edit"]),
  initialData: PropTypes.object,
};

BeneficiaryForm.defaultProps = {
  mode: "create",
  initialData: null,
};

export default BeneficiaryForm;