// src/router/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { Outlet, Navigate, useLocation, useParams } from "react-router-dom";
import { 
  selectAuthToken, 
  selectCustomerId, 
  selectIsInitialized, 
  selectIsAuthenticated 
} from "../src/store/selectors";
import { syncLocalStorageState, setAuthState } from '../src/features/Auth/slices/authSlice';
import Footer from "../src/components/Dashboard/Footer/Footer";
import Header from '../src/components/Dashboard/Header/Header';

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

  console.log("🔍 [ProtectedRoute] Debug:", {
    token: !!token,
    customerId,
    isAuthenticated,
    isInitialized,
    routeCustomerId,
    fullPath: location.pathname,
    isChecking
  });

  useEffect(() => {
    console.log('🔄 [ProtectedRoute] useEffect running');

    const initializeAuth = async () => {
      try {
        console.log('🔄 [ProtectedRoute] Calling syncLocalStorageState');
        await dispatch(syncLocalStorageState());

        // ✅ Additional validation
        const storedToken = localStorage.getItem("authtoken");
        const storedCustomerId = localStorage.getItem("authcustomer_id");

        console.log('📦 [ProtectedRoute] LocalStorage validation:', {
          storedToken: !!storedToken,
          storedCustomerId,
          isValidToken: storedToken && storedToken !== "undefined" && storedToken !== "null",
          isValidCustomerId: storedCustomerId && storedCustomerId !== "undefined" && storedCustomerId !== "null"
        });

        // ✅ If we have valid localStorage but Redux is out of sync, force update
        if (storedToken && storedCustomerId && storedCustomerId !== "undefined" && storedCustomerId !== "null") {
          if (!token || !customerId) {
            console.log('🔄 [ProtectedRoute] Force updating Redux state from localStorage');
            dispatch(setAuthState({
              token: storedToken,
              customerId: storedCustomerId,
              isAuthenticated: true
            }));
          }
        }

      } catch (error) {
        console.error('❌ [ProtectedRoute] Auth initialization error:', error);
      } finally {
        setIsChecking(false);
        console.log('✅ [ProtectedRoute] Auth initialization complete');
      }
    };

    initializeAuth();
  }, [dispatch, token, customerId]);

  // ✅ Show loading while initializing - AFTER ALL HOOKS
  if (!isInitialized || isChecking) {
    console.log('⏳ [ProtectedRoute] Still loading, showing spinner');
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
    console.log('🔒 [ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Check for "undefined" in URL path
  if (location.pathname.includes('/undefined/')) {
    console.log('🔄 [ProtectedRoute] Replacing undefined in URL with customerId:', customerId);
    const correctedPath = location.pathname.replace('/undefined/', `/${customerId}/`);
    return <Navigate to={correctedPath} replace />;
  }

  // Validate route customerId matches stored customerId
  if (routeCustomerId && routeCustomerId !== customerId.toString()) {
    console.log('⚠️ [ProtectedRoute] Customer ID mismatch, redirecting to correct customer page');
    return <Navigate to={`/home/${customerId}`} replace />;
  }

  console.log("✅ [ProtectedRoute] Authentication successful, rendering outlet");

  return (
    <div className="min-h-screen flex flex-col">
      <Header customerId={routeCustomerId || customerId} />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default ProtectedRoute;