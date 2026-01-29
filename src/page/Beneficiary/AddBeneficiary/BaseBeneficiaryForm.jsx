import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
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
  FaEye,
  FaEyeSlash,
  FaBuilding,
} from "react-icons/fa";

import PropTypes from "prop-types";
import SuccessPopup from "../../../components/PopupModal/BeneficiarySuccessPopup";

// ========== CONSISTENT STYLING CONSTANTS ==========
const STYLES = {
  // Container styles
  container: "min-h-screen bg-gray-50 p-4 md:p-8",

  // Card/Form container
  formContainer: "bg-white rounded-2xl border border-gray-200 shadow-sm",
  formPadding: "p-6 md:p-8",

  // Input styles
  inputBase:
    "w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
  inputHover: "hover:border-gray-400",
  inputDisabled: "bg-gray-100 cursor-not-allowed opacity-70",

  // Select styles
  selectBase:
    "w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400",

  // Button styles
  buttonPrimary:
    "px-6 py-3 rounded-xl transition-all duration-300 font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl",
  buttonSecondary:
    "px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium",
  buttonSuccess:
    "px-6 py-3 rounded-xl transition-all duration-300 font-medium bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl",
  buttonDanger:
    "px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 font-medium",
  buttonWarning:
    "px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-all duration-300 font-medium",

  // Section styles
  sectionTitle: "text-2xl font-bold text-gray-800",
  sectionSubtitle: "text-gray-600 mt-1",
  sectionHeader: "flex items-center justify-between mb-6",

  // Field styles
  fieldLabel: "block text-sm font-medium text-gray-700 mb-2",
  fieldRequired: "text-red-500 ml-1",
  fieldContainer: "mb-5",
  fieldGrid: "grid grid-cols-1 md:grid-cols-2 gap-5",

  // Card styles
  infoCard:
    "p-6 rounded-xl border-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
  warningCard: "p-6 rounded-xl border-2 border-yellow-200 bg-yellow-50",
  successCard: "p-6 rounded-xl border-2 border-green-200 bg-green-50",

  // Icon styles
  iconCircle: "flex items-center justify-center w-10 h-10 rounded-full",

  // Divider
  divider: "border-t border-gray-200 pt-6 mt-6",

  // Step indicator
  stepActive: "bg-blue-600 text-white",
  stepInactive: "bg-gray-200 text-gray-500",
  stepCompleted: "bg-green-500 text-white",
};

// ========== REUSABLE COMPONENTS ==========
const SectionHeader = ({ title, subtitle, onBack }) => (
  <div className={STYLES.sectionHeader}>
    <div>
      <h1 className={STYLES.sectionTitle}>{title}</h1>
      {subtitle && <p className={STYLES.sectionSubtitle}>{subtitle}</p>}
    </div>
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
      >
        <FaArrowLeft className="mr-2" />
        Back
      </button>
    )}
  </div>
);

const FieldContainer = ({ children, className = "" }) => (
  <div className={`${STYLES.fieldContainer} ${className}`}>{children}</div>
);

const InfoBox = ({ type = "info", title, description, children }) => {
  const cardStyles = {
    info: STYLES.infoCard,
    warning: STYLES.warningCard,
    success: STYLES.successCard,
  };

  const iconColors = {
    info: "text-blue-600",
    warning: "text-yellow-600",
    success: "text-green-600",
  };

  const icons = {
    info: <FaInfoCircle size={24} />,
    warning: <FaExclamationTriangle size={24} />,
    success: <FaCheckCircle size={24} />,
  };

  return (
    <div className={`${cardStyles[type]} mb-6`}>
      <div className="flex items-start">
        <div className={`${iconColors[type]} mr-4 flex-shrink-0`}>
          {icons[type]}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          {description && <p className="text-gray-600 mb-4">{description}</p>}
          {children}
        </div>
      </div>
    </div>
  );
};

const LoadingButton = ({ loading, children, ...props }) => (
  <button {...props} disabled={loading}>
    {loading ? (
      <>
        <RingLoader size={20} color="#ffffff" className="mr-2" />
        Loading...
      </>
    ) : (
      children
    )}
  </button>
);

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

