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

  // Show nothing while initializing
  if (!isInitialized) {
    return null;
  }

  // FIX: Clear inconsistent auth state - customerId without token
  const hasCustomerIdButNoToken = !token && customerId && customerId !== "undefined" && customerId !== "null";
  if (hasCustomerIdButNoToken) {
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

  // If current route is always public, allow access regardless of auth status
  if (isAlwaysPublic) {
    return <Outlet />;
  }

  const shouldRedirect = token && customerId && customerId !== "undefined" && customerId !== "null";

  // If authenticated and has valid customerId, redirect to homepage
  if (shouldRedirect) {
    return <Navigate to={`/home/${customerId}`} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;