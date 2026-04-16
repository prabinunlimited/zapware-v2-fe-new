// src/router/PublicRoute.jsx
import { useSelector, useDispatch } from "react-redux";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import {
  selectAuthToken,
  selectCustomerId,
  selectIsInitialized,
} from "../src/store/selectors";
import { clearAuthState } from "../src/features/Auth/slices/authSlice";

const PublicRoute = () => {
  const token = useSelector(selectAuthToken);
  const customerId = useSelector(selectCustomerId);
  const isInitialized = useSelector(selectIsInitialized);
  const location = useLocation();
  const dispatch = useDispatch();

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

  // Show nothing while initializing
  if (!isInitialized) {
    return null;
  }

  // FIX: Clear inconsistent auth state - customerId without token
  const hasCustomerIdButNoToken =
    !token && customerId && customerId !== "undefined" && customerId !== "null";
  if (hasCustomerIdButNoToken) {
    dispatch(clearAuthState());
    // Don't return here, let the component continue to render
  }

  // Define routes that should remain public even when authenticated
  const alwaysPublicRoutes = [
    "/selectaccounttype",
    "/signupindividual",
    "/signupinstitution",
    "/opencurrencyaccount",
    "/phoneverification",
    "/otpverification",
    "/forgotpassword",
  ];

  const isAlwaysPublic = alwaysPublicRoutes.some((route) =>
    location.pathname.includes(route),
  );

  // If current route is always public, allow access regardless of auth status
  if (isAlwaysPublic) {
    return <Outlet />;
  }

  const shouldRedirect =
    token && customerId && customerId !== "undefined" && customerId !== "null";

  // If authenticated and has valid customerId, redirect to appropriate homepage
  if (shouldRedirect) {
    const redirectPath = getHomepagePath(customerId);
    console.log(
      `📍 PublicRoute - Authenticated user redirecting to: ${redirectPath}`,
    );
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
