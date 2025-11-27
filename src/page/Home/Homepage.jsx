import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { RingLoader } from "react-spinners";

// Import real components
import NavigateSection from "../../components/Dashboard/Navigation/NavigateSection";
// import AccountSummary from "../../components/Dashboard/Account/AccountSummary/AccountSummary";

// Import real actions and selectors
import { fetchAccountDetails } from "./HomeSlice";
import {
  fetchUserProfile,
  fetchPartnerFxCurrencies,
} from "../../components/Dashboard/Header/headerSlice";
import { selectAuthToken } from "../../store/selectors";

// Import real selectors
import {
  selectAccounts,
  selectSelectedCurrency,
  selectAccountLoading,
  selectLastUpdated,
  selectHasFetchedAccount,
} from "./HomeSlice";

import {
  extractErrorMessage,
  SafeErrorDisplay,
} from "../../utils/errorHandling";

// ✅ LOADING CONTEXT
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
    [startLoading, stopLoading, isLoading]
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

// ✅ RING LOADER COMPONENT
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

// ✅ SAFE ARRAY UTILITIES
const safeArray = (data, fallback = []) => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (typeof data === "object" && !Array.isArray(data)) {
    if (data.accounts && Array.isArray(data.accounts)) return data.accounts;
    if (Object.keys(data).length > 0) return Object.values(data);
  }
  return fallback;
};

// 🎯 API CALL COORDINATION
let apiCallTracker = {
  accountDetails: { called: false, timestamp: null },
  userProfile: { called: false, timestamp: null },
  fxCurrencies: { called: false, timestamp: null },
};

const resetApiTracker = () => {
  apiCallTracker = {
    accountDetails: { called: false, timestamp: null },
    userProfile: { called: false, timestamp: null },
    fxCurrencies: { called: false, timestamp: null },
  };
};

