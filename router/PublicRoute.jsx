// src/router/PublicRoute.jsx
import { useSelector, useDispatch } from "react-redux";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { 
  selectAuthToken, 
  selectCustomerId, 
  selectIsInitialized 
} from "../src/store/selectors";
import { clearAuthState } from "../src/features/Auth/slices/authSlice"; // Import the clear action

const PublicRoute = () => {
  const token = useSelector(selectAuthToken);
  const customerId = useSelector(selectCustomerId);
  const isInitialized = useSelector(selectIsInitialized);
  const location = useLocation();
  const dispatch = useDispatch();

  console.log('🔍 [PublicRoute] Raw values:', {
    rawToken: token,
    rawCustomerId: customerId,
    tokenType: typeof token,
    customerIdType: typeof customerId
  });

  console.log('🔍 [PublicRoute] localStorage vs Redux:', {
    localStorageToken: localStorage.getItem("authtoken"),
    reduxToken: token,
    localStorageCustomerId: localStorage.getItem("authcustomer_id"),
    reduxCustomerId: customerId
  });

  // Show nothing while initializing
  if (!isInitialized) {
    console.log('⏳ [PublicRoute] Still initializing, returning null');
    return null;
  }

  // FIX: Clear inconsistent auth state - customerId without token
  const hasCustomerIdButNoToken = !token && customerId && customerId !== "undefined" && customerId !== "null";
  if (hasCustomerIdButNoToken) {
    console.log('🔄 [PublicRoute] Clearing inconsistent auth state: customerId exists but no token');
    dispatch(clearAuthState());
    // Don't return here, let the component continue to render
  }

  // Define routes that should remain public even when authenticated
  const alwaysPublicRoutes = [
    '/selectaccounttype',
    '/signupindividual', 
    '/signupinstitution',
    '/opencurrencyaccount',
    '/phoneverification',
    '/otpverification',
    '/forgotpassword'
  ];

  const isAlwaysPublic = alwaysPublicRoutes.some(route => location.pathname.includes(route));
  console.log('🔍 [PublicRoute] Route check:', {
    currentPath: location.pathname,
    isAlwaysPublic,
    matchingRoutes: alwaysPublicRoutes.filter(route => location.pathname.includes(route))
  });

  // If current route is always public, allow access regardless of auth status
  if (isAlwaysPublic) {
    console.log('✅ [PublicRoute] Route is always public, allowing access');
    return <Outlet />;
  }

  const shouldRedirect = token && customerId && customerId !== "undefined" && customerId !== "null";
  console.log('🔍 [PublicRoute] Redirect check:', {
    shouldRedirect,
    hasToken: !!token,
    customerId,
    isValidCustomerId: customerId && customerId !== "undefined" && customerId !== "null"
  });

  // If authenticated and has valid customerId, redirect to homepage
  if (shouldRedirect) {
    console.log('🔄 [PublicRoute] User is authenticated, redirecting to home');
    return <Navigate to={`/home/${customerId}`} replace />;
  }

  console.log('✅ [PublicRoute] User is not authenticated, allowing public access');
  return <Outlet />;
};

export default PublicRoute;