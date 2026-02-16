// src/App.jsx
import React, { Suspense, useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { PlaidProvider } from "./features/Auth/PlaidProvider";
import router from "../router/router";
import store from "./store/store";
import { PartnerConfigProvider } from "./contexts/PartnerConfigContext";
import GlobalErrorBoundary from "../router/GlobalErrorBoundary";
import AppInitializer from "./services/AppInitializer";
import { setInitialized } from "./features/Auth/slices/authSlice";

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-600">Loading application...</p>
    </div>
  </div>
);

// ===================== FORCE INITIALIZER COMPONENT =====================
// This component ensures isInitialized becomes true even if the normal initialization fails
const ForceInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log(
      "⏰ ForceInitializer: Setting timer to force isInitialized=true",
    );

    // Force set initialized to true after 3 seconds no matter what
    const timer = setTimeout(() => {
      console.log("⚠️ FORCE INITIALIZER: Setting isInitialized to true");
      dispatch(setInitialized(true));
    }, 3000);

    return () => {
      console.log("🧹 ForceInitializer: Cleaning up timer");
      clearTimeout(timer);
    };
  }, [dispatch]);

  return null;
};

// ===================== ROUTER HEALTH CHECK COMPONENT =====================
// This component monitors router state and logs issues
const RouterHealthCheck = () => {
  useEffect(() => {
    // Check router state after mounting
    const checkRouter = () => {
      console.log("🔍 Router Health Check:", {
        currentPath: window.location.pathname,
        hasRouter: !!router,
        routerState: router.state,
        routes: router.routes?.map((r) => r.path),
      });
    };

    // Check immediately
    checkRouter();

    // Check again after 2 seconds
    const timer = setTimeout(checkRouter, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};

// ===================== AUTH STATE MONITOR =====================
// This component monitors auth state and logs issues
const AuthStateMonitor = () => {
  useEffect(() => {
    // Check auth state every 2 seconds
    const interval = setInterval(() => {
      const state = store.getState();
      console.log("🔍 Auth State Monitor:", {
        isInitialized: state.auth?.isInitialized,
        isAuthenticated: state.auth?.isAuthenticated,
        customerId: state.auth?.customerId,
        hasToken: !!state.auth?.token,
        localStorageCustomerId: localStorage.getItem("authcustomer_id"),
        localStorageToken: !!localStorage.getItem("authtoken"),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return null;
};

// ===================== APP CONTENT =====================
const AppContent = () => {
  const [hasError, setHasError] = React.useState(false);
  const [routerStuck, setRouterStuck] = React.useState(false);

  useEffect(() => {
    console.log("🚀 AppContent: Starting initialization...");
    console.log("🔍 Current hostname:", window.location.hostname);
    console.log("📍 Current path:", window.location.pathname);

    // Add a timeout to detect if router is stuck
    const timer = setTimeout(() => {
      console.log("⚠️ AppContent: Router might be stuck - checking...");
      console.log("Current path:", window.location.pathname);
      console.log("Router state:", router.state);

      // Check if we're on the root path and nothing is rendering
      if (window.location.pathname === "/") {
        console.log(
          "⚠️ AppContent: Still on root path after 3 seconds - router might be stuck",
        );
        setRouterStuck(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // If router is stuck, show a recovery UI
  if (routerStuck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Router Stuck
          </h2>
          <p className="text-gray-600 mb-6">
            The application router is taking too long to initialize.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
          <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs">
            <p className="font-mono text-gray-700 break-all">
              Path: {window.location.pathname}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Something went wrong
          </h1>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <RouterHealthCheck />
      <AuthStateMonitor />
      <Suspense fallback={<LoadingSpinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </>
  );
};

// ===================== MAIN APP COMPONENT =====================
function App() {
  useEffect(() => {
    console.log("🚀 App.jsx: Main App component mounted");
    console.log("📍 Current path:", window.location.pathname);
    console.log("🔍 Root element:", document.getElementById("root"));

    // Log localStorage state on mount
    console.log("🔍 localStorage on mount:", {
      authtoken: localStorage.getItem("authtoken") ? "Present" : "Missing",
      authcustomer_id: localStorage.getItem("authcustomer_id"),
      bearertoken: localStorage.getItem("bearertoken") ? "Present" : "Missing",
      isRemittanceOnlyCustomer: localStorage.getItem(
        "isRemittanceOnlyCustomer",
      ),
    });
  }, []);

  return (
    <GlobalErrorBoundary>
      <AppInitializer>
        <Provider store={store}>
          {/* Force isInitialized to true after timeout */}
          <ForceInitializer />

          <PartnerConfigProvider>
            <PlaidProvider>
              <AppContent />
            </PlaidProvider>
          </PartnerConfigProvider>
        </Provider>
      </AppInitializer>
    </GlobalErrorBoundary>
  );
}

export default App;