// ✅ FIXED HOMEPAGE CONTENT
const HomepageContent = React.memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const customerId = localStorage.getItem("authcustomer_id");
  const bearertoken = localStorage.getItem("bearertoken");
  const authtoken = useSelector(selectAuthToken);

  // Redux Selectors
  const accounts = useSelector(selectAccounts);
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const accountLoading = useSelector(selectAccountLoading);
  const lastUpdated = useSelector(selectLastUpdated);
  const hasFetchedAccount = useSelector(selectHasFetchedAccount);

  // Header state selectors
  const { profileData, profileLoading, profileError } = useSelector(
    (state) => state.header
  );
  const hasFetchedProfile = useSelector(
    (state) => state.header.fetchStatus?.profile === "succeeded"
  );
  const partnerFxCurrencies = useSelector(
    (state) => state.header.partnerFxCurrencies
  );
  const hasFxData = useSelector((state) => state.header.hasFxData);

  // Local state
  const [textColor, setTextColor] = useState("#000000");
  const [componentError, setComponentError] = useState(null);
  const [emergencyStop, setEmergencyStop] = useState(false);

  // Refs for tracking
  const fetchCountRef = useRef(0);
  const initialFetchDoneRef = useRef(false);
  const apiCallsInitiated = useRef(false);

  // Use the LoadingContext
  const { isLoading: contextLoading } = useLoading();

  // ✅ FIXED: Optimized loading calculation
  const isLoading = useMemo(() => {
    const initialLoad = !hasFetchedAccount && customerId && authtoken;
    return accountLoading || initialLoad || contextLoading || profileLoading;
  }, [
    accountLoading,
    hasFetchedAccount,
    customerId,
    authtoken,
    contextLoading,
    profileLoading,
  ]);

  // Get currency options from accounts with safety checks - memoized
  const currencyOptions = useMemo(() => {
    const safeAccounts = safeArray(accounts);
    if (safeAccounts.length === 0) {
      return [];
    }
    return [...new Set(safeAccounts.map((account) => account.currency))].filter(
      Boolean
    );
  }, [accounts]);

  // 🎯 CENTRALIZED API CALLS EFFECT
  useEffect(() => {
    if (
      !customerId ||
      !authtoken ||
      !bearertoken ||
      apiCallsInitiated.current
    ) {
      return;
    }

    apiCallsInitiated.current = true;

    // 1. Fetch Account Details
    if (!apiCallTracker.accountDetails.called) {
      apiCallTracker.accountDetails.called = true;
      apiCallTracker.accountDetails.timestamp = new Date().toISOString();
      dispatch(fetchAccountDetails({ customerId, authtoken }));
    }

    // 2. Fetch User Profile (only if not already fetched)
    if (
      !apiCallTracker.userProfile.called &&
      !hasFetchedProfile &&
      !profileLoading
    ) {
      apiCallTracker.userProfile.called = true;
      apiCallTracker.userProfile.timestamp = new Date().toISOString();
      dispatch(fetchUserProfile({ customerId, bearertoken }));
    }

    // 3. Fetch FX Currencies (only if not already fetched)
    if (!apiCallTracker.fxCurrencies.called && !hasFxData) {
      apiCallTracker.fxCurrencies.called = true;
      apiCallTracker.fxCurrencies.timestamp = new Date().toISOString();
      dispatch(fetchPartnerFxCurrencies(bearertoken));
    }
  }, [
    customerId,
    authtoken,
    bearertoken,
    dispatch,
    hasFetchedProfile,
    profileLoading,
    hasFxData,
  ]);

  // 🎯 RETRY FAILED API CALLS
  useEffect(() => {
    if (!customerId || !authtoken || !bearertoken) return;

    const retryFailedCalls = () => {
      // Retry account details if not fetched after 5 seconds
      if (
        !hasFetchedAccount &&
        !accountLoading &&
        apiCallTracker.accountDetails.called
      ) {
        const timeSinceCall =
          Date.now() -
          new Date(apiCallTracker.accountDetails.timestamp).getTime();
        if (timeSinceCall > 5000) {
          dispatch(fetchAccountDetails({ customerId, authtoken }));
        }
      }

      // Retry profile if not fetched after 5 seconds
      if (
        !hasFetchedProfile &&
        !profileLoading &&
        apiCallTracker.userProfile.called
      ) {
        const timeSinceCall =
          Date.now() - new Date(apiCallTracker.userProfile.timestamp).getTime();
        if (timeSinceCall > 5000) {
          dispatch(fetchUserProfile({ customerId, bearertoken }));
        }
      }
    };

    const retryTimer = setTimeout(retryFailedCalls, 5000);
    return () => clearTimeout(retryTimer);
  }, [
    customerId,
    authtoken,
    bearertoken,
    dispatch,
    hasFetchedAccount,
    accountLoading,
    hasFetchedProfile,
    profileLoading,
  ]);

  // Setup background and text color - optimized
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

  // Redirect if no token - optimized
  useEffect(() => {
    if (!authtoken) {
      toast.info("Please log in to continue");
      navigate("/");
    }
  }, [authtoken, navigate]);

  // Set text color from localStorage - optimized
  useEffect(() => {
    const storedTextColor = localStorage.getItem("text_color");
    if (storedTextColor && storedTextColor !== textColor) {
      setTextColor(storedTextColor);
    }
  }, [textColor]);

  // Emergency stop check
  useEffect(() => {
    if (fetchCountRef.current > 5) {
      setEmergencyStop(true);
      toast.error("Too many loading attempts. Please refresh the page.");
    }
  }, [fetchCountRef.current]);

  // Reset emergency stop when auth changes
  useEffect(() => {
    if (authtoken && customerId) {
      setEmergencyStop(false);
      fetchCountRef.current = 0;
      initialFetchDoneRef.current = false;
      resetApiTracker();
      apiCallsInitiated.current = false;
    }
  }, [authtoken, customerId]);

  // Currency change handler - memoized
  const handleCurrencyChange = useCallback((currency) => {
    // This would dispatch setSelectedCurrency action
    console.log("Currency changed to:", currency);
  }, []);

  // Role check - determine if navigation should be shown - memoized
  const shouldShowNavigation = useMemo(() => {
    const isStaffLogin = localStorage.getItem("is_staff_login");
    const isOwnerLogin = localStorage.getItem("is_owner_login");

    console.log("Role check:", {
      isStaffLogin,
      isOwnerLogin,
      ownerRoleName: localStorage.getItem("owner_role_name"),
      ownerId: localStorage.getItem("owner_id"),
    });

    // Show navigation for regular customers (not staff or owner)
    const isStaff = isStaffLogin === "1";
    const isOwner = isOwnerLogin === "1";
    const isRegularCustomer = !isStaff && !isOwner;

    if (isRegularCustomer) {
      return true; // Regular customers always see navigation
    }

    // For staff, only show if they have admin privileges
    if (isStaff) {
      const staffRole = localStorage.getItem("staff_role") || "";
      return staffRole === "Administrator" || staffRole.includes("Admin");
    }

    // For owners, show navigation by default
    if (isOwner) {
      const ownerRoleName = localStorage.getItem("owner_role_name");
      // If owner role name is missing, empty, or null, show navigation
      if (
        !ownerRoleName ||
        ownerRoleName === "null" ||
        ownerRoleName === "undefined"
      ) {
        return true;
      }
      // If role name exists, check for admin privileges
      return (
        ownerRoleName === "Admin (Owner)" || ownerRoleName.includes("Admin")
      );
    }

    return false;
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

  // Reset function for emergency recovery
  const handleResetFetch = useCallback(() => {
    setEmergencyStop(false);
    fetchCountRef.current = 0;
    initialFetchDoneRef.current = false;
    resetApiTracker();
    apiCallsInitiated.current = false;

    // Small delay to allow state update
    setTimeout(() => {
      if (customerId && authtoken && bearertoken) {
        apiCallsInitiated.current = false;
      }
    }, 100);
  }, [customerId, authtoken, bearertoken]);

  if (componentError) {
    return (
      <SafeErrorDisplay
        error={componentError}
        className="flex items-center justify-center min-h-screen p-4"
      />
    );
  }

  // Show emergency recovery UI if stopped
  if (emergencyStop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">🛑</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Loading Issue Detected
          </h2>
          <p className="text-gray-600 mb-6">
            We detected too many loading attempts. This might be due to a
            temporary connection issue.
          </p>
          <div className="space-y-4">
            <button
              onClick={handleResetFetch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">
              <strong>Debug Info:</strong>
              <br />
              Account Details:{" "}
              {apiCallTracker.accountDetails.called ? "Called" : "Not Called"}
              <br />
              User Profile:{" "}
              {apiCallTracker.userProfile.called ? "Called" : "Not Called"}
              <br />
              FX Currencies:{" "}
              {apiCallTracker.fxCurrencies.called ? "Called" : "Not Called"}
              <br />
              Fetch Attempts: {fetchCountRef.current}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full screen loader */}
      <AnimatePresence>{isLoading && <FullScreenLoader />}</AnimatePresence>

      {/* Main container with proper z-index context */}
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
              Reset APIs
            </button>
          )}

          {/* Main content area */}
          <div className="p-2 mt-2 relative">
            <div className="flex flex-col lg:flex-row gap-4 w-full mx-auto relative">
              {/* Navigation Section - Conditionally rendered */}
              {shouldShowNavigation && (
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full lg:w-[28%] relative z-10"
                >
                  <NavigateSection
                    textColor={textColor}
                    selectedCurrencyCode={selectedCurrency}
                  />

                  {/* <div className="p-4 bg-yellow-100 rounded-lg">
                    Navigation temporarily disabled
                  </div> */}
                </motion.div>
              )}

              {/* Main Content Area */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`w-full relative ${
                  shouldShowNavigation ? "lg:w-[72%]" : "lg:w-full"
                }`}
                style={{
                  isolation: "auto",
                  zIndex: "auto",
                }}
              >
                {/* <AccountSummary
                  textColor={textColor}
                  onCurrencyChange={handleCurrencyChange}
                /> */}

                <div className="p-4 bg-blue-100 rounded-lg">
                  Account Summary temporarily disabled
                </div>
              </motion.div>
            </div>
          </div>

          {/* Debug information - only in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="fixed top-4 left-4 z-40 bg-black text-white text-xs p-2 rounded opacity-70">
              <div>Accounts: {safeArray(accounts).length}</div>
              <div>
                Navigation: {shouldShowNavigation ? "Visible" : "Hidden"}
              </div>
              <div>Currency: {selectedCurrency}</div>
              <div>Account Fetched: {hasFetchedAccount ? "Yes" : "No"}</div>
              <div>Profile Fetched: {hasFetchedProfile ? "Yes" : "No"}</div>
              <div>FX Data: {hasFxData ? "Yes" : "No"}</div>
              <div>Loading: {isLoading ? "Yes" : "No"}</div>
              <div>Emergency Stop: {emergencyStop ? "Yes" : "No"}</div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
});

HomepageContent.displayName = "HomepageContent";

// Main component that wraps with LoadingProvider
function Homepage() {
  return (
    <LoadingProvider>
      <HomepageContent />
    </LoadingProvider>
  );
}

export default React.memo(Homepage);