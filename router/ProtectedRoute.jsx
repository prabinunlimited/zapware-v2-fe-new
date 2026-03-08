// src/router/ProtectedRoute.jsx
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
import { FiMenu, FiX } from "react-icons/fi"; // Better icons from react-icons

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

  // NEW: State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await dispatch(syncLocalStorageState());

        // ✅ Additional validation
        const storedToken = localStorage.getItem("authtoken");
        const storedCustomerId = localStorage.getItem("authcustomer_id");

        // ✅ If we have valid localStorage but Redux is out of sync, force update
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
        // Error handling without console logging
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

  // ✅ Show loading while initializing - AFTER ALL HOOKS
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
  if (routeCustomerId && routeCustomerId !== customerId.toString()) {
    return <Navigate to={`/home/${customerId}`} replace />;
  }

  // ✅ Check if user is beneficiary (from localStorage)
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
    // If beneficiary is trying to access beneficiary portal routes through ProtectedRoute
    // (shouldn't happen with new router structure, but just in case)
    if (isBeneficiaryPortalRoute) {
      // Don't handle beneficiary portal routes here - they have their own layout
      // Just allow the navigation to happen (will be handled by BeneficiaryLayout)
      return <Outlet />;
    }

    // If beneficiary tries to access any CUSTOMER route, redirect to beneficiary portal
    return <Navigate to={`/beneficiary/homepage/${beneficiaryId}`} replace />;
  }

  // ✅ Check if NON-beneficiary is trying to access beneficiary portal
  if (isBeneficiaryPortalRoute && !isBeneficiaryUser) {
    // Clear any stray beneficiary data
    localStorage.removeItem("beneficaryLogin");
    localStorage.removeItem("beneficaryId");
    localStorage.removeItem("beneficiaryId");
    localStorage.removeItem("is_beneficiary");

    // Redirect to customer home
    return <Navigate to={`/home/${customerId}`} replace />;
  }

  // ✅ REGULAR CUSTOMER ACCESS - Fixed header and footer with side-by-side main content
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Always full width at the top */}
      <Header customerId={routeCustomerId || customerId} />

      {/* Mobile Menu Button - Positioned below header */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-20 left-4 z-40 lg:hidden bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200 border border-gray-200"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? (
          <FiX className="w-5 h-5 text-gray-700" />
        ) : (
          <FiMenu className="w-5 h-5 text-gray-700" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop with blur effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
              style={{ top: "64px" }} // Start below header (adjust based on your header height)
              transition={{ duration: 0.2 }}
            />

            {/* Slide-out Navigation - Below header */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed left-0 h-[calc(100%-64px)] w-72 bg-white/95 backdrop-blur-md z-40 lg:hidden overflow-y-auto shadow-2xl"
              style={{ top: "64px" }} // Start below header
            >
              <div className="px-4 py-6">
                <NavigateSection customerId={routeCustomerId || customerId} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area - Navigation and Outlet side by side */}
      <div className="flex-1 flex min-h-0 pt-16">
        {/* Sidebar Navigation - Only visible on large screens */}
        <div className="hidden lg:block w-[28%] max-w-2xl overflow-y-auto border-r border-gray-200 bg-white">
          <NavigateSection customerId={routeCustomerId || customerId} />
        </div>

        {/* Main Content - Takes remaining width */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 md:p-6">
            <Outlet /> {/* This will render Homepage.js content */}
          </div>
        </div>
      </div>

      {/* Footer - Always full width at the bottom */}
      <Footer />
    </div>
  );
};

export default ProtectedRoute;
