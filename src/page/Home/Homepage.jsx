import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  createContext,
  useContext
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import NavigateSection from '../../components/Dashboard/Navigation/NavigateSection';
import AccountSummary from '../../components/Dashboard/Account/AccountSummary/AccountSummary'

import {
  fetchAccountDetails,
  setSelectedCurrency,
  selectAccounts,
  selectSelectedCurrency,
  selectAccountLoading,
  selectLastUpdated,
} from "../../components/Dashboard/Account/AccountSummary/AccountSlice"

import { selectAuthToken, selectBearerToken } from '../../features/Auth/slices/authSlice';
import { extractErrorMessage, SafeErrorDisplay } from '../../utils/errorHandling';

// Create LoadingContext inside this file
const LoadingContext = createContext();

// Custom hook for using the loading context
const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Loading Provider Component
const LoadingProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }, []);

  const isLoading = loadingCount > 0;

  const value = useMemo(() => ({
    startLoading,
    stopLoading,
    isLoading,
  }), [startLoading, stopLoading, isLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

const FullScreenLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center"
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
);

// Inner component that uses the LoadingContext
function HomepageContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const customerId = localStorage.getItem("authcustomer_id");
  const authtoken = useSelector(selectAuthToken);
  const bearertoken = useSelector(selectBearerToken);

  // Redux Selectors with safety checks
  const accounts = useSelector(selectAccounts) || [];
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const accountLoading = useSelector(selectAccountLoading);
  const lastUpdated = useSelector(selectLastUpdated);

  // Local state
  const [textColor, setTextColor] = useState("#000000");

  // Fix: Provide proper defaults for role values
  const isOwnerLogin = useRef(localStorage.getItem("is_owner_login") || "0").current;
  const ownerRoleName = useRef(localStorage.getItem("owner_role_name") || "").current;
  const isStaffLogin = useRef(localStorage.getItem("is_staff_login") || "0").current;
  const staffRole = useRef(localStorage.getItem("staff_role") || "").current;

  // Use the LoadingContext
  const { isLoading: contextLoading } = useLoading();

  console.log("🔍 Homepage component rendering");
  console.log("🔍 customerId from localStorage:", customerId);
  console.log("🔍 Accounts data:", accounts);
  console.log("🔍 Accounts type:", typeof accounts);
  console.log("🔍 Is accounts array?", Array.isArray(accounts));
  console.log("🔍 Role Debug:", {
    isStaffLogin,
    isOwnerLogin,
    staffRole,
    ownerRoleName
  });

  // Check if any component is still loading
  const isLoading = useMemo(
    () => accountLoading || contextLoading,
    [accountLoading, contextLoading]
  );

  // Get currency options from accounts with safety checks
  const currencyOptions = useMemo(() => {
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return [];
    }
    return [...new Set(accounts.map(account => account.currency))].filter(Boolean);
  }, [accounts]);

  // Setup background and text color
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

    document.body.classList.remove(...partnerBackgroundClasses);
    document.documentElement.classList.remove(...partnerBackgroundClasses);
    document.body.style.backgroundColor = "";
    document.body.style.background = "";
    document.documentElement.style.backgroundColor = "";
    document.documentElement.style.background = "";

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
    if (storedTextColor) {
      setTextColor(storedTextColor);
    }
  }, []);

  // Currency change handler
  const handleCurrencyChange = useCallback((currency) => {
    dispatch(setSelectedCurrency(currency));
  }, [dispatch]);

  // Role check - determine if navigation should be shown - FIXED VERSION
  const shouldShowNavigation = useMemo(() => {
    console.log("🔍 Navigation Debug:", {
      accounts: accounts,
      accountsLength: accounts.length,
      isStaffLogin,
      isOwnerLogin,
      staffRole,
      ownerRoleName
    });

    // Check role-based permissions with proper defaults
    const hasNavigationPermission = (
      (isStaffLogin === "0" && isOwnerLogin === "0") || // Regular customer
      (isStaffLogin === "1" && staffRole === "Administrator") || // Admin staff
      (isOwnerLogin === "1" && ownerRoleName === "Admin (Owner)") // Admin owner
    );

    console.log("🔍 Navigation Decision:", {
      hasNavigationPermission,
      finalDecision: hasNavigationPermission
    });

    // Show navigation if user has permission
    // Don't depend on accounts being available since navigation handles its own logic
    return hasNavigationPermission;
  }, [isStaffLogin, isOwnerLogin, staffRole, ownerRoleName]);

  // ✅ FIX: Add error boundary for this component
  const [componentError, setComponentError] = useState(null);

  if (componentError) {
    return <SafeErrorDisplay error={componentError} />;
  }

  return (
    <>
      {/* Full screen loader */}
      <AnimatePresence>{isLoading && <FullScreenLoader />}</AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gray-100"
        style={{ color: textColor }}
      >
        {/* Last updated indicator */}
        {lastUpdated && (
          <div
            className="fixed bottom-4 right-4 z-30 bg-gray-800 text-xs px-3 py-1 rounded-lg opacity-70"
            style={{ color: "#ffffff" }}
          >
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}

        <div className="p-2 mt-2">
          <div className="flex flex-col lg:flex-row gap-4 w-full max-w-[2100px] mx-auto">
            {/* Navigation Section - Conditionally rendered */}
            {shouldShowNavigation && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full lg:w-[28%]"
              >
                <NavigateSection
                  textColor={textColor}
                />
              </motion.div>
            )}

            {/* Main Content Area */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`w-full ${shouldShowNavigation ? 'lg:w-[72%]' : 'lg:w-full'}`}
            >
              <AccountSummary
                textColor={textColor}
                onCurrencyChange={handleCurrencyChange}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Main component that wraps with LoadingProvider
function Homepage() {
  return (
    <LoadingProvider>
      <HomepageContent />
    </LoadingProvider>
  );
}

export default Homepage;