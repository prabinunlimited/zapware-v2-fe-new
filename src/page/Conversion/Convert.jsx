// ConversionPage.jsx - Premium Fintech UI/UX
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RingLoader } from "react-spinners";
import { usePartnerConfig } from "../../hooks/usePartnerConfig";
import { useConversion } from "./hook/useConversion";
import ConversionPopup from "../../components/PopupModal/ConversionPopup";
import ConversionPopupSuccess from "../../components/PopupModal/ConversionPopupSuccess";
import {
  ArrowRightLeft,
  RefreshCw,
  ChevronDown,
  Calculator,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Globe,
  Banknote,
  ArrowUpDown,
  Percent,
  Info,
} from "lucide-react";

const ConversionPage = () => {
  const { customerId } = useParams();
  const authtoken = localStorage.getItem("authtoken");
  const navigate = useNavigate();

  // Use the partner config hook
  const config = usePartnerConfig(authtoken);
  const headerColor =
    config?.header_color || localStorage.getItem("header_color") || "#2563eb";
  const textColor =
    config?.text_color || localStorage.getItem("text_color") || "#1e293b";

  // Use the conversion hook
  const {
    customerBankAccounts,
    convertedValue,
    fxRate,
    fxmarginRate,
    loading,
    error,
    successMessage,
    conversionForm,
    conversionId,
    lastSuccessfulConversion,
    fetchBankAccounts,
    convert,
    submit,
    updateForm,
    reset,
    resetForm,
    resetResult,
    clearAllState,
    clearConversionError,
    clearConversionSuccess,
    clearConversionId,
    clearLastConversion,
  } = useConversion();

  // Local state
  const [showPopup, setShowPopup] = useState(false);
  const [showPopupSuccess, setShowPopupSuccess] = useState(false);
  const [localErrorMessage, setLocalErrorMessage] = useState("");
  const [isPageReady, setIsPageReady] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRateDetails, setShowRateDetails] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Refs
  const amountInputRef = useRef(null);
  const conversionResultRef = useRef(null);

  // Format currency
  const formatCurrency = (amount, currencyCode = "") => {
    if (!amount) return `0.00 ${currencyCode}`;
    return (
      new Intl.NumberFormat("en-US", {
        style: currencyCode ? "currency" : "decimal",
        currency: currencyCode || "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + (currencyCode ? "" : "")
    );
  };

  // Calculate estimated fee
  const calculateFee = () => {
    if (!convertedValue || !fxmarginRate) return 0;
    const amount = parseFloat(conversionForm.amount) || 0;
    return amount * (parseFloat(fxmarginRate) / 100);
  };

  // Enhanced currency flags
  const getCurrencyDisplay = (currencyCode) => {
    const flags = {
      USD: "🇺🇸",
      EUR: "🇪🇺",
      GBP: "🇬🇧",
      JPY: "🇯🇵",
      CAD: "🇨🇦",
      AUD: "🇦🇺",
      CHF: "🇨🇭",
      CNY: "🇨🇳",
      INR: "🇮🇳",
      SGD: "🇸🇬",
      HKD: "🇭🇰",
      NZD: "🇳🇿",
      KRW: "🇰🇷",
      MXN: "🇲🇽",
      BRL: "🇧🇷",
      RUB: "🇷🇺",
      ZAR: "🇿🇦",
      AED: "🇦🇪",
      SAR: "🇸🇦",
      SEK: "🇸🇪",
      NOK: "🇳🇴",
      DKK: "🇩🇰",
      PLN: "🇵🇱",
      CZK: "🇨🇿",
      HUF: "🇭🇺",
      TRY: "🇹🇷",
      THB: "🇹🇭",
      MYR: "🇲🇾",
      PHP: "🇵🇭",
      IDR: "🇮🇩",
      VND: "🇻🇳",
    };
    return `${flags[currencyCode] || "💳"} ${currencyCode}`;
  };

  // Validation function
  const validateConversion = () => {
    const { from, to, amount } = conversionForm;
    
    if (!from || !to) {
      return "Please select both currencies";
    }
    
    if (from === to) {
      return "Cannot convert between same currencies";
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return "Please enter a valid amount greater than 0";
    }
    
    return null;
  };

  // Reset state when component mounts
  useEffect(() => {
    reset();
    if (customerId && authtoken) {
      fetchBankAccounts(customerId, authtoken);
    }
    setIsPageReady(true);
    setLastUpdateTime(new Date());

    return () => {
      reset();
    };
  }, [customerId, authtoken]);

  // Handle error state
  useEffect(() => {
    if (error) {
      setLocalErrorMessage(error);
      setShowPopup(true);
    }
  }, [error]);

  // Handle success state
  useEffect(() => {
    if (successMessage) {
      setShowPopupSuccess(true);
    }
  }, [successMessage]);

  // Animation trigger
  useEffect(() => {
    if (convertedValue) {
      setAnimationKey((prev) => prev + 1);
      if (conversionResultRef.current) {
        conversionResultRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [convertedValue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateForm({ [name]: value });

    if (name === "from" || name === "to" || name === "amount") {
      resetResult();
      setLastUpdateTime(new Date());
    }
  };

  const handleConvert = async () => {
    const validationError = validateConversion();
    if (validationError) {
      setLocalErrorMessage(validationError);
      setShowPopup(true);
      return;
    }

    const { from, to, amount } = conversionForm;
    
    setIsConverting(true);
    try {
      await convert({
        from,
        to,
        amount,
        customer_id: customerId,
        authtoken,
      });
      setLastUpdateTime(new Date());
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsConverting(false);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateConversion();
    if (validationError) {
      setLocalErrorMessage(validationError);
      setShowPopup(true);
      return;
    }

    if (!convertedValue || !fxRate) {
      setLocalErrorMessage("Please convert first to get the exchange rate");
      setShowPopup(true);
      return;
    }

    const { from, to, amount } = conversionForm;
    
    // Allow conversion between ANY accounts without restrictions
    const bank_id = customerBankAccounts.find((a) => a.currency_code === to)?.id || null;
    const sender_bank_id = customerBankAccounts.find((a) => a.currency_code === from)?.id || null;

    setIsSubmitting(true);
    try {
      await submit({
        from,
        to,
        amount,
        customer_id: customerId,
        convertedValue,
        fxRate,
        fxmarginRate,
        bank_id,
        sender_bank_id,
        authtoken,
      });
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    clearConversionError();
  };

  const handleClosePopupSuccess = () => {
    setShowPopupSuccess(false);
    clearConversionSuccess();
    clearLastConversion();
    clearConversionId();
    reset();
    navigate(`/newhomepage/${customerId}`);
  };

  const handleQuickAmount = (amount) => {
    updateForm({ amount: amount.toString() });
    if (conversionForm.from && conversionForm.to) {
      handleConvert();
    }
  };

  const swapCurrencies = () => {
    const { from, to } = conversionForm;
    if (from && to) {
      updateForm({ from: to, to: from });
      resetResult();
      setLastUpdateTime(new Date());
    }
  };

  // Show loading only on initial page load
  if (!isPageReady || (loading && !customerBankAccounts.length)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading currency converter...
          </p>
        </div>
      </div>
    );
  }

  const feeAmount = calculateFee();
  const totalAmount = (parseFloat(conversionForm.amount) || 0) + feeAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Converter */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
              {/* Loading overlay for convert operation only */}
              {isConverting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">
                      Calculating exchange rate...
                    </p>
                  </div>
                </div>
              )}

              {/* Converter Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Convert Currency
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Convert between any of your accounts instantly
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-600">
                      Secure & Regulated
                    </span>
                  </div>
                </div>
              </div>

              {/* Converter Body */}
              <div className="p-8">
                {/* Amount Input */}
                <div className="mb-8">
                  <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Banknote className="h-4 w-4 mr-2" />
                    Amount to Convert
                  </label>
                  <div className="relative">
                    <input
                      ref={amountInputRef}
                      type="number"
                      name="amount"
                      value={conversionForm.amount}
                      onChange={handleChange}
                      className="w-full px-6 py-5 text-2xl font-semibold bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {conversionForm.from && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                          <span className="text-lg font-semibold text-blue-700">
                            {getCurrencyDisplay(conversionForm.from)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="flex space-x-3 mt-4">
                    {[100, 500, 1000, 5000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleQuickAmount(amount)}
                        disabled={isConverting}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency Selectors */}
                <div className="relative mb-8">
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <button
                      onClick={swapCurrencies}
                      disabled={isConverting}
                      className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <ArrowUpDown className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* From Currency */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        From Currency
                      </label>
                      <div className="relative">
                        <select
                          name="from"
                          value={conversionForm.from}
                          onChange={handleChange}
                          disabled={isConverting}
                          className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-xl appearance-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Currency</option>
                          {customerBankAccounts.map((account) => (
                            <option key={`from-${account.id}`} value={account.currency_code}>
                              {getCurrencyDisplay(account.currency_code)} - {account.account_name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    {/* To Currency */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        To Currency
                      </label>
                      <div className="relative">
                        <select
                          name="to"
                          value={conversionForm.to}
                          onChange={handleChange}
                          disabled={isConverting}
                          className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-xl appearance-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Currency</option>
                          {/* ALL accounts available for "to" without restrictions */}
                          {customerBankAccounts.map((account) => (
                            <option key={`to-${account.id}`} value={account.currency_code}>
                              {getCurrencyDisplay(account.currency_code)} - {account.account_name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Convert Button */}
                <button
                  onClick={handleConvert}
                  disabled={
                    !conversionForm.from ||
                    !conversionForm.to ||
                    !conversionForm.amount ||
                    parseFloat(conversionForm.amount) <= 0 ||
                    isConverting
                  }
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}99 100%)`,
                  }}
                >
                  {isConverting ? (
                    <div className="flex items-center justify-center">
                      <RingLoader size={24} color="#ffffff" className="mr-3" />
                      <span>Converting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Calculator className="h-5 w-5 mr-3" />
                      <span>Calculate Exchange Rate</span>
                    </div>
                  )}
                </button>

                {/* Last Update Time */}
                {lastUpdateTime && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 flex items-center justify-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Last updated:{" "}
                      {lastUpdateTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Conversion Result - Animated Section */}
            {convertedValue && (
              <div
                ref={conversionResultRef}
                key={animationKey}
                className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-xl border border-emerald-100 overflow-hidden transform transition-all duration-500 relative"
              >
                {/* Loading overlay for submit operation */}
                {isSubmitting && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">
                        Processing conversion...
                      </p>
                    </div>
                  </div>
                )}

                <div className="px-8 py-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-500 to-emerald-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Zap className="h-6 w-6 text-white" />
                      <h3 className="text-xl font-bold text-white">
                        Conversion Ready
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                      <TrendingUp className="h-4 w-4 text-white" />
                      <span className="text-sm text-white">Live Rate</span>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {/* Amount Display */}
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-sm text-gray-500 mb-2">You Send</div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {formatCurrency(
                          conversionForm.amount,
                          conversionForm.from
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {conversionForm.from}
                      </div>
                    </div>
                    <div className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-sm text-gray-500 mb-2">
                        You Receive
                      </div>
                      <div className="text-3xl font-bold text-emerald-600 mb-1">
                        {formatCurrency(convertedValue, conversionForm.to)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {conversionForm.to}
                      </div>
                    </div>
                  </div>

                  {/* Rate Details */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setShowRateDetails(!showRateDetails)}
                    >
                      <div className="flex items-center">
                        <Percent className="h-5 w-5 text-blue-500 mr-2" />
                        <h4 className="font-semibold text-gray-900">
                          Exchange Rate Details
                        </h4>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          showRateDetails ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {showRateDetails && (
                      <div className="mt-6 grid md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            1 {conversionForm.from}
                          </div>
                          <div className="text-lg font-semibold mt-1">
                            = {Number(fxRate).toFixed(4)} {conversionForm.to}
                          </div>
                          <div className="text-sm text-gray-500 mt-2">
                            Mid-market Rate
                          </div>
                        </div>

                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                          <div className="text-lg font-bold text-amber-600">
                            {Number(fxmarginRate).toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            Our Fee
                          </div>
                          <div className="text-xl font-semibold mt-1">
                            {formatCurrency(feeAmount, conversionForm.from)}
                          </div>
                        </div>

                        <div className="text-center p-4 bg-emerald-50 rounded-lg">
                          <div className="text-lg font-bold text-emerald-600">
                            Total Amount
                          </div>
                          <div className="text-xl font-semibold mt-1">
                            {formatCurrency(totalAmount, conversionForm.from)}
                          </div>
                          <div className="text-sm text-gray-500 mt-2">
                            Including fees
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Button */}
                  <div className="flex space-x-4">
                    <button
                      onClick={resetForm}
                      disabled={isSubmitting}
                      className="flex-1 py-4 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Convert Again
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <RingLoader
                            size={20}
                            color="#ffffff"
                            className="mr-2"
                          />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Confirm Conversion
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Info & Features */}
          <div className="space-y-6">
            {/* Benefits Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 text-blue-500 mr-2" />
                Why Convert With Us
              </h3>
              <div className="space-y-4">
                {[
                  {
                    icon: Zap,
                    text: "Real-time exchange rates",
                    color: "text-blue-500",
                  },
                  {
                    icon: Shield,
                    text: "Bank-level security",
                    color: "text-green-500",
                  },
                  {
                    icon: Clock,
                    text: "Instant processing",
                    color: "text-purple-500",
                  },
                  {
                    icon: Percent,
                    text: "Low transparent fees",
                    color: "text-amber-500",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg bg-${
                        item.color.split("-")[1]
                      }-50`}
                    >
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <span className="text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Accounts Card */}
            {/* <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 text-blue-500 mr-2" />
                Your Available Accounts
              </h3>
              <div className="space-y-3">
                {customerBankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-blue-600">
                          {account.currency_code.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {account.account_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getCurrencyDisplay(account.currency_code)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Balance</div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(account.balance, account.currency_code)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Conversion Tips Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-blue-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Info className="h-5 w-5 text-blue-600 mr-2" />
                Conversion Tips
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <span className="text-sm text-gray-700">
                    Convert between any of your accounts
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <span className="text-sm text-gray-700">
                    Rates are locked in for 30 seconds
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <span className="text-sm text-gray-700">
                    No hidden fees or restrictions
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Popup Components */}
        {showPopup && (
          <ConversionPopup
            onClose={handleClosePopup}
            message={localErrorMessage}
          />
        )}
        {showPopupSuccess && lastSuccessfulConversion && (
          <ConversionPopupSuccess
            onClose={handleClosePopupSuccess}
            message={successMessage}
            transactionDetails={{
              transactionId: `CONV-${conversionId}`,
              fromCurrency: lastSuccessfulConversion.from,
              toCurrency: lastSuccessfulConversion.to,
              amount: lastSuccessfulConversion.amount.toString(),
              convertedAmount:
                lastSuccessfulConversion.convertedValue.toString(),
              exchangeRate: lastSuccessfulConversion.fxRate.toString(),
              fee: lastSuccessfulConversion.feeAmount || 0,
              timestamp: lastSuccessfulConversion.timestamp,
              fromAccount:
                customerBankAccounts.find(
                  (a) => a.currency_code === lastSuccessfulConversion.from
                )?.account_name || "N/A",
              toAccount:
                customerBankAccounts.find(
                  (a) => a.currency_code === lastSuccessfulConversion.to
                )?.account_name || "N/A",
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>
              Exchange rates are provided for informational purposes only.
              Actual rates may vary.
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} FinTech Currency Converter. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ConversionPage;