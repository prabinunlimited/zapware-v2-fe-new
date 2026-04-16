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
  FaSpinner,
  FaRegSmile,
  FaRegHandshake,
  FaChartLine,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaIdCard,
  FaCalendarAlt,
  FaFlag,
  FaRegBuilding,
  FaRegUser,
  FaMobileAlt,
  FaUserPlus,
  FaSync,
  FaUserFriends, // ← ADD THIS
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import SuccessPopup from "../../../components/PopupModal/BeneficiarySuccessPopup";

// ========== ANIMATION VARIANTS ==========
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.3 } },
};

const stepVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardHover = {
  scale: 1.02,
  transition: { duration: 0.2, type: "spring", stiffness: 300 },
};

const buttonTap = { scale: 0.98 };

// ========== CONSISTENT STYLING CONSTANTS ==========
const STYLES = {
  container:
    "min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-4 md:p-8",
  formContainer:
    "bg-white rounded-3xl border border-gray-200 shadow-xl backdrop-blur-sm",
  formPadding: "p-6 md:p-8",
  inputBase:
    "w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md",
  inputHover: "hover:border-gray-400 hover:shadow-md",
  inputDisabled: "bg-gray-100 cursor-not-allowed opacity-70",
  selectBase:
    "w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md",
  buttonPrimary:
    "px-6 py-3 rounded-xl transition-all duration-300 font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
  buttonSecondary:
    "px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium transform hover:-translate-y-0.5",
  buttonSuccess:
    "px-6 py-3 rounded-xl transition-all duration-300 font-medium bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
  buttonDanger:
    "px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 font-medium transform hover:-translate-y-0.5",
  buttonWarning:
    "px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-all duration-300 font-medium transform hover:-translate-y-0.5",
  sectionTitle:
    "text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent",
  sectionSubtitle: "text-gray-600 mt-2",
  sectionHeader: "flex items-center justify-between mb-8",
  fieldLabel: "block text-sm font-medium text-gray-700 mb-2",
  fieldRequired: "text-red-500 ml-1",
  fieldContainer: "mb-6",
  fieldGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  infoCard:
    "p-6 rounded-2xl border-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg",
  warningCard:
    "p-6 rounded-2xl border-2 border-yellow-200 bg-yellow-50 shadow-lg",
  successCard:
    "p-6 rounded-2xl border-2 border-green-200 bg-green-50 shadow-lg",
  iconCircle: "flex items-center justify-center w-12 h-12 rounded-full",
  divider: "border-t border-gray-200 pt-8 mt-8",
  stepActive: "bg-gradient-to-r from-blue-600 to-purple-600 text-white",
  stepInactive: "bg-gray-200 text-gray-500",
  stepCompleted: "bg-gradient-to-r from-green-500 to-green-600 text-white",
};

