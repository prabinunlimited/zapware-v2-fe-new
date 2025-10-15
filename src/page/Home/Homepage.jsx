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

import NavigateSection from "../../components/Dashboard/Navigation/NavigateSection";
import AccountSummary from "../../components/Dashboard/Account/AccountSummary/AccountSummary";

// Import from the same account slice file
import {
  setSelectedCurrency,
  selectAccounts,
  selectSelectedCurrency,
  selectAccountLoading,
  selectLastUpdated,
  selectHasFetchedAccount,
  useAccountData,
} from "../../components/Dashboard/Account/AccountSummary/AccountSlice";

// ✅ FIXED: Removed duplicate import and only use selectAuthToken
import {selectAuthToken } from "../../store/selectors";
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

// ✅ FULL SCREEN LOADER
const FullScreenLoader = React.memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-white bg-opacity-90 z-[10000] flex flex-col items-center justify-center"
  >
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <svg
          className="w-8 h-8 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
    </div>
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

// ✅ OPTIMIZED HOMEPAGE CONTENT
const HomepageContent = React.memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const customerId = localStorage.getItem("authcustomer_id");
  
  // ✅ FIXED: All selectToken references replaced with selectAuthToken
  const authtoken = useSelector(selectAuthToken);
  const bearertoken = useSelector(selectAuthToken);

  // Redux Selectors with optimization
  const accounts = useSelector(selectAccounts);
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const accountLoading = useSelector(selectAccountLoading);
  const lastUpdated = useSelector(selectLastUpdated);
  const hasFetchedAccount = useSelector(selectHasFetchedAccount);

  // Local state
  const [textColor, setTextColor] = useState("#000000");
  const [componentError, setComponentError] = useState(null);

  // Role values with refs to prevent re-renders
  const roleRefs = useRef({
    isOwnerLogin: localStorage.getItem("is_owner_login") || "0",
    ownerRoleName: localStorage.getItem("owner_role_name") || "",
    isStaffLogin: localStorage.getItem("is_staff_login") || "0",
    staffRole: localStorage.getItem("staff_role") || "",
  });

  // Use the LoadingContext
  const { isLoading: contextLoading } = useLoading();

  // Use custom account data hook
  const { fetchAccountData, shouldFetch } = useAccountData();

  console.log("🔍 Homepage component rendering", {
    customerId,
    accountsCount: safeArray(accounts).length,
    hasFetchedAccount,
    shouldFetch,
  });

  // ✅ FIXED: Optimized loading calculation
  const isLoading = useMemo(() => {
    const shouldLoad = !hasFetchedAccount && customerId && authtoken;
    return accountLoading || contextLoading || shouldLoad;
  }, [
    accountLoading,
    contextLoading,
    hasFetchedAccount,
    customerId,
    authtoken,
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

  // Fetch account details when component mounts - OPTIMIZED
  useEffect(() => {
    if (shouldFetch) {
      console.log("🚀 Initial account data fetch triggered");
      fetchAccountData();
    }
  }, [shouldFetch, fetchAccountData]);

  // Currency change handler - memoized
  const handleCurrencyChange = useCallback(
    (currency) => {
      dispatch(setSelectedCurrency(currency));
    },
    [dispatch]
  );

  // Role check - determine if navigation should be shown - memoized
  const shouldShowNavigation = useMemo(() => {
    const isStaffLogin = localStorage.getItem("is_staff_login");
    const isOwnerLogin = localStorage.getItem("is_owner_login");

    console.log("🔍 Role Check Debug:", {
      isStaffLogin,
      isOwnerLogin,
      staffRole: localStorage.getItem("staff_role"),
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

    // ✅ FIX: For owners, show navigation by default (most owners should see it)
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
      console.error("❌ HomepageContent error:", error);
      setComponentError(error);
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (componentError) {
    return (
      <SafeErrorDisplay
        error={componentError}
        className="flex items-center justify-center min-h-screen p-4"
      />
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
                <AccountSummary
                  textColor={textColor}
                  onCurrencyChange={handleCurrencyChange}
                />
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
              <div>Fetched: {hasFetchedAccount ? "Yes" : "No"}</div>
              <div>Loading: {isLoading ? "Yes" : "No"}</div>
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