const BaseBeneficiaryForm = ({
  // ========== REQUIRED PROPS ==========
  mode = "create",
  initialData = null,

  // ========== NEW CONFIGURATION PROPS ==========
  isPublic = false,
  customerId = null,
  beneficiaryId = null,

  // ========== FUNCTION PROPS ==========
  onSubmit,
  onCancel,
  onPhoneSearch,
  onFetchCountries,
  onFetchNationalities,
  onFetchBanks,
  onFetchIdTypes,
  onFetchCities,
  onFetchBankBranches,

  // ========== DATA PROPS ==========
  nationalities = [],
  banks = {},
  idTypes = {},
  cities = {},
  bankBranches = {},
  countries = [],
  countriesOptions = [],
  phoneCodeOptions = [],
  beneficiaries = [],

  // ========== STATE PROPS ==========
  isLoading = false,
  phoneSearchLoading = false,
  phoneSearch = {
    searched: false,
    exists: false,
    data: null,
    processed: false,
  },
  dropdownLoading = false,

  // ========== OTHER PROPS ==========
  showPhoneSearch = true,
  usingExistingBeneficiary: initialUsingExisting = false,
  foundBeneficiary: initialFoundBeneficiary = null,

  // ========== PUBLIC REGISTRATION PROPS ==========
  emailVerified = false,
  phoneVerified = false,
  onSendEmailPasscode = null,
  onSendPhoneOTP = null,
  setEmailVerified = null,
  setPhoneVerified = null,
  resendEmailLoading = false,
  resendPhoneLoading = false,

  // Password props
  showPassword = false,
  showConfirmPassword = false,
  setShowPassword = null,
  setShowConfirmPassword = null,
  passwordErrors = {},
  setPasswordErrors = null,
  validatePassword = null,

  // Partner ID
  partnerId = "0",

  // Page title
  pageTitle = "Register Beneficiary",
}) => {
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const nationalitiesFetched = useRef(false);
  const countriesFetched = useRef(false);
  const banksFetched = useRef({});
  const idTypesFetched = useRef({});
  const citiesFetched = useRef({});

  // ========== LOCAL STATE ==========
  const [step, setStep] = useState(
    mode === "create" && showPhoneSearch ? 0 : 1
  );
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [currency, setCurrency] = useState(
    mode === "edit" && initialData?.banks?.[0]?.currency_code
      ? initialData.banks[0].currency_code
      : "USD"
  );
  const [paymentMethod, setPaymentMethod] = useState("ACH");
  const [showOtherRelationship, setShowOtherRelationship] = useState(false);
  const [branchCode, setBranchCode] = useState("");
  const [fieldTouched, setFieldTouched] = useState({});

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [benefCode, setBenefCode] = useState("");

  // Phone search state
  const [phoneInput, setPhoneInput] = useState("");
  const [countryCodeInput, setCountryCodeInput] = useState("+1");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [usingExistingBeneficiary, setUsingExistingBeneficiary] =
    useState(initialUsingExisting);
  const [foundBeneficiary, setFoundBeneficiary] = useState(
    initialFoundBeneficiary
  );

  // Steps configuration
  const steps = useMemo(() => {
    if (isPublic) {
      return [
        {
          number: 1,
          title: "Your Details",
          icon: <FaUser className="text-sm" />,
          description: "Personal & Contact Information",
          color: "blue",
        },
        {
          number: 2,
          title: "Bank Information",
          icon: <FaUniversity className="text-sm" />,
          description: "Account & Payment Details",
          color: "purple",
        },
      ];
    } else if (mode === "create" && showPhoneSearch) {
      return [
        {
          number: 0,
          title: "Search",
          icon: <FaSearch className="text-sm" />,
          description: "Find existing beneficiary",
          color: "indigo",
        },
        {
          number: 1,
          title: "Details",
          icon: <FaUser className="text-sm" />,
          description: "Personal information",
          color: "blue",
        },
        {
          number: 2,
          title: "Bank",
          icon: <FaUniversity className="text-sm" />,
          description: "Account details",
          color: "purple",
        },
      ];
    } else {
      return [
        {
          number: 1,
          title: "Details",
          icon: <FaUser className="text-sm" />,
          description: "Personal information",
          color: "blue",
        },
        {
          number: 2,
          title: "Bank",
          icon: <FaUniversity className="text-sm" />,
          description: "Account details",
          color: "purple",
        },
      ];
    }
  }, [isPublic, mode, showPhoneSearch]);

  const localCurrencies = [
    "AED",
    "AUD",
    "BDT",
    "DKK",
    "EUR",
    "GBP",
    "INR",
    "KES",
    "NGN",
    "NPR",
    "PKR",
    "USD",
  ];

  const relationshipOptions = [
    { value: "father", label: "Father" },
    { value: "mother", label: "Mother" },
    { value: "sister", label: "Sister" },
    { value: "brother", label: "Brother" },
    { value: "cousin", label: "Cousin" },
    { value: "friend", label: "Friend" },
    { value: "other", label: "Other" },
  ];

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState(() => {
    if (mode === "edit" && initialData?.banks) {
      return initialData.banks.map((bank) => ({
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
      }));
    }

    return [
      {
        rails: "",
        currency: currency,
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
      },
    ];
  });

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "white",
      border: state.isFocused ? "2px solid #3b82f6" : "1px solid #d1d5db",
      borderRadius: "0.75rem",
      padding: "8px 12px",
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
      borderRadius: "0.75rem",
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
      borderRadius: "0.5rem",
      margin: "2px",
      "&:active": {
        backgroundColor: "#3b82f6",
        color: "white",
      },
    }),
  };

  // ========== FORMIK ==========
  const formik = useFormik({
    initialValues: {
      // Existing fields
      name: initialData?.name || "",
      country_id: initialData?.country_id?.toString() || "",
      country_phone_code: initialData?.country_phone_code || "+1",
      phone_number: initialData?.phone_number || "",
      email: initialData?.email || "",
      beneftype: initialData?.beneftype || "individual",
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

      // NEW FIELDS FOR PUBLIC REGISTRATION
      first_name: initialData?.first_name || "",
      middle_name: initialData?.middle_name || "",
      last_name: initialData?.last_name || "",
      institution_name: initialData?.institution_name || "",
      bic_ncc_code: initialData?.bic_ncc_code || "",
      password: initialData?.password || "",
      confirmPassword: initialData?.confirmPassword || "",
      phone_code_country_id: initialData?.phone_code_country_id || "",
    },
    onSubmit: () => {},
    enableReinitialize: mode === "edit",
  });

  // ========== EFFECTS ==========
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // ERASE THE CHECKLIST when leaving the page
      nationalitiesFetched.current = false;
      countriesFetched.current = false;
      banksFetched.current = {};
      idTypesFetched.current = {};
      citiesFetched.current = {};
    };
  }, []);

  useEffect(() => {
    if (step > 0 && isMounted.current) {
      if (
        onFetchNationalities &&
        !nationalitiesFetched.current &&
        isMounted.current
      ) {
        onFetchNationalities();
        nationalitiesFetched.current = true;
      }

      if (onFetchCountries && !countriesFetched.current && isMounted.current) {
        onFetchCountries();
        countriesFetched.current = true;
      }

      const bankType = getBankType();
      if (
        onFetchBanks &&
        !banksFetched.current[currency] &&
        isMounted.current
      ) {
        onFetchBanks?.({ currency, bankType });
        banksFetched.current[currency] = true;
      }

      if (["BDT", "INR", "PKR"].includes(currency)) {
        if (
          onFetchIdTypes &&
          !idTypesFetched.current[currency] &&
          isMounted.current
        ) {
          onFetchIdTypes?.(currency);
          idTypesFetched.current[currency] = true;
        }
      }
    }
  }, [
    currency,
    step,
    isPublic,
    onFetchNationalities,
    onFetchCountries,
    onFetchBanks,
    onFetchIdTypes,
  ]);

  const handleCopyBenefCode = useCallback(() => {
    toast.success("Copied to clipboard!");
  }, []);

  const handleContinueFromSuccess = useCallback(() => {
    setShowSuccessPopup(false);
    navigate(isPublic ? "/dashboard" : "/beneficiaries");
  }, [navigate, isPublic]);

  // Handle phone search results
  useEffect(() => {
    if (
      phoneSearch.searched &&
      phoneSearch.exists &&
      phoneSearch.data &&
      !phoneSearch.processed
    ) {
      const beneficiaryData = phoneSearch.data;

      // Map nationality
      let nationalityId = beneficiaryData.nationality_id;
      if (
        !nationalityId &&
        beneficiaryData.nationality &&
        nationalities.length > 0
      ) {
        const found = nationalities.find(
          (nat) =>
            nat.name.toLowerCase() === beneficiaryData.nationality.toLowerCase()
        );
        nationalityId = found ? found.id.toString() : "";
      }

      // Map relationship
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
      }

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

      setTimeout(() => {
        if (isMounted.current) {
          formik.setValues(formValues);
        }
      }, 0);

      // Set currency if available
      if (beneficiaryData.currency) {
        setCurrency(beneficiaryData.currency);
      }

      // Set bank accounts if available
      if (beneficiaryData.banks && beneficiaryData.banks.length > 0) {
        setBankAccounts(
          beneficiaryData.banks.map((bank) => ({
            rails: bank.rails || "",
            currency:
              bank.currency_code || beneficiaryData.currency || currency,
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
          }))
        );
      }

      if (isMounted.current) {
        toast.success("Beneficiary found! Form has been pre-filled.");
      }
    } else if (
      phoneSearch.searched &&
      !phoneSearch.exists &&
      isMounted.current
    ) {
      toast.info(
        "No existing beneficiary found with this phone number. You can create a new one."
      );
      formik.setFieldValue("phone_number", phoneInput);
      formik.setFieldValue("country_phone_code", countryCodeInput);
      setFoundBeneficiary(null);
      setShowSearchResults(true);
    }
  }, [
    phoneSearch,
    phoneInput,
    formik,
    nationalities,
    currency,
    paymentMethod,
    countryCodeInput,
  ]);

  // ========== HELPER FUNCTIONS ==========
  const getBankType = () => {
    return ["BDT", "LKR", "AUD", "PKR"].includes(currency)
      ? "int-banks"
      : "currency-payout-banks";
  };

  const getBanksForCurrency = useMemo(() => {
    if (["BDT", "LKR", "AUD", "PKR"].includes(currency)) {
      return banks[`${currency}_int`] || [];
    }
    return banks[currency] || [];
  }, [banks, currency]);

  const getIdTypesForCurrency = useMemo(() => {
    if (Object.keys(idTypes).length === 0) {
      return [];
    }

    const types = idTypes[currency];
    if (!types) {
      return [];
    }

    if (Array.isArray(types)) {
      return types;
    }

    if (types && types.data && Array.isArray(types.data)) {
      return types.data;
    }

    if (types && typeof types === "object") {
      return Object.values(types);
    }

    return [];
  }, [idTypes, currency]);

  const getBankBranches = useMemo(() => {
    const currentBankCode = bankAccounts[0]?.bankCode;
    return currentBankCode ? bankBranches[currentBankCode] || [] : [];
  }, [bankBranches, bankAccounts]);

  // ========== VALIDATION LOGIC ==========
  const isFormValid = useCallback(() => {
    if (formik.values.beneftype === "") return false;

    // For public registration
    if (isPublic) {
      // Check individual vs institution
      if (formik.values.beneftype === "individual") {
        if (!formik.values.first_name || !formik.values.last_name) return false;
      } else if (formik.values.beneftype === "institution") {
        if (!formik.values.institution_name) return false;
      }

      // Check required fields
      if (
        !formik.values.email ||
        !formik.values.country_id ||
        !formik.values.country_phone_code ||
        !formik.values.phone_number ||
        !formik.values.city ||
        !formik.values.street
      )
        return false;

      // Check password
      if (!formik.values.password || !formik.values.confirmPassword)
        return false;
      if (formik.values.password !== formik.values.confirmPassword)
        return false;
      if (validatePassword && !validatePassword(formik.values.password))
        return false;

      // Check verification
      if (!emailVerified || !phoneVerified) return false;

      // Currency-specific validations
      if (currency === "BDT" || currency === "INR" || currency === "PKR") {
        if (
          !formik.values.beneficiary_id_type ||
          !formik.values.beneficiary_id_number
        )
          return false;
      }

      return true;
    }

    // Original validation for private forms
    if (
      formik.values.name === "" ||
      formik.values.country_id === "" ||
      formik.values.country_phone_code === "" ||
      formik.values.phone_number === "" ||
      formik.values.city === "" ||
      formik.values.street === ""
    )
      return false;

    if (formik.values.beneftype === "individual") {
      if (formik.values.relationtobenef === "") return false;
    }

    if (currency === "BDT" || currency === "INR" || currency === "PKR") {
      if (
        formik.values.beneficiary_id_type === "" ||
        formik.values.beneficiary_id_number === ""
      )
        return false;

      if (currency === "INR" && formik.values.city === "") return false;
    }

    return true;
  }, [
    formik.values,
    currency,
    isPublic,
    emailVerified,
    phoneVerified,
    validatePassword,
  ]);

  // ========== CURRENCY CHANGE HANDLER ==========
  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);

    formik.setFieldValue("beneficiary_id_type", "");
    formik.setFieldValue("beneficiary_id_number", "");

    if (["BDT", "INR", "PKR"].includes(newCurrency)) {
      onFetchIdTypes?.(newCurrency);
    }

    const bankType = getBankType();
    onFetchBanks?.({ currency: newCurrency, bankType });

    setBankAccounts((prevAccounts) =>
      prevAccounts.map((account) => ({
        ...account,
        currency: newCurrency,
      }))
    );
  };

  // ========== PHONE SEARCH HANDLERS ==========
  const handlePhoneSearchClick = () => {
    if (!phoneInput.trim()) {
      toast.error("Please enter a phone number to search");
      return;
    }

    const phoneRegex = /^[+]?[0-9\s\-\(\)\.]+$/;
    if (!phoneRegex.test(phoneInput)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    onPhoneSearch?.({
      phoneNumber: phoneInput,
      countryPhoneCode: countryCodeInput,
      beneficiaries,
    });
  };

  const handleUseFoundBeneficiary = () => {
    setUsingExistingBeneficiary(true);
    setShowSearchResults(false);
    setStep(1);
  };

  const handleCreateNewBeneficiary = () => {
    setUsingExistingBeneficiary(false);
    setFoundBeneficiary(null);
    setShowSearchResults(false);
    setPhoneInput("");
    formik.setFieldValue("phone_number", phoneInput);
    formik.setFieldValue("country_phone_code", countryCodeInput);
    setStep(1);
  };

  // ========== STEP NAVIGATION ==========
  const nextStep = () => {
    if (step === 0) {
      if (!phoneInput.trim()) {
        toast.error("Please enter a phone number to search");
        return false;
      }

      const phoneRegex = /^[+]?[0-9\s\-\(\)\.]+$/;
      if (!phoneRegex.test(phoneInput)) {
        toast.error("Please enter a valid phone number");
        return false;
      }

      if (beneficiaries.length === 0) {
        formik.setFieldValue("phone_number", phoneInput);
        formik.setFieldValue("country_phone_code", countryCodeInput);
        setFoundBeneficiary(null);
        setUsingExistingBeneficiary(false);
        setShowSearchResults(false);
        setStep(1);
        toast.info(
          "No existing beneficiaries found. You can create a new beneficiary."
        );
        return true;
      }

      if (!phoneSearch.searched) {
        handlePhoneSearchClick();
        return false;
      }

      if (phoneSearch.searched && phoneSearch.exists && phoneSearch.data) {
        setFoundBeneficiary(phoneSearch.data);
        setUsingExistingBeneficiary(true);
        setStep(1);
        return true;
      }

      if (phoneSearch.searched && !phoneSearch.exists) {
        formik.setFieldValue("phone_number", phoneInput);
        formik.setFieldValue("country_phone_code", countryCodeInput);
        setFoundBeneficiary(null);
        setUsingExistingBeneficiary(false);
        setStep(1);
        return true;
      }

      formik.setFieldValue("phone_number", phoneInput);
      formik.setFieldValue("country_phone_code", countryCodeInput);
      setStep(1);
      return true;
    }

    // For public forms, check verification before proceeding
    if (isPublic && step === 1) {
      if (!emailVerified) {
        toast.error("Please verify your email before proceeding");
        return false;
      }
      if (!phoneVerified) {
        toast.error("Please verify your phone number before proceeding");
        return false;
      }
    }

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
        // const cityInput = formik.values.city;
        // if (cityInput === "" || cityInput === " ") {
        //   toast.error(`City Required for Currency: ${currency}`);
        //   return false;
        // }
      }
    }

    // General form validation
    if (!isFormValid()) {
      toast.error("Please fill all required fields before proceeding");
      return false;
    }

    setStep(step + 1);
    return true;
  };

  const prevStep = () => {
    if (step === 0) {
      onCancel?.();
    } else {
      setStep(step - 1);
    }
  };

  // ========== BANK ACCOUNT FUNCTIONS ==========
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
      },
    ]);
  };

  const addBankAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      {
        rails: "",
        currency: currency,
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
      },
    ]);
  };

  const removeBankAccount = (index) => {
    if (bankAccounts.length === 1) {
      toast.error("At least one bank account is required");
      return;
    }

    const newBankAccounts = bankAccounts.filter((_, i) => i !== index);
    setBankAccounts(newBankAccounts);
  };

  const handleBankAccountChange = (index, field, value) => {
    const newBankAccounts = [...bankAccounts];
    newBankAccounts[index][field] = value;
    setBankAccounts(newBankAccounts);
    if (field === "branchCode") {
      setBranchCode(value);
    }
  };

  const handleBdtBankAccountChange = async (index, field, value) => {
    const newBankAccounts = [...bankAccounts];
    newBankAccounts[index][field] = value;
    setBankAccounts(newBankAccounts);

    if (field === "bankCode") {
      onFetchBankBranches?.(value);
    }
  };

  const handlePkrBankAccountChange = async (index, field, value) => {
    const newBankAccounts = [...bankAccounts];
    newBankAccounts[index][field] = value;
    setBankAccounts(newBankAccounts);
  };

  // ========== SUBMIT HANDLER ==========
  const handleSubmit = async (e) => {
    e.preventDefault();

    // For public registration, check verification
    if (isPublic) {
      if (!emailVerified || !phoneVerified) {
        toast.error(
          "Please verify your email and phone number before submitting"
        );
        return;
      }
    }

    const isRailsMissing = bankAccounts.some((account) => !account.rails);
    if (isRailsMissing) {
      toast.error("Please select rails for all bank accounts.");
      return;
    }

    if (currency === "BDT" || currency === "INR" || currency === "PKR") {
      if (!formik.values.beneficiary_id_type) {
        toast.error("Beneficiary ID Type is required");
        return;
      }
      if (!formik.values.beneficiary_id_number) {
        toast.error("Beneficiary ID Number is required");
        return;
      }
    }

    setIsLoadingLocal(true);

    try {
      const cleanedCountryCode = formik.values.country_phone_code.startsWith(
        "+"
      )
        ? formik.values.country_phone_code.substring(1)
        : formik.values.country_phone_code;

      const finalRelationship =
        formik.values.relationtobenef === "other" &&
        formik.values.otherRelationship.trim() !== ""
          ? formik.values.otherRelationship.trim()
          : formik.values.relationtobenef;

      // Prepare beneficiary data based on public/private
      let beneficiaryData;

      if (isPublic) {
        // Public registration payload
        beneficiaryData = {
          beneftype: formik.values.beneftype,
          first_name: formik.values.first_name || "",
          middle_name: formik.values.middle_name || "",
          last_name: formik.values.last_name || "",
          institution_name: formik.values.institution_name || "",
          email: formik.values.email,
          country_id: formik.values.country_id,
          country_phone_code: cleanedCountryCode,
          phone_number: formik.values.phone_number,
          state: formik.values.state,
          city: formik.values.city,
          street: formik.values.street,
          postalcode: formik.values.postalcode,
          nationality_id: formik.values.nationality_id,
          status: 1,
          bic_ncc_code: formik.values.bic_ncc_code || "",
          password: formik.values.password,
          confirmPassword: formik.values.confirmPassword,
          idType: formik.values.beneficiary_id_type,
          idNumber: formik.values.beneficiary_id_number,
          partner_id: partnerId,
          hostname: window.location.hostname,
        };
      } else {
        // Private registration payload
        beneficiaryData = {
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
      }

      // Call onSubmit and wait for result
      const result = await onSubmit({
        beneficiaryData,
        bankAccounts,
        currency,
        countryCode: cleanedCountryCode,
        isPublic,
        customerId,
        beneficiaryId,
        mode,
      });

      // If the result contains a beneficiary code, show success popup
      if (result && result.beneficiaryCode) {
        setBenefCode(result.beneficiaryCode);
        setShowSuccessPopup(true);
      } else if (result && result.benefCode) {
        // Handle different response format
        setBenefCode(result.benefCode);
        setShowSuccessPopup(true);
      } else {
        // Fallback: show success toast and reset form
        toast.success(
          mode === "create"
            ? "Beneficiary created successfully!"
            : "Beneficiary updated successfully!"
        );
        if (mode === "create") {
          formik.resetForm();
          setBankAccounts([
            {
              rails: "",
              currency: currency,
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
            },
          ]);
        }
      }
    } catch (error) {
      toast.error(error.message || "Submission failed");
    } finally {
      if (isMounted.current) {
        setIsLoadingLocal(false);
      }
    }
  };

  // ========== RENDER FUNCTIONS ==========
  const FieldLabel = ({ children, required = false, info = null }) => (
    <div className="flex items-center justify-between mb-2">
      <label className={STYLES.fieldLabel}>
        {children}
        {required && <span className={STYLES.fieldRequired}>*</span>}
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

  const renderCountryDropdown = () => (
    <select
      className={`${STYLES.selectBase} ${
        usingExistingBeneficiary ? STYLES.inputDisabled : ""
      }`}
      onChange={(e) => {
        const selectedCountryId = e.target.value;
        const selectedCountry = countries.find(
          (country) => country.id === parseInt(selectedCountryId)
        );

        formik.setFieldValue("country_id", selectedCountryId);

        if (selectedCountry) {
          let countryPhoneCode = selectedCountry.phone_code || "+1";
          if (!countryPhoneCode.startsWith("+")) {
            countryPhoneCode = `+${countryPhoneCode}`;
          }
          formik.setFieldValue("country_phone_code", countryPhoneCode);
          setCountryCodeInput(countryPhoneCode);
        }
      }}
      value={formik.values.country_id}
      name="country_id"
      disabled={usingExistingBeneficiary}
    >
      <option value="">Select Country</option>
      {countriesOptions.map((country) => (
        <option key={country.value} value={country.id}>
          {country.label} ({country.country_code})
        </option>
      ))}
    </select>
  );

  // ========== RENDER NAME FIELD BASED ON PUBLIC/PRIVATE ==========
  const renderNameField = () => {
    if (isPublic) {
      if (formik.values.beneftype === "individual") {
        return (
          <>
            <FieldContainer>
              <FieldLabel required>
                First Name
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                placeholder="Enter first name"
                value={formik.values.first_name}
                onChange={(e) => {
                  if (!usingExistingBeneficiary) {
                    formik.handleChange(e);
                    // Reset verification if name changes for public forms
                    if (isPublic && emailVerified && setEmailVerified) {
                      setEmailVerified(false);
                    }
                  }
                }}
                name="first_name"
                disabled={usingExistingBeneficiary}
                readOnly={usingExistingBeneficiary}
              />
            </FieldContainer>

            <FieldContainer>
              <FieldLabel>
                Middle Name
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                placeholder="Enter middle name"
                value={formik.values.middle_name}
                onChange={formik.handleChange}
                name="middle_name"
                disabled={usingExistingBeneficiary}
                readOnly={usingExistingBeneficiary}
              />
            </FieldContainer>

            <FieldContainer>
              <FieldLabel required>
                Last Name
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                placeholder="Enter last name"
                value={formik.values.last_name}
                onChange={formik.handleChange}
                name="last_name"
                disabled={usingExistingBeneficiary}
                readOnly={usingExistingBeneficiary}
              />
            </FieldContainer>
          </>
        );
      } else {
        return (
          <FieldContainer className="md:col-span-2">
            <FieldLabel required>
              Institution Name
              {usingExistingBeneficiary && (
                <span className="ml-2 text-xs text-gray-500">(Pre-filled)</span>
              )}
            </FieldLabel>
            <input
              type="text"
              className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                usingExistingBeneficiary ? STYLES.inputDisabled : ""
              }`}
              placeholder="Enter institution name"
              value={formik.values.institution_name}
              onChange={formik.handleChange}
              name="institution_name"
              disabled={usingExistingBeneficiary}
              readOnly={usingExistingBeneficiary}
            />
          </FieldContainer>
        );
      }
    } else {
      return (
        <FieldContainer>
          <FieldLabel required>
            Name
            {usingExistingBeneficiary && (
              <span className="ml-2 text-xs text-gray-500">(Pre-filled)</span>
            )}
          </FieldLabel>
          <input
            id="name"
            type="text"
            className={`${STYLES.inputBase} ${STYLES.inputHover} ${
              usingExistingBeneficiary ? STYLES.inputDisabled : ""
            }`}
            placeholder="Enter beneficiary name"
            value={formik.values.name}
            name="name"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={usingExistingBeneficiary}
            readOnly={usingExistingBeneficiary}
          />
        </FieldContainer>
      );
    }
  };

  // ========== RENDER EMAIL FIELD WITH VERIFICATION ==========
  const renderEmailField = () => (
    <FieldContainer className="md:col-span-2">
      <FieldLabel info="For notifications and receipts" required>
        Email
        {usingExistingBeneficiary && (
          <span className="ml-2 text-xs text-gray-500">(Pre-filled)</span>
        )}
      </FieldLabel>
      <div className="flex flex-col md:flex-row gap-3">
        <input
          id="email"
          type="email"
          value={formik.values.email}
          onChange={(e) => {
            if (!usingExistingBeneficiary) {
              formik.handleChange(e);
              // Reset verification if email changes
              if (isPublic && emailVerified && setEmailVerified) {
                setEmailVerified(false);
              }
            }
          }}
          onBlur={formik.handleBlur}
          className={`${STYLES.inputBase} ${STYLES.inputHover} flex-1 ${
            usingExistingBeneficiary ? STYLES.inputDisabled : ""
          }`}
          placeholder="email@example.com"
          disabled={usingExistingBeneficiary}
          readOnly={usingExistingBeneficiary}
        />

        {/* Email verification button for public forms */}
        {isPublic && onSendEmailPasscode && (
          <button
            type="button"
            onClick={() => {
              if (!formik.values.email) {
                toast.error("Please enter email first");
                return;
              }
              onSendEmailPasscode?.(formik.values.email);
            }}
            disabled={
              emailVerified ||
              !formik.values.email ||
              usingExistingBeneficiary ||
              resendEmailLoading // Add this
            }
            className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center min-w-32 ${
              emailVerified
                ? "bg-green-500 text-white cursor-default"
                : !formik.values.email || usingExistingBeneficiary
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            }`}
          >
            {resendEmailLoading ? ( // Show loader here
              <>
                <RingLoader size={16} color="#ffffff" className="mr-2" />
                Sending...
              </>
            ) : emailVerified ? (
              <span className="flex items-center">
                <FaCheckCircle className="text-white mr-2" />
                Verified
              </span>
            ) : (
              "Verify Email"
            )}
          </button>
        )}
      </div>
    </FieldContainer>
  );

  // ========== RENDER PHONE FIELD WITH VERIFICATION ==========
  const renderPhoneField = () => (
    <FieldContainer className="md:col-span-2">
      <FieldLabel required>
        Phone Number
        {usingExistingBeneficiary && (
          <span className="ml-2 text-xs text-gray-500">(Pre-filled)</span>
        )}
      </FieldLabel>
      <div className="flex flex-col md:flex-row gap-3">
        <div
          className={`w-full md:w-1/3 ${
            usingExistingBeneficiary ? "opacity-70" : ""
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
                formik.setFieldValue(
                  "country_phone_code",
                  selectedOption?.value || ""
                );
                // Reset verification if country code changes
                if (isPublic && phoneVerified && setPhoneVerified) {
                  setPhoneVerified(false);
                }
              }
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
            styles={{
              ...customStyles,
              control: (provided, state) => ({
                ...customStyles.control(provided, state),
                backgroundColor: usingExistingBeneficiary ? "#f3f4f6" : "white",
                cursor: usingExistingBeneficiary ? "not-allowed" : "default",
                opacity: usingExistingBeneficiary ? 0.7 : 1,
              }),
            }}
            isDisabled={usingExistingBeneficiary}
          />
        </div>
        <div className="flex gap-3 w-full md:flex-1">
          <input
            id="phone_number"
            type="tel"
            className={`${STYLES.inputBase} ${STYLES.inputHover} flex-1 ${
              usingExistingBeneficiary ? STYLES.inputDisabled : ""
            }`}
            placeholder="Enter phone number"
            value={formik.values.phone_number}
            name="phone_number"
            onChange={(e) => {
              if (!usingExistingBeneficiary) {
                formik.handleChange(e);
                // Reset verification if phone number changes
                if (isPublic && phoneVerified && setPhoneVerified) {
                  setPhoneVerified(false);
                }
              }
            }}
            onBlur={formik.handleBlur}
            disabled={usingExistingBeneficiary}
            readOnly={usingExistingBeneficiary}
          />

          {/* Phone verification button for public forms */}
          {isPublic && onSendPhoneOTP && (
            <button
              type="button"
              onClick={() => {
                if (
                  !formik.values.phone_number ||
                  !formik.values.country_phone_code
                ) {
                  toast.error("Please enter phone number and country code");
                  return;
                }
                onSendPhoneOTP?.(
                  formik.values.country_phone_code,
                  formik.values.phone_number
                );
              }}
              disabled={
                phoneVerified ||
                !formik.values.phone_number ||
                !formik.values.country_phone_code ||
                usingExistingBeneficiary ||
                resendPhoneLoading // Add this
              }
              className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center min-w-32 ${
                phoneVerified
                  ? "bg-green-500 text-white cursor-default"
                  : !formik.values.phone_number ||
                    !formik.values.country_phone_code ||
                    usingExistingBeneficiary
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              }`}
            >
              {resendPhoneLoading ? ( // Show loader here
                <>
                  <RingLoader size={16} color="#ffffff" className="mr-2" />
                  Sending...
                </>
              ) : phoneVerified ? (
                <span className="flex items-center">
                  <FaCheckCircle className="text-white mr-2" />
                  Verified
                </span>
              ) : (
                "Verify Phone"
              )}
            </button>
          )}
        </div>
      </div>
    </FieldContainer>
  );

  // ========== RENDER PASSWORD FIELDS ==========
  const renderPasswordFields = () => {
    if (!isPublic) return null;

    return (
      <>
        <FieldContainer>
          <FieldLabel required>Password</FieldLabel>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={(e) => {
                formik.handleChange(e);
                if (validatePassword) {
                  validatePassword(e.target.value);
                }
              }}
              onBlur={formik.handleBlur}
              placeholder="Enter password (min 12 characters)"
              className={`${STYLES.inputBase} ${STYLES.inputHover} pr-12`}
            />
            {setShowPassword && (
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            )}
          </div>

          {/* Password Validation Rules */}
          {formik.values.password && passwordErrors && (
            <div className="mt-3 space-y-2">
              {Object.entries(passwordErrors).map(([key, isValid]) => (
                <div
                  key={key}
                  className={`flex items-center text-sm ${
                    isValid ? "text-green-600" : "text-red-500"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isValid ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  {key === "length" && "At least 12 characters"}
                  {key === "uppercase" && "At least one uppercase letter (A-Z)"}
                  {key === "lowercase" && "At least one lowercase letter (a-z)"}
                  {key === "number" && "At least one number (0-9)"}
                  {key === "special" && "At least one special character"}
                </div>
              ))}
            </div>
          )}
        </FieldContainer>

        <FieldContainer>
          <FieldLabel required>Confirm Password</FieldLabel>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Confirm password"
              className={`${STYLES.inputBase} ${STYLES.inputHover} pr-12`}
            />
            {setShowConfirmPassword && (
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash size={20} />
                ) : (
                  <FaEye size={20} />
                )}
              </button>
            )}
          </div>

          {/* Password Match Validation */}
          {formik.values.confirmPassword && (
            <div className="mt-2">
              <div
                className={`flex items-center text-sm ${
                  formik.values.password === formik.values.confirmPassword
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    formik.values.password === formik.values.confirmPassword
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></div>
                {formik.values.password === formik.values.confirmPassword
                  ? "Passwords match"
                  : "Passwords must match"}
              </div>
            </div>
          )}
        </FieldContainer>
      </>
    );
  };

  // ========== RENDER BIC/NCC FIELD ==========
  const renderBicNccField = () => {
    if (!isPublic) return null;

    return (
      <FieldContainer>
        <FieldLabel info="Bank Identifier Code / National Clearing Code">
          BIC/NCC Code
        </FieldLabel>
        <input
          type="text"
          className={`${STYLES.inputBase} ${STYLES.inputHover}`}
          placeholder="Enter BIC/NCC code"
          value={formik.values.bic_ncc_code}
          onChange={formik.handleChange}
          name="bic_ncc_code"
        />
      </FieldContainer>
    );
  };

  // ========== ADD THIS NEW FUNCTION HERE ==========
  const renderBeneficiaryTypeSelection = () => (
    <FieldContainer>
      <FieldLabel required>
        Beneficiary Type
        {usingExistingBeneficiary && (
          <span className="ml-2 text-xs text-gray-500">(Pre-filled)</span>
        )}
      </FieldLabel>
      <div className="flex flex-col md:flex-row gap-4 bg-white p-3 border border-gray-300 rounded-xl">
        <label className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex-1">
          <div className="relative mr-3">
            <input
              type="radio"
              name="beneftype"
              value="individual"
              checked={formik.values.beneftype === "individual"}
              onChange={formik.handleChange}
              disabled={usingExistingBeneficiary}
              className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
          </div>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mr-3">
              <FaUser size={18} />
            </div>
            <div>
              <span className="text-gray-700 font-medium">Individual</span>
              <p className="text-sm text-gray-500">
                Personal beneficiary account
              </p>
            </div>
          </div>
        </label>

        <label className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex-1">
          <div className="relative mr-3">
            <input
              type="radio"
              name="beneftype"
              value="institution"
              checked={formik.values.beneftype === "institution"}
              onChange={formik.handleChange}
              disabled={usingExistingBeneficiary}
              className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
          </div>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mr-3">
              <FaBuilding size={18} />
            </div>
            <div>
              <span className="text-gray-700 font-medium">Institution</span>
              <p className="text-sm text-gray-500">
                Business or organization account
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Validation feedback */}
      {formik.touched.beneftype && formik.errors.beneftype && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <FaExclamationTriangle className="mr-1" size={14} />
          {formik.errors.beneftype}
        </div>
      )}
    </FieldContainer>
  );

  // ========== RENDER VERIFICATION STATUS ==========
  const renderVerificationStatus = () => {
    if (!isPublic) return null;

    return (
      <div className="mb-6">
        <div className={STYLES.fieldGrid}>
          <div
            className={`p-4 rounded-xl border-2 ${
              emailVerified
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  emailVerified
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <FaCheckCircle size={16} />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">
                  Email Verification
                </h4>
                <p className="text-sm text-gray-600">
                  {emailVerified ? "Verified" : "Pending"}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border-2 ${
              phoneVerified
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  phoneVerified
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <FaCheckCircle size={16} />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">
                  Phone Verification
                </h4>
                <p className="text-sm text-gray-600">
                  {phoneVerified ? "Verified" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== RENDER PHONE SEARCH STEP ==========
  const renderPhoneSearchStep = () => (
    <div className="space-y-6">
      <InfoBox
        type="info"
        title="Search Existing Beneficiary"
        description="Enter the beneficiary's phone number to check if they already exist in the system."
      />

      <div className={STYLES.formContainer}>
        <div className={STYLES.formPadding}>
          {/* Phone Input */}
          <FieldContainer>
            <FieldLabel
              required
              info="Enter the phone number of the beneficiary you want to add"
            >
              Beneficiary Phone Number
            </FieldLabel>
            <div className="flex flex-col md:flex-row gap-3">
              {/* Country Code Selector */}
              <div className="w-full md:w-1/3">
                <Select
                  className="text-sm"
                  classNamePrefix="select"
                  options={phoneCodeOptions}
                  placeholder="Code..."
                  isSearchable
                  onChange={(selectedOption) => {
                    setCountryCodeInput(selectedOption?.value || "+1");
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

              {/* Phone Number Input */}
              <div className="flex gap-3 w-full md:flex-1">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    if (phoneSearch.searched) {
                      setShowSearchResults(false);
                      setFoundBeneficiary(null);
                      setUsingExistingBeneficiary(false);
                    }
                  }}
                  className={`${STYLES.inputBase} ${STYLES.inputHover} flex-1`}
                  placeholder="Enter phone number"
                  disabled={phoneSearchLoading}
                />
                <button
                  type="button"
                  onClick={handlePhoneSearchClick}
                  disabled={!phoneInput.trim() || phoneSearchLoading}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 whitespace-nowrap flex items-center justify-center min-w-32 ${
                    phoneSearchLoading
                      ? "bg-gray-300 cursor-not-allowed"
                      : !phoneInput.trim()
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
            <p className="text-sm text-gray-500 mt-2">
              We'll check if a beneficiary with this phone number already exists
            </p>
          </FieldContainer>

          {/* Search Results */}
          {phoneSearch.searched && !phoneSearchLoading && (
            <div className="mb-6">
              {phoneSearch.exists && phoneSearch.data ? (
                <InfoBox
                  type="warning"
                  title="Beneficiary Found!"
                  description="We found an existing beneficiary with this phone number"
                >
                  <div className="mb-4 p-4 bg-white rounded-lg border border-yellow-100">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Existing Beneficiary Details:
                    </h4>
                    <div className={STYLES.fieldGrid}>
                      <div>
                        <span className="text-sm text-gray-500">Name:</span>
                        <p className="font-medium">
                          {phoneSearch.data.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Email:</span>
                        <p className="font-medium">
                          {phoneSearch.data.email || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Phone:</span>
                        <p className="font-medium">
                          {phoneSearch.data.phone_number || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Country:</span>
                        <p className="font-medium">
                          {phoneSearch.data.country_id
                            ? countries.find(
                                (c) =>
                                  c.id === parseInt(phoneSearch.data.country_id)
                              )?.name || "N/A"
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Currency:</span>
                        <p className="font-medium">
                          {phoneSearch.data.currency || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleUseFoundBeneficiary}
                      className={STYLES.buttonWarning}
                    >
                      <FaCheckCircle className="mr-2" />
                      Use Existing Beneficiary
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewBeneficiary}
                      className={STYLES.buttonSecondary}
                    >
                      <FaUser className="mr-2" />
                      Create New Instead
                    </button>
                  </div>
                </InfoBox>
              ) : (
                <InfoBox
                  type="success"
                  title="No Existing Beneficiary Found"
                  description="You can create a new beneficiary with this phone number"
                >
                  <div className="mb-4 p-4 bg-white rounded-lg border border-green-100">
                    <p className="text-gray-700">
                      No beneficiary was found with the phone number{" "}
                      <span className="font-semibold">{phoneInput}</span>. You
                      can proceed to create a new beneficiary.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateNewBeneficiary}
                    className={STYLES.buttonSuccess}
                  >
                    <FaUser className="mr-2" />
                    Create New Beneficiary
                  </button>
                </InfoBox>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className={`${STYLES.divider} flex flex-col md:flex-row gap-3`}>
            <button
              type="button"
              onClick={onCancel}
              className={STYLES.buttonSecondary}
            >
              <FaArrowLeft className="mr-2" />
              Cancel
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={phoneSearchLoading || !phoneInput.trim()}
              className={`${STYLES.buttonPrimary} flex-1 ${
                phoneSearchLoading || !phoneInput.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {phoneSearchLoading ? (
                <>
                  <RingLoader size={20} color="#ffffff" className="mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  Continue
                  <FaChevronRight className="ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ========== BANK ACCOUNT FIELDS RENDERER ==========
  const renderBankAccountFields = (index) => {
    const account = bankAccounts[index];
    const accountCurrency = account.currency || currency;
    const currentBanks = getBanksForCurrency;
    const currentIdTypes = getIdTypesForCurrency;
    const currentBankBranches = getBankBranches;

    // Get loading state for banks
    const banksLoading = dropdownLoading && !currentBanks?.length;

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
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                Fill in the banking details
                {usingExistingBeneficiary &&
                  " - Using existing bank information"}
              </p>
            </div>
          </div>
          {index > 0 && !usingExistingBeneficiary && (
            <button
              type="button"
              onClick={() => removeBankAccount(index)}
              className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200 p-2 hover:bg-red-50 rounded-lg"
            >
              <FaTrash className="mr-2" size={14} />
              Remove
            </button>
          )}
          {index > 0 && usingExistingBeneficiary && (
            <span className="text-sm text-gray-500 italic">
              Cannot remove existing account
            </span>
          )}
        </div>

        <div className={STYLES.fieldGrid}>
          {/* Select Rails */}
          <FieldContainer>
            <FieldLabel required>
              Select Rails
              {usingExistingBeneficiary && (
                <span className="ml-1 text-xs text-gray-500">(Pre-filled)</span>
              )}
            </FieldLabel>
            <select
              className={`${STYLES.selectBase} ${
                usingExistingBeneficiary ? STYLES.inputDisabled : ""
              }`}
              value={account.rails}
              onChange={(e) =>
                handleBankAccountChange(index, "rails", e.target.value)
              }
              required
              disabled={usingExistingBeneficiary}
            >
              <option value="">Select Rails</option>
              <option value="Local">
                {accountCurrency === "GBP"
                  ? "FPS"
                  : accountCurrency === "EUR"
                  ? "SEPA"
                  : accountCurrency === "USD"
                  ? "ACH"
                  : "Bank"}
              </option>
              <option value="Swift">Swift</option>
              <option value="Mobile">Mobile</option>
            </select>
            {account.rails && (
              <div className="flex items-center mt-2 text-green-600 text-sm">
                <FaCheckCircle className="mr-1" size={12} />
                <span>Rails selected: {account.rails}</span>
              </div>
            )}
          </FieldContainer>

          {/* Select Currency */}
          {account.rails !== "Mobile" && (
            <FieldContainer>
              <FieldLabel required>
                Select Currency
                {usingExistingBeneficiary && (
                  <span className="ml-1 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <select
                className={`${STYLES.selectBase} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                value={accountCurrency}
                onChange={(e) => {
                  handleCurrencyChange(e);
                  handleBankAccountChange(index, "currency", e.target.value);
                }}
                required
                disabled={usingExistingBeneficiary}
              >
                <option value="">Select Currency</option>
                {localCurrencies.map((cur, i) => (
                  <option key={i} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </FieldContainer>
          )}

          {/* Currency-Specific ID Fields */}
          {(accountCurrency === "BDT" ||
            accountCurrency === "INR" ||
            accountCurrency === "PKR") && (
            <>
              <FieldContainer>
                <FieldLabel required info="Required for regulatory compliance">
                  Beneficiary ID Type
                  {usingExistingBeneficiary && (
                    <span className="ml-1 text-xs text-gray-500">
                      (Pre-filled)
                    </span>
                  )}
                </FieldLabel>
                <select
                  className={`${STYLES.selectBase} ${
                    usingExistingBeneficiary ? STYLES.inputDisabled : ""
                  }`}
                  value={formik.values.beneficiary_id_type}
                  onChange={formik.handleChange}
                  name="beneficiary_id_type"
                  required
                  disabled={usingExistingBeneficiary}
                >
                  <option value="">Select ID Type</option>
                  {currentIdTypes.map((idType) => (
                    <option key={idType.name} value={idType.name}>
                      {idType.name}
                    </option>
                  ))}
                </select>
              </FieldContainer>

              <FieldContainer>
                <FieldLabel
                  required
                  info="Enter the ID number exactly as on the document"
                >
                  Beneficiary ID Number
                  {usingExistingBeneficiary && (
                    <span className="ml-1 text-xs text-gray-500">
                      (Pre-filled)
                    </span>
                  )}
                </FieldLabel>
                <input
                  type="text"
                  className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                    usingExistingBeneficiary ? STYLES.inputDisabled : ""
                  }`}
                  value={formik.values.beneficiary_id_number}
                  onChange={formik.handleChange}
                  name="beneficiary_id_number"
                  placeholder="Enter ID number"
                  required
                  disabled={usingExistingBeneficiary}
                />
              </FieldContainer>
            </>
          )}
        </div>

        {/* Bank Account Details */}
        <div className={STYLES.fieldGrid}>
          {/* Account Number */}
          <FieldContainer>
            <FieldLabel required>
              Account Number
              {usingExistingBeneficiary && (
                <span className="ml-1 text-xs text-gray-500">(Pre-filled)</span>
              )}
            </FieldLabel>
            <input
              type="text"
              className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                usingExistingBeneficiary ? STYLES.inputDisabled : ""
              }`}
              value={account.accountNumber}
              onChange={(e) =>
                handleBankAccountChange(index, "accountNumber", e.target.value)
              }
              placeholder="Enter account number"
              required
              disabled={usingExistingBeneficiary}
            />
          </FieldContainer>

          {/* Bank Name/Selection - MATCHING NON-REDUX VERSION */}
          <FieldContainer>
            <FieldLabel required>
              Bank
              {usingExistingBeneficiary && (
                <span className="ml-1 text-xs text-gray-500">(Pre-filled)</span>
              )}
            </FieldLabel>

            {banksLoading ? (
              <div className="w-full border border-gray-300 rounded-xl p-4 bg-gray-50 flex items-center justify-center">
                <RingLoader size={20} color="#3B82F6" />
                <span className="ml-2 text-gray-600">Loading banks...</span>
              </div>
            ) : (
              <>
                {currentBanks && currentBanks.length > 0 ? (
                  <select
                    className={`${STYLES.selectBase} ${
                      usingExistingBeneficiary ? STYLES.inputDisabled : ""
                    }`}
                    value={account.bankCode || account.bankName || ""}
                    onChange={(e) => {
                      const selectedValue = e.target.value;

                      // Find the selected bank like non-redux version
                      const selectedBank = currentBanks.find(
                        (bank) =>
                          bank.bank_code === selectedValue ||
                          bank.code === selectedValue ||
                          bank.id === selectedValue ||
                          bank.name === selectedValue
                      );

                      if (selectedBank) {
                        // Set both bank code and bank name like non-redux version
                        handleBankAccountChange(
                          index,
                          "bankCode",
                          selectedValue
                        );
                        handleBankAccountChange(
                          index,
                          "bankName",
                          selectedBank.bank_name ||
                            selectedBank.name ||
                            selectedValue
                        );

                        // Trigger branch fetch for BDT banks
                        if (accountCurrency === "BDT" && selectedValue) {
                          onFetchBankBranches?.(selectedValue);
                        }
                      } else {
                        // Just set the bank name
                        handleBankAccountChange(
                          index,
                          "bankName",
                          selectedValue
                        );
                      }
                    }}
                    required
                    disabled={usingExistingBeneficiary}
                  >
                    <option value="">Select Bank</option>
                    {currentBanks.map((bank) => {
                      const bankKey =
                        bank.bank_code || bank.code || bank.id || bank.name;
                      const bankName = bank.bank_name || bank.name;
                      return (
                        <option key={bankKey} value={bankKey}>
                          {bankName}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  // Fallback to text input if no banks from API
                  <>
                    <input
                      type="text"
                      className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                        usingExistingBeneficiary ? STYLES.inputDisabled : ""
                      }`}
                      value={account.bankName}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "bankName",
                          e.target.value
                        )
                      }
                      placeholder="Enter bank name"
                      required
                      disabled={usingExistingBeneficiary}
                    />
                    {accountCurrency && !usingExistingBeneficiary && (
                      <p className="text-orange-500 text-sm mt-1">
                        No banks available for {accountCurrency}. Please enter
                        bank name manually.
                      </p>
                    )}
                  </>
                )}
              </>
            )}

            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-2 text-xs text-gray-500">
                Selected: {account.bankName} (Code: {account.bankCode})
              </div>
            )}
          </FieldContainer>

          {/* Branch Code (for BDT) */}
          {accountCurrency === "BDT" && account.bankCode && (
            <FieldContainer>
              <FieldLabel required>
                Branch
                {usingExistingBeneficiary && (
                  <span className="ml-1 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              {dropdownLoading ? (
                <div className="w-full border border-gray-300 rounded-xl p-4 bg-gray-50 flex items-center justify-center">
                  <RingLoader size={20} color="#3B82F6" />
                  <span className="ml-2 text-gray-600">
                    Loading branches...
                  </span>
                </div>
              ) : (
                <select
                  className={`${STYLES.selectBase} ${
                    usingExistingBeneficiary ? STYLES.inputDisabled : ""
                  }`}
                  value={account.branchCode}
                  onChange={(e) =>
                    handleBankAccountChange(index, "branchCode", e.target.value)
                  }
                  required
                  disabled={usingExistingBeneficiary}
                >
                  <option value="">Select Branch</option>
                  {currentBankBranches.map((branch) => (
                    <option key={branch.branch_code} value={branch.branch_code}>
                      {branch.branch_name} ({branch.branch_code})
                    </option>
                  ))}
                </select>
              )}
            </FieldContainer>
          )}

          {/* Additional fields based on rails */}
          {account.rails === "Swift" && (
            <>
              <FieldContainer>
                <FieldLabel>
                  Swift Code
                  {usingExistingBeneficiary && (
                    <span className="ml-1 text-xs text-gray-500">
                      (Pre-filled)
                    </span>
                  )}
                </FieldLabel>
                <input
                  type="text"
                  className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                    usingExistingBeneficiary ? STYLES.inputDisabled : ""
                  }`}
                  value={account.swift}
                  onChange={(e) =>
                    handleBankAccountChange(index, "swift", e.target.value)
                  }
                  placeholder="Enter SWIFT/BIC code"
                  disabled={usingExistingBeneficiary}
                />
              </FieldContainer>

              <FieldContainer>
                <FieldLabel>
                  Intermediary Bank SWIFT
                  {usingExistingBeneficiary && (
                    <span className="ml-1 text-xs text-gray-500">
                      (Pre-filled)
                    </span>
                  )}
                </FieldLabel>
                <input
                  type="text"
                  className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                    usingExistingBeneficiary ? STYLES.inputDisabled : ""
                  }`}
                  value={account.intermediarySwift}
                  onChange={(e) =>
                    handleBankAccountChange(
                      index,
                      "intermediarySwift",
                      e.target.value
                    )
                  }
                  placeholder="Enter intermediary bank SWIFT"
                  disabled={usingExistingBeneficiary}
                />
              </FieldContainer>

              <FieldContainer>
                <FieldLabel>
                  IBAN Number
                  {usingExistingBeneficiary && (
                    <span className="ml-1 text-xs text-gray-500">
                      (Pre-filled)
                    </span>
                  )}
                </FieldLabel>
                <input
                  type="text"
                  className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                    usingExistingBeneficiary ? STYLES.inputDisabled : ""
                  }`}
                  value={account.iban}
                  onChange={(e) =>
                    handleBankAccountChange(index, "iban", e.target.value)
                  }
                  placeholder="Enter IBAN number"
                  disabled={usingExistingBeneficiary}
                />
              </FieldContainer>
            </>
          )}

          {account.rails === "Local" && accountCurrency === "USD" && (
            <FieldContainer>
              <FieldLabel>
                Routing Number
                {usingExistingBeneficiary && (
                  <span className="ml-1 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                value={account.routingNumber}
                onChange={(e) =>
                  handleBankAccountChange(
                    index,
                    "routingNumber",
                    e.target.value
                  )
                }
                placeholder="Enter routing number"
                disabled={usingExistingBeneficiary}
              />
            </FieldContainer>
          )}

          {account.rails === "Local" && accountCurrency === "GBP" && (
            <FieldContainer>
              <FieldLabel>
                Sort Code
                {usingExistingBeneficiary && (
                  <span className="ml-1 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                value={account.sortCode}
                onChange={(e) =>
                  handleBankAccountChange(index, "sortCode", e.target.value)
                }
                placeholder="Enter sort code"
                disabled={usingExistingBeneficiary}
              />
            </FieldContainer>
          )}

          {account.rails === "Local" && accountCurrency === "INR" && (
            <FieldContainer>
              <FieldLabel>
                IFSC Code
                {usingExistingBeneficiary && (
                  <span className="ml-1 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                value={account.ifsc}
                onChange={(e) =>
                  handleBankAccountChange(index, "ifsc", e.target.value)
                }
                placeholder="Enter IFSC code"
                disabled={usingExistingBeneficiary}
              />
            </FieldContainer>
          )}

          {/* Mobile wallet fields */}
          {account.rails === "Mobile" && (
            <>
              <FieldContainer>
                <FieldLabel required>
                  Mobile Number
                  {usingExistingBeneficiary && (
                    <span className="ml-1 text-xs text-gray-500">
                      (Pre-filled)
                    </span>
                  )}
                </FieldLabel>
                <input
                  type="text"
                  className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                    usingExistingBeneficiary ? STYLES.inputDisabled : ""
                  }`}
                  value={account.mobileNumber}
                  onChange={(e) =>
                    handleBankAccountChange(
                      index,
                      "mobileNumber",
                      e.target.value
                    )
                  }
                  placeholder="Enter mobile number"
                  required
                  disabled={usingExistingBeneficiary}
                />
              </FieldContainer>

              <FieldContainer>
                <FieldLabel required>
                  Wallet Provider
                  {usingExistingBeneficiary && (
                    <span className="ml-1 text-xs text-gray-500">
                      (Pre-filled)
                    </span>
                  )}
                </FieldLabel>
                <select
                  className={`${STYLES.selectBase} ${
                    usingExistingBeneficiary ? STYLES.inputDisabled : ""
                  }`}
                  value={account.walletProvider}
                  onChange={(e) =>
                    handleBankAccountChange(
                      index,
                      "walletProvider",
                      e.target.value
                    )
                  }
                  required
                  disabled={usingExistingBeneficiary}
                >
                  <option value="">Select Provider</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="upay">Upay</option>
                  <option value="other">Other</option>
                </select>
              </FieldContainer>

              {account.walletProvider === "other" && (
                <FieldContainer>
                  <FieldLabel required>
                    Other Provider
                    {usingExistingBeneficiary && (
                      <span className="ml-1 text-xs text-gray-500">
                        (Pre-filled)
                      </span>
                    )}
                  </FieldLabel>
                  <input
                    type="text"
                    className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                      usingExistingBeneficiary ? STYLES.inputDisabled : ""
                    }`}
                    value={account.otherProvider}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "otherProvider",
                        e.target.value
                      )
                    }
                    placeholder="Enter provider name"
                    required
                    disabled={usingExistingBeneficiary}
                  />
                </FieldContainer>
              )}
            </>
          )}

          {/* Bank State */}
          {(accountCurrency === "BDT" || accountCurrency === "PKR") && (
            <FieldContainer>
              <FieldLabel>
                Bank State
                {usingExistingBeneficiary && (
                  <span className="ml-1 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                value={account.bankState}
                onChange={(e) =>
                  handleBankAccountChange(index, "bankState", e.target.value)
                }
                placeholder="Enter bank state"
                disabled={usingExistingBeneficiary}
              />
            </FieldContainer>
          )}

          {/* Account Type */}
          {accountCurrency === "USD" && (
            <FieldContainer>
              <FieldLabel>
                Account Type
                {usingExistingBeneficiary && (
                  <span className="ml-1 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <select
                className={`${STYLES.selectBase} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                value={account.accountType}
                onChange={(e) =>
                  handleBankAccountChange(index, "accountType", e.target.value)
                }
                disabled={usingExistingBeneficiary}
              >
                <option value="">Select Account Type</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </FieldContainer>
          )}
        </div>
      </div>
    );
  };

  // ========== RENDER BENEFICIARY DETAILS STEP ==========
  const renderBeneficiaryDetailsStep = () => (
    <div className="space-y-6">
      <SectionHeader
        title={pageTitle}
        subtitle="Fill in the beneficiary's personal information"
        onBack={!isPublic ? prevStep : undefined}
      />

      {/* Verification Status (for public forms) */}
      {isPublic && renderVerificationStatus()}

      <div className={STYLES.formContainer}>
        <div className={STYLES.formPadding}>
          {/* Beneficiary Type - FULL WIDTH ROW */}
          <div className="mb-6">{renderBeneficiaryTypeSelection()}</div>

          <div className={STYLES.fieldGrid}>
            {/* Currency Selection - Now in its own grid cell but full width on mobile */}
            <FieldContainer>
              <FieldLabel required>
                Payout Currency
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <select
                className={`${STYLES.selectBase} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                value={currency}
                onChange={handleCurrencyChange}
                disabled={usingExistingBeneficiary}
              >
                <option value="">Select Currency</option>
                {localCurrencies.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </FieldContainer>

            {/* Name Fields */}
            {renderNameField()}

            {/* Email Field */}
            {renderEmailField()}

            {/* Phone Field */}
            {renderPhoneField()}

            {/* Password Fields (only for public) */}
            {renderPasswordFields()}

            {/* Country */}
            <FieldContainer>
              <FieldLabel required>
                Country
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              {renderCountryDropdown()}
            </FieldContainer>

            {/* Nationality */}
            <FieldContainer>
              <FieldLabel required>
                Nationality
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <select
                className={`${STYLES.selectBase} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                value={formik.values.nationality_id}
                onChange={formik.handleChange}
                name="nationality_id"
                disabled={usingExistingBeneficiary}
              >
                <option value="">Select Nationality</option>
                {nationalities.map((nationality) => (
                  <option
                    key={nationality.id}
                    value={nationality.id.toString()}
                  >
                    {nationality.name}
                  </option>
                ))}
              </select>
            </FieldContainer>

            {/* State/Province */}
            <FieldContainer>
              <FieldLabel>
                State/Province
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                placeholder="Enter state/province"
                value={formik.values.state}
                onChange={formik.handleChange}
                name="state"
                disabled={usingExistingBeneficiary}
              />
            </FieldContainer>

            {/* City */}
            <FieldContainer>
              <FieldLabel required>
                City*
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                placeholder="Enter city (e.g., New York, London, Mumbai)"
                value={formik.values.city}
                onChange={formik.handleChange}
                name="city"
                disabled={usingExistingBeneficiary}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the city where the beneficiary resides
              </p>
            </FieldContainer>

            {/* Street Address */}
            <FieldContainer className="md:col-span-2">
              <FieldLabel required>
                Street Address
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                placeholder="Enter street address"
                value={formik.values.street}
                onChange={formik.handleChange}
                name="street"
                disabled={usingExistingBeneficiary}
              />
            </FieldContainer>

            {/* Postal Code */}
            <FieldContainer>
              <FieldLabel>
                Postal Code
                {usingExistingBeneficiary && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Pre-filled)
                  </span>
                )}
              </FieldLabel>
              <input
                type="text"
                className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                  usingExistingBeneficiary ? STYLES.inputDisabled : ""
                }`}
                placeholder="Enter postal code"
                value={formik.values.postalcode}
                onChange={formik.handleChange}
                name="postalcode"
                disabled={usingExistingBeneficiary}
              />
            </FieldContainer>

            {/* Relationship (only for private individual) */}
            {!isPublic && formik.values.beneftype === "individual" && (
              <FieldContainer>
                <FieldLabel required>
                  Relationship to Beneficiary
                  {usingExistingBeneficiary && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Pre-filled)
                    </span>
                  )}
                </FieldLabel>
                <Select
                  className="text-sm"
                  classNamePrefix="select"
                  options={relationshipOptions}
                  placeholder="Select relationship..."
                  onChange={(selectedOption) => {
                    formik.setFieldValue(
                      "relationtobenef",
                      selectedOption?.value || ""
                    );
                    setShowOtherRelationship(selectedOption?.value === "other");
                  }}
                  value={relationshipOptions.find(
                    (option) => option.value === formik.values.relationtobenef
                  )}
                  styles={{
                    ...customStyles,
                    control: (provided, state) => ({
                      ...customStyles.control(provided, state),
                      backgroundColor: usingExistingBeneficiary
                        ? "#f3f4f6"
                        : "white",
                      cursor: usingExistingBeneficiary
                        ? "not-allowed"
                        : "default",
                    }),
                  }}
                  isDisabled={usingExistingBeneficiary}
                />
              </FieldContainer>
            )}

            {/* Other Relationship Input */}
            {showOtherRelationship && (
              <FieldContainer>
                <FieldLabel required>
                  Specify Relationship
                  {usingExistingBeneficiary && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Pre-filled)
                    </span>
                  )}
                </FieldLabel>
                <input
                  type="text"
                  className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                    usingExistingBeneficiary ? STYLES.inputDisabled : ""
                  }`}
                  placeholder="Enter relationship"
                  value={formik.values.otherRelationship}
                  onChange={formik.handleChange}
                  name="otherRelationship"
                  disabled={usingExistingBeneficiary}
                />
              </FieldContainer>
            )}

            {/* NIC/BCC Code (for private) */}
            {!isPublic && (
              <FieldContainer>
                <FieldLabel>
                  NIC/BCC Code
                  {usingExistingBeneficiary && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Pre-filled)
                    </span>
                  )}
                </FieldLabel>
                <input
                  type="text"
                  className={`${STYLES.inputBase} ${STYLES.inputHover} ${
                    usingExistingBeneficiary ? STYLES.inputDisabled : ""
                  }`}
                  placeholder="Enter NIC/BCC code"
                  value={formik.values.nic_bcc_code}
                  onChange={formik.handleChange}
                  name="nic_bcc_code"
                  disabled={usingExistingBeneficiary}
                />
              </FieldContainer>
            )}
          </div>

          {/* Step Navigation Buttons */}
          <div className={`${STYLES.divider} flex flex-col md:flex-row gap-3`}>
            <button
              type="button"
              onClick={prevStep}
              className={STYLES.buttonSecondary}
            >
              <FaChevronLeft className="mr-2" />
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={isLoading || dropdownLoading || !formik.isValid}
              className={`${STYLES.buttonPrimary} flex-1 ${
                isLoading || dropdownLoading || !formik.isValid
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isLoading || dropdownLoading ? (
                <>
                  <RingLoader size={20} color="#ffffff" className="mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  Continue to Bank Details
                  <FaChevronRight className="ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ========== RENDER BANK INFO STEP ==========
  const renderBankInfoStep = () => (
    <div className="space-y-6">
      <SectionHeader
        title="Bank Information"
        subtitle="Fill in the beneficiary's banking details"
        onBack={prevStep}
      />

      <div className={STYLES.formContainer}>
        <div className={STYLES.formPadding}>
          {/* Currency Selection */}
          <FieldContainer>
            <FieldLabel required>
              Payout Currency
              {usingExistingBeneficiary && (
                <span className="ml-2 text-xs text-gray-500">(Pre-filled)</span>
              )}
            </FieldLabel>
            <select
              className={`${STYLES.selectBase} ${
                usingExistingBeneficiary ? STYLES.inputDisabled : ""
              }`}
              value={currency}
              onChange={handleCurrencyChange}
              disabled={usingExistingBeneficiary}
            >
              <option value="">Select Currency</option>
              {localCurrencies.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </FieldContainer>

          {/* Bank Accounts */}
          {bankAccounts.map((_, index) => renderBankAccountFields(index))}

          {/* Add Bank Account Button */}
          {!usingExistingBeneficiary && (
            <div className="mt-6">
              <button
                type="button"
                onClick={addBankAccount}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 p-3 hover:bg-blue-50 rounded-xl"
              >
                <FaPlus className="mr-2" />
                Add Another Bank Account
              </button>
            </div>
          )}

          {/* Submit Buttons */}
          <div className={`${STYLES.divider} flex flex-col md:flex-row gap-3`}>
            <button
              type="button"
              onClick={prevStep}
              className={STYLES.buttonSecondary}
            >
              <FaChevronLeft className="mr-2" />
              Back
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || isLoadingLocal || dropdownLoading}
              className={`${STYLES.buttonSuccess} flex-1 ${
                isLoading || isLoadingLocal || dropdownLoading
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isLoading || isLoadingLocal ? (
                <>
                  <RingLoader size={20} color="#ffffff" className="mr-2" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create Beneficiary"
              ) : (
                "Update Beneficiary"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ========== MAIN RENDER ==========
  return (
    <div className={STYLES.container}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {showSuccessPopup && (
        <SuccessPopup
          benefCode={benefCode}
          onClose={() => setShowSuccessPopup(false)}
          onCopy={handleCopyBenefCode}
          onContinue={handleContinueFromSuccess}
        />
      )}

      {/* Stepper Header */}
      {steps.length > 1 && (
        <div className="mb-10">
          {/* Progress Bar Background */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
              style={{
                width: `${(step / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Steps Container */}
          <div className="flex items-start justify-between relative">
            {steps.map((stepItem, index) => {
              const isActive = step === stepItem.number;
              const isCompleted = step > stepItem.number;
              const isFuture = step < stepItem.number;

              return (
                <div
                  key={stepItem.number}
                  className="flex flex-col items-center relative z-10 w-32"
                >
                  {/* Step Circle */}
                  <div className="relative mb-3">
                    {/* Outer Glow Effect for Active/Completed */}
                    {(isActive || isCompleted) && (
                      <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-r from-blue-400 to-purple-400 opacity-30 scale-125"></div>
                    )}

                    {/* Step Circle */}
                    <div
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 transform ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white scale-110 border-transparent shadow-lg"
                          : isCompleted
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-transparent shadow-md"
                          : "bg-white text-gray-400 border-gray-300"
                      }`}
                    >
                      {/* Icon or Check */}
                      {isCompleted ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : (
                        <div className="flex items-center">
                          {stepItem.icon}
                          <span className="ml-1 font-bold text-sm">
                            {stepItem.number + 1}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping"></div>
                      </div>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="text-center">
                    <div
                      className={`text-sm font-semibold transition-colors duration-300 ${
                        isActive
                          ? "text-gray-900"
                          : isCompleted
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {stepItem.title}
                    </div>
                    <div
                      className={`text-xs mt-1 transition-colors duration-300 ${
                        isActive
                          ? "text-gray-700"
                          : isCompleted
                          ? "text-green-500"
                          : "text-gray-400"
                      }`}
                    >
                      {stepItem.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Step Indicator */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                {steps.find((s) => s.number === step)?.icon || (
                  <FaUser className="text-white text-sm" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Step {step + 1} of {steps.length}:{" "}
                  {steps.find((s) => s.number === step)?.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {steps.find((s) => s.number === step)?.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        {step === 0 && renderPhoneSearchStep()}
        {step === 1 && renderBeneficiaryDetailsStep()}
        {step === 2 && renderBankInfoStep()}
      </form>
    </div>
  );
};

BaseBeneficiaryForm.propTypes = {
  mode: PropTypes.oneOf(["create", "edit"]),
  initialData: PropTypes.object,
  isPublic: PropTypes.bool,
  customerId: PropTypes.string,
  beneficiaryId: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  onPhoneSearch: PropTypes.func,
  onFetchCountries: PropTypes.func,
  onFetchNationalities: PropTypes.func,
  onFetchBanks: PropTypes.func,
  onFetchIdTypes: PropTypes.func,
  onFetchCities: PropTypes.func,
  onFetchBankBranches: PropTypes.func,
  nationalities: PropTypes.array,
  banks: PropTypes.object,
  idTypes: PropTypes.object,
  cities: PropTypes.object,
  bankBranches: PropTypes.object,
  countries: PropTypes.array,
  countriesOptions: PropTypes.array,
  phoneCodeOptions: PropTypes.array,
  beneficiaries: PropTypes.array,
  isLoading: PropTypes.bool,
  phoneSearchLoading: PropTypes.bool,
  phoneSearch: PropTypes.object,
  dropdownLoading: PropTypes.bool,
  showPhoneSearch: PropTypes.bool,
  usingExistingBeneficiary: PropTypes.bool,
  foundBeneficiary: PropTypes.object,
  emailVerified: PropTypes.bool,
  phoneVerified: PropTypes.bool,
  onSendEmailPasscode: PropTypes.func,
  onSendPhoneOTP: PropTypes.func,
  resendEmailLoading: PropTypes.bool,
  resendPhoneLoading: PropTypes.bool,
  setEmailVerified: PropTypes.func,
  setPhoneVerified: PropTypes.func,
  showPassword: PropTypes.bool,
  showConfirmPassword: PropTypes.bool,
  setShowPassword: PropTypes.func,
  setShowConfirmPassword: PropTypes.func,
  passwordErrors: PropTypes.object,
  setPasswordErrors: PropTypes.func,
  validatePassword: PropTypes.func,
  partnerId: PropTypes.string,
  pageTitle: PropTypes.string,
};

BaseBeneficiaryForm.defaultProps = {
  mode: "create",
  initialData: null,
  isPublic: false,
  nationalities: [],
  banks: {},
  idTypes: {},
  cities: {},
  bankBranches: {},
  countries: [],
  countriesOptions: [],
  phoneCodeOptions: [],
  beneficiaries: [],
  resendEmailLoading: false,
  resendPhoneLoading: false,
  isLoading: false,
  phoneSearchLoading: false,
  phoneSearch: {
    searched: false,
    exists: false,
    data: null,
    processed: false,
  },
  dropdownLoading: false,
  showPhoneSearch: true,
  usingExistingBeneficiary: false,
  foundBeneficiary: null,
  emailVerified: false,
  phoneVerified: false,
  showPassword: false,
  showConfirmPassword: false,
  passwordErrors: {},
  partnerId: "0",
  pageTitle: "Register Beneficiary",
};

export default BaseBeneficiaryForm;
