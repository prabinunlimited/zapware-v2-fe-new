// src/page/Home/Homepage.jsx - UPDATED VERSION WITH REFACTORED HOMESLICE
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { RingLoader } from "react-spinners";

// Import components
import AccountSummary from "../../components/Dashboard/Account/AccountSummary/AccountSummary";

// Import actions from refactored HomeSlice
import {
  fetchAccountDetails,
  fetchPartnerFxCurrencies,
  clearAllCache,
  selectAccountState,
  selectTransactionState,
} from "./HomeSlice";

// Import header actions
import { fetchUserProfile } from "../../components/Dashboard/Header/headerSlice";

// Import selectors
import { selectAuthToken } from "../../store/selectors";
import { selectHasFxData, selectPartnerFxCurrencies } from "./HomeSlice";

// Import utilities
import {
  extractErrorMessage,
  SafeErrorDisplay,
} from "../../utils/errorHandling";
import { centralizedApi } from "../../services/api";

// ============================================
// LOADING CONTEXT (Keep as is)
// ============================================
const LoadingContext = React.createContext();

const useLoading = () => {
  const context = React.useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

const LoadingProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }, []);

  const isLoading = loadingCount > 0;

  const value = useMemo(
    () => ({
      startLoading,
      stopLoading,
      isLoading,
    }),
    [startLoading, stopLoading, isLoading],
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

// ============================================
// LOADER COMPONENTS
// ============================================
const FullScreenLoader = React.memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-white bg-opacity-90 z-[10000] flex flex-col items-center justify-center"
  >
    <RingLoader color="#3B82F6" loading={true} size={80} speedMultiplier={1} />
    <p className="mt-4 text-gray-600 font-medium">
      Loading your account details...
    </p>
  </motion.div>
));

FullScreenLoader.displayName = "FullScreenLoader";

// ============================================
// SAFE ARRAY UTILITIES
// ============================================
const safeArray = (data, fallback = []) => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (typeof data === "object" && !Array.isArray(data)) {
    if (data.accounts && Array.isArray(data.accounts)) return data.accounts;
    if (data.account_details && Array.isArray(data.account_details))
      return data.account_details;
    if (Object.keys(data).length > 0) return Object.values(data);
  }
  return fallback;
};

