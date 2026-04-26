// src/router/ProtectedRoute.jsx - CLEAN VERSION

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Outlet, Navigate, useLocation, useParams } from "react-router-dom";
import {
  selectAuthToken,
  selectCustomerId,
  selectIsInitialized,
  selectIsAuthenticated,
} from "../src/store/selectors";
import {
  syncLocalStorageState,
  setAuthState,
  clearAuthState,
} from "../src/features/Auth/slices/authSlice";
import Footer from "../src/components/Dashboard/Footer/Footer";
import Header from "../src/components/Dashboard/Header/Header";
import NavigateSection from "../src/components/Dashboard/Navigation/NavigateSection";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";

const ProtectedRoute = () => {
  // ✅ ALL HOOKS AT THE TOP - BEFORE ANY CONDITIONALS
  const token = useSelector(selectAuthToken);
  const customerId = useSelector(selectCustomerId);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const location = useLocation();
  const dispatch = useDispatch();
  const [isChecking, setIsChecking] = useState(true);
  const routeParams = useParams();
  const routeCustomerId = routeParams.customerId;

  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Helper function to determine if user should go to remittance homepage
  const shouldRedirectToRemittanceHome = () => {
    const isRemittanceOnlyCustomer =
      localStorage.getItem("isRemittanceOnlyCustomer") === "Y";
    const partnerId = localStorage.getItem("whitelabelledpartnerid");
    const REMITTANCE_ONLY_PARTNER_IDS = ["4", "8"];
    const isRemittancePartner = REMITTANCE_ONLY_PARTNER_IDS.includes(partnerId);

    return isRemittanceOnlyCustomer || isRemittancePartner;
  };

  // Helper function to get the correct homepage path
  const getHomepagePath = (customerId) => {
    return shouldRedirectToRemittanceHome()
      ? `/homeremit/${customerId}`
      : `/home/${customerId}`;
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await dispatch(syncLocalStorageState());

        const storedToken = localStorage.getItem("authtoken");
        const storedCustomerId = localStorage.getItem("authcustomer_id");

        if (
          storedToken &&
          storedCustomerId &&
          storedCustomerId !== "undefined" &&
          storedCustomerId !== "null"
        ) {
          if (!token || !customerId) {
            dispatch(
              setAuthState({
                token: storedToken,
                customerId: storedCustomerId,
                isAuthenticated: true,
              }),
            );
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsChecking(false);
      }
    };

    initializeAuth();
  }, [dispatch, token, customerId]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // ✅ Show loading while initializing
  if (!isInitialized || isChecking) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Checking authentication...</span>
        </div>
        <Footer />
      </div>
    );
  }

  // ✅ Use the enhanced isAuthenticated selector
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Check for "undefined" in URL path
  if (location.pathname.includes("/undefined/")) {
    const correctedPath = location.pathname.replace(
      "/undefined/",
      `/${customerId}/`,
    );
    return <Navigate to={correctedPath} replace />;
  }

  // Validate route customerId matches stored customerId
  if (routeCustomerId && routeCustomerId !== customerId?.toString()) {
    const redirectPath = getHomepagePath(customerId);
    return <Navigate to={redirectPath} replace />;
  }

  // ✅ Check if user is beneficiary
  const isBeneficiaryUser = localStorage.getItem("beneficaryLogin") === "Y";
  const beneficiaryId =
    localStorage.getItem("beneficaryId") ||
    localStorage.getItem("beneficiaryId");

  // ✅ Check if current route is beneficiary portal route
  const isBeneficiaryPortalRoute =
    location.pathname.startsWith("/beneficiary/") ||
    location.pathname.startsWith("/benefprofile/") ||
    location.pathname.startsWith("/benefhomepage/");

  // ✅ SPECIAL HANDLING FOR BENEFICIARIES
  if (isBeneficiaryUser && beneficiaryId) {
    if (isBeneficiaryPortalRoute) {
      return <Outlet />;
    }
    const redirectPath = `/beneficiary/homepage/${beneficiaryId}`;
    return <Navigate to={redirectPath} replace />;
  }

  // ✅ Check if NON-beneficiary is trying to access beneficiary portal
  if (isBeneficiaryPortalRoute && !isBeneficiaryUser) {
    localStorage.removeItem("beneficaryLogin");
    localStorage.removeItem("beneficaryId");
    localStorage.removeItem("beneficiaryId");
    localStorage.removeItem("is_beneficiary");
    const redirectPath = getHomepagePath(customerId);
    return <Navigate to={redirectPath} replace />;
  }

  const headerHeight = 64; // Header height in pixels

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - Fixed at top */}
      <Header customerId={routeCustomerId || customerId} />

      {/* Mobile Menu Button - Only show on mobile when menu is closed */}
      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed top-20 left-4 z-40 lg:hidden bg-white rounded-full p-3 shadow-lg border border-gray-200"
          aria-label="Open menu"
        >
          <FiMenu className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Mobile Menu Overlay - NO EXTRA CONTENT, JUST NAVIGATION */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              style={{ top: `${headerHeight}px` }}
              transition={{ duration: 0.2 }}
            />

            {/* Slide-out Navigation - Only navigation content, no extra buttons */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 w-72 bg-white z-40 lg:hidden shadow-2xl"
              style={{
                top: `${headerHeight}px`,
                bottom: 0,
                height: `calc(100vh - ${headerHeight}px)`,
              }}
            >
              {/* Only NavigateSection - no extra header or close button */}
              <NavigateSection customerId={routeCustomerId || customerId} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="hidden lg:block w-[280px] xl:w-[320px] flex-shrink-0 overflow-hidden border-r border-gray-200 bg-white">
            <div className="h-full overflow-y-auto">
              <NavigateSection customerId={routeCustomerId || customerId} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProtectedRoute;