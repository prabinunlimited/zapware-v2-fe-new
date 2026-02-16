// src/router/PublicRoute.jsx
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import { selectIsInitialized } from "../src/store/selectors";
import Login from "../src/features/Auth/Login/Login"; // Import directly

const PublicRouteLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600">Loading login page...</p>
    </div>
  </div>
);

const PublicRoute = () => {
  const isInitialized = useSelector(selectIsInitialized);

  console.log("🔍 PublicRoute - isInitialized:", isInitialized);
  console.log(
    "🔍 PublicRoute - rendering:",
    isInitialized ? "Outlet/Login" : "Loading",
  );

  // Always show loading while initializing
  if (!isInitialized) {
    return <PublicRouteLoading />;
  }

  // Once initialized, ALWAYS render Login directly
  // This bypasses the Outlet system which might be causing issues
  return <Login />;
};

export default PublicRoute;
