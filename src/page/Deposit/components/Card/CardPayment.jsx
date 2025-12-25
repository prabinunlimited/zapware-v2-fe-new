import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RingLoader } from "react-spinners";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FaCreditCard,
  FaExclamationTriangle,
  FaCheckCircle,
  FaLock,
  FaShieldAlt,
} from "react-icons/fa";
import { FiArrowLeft, FiShield, FiAlertCircle } from "react-icons/fi";
import { getBearerToken } from "../../../../services/authService";

export default function CardPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutReady, setCheckoutReady] = useState(false);

  // Refs
  const checkoutRef = useRef(null);
  const dropinInstance = useRef(null);
  const containerRef = useRef(null);
  const isMounted = useRef(false);
  const initializationStarted = useRef(false);

  // 🔥 Configuration with YOUR domain
  const getAdyenConfig = () => {
    return {
      environment: "live",
      isLive: true,
      clientKey: "live_MDVSR7AQ75GT3JUGNXHL2Y7X4AN3OY6J",
      checkoutUrl: "https://checkoutshopper-live.adyen.com",
      customUrl: "267ad19785000936-UnlimitedRemit",
      sdkVersion: "5.62.0",
      apiUrl: "https://zapware.unlimitedremit.com/api",
      origin: "https://ourzap-v2.unlimitedremit.com", // 👈 YOUR DOMAIN
      merchantAccount: "UnlimitedRemitECOM", // Your merchant account
    };
  };

  // Get auth token
  const getAuthToken = async () => {
    try {
      const token = await getBearerToken(false);
      if (token && token.trim()) {
        return token.trim();
      }

      const storedToken = localStorage.getItem("authtoken");
      if (storedToken && storedToken.trim()) {
        return storedToken.trim().replace(/^Bearer\s+/i, "");
      }

      throw new Error("Authentication required");
    } catch (error) {
      throw new Error("Session expired");
    }
  };

  // Get customer ID
  const getCustomerId = () => {
    return (
      state?.customerId ||
      localStorage.getItem("authcustomer_id") ||
      localStorage.getItem("customerId")
    );
  };

  // 🔥 Load Adyen SDK
  const loadAdyenSDK = () => {
    return new Promise((resolve, reject) => {
      const config = getAdyenConfig();

      if (window.AdyenCheckout && typeof window.AdyenCheckout === "function") {
        console.log("✅ Adyen SDK already loaded");
        resolve();
        return;
      }

      // Clear existing scripts
      document
        .querySelectorAll('script[src*="adyen.com"]')
        .forEach((el) => el.remove());
      document
        .querySelectorAll('link[href*="adyen.com"]')
        .forEach((el) => el.remove());

      const timeoutId = setTimeout(() => {
        reject(new Error("Payment system loading timeout"));
      }, 15000);

      // Load CSS
      const cssLink = document.createElement("link");
      cssLink.rel = "stylesheet";
      cssLink.href = `${config.checkoutUrl}/checkoutshopper/sdk/${config.sdkVersion}/adyen.css`;
      cssLink.crossOrigin = "anonymous";
      cssLink.onerror = () => console.warn("CSS failed to load, continuing...");
      document.head.appendChild(cssLink);

      // Load JS
      const script = document.createElement("script");
      script.src = `${config.checkoutUrl}/checkoutshopper/sdk/${config.sdkVersion}/adyen.js`;
      script.crossOrigin = "anonymous";
      script.async = true;

      script.onload = () => {
        clearTimeout(timeoutId);

        const checkAdyenLoaded = () => {
          if (
            window.AdyenCheckout &&
            typeof window.AdyenCheckout === "function"
          ) {
            console.log("✅ Adyen SDK loaded successfully");
            resolve();
          } else {
            console.log("⏳ Waiting for AdyenCheckout...");
            setTimeout(checkAdyenLoaded, 100);
          }
        };

        checkAdyenLoaded();
      };

      script.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error("❌ Adyen SDK failed to load:", error);
        reject(new Error(`Failed to load payment system: ${error.message}`));
      };

      document.head.appendChild(script);
    });
  };

  // 🔥 Create Adyen session with URL fixing
  const createAdyenSession = async () => {
    try {
      const config = getAdyenConfig();
      const token = await getAuthToken();
      const customerId = getCustomerId();

      if (!token || !customerId) {
        throw new Error("Authentication required");
      }

      if (!state?.amount || !state?.currency) {
        throw new Error("Missing payment details");
      }

      const payload = {
        customerId,
        amount: parseFloat(state.amount),
        currency: state.currency,
        environment: config.environment,
        origin: config.origin,
        purpose: state.purpose || "Deposit",
        returnUrl: `${config.origin}/card/success`,
      };

      console.log("🔍 Sending to backend:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${config.apiUrl}/adyen/session`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30000,
        }
      );

      console.log("✅ Backend response received");

      if (!response.data?.session) {
        throw new Error("No session data received from payment server");
      }

      const session = response.data.session;

      // 🔥 CRITICAL: Check for wrong domain in sessionData
      let fixedSessionData = session.sessionData;
      if (session.sessionData && session.sessionData.includes("your-company.com")) {
        console.warn("⚠️ Found 'your-company.com' in sessionData, attempting to fix...");
        // Try to replace the wrong domain with our domain
        fixedSessionData = session.sessionData.replace(
          /your-company\.com/g, 
          "ourzap-v2.unlimitedremit.com"
        );
        console.log("✅ Attempted to fix sessionData domain");
      }

      // Create mapped session with OUR domain
      const mappedSession = {
        id: session.id,
        sessionData: fixedSessionData, // Use fixed session data
        amount: session.amount || {
          value: Math.round(parseFloat(state.amount) * 100),
          currency: state.currency || "USD",
        },
        countryCode: session.countryCode || "US",
        shopperLocale: session.shopperLocale || "en-US",
        shopperReference: session.shopperReference || `customer_${customerId}`,
        // 🔥 FORCE OUR DOMAIN HERE
        returnUrl: `${config.origin}/card/success`,
        expiresAt: session.expiresAt,
        // Store original for debugging
        originalReturnUrl: session.returnUrl,
      };

      console.log("✅ Session created with returnUrl:", mappedSession.returnUrl);
      console.log("🔍 Original returnUrl from API:", session.returnUrl);

      return mappedSession;
    } catch (error) {
      console.error("❌ Session creation error:", error);
      throw error;
    }
  };

  // 🔥 Wait for container
  const waitForContainer = (containerId = "adyen-checkout-container") => {
    return new Promise((resolve, reject) => {
      const maxAttempts = 50;
      const delay = 100;
      let attempts = 0;

      const checkContainer = () => {
        attempts++;

        if (!isMounted.current) {
          reject(new Error("Component unmounted"));
          return;
        }

        let container = document.getElementById(containerId);

        if (container && document.body.contains(container)) {
          console.log(`✅ Container found after ${attempts} attempts`);
          resolve(container);
        } else if (attempts >= maxAttempts) {
          // Create container if it doesn't exist
          try {
            const newContainer = document.createElement('div');
            newContainer.id = containerId;
            newContainer.setAttribute('data-container-id', containerId);
            newContainer.className = 'adyen-container';
            newContainer.style.minHeight = '220px';
            newContainer.style.position = 'relative';
            
            // Find where to insert it
            const target = document.querySelector('.adyen-payment-section') || 
                          document.querySelector('.p-6') || 
                          document.body;
            
            target.appendChild(newContainer);
            console.log(`✅ Created container "${containerId}" dynamically`);
            resolve(newContainer);
          } catch (createError) {
            reject(new Error(`Container error: ${createError.message}`));
          }
        } else {
          setTimeout(checkContainer, delay);
        }
      };

      checkContainer();
    });
  };

  // 🔥 Initialize Adyen Checkout with complete fixes
  const initializeAdyenCheckout = async (session) => {
    try {
      const config = getAdyenConfig();

      if (!window.AdyenCheckout || typeof window.AdyenCheckout !== "function") {
        throw new Error("Payment system not loaded");
      }

      console.log("🔍 Initializing Adyen checkout");
      console.log("🔍 Using domain:", config.origin);
      console.log("🔍 Return URL:", session.returnUrl);

      // Wait for container
      const container = await waitForContainer();

      // Clear and show loading
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full py-8">
          <RingLoader color="#DC2626" size={40} class="mb-4" />
          <p class="text-gray-600 text-sm">Setting up payment form...</p>
        </div>
      `;

      // 🔥 FINAL RETURN URL - MUST BE OUR DOMAIN
      const finalReturnUrl = `${config.origin}/card/success`;
      
      // 🔥 Create session configuration
      const configuration = {
        clientKey: config.clientKey,
        environment: config.environment,
        origin: config.origin, // Critical for CORS
        
        session: {
          id: session.id,
          sessionData: session.sessionData,
        },

        // 🔥 EXPLICITLY SET returnUrl HERE
        returnUrl: finalReturnUrl,

        amount: session.amount || {
          value: Math.round(parseFloat(state.amount) * 100),
          currency: state.currency || "USD",
        },

        locale: "en-US",
        countryCode: session.countryCode || "US",
        shopperLocale: session.shopperLocale || "en-US",

        showPayButton: true,
        showStoreDetails: false,

        analytics: { enabled: true },
        risk: { enabled: true },

        // Payment handlers
        onPaymentCompleted: (result, component) => {
          console.log("🎯 Payment completed:", result.resultCode);
          
          const successCodes = ["Authorised", "Received", "Pending", "RedirectShopper"];
          const isSuccess = successCodes.includes(result.resultCode);

          if (isSuccess) {
            // Store result
            localStorage.setItem('adyen_payment_result', JSON.stringify({
              success: true,
              resultCode: result.resultCode,
              pspReference: result.pspReference,
              amount: state.amount,
              currency: state.currency,
              timestamp: new Date().toISOString(),
            }));
            
            // Navigate to success page
            navigate("/card/success", {
              state: {
                customerId: getCustomerId(),
                transactionId: result.pspReference || `adyen_${Date.now()}`,
                amount: state.amount,
                currency: state.currency,
                purpose: state.purpose,
                paymentMethod: "card_deposit",
                success: true,
                resultCode: result.resultCode,
                sessionId: session.id,
                environment: config.environment,
                timestamp: new Date().toISOString(),
              },
              replace: true,
            });
          } else {
            let errorMsg = `Payment ${result.resultCode}. `;
            if (result.refusalReason) errorMsg += `Reason: ${result.refusalReason}. `;
            
            if (result.resultCode === "Refused") {
              errorMsg += "Card declined. Please check details or try another card.";
            } else if (result.resultCode === "Cancelled") {
              errorMsg += "Payment cancelled.";
            } else {
              errorMsg += "Please try again.";
            }
            
            setError(errorMsg);
          }
        },

        onPaymentFailed: (result, component) => {
          console.log("❌ Payment failed:", result);
          setError("Payment failed. Please check your card details and try again.");
        },

        onError: (error, component) => {
          console.error("❌ Adyen error:", error);
          
          let errorMessage = "Payment error: ";
          if (error.message.includes("CORS") || error.message.includes("origin")) {
            errorMessage = `
              Domain Configuration Issue
              
              Please ensure ${config.origin} is properly configured in Adyen.
              Contact support if this issue persists.
            `;
          } else {
            errorMessage += error.message || "Please try again.";
          }
          
          setError(errorMessage);
        },

        onChange: (state, component) => {
          if (state.isValid && error) {
            setError(null);
          }
        },
      };

      console.log("🔍 Adyen config:", {
        origin: configuration.origin,
        returnUrl: configuration.returnUrl,
        environment: configuration.environment,
      });

      // Create checkout
      const checkout = await window.AdyenCheckout(configuration);
      const dropin = checkout.create("dropin");
      dropin.mount(container);

      // Store references
      dropinInstance.current = dropin;
      checkoutRef.current = checkout;

      setCheckoutReady(true);
      console.log("✅ Adyen checkout ready");

      return checkout;
    } catch (error) {
      console.error("❌ Checkout initialization error:", error);
      throw error;
    }
  };

  // 🔥 URL Interceptor - Catches wrong redirects
  useEffect(() => {
    const interceptWrongRedirect = () => {
      const currentUrl = window.location.href;
      
      // Check for wrong domain
      if (currentUrl.includes('your-company.com')) {
        console.log("⚠️ INTERCEPTING: Wrong domain redirect!");
        
        try {
          const config = getAdyenConfig();
          const urlObj = new URL(currentUrl);
          const params = new URLSearchParams(urlObj.search);
          
          // Build correct URL
          const correctUrl = new URL(`${config.origin}/card/success`);
          
          // Copy parameters
          params.forEach((value, key) => {
            correctUrl.searchParams.set(key, value);
          });
          
          // Add interception info
          correctUrl.searchParams.set('intercepted', 'true');
          correctUrl.searchParams.set('originalDomain', 'your-company.com');
          
          console.log("🔀 Redirecting to:", correctUrl.toString());
          window.location.replace(correctUrl.toString());
          return true;
        } catch (error) {
          // Fallback redirect
          window.location.replace(`${getAdyenConfig().origin}/card/success`);
          return true;
        }
      }
      return false;
    };
    
    // Check on load
    if (interceptWrongRedirect()) {
      return;
    }
    
    // Check periodically
    const interval = setInterval(interceptWrongRedirect, 500);
    
    return () => clearInterval(interval);
  }, []);

  // 🔥 Main initialization
  useEffect(() => {
    isMounted.current = true;

    if (initializationStarted.current) {
      return;
    }

    initializationStarted.current = true;

    if (!state) {
      setError("Payment information missing. Please go back and try again.");
      setLoading(false);
      return;
    }

    const initializePayment = async () => {
      try {
        console.log("📦 Loading Adyen SDK...");
        await loadAdyenSDK();

        await new Promise(resolve => setTimeout(resolve, 300));

        console.log("📦 Creating session...");
        const session = await createAdyenSession();

        console.log("📦 Initializing checkout...");
        await initializeAdyenCheckout(session);

        console.log("✅ Payment ready");
        setLoading(false);
      } catch (error) {
        console.error("❌ Initialization error:", error);
        setError(error.message || "Failed to initialize payment. Please try again.");
        setLoading(false);
      }
    };

    setTimeout(() => {
      if (isMounted.current) {
        initializePayment();
      }
    }, 100);

    // Cleanup
    return () => {
      isMounted.current = false;
      initializationStarted.current = false;

      if (dropinInstance.current) {
        try {
          dropinInstance.current.unmount();
        } catch (e) {}
        dropinInstance.current = null;
      }

      checkoutRef.current = null;
    };
  }, []);

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setCheckoutReady(false);

    // Cleanup
    if (dropinInstance.current) {
      try {
        dropinInstance.current.unmount();
      } catch (e) {}
      dropinInstance.current = null;
    }

    checkoutRef.current = null;

    const container = document.getElementById("adyen-checkout-container");
    if (container) container.innerHTML = "";

    if (window.AdyenCheckout) {
      delete window.AdyenCheckout;
    }

    document
      .querySelectorAll('script[src*="adyen.com"]')
      .forEach((el) => el.remove());
    document
      .querySelectorAll('link[href*="adyen.com"]')
      .forEach((el) => el.remove());

    isMounted.current = true;
    initializationStarted.current = false;

    setTimeout(() => {
      if (isMounted.current) {
        window.location.reload();
      }
    }, 800);
  };

  // Handle back
  const handleBackToDeposit = () => {
    navigate("/deposit");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="text-center max-w-md w-full p-8 bg-white rounded-2xl shadow-xl">
          <div className="relative inline-block mb-6">
            <RingLoader color="#3B82F6" size={80} />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-blue-200 border-t-blue-500 rounded-full"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-gray-700 font-semibold text-lg"
          >
            Initializing Payment...
          </motion.p>

          <p className="mt-2 text-gray-500 text-sm">Preparing secure payment form</p>

          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <FaShieldAlt className="text-blue-500" />
              <span className="text-sm font-medium">
                Environment: <span className="text-red-600 font-bold">LIVE</span>
              </span>
            </div>
            <p className="text-xs text-red-600 mt-2 font-medium">Real payments with real money</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-gray-200"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
            {error.includes("Domain") ? "Configuration Required" : "Payment Failed"}
          </h3>

          <div className="mb-4 text-center">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">LIVE</span>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-center font-medium text-red-700 whitespace-pre-line">{error}</div>
            <p className="text-red-600 text-sm text-center mt-2">No money has been charged</p>
          </div>

          <div className="flex flex-col gap-3">
            <motion.button
              onClick={handleRetry}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-md"
            >
              Retry Payment
            </motion.button>

            <motion.button
              onClick={handleBackToDeposit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              Back to Deposit
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main render - 100% COMPLETE
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToDeposit}
            className="flex items-center mb-6 text-gray-600 hover:text-gray-800 transition-colors group font-medium"
          >
            <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Deposit</span>
          </button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Card Payment</h1>
              <p className="text-gray-600">
                Pay {state?.currency || "USD"} {state?.amount ? parseFloat(state.amount).toFixed(2) : "0.00"}
              </p>
            </div>
            <div className="px-3 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-xs font-bold">LIVE</div>
          </div>
        </div>

        {/* Payment Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Amount</h3>
              <p className="text-sm text-gray-600">{state?.purpose || "Deposit"}</p>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {state?.currency || "USD"} {state?.amount ? parseFloat(state.amount).toFixed(2) : "0.00"}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm p-3 rounded-lg border bg-red-50 text-red-700 border-red-200">
            <FaShieldAlt className="text-red-500" />
            <span>Secure LIVE payment powered by Adyen</span>
          </div>

          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <FiAlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                You are making a <strong>real payment</strong> with real money.
                Please ensure all card details are correct.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 🔥 ADYEN CONTAINER - ALWAYS RENDERED */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 mb-6 adyen-payment-section"
        >
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Card Details</h3>
            <div className="flex space-x-1">
              <div className="w-10 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <div className="w-10 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
              <div className="w-10 h-6 bg-gradient-to-r from-red-600 to-red-700 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">AMEX</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* 👇 THIS CONTAINER MUST EXIST */}
            <div
              ref={containerRef}
              id="adyen-checkout-container"
              data-container-id="adyen-checkout-container"
              className="min-h-[220px] border-2 border-gray-200 rounded-xl p-4 bg-gray-50 hover:border-blue-300 transition-colors relative"
              style={{ minHeight: '220px' }}
            >
              {!checkoutReady && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <RingLoader color="#DC2626" size={40} className="mb-4" />
                  <p className="text-gray-600 text-sm">Loading payment form...</p>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <FaExclamationTriangle className="text-red-500 text-2xl mb-3" />
                  <p className="text-red-600 text-center text-sm mb-4">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-500">
                  <FaLock className="mr-2 text-red-500" />
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <FiShield className="mr-2 text-blue-500" />
                  <span>PCI DSS compliant</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Info */}
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center">
            <FiShield className="mr-2" />
            Live Payment Security
          </h4>
          <ul className="text-sm text-red-700 space-y-2">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">✓</span>
              <span>Card details encrypted and never stored</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">✓</span>
              <span>Adyen fraud detection system</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">✓</span>
              <span>3D Secure authentication</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-red-500">⚠️</span>
              <span><strong>Live Mode:</strong> Real money transactions</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">🌐</span>
              <span><strong>Domain:</strong> ourzap-v2.unlimitedremit.com</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-semibold text-gray-700">Adyen</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-medium">LIVE</span>
          </p>
          <p className="text-gray-400">ourzap-v2.unlimitedremit.com</p>
        </div>
      </div>
    </div>
  );
}