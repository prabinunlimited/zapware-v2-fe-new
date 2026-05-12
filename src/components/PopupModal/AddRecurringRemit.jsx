// src/components/PopupModal/AddRecurringRemitPopup.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader,
  AlertCircle,
  Search,
  Calendar,
  Repeat,
  ChevronDown,
  User,
  DollarSign,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  Landmark,
  Globe,
  ShieldCheck,
  Wallet,
  Info,
} from "lucide-react";

// --- API Thunks & Redux Imports ---
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
import {
  fetchBeneficiaries,
  fetchBeneficiaryBanks,
  selectBeneficiaryBanks,
  selectBanksLoading,
} from "../../page/Beneficiary/MyBeneficiaries/BeneficiariesSlice";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Fallback Data for Static Data (Purposes, Income Sources, etc.) ---
const fallbackPurposes = [
  {
    id: 1,
    value: "family_support",
    label: "Family Support",
    name: "Family Support",
  },
  {
    id: 2,
    value: "education",
    label: "Education Fees",
    name: "Education Fees",
  },
  {
    id: 3,
    value: "medical",
    label: "Medical Expenses",
    name: "Medical Expenses",
  },
  {
    id: 4,
    value: "business",
    label: "Business Investment",
    name: "Business Investment",
  },
  { id: 5, value: "savings", label: "Savings", name: "Savings" },
  { id: 6, value: "gift", label: "Gift", name: "Gift" },
  { id: 7, value: "travel", label: "Travel", name: "Travel" },
  { id: 8, value: "other", label: "Other", name: "Other" },
];

const fallbackIncomeSources = [
  { id: 1, value: "salary", label: "Salary", name: "Salary" },
  {
    id: 2,
    value: "business",
    label: "Business Income",
    name: "Business Income",
  },
  {
    id: 3,
    value: "investment",
    label: "Investment Income",
    name: "Investment Income",
  },
  { id: 4, value: "rental", label: "Rental Income", name: "Rental Income" },
  { id: 5, value: "pension", label: "Pension", name: "Pension" },
  { id: 6, value: "gift", label: "Gift", name: "Gift" },
  { id: 7, value: "other", label: "Other", name: "Other" },
];

const fallbackOccupations = [
  { id: 1, value: "employed", label: "Employed", name: "Employed" },
  {
    id: 2,
    value: "self_employed",
    label: "Self Employed",
    name: "Self Employed",
  },
  {
    id: 3,
    value: "business_owner",
    label: "Business Owner",
    name: "Business Owner",
  },
  { id: 4, value: "student", label: "Student", name: "Student" },
  { id: 5, value: "retired", label: "Retired", name: "Retired" },
  { id: 6, value: "homemaker", label: "Homemaker", name: "Homemaker" },
  { id: 7, value: "unemployed", label: "Unemployed", name: "Unemployed" },
  { id: 8, value: "other", label: "Other", name: "Other" },
];

