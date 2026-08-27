import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import bgImg from "../../assets/images/bgimg.jpg"; 

const API_URL = import.meta.env.VITE_API_URL;
const getPartnerUuid = () => localStorage.getItem("partner_uuid");
const getAuthToken = () => localStorage.getItem("bearertoken");

const HeroSection = () => {
  // --- STATE MANAGEMENT ---

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sendAmount, setSendAmount] = useState("1,000");
  const [currencies, setCurrencies] = useState({
    sendCurrency: null,
    receiveCurrency: null,
  });

  const [sendCurrencyOptions, setSendCurrencyOptions] = useState([]);
  const [receiveCurrencyOptions, setReceiveCurrencyOptions] = useState([]);

  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [showReceiveDropdown, setShowReceiveDropdown] = useState(false);

  const [exchangeRateData, setExchangeRateData] = useState({
    rate: 0,
    fee: 0,
    loading: false,
    error: null,
  });
  const exchangeRateCacheRef = useRef({});

  const dropdownRef = useRef(null);
  const receiveDropdownRef = useRef(null);
  const sendTriggerRef = useRef(null);
  const receiveTriggerRef = useRef(null);
  const abortControllerRef = useRef(new AbortController());

  // --- API AND DATA LOGIC ---

  const fetchExchangeRate = useCallback(async () => {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const { sendCurrency, receiveCurrency } = currencies;

    if (!sendCurrency?.value || !receiveCurrency?.value) {
      setExchangeRateData({
        rate: 0,
        loading: false,
        error: "Select currencies to see a rate.",
      });
      return;
    }

    const cacheKey = `${sendCurrency.value}-${receiveCurrency.value}`;
    const cached = exchangeRateCacheRef.current[cacheKey];
    if (cached && new Date(cached.expiresAt) > new Date()) {
      setExchangeRateData(cached);
      return;
    }

    try {
      setExchangeRateData((prev) => ({ ...prev, loading: true, error: null }));

      const partnerUuid = getPartnerUuid();
      if (!partnerUuid) {
        throw new Error("Partner UUID not found in local storage");
      }

      const token = getAuthToken();

      const response = await axios.get(
        `${API_URL}/partner-exchange-rate/${partnerUuid}`,
        {
          signal,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === "success") {
        const rateData = response.data.data.find(
          (rate) =>
            rate.base_currency === sendCurrency.value &&
            rate.target_currency === receiveCurrency.value
        );

        if (rateData) {
          const rate = parseFloat(rateData.exchange_rate || 0);

          if (isNaN(rate) || rate <= 0) {
            throw new Error("Invalid exchange rate response from server");
          }

          const newRateData = {
            rate: rate,
            fee: 0,
            loading: false,
            error: null,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          };

          exchangeRateCacheRef.current[cacheKey] = newRateData;
          setExchangeRateData(newRateData);
        } else {
          throw new Error("Exchange rate not found for selected currency pair");
        }
      } else {
        throw new Error(
          response.data.message || "Failed to fetch exchange rates"
        );
      }
    } catch (error) {
      if (axios.isCancel(error)) return;
      console.error("Exchange rate fetch error:", error);
      setExchangeRateData({
        rate: 0,
        fee: 0,
        loading: false,
        error: "Failed to fetch exchange rate",
      });
    }
  }, [currencies]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const partnerUuid = getPartnerUuid();
        if (!partnerUuid) {
          throw new Error("Partner UUID not found in local storage");
        }

        const token = getAuthToken();

        const liveRateResponse = await axios.get(
          `${API_URL}/partner-exchange-rate/${partnerUuid}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (liveRateResponse.data.status === "success") {
          const baseCurrencies = [
            ...new Set(
              liveRateResponse.data.data.map((item) => item.base_currency)
            ),
          ];

          const sendOptions = baseCurrencies.map((currencyCode) => ({
            value: currencyCode,
            label: currencyCode,
            name: getCurrencyName(currencyCode),
            symbol: getCurrencySymbol(currencyCode),
          }));

          setSendCurrencyOptions(sendOptions);

          const targetCurrencies = [
            ...new Set(
              liveRateResponse.data.data.map((item) => item.target_currency)
            ),
          ];

          const receiveOptions = targetCurrencies.map((currencyCode) => ({
            value: currencyCode,
            label: currencyCode,
            name: getCurrencyName(currencyCode),
            symbol: getCurrencySymbol(currencyCode),
          }));

          setReceiveCurrencyOptions(receiveOptions);

          const defaultSend =
            sendOptions.find((o) => o.value === "GBP") || sendOptions[0];
          const defaultReceive =
            receiveOptions.find((o) => o.value === "KES") || receiveOptions[0];

          setCurrencies({
            sendCurrency: defaultSend,
            receiveCurrency: defaultReceive,
          });
        } else {
          throw new Error(
            liveRateResponse.data.message || "Failed to fetch live rates"
          );
        }
      } catch (err) {
        console.error("API Error:", err);
        setError("Failed to load currency options.");
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (currencies.sendCurrency && currencies.receiveCurrency) {
      fetchExchangeRate();
    }
    return () => abortControllerRef.current.abort();
  }, [fetchExchangeRate, currencies, sendAmount]);

  // --- UI HANDLERS AND HELPERS ---

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, "");
    if (!isNaN(value)) {
      setSendAmount(Number(value).toLocaleString());
    }
  };

  const calculateReceiveAmount = () => {
    const amount = parseFloat(sendAmount.replace(/,/g, "")) || 0;
    if (exchangeRateData.rate > 0) {
      const totalAmount = amount * exchangeRateData.rate - exchangeRateData.fee;
      return totalAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return "N/A";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sendTriggerRef.current &&
        !sendTriggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowSendDropdown(false);
      }
      if (
        receiveTriggerRef.current &&
        !receiveTriggerRef.current.contains(event.target) &&
        receiveDropdownRef.current &&
        !receiveDropdownRef.current.contains(event.target)
      ) {
        setShowReceiveDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- RENDER LOGIC ---

  if (isInitialLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start pt-16 pb-8 px-4 sm:px-8 text-white"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(8,10,18,0.92) 0%, rgba(8,10,18,0.82) 45%, rgba(8,10,18,0.95) 100%), url(${bgImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="w-full max-w-md md:max-w-lg mt-12 mb-2 text-center">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#ffc10c]/70 mb-2">
          Live Rates
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold leading-snug">
          Know exactly what
          <br className="hidden sm:block" /> they'll receive
        </h1>
      </div>

      <div className="w-full max-w-md md:max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] p-5 sm:p-7 mt-8">
        {/* Send Currency */}
        <div className="mb-2 relative">
          <label className="block text-xs uppercase tracking-wide text-white/50 mb-2">
            You send
          </label>
          <div className="flex rounded-xl overflow-hidden bg-white/[0.06] border border-white/10 focus-within:border-[#ffc10c]/60 transition-colors">
            <div
              ref={sendTriggerRef}
              className="flex items-center gap-2 px-4 py-3 cursor-pointer min-w-[92px] hover:bg-white/[0.06] border-r border-white/10"
              onClick={() => setShowSendDropdown(!showSendDropdown)}
            >
              <span className="text-lg">{currencies.sendCurrency?.symbol}</span>
              <span className="font-medium">{currencies.sendCurrency?.value}</span>
              <ChevronDownIcon />
            </div>
            <input
              className="flex-1 bg-transparent px-4 py-3 outline-none text-base placeholder-white/40 text-right font-medium"
              value={sendAmount}
              onChange={handleAmountChange}
              placeholder="Amount"
              inputMode="numeric"
            />
          </div>
          {showSendDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-10 mt-1 w-full bg-[#0e1018] rounded-xl shadow-xl border border-white/10 max-h-60 overflow-y-auto"
            >
              {sendCurrencyOptions.map((currency) => (
                <div
                  key={currency.value}
                  className={`px-4 py-2.5 hover:bg-[#ffc10c]/10 cursor-pointer text-sm flex justify-between ${
                    currencies.sendCurrency?.value === currency.value
                      ? "bg-[#ffc10c]/15 text-[#ffc10c]"
                      : "text-white/85"
                  }`}
                  onClick={() => {
                    setCurrencies((prev) => ({
                      ...prev,
                      sendCurrency: currency,
                    }));
                    setShowSendDropdown(false);
                  }}
                >
                  <span>{currency.value}</span>
                  <span className="text-white/40">{currency.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Swap + Rate */}
        <div className="flex items-center justify-center my-1 relative py-3">
          <div className="h-px w-full bg-white/10" />
          <div
            aria-hidden="true"
            className="absolute bg-[#ffc10c] p-2 rounded-full shadow-lg shadow-[#ffc10c]/20"
          >
            {exchangeRateData.loading ? (
              <span className="block w-[18px] h-[18px] border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <SwapIcon className="text-gray-900" />
            )}
          </div>
        </div>
        <p className="text-center text-xs text-white/50 mb-6">
          1 {currencies.sendCurrency?.value} ={" "}
          <span className="text-[#ffc10c] font-medium">
            {exchangeRateData.loading
              ? "…"
              : exchangeRateData.rate > 0
              ? exchangeRateData.rate.toFixed(2)
              : "N/A"}
          </span>{" "}
          {currencies.receiveCurrency?.value}
        </p>

        {/* Receive Currency */}
        <div className="mb-1 relative">
          <label className="block text-xs uppercase tracking-wide text-white/50 mb-2">
            Recipient receives
          </label>
          <div className="flex rounded-xl overflow-hidden bg-white/[0.06] border border-white/10">
            <div
              ref={receiveTriggerRef}
              className="flex items-center gap-2 px-4 py-3 cursor-pointer min-w-[92px] hover:bg-white/[0.06] border-r border-white/10"
              onClick={() => setShowReceiveDropdown(!showReceiveDropdown)}
            >
              <span className="text-lg">{currencies.receiveCurrency?.symbol}</span>
              <span className="font-medium">{currencies.receiveCurrency?.value}</span>
              <ChevronDownIcon />
            </div>
            <input
              className="flex-1 bg-transparent px-4 py-3 outline-none text-base text-right font-medium text-[#ffc10c]"
              value={exchangeRateData.loading ? "…" : calculateReceiveAmount()}
              readOnly
            />
          </div>

          {!exchangeRateData.loading && calculateReceiveAmount() === "N/A" && (
            <p className="text-red-400 text-xs mt-2">
              Not available — this currency pair isn't supported yet
            </p>
          )}

          {showReceiveDropdown && (
            <div
              ref={receiveDropdownRef}
              className="absolute z-10 mt-1 w-full bg-[#0e1018] rounded-xl shadow-xl border border-white/10 max-h-60 overflow-y-auto"
            >
              {receiveCurrencyOptions.map((currency) => (
                <div
                  key={currency.value}
                  className={`px-4 py-2.5 hover:bg-[#ffc10c]/10 cursor-pointer text-sm flex justify-between ${
                    currencies.receiveCurrency?.value === currency.value
                      ? "bg-[#ffc10c]/15 text-[#ffc10c]"
                      : "text-white/85"
                  }`}
                  onClick={() => {
                    setCurrencies((prev) => ({
                      ...prev,
                      receiveCurrency: currency,
                    }));
                    setShowReceiveDropdown(false);
                  }}
                >
                  <span>{currency.value}</span>
                  <span className="text-white/40">{currency.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Helper Functions and Components ---
function getCurrencyName(code) {
  const currencyNames = {
    GBP: "British Pound Sterling",
    KES: "Kenyan Shilling",
    USD: "US Dollar",
    EUR: "Euro",
    JPY: "Japanese Yen",
    AUD: "Australian Dollar",
    CAD: "Canadian Dollar",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan",
    BGN: "Bulgarian Lev",
    DKK: "Danish Krone",
    INR: "Indian Rupee",
    NPR: "Nepalese Rupee",
    PKR: "Pakistani Rupee",
    AED: "United Arab Emirates Dirham",
  };
  return currencyNames[code] || code;
}
function getCurrencySymbol(code) {
  const currencySymbols = {
    GBP: "£",
    KES: "KSh",
    USD: "$",
    EUR: "€",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
    CHF: "Fr",
    CNY: "¥",
    DKK: "kr",
    INR: "₹",
    NPR: "₨",
    PKR: "₨",
    AED: "د.إ",
  };
  return currencySymbols[code] || code;
}
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/50">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const SwapIcon = ({ className = "" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 10l5-5m0 0l5 5m-5-5v14M17 14l-5 5m0 0l-5-5m5 5V5" />
  </svg>
);
const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#080a12]">
    <div className="w-full max-w-md rounded-3xl p-8 text-center border border-white/10 bg-white/[0.04]">
      <div className="w-10 h-10 border-2 border-[#ffc10c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-[#ffc10c] text-sm">Loading exchange rates…</p>
    </div>
  </div>
);
const ErrorState = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#080a12]">
    <div className="w-full max-w-md rounded-3xl p-8 text-center border border-white/10 bg-white/[0.04]">
      <div className="w-12 h-12 rounded-full bg-[#ffc10c]/15 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-[#ffc10c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold mb-2 text-[#ffc10c]">Couldn't load rates</h3>
      <p className="mb-4 text-sm text-white/60">{error}</p>
      <button
        className="bg-[#ffc10c] text-gray-900 font-semibold px-4 py-2 rounded-xl hover:bg-[#ffc10c]/90"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  </div>
);

export default HeroSection;