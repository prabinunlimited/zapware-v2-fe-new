import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import { ClipLoader } from "react-spinners";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import {
    FaMoneyBillWave,
    FaArrowLeft,
    FaUser,
    FaUniversity,
    FaEye,
    FaEyeSlash,
    FaCheckCircle,
    FaBuilding,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaGlobe,
    FaLock,
    FaCreditCard,
    FaPlus,
    FaTrash,
    FaChevronRight,
    FaChevronLeft,
    FaCopy,
    FaCheck,
    FaTimes,
    FaSpinner,
} from "react-icons/fa";
import { MdVerified, MdEmail, MdPhone, MdPerson, MdBusiness } from "react-icons/md";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchCountries,
    selectCountriesOptions,
    selectCountriesLoading,
    fetchStatesByCountry,
    selectStates,
    selectStatesLoading,
} from "../../../../features/Auth/slices/countrySlice"

const API_URL = import.meta.env.VITE_API_URL;

// VerificationPopup Component (same as before)
const VerificationPopup = ({
    type,
    onClose,
    onVerify,
    isOpen,
    isLoading = false,
    resendLoading = false,
    onResend,
}) => {
    if (!isOpen) return null;

    const isEmail = type === "email";
    const title = isEmail ? "Email Verification" : "Phone Verification";
    const icon = isEmail ? <MdEmail className="text-2xl" /> : <MdPhone className="text-2xl" />;
    const message = isEmail
        ? "We've sent a verification code to your email address. Please enter it below to verify your account."
        : "We've sent an OTP to your phone number. Please enter it below to verify your account.";

    const placeholder = isEmail ? "Enter 6-digit code" : "Enter 6-digit OTP";
    const [code, setCode] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code.trim().length > 0) {
            onVerify(code);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 py-6 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                {icon}
                            </div>
                            <div>
                                <h3 className="text-white text-xl font-bold">{title}</h3>
                                <p className="text-blue-100 text-sm">Verification required</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-200"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-8">
                    <div className="bg-blue-50/50 rounded-xl p-4 mb-6 border border-blue-100">
                        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isEmail ? "Verification Code" : "OTP Code"}
                            </label>
                            <div className={`relative transition-all duration-200 ${isFocused ? 'ring-2 ring-blue-500' : ''}`}>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder={placeholder}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 text-center text-lg tracking-widest font-mono"
                                    disabled={isLoading}
                                    maxLength={6}
                                />
                                {code.length === 6 && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">Enter the 6-digit code sent to your {isEmail ? 'email' : 'phone'}</p>
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 px-4 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || code.length < 6}
                                className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl font-medium"
                            >
                                {isLoading ? (
                                    <ClipLoader size={20} color="#ffffff" />
                                ) : (
                                    "Verify Now"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-200">
                        <button
                            onClick={onResend}
                            disabled={resendLoading}
                            className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 flex items-center justify-center transition-colors duration-200 gap-2"
                        >
                            {resendLoading ? (
                                <ClipLoader size={16} color="#2563eb" />
                            ) : (
                                <>
                                    <FaSpinner className="animate-spin" />
                                    Resend {isEmail ? "Code" : "OTP"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// SuccessPopup Component (same as before)
const SuccessPopup = ({ benefCode, onClose, onCopy, onContinue }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="max-w-md w-11/12 p-8 rounded-3xl shadow-2xl bg-white text-center relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tl from-blue-400/10 to-indigo-400/10 rounded-full -ml-16 -mb-16" />

                <div className="relative">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                    >
                        <FaCheck className="w-12 h-12 text-white" />
                    </motion.div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Registration Successful! 🎉
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Your beneficiary account has been created successfully
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6"
                    >
                        <p className="text-sm text-gray-600 mb-3 font-medium">
                            Your Beneficiary Code:
                        </p>
                        <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-blue-300 shadow-sm">
                            <span className="font-mono text-2xl font-bold text-blue-600 tracking-wider">
                                {benefCode}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-blue-50"
                            >
                                {copied ? (
                                    <>
                                        <FaCheck className="text-green-500" />
                                        <span className="text-green-500">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <FaCopy />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                        <p className="text-xs text-amber-700 flex items-center justify-center gap-2">
                            <span className="text-lg">⚠️</span>
                            Please store this code securely. You'll need it for future reference.
                        </p>
                    </div>

                    <button
                        onClick={onContinue}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                        Continue to Dashboard →
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const AddBeneficiaryRequestRemit = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const customerId = localStorage.getItem("customerId") || "";
    const authtoken = localStorage.getItem("authtoken");
    const dispatch = useDispatch();

    // Redux selectors for countries
    const countriesOptions = useSelector(selectCountriesOptions);
    const countriesLoading = useSelector(selectCountriesLoading);
    const states = useSelector(selectStates);
    const statesLoading = useSelector(selectStatesLoading);

    // Refs
    const isMountedRef = useRef(true);
    const initialRenderRef = useRef(true);
    const countriesFetchedRef = useRef(false);

    // Form state
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
    const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
    const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false);
    const [resendEmailLoading, setResendEmailLoading] = useState(false);
    const [resendPhoneLoading, setResendPhoneLoading] = useState(false);
    const [phoneOTP, setPhoneOTP] = useState("");

    // Data states
    const [nationalities, setNationalities] = useState([]);
    const [loadingNationalities, setLoadingNationalities] = useState(false);
    const [bdtBenefIdTypes, setBdtBenefIdTypes] = useState([]);

    // Location states - using Redux for states
    const [hasStates, setHasStates] = useState(false);
    const [cities, setCities] = useState([]);
    const [hasCities, setHasCities] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // Application states
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [step, setStep] = useState(1);
    const [beneficiaryId, setBeneficiaryId] = useState(null);

    // Bank states
    const [currency, setCurrency] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("ACH");
    const [accountType, setAccountType] = useState("");
    const [banks, setBanks] = useState([]);
    const [bdtBanks, setBdtBanks] = useState([]);
    const [pkrBanks, setPkrBanks] = useState([]);
    const [kesBanks, setKesBanks] = useState([]);
    const [nprBanks, setNprBanks] = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [loading, setLoading] = useState(false);
    const [branchCode, setBranchCode] = useState("");

    // Success states
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [benefCode, setBenefCode] = useState("");

    // Authentication states
    const [whiteLabelledPartnerId, setWhiteLabelledPartnerId] = useState(
        localStorage.getItem("whitelabelledpartnerid") || "0"
    );
    const whiteLabelledPartnerIdRef = useRef("");
    const [pageTitle, setPageTitle] = useState("Register Beneficiary");

    // Progress bar
    const progressPercentage = (step / 2) * 100;

    // Fetch countries on mount using Redux
    useEffect(() => {
        if (!countriesFetchedRef.current && !countriesLoading) {
            dispatch(fetchCountries());
            countriesFetchedRef.current = true;
        }
    }, [dispatch, countriesLoading]);

    useEffect(() => {
        const partnerId = localStorage.getItem("whitelabelledpartnerid");
        console.log("Found partnerId in localStorage:", partnerId);

        if (
            partnerId &&
            partnerId !== "undefined" &&
            partnerId.trim() !== "" &&
            partnerId !== "0"
        ) {
            setWhiteLabelledPartnerId(partnerId);
            whiteLabelledPartnerIdRef.current = partnerId;
            console.log("Partner ID initialized:", partnerId);
        } else {
            console.warn("No valid partner ID found in localStorage");
            setWhiteLabelledPartnerId("0");
            whiteLabelledPartnerIdRef.current = "0";
        }
    }, []);

    const bearerTokenRef = useRef(localStorage.getItem("bearertoken"));

    const localCurrencies = [
        "AED",
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

    // Bank accounts state
    const [bankAccounts, setBankAccounts] = useState([
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
        },
    ]);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.5,
                staggerChildren: 0.08,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: "easeOut",
            },
        },
    };

    const formVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut",
            },
        },
        exit: {
            opacity: 0,
            x: -50,
            transition: {
                duration: 0.3,
            },
        },
    };

    // Enhanced Select Styles
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: "white",
            border: state.isFocused ? "2px solid #3B82F6" : "2px solid #E5E7EB",
            borderRadius: "0.75rem",
            padding: "4px 8px",
            fontSize: "0.875rem",
            color: "#111827",
            boxShadow: "none",
            minHeight: "52px",
            transition: "all 0.2s ease",
            "&:hover": {
                borderColor: "#9CA3AF",
            },
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: "0.75rem",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            marginTop: "4px",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9CA3AF",
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? "#3B82F6"
                : state.isFocused
                    ? "#F3F4F6"
                    : "white",
            color: state.isSelected ? "white" : "#111827",
            padding: "12px 16px",
            cursor: "pointer",
            "&:active": {
                backgroundColor: "#3B82F6",
                color: "white",
            },
        }),
    };

    const constructApiUrl = (endpoint) => {
        const baseUrl = API_URL;
        const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
        return `${baseUrl}/${cleanEndpoint}`;
    };

    // Token management
    const getBearerToken = useCallback(async () => {
        try {
            const payload = {
                client_id: "HK6V7709",
                client_secret: "057d433a-2d02-437b-a265-56114567aa44",
                hostname: window.location.hostname,
            };

            const response = await axios.post(`${API_URL}/partner-login`, payload, {
                headers: { "Content-Type": "application/json" },
            });

            if (response.data?.status === "success" && response.data?.data?.token) {
                const newToken = response.data.data.token;
                localStorage.setItem("bearertoken", newToken);
                localStorage.setItem("bearertoken_timestamp", Date.now().toString());
                bearerTokenRef.current = newToken;

                const partnerId = response.data.data.partner_id;
                const beneficiaryPortalTitle = response.data.data.beneficiary_portal_title;

                console.log("Partner ID from API response:", partnerId);

                if (partnerId && partnerId !== "0") {
                    localStorage.setItem("whitelabelledpartnerid", partnerId.toString());
                    setWhiteLabelledPartnerId(partnerId.toString());
                    whiteLabelledPartnerIdRef.current = partnerId.toString();
                }

                if (beneficiaryPortalTitle) {
                    setPageTitle(beneficiaryPortalTitle);
                }

                return newToken;
            } else {
                throw new Error(response.data?.message || "Failed to get bearer token");
            }
        } catch (error) {
            console.error("Error fetching bearer token:", error);
            if (error.code === "ECONNREFUSED") {
                toast.error("Cannot connect to server. Please check if the backend is running.");
            } else {
                toast.error("Authentication failed. Please try again.");
            }
            throw error;
        }
    }, [API_URL]);

    const makeAuthenticatedRequest = useCallback(
        async (apiCall) => {
            try {
                let token = bearerTokenRef.current;
                if (!token) {
                    token = await getBearerToken();
                }
                return await apiCall(token);
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log("Token expired, fetching new token...");
                    localStorage.removeItem("bearertoken");
                    bearerTokenRef.current = null;
                    const newToken = await getBearerToken();
                    return await apiCall(newToken);
                }
                throw error;
            }
        },
        [getBearerToken]
    );

    // Fetch states using Redux
    const handleCountryChange = async (selectedOption) => {
        const countryId = selectedOption?.value || "";
        formik.setFieldValue("country_id", countryId);
        formik.setFieldValue("state", "");
        formik.setFieldValue("city", "");
        setCities([]);
        setHasCities(false);

        if (countryId) {
            await dispatch(fetchStatesByCountry(countryId));
            setHasStates(true);
        } else {
            setHasStates(false);
        }
    };

    // Fetch cities (keep as is since we don't have a Redux slice for cities)
    const fetchCities = useCallback(
        async (stateId) => {
            if (!stateId || !isMountedRef.current) return;

            setLoadingCities(true);
            try {
                const token = await getBearerToken();
                const response = await fetch(`${API_URL}/state-cities/${stateId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log("🔵 Cities API Response:", result);

                if (result.status === "success" && isMountedRef.current) {
                    // Check if data exists and is an array
                    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                        setCities(result.data);
                        setHasCities(true);
                    } else {
                        //  No cities found - set empty array but keep hasCities true
                        setCities([]);
                        setHasCities(true); // This triggers the "No cities found" message
                    }
                } else if (isMountedRef.current) {
                    setCities([]);
                    setHasCities(true); // Show "No cities found" message
                }
            } catch (error) {
                console.error("Error fetching cities:", error);
                if (isMountedRef.current) {
                    setCities([]);
                    setHasCities(true);
                    if (!error.message.includes("Failed to fetch")) {
                        toast.error("Failed to load cities. Please try again.");
                    }
                }
            } finally {
                if (isMountedRef.current) {
                    setLoadingCities(false);
                }
            }
        },
        [API_URL, getBearerToken]
    );

    const handleStateChange = async (selectedOption) => {
        const stateId = selectedOption?.value || "";
        formik.setFieldValue("state", stateId);
        formik.setFieldValue("city", "");

        if (stateId) {
            await fetchCities(stateId);
        } else {
            setCities([]);
            setHasCities(false);
        }
    };

    // Fetch nationalities
    useEffect(() => {
        const fetchNationalities = async () => {
            setLoadingNationalities(true);
            try {
                const token = await getBearerToken();
                const response = await fetch(`${API_URL}/nationalities`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    const result = await response.json();

                    if (Array.isArray(result)) {
                        const nationalityOptions = result.map((nationality) => ({
                            value: nationality.id,
                            label: nationality.name,
                        }));
                        setNationalities(nationalityOptions);
                    } else if (result.data && Array.isArray(result.data)) {
                        const nationalityOptions = result.data.map((nationality) => ({
                            value: nationality.id,
                            label: nationality.name,
                        }));
                        setNationalities(nationalityOptions);
                    } else {
                        console.error("Unexpected nationalities API response structure:", result);
                        toast.error("Failed to load nationalities: Unexpected response format");
                    }
                } else {
                    console.error("Failed to fetch nationalities:", response.status);
                    toast.error(`Failed to load nationalities: ${response.status}`);
                }
            } catch (error) {
                console.error("Error fetching nationalities:", error);
                toast.error("Failed to load nationalities");
            } finally {
                setLoadingNationalities(false);
            }
        };

        fetchNationalities();
    }, [getBearerToken]);

    const getBanksForCurrency = () => {
        switch (currency) {
            case "BDT":
                return bdtBanks;
            case "PKR":
                return pkrBanks;
            case "KES":
                return kesBanks;
            case "NPR":
                return nprBanks;
            default:
                return banks;
        }
    };

    const handleCurrencyChange = async (e) => {
        const newCurrency = e.target.value;
        setCurrency(newCurrency);

        setBanks([]);
        setBdtBanks([]);
        setPkrBanks([]);
        setKesBanks([]);
        setNprBanks([]);

        try {
            const token = await getBearerToken();
            const response = await fetch(`${API_URL}/currency-id-type/${newCurrency}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setBdtBenefIdTypes(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching benef id type:", error);
            setBdtBenefIdTypes([]);
        }

        setBankAccounts((prevAccounts) =>
            prevAccounts.map((account) => ({
                ...account,
                currency: newCurrency,
                bankCode: "",
                bankName: "",
            }))
        );
    };

    // Password validation
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

    // Formik configuration
    const formik = useFormik({
        initialValues: {
            first_name: "",
            middle_name: "",
            last_name: "",
            institution_name: "",
            country_id: "",
            phone_code_country_id: "",
            country_phone_code: "",
            phone_number: "",
            email: "",
            beneftype: "",
            state: "",
            city: "",
            street: "",
            postalcode: "",
            relationtobenef: "",
            nationality_id: "",
            status: "1",
            nic_bcc_code: "",
            password: "",
            confirmPassword: "",
            beneficiary_id_type: "",
            beneficiary_id_number: "",
            bic_ncc_code: "",
        },
        validate: (values) => {
            const errors = {};

            if (!values.beneftype) {
                errors.beneftype = "Beneficiary type is required";
            }

            if (values.beneftype === "individual") {
                if (!values.first_name) errors.first_name = "First name is required";
                if (!values.last_name) errors.last_name = "Last name is required";
            } else if (values.beneftype === "institution") {
                if (!values.institution_name) errors.institution_name = "Institution name is required";
            }

            if (!values.email) {
                errors.email = "Email is required";
            } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
                errors.email = "Invalid email address";
            }

            if (!values.phone_number) {
                errors.phone_number = "Phone number is required";
            }

            if (!values.country_id) {
                errors.country_id = "Country is required";
            }

            if (!values.street) {
                errors.street = "Street address is required";
            }

            if (!values.password) {
                errors.password = "Password is required";
            } else if (values.password.length < 12) {
                errors.password = "Password must be at least 12 characters";
            } else if (!validatePassword(values.password)) {
                errors.password = "Password must include uppercase, lowercase, number, and special character";
            }

            if (!values.confirmPassword) {
                errors.confirmPassword = "Please confirm your password";
            } else if (values.password !== values.confirmPassword) {
                errors.confirmPassword = "Passwords do not match";
            }

            return errors;
        },

        onSubmit: async (values) => {
            setIsLoading(true);

            const beneficiaryData = {
                beneftype: values.beneftype,
                first_name: values.first_name,
                middle_name: values.middle_name,
                last_name: values.last_name,
                institution_name: values.institution_name,
                email: values.email,
                country_id: values.country_id,
                country_phone_code: values.country_phone_code,
                phone_number: values.phone_number,
                state: values.state,
                city: values.city,
                street: values.street,
                postalcode: values.postalcode,
                nationality_id: values.nationality_id,
                status: values.status,
                bic_ncc_code: values.bic_ncc_code,
                password: values.password,
                confirmPassword: values.confirmPassword,
            };

            try {
                const response = await fetch(
                    `${API_URL}/beneficiaries/add-benef/${customerId}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${authtoken}`,
                        },
                        body: JSON.stringify(beneficiaryData),
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    setMessage(data.message || "Beneficiary added successfully!");
                    setBeneficiaryId(data.beneficiary_id);
                    setStep(2);
                    toast.success("Beneficiary details saved successfully!");
                } else {
                    setMessage(data.message || "Failed to add beneficiary");
                    toast.error(data.message || "Failed to add beneficiary");
                }
            } catch (error) {
                setMessage("Error adding beneficiary: " + error.message);
                toast.error("Error adding beneficiary: " + error.message);
            } finally {
                setIsLoading(false);
            }
        },
    });

    // Field validation helpers
    const isEmailFieldFilled = () => {
        return formik.values.email && formik.values.email.trim().length > 0;
    };

    const isPhoneFieldFilled = () => {
        return (
            formik.values.phone_number &&
            formik.values.phone_number.trim().length > 0 &&
            formik.values.country_phone_code
        );
    };

    const isFormValid = React.useMemo(() => {
        if (formik.values.beneftype === "") return false;

        if (
            formik.values.country_id === "" ||
            formik.values.country_phone_code === "" ||
            formik.values.phone_number === "" ||
            formik.values.city === "" ||
            formik.values.street === ""
        )
            return false;

        if (formik.values.beneftype === "individual") {
            if (formik.values.first_name === "" || formik.values.last_name === "")
                return false;
        }

        if (formik.values.beneftype === "institution") {
            if (formik.values.institution_name === "") return false;
        }

        if (!validatePassword(formik.values.password)) return false;

        if (formik.values.password !== formik.values.confirmPassword) return false;

        if (currency === "BDT" || currency === "INR" || currency === "PKR") {
            if (
                formik.values.beneficiary_id_type === "" ||
                formik.values.beneficiary_id_number === ""
            )
                return false;

            if (currency === "INR" && formik.values.city === "") return false;
        }

        if (!emailVerified || !phoneVerified) {
            return false;
        }

        return true;
    }, [formik.values, currency, emailVerified, phoneVerified]);

    // Verification handlers
    const handleSendEmailPasscode = async () => {
        if (!formik.values.email) {
            formik.setFieldError("email", "Please enter your email address first");
            return;
        }

        setResendEmailLoading(true);

        try {
            let currentPartnerId = whiteLabelledPartnerIdRef.current;

            if (!currentPartnerId || currentPartnerId === "0") {
                currentPartnerId = 9;
            }

            await makeAuthenticatedRequest(async (token) => {
                const payload = {
                    email: formik.values.email,
                    user_type: "beneficiary",
                    partner_id: currentPartnerId,
                };

                const response = await axios.post(
                    `${API_URL}/send-passcode-registration`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (response.data.status === "success") {
                    toast.success("Passcode sent to your email!");
                    setShowEmailPopup(true);
                    formik.setFieldError("email", null);
                } else {
                    formik.setFieldError("email", response.data.message || "Failed to send passcode");
                }
            });
        } catch (error) {
            console.error("Error sending email passcode:", error);
            if (error.response?.status === 404) {
                formik.setFieldError("email", "Service temporarily unavailable. Please try again later.");
            } else if (error.response?.data?.message?.includes("partner_id")) {
                formik.setFieldError("email", "System configuration error. Please contact support.");
            } else {
                formik.setFieldError("email", error.response?.data?.message || "Failed to send passcode");
            }
        } finally {
            setResendEmailLoading(false);
        }
    };

    const handleVerifyEmailPasscode = async (passcode) => {
        setEmailVerificationLoading(true);
        try {
            const token = await getBearerToken();
            const partnerId = localStorage.getItem("whitelabelledpartnerid");
            const response = await axios.post(
                `${API_URL}/validate-passcode-registration`,
                {
                    email: formik.values.email,
                    passcode: passcode,
                    user_type: "beneficiary",
                    partner_id: partnerId
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.status === "success") {
                setEmailVerified(true);
                setShowEmailPopup(false);
                toast.success("Email verified successfully!");
            } else {
                toast.error(response.data.message || "Invalid passcode");
            }
        } catch (error) {
            console.error("Error verifying email passcode:", error);
            toast.error(error.response?.data?.message || "Failed to verify passcode");
        } finally {
            setEmailVerificationLoading(false);
        }
    };

    const handleSendPhoneOTP = async () => {
        if (!formik.values.phone_number || !formik.values.country_phone_code) {
            if (!formik.values.phone_number) {
                formik.setFieldError("phone_number", "Phone number is required");
            }
            if (!formik.values.country_phone_code) {
                formik.setFieldError("country_phone_code", "Country code is required");
            }
            return;
        }

        setResendPhoneLoading(true);

        try {
            let currentPartnerId = whiteLabelledPartnerIdRef.current;

            if (!currentPartnerId || currentPartnerId === "0") {
                formik.setFieldError("phone_number", "System configuration issue. Please try again or contact support.");
                setResendPhoneLoading(false);
                return;
            }

            await makeAuthenticatedRequest(async (token) => {
                const payload = {
                    country_code: formik.values.country_phone_code,
                    mobile_number: formik.values.phone_number,
                    user_type: "beneficiary",
                    partner_id: currentPartnerId,
                };

                const response = await axios.post(
                    constructApiUrl("send-otp-registration"),
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (response.data.status === "success") {
                    toast.success("OTP sent to your phone!");
                    setShowPhonePopup(true);
                    formik.setFieldError("phone_number", null);
                } else {
                    formik.setFieldError("phone_number", response.data.message || "Failed to send OTP");
                }
            });
        } catch (error) {
            console.error("Error sending phone OTP:", error);
            formik.setFieldError("phone_number", error.response?.data?.message || "Failed to send OTP");
        } finally {
            setResendPhoneLoading(false);
        }
    };

    const handleVerifyPhoneOTP = async (otp) => {
        setPhoneVerificationLoading(true);
        try {
            const token = await getBearerToken();
            const response = await axios.post(
                `${API_URL}/validate-otp-registration`,
                {
                    country_code: formik.values.country_phone_code,
                    mobile_number: formik.values.phone_number,
                    otp: otp,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.status === "success") {
                setPhoneVerified(true);
                setShowPhonePopup(false);

                if (response.data.data?.verification_token) {
                    localStorage.setItem("phone_verification_token", response.data.data.verification_token);
                }

                toast.success("Phone number verified successfully!");
            } else {
                toast.error(response.data.message || "Invalid OTP");
            }
        } catch (error) {
            console.error("Error verifying phone OTP:", error);
            toast.error(error.response?.data?.message || "Failed to verify OTP");
        } finally {
            setPhoneVerificationLoading(false);
        }
    };

    // Bank account management
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
            },
        ]);
    };

    const removeBankAccount = (index) => {
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

    // Bank details submission
    const handleSubmitBankDetails = async (e) => {
        e.preventDefault();
        setLoading(true);

        let hasErrors = false;

        if (currency === "BDT" || currency === "INR" || currency === "PKR") {
            if (!formik.values.beneficiary_id_type) {
                formik.setFieldError("beneficiary_id_type", "Beneficiary ID Type is required");
                hasErrors = true;
            }
            if (!formik.values.beneficiary_id_number) {
                formik.setFieldError("beneficiary_id_number", "Beneficiary ID Number is required");
                hasErrors = true;
            }
        }

        const isRailsMissing = bankAccounts.some((account) => !account.rails);
        if (isRailsMissing) {
            setApiError("Please select rails for all bank accounts.");
            hasErrors = true;
        }

        if (hasErrors) {
            setLoading(false);
            return;
        }

        const beneficiaryData = {
            first_name: formik.values.first_name,
            middle_name: formik.values.middle_name,
            last_name: formik.values.last_name,
            institution_name: formik.values.institution_name,
            country_id: formik.values.country_id,
            country_phone_code: formik.values.country_phone_code,
            phone_number: formik.values.phone_number,
            email: formik.values.email,
            beneftype: formik.values.beneftype,
            state: formik.values.state,
            city: formik.values.city,
            street: formik.values.street,
            postalcode: formik.values.postalcode,
            nationality_id: formik.values.nationality_id,
            idType: formik.values.beneficiary_id_type,
            idNumber: formik.values.beneficiary_id_number,
            status: 1,
            address: "",
            nic_bcc_code: formik.values.nic_bcc_code,
            banks: [],
            partner_id: whiteLabelledPartnerIdRef.current,
            password: formik.values.password,
            confirmPassword: formik.values.confirmPassword,
        };

        bankAccounts.forEach((account) => {
            let bankDetails = {
                rails: account.rails,
                currency_code: account.currency,
                payment_method: account.paymentMethod,
                benef_iban: account.iban,
                swift_code: account.swift,
                intermediary_bank_swift: account.intermediarySwift,
                routing_number: account.routingNumber,
                bank_acc_no: account.accountNumber,
                sort_code: account.sortCode,
                bank_name: account.bankName,
                ifsc: account.ifsc,
                bankCode: account.bankCode,
                bic_ncc_code: formik.values.bic_ncc_code,
            };

            beneficiaryData.banks.push(bankDetails);
        });

        try {
            const response = await fetch(
                `${API_URL}/beneficiaries/create-requestremit-benef`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${bearerTokenRef.current}`,
                    },
                    body: JSON.stringify(beneficiaryData),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                console.log("error", result.message);
                if (result.message && result.message.phone_number) {
                    const errorMessages = result.message.phone_number.join(", ");
                    toast.error(errorMessages);
                } else if (result.message && result.message.email) {
                    const errorMessages = result.message.email.join(", ");
                    toast.error(errorMessages);
                } else if (result.message && result.message.password) {
                    const errorMessages = result.message.password.join(", ");
                    toast.error(errorMessages);
                } else {
                    const errorMessage = result.message || "Failed to submit beneficiary details.";
                    toast.error(errorMessage);
                }

                setLoading(false);
                return;
            }

            if (result.benefCode) {
                setBenefCode(result.benefCode);
                setShowSuccessPopup(true);
            } else {
                toast.success("Beneficiary and bank details submitted successfully!");
            }
        } catch (error) {
            console.error("Network/Server Error:", error);
            toast.error(`Failed to submit details. Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Navigation functions
    const nextStep = () => {
        const errors = {};

        if (!formik.values.beneftype) {
            errors.beneftype = "Beneficiary type is required";
        }

        if (!emailVerified) {
            errors.email = "Email verification is required";
        }

        if (!phoneVerified) {
            errors.phone_number = "Phone verification is required";
        }

        if (Object.keys(errors).length > 0) {
            Object.keys(errors).forEach((key) => {
                formik.setFieldError(key, errors[key]);
            });
            return;
        }

        if (!isFormValid) {
            formik.setFieldError("general", "Please fill all required fields before proceeding");
            return;
        }

        setStep(step + 1);
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const handleCancel = () => {
        navigate("/");
    };

    const copyBenefCode = async () => {
        try {
            await navigator.clipboard.writeText(benefCode);
            toast.success("Beneficiary code copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy text: ", err);
            toast.error("Failed to copy code");
        }
    };

    const handleContinueToDashboard = () => {
        setShowSuccessPopup(false);
        navigate("/dashboard");
    };

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        initialRenderRef.current = false;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Fetch banks based on currency
    useEffect(() => {
        const fetchBanks = async () => {
            if (!currency) return;

            setLoadingBanks(true);
            try {
                const token = await getBearerToken();
                let endpoint = "";

                switch (currency) {
                    case "BDT":
                        endpoint = "int-banks/BDT";
                        break;
                    case "PKR":
                        endpoint = "int-banks/PKR";
                        break;
                    case "KES":
                        endpoint = "currency-payout-banks/KES";
                        break;
                    case "NPR":
                        endpoint = "currency-payout-banks/NPR";
                        break;
                    default:
                        endpoint = `currency-payout-banks/${currency}`;
                }

                const response = await fetch(`${API_URL}/${endpoint}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    const banksData = result.data || [];

                    switch (currency) {
                        case "BDT":
                            setBdtBanks(banksData);
                            break;
                        case "PKR":
                            setPkrBanks(banksData);
                            break;
                        case "KES":
                            setKesBanks(banksData);
                            break;
                        case "NPR":
                            setNprBanks(banksData);
                            break;
                        default:
                            setBanks(banksData);
                    }
                }
            } catch (error) {
                console.error(`Error fetching ${currency} banks:`, error);
                toast.error(`Failed to load ${currency} banks`);
            } finally {
                setLoadingBanks(false);
            }
        };

        fetchBanks();
    }, [currency]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-6 px-4 sm:px-6 lg:px-8">
            <ToastContainer
                position="top-right"
                autoClose={5000}
                toastClassName="rounded-xl shadow-lg"
            />

            {/* Verification Popups */}
            <VerificationPopup
                type="email"
                isOpen={showEmailPopup}
                onClose={() => setShowEmailPopup(false)}
                onVerify={handleVerifyEmailPasscode}
                isLoading={emailVerificationLoading}
                resendLoading={resendEmailLoading}
                onResend={handleSendEmailPasscode}
            />

            <VerificationPopup
                type="phone"
                isOpen={showPhonePopup}
                onClose={() => setShowPhonePopup(false)}
                onVerify={handleVerifyPhoneOTP}
                isLoading={phoneVerificationLoading}
                resendLoading={resendPhoneLoading}
                onResend={handleSendPhoneOTP}
            />

            {/* Success Popup */}
            <AnimatePresence>
                {showSuccessPopup && (
                    <SuccessPopup
                        benefCode={benefCode}
                        onClose={() => setShowSuccessPopup(false)}
                        onCopy={copyBenefCode}
                        onContinue={handleContinueToDashboard}
                    />
                )}
            </AnimatePresence>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center"
                        >
                            <div className="relative">
                                <ClipLoader size={60} color="#3B82F6" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin opacity-25"></div>
                                </div>
                            </div>
                            <p className="mt-6 text-gray-700 font-medium text-lg">
                                Processing your request...
                            </p>
                            <p className="text-sm text-gray-400 mt-1">Please wait a moment</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-lg"
            >
                {/* Header Section */}
                <motion.div
                    variants={itemVariants}
                    className="relative px-8 py-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 overflow-hidden"
                >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full" />

                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center"
                        >
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mr-4">
                                <FaMoneyBillWave className="text-white text-2xl" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
                                <p className="text-blue-100 text-sm mt-0.5">
                                    Create a new beneficiary account
                                </p>
                            </div>
                        </motion.div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancel}
                            className="flex items-center px-4 py-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                        >
                            <FaArrowLeft className="mr-2" /> Sign in
                        </motion.button>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative mt-6">
                        <div className="flex items-center gap-4">
                            {[
                                { number: 1, label: "Personal Details", icon: <FaUser className="text-sm" /> },
                                { number: 2, label: "Bank Information", icon: <FaUniversity className="text-sm" /> },
                            ].map((stepItem, index) => (
                                <div key={stepItem.number} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${step >= stepItem.number
                                                ? "bg-white text-blue-600 border-white shadow-lg"
                                                : "border-white/30 text-white/50"
                                                }`}
                                        >
                                            {step >= stepItem.number ? (
                                                <span className="text-sm font-bold">{stepItem.number}</span>
                                            ) : (
                                                <span className="text-sm">{stepItem.number}</span>
                                            )}
                                        </div>
                                        <div className={`text-xs mt-1.5 font-medium ${step >= stepItem.number ? "text-white" : "text-white/50"}`}>
                                            {stepItem.label}
                                        </div>
                                    </div>
                                    {index < 1 && (
                                        <div className="flex-1 mx-3">
                                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-white rounded-full transition-all duration-500 ${step > stepItem.number ? "w-full" : "w-0"
                                                        }`}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Form Content */}
                <div className="flex-1 overflow-auto p-8 bg-gradient-to-b from-white to-slate-50/50">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={formVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="h-full"
                            >
                                <form onSubmit={formik.handleSubmit} className="space-y-8">
                                    <motion.div
                                        variants={containerVariants}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        {/* Beneficiary Type */}
                                        <motion.div
                                            variants={itemVariants}
                                            className="md:col-span-2"
                                        >
                                            <label className="block text-sm font-semibold text-gray-700 mb-4">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-lg">👤</span>
                                                    Beneficiary Type
                                                    <span className="text-red-500 ml-1">*</span>
                                                </span>
                                            </label>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Individual Card Radio */}
                                                <label
                                                    className={`relative flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${formik.values.beneftype === "individual"
                                                        ? "border-blue-500 bg-blue-50/80 shadow-lg shadow-blue-100"
                                                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="beneftype"
                                                        value="individual"
                                                        checked={formik.values.beneftype === "individual"}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        className="sr-only"
                                                    />
                                                    <div className="flex items-center space-x-3">
                                                        <div
                                                            className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${formik.values.beneftype === "individual"
                                                                ? "border-blue-500 bg-blue-500 shadow-md"
                                                                : "border-gray-300"
                                                                }`}
                                                        >
                                                            {formik.values.beneftype === "individual" && (
                                                                <FaCheck className="text-white text-xs" />
                                                            )}
                                                        </div>
                                                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                                                            <MdPerson className={`text-xl ${formik.values.beneftype === "individual" ? "text-blue-600" : "text-gray-400"}`} />
                                                        </div>
                                                        <span
                                                            className={`font-semibold ${formik.values.beneftype === "individual"
                                                                ? "text-blue-700"
                                                                : "text-gray-700"
                                                                }`}
                                                        >
                                                            Individual
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-3 ml-11">
                                                        For personal beneficiaries
                                                    </p>
                                                </label>

                                                {/* Institution Card Radio */}
                                                <label
                                                    className={`relative flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${formik.values.beneftype === "institution"
                                                        ? "border-purple-500 bg-purple-50/80 shadow-lg shadow-purple-100"
                                                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="beneftype"
                                                        value="institution"
                                                        checked={formik.values.beneftype === "institution"}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        className="sr-only"
                                                    />
                                                    <div className="flex items-center space-x-3">
                                                        <div
                                                            className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${formik.values.beneftype === "institution"
                                                                ? "border-purple-500 bg-purple-500 shadow-md"
                                                                : "border-gray-300"
                                                                }`}
                                                        >
                                                            {formik.values.beneftype === "institution" && (
                                                                <FaCheck className="text-white text-xs" />
                                                            )}
                                                        </div>
                                                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                                                            <MdBusiness className={`text-xl ${formik.values.beneftype === "institution" ? "text-purple-600" : "text-gray-400"}`} />
                                                        </div>
                                                        <span
                                                            className={`font-semibold ${formik.values.beneftype === "institution"
                                                                ? "text-purple-700"
                                                                : "text-gray-700"
                                                                }`}
                                                        >
                                                            Institution
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-3 ml-11">
                                                        For companies & organizations
                                                    </p>
                                                </label>
                                            </div>

                                            {formik.errors.beneftype && formik.touched.beneftype && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-red-500 text-sm mt-3 flex items-center gap-2"
                                                >
                                                    <span className="text-sm">⚠️</span>
                                                    {formik.errors.beneftype}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        {/* Personal/Institution Information */}
                                        <motion.div
                                            variants={itemVariants}
                                            className="md:col-span-2"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
                                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 whitespace-nowrap">
                                                    {formik.values.beneftype === "institution" ? (
                                                        <>
                                                            <MdBusiness className="text-purple-600" />
                                                            Institution Information
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MdPerson className="text-blue-600" />
                                                            Personal Information
                                                        </>
                                                    )}
                                                </h3>
                                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
                                            </div>
                                        </motion.div>

                                        {formik.values.beneftype === "institution" ? (
                                            <motion.div
                                                variants={itemVariants}
                                                className="md:col-span-2"
                                            >
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Institution Name
                                                    <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <MdBusiness className="text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="institution_name"
                                                        value={formik.values.institution_name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        placeholder="Enter institution name"
                                                        className="w-full pl-11 pr-4 py-4 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                </div>
                                                {formik.errors.institution_name && formik.touched.institution_name && (
                                                    <motion.p
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-red-500 text-sm mt-2"
                                                    >
                                                        {formik.errors.institution_name}
                                                    </motion.p>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <>
                                                <motion.div variants={itemVariants}>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        First Name
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <MdPerson className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            name="first_name"
                                                            value={formik.values.first_name}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            placeholder="Enter first name"
                                                            className="w-full pl-11 pr-4 py-4 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                        />
                                                    </div>
                                                    {formik.errors.first_name && formik.touched.first_name && (
                                                        <motion.p
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="text-red-500 text-sm mt-2"
                                                        >
                                                            {formik.errors.first_name}
                                                        </motion.p>
                                                    )}
                                                </motion.div>

                                                <motion.div variants={itemVariants}>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Middle Name <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="middle_name"
                                                        value={formik.values.middle_name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        placeholder="Enter middle name"
                                                        className="w-full px-4 py-4 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                </motion.div>

                                                <motion.div variants={itemVariants}>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Last Name
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <MdPerson className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            name="last_name"
                                                            value={formik.values.last_name}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            placeholder="Enter last name"
                                                            className="w-full pl-11 pr-4 py-4 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                        />
                                                    </div>
                                                    {formik.errors.last_name && formik.touched.last_name && (
                                                        <motion.p
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="text-red-500 text-sm mt-2"
                                                        >
                                                            {formik.errors.last_name}
                                                        </motion.p>
                                                    )}
                                                </motion.div>
                                            </>
                                        )}

                                        {/* Contact Information */}
                                        <motion.div
                                            variants={itemVariants}
                                            className="md:col-span-2"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
                                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 whitespace-nowrap">
                                                    <FaEnvelope className="text-blue-600" />
                                                    Contact Information
                                                </h3>
                                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
                                            </div>
                                        </motion.div>

                                        {/* Email with verification */}
                                        <motion.div
                                            variants={itemVariants}
                                            className="md:col-span-2"
                                        >
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email Address
                                                <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <div className="relative flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <MdEmail className="text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formik.values.email}
                                                        onChange={(e) => {
                                                            // First update the form value
                                                            formik.handleChange(e);
                                                            // Then reset verification if it was verified
                                                            if (emailVerified) {
                                                                setEmailVerified(false);
                                                                localStorage.removeItem("verified_email");
                                                                toast.info("Email changed. Please verify again.");
                                                            }
                                                        }}
                                                        onBlur={formik.handleBlur}
                                                        placeholder="Enter email address"
                                                        className={`w-full pl-11 pr-4 py-4 text-sm text-gray-900 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${emailVerified ? 'border-green-400 bg-green-50/50' : 'border-gray-200'
                                                            }`}
                                                    />
                                                    {emailVerified && (
                                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                                            <MdVerified className="text-green-500 text-xl" />
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleSendEmailPasscode}
                                                    disabled={!isEmailFieldFilled() || emailVerified || resendEmailLoading}
                                                    className={`px-6 py-4 rounded-xl transition-all duration-300 flex items-center justify-center min-w-[140px] font-medium ${emailVerified
                                                        ? "bg-green-500 text-white cursor-default shadow-lg shadow-green-200"
                                                        : !isEmailFieldFilled() || resendEmailLoading
                                                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                                                        }`}
                                                >
                                                    {resendEmailLoading ? (
                                                        <ClipLoader size={20} color="#ffffff" />
                                                    ) : emailVerified ? (
                                                        <span className="flex items-center gap-2">
                                                            <FaCheckCircle className="text-white" />
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        "Verify Email"
                                                    )}
                                                </button>
                                            </div>
                                            {formik.errors.email && formik.touched.email && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-red-500 text-sm mt-2 flex items-center gap-2"
                                                >
                                                    <span className="text-sm">⚠️</span>
                                                    {formik.errors.email}
                                                </motion.p>
                                            )}
                                            {emailVerified && (
                                                <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                                                    <FaCheckCircle />
                                                    Email verified successfully
                                                </p>
                                            )}
                                        </motion.div>

                                        {/* Phone with verification */}
                                        <motion.div
                                            variants={itemVariants}
                                            className="md:col-span-2"
                                        >
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Phone Number
                                                <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <div className="w-full sm:w-1/3">
                                                        <Select
                                                            key={`phone-code-${formik.values.country_phone_code}`}
                                                            className="text-sm"
                                                            classNamePrefix="select"
                                                            options={countriesOptions.map((country) => ({
                                                                value: country.phoneCode,
                                                                label: `${country.phoneCode} (${country.label})`,
                                                                country: {
                                                                    id: country.id,
                                                                    name: country.label,
                                                                    flag_url: country.flag_url,
                                                                    phone_code: country.phoneCode,
                                                                },
                                                            }))}
                                                            placeholder="Select code..."
                                                            isSearchable
                                                            onChange={(selectedOption) => {
                                                                formik.setFieldValue("country_phone_code", selectedOption?.value || "");
                                                                formik.setFieldValue("phone_code_country_id", selectedOption?.country?.id || "");
                                                                if (phoneVerified) setPhoneVerified(false);
                                                            }}
                                                            value={(() => {
                                                                const selectedCountry = countriesOptions.find(
                                                                    (c) => c.phoneCode === formik.values.country_phone_code
                                                                );
                                                                return selectedCountry
                                                                    ? {
                                                                        value: selectedCountry.phoneCode,
                                                                        label: `${selectedCountry.phoneCode} (${selectedCountry.label})`,
                                                                        country: {
                                                                            id: selectedCountry.id,
                                                                            name: selectedCountry.label,
                                                                            flag_url: selectedCountry.flag_url,
                                                                            phone_code: selectedCountry.phoneCode,
                                                                        },
                                                                    }
                                                                    : null;
                                                            })()}
                                                            formatOptionLabel={({ country, label }) => (
                                                                <div className="flex items-center gap-2">
                                                                    {country?.flag_url && (
                                                                        <img
                                                                            src={country.flag_url}
                                                                            alt="Flag"
                                                                            className="w-6 h-4 rounded-sm object-cover"
                                                                            onError={(e) => {
                                                                                e.target.style.display = "none";
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <span>{label}</span>
                                                                </div>
                                                            )}
                                                            styles={customStyles}
                                                            isLoading={countriesLoading}
                                                        />
                                                    </div>

                                                    <div className="relative flex-1">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <FaPhone className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            name="phone_number"
                                                            value={formik.values.phone_number}
                                                            onChange={(e) => {
                                                                //  First update the form value
                                                                formik.handleChange(e);
                                                                // Then reset verification if it was verified
                                                                if (phoneVerified) {
                                                                    setPhoneVerified(false);
                                                                    localStorage.removeItem("verified_phone");
                                                                    localStorage.removeItem("verified_country_code");
                                                                    toast.info("Phone number changed. Please verify again.");
                                                                }
                                                            }}
                                                            onBlur={formik.handleBlur}
                                                            placeholder="Enter phone number"
                                                            className={`w-full pl-11 pr-4 py-4 text-sm text-gray-900 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${phoneVerified ? 'border-green-400 bg-green-50/50' : 'border-gray-200'
                                                                }`}
                                                        />
                                                        {phoneVerified && (
                                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                                                <MdVerified className="text-green-500 text-xl" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={handleSendPhoneOTP}
                                                        disabled={!isPhoneFieldFilled() || phoneVerified || resendPhoneLoading}
                                                        className={`px-6 py-4 rounded-xl transition-all duration-300 flex items-center justify-center min-w-[140px] font-medium ${phoneVerified
                                                            ? "bg-green-500 text-white cursor-default shadow-lg shadow-green-200"
                                                            : !isPhoneFieldFilled() || resendPhoneLoading
                                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                                                            }`}
                                                    >
                                                        {resendPhoneLoading ? (
                                                            <ClipLoader size={20} color="#ffffff" />
                                                        ) : phoneVerified ? (
                                                            <span className="flex items-center gap-2">
                                                                <FaCheckCircle className="text-white" />
                                                                Verified
                                                            </span>
                                                        ) : (
                                                            "Verify Phone"
                                                        )}
                                                    </button>
                                                </div>

                                                {formik.errors.phone_number && formik.touched.phone_number && (
                                                    <motion.p
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-red-500 text-sm mt-1 flex items-center gap-2"
                                                    >
                                                        <span className="text-sm">⚠️</span>
                                                        {formik.errors.phone_number}
                                                    </motion.p>
                                                )}
                                                {phoneVerified && (
                                                    <p className="text-green-600 text-sm mt-1 flex items-center gap-2">
                                                        <FaCheckCircle />
                                                        Phone number verified successfully
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Password Fields */}
                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <span className="flex items-center gap-2">
                                                    <FaLock className="text-blue-600" />
                                                    Password
                                                    <span className="text-red-500 ml-1">*</span>
                                                </span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    autoComplete="new-password"
                                                    value={formik.values.password}
                                                    onChange={(e) => {
                                                        formik.handleChange(e);
                                                        validatePassword(e.target.value);
                                                    }}
                                                    onBlur={formik.handleBlur}
                                                    placeholder="Create a strong password"
                                                    className="w-full px-4 py-4 pr-12 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                                </button>
                                            </div>

                                            {/* Password Validation Rules */}
                                            {formik.values.password && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    className="mt-4 space-y-2.5 bg-gray-50/70 rounded-xl p-4 border border-gray-200"
                                                >
                                                    <div className={`flex items-center text-sm ${passwordErrors.length ? "text-green-600" : "text-red-500"}`}>
                                                        <div className={`w-2 h-2 rounded-full mr-2.5 ${passwordErrors.length ? "bg-green-500" : "bg-red-500"}`}></div>
                                                        At least 12 characters
                                                    </div>
                                                    <div className={`flex items-center text-sm ${passwordErrors.uppercase ? "text-green-600" : "text-red-500"}`}>
                                                        <div className={`w-2 h-2 rounded-full mr-2.5 ${passwordErrors.uppercase ? "bg-green-500" : "bg-red-500"}`}></div>
                                                        One uppercase letter (A-Z)
                                                    </div>
                                                    <div className={`flex items-center text-sm ${passwordErrors.lowercase ? "text-green-600" : "text-red-500"}`}>
                                                        <div className={`w-2 h-2 rounded-full mr-2.5 ${passwordErrors.lowercase ? "bg-green-500" : "bg-red-500"}`}></div>
                                                        One lowercase letter (a-z)
                                                    </div>
                                                    <div className={`flex items-center text-sm ${passwordErrors.number ? "text-green-600" : "text-red-500"}`}>
                                                        <div className={`w-2 h-2 rounded-full mr-2.5 ${passwordErrors.number ? "bg-green-500" : "bg-red-500"}`}></div>
                                                        One number (0-9)
                                                    </div>
                                                    <div className={`flex items-center text-sm ${passwordErrors.special ? "text-green-600" : "text-red-500"}`}>
                                                        <div className={`w-2 h-2 rounded-full mr-2.5 ${passwordErrors.special ? "bg-green-500" : "bg-red-500"}`}></div>
                                                        One special character (!@#$%^&* etc.)
                                                    </div>
                                                </motion.div>
                                            )}

                                            {formik.errors.password && formik.touched.password && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-red-500 text-sm mt-2 flex items-center gap-2"
                                                >
                                                    <span className="text-sm">⚠️</span>
                                                    {formik.errors.password}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <span className="flex items-center gap-2">
                                                    <FaLock className="text-indigo-600" />
                                                    Confirm Password
                                                    <span className="text-red-500 ml-1">*</span>
                                                </span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    name="confirmPassword"
                                                    autoComplete="new-password"
                                                    value={formik.values.confirmPassword}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    placeholder="Confirm your password"
                                                    className="w-full px-4 py-4 pr-12 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                                </button>
                                            </div>

                                            {formik.values.confirmPassword && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="mt-2"
                                                >
                                                    <div className={`flex items-center text-sm ${formik.values.password === formik.values.confirmPassword ? "text-green-600" : "text-red-500"}`}>
                                                        <div className={`w-2 h-2 rounded-full mr-2.5 ${formik.values.password === formik.values.confirmPassword ? "bg-green-500" : "bg-red-500"}`}></div>
                                                        {formik.values.password === formik.values.confirmPassword
                                                            ? "Passwords match ✓"
                                                            : "Passwords must match"}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {formik.errors.confirmPassword && formik.touched.confirmPassword && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-red-500 text-sm mt-2 flex items-center gap-2"
                                                >
                                                    <span className="text-sm">⚠️</span>
                                                    {formik.errors.confirmPassword}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        {/* Address Information */}
                                        <motion.div
                                            variants={itemVariants}
                                            className="md:col-span-2"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
                                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 whitespace-nowrap">
                                                    <FaMapMarkerAlt className="text-blue-600" />
                                                    Address Information
                                                </h3>
                                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
                                            </div>
                                        </motion.div>

                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <span className="flex items-center gap-2">
                                                    <FaGlobe className="text-blue-600" />
                                                    Country
                                                    <span className="text-red-500 ml-1">*</span>
                                                </span>
                                            </label>
                                            <Select
                                                key={`country-${formik.values.country_id}`}
                                                className="text-sm"
                                                classNamePrefix="select"
                                                options={countriesOptions}
                                                placeholder={countriesLoading ? "Loading countries..." : "Select Country..."}
                                                isSearchable
                                                isLoading={countriesLoading}
                                                onChange={handleCountryChange}
                                                value={
                                                    countriesOptions.find(
                                                        (c) => c.value === parseInt(formik.values.country_id) || c.id === parseInt(formik.values.country_id)
                                                    ) || null
                                                }
                                                formatOptionLabel={(option) => (
                                                    <div className="flex items-center gap-2">
                                                        {option.flag_url && (
                                                            <img
                                                                src={option.flag_url}
                                                                alt={`${option.label} flag`}
                                                                className="w-5 h-4 rounded-sm object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = "none";
                                                                }}
                                                            />
                                                        )}
                                                        <span>{option.label}</span>
                                                    </div>
                                                )}
                                                styles={{
                                                    ...customStyles,
                                                    option: (provided, state) => ({
                                                        ...provided,
                                                        backgroundColor: state.isSelected
                                                            ? "#3B82F6"
                                                            : state.isFocused
                                                                ? "#F3F4F6"
                                                                : "white",
                                                        color: state.isSelected ? "white" : "#111827",
                                                        padding: "12px 16px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        "&:active": {
                                                            backgroundColor: "#3B82F6",
                                                            color: "white",
                                                        },
                                                    }),
                                                    singleValue: (provided) => ({
                                                        ...provided,
                                                        display: "flex",
                                                        alignItems: "center",
                                                    }),
                                                }}
                                            />
                                            {formik.errors.country_id && formik.touched.country_id && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-red-500 text-sm mt-2 flex items-center gap-2"
                                                >
                                                    <span className="text-sm">⚠️</span>
                                                    {formik.errors.country_id}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                State/Province
                                                {hasStates && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            {statesLoading ? (
                                                <div className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 flex items-center justify-center">
                                                    <ClipLoader size={20} color="#3B82F6" />
                                                    <span className="ml-2 text-gray-500 text-sm">Loading states...</span>
                                                </div>
                                            ) : hasStates && states && states.length > 0 ? (
                                                <Select
                                                    className="text-sm"
                                                    classNamePrefix="select"
                                                    options={states.map((state) => ({
                                                        value: state.name,
                                                        label: state.name,
                                                    }))}
                                                    placeholder="Select State..."
                                                    isSearchable
                                                    value={
                                                        formik.values.state
                                                            ? {
                                                                value: formik.values.state,
                                                                label: formik.values.state
                                                            }
                                                            : null
                                                    }
                                                    onChange={handleStateChange}
                                                    styles={customStyles}
                                                    isClearable
                                                />
                                            ) : hasStates && states?.length === 0 ? (
                                                <div>
                                                    <input
                                                        type="text"
                                                        name="state"
                                                        value={formik.values.state}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        placeholder="Enter state/province"
                                                        className="w-full px-4 py-3 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                    {/* Small message below the input */}
                                                    <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                                                        <span>ℹ️</span>
                                                        No states found for selected country. Please enter manually.
                                                    </p>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={formik.values.state}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    placeholder="Enter state/province"
                                                    className="w-full px-4 py-3 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                />
                                            )}
                                        </motion.div>

                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                City
                                                <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            {loadingCities ? (
                                                <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50/50 flex items-center justify-center">
                                                    <ClipLoader size={20} color="#3B82F6" />
                                                    <span className="ml-2 text-gray-500 text-sm">Loading cities...</span>
                                                </div>
                                            ) : hasCities && cities && Array.isArray(cities) && cities.length > 0 ? (
                                                <Select
                                                    className="text-sm"
                                                    classNamePrefix="select"
                                                    options={cities.map((city) => ({
                                                        value: city.name || city.id,
                                                        label: city.name,
                                                    }))}
                                                    placeholder="Select City..."
                                                    isSearchable
                                                    value={
                                                        formik.values.city
                                                            ? {
                                                                value: formik.values.city,
                                                                label: formik.values.city
                                                            }
                                                            : null
                                                    }
                                                    onChange={(selectedOption) => {
                                                        formik.setFieldValue("city", selectedOption?.value || "");
                                                    }}
                                                    styles={customStyles}
                                                    isClearable
                                                />
                                            ) : hasCities && (!cities || cities.length === 0) ? (
                                                <div>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={formik.values.city}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        placeholder="Enter city"
                                                        className="w-full px-4 py-3 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                    <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                                                        <span>ℹ️</span>
                                                        No cities found. Please enter manually.
                                                    </p>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formik.values.city}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    placeholder="Enter city"
                                                    className="w-full px-4 py-3 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                />
                                            )}
                                            {formik.errors.city && formik.touched.city && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-red-500 text-sm mt-2 flex items-center gap-2"
                                                >
                                                    <span className="text-sm">⚠️</span>
                                                    {formik.errors.city}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Street Address
                                                <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <FaMapMarkerAlt className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="street"
                                                    value={formik.values.street}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    placeholder="Enter street address"
                                                    className="w-full pl-11 pr-4 py-4 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                />
                                            </div>
                                            {formik.errors.street && formik.touched.street && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-red-500 text-sm mt-2 flex items-center gap-2"
                                                >
                                                    <span className="text-sm">⚠️</span>
                                                    {formik.errors.street}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Postal Code
                                            </label>
                                            <input
                                                type="text"
                                                name="postalcode"
                                                value={formik.values.postalcode}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                placeholder="Enter postal code"
                                                className="w-full px-4 py-4 text-sm text-gray-900 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            />
                                        </motion.div>

                                        {/* Nationality */}
                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Nationality
                                            </label>
                                            <Select
                                                className="text-sm"
                                                classNamePrefix="select"
                                                options={nationalities}
                                                placeholder={loadingNationalities ? "Loading nationalities..." : "Select Nationality..."}
                                                isSearchable
                                                isLoading={loadingNationalities}
                                                onChange={(selectedOption) => {
                                                    formik.setFieldValue("nationality_id", selectedOption?.value || "");
                                                }}
                                                styles={customStyles}
                                            />
                                        </motion.div>
                                    </motion.div>

                                    {/* Form Actions */}
                                    <motion.div
                                        variants={itemVariants}
                                        className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t-2 border-gray-200"
                                    >
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">i</span>
                                            All fields marked with <span className="text-red-500">*</span> are required
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                disabled={!isFormValid}
                                                className={`px-8 py-3 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 ${isFormValid
                                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                                                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                    }`}
                                            >
                                                Continue
                                                <FaChevronRight className="text-sm" />
                                            </button>
                                        </div>
                                    </motion.div>
                                </form>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={formVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="h-full"
                            >
                                <div className="space-y-8">
                                    <motion.div
                                        variants={containerVariants}
                                        className="grid grid-cols-1 gap-8"
                                    >
                                        <motion.div variants={itemVariants}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                                                    <FaCreditCard className="text-blue-600 text-xl" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-800">
                                                        Bank Account Information
                                                    </h3>
                                                    <p className="text-gray-500 text-sm">
                                                        Add one or more bank accounts for this beneficiary
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Bank Accounts */}
                                        {bankAccounts.map((account, index) => (
                                            <motion.div
                                                key={index}
                                                variants={itemVariants}
                                                className="relative border-2 border-gray-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                                            >
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <h4 className="text-md font-semibold text-gray-800">
                                                            Bank Account
                                                        </h4>
                                                    </div>
                                                    {bankAccounts.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeBankAccount(index)}
                                                            className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
                                                        >
                                                            <FaTrash className="text-sm" />
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Bank Account Fields */}
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Select Rails */}
                                                        <div>
                                                            <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                Select Rails
                                                                <span className="text-red-500 ml-1">*</span>
                                                            </label>
                                                            <select
                                                                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                value={account.rails}
                                                                onChange={(e) =>
                                                                    handleBankAccountChange(index, "rails", e.target.value)
                                                                }
                                                                required
                                                            >
                                                                <option value="">Select Rails</option>
                                                                <option value="Local">
                                                                    {currency === "GBP"
                                                                        ? "FPS"
                                                                        : currency === "EUR"
                                                                            ? "SEPA"
                                                                            : currency === "USD"
                                                                                ? "ACH"
                                                                                : "Bank"}
                                                                </option>
                                                                <option value="Swift">Swift</option>
                                                                <option value="Mobile">Mobile</option>
                                                            </select>
                                                        </div>

                                                        {/* Select Currency */}
                                                        {account.rails !== "Mobile" && (
                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                    Select Currency
                                                                </label>
                                                                <select
                                                                    className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                    value={currency}
                                                                    onChange={(e) => {
                                                                        handleCurrencyChange(e);
                                                                        handleBankAccountChange(index, "currency", e.target.value);
                                                                    }}
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

                                                    {/* Basic bank account fields */}
                                                    {account.rails && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                    Account Number
                                                                    <span className="text-red-500 ml-1">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                    placeholder="Enter account number"
                                                                    value={account.accountNumber}
                                                                    onChange={(e) =>
                                                                        handleBankAccountChange(index, "accountNumber", e.target.value)
                                                                    }
                                                                    required
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                    Bank Name
                                                                    {account.rails && account.rails !== "Mobile" && (
                                                                        <span className="text-red-500 ml-1">*</span>
                                                                    )}
                                                                </label>
                                                                {loadingBanks ? (
                                                                    <div className="w-full border-2 border-gray-200 rounded-xl p-4 bg-gray-50/50 flex items-center justify-center">
                                                                        <ClipLoader size={20} color="#3B82F6" />
                                                                        <span className="ml-2 text-gray-600 text-sm">Loading banks...</span>
                                                                    </div>
                                                                ) : getBanksForCurrency() && getBanksForCurrency().length > 0 ? (
                                                                    <select
                                                                        className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                        value={account.bankCode || account.bankName || ""}
                                                                        onChange={(e) => {
                                                                            const selectedValue = e.target.value;
                                                                            if (selectedValue) {
                                                                                const banksList = getBanksForCurrency();
                                                                                const selectedBank = banksList.find(
                                                                                    (bank) =>
                                                                                        bank.bank_code === selectedValue ||
                                                                                        bank.code === selectedValue ||
                                                                                        bank.id === selectedValue
                                                                                );

                                                                                if (selectedBank) {
                                                                                    handleBankAccountChange(index, "bankCode", selectedValue);
                                                                                    handleBankAccountChange(
                                                                                        index,
                                                                                        "bankName",
                                                                                        selectedBank.bank_name || selectedBank.name || selectedBank.bank_name
                                                                                    );
                                                                                } else {
                                                                                    handleBankAccountChange(index, "bankName", selectedValue);
                                                                                }
                                                                            } else {
                                                                                handleBankAccountChange(index, "bankCode", "");
                                                                                handleBankAccountChange(index, "bankName", "");
                                                                            }
                                                                        }}
                                                                        required={account.rails && account.rails !== "Mobile"}
                                                                    >
                                                                        <option value="">Select Bank</option>
                                                                        {getBanksForCurrency().map((bank) => {
                                                                            const bankKey = bank.bank_code || bank.code || bank.id;
                                                                            const bankName = bank.bank_name || bank.name;
                                                                            return (
                                                                                <option key={bankKey} value={bankKey}>
                                                                                    {bankName}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                ) : currency ? (
                                                                    <div>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                            placeholder="Enter bank name"
                                                                            value={account.bankName}
                                                                            onChange={(e) => {
                                                                                handleBankAccountChange(index, "bankName", e.target.value);
                                                                                handleBankAccountChange(index, "bankCode", "");
                                                                            }}
                                                                            required={account.rails && account.rails !== "Mobile"}
                                                                        />
                                                                        <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                                                                            <span>ℹ️</span>
                                                                            No banks found for {currency}. Please enter manually.
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                        placeholder="Enter bank name"
                                                                        value={account.bankName}
                                                                        onChange={(e) => {
                                                                            handleBankAccountChange(index, "bankName", e.target.value);
                                                                            handleBankAccountChange(index, "bankCode", "");
                                                                        }}
                                                                        required={account.rails && account.rails !== "Mobile"}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Currency-specific fields */}
                                                    {account.rails && (
                                                        <>
                                                            {/* BDT specific fields */}
                                                            {currency === "BDT" && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                            Routing Number (Bank Code)
                                                                            <span className="text-red-500 ml-1">*</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                            placeholder="Enter routing number"
                                                                            value={account.bankCode}
                                                                            onChange={(e) =>
                                                                                handleBankAccountChange(index, "bankCode", e.target.value)
                                                                            }
                                                                            required
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                            Branch Code
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                            placeholder="Enter branch code"
                                                                            value={account.branchCode}
                                                                            onChange={(e) =>
                                                                                handleBankAccountChange(index, "branchCode", e.target.value)
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* INR specific fields */}
                                                            {currency === "INR" && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                            IFSC Code
                                                                            <span className="text-red-500 ml-1">*</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                            placeholder="Enter IFSC code"
                                                                            value={account.ifsc}
                                                                            onChange={(e) =>
                                                                                handleBankAccountChange(index, "ifsc", e.target.value)
                                                                            }
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* PKR specific fields */}
                                                            {currency === "PKR" && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                            Bank Code
                                                                            <span className="text-red-500 ml-1">*</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                            placeholder="Enter bank code"
                                                                            value={account.bankCode}
                                                                            onChange={(e) =>
                                                                                handleBankAccountChange(index, "bankCode", e.target.value)
                                                                            }
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* USD specific fields */}
                                                            {currency === "USD" && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                            Routing Number
                                                                            <span className="text-red-500 ml-1">*</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                            placeholder="Enter routing number"
                                                                            value={account.routingNumber}
                                                                            onChange={(e) =>
                                                                                handleBankAccountChange(index, "routingNumber", e.target.value)
                                                                            }
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* GBP specific fields */}
                                                            {currency === "GBP" && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                            Sort Code
                                                                            <span className="text-red-500 ml-1">*</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                            placeholder="Enter sort code"
                                                                            value={account.sortCode}
                                                                            onChange={(e) =>
                                                                                handleBankAccountChange(index, "sortCode", e.target.value)
                                                                            }
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* EUR specific fields */}
                                                            {currency === "EUR" && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                            IBAN
                                                                            <span className="text-red-500 ml-1">*</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                            placeholder="Enter IBAN"
                                                                            value={account.iban}
                                                                            onChange={(e) =>
                                                                                handleBankAccountChange(index, "iban", e.target.value)
                                                                            }
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Beneficiary ID fields for BDT, INR, PKR */}
                                                    {(currency === "BDT" || currency === "INR" || currency === "PKR") && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-dashed border-gray-200 pt-4 mt-2">
                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                    Beneficiary ID Type
                                                                    <span className="text-red-500 ml-1">*</span>
                                                                </label>
                                                                <select
                                                                    className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                    value={formik.values.beneficiary_id_type}
                                                                    onChange={formik.handleChange}
                                                                    onBlur={formik.handleBlur}
                                                                    name="beneficiary_id_type"
                                                                >
                                                                    <option value="">Select ID Type</option>
                                                                    {bdtBenefIdTypes.length > 0 ? (
                                                                        bdtBenefIdTypes.map((type) => (
                                                                            <option key={type.id} value={type.id}>
                                                                                {type.name}
                                                                            </option>
                                                                        ))
                                                                    ) : (
                                                                        <>
                                                                            <option value="NID">National ID (NID)</option>
                                                                            <option value="Passport">Passport</option>
                                                                            <option value="Driving License">Driving License</option>
                                                                            <option value="Voter ID">Voter ID</option>
                                                                        </>
                                                                    )}
                                                                </select>
                                                                {formik.errors.beneficiary_id_type && formik.touched.beneficiary_id_type && (
                                                                    <p className="text-red-500 text-sm mt-1">{formik.errors.beneficiary_id_type}</p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                    Beneficiary ID Number
                                                                    <span className="text-red-500 ml-1">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                    placeholder="Enter ID number"
                                                                    value={formik.values.beneficiary_id_number}
                                                                    onChange={formik.handleChange}
                                                                    onBlur={formik.handleBlur}
                                                                    name="beneficiary_id_number"
                                                                    required
                                                                />
                                                                {formik.errors.beneficiary_id_number && formik.touched.beneficiary_id_number && (
                                                                    <p className="text-red-500 text-sm mt-1">{formik.errors.beneficiary_id_number}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Swift specific fields */}
                                                    {account.rails === "Swift" && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-dashed border-gray-200 pt-4 mt-2">
                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                    SWIFT Code
                                                                    <span className="text-red-500 ml-1">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                    placeholder="Enter SWIFT code"
                                                                    value={account.swift}
                                                                    onChange={(e) =>
                                                                        handleBankAccountChange(index, "swift", e.target.value)
                                                                    }
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                                    Intermediary SWIFT (Optional)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                                                    placeholder="Enter intermediary SWIFT"
                                                                    value={account.intermediarySwift}
                                                                    onChange={(e) =>
                                                                        handleBankAccountChange(index, "intermediarySwift", e.target.value)
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}

                                        {/* Add Another Bank Account Button */}
                                        <motion.div
                                            variants={itemVariants}
                                            className="flex justify-center"
                                        >
                                            <button
                                                type="button"
                                                onClick={addBankAccount}
                                                className="px-6 py-4 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 flex items-center gap-2 font-medium w-full sm:w-auto justify-center"
                                            >
                                                <FaPlus className="text-sm" />
                                                Add Another Bank Account
                                            </button>
                                        </motion.div>
                                    </motion.div>

                                    {/* Bank Details Form Actions */}
                                    <motion.div
                                        variants={itemVariants}
                                        className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t-2 border-gray-200"
                                    >
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium w-full sm:w-auto justify-center"
                                        >
                                            <FaChevronLeft className="text-sm" />
                                            Back
                                        </button>
                                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium w-full sm:w-auto"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSubmitBankDetails}
                                                disabled={loading}
                                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                                            >
                                                {loading ? (
                                                    <>
                                                        <ClipLoader size={20} color="#ffffff" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Complete Registration
                                                        <FaChevronRight className="text-sm" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default AddBeneficiaryRequestRemit;