// ========== REUSABLE COMPONENTS WITH ANIMATIONS ==========
const SectionHeader = ({ title, subtitle, onBack }) => (
  <motion.div
    className={STYLES.sectionHeader}
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div>
      <motion.h1
        className={STYLES.sectionTitle}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          className={STYLES.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
    {onBack && (
      <motion.button
        type="button"
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
        whileHover={{ x: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaArrowLeft className="mr-2" />
        Back
      </motion.button>
    )}
  </motion.div>
);

const FieldContainer = ({ children, className = "" }) => (
  <motion.div
    className={`${STYLES.fieldContainer} ${className}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
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
    <motion.div
      className={`${cardStyles[type]} mb-6`}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring" }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className="flex items-start">
        <motion.div
          className={`${iconColors[type]} mr-4 flex-shrink-0`}
          whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
        >
          {icons[type]}
        </motion.div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          {description && <p className="text-gray-600 mb-4">{description}</p>}
          {children}
        </div>
      </div>
    </motion.div>
  );
};

const LoadingButton = ({ loading, children, ...props }) => (
  <motion.button
    {...props}
    disabled={loading}
    whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
    whileTap={!loading ? { scale: 0.98 } : {}}
    className={props.className}
  >
    {loading ? (
      <>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="inline-block mr-2"
        >
          <RingLoader size={20} color="#ffffff" />
        </motion.div>
        Loading...
      </>
    ) : (
      children
    )}
  </motion.button>
);

const AlertBox = ({ message = "Please log in to continue!", onClose }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="alert-title"
      aria-describedby="alert-message"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="max-w-lg w-11/12 md:w-1/2 p-6 rounded-2xl shadow-2xl bg-gradient-to-r from-red-600 to-red-700 text-white text-center"
        initial={{ scale: 0.9, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
      >
        <h2
          id="alert-title"
          className="text-2xl font-extrabold mb-4 tracking-wide"
        >
          Action Required!
        </h2>
        <p id="alert-message" className="text-sm md:text-base mb-6">
          {message}
        </p>
        <motion.button
          onClick={onClose}
          className="px-6 py-2 bg-white text-red-600 rounded-xl font-medium hover:bg-gray-100 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Close
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

AlertBox.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

AlertBox.defaultProps = {
  message: "Please log in to continue!",
};

// Animated Input Component
const AnimatedInput = ({
  label,
  required,
  info,
  disabled,
  error,
  icon: Icon,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <FieldLabel required={required} info={info}>
        {label}
      </FieldLabel>
      <motion.div
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          {...props}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`${STYLES.inputBase} ${Icon ? "pl-10" : ""} ${disabled ? STYLES.inputDisabled : STYLES.inputHover} ${error ? "border-red-500 focus:ring-red-500" : ""}`}
        />
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-500 text-xs mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

// Animated Select Component
const AnimatedSelect = ({
  label,
  required,
  info,
  disabled,
  options,
  value,
  onChange,
  icon: Icon,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <FieldLabel required={required} info={info}>
        {label}
      </FieldLabel>
      <motion.div
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <Select
          {...props}
          options={options}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          styles={{
            ...customStyles,
            control: (provided, state) => ({
              ...customStyles.control(provided, state),
              paddingLeft: Icon ? "30px" : "12px",
              border: isFocused
                ? "2px solid #3b82f6"
                : state.isFocused
                  ? "2px solid #3b82f6"
                  : "1px solid #d1d5db",
              boxShadow: isFocused
                ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
                : "none",
            }),
          }}
          isDisabled={disabled}
        />
      </motion.div>
    </div>
  );
};

// Progress Indicator
const ProgressIndicator = ({ step, totalSteps }) => {
  const progress = (step / (totalSteps - 1)) * 100;

  return (
    <div className="relative mb-8">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            backgroundSize: "200% 100%",
            animation: "shimmer 2s infinite linear",
          }}
        />
      </div>
      <motion.div
        className="absolute top-0 left-0 w-4 h-4 -mt-1 rounded-full bg-blue-500 shadow-lg"
        style={{ left: `${progress}%` }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </div>
  );
};

// Floating Label Input
const FloatingLabelInput = ({
  label,
  value,
  onChange,
  required,
  icon: Icon,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = isFocused || value;

  return (
    <div className="relative">
      <motion.label
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isFloating
            ? "text-xs top-2 text-blue-500"
            : "text-gray-500 top-3.5 text-sm"
        }`}
        animate={isFloating ? { y: -8, scale: 0.85 } : { y: 0, scale: 1 }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </motion.label>
      {Icon && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <Icon size={18} />
        </div>
      )}
      <input
        {...props}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={`w-full px-4 pt-6 pb-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          isFocused ? "border-blue-500" : ""
        } ${Icon ? "pl-10" : ""}`}
      />
    </div>
  );
};

// Field Label Component
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

// ========== MAIN COMPONENT ==========
const BaseBeneficiaryForm = ({
  mode = "create",
  initialData = null,
  isPublic = false,
  customerId = null,
  beneficiaryId = null,
  onSubmit,
  onCancel,
  onResetSearch,
  onPhoneSearch,
  onFetchCountries,
  onFetchNationalities,
  onFetchBanks,
  onFetchIdTypes,
  onFetchCities,
  onFetchBankBranches,
  nationalities = [],
  banks = {},
  idTypes = {},
  cities = {},
  bankBranches = {},
  countries = [],
  countriesOptions = [],
  phoneCodeOptions = [],
  beneficiaries = [],
  isLoading = false,
  phoneSearchLoading = false,
  phoneSearch = {
    searched: false,
    exists: false,
    data: null,
    processed: false,
  },
  dropdownLoading = false,
  showPhoneSearch = true,
  usingExistingBeneficiary: initialUsingExisting = false,
  foundBeneficiary: initialFoundBeneficiary = null,
  emailVerified = false,
  phoneVerified = false,
  onSendEmailPasscode = null,
  onSendPhoneOTP = null,
  setEmailVerified = null,
  setPhoneVerified = null,
  resendEmailLoading = false,
  resendPhoneLoading = false,
  showPassword = false,
  showConfirmPassword = false,
  setShowPassword = null,
  setShowConfirmPassword = null,
  passwordErrors = {},
  setPasswordErrors = null,
  validatePassword = null,
  partnerId = "0",
  pageTitle = "Register Beneficiary",
}) => {
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const nationalitiesFetched = useRef(false);
  const countriesFetched = useRef(false);
  const banksFetched = useRef({});
  const idTypesFetched = useRef({});
  const citiesFetched = useRef({});
  const isProcessingPhoneSearch = useRef(false);

  // ========== LOCAL STATE ==========
  const [step, setStep] = useState(
    mode === "create" && showPhoneSearch ? 0 : 1,
  );
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [currency, setCurrency] = useState(
    mode === "edit" && initialData?.banks?.[0]?.currency_code
      ? initialData.banks[0].currency_code
      : "USD",
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
    initialFoundBeneficiary,
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
          gradient: "from-blue-500 to-blue-600",
        },
        {
          number: 2,
          title: "Bank Information",
          icon: <FaUniversity className="text-sm" />,
          description: "Account & Payment Details",
          color: "purple",
          gradient: "from-purple-500 to-purple-600",
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
          gradient: "from-indigo-500 to-indigo-600",
        },
        {
          number: 1,
          title: "Details",
          icon: <FaUser className="text-sm" />,
          description: "Personal information",
          color: "blue",
          gradient: "from-blue-500 to-blue-600",
        },
        {
          number: 2,
          title: "Bank",
          icon: <FaUniversity className="text-sm" />,
          description: "Account details",
          color: "purple",
          gradient: "from-purple-500 to-purple-600",
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
          gradient: "from-blue-500 to-blue-600",
        },
        {
          number: 2,
          title: "Bank",
          icon: <FaUniversity className="text-sm" />,
          description: "Account details",
          color: "purple",
          gradient: "from-purple-500 to-purple-600",
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
        rails: bank.rails || "Local",
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
        rails: "Local",
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

  // ========== FORMIK ==========
  const formik = useFormik({
    initialValues: {
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
      nationalitiesFetched.current = false;
      countriesFetched.current = false;
      banksFetched.current = {};
      idTypesFetched.current = {};
      citiesFetched.current = {};
    };
  }, []);

  // Helper function to get bank type
  const getBankType = useCallback(
    (currencyParam) => {
      const currencyToUse = currencyParam || currency;
      const intBankCurrencies = ["BDT", "LKR", "AUD", "PKR"];
      return intBankCurrencies.includes(currencyToUse)
        ? "int-banks"
        : "currency-payout-banks";
    },
    [currency],
  );

  // Get banks for currency
  const getBanksForCurrency = useMemo(() => {
    if (["BDT", "LKR", "AUD", "PKR"].includes(currency)) {
      return banks[`${currency}_int`] || [];
    }
    return banks[currency] || [];
  }, [banks, currency]);

  // Get ID types for currency
  const getIdTypesForCurrency = useMemo(() => {
    if (Object.keys(idTypes).length === 0 || !currency) {
      return [];
    }
    const currentBeneficiaryType = formik.values.beneftype || "individual";
    const storageKey =
      currentBeneficiaryType === "institution"
        ? `${currency}_institution`
        : currency;
    const types = idTypes[storageKey];
    if (!types) return [];
    if (Array.isArray(types)) return types;
    if (types && types.data && Array.isArray(types.data)) return types.data;
    if (types && typeof types === "object") return Object.values(types);
    return [];
  }, [idTypes, currency, formik.values.beneftype]);

  // Get bank branches
  const getBankBranches = useMemo(() => {
    const currentBankCode = bankAccounts[0]?.bankCode;
    return currentBankCode ? bankBranches[currentBankCode] || [] : [];
  }, [bankBranches, bankAccounts]);

  // First effect - Initial data fetch
  useEffect(() => {
    if (!currency || currency === "" || step <= 0 || !isMounted.current) {
      return;
    }

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

    const bankType = getBankType(currency);
    if (onFetchBanks && !banksFetched.current[currency] && isMounted.current) {
      onFetchBanks?.({ currency, bankType });
      banksFetched.current[currency] = true;
    }

    if (
      currency &&
      currency !== "" &&
      ["BDT", "INR", "PKR"].includes(currency) &&
      onFetchIdTypes
    ) {
      const currentBeneficiaryType = formik.values.beneftype || "individual";
      const cacheKey = `${currency}_${currentBeneficiaryType}`;
      if (!idTypesFetched.current[cacheKey] && isMounted.current) {
        onFetchIdTypes?.(currency, currentBeneficiaryType);
        idTypesFetched.current[cacheKey] = true;
      }
    }
  }, [
    currency,
    step,
    onFetchNationalities,
    onFetchCountries,
    onFetchBanks,
    onFetchIdTypes,
    formik.values.beneftype,
    getBankType,
  ]);

  // Second effect - Fetch ID types on beneficiary type change
  useEffect(() => {
    if (!currency || currency === "" || step <= 0) {
      return;
    }

    if (
      currency &&
      currency !== "" &&
      ["BDT", "INR", "PKR"].includes(currency) &&
      onFetchIdTypes
    ) {
      const currentBeneficiaryType = formik.values.beneftype || "individual";
      const cacheKey = `${currency}_${currentBeneficiaryType}`;
      if (!idTypesFetched.current[cacheKey]) {
        onFetchIdTypes?.(currency, currentBeneficiaryType);
        idTypesFetched.current[cacheKey] = true;
      }
    }
  }, [currency, formik.values.beneftype, step, onFetchIdTypes]);

  // Handle copy benef code
  const handleCopyBenefCode = useCallback(() => {
    toast.success("Copied to clipboard!");
  }, []);

  // Handle continue from success
  const handleContinueFromSuccess = useCallback(() => {
    setShowSuccessPopup(false);
    navigate(isPublic ? "/dashboard" : "/beneficiaries");
  }, [navigate, isPublic]);

  // Set country code from formik
  useEffect(() => {
    if (formik.values.country_phone_code) {
      setCountryCodeInput(formik.values.country_phone_code);
    }
  }, [formik.values.country_phone_code]);

  // Validation logic
  const isFormValid = useCallback(() => {
    // Your existing validation logic here
    if (formik.values.beneftype === "") return false;

    if (isPublic) {
      if (formik.values.beneftype === "individual") {
        if (!formik.values.first_name || !formik.values.last_name) return false;
      } else if (formik.values.beneftype === "institution") {
        if (!formik.values.institution_name) return false;
      }

      if (
        !formik.values.email ||
        !formik.values.country_id ||
        !formik.values.country_phone_code ||
        !formik.values.phone_number ||
        !formik.values.city ||
        !formik.values.street
      )
        return false;

      if (!formik.values.password || !formik.values.confirmPassword)
        return false;
      if (formik.values.password !== formik.values.confirmPassword)
        return false;
      if (validatePassword && !validatePassword(formik.values.password))
        return false;

      if (!emailVerified || !phoneVerified) return false;

      if (currency === "BDT" || currency === "INR" || currency === "PKR") {
        if (
          !formik.values.beneficiary_id_type ||
          !formik.values.beneficiary_id_number
        )
          return false;
      }

      return true;
    }

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

  // Currency change handler
  const handleCurrencyChange = useCallback(
    (selectedOption) => {
      const newCurrency = selectedOption?.value;

      if (!newCurrency || newCurrency === "") {
        return;
      }

      setCurrency(newCurrency);
      formik.setFieldValue("beneficiary_id_type", "");
      formik.setFieldValue("beneficiary_id_number", "");

      if (["BDT", "INR", "PKR"].includes(newCurrency)) {
        const currentBeneficiaryType = formik.values.beneftype || "individual";
        onFetchIdTypes?.(newCurrency, currentBeneficiaryType);
      }

      const bankType = getBankType(newCurrency);
      onFetchBanks?.({ currency: newCurrency, bankType: bankType });

      setBankAccounts((prevAccounts) =>
        prevAccounts.map((account) => ({
          ...account,
          currency: newCurrency,
          rails: account.rails || "Local",
        })),
      );
    },
    [formik, onFetchBanks, onFetchIdTypes, getBankType],
  );

  // Phone search click handler
  const handlePhoneSearchClick = () => {
    // Validate phone input
    if (!phoneInput.trim()) {
      toast.error("Please enter a phone number to search");
      return;
    }

    const phoneRegex = /^[+]?[0-9\s\-\(\)\.]+$/;
    if (!phoneRegex.test(phoneInput)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Prevent multiple searches while already searching
    if (phoneSearchLoading) {
      toast.info("Search in progress, please wait...");
      return;
    }

    // Clear any previous search state
    setShowSearchResults(false);
    setFoundBeneficiary(null);
    setUsingExistingBeneficiary(false);

    // Store the phone number and country code in formik for context
    formik.setFieldValue("phone_number", phoneInput);
    formik.setFieldValue("country_phone_code", countryCodeInput);
    setCountryCodeInput(countryCodeInput);

    // If no beneficiaries exist, don't even try to search
    if (beneficiaries.length === 0) {
      setShowSearchResults(true);
      toast.info("No existing beneficiaries found. You can create a new one.");
      return;
    }

    // Use the onPhoneSearch prop to trigger the search (Redux)
    if (onPhoneSearch) {
      console.log("🔍 Triggering phone search via Redux for:", phoneInput);
      onPhoneSearch({
        phoneNumber: phoneInput,
        countryPhoneCode: countryCodeInput,
      });
    } else {
      // Fallback: local search (this should ideally not happen as onPhoneSearch should be provided)
      console.warn(
        "⚠️ onPhoneSearch prop not provided, using fallback local search",
      );

      const cleanPhoneInput = phoneInput.replace(/[\s\-\(\)]/g, "");

      const foundBeneficiaryLocal = beneficiaries.find((benef) => {
        const benefPhone = benef.phone_number || "";
        const benefFullPhone = benef.full_phone_number || "";
        return (
          benefPhone === cleanPhoneInput ||
          benefFullPhone.includes(cleanPhoneInput) ||
          benefFullPhone ===
            `${countryCodeInput.replace("+", "")}${cleanPhoneInput}`
        );
      });

      if (foundBeneficiaryLocal) {
        const formattedBeneficiary = {
          name:
            foundBeneficiaryLocal.name ||
            `${foundBeneficiaryLocal.first_name || ""} ${foundBeneficiaryLocal.last_name || ""}`.trim(),
          country_id: foundBeneficiaryLocal.country_id?.toString(),
          country_phone_code:
            foundBeneficiaryLocal.country_phone_code ||
            countryCodeInput.replace("+", ""),
          phone_number: foundBeneficiaryLocal.phone_number,
          email: foundBeneficiaryLocal.email,
          beneftype: foundBeneficiaryLocal.beneftype || "individual",
          state: foundBeneficiaryLocal.state,
          city: foundBeneficiaryLocal.city,
          street: foundBeneficiaryLocal.street,
          postalcode: foundBeneficiaryLocal.postalcode,
          relationtobenef: foundBeneficiaryLocal.relationtobenef,
          otherRelationship: foundBeneficiaryLocal.otherRelationship || "",
          nationality_id: foundBeneficiaryLocal.nationality_id?.toString(),
          status: foundBeneficiaryLocal.status?.toString() || "1",
          nic_bcc_code: foundBeneficiaryLocal.nic_bcc_code || "",
          beneficiary_id_type: foundBeneficiaryLocal.beneficiary_id_type || "",
          beneficiary_id_number:
            foundBeneficiaryLocal.beneficiary_id_number || "",
          currency: foundBeneficiaryLocal.currency || "USD",
          banks: foundBeneficiaryLocal.banks || [],
        };

        setShowSearchResults(true);
        setFoundBeneficiary(formattedBeneficiary);
        toast.success("Beneficiary found! Review the details below.");
      } else {
        setShowSearchResults(true);
        setFoundBeneficiary(null);
        toast.info(
          "No existing beneficiary found with this phone number. You can create a new one.",
        );
      }
    }
  };

  // Use found beneficiary handler
  const handleUseFoundBeneficiary = () => {
    if (foundBeneficiary) {
      let relationshipValue = foundBeneficiary.relationtobenef;
      const relationshipMap = {
        father: "father",
        mother: "mother",
        sister: "sister",
        brother: "brother",
        cousin: "cousin",
        friend: "friend",
        other: "other",
      };

      if (relationshipValue && !relationshipMap[relationshipValue]) {
        const lowerValue = relationshipValue.toLowerCase();
        if (relationshipMap[lowerValue]) {
          relationshipValue = relationshipMap[lowerValue];
        }
      }

      formik.setValues({
        name: foundBeneficiary.name || "",
        country_id: foundBeneficiary.country_id?.toString() || "",
        country_phone_code:
          foundBeneficiary.country_phone_code ||
          countryCodeInput.replace("+", ""),
        phone_number: foundBeneficiary.phone_number || phoneInput,
        email: foundBeneficiary.email || "",
        beneftype: foundBeneficiary.beneftype || "individual",
        state: foundBeneficiary.state || "",
        city: foundBeneficiary.city || "",
        street: foundBeneficiary.street || "",
        postalcode: foundBeneficiary.postalcode || "",
        relationtobenef: relationshipValue || "",
        otherRelationship: foundBeneficiary.otherRelationship || "",
        nationality_id: foundBeneficiary.nationality_id?.toString() || "",
        status: foundBeneficiary.status?.toString() || "1",
        nic_bcc_code: foundBeneficiary.nic_bcc_code || "",
        beneficiary_id_type: foundBeneficiary.beneficiary_id_type || "",
        beneficiary_id_number: foundBeneficiary.beneficiary_id_number || "",
      });

      if (foundBeneficiary.currency) {
        setCurrency(foundBeneficiary.currency);
      }

      if (foundBeneficiary.banks && foundBeneficiary.banks.length > 0) {
        const mappedBanks = foundBeneficiary.banks.map((bank) => ({
          rails: bank.rails || "Local",
          currency: bank.currency_code || foundBeneficiary.currency || currency,
          iban: bank.benef_iban || "",
          swift: bank.swift_code || "",
          intermediarySwift: bank.intermediary_bank_swift || "",
          routingNumber: bank.routing_number || "",
          accountNumber: bank.bank_acc_no || "",
          bankName: bank.bank_name || "",
          ifsc: bank.ifsc || "",
          bankCode: bank.bankCode || bank.bank_code || "",
          paymentMethod: bank.payment_method || paymentMethod,
          bankState: bank.bankState || bank.bank_state || "",
          branchCode: bank.branchCode || bank.branch_code || "",
          accountName: bank.account_name || bank.nameInBankAc || "",
          accountTitle: bank.account_title || "",
          walletProvider: bank.wallet_provider || "",
          mobileNumber: bank.mobile_number || "",
          otherProvider: bank.other_provider || "",
          accountType: bank.account_type || "",
          sortCode: bank.sort_code || "",
        }));
        setBankAccounts(mappedBanks);
      }

      if (relationshipValue === "other") {
        setShowOtherRelationship(true);
      } else {
        setShowOtherRelationship(false);
      }

      toast.success("Beneficiary details loaded successfully!");
    }

    setUsingExistingBeneficiary(true);
    setShowSearchResults(false);
    setStep(1);
  };

  // Create new beneficiary handler
  const handleCreateNewBeneficiary = () => {
    // Preserve the phone number and country code that was searched
    const preservedPhoneNumber = phoneInput;
    const preservedCountryCode = countryCodeInput;

    // Reset form but keep the phone number and country code
    formik.resetForm();
    formik.setFieldValue("phone_number", preservedPhoneNumber);
    formik.setFieldValue("country_phone_code", preservedCountryCode);

    // Set the country ID based on the selected country code
    const selectedCountry = countriesOptions.find(
      (option) => option.phoneCode === preservedCountryCode,
    );
    if (selectedCountry) {
      formik.setFieldValue("country_id", selectedCountry.value?.toString());
    }

    // Reset currency to default
    setCurrency("USD");

    // Reset bank accounts to one empty account
    setBankAccounts([
      {
        rails: "Local",
        currency: "USD",
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
    ]);

    // Reset relationship states
    setShowOtherRelationship(false);

    // ✅ Clear ALL search-related state
    setFoundBeneficiary(null);
    setShowSearchResults(false);
    setUsingExistingBeneficiary(false);

    // ✅ Clear Redux search state
    dispatch(clearPhoneSearch());

    // ✅ Reset the processing flag
    if (isProcessingPhoneSearch.current) {
      isProcessingPhoneSearch.current = false;
    }

    // Move to next step
    setStep(1);

    toast.info("Starting with a new beneficiary. Please fill in the details.");
  };

  // Step navigation
  const nextStep = () => {
    // Step 0: Phone Search Step
    if (step === 0) {
      // Validate phone input
      if (!phoneInput.trim()) {
        toast.error("Please enter a phone number to search");
        return false;
      }

      const phoneRegex = /^[+]?[0-9\s\-\(\)\.]+$/;
      if (!phoneRegex.test(phoneInput)) {
        toast.error("Please enter a valid phone number");
        return false;
      }

      // If we already have a found beneficiary from local search
      if (foundBeneficiary) {
        setUsingExistingBeneficiary(true);
        setStep(1);
        return true;
      }

      // Check if there are any beneficiaries in the system
      if (beneficiaries.length === 0) {
        // No beneficiaries exist, skip search and go to details step
        formik.setFieldValue("phone_number", phoneInput);
        formik.setFieldValue("country_phone_code", countryCodeInput);
        setFoundBeneficiary(null);
        setUsingExistingBeneficiary(false);
        setShowSearchResults(false);
        setStep(1);
        toast.info(
          "No existing beneficiaries found. You can create a new beneficiary.",
        );
        return true;
      }

      // If we haven't performed a search yet, do it now
      if (!phoneSearch.searched) {
        handlePhoneSearchClick();
        return false; // Don't proceed yet, wait for search results
      }

      // If we've searched and found a beneficiary, use it
      if (phoneSearch.searched && phoneSearch.exists && phoneSearch.data) {
        setFoundBeneficiary(phoneSearch.data);
        setUsingExistingBeneficiary(true);
        setStep(1);
        return true;
      }

      // If we've searched and no beneficiary found, create new
      if (phoneSearch.searched && !phoneSearch.exists) {
        formik.setFieldValue("phone_number", phoneInput);
        formik.setFieldValue("country_phone_code", countryCodeInput);
        setFoundBeneficiary(null);
        setUsingExistingBeneficiary(false);
        setStep(1);
        return true;
      }

      // Default fallback - just set the phone number and move to next step
      formik.setFieldValue("phone_number", phoneInput);
      formik.setFieldValue("country_phone_code", countryCodeInput);
      setStep(1);
      return true;
    }

    // Step 1: Beneficiary Details Step
    if (step === 1) {
      // Check if we're in public registration mode
      if (isPublic) {
        if (!emailVerified) {
          toast.error("Please verify your email before proceeding");
          return false;
        }
        if (!phoneVerified) {
          toast.error("Please verify your phone number before proceeding");
          return false;
        }
      }

      // Currency-specific validations for BDT, INR, PKR
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

        // INR specific city validation
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
    }

    // Move to next step
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

  // Bank account functions
  const addBankAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      {
        rails: "Local",
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

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPublic) {
      if (!emailVerified || !phoneVerified) {
        toast.error(
          "Please verify your email and phone number before submitting",
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
        "+",
      )
        ? formik.values.country_phone_code.substring(1)
        : formik.values.country_phone_code;

      const finalRelationship =
        formik.values.relationtobenef === "other" &&
        formik.values.otherRelationship.trim() !== ""
          ? formik.values.otherRelationship.trim()
          : formik.values.relationtobenef;

      let beneficiaryData;

      if (isPublic) {
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

      if (result && result.beneficiaryCode) {
        setBenefCode(result.beneficiaryCode);
        setShowSuccessPopup(true);
      } else if (result && result.benefCode) {
        setBenefCode(result.benefCode);
        setShowSuccessPopup(true);
      } else {
        toast.success(
          mode === "create"
            ? "Beneficiary created successfully!"
            : "Beneficiary updated successfully!",
        );
        if (mode === "create") {
          formik.resetForm();
          setBankAccounts([
            {
              rails: "Local",
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
  const renderPhoneSearchStep = () => (
    <motion.div
      className="space-y-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header Section */}
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-200 shadow-xl overflow-hidden relative"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full opacity-10"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          style={{ top: -100, right: -100 }}
        />
        <div className="relative z-10 flex items-center">
          <motion.div
            className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white mr-5 shadow-lg"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <FaPhone size={28} />
          </motion.div>
          <div>
            <motion.h2
              className="text-2xl font-bold text-gray-800"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Search Existing Beneficiary
            </motion.h2>
            <motion.p
              className="text-gray-600"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Enter the beneficiary's phone number to check if they already
              exist in the system.
            </motion.p>
          </div>
        </div>
      </motion.div>

      <motion.div className="space-y-6" variants={staggerContainer}>
        {/* Phone Input with Refresh Button */}
        <motion.div variants={fadeInUp} className="relative">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FloatingLabelInput
                label="Beneficiary Phone Number"
                required
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  // ✅ Clear ALL search state when typing
                  setShowSearchResults(false);
                  setFoundBeneficiary(null);
                  setUsingExistingBeneficiary(false);
                  dispatch(clearPhoneSearch());
                  // ✅ Reset the processed flag
                  if (isProcessingPhoneSearch.current) {
                    isProcessingPhoneSearch.current = false;
                  }
                }}
                type="tel"
                disabled={phoneSearchLoading}
                icon={FaMobileAlt}
              />
            </div>
            
            <motion.button
              type="button"
              onClick={() => {
                if (customerId && phoneInput.trim()) {
                  console.log("🔄 Manual refresh - searching again...");
                  // Reset processing flag
                  if (isProcessingPhoneSearch.current) {
                    isProcessingPhoneSearch.current = false;
                  }
                  // Trigger a new search
                  handlePhoneSearchClick();
                } else if (!phoneInput.trim()) {
                  toast.error("Please enter a phone number to search");
                } else if (!customerId) {
                  toast.error("Customer ID missing");
                }
              }}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              title="Search again"
              disabled={phoneSearchLoading}
            >
              <FaSync
                className={`text-gray-600 ${phoneSearchLoading ? "animate-spin" : ""}`}
                size={18}
              />
            </motion.button>
          </div>

          {/* Beneficiaries Count Indicator */}
          {beneficiaries.length > 0 && !phoneSearchLoading && (
            <motion.div
              className="flex items-center gap-2 mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <FaCheckCircle size={12} className="text-green-500" />
              <span>
                {beneficiaries.length} existing beneficiary(ies) loaded for
                search
              </span>
              <span className="text-gray-300">•</span>
              <span>Phone numbers will be checked against this list</span>
            </motion.div>
          )}

          <motion.p
            className="text-sm text-gray-500 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            We'll check if a beneficiary with this phone number already exists
          </motion.p>
        </motion.div>

        {/* Country Code Select */}
        <motion.div variants={fadeInUp}>
          <AnimatedSelect
            label="Country Code"
            required
            options={countriesOptions}
            icon={FaGlobe}
            value={(() => {
              if (formik.values.country_id) {
                const selectedById = countriesOptions.find(
                  (option) =>
                    option.value === parseInt(formik.values.country_id),
                );
                if (selectedById) return selectedById;
              }
              if (formik.values.country_phone_code) {
                return countriesOptions.find(
                  (option) =>
                    option.phoneCode === formik.values.country_phone_code,
                );
              }
              return null;
            })()}
            onChange={(selectedOption) => {
              // Always allow changing country code, even when beneficiary is found
              const phoneCode = selectedOption?.phoneCode || "+1";
              const countryId = selectedOption?.value;
              formik.setFieldValue("country_phone_code", phoneCode);
              formik.setFieldValue("country_id", countryId?.toString());
              setCountryCodeInput(phoneCode);
            }}
            formatOptionLabel={(option) => (
              <div className="flex items-center">
                {option.flag_url && (
                  <img
                    src={option.flag_url}
                    alt={`${option.label} flag`}
                    className="w-6 h-4 mr-2 rounded-sm object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                )}
                <span>
                  {option.phoneCode} ({option.label})
                </span>
              </div>
            )}
            // No disabled condition - always enabled
          />
        </motion.div>

        {/* Search Button */}
        <motion.div variants={fadeInUp}>
          <motion.button
            type="button"
            onClick={handlePhoneSearch}
            disabled={!phoneInput.trim() || phoneSearchLoading}
            className={`w-full px-6 py-4 rounded-xl transition-all duration-300 flex items-center justify-center font-medium ${
              phoneSearchLoading || !phoneInput.trim()
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
            }`}
            whileHover={
              !phoneSearchLoading && phoneInput.trim()
                ? { scale: 1.02, y: -2 }
                : {}
            }
            whileTap={
              !phoneSearchLoading && phoneInput.trim() ? { scale: 0.98 } : {}
            }
          >
            {phoneSearchLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <FaSpinner />
                </motion.div>
                Searching...
              </>
            ) : (
              <>
                <FaSearch className="mr-2" />
                Search Beneficiary
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Beneficiary Found Section - Enhanced */}
        <AnimatePresence mode="wait">
          {foundBeneficiary && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="relative overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <FaCheckCircle className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Beneficiary Found!
                    </h3>
                    <p className="text-white/80 text-sm">
                      An existing profile was found for this phone number.
                      Review the details below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Beneficiary Details Section - Enhanced */}
              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                  <FaUser className="mr-2 text-blue-500" size={14} />
                  Beneficiary Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Personal Details Column */}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FaUser className="text-blue-600" size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Full Name
                        </p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {foundBeneficiary.name || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <FaEnvelope className="text-purple-600" size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Email Address
                        </p>
                        <p className="font-semibold text-gray-900 break-all mt-1">
                          {foundBeneficiary.email || "Not provided"}
                        </p>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <FaPhone className="text-green-600" size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Phone Number
                        </p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {foundBeneficiary.phone_number || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Beneficiary Type */}
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <FaUserFriends className="text-orange-600" size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Beneficiary Type
                        </p>
                        <p className="font-semibold text-gray-900 capitalize mt-1">
                          {foundBeneficiary.beneftype || "Individual"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details Column */}
                  <div className="space-y-4">
                    {/* Country */}
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <FaGlobe className="text-indigo-600" size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Country
                        </p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {foundBeneficiary.country_id
                            ? countries.find(
                                (c) =>
                                  c.id ===
                                  parseInt(foundBeneficiary.country_id),
                              )?.name || "N/A"
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Default Currency */}
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <FaMoneyBillWave
                          className="text-yellow-600"
                          size={14}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Default Currency
                        </p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {foundBeneficiary.currency || "USD"}
                        </p>
                      </div>
                    </div>

                    {/* Relationship (if individual) */}
                    {foundBeneficiary.relationtobenef && (
                      <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                          <FaRegHandshake className="text-pink-600" size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                            Relationship
                          </p>
                          <p className="font-semibold text-gray-900 capitalize mt-1">
                            {foundBeneficiary.relationtobenef}
                            {foundBeneficiary.otherRelationship &&
                              ` (${foundBeneficiary.otherRelationship})`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Registration Date */}
                    {foundBeneficiary.created_at && (
                      <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                          <FaCalendarAlt className="text-teal-600" size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                            Registered On
                          </p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {new Date(
                              foundBeneficiary.created_at,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Section (if available) */}
                {foundBeneficiary.street && (
                  <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                        <FaMapMarkerAlt className="text-blue-600" size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Address
                        </p>
                        <p className="text-gray-700 mt-1">
                          {foundBeneficiary.street}
                          {foundBeneficiary.city &&
                            `, ${foundBeneficiary.city}`}
                          {foundBeneficiary.state &&
                            `, ${foundBeneficiary.state}`}
                          {foundBeneficiary.postalcode &&
                            ` ${foundBeneficiary.postalcode}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Accounts Section */}
                {foundBeneficiary.banks &&
                  foundBeneficiary.banks.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                        <FaUniversity
                          className="mr-2 text-blue-500"
                          size={14}
                        />
                        Bank Accounts ({foundBeneficiary.banks.length})
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {foundBeneficiary.banks.slice(0, 5).map((bank, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <FaUniversity
                                className="text-gray-600"
                                size={14}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <p className="font-medium text-gray-800">
                                  {bank.bank_name || "Bank Account"}
                                </p>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  {bank.rails || "Local"}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Currency:</span>{" "}
                                {bank.currency_code ||
                                  foundBeneficiary.currency ||
                                  "USD"}
                              </div>
                              {bank.bank_acc_no && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Account: ****{bank.bank_acc_no.slice(-4)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {foundBeneficiary.banks.length > 5 && (
                          <p className="text-xs text-blue-600 text-center mt-2">
                            +{foundBeneficiary.banks.length - 5} more account(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                {/* Note about pre-filled fields */}
                <div className="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-2">
                    <FaInfoCircle
                      className="text-amber-600 mt-0.5 flex-shrink-0"
                      size={14}
                    />
                    <p className="text-xs text-amber-700">
                      This beneficiary already exists in the system. You can
                      review their information above. If you want to create a
                      new beneficiary with different details, click "Create New
                      Beneficiary" below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Only "Create New Beneficiary" */}
              <div className="border-t border-gray-200 p-6 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateNewBeneficiary}
                    className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                  >
                    <FaUserPlus size={18} />
                    Create New Beneficiary
                  </motion.button>
                  {/* ✅ Add this button for starting a fresh search */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Clear all search state
                      setPhoneInput("");
                      setCountryCodeInput("+1");
                      setShowSearchResults(false);
                      setFoundBeneficiary(null);
                      setUsingExistingBeneficiary(false);
                      dispatch(clearPhoneSearch());
                      if (isProcessingPhoneSearch.current) {
                        isProcessingPhoneSearch.current = false;
                      }
                      // Reset the country code in formik
                      formik.setFieldValue("country_phone_code", "+1");
                      toast.info("Ready to search for a different beneficiary");
                    }}
                    className="flex-1 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <FaSearch size={18} />
                    Search Different Number
                  </motion.button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Create a new beneficiary with different details. The existing
                  beneficiary information shown above is for reference only.
                </p>
              </div>
            </motion.div>
          )}

          {/* No Beneficiary Found State */}
          {!foundBeneficiary &&
            showSearchResults &&
            !phoneSearchLoading &&
            phoneInput && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="relative overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200"
              >
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <FaCheckCircle className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Ready to Create
                      </h3>
                      <p className="text-white/80 text-sm">
                        This phone number is available for a new beneficiary
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-6">
                    <FaPhone className="text-emerald-600" size={24} />
                    <div>
                      <p className="text-sm text-gray-600">
                        No existing records found for
                      </p>
                      <p className="font-bold text-gray-900 text-lg">
                        {phoneInput}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateNewBeneficiary}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 transition-all"
                  >
                    <FaPlus size={18} />
                    Create New Beneficiary
                  </motion.button>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          className="flex flex-col md:flex-row gap-4 pt-8 border-t border-gray-200"
          variants={fadeInUp}
        >
          <motion.button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex-1 flex items-center justify-center font-medium"
            whileHover={{ x: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaArrowLeft className="mr-2" />
            Cancel
          </motion.button>
          <motion.button
            type="button"
            onClick={nextStep}
            disabled={phoneSearchLoading || !phoneInput.trim()}
            className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 font-medium ${
              phoneSearchLoading || !phoneInput.trim()
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
            }`}
            whileHover={
              !phoneSearchLoading && phoneInput.trim()
                ? { x: 5, scale: 1.02 }
                : {}
            }
            whileTap={
              !phoneSearchLoading && phoneInput.trim() ? { scale: 0.98 } : {}
            }
          >
            {phoneSearchLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <FaSpinner />
                </motion.div>
                Searching...
              </>
            ) : (
              <>
                Continue
                <FaChevronRight className="ml-2" />
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  const renderBeneficiaryDetailsStep = () => {
    return (
      <motion.div
        className="space-y-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div
          className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-200 shadow-xl overflow-hidden relative"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full opacity-10"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
            style={{ top: -100, right: -100 }}
          />
          <div className="relative z-10 flex items-center">
            <motion.div
              className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white mr-5 shadow-lg"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <FaUser size={28} />
            </motion.div>
            <div>
              <motion.h2
                className="text-2xl font-bold text-gray-800"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Beneficiary Details
              </motion.h2>
              <motion.p
                className="text-gray-600"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Please provide the personal information of the beneficiary
              </motion.p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FieldLabel required>Beneficiary Type</FieldLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  type: "individual",
                  title: "Individual",
                  desc: "Personal beneficiary",
                  icon: FaRegUser,
                },
                {
                  type: "institution",
                  title: "Institution",
                  desc: "Company or organization",
                  icon: FaRegBuilding,
                },
              ].map((item) => (
                <motion.div
                  key={item.type}
                  className={`p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                    formik.values.beneftype === item.type
                      ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                  } ${usingExistingBeneficiary ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => {
                    if (!usingExistingBeneficiary) {
                      formik.setFieldValue("beneftype", item.type);
                    }
                  }}
                  whileHover={
                    !usingExistingBeneficiary ? { scale: 1.02, y: -2 } : {}
                  }
                  whileTap={!usingExistingBeneficiary ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                        formik.values.beneftype === item.type
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {formik.values.beneftype === item.type && (
                        <motion.div
                          className="w-2 h-2 rounded-full bg-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 flex items-center">
                        <item.icon className="mr-2 text-blue-500" size={18} />
                        {item.title}
                        {usingExistingBeneficiary && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Pre-filled)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{item.desc}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {usingExistingBeneficiary && (
              <motion.p
                className="text-sm text-yellow-600 mt-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FaInfoCircle className="inline mr-1" />
                Using existing beneficiary information. Fields are pre-filled
                and cannot be edited.
              </motion.p>
            )}
          </div>

          <div className="md:col-span-2">
            <AnimatedSelect
              label="Beneficiary Currency"
              info="Select the currency for transfers"
              icon={FaMoneyBillWave}
              options={localCurrencies.map((cur) => ({
                value: cur,
                label: cur,
              }))}
              value={localCurrencies
                .map((cur) => ({ value: cur, label: cur }))
                .find((option) => option.value === currency)}
              onChange={handleCurrencyChange}
              disabled={usingExistingBeneficiary}
            />
          </div>

          {formik.values.beneftype === "individual" ? (
            <>
              <div>
                <FloatingLabelInput
                  label="First Name"
                  required
                  value={formik.values.first_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  name="first_name"
                  disabled={usingExistingBeneficiary}
                  icon={FaUser}
                />
              </div>
              <div>
                <FloatingLabelInput
                  label="Last Name"
                  required
                  value={formik.values.last_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  name="last_name"
                  disabled={usingExistingBeneficiary}
                  icon={FaUser}
                />
              </div>
              <div>
                <FloatingLabelInput
                  label="Middle Name"
                  value={formik.values.middle_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  name="middle_name"
                  disabled={usingExistingBeneficiary}
                  icon={FaUser}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <FloatingLabelInput
                label="Institution Name"
                required
                value={formik.values.institution_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="institution_name"
                disabled={usingExistingBeneficiary}
                icon={FaBuilding}
              />
            </div>
          )}

          <div>
            <FloatingLabelInput
              label="Email Address"
              required
              info="For notifications and receipts"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="email"
              type="email"
              disabled={usingExistingBeneficiary}
              icon={FaEnvelope}
            />
          </div>

          <div>
            <FloatingLabelInput
              label="Phone Number"
              required
              value={formik.values.phone_number}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="phone_number"
              type="tel"
              disabled={usingExistingBeneficiary}
              icon={FaPhone}
            />
          </div>

          <div>
            <AnimatedSelect
              label="Country"
              required
              icon={FaGlobe}
              options={countriesOptions}
              value={(() => {
                if (formik.values.country_id) {
                  const selectedById = countriesOptions.find(
                    (option) =>
                      option.value === parseInt(formik.values.country_id),
                  );
                  if (selectedById) return selectedById;
                }
                return null;
              })()}
              onChange={(selectedOption) => {
                if (!usingExistingBeneficiary) {
                  const countryId = selectedOption?.value;
                  formik.setFieldValue("country_id", countryId?.toString());
                }
              }}
              formatOptionLabel={(option) => (
                <div className="flex items-center">
                  {option.flag_url && (
                    <img
                      src={option.flag_url}
                      alt={`${option.label} flag`}
                      className="w-6 h-4 mr-2 rounded-sm object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <span>{option.label}</span>
                </div>
              )}
              disabled={usingExistingBeneficiary}
            />
          </div>

          <div>
            <AnimatedSelect
              label="Nationality"
              icon={FaFlag}
              options={nationalities.map((nat) => ({
                value: nat.id.toString(),
                label: nat.name,
              }))}
              value={nationalities
                .map((nat) => ({
                  value: nat.id.toString(),
                  label: nat.name,
                }))
                .find(
                  (option) => option.value === formik.values.nationality_id,
                )}
              onChange={(selectedOption) => {
                if (!usingExistingBeneficiary) {
                  formik.setFieldValue("nationality_id", selectedOption?.value);
                }
              }}
              disabled={usingExistingBeneficiary}
            />
          </div>

          <div>
            <FloatingLabelInput
              label="City"
              required
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="city"
              disabled={usingExistingBeneficiary}
              icon={FaMapMarkerAlt}
            />
          </div>

          <div>
            <FloatingLabelInput
              label="Street Address"
              required
              value={formik.values.street}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="street"
              disabled={usingExistingBeneficiary}
              icon={FaMapMarkerAlt}
            />
          </div>

          <div>
            <FloatingLabelInput
              label="Postal Code"
              value={formik.values.postalcode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="postalcode"
              disabled={usingExistingBeneficiary}
              icon={FaMapMarkerAlt}
            />
          </div>

          <div>
            <FloatingLabelInput
              label="State/Province"
              value={formik.values.state}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="state"
              disabled={usingExistingBeneficiary}
              icon={FaMapMarkerAlt}
            />
          </div>

          {formik.values.beneftype === "individual" && (
            <div>
              <AnimatedSelect
                label="Relationship to Beneficiary"
                required
                icon={FaRegHandshake}
                options={relationshipOptions}
                value={relationshipOptions.find(
                  (option) => option.value === formik.values.relationtobenef,
                )}
                onChange={(selectedOption) => {
                  if (!usingExistingBeneficiary) {
                    const value = selectedOption?.value;
                    formik.setFieldValue("relationtobenef", value);
                    setShowOtherRelationship(value === "other");
                    if (value !== "other") {
                      formik.setFieldValue("otherRelationship", "");
                    }
                  }
                }}
                disabled={usingExistingBeneficiary}
              />
              {showOtherRelationship && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3"
                >
                  <FloatingLabelInput
                    label="Please specify relationship"
                    required
                    value={formik.values.otherRelationship}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    name="otherRelationship"
                    disabled={usingExistingBeneficiary}
                  />
                </motion.div>
              )}
            </div>
          )}

          {(currency === "BDT" || currency === "INR" || currency === "PKR") && (
            <>
              <div>
                <AnimatedSelect
                  label="ID Type"
                  required
                  icon={FaIdCard}
                  options={getIdTypesForCurrency.map((type) => ({
                    value:
                      type.id?.toString() || type.value?.toString() || type,
                    label: type.name || type.label || type,
                  }))}
                  value={getIdTypesForCurrency
                    .map((type) => ({
                      value:
                        type.id?.toString() || type.value?.toString() || type,
                      label: type.name || type.label || type,
                    }))
                    .find(
                      (option) =>
                        option.value === formik.values.beneficiary_id_type,
                    )}
                  onChange={(selectedOption) => {
                    if (!usingExistingBeneficiary) {
                      formik.setFieldValue(
                        "beneficiary_id_type",
                        selectedOption?.value,
                      );
                    }
                  }}
                  disabled={usingExistingBeneficiary}
                />
              </div>
              <div>
                <FloatingLabelInput
                  label="ID Number"
                  required
                  value={formik.values.beneficiary_id_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  name="beneficiary_id_number"
                  disabled={usingExistingBeneficiary}
                  icon={FaIdCard}
                />
              </div>
            </>
          )}
        </div>

        <motion.div
          className="flex flex-col-reverse md:flex-row justify-between pt-8 gap-4 border-t border-gray-200"
          variants={fadeInUp}
        >
          <motion.button
            onClick={prevStep}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex-1 md:flex-none flex items-center justify-center font-medium"
            whileHover={{ x: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaChevronLeft className="mr-2" />
            Back
          </motion.button>
          <motion.button
            type="button"
            onClick={nextStep}
            disabled={isLoadingLocal || !isFormValid()}
            className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 md:flex-none font-medium ${
              isLoadingLocal || !isFormValid()
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
            }`}
            whileHover={
              !isLoadingLocal && isFormValid() ? { x: 5, scale: 1.02 } : {}
            }
            whileTap={!isLoadingLocal && isFormValid() ? { scale: 0.98 } : {}}
          >
            {isLoadingLocal ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                <FaSpinner />
              </motion.div>
            ) : (
              <>
                Next Step
                <FaChevronRight className="ml-2" />
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    );
  };

  const renderBankInfoStep = () => {
    return (
      <motion.div
        className="space-y-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div
          className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-200 shadow-xl overflow-hidden relative"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full opacity-10"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
            style={{ top: -100, right: -100 }}
          />
          <div className="relative z-10 flex items-center">
            <motion.div
              className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white mr-5 shadow-lg"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <FaUniversity size={28} />
            </motion.div>
            <div>
              <motion.h2
                className="text-2xl font-bold text-gray-800"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Beneficiary Bank Details
              </motion.h2>
              <motion.p
                className="text-gray-600"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Please provide the bank account information for your
                beneficiary.
                {bankAccounts.length > 0 &&
                  ` You have ${bankAccounts.length} bank account${
                    bankAccounts.length > 1 ? "s" : ""
                  }.`}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence>
            {bankAccounts.map((account, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {renderBankAccountFields(index)}
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={addBankAccount}
            disabled={usingExistingBeneficiary}
            className={`w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center ${
              usingExistingBeneficiary
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg"
            }`}
            whileHover={!usingExistingBeneficiary ? { scale: 1.02, y: -2 } : {}}
            whileTap={!usingExistingBeneficiary ? { scale: 0.98 } : {}}
          >
            <div
              className={`flex items-center ${
                usingExistingBeneficiary ? "text-gray-400" : "text-blue-600"
              }`}
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <FaPlus className="mr-3" size={20} />
              </motion.div>
              <span className="font-medium">Add Another Bank Account</span>
            </div>
            <p
              className={`text-sm mt-2 ${
                usingExistingBeneficiary ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {usingExistingBeneficiary
                ? "Cannot add accounts to existing beneficiary"
                : "Add multiple accounts for different currencies or payment methods"}
            </p>
          </motion.button>

          <motion.div
            className="flex flex-col md:flex-row gap-4 pt-8 border-t border-gray-200"
            variants={fadeInUp}
          >
            <motion.button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex-1 flex items-center justify-center font-medium"
              whileHover={{ x: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaChevronLeft className="mr-2" />
              Back to Details
            </motion.button>
            <motion.button
              type="submit"
              disabled={isLoadingLocal}
              className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 font-medium ${
                isLoadingLocal
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
              }`}
              whileHover={!isLoadingLocal ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isLoadingLocal ? { scale: 0.98 } : {}}
            >
              {isLoadingLocal ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="mr-2"
                  >
                    <FaSpinner />
                  </motion.div>
                  Processing...
                </>
              ) : mode === "create" ? (
                <>
                  <FaCheckCircle className="mr-2" />
                  Create Beneficiary
                </>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  Update Beneficiary
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    );
  };

  const renderBankAccountFields = (index) => {
    const account = bankAccounts[index];
    const accountCurrency = account.currency || currency;

    const getRailsOptions = (accountCurrency) => {
      const options = [{ value: "Swift", label: "Swift" }];

      if (accountCurrency === "GBP") {
        options.unshift({ value: "Local", label: "FPS" });
      } else if (accountCurrency === "EUR") {
        options.unshift({ value: "Local", label: "SEPA" });
      } else if (accountCurrency === "USD") {
        options.unshift({ value: "Local", label: "ACH" });
      } else {
        options.unshift({ value: "Local", label: "Bank" });
      }

      options.push({ value: "Mobile", label: "Mobile" });
      return options;
    };

    return (
      <motion.div
        className="p-6 border border-gray-200 rounded-2xl bg-white mb-6 shadow-md hover:shadow-xl transition-all duration-300"
        whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <motion.div
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white mr-3"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <FaUniversity size={18} />
            </motion.div>
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
            <motion.button
              type="button"
              onClick={() => removeBankAccount(index)}
              className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200 p-2 hover:bg-red-50 rounded-lg"
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaTrash className="mr-2" size={14} />
              Remove
            </motion.button>
          )}
          {index > 0 && usingExistingBeneficiary && (
            <span className="text-sm text-gray-500 italic">
              Cannot remove existing account
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-4">
            <AnimatedSelect
              label="Select Rails"
              required
              icon={FaUniversity}
              options={getRailsOptions(accountCurrency)}
              value={
                account.rails
                  ? getRailsOptions(accountCurrency).find(
                      (option) => option.value === account.rails,
                    ) || getRailsOptions(accountCurrency)[0]
                  : getRailsOptions(accountCurrency)[0]
              }
              onChange={(selectedOption) =>
                handleBankAccountChange(index, "rails", selectedOption?.value)
              }
              disabled={
                usingExistingBeneficiary ||
                (mode === "edit" && !usingExistingBeneficiary && account.rails)
              }
            />
            {account.rails && (
              <motion.div
                className="flex items-center mt-2 text-green-600 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FaCheckCircle className="mr-1" size={12} />
                <span>Rails selected: {account.rails}</span>
              </motion.div>
            )}
          </div>

          {account.rails !== "Mobile" && (
            <div className="mb-4">
              <AnimatedSelect
                label="Select Currency"
                required
                icon={FaMoneyBillWave}
                options={localCurrencies.map((cur) => ({
                  value: cur,
                  label: cur,
                }))}
                value={localCurrencies
                  .map((cur) => ({ value: cur, label: cur }))
                  .find((option) => option.value === currency)}
                onChange={(selectedOption) => {
                  if (selectedOption?.value) {
                    handleCurrencyChange(selectedOption);
                  }
                }}
                disabled={usingExistingBeneficiary}
              />
            </div>
          )}
        </div>

        {account.rails === "Swift" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="mb-4">
              <FloatingLabelInput
                label="IBAN Number"
                required
                value={account.iban}
                onChange={(e) =>
                  handleBankAccountChange(index, "iban", e.target.value)
                }
                disabled={usingExistingBeneficiary}
                icon={FaIdCard}
              />
            </div>
            <div className="mb-4">
              <FloatingLabelInput
                label="SWIFT Code"
                required
                value={account.swift}
                onChange={(e) =>
                  handleBankAccountChange(index, "swift", e.target.value)
                }
                disabled={usingExistingBeneficiary}
                icon={FaUniversity}
              />
            </div>
          </div>
        )}

        {account.rails === "Local" && accountCurrency === "USD" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="mb-4">
              <FloatingLabelInput
                label="Routing Number"
                required
                value={account.routingNumber}
                onChange={(e) =>
                  handleBankAccountChange(
                    index,
                    "routingNumber",
                    e.target.value,
                  )
                }
                disabled={usingExistingBeneficiary}
                icon={FaUniversity}
              />
            </div>
            <div className="mb-4">
              <FloatingLabelInput
                label="Account Number"
                required
                value={account.accountNumber}
                onChange={(e) =>
                  handleBankAccountChange(
                    index,
                    "accountNumber",
                    e.target.value,
                  )
                }
                disabled={usingExistingBeneficiary}
                icon={FaIdCard}
              />
            </div>
          </div>
        )}

        {account.rails === "Local" && accountCurrency === "GBP" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="mb-4">
              <FloatingLabelInput
                label="Sort Code"
                required
                value={account.sortCode}
                onChange={(e) =>
                  handleBankAccountChange(index, "sortCode", e.target.value)
                }
                disabled={usingExistingBeneficiary}
                icon={FaUniversity}
              />
            </div>
            <div className="mb-4">
              <FloatingLabelInput
                label="Account Number"
                required
                value={account.accountNumber}
                onChange={(e) =>
                  handleBankAccountChange(
                    index,
                    "accountNumber",
                    e.target.value,
                  )
                }
                disabled={usingExistingBeneficiary}
                icon={FaIdCard}
              />
            </div>
          </div>
        )}

        {account.rails === "Mobile" && (
          <div className="grid grid-cols-1 gap-6 mt-4">
            <div className="mb-4">
              <FloatingLabelInput
                label="Mobile Number"
                required
                value={account.mobileNumber}
                onChange={(e) =>
                  handleBankAccountChange(index, "mobileNumber", e.target.value)
                }
                disabled={usingExistingBeneficiary}
                icon={FaPhone}
              />
            </div>
            <div className="mb-4">
              <FloatingLabelInput
                label="Wallet Provider"
                required
                value={account.walletProvider}
                onChange={(e) =>
                  handleBankAccountChange(
                    index,
                    "walletProvider",
                    e.target.value,
                  )
                }
                disabled={usingExistingBeneficiary}
                icon={FaBuilding}
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // ========== MAIN RENDER ==========
  return (
    <motion.div
      className={STYLES.container}
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
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
        toastClassName="rounded-xl shadow-lg"
      />

      <AnimatePresence>
        {showSuccessPopup && (
          <SuccessPopup
            benefCode={benefCode}
            onClose={() => setShowSuccessPopup(false)}
            onCopy={handleCopyBenefCode}
            onContinue={handleContinueFromSuccess}
          />
        )}
      </AnimatePresence>

      {/* Enhanced Stepper Header */}
      {steps.length > 1 && (
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ProgressIndicator step={step} totalSteps={steps.length} />

          <div className="flex items-start justify-between relative">
            {steps.map((stepItem, index) => {
              const isActive = step === stepItem.number;
              const isCompleted = step > stepItem.number;

              return (
                <motion.div
                  key={stepItem.number}
                  className="flex flex-col items-center relative z-10 w-32"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div
                    className="relative mb-3"
                    whileHover={{ scale: 1.1 }}
                  >
                    {(isActive || isCompleted) && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-30"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    <motion.div
                      className={`relative flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300 transform ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white scale-110 border-transparent shadow-xl"
                          : isCompleted
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-transparent shadow-md"
                            : "bg-white text-gray-400 border-gray-300"
                      }`}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{
                        duration: 0.5,
                        repeat: isActive ? Infinity : 0,
                      }}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <FaCheckCircle className="w-6 h-6" />
                        </motion.div>
                      ) : (
                        <div className="flex items-center">
                          {stepItem.icon}
                          <span className="ml-1 font-bold text-sm">
                            {stepItem.number + 1}
                          </span>
                        </div>
                      )}
                    </motion.div>

                    {isActive && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                      </motion.div>
                    )}
                  </motion.div>

                  <div className="text-center">
                    <motion.div
                      className={`text-sm font-semibold transition-colors duration-300 ${
                        isActive
                          ? "text-gray-900"
                          : isCompleted
                            ? "text-green-600"
                            : "text-gray-500"
                      }`}
                    >
                      {stepItem.title}
                    </motion.div>
                    <motion.div
                      className={`text-xs mt-1 transition-colors duration-300 ${
                        isActive
                          ? "text-gray-700"
                          : isCompleted
                            ? "text-green-500"
                            : "text-gray-400"
                      }`}
                    >
                      {stepItem.description}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100 shadow-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center">
              <motion.div
                className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                {steps.find((s) => s.number === step)?.icon || (
                  <FaUser className="text-white text-sm" />
                )}
              </motion.div>
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
          </motion.div>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {step === 0 && renderPhoneSearchStep()}
            {step === 1 && renderBeneficiaryDetailsStep()}
            {step === 2 && renderBankInfoStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes glow {
          0%,
          100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
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

// Custom styles for react-select
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
    "&:hover": { borderColor: "#9ca3af" },
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

export default BaseBeneficiaryForm;
