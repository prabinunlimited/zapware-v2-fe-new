import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiArrowLeft, FiInfo, FiPlusCircle } from "react-icons/fi";
import { FaCheck, FaUniversity, FaTimes, FaExchangeAlt } from "react-icons/fa";
import {  RingLoader } from "react-spinners";
import Select from "react-select";
import axios from "axios";
import { apiCoordinator } from "../../services/api";

// Redux imports
import {
  // Selectors
  selectFormValues,
  selectCustomerBankAccounts,
  selectBenefBankAccounts,
  selectBeneficiaryBanks,
  selectDestinationCurrencies,
  selectCountries,
  selectCurrencies,
  selectConversionData,
  selectAvailableBalance,
  selectLoading,
  selectBenefLoading,
  selectVerifying,
  selectModalStates,
  selectModalMessage,
  selectPasscode,
  selectServiceProviderInr,

  // Actions
  setFormValue,
  setFormValues,
  setFileValue,
  setShowModal,
  setShowSuccessModal,
  setShowErrorModal,
  setShowPasscodeModal,
  setModalMessage,
  setPasscode,
  setLoading,
  setBenefLoading,
  setVerifying,

  // Thunks
  fetchDestinationCurrencies,
  fetchCustomerBankAccounts,
  fetchBeneficiaryAccounts,
  fetchBeneficiaryBanks,
  fetchCountries,
  fetchCurrenciesForCountry,
  fetchServiceProvider,
  fetchBalance,
  convertCurrency,
  sendPasscode,
  verifyPasscode,
  submitPayout,
  resetPayoutState,
  selectInitialLoading,
} from "./slices/payoutSlice";

const API_URL = import.meta.env.VITE_API_URL;

