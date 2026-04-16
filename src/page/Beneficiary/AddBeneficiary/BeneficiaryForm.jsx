import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  FaSync,
  FaUserPlus,
  FaUserFriends, // ← ADD THIS - missing import
} from "react-icons/fa";

import { motion, AnimatePresence } from "framer-motion";

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
} from "../MyBeneficiaries/BeneficiariesSlice";

import {
  selectCountriesOptionsSafe,
  selectCountries,
  selectPhoneCodeOptions,
  fetchCountries,
} from "../../../features/Auth/slices/countrySlice";

import PropTypes from "prop-types";

// ========== ANIMATION VARIANTS ==========
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const stepVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
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
    x: 30,
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

// ========== ANIMATED COMPONENTS ==========
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
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
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
          className={`w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md ${
            Icon ? "pl-10" : ""
          } ${disabled ? "bg-gray-100 cursor-not-allowed opacity-70" : ""} ${
            error ? "border-red-500 focus:ring-red-500" : ""
          }`}
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

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "white",
      border: isFocused
        ? "2px solid #3b82f6"
        : state.isFocused
          ? "2px solid #3b82f6"
          : "1px solid #d1d5db",
      borderRadius: "0.75rem",
      padding: "8px 12px",
      paddingLeft: Icon ? "36px" : "12px",
      fontSize: "0.875rem",
      color: "#111827",
      boxShadow: isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
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

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
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
          styles={customStyles}
          isDisabled={disabled}
        />
      </motion.div>
    </div>
  );
};

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

const AlertBox = ({ message = "Please log in to continue!", onClose }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      role="dialog"
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
        <h2 className="text-2xl font-extrabold mb-4 tracking-wide">
          Action Required!
        </h2>
        <p className="text-sm md:text-base mb-6">{message}</p>
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

// ========== MAIN COMPONENT ==========
const BeneficiaryForm = ({ mode = "create", initialData = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const params = useParams();
  const isMounted = useRef(true);
  const isProcessingPhoneSearch = useRef(false);

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
  }));

  const beneficiaries = useSelector(selectBeneficiaries);
  const phoneSearch = useSelector(selectPhoneSearch);
  const phoneSearchLoading = useSelector(selectPhoneSearchLoading);
  const phoneExists = useSelector(selectPhoneExists);
  const phoneSearchData = useSelector(selectPhoneSearchData);
  const beneficiariesCreateLoading = useSelector(
    selectBeneficiariesCreateLoading,
  );
  const beneficiariesCreateError = useSelector(selectBeneficiariesCreateError);
  const beneficiariesCreateSuccess = useSelector(
    selectBeneficiariesCreateSuccess,
  );
  const countriesOptions = useSelector(selectCountriesOptionsSafe);
  const countries = useSelector(selectCountries);
  const phoneCodeOptions = useSelector(selectPhoneCodeOptions);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(mode === "create" ? 0 : 1);
  const [beneficiariesLoaded, setBeneficiariesLoaded] = useState(false);
  const [usingExistingBeneficiary, setUsingExistingBeneficiary] =
    useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [countryCodeInput, setCountryCodeInput] = useState("+1");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [foundBeneficiary, setFoundBeneficiary] = useState(null);
  const [currency, setCurrency] = useState(
    mode === "edit" && initialData?.banks?.[0]?.currency_code
      ? initialData.banks[0].currency_code
      : "USD",
  );
  const [paymentMethod, setPaymentMethod] = useState("ACH");
  const [loading, setLoading] = useState(false);
  const [showOtherRelationship, setShowOtherRelationship] = useState(false);
  const [branchCode, setBranchCode] = useState("");
  const [fieldTouched, setFieldTouched] = useState({});
  const [selectedCountryCode, setSelectedCountryCode] = useState("");

  // Steps configuration
  const steps =
    mode === "create"
      ? [
          {
            number: 0,
            title: "Search",
            icon: <FaSearch className="text-sm" />,
            description: "Find existing beneficiary",
            gradient: "from-indigo-500 to-indigo-600",
          },
          {
            number: 1,
            title: "Details",
            icon: <FaUser className="text-sm" />,
            description: "Personal information",
            gradient: "from-blue-500 to-blue-600",
          },
          {
            number: 2,
            title: "Bank",
            icon: <FaUniversity className="text-sm" />,
            description: "Account details",
            gradient: "from-purple-500 to-purple-600",
          },
        ]
      : [
          {
            number: 1,
            title: "Details",
            icon: <FaUser className="text-sm" />,
            description: "Personal information",
            gradient: "from-blue-500 to-blue-600",
          },
          {
            number: 2,
            title: "Bank",
            icon: <FaUniversity className="text-sm" />,
            description: "Account details",
            gradient: "from-purple-500 to-purple-600",
          },
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

  const localCurrencies = [
    "AED",
    "AUD",
    "BDT",
    "CAD",
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

  const currencyOptions = useMemo(
    () =>
      localCurrencies.map((cur) => ({
        value: cur,
        label: cur,
      })),
    [],
  );

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
    onSubmit: () => {},
    enableReinitialize: mode === "edit",
  });

  // Cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
      dispatch(resetCreateState());
      dispatch(clearUpdateState());
      dispatch(clearPhoneSearch());
      dispatch(clearBeneficiariesCreateState());
      isProcessingPhoneSearch.current = false;
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

  useEffect(() => {
    if (
      step === 0 &&
      mode === "create" &&
      customerId &&
      isMounted.current &&
      !phoneSearchLoading
    ) {
      console.log("🔄 Refreshing beneficiaries list on search step...");
      dispatch(fetchBeneficiaries(customerId));
    }
  }, [step, mode, customerId, dispatch, phoneSearchLoading]);

  // Fetch beneficiary data for edit mode
  useEffect(() => {
    if (mode === "edit" && beneficiaryId && !initialData && isMounted.current) {
      console.log("🔍 Fetching beneficiary data for edit:", beneficiaryId);
      dispatch(fetchBeneficiaryById(beneficiaryId));
    }
  }, [mode, beneficiaryId, initialData, dispatch]);

  // Populate form when beneficiary data is loaded
  useEffect(() => {
    const dataToUse = initialData || beneficiaryDetails;
    if (mode === "edit" && dataToUse && isMounted.current) {
      console.log("📝 Populating form with beneficiary data:", dataToUse);
      console.log(
        "🏦 Beneficiary banks:",
        dataToUse.benef_banks || dataToUse.banks || [],
      );

      let countryPhoneCode = dataToUse.country_phone_code;
      if (!countryPhoneCode && dataToUse.country_id && countries.length > 0) {
        const foundCountry = countries.find(
          (c) => c.id === parseInt(dataToUse.country_id),
        );
        if (foundCountry && foundCountry.phone_code) {
          countryPhoneCode = foundCountry.phone_code.startsWith("+")
            ? foundCountry.phone_code
            : `+${foundCountry.phone_code}`;
        }
      }
      if (!countryPhoneCode) countryPhoneCode = "+1";
      if (!countryPhoneCode.startsWith("+") && countryPhoneCode)
        countryPhoneCode = `+${countryPhoneCode}`;

      let phoneNumber = dataToUse.phone_number || "";
      phoneNumber = phoneNumber.replace(/\s/g, "");

      let beneficiaryCurrency = "USD";
      const banks = dataToUse.benef_banks || dataToUse.banks || [];
      if (banks.length > 0 && banks[0].currency_code) {
        beneficiaryCurrency = banks[0].currency_code;
      }

      formik.setValues({
        name: dataToUse.name || "",
        country_id: dataToUse.country_id?.toString() || "",
        country_phone_code: countryPhoneCode,
        phone_number: phoneNumber,
        email: dataToUse.email || "",
        beneftype: dataToUse.beneftype || "individual",
        state: dataToUse.state || "",
        city: dataToUse.city || "",
        street: dataToUse.street || "",
        postalcode: dataToUse.postalcode || "",
        relationtobenef: dataToUse.relationtobenef || "",
        otherRelationship: dataToUse.otherRelationship || "",
        nationality_id: dataToUse.nationality_id?.toString() || "",
        status: dataToUse.status?.toString() || "1",
        nic_bcc_code: dataToUse.nic_bcc_code || "",
        beneficiary_id_type: dataToUse.beneficiary_id_type || "",
        beneficiary_id_number: dataToUse.beneficiary_id_number || "",
      });

      setCountryCodeInput(countryPhoneCode);
      setSelectedCountryCode(countryPhoneCode);
      setCurrency(beneficiaryCurrency);

      if (banks.length > 0) {
        setBankAccounts(
          banks.map((bank) => ({
            rails: bank.rails || "Local",
            currency: bank.currency_code || beneficiaryCurrency,
            iban: bank.benef_iban || "",
            swift: bank.swift || bank.swift_code || "",
            intermediarySwift: bank.intermediary_bank_swift || "",
            routingNumber: bank.routing_number || "",
            accountNumber: bank.bank_acc_no || "",
            bankName: bank.bank_name || "",
            ifsc: bank.ifsc || "",
            bankCode: bank.bank_code || bank.bankCode || "",
            paymentMethod: bank.payment_method || paymentMethod,
            bankState: bank.bank_state || "",
            branchCode: bank.branch_code || bank.branchCode || "",
            accountName: bank.nameInBankAc || bank.account_name || "",
            accountTitle: bank.account_title || "",
            walletProvider: bank.wallet_provider || "",
            mobileNumber: bank.mobile_number || "",
            otherProvider: bank.other_provider || "",
            accountType: bank.account_type || "",
            sortCode: bank.sort_code || "",
          })),
        );
      }

      if (dataToUse.relationtobenef === "other") setShowOtherRelationship(true);
    }
  }, [
    beneficiaryDetails,
    initialData,
    mode,
    formik.setValues,
    countries,
    paymentMethod,
  ]);

  // Fetch initial data
  useEffect(() => {
    if (step > 0 && isMounted.current) {
      dispatch(fetchNationalities());
      dispatch(fetchCountries());
      const bankType = ["BDT", "LKR", "AUD", "PKR"].includes(currency)
        ? "int-banks"
        : "currency-payout-banks";
      dispatch(fetchBanksByCurrency({ currency, bankType }));
      if (["BDT", "INR", "PKR"].includes(currency)) {
        dispatch(fetchIdTypesByCurrency(currency));
      }
    }
  }, [dispatch, currency, step]);

  // Fetch cities when country changes
  useEffect(() => {
    if (formik.values.country_id && step > 0 && isMounted.current) {
      dispatch(fetchCitiesByCountry(formik.values.country_id));
    }
  }, [formik.values.country_id, dispatch, step]);

  // Handle errors and success
  useEffect(() => {
    if (mode === "create" && beneficiariesCreateError && isMounted.current) {
      toast.error(beneficiariesCreateError);
      dispatch(clearBeneficiariesCreateState());
    } else if (mode === "edit" && updateError && isMounted.current) {
      toast.error(updateError);
      dispatch(clearUpdateState());
    }
  }, [updateError, beneficiariesCreateError, dispatch, mode]);

  // Handle phone search results
  useEffect(() => {
    // Only process when we have a completed search that hasn't been processed
    if (
      phoneSearch.searched &&
      !phoneSearch.processed && // ✅ Add this condition
      !isProcessingPhoneSearch.current
    ) {
      isProcessingPhoneSearch.current = true;

      // Handle case where beneficiary exists
      if (phoneSearch.exists && phoneSearch.data) {
        const beneficiaryData = phoneSearch.data;
        setFoundBeneficiary(beneficiaryData);
        setShowSearchResults(true);
        // Also update formik with the found phone number
        formik.setFieldValue("phone_number", phoneInput);
        formik.setFieldValue("country_phone_code", countryCodeInput);
        toast.success("Beneficiary found! Review the details below.");
      }
      // Handle case where NO beneficiary found
      else if (!phoneSearch.exists) {
        setFoundBeneficiary(null);
        setShowSearchResults(true);
        toast.info(
          "No existing beneficiary found with this phone number. You can create a new one.",
        );
      }

      // Mark as processed to prevent re-running
      setTimeout(() => {
        if (isMounted.current) {
          dispatch(setPhoneSearchProcessed());
          isProcessingPhoneSearch.current = false;
        }
      }, 100);
    }
  }, [
    phoneSearch.searched,
    phoneSearch.exists,
    phoneSearch.data,
    phoneSearch.processed, // ✅ Add this dependency
    phoneInput,
    countryCodeInput,
    formik,
    dispatch,
  ]);

  // Helper functions
  const getCitiesForCountry = useCallback(() => {
    return cities[formik.values.country_id] || [];
  }, [cities, formik.values.country_id]);

  const isFormValid = useCallback(() => {
    if (formik.values.beneftype === "") return false;
    if (
      formik.values.name === "" ||
      formik.values.country_id === "" ||
      formik.values.country_phone_code === "" ||
      formik.values.phone_number === "" ||
      formik.values.city === "" ||
      formik.values.street === ""
    )
      return false;
    if (
      formik.values.beneftype === "individual" &&
      formik.values.relationtobenef === ""
    )
      return false;
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

  const handleCurrencyChange = (selectedOption) => {
    const newCurrency = selectedOption?.value;
    if (!newCurrency || newCurrency === "") return;
    setCurrency(newCurrency);
    formik.setFieldValue("beneficiary_id_type", "");
    formik.setFieldValue("beneficiary_id_number", "");
    if (["BDT", "INR", "PKR"].includes(newCurrency)) {
      const currentBeneficiaryType = formik.values.beneftype || "individual";
      dispatch(
        fetchIdTypesByCurrency({
          currency: newCurrency,
          beneficiaryType: currentBeneficiaryType,
        }),
      );
    }
    const bankType = ["BDT", "LKR", "AUD", "PKR"].includes(newCurrency)
      ? "int-banks"
      : "currency-payout-banks";
    dispatch(fetchBanksByCurrency({ currency: newCurrency, bankType }));
    setBankAccounts((prevAccounts) =>
      prevAccounts.map((account) => ({
        ...account,
        currency: newCurrency,
        rails: account.rails || "Local",
      })),
    );
  };

  const handleCancel = () => navigate(-1);

  const resetSearchState = () => {
    setPhoneInput("");
    setCountryCodeInput("+1");
    setShowSearchResults(false);
    setFoundBeneficiary(null);
    setUsingExistingBeneficiary(false);
    dispatch(clearPhoneSearch());
    // Reset the phone search processed flag
    if (isProcessingPhoneSearch.current) {
      isProcessingPhoneSearch.current = false;
    }
    console.log("🧹 Search state cleared");
  };

  const mapNationalityToId = (nationalityName, nationalitiesList) => {
    if (!nationalityName) return "";
    const found = nationalitiesList.find(
      (nat) => nat.name.toLowerCase() === nationalityName.toLowerCase(),
    );
    return found ? found.id.toString() : "";
  };

  // Phone search handlers
  const handlePhoneSearch = () => {
    if (!phoneInput.trim()) {
      toast.error("Please enter a phone number to search");
      return;
    }

    const searchCountryCode =
      formik.values.country_phone_code || countryCodeInput;
    const searchCountryId = formik.values.country_id;
    const phoneRegex = /^[+]?[0-9\s\-\(\)\.]+$/;

    if (!phoneRegex.test(phoneInput)) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (isProcessingPhoneSearch.current) {
      toast.info("Search in progress, please wait...");
      return;
    }

    dispatch(clearPhoneSearch());
    setFoundBeneficiary(null);
    setShowSearchResults(false);
    setUsingExistingBeneficiary(false);

    if (isProcessingPhoneSearch.current) {
      isProcessingPhoneSearch.current = false;
    }

    formik.setFieldValue("phone_number", phoneInput);
    formik.setFieldValue("country_phone_code", searchCountryCode);
    if (searchCountryId) {
      formik.setFieldValue("country_id", searchCountryId);
    }
    setCountryCodeInput(searchCountryCode);
    setSelectedCountryCode(searchCountryCode);

    if (beneficiaries.length === 0) {
      setShowSearchResults(true);
      toast.info("No existing beneficiaries found. You can create a new one.");
      return;
    }

    try {
      dispatch(
        searchBeneficiaryByPhone({
          phoneNumber: phoneInput,
          countryPhoneCode: searchCountryCode,
          countryId: searchCountryId,
        }),
      );
      toast.info("Searching for beneficiary...");
    } catch (error) {
      if (isMounted.current) {
        toast.error(error.message || "Failed to search for beneficiary");
      }
    }
  };

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
        if (relationshipMap[lowerValue])
          relationshipValue = relationshipMap[lowerValue];
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
      if (foundBeneficiary.currency) setCurrency(foundBeneficiary.currency);
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
      if (relationshipValue === "other") setShowOtherRelationship(true);
      toast.success("Beneficiary details loaded successfully!");
    }
    setUsingExistingBeneficiary(true);
    setShowSearchResults(false);
    setStep(1);
  };

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

  const nextStep = () => {
    // ========== STEP 0: PHONE SEARCH STEP ==========
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

      const currentCountryCode =
        formik.values.country_phone_code || countryCodeInput;

      // Case 1: No beneficiaries exist in the system
      if (beneficiaries.length === 0) {
        formik.setFieldValue("phone_number", phoneInput);
        formik.setFieldValue("country_phone_code", currentCountryCode);
        setCountryCodeInput(currentCountryCode);
        setSelectedCountryCode(currentCountryCode);
        setFoundBeneficiary(null);
        setUsingExistingBeneficiary(false);
        setShowSearchResults(false);
        setStep(1);
        toast.info(
          "No existing beneficiaries found. You can create a new beneficiary.",
        );
        return true;
      }

      // Case 2: Search hasn't been performed yet - trigger search
      if (!phoneSearch.searched && !phoneSearchLoading) {
        handlePhoneSearch();
        return false; // Wait for search results
      }

      // Case 3: Search is in progress - wait
      if (phoneSearchLoading) {
        toast.info("Searching, please wait...");
        return false;
      }

      // Case 4: Search completed and beneficiary found
      if (phoneSearch.searched && phoneSearch.exists && phoneSearch.data) {
        setFoundBeneficiary(phoneSearch.data);
        setUsingExistingBeneficiary(true);
        setStep(1);
        return true;
      }

      // Case 5: Search completed and no beneficiary found
      if (phoneSearch.searched && !phoneSearch.exists) {
        formik.setFieldValue("phone_number", phoneInput);
        formik.setFieldValue("country_phone_code", currentCountryCode);
        setCountryCodeInput(currentCountryCode);
        setSelectedCountryCode(currentCountryCode);
        setFoundBeneficiary(null);
        setUsingExistingBeneficiary(false);
        setStep(1);
        return true;
      }

      // Case 6: Default fallback - just proceed
      formik.setFieldValue("phone_number", phoneInput);
      formik.setFieldValue("country_phone_code", currentCountryCode);
      setCountryCodeInput(currentCountryCode);
      setSelectedCountryCode(currentCountryCode);
      setStep(1);
      return true;
    }

    // ========== STEP 1: BENEFICIARY DETAILS STEP ==========
    if (step === 1) {
      // Currency-specific validations for BDT, INR, PKR
      if (currency === "BDT" || currency === "INR" || currency === "PKR") {
        const countryInput = formik.values.country_id;
        if (countryInput === "" || countryInput === " " || !countryInput) {
          toast.error(`Country is required for currency: ${currency}`);
          return false;
        }

        const streetInput = formik.values.street;
        if (streetInput === "" || streetInput === " " || !streetInput) {
          toast.error(`Street address is required for currency: ${currency}`);
          return false;
        }

        const idTypeInput = formik.values.beneficiary_id_type;
        if (idTypeInput === "" || idTypeInput === " " || !idTypeInput) {
          toast.error(`ID Type is required for currency: ${currency}`);
          return false;
        }

        const idNumber = formik.values.beneficiary_id_number;
        if (idNumber === "" || idNumber === " " || !idNumber) {
          toast.error(`ID Number is required for currency: ${currency}`);
          return false;
        }

        // INR specific city validation
        if (currency === "INR") {
          const cityInput = formik.values.city;
          if (cityInput === "" || cityInput === " " || !cityInput) {
            toast.error(`City is required for currency: ${currency}`);
            return false;
          }
        }
      }

      // Validate beneficiary type
      if (formik.values.beneftype === "") {
        toast.error("Please select a beneficiary type");
        return false;
      }

      // Validate name based on beneficiary type
      if (formik.values.beneftype === "individual") {
        if (!formik.values.name || formik.values.name.trim() === "") {
          toast.error("Please enter the beneficiary's full name");
          return false;
        }
      } else if (formik.values.beneftype === "institution") {
        if (!formik.values.name || formik.values.name.trim() === "") {
          toast.error("Please enter the institution name");
          return false;
        }
      }

      // Validate required fields
      const requiredFields = [
        { field: "country_id", message: "Please select a country" },
        {
          field: "country_phone_code",
          message: "Please select a country code",
        },
        { field: "phone_number", message: "Please enter a phone number" },
        { field: "city", message: "Please enter a city" },
        { field: "street", message: "Please enter a street address" },
      ];

      for (const required of requiredFields) {
        const value = formik.values[required.field];
        if (!value || value === "" || value === " ") {
          toast.error(required.message);
          return false;
        }
      }

      // Validate email format if provided
      if (formik.values.email && formik.values.email.trim() !== "") {
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(formik.values.email)) {
          toast.error("Please enter a valid email address");
          return false;
        }
      }

      // Validate phone number format
      const phoneRegex = /^[+]?[0-9\s\-\(\)\.]+$/;
      if (!phoneRegex.test(formik.values.phone_number)) {
        toast.error("Please enter a valid phone number");
        return false;
      }

      // Validate relationship for individual beneficiary
      if (formik.values.beneftype === "individual") {
        if (
          !formik.values.relationtobenef ||
          formik.values.relationtobenef === ""
        ) {
          toast.error("Please select relationship to beneficiary");
          return false;
        }

        // Validate other relationship if selected
        if (
          formik.values.relationtobenef === "other" &&
          (!formik.values.otherRelationship ||
            formik.values.otherRelationship.trim() === "")
        ) {
          toast.error("Please specify the relationship");
          return false;
        }
      }

      // Final validation using isFormValid
      if (!isFormValid()) {
        toast.error("Please fill all required fields before proceeding");
        return false;
      }
    }

    // ========== STEP 2: BANK INFORMATION STEP ==========
    if (step === 2) {
      // Validate at least one bank account exists
      if (!bankAccounts || bankAccounts.length === 0) {
        toast.error("At least one bank account is required");
        return false;
      }

      // Validate each bank account
      for (let i = 0; i < bankAccounts.length; i++) {
        const account = bankAccounts[i];

        // Check rails selection
        if (!account.rails || account.rails === "") {
          toast.error(`Bank account ${i + 1}: Please select a rails type`);
          return false;
        }

        // Validate based on rails type
        if (account.rails === "Swift") {
          if (!account.iban || account.iban.trim() === "") {
            toast.error(
              `Bank account ${i + 1}: IBAN number is required for Swift transfers`,
            );
            return false;
          }
          if (!account.swift || account.swift.trim() === "") {
            toast.error(
              `Bank account ${i + 1}: SWIFT code is required for Swift transfers`,
            );
            return false;
          }
        } else if (account.rails === "Local") {
          const currencyToValidate = account.currency || currency;

          if (currencyToValidate === "USD") {
            if (!account.routingNumber || account.routingNumber.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: Routing number is required for USD transfers`,
              );
              return false;
            }
            if (!account.accountNumber || account.accountNumber.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: Account number is required for USD transfers`,
              );
              return false;
            }
            if (!account.paymentMethod) {
              toast.error(
                `Bank account ${i + 1}: Payment method is required for USD transfers`,
              );
              return false;
            }
          } else if (currencyToValidate === "GBP") {
            if (!account.sortCode || account.sortCode.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: Sort code is required for GBP transfers`,
              );
              return false;
            }
            if (!account.accountNumber || account.accountNumber.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: Account number is required for GBP transfers`,
              );
              return false;
            }
          } else if (currencyToValidate === "EUR") {
            if (!account.iban || account.iban.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: IBAN number is required for EUR transfers`,
              );
              return false;
            }
          } else if (currencyToValidate === "INR") {
            if (!account.bankName || account.bankName.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: Bank name is required for INR transfers`,
              );
              return false;
            }
            if (!account.accountNumber || account.accountNumber.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: Account number is required for INR transfers`,
              );
              return false;
            }
            if (!account.ifsc || account.ifsc.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: IFSC code is required for INR transfers`,
              );
              return false;
            }
          } else if (currencyToValidate === "AED") {
            if (!account.iban || account.iban.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: IBAN number is required for AED transfers`,
              );
              return false;
            }
            if (!account.swift || account.swift.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: SWIFT/BIC code is required for AED transfers`,
              );
              return false;
            }
          } else if (
            currencyToValidate === "BDT" ||
            currencyToValidate === "LKR" ||
            currencyToValidate === "AUD"
          ) {
            if (!account.bankCode || account.bankCode === "") {
              toast.error(
                `Bank account ${i + 1}: Bank selection is required for ${currencyToValidate} transfers`,
              );
              return false;
            }
            if (!account.accountNumber || account.accountNumber.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: Account number is required for ${currencyToValidate} transfers`,
              );
              return false;
            }
          } else if (currencyToValidate === "PKR") {
            if (!account.bankCode || account.bankCode === "") {
              toast.error(
                `Bank account ${i + 1}: Bank selection is required for PKR transfers`,
              );
              return false;
            }
            if (!account.accountNumber || account.accountNumber.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: Account number is required for PKR transfers`,
              );
              return false;
            }
            if (!account.branchCode || account.branchCode.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: Branch code is required for PKR transfers`,
              );
              return false;
            }
          } else if (
            currencyToValidate === "NPR" ||
            currencyToValidate === "KES" ||
            currencyToValidate === "NGN"
          ) {
            if (!account.bankCode || account.bankCode === "") {
              toast.error(
                `Bank account ${i + 1}: Bank selection is required for ${currencyToValidate} transfers`,
              );
              return false;
            }
            if (!account.accountNumber || account.accountNumber.trim() === "") {
              toast.error(
                `Bank account ${i + 1}: Account number is required for ${currencyToValidate} transfers`,
              );
              return false;
            }
          } else {
            // Default local transfer validation
            if (!account.accountNumber || account.accountNumber.trim() === "") {
              toast.error(`Bank account ${i + 1}: Account number is required`);
              return false;
            }
            if (!account.bankName || account.bankName.trim() === "") {
              toast.error(`Bank account ${i + 1}: Bank name is required`);
              return false;
            }
          }
        } else if (account.rails === "Mobile") {
          if (!account.mobileNumber || account.mobileNumber.trim() === "") {
            toast.error(
              `Bank account ${i + 1}: Mobile number is required for mobile transfers`,
            );
            return false;
          }
          if (!account.walletProvider || account.walletProvider === "") {
            toast.error(
              `Bank account ${i + 1}: Wallet provider is required for mobile transfers`,
            );
            return false;
          }
          if (
            account.walletProvider === "Other" &&
            (!account.otherProvider || account.otherProvider.trim() === "")
          ) {
            toast.error(
              `Bank account ${i + 1}: Please specify the wallet provider`,
            );
            return false;
          }
        }
      }
    }

    // Move to next step
    setStep(step + 1);
    return true;
  };

  const prevStep = () => {
    if (step === 0) navigate(-1);
    else setStep(step - 1);
  };

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
    if (field === "branchCode") setBranchCode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isRailsMissing = bankAccounts.some((account) => !account.rails);
    if (isRailsMissing) {
      toast.error("Please select rails for all bank accounts.");
      setLoading(false);
      return;
    }

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

    const finalRelationship =
      formik.values.relationtobenef === "other" &&
      formik.values.otherRelationship.trim() !== ""
        ? formik.values.otherRelationship.trim()
        : formik.values.relationtobenef;

    const cleanedCountryCode = formik.values.country_phone_code.startsWith("+")
      ? formik.values.country_phone_code.substring(1)
      : formik.values.country_phone_code;

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

    try {
      if (mode === "create") {
        const result = await dispatch(
          createAndAddBeneficiary({
            customerId,
            beneficiaryData: {
              ...beneficiaryData,
              country_phone_code: cleanedCountryCode,
            },
            bankAccounts,
            currency,
            country_code: cleanedCountryCode,
          }),
        ).unwrap();
        if (result?.success) {
          toast.success("Beneficiary created successfully!");
          setTimeout(() => navigate(-1), 1500);
        }
      } else if (mode === "edit") {
        const result = await dispatch(
          updateBeneficiary({
            customerId,
            beneficiaryId,
            beneficiaryData: {
              ...beneficiaryData,
              country_phone_code: cleanedCountryCode,
            },
          }),
        ).unwrap();
        toast.success("Beneficiary updated successfully!");
        setTimeout(() => navigate(-1), 1500);
      }
    } catch (error) {
      toast.error(error.message || `Failed to ${mode} beneficiary`);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // Helper functions for bank fields
  const getBanksForCurrency = useMemo(() => {
    if (["BDT", "LKR", "AUD", "PKR"].includes(currency)) {
      return banks[`${currency}_int`] || [];
    }
    return banks[currency] || [];
  }, [banks, currency]);

  const bankOptions = useMemo(() => {
    const banksList = getBanksForCurrency;
    return banksList.map((bank) => ({
      value: bank.id || bank.bank_code,
      label: bank.name || bank.bank_name,
      bankCode: bank.bank_code,
    }));
  }, [getBanksForCurrency]);

  const getIdTypesForCurrency = useMemo(() => {
    if (Object.keys(idTypes).length === 0 || !currency || currency === "")
      return [];
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

  const idTypeOptions = useMemo(() => {
    const types = getIdTypesForCurrency;
    return types.map((idType) => ({
      value: idType.name || idType.id || idType,
      label: idType.name || idType.id || idType,
    }));
  }, [getIdTypesForCurrency]);

  const getBankBranches = useMemo(() => {
    const currentBankCode = bankAccounts[0]?.bankCode;
    return currentBankCode ? bankBranches[currentBankCode] || [] : [];
  }, [bankBranches, bankAccounts]);

  const branchOptions = useMemo(() => {
    const branches = getBankBranches;
    return branches.map((branch) => ({
      value: branch.branch_code,
      label: `${branch.bank_branch_name} - ${branch.branch_code}`,
    }));
  }, [getBankBranches]);

  const nationalityOptions = useMemo(
    () =>
      nationalities.map((nationality) => ({
        value: nationality.id.toString(),
        label: nationality.name,
      })),
    [nationalities],
  );

  const cityOptions = useMemo(() => {
    const citiesList = getCitiesForCountry();
    return citiesList.map((city) => ({
      value: city.city_name,
      label: city.city_name,
    }));
  }, [getCitiesForCountry]);

  const getRailsOptions = useCallback((accountCurrency) => {
    const options = [{ value: "Swift", label: "Swift" }];
    if (accountCurrency === "GBP")
      options.unshift({ value: "Local", label: "FPS" });
    else if (accountCurrency === "EUR")
      options.unshift({ value: "Local", label: "SEPA" });
    else if (accountCurrency === "USD")
      options.unshift({ value: "Local", label: "ACH" });
    else options.unshift({ value: "Local", label: "Bank" });
    options.push({ value: "Mobile", label: "Mobile" });
    return options;
  }, []);

  const paymentMethodOptions = [
    { value: "ACH", label: "ACH" },
    { value: "Domestic Wire", label: "Domestic Wire" },
  ];

  const accountTypeOptions = [
    { value: "Business Savings", label: "Business Savings" },
    { value: "Business Checkings", label: "Business Checkings" },
    { value: "Personal Checkings", label: "Personal Checkings" },
    { value: "Personal Savings", label: "Personal Savings" },
  ];

  const walletProviderOptions = [
    { value: "M-Pesa", label: "M-Pesa (Kenya)" },
    { value: "EasyPaisa", label: "EasyPaisa (Pakistan)" },
    { value: "bKash", label: "bKash (Bangladesh)" },
    { value: "Other", label: "Other" },
  ];

  // ========== RENDER PHONE SEARCH STEP  ==========
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
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Create a new beneficiary with different details. The existing
                  beneficiary information shown above is for reference only.
                </p>
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

  // ========== RENDER BENEFICIARY DETAILS STEP ==========
  const renderBeneficiaryDetailsStep = () => (
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Beneficiary Type
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
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
                    if (item.type !== "individual")
                      setShowOtherRelationship(false);
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
              Using existing beneficiary information. Fields are pre-filled and
              cannot be edited.
            </motion.p>
          )}
        </div>

        <div className="md:col-span-2">
          <AnimatedSelect
            label="Beneficiary Currency"
            info="Select the currency for transfers"
            icon={FaMoneyBillWave}
            options={currencyOptions}
            value={currencyOptions.find((option) => option.value === currency)}
            onChange={handleCurrencyChange}
            disabled={usingExistingBeneficiary}
          />
        </div>

        {formik.values.beneftype === "individual" ? (
          <>
            <div>
              <FloatingLabelInput
                label="Full Name"
                required
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="name"
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
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="name"
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
                const selectedCountry = countries.find(
                  (c) => c.id === parseInt(countryId),
                );
                if (selectedCountry) {
                  let countryPhoneCode = selectedCountry.phone_code || "+1";
                  if (!countryPhoneCode.startsWith("+"))
                    countryPhoneCode = `+${countryPhoneCode}`;
                  formik.setFieldValue("country_phone_code", countryPhoneCode);
                  setCountryCodeInput(countryPhoneCode);
                  setSelectedCountryCode(countryPhoneCode);
                }
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
            options={nationalityOptions}
            value={nationalityOptions.find(
              (option) => option.value === formik.values.nationality_id,
            )}
            onChange={(selectedOption) => {
              if (!usingExistingBeneficiary)
                formik.setFieldValue("nationality_id", selectedOption?.value);
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
          <div className="md:col-span-2">
            <AnimatedSelect
              label="Relationship to Beneficiary"
              required
              icon={FaUserFriends}
              options={relationshipOptions}
              value={relationshipOptions.find(
                (option) => option.value === formik.values.relationtobenef,
              )}
              onChange={(selectedOption) => {
                if (!usingExistingBeneficiary) {
                  const value = selectedOption?.value;
                  formik.setFieldValue("relationtobenef", value);
                  setShowOtherRelationship(value === "other");
                  if (value !== "other")
                    formik.setFieldValue("otherRelationship", "");
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
                  icon={FaUserFriends}
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
                options={idTypeOptions}
                value={idTypeOptions.find(
                  (option) =>
                    option.value === formik.values.beneficiary_id_type,
                )}
                onChange={(selectedOption) => {
                  if (!usingExistingBeneficiary)
                    formik.setFieldValue(
                      "beneficiary_id_type",
                      selectedOption?.value,
                    );
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
          disabled={isLoading || !isFormValid()}
          className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 md:flex-none font-medium ${
            isLoading || !isFormValid()
              ? "bg-gray-300 cursor-not-allowed text-gray-500"
              : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
          }`}
          whileHover={!isLoading && isFormValid() ? { x: 5, scale: 1.02 } : {}}
          whileTap={!isLoading && isFormValid() ? { scale: 0.98 } : {}}
        >
          {isLoading ? (
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

  // ========== RENDER BANK ACCOUNT FIELDS ==========
  const renderBankAccountFields = (index) => {
    const account = bankAccounts[index];
    const accountCurrency = account.currency || currency;

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
                options={currencyOptions}
                value={currencyOptions.find(
                  (option) => option.value === accountCurrency,
                )}
                onChange={(selectedOption) => {
                  if (selectedOption?.value) {
                    const newCurrency = selectedOption.value;
                    handleBankAccountChange(index, "currency", newCurrency);
                    if (index === 0) {
                      setCurrency(newCurrency);
                      const bankType = ["BDT", "LKR", "AUD", "PKR"].includes(
                        newCurrency,
                      )
                        ? "int-banks"
                        : "currency-payout-banks";
                      dispatch(
                        fetchBanksByCurrency({
                          currency: newCurrency,
                          bankType,
                        }),
                      );
                      if (["BDT", "INR", "PKR"].includes(newCurrency)) {
                        const currentBeneficiaryType =
                          formik.values.beneftype || "individual";
                        dispatch(
                          fetchIdTypesByCurrency({
                            currency: newCurrency,
                            beneficiaryType: currentBeneficiaryType,
                          }),
                        );
                      }
                    }
                  }
                }}
                disabled={usingExistingBeneficiary}
              />
            </div>
          )}
        </div>

        {/* Currency-Specific ID Fields */}
        {(accountCurrency === "BDT" ||
          accountCurrency === "INR" ||
          accountCurrency === "PKR") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <AnimatedSelect
                label="ID Type"
                required
                icon={FaIdCard}
                options={idTypeOptions}
                value={idTypeOptions.find(
                  (option) =>
                    option.value === formik.values.beneficiary_id_type,
                )}
                onChange={(selectedOption) =>
                  formik.setFieldValue(
                    "beneficiary_id_type",
                    selectedOption?.value,
                  )
                }
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
          </div>
        )}

        {/* SWIFT TRANSFERS */}
        {account.rails === "Swift" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
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
            <div>
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

        {/* USD Local Transfer */}
        {account.rails === "Local" && accountCurrency === "USD" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <AnimatedSelect
                label="Payment Method"
                required
                options={paymentMethodOptions}
                value={paymentMethodOptions.find(
                  (option) => option.value === account.paymentMethod,
                )}
                onChange={(selectedOption) =>
                  handleBankAccountChange(
                    index,
                    "paymentMethod",
                    selectedOption?.value,
                  )
                }
                disabled={usingExistingBeneficiary}
              />
            </div>
            <div>
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
            <div>
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
            {account.paymentMethod === "ACH" && (
              <div>
                <AnimatedSelect
                  label="Account Type"
                  required
                  options={accountTypeOptions}
                  value={accountTypeOptions.find(
                    (option) => option.value === account.accountType,
                  )}
                  onChange={(selectedOption) =>
                    handleBankAccountChange(
                      index,
                      "accountType",
                      selectedOption?.value,
                    )
                  }
                  disabled={usingExistingBeneficiary}
                />
              </div>
            )}
          </div>
        )}

        {/* INR Local Transfer */}
        {account.rails === "Local" && accountCurrency === "INR" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FloatingLabelInput
                label="Bank Name"
                required
                value={account.bankName}
                onChange={(e) =>
                  handleBankAccountChange(index, "bankName", e.target.value)
                }
                disabled={usingExistingBeneficiary}
                icon={FaUniversity}
              />
            </div>
            <div>
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
            <div>
              <FloatingLabelInput
                label="IFSC Code"
                required
                value={account.ifsc}
                onChange={(e) =>
                  handleBankAccountChange(index, "ifsc", e.target.value)
                }
                disabled={usingExistingBeneficiary}
                icon={FaIdCard}
              />
            </div>
          </div>
        )}

        {/* EUR/AED Local Transfer */}
        {account.rails === "Local" &&
          (accountCurrency === "EUR" || accountCurrency === "AED") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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
              {accountCurrency === "AED" && (
                <div>
                  <FloatingLabelInput
                    label="SWIFT/BIC Code"
                    required
                    value={account.swift}
                    onChange={(e) =>
                      handleBankAccountChange(index, "swift", e.target.value)
                    }
                    disabled={usingExistingBeneficiary}
                    icon={FaUniversity}
                  />
                </div>
              )}
            </div>
          )}

        {/* NPR/KES/NGN Local Transfer */}
        {account.rails === "Local" &&
          (accountCurrency === "NPR" ||
            accountCurrency === "KES" ||
            accountCurrency === "NGN") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <AnimatedSelect
                  label="Bank Name"
                  required
                  options={bankOptions}
                  value={bankOptions.find(
                    (option) => option.value === account.bankCode,
                  )}
                  onChange={(selectedOption) => {
                    handleBankAccountChange(
                      index,
                      "bankCode",
                      selectedOption?.value,
                    );
                    const selectedBank = getBanksForCurrency.find(
                      (bank) =>
                        bank.id === selectedOption?.value ||
                        bank.bank_code === selectedOption?.value,
                    );
                    if (selectedBank)
                      handleBankAccountChange(
                        index,
                        "bankName",
                        selectedBank.name || selectedBank.bank_name,
                      );
                  }}
                  disabled={usingExistingBeneficiary}
                />
              </div>
              <div>
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
              {accountCurrency === "NGN" && (
                <div>
                  <FloatingLabelInput
                    label="Account Name"
                    value={account.accountName}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "accountName",
                        e.target.value,
                      )
                    }
                    disabled={usingExistingBeneficiary}
                    icon={FaUser}
                  />
                </div>
              )}
            </div>
          )}

        {/* BDT/LKR/AUD/PKR Local Transfer */}
        {account.rails === "Local" &&
          (accountCurrency === "BDT" ||
            accountCurrency === "LKR" ||
            accountCurrency === "AUD" ||
            accountCurrency === "PKR") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <AnimatedSelect
                  label="Bank Name"
                  required
                  options={bankOptions}
                  value={bankOptions.find(
                    (option) => option.value === account.bankCode,
                  )}
                  onChange={(selectedOption) => {
                    handleBankAccountChange(
                      index,
                      "bankCode",
                      selectedOption?.value,
                    );
                    const selectedBank = getBanksForCurrency.find(
                      (bank) => bank.bank_code === selectedOption?.value,
                    );
                    if (selectedBank)
                      handleBankAccountChange(
                        index,
                        "bankName",
                        selectedBank.bank_name,
                      );
                    if (
                      accountCurrency === "BDT" ||
                      accountCurrency === "LKR" ||
                      accountCurrency === "AUD"
                    ) {
                      if (selectedOption?.value)
                        dispatch(fetchBankBranches(selectedOption.value));
                    }
                  }}
                  disabled={usingExistingBeneficiary}
                />
              </div>
              <div>
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
              {(accountCurrency === "BDT" ||
                accountCurrency === "LKR" ||
                accountCurrency === "AUD") && (
                <div>
                  <AnimatedSelect
                    label="Branch Code"
                    options={branchOptions}
                    value={branchOptions.find(
                      (option) => option.value === account.branchCode,
                    )}
                    onChange={(selectedOption) =>
                      handleBankAccountChange(
                        index,
                        "branchCode",
                        selectedOption?.value,
                      )
                    }
                    disabled={usingExistingBeneficiary}
                  />
                </div>
              )}
              {accountCurrency === "PKR" && (
                <>
                  <div>
                    <FloatingLabelInput
                      label="Branch Code"
                      value={account.branchCode}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "branchCode",
                          e.target.value,
                        )
                      }
                      disabled={usingExistingBeneficiary}
                      icon={FaIdCard}
                    />
                  </div>
                  <div>
                    <FloatingLabelInput
                      label="IBAN Number"
                      value={account.iban}
                      onChange={(e) =>
                        handleBankAccountChange(index, "iban", e.target.value)
                      }
                      disabled={usingExistingBeneficiary}
                      icon={FaIdCard}
                    />
                  </div>
                </>
              )}
              <div>
                <FloatingLabelInput
                  label="Bank State"
                  value={account.bankState}
                  onChange={(e) =>
                    handleBankAccountChange(index, "bankState", e.target.value)
                  }
                  disabled={usingExistingBeneficiary}
                  icon={FaMapMarkerAlt}
                />
              </div>
            </div>
          )}

        {/* GBP/DKK Local Transfer */}
        {account.rails === "Local" &&
          (accountCurrency === "GBP" || accountCurrency === "DKK") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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
              <div>
                <FloatingLabelInput
                  label="Sort Code"
                  required
                  value={account.sortCode}
                  onChange={(e) =>
                    handleBankAccountChange(index, "sortCode", e.target.value)
                  }
                  disabled={usingExistingBeneficiary}
                  icon={FaIdCard}
                />
              </div>
            </div>
          )}

        {/* Mobile Transfer */}
        {account.rails === "Mobile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <AnimatedSelect
                label="Mobile Wallet Provider"
                required
                options={walletProviderOptions}
                value={walletProviderOptions.find(
                  (option) => option.value === account.walletProvider,
                )}
                onChange={(selectedOption) =>
                  handleBankAccountChange(
                    index,
                    "walletProvider",
                    selectedOption?.value,
                  )
                }
                disabled={usingExistingBeneficiary}
              />
            </div>
            <div>
              <FloatingLabelInput
                label="Mobile Number"
                required
                value={account.mobileNumber}
                onChange={(e) =>
                  handleBankAccountChange(index, "mobileNumber", e.target.value)
                }
                disabled={usingExistingBeneficiary}
                icon={FaMobileAlt}
              />
            </div>
            {account.walletProvider === "Other" && (
              <div className="md:col-span-2">
                <FloatingLabelInput
                  label="Provider Name"
                  required
                  value={account.otherProvider}
                  onChange={(e) =>
                    handleBankAccountChange(
                      index,
                      "otherProvider",
                      e.target.value,
                    )
                  }
                  disabled={usingExistingBeneficiary}
                  icon={FaBuilding}
                />
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  // ========== RENDER BANK INFO STEP ==========
  const renderBankInfoStep = () => (
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
              Please provide the bank account information for your beneficiary.
              {bankAccounts.length > 0 &&
                ` You have ${bankAccounts.length} bank account${bankAccounts.length > 1 ? "s" : ""}.`}
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
            className={`flex items-center ${usingExistingBeneficiary ? "text-gray-400" : "text-blue-600"}`}
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
            className={`text-sm mt-2 ${usingExistingBeneficiary ? "text-gray-400" : "text-gray-500"}`}
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
            disabled={loading || createLoading || updateLoading}
            className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 font-medium ${
              loading || createLoading || updateLoading
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
            }`}
            whileHover={
              !loading && !createLoading && !updateLoading
                ? { scale: 1.02, y: -2 }
                : {}
            }
            whileTap={
              !loading && !createLoading && !updateLoading
                ? { scale: 0.98 }
                : {}
            }
          >
            {loading || createLoading || updateLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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

  // Customer ID check
  if (!customerId) {
    return (
      <AlertBox
        message="Customer ID is missing. Please navigate to this page through the proper route."
        onClose={() => navigate("/dashboard")}
      />
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Loading Overlay */}
      {(isLoading ||
        createLoading ||
        updateLoading ||
        beneficiariesCreateLoading) && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <RingLoader size={60} color="#3B82F6" />
            <p className="mt-6 text-gray-700 font-medium">
              Processing your request...
            </p>
            <p className="text-gray-500 text-sm mt-2">
              This may take a few moments
            </p>
          </motion.div>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <FaMoneyBillWave className="mr-3" size={28} />
                </motion.div>
                {mode === "create" ? "Add New Beneficiary" : "Edit Beneficiary"}
              </h1>
              <p className="text-blue-100 mt-1">
                {mode === "create"
                  ? "Fill in the details to add a new beneficiary"
                  : "Update beneficiary information"}
              </p>
            </div>
            <motion.button
              onClick={handleCancel}
              className="flex items-center text-white hover:text-blue-100 transition-colors duration-200 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg mt-4 md:mt-0"
              whileHover={{ x: -5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaArrowLeft className="mr-2" />
              Back
            </motion.button>
          </div>

          {/* Progress Steps */}
          <ProgressIndicator step={step} totalSteps={steps.length} />

          <div className="flex items-start justify-between relative mt-4">
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
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 transform ${
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
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {mode === "create" && step === 0 && renderPhoneSearchStep()}
              {step === 1 && renderBeneficiaryDetailsStep()}
              {step === 2 && renderBankInfoStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastClassName="rounded-xl shadow-lg"
      />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </motion.div>
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
