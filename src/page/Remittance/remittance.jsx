// src/features/Remittance/remittance.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "../../components/ErrorBoundary/ErrorBoundary";
import debounce from "lodash.debounce";
import Select, { components } from "react-select";

// Modern Icons
import {
  FiSend,
  FiDownload,
  FiChevronDown,
  FiX,
  FiArrowRight,
  FiArrowLeft,
  FiPercent,
  FiCreditCard,
  FiHome,
  FiDollarSign,
  FiGlobe,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import {
  RiExchangeDollarLine,
  RiBankLine,
  RiMoneyDollarCircleLine,
} from "react-icons/ri";
import { HiOutlineCurrencyDollar } from "react-icons/hi";
import { TbArrowsExchange } from "react-icons/tb";

// Redux imports
import { remittanceActions } from "./redux";
import {
  selectRemittanceState,
  selectFormSummary,
  selectChargesBreakdown,
  selectStepConfiguration,
  selectPaymentMethodConfig,
  selectStepValidation,
  selectTransactionConfirmation,
  selectPopupConfig,
  selectPartnerDisplay,
  selectNavigationConfig,
  selectManualDepositDisplay,
  selectRemittanceStatus,
  selectIsLoading,
  selectSpecificLoading,
  selectHasErrors,
  selectSpecificError,
} from "./selectors/remittanceSelectors";
import {
  fetchInitialRemittanceData,
  fetchExchangeRate,
  calculateAmounts,
  sendPasscode,
  verifyPasscode,
  validatePromocode,
  confirmTransaction,
  generateReceipt,
  clearRemittanceCache,
} from "./thunks/remittanceThunks";

// Lazy load payment components
const ManualDeposit = lazy(() => import("./components/ManualDeposit"));
const BankTransfer = lazy(() => import("./components/BankTransfer"));
const CardTransfer = lazy(() => import("./components/CardTransfer"));

// ========== UTILITY FUNCTIONS ==========

// Safe currency value extractor
const getCurrencyValue = (currency) => {
  if (!currency) return '';
  if (typeof currency === 'string') return currency;
  if (currency && typeof currency === 'object') {
    return currency.value || currency.label || '';
  }
  return String(currency || '');
};

// Safe currency label extractor
const getCurrencyLabel = (currency) => {
  if (!currency) return '';
  if (typeof currency === 'string') return currency;
  if (currency && typeof currency === 'object') {
    return currency.label || currency.value || '';
  }
  return String(currency || '');
};

// Safe currency symbol extractor
const getCurrencySymbol = (currencyData) => {
  if (!currencyData) return '';
  
  const symbols = {
    EUR: "€", GBP: "£", JPY: "¥", NPR: "₨", USD: "$",
    KES: "KSh", CAD: "C$", AUD: "A$", CHF: "CHF",
    AED: "د.إ", INR: "₹", PKR: "₨", BDT: "৳",
    LKR: "රු", CNY: "¥", HKD: "HK$", SGD: "S$",
    NZD: "NZ$", THB: "฿", PHP: "₱", KRW: "₩",
  };
  
  if (typeof currencyData === 'string') {
    return symbols[currencyData] || currencyData;
  }
  
  if (currencyData?.symbol) return currencyData.symbol;
  if (currencyData?.value) return symbols[currencyData.value] || currencyData.value;
  if (currencyData?.label) return symbols[currencyData.label] || currencyData.label;
  
  return '';
};

// Safe number formatting
const formatNumber = (num) => {
  if (num === null || num === undefined || num === "") return "";
  const str = typeof num === "string" ? num.replace(/,/g, "") : String(num);
  const cleaned = str.replace(/[^0-9.]/g, "");
  const number = parseFloat(cleaned);
  return isNaN(number) ? "" : number.toLocaleString("en-US");
};

// Safe number parsing
const parseFormattedNumber = (str) => {
  if (typeof str !== "string") {
    if (typeof str === "number") return str;
    str = String(str || "");
  }
  const num = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
};

// Custom Select Components
const CustomOption = (props) => (
  <components.Option {...props}>
    <div className="flex items-center space-x-3 py-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
        <span className="text-xs font-medium text-blue-600">
          {props.data.value?.slice(0, 2) || "$$"}
        </span>
      </div>
      <div>
        <div className="font-medium text-gray-900">{props.data.label}</div>
        <div className="text-xs text-gray-500">{props.data.country || ""}</div>
      </div>
    </div>
  </components.Option>
);

const CustomSingleValue = (props) => (
  <components.SingleValue {...props}>
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
        <span className="text-sm font-semibold text-white">
          {props.data.value?.slice(0, 2) || "$$"}
        </span>
      </div>
      <div>
        <div className="font-semibold text-gray-900">{props.data.label}</div>
      </div>
    </div>
  </components.SingleValue>
);

const CustomControl = ({ children, ...props }) => (
  <components.Control {...props} className="!border-gray-300 !shadow-sm hover:!border-blue-400">
    {children}
  </components.Control>
);

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "white",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    borderRadius: "0.75rem",
    padding: "0.5rem",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    transition: "all 0.2s ease",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#eff6ff" : "white",
    color: state.isSelected ? "#1e40af" : "#374151",
    "&:hover": {
      backgroundColor: "#f3f4f6",
    },
    borderRadius: "0.5rem",
    margin: "0.25rem",
    fontSize: "0.875rem",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    marginTop: "0.5rem",
    padding: "0.5rem",
  }),
  singleValue: (base) => ({
    ...base,
    fontSize: "1rem",
    fontWeight: "600",
    color: "#111827",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#6b7280",
    "&:hover": {
      color: "#374151",
    },
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
};

// Stepper Component
const Stepper = ({ currentStep, steps }) => (
  <div className="w-full mb-8">
    <div className="flex items-center justify-between relative">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 -z-10"></div>
      
      {steps.map((step, index) => {
        const isActive = currentStep === index + 1;
        const isCompleted = currentStep > index + 1;
        
        return (
          <div key={step.id} className="flex flex-col items-center relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {isCompleted ? (
                <FiCheckCircle className="w-5 h-5" />
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </div>
            <span
              className={`mt-2 text-sm font-medium transition-colors duration-300 ${
                isActive || isCompleted
                  ? "text-gray-900"
                  : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
            <span className="text-xs text-gray-400 mt-1">{step.description}</span>
          </div>
        );
      })}
    </div>
  </div>
);

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 rounded-lg w-3/4 mx-auto"></div>
    <div className="space-y-4">
      <div className="h-16 bg-gray-200 rounded-xl"></div>
      <div className="h-16 bg-gray-200 rounded-xl"></div>
    </div>
    <div className="h-24 bg-gray-200 rounded-xl"></div>
  </div>
);

const Remittance = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerId } = useParams();

  // Select state from Redux
  const remittanceState = useSelector(selectRemittanceState);
  const formSummary = useSelector(selectFormSummary);
  const chargesBreakdown = useSelector(selectChargesBreakdown);
  const stepValidation = useSelector(selectStepValidation);
  const transactionConfirmation = useSelector(selectTransactionConfirmation);
  const popupConfig = useSelector(selectPopupConfig);
  const partnerDisplay = useSelector(selectPartnerDisplay);
  const manualDepositDisplay = useSelector(selectManualDepositDisplay);
  const isLoading = useSelector(selectIsLoading);

  // Local state
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [passcode, setPasscode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [promocode, setPromocode] = useState("");
  const [promocodeApplied, setPromocodeApplied] = useState(false);

  // Stepper configuration
  const steps = [
    { id: 1, label: "Amount", description: "Set transfer amount" },
    { id: 2, label: "Details", description: "Add beneficiary info" },
    { id: 3, label: "Review", description: "Confirm transfer" },
    { id: 4, label: "Complete", description: "Transfer success" },
  ];

  // Payment options
  const paymentOptions = useMemo(
    () => [
      { value: "bank", label: "Bank Transfer", icon: FiHome, color: "text-blue-600", bg: "bg-blue-50" },
      { value: "manual", label: "Manual Deposit", icon: HiOutlineCurrencyDollar, color: "text-green-600", bg: "bg-green-50" },
      { value: "card", label: "Card Payment", icon: FiCreditCard, color: "text-purple-600", bg: "bg-purple-50" },
    ],
    []
  );

  // Get user's full name
  const fullName = useMemo(() => {
    const firstName = localStorage.getItem("firstName") || "";
    const middleName = localStorage.getItem("middleName") || "";
    const lastName = localStorage.getItem("lastName") || "";
    return `${firstName}${middleName ? ` ${middleName}` : ""} ${lastName}`.trim();
  }, []);

  // Initialize data
  useEffect(() => {
    if (customerId) {
      dispatch(fetchInitialRemittanceData(customerId));
    }
  }, [dispatch, customerId]);

  // Event handlers
  const handleSendCurrencyChange = useCallback(
    (selectedOption) => {
      dispatch(remittanceActions.currencies.setSendCurrency(selectedOption));
      dispatch(remittanceActions.form.setSendAmount(""));
      dispatch(remittanceActions.form.setReceiveAmount(""));
    },
    [dispatch]
  );

  const handleReceiveCurrencyChange = useCallback(
    (selectedOption) => {
      dispatch(remittanceActions.currencies.setReceiveCurrency(selectedOption));
      dispatch(remittanceActions.form.setSendAmount(""));
      dispatch(remittanceActions.form.setReceiveAmount(""));
    },
    [dispatch]
  );

  const handleSendAmountChange = useCallback(
    debounce((value) => {
      if (value === "") {
        dispatch(remittanceActions.form.setSendAmount(""));
        dispatch(remittanceActions.form.setReceiveAmount(""));
        return;
      }

      const formattedValue = formatNumber(value.replace(/[^0-9.]/g, ""));
      dispatch(remittanceActions.form.setSendAmount(formattedValue));
      dispatch(remittanceActions.form.setActiveInput("send"));

      const parsedValue = parseFormattedNumber(formattedValue);
      if (parsedValue > 0) {
        dispatch(calculateAmounts({ amount: parsedValue, direction: "send" }));
      }
    }, 300),
    [dispatch]
  );

  const handleReceiveAmountChange = useCallback(
    debounce((value) => {
      if (value === "") {
        dispatch(remittanceActions.form.setReceiveAmount(""));
        dispatch(remittanceActions.form.setSendAmount(""));
        return;
      }

      const cleanedValue = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
      const formattedValue = formatNumber(cleanedValue);

      dispatch(remittanceActions.form.setReceiveAmount(formattedValue));
      dispatch(remittanceActions.form.setActiveInput("receive"));

      const parsedValue = parseFormattedNumber(formattedValue);
      if (parsedValue > 0) {
        dispatch(calculateAmounts({ amount: parsedValue, direction: "receive" }));
      }
    }, 300),
    [dispatch]
  );

  const handlePaymentMethodChange = useCallback(
    (option) => {
      dispatch(remittanceActions.payment.setPaymentMethodRef(option));
    },
    [dispatch]
  );

  const handleNextStep = useCallback(() => {
    dispatch(remittanceActions.form.nextStep());
  }, [dispatch]);

  const handlePreviousStep = useCallback(() => {
    dispatch(remittanceActions.form.prevStep());
  }, [dispatch]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleManualDepositSubmit = useCallback(
    (data) => {
      dispatch(remittanceActions.payment.setManualDepositFormData(data));
    },
    [dispatch]
  );

  const handleBankTransferSubmit = useCallback(
    (data) => {
      dispatch(remittanceActions.payment.setBankTransferFormData(data));
    },
    [dispatch]
  );

  const handleCardDepositSubmit = useCallback(
    (data) => {
      dispatch(remittanceActions.payment.setCardTransferFormData(data));
    },
    [dispatch]
  );

  const handleVerifyAndConvert = useCallback(async () => {
    if (!passcode) {
      setModalMessage("Please enter passcode");
      setShowErrorModal(true);
      return;
    }

    try {
      setVerifying(true);
      await dispatch(verifyPasscode({ customerId, passcode })).unwrap();
      setShowPasscodeModal(false);
      setPasscode("");
    } catch (error) {
      setModalMessage(error || "Invalid passcode");
      setShowErrorModal(true);
    } finally {
      setVerifying(false);
    }
  }, [dispatch, customerId, passcode]);

  const handleConfirmTransaction = useCallback(() => {
    dispatch(confirmTransaction());
  }, [dispatch]);

  // Render steps
  const renderStep1 = () => {
    const sendCurrencySymbol = getCurrencySymbol(remittanceState?.currencies?.sendCurrency);
    const receiveCurrencySymbol = getCurrencySymbol(remittanceState?.currencies?.receiveCurrency);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
      >
        {/* Amount Input Section */}
        <div className="space-y-6">
          {/* You Send */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <FiSend className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">You Send</h3>
                  <p className="text-sm text-gray-500">Amount to transfer</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-2xl font-bold text-gray-700">{sendCurrencySymbol}</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={remittanceState?.form?.sendAmount || ""}
                  onChange={(e) => handleSendAmountChange(e.target.value)}
                  onFocus={() => dispatch(remittanceActions.form.setActiveInput("send"))}
                  className="w-full pl-12 pr-4 py-4 text-3xl font-bold bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-300"
                  placeholder="0"
                />
              </div>
              <div className="w-40">
                <Select
                  options={remittanceState?.currencies?.currencyOptions || []}
                  value={remittanceState?.currencies?.sendCurrency || null}
                  onChange={handleSendCurrencyChange}
                  isLoading={isLoading}
                  isSearchable
                  styles={selectStyles}
                  components={{
                    Option: CustomOption,
                    SingleValue: CustomSingleValue,
                    Control: CustomControl,
                    DropdownIndicator: () => <FiChevronDown className="w-5 h-5 text-gray-400" />,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Exchange Arrow */}
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg">
              <TbArrowsExchange className="w-6 h-6 text-white transform rotate-90" />
            </div>
          </div>

          {/* Recipient Receives */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                  <FiDownload className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Recipient Receives</h3>
                  <p className="text-sm text-gray-500">Amount after conversion</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-2xl font-bold text-gray-700">{receiveCurrencySymbol}</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={remittanceState?.form?.receiveAmount || ""}
                  onChange={(e) => handleReceiveAmountChange(e.target.value)}
                  onFocus={() => dispatch(remittanceActions.form.setActiveInput("receive"))}
                  className="w-full pl-12 pr-4 py-4 text-3xl font-bold bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-300"
                  placeholder="0"
                  readOnly={isLoading}
                />
              </div>
              <div className="w-40">
                <Select
                  options={remittanceState?.currencies?.currencyOptions || []}
                  value={remittanceState?.currencies?.receiveCurrency || null}
                  onChange={handleReceiveCurrencyChange}
                  isLoading={isLoading}
                  isSearchable
                  styles={selectStyles}
                  components={{
                    Option: CustomOption,
                    SingleValue: CustomSingleValue,
                    Control: CustomControl,
                    DropdownIndicator: () => <FiChevronDown className="w-5 h-5 text-gray-400" />,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rate & Fee Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <FiPercent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Exchange Rate</h3>
                <p className="text-sm opacity-90">Live market rate</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold">
                {remittanceState?.currencies?.exchangeRateData?.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading rate...</span>
                  </div>
                ) : remittanceState?.currencies?.exchangeRateData?.error ? (
                  <span className="text-sm">{remittanceState.currencies.exchangeRateData.error}</span>
                ) : (
                  <>
                    {getCurrencyValue(remittanceState?.currencies?.sendCurrency) || ""} 1 ={" "}
                    {getCurrencyValue(remittanceState?.currencies?.receiveCurrency) || ""}{" "}
                    {remittanceState?.currencies?.exchangeRateData?.rate?.toFixed(4) || "0.0000"}
                  </>
                )}
              </div>
              <div className="text-sm opacity-90 mt-1">Updated just now</div>
            </div>
            
            {remittanceState?.currencies?.exchangeRateData?.fee > 0 && (
              <div className="text-right">
                <div className="text-sm opacity-90">Transfer Fee</div>
                <div className="text-2xl font-bold">
                  {getCurrencySymbol(remittanceState?.currencies?.sendCurrency)}
                  {formatNumber(remittanceState?.currencies?.exchangeRateData?.fee || 0)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Selection */}
        {remittanceState?.form?.sendAmount && remittanceState?.form?.receiveAmount && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FiCreditCard className="w-5 h-5 text-gray-400" />
              <span>Payment Method</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = remittanceState?.payment?.paymentMethodRef?.value === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handlePaymentMethodChange(option)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`w-12 h-12 rounded-full ${option.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${option.color}`} />
                      </div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <FiCheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Charges Breakdown */}
        {remittanceState?.form?.sendAmount && remittanceState?.form?.receiveAmount && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-6">Transfer Summary</h3>
            <div className="space-y-4">
              {[
                { label: "Amount to Send", value: chargesBreakdown?.sendAmount?.value || "0.00", color: "text-gray-900" },
                { label: "Recipient Receives", value: chargesBreakdown?.receiveAmount?.value || "0.00", color: "text-gray-900" },
                { label: "Exchange Rate", value: chargesBreakdown?.exchangeRate?.value || "0.0000", color: "text-gray-600" },
                { label: "Transfer Fee", value: chargesBreakdown?.fee?.value || "0.00", color: "text-gray-600" },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{item.label}</span>
                  <span className={`font-medium ${item.color}`}>{item.value}</span>
                </div>
              ))}
              
              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total to Pay</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {chargesBreakdown?.total?.value || "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleGoBack}
            className="flex-1 py-4 px-6 rounded-xl border border-gray-300 text-gray-700 font-medium flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors duration-300"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <button
            onClick={handleNextStep}
            disabled={!stepValidation?.isValid || isLoading}
            className={`flex-1 py-4 px-6 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-300 ${
              stepValidation?.isValid && !isLoading
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <span>Continue to Details</span>
            <FiArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderStep2 = () => {
    const paymentMethod = remittanceState?.payment?.paymentMethodRef?.value || "bank";
    const paymentOption = paymentOptions.find(opt => opt.value === paymentMethod) || paymentOptions[0];
    const Icon = paymentOption.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
      >
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Transfer Summary</h3>
                <p className="text-sm text-gray-600">Review your transfer details</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{formSummary?.totalToPay || "0.00"}</div>
              <div className="text-sm text-gray-600">Total amount</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">You Send</span>
                <span className="font-semibold text-gray-900">{formSummary?.send?.formatted || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient Receives</span>
                <span className="font-semibold text-gray-900">{formSummary?.receive?.formatted || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate</span>
                <span className="font-semibold text-gray-900">{formSummary?.exchangeRate || "0.0000"}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Transfer Method</span>
                <span className="font-semibold text-gray-900">{paymentOption.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transfer Speed</span>
                <span className="font-semibold text-green-600">1-2 Business Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Security</span>
                <span className="font-semibold text-green-600 flex items-center">
                  <FiShield className="w-4 h-4 mr-1" />
                  Protected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{paymentOption.label} Details</h3>
              <p className="text-sm text-gray-500">Enter required information</p>
            </div>
          </div>

          <Suspense fallback={<LoadingSkeleton />}>
            {paymentMethod === "manual" && (
              <ManualDeposit
                customerId={customerId}
                onFormDataChange={handleManualDepositSubmit}
                bankDetails={manualDepositDisplay}
                isLoading={isLoading}
              />
            )}
            {paymentMethod === "bank" && (
              <BankTransfer
                customerId={customerId}
                onFormDataChange={handleBankTransferSubmit}
                isLoading={isLoading}
              />
            )}
            {paymentMethod === "card" && (
              <CardTransfer
                customerId={customerId}
                onFormDataChange={handleCardDepositSubmit}
                isLoading={isLoading}
              />
            )}
          </Suspense>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handlePreviousStep}
            className="flex-1 py-4 px-6 rounded-xl border border-gray-300 text-gray-700 font-medium flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors duration-300"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Amount</span>
          </button>
          <button
            onClick={handleNextStep}
            disabled={
              !remittanceState?.payment?.paymentValidation?.formData?.isValid ||
              isLoading
            }
            className={`flex-1 py-4 px-6 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-300 ${
              remittanceState?.payment?.paymentValidation?.formData?.isValid &&
              !isLoading
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <span>Continue to Review</span>
            <FiArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Confirmation Header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm Your Transfer</h1>
        <p className="text-gray-600">Review all details before proceeding</p>
      </div>

      {/* Transfer Details Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-semibold text-gray-900 text-lg">Transfer Details</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sender Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FiSend className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">You Send</h4>
                    <p className="text-sm text-gray-500">Amount and currency</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {transactionConfirmation?.send?.amount || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600">
                    From: {transactionConfirmation?.send?.from || "Your Account"}
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 mb-3">Transfer Information</h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exchange Rate</span>
                    <span className="font-medium text-gray-900">
                      {transactionConfirmation?.details?.exchangeRate || "0.0000"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer Fee</span>
                    <span className="font-medium text-gray-900">
                      {chargesBreakdown?.fee?.value || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Delivery</span>
                    <span className="font-medium text-green-600 flex items-center">
                      <FiClock className="w-4 h-4 mr-1" />
                      1-2 Business Days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <FiDownload className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Recipient Receives</h4>
                    <p className="text-sm text-gray-500">Amount and destination</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {transactionConfirmation?.receive?.amount || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600">
                    To: {transactionConfirmation?.receive?.to || "Recipient Account"}
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 mb-3">Payment Method</h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method</span>
                    <span className="font-medium text-gray-900">
                      {transactionConfirmation?.details?.paymentMethod || "Bank Transfer"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Level</span>
                    <span className="font-medium text-green-600 flex items-center">
                      <FiShield className="w-4 h-4 mr-1" />
                      Bank-Level Encryption
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formSummary?.totalToPay || "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={remittanceState?.form?.agreeToTerms || false}
                  onChange={(e) =>
                    dispatch(remittanceActions.form.setAgreeToTerms(e.target.checked))
                  }
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="text-sm">
                <label htmlFor="terms" className="font-medium text-gray-900">
                  I agree to the Terms & Conditions
                </label>
                <p className="text-gray-600 mt-1">
                  By checking this box, you confirm that you have read and agree to our terms of service,
                  privacy policy, and confirm that all information provided is accurate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
        <div className="flex items-center space-x-3">
          <FiShield className="w-6 h-6 text-blue-600" />
          <div>
            <h4 className="font-semibold text-gray-900">Your Transfer is Secure</h4>
            <p className="text-sm text-gray-600">
              All transactions are protected with bank-level encryption and monitored 24/7 for security.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={handlePreviousStep}
          className="flex-1 py-4 px-6 rounded-xl border border-gray-300 text-gray-700 font-medium flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors duration-300"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Details</span>
        </button>
        <button
          onClick={handleConfirmTransaction}
          disabled={
            !remittanceState?.form?.agreeToTerms ||
            remittanceState?.form?.submitting
          }
          className={`flex-1 py-4 px-6 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-300 ${
            remittanceState?.form?.agreeToTerms &&
            !remittanceState?.form?.submitting
              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-200"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {remittanceState?.form?.submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Confirm & Transfer</span>
              <FiArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );

  // Success Modal
  const renderSuccessModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Transfer Successful!</h2>
          <p className="opacity-90">Your money transfer has been processed</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-sm text-gray-500 mb-1">Transaction ID</div>
            <div className="font-mono text-lg font-bold text-gray-900 bg-gray-100 rounded-lg px-4 py-2 inline-block">
              {popupConfig?.transactionId || "TRX-XXXX-XXXX"}
            </div>
          </div>

          {/* Transfer Details */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Amount Sent</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(remittanceState?.form?.sendAmount || 0)} {getCurrencyValue(remittanceState?.currencies?.sendCurrency)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Recipient Gets</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(remittanceState?.form?.receiveAmount || 0)} {getCurrencyValue(remittanceState?.currencies?.receiveCurrency)}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Transfer Fee</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {getCurrencySymbol(remittanceState?.currencies?.sendCurrency)}
                    {formatNumber(remittanceState?.currencies?.exchangeRateData?.fee || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Exchange Rate</div>
                  <div className="text-xl font-semibold text-gray-900">
                    1 {getCurrencyValue(remittanceState?.currencies?.sendCurrency)} ={" "}
                    {remittanceState?.currencies?.exchangeRateData?.rate?.toFixed(4) || "0.0000"}{" "}
                    {getCurrencyValue(remittanceState?.currencies?.receiveCurrency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.print()}
              className="flex-1 py-4 px-6 rounded-xl border border-gray-300 text-gray-700 font-medium flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors duration-300"
            >
              <FiDownload className="w-5 h-5" />
              <span>Save Receipt</span>
            </button>
            <button
              onClick={() => {
                dispatch(remittanceActions.form.hidePopup());
                navigate(`/dashboard/${customerId}`);
              }}
              className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-blue-200 transition-all duration-300"
            >
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">Please refresh the page or try again later</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
          >
            Refresh Page
          </button>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Global Money Transfer
              </span>
            </h1>
            <p className="text-gray-600 text-lg">Fast, secure, and low-cost international transfers</p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="border-b border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Send Money Worldwide</h2>
                  <p className="text-gray-600">Complete your transfer in just a few steps</p>
                </div>
                <div className="flex items-center space-x-2">
                  <FiGlobe className="w-6 h-6 text-blue-600" />
                  <span className="font-medium text-gray-900">Live Rates</span>
                </div>
              </div>
              
              <Stepper currentStep={remittanceState?.form?.step || 1} steps={steps} />
            </div>

            {/* Card Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                <Suspense fallback={<LoadingSkeleton />}>
                  {remittanceState?.form?.step === 1 && renderStep1()}
                  {remittanceState?.form?.step === 2 && renderStep2()}
                  {remittanceState?.form?.step === 3 && renderStep3()}
                </Suspense>
              </AnimatePresence>
            </div>
          </div>

          {/* Partner Logos */}
          {partnerDisplay?.showSection && (
            <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <h3 className="font-semibold text-gray-900">Trusted by Global Partners</h3>
                <p className="text-gray-600 text-sm">Secure transfers through our banking partners</p>
              </div>
              <div className="flex items-center justify-center space-x-12">
                {partnerDisplay.originating && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      {partnerDisplay.originating.loading ? (
                        <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <img
                          src={partnerDisplay.originating.logo}
                          alt="Originating Partner"
                          className="h-10 object-contain"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">Sending Partner</span>
                  </div>
                )}
                <div className="text-gray-400">
                  <TbArrowsExchange className="w-8 h-8" />
                </div>
                {partnerDisplay.payout && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      {partnerDisplay.payout.loading ? (
                        <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <img
                          src={partnerDisplay.payout.logo}
                          alt="Payout Partner"
                          className="h-10 object-contain"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">Receiving Partner</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Footer */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-4 text-gray-500 text-sm">
              <div className="flex items-center space-x-2">
                <FiShield className="w-4 h-4" />
                <span>Bank-Level Security</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <FiClock className="w-4 h-4" />
                <span>24/7 Monitoring</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <FiGlobe className="w-4 h-4" />
                <span>Global Coverage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {remittanceState?.form?.showPopup && renderSuccessModal()}

        {/* Passcode Modal */}
        {showPasscodeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mx-auto mb-4">
                  <FiShield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Security Verification</h3>
                <p className="text-gray-600">Enter the 6-digit passcode sent to your email</p>
              </div>
              
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-4 text-3xl font-bold text-center tracking-widest bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300"
                placeholder="000000"
                maxLength={6}
              />
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowPasscodeModal(false)}
                  className="flex-1 py-3 px-6 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyAndConvert}
                  disabled={verifying || passcode.length !== 6}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                    passcode.length === 6 && !verifying
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {verifying ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify & Continue"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(Remittance);