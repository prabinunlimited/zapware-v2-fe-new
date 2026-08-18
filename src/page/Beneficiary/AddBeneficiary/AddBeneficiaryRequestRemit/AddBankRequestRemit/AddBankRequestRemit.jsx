// /src/page/Beneficiary/AddBeneficiary/AddBenefBank/AddBenefBank.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FaCreditCard,
    FaChevronLeft,
    FaUniversity,
} from "react-icons/fa";
import { motion } from "framer-motion";

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
        transition: { duration: 0.4, staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
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
        <div className="min-h-screen bg-gray-50/50 py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
            <ToastContainer position="top-right" autoClose={4000} theme="light" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-3xl mx-auto space-y-4 sm:space-y-6"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5 sm:mb-6">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center shadow-sm cursor-pointer flex-shrink-0"
                        aria-label="Go back"
                    >
                        <FaChevronLeft className="text-gray-700 text-xs sm:text-sm" />
                    </button>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-snug">
                            Add Bank Account
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 leading-normal">
                            Enter banking details for this beneficiary
                        </p>
                    </div>
                </motion.div>

                {apiError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm shadow-2xs"
                    >
                        {apiError}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {bankAccounts.map((account, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="border border-gray-200 rounded-2xl p-4 sm:p-6 bg-white shadow-2xs space-y-4 sm:space-y-5"
                        >
                            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs">
                                    {index + 1}
                                </div>
                                <h4 className="text-sm sm:text-base font-bold text-gray-900">
                                    Bank Account Details
                                </h4>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {/* Select Rails */}
                                    <div>
                                        <label className="block text-gray-700 text-xs font-semibold mb-1">
                                            Select Rails
                                            <span className="text-red-500 ml-0.5">*</span>
                                        </label>
                                        <select
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                Select Currency
                                            </label>
                                            <select
                                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                Account Number
                                                <span className="text-red-500 ml-0.5">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
                                                placeholder="Enter account number"
                                                value={account.accountNumber}
                                                onChange={(e) =>
                                                    handleBankAccountChange(index, "accountNumber", e.target.value)
                                                }
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                Bank Name
                                                {account.rails !== "Mobile" && (
                                                    <span className="text-red-500 ml-0.5">*</span>
                                                )}
                                            </label>
                                            {loadingBanks ? (
                                                <div className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 flex items-center justify-center gap-2">
                                                    <ClipLoader size={16} color="#2563EB" />
                                                    <span className="text-gray-500 text-xs">
                                                        Loading banks...
                                                    </span>
                                                </div>
                                            ) : getBanksForCurrency() && getBanksForCurrency().length > 0 ? (
                                                <select
                                                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
                                                        placeholder="Enter bank name"
                                                        value={account.bankName}
                                                        onChange={(e) => {
                                                            handleBankAccountChange(index, "bankName", e.target.value);
                                                            handleBankAccountChange(index, "bankCode", "");
                                                        }}
                                                        required={account.rails !== "Mobile"}
                                                    />
                                                    <p className="text-amber-600 text-[11px] mt-1">
                                                        No banks found for {currency}. Enter manually.
                                                    </p>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                        Routing Number (Bank Code)
                                                        <span className="text-red-500 ml-0.5">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
                                                        placeholder="Enter routing number"
                                                        value={account.bankCode}
                                                        onChange={(e) =>
                                                            handleBankAccountChange(index, "bankCode", e.target.value)
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                        Branch Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                        IFSC Code
                                                        <span className="text-red-500 ml-0.5">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                        Bank Code
                                                        <span className="text-red-500 ml-0.5">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                        Routing Number
                                                        <span className="text-red-500 ml-0.5">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                        Sort Code
                                                        <span className="text-red-500 ml-0.5">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                        IBAN
                                                        <span className="text-red-500 ml-0.5">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border-t border-gray-100 pt-3 mt-1">
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                        SWIFT Code
                                                        <span className="text-red-500 ml-0.5">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
                                                        placeholder="Enter SWIFT code"
                                                        value={account.swift}
                                                        onChange={(e) =>
                                                            handleBankAccountChange(index, "swift", e.target.value)
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                                        Intermediary SWIFT (Optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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

                    {/* Beneficiary ID fields for BDT, INR, PKR */}
                    {(currency === "BDT" || currency === "INR" || currency === "PKR") && (
                        <motion.div
                            variants={itemVariants}
                            className="border border-gray-200 rounded-2xl p-4 sm:p-6 bg-white shadow-2xs space-y-4"
                        >
                            <h4 className="text-sm sm:text-base font-bold text-gray-900 pb-2 border-b border-gray-100">
                                Beneficiary Identification
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                        Beneficiary ID Type
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
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
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                        Beneficiary ID Number
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all"
                                        placeholder="Enter ID number"
                                        value={beneficiaryIdNumber}
                                        onChange={(e) => setBeneficiaryIdNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-200"
                    >
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-3 border border-gray-200 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors text-xs sm:text-sm font-semibold w-full sm:w-auto cursor-pointer shadow-2xs"
                        >
                            <FaChevronLeft className="text-xs" />
                            <span>Cancel</span>
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <ClipLoader size={16} color="#ffffff" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <FaUniversity className="text-xs" />
                                    <span>Save Bank Account</span>
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