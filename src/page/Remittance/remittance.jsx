import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowRight,
  FaArrowLeft,
  FaInfoCircle,
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
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { FiSend, FiCheck } from "react-icons/fi";
import { HiCurrencyDollar, HiOutlineBanknotes } from "react-icons/hi2";
import { MdAccountBalance, MdSecurity } from "react-icons/md";
import { TbTransfer } from "react-icons/tb";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
} from "./slices/remittanceSlice";

import { fetchAllStaticData } from "./slices/staticDataSlice";

// Import beneficiary actions
import {
  setSelectedBeneficiary,
  setSelectedBank,
  fetchBeneficiaryBanks,
  fetchBeneficiaryByCode,
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
  const selectedSilaBankAccount = useSelector(selectSelectedBankAccount);

  // Local state for UI
  const [filePreview, setFilePreview] = useState(null);
  const [beneficiaryCode, setBeneficiaryCode] = useState("");
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [exchangeRateData, setExchangeRateData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState(null);
  const [manualAccountError, setManualAccountError] = useState(null);
  const [manualDetailsLoading, setManualDetailsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [showRecipientDetails, setShowRecipientDetails] = useState(true);
  const [showOpenBanking, setShowOpenBanking] = useState(false);
  const [openBankingProcessing, setOpenBankingProcessing] = useState(false);

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

  // Professional payment method options
  const paymentOptions = useMemo(
    () => [
      {
        value: "bank",
        label: "Bank Transfer",
        description: "Direct wire transfer",
        icon: <MdAccountBalance className="w-6 h-6" />,
        color: "from-blue-600 to-blue-700",
        bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
        borderColor: "border-blue-200",
      },
      {
        value: "manual",
        label: "Cash Deposit",
        description: "Bank branch deposit",
        icon: <HiOutlineBanknotes className="w-6 h-6" />,
        color: "from-emerald-600 to-emerald-700",
        bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
        borderColor: "border-emerald-200",
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
        label: `${account.currency_code} - ${account.bank_name || "Account"}`,
        bank_id: account.id,
        icon: account.icon,
        balance: account.balance,
      })),
    [bankAccounts],
  );

  const receiveCurrencyOptions = useMemo(
    () => currencies?.receiveOptions || [],
    [currencies?.receiveOptions],
  );

  // Copy to clipboard function
  const copyToClipboard = useCallback((text, fieldName) => {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedField(fieldName);
        toast.success(`Copied ${fieldName.replace("_", " ")} to clipboard`, {
          position: "top-right",
          autoClose: 2000,
        });
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard", {
          position: "top-right",
          autoClose: 2000,
        });
      });
  }, []);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      if (customerId) {
        try {
          await Promise.all([
            dispatch(fetchBankAccounts(customerId)),
            dispatch(fetchPayoutCurrencies()),
            dispatch(fetchAllStaticData()),
          ]);
          toast.success("Data loaded successfully", {
            position: "top-right",
            autoClose: 2000,
          });
        } catch (error) {
          console.error("Failed to initialize data:", error);
          toast.error("Failed to load initial data", {
            position: "top-right",
            autoClose: 3000,
          });
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
        toast.error("Customer ID not found", {
          position: "top-right",
          autoClose: 3000,
        });
        navigate("/login");
      }
    };

    initializeData();
  }, [customerId, dispatch, navigate]);

  const hasFetchedSilaAccounts = useRef(false);

  useEffect(() => {
    const customerIdToUse =
      customerId || localStorage.getItem("customerId") || "1720";

    if (
      customerIdToUse &&
      !silaAccountsLoading &&
      !hasFetchedSilaAccounts.current
    ) {
      console.log("🔄 Remittance: Fetching Sila bank accounts...");

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

  useEffect(() => {
    // Only set default on initial load, not when user clears the field
    if (!initialLoading && !formData.sendAmount && step === 1) {
      dispatch(setSendAmount("5"));
      activeInput.current = "send";
    }
  }, [initialLoading, dispatch, step]);

  // Reset exchange rate data when currencies change
  useEffect(() => {
    if (formData.sendCurrency?.value || formData.receiveCurrency?.value) {
      setExchangeRateData(null);
      setExchangeRateError(null);
      isManualUpdate.current = false;
      dispatch(setReceiveAmount(""));
    }
  }, [formData.sendCurrency, formData.receiveCurrency, dispatch]);

  // Fetch exchange rate with deduplication and caching
  useEffect(() => {
    let isMounted = true;
    let debounceTimer;

    const fetchRate = async () => {
      const sendCurrencyValue = formData.sendCurrency?.value;
      const receiveCurrencyValue = formData.receiveCurrency?.value;

      if (!sendCurrencyValue || !receiveCurrencyValue) {
        if (isMounted) {
          setExchangeRateLoading(false);
        }
        return;
      }

      if (isTyping.current || isManualUpdate.current) {
        if (isMounted) {
          setExchangeRateLoading(false);
        }
        return;
      }

      if (isRequestInProgress.current) {
        console.log("⏳ Request already in progress, skipping duplicate");
        return;
      }

      const now = Date.now();
      if (now - lastApiCallTime.current < 1500) {
        console.log("⏱️ Rate limiting: Too soon since last call");
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
        console.log("💾 Using cached exchange rate");
        if (isMounted) {
          setExchangeRateData(cachedData.data);
          setExchangeRateLoading(false);

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

      if (isMounted) {
        setExchangeRateLoading(true);
        setExchangeRateError(null);
      }

      try {
        const response = await dispatch(fetchExchangeRate(payload)).unwrap();
        if (isMounted && response) {
          isManualUpdate.current = true;

          // ✅ FIX: Use fxRate directly from response if available
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

          // Debug log to check values
          console.log("🔄 Exchange rate data received:", {
            fxRate: fxRate,
            converted_value: response.converted_value,
            sendAmount: formData.sendAmount,
            calculatedReceive: fxRate
              ? (parseFloat(formData.sendAmount || 5) * fxRate).toFixed(2)
              : "N/A",
          });

          // Cache the result
          exchangeRateCache.current[cacheKey] = {
            data: exchangeData,
            timestamp: Date.now(),
          };

          setExchangeRateData(exchangeData);

          // If user entered receive amount, calculate the corresponding send amount
          if (activeInput.current === "receive" && formData.receiveAmount) {
            const receiveNum = parseFloat(formData.receiveAmount);
            if (!isNaN(receiveNum) && receiveNum > 0) {
              const calculatedSendAmount = roundToDecimals(
                receiveNum / fxRate,
                2,
              );

              // Enforce minimum amount
              if (calculatedSendAmount < 5) {
                toast.warning(
                  `Minimum amount is ${
                    formData.sendCurrency?.value || "USD"
                  } 5.00. Adjusting...`,
                  { position: "top-center", autoClose: 3000 },
                );
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

          setExchangeRateError(null);
          setExchangeRateLoading(false);
          toast.success("Exchange rate updated", {
            position: "top-right",
            autoClose: 2000,
          });
        } else if (isMounted) {
          setExchangeRateError("Unable to fetch exchange rate");
          setExchangeRateData(null);
          setExchangeRateLoading(false);
          toast.error("Failed to fetch exchange rate", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      } catch (error) {
        if (isMounted) {
          setExchangeRateError("Unable to fetch exchange rate");
          setExchangeRateData(null);
          setExchangeRateLoading(false);
          toast.error("Failed to fetch exchange rate", {
            position: "top-right",
            autoClose: 3000,
          });
        }
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
  ]);

  useEffect(() => {
    // Check if all initial APIs have loaded (success or failure)
    if (!initialLoading && !loading) {
      console.log("✅ All initial APIs loaded, checking for exchange rate...");

      // Check if we have currencies selected but no exchange rate data
      if (
        formData.sendCurrency?.value &&
        formData.receiveCurrency?.value &&
        !exchangeRateData?.fxRate &&
        !exchangeRateLoading &&
        !isRequestInProgress.current &&
        !isTyping.current
      ) {
        console.log("🔄 Auto-triggering exchange rate fetch...");

        // Small delay to ensure UI is ready
        const timer = setTimeout(() => {
          // Clear cache for this currency pair to force fresh fetch
          const cacheKey = `${formData.sendCurrency?.value}-${
            formData.receiveCurrency?.value
          }-${parseFloat(formData.sendAmount) || 5}`;

          if (exchangeRateCache.current[cacheKey]) {
            delete exchangeRateCache.current[cacheKey];
            console.log("🗑️ Cleared cached exchange rate for fresh fetch");
          }

          // Trigger manual fetch
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
    exchangeRateLoading,
    formData.sendAmount,
  ]);

  // 2. Auto-calculate receive amount when exchange rate loads
  useEffect(() => {
    if (
      exchangeRateData?.fxRate &&
      formData.sendAmount &&
      parseFloat(formData.sendAmount) >= 5 &&
      !isManualUpdate.current &&
      !isTyping.current
    ) {
      console.log("🔄 Auto-calculating receive amount based on exchange rate");

      const sendNum = parseFloat(formData.sendAmount);
      if (!isNaN(sendNum) && sendNum >= 5) {
        const calculatedReceiveAmount = roundToDecimals(
          sendNum * exchangeRateData.fxRate,
          2,
        );

        const currentReceive = parseFloat(formData.receiveAmount || 0);
        if (Math.abs(calculatedReceiveAmount - currentReceive) > 0.01) {
          console.log("💰 Setting receive amount:", calculatedReceiveAmount);
          dispatch(setReceiveAmount(calculatedReceiveAmount.toString()));
        }
      }
    }
  }, [
    exchangeRateData?.fxRate,
    formData.sendAmount,
    formData.receiveAmount,
    dispatch,
  ]);

  // 3. Clean up timeout on unmount (This already exists - keep it here)
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  // ✅ FIXED: Calculate receive amount when send amount changes
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
      setExchangeRateLoading(false);
      isRequestInProgress.current = false;
      isTyping.current = false;
      isManualUpdate.current = false;
    };
  }, [formData.sendCurrency?.value, formData.receiveCurrency?.value]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

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
              toast.error("Bank details unavailable", {
                position: "top-right",
                autoClose: 3000,
              });
            } else if (result && Object.keys(result).length > 0) {
              setManualAccountError(null);
              toast.success("Bank details loaded", {
                position: "top-right",
                autoClose: 2000,
              });
            } else {
              setManualAccountError("Bank details unavailable");
              toast.error("Bank details unavailable", {
                position: "top-right",
                autoClose: 3000,
              });
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
            toast.error(errorMessage, {
              position: "top-right",
              autoClose: 3000,
            });
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
    console.log(
      "🔄 Remittance - Current paymentMethod:",
      formData.paymentMethod,
    );
    console.log("🔄 Remittance - Full formData:", formData);
  }, [formData.paymentMethod, formData]);

  const formatAmountInput = (value) => {
    if (value === "" || value === null || value === undefined) return "";

    // Remove everything except digits and decimal point
    let cleaned = value.replace(/[^\d.]/g, "");

    // Handle multiple decimal points - keep only first
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    return cleaned;
  };

  const fetchExchangeRateManual = useCallback(async () => {
    if (!formData.sendCurrency || !formData.receiveCurrency) {
      setExchangeRateLoading(false);
      toast.error("Please select both currencies", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const cacheKey = `${formData.sendCurrency.value}-${
      formData.receiveCurrency.value
    }-${parseFloat(formData.sendAmount) || 5}`;
    delete exchangeRateCache.current[cacheKey];

    setExchangeRateLoading(true);
    setExchangeRateError(null);

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

        // Cache the result
        exchangeRateCache.current[cacheKey] = {
          data: exchangeData,
          timestamp: Date.now(),
        };

        setExchangeRateData(exchangeData);

        // ✅ CRITICAL: Auto-calculate receive amount here
        if (formData.sendAmount && parseFloat(formData.sendAmount) >= 5) {
          const sendNum = parseFloat(formData.sendAmount);
          const calculatedReceiveAmount = roundToDecimals(sendNum * fxRate, 2);

          console.log(
            "📊 Auto-calculated receive amount:",
            calculatedReceiveAmount,
          );
          dispatch(setReceiveAmount(calculatedReceiveAmount.toString()));
        }

        setExchangeRateLoading(false);
        toast.success("Exchange rate refreshed and amount calculated", {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        setExchangeRateLoading(false);
        toast.error("No exchange rate data received", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      setExchangeRateError("Unable to fetch exchange rate");
      setExchangeRateData(null);
      setExchangeRateLoading(false);
      toast.error("Failed to fetch exchange rate", {
        position: "top-right",
        autoClose: 3000,
      });
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
      console.log("🔍 handleSendAmountChange called:", {
        inputValue: value,
        currentState: formData.sendAmount,
        isEqual: value === formData.sendAmount,
      });

      // Clear any pending auto-set timeout
      if (window.autoSetTimeout) {
        clearTimeout(window.autoSetTimeout);
        delete window.autoSetTimeout;
      }

      // Allow complete deletion - set empty string immediately
      if (value === "") {
        console.log("✅ Setting empty string");
        dispatch(setSendAmount(""));
        activeInput.current = "send";

        // Clear receive amount when send is empty
        dispatch(setReceiveAmount(""));

        // Clear typing timeout
        if (typingTimeout.current) {
          clearTimeout(typingTimeout.current);
        }

        isTyping.current = true;
        typingTimeout.current = setTimeout(() => {
          isTyping.current = false;
        }, 600);
        return;
      }

      // Only allow numbers and one decimal point
      const cleaned = value.replace(/[^0-9.]/g, "");

      // Handle multiple decimal points - keep only first
      const parts = cleaned.split(".");
      const formattedValue =
        parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;

      // Prevent updating with invalid value (like just a dot)
      if (formattedValue === "." || formattedValue === "") {
        console.log("⚠️ Invalid value, not updating");
        return;
      }

      // Always update if different from current value (including empty)
      if (formattedValue !== formData.sendAmount) {
        console.log(
          "✅ Updating state from",
          formData.sendAmount,
          "to",
          formattedValue,
        );
        dispatch(setSendAmount(formattedValue));
      } else {
        console.log("⏭️ Same value, skipping update");
        return;
      }

      activeInput.current = "send";

      // Clear timeout and set typing state
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      isTyping.current = true;
      typingTimeout.current = setTimeout(() => {
        isTyping.current = false;

        // Calculate receive amount after typing stops
        const sendNum = parseFloat(formattedValue);
        if (!isNaN(sendNum) && sendNum > 0 && exchangeRateData?.fxRate) {
          const calculatedReceive = roundToDecimals(
            sendNum * exchangeRateData.fxRate,
            2,
          );
          console.log("💰 Calculated receive amount:", calculatedReceive);
          dispatch(setReceiveAmount(calculatedReceive.toString()));
        }
      }, 600);
    },
    [dispatch, formData.sendAmount, exchangeRateData],
  );

  const handleReceiveAmountChange = useCallback(
    (rawValue) => {
      // Allow complete deletion
      if (rawValue === "") {
        dispatch(setReceiveAmount(""));
        dispatch(setSendAmount(""));
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

          // Validate minimum amount
          if (calculatedSend < 5) {
            toast.warning(
              `Minimum send amount is ${formData.sendCurrency?.value || "USD"} 5.00`,
              { position: "top-center", autoClose: 3000 },
            );

            // Set minimum values
            const minSend = 5;
            const minReceive = roundToDecimals(
              minSend * exchangeRateData.fxRate,
              2,
            );

            dispatch(setSendAmount(minSend.toString()));
            dispatch(setReceiveAmount(minReceive.toString()));
          } else {
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
      setExchangeRateData(null);
      setExchangeRateError(null);
      setShowRecipientDetails(false);

      Object.keys(exchangeRateCache.current).forEach((key) => {
        if (key.startsWith(option?.value)) {
          delete exchangeRateCache.current[key];
        }
      });

      if (!formData.sendAmount || parseFloat(formData.sendAmount) < 5) {
        dispatch(setSendAmount("5"));
      }

      dispatch(setReceiveAmount(""));
    },
    [dispatch, formData.sendAmount],
  );

  const handleReceiveCurrencyChange = useCallback(
    (option) => {
      dispatch(setReceiveCurrency(option));
      activeInput.current = "receive";
      setExchangeRateData(null);
      setExchangeRateError(null);
      setShowRecipientDetails(false);

      Object.keys(exchangeRateCache.current).forEach((key) => {
        if (key.includes(`-${option?.value}-`)) {
          delete exchangeRateCache.current[key];
        }
      });

      if (!formData.sendAmount || parseFloat(formData.sendAmount) < 5) {
        dispatch(setSendAmount("5"));
      }

      dispatch(setReceiveAmount(""));
    },
    [dispatch, formData.sendAmount],
  );

  const handlePaymentMethodChange = useCallback(
    (method) => {
      dispatch(setPaymentMethod(method));

      toast.info(
        `Payment method changed to ${
          method === "bank" ? "Bank Transfer" : "Cash Deposit"
        }`,
        {
          position: "top-right",
          autoClose: 2000,
        },
      );
    },
    [dispatch],
  );

  const handleFieldChange = useCallback(
    (field, value) => {
      dispatch(setFormField({ field, value }));
    },
    [dispatch],
  );

  const handleFileUpload = useCallback(
    (file) => {
      if (!file) return;

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Only JPG, PNG, and PDF files are allowed", {
          position: "top-right",
          autoClose: 3000,
        });
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

      toast.success("File uploaded successfully", {
        position: "top-right",
        autoClose: 2000,
      });
    },
    [dispatch],
  );

  const handleBeneficiarySelect = useCallback(
    (beneficiary) => {
      dispatch(setSelectedBeneficiary(beneficiary));
      if (beneficiary?.id) {
        dispatch(fetchBeneficiaryBanks(beneficiary.id));
      }
      toast.success(`Beneficiary ${beneficiary?.name} selected`, {
        position: "top-right",
        autoClose: 2000,
      });
    },
    [dispatch],
  );

  const handleBankSelect = useCallback(
    (bank) => {
      dispatch(setSelectedBank(bank));
      toast.success(`Bank ${bank?.bank_name} selected`, {
        position: "top-right",
        autoClose: 2000,
      });
    },
    [dispatch],
  );

  const handleBankAccountSelect = useCallback(
    (account) => {
      dispatch(setSelectedBankAccount(account));
      toast.success(`Selected ${account?.account_name || "bank account"}`, {
        position: "top-right",
        autoClose: 2000,
      });
    },
    [dispatch],
  );

  const handleBeneficiaryCodeLookup = useCallback(async () => {
    if (!beneficiaryCode.trim()) {
      toast.error("Please enter a beneficiary code", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsLoadingCode(true);
    try {
      const result = await dispatch(
        fetchBeneficiaryByCode(beneficiaryCode),
      ).unwrap();
      if (result.data) {
        handleBeneficiarySelect(result.data);
        toast.success("Beneficiary found", {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        toast.error("Beneficiary not found", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching beneficiary:", error);
      toast.error("Error finding beneficiary", {
        position: "top-right",
        autoClose: 3000,
      });
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
    console.log("🚀 User clicked Open Banking button!");
    if (!formData.agreeToTerms) {
      toast.error("Please agree to terms first!");
      return;
    }
    if (!selectedBeneficiary) {
      toast.error("Please select a beneficiary!");
      return;
    }
    if (!selectedBank) {
      toast.error("Please select a bank!");
      return;
    }
    if (!formData.sendAmount || parseFloat(formData.sendAmount) <= 0) {
      toast.error("Please enter an amount!");
      return;
    }
    setOpenBankingProcessing(true);
    setShowOpenBanking(true);
    console.log("✅ Everything is ready for Open Banking!");
  }, [
    formData.agreeToTerms,
    selectedBeneficiary,
    selectedBank,
    formData.sendAmount,
  ]);

  const handleOpenBankingClose = useCallback(() => {
    setShowOpenBanking(false);
    setOpenBankingProcessing(false);
    toast.info("Open Banking cancelled", {
      position: "top-right",
      autoClose: 2000,
    });
  }, []);

  const handleOpenBankingSuccess = useCallback(
    (result) => {
      console.log("🎉 Open Banking payment worked!", result);
      setShowOpenBanking(false);
      setOpenBankingProcessing(false);
      toast.success("Open Banking payment started successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

      dispatch(setStep(4));
    },
    [dispatch],
  );

  const handleSubmitTransaction = useCallback(() => {
    const transactionData = {
      from_currency: formData.sendCurrency?.value,
      to_currency: formData.receiveCurrency?.value,

      ...(selectedSilaBankAccount && formData.paymentMethod === "bank"
        ? {
            sila_account_id: selectedSilaBankAccount.id,
            sila_payment_instrument_id:
              selectedSilaBankAccount.payment_instrument_id,
            sila_account_name: selectedSilaBankAccount.account_name,
            sila_routing_number: selectedSilaBankAccount.routing_number,
          }
        : {}),

      send_amount: parseFloat(formData.sendAmount),
      receive_amount: parseFloat(formData.receiveAmount),
      exchange_rate: exchangeRateData?.fxRate || formData.exchangeRate || 0,

      customer_id: parseInt(customerId),

      payment_method: formData.paymentMethod,
      conversion_id: exchangeRateData?.conversion_id,

      beneficiary: selectedBeneficiary?.id?.toString(),
      beneficiary_bank_id: selectedBank?.id,

      beneficiary_name: selectedBeneficiary?.name,
      beneficiary_bank_name: selectedBank?.bank_name,
      beneficiary_account_number:
        selectedBank?.account_number || selectedBank?.bank_acc_no,

      is_remit: "Y",

      purpose: formData.purpose?.value || formData.purpose,
      income_source: formData.incomeSource?.value || formData.incomeSource,
      occupation: formData.occupation || "",
      relation: formData.relation?.value || formData.relation || "",
      payout_method: formData.payout_method?.value || formData.paymentMethod,

      document: formData.document,
      agree_to_terms: formData.agreeToTerms ? "1" : "0",

      rails: "Local",
    };

    const cleanData = {};
    Object.keys(transactionData).forEach((key) => {
      if (transactionData[key] !== null && transactionData[key] !== undefined) {
        cleanData[key] = transactionData[key];
      }
    });

    console.log("📤 Sending transaction data:", cleanData);

    const required = [
      "from_currency",
      "to_currency",
      "beneficiary",
      "beneficiary_bank_id",
    ];
    const missing = required.filter((field) => !cleanData[field]);

    if (missing.length > 0) {
      toast.error(`Missing required fields: ${missing.join(", ")}`, {
        position: "top-center",
        autoClose: 5000,
      });
      return;
    }

    dispatch(submitTransaction(cleanData));
  }, [
    customerId,
    formData,
    exchangeRateData,
    selectedBeneficiary,
    selectedBank,
    dispatch,
    selectedSilaBankAccount,
    formData.paymentMethod,
    formData.purpose,
    formData.incomeSource,
    formData.occupation,
    formData.relation,
    formData.payout_method,
    formData.document,
    formData.agreeToTerms,
  ]);

  const handleNextStep = useCallback(() => {
    if (step === 1) {
      const sendNum = parseFloat(formData.sendAmount || 0);
      if (isNaN(sendNum) || sendNum < 5) {
        toast.error(
          `Minimum transfer amount is ${
            formData.sendCurrency?.value || "USD"
          } 5.00`,
          {
            position: "top-center",
            autoClose: 5000,
          },
        );
        return;
      }

      if (!formData.sendCurrency || !formData.receiveCurrency) {
        toast.error("Please select both currencies", {
          position: "top-center",
          autoClose: 5000,
        });
        return;
      }

      if (!exchangeRateData?.fxRate) {
        toast.error(
          "Exchange rate is not available. Please check your currency selection.",
          {
            position: "top-center",
            autoClose: 5000,
          },
        );
        return;
      }

      if (formData.paymentMethod === "manual") {
        if (!manualAccountDetails || manualAccountError) {
          let errorMessage = "Bank details are not available for cash deposit.";
          toast.error(
            `${errorMessage} Please choose a different payment method or currency.`,
            {
              position: "top-center",
              autoClose: 5000,
            },
          );
          return;
        }
      }

      dispatch(setStep(2));
      toast.success("Moving to recipient details", {
        position: "top-right",
        autoClose: 2000,
      });
    } else if (step === 2) {
      if (!selectedBeneficiary) {
        toast.error("Please select a beneficiary", {
          position: "top-center",
          autoClose: 5000,
        });
        return;
      }

      if (!formData.purpose || !formData.incomeSource) {
        toast.error("Please fill in purpose and income source", {
          position: "top-center",
          autoClose: 5000,
        });
        return;
      }

      if (formData.paymentMethod === "manual") {
        if (!formData.document) {
          toast.error("Please upload payment proof for cash deposit", {
            position: "top-center",
            autoClose: 5000,
          });
          return;
        }
      }

      if (formData.paymentMethod === "bank") {
        if (formData.sendCurrency?.value === "USD") {
          if (!hasSilaAccounts) {
            toast.error(
              "No linked bank accounts found. Please link a bank account to proceed with USD transfers.",
              {
                position: "top-center",
                autoClose: 5000,
              },
            );
            return;
          }

          if (!selectedSilaBankAccount) {
            toast.error("Please select your bank account for USD transfers", {
              position: "top-center",
              autoClose: 5000,
            });
            return;
          }

          if (!selectedSilaBankAccount.web_debit_verified) {
            toast.error(
              "Selected bank account needs verification. Please select a verified account or verify this account first.",
              {
                position: "top-center",
                autoClose: 5000,
              },
            );
            return;
          }
        }

        if (!selectedBank) {
          toast.error("Please select a bank account for the beneficiary", {
            position: "top-center",
            autoClose: 5000,
          });
          return;
        }
      }

      dispatch(setStep(3));
      toast.success("Moving to review and confirm", {
        position: "top-right",
        autoClose: 2000,
      });
    } else if (step === 3) {
      if (!formData.agreeToTerms) {
        toast.error("Please agree to the terms and conditions", {
          position: "top-center",
          autoClose: 5000,
        });
        return;
      }

      if (
        formData.paymentMethod === "bank" &&
        formData.sendCurrency?.value === "USD" &&
        !selectedSilaBankAccount
      ) {
        toast.error("Bank account selection is required for USD transfers", {
          position: "top-center",
          autoClose: 5000,
        });
        return;
      }

      if (
        formData.paymentMethod === "bank" &&
        isOpenBankingAvailable() &&
        formData.sendCurrency?.value !== "USD"
      ) {
        handleInitiateOpenBanking();
      } else {
        handleSubmitTransaction();
      }
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
    dispatch,
    handleInitiateOpenBanking,
    handleSubmitTransaction,
    isOpenBankingAvailable,
  ]);

  const handlePreviousStep = useCallback(() => {
    if (step > 1) {
      dispatch(setStep(step - 1));
      toast.info("Returning to previous step", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  }, [step, dispatch]);

  const handleReset = useCallback(() => {
    dispatch(resetForm());
    dispatch(setSelectedBankAccount(null));
    toast.success("Form reset successfully", {
      position: "top-right",
      autoClose: 2000,
    });
  }, [dispatch]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
    toast.info("Transfer cancelled", {
      position: "top-right",
      autoClose: 2000,
    });
  }, [navigate]);

  // In your component:
  const handleDownloadReceipt = useCallback(() => {
    if (!transactionResult) {
      toast.error("No transaction result available", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      console.log("Downloading receipt", transactionResult);

      // Create PDF document
      const doc = new jsPDF();

      // Add company logo/header
      doc.setFillColor(37, 99, 235); // Blue color
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Transfer Receipt", 15, 25);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Transaction completed successfully", 15, 35);

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Transaction ID
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

      // Transfer Details Table
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

      // ✅ FIX: Use imported autoTable function
      autoTable(doc, {
        startY: 105,
        head: [["Description", "Amount"]],
        body: transferData,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 10 },
        margin: { left: 15, right: 15 },
      });

      // Recipient Information
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

      // ✅ FIX: Use imported autoTable function
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

      // Footer
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
        "For any inquiries, please contact our support team",
        15,
        pageHeight - 15,
      );
      doc.text(
        `© ${new Date().getFullYear()} Your Company Name. All rights reserved.`,
        15,
        pageHeight - 10,
      );

      // Save the PDF
      doc.save(
        `receipt_${transactionResult.transaction_id || transactionResult.id || "transaction"}.pdf`,
      );

      toast.success("Receipt downloaded successfully", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  }, [
    transactionResult,
    formData,
    selectedBeneficiary,
    selectedBank,
    exchangeRateData,
  ]);

  const selectStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: "52px",
        borderRadius: "10px",
        borderColor: state.isFocused ? "#2563eb" : "#e5e7eb",
        borderWidth: "1px",
        fontSize: "0.95rem",
        backgroundColor: "#ffffff",
        boxShadow: state.isFocused
          ? "0 0 0 3px rgba(37, 99, 235, 0.1)"
          : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "&:hover": { borderColor: "#2563eb" },
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }),
      option: (base, { isSelected, isFocused }) => ({
        ...base,
        fontSize: "0.95rem",
        padding: "12px 16px",
        backgroundColor: isSelected
          ? "#eff6ff"
          : isFocused
            ? "#f8fafc"
            : "white",
        color: isSelected ? "#1e40af" : "#374151",
        fontWeight: isSelected ? "600" : "500",
        "&:hover": {
          backgroundColor: "#f8fafc",
        },
        transition: "all 0.2s ease",
      }),
      menu: (base) => ({
        ...base,
        borderRadius: "10px",
        fontSize: "0.95rem",
        border: "1px solid #e5e7eb",
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        zIndex: 9999,
      }),
      placeholder: (base) => ({
        ...base,
        color: "#9ca3af",
        fontWeight: "500",
      }),
      singleValue: (base) => ({
        ...base,
        color: "#1f2937",
        fontWeight: "600",
      }),
      dropdownIndicator: (base) => ({
        ...base,
        color: "#6b7280",
        padding: "8px",
        "&:hover": {
          color: "#374151",
        },
      }),
      indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: "#e5e7eb",
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative flex justify-center">
            <RingLoader color="#2563eb" size={60} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">
              Initializing Transfer System
            </p>
            <p className="text-sm text-gray-600 max-w-sm">
              Loading your accounts and available currencies...
            </p>
            <div className="pt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full animate-pulse"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalToPay = parseFloat(formData.sendAmount || 0);
  const fee = 0;

  // Professional Progress Steps
  const ProgressSteps = () => {
    const steps = [
      { number: 1, label: "Transfer Details", icon: <TbTransfer /> },
      { number: 2, label: "Recipient", icon: <FaUser /> },
      { number: 3, label: "Review", icon: <MdSecurity /> },
      { number: 4, label: "Confirmation", icon: <FiCheck /> },
    ];

    return (
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>
          <div
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400 -translate-y-1/2 transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>

          {steps.map((stepItem, index) => (
            <div key={stepItem.number} className="relative z-10">
              <div
                className={`flex flex-col items-center transition-all duration-300 ${
                  step >= stepItem.number ? "scale-105" : ""
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 shadow-lg ${
                    step > stepItem.number
                      ? "bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-green-200"
                      : step === stepItem.number
                        ? "bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-blue-200"
                        : "bg-white text-gray-400 border-2 border-gray-300 shadow-sm"
                  }`}
                >
                  {step > stepItem.number ? (
                    <FiCheck className="w-6 h-6" />
                  ) : (
                    <span className="flex items-center justify-center">
                      {step === stepItem.number
                        ? stepItem.icon
                        : stepItem.number}
                    </span>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <span
                    className={`text-sm font-semibold ${
                      step >= stepItem.number
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {stepItem.label}
                  </span>
                  {step === stepItem.number && (
                    <div className="mt-1">
                      <div className="h-1 w-8 bg-blue-500 rounded-full mx-auto"></div>
                    </div>
                  )}
                </div>
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
          />
        );
      case "bank":
        return (
          <BankTransfer
            formData={formData}
            selectedBeneficiary={selectedBeneficiary}
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
            onFileUpload={handleFileUpload}
            selectedCurrency={formData.sendCurrency?.value}
            silaBankAccounts={silaBankAccounts}
            hasSilaAccounts={hasSilaAccounts}
            silaAccountsLoading={silaAccountsLoading}
            silaAccountsError={silaAccountsError}
            selectedBankAccount={selectedSilaBankAccount}
            onBankAccountSelect={handleBankAccountSelect}
          />
        );
      // case "card":
      //   return (
      //     <CardPayment formData={formData} onFieldChange={handleFieldChange} />
      //   );
      default:
        return null;
    }
  };

  // Render step based on current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Transfer Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      International Transfer 2
                    </h2>
                    <p className="text-blue-100 mt-1">
                      Send money securely worldwide
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <FaGlobe className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Send Amount */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          You Send
                        </h3>
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full self-start sm:self-auto">
                          Your Account
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.sendAmount || ""}
                          onChange={(e) =>
                            handleSendAmountChange(e.target.value)
                          }
                          onFocus={() => {
                            activeInput.current = "send";
                          }}
                          placeholder="0.00"
                          className="w-full pl-6 pr-28 sm:pr-40 py-5 text-2xl sm:text-3xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200"
                          inputMode="decimal"
                          autoComplete="off"
                        />
                        {/* Currency Dropdown - Positioned absolutely on desktop, but moved to below input on mobile */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:block">
                          <div className="w-32 sm:w-36">
                            <Select
                              options={sendCurrencyOptions}
                              value={formData.sendCurrency}
                              onChange={handleSendCurrencyChange}
                              placeholder="Currency"
                              styles={selectStyles}
                              isSearchable
                              className="text-sm"
                              classNamePrefix="select"
                              formatOptionLabel={({ label, balance }) => (
                                <div className="flex justify-between items-center truncate">
                                  <span className="truncate">
                                    {label.split(" - ")[0]}
                                  </span>
                                  {balance && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      ${parseFloat(balance).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mobile Currency Dropdown - Shows below input on small screens */}
                      <div className="mt-4 sm:hidden">
                        <div className="w-full">
                          <Select
                            options={sendCurrencyOptions}
                            value={formData.sendCurrency}
                            onChange={handleSendCurrencyChange}
                            placeholder="Select Currency"
                            styles={{
                              ...selectStyles,
                              control: (base) => ({
                                ...base,
                                minHeight: "44px",
                                borderRadius: "8px",
                              }),
                            }}
                            isSearchable
                            className="text-sm"
                            classNamePrefix="select"
                            formatOptionLabel={({ label, balance }) => (
                              <div className="flex justify-between items-center truncate">
                                <span className="truncate">
                                  {label.split(" - ")[0]}
                                </span>
                                {balance && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    ${parseFloat(balance).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}
                          />
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span>
                          Minimum: {formData.sendCurrency?.value || "USD"} 5.00
                        </span>
                        {formData.sendCurrency?.balance && (
                          <span className="text-emerald-600 font-medium">
                            Available: {formData.sendCurrency?.value}{" "}
                            {parseFloat(formData.sendCurrency.balance).toFixed(
                              2,
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FaLock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Secure Transfer
                          </p>
                          <p className="text-xs text-gray-600">
                            Bank-level encryption & PCI DSS compliant
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Receive Amount */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Recipient Receives
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            Estimated
                          </span>
                          {exchangeRateData?.fxRate &&
                            formData.receiveAmount && (
                              <span className="text-xs text-gray-500">
                                • Real-time
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={formData.receiveAmount || ""}
                          onChange={(e) => {
                            activeInput.current = "receive";
                            handleReceiveAmountChange(e.target.value);
                          }}
                          onFocus={() => {
                            activeInput.current = "receive";
                            setShowRecipientDetails(true);
                          }}
                          onBlur={(e) => {
                            if (!formData.receiveAmount) {
                              setShowRecipientDetails(false);
                            }

                            const receiveNumValue = parseFloat(e.target.value);
                            if (
                              !isNaN(receiveNumValue) &&
                              exchangeRateData?.fxRate
                            ) {
                              const calculatedSendAmount =
                                receiveNumValue / exchangeRateData.fxRate;

                              if (calculatedSendAmount < 5) {
                                const minSendAmount = 5;
                                const adjustedReceiveAmount = roundToDecimals(
                                  minSendAmount * exchangeRateData.fxRate,
                                  2,
                                );

                                toast.info(
                                  `Amount adjusted to minimum equivalent of ${
                                    formData.sendCurrency?.value || "USD"
                                  } 5.00`,
                                  { position: "top-center", autoClose: 2000 },
                                );

                                dispatch(
                                  setSendAmount(minSendAmount.toString()),
                                );
                                dispatch(
                                  setReceiveAmount(
                                    adjustedReceiveAmount.toString(),
                                  ),
                                );
                              }
                            }
                          }}
                          placeholder="0.00"
                          className={`w-full pl-6 pr-28 sm:pr-40 py-5 text-2xl sm:text-3xl font-bold rounded-xl focus:outline-none transition-all duration-200 ${
                            exchangeRateError
                              ? "bg-red-50 border-2 border-red-200 text-red-900 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                              : exchangeRateLoading
                                ? "bg-gray-100 border-2 border-gray-200 text-gray-900"
                                : "bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 text-emerald-900 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                          }`}
                          inputMode="decimal"
                          autoComplete="off"
                        />

                        {/* Desktop Currency Dropdown */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:block">
                          <div className="w-32 sm:w-36">
                            <Select
                              options={receiveCurrencyOptions}
                              value={formData.receiveCurrency}
                              onChange={handleReceiveCurrencyChange}
                              placeholder="Currency"
                              styles={{
                                ...selectStyles,
                                control: (base, state) => ({
                                  ...base,
                                  minHeight: "52px",
                                  borderRadius: "10px",
                                  borderColor: state.isFocused
                                    ? "#10b981"
                                    : "#e5e7eb",
                                  borderWidth: "1px",
                                  backgroundColor: exchangeRateLoading
                                    ? "#f9fafb"
                                    : "#ffffff",
                                  boxShadow: state.isFocused
                                    ? "0 0 0 3px rgba(16, 185, 129, 0.1)"
                                    : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                  "&:hover": { borderColor: "#10b981" },
                                }),
                              }}
                              isSearchable
                              className="text-sm"
                              classNamePrefix="select"
                              isLoading={exchangeRateLoading}
                            />
                          </div>
                        </div>

                        {/* Loading Indicator - Adjusted for mobile */}
                        {exchangeRateLoading ? (
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            <RingLoader color="#10b981" size={16} />
                            <span className="text-xs text-emerald-600 font-medium hidden sm:block">
                              Updating rate...
                            </span>
                          </div>
                        ) : (
                          exchangeRateData?.fxRate && (
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              {/* Exchange icon hidden on mobile for more space */}
                            </div>
                          )
                        )}
                      </div>

                      {/* Mobile Currency Dropdown */}
                      <div className="mt-4 sm:hidden">
                        <div className="w-full">
                          <Select
                            options={receiveCurrencyOptions}
                            value={formData.receiveCurrency}
                            onChange={handleReceiveCurrencyChange}
                            placeholder="Select Currency"
                            styles={{
                              ...selectStyles,
                              control: (base, state) => ({
                                ...base,
                                minHeight: "44px",
                                borderRadius: "8px",
                                borderColor: state.isFocused
                                  ? "#10b981"
                                  : "#e5e7eb",
                                borderWidth: "1px",
                                backgroundColor: exchangeRateLoading
                                  ? "#f9fafb"
                                  : "#ffffff",
                                "&:hover": { borderColor: "#10b981" },
                              }),
                            }}
                            isSearchable
                            className="text-sm"
                            classNamePrefix="select"
                            isLoading={exchangeRateLoading}
                          />
                        </div>
                      </div>

                      {/* Exchange rate info */}
                      {exchangeRateData?.fxRate && (
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            onClick={fetchExchangeRateManual}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            disabled={exchangeRateLoading}
                          >
                            <FaSpinner
                              className={`w-3 h-3 ${
                                exchangeRateLoading ? "animate-spin" : ""
                              }`}
                            />
                            Refresh Rate
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Collapsible details section */}
                    <AnimatePresence>
                      {exchangeRateData?.fxRate && (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                  <FaExchangeAlt className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Exchange Rate
                                  </p>
                                  <p className="text-xs text-gray-600 break-words">
                                    1 {formData.sendCurrency?.value} ={" "}
                                    {exchangeRateData.fxRate.toFixed(6)}{" "}
                                    {formData.receiveCurrency?.value}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-0 sm:ml-auto">
                                <FaClock className="text-emerald-500 text-xs" />
                                <p className="text-xs text-emerald-600 font-medium">
                                  Live rate
                                </p>
                              </div>
                            </div>

                            {exchangeRateData.conversion_id && (
                              <div className="mt-3 pt-3 border-t border-emerald-200">
                                <p className="text-xs text-gray-600 break-words">
                                  <span className="font-medium">Rate ID:</span>{" "}
                                  <span className="font-mono">
                                    {exchangeRateData.conversion_id}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Error message */}
                    {exchangeRateError && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FaExclamationTriangle className="w-4 h-4 text-red-500" />
                          <p className="text-sm font-medium text-red-600">
                            {exchangeRateError}
                          </p>
                        </div>
                        <button
                          onClick={fetchExchangeRateManual}
                          className="mt-1 text-xs text-red-700 hover:text-red-900 font-medium flex items-center gap-1"
                        >
                          <FaSpinner className="w-3 h-3" />
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method Section */}
                <div className="mt-10 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Payment Method
                      </h3>
                      <p className="text-gray-600 mt-1">
                        Choose how you'd like to fund this transfer
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <FaShieldAlt className="w-5 h-5" />
                      <span className="text-sm font-semibold">
                        Secure Payment
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                    {paymentOptions.map((option) => {
                      const isSelected =
                        formData.paymentMethod === option.value;
                      return (
                        <motion.button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            handlePaymentMethodChange(option.value);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                            isSelected
                              ? `border-blue-500 shadow-lg shadow-blue-100`
                              : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                          } ${option.bgColor}`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-3 rounded-lg ${
                                isSelected
                                  ? "bg-white shadow-sm"
                                  : "bg-white/80"
                              }`}
                            >
                              {React.cloneElement(option.icon, {
                                className: `w-7 h-7 ${
                                  isSelected ? "text-blue-600" : "text-gray-600"
                                }`,
                              })}
                            </div>
                            <div className="flex-1">
                              <h4
                                className={`font-bold text-lg mb-1 ${
                                  isSelected ? "text-gray-900" : "text-gray-800"
                                }`}
                              >
                                {option.label}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3">
                                {option.description}
                              </p>
                              {isSelected && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs font-semibold text-blue-600">
                                    Selected
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Fee Summary */}
                {exchangeRateData?.fxRate && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Transfer Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="text-gray-700">Amount to send</span>
                        <span className="font-semibold text-gray-900">
                          {formData.sendCurrency?.value}{" "}
                          {parseFloat(formData.sendAmount || 0).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="text-gray-700">Transfer fee</span>
                        <span className="font-semibold text-emerald-600">
                          FREE
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-lg font-bold text-gray-900">
                          Total to pay
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          {formData.sendCurrency?.value} {totalToPay.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Enhanced Manual Deposit Section */}
            {formData.paymentMethod === "manual" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        <FaMoneyCheckAlt className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Cash Deposit Instructions
                        </h3>
                        <p className="text-emerald-100 mt-1">
                          Deposit funds at any bank branch
                        </p>
                      </div>
                    </div>
                    {manualDetailsLoading && (
                      <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <RingLoader color="#ffffff" size={16} />
                        <span className="text-sm text-white">
                          Loading details...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {manualAccountError ? (
                  <div className="p-8">
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaBuilding className="w-8 h-8 text-red-500" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        Bank Details Unavailable
                      </h4>
                      <p className="text-gray-600 max-w-md mx-auto">
                        We're unable to retrieve bank details for the selected
                        currency at this time.
                      </p>
                      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => handlePaymentMethodChange("bank")}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Switch to Bank Transfer
                        </button>
                        <button
                          onClick={() => navigate(-1)}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Go Back
                        </button>
                      </div>
                    </div>
                  </div>
                ) : manualAccountDetails ? (
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <FaUniversity className="text-emerald-600" />
                            Primary Bank Details
                          </h4>

                          {manualAccountDetails.account_number && (
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Account Number
                                </span>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      manualAccountDetails.account_number,
                                      "account_number",
                                    )
                                  }
                                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  {copiedField === "account_number" ? (
                                    <>
                                      <FaCheck className="w-3 h-3 text-emerald-500" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <FaCopy className="w-3 h-3 text-gray-500" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <p className="text-2xl font-bold text-gray-900 font-mono tracking-wider">
                                  {manualAccountDetails.account_number}
                                </p>
                              </div>
                            </div>
                          )}

                          {manualAccountDetails.account_name && (
                            <div className="mb-4">
                              <span className="text-sm font-medium text-gray-700">
                                Account Name
                              </span>
                              <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-lg font-semibold text-gray-900">
                                  {manualAccountDetails.account_name}
                                </p>
                              </div>
                            </div>
                          )}

                          {manualAccountDetails.bank_name && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                Bank Name
                              </span>
                              <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-lg font-semibold text-gray-900">
                                  {manualAccountDetails.bank_name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            setShowAdvancedDetails(!showAdvancedDetails)
                          }
                          className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              Additional Bank Information
                            </span>
                            {showAdvancedDetails ? (
                              <FaArrowUp className="w-5 h-5 text-gray-500" />
                            ) : (
                              <FaArrowDown className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FaInfoCircle className="text-blue-600" />
                            Deposit Instructions
                          </h4>
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-blue-600">
                                  1
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  Visit any branch of{" "}
                                  {manualAccountDetails.bank_name || "the bank"}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Bring your identification document
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-blue-600">
                                  2
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  Deposit the exact amount
                                </p>
                                <p className="text-lg font-bold text-emerald-600 mt-1">
                                  {formData.sendCurrency?.value}{" "}
                                  {parseFloat(formData.sendAmount || 0).toFixed(
                                    2,
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-blue-600">
                                  3
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  Keep your deposit receipt
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  You'll need it for verification in the next
                                  step
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-3">
                            Important Notes
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>
                                Deposit must be made within 24 hours of
                                initiating this transfer
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>
                                Use the exact account number provided above
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>
                                Funds will be processed within 1-2 business days
                                after deposit confirmation
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>
                                For assistance, contact our support team
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {showAdvancedDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-8 pt-8 border-t border-gray-200"
                      >
                        <h4 className="text-lg font-bold text-gray-900 mb-6">
                          Advanced Bank Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[
                            {
                              label: "Bank Code",
                              value: manualAccountDetails.bank_code,
                              icon: <FaIdCard />,
                            },
                            {
                              label: "SWIFT Code",
                              value: manualAccountDetails.swift_code,
                              icon: <FaGlobe />,
                            },
                            {
                              label: "Branch Name",
                              value: manualAccountDetails.branch_name,
                              icon: <FaBuilding />,
                            },
                            {
                              label: "Branch Code",
                              value: manualAccountDetails.branch_code,
                              icon: <FaIdCard />,
                            },
                            {
                              label: "IBAN",
                              value: manualAccountDetails.iban,
                              icon: <FaGlobe />,
                            },
                            {
                              label: "Sort Code",
                              value: manualAccountDetails.sort_code,
                              icon: <FaIdCard />,
                            },
                            {
                              label: "Routing Number",
                              value: manualAccountDetails.routing_number,
                              icon: <FaIdCard />,
                            },
                          ].map(
                            (item) =>
                              item.value && (
                                <div
                                  key={item.label}
                                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white rounded-lg">
                                      {React.cloneElement(item.icon, {
                                        className: "w-4 h-4 text-gray-600",
                                      })}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                      {item.label}
                                    </span>
                                  </div>
                                  <p className="font-mono text-gray-900 font-semibold">
                                    {item.value}
                                  </p>
                                </div>
                              ),
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUniversity className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        Enter Transfer Amount
                      </h4>
                      <p className="text-gray-600">
                        Please enter the amount you wish to send to view deposit
                        details
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Info Panel */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <FaInfoCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Need Assistance?
                  </h4>
                  <p className="text-gray-700">
                    Our support team is available 24/7 to assist you with your
                    transfer. Minimum transfer amount is{" "}
                    {formData.sendCurrency?.value || "USD"} 5.00. All transfers
                    are secured with bank-level encryption and processed through
                    regulated financial institutions.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-300">
                      Live Exchange Rates
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-300">
                      No Hidden Fees
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-300">
                      24/7 Support
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            exchangeRateData={exchangeRateData}
            onAgreeToTerms={(value) => handleFieldChange("agreeToTerms", value)}
            onSubmit={handleSubmitTransaction}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <ProgressSteps />

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

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

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <FaExclamationTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="font-semibold text-red-800">
                  Transaction Error
                </h4>
                <p className="text-red-700 mt-1">
                  {typeof error === "string"
                    ? error
                    : error?.message ||
                      "An error occurred during the transaction"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step < 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {step > 1 ? (
              <button
                onClick={handlePreviousStep}
                className="px-8 py-4 text-base border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold flex items-center justify-center gap-3 shadow-sm group"
              >
                <FaArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back
              </button>
            ) : (
              <button
                onClick={handleGoBack}
                className="px-8 py-4 text-base border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold flex items-center justify-center gap-3 shadow-sm group"
              >
                <FaArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Cancel Transfer
              </button>
            )}

            {step < 3 && (
              <button
                onClick={handleNextStep}
                disabled={
                  (step === 1 &&
                    (!formData.sendAmount ||
                      parseFloat(formData.sendAmount) < 5 ||
                      !exchangeRateData?.fxRate ||
                      (formData.paymentMethod === "manual" &&
                        (!manualAccountDetails || manualAccountError)))) ||
                  (step === 2 &&
                    (!selectedBeneficiary ||
                      !formData.purpose ||
                      !formData.incomeSource ||
                      (formData.paymentMethod === "manual" &&
                        !formData.document) ||
                      (formData.paymentMethod === "bank" &&
                        formData.sendCurrency?.value === "USD" &&
                        !selectedSilaBankAccount) ||
                      (formData.paymentMethod === "bank" && !selectedBank))) ||
                  loading ||
                  exchangeRateLoading ||
                  manualDetailsLoading ||
                  beneficiaryLoading ||
                  openBankingProcessing
                }
                className="flex-1 px-8 py-4 text-base rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed relative group"
              >
                {loading ? (
                  <>
                    <RingLoader color="#ffffff" size={18} />
                    <span>Processing...</span>
                  </>
                ) : exchangeRateLoading ? (
                  <>
                    <RingLoader color="#ffffff" size={18} />
                    <span>Updating rates...</span>
                  </>
                ) : manualDetailsLoading ? (
                  <>
                    <RingLoader color="#ffffff" size={18} />
                    <span>Loading details...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Next Step</span>
                    <FaArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}

                {parseFloat(formData.sendAmount) < 5 && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Minimum amount: {formData.sendCurrency?.value || "USD"} 5.00
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </div>
                )}
              </button>
            )}

            {step === 3 && (
              <>
                {formData.paymentMethod === "bank" &&
                isOpenBankingAvailable() ? (
                  <button
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
                    className="flex-1 px-8 py-4 text-base rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {openBankingProcessing ? (
                      <>
                        <RingLoader color="#ffffff" size={18} />
                        <span>Initializing Open Banking...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue with Open Banking</span>
                        <FaArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                ) : formData.paymentMethod === "bank" ? (
                  <button
                    onClick={handleSubmitTransaction}
                    disabled={
                      !formData.agreeToTerms || loading || openBankingProcessing
                    }
                    className="flex-1 px-8 py-4 text-base rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <>
                        <RingLoader color="#ffffff" size={18} />
                        <span>Processing Transaction...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Send Transfer</span>
                        <FaArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                ) : null}

                {formData.paymentMethod === "manual" && (
                  <button
                    onClick={handleSubmitTransaction}
                    disabled={
                      !formData.agreeToTerms || loading || openBankingProcessing
                    }
                    className="flex-1 px-8 py-4 text-base rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <>
                        <RingLoader color="#ffffff" size={18} />
                        <span>Processing Transaction...</span>
                      </>
                    ) : (
                      <>
                        <FiSend className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span>Confirm & Send Transfer</span>
                      </>
                    )}
                  </button>
                )}
                {/* 
                {formData.paymentMethod === "card" && (
                  <button
                    onClick={handleSubmitTransaction}
                    disabled={
                      !formData.agreeToTerms || loading || openBankingProcessing
                    }
                    className="flex-1 px-8 py-4 text-base rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <>
                        <RingLoader color="#ffffff" size={18} />
                        <span>Processing Transaction...</span>
                      </>
                    ) : (
                      <>
                        <FiCreditCard className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span>Confirm & Pay</span>
                      </>
                    )}
                  </button>
                )} */}
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
            console.log("Open Banking remittance success:", result);
            if (result.success) {
              toast.success(
                "Remittance initiated successfully via Open Banking!",
                {
                  position: "top-right",
                  autoClose: 3000,
                },
              );
              setShowOpenBanking(false);
              setOpenBankingProcessing(false);
              dispatch(setStep(4));
            } else {
              toast.error(result.error || "Open Banking remittance failed", {
                position: "top-right",
                autoClose: 3000,
              });
              setOpenBankingProcessing(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default Remittance;