// ============================================
// MAIN HOMEPAGE CONTENT
// ============================================
const HomepageContent = React.memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get authentication data
  const customerId = localStorage.getItem("authcustomer_id");
  const bearertoken = localStorage.getItem("bearertoken");
  const authtoken = useSelector(selectAuthToken);

  // ✅ Use refactored HomeSlice selectors
  const accountState = useSelector(selectAccountState);
  const transactionState = useSelector(selectTransactionState);
  const hasFxData = useSelector(selectHasFxData);
  const partnerFxCurrencies = useSelector(selectPartnerFxCurrencies);

  // Destructure account state for easier access
  const {
    accounts,
    selectedCurrency,
    accountLoading,
    lastUpdated,
    hasFetchedAccount,
    accountError,
  } = accountState;

  // Header state selectors
  const { profileData, profileLoading, profileError } = useSelector(
    (state) => state.header,
  );
  const hasFetchedProfile = useSelector(
    (state) => state.header.fetchStatus?.profile === "succeeded",
  );

  // Local state
  const [textColor, setTextColor] = useState("#000000");
  const [componentError, setComponentError] = useState(null);

  // ✅ Remove manual coordination refs - now handled by HomeSlice caching
  // const fetchCountRef = useRef(0);
  // const initialFetchDoneRef = useRef(false);
  // const apiCallsCoordinatedRef = useRef(false);

  // ✅ Simplified loading calculation - uses HomeSlice state
  const isLoading = useMemo(() => {
    return accountLoading && !hasFetchedAccount;
  }, [accountLoading, hasFetchedAccount]);

  // Get currency options from accounts - memoized
  const currencyOptions = useMemo(() => {
    const safeAccounts = safeArray(accounts);
    if (safeAccounts.length === 0) {
      return [];
    }
    return [...new Set(safeAccounts.map((account) => account.currency))].filter(
      Boolean,
    );
  }, [accounts]);

  // ============================================
  // ✅ OPTIMIZED: SINGLE COORDINATED API CALL WITH CACHING - FIXED VERSION
  // ============================================
  useEffect(() => {
    // Early returns to prevent unnecessary executions
    if (!customerId || !authtoken || !bearertoken) {
      console.log("⏳ Homepage: Missing auth data, skipping fetch");
      return;
    }

    console.log("🚀 Homepage: Checking data needs for customer", customerId);

    // ✅ FIX: Just dispatch without trying to handle promises
    if (!hasFetchedAccount && !accountLoading) {
      console.log("📊 Homepage: Fetching account details (cached or new)");
      dispatch(fetchAccountDetails({ customerId, authtoken }));
    } else {
      console.log("📊 Homepage: Accounts already fetched or loading", {
        hasFetchedAccount,
        accountLoading,
      });
    }

    // Profile fetch
    const hasProfileData =
      profileData?.first_name || localStorage.getItem("firstName");
    if (!hasFetchedProfile && !profileLoading && !hasProfileData) {
      console.log("👤 Homepage: Fetching user profile");
      dispatch(fetchUserProfile({ customerId, bearertoken }));
    }

    // FX fetch
    if (!hasFxData) {
      console.log("💱 Homepage: Fetching FX currencies");
      dispatch(fetchPartnerFxCurrencies(bearertoken));
    }
  }, [
    customerId,
    authtoken,
    bearertoken,
    hasFetchedAccount,
    accountLoading,
    hasFetchedProfile,
    profileLoading,
    profileData,
    hasFxData,
    dispatch,
  ]);

  // ============================================
  // TEXT COLOR AND STYLES
  // ============================================
  useEffect(() => {
    const partnerBackgroundClasses = [
      "bg-yellow-500",
      "bg-blue-500",
      "bg-red-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-yellow-400",
      "bg-blue-400",
      "bg-red-400",
      "bg-green-400",
      "bg-purple-400",
      "bg-indigo-400",
      "bg-pink-400",
      "bg-orange-400",
      "bg-teal-400",
    ];

    // Cleanup previous styles
    document.body.classList.remove(...partnerBackgroundClasses);
    document.documentElement.classList.remove(...partnerBackgroundClasses);
    document.body.style.backgroundColor = "";
    document.body.style.background = "";
    document.documentElement.style.backgroundColor = "";
    document.documentElement.style.background = "";

    // Apply new styles
    document.body.classList.add("bg-gray-100");
    document.documentElement.classList.add("bg-gray-100");
    document.documentElement.style.setProperty("--text-color", textColor);
    document.body.style.color = textColor;

    return () => {
      document.body.classList.remove("bg-gray-100");
      document.documentElement.classList.remove("bg-gray-100");
      document.body.style.color = "";
      document.documentElement.style.removeProperty("--text-color");
    };
  }, [textColor]);

  // Redirect if no token
  useEffect(() => {
    if (!authtoken) {
      toast.info("Please log in to continue");
      navigate("/");
    }
  }, [authtoken, navigate]);

  // Set text color from localStorage
  useEffect(() => {
    const storedTextColor = localStorage.getItem("text_color");
    if (storedTextColor && storedTextColor !== textColor) {
      setTextColor(storedTextColor);
    }
  }, [textColor]);

  // ============================================
  // DEBUG LOGGING (Reduced noise)
  // ============================================
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Homepage State:", {
        customerId,
        authtoken: authtoken ? "Present" : "Missing",
        hasFetchedAccount,
        accountLoading,
        accountsCount: safeArray(accounts).length,
        hasFetchedProfile,
        profileLoading,
        hasFxData,
        transactionCount: transactionState.transactions?.length || 0,
        transactionLoading: transactionState.loading,
      });
    }
  }, [
    customerId,
    authtoken,
    hasFetchedAccount,
    accountLoading,
    accounts,
    hasFetchedProfile,
    profileLoading,
    hasFxData,
    transactionState.transactions,
    transactionState.loading,
  ]);

  // Currency change handler
  const handleCurrencyChange = useCallback((currency) => {
    console.log("💰 Currency changed to:", currency);
    // This can trigger transaction refresh if needed
  }, []);

  // Error boundary effect
  useEffect(() => {
    const handleError = (error) => {
      console.error("Global error caught:", error);
      setComponentError(error);
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  // ============================================
  // RESET FUNCTION FOR EMERGENCY RECOVERY
  // ============================================
  const handleResetFetch = useCallback(() => {
    console.log("🔄 Homepage: Manual reset triggered");

    // Clear HomeSlice cache using refactored action
    dispatch(clearAllCache());

    // Clear centralizedApi cache
    centralizedApi.clearAllCache();

    // Small delay to allow state update
    setTimeout(() => {
      if (customerId && authtoken && bearertoken) {
        // Re-fetch all data
        dispatch(fetchAccountDetails({ customerId, authtoken }));
        dispatch(fetchUserProfile({ customerId, bearertoken }));
        dispatch(fetchPartnerFxCurrencies(bearertoken));
      }
    }, 100);
  }, [customerId, authtoken, bearertoken, dispatch]);

  // ============================================
  // ERROR AND LOADING STATES
  // ============================================
  if (componentError) {
    return (
      <SafeErrorDisplay
        error={componentError}
        className="flex items-center justify-center min-h-screen p-4"
      />
    );
  }

  // Show error state if account fetch failed
  if (accountError && !hasFetchedAccount && !accountLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Error Loading Accounts
          </h2>
          <p className="text-gray-600 mb-6">{accountError}</p>
          <button
            onClick={handleResetFetch}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <>
      {/* Full screen loader */}
      <AnimatePresence>{isLoading && <FullScreenLoader />}</AnimatePresence>

      {/* Main container */}
      <div className="relative z-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gray-100 relative"
          style={{ color: textColor }}
        >
          {/* Last updated indicator */}
          {lastUpdated && (
            <div
              className="fixed bottom-4 right-4 z-40 bg-gray-800 text-xs px-3 py-1 rounded-lg opacity-70"
              style={{ color: "#ffffff" }}
            >
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}

          {/* Manual reset button for debugging */}
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={handleResetFetch}
              className="fixed top-4 right-4 z-50 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded opacity-70"
            >
              Reset All Data
            </button>
          )}

          {/* Cache Debug Panel */}
          {process.env.NODE_ENV === "development" && (
            <div className="fixed top-4 left-4 z-50 bg-green-600 text-white p-3 rounded-lg text-xs max-w-xs">
              <div className="font-bold mb-2">Data Cache Status</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Accounts:</span>
                  <span>
                    {hasFetchedAccount
                      ? "✅ Cached"
                      : accountLoading
                        ? "🔄 Loading"
                        : "❌ Not loaded"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Profile:</span>
                  <span>
                    {hasFetchedProfile
                      ? "✅ Cached"
                      : profileLoading
                        ? "🔄 Loading"
                        : "❌ Not loaded"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>FX Rates:</span>
                  <span>
                    {hasFxData
                      ? `✅ ${partnerFxCurrencies.length} rates`
                      : "❌ Not loaded"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Transactions:</span>
                  <span>
                    {transactionState.transactions?.length > 0
                      ? `✅ ${transactionState.transactions.length} records`
                      : "❌ Not loaded"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleResetFetch}
                className="mt-2 bg-red-500 px-2 py-1 rounded text-xs w-full hover:bg-red-600 transition-colors"
              >
                Clear Cache & Reload
              </button>
            </div>
          )}

          {/* Main content area */}
          <div className="p-2 mt-2 relative">
            <div className="flex w-full mx-auto relative">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full relative"
              >
                <AccountSummary
                  textColor={textColor}
                  onCurrencyChange={handleCurrencyChange}
                />
              </motion.div>
            </div>
          </div>

          {/* Debug information */}
          {process.env.NODE_ENV === "development" && (
            <div className="fixed bottom-4 left-4 z-40 bg-black text-white text-xs p-2 rounded opacity-70">
              <div>Accounts: {safeArray(accounts).length}</div>
              <div>Currency: {selectedCurrency || "None"}</div>
              <div>Account Fetched: {hasFetchedAccount ? "Yes" : "No"}</div>
              <div>Profile Fetched: {hasFetchedProfile ? "Yes" : "No"}</div>
              <div>FX Data: {hasFxData ? "Yes" : "No"}</div>
              <div>Loading: {isLoading ? "Yes" : "No"}</div>
              <div>
                Transactions: {transactionState.transactions?.length || 0}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
});

HomepageContent.displayName = "HomepageContent";

// ============================================
// MAIN HOMEPAGE COMPONENT
// ============================================
function Homepage() {
  return (
    <LoadingProvider>
      <HomepageContent />
    </LoadingProvider>
  );
}

export default React.memo(Homepage);