// Step Indicator Component
const StepIndicator = ({ activeStep }) => {
  const steps = [
    { number: 1, label: "Account Selection" },
    { number: 2, label: "Transfer Details" },
    { number: 3, label: "Confirmation" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold font-sans ${
                  activeStep >= step.number
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 text-gray-500 bg-white"
                }`}
              >
                {step.number}
              </div>
              <span
                className={`mt-2 text-sm font-medium font-sans ${
                  activeStep >= step.number ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-24 h-1 mx-4 ${
                  activeStep > step.number ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Success Popup Component
const SuccessPopup = ({ transaction, onClose, onDownload }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheck className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 font-sans">
          Success!
        </h3>
        <p className="text-gray-600 mb-6 font-sans">
          Your payout has been initiated successfully.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onDownload}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium font-sans"
          >
            Download Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium font-sans"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

// Cancel Modal Component
const CancelModal = ({ onConfirm, onCancel }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaTimes className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 font-sans">
          Cancel Payout?
        </h3>
        <p className="text-gray-600 mb-6 font-sans">
          Are you sure you want to cancel this payout? Your progress will be
          lost.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium font-sans"
          >
            Continue
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium font-sans"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

// Safe array access helper function
const safeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) {
    // If it's an object, try to extract array from common properties
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.accounts && Array.isArray(data.accounts)) return data.accounts;
    if (data.items && Array.isArray(data.items)) return data.items;
  }
  console.warn("Expected array but got:", typeof data, data);
  return [];
};

const PayoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useParams();
  const bearertoken = localStorage.getItem("bearertoken");

  // Select state from Redux
  const formValues = useSelector(selectFormValues);
  const customerBankAccounts = useSelector(selectCustomerBankAccounts);
  const benefBankAccounts = useSelector(selectBenefBankAccounts);
  const beneficiaryBanks = useSelector(selectBeneficiaryBanks);
  const destinationCurrencies = useSelector(selectDestinationCurrencies);
  const countries = useSelector(selectCountries);
  const currencies = useSelector(selectCurrencies);
  const {
    convertedValue,
    convertedId,
    fxRate,
    swiftRate,
    payoutRate,
    toServiceProvider,
  } = useSelector(selectConversionData);
  const availableBalance = useSelector(selectAvailableBalance);
  const loading = useSelector(selectLoading);
  const benefLoading = useSelector(selectBenefLoading);
  const verifying = useSelector(selectVerifying);
  const { showModal, showSuccessModal, showErrorModal, showPasscodeModal } =
    useSelector(selectModalStates);
  const modalMessage = useSelector(selectModalMessage);
  const passcode = useSelector(selectPasscode);
  const toServiceProviderInr = useSelector(selectServiceProviderInr);
  const initialLoading = useSelector(selectInitialLoading);

  // Local state for UI
  const [activeStep, setActiveStep] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("");
  const [customDays, setCustomDays] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("🔍 customerBankAccounts:", customerBankAccounts);
    console.log(
      "🔍 Type of customerBankAccounts:",
      typeof customerBankAccounts
    );
    console.log("🔍 Is array?", Array.isArray(customerBankAccounts));
  }, [customerBankAccounts]);

  // Initialize form with customerId
  useEffect(() => {
    dispatch(setFormValue({ name: "customer_id", value: customerId }));
  }, [customerId, dispatch]);

  // Fetch initial data
  useEffect(() => {
    const authtoken = localStorage.getItem("authtoken");
    if (customerId && authtoken) {
      console.log("🔄 Fetching initial data for customer:", customerId);
      dispatch(fetchCustomerBankAccounts(customerId))
        .unwrap()
        .then((result) => {
          console.log("✅ Customer bank accounts loaded:", result);
          setDataLoaded(true);
        })
        .catch((error) => {
          console.error("❌ Failed to load customer bank accounts:", error);
          setDataLoaded(true);
        });

      dispatch(fetchCountries());
      dispatch(fetchDestinationCurrencies());
    }
  }, [customerId, dispatch]);

  // Update step based on form progress
  useEffect(() => {
    if (formValues.from && formValues.to && formValues.transaction_type) {
      setActiveStep(2);
    } else {
      setActiveStep(1);
    }
  }, [formValues.from, formValues.to, formValues.transaction_type]);

  // Handlers
  const handleChange = async (e) => {
    const { name, value } = e.target;
    dispatch(setFormValue({ name, value }));

    // Handle dependent data fetching
    if (name === "benef_account" && value) {
      dispatch(
        fetchBeneficiaryBanks({
          currency_code: formValues.to,
          beneficiaryId: value,
          payment_method: formValues.transaction_type,
        })
      );
    }

    if (name === "country_id") {
      dispatch(fetchCurrenciesForCountry(value));
    }

    if (name === "to" && value) {
      dispatch(fetchServiceProvider(value));
      dispatch(fetchBeneficiaryAccounts({ customerId, currencyCode: value }));
    }

    if (name === "from") {
      dispatch(fetchBalance({ customer_id: customerId, currency_code: value }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a file of type PDF, JPG, JPEG, or PNG.");
        return;
      }
      dispatch(setFileValue({ name, file }));
    }
  };

  const handleConvert = async () => {
    // Use safeArray to ensure we're working with an array
    const safeCustomerAccounts = safeArray(customerBankAccounts);
    const selectedAccount = safeCustomerAccounts.find(
      (account) => account.currency_code === formValues.from
    );

    const payload = {
      current_date_time: new Date().toLocaleString(),
      bank_id: selectedAccount ? selectedAccount.id : null,
      customer_id: formValues.customer_id,
      from: formValues.from,
      to: formValues.to,
      value: formValues.value,
      benefId: formValues.benef_account,
      payment_method: formValues.transaction_type,
      benef_bank_account: formValues.benef_bank_account,
      description: formValues.description,
    };

    dispatch(convertCurrency(payload));
    setActiveStep(3);
  };

  const handleSendPasscode = async () => {
    dispatch(sendPasscode(customerId));
  };

  const handleVerifyAndConvert = async (e) => {
    if (!passcode) {
      toast.error("Please enter passcode");
      return;
    }

    try {
      // ✅ No need to manually clear signatures - api.js handles this automatically
      const res = await dispatch(
        verifyPasscode({
          customer_id: customerId,
          passcode: passcode,
          context: "payout_verification", // This will be used in the signature
        })
      ).unwrap();

      if (res.Status === "success") {
        // Handle B4B payment scenario
        const toprovider = await axios.get(
          `${API_URL}/get-sp-currency/${formValues.to}`,
          {
            headers: {
              Authorization: `Bearer ${bearertoken}`,
            },
          }
        );

        const serviceProviderId = Number(toprovider.data.service_provider_id);

        // Use safeArray to ensure we're working with an array
        const safeCustomerAccounts = safeArray(customerBankAccounts);
        const selectedAccount = safeCustomerAccounts.find(
          (account) => account.currency_code === formValues.from
        );

        const payload = {
          current_date_time: new Date().toLocaleString(),
          bank_id: selectedAccount ? selectedAccount.id : null,
          customer_id: formValues.customer_id,
          from: formValues.from,
          to: formValues.to,
          value: formValues.value,
          benefId: formValues.benef_account,
          payment_method: formValues.transaction_type,
          benef_bank_account: formValues.benef_bank_account,
          description: formValues.description,
        };

        if (
          serviceProviderId !== 27 &&
          ((formValues.from === "GBP" && formValues.to === "GBP") ||
            (formValues.from === "GBP" && formValues.to === "DKK") ||
            (formValues.from === "GBP" && formValues.to === "EUR") ||
            (formValues.from === "EUR" && formValues.to === "EUR") ||
            (formValues.from === "EUR" && formValues.to === "GBP") ||
            (formValues.from === "EUR" && formValues.to === "DKK") ||
            (formValues.from === "DKK" && formValues.to === "GBP") ||
            (formValues.from === "DKK" && formValues.to === "EUR") ||
            (formValues.from === "DKK" && formValues.to === "DKK") ||
            (formValues.from === "USD" && formValues.to === "USD"))
        ) {
          // Call createpayments API after successful verification
          const res = await axios.post(
            "https://sandbox-zapware.unlimitedremit.com/api/b4b/createpayments",
            payload
          );

          if (res.data.status === "Success") {
            dispatch(setShowModal(false));
            dispatch(setModalMessage("Payout initiated successfully!"));
            dispatch(setShowSuccessModal(true));
          } else {
            dispatch(setModalMessage(res.data.message));
            dispatch(setShowErrorModal(true));
          }
        } else {
          await handleSubmit(e, isRecurring, recurringFrequency, customDays);
        }
      } else {
        dispatch(setModalMessage(res.message || "Invalid passcode"));
        dispatch(setShowErrorModal(true));
      }
    } catch (err) {
      console.error("Payout passcode verification error:", err);
      dispatch(
        setModalMessage(
          err.response?.data?.message || err.message || "Verification failed"
        )
      );
      dispatch(setShowErrorModal(true));
    }
  };

  const handleSubmit = async (
    e,
    isRecurring,
    recurringFrequency,
    customDays
  ) => {
    e.preventDefault();

    // Use safeArray to ensure we're working with an array
    const safeCustomerAccounts = safeArray(customerBankAccounts);
    const selectedAccount = safeCustomerAccounts.find(
      (account) => account.currency_code === formValues.from
    );

    const formData = new FormData();

    formData.append("convertedValue", convertedValue);
    formData.append("amount", formValues.value);
    formData.append("purpose", formValues.purpose);
    formData.append("promo_code", formValues.promocode);
    formData.append("convertedId", convertedId);
    formData.append("currency", formValues.to);
    formData.append("source_currency", formValues.from);
    formData.append("destination_country", formValues.destination_country);
    formData.append("source_country", formValues.source_country);
    formData.append("pay_mode", formValues.pay_mode);
    formData.append("payment_method", formValues.transaction_type);
    formData.append("remarks", formValues.remarks);
    formData.append("income_source", formValues.income_source);
    formData.append("transfer_purpose", formValues.transfer_purpose);
    formData.append("occupation", formValues.occupation);
    formData.append("benef_account", formValues.benef_account);
    formData.append("benef_bank_account", formValues.benef_bank_account);
    formData.append("bank_id", selectedAccount ? selectedAccount.id : null);
    formData.append("customer_id", formValues.customer_id);
    formData.append("description", formValues.description);
    formData.append("country_id", formValues.country_id);
    formData.append("transaction_type", formValues.transaction_type);

    // Append recurring payment fields
    formData.append("is_recurring", isRecurring ? 1 : 0);
    if (isRecurring) {
      formData.append("recurring_frequency", recurringFrequency);
      if (
        recurringFrequency === "specific_day" ||
        recurringFrequency === "custom"
      ) {
        formData.append("recurring_custom_days", customDays);
      }
    }

    // Append file if exists
    if (formValues.invoice_file) {
      formData.append("invoice_file", formValues.invoice_file);
    }

    dispatch(submitPayout(formData));
  };

  const handleAddBeneficiary = () => {
    navigate(`/addbeneficiary/${customerId}`, {
      state: { is_payout: "y" },
    });
  };

  useEffect(() => {
    return () => {
      dispatch(resetPayoutState());
    };
  }, [dispatch]);

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    dispatch(resetPayoutState());
    navigate(-1);
  };

  // Helper functions
  const getAvailableTransactionTypes = (currency, providerId) => {
    if (currency === "KES") {
      if (providerId === 33) return ["mobile"];
      if (providerId === 41) return ["bank"];
    }

    const payoutMethodsByCurrency = {
      USD: ["swift", "bank"],
      NPR: ["bank"],
      INR: ["bank"],
      KES: ["bank"],
      AED: ["bank"],
      PKR: ["bank"],
      LKR: ["bank"],
      BDT: ["bank"],
      MYR: ["bank"],
      NGN: ["bank"],
      GMD: ["cash", "bank", "mobile"],
      VND: ["card", "bank"],
      GBP: ["bank"],
      EUR: ["bank"],
      DKK: ["bank"],
    };

    return payoutMethodsByCurrency[currency] || [];
  };

  const availableTransactionTypes = getAvailableTransactionTypes(
    formValues.to,
    toServiceProviderInr
  );

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "transparent",
      border: "1px solid #D1D5DB",
      borderRadius: "0.75rem",
      padding: "12px 16px",
      fontSize: "1rem",
      color: "#111827",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#3B82F6",
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.75rem",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#6B7280",
      fontWeight: 500,
    }),
  };

  const countryOptions = safeArray(countries).map((country) => ({
    value: country.country_code3,
    label: country.name,
  }));

  const destinationcountryOptions = safeArray(countries).map((country) => ({
    value: country.id,
    label: country.name,
  }));

  const aedPurpose = [
    { value: "charity", label: "Charity" },
    { value: "family", label: "Family" },
    { value: "financial_services", label: "Financial Services" },
    { value: "salaries", label: "Salaries" },
    { value: "utility_bill", label: "utility_bill" },
    { value: "goods_sold", label: "Goods Sold" },
    { value: "goods_bought", label: "Goods Bought" },
    { value: "information_technology", label: "information_technology" },
    { value: "telecommunications", label: "Tele Communications" },
    { value: "none", label: "None" },
  ];

  // Field visibility helpers
  const showIncomeSourceField = () => {
    if (
      ["INR", "MYR", "KES", "PKR", "GBP", "EUR"].includes(formValues.to) &&
      toServiceProviderInr === 27
    )
      return true;
    if (
      ["NPR", "KES", "BDT", "LKR"].includes(formValues.to) &&
      toServiceProviderInr !== 41
    )
      return true;
    if (toServiceProviderInr === 41) return true;
    return false;
  };

  const showTransferPurposeField = () => {
    if (
      ["INR", "MYR", "KES", "GBP", "EUR"].includes(formValues.to) &&
      toServiceProviderInr === 27
    )
      return true;
    if (
      ["NPR", "KES", "BDT", "LKR", "PKR", "NGN"].includes(formValues.to) &&
      toServiceProviderInr !== 41 &&
      toServiceProviderInr !== 49
    )
      return true;
    if (toServiceProviderInr === 49 || toServiceProviderInr === 41) return true;
    return false;
  };

  // Use safeArray for all array operations
  const safeCustomerBankAccounts = safeArray(customerBankAccounts);
  const safeBenefBankAccounts = safeArray(benefBankAccounts);
  const safeBeneficiaryBanks = safeArray(beneficiaryBanks);
  const safeDestinationCurrencies = safeArray(destinationCurrencies);
  const safeCurrencies = safeArray(currencies);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 font-sans">
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Loading states - Context-aware loaders */}
      {(loading || initialLoading || benefLoading) && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full mx-4 border border-gray-200">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <RingLoader color="#3B82F6" size={60} />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2 font-sans">
                {loading
                  ? "Processing Transaction..."
                  : initialLoading
                  ? "Loading Data..."
                  : "Loading Beneficiaries..."}
              </h3>
              <p className="text-sm text-gray-600 font-sans">
                {loading
                  ? "Your transaction is being processed"
                  : initialLoading
                  ? "Please wait while we load your data"
                  : "Loading beneficiary information..."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center mb-4 text-gray-600 hover:text-gray-800 transition-colors font-medium font-sans"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-sans">
                Send Money
              </h1>
              <p className="text-gray-600 mt-2 font-sans">
                Transfer funds to your beneficiaries securely
              </p>
            </div>
            <motion.button
              type="button"
              onClick={handleAddBeneficiary}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 font-sans"
            >
              <FiPlusCircle className="mr-2" />
              Add Beneficiary
            </motion.button>
          </div>

          <StepIndicator activeStep={activeStep} />
        </div>

        {/* Main Form */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-medium text-gray-900 font-sans">
              Transfer Details
            </h2>
          </div>

          <form className="px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Source Currency */}
              <div>
                <label
                  htmlFor="from"
                  className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                >
                  Source Currency
                </label>
                <select
                  name="from"
                  value={formValues.from}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                  required
                >
                  <option value="">Select Currency</option>
                  {safeCustomerBankAccounts.length > 0 ? (
                    safeCustomerBankAccounts.map((account) => (
                      <option key={account.id} value={account.currency_code}>
                        {account.currency_code}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No accounts available
                    </option>
                  )}
                </select>
                {availableBalance !== null && (
                  <p className="mt-2 text-sm text-green-600 font-medium font-sans">
                    Available Balance: {availableBalance} {formValues.from}
                  </p>
                )}
              </div>

              {/* Source Amount */}
              <div>
                <label
                  htmlFor="value"
                  className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                >
                  Amount to Send
                </label>
                <input
                  type="number"
                  name="value"
                  value={formValues.value}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                  required
                />
              </div>

              {/* Destination Currency */}
              {formValues.transaction_type !== "swift" && (
                <div>
                  <label
                    htmlFor="to"
                    className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                  >
                    Destination Currency
                  </label>
                  <select
                    name="to"
                    value={formValues.to}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                  >
                    <option value="" disabled>
                      Select Destination Currency
                    </option>
                    {safeDestinationCurrencies.map((currency) => (
                      <option
                        key={currency.currency_code}
                        value={currency.currency_code}
                      >
                        {currency.currency_code}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Method */}
              {formValues.to && (
                <div>
                  <label
                    htmlFor="transaction_type"
                    className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                  >
                    Payment Method
                  </label>
                  <select
                    name="transaction_type"
                    value={formValues.transaction_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                  >
                    <option value="" disabled>
                      Select Payment Method
                    </option>
                    {availableTransactionTypes.map((method) => (
                      <option key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Additional Fields Grid */}
            {(formValues.transaction_type === "swift" ||
              formValues.to === "AED" ||
              ["AED", "KES"].includes(formValues.to) ||
              formValues.to === "INR" ||
              showIncomeSourceField() ||
              showTransferPurposeField() ||
              formValues.to === "NPR") && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* SWIFT Specific Fields */}
                {formValues.transaction_type === "swift" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">
                        Select Destination Country
                      </label>
                      <Select
                        options={destinationcountryOptions}
                        onChange={(selectedOption) =>
                          handleChange({
                            target: {
                              name: "country_id",
                              value: selectedOption?.value,
                            },
                          })
                        }
                        value={destinationcountryOptions.find(
                          (option) => option.value === formValues.country_id
                        )}
                        classNamePrefix="react-select"
                        placeholder="Select Destination Country"
                        styles={customStyles}
                      />
                    </div>

                    {safeCurrencies.length > 0 && (
                      <div>
                        <label
                          htmlFor="to"
                          className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                        >
                          Select Destination Currency
                        </label>
                        <select
                          name="to"
                          value={formValues.to}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                        >
                          <option value="" disabled>
                            Select Currency
                          </option>
                          {safeCurrencies.map((currency) => (
                            <option
                              key={currency.currency_id}
                              value={currency.currency?.currency_code}
                            >
                              {currency.currency?.currency_code}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* AED Purpose Code */}
                {formValues.to === "AED" && (
                  <div>
                    <label
                      htmlFor="purpose"
                      className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                    >
                      Purpose Code
                    </label>
                    <select
                      name="purpose"
                      value={formValues.purpose}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                    >
                      <option value="">Select a Purpose</option>
                      {aedPurpose.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Promocode */}
                {["AED", "KES"].includes(formValues.to) && (
                  <div>
                    <label
                      htmlFor="promocode"
                      className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                    >
                      Promocode (optional)
                    </label>
                    <input
                      type="text"
                      name="promocode"
                      value={formValues.promocode}
                      onChange={handleChange}
                      placeholder="Enter promocode"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                    />
                  </div>
                )}

                {/* INR Specific Fields */}
                {formValues.to === "INR" && toServiceProvider === 25 && (
                  <div>
                    <label
                      htmlFor="pay_mode"
                      className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                    >
                      PayMode
                    </label>
                    <select
                      name="pay_mode"
                      value={formValues.pay_mode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                    >
                      <option value="" disabled>
                        Select PayMode
                      </option>
                      <option value="IM">IMPS</option>
                    </select>
                  </div>
                )}

                {formValues.to === "INR" && (
                  <div>
                    <label
                      htmlFor="remarks"
                      className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                    >
                      Remarks
                    </label>
                    <input
                      type="text"
                      name="remarks"
                      value={formValues.remarks}
                      onChange={handleChange}
                      placeholder="Enter Remarks"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                    />
                  </div>
                )}

                {/* Income Source */}
                {showIncomeSourceField() && (
                  <div>
                    <label
                      htmlFor="income_source"
                      className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                    >
                      Income Source
                    </label>
                    <select
                      name="income_source"
                      value={formValues.income_source}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                    >
                      <option value="" disabled>
                        Select Income Source
                      </option>
                      {toServiceProviderInr === 41 ? (
                        <>
                          <option value="1">PERSONAL SAVINGS</option>
                          <option value="2">SALARY</option>
                          <option value="3">END OF SERVICE FUNDS</option>
                          <option value="4">
                            LOAN FROM FINANCIAL INSTITUTION
                          </option>
                          <option value="5">BUSINESS</option>
                          <option value="6">OTHERS</option>
                        </>
                      ) : (
                        <>
                          <option value="SAL">SALARIED</option>
                          <option value="PIE">PERSONAL INCOME</option>
                          <option value="BUS">BUSINESS</option>
                          <option value="LON">LOAN</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {/* Transfer Purpose */}
                {showTransferPurposeField() && (
                  <div>
                    <label
                      htmlFor="transfer_purpose"
                      className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                    >
                      Transfer Purpose
                    </label>
                    <select
                      name="transfer_purpose"
                      value={formValues.transfer_purpose}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                    >
                      <option value="" disabled>
                        Select Transfer Purpose
                      </option>
                      {toServiceProviderInr === 49 ? (
                        <>
                          <option value="1">FAMILY MAINTENANCE</option>
                          <option value="2">EDUCATION</option>
                          <option value="3">MEDICAL</option>
                          <option value="4">INVESTMENT</option>
                          <option value="5">TOURISM</option>
                        </>
                      ) : toServiceProviderInr === 41 ? (
                        <>
                          <option value="1">FAMILY MAINTENANCE</option>
                          <option value="2">MEDICAL</option>
                          <option value="3">TRAVEL AND TOURISM</option>
                          <option value="4">EDUCATION</option>
                          <option value="5">ACCOUNT OPENING</option>
                          <option value="6">SAVINGS</option>
                          <option value="7">INSURANCE</option>
                          <option value="8">
                            INVESTMENT IN MUTUAL FUNDS/SHARES
                          </option>
                          <option value="9">LOAN PAYMENT</option>
                          <option value="10">SALARY</option>
                          <option value="11">TAX PAYMENT</option>
                        </>
                      ) : toServiceProviderInr === 27 ? (
                        <>
                          <option value="FAM">Family Maintenance</option>
                          <option value="SAV">SAVINGS</option>
                          <option value="TRE">TRADE REMITTANCE</option>
                        </>
                      ) : (
                        <>
                          <option value="FAM">FAMILY</option>
                          <option value="SAV">SAVINGS</option>
                          <option value="RE">REMITTANCE</option>
                          <option value="GIFT">GIFT</option>
                          <option value="TRE">TRADE REMITTANCE</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {/* Occupation */}
                {formValues.to === "NPR" && (
                  <div>
                    <label
                      htmlFor="occupation"
                      className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                    >
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formValues.occupation}
                      onChange={handleChange}
                      placeholder="Enter Occupation"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                    />
                  </div>
                )}

                {/* USD Invoice Upload */}
                {formValues.to === "USD" &&
                  formValues.from !== "GBP" &&
                  formValues.transaction_type !== "swift" && (
                    <div>
                      <label
                        htmlFor="invoice_file"
                        className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                      >
                        Invoice Upload (optional)
                      </label>
                      <input
                        type="file"
                        name="invoice_file"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                      />
                    </div>
                  )}
              </div>
            )}

            {/* Beneficiary Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <label
                  htmlFor="benef_account"
                  className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                >
                  Select Beneficiary
                </label>
                <div className="flex items-center gap-2">
                  <select
                    name="benef_account"
                    value={formValues.benef_account}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                    required
                  >
                    <option value="">Select a beneficiary</option>
                    {safeBenefBankAccounts.length > 0 ? (
                      safeBenefBankAccounts.map((benefBankAccount) => (
                        <option
                          key={benefBankAccount.id}
                          value={benefBankAccount.id}
                        >
                          {benefBankAccount.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No beneficiaries available
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Beneficiary Bank Account */}
              {safeBeneficiaryBanks.length > 0 && (
                <div>
                  <label
                    htmlFor="benef_bank_account"
                    className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                  >
                    Select Beneficiary Bank Account
                  </label>
                  <select
                    name="benef_bank_account"
                    value={formValues.benef_bank_account}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                  >
                    <option value="">Select a bank account</option>
                    {safeBeneficiaryBanks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.payment_method === "Swift"
                          ? `${bank.benef_iban || "N/A"} - ${
                              bank.swift || "N/A"
                            }`
                          : bank.rails === "Card"
                          ? `(${bank.rails}) ${bank.bank_name} - ${
                              bank.card_number || "N/A"
                            }`
                          : bank.bank_acc_no
                          ? `${bank.bank_name} - ${bank.bank_acc_no}`
                          : `${bank.benef_iban || "N/A"}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2 font-sans"
              >
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formValues.description}
                onChange={handleChange}
                placeholder="Enter transfer description"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium text-gray-900 font-sans"
                required
              />
            </div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-8 rounded-lg font-sans"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiInfo className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-base text-blue-700 font-sans">
                    <strong>Note:</strong> Processing times may vary depending
                    on the payment method selected. Most transfers are completed
                    within 1-3 business days.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Form Actions */}
            <div className="mt-10 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <motion.button
                type="button"
                onClick={handleCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 border border-gray-300 rounded-xl shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all font-sans"
              >
                <FaTimes className="mr-3" />
                Cancel
              </motion.button>

              <motion.button
                type="button"
                onClick={handleConvert}
                disabled={
                  loading ||
                  !formValues.from ||
                  !formValues.value ||
                  !formValues.to ||
                  !formValues.transaction_type ||
                  !formValues.benef_account
                }
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all font-sans"
              >
                {loading ? (
                  <>
                    <RingLoader color="#ffffff" size={20} className="mr-3" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaExchangeAlt className="mr-3" />
                    Continue to Proceed
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </div>

      {/* Conversion Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-60"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-sans">
                  Transfer Review
                </h3>

                <div className="space-y-4 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-sans">FX Rate:</span>
                    <span className="font-semibold text-gray-900 font-sans">
                      {formValues.from} 1 = {formValues.to}{" "}
                      {fxRate ? parseFloat(fxRate).toFixed(4) : "1.0000"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-sans">
                      Transfer Amount:
                    </span>
                    <span className="font-semibold text-gray-900 font-sans">
                      {formValues.from}{" "}
                      {parseFloat(formValues.value || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-sans">Fee:</span>
                    <span className="font-semibold text-gray-900 font-sans">
                      {formValues.from}{" "}
                      {parseFloat(
                        formValues.transaction_type === "bank" ||
                          formValues.transaction_type === "mobile"
                          ? payoutRate || 0
                          : swiftRate || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="text-gray-600 font-sans">
                      Total Deducted:
                    </span>
                    <span className="font-semibold text-gray-900 font-sans">
                      {formValues.from}{" "}
                      {(
                        parseFloat(formValues.value || 0) +
                        parseFloat(
                          formValues.transaction_type === "bank" ||
                            formValues.transaction_type === "mobile"
                            ? payoutRate || 0
                            : swiftRate || 0
                        )
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="text-gray-600 font-sans">
                      Amount to be Received:
                    </span>
                    <span className="font-semibold text-green-600 text-lg font-sans">
                      {formValues.to}{" "}
                      {convertedValue
                        ? parseFloat(convertedValue).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mt-6 mb-6 font-sans">
                  Do you want to continue with this transfer?
                </p>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => dispatch(setShowModal(false))}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium font-sans"
                  >
                    Review Again
                  </button>
                  <button
                    type="button"
                    onClick={handleSendPasscode}
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium font-sans disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Confirm Transfer"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passcode Modal */}
      <AnimatePresence>
        {showPasscodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
            >
              <h2 className="text-2xl font-semibold mb-4 font-sans">
                Verification Required
              </h2>
              <p className="text-gray-600 mb-6 font-sans">
                Enter the verification code we sent to your email to confirm
                this transfer.
              </p>
              <input
                type="text"
                value={passcode}
                onChange={(e) => dispatch(setPasscode(e.target.value))}
                className="w-full p-4 border border-gray-300 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                placeholder="Enter 6-digit verification code"
              />
              <div className="flex justify-end space-x-3">
                <button
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium font-sans"
                  onClick={() => dispatch(setShowPasscodeModal(false))}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium font-sans disabled:opacity-50"
                  onClick={handleVerifyAndConvert}
                  disabled={verifying}
                >
                  {verifying ? "Verifying..." : "Confirm & Send"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <SuccessPopup
            onClose={() => {
              dispatch(setShowSuccessModal(false));
              navigate(-1);
            }}
            onDownload={() => {
              // Implement download receipt functionality
              toast.info("Receipt download feature coming soon!");
            }}
          />
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTimes className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 font-sans">
                  Error
                </h3>
                <p className="text-gray-600 mb-6 font-sans">{modalMessage}</p>
                <button
                  onClick={() => dispatch(setShowErrorModal(false))}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium font-sans"
                >
                  OK
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelModal
            onConfirm={confirmCancel}
            onCancel={() => setShowCancelModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayoutPage;
