import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { countries } from "../../features/Auth/slices/countrySlice";

const API_URL = import.meta.env.VITE_API_URL;

const INITIAL_FORM_STATE = {
    bank_name: "",
    account_name: "",
    routing_number: "",
    account_number: "",
    account_type: "",
    holder_type: "",
    country_id: "",
    payout_currency: "",
    currency: "",
};

const ChevronDown = () => (
    <svg
        className="w-4 h-4 text-gray-500 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
        />
    </svg>
);

const FundingAccountModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [payoutCurrencies, setPayoutCurrencies] = useState([]);
    const [loadingCurrencies, setLoadingCurrencies] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bankAccountCurrencies, setBankAccountCurrencies] = useState([]);
    const [loadingBankCurrencies, setLoadingBankCurrencies] = useState(false);

    // Status Modal View State ('form' | 'success' | 'error')
    const [modalStatus, setModalStatus] = useState("form");
    const [statusMessage, setStatusMessage] = useState("");

    // Searchable Country Dropdown State
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const countryDropdownRef = useRef(null);

    const bearertoken = localStorage.getItem("bearertoken");
    const customerUuid = localStorage.getItem("customer_uuid")

    // Reset state whenever the modal opens
    useEffect(() => {
        if (isOpen) {
            setModalStatus("form");
            setStatusMessage("");
            setFormData(INITIAL_FORM_STATE);
        }
    }, [isOpen]);

    // Close searchable country dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                countryDropdownRef.current &&
                !countryDropdownRef.current.contains(event.target)
            ) {
                setIsCountryOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch payout currencies
    useEffect(() => {
        if (!isOpen) return;

        const fetchPayoutCurrencies = async () => {
            try {
                setLoadingCurrencies(true);
                const response = await fetch(`${API_URL}/payout-currencies`, {
                    headers: {
                        Authorization: `Bearer ${bearertoken}`,
                        "Content-Type": "application/json",
                    },
                });
                const result = await response.json();
                const list = Array.isArray(result?.data) ? result.data : [];
                setPayoutCurrencies(list);
            } catch (err) {
                console.error("Failed to load payout currencies:", err);
            } finally {
                setLoadingCurrencies(false);
            }
        };

        fetchPayoutCurrencies();
    }, [isOpen, bearertoken]);

    // Fetch applied bank account currencies
    useEffect(() => {
        if (!isOpen || !customerUuid) return;

        const fetchBankCurrencies = async () => {
            try {
                setLoadingBankCurrencies(true);
                const response = await fetch(
                    `${API_URL}/applied-bank-accounts/${customerUuid}/62`,
                    {
                        headers: {
                            Authorization: `Bearer ${bearertoken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                const result = await response.json();

                const list = Array.isArray(result?.data)
                    ? result.data
                    : Array.isArray(result)
                        ? result
                        : [];

                setBankAccountCurrencies(list);
            } catch (err) {
                console.error("Failed to load applied bank account currencies:", err);
                toast.error("Failed to load bank account currencies");
            } finally {
                setLoadingBankCurrencies(false);
            }
        };

        fetchBankCurrencies();
    }, [isOpen, customerUuid, bearertoken]);

    const filteredCountries = countries.filter((c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const selectedCountry = countries.find(
        (c) => String(c.id) === String(formData.country_id)
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectCountry = (country) => {
        setFormData((prev) => ({ ...prev, country_id: String(country.id) }));
        setIsCountryOpen(false);
        setCountrySearch("");
    };

    const handleModalClose = () => {
        setModalStatus("form");
        setStatusMessage("");
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.bank_name.trim()) {
            toast.error("Bank Name is required");
            return;
        }
        if (!formData.account_name.trim()) {
            toast.error("Account Name is required");
            return;
        }
        if (!formData.routing_number.trim()) {
            toast.error("Routing / BSB Number is required");
            return;
        }
        if (!formData.account_number.trim()) {
            toast.error("Account Number is required");
            return;
        }
        if (!formData.country_id) {
            toast.error("Please select a Bank Country");
            return;
        }
        if (!formData.account_type) {
            toast.error("Please select an Account Type");
            return;
        }
        if (!formData.holder_type) {
            toast.error("Please select a Holder Type");
            return;
        }
        if (!formData.payout_currency) {
            toast.error("Please select a Payout Currency");
            return;
        }
        if (!formData.currency) {
            toast.error("Currency is required");
            return;
        }

        if (!customerUuid) {
            setStatusMessage("Customer UUID not found in session storage. Please log in again.");
            setModalStatus("error");
            return;
        }

        try {
            setIsSubmitting(true);
            const endpoint = `${API_URL}/zai/add-funding-account/${customerUuid}`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${bearertoken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (
                !response.ok ||
                (result.status &&
                    result.status !== "success" &&
                    result.status !== "Success")
            ) {
                throw new Error(result.message || "Failed to create funding account");
            }

            setStatusMessage(result.message || "Your funding account has been added successfully.");
            setModalStatus("success");
            setFormData(INITIAL_FORM_STATE);
            if (onSuccess) onSuccess(result);
        } catch (err) {
            console.error("Submission error:", err);
            setStatusMessage(err.message || "An unexpected error occurred while creating the account.");
            setModalStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop (Strict: No Close on Outside Click) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto"
                >
                    {/* 1. SUCCESS VIEW */}
                    {modalStatus === "success" && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Account Created!</h3>
                            <p className="text-sm text-gray-600 mb-6 px-4">{statusMessage}</p>
                            <button
                                type="button"
                                onClick={handleModalClose}
                                className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl transition shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {/* 2. ERROR VIEW */}
                    {modalStatus === "error" && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Submission Failed</h3>
                            <p className="text-sm text-gray-600 mb-6 px-4">{statusMessage}</p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="w-1/2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl transition"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalStatus("form")}
                                    className="w-1/2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition shadow-sm"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. FORM VIEW */}
                    {modalStatus === "form" && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800">Add Funding Account</h3>
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
                                {/* Bank Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Bank Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="bank_name"
                                        value={formData.bank_name}
                                        onChange={handleChange}
                                        placeholder="e.g., Barclays Bank"
                                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                {/* Account Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Account Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="account_name"
                                        value={formData.account_name}
                                        onChange={handleChange}
                                        placeholder="e.g., Jane Smith"
                                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                {/* Routing & Account Number */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                            Routing / BSB Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="routing_number"
                                            value={formData.routing_number}
                                            onChange={handleChange}
                                            placeholder="e.g., 112233"
                                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                            Account Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="account_number"
                                            value={formData.account_number}
                                            onChange={handleChange}
                                            placeholder="e.g., 876543210"
                                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Searchable Bank Country */}
                                <div className="relative" ref={countryDropdownRef}>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Bank Country <span className="text-red-500">*</span>
                                    </label>

                                    <div
                                        onClick={() => setIsCountryOpen(!isCountryOpen)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg cursor-pointer bg-white ${!formData.country_id ? "text-gray-400" : "text-gray-800"
                                            } ${isCountryOpen ? "ring-2 ring-blue-500 border-transparent" : ""}`}
                                    >
                                        <span>{selectedCountry ? selectedCountry.name : "Select Bank Country"}</span>
                                        <ChevronDown />
                                    </div>

                                    {isCountryOpen && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                            <div className="p-2 border-b border-gray-100 bg-gray-50">
                                                <input
                                                    type="text"
                                                    placeholder="Search country..."
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                            </div>
                                            <ul className="max-h-48 overflow-y-auto text-sm divide-y divide-gray-50">
                                                {filteredCountries.length > 0 ? (
                                                    filteredCountries.map((c) => (
                                                        <li
                                                            key={c.id}
                                                            onClick={() => handleSelectCountry(c)}
                                                            className={`px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors ${String(formData.country_id) === String(c.id)
                                                                ? "bg-blue-50 font-semibold text-blue-600"
                                                                : "text-gray-700"
                                                                }`}
                                                        >
                                                            {c.name}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="px-3 py-3 text-xs text-gray-400 text-center">
                                                        No countries found
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Radio Groups */}
                                <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-100">
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-600 mb-2">
                                            Account Type <span className="text-red-500">*</span>
                                        </span>
                                        <div className="space-y-1.5">
                                            <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="account_type"
                                                    value="savings"
                                                    checked={formData.account_type === "savings"}
                                                    onChange={handleChange}
                                                    className="mr-2 text-blue-600 focus:ring-blue-500"
                                                />
                                                Savings
                                            </label>
                                            <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="account_type"
                                                    value="checking"
                                                    checked={formData.account_type === "checking"}
                                                    onChange={handleChange}
                                                    className="mr-2 text-blue-600 focus:ring-blue-500"
                                                />
                                                Checking
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="block text-xs font-semibold text-gray-600 mb-2">
                                            Holder Type <span className="text-red-500">*</span>
                                        </span>
                                        <div className="space-y-1.5">
                                            <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="holder_type"
                                                    value="personal"
                                                    checked={formData.holder_type === "personal"}
                                                    onChange={handleChange}
                                                    className="mr-2 text-blue-600 focus:ring-blue-500"
                                                />
                                                Personal
                                            </label>
                                            <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="holder_type"
                                                    value="business"
                                                    checked={formData.holder_type === "business"}
                                                    onChange={handleChange}
                                                    className="mr-2 text-blue-600 focus:ring-blue-500"
                                                />
                                                Business
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Payout Currency & Currency */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                            Payout Currency <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative flex items-center">
                                            <select
                                                name="payout_currency"
                                                value={formData.payout_currency}
                                                onChange={handleChange}
                                                className={`w-full appearance-none px-3 py-2 pr-8 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer ${!formData.payout_currency ? "text-gray-400" : "text-gray-800"
                                                    }`}
                                                disabled={loadingCurrencies}
                                            >
                                                <option value="">Select Currency</option>
                                                {loadingCurrencies ? (
                                                    <option disabled>Loading...</option>
                                                ) : (
                                                    payoutCurrencies.map((item) => (
                                                        <option
                                                            key={item.payout_currency_id}
                                                            value={item.currency_code}
                                                            className="text-gray-800"
                                                        >
                                                            {item.currency_code}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                            <div className="absolute right-2.5 pointer-events-none">
                                                <ChevronDown />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Currency Dropdown */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                            Currency <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative flex items-center">
                                            <select
                                                name="currency"
                                                value={formData.currency}
                                                onChange={handleChange}
                                                className={`w-full appearance-none px-3 py-2 pr-8 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer ${!formData.currency ? "text-gray-400" : "text-gray-800"
                                                    }`}
                                                disabled={loadingBankCurrencies}
                                            >
                                                <option value="">Select Currency</option>
                                                {loadingBankCurrencies ? (
                                                    <option disabled>Loading...</option>
                                                ) : (
                                                    bankAccountCurrencies.map((item, idx) => {
                                                        const code =
                                                            typeof item === "object"
                                                                ? item.currency_code || item.currency || item.code
                                                                : item;

                                                        return (
                                                            <option
                                                                key={item.id || idx}
                                                                value={code}
                                                                className="text-gray-800"
                                                            >
                                                                {code}
                                                            </option>
                                                        );
                                                    })
                                                )}
                                            </select>
                                            <div className="absolute right-2.5 pointer-events-none">
                                                <ChevronDown />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleModalClose}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
                                    >
                                        {isSubmitting ? "Creating..." : "Submit"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FundingAccountModal;