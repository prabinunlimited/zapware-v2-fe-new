// src/page/Deposit/components/Card/CardPayment.jsx - FIXED WITH CORRECT CLIENT KEY
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { RingLoader } from "react-spinners";
import { motion } from "framer-motion";
import {
  FaUniversity,
  FaCreditCard,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import { FiArrowLeft, FiDownload, FiCheckCircle, FiInfo } from "react-icons/fi";

export default function CardPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adyenLoaded, setAdyenLoaded] = useState(false);
  const [adyenComponent, setAdyenComponent] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    if (sessionData) {
      console.log("🔍 Session Data Debug:", {
        id: sessionData.id,
        sessionData: sessionData.sessionData
          ? `${sessionData.sessionData.substring(0, 50)}...`
          : "MISSING",
        amount: sessionData.amount,
        hasRawSession: !!sessionData.rawSession,
      });

      // Check if sessionData is properly formatted
      if (!sessionData.sessionData) {
        console.error("🚨 CRITICAL: sessionData is missing from API response!");
        setError(
          "Payment session configuration error. Please contact support."
        );
      }
    }
  }, [sessionData, setError]);

  console.log("🔍 CardPayment received state:", state);
  console.log("🎯 Currency:", state?.currency);

  const API_URL =
    import.meta.env.VITE_API_URL || "https://zapware.unlimitedremit.com/api";

  // ✅ CRITICAL FIX: Get the correct Adyen configuration that matches your backend
  const getAdyenConfig = () => {
    // Your backend is using LIVE environment - use the correct LIVE client key
    const LIVE_CLIENT_KEY = "live_MDVSR7AQ75GT3JUGNXHL2Y7X4AN3OY6J"; // ✅ From your setup call

    return {
      clientKey: LIVE_CLIENT_KEY,
      environment: "live", // ✅ Must match your backend
      resourcesUrl: "https://checkoutshopper-live.adyen.com/checkoutshopper/",
    };
  };

  const adyenConfig = getAdyenConfig();
  console.log("🔧 Adyen Configuration:", {
    ...adyenConfig,
    clientKey: adyenConfig.clientKey
      ? `${adyenConfig.clientKey.substring(0, 10)}...`
      : "MISSING",
  });

  const getBearerToken = () => {
    return (
      localStorage.getItem("authToken") || localStorage.getItem("authtoken")
    );
  };

  // Get authentication token
  const getAuthToken = () => {
    return (
      localStorage.getItem("authToken") || localStorage.getItem("authtoken")
    );
  };

  // Get customer ID
  const getCustomerId = () => {
    return localStorage.getItem("customerId") || state?.customerId;
  };

  // 🚨 CRITICAL FIX: Different logic for USD vs GBP/other currencies
  const shouldUseBankAccounts = () => {
    // ONLY USD requires SILA bank accounts for card deposits
    return state?.currency === "USD";
  };

  // Function to fetch bank accounts - ONLY FOR USD
  const fetchBankAccounts = async () => {
    if (!shouldUseBankAccounts()) {
      console.log(
        "🔄 Skipping bank account fetch for non-USD currency:",
        state?.currency
      );
      return [];
    }

    try {
      const token = getAuthToken();
      const customerId = getCustomerId();

      if (!token || !customerId) {
        throw new Error("Authentication required");
      }

      console.log(
        "🔄 Fetching SILA bank accounts for USD customer:",
        customerId
      );

      const response = await axios.post(
        `https://zapware.unlimitedremit.com/api/sila/manual-sila-bankdetails`,
        { customerId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        }
      );

      console.log("✅ SILA bank accounts response:", response.data);

      // Handle response structure
      let accounts = [];
      const data = response.data;

      if (Array.isArray(data)) {
        accounts = data;
      } else if (data?.data) {
        accounts = Array.isArray(data.data) ? data.data : [data.data];
      } else if (data?.status === "success") {
        accounts = data.data || [];
      }

      console.log(`💰 Found ${accounts.length} SILA bank accounts for USD`);
      return accounts;
    } catch (error) {
      console.error("❌ Error fetching SILA bank accounts:", error);
      return [];
    }
  };

  // ✅ FIXED: Create Adyen session
  const createAdyenSession = async (bankAccount = null) => {
    try {
      const bearertoken = getBearerToken();
      const customerId = getCustomerId();

      if (!bearertoken || !customerId) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Build payload
      const payload = {
        customerId: customerId,
        amount: parseFloat(state?.amount),
        currency: state?.currency,
        purpose: state?.purpose || "DEPOSIT",
        payment_method: "card_deposit",
        reference: `deposit_${customerId}_${Date.now()}`,
        returnUrl: `${window.location.origin}/payment-callback`,
      };

      console.log("🚀 Creating Adyen session with payload:", payload);

      const response = await axios.post(`${API_URL}/adyen/session`, payload, {
        headers: {
          Authorization: `Bearer ${bearertoken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      console.log("✅ Adyen session response:", response.data);

      if (response.data.status === "success" && response.data.session) {
        const sessionData = response.data.session;

        // ✅ FIX: Log the exact structure for debugging
        console.log("🔍 Session Data Structure:", {
          id: sessionData.id,
          sessionData: sessionData.sessionData, // This is what Adyen expects
          amount: sessionData.amount,
          countryCode: sessionData.countryCode,
        });

        return sessionData;
      } else {
        throw new Error("Invalid session response from server");
      }
    } catch (error) {
      console.error("❌ Adyen session creation failed:", error);
      throw error;
    }
  };

  // Load Adyen CSS and JS from CDN - UPDATED to use correct environment
  useEffect(() => {
    const loadAdyenResources = () => {
      return new Promise((resolve, reject) => {
        if (
          window.AdyenCheckout &&
          typeof window.AdyenCheckout === "function"
        ) {
          console.log("✅ Adyen already loaded");
          resolve();
          return;
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        // Use the correct URL based on environment
        link.href = `${adyenConfig.resourcesUrl}sdk/5.58.0/adyen.css`;
        link.onload = () => {
          console.log("✅ Adyen CSS loaded");

          const script = document.createElement("script");
          script.src = `${adyenConfig.resourcesUrl}sdk/5.58.0/adyen.js`;
          script.onload = () => {
            console.log("✅ Adyen JS loaded");

            // Wait for AdyenCheckout to be fully available
            const checkAdyen = () => {
              if (
                window.AdyenCheckout &&
                typeof window.AdyenCheckout === "function"
              ) {
                console.log("✅ AdyenCheckout function ready");
                setAdyenLoaded(true);
                resolve();
              } else {
                setTimeout(checkAdyen, 100);
              }
            };
            checkAdyen();
          };
          script.onerror = () => reject(new Error("Failed to load Adyen JS"));
          document.head.appendChild(script);
        };
        link.onerror = () => reject(new Error("Failed to load Adyen CSS"));
        document.head.appendChild(link);
      });
    };

    loadAdyenResources()
      .then(() => {
        console.log("✅ All Adyen resources loaded successfully");
        initializePayment();
      })
      .catch((error) => {
        console.error("❌ Failed to load Adyen resources:", error);
        setError("Failed to load payment processor. Please try again.");
        setLoading(false);
      });
  }, []);

  // ✅ FIXED: Main payment initialization
  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required state
      if (!state?.customerId || !state?.currency || !state?.amount) {
        throw new Error("Missing required payment information");
      }

      if (isNaN(parseFloat(state.amount)) || parseFloat(state.amount) <= 0) {
        throw new Error("Please enter a valid amount greater than 0.");
      }

      console.log("🎯 Starting payment process for:", {
        currency: state.currency,
        amount: state.amount,
        requiresBankAccount: shouldUseBankAccounts(),
        adyenEnvironment: adyenConfig.environment,
      });

      let bankAccounts = [];

      // Only check bank accounts for USD
      if (shouldUseBankAccounts()) {
        console.log("💰 USD detected - checking SILA bank accounts...");
        bankAccounts = await fetchBankAccounts();

        if (bankAccounts.length === 0) {
          setError(`🚨 Bank Account Required for USD`);
          setLoading(false);
          return;
        }
      }

      // Create Adyen session
      const selectedBankAccount =
        bankAccounts.length > 0 ? bankAccounts[0] : null;
      const sessionResult = await createAdyenSession(selectedBankAccount);

      // ✅ FIX: Store session data for debugging
      setSessionData(sessionResult);

      // ✅ FIX: Initialize Adyen checkout with the session data
      if (sessionResult) {
        await initializeAdyenCheckout(sessionResult);
      }
    } catch (error) {
      console.error("❌ Payment initialization failed:", error);
      handlePaymentError(error);
    }
  };

  // ✅ CRITICAL FIX: Correct Adyen initialization with proper configuration
  const initializeAdyenCheckout = async (sessionData) => {
    try {
      console.log("🎯 Initializing Adyen Checkout with session:", {
        id: sessionData.id,
        hasSessionData: !!sessionData.sessionData,
        sessionDataLength: sessionData.sessionData?.length,
      });

      if (!window.AdyenCheckout) {
        throw new Error("AdyenCheckout not available in window object");
      }

      // ✅ CRITICAL FIX: Use the CORRECT session structure from your API
      const session = {
        id: sessionData.id,
        sessionData: sessionData.sessionData, // This must match your API response
      };

      console.log("🔍 Final Adyen session object:", session);

      // ✅ EXACT configuration matching your backend
      const configuration = {
        clientKey: adyenConfig.clientKey,
        environment: adyenConfig.environment,
        session: session, // ✅ CORRECT: Pass session with id and sessionData
        amount: {
          value: sessionData.amount.value,
          currency: sessionData.amount.currency,
        },
        locale: "en_US",
        countryCode: sessionData.countryCode || "US",
        showPayButton: true,
        onSubmit: (state, component) => {
          console.log("🔄 Form submitted:", state);
          // Handle form submission
        },
        onAdditionalDetails: (state, component) => {
          console.log("🔄 Additional details:", state);
          // Handle 3DS2 authentication
        },
        onPaymentCompleted: (result, component) => {
          console.info("✅ Payment completed:", result, component);
          if (
            result.resultCode === "Authorised" ||
            result.resultCode === "Received"
          ) {
            setTimeout(() => {
              navigate("/payment-success", {
                state: {
                  transactionId: result.pspReference,
                  amount: state.amount,
                  currency: state.currency,
                  purpose: state.purpose,
                },
              });
            }, 2000);
          }
        },
        onError: (error, component) => {
          console.error("❌ Adyen checkout error:", error);

          // Enhanced error handling
          if (error.message?.includes("Invalid ClientKey")) {
            setError(`🚨 Adyen Configuration Error - Invalid Client Key`);
          } else if (error.message?.includes("sessionData")) {
            setError(`🚨 Session Data Error - Missing sessionData field`);
          } else {
            setError(
              `Payment error: ${error.message || "Unknown error occurred"}`
            );
          }
        },
      };

      const checkout = await window.AdyenCheckout(configuration);

      console.log("✅ Checkout created:", checkout);

      // Create and mount card component
      if (checkout && checkout.create) {
        const cardComponent = checkout.create("card");
        cardComponent.mount("#adyen-dropin-container");
        setAdyenComponent(cardComponent);
        console.log("✅ Adyen card component mounted successfully");
        setLoading(false);
      } else {
        throw new Error("Adyen Checkout instance is invalid");
      }
    } catch (error) {
      console.error("❌ Failed to initialize Adyen checkout:", error);
      setError(
        "Failed to initialize payment form. Please refresh the page and try again."
      );
      setLoading(false);
    }
  };

  // ✅ SIMPLIFIED: Error handling
  const handlePaymentError = (error) => {
    console.error("❌ Payment error:", error);

    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.message || error.message;

      if (errorMessage.includes("Bank Account not found")) {
        if (shouldUseBankAccounts()) {
          setError(`🚨 USD Bank Account Required

To process USD card deposits, you need a linked US bank account.

Please link a bank account first, then try again.`);
        } else {
          setError(`Payment setup failed: ${errorMessage}`);
        }
      } else {
        setError(`Payment setup failed: ${errorMessage}`);
      }
    } else if (error.code === "ERR_NETWORK") {
      setError(
        "Network error: Unable to connect to payment service. Please check your internet connection."
      );
    } else if (error.response?.status === 401) {
      setError("Authentication failed. Please log in again.");
    } else if (error.response?.status === 500) {
      setError("Server error. Please try again later or contact support.");
    } else {
      setError(error.message || "Payment setup failed. Please try again.");
    }

    setLoading(false);
  };

  // Cleanup function
  const cleanupAdyen = () => {
    if (adyenComponent) {
      try {
        adyenComponent.unmount();
        console.log("🧹 Adyen component cleaned up");
      } catch (error) {
        console.warn("Error cleaning up Adyen component:", error);
      }
    }
  };

  useEffect(() => {
    return () => {
      cleanupAdyen();
    };
  }, [adyenComponent]);

  // Action handlers
  const handleRetry = () => {
    console.log("🔄 Manual retry initiated...");
    setError(null);
    setLoading(true);
    initializePayment();
  };

  const handleBackToDeposit = () => {
    console.log("⬅️ Returning to deposit page...");
    navigate("/deposit");
  };

  const handleLinkBankAccount = () => {
    console.log("🏦 Redirecting to bank account linking...");
    navigate("/deposit", {
      state: {
        autoOpenBankTab: true,
        returnToCard: true,
      },
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
          ></motion.div>
          <p className="mt-4 text-gray-600 font-medium">
            Setting Up {state?.currency} Payment...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {shouldUseBankAccounts()
              ? "Verifying your bank accounts..."
              : "Initializing secure payment form..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const requiresBankAccount =
      error.includes("Bank Account Required") ||
      error.includes("Bank Account Issue");
    const isAdyenConfigError =
      error.includes("Adyen Configuration") ||
      error.includes("Invalid ClientKey") ||
      error.includes("NETWORK_ERROR") ||
      error.includes("Configuration Mismatch");
    const isUSD = shouldUseBankAccounts();

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isAdyenConfigError ? "#FEF3C7" : "#FEE2E2",
                border: isAdyenConfigError
                  ? "2px solid #F59E0B"
                  : "2px solid #EF4444",
              }}
            >
              {requiresBankAccount ? (
                <FaUniversity className="h-8 w-8 text-red-500" />
              ) : isAdyenConfigError ? (
                <FaExclamationTriangle className="h-8 w-8 text-yellow-500" />
              ) : (
                <FaExclamationTriangle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
            {requiresBankAccount
              ? "Bank Account Required"
              : isAdyenConfigError
              ? "Payment System Configuration"
              : "Payment Setup Error"}
          </h3>

          <p className="text-gray-600 text-center mb-6 whitespace-pre-line">
            {error}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {requiresBankAccount && isUSD ? (
              <>
                <motion.button
                  onClick={handleLinkBankAccount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all"
                >
                  <FaUniversity className="mr-2" />
                  Link Bank Account
                </motion.button>
                <motion.button
                  onClick={handleBackToDeposit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  Back to Deposit
                </motion.button>
              </>
            ) : (
              <>
                {!isAdyenConfigError && (
                  <motion.button
                    onClick={handleRetry}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all"
                  >
                    Try Again
                  </motion.button>
                )}
                <motion.button
                  onClick={handleBackToDeposit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  Back to Deposit
                </motion.button>
              </>
            )}
          </div>

          {/* Configuration help for Adyen errors */}
          {isAdyenConfigError && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <strong>Developer Note:</strong> Update the client key in{" "}
                <code>CardPayment.jsx</code> at line ~25
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success state - Payment form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToDeposit}
            className="flex items-center mb-4 transition-colors font-medium hover:opacity-80"
          >
            <FiArrowLeft className="mr-1" /> Back to Deposit
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Pay With Card</h1>
          <p className="text-gray-600 mt-2">
            Complete your secure {state.currency} card payment
          </p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-lg font-medium text-gray-900">
              {state.currency} Payment Details
            </h2>
          </div>

          <div className="p-6">
            {/* Payment Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 font-medium">Amount:</span>
                <span className="text-lg font-bold text-blue-700">
                  {state.currency} {parseFloat(state.amount).toFixed(2)}
                </span>
              </div>
              {state.purpose && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Purpose:</span>
                  <span className="text-sm text-gray-600">{state.purpose}</span>
                </div>
              )}
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-xs text-green-700 flex items-center">
                  <FaCheckCircle className="mr-1" />
                  {shouldUseBankAccounts()
                    ? "Using linked US bank account"
                    : `Using ${state.currency} currency account`}
                </p>
              </div>
            </div>

            {/* Adyen Drop-in Container */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3 text-center">
                Enter your card details below
              </p>
              <div id="adyen-dropin-container" className="w-full" />
            </div>

            {/* Security Note */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Your payment is secured with bank-level encryption
              </p>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t rounded-b-2xl">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Secure Payment</span>
              <span>Powered by Adyen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}