const AddRecurringRemitPopup = ({ isOpen, onClose, onSave, customerId }) => {
  const dispatch = useDispatch();

  // =========================================================================
  // COMPONENT STATE
  // =========================================================================
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);
  const [bankError, setBankError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_id: "",
    recurring_frequency: "specific_day",
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

  // Local Search/Dropdown States
  const [beneficiarySearchTerm, setBeneficiarySearchTerm] = useState("");
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [showBeneficiaryDropdown, setShowBeneficiaryDropdown] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // =========================================================================
  // SELECTORS
  // =========================================================================
  const beneficiariesFromStore = useSelector(
    (state) => state.beneficiaries?.beneficiaries || [],
  );
  const beneficiariesLoading = useSelector(
    (state) => state.beneficiaries?.loading || false,
  );
  const beneficiariesHasFetched = useSelector(
    (state) => state.beneficiaries?.hasFetched || false,
  );
  const beneficiaryBanksFromStore = useSelector(selectBeneficiaryBanks);
  const banksLoading = useSelector(selectBanksLoading);
  const sourceCurrencies = useSelector(
    (state) => state.remittance?.bankAccounts || [],
  );
  const destinationCurrencies = useSelector(
    (state) => state.remittance?.currencies?.receiveOptions || [],
  );
  const purposes = useSelector(
    (state) => state.remittanceStatic?.purposes || [],
  );
  const incomeSources = useSelector(
    (state) => state.remittanceStatic?.incomeSources || [],
  );
  const occupations = useSelector(
    (state) => state.remittanceStatic?.occupations || [],
  );

  const API_URL = import.meta.env.VITE_API_URL;
  const bearerToken = localStorage.getItem("bearertoken");
  const customerUuid = localStorage.getItem("customerUuid");
  const authCustomerId = localStorage.getItem("authcustomer_id");
  const currentCustomerId = localStorage.getItem("currentCustomerId");

  // =========================================================================
  // HELPER FUNCTIONS - SEPARATE NUMERIC ID FROM UUID
  // =========================================================================
  
  // ✅ For data fetching (beneficiaries, bank accounts) - use numeric ID
  const getNumericCustomerId = () => {
    // Priority: prop > authcustomer_id > currentCustomerId
    const numericId = customerId || authCustomerId || currentCustomerId;
    
    if (!numericId || numericId === "null" || numericId === "undefined") {
      console.error("No valid numeric customer ID found for data fetching");
      return null;
    }
    
    console.log("🔢 Using numeric ID for data fetching:", numericId);
    return numericId;
  };

  // ✅ For API payload - use UUID
  const getCustomerUuid = () => {
    const uuid = customerUuid;
    if (!uuid || uuid === "null" || uuid === "undefined") {
      console.error("No valid customer UUID found for API payload");
      return null;
    }
    console.log("🆔 Using UUID for API payload:", uuid);
    return uuid;
  };

  const numericCustomerId = getNumericCustomerId();
  const customerUuidValue = getCustomerUuid();

  // Helper function to format date with ordinal suffix
  const formatSelectedDate = (date) => {
    if (!date) return "Select Monthly";
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month}`;
  };

  // =========================================================================
  // DATA FETCHING & EFFECTS
  // =========================================================================
  
  // Set form data with UUID for payload
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      author_id: customerUuidValue || "",
      customer_id: customerUuidValue || "",
    }));
  }, [customerUuidValue]);

  // Fetch all required data when modal opens
  useEffect(() => {
    const fetchAllData = async () => {
      if (!isOpen || dataFetchAttempted) return;
      setDataFetchAttempted(true);
      setLoading(true);

      try {
        // ✅ Use numeric ID for fetching beneficiaries
        if ((!beneficiariesHasFetched || beneficiariesFromStore.length === 0) && numericCustomerId) {
          console.log("Fetching beneficiaries with numeric ID:", numericCustomerId);
          await dispatch(fetchBeneficiaries(numericCustomerId));
        }

        // ✅ Use numeric ID for fetching bank accounts
        if (sourceCurrencies.length === 0 && numericCustomerId) {
          console.log("Fetching bank accounts with numeric ID:", numericCustomerId);
          await dispatch(fetchBankAccounts(numericCustomerId));
        }

        // Fetch payout currencies (doesn't need customer ID)
        if (destinationCurrencies.length === 0) {
          await dispatch(fetchPayoutCurrencies());
        }

        // Fetch static data
        if (
          purposes.length === 0 ||
          incomeSources.length === 0 ||
          occupations.length === 0
        ) {
          await dispatch(fetchAllStaticData());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load required data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchAllData();
    }
  }, [
    isOpen,
    dispatch,
    numericCustomerId,
    beneficiariesHasFetched,
    beneficiariesFromStore.length,
    sourceCurrencies.length,
    destinationCurrencies.length,
    purposes.length,
    incomeSources.length,
    occupations.length,
    dataFetchAttempted,
  ]);

  // Fetch beneficiary banks when beneficiary is selected
  useEffect(() => {
    if (formData.beneficiaryNumericId && formData.destination_currency) {
      console.log("Fetching beneficiary banks for ID:", formData.beneficiaryNumericId);
      dispatch(fetchBeneficiaryBanks(formData.beneficiaryNumericId));
      setBankError("");
    }
    setFormData((prev) => ({ ...prev, beneficiaryBankId: "" }));
  }, [formData.beneficiaryNumericId, formData.destination_currency, dispatch]);

  // Check for bank errors
  useEffect(() => {
    if (
      formData.beneficiaryNumericId &&
      !banksLoading &&
      beneficiaryBanksFromStore.length === 0
    ) {
      setBankError("No bank accounts found for this beneficiary");
    } else {
      setBankError("");
    }
  }, [beneficiaryBanksFromStore, banksLoading, formData.beneficiaryNumericId]);

  // Set default destination currency when available
  useEffect(() => {
    if (destinationCurrencies.length > 0 && !formData.destination_currency) {
      const defaultCurrency = destinationCurrencies.find(
        (currency) => currency.default_remittance === "Y",
      );
      if (defaultCurrency) {
        setFormData((prev) => ({
          ...prev,
          destination_currency: defaultCurrency.currency_code,
        }));
      }
    }
  }, [destinationCurrencies, formData.destination_currency]);

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBeneficiarySelect = (beneficiary) => {
    setFormData((prev) => ({
      ...prev,
      beneficiaryId: beneficiary.benef_uuid,
      beneficiaryNumericId: beneficiary.id,
    }));
    setShowBeneficiaryDropdown(false);
    setBeneficiarySearchTerm("");
  };

  const handleBankSelect = (bank) => {
    setFormData((prev) => ({
      ...prev,
      beneficiaryBankId: bank.benef_banks_uuid || bank.id,
    }));
    setShowBankDropdown(false);
    setBankSearchTerm("");
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (date) {
      const dayOfMonth = date.getDate();
      setFormData((prev) => ({
        ...prev,
        custom_days: dayOfMonth.toString(),
      }));
      setShowCalendar(false);
    }
  };

  const validateCurrentStep = () => {
    if (activeStep === 1) {
      const hasBasicDetails = 
        formData.source_amount &&
        formData.source_amount > 0 &&
        formData.source_currency &&
        formData.destination_currency;
      
      const hasCustomDay = formData.custom_days && formData.custom_days !== "";
      
      return hasBasicDetails && hasCustomDay;
    }
    if (activeStep === 2) {
      return (
        formData.beneficiaryNumericId &&
        (beneficiaryBanksFromStore.length === 0 || formData.beneficiaryBankId)
      );
    }
    if (activeStep === 3) {
      return formData.occupation && formData.income_source && formData.purpose;
    }
    return false;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ✅ Use UUID for API payload
      const finalCustomerUuid = customerUuidValue;
      
      if (!finalCustomerUuid) {
        throw new Error("Customer UUID not found. Please login again.");
      }

      const payload = {
        customer_id: finalCustomerUuid, // Send UUID
        source_amount: formData.source_amount,
        source_currency: formData.source_currency,
        destination_currency: formData.destination_currency,
        beneficiaryId: formData.beneficiaryId,
        beneficiaryBankId: formData.beneficiaryBankId,
        occupation: formData.occupation,
        income_source: formData.income_source,
        purpose: formData.purpose,
        recurring_frequency: "specific_day",
        custom_days: formData.custom_days,
        author_source: "zap",
        author_type: "customer",
        author_id: finalCustomerUuid, // Send UUID
      };

      console.log("📤 Submitting payload with UUID:", payload);

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
        console.log("✅ Recurring remit added successfully:", responseData);
        onSave(responseData.data);
        resetForm();
        onClose();
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
      console.error("❌ Submit error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: customerUuidValue || "",
      recurring_frequency: "specific_day",
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
      author_id: customerUuidValue || "",
    });
    setSelectedDate(null);
    setShowCalendar(false);
    setActiveStep(1);
    setBankError("");
  };

  // =========================================================================
  // SEARCH & FILTER LOGIC
  // =========================================================================
  const filteredBeneficiaries = useMemo(() => {
    return beneficiariesFromStore.filter(
      (b) =>
        (b.benef_name || "")
          .toLowerCase()
          .includes(beneficiarySearchTerm.toLowerCase()) ||
        (b.benef_email || "")
          .toLowerCase()
          .includes(beneficiarySearchTerm.toLowerCase()),
    );
  }, [beneficiariesFromStore, beneficiarySearchTerm]);

  const filteredBanks = useMemo(() => {
    return beneficiaryBanksFromStore.filter(
      (b) =>
        (b.bank_name || "")
          .toLowerCase()
          .includes(bankSearchTerm.toLowerCase()) ||
        (b.bank_acc_no || "").includes(bankSearchTerm),
    );
  }, [beneficiaryBanksFromStore, bankSearchTerm]);

  const selectedBeneficiary = useMemo(
    () =>
      beneficiariesFromStore.find(
        (b) => b.id === formData.beneficiaryNumericId,
      ),
    [beneficiariesFromStore, formData.beneficiaryNumericId],
  );

  const selectedBank = useMemo(
    () =>
      beneficiaryBanksFromStore.find(
        (b) => (b.benef_banks_uuid || b.id) === formData.beneficiaryBankId,
      ),
    [beneficiaryBanksFromStore, formData.beneficiaryBankId],
  );

  // Prepare display data
  const displaySourceCurrencies = sourceCurrencies;
  const displayDestCurrencies = destinationCurrencies;
  const displayPurposes = purposes.length > 0 ? purposes : fallbackPurposes;
  const displayIncomeSources =
    incomeSources.length > 0 ? incomeSources : fallbackIncomeSources;
  const displayOccupations =
    occupations.length > 0 ? occupations : fallbackOccupations;

  if (!isOpen) return null;

  // =========================================================================
  // RENDER UI
  // =========================================================================
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row min-h-[700px] z-10"
        >
          {/* SIDEBAR: Live Summary Preview */}
          <div className="w-full md:w-80 bg-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -mr-32 -mt-32" />

            <div className="relative z-10">
              <div className="mb-12">
                <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-widest text-[10px] uppercase mb-2">
                  <Repeat size={14} className="animate-spin-slow" /> Recurring
                  Remit
                </div>
                <h2 className="text-3xl font-black leading-tight">
                  Schedule your auto-pay.
                </h2>
              </div>

              {/* Step Progress Visualizer */}
              <div className="space-y-8">
                {[
                  {
                    id: 1,
                    title: "Transfer Details",
                    icon: <DollarSign size={16} />,
                  },
                  { id: 2, title: "Recipient", icon: <User size={16} /> },
                  {
                    id: 3,
                    title: "Compliance",
                    icon: <ShieldCheck size={16} />,
                  },
                ].map((step) => (
                  <div key={step.id} className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                        activeStep >= step.id
                          ? "bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/40"
                          : "border-slate-700 text-slate-500"
                      }`}
                    >
                      {activeStep > step.id ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest ${activeStep >= step.id ? "text-indigo-400" : "text-slate-600"}`}
                      >
                        Step 0{step.id}
                      </p>
                      <p
                        className={`font-bold transition-colors ${activeStep >= step.id ? "text-white" : "text-slate-500"}`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="relative z-10 p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4">
                Transfer Preview
              </p>
              <div className="space-y-5">
                <div>
                  <span className="text-4xl font-black block tracking-tighter">
                    {formData.source_amount
                      ? Number(formData.source_amount).toLocaleString()
                      : "0.00"}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-bold text-indigo-400">
                      {formData.source_currency || "CUR"}
                    </span>
                    <ArrowRight size={10} className="text-slate-600" />
                    <span className="text-xs font-bold text-slate-400">
                      {formData.destination_currency || "CUR"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                      <Repeat size={14} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Recurring Day
                      </p>
                      <p className="text-xs font-bold">
                        {selectedDate ? formatSelectedDate(selectedDate) : "Not selected"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                      <User size={14} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        To Recipient
                      </p>
                      <p className="text-xs font-bold truncate">
                        {selectedBeneficiary?.benef_name || "---"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 bg-white p-8 md:p-12 overflow-y-auto max-h-[85vh] flex flex-col">
            <header className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {activeStep === 1 && "Add Recurring Remit"}
                  {activeStep === 2 && "Who are you sending to?"}
                  {activeStep === 3 && "Security & Compliance"}
                </h3>
                <p className="text-slate-500 font-medium mt-1">
                  Please fill in all required fields marked with *
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </header>

            {/* Loading State */}
            {loading && destinationCurrencies.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="ml-3 text-slate-600 font-medium">
                  Loading required data...
                </span>
              </div>
            )}

            {/* Error Message Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start gap-3 text-sm font-bold">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="space-y-8"
                >
                  {/* STEP 1: TRANSFER DETAILS */}
                  {activeStep === 1 && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
                            Transfer Amount *
                          </label>
                          <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                              type="number"
                              name="source_amount"
                              placeholder="0.00"
                              value={formData.source_amount}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-xl"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
                            Frequency *
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowCalendar(!showCalendar)}
                              className="w-full p-5 bg-slate-50 border-2 border-transparent hover:border-indigo-200 rounded-[1.5rem] text-left flex items-center justify-between transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <Calendar className="text-indigo-500" size={20} />
                                <span className="font-bold text-slate-700">
                                  {selectedDate ? formatSelectedDate(selectedDate) : "Select Monthly"}
                                </span>
                              </div>
                              <ChevronDown
                                className={`transition-transform text-slate-400 ${showCalendar ? "rotate-180" : ""}`}
                                size={18}
                              />
                            </button>

                            {/* Calendar Dropdown */}
                            <AnimatePresence>
                              {showCalendar && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute z-30 w-full mt-3 bg-white rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden p-6"
                                >
                                  <div className="flex justify-between items-center mb-4">
                                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                      Select Day of Month
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setShowCalendar(false)}
                                      className="text-slate-400 hover:text-slate-600"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                  <DatePicker
                                    selected={selectedDate}
                                    onChange={handleDateSelect}
                                    inline
                                    showMonthYearPicker={false}
                                    dateFormat="MMMM d"
                                  />
                                  <p className="text-xs text-slate-500 mt-4 text-center">
                                    This transfer will recur on the selected day each month
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
                            Source Currency *
                          </label>
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <select
                              name="source_currency"
                              value={formData.source_currency}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-12 pr-10 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-[1.5rem] outline-none font-bold appearance-none cursor-pointer"
                            >
                              <option value="">Select Account</option>
                              {displaySourceCurrencies.map((account) => (
                                <option
                                  key={account.id}
                                  value={account.currency_code}
                                >
                                  {account.currency_code} -{" "}
                                  {account.bank_name || account.currency_name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                              size={18}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
                            Payout Currency *
                          </label>
                          <div className="relative">
                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <select
                              name="destination_currency"
                              value={formData.destination_currency}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-12 pr-10 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-[1.5rem] outline-none font-bold appearance-none cursor-pointer"
                            >
                              <option value="">Select Currency</option>
                              {displayDestCurrencies.map((currency) => (
                                <option
                                  key={currency.payout_currency_id}
                                  value={currency.currency_code}
                                >
                                  {currency.currency_code} {currency.icon}
                                  {currency.default_remittance === "Y" &&
                                    " (Default)"}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                              size={18}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: RECIPIENT */}
                  {activeStep === 2 && (
                    <div className="space-y-8">
                      <div className="relative">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-3 block">
                          Search Beneficiary *
                        </label>
                        <div
                          onClick={() =>
                            setShowBeneficiaryDropdown(!showBeneficiaryDropdown)
                          }
                          className={`p-6 bg-white rounded-[1.5rem] border-2 transition-all cursor-pointer flex justify-between items-center ${
                            formData.beneficiaryNumericId
                              ? "border-indigo-500 bg-indigo-50/20"
                              : "border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                              {selectedBeneficiary ? (
                                <CheckCircle2 size={24} />
                              ) : (
                                <Search size={24} />
                              )}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-lg leading-tight">
                                {selectedBeneficiary
                                  ? selectedBeneficiary.benef_name ||
                                    selectedBeneficiary.name
                                  : "Find a saved recipient"}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">
                                Select from your contact list
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            className={`transition-transform duration-300 text-slate-400 ${showBeneficiaryDropdown ? "rotate-180" : ""}`}
                          />
                        </div>

                        {/* Beneficiary Custom Search Dropdown */}
                        <AnimatePresence>
                          {showBeneficiaryDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute z-30 w-full mt-3 bg-white rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden"
                            >
                              <div className="p-5 border-b bg-slate-50/50 flex items-center gap-3">
                                <Search size={16} className="text-slate-400" />
                                <input
                                  autoFocus
                                  className="w-full bg-transparent outline-none font-bold text-slate-700"
                                  placeholder="Type a name or email..."
                                  value={beneficiarySearchTerm}
                                  onChange={(e) =>
                                    setBeneficiarySearchTerm(e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {beneficiariesLoading ? (
                                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                                    <Loader
                                      size={20}
                                      className="animate-spin text-indigo-500"
                                    />
                                    <p className="text-xs font-bold uppercase tracking-widest">
                                      Scanning list...
                                    </p>
                                  </div>
                                ) : filteredBeneficiaries.length === 0 ? (
                                  <div className="p-8 text-center text-slate-400 font-bold">
                                    No recipients found.
                                  </div>
                                ) : (
                                  filteredBeneficiaries.map((b) => (
                                    <div
                                      key={b.id}
                                      className="p-5 hover:bg-indigo-50/50 cursor-pointer flex items-center gap-4 border-b border-slate-50 last:border-0 transition-colors"
                                      onClick={() => handleBeneficiarySelect(b)}
                                    >
                                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600">
                                        {(b.benef_name || b.name || "U").charAt(
                                          0,
                                        )}
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-800 block">
                                          {b.benef_name || b.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                                          {b.benef_email ||
                                            b.email ||
                                            "No email"}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {formData.beneficiaryNumericId && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-5"
                        >
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                              Select Account *
                            </label>
                            {banksLoading && (
                              <Loader
                                size={14}
                                className="animate-spin text-indigo-500"
                              />
                            )}
                          </div>

                          {bankError && (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 text-amber-800 text-xs font-bold">
                              <Info size={16} /> {bankError}
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-3">
                            {beneficiaryBanksFromStore.map((bank) => (
                              <div
                                key={bank.id}
                                onClick={() => handleBankSelect(bank)}
                                className={`p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer flex items-center justify-between ${
                                  formData.beneficiaryBankId ===
                                  (bank.benef_banks_uuid || bank.id)
                                    ? "border-indigo-500 bg-indigo-50/50 shadow-sm"
                                    : "border-slate-100 hover:border-slate-200"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`p-3.5 rounded-2xl transition-colors ${formData.beneficiaryBankId === (bank.benef_banks_uuid || bank.id) ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"}`}
                                  >
                                    <Landmark size={22} />
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-900 leading-tight">
                                      {bank.bank_name}
                                    </p>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5 tracking-tighter">
                                      Acc: ••••{" "}
                                      {bank.bank_acc_no?.slice(-4) || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                {formData.beneficiaryBankId ===
                                  (bank.benef_banks_uuid || bank.id) && (
                                  <motion.div
                                    layoutId="bankCheck"
                                    className="text-indigo-600"
                                  >
                                    <CheckCircle2 size={24} />
                                  </motion.div>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* STEP 3: COMPLIANCE */}
                  {activeStep === 3 && (
                    <div className="space-y-8">
                      <div className="p-5 bg-indigo-900 text-white rounded-[2rem] flex gap-4 items-start relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                        <ShieldCheck
                          size={24}
                          className="shrink-0 text-indigo-400 mt-1"
                        />
                        <div>
                          <p className="text-sm font-bold leading-relaxed italic">
                            "For your security and international anti-money
                            laundering compliance, please confirm your current
                            professional details for this recurring mandate."
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
                            Your Occupation *
                          </label>
                          <div className="relative group">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <select
                              name="occupation"
                              value={formData.occupation}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-12 pr-10 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-[1.5rem] outline-none font-bold appearance-none cursor-pointer"
                            >
                              <option value="">Choose Occupation</option>
                              {displayOccupations.map((occ) => (
                                <option
                                  key={occ.id}
                                  value={occ.value || occ.id}
                                >
                                  {occ.label || occ.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                              size={18}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
                            Source of Funds *
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <select
                              name="income_source"
                              value={formData.income_source}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-12 pr-10 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-[1.5rem] outline-none font-bold appearance-none cursor-pointer"
                            >
                              <option value="">Select Income Source</option>
                              {displayIncomeSources.map((source) => (
                                <option
                                  key={source.id}
                                  value={source.value || source.id}
                                >
                                  {source.label || source.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                              size={18}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
                            Purpose of Remittance *
                          </label>
                          <div className="relative">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <select
                              name="purpose"
                              value={formData.purpose}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-12 pr-10 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-[1.5rem] outline-none font-bold appearance-none cursor-pointer"
                            >
                              <option value="">Select Transfer Purpose</option>
                              {displayPurposes.map((purpose) => (
                                <option
                                  key={purpose.id}
                                  value={purpose.value || purpose.id}
                                >
                                  {purpose.label || purpose.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                              size={18}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Hidden Inputs */}
                      <input type="hidden" name="author_source" value="zap" />
                      <input
                        type="hidden"
                        name="author_type"
                        value="customer"
                      />
                      <input
                        type="hidden"
                        name="author_id"
                        value={customerUuidValue || ""}
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* ACTION FOOTER */}
              <div className="mt-auto pt-10 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={
                    activeStep === 1
                      ? onClose
                      : () => setActiveStep((p) => p - 1)
                  }
                  className="px-8 py-4 font-bold text-slate-400 hover:text-slate-800 transition-all flex items-center gap-2 group"
                >
                  {activeStep > 1 && (
                    <ArrowLeft
                      size={18}
                      className="group-hover:-translate-x-1 transition-transform"
                    />
                  )}
                  {activeStep === 1 ? "Discard" : "Go Back"}
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!validateCurrentStep() || loading}
                  onClick={
                    activeStep === 3
                      ? handleSubmit
                      : () => setActiveStep((p) => p + 1)
                  }
                  className={`px-10 py-4 rounded-[1.5rem] font-black text-lg flex items-center gap-3 transition-all ${
                    validateCurrentStep() && !loading
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                      : "bg-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      {activeStep === 3 ? "Activate Recurring Pay" : "Continue"}
                      <ArrowRight size={20} />
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddRecurringRemitPopup;