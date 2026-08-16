// /src/page/Beneficiary/AddBeneficiary/AddBenefBank/AddBenefBank.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FaCreditCard,
    FaTrash,
    FaPlus,
    FaChevronLeft,
    FaUniversity,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL;

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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.5, staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const emptyBankAccount = (currency) => ({
    rails: "",
    currency,
    iban: "",
    swift: "",
    intermediarySwift: "",
    routingNumber: "",
    accountNumber: "",
    bankName: "",
    ifsc: "",
    bankCode: "",
    sortCode: "",
    branchCode: "",
});

function AddBenefBank() {
    const navigate = useNavigate();
    const { beneficiaryId } = useParams();
    const authtoken = localStorage.getItem("authtoken");

    const [currency, setCurrency] = useState("");
    const [bankAccounts, setBankAccounts] = useState([emptyBankAccount("")]);

    const [banks, setBanks] = useState([]);
    const [bdtBanks, setBdtBanks] = useState([]);
    const [pkrBanks, setPkrBanks] = useState([]);
    const [kesBanks, setKesBanks] = useState([]);
    const [nprBanks, setNprBanks] = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [bdtBenefIdTypes, setBdtBenefIdTypes] = useState([]);

    const [beneficiaryIdType, setBeneficiaryIdType] = useState("");
    const [beneficiaryIdNumber, setBeneficiaryIdNumber] = useState("");

    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    const apiCall = useCallback(
        async (url, options = {}) => {
            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authtoken}`,
                    Accept: "application/json",
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(
                    result.message || result.error || `Request failed with status ${response.status}`
                );
            }

            return response.json();
        },
        [authtoken]
    );

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

    // Fetch bank list + beneficiary ID type options whenever currency changes
    useEffect(() => {
        if (!currency) return;

        const fetchBanks = async () => {
            setLoadingBanks(true);
            try {
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

                const result = await apiCall(`${API_URL}/${endpoint}`);
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
            } catch (error) {
                console.error(`Error fetching ${currency} banks:`, error);
                toast.error(`Failed to load ${currency} banks`);
            } finally {
                setLoadingBanks(false);
            }
        };

        const fetchIdTypes = async () => {
            try {
                const result = await apiCall(`${API_URL}/currency-id-type/${currency}`);
                setBdtBenefIdTypes(result.data || []);
            } catch (error) {
                console.error("Error fetching benef id type:", error);
                setBdtBenefIdTypes([]);
            }
        };

        fetchBanks();
        fetchIdTypes();

        setBankAccounts((prev) =>
            prev.map((account) => ({ ...account, currency, bankCode: "", bankName: "" }))
        );
    }, [currency, apiCall]);

    const addBankAccount = () => {
        setBankAccounts((prev) => [...prev, emptyBankAccount(currency)]);
    };

    const removeBankAccount = (index) => {
        setBankAccounts((prev) => prev.filter((_, i) => i !== index));
    };

    const handleBankAccountChange = (index, field, value) => {
        setBankAccounts((prev) =>
            prev.map((account, i) => (i === index ? { ...account, [field]: value } : account))
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");

        if (!beneficiaryId) {
            setApiError("No beneficiary selected. Please go back and try again.");
            return;
        }

        const isRailsMissing = bankAccounts.some((account) => !account.rails);
        if (isRailsMissing) {
            setApiError("Please select rails for all bank accounts.");
            return;
        }

        const requiresBeneficiaryId =
            currency === "BDT" || currency === "INR" || currency === "PKR";

        if (requiresBeneficiaryId && (!beneficiaryIdType || !beneficiaryIdNumber)) {
            setApiError("Beneficiary ID type and number are required for this currency.");
            return;
        }

        setLoading(true);

        try {
            // One POST per bank account, since the endpoint is singular (create-benef-bank)
            for (const account of bankAccounts) {
                const payload = {
                    benef_id: beneficiaryId,
                    rails: account.rails,
                    currency_code: account.currency || currency,
                    benef_iban: account.iban,
                    swift_code: account.swift,
                    intermediary_bank_swift: account.intermediarySwift,
                    routing_number: account.routingNumber,
                    bank_acc_no: account.accountNumber,
                    sort_code: account.sortCode,
                    bank_name: account.bankName,
                    ifsc: account.ifsc,
                    bank_code: account.bankCode,
                    branch_code: account.branchCode,
                    ...(requiresBeneficiaryId && {
                        idType: beneficiaryIdType,
                        idNumber: beneficiaryIdNumber,
                    }),
                };

                await apiCall(`${API_URL}/beneficiaries/create-benef-bank`, {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }

            toast.success("Bank account(s) added successfully!");
            setTimeout(() => navigate(-1), 1200);
        } catch (error) {
            console.error("Error adding bank:", error);
            const msg = error.message || "Failed to add bank account.";
            setApiError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <ToastContainer position="top-right" autoClose={4000} theme="light" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl mx-auto"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <FaChevronLeft className="text-gray-600" />
                    </button>
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                        <FaCreditCard className="text-blue-600 text-xl" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            Bank Account Information
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Add bank account for this beneficiary
                        </p>
                    </div>
                </motion.div>

                {apiError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                    >
                        {apiError}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {bankAccounts.map((account, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="relative border-2 border-gray-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                    1
                                </div>
                                <h4 className="text-md font-semibold text-gray-800">
                                    Bank Account
                                </h4>
                            </div>

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
                                                    setCurrency(e.target.value);
                                                    handleBankAccountChange(index, "currency", e.target.value);
                                                }}
                                            >
                                                <option value="">Select Currency</option>
                                                {localCurrencies.map((cur) => (
                                                    <option key={cur} value={cur}>
                                                        {cur}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

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
                                                {account.rails !== "Mobile" && (
                                                    <span className="text-red-500 ml-1">*</span>
                                                )}
                                            </label>
                                            {loadingBanks ? (
                                                <div className="w-full border-2 border-gray-200 rounded-xl p-4 bg-gray-50/50 flex items-center justify-center">
                                                    <ClipLoader size={20} color="#3B82F6" />
                                                    <span className="ml-2 text-gray-600 text-sm">
                                                        Loading banks...
                                                    </span>
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
                                                                    selectedBank.bank_name || selectedBank.name
                                                                );
                                                            } else {
                                                                handleBankAccountChange(index, "bankName", selectedValue);
                                                            }
                                                        } else {
                                                            handleBankAccountChange(index, "bankCode", "");
                                                            handleBankAccountChange(index, "bankName", "");
                                                        }
                                                    }}
                                                    required={account.rails !== "Mobile"}
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
                                                        required={account.rails !== "Mobile"}
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
                                                    required={account.rails !== "Mobile"}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {account.rails && (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {/* Beneficiary ID fields for BDT, INR, PKR (shared across accounts, entered once) */}
                    {(currency === "BDT" || currency === "INR" || currency === "PKR") && (
                        <motion.div
                            variants={itemVariants}
                            className="border-2 border-gray-200 rounded-2xl p-6 bg-white shadow-sm"
                        >
                            <h4 className="text-md font-semibold text-gray-800 mb-4">
                                Beneficiary Identification
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                                        Beneficiary ID Type
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <select
                                        className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/80"
                                        value={beneficiaryIdType}
                                        onChange={(e) => setBeneficiaryIdType(e.target.value)}
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
                                        value={beneficiaryIdNumber}
                                        onChange={(e) => setBeneficiaryIdNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Actions */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t-2 border-gray-200"
                    >
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium w-full sm:w-auto justify-center"
                        >
                            <FaChevronLeft className="text-sm" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <ClipLoader size={20} color="#ffffff" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaUniversity className="text-sm" />
                                    Save Bank Account
                                </>
                            )}
                        </button>
                    </motion.div>
                </form>
            </motion.div>
        </div>
    );
}

export default AddBenefBank;