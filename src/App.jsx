import React from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { PlaidProvider } from "./features/Auth/PlaidProvider";
import router from "../router/router";
import store from "./store/store";
import { PartnerConfigProvider } from "./contexts/PartnerConfigContext";
import GlobalErrorBoundary from "../router/GlobalErrorBoundary";
import AppInitializer from "./services/AppInitializer";

const AppContent = () => {
  React.useEffect(() => {
    console.log("🚀 AppContent: Starting initialization...");
    console.log("🔍 Current hostname:", window.location.hostname);
    console.log(
      "✅ AppContent: Partner data fetching delegated to proper API calls"
    );
  }, []);

  return (
    <>
      <RouterProvider router={router} />
    </>
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
