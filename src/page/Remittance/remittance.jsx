// src/page/Remittance/Remittance.jsx - COMPLETE UI OVERHAUL (Preserving all logic) 

import React, {
  useState,
  useEffect,
  useMemo,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowRight,
  FaArrowLeft,
  FaExchangeAlt,
  FaUniversity,
  FaCopy,
  FaCheck,
  FaShieldAlt,
  FaLock,
  FaClock,
  FaGlobe,
  FaUser,
  FaBuilding,
  FaArrowUp,
  FaIdCard,
  FaArrowDown,
  FaMoneyCheckAlt,
  FaInfoCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaSync,
} from "react-icons/fa";
import { FiSend, FiCheck, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { HiOutlineBanknotes } from "react-icons/hi2";
import { MdAccountBalance, MdSecurity } from "react-icons/md";
import { TbTransfer } from "react-icons/tb";
import Select from "react-select";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import PaymentInitiation from "../../page/Deposit/components/PaymentInitiation/PaymentInitiation";

// Redux actions
import {
  setStep,
  setSendAmount,
  setReceiveAmount,
  setSendCurrency,
  setReceiveCurrency,
  setPaymentMethod,
  setFormField,
  resetForm,
  fetchExchangeRate,
  fetchBankAccounts,
  fetchPayoutCurrencies,
  submitTransaction,
  fetchManualAccountDetails,
  setExchangeRateData,
  clearExchangeRateData,
  checkTransactionLimit,
} from "./slices/remittanceSlice";

import { fetchAllStaticData } from "./slices/staticDataSlice";

// Import beneficiary actions
import {
  setSelectedBeneficiary,
  setSelectedBank,
  fetchBeneficiaryBanks,
  fetchBeneficiaryByCode,
  fetchBeneficiaries,
  clearSelectedBeneficiary,
} from "../Beneficiary/MyBeneficiaries/BeneficiariesSlice";

import {
  fetchUSDBankAccounts,
  selectUSDBankAccounts,
  selectHasSilaAccounts,
  selectUSDAccountsLoading,
  selectUSDAccountsError,
} from "../../page/Deposit/slices/bankAccountSlice";

import {
  setSelectedBankAccount,
  selectSelectedBankAccount,
} from "../../page/Deposit/slices/depositSlice";

const API_URL = import.meta.env.VITE_API_URL;

// Import child components
import ManualDeposit from "./subComponents/ManualDeposit";
import BankTransfer from "./subComponents/BankTransfer";
import CardPayment from "./subComponents/CardPayment";
import Step2Details from "./steps/Step2Details";
import Step3Confirm from "./steps/Step3Confirm";
import Step4Success from "./steps/Step4Success";

import { RingLoader } from "react-spinners";

const Remittance = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useParams();

  // Select state from Redux store
  const {
    step,
    formData,
    currencies,
    bankAccounts,
    loading,
    error,
    transactionResult,
    manualAccountDetails,
    exchangeRateData: reduxExchangeRateData,
  } = useSelector((state) => state.remittance);

  const {
    beneficiaries,
    beneficiaryBanks,
    selectedBeneficiary,
    selectedBank,
    loading: beneficiaryLoading,
  } = useSelector((state) => state.beneficiaries);

  const { purposes, incomeSources, occupations, paymentMethods } = useSelector(
    (state) => state.remittanceStatic,
  );

  const silaBankAccounts = useSelector(selectUSDBankAccounts);
  const hasSilaAccounts = useSelector(selectHasSilaAccounts);
  const silaAccountsLoading = useSelector(selectUSDAccountsLoading);
  const silaAccountsError = useSelector(selectUSDAccountsError);
  const reduxSelectedSilaBankAccount = useSelector(selectSelectedBankAccount);

  // Local state for selected bank account to ensure proper synchronization
  const [localSelectedBankAccount, setLocalSelectedBankAccount] = useState(null);

  // Local state for amount validation
  const [amountError, setAmountError] = useState(null);

  // Use local state if available, otherwise use Redux state
  const selectedSilaBankAccount = localSelectedBankAccount || reduxSelectedSilaBankAccount;

  const exchangeRateData = reduxExchangeRateData;

  // Local state for UI
  const [filePreview, setFilePreview] = useState(null);
  const [beneficiaryCode, setBeneficiaryCode] = useState("");
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [manualAccountError, setManualAccountError] = useState(null);
  const [manualDetailsLoading, setManualDetailsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [showRecipientDetails, setShowRecipientDetails] = useState(true);
  const [showOpenBanking, setShowOpenBanking] = useState(false);
  const [openBankingProcessing, setOpenBankingProcessing] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [pendingNewBeneficiaryId, setPendingNewBeneficiaryId] = useState(null);


  const [showBankLinkReminder, setShowBankLinkReminder] = useState(() => {
    // Check if user has already seen the reminder
    const hasSeenBankReminder = localStorage.getItem('has_seen_bank_reminder');
    return !hasSeenBankReminder; // Show only if not seen before
  });

  const [recurringData, setRecurringData] = useState({
    isRecurring: "0",
    frequency: "",
    custom_days: "",
  });

  const [showLimitExceededModal, setShowLimitExceededModal] = useState(false);
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const [limitExceededData, setLimitExceededData] = useState({
    limit: 0,
    amount: 0,
    currency: "",
    sendAmount: 0,
    sendCurrency: "",
  });

  // Refs for preventing duplicate API calls
  const isManualUpdate = useRef(false);
  const lastRequestId = useRef(null);
  const isRequestInProgress = useRef(false);
  const lastApiCallTime = useRef(0);
  const exchangeRateCache = useRef({});
  const typingTimeout = useRef(null);
  const activeInput = useRef("send");
  const isTyping = useRef(false);
  const isUserEditing = useRef(false);

  const [isInitializing, setIsInitializing] = useState(true)
  const [defaultCurrencySet, setDefaultCurrencySet] = useState(false)
  const isFirstLoad = useRef(true)
  const hasFetchedSilaAccounts = useRef(false);
  const isInitialMount = useRef(true);
  const pageTopRef = useRef(null);

  const [deliveryTimeData, setDeliveryTimeData] = useState(null);
  const [deliveryTimeLoading, setDeliveryTimeLoading] = useState(false);

  // Professional payment method options
  const paymentOptions = useMemo(
    () => [
      {
        value: "bank",
        label: "Bank Transfer",
        // description: "Direct wire transfer",
        icon: <MdAccountBalance className="w-5 h-5" />,
        color: "blue",
        gradient: "from-blue-500 to-blue-600",
      },
      {
        value: "manual",
        label: "Manual",
        // description: "Bank branch deposit",
        icon: <HiOutlineBanknotes className="w-5 h-5" />,
        color: "emerald",
        gradient: "from-emerald-500 to-emerald-600",
      },
    ],
    [],
  );

  const purposeOptions = useMemo(
    () =>
      Array.isArray(purposes)
        ? purposes.map((purpose) => ({
          value: purpose.value,
          label: purpose.label,
          description: purpose.description,
        }))
        : [
          { value: "family_support", label: "Family Support" },
          { value: "education", label: "Education Fees" },
          { value: "medical", label: "Medical Expenses" },
          { value: "business", label: "Business Investment" },
          { value: "savings", label: "Savings" },
          { value: "other", label: "Other" },
        ],
    [purposes],
  );

  const incomeSourceOptions = useMemo(
    () =>
      Array.isArray(incomeSources)
        ? incomeSources.map((source) => ({
          value: source.value,
          label: source.label,
        }))
        : [
          { value: "salary", label: "Salary" },
          { value: "business", label: "Business Income" },
          { value: "investment", label: "Investment Income" },
          { value: "gift", label: "Gift" },
          { value: "inheritance", label: "Inheritance" },
          { value: "other", label: "Other" },
        ],
    [incomeSources],
  );

  const relationOptions = useMemo(
    () => [
      { value: "brother", label: "Brother" },
      { value: "sister", label: "Sister" },
      { value: "father", label: "Father" },
      { value: "mother", label: "Mother" },
      { value: "spouse", label: "Spouse" },
      { value: "friend", label: "Friend" },
      { value: "other", label: "Other" },
    ],
    [],
  );

  // Memoized currency options
  const sendCurrencyOptions = useMemo(
    () =>
      (bankAccounts || []).map((account) => ({
        value: account.currency_code,
        label: account.currency_code,
        fullLabel: `${account.currency_code} - ${account.bank_name || "Account"}`,
        bank_id: account.id,
        icon: account.icon,
        balance: account.balance,
      })),
    [bankAccounts],
  );

  // FIXED: receiveCurrencyOptions - Only shows currencies from the API endpoint
  const receiveCurrencyOptions = useMemo(() => {
    // Get the payout currencies from the API response
    const payoutData = currencies?.payoutCurrencies;

    if (!payoutData) return [];

    // Handle both formats (with or without .data wrapper)
    const currencyList = payoutData.data || (Array.isArray(payoutData) ? payoutData : []);

    if (!currencyList.length) return [];

    // Map the currencies to the format needed by the Select component
    return currencyList.map((currency) => ({
      value: currency.currency_code,
      label: currency.currency_code,
      icon: currency.icon,
      default_remittance: currency.default_remittance,
      currency_code: currency.currency_code,
      payout_currency_id: currency.payout_currency_id,
    }));
  }, [currencies?.payoutCurrencies]);

  // Calculate if continue button should be disabled for step 2
  const isStep2ButtonDisabled = useMemo(() => {
    if (step !== 2) return false;

    // Basic validations
    if (!selectedBeneficiary) return true;
    if (!formData.purpose || !formData.purpose.value) return true;
    if (!formData.incomeSource || !formData.incomeSource.value) return true;

    // Manual payment method validation
    if (formData.paymentMethod === "manual") {
      if (!formData.document) return true;
    }

    // Bank transfer validations
    if (formData.paymentMethod === "bank") {
      // For USD transfers, need Sila bank account
      if (formData.sendCurrency?.value === "USD") {
        if (!hasSilaAccounts || silaBankAccounts.length === 0) return true;
        if (!selectedSilaBankAccount) return true;
        if (!selectedSilaBankAccount.web_debit_verified) return true;
      }

      // For all bank transfers, need beneficiary bank selected
      if (!selectedBank) return true;
    }

    return false;
  }, [step, selectedBeneficiary, formData, selectedSilaBankAccount, selectedBank, hasSilaAccounts, silaBankAccounts]);

  const selectStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: "52px",
        borderRadius: "12px",
        borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
        borderWidth: "1px",
        fontSize: "0.95rem",
        backgroundColor: "#ffffff",
        boxShadow: state.isFocused
          ? "0 0 0 3px rgba(99, 102, 241, 0.1)"
          : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "&:hover": { borderColor: "#6366f1" },
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }),
      option: (base, { isSelected, isFocused }) => ({
        ...base,
        fontSize: "0.95rem",
        padding: "12px 16px",
        backgroundColor: isSelected
          ? "#eef2ff"
          : isFocused
            ? "#f8fafc"
            : "white",
        color: isSelected ? "#4f46e5" : "#334155",
        fontWeight: isSelected ? "600" : "500",
        "&:hover": {
          backgroundColor: "#f8fafc",
        },
        transition: "all 0.2s ease",
      }),
      menu: (base) => ({
        ...base,
        borderRadius: "12px",
        fontSize: "0.95rem",
        border: "1px solid #e2e8f0",
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        zIndex: 9999,
        position: "absolute",
      }),
      menuList: (base) => ({
        ...base,
        maxHeight: "300px",
        overflowY: "auto",
        padding: "4px 0",
      }),
      placeholder: (base) => ({
        ...base,
        color: "#94a3b8",
        fontWeight: "500",
      }),
      singleValue: (base) => ({
        ...base,
        color: "#1e293b",
        fontWeight: "600",
      }),
      dropdownIndicator: (base) => ({
        ...base,
        color: "#64748b",
        padding: "8px",
        "&:hover": {
          color: "#475569",
        },
      }),
      indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: "#e2e8f0",
      }),
    }),
    [],
  );

  const stepVariants = useMemo(
    () => ({
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    }),
    [],
  );

  const handleCloseBankReminder = useCallback(() => {
    // Save to localStorage so it won't show again
    localStorage.setItem('has_seen_bank_reminder', 'true');
    setShowBankLinkReminder(false);
  }, []);

  const totalToPay = parseFloat(formData.sendAmount || 0);
  const fee = 0;

  // ALL useEffects must be at top level
  useEffect(() => {
    if (!receiveCurrencyOptions.length || defaultCurrencySet || isInitializing) return;

    const defaultOption = receiveCurrencyOptions.find(
      (opt) => opt.default_remittance === "Y"
    );

    if (defaultOption && !formData.receiveCurrency) {
      console.log("Setting default receive currency:", defaultOption);
      dispatch(setReceiveCurrency(defaultOption));
      activeInput.current = "receive";
      setDefaultCurrencySet(true);
      setShowRecipientDetails(false);

      Object.keys(exchangeRateCache.current).forEach((key) => {
        if (key.includes(`-${defaultOption?.value}-`)) {
          delete exchangeRateCache.current[key];
        }
      });

      // Don't auto-set send amount to 5 anymore
      dispatch(setReceiveAmount(""));
    }
  }, [receiveCurrencyOptions, dispatch, formData.receiveCurrency, isInitializing, defaultCurrencySet]);

  // Copy to clipboard function
  const copyToClipboard = useCallback((text, fieldName) => {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch(() => {
        console.error("Failed to copy to clipboard");
      });
  }, []);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      if (customerId) {
        try {
          console.log("🔍 Initializing with customerId:", customerId);
          console.log("🔍 partner_id from localStorage:", localStorage.getItem("partner_id"));

          await Promise.all([
            dispatch(fetchBankAccounts(customerId)),
            dispatch(fetchPayoutCurrencies()),
            dispatch(fetchAllStaticData()),
          ]);

          setTimeout(() => {
            setIsInitializing(false);
            isFirstLoad.current = false;
          }, 500);

        } catch (error) {
          console.error("Failed to initialize data:", error);
          setIsInitializing(false);
          isFirstLoad.current = false;
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
        setIsInitializing(false);
        isFirstLoad.current = false;
        navigate("/login");
      }
    };

    initializeData();
  }, [customerId, dispatch, navigate]);


  useEffect(() => {
    const customerIdToUse =
      customerId || localStorage.getItem("customerId") || "1720";

    if (
      customerIdToUse &&
      !silaAccountsLoading &&
      !hasFetchedSilaAccounts.current
    ) {
      hasFetchedSilaAccounts.current = true;

      dispatch(fetchUSDBankAccounts())
        .unwrap()
        .then((result) => {
          console.log("✅ Sila bank accounts loaded:", result?.length || 0);
        })
        .catch((error) => {
          console.error("❌ Failed to load Sila bank accounts:", error);
          hasFetchedSilaAccounts.current = false;
        });
    }
  }, [dispatch, customerId, silaAccountsLoading]);

  // Removed auto-set to 5 useEffect

  // Reset exchange rate data when currencies change
  useEffect(() => {
    if (isInitializing || isFirstLoad.current) return;

    if (formData.sendCurrency?.value && formData.receiveCurrency?.value) {
      const currentPair = `${formData.sendCurrency?.value}-${formData.receiveCurrency?.value}`;
      const cachedPair = exchangeRateData
        ? `${exchangeRateData.fromCurrency}-${exchangeRateData.toCurrency}`
        : null;

      if (cachedPair && cachedPair !== currentPair) {
        console.log('Currency pair changed, clearing exchange rate');
        dispatch(setExchangeRateData(null));
        isManualUpdate.current = false;
        dispatch(setReceiveAmount(""));
      }
    }
  }, [formData.sendCurrency, formData.receiveCurrency, dispatch, exchangeRateData, isInitializing]);

  // Fetch exchange rate with deduplication and caching - FULL IMPLEMENTATION
  useEffect(() => {
    let isMounted = true;
    let debounceTimer;

    const fetchRate = async () => {
      const sendCurrencyValue = formData.sendCurrency?.value;
      const receiveCurrencyValue = formData.receiveCurrency?.value;

      if (!sendCurrencyValue || !receiveCurrencyValue || isInitializing) {
        return;
      }

      if (isTyping.current || isManualUpdate.current) {
        return;
      }

      if (isRequestInProgress.current) {
        return;
      }

      const now = Date.now();
      if (now - lastApiCallTime.current < 1500) {
        return;
      }

      let amountForCalculation;
      if (activeInput.current === "receive" && formData.receiveAmount) {
        amountForCalculation = 1;
      } else {
        amountForCalculation = parseFloat(formData.sendAmount) || 5;
      }

      const cacheKey = `${sendCurrencyValue}-${receiveCurrencyValue}-${amountForCalculation}`;

      const cachedData = exchangeRateCache.current[cacheKey];
      if (cachedData && now - cachedData.timestamp < 45000) {
        if (isMounted) {
          dispatch({
            type: "remittance/setExchangeRateData",
            payload: cachedData.data,
          });

          if (activeInput.current === "receive" && formData.receiveAmount) {
            const receiveNum = parseFloat(formData.receiveAmount);
            if (!isNaN(receiveNum) && receiveNum > 0) {
              const calculatedSendAmount = roundToDecimals(
                receiveNum / cachedData.data.fxRate,
                2,
              );
              dispatch(setSendAmount(calculatedSendAmount.toString()));
            }
          }
        }
        return;
      }

      isRequestInProgress.current = true;
      lastApiCallTime.current = now;

      const payload = {
        fromCurrency: sendCurrencyValue,
        toCurrency: receiveCurrencyValue,
        amount: amountForCalculation,
        bankId: formData.sendCurrency?.bank_id,
        customerId,
      };

      try {
        const response = await dispatch(fetchExchangeRate(payload)).unwrap();
        if (isMounted && response) {
          isManualUpdate.current = true;

          const fxRate =
            response.fxRate ||
            response.converted_value / amountForCalculation ||
            115;

          const exchangeData = {
            ...response,
            fxRate: roundToDecimals(fxRate, 6),
            fromCurrency: sendCurrencyValue,
            toCurrency: receiveCurrencyValue,
            originalAmount: amountForCalculation,
            timestamp: Date.now(),
          };

          exchangeRateCache.current[cacheKey] = {
            data: exchangeData,
            timestamp: Date.now(),
          };

          dispatch({
            type: "remittance/setExchangeRateData",
            payload: exchangeData,
          });

          if (activeInput.current === "receive" && formData.receiveAmount) {
            const receiveNum = parseFloat(formData.receiveAmount);
            if (!isNaN(receiveNum) && receiveNum > 0) {
              const calculatedSendAmount = roundToDecimals(
                receiveNum / fxRate,
                2,
              );

              if (calculatedSendAmount < 5) {
                const minSendAmount = 5;
                const adjustedReceiveAmount = roundToDecimals(
                  minSendAmount * fxRate,
                  2,
                );
                dispatch(setSendAmount(minSendAmount.toString()));
                dispatch(setReceiveAmount(adjustedReceiveAmount.toString()));
              } else {
                dispatch(setSendAmount(calculatedSendAmount.toString()));
              }
            }
          }
        }
      } catch (error) {
        console.error("Exchange rate fetch error:", error);
      } finally {
        if (isMounted) {
          setTimeout(() => {
            isManualUpdate.current = false;
            isRequestInProgress.current = false;
          }, 200);
        }
      }
    };

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      if (!isTyping.current) {
        fetchRate();
      }
    }, 1200);

    return () => {
      isMounted = false;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [
    formData.sendCurrency?.value,
    formData.receiveCurrency?.value,
    formData.sendAmount,
    formData.receiveAmount,
    customerId,
    dispatch,
    `${formData.sendCurrency?.value}-${formData.receiveCurrency?.value}`,
    isInitializing,
  ]);

  useEffect(() => {
    if (!initialLoading && !loading) {
      if (
        formData.sendCurrency?.value &&
        formData.receiveCurrency?.value &&
        !exchangeRateData?.fxRate &&
        !isRequestInProgress.current &&
        !isTyping.current
      ) {
        const timer = setTimeout(() => {
          const cacheKey = `${formData.sendCurrency?.value}-${formData.receiveCurrency?.value
            }-${parseFloat(formData.sendAmount) || 5}`;

          if (exchangeRateCache.current[cacheKey]) {
            delete exchangeRateCache.current[cacheKey];
          }

          fetchExchangeRateManual();
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [
    initialLoading,
    loading,
    formData.sendCurrency?.value,
    formData.receiveCurrency?.value,
    exchangeRateData?.fxRate,
    formData.sendAmount,
  ]);

  useEffect(() => {
    if (
      exchangeRateData?.fxRate &&
      formData.sendAmount &&
      parseFloat(formData.sendAmount) >= 5 &&
      !isManualUpdate.current &&
      !isTyping.current &&
      !isInitializing
    ) {
      const sendNum = parseFloat(formData.sendAmount);
      if (!isNaN(sendNum) && sendNum >= 5) {
        const calculatedReceiveAmount = roundToDecimals(
          sendNum * exchangeRateData.fxRate,
          2,
        );

        const currentReceive = parseFloat(formData.receiveAmount || 0);
        if (Math.abs(calculatedReceiveAmount - currentReceive) > 0.01) {
          dispatch(setReceiveAmount(calculatedReceiveAmount.toString()));
        }
      }
    }
  }, [
    exchangeRateData?.fxRate,
    formData.sendAmount,
    formData.receiveAmount,
    dispatch,
    isInitializing
  ]);

  useEffect(() => {
    if (
      exchangeRateData?.fxRate &&
      formData.sendAmount &&
      parseFloat(formData.sendAmount) >= 5 &&
      (!formData.receiveAmount || parseFloat(formData.receiveAmount) === 0)
    ) {
      const calculatedReceiveAmount = roundToDecimals(
        parseFloat(formData.sendAmount) * exchangeRateData.fxRate,
        2,
      );
      dispatch(setReceiveAmount(calculatedReceiveAmount.toString()));
    }
  }, [exchangeRateData, formData.sendAmount, dispatch]);

  // Fetch estimated delivery time based on payment method
  useEffect(() => {
    const showEstimated = localStorage.getItem("show_estimated_time_delivery");
    if (showEstimated !== "Y") {
      setDeliveryTimeData(null);
      return;
    }

    if (!formData.paymentMethod) return;

    let isMounted = true;
    setDeliveryTimeLoading(true);

    const token = localStorage.getItem("bearertoken");

    fetch(`${API_URL}/remit-type/${formData.paymentMethod}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setDeliveryTimeData(data);
          setDeliveryTimeLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDeliveryTimeData(null);
          setDeliveryTimeLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [formData.paymentMethod]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      !isTyping.current &&
      activeInput.current === "send" &&
      formData.sendAmount &&
      exchangeRateData?.fxRate &&
      !isManualUpdate.current
    ) {
      const sendNum = parseFloat(formData.sendAmount);
      if (!isNaN(sendNum) && sendNum >= 5) {
        const calculatedReceiveAmount = roundToDecimals(
          sendNum * exchangeRateData.fxRate,
          2,
        );

        const currentReceive = parseFloat(formData.receiveAmount || 0);
        if (Math.abs(calculatedReceiveAmount - currentReceive) > 0.01) {
          dispatch(setReceiveAmount(calculatedReceiveAmount.toString()));
        }
      }
    }
  }, [formData.sendAmount, exchangeRateData, dispatch, formData.receiveAmount]);

  useEffect(() => {
    return () => {
      isRequestInProgress.current = false;
      isTyping.current = false;
      isManualUpdate.current = false;
    };
  }, [formData.sendCurrency?.value, formData.receiveCurrency?.value]);

  // Fetch manual account details with cleanup
  useEffect(() => {
    let isMounted = true;
    let fetchTimer;

    const fetchDetails = async () => {
      if (
        formData.paymentMethod === "manual" &&
        formData.sendCurrency?.bank_id &&
        formData.sendCurrency?.value
      ) {
        if (isMounted) {
          setManualDetailsLoading(true);
          setManualAccountError(null);
        }

        try {
          const result = await dispatch(
            fetchManualAccountDetails({
              bankId: formData.sendCurrency.bank_id,
              currencyCode: formData.sendCurrency.value,
              amount: formData.sendAmount || "5",
              customerId: parseInt(customerId),
            }),
          ).unwrap();

          if (isMounted) {
            if (
              result?.status &&
              result.status !== 200 &&
              result.status !== 201
            ) {
              setManualAccountError(
                result.message || "Bank details unavailable",
              );
            } else if (result && Object.keys(result).length > 0) {
              setManualAccountError(null);
            } else {
              setManualAccountError("Bank details unavailable");
            }
          }
        } catch (error) {
          if (isMounted) {
            let errorMessage = "Bank details unavailable";

            if (error?.data?.message) {
              errorMessage = error.data.message;
            } else if (error?.message) {
              errorMessage = error.message;
            } else if (error?.statusText) {
              errorMessage = error.statusText;
            } else if (typeof error === "string") {
              errorMessage = error;
            } else if (error?.data) {
              errorMessage = JSON.stringify(error.data);
            }

            setManualAccountError(errorMessage);
          }
        } finally {
          if (isMounted) {
            setManualDetailsLoading(false);
          }
        }
      } else if (isMounted) {
        setManualAccountError(null);
      }
    };

    if (fetchTimer) {
      clearTimeout(fetchTimer);
    }

    fetchTimer = setTimeout(() => {
      fetchDetails();
    }, 500);

    return () => {
      isMounted = false;
      if (fetchTimer) {
        clearTimeout(fetchTimer);
      }
    };
  }, [
    formData.paymentMethod,
    formData.sendCurrency?.bank_id,
    formData.sendCurrency?.value,
    formData.sendAmount,
    customerId,
    dispatch,
  ]);

  useEffect(() => {
    console.log("🔄 Remittance - Full formData:", formData);
  }, [formData.paymentMethod, formData]);

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      pageTopRef.current?.scrollIntoView({
        behavior: "instant",
        block: "start",
      });

      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);

    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (isInitialMount.current) {
      dispatch(resetForm());

      // Only clear the previously selected beneficiary if we're NOT
      // returning from the Add Beneficiary flow (which needs the
      // beneficiary to remain/become selected).
      const isReturningFromAddBeneficiary =
        location.state?.newBeneficiary && location.state?.returnToStep === 2;

      if (!isReturningFromAddBeneficiary) {
        dispatch(clearSelectedBeneficiary());
      }

      isInitialMount.current = false;
    }
  }, [dispatch, location.state]);

  // Debug validation state
  useEffect(() => {
    if (step === 2) {
      console.log("🔍 Step 2 Validation State:", {
        selectedBeneficiary: selectedBeneficiary?.id,
        formDataPurpose: formData.purpose?.value,
        formDataIncomeSource: formData.incomeSource?.value,
        paymentMethod: formData.paymentMethod,
        sendCurrency: formData.sendCurrency?.value,
        selectedSilaBankAccount: selectedSilaBankAccount?.id,
        selectedBank: selectedBank?.id,
        hasSilaAccounts,
        silaBankAccountsCount: silaBankAccounts?.length,
        isUSDBankTransfer: formData.paymentMethod === "bank" && formData.sendCurrency?.value === "USD",
        isNonUSDBankTransfer: formData.paymentMethod === "bank" && formData.sendCurrency?.value !== "USD",
        isStep2ButtonDisabled,
        allConditions: {
          hasBeneficiary: !!selectedBeneficiary,
          hasPurpose: !!formData.purpose,
          hasIncomeSource: !!formData.incomeSource,
          hasSilaAccountForUSD: !(formData.paymentMethod === "bank" && formData.sendCurrency?.value === "USD") || !!selectedSilaBankAccount,
          hasSelectedBank: !(formData.paymentMethod === "bank") || !!selectedBank,
        }
      });
    }
  }, [step, selectedBeneficiary, formData, selectedSilaBankAccount, selectedBank, hasSilaAccounts, silaBankAccounts, isStep2ButtonDisabled]);

  const formatAmountInput = (value) => {
    if (value === "" || value === null || value === undefined) return "";

    let cleaned = value.replace(/[^\d.]/g, "");

    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    return cleaned;
  };

  const fetchExchangeRateManual = useCallback(async () => {
    if (!formData.sendCurrency || !formData.receiveCurrency) {
      return;
    }

    const cacheKey = `${formData.sendCurrency.value}-${formData.receiveCurrency.value
      }-${parseFloat(formData.sendAmount) || 5}`;
    delete exchangeRateCache.current[cacheKey];

    try {
      const payload = {
        fromCurrency: formData.sendCurrency.value,
        toCurrency: formData.receiveCurrency.value,
        amount: parseFloat(formData.sendAmount) || 5,
        bankId: formData.sendCurrency.bank_id,
        customerId,
      };

      const response = await dispatch(fetchExchangeRate(payload)).unwrap();
      if (response) {
        const fxRate =
          response.fxRate ||
          response.converted_value / (parseFloat(formData.sendAmount) || 5) ||
          115;

        const exchangeData = {
          ...response,
          fxRate: roundToDecimals(fxRate, 6),
          fromCurrency: formData.sendCurrency.value,
          toCurrency: formData.receiveCurrency.value,
          originalAmount: parseFloat(formData.sendAmount) || 5,
        };

        exchangeRateCache.current[cacheKey] = {
          data: exchangeData,
          timestamp: Date.now(),
        };

        dispatch({
          type: "remittance/setExchangeRateData",
          payload: exchangeData,
        });

        if (formData.sendAmount && parseFloat(formData.sendAmount) >= 5) {
          const sendNum = parseFloat(formData.sendAmount);
          const calculatedReceiveAmount = roundToDecimals(sendNum * fxRate, 2);
          dispatch(setReceiveAmount(calculatedReceiveAmount.toString()));
        }
      }
    } catch (error) {
      console.error("Error fetching exchange rate manually:", error);
    }
  }, [
    formData.sendCurrency,
    formData.receiveCurrency,
    formData.sendAmount,
    customerId,
    dispatch,
  ]);

  const roundToDecimals = (value, decimals = 2) => {
    if (typeof value !== "number" || isNaN(value)) {
      return value;
    }
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  };

  const handleSendAmountChange = useCallback(
    (value) => {
      if (window.autoSetTimeout) {
        clearTimeout(window.autoSetTimeout);
        delete window.autoSetTimeout;
      }

      // Clear previous amount error
      setAmountError(null);

      // Allow empty string for user to clear the field
      if (value === "") {
        dispatch(setSendAmount(""));
        activeInput.current = "send";
        dispatch(setReceiveAmount(""));
        setAmountError(null);

        if (typingTimeout.current) {
          clearTimeout(typingTimeout.current);
        }

        isTyping.current = true;
        typingTimeout.current = setTimeout(() => {
          isTyping.current = false;
        }, 600);
        return;
      }

      const cleaned = value.replace(/[^0-9.]/g, "");

      // Handle decimal point edge case
      if (cleaned === ".") {
        return;
      }

      const parts = cleaned.split(".");
      const formattedValue = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;

      // Allow any value to be typed, including below 5
      if (formattedValue !== formData.sendAmount) {
        dispatch(setSendAmount(formattedValue));
      } else {
        return;
      }

      activeInput.current = "send";

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      isTyping.current = true;
      typingTimeout.current = setTimeout(() => {
        isTyping.current = false;

        const sendNum = parseFloat(formattedValue);

        // Validate minimum amount
        if (!isNaN(sendNum) && sendNum > 0 && sendNum < 5) {
          setAmountError(`Minimum send amount is ${formData.sendCurrency?.value || 'USD'} 5.00`);
          dispatch(setReceiveAmount(""));
        } else if (!isNaN(sendNum) && sendNum >= 5 && exchangeRateData?.fxRate) {
          // Only calculate receive amount if amount is valid (>=5)
          setAmountError(null);
          const calculatedReceive = roundToDecimals(
            sendNum * exchangeRateData.fxRate,
            2,
          );
          dispatch(setReceiveAmount(calculatedReceive.toString()));
        } else if (!isNaN(sendNum) && sendNum > 0 && !exchangeRateData?.fxRate) {
          // Amount entered but no exchange rate yet
          setAmountError(null);
        } else if (sendNum === 0 || isNaN(sendNum)) {
          // Clear receive amount if send amount is 0 or invalid
          setAmountError(null);
          dispatch(setReceiveAmount(""));
        }
      }, 600);
    },
    [dispatch, formData.sendAmount, exchangeRateData, formData.sendCurrency],
  );

  const handleReceiveAmountChange = useCallback(
    (rawValue) => {
      if (rawValue === "") {
        dispatch(setReceiveAmount(""));
        dispatch(setSendAmount(""));
        setAmountError(null);
        return;
      }

      const formattedValue = formatAmountInput(rawValue);

      if (formattedValue === formData.receiveAmount) return;

      dispatch(setReceiveAmount(formattedValue));
      activeInput.current = "receive";

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      isTyping.current = true;

      typingTimeout.current = setTimeout(() => {
        isTyping.current = false;

        const receiveNum = parseFloat(formattedValue);
        if (!isNaN(receiveNum) && receiveNum > 0 && exchangeRateData?.fxRate) {
          const calculatedSend = roundToDecimals(
            receiveNum / exchangeRateData.fxRate,
            2,
          );

          // Check if calculated send amount is below minimum
          if (calculatedSend < 5) {
            setAmountError(`Minimum send amount is ${formData.sendCurrency?.value || 'USD'} 5.00`);
            const minSend = 5;
            const minReceive = roundToDecimals(
              minSend * exchangeRateData.fxRate,
              2,
            );
            dispatch(setSendAmount(minSend.toString()));
            dispatch(setReceiveAmount(minReceive.toString()));
          } else {
            setAmountError(null);
            dispatch(setSendAmount(calculatedSend.toString()));
          }
        }
      }, 600);
    },
    [
      dispatch,
      formData.receiveAmount,
      exchangeRateData,
      formData.sendCurrency?.value,
    ],
  );

  const handleSendCurrencyChange = useCallback(
    (option) => {
      dispatch(setSendCurrency(option));
      activeInput.current = "send";
      dispatch(setExchangeRateData(null));
      setShowRecipientDetails(false);
      setAmountError(null); // Clear amount error when currency changes

      Object.keys(exchangeRateCache.current).forEach((key) => {
        if (key.startsWith(option?.value)) {
          delete exchangeRateCache.current[key];
        }
      });

      dispatch(setReceiveAmount(""));
    },
    [dispatch],
  );

  const handleReceiveCurrencyChange = useCallback(
    (option) => {
      dispatch(setReceiveCurrency(option));
      activeInput.current = "receive";
      dispatch(setExchangeRateData(null));
      setShowRecipientDetails(false);
      setAmountError(null); // Clear amount error when currency changes

      Object.keys(exchangeRateCache.current).forEach((key) => {
        if (key.includes(`-${option?.value}-`)) {
          delete exchangeRateCache.current[key];
        }
      });

      dispatch(setReceiveAmount(""));
    },
    [dispatch],
  );

  const handlePaymentMethodChange = useCallback(
    (method) => {
      dispatch(setPaymentMethod(method));
    },
    [dispatch],
  );

  // Strip non-serializable bits (React elements like `icon`) before they ever reach Redux.
  const stripNonSerializable = useCallback((value) => {
    if (value instanceof File) return value;

    if (React.isValidElement(value)) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.map(stripNonSerializable);
    }

    if (value && typeof value === "object") {
      const cleaned = {};
      for (const key of Object.keys(value)) {
        const v = value[key];
        if (React.isValidElement(v)) continue; // drop icon, etc.
        cleaned[key] = v;
      }
      return cleaned;
    }

    return value;
  }, []);

  const handleFieldChange = useCallback(
    (field, value) => {
      dispatch(setFormField({ field, value: stripNonSerializable(value) }));
    },
    [dispatch, stripNonSerializable],
  );

  const handleFileUpload = useCallback(
    (file) => {
      if (!file) return;

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return;
      }

      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        return;
      }

      dispatch(setFormField({ field: "document", value: file }));
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    },
    [dispatch],
  );

  const handleBeneficiarySelect = useCallback(
    (beneficiary) => {
      dispatch(setSelectedBeneficiary(beneficiary));
      if (beneficiary?.id) {
        dispatch(fetchBeneficiaryBanks(beneficiary.id));
      }
    },
    [dispatch],
  );

  const handleBankSelect = useCallback(
    (bank) => {
      console.log("🏦 Bank selected in parent:", bank);
      dispatch(setSelectedBank(bank));
    },
    [dispatch],
  );

  const handleBankAccountSelect = useCallback(
    (account) => {
      console.log("✅ Bank account selected in parent:", account);
      setLocalSelectedBankAccount(account);
      dispatch(setSelectedBankAccount(account));
      setTimeout(() => {
        console.log("✅ Selected bank account confirmed:", account?.id);
      }, 100);
    },
    [dispatch],
  );

  const handleBeneficiaryCodeLookup = useCallback(async () => {
    if (!beneficiaryCode.trim()) {
      return;
    }

    setIsLoadingCode(true);
    try {
      const result = await dispatch(
        fetchBeneficiaryByCode(beneficiaryCode),
      ).unwrap();
      if (result.data) {
        handleBeneficiarySelect(result.data);
      }
    } catch (error) {
      console.error("Error fetching beneficiary:", error);
    } finally {
      setIsLoadingCode(false);
    }
  }, [beneficiaryCode, dispatch, handleBeneficiarySelect]);

  const isOpenBankingAvailable = useCallback(() => {
    const openBankingCurrencies = ["EUR", "GBP", "DKK"];
    const sendCurrency = formData.sendCurrency?.value;
    return (
      step === 3 &&
      formData.paymentMethod === "bank" &&
      sendCurrency &&
      openBankingCurrencies.includes(sendCurrency)
    );
  }, [step, formData.paymentMethod, formData.sendCurrency]);

  const handleInitiateOpenBanking = useCallback(() => {
    if (!formData.agreeToTerms) {
      return;
    }
    if (!selectedBeneficiary) {
      return;
    }
    if (!selectedBank) {
      return;
    }
    if (!formData.sendAmount || parseFloat(formData.sendAmount) <= 0) {
      return;
    }
    setOpenBankingProcessing(true);
    setShowOpenBanking(true);
  }, [
    formData.agreeToTerms,
    selectedBeneficiary,
    selectedBank,
    formData.sendAmount,
  ]);

  const handleOpenBankingClose = useCallback(() => {
    setShowOpenBanking(false);
    setOpenBankingProcessing(false);
  }, []);

  const handleOpenBankingSuccess = useCallback(
    (result) => {
      setShowOpenBanking(false);
      setOpenBankingProcessing(false);
      dispatch(setStep(4));
    },
    [dispatch],
  );

  const handleSubmitTransaction = useCallback(() => {
    const transactionData = {
      from_currency: formData.sendCurrency?.value,
      to_currency: formData.receiveCurrency?.value,

      ...(selectedSilaBankAccount &&
        formData.paymentMethod === "bank" &&
        formData.sendCurrency?.value === "USD"
        ? {
          sila_account_id: selectedSilaBankAccount.id,
          sila_payment_instrument_id:
            selectedSilaBankAccount.payment_instrument_id,
          sila_account_name: selectedSilaBankAccount.account_name,
          sila_routing_number: selectedSilaBankAccount.routing_number,
          sila_account_number_hash: selectedSilaBankAccount.accountNumberHash,
          sila_account_type: selectedSilaBankAccount.account_type,
        }
        : {}),

      send_amount: parseFloat(formData.sendAmount) || 0,
      receive_amount: parseFloat(formData.receiveAmount) || 0,
      exchange_rate: exchangeRateData?.fxRate || formData.exchangeRate || 0,

      customer_id: parseInt(customerId),

      payment_method: formData.paymentMethod,
      conversion_id: exchangeRateData?.conversion_id || formData.conversionId,

      beneficiary: selectedBeneficiary?.id?.toString(),
      beneficiary_bank_id: selectedBank?.id,
      beneficiary_name: selectedBeneficiary?.name,
      beneficiary_bank_name: selectedBank?.bank_name,
      beneficiary_account_number:
        selectedBank?.account_number || selectedBank?.bank_acc_no,

      ...(selectedBeneficiary?.email && {
        beneficiary_email: selectedBeneficiary.email,
      }),
      ...(selectedBeneficiary?.phone_number && {
        beneficiary_phone: selectedBeneficiary.phone_number,
      }),
      ...(selectedBeneficiary?.country && {
        beneficiary_country: selectedBeneficiary.country,
      }),

      is_remit: "Y",

      purpose: formData.purpose?.value || formData.purpose,
      income_source: formData.incomeSource?.value || formData.incomeSource,
      occupation: formData.occupation || "",
      relation: formData.relation?.value || formData.relation || "",
      payout_method: formData.payout_method?.value || formData.paymentMethod,

      document: formData.document,
      agree_to_terms: formData.agreeToTerms ? "1" : "0",

      rails: "Local",

      sender_account_name:
        selectedSilaBankAccount?.account_name || formData.sender_account_name,
      sender_bank_id: selectedSilaBankAccount?.id || formData.sender_bank_id,

      transaction_fee: formData.fee || 0,

      ...(recurringData && recurringData.isRecurring === "1"
        ? {
          isRecurring: recurringData.isRecurring,
          frequency: recurringData.frequency || "",
          custom_days: recurringData.custom_days || "",
          is_recurring: "Y",
          recurring_type:
            recurringData.frequency === "specific_day"
              ? "custom"
              : recurringData.frequency,
          recurring_status: "active",
        }
        : {
          isRecurring: "0",
          is_recurring: "N",
        }),

      transaction_source: "web_app",
      platform: "web",
      timestamp: new Date().toISOString(),
    };

    const cleanData = {};
    Object.keys(transactionData).forEach((key) => {
      const value = transactionData[key];
      if (value !== null && value !== undefined && value !== "") {
        if (typeof value === "object" && !(value instanceof File)) {
          try {
            cleanData[key] = JSON.stringify(value);
          } catch (e) {
            console.warn(`Could not stringify ${key}:`, e);
          }
        } else {
          cleanData[key] = value;
        }
      }
    });

    const required = [
      "from_currency",
      "to_currency",
      "beneficiary",
      "beneficiary_bank_id",
      "send_amount",
      "receive_amount",
      "customer_id",
    ];

    const missing = required.filter((field) => !cleanData[field]);

    if (missing.length > 0) {
      console.error("❌ Missing required fields:", missing);
      return;
    }

    dispatch(submitTransaction(cleanData))
      .unwrap()
      .then((result) => {
        console.log("Transaction submitted successfully:", result);
      })
      .catch((error) => {
        console.error("❌ Transaction submission failed:", error);
      });
  }, [
    customerId,
    formData,
    exchangeRateData,
    selectedBeneficiary,
    selectedBank,
    selectedSilaBankAccount,
    recurringData,
    dispatch,
  ]);

  const handleConfirmTransfer = useCallback(() => {
    setShowConfirmPopup(false);

    if (
      formData.paymentMethod === "bank" &&
      isOpenBankingAvailable() &&
      formData.sendCurrency?.value !== "USD"
    ) {
      handleInitiateOpenBanking();
    } else {
      handleSubmitTransaction();
    }
  }, [
    formData,
    isOpenBankingAvailable,
    handleInitiateOpenBanking,
    handleSubmitTransaction,
  ]);

  const handleCancelTransfer = useCallback(() => {
    setShowConfirmPopup(false);
  }, []);

  const handleNextStep = useCallback(async () => {
    if (step === 1) {
      const sendNum = parseFloat(formData.sendAmount || 0);
      const receiveNum = parseFloat(formData.receiveAmount || 0);
      if (isNaN(sendNum) || sendNum < 5) {
        setAmountError(`Minimum send amount is ${formData.sendCurrency?.value || 'USD'} 5.00`);
        return;
      }

      if (!formData.sendCurrency || !formData.receiveCurrency) {
        return;
      }

      if (!exchangeRateData?.fxRate) {
        return;
      }

      if (formData.paymentMethod === "manual") {
        if (!manualAccountDetails || manualAccountError) {
          return;
        }
      }

      // 👇 NEW CODE: Check transaction limit
      setIsCheckingLimit(true);
      try {
        const destinationCurrency = formData.receiveCurrency?.value || formData.receiveCurrency?.currency_code;

        const result = await dispatch(checkTransactionLimit({
          destinationCurrencyCode: destinationCurrency,
          amount: receiveNum,
        })).unwrap();

        const limit = result.limit;
        if (limit !== undefined && receiveNum > limit) {
          setLimitExceededData({
            limit: limit,
            amount: receiveNum,
            currency: destinationCurrency,
            sendAmount: sendNum,
            sendCurrency: formData.sendCurrency?.value || 'USD',
          });
          setShowLimitExceededModal(true);
          setIsCheckingLimit(false);
          return;
        }

        dispatch(setStep(2));
        setTimeout(() => {
          pageTopRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
        }, 0);
      } catch (error) {
        console.error("Limit check failed, proceeding:", error);
        dispatch(setStep(2));
        setTimeout(() => {
          pageTopRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
        }, 0);
      } finally {
        setIsCheckingLimit(false);
      }
      // 👆 END NEW CODE

    } else if (step === 2) {
      // Keep your existing step 2 code exactly as is
      if (!selectedBeneficiary) {
        console.log("Validation failed: No beneficiary selected");
        return;
      }

      if (!formData.purpose || !formData.purpose.value) {
        console.log("Validation failed: No purpose selected");
        return;
      }

      if (!formData.incomeSource || !formData.incomeSource.value) {
        console.log("Validation failed: No income source selected");
        return;
      }

      if (formData.paymentMethod === "manual") {
        if (!formData.document) {
          console.log("Validation failed: No document uploaded for manual payment");
          return;
        }
      }

      if (formData.paymentMethod === "bank") {
        if (formData.sendCurrency?.value === "USD") {
          if (!hasSilaAccounts || silaBankAccounts.length === 0) {
            console.log("Validation failed: No Sila accounts available for USD");
            return;
          }
          if (!selectedSilaBankAccount) {
            console.log("Validation failed: No Sila bank account selected for USD");
            return;
          }
          if (!selectedSilaBankAccount.web_debit_verified) {
            console.log("Validation failed: Selected Sila account not verified");
            return;
          }
        }
        if (!selectedBank) {
          console.log("Validation failed: No beneficiary bank selected");
          return;
        }
      }

      console.log("✅ All validations passed, moving to step 3");
      dispatch(setStep(3));
      setTimeout(() => {
        pageTopRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
      }, 0);
    } else if (step === 3) {
      if (!formData.agreeToTerms) {
        console.log("Validation failed: Terms not agreed");
        return;
      }
      if (formData.paymentMethod === "bank" && formData.sendCurrency?.value === "USD" && !selectedSilaBankAccount) {
        console.log("Validation failed: No Sila bank account for USD transfer");
        return;
      }
      setShowConfirmPopup(true);
    }
  }, [
    step,
    formData,
    exchangeRateData,
    manualAccountDetails,
    manualAccountError,
    selectedBeneficiary,
    selectedBank,
    selectedSilaBankAccount,
    hasSilaAccounts,
    silaBankAccounts,
    dispatch,
    checkTransactionLimit,
  ]);

  const handlePreviousStep = useCallback(() => {
    if (step > 1) {
      dispatch(setStep(step - 1));
    }
  }, [step, dispatch]);

  const handleReset = useCallback(() => {
    dispatch(resetForm());
    dispatch(setSelectedBankAccount(null));
    setLocalSelectedBankAccount(null);
    setAmountError(null);
  }, [dispatch]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleDownloadReceipt = useCallback(() => {
    if (!transactionResult) {
      return;
    }

    try {
      const doc = new jsPDF();

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Transfer Receipt", 15, 25);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Transaction completed successfully", 15, 35);

      doc.setTextColor(0, 0, 0);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Transaction ID:", 15, 55);
      doc.setFont("helvetica", "normal");
      doc.text(
        transactionResult.transaction_id || transactionResult.id || "N/A",
        60,
        55,
      );

      doc.setFont("helvetica", "bold");
      doc.text("Date:", 15, 65);
      doc.setFont("helvetica", "normal");
      doc.text(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        60,
        65,
      );

      doc.setFont("helvetica", "bold");
      doc.text("Status:", 15, 75);
      doc.setFont("helvetica", "normal");
      doc.text(transactionResult.status || "Completed", 60, 75);

      doc.setFillColor(243, 244, 246);
      doc.rect(15, 90, 180, 10, "F");

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Transfer Details", 20, 97);

      const transferData = [
        [
          "You Sent",
          `${formData.sendCurrency?.value || ""} ${parseFloat(formData.sendAmount || 0).toFixed(2)}`,
        ],
        [
          "Recipient Receives",
          `${formData.receiveCurrency?.value || ""} ${parseFloat(formData.receiveAmount || 0).toFixed(2)}`,
        ],
        [
          "Exchange Rate",
          `1 ${formData.sendCurrency?.value || ""} = ${(exchangeRateData?.fxRate || transactionResult.exchange_rate || 0).toFixed(6)} ${formData.receiveCurrency?.value || ""}`,
        ],
        ["Transfer Fee", `${formData.sendCurrency?.value || ""} 0.00`],
        [
          "Total Amount",
          `${formData.sendCurrency?.value || ""} ${parseFloat(formData.sendAmount || 0).toFixed(2)}`,
        ],
      ];

      autoTable(doc, {
        startY: 105,
        head: [["Description", "Amount"]],
        body: transferData,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 10 },
        margin: { left: 15, right: 15 },
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      doc.setFillColor(243, 244, 246);
      doc.rect(15, finalY, 180, 10, "F");

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Recipient Information", 20, finalY + 7);

      const recipientData = [
        ["Beneficiary Name", selectedBeneficiary?.name || "N/A"],
        ["Bank Name", selectedBank?.bank_name || "N/A"],
        [
          "Account Number",
          selectedBank?.account_number
            ? `****${selectedBank.account_number.slice(-4)}`
            : selectedBank?.bank_acc_no
              ? `****${selectedBank.bank_acc_no.slice(-4)}`
              : "N/A",
        ],
        ["Account Currency", formData.receiveCurrency?.value || "N/A"],
      ];

      autoTable(doc, {
        startY: finalY + 15,
        body: recipientData,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 50 },
          1: { cellWidth: 130 },
        },
        margin: { left: 15, right: 15 },
      });

      const pageHeight = doc.internal.pageSize.height;

      doc.setDrawColor(200, 200, 200);
      doc.line(15, pageHeight - 30, 195, pageHeight - 30);

      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        "This is an electronically generated receipt",
        15,
        pageHeight - 20,
      );
      doc.text(
        "For any inquiries, please contact our support team +1-888-226-0712",
        15,
        pageHeight - 15,
      );
      doc.text(
        `© ${new Date().getFullYear()} Xchangely. All rights reserved.`,
        15,
        pageHeight - 10,
      );

      doc.save(
        `receipt_${transactionResult.transaction_id || transactionResult.id || "transaction"}.pdf`,
      );
    } catch (error) {
      console.error("Error downloading receipt:", error);
    }
  }, [
    transactionResult,
    formData,
    selectedBeneficiary,
    selectedBank,
    exchangeRateData,
  ]);

  const handleRecurringDataChange = useCallback((data) => {
    setRecurringData(data);
  }, []);

  // Save current remittance state to sessionStorage before navigating to add beneficiary
  const saveRemittanceState = useCallback(() => {
    // Strip non-serializable fields (React elements like `icon`, and File objects)
    // before persisting to sessionStorage.
    const sanitizeOption = (option) => {
      if (!option || typeof option !== "object") return option;
      const { icon, ...rest } = option; // drop icon (React element) if present
      return rest;
    };

    const stateToSave = {
      step: step,
      sendAmount: formData.sendAmount,
      receiveAmount: formData.receiveAmount,
      sendCurrency: sanitizeOption(formData.sendCurrency),
      receiveCurrency: sanitizeOption(formData.receiveCurrency),
      paymentMethod: formData.paymentMethod,
      purpose: sanitizeOption(formData.purpose),
      incomeSource: sanitizeOption(formData.incomeSource),
      relation: sanitizeOption(formData.relation),
      occupation: formData.occupation,
      payout_method: sanitizeOption(formData.payout_method),
      agreeToTerms: formData.agreeToTerms,
      // NOTE: File objects can't survive JSON.stringify/sessionStorage — omit `document`
      // entirely; if you need to preserve an uploaded file across this navigation,
      // it needs separate handling (e.g. re-prompt upload, or store in memory/IndexedDB).
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem('remittance_temp_state', JSON.stringify(stateToSave));
      console.log("💾 Saved remittance state:", stateToSave);
    } catch (error) {
      console.error("❌ Failed to save remittance state:", error);
    }
  }, [step, formData]);

  // Restore remittance state from sessionStorage
  const restoreRemittanceState = useCallback(() => {
    const savedState = sessionStorage.getItem('remittance_temp_state');
    if (savedState) {
      try {
        const restoredState = JSON.parse(savedState);
        console.log("🔄 Restoring remittance state:", restoredState);

        // Only restore if state is not too old (within 30 minutes)
        if (Date.now() - (restoredState.timestamp || 0) < 30 * 60 * 1000) {
          if (restoredState.sendCurrency) dispatch(setSendCurrency(restoredState.sendCurrency));
          if (restoredState.receiveCurrency) dispatch(setReceiveCurrency(restoredState.receiveCurrency));
          if (restoredState.sendAmount) dispatch(setSendAmount(restoredState.sendAmount));
          if (restoredState.receiveAmount) dispatch(setReceiveAmount(restoredState.receiveAmount));
          if (restoredState.paymentMethod) dispatch(setPaymentMethod(restoredState.paymentMethod));
          if (restoredState.purpose) dispatch(setFormField({ field: "purpose", value: restoredState.purpose }));
          if (restoredState.incomeSource) dispatch(setFormField({ field: "incomeSource", value: restoredState.incomeSource }));
          if (restoredState.relation) dispatch(setFormField({ field: "relation", value: restoredState.relation }));
          if (restoredState.occupation) dispatch(setFormField({ field: "occupation", value: restoredState.occupation }));
          if (restoredState.payout_method) dispatch(setFormField({ field: "payout_method", value: restoredState.payout_method }));
          if (restoredState.agreeToTerms) dispatch(setFormField({ field: "agreeToTerms", value: restoredState.agreeToTerms }));

          // Clear the saved state after restoring
          sessionStorage.removeItem('remittance_temp_state');
          return true;
        }
      } catch (error) {
        console.error("Failed to restore state:", error);
      }
    }
    return false;
  }, [dispatch]);

  useEffect(() => {
    console.log("📍 Remittance location state:", location.state);
  
    // Handle returning from Add Beneficiary with a new beneficiary (either newly created OR existing added)
    if (location.state?.newBeneficiary && location.state?.returnToStep === 2) {
      console.log("🔄 Returning from Add Beneficiary with beneficiary:", location.state.newBeneficiary);
  
      const wasRestored = restoreRemittanceState();
      console.log("📊 State restored:", wasRestored);
  
      const newBeneficiary = location.state.newBeneficiary;
  
      if (newBeneficiary && newBeneficiary.id) {
        if (step !== 2) {
          console.log("📌 Setting step to 2");
          dispatch(setStep(2));
        }
  
        const customerIdForFetch = customerId || localStorage.getItem("customerId") || "1720";
  
        // Force a refetch so Redux's `beneficiaries` array includes the
        // newly added/created beneficiary with its full record.
        dispatch(fetchBeneficiaries(customerIdForFetch));
  
        // Mark it pending for selection
        setPendingNewBeneficiaryId(newBeneficiary.id);
  
        // Clear the location state to prevent re-selection on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  
    // Handle returning from Add Beneficiary cancellation
    if (location.state?.from === "remittance" && !location.state?.newBeneficiary) {
      console.log("🔄 Returning from Add Beneficiary cancellation");
      
      // Make sure we're on step 2
      if (step !== 2) {
        console.log("📌 Setting step to 2 (cancellation)");
        dispatch(setStep(2));
      }
      
      // Restore the saved state
      const wasRestored = restoreRemittanceState();
      console.log("📊 State restored (cancellation):", wasRestored);
      
      // Clear the location state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, dispatch, navigate, step, restoreRemittanceState, customerId]);

  // Select the new beneficiary as soon as its FULL record (with name,
  // phone_number, etc.) shows up in the refetched beneficiaries list.
  useEffect(() => {
    if (!pendingNewBeneficiaryId) return;

    const fullBeneficiary = (beneficiaries || []).find(
      (b) => b.benef_uuid === pendingNewBeneficiaryId || b.id === pendingNewBeneficiaryId
    );

    if (fullBeneficiary) {
      console.log("👤 Selecting beneficiary (from refreshed Redux list):", fullBeneficiary);
      handleBeneficiarySelect(fullBeneficiary);

      if (fullBeneficiary.benef_banks && fullBeneficiary.benef_banks.length > 0) {
        console.log("🏦 Selecting first bank:", fullBeneficiary.benef_banks[0]);
        handleBankSelect(fullBeneficiary.benef_banks[0]);
      } else {
        console.log("🔍 Fetching banks for new beneficiary");
        dispatch(fetchBeneficiaryBanks(fullBeneficiary.id));
      }

      setPendingNewBeneficiaryId(null);
    }
  }, [beneficiaries, pendingNewBeneficiaryId, handleBeneficiarySelect, handleBankSelect, dispatch]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative flex justify-center">
            <RingLoader color="#6366f1" size={60} />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-900">
              Initializing Transfer System
            </p>
            <p className="text-sm text-slate-600 max-w-sm">
              Loading your accounts and available currencies...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const ProgressSteps = () => {
    const steps = [
      { number: 1, label: "Transfer Details", icon: <TbTransfer /> },
      { number: 2, label: "Recipient", icon: <FaUser /> },
      { number: 3, label: "Review Transfer", icon: <MdSecurity /> },
      { number: 4, label: "Receipt", icon: <FiCheck /> },
    ];

    return (
      <div className="mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2"></div>
          <motion.div
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-indigo-600 -translate-y-1/2"
            initial={{ width: "0%" }}
            animate={{ width: `${((step - 1) / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          ></motion.div>

          {steps.map((stepItem) => (
            <div key={stepItem.number} className="relative z-10">
              <motion.div
                initial={false}
                animate={{
                  scale: step === stepItem.number ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 ${step > stepItem.number
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                  : step === stepItem.number
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white text-slate-400 border-2 border-slate-200"
                  }`}
              >
                {step > stepItem.number ? (
                  <FiCheck className="w-5 h-5" />
                ) : (
                  <span className="flex items-center justify-center">
                    {stepItem.number}
                  </span>
                )}
              </motion.div>
              <div className="mt-3 text-center hidden sm:block">
                <span
                  className={`text-xs font-medium ${step >= stepItem.number
                    ? "text-slate-700"
                    : "text-slate-400"
                    }`}
                >
                  {stepItem.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getPaymentMethodComponent = () => {
    switch (formData.paymentMethod) {
      case "manual":
        return (
          <ManualDeposit
            formData={formData}
            manualAccountDetails={manualAccountDetails}
            manualAccountError={manualAccountError}
            manualDetailsLoading={manualDetailsLoading}
            onFileUpload={handleFileUpload}
            filePreview={filePreview}
            selectedBeneficiary={selectedBeneficiary}
            selectedBank={selectedBank}
            beneficiaryBanks={beneficiaryBanks}
            beneficiaryLoading={beneficiaryLoading}
            onBeneficiarySelect={handleBeneficiarySelect}
            onBankSelect={handleBankSelect}
            customerId={customerId}
            beneficiaryCode={beneficiaryCode}
            setBeneficiaryCode={setBeneficiaryCode}
            isLoadingCode={isLoadingCode}
            showCodeInput={showCodeInput}
            setShowCodeInput={setShowCodeInput}
            handleBeneficiaryCodeLookup={handleBeneficiaryCodeLookup}
            purposeOptions={purposeOptions}
            incomeSourceOptions={incomeSourceOptions}
            relationOptions={relationOptions}
            paymentOptions={paymentOptions}
            onPaymentMethodChange={handlePaymentMethodChange}
            onFieldChange={handleFieldChange}
            copyToClipboard={copyToClipboard}
            copiedField={copiedField}
            onSaveRemittanceState={saveRemittanceState}
          />
        );
      case "bank":
        return (
          <BankTransfer
            formData={formData}
            selectedBeneficiary={selectedBeneficiary}
            onRecurringDataChange={handleRecurringDataChange}
            selectedBank={selectedBank}
            beneficiaryBanks={beneficiaryBanks}
            beneficiaryLoading={beneficiaryLoading}
            onBeneficiarySelect={handleBeneficiarySelect}
            onBankSelect={handleBankSelect}
            onFieldChange={handleFieldChange}
            purposeOptions={purposeOptions}
            incomeSourceOptions={incomeSourceOptions}
            relationOptions={relationOptions}
            paymentOptions={paymentOptions}
            selectedCurrency={formData.sendCurrency?.value}
            silaBankAccounts={silaBankAccounts}
            hasSilaAccounts={hasSilaAccounts}
            silaAccountsLoading={silaAccountsLoading}
            silaAccountsError={silaAccountsError}
            selectedBankAccount={selectedSilaBankAccount}
            onBankAccountSelect={handleBankAccountSelect}
            customerId={customerId}
            onSaveRemittanceState={saveRemittanceState}
          />
        );
      default:
        return null;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Main Transfer Card - Redesigned */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      International Transfer
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Send money securely worldwide
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <FaGlobe className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* You Send Section */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <ArrowUpRightIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      You Send
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    From your account
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-medium text-slate-400">
                        {formData.sendCurrency?.value === "USD"
                          ? "$"
                          : formData.sendCurrency?.value === "EUR"
                            ? "€"
                            : formData.sendCurrency?.value === "GBP"
                              ? "£"
                              : ""}
                      </span>
                      <input
                        type="text"
                        value={formData.sendAmount || ""}
                        onChange={(e) => handleSendAmountChange(e.target.value)}
                        placeholder="0.00"
                        className={`w-full pl-10 pr-4 py-4 text-3xl font-bold bg-slate-50 border rounded-xl focus:outline-none transition-all duration-200 ${amountError
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                          }`}
                        inputMode="decimal"
                      />
                    </div>

                    {/* Show error message if amount is below minimum */}
                    {amountError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 mt-2 flex items-center gap-1"
                      >
                        <FaExclamationTriangle className="w-3 h-3" />
                        {amountError}
                      </motion.p>
                    )}

                    {/* Show regular hint when no error */}
                    {!amountError && (
                      <p className="text-xs text-slate-400 mt-2">
                        Min: {formData.sendCurrency?.value || "USD"} 5.00
                      </p>
                    )}
                  </div>
                  <div className="sm:w-48 relative">
                    <Select
                      options={sendCurrencyOptions}
                      value={formData.sendCurrency}
                      onChange={handleSendCurrencyChange}
                      placeholder="Currency"
                      styles={selectStyles}
                      isSearchable
                      className="text-sm"
                      classNamePrefix="select"
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      formatOptionLabel={({ label, balance }) => (
                        <div className="flex justify-between items-center">
                          <span>{label}</span>
                          {balance && (
                            <span className="text-xs text-slate-400">
                              {parseFloat(balance).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Exchange Rate - With Spinning Icon */}
              {exchangeRateData?.fxRate && (
                <div className="py-3 bg-indigo-50/30 border-y border-indigo-100">
                  <div className="flex items-center justify-between px-6 gap-4">
                    <div className="text-left min-w-[80px]">
                      <p className="text-sm font-semibold text-slate-700">
                        1 {formData.sendCurrency?.value}
                      </p>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center mb-1"
                      >
                        <FaExchangeAlt className="w-3 h-3 text-indigo-500" />
                      </motion.div>
                      <p className="text-sm font-bold text-indigo-600">
                        = {exchangeRateData.fxRate.toFixed(4)} {formData.receiveCurrency?.value}
                      </p>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <button
                        onClick={fetchExchangeRateManual}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1 justify-end w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="w-3 h-3 animate-spin" />
                            <span>...</span>
                          </>
                        ) : (
                          <>
                            <FaSync className="w-3 h-3" />
                            <span>Refresh</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recipient Receives Section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                      <ArrowDownLeftIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      Recipient Receives
                    </span>
                  </div>
                  {/* <span className="text-xs text-slate-400">
                    Estimated amount
                  </span> */}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.receiveAmount || ""}
                        onChange={(e) =>
                          handleReceiveAmountChange(e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-4 text-3xl font-bold bg-emerald-50 border border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-all duration-200"
                        inputMode="decimal"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48 relative">
                    <Select
                      options={receiveCurrencyOptions}
                      value={receiveCurrencyOptions.find(
                        (opt) =>
                          opt.value === formData.receiveCurrency?.currency_code ||
                          opt.value === formData.receiveCurrency?.value
                      )}
                      onChange={handleReceiveCurrencyChange}
                      placeholder="Currency"
                      styles={{
                        ...selectStyles,
                        menu: (base) => ({
                          ...base,
                          zIndex: 9999,
                          position: "absolute",
                        }),
                      }}
                      className="text-sm"
                      classNamePrefix="select"
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      formatOptionLabel={({ label, icon, default_remittance }) => (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span>{icon}</span>
                            <span>{label}</span>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection - Card Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 bg-purple-50 rounded-lg">
                  <CreditCardIcon className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Payment Method
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentOptions.map((option) => {
                  const isSelected = formData.paymentMethod === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handlePaymentMethodChange(option.value)}
                      onMouseEnter={() => setActiveCard(option.value)}
                      onMouseLeave={() => setActiveCard(null)}
                      className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${isSelected
                        ? `border-indigo-500 bg-indigo-50/30 shadow-md`
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2.5 rounded-xl transition-all duration-200 ${isSelected
                            ? "bg-indigo-500 text-white shadow-md"
                            : "bg-slate-100 text-slate-600"
                            }`}
                        >
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h4
                            className={`font-semibold ${isSelected ? "text-indigo-900" : "text-slate-900"}`}
                          >
                            {option.label}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">
                            {option.description}
                          </p>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1.5 mt-2"
                            >
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                              <span className="text-xs font-medium text-indigo-600">
                                Selected
                              </span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Transfer Summary - Minimal */}
            {exchangeRateData?.fxRate && formData.sendAmount && parseFloat(formData.sendAmount) >= 5 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-amber-50 rounded-lg">
                    <FileTextIcon className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    Transfer Summary
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600">Amount to send</span>
                    <span className="font-semibold text-slate-900">
                      {formData.sendCurrency?.value}{" "}
                      {parseFloat(formData.sendAmount || 0).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-slate-200">
                    <span className="text-slate-600">Transfer fee</span>
                    <span className="font-semibold text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-900">
                      Total to pay
                    </span>
                    <span className="text-xl font-bold text-indigo-600">
                      {formData.sendCurrency?.value} {totalToPay.toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Manual Deposit Section - Keep existing */}
            {formData.paymentMethod === "manual" && (
              <ManualDepositSection
                manualAccountDetails={manualAccountDetails}
                manualAccountError={manualAccountError}
                manualDetailsLoading={manualDetailsLoading}
                formData={formData}
                copyToClipboard={copyToClipboard}
                copiedField={copiedField}
                showAdvancedDetails={showAdvancedDetails}
                setShowAdvancedDetails={setShowAdvancedDetails}
                handlePaymentMethodChange={handlePaymentMethodChange}
                navigate={navigate}
              />
            )}

            {/* Estimated Delivery Time */}
            {localStorage.getItem("show_estimated_time_delivery") === "Y" && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                {deliveryTimeLoading ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs">Loading delivery time...</span>
                  </div>
                ) : deliveryTimeData?.deliverTime ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
                  >
                    <FaClock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-700 mb-0.5">
                        Estimated Delivery Time
                      </p>
                      <p className="text-sm text-amber-800">
                        {deliveryTimeData.deliverTime}
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <Step2Details
            formData={formData}
            paymentOptions={paymentOptions}
            beneficiaryBanks={beneficiaryBanks}
            selectedBeneficiary={selectedBeneficiary}
            selectedBank={selectedBank}
            onPaymentMethodChange={handlePaymentMethodChange}
            onFieldChange={handleFieldChange}
            onFileUpload={handleFileUpload}
            filePreview={filePreview}
            onBeneficiarySelect={handleBeneficiarySelect}
            onBankSelect={handleBankSelect}
            purposeOptions={purposeOptions}
            incomeSourceOptions={incomeSourceOptions}
            relationOptions={relationOptions}
            exchangeRateData={exchangeRateData}
            fee={fee}
            totalToPay={totalToPay}
            paymentMethodComponent={getPaymentMethodComponent()}
            manualAccountDetails={manualAccountDetails}
            onRecurringDataChange={handleRecurringDataChange}
            manualAccountError={manualAccountError}
            manualDetailsLoading={manualDetailsLoading}
            beneficiaryLoading={beneficiaryLoading}
            copyToClipboard={copyToClipboard}
            copiedField={copiedField}
          />
        );

      case 3:
        return (
          <Step3Confirm
            formData={formData}
            selectedBeneficiary={selectedBeneficiary}
            selectedBank={selectedBank}
            manualAccountDetails={manualAccountDetails}
            onRecurringDataChange={handleRecurringDataChange}
            exchangeRateData={exchangeRateData}
            onAgreeToTerms={(value) => handleFieldChange("agreeToTerms", value)}
            onSubmit={handleConfirmTransfer}
            onCancel={handleCancelTransfer}
            showConfirmPopup={showConfirmPopup}
            loading={loading}
            paymentMethod={formData.paymentMethod}
            isOpenBankingAvailable={isOpenBankingAvailable()}
            onInitiateOpenBanking={handleInitiateOpenBanking}
            openBankingProcessing={openBankingProcessing}
            selectedBankAccount={selectedSilaBankAccount}
          />
        );

      case 4:
        return (
          <Step4Success
            transactionResult={transactionResult}
            formData={formData}
            selectedBeneficiary={selectedBeneficiary}
            manualAccountDetails={manualAccountDetails}
            onRecurringDataChange={handleRecurringDataChange}
            exchangeRateData={exchangeRateData}
            onReset={handleReset}
            onDownloadReceipt={handleDownloadReceipt}
            onNewTransfer={() => {
              handleReset();
              navigate("/remittance");
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div ref={pageTopRef}></div>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Popup Modal */}
        {showBankLinkReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-400 to-purple-500 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">
                  Link Your Bank Account
                </h3>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-slate-700 mb-6">
                  For first time users : Please link your bank first before proceeding through bank transfer.
                </p>

                <button
                  onClick={handleCloseBankReminder}
                  className="w-full px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={handleCloseBankReminder}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </div>
        )}

        {/* Transaction Limit Exceeded Modal */}
        {showLimitExceededModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <FaExclamationTriangle className="w-6 h-6 text-white" />
                  <h3 className="text-lg font-semibold text-white">Transaction Limit Exceeded</h3>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <p className="text-slate-700">The amount you're trying to send exceeds the maximum allowed transaction limit.</p>

                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">Your amount ({limitExceededData.currency}):</span>
                      <span className="font-bold text-red-600">
                        {limitExceededData.currency} {limitExceededData.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">Send amount ({limitExceededData.sendCurrency}):</span>
                      <span className="font-bold text-slate-700">
                        {limitExceededData.sendCurrency} {limitExceededData.sendAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-red-200 pt-2 mt-2">
                      <span className="text-sm text-slate-600">Maximum allowed:</span>
                      <span className="font-bold text-slate-900">
                        {limitExceededData.currency} {limitExceededData.limit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 mb-1">What can you do?</p>
                        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                          <li>Reduce your transfer amount to within the limit</li>
                          <li>Contact support for higher transaction limits</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowLimitExceededModal(false)}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowLimitExceededModal(false);
                      setTimeout(() => {
                        const amountInput = document.querySelector('input[type="text"][placeholder="0.00"]');
                        if (amountInput) amountInput.focus();
                      }, 100);
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
                  >
                    Adjust Amount
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowLimitExceededModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </div>
        )}

        <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <ProgressSteps />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {step < 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {step > 1 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePreviousStep}
                  className="flex-1 px-6 py-3.5 text-base border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaArrowLeft className="w-4 h-4" />
                  Back
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoBack}
                  className="flex-1 px-6 py-3.5 text-base border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaArrowLeft className="w-4 h-4" />
                  Cancel
                </motion.button>
              )}

              {step < 3 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextStep}
                  disabled={
                    (step === 1 &&
                      (!formData.sendAmount ||
                        parseFloat(formData.sendAmount) < 5 ||
                        amountError || // Check if there's an amount error
                        !exchangeRateData?.fxRate ||
                        isCheckingLimit ||
                        (formData.paymentMethod === "manual" &&
                          (!manualAccountDetails || manualAccountError)))) ||
                    (step === 2 && isStep2ButtonDisabled) ||
                    loading ||
                    manualDetailsLoading ||
                    beneficiaryLoading ||
                    openBankingProcessing ||
                    isInitializing
                  }
                  className="flex-[2] px-6 py-3.5 text-base rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingLimit ? (
                    <>
                      <RingLoader size={18} color="#ffffff" />
                      <span>Checking limit...</span>
                    </>
                  ) : loading ? (
                    <>
                      <RingLoader size={18} color="#ffffff" />
                      <span>Processing...</span>
                    </>
                  ) : manualDetailsLoading ? (
                    <>
                      <RingLoader size={18} color="#ffffff" />
                      <span>Loading details...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <FaArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              )}

              {step === 3 && (
                <>
                  {formData.paymentMethod === "bank" &&
                    isOpenBankingAvailable() ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleInitiateOpenBanking}
                      disabled={
                        !formData.agreeToTerms ||
                        loading ||
                        openBankingProcessing ||
                        !selectedBeneficiary ||
                        !selectedBank ||
                        !formData.sendAmount ||
                        parseFloat(formData.sendAmount) <= 0
                      }
                      className="flex-1 px-6 py-3.5 text-base rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {openBankingProcessing ? (
                        <>
                          <RingLoader size={18} color="#ffffff" />
                          <span>Initializing...</span>
                        </>
                      ) : (
                        <>
                          <span>Open Banking</span>
                          <FaArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  ) : formData.paymentMethod === "bank" ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNextStep}
                      disabled={
                        !formData.agreeToTerms || loading || openBankingProcessing
                      }
                      className="flex-1 px-6 py-3.5 text-base rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <RingLoader size={18} color="#ffffff" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Transfer</span>
                          <FiSend className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  ) : null}

                  {formData.paymentMethod === "manual" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNextStep}
                      disabled={
                        !formData.agreeToTerms || loading || openBankingProcessing
                      }
                      className="flex-1 px-6 py-3.5 text-base rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <RingLoader size={18} color="#ffffff" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Transfer</span>
                          <FiSend className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  )}
                </>
              )}
            </motion.div>
          )}
        </main>

        {showOpenBanking && (
          <PaymentInitiation
            selectedCurrency={formData.sendCurrency?.value}
            amount={formData?.sendAmount || ""}
            purpose={formData?.purpose?.value || ""}
            paymentMethod="bank_transfer"
            selectedBeneficiaryBank={selectedBank}
            selectedBeneficiary={selectedBeneficiary}
            customerId={customerId || localStorage.getItem("authcustomer_id")}
            showPaymentInitiation={showOpenBanking}
            transactionType="remittance"
            onClose={() => {
              setShowOpenBanking(false);
              setOpenBankingProcessing(false);
            }}
            onSuccess={(result) => {
              if (result.success) {
                setShowOpenBanking(false);
                setOpenBankingProcessing(false);
                dispatch(setStep(4));
              } else {
                setOpenBankingProcessing(false);
              }
            }}
          />
        )}
      </div>
    </>
  );
};

// Helper Icon Components
const ArrowUpRightIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 17L17 7M7 7h10v10"
    />
  </svg>
);

const ArrowDownLeftIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 7L7 17M7 7h10v10"
    />
  </svg>
);

const CreditCardIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const FileTextIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

// Manual Deposit Section Component
const ManualDepositSection = ({
  manualAccountDetails,
  manualAccountError,
  manualDetailsLoading,
  formData,
  copyToClipboard,
  copiedField,
  showAdvancedDetails,
  setShowAdvancedDetails,
  handlePaymentMethodChange,
  navigate,
}) => {
  if (manualAccountError) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBuilding className="w-8 h-8 text-red-500" />
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">
            Bank Details Unavailable
          </h4>
          <p className="text-slate-600 max-w-md mx-auto">
            We're unable to retrieve bank details for the selected currency.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => handlePaymentMethodChange("bank")}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
            >
              Switch to Bank Transfer
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (manualDetailsLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center py-8">
          <RingLoader color="#6366f1" size={40} />
          <p className="mt-4 text-slate-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  if (!manualAccountDetails) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUniversity className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">
            Enter Transfer Amount
          </h4>
          <p className="text-slate-600">
            Please enter the amount you wish to send to view deposit details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bank Details */}
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-xl p-5">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FaUniversity className="text-emerald-600" />
                Primary Bank Details
              </h4>

              {manualAccountDetails.account_number && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">
                      Account Number
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          manualAccountDetails.account_number,
                          "account_number",
                        )
                      }
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      {copiedField === "account_number" ? (
                        <>
                          <FaCheck className="w-3 h-3 text-emerald-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <FaCopy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="font-mono font-semibold text-slate-900">
                      {manualAccountDetails.account_number}
                    </p>
                  </div>
                </div>
              )}

              {manualAccountDetails.account_name && (
                <div className="mb-4">
                  <span className="text-sm text-slate-600">Account Name</span>
                  <div className="mt-1 bg-white rounded-lg p-3 border border-slate-200">
                    <p className="font-medium text-slate-900">
                      {manualAccountDetails.account_name}
                    </p>
                  </div>
                </div>
              )}

              {manualAccountDetails.bank_name && (
                <div>
                  <span className="text-sm text-slate-600">Bank Name</span>
                  <div className="mt-1 bg-white rounded-lg p-3 border border-slate-200">
                    <p className="font-medium text-slate-900">
                      {manualAccountDetails.bank_name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
              className="w-full p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Additional Bank Information
                </span>
                {showAdvancedDetails ? (
                  <FaArrowUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <FaArrowDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-indigo-50 rounded-xl p-5">
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FaInfoCircle className="text-indigo-600" />
              Deposit Instructions
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-700">1</span>
                </div>
                <p className="text-sm text-slate-700">
                  Visit any branch of{" "}
                  <span className="font-medium">
                    {manualAccountDetails.bank_name || "the bank"}
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-700">2</span>
                </div>
                <p className="text-sm text-slate-700">
                  Deposit{" "}
                  <span className="font-bold text-emerald-600">
                    {formData.sendCurrency?.value}{" "}
                    {parseFloat(formData.sendAmount || 0).toFixed(2)}
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-700">3</span>
                </div>
                <p className="text-sm text-slate-700">
                  Keep your deposit receipt for verification
                </p>
              </div>
            </div>
          </div>
        </div>

        {showAdvancedDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 pt-6 border-t border-slate-200"
          >
            <h4 className="font-semibold text-slate-900 mb-4">
              Advanced Bank Details
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Bank Code", value: manualAccountDetails.bank_code },
                { label: "SWIFT Code", value: manualAccountDetails.swift_code },
                {
                  label: "Branch Name",
                  value: manualAccountDetails.branch_name,
                },
                {
                  label: "Branch Code",
                  value: manualAccountDetails.branch_code,
                },
                { label: "IBAN", value: manualAccountDetails.iban },
                { label: "Sort Code", value: manualAccountDetails.sort_code },
                {
                  label: "Routing Number",
                  value: manualAccountDetails.routing_number,
                },
              ].map(
                (item) =>
                  item.value && (
                    <div
                      key={item.label}
                      className="bg-slate-50 rounded-lg p-3"
                    >
                      <p className="text-xs text-slate-500 mb-1">
                        {item.label}
                      </p>
                      <p className="text-sm font-mono font-medium text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  ),
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Remittance;