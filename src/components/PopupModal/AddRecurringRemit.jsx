// src/components/PopupModal/AddRecurringRemitPopup.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader,
  AlertCircle,
  Search,
  CheckCircle,
  Calendar,
  Repeat,
  ChevronDown,
  Building,
  User,
  DollarSign,
  Globe,
  Briefcase,
  FileText,
  Shield,
  Info,
} from "lucide-react";

import {
  fetchBankAccounts,
  fetchPayoutCurrencies,
} from "../../page/Remittance/slices/remittanceSlice";
import {
  fetchPurposes,
  fetchIncomeSources,
  fetchOccupations,
  fetchAllStaticData,
} from "../../page/Remittance/slices/staticDataSlice";

// Import beneficiary thunks and selectors
import {
  fetchBeneficiaries,
  fetchBeneficiaryBanks,
  selectBeneficiaryBanks,
  selectBanksLoading,
} from "../../page/Beneficiary/MyBeneficiaries/BeneficiariesSlice";

const AddRecurringRemitPopup = ({ isOpen, onClose, onSave, customerId }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);
  const [bankError, setBankError] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("");
  const [recurringCustomDays, setRecurringCustomDays] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    customer_id: "",
    recurring_frequency: "",
    source_amount: "",
    source_currency: "",
    destination_currency: "",
    beneficiaryId: "",
    beneficiaryNumericId: "",
    beneficiaryBankId: "",
    occupation: "",
    income_source: "",
    purpose: "",
    custom_days: "",
    author_source: "zap",
    author_type: "customer",
    author_id: "",
  });

  // Local state for UI only
  const [beneficiarySearchTerm, setBeneficiarySearchTerm] = useState("");
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [showBeneficiaryDropdown, setShowBeneficiaryDropdown] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // ===================== SELECTORS FROM STORE =====================

  // Get beneficiaries from Redux store
  const beneficiariesFromStore = useSelector((state) => {
    const beneficiaries = state.beneficiaries?.beneficiaries || [];
    return beneficiaries;
  });

  // Get loading state for beneficiaries
  const beneficiariesLoading = useSelector(
    (state) => state.beneficiaries?.loading || false,
  );

  // Get hasFetched flag to know if beneficiaries have been loaded
  const beneficiariesHasFetched = useSelector(
    (state) => state.beneficiaries?.hasFetched || false,
  );

  // Get beneficiary banks from Redux store using selector
  const beneficiaryBanksFromStore = useSelector(selectBeneficiaryBanks);
  const banksLoading = useSelector(selectBanksLoading);

  // Get bank accounts from remittance slice
  const sourceCurrencies = useSelector((state) => {
    return state.remittance?.bankAccounts || [];
  });

  // Get payout currencies from remittance slice
  const destinationCurrencies = useSelector((state) => {
    return state.remittance?.payoutCurrencies || [];
  });

  // Get purposes from remittanceStatic slice
  const purposes = useSelector((state) => {
    return state.remittanceStatic?.purposes || [];
  });

  // Get income sources from remittanceStatic slice
  const incomeSources = useSelector((state) => {
    return state.remittanceStatic?.incomeSources || [];
  });

  // Get occupations from remittanceStatic slice
  const occupations = useSelector((state) => {
    return state.remittanceStatic?.occupations || [];
  });

  // Loading states from store
  const remittanceLoading = useSelector(
    (state) => state.remittance?.currencies?.loading,
  );
  const staticLoading = useSelector((state) => state.remittanceStatic?.loading);

  // ===================== FALLBACK DATA =====================

  // Fallback currencies if API fails
  const fallbackCurrencies = [
    { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
    { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
    { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  ];

  // Fallback purposes
  const fallbackPurposes = [
    { value: "family_support", label: "Family Support" },
    { value: "education", label: "Education Fees" },
    { value: "medical", label: "Medical Expenses" },
    { value: "business", label: "Business Investment" },
    { value: "savings", label: "Savings" },
    { value: "gift", label: "Gift" },
    { value: "travel", label: "Travel" },
    { value: "other", label: "Other" },
  ];

  // Fallback income sources
  const fallbackIncomeSources = [
    { value: "salary", label: "Salary" },
    { value: "business", label: "Business Income" },
    { value: "investment", label: "Investment Income" },
    { value: "rental", label: "Rental Income" },
    { value: "pension", label: "Pension" },
    { value: "gift", label: "Gift" },
    { value: "other", label: "Other" },
  ];

  // Frequency options
  const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Bi-Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ];

  const recurringFrequencyOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "specific_day", label: "Specific Day" },
  ];

  // ===================== API URLs =====================
  const API_URL = import.meta.env.VITE_API_URL;
  const bearerToken = localStorage.getItem("bearertoken");
  const customerUuid = localStorage.getItem("customerUuid");
  const authCustomerId = localStorage.getItem("authcustomer_id");

  // Use the correct customer ID (from props, UUID, or auth ID)
  const effectiveCustomerId =
    customerId || customerUuid || authCustomerId || "158";

  // Set author_id and customer_id from localStorage when component mounts
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      author_id: customerUuid || "",
      customer_id: effectiveCustomerId,
    }));
  }, [customerId, customerUuid, effectiveCustomerId]);

  // Fetch all required data from Redux when modal opens
  useEffect(() => {
    const fetchAllData = async () => {
      if (!isOpen || dataFetchAttempted) return;

      setDataFetchAttempted(true);

      try {
        // Fetch beneficiaries if not already in store
        if (!beneficiariesHasFetched || beneficiariesFromStore.length === 0) {
          await dispatch(fetchBeneficiaries(effectiveCustomerId));
        }

        // Fetch bank accounts if empty
        if (sourceCurrencies.length === 0) {
          await dispatch(fetchBankAccounts(effectiveCustomerId));
        }

        // Fetch payout currencies if empty
        if (destinationCurrencies.length === 0) {
          await dispatch(fetchPayoutCurrencies());
        }

        // Fetch all static data if any is missing
        if (
          purposes.length === 0 ||
          incomeSources.length === 0 ||
          occupations.length === 0
        ) {
          await dispatch(fetchAllStaticData());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    if (isOpen) {
      fetchAllData();
    }
  }, [
    isOpen,
    dispatch,
    effectiveCustomerId,
    beneficiariesHasFetched,
    beneficiariesFromStore.length,
    sourceCurrencies.length,
    destinationCurrencies.length,
    purposes.length,
    incomeSources.length,
    occupations.length,
    dataFetchAttempted,
  ]);

  // Fetch beneficiary banks from Redux when beneficiary is selected
  useEffect(() => {
    if (formData.beneficiaryNumericId) {
      dispatch(fetchBeneficiaryBanks(formData.beneficiaryNumericId));
      setBankError("");
    }
    setFormData((prev) => ({ ...prev, beneficiaryBankId: "" }));
  }, [formData.beneficiaryNumericId, dispatch]);

  // Update bankError based on banks data
  useEffect(() => {
    if (!formData.beneficiaryNumericId) {
      setBankError("");
    } else if (!banksLoading && beneficiaryBanksFromStore.length === 0) {
      setBankError("No bank accounts found for this beneficiary");
    } else if (!banksLoading && beneficiaryBanksFromStore.length > 0) {
      setBankError("");
    }
  }, [beneficiaryBanksFromStore, banksLoading, formData.beneficiaryNumericId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBeneficiarySelect = (beneficiary) => {
    const beneficiaryUuid = beneficiary.benef_uuid;
    const beneficiaryNumericId = beneficiary.id;

    setFormData((prev) => ({
      ...prev,
      beneficiaryId: beneficiaryUuid,
      beneficiaryNumericId: beneficiaryNumericId,
    }));
    setShowBeneficiaryDropdown(false);
    setBeneficiarySearchTerm("");
    setBankError("");
  };

  const handleRecurringChange = (e) => {
    const checked = e.target.checked;
    setIsRecurring(checked);
    if (!checked) {
      setFrequency("");
      setRecurringCustomDays("");
      setFormData((prev) => ({
        ...prev,
        recurring_frequency: "",
        custom_days: "",
      }));
    }
  };

  const handleFrequencyChange = (selectedValue) => {
    setFrequency(selectedValue);
    setFormData((prev) => ({
      ...prev,
      recurring_frequency: selectedValue,
    }));
    if (selectedValue !== "specific_day") {
      setRecurringCustomDays("");
      setFormData((prev) => ({
        ...prev,
        custom_days: "",
      }));
    }
  };

  const handleCustomDaysChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setRecurringCustomDays(value);
    setFormData((prev) => ({
      ...prev,
      custom_days: value,
    }));
  };

  const handleBankSelect = (bank) => {
    const bankId = bank.benef_banks_uuid || bank.id;
    setFormData((prev) => ({
      ...prev,
      beneficiaryBankId: bankId,
    }));
    setShowBankDropdown(false);
    setBankSearchTerm("");
  };

  const validateForm = () => {
    if (!formData.source_amount) return "Source amount is required";
    if (!formData.source_currency) return "Source currency is required";
    if (!formData.destination_currency)
      return "Destination currency is required";
    if (!formData.beneficiaryNumericId) return "Beneficiary is required";
    if (beneficiaryBanks.length > 0 && !formData.beneficiaryBankId)
      return "Beneficiary bank is required";
    if (!formData.occupation) return "Occupation is required";
    if (!formData.income_source) return "Income source is required";
    if (!formData.purpose) return "Purpose is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const customerUuid = localStorage.getItem("customerUuid");

      if (!customerUuid) {
        throw new Error("Customer ID not found");
      }

      const payload = {
        customer_id: customerUuid,
        source_amount: formData.source_amount,
        source_currency: formData.source_currency,
        destination_currency: formData.destination_currency,
        beneficiaryId: formData.beneficiaryId,
        beneficiaryBankId: formData.beneficiaryBankId,
        occupation: formData.occupation,
        income_source: formData.income_source,
        purpose: formData.purpose,
        recurring_frequency: isRecurring ? formData.recurring_frequency : "",
        custom_days:
          isRecurring && formData.recurring_frequency === "specific_day"
            ? formData.custom_days
            : "",
        author_source: "zap",
        author_type: "customer",
        author_id: customerUuid,
      };

      const response = await fetch(
        `${API_URL}/recurring-remittance/add-detail`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const responseData = await response.json();

      if (responseData.status === "success") {
        onSave(responseData.data);
        onClose();
        resetForm();
      } else {
        if (responseData.message && typeof responseData.message === "object") {
          const errorMessages = Object.entries(responseData.message)
            .map(([field, errors]) => `${field}: ${errors.join(", ")}`)
            .join("; ");
          throw new Error(
            errorMessages || "Failed to add recurring remittance",
          );
        } else {
          throw new Error(
            responseData.message || "Failed to add recurring remittance",
          );
        }
      }
    } catch (err) {
      setError(
        err.message || "An error occurred while adding recurring remittance",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: customerUuid || "",
      recurring_frequency: "",
      source_amount: "",
      source_currency: "",
      destination_currency: "",
      beneficiaryId: "",
      beneficiaryNumericId: "",
      beneficiaryBankId: "",
      occupation: "",
      income_source: "",
      purpose: "",
      custom_days: "",
      author_source: "zap",
      author_type: "customer",
      author_id: customerUuid || "",
    });
    setIsRecurring(false);
    setFrequency("");
    setRecurringCustomDays("");
    setBankError("");
    setDataFetchAttempted(false);
  };

  // Use beneficiaries from store directly
  const beneficiaries = beneficiariesFromStore;
  const beneficiaryBanks = beneficiaryBanksFromStore;

  // Filter beneficiaries based on search
  const filteredBeneficiaries = beneficiaries.filter(
    (beneficiary) =>
      (beneficiary.benef_name || beneficiary.name || "")
        ?.toLowerCase()
        .includes(beneficiarySearchTerm.toLowerCase()) ||
      (beneficiary.benef_email || beneficiary.email || "")
        ?.toLowerCase()
        .includes(beneficiarySearchTerm.toLowerCase()) ||
      (beneficiary.benef_phone || beneficiary.phone_number || "")?.includes(
        beneficiarySearchTerm,
      ),
  );

  // Filter banks based on search
  const filteredBanks = beneficiaryBanks.filter(
    (bank) =>
      (bank.bank_name || "")
        ?.toLowerCase()
        .includes(bankSearchTerm.toLowerCase()) ||
      (bank.account_number || bank.bank_acc_no || "")?.includes(
        bankSearchTerm,
      ) ||
      (bank.account_holder_name || "")
        ?.toLowerCase()
        .includes(bankSearchTerm.toLowerCase()),
  );

  const selectedBeneficiary = beneficiaries.find(
    (b) => b.id === formData.beneficiaryNumericId,
  );

  const selectedBank = beneficiaryBanks.find(
    (b) => (b.benef_banks_uuid || b.id) === formData.beneficiaryBankId,
  );

  if (!isOpen) return null;

  const isLoading =
    remittanceLoading || staticLoading || beneficiariesLoading || banksLoading;

  // Use display currencies with fallbacks
  const displaySourceCurrencies =
    sourceCurrencies.length > 0 ? sourceCurrencies : fallbackCurrencies;
  const displayDestinationCurrencies =
    destinationCurrencies.length > 0
      ? destinationCurrencies
      : fallbackCurrencies;
  const displayPurposes = purposes.length > 0 ? purposes : fallbackPurposes;
  const displayIncomeSources =
    incomeSources.length > 0 ? incomeSources : fallbackIncomeSources;
  const displayOccupations = occupations.length > 0 ? occupations : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            {/* Backdrop - no blur, just dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />

            {/* Modal - fixed width, no blur, clean background */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden z-10"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Repeat className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Add Recurring Remittance
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mx-6 mt-4">
                  <div className="flex items-center p-3 text-red-700 bg-red-50 rounded-lg border border-red-200 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="mx-6 mt-4">
                  <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Loader className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                    <span className="text-blue-700 text-sm">
                      Loading form data...
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-5">
                  {/* Transfer Details */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1 text-blue-600" />
                      Transfer Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Frequency */}
                      <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">
                          Frequency <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="recurring_frequency"
                          value={formData.recurring_frequency}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        >
                          <option value="">Select frequency</option>
                          {frequencyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">
                          Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="source_amount"
                          value={formData.source_amount}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>

                      {/* Source Currency */}
                      <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">
                          Source Currency{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="source_currency"
                          value={formData.source_currency}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        >
                          <option value="">Select currency</option>
                          {displaySourceCurrencies.map((currency) => (
                            <option
                              key={
                                currency.id ||
                                currency.currency_code ||
                                currency.code
                              }
                              value={currency.currency_code || currency.code}
                            >
                              {currency.currency_code || currency.code} -{" "}
                              {currency.currency_name || currency.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Destination Currency */}
                      <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">
                          Destination Currency{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="destination_currency"
                          value={formData.destination_currency}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        >
                          <option value="">Select currency</option>
                          {displayDestinationCurrencies.map((currency) => (
                            <option
                              key={
                                currency.code ||
                                currency.id ||
                                currency.currency_code
                              }
                              value={currency.code || currency.currency_code}
                            >
                              {currency.code || currency.currency_code} -{" "}
                              {currency.name || currency.currency_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Beneficiary Details */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-1 text-green-600" />
                      Beneficiary Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Beneficiary Selection */}
                      <div className="relative">
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">
                          Beneficiary <span className="text-red-500">*</span>
                        </label>

                        <div
                          onClick={() =>
                            !beneficiariesLoading &&
                            setShowBeneficiaryDropdown(!showBeneficiaryDropdown)
                          }
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white ${
                            beneficiariesLoading
                              ? "bg-gray-50"
                              : "hover:border-blue-500"
                          }`}
                        >
                          {beneficiariesLoading ? (
                            <div className="flex items-center text-sm text-gray-500">
                              <Loader className="w-3 h-3 mr-2 animate-spin" />
                              Loading...
                            </div>
                          ) : selectedBeneficiary ? (
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900">
                                {selectedBeneficiary.benef_name ||
                                  selectedBeneficiary.name}
                              </span>
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Select a beneficiary</span>
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Dropdown */}
                        {showBeneficiaryDropdown && !beneficiariesLoading && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                            <div className="p-2 border-b">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                <input
                                  type="text"
                                  placeholder="Search..."
                                  value={beneficiarySearchTerm}
                                  onChange={(e) =>
                                    setBeneficiarySearchTerm(e.target.value)
                                  }
                                  className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredBeneficiaries.length === 0 ? (
                                <div className="p-3 text-center text-sm text-gray-500">
                                  No beneficiaries found
                                </div>
                              ) : (
                                filteredBeneficiaries.map((beneficiary) => (
                                  <div
                                    key={
                                      beneficiary.benef_uuid || beneficiary.id
                                    }
                                    onClick={() =>
                                      handleBeneficiarySelect(beneficiary)
                                    }
                                    className={`p-2 cursor-pointer hover:bg-gray-50 text-sm ${
                                      formData.beneficiaryId ===
                                      (beneficiary.benef_uuid || beneficiary.id)
                                        ? "bg-blue-50"
                                        : ""
                                    }`}
                                  >
                                    <div className="font-medium text-gray-900">
                                      {beneficiary.benef_name ||
                                        beneficiary.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {beneficiary.benef_email ||
                                        beneficiary.email}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bank Selection */}
                      {formData.beneficiaryNumericId && (
                        <div className="relative">
                          <label className="block mb-1.5 text-xs font-medium text-gray-600">
                            Bank Account <span className="text-red-500">*</span>
                          </label>

                          <div
                            onClick={() =>
                              !banksLoading &&
                              beneficiaryBanks.length > 0 &&
                              setShowBankDropdown(!showBankDropdown)
                            }
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white ${
                              banksLoading
                                ? "bg-gray-50"
                                : "hover:border-blue-500"
                            } ${beneficiaryBanks.length === 0 ? "cursor-not-allowed bg-gray-50" : ""}`}
                          >
                            {banksLoading ? (
                              <div className="flex items-center text-sm text-gray-500">
                                <Loader className="w-3 h-3 mr-2 animate-spin" />
                                Loading...
                              </div>
                            ) : selectedBank ? (
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-900">
                                  {selectedBank.bank_name}
                                </span>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>
                                  {bankError || "Select bank account"}
                                </span>
                                {beneficiaryBanks.length > 0 && (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Bank Dropdown */}
                          {showBankDropdown &&
                            !banksLoading &&
                            beneficiaryBanks.length > 0 && (
                              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                <div className="p-2 border-b">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                    <input
                                      type="text"
                                      placeholder="Search banks..."
                                      value={bankSearchTerm}
                                      onChange={(e) =>
                                        setBankSearchTerm(e.target.value)
                                      }
                                      className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {filteredBanks.length === 0 ? (
                                    <div className="p-3 text-center text-sm text-gray-500">
                                      No banks found
                                    </div>
                                  ) : (
                                    filteredBanks.map((bank) => (
                                      <div
                                        key={bank.benef_banks_uuid || bank.id}
                                        onClick={() => handleBankSelect(bank)}
                                        className={`p-2 cursor-pointer hover:bg-gray-50 text-sm ${
                                          formData.beneficiaryBankId ===
                                          bank.benef_banks_uuid
                                            ? "bg-blue-50"
                                            : ""
                                        }`}
                                      >
                                        <div className="font-medium text-gray-900">
                                          {bank.bank_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {bank.bank_acc_no || "N/A"}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                          {beneficiaryBanks.length === 0 &&
                            !banksLoading &&
                            bankError && (
                              <p className="mt-1 text-xs text-amber-600">
                                {bankError}
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-1 text-purple-600" />
                      Additional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Occupation */}
                      <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">
                          Occupation <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="occupation"
                          value={formData.occupation}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          required
                        >
                          <option value="">Select</option>
                          {displayOccupations.map((occ) => (
                            <option
                              key={occ.value || occ.id}
                              value={occ.value || occ.id}
                            >
                              {occ.label || occ.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Income Source */}
                      <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">
                          Income Source <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="income_source"
                          value={formData.income_source}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          required
                        >
                          <option value="">Select</option>
                          {displayIncomeSources.map((source) => (
                            <option
                              key={source.value || source.id}
                              value={source.value || source.id}
                            >
                              {source.label || source.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Purpose */}
                      <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">
                          Purpose <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="purpose"
                          value={formData.purpose}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          required
                        >
                          <option value="">Select</option>
                          {displayPurposes.map((purpose) => (
                            <option
                              key={purpose.value || purpose.id}
                              value={purpose.value || purpose.id}
                            >
                              {purpose.label || purpose.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Recurring Options */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={handleRecurringChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Set up as recurring payment
                      </span>
                    </label>

                    {isRecurring && (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block mb-1.5 text-xs font-medium text-gray-600">
                            Frequency
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {recurringFrequencyOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  handleFrequencyChange(option.value)
                                }
                                className={`px-3 py-1.5 text-sm rounded-lg border ${
                                  frequency === option.value
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {frequency === "specific_day" && (
                          <div>
                            <label className="block mb-1.5 text-xs font-medium text-gray-600">
                              Days Between Payments
                            </label>
                            <input
                              type="text"
                              value={recurringCustomDays}
                              onChange={handleCustomDaysChange}
                              placeholder="e.g., 30"
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        <div className="text-xs text-gray-500 flex items-start">
                          <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                          <span>
                            Payments will be automatically processed on schedule
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hidden fields */}
                  <input
                    type="hidden"
                    name="author_source"
                    value={formData.author_source}
                  />
                  <input
                    type="hidden"
                    name="author_type"
                    value={formData.author_type}
                  />
                  <input
                    type="hidden"
                    name="author_id"
                    value={formData.author_id}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    disabled={loading || isLoading}
                  >
                    {loading ? (
                      <>
                        <Loader className="w-3 h-3 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Recurring Remittance"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddRecurringRemitPopup;
