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
              })
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
      `/${customerId}/`
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
    console.log("🔍 BENEFICIARY DETECTED IN PROTECTED ROUTE:", {
      beneficiaryId,
      currentPath: location.pathname,
      isBeneficiaryPortalRoute,
    });

    // If beneficiary is trying to access beneficiary portal routes through ProtectedRoute
    // (shouldn't happen with new router structure, but just in case)
    if (isBeneficiaryPortalRoute) {
      // Don't handle beneficiary portal routes here - they have their own layout
      // Just allow the navigation to happen (will be handled by BeneficiaryLayout)
      return <Outlet />;
    }

    // If beneficiary tries to access any CUSTOMER route, redirect to beneficiary portal
    console.log("🔄 Redirecting beneficiary to their portal");
    return <Navigate to={`/beneficiary/homepage/${beneficiaryId}`} replace />;
  }

  // ✅ Check if NON-beneficiary is trying to access beneficiary portal
  if (isBeneficiaryPortalRoute && !isBeneficiaryUser) {
    console.log("❌ Non-beneficiary trying to access beneficiary portal");

    // Clear any stray beneficiary data
    localStorage.removeItem("beneficaryLogin");
    localStorage.removeItem("beneficaryId");
    localStorage.removeItem("beneficiaryId");
    localStorage.removeItem("is_beneficiary");

    // Redirect to customer home
    return <Navigate to={`/home/${customerId}`} replace />;
  }

  // ✅ REGULAR CUSTOMER ACCESS - Show customer layout
  return (
    <div className="min-h-screen flex flex-col">
      {/* Customer Header */}
      <Header customerId={routeCustomerId || customerId} />

      <div className="flex-1 pt-16">
        <Outlet />
      </div>

      {/* Customer Footer */}
      <Footer />
    </div>
  );
};

export default ProtectedRoute;
