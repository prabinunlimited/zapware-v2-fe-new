import React, { Suspense } from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { PlaidProvider } from "./features/Auth/PlaidProvider";
import router from "../router/router";
import store from "./store/store";
import { PartnerConfigProvider } from "./contexts/PartnerConfigContext";
import GlobalErrorBoundary from "../router/GlobalErrorBoundary";
import AppInitializer from "./services/AppInitializer";

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

const AppContent = () => {
  React.useEffect(() => {
    console.log("🚀 AppContent: Starting initialization...");
    console.log("🔍 Current hostname:", window.location.hostname);
    console.log(
      "✅ AppContent: Partner data fetching delegated to proper API calls",
    );
  }, []);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

function App() {
  React.useEffect(() => {
    console.log("🚀 App.jsx: Main App component mounted");
  }, []);

  return (
    <GlobalErrorBoundary>
      <AppInitializer>
        <Provider store={store}>
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
