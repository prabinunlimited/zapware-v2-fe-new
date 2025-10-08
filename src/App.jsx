// src/App.jsx
import React from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { PlaidProvider } from "./features/Auth/PlaidProvider";
import router from "../router/router";
import store from "./store/store";
import { PartnerConfigProvider } from "./contexts/PartnerConfigContext";
// Import the GlobalErrorBoundary component (adjust the path if your file lives elsewhere)
import GlobalErrorBoundary from "../router/GlobalErrorBoundary";

// Create a wrapper component that contains URLValidator inside Router context
const AppContent = () => {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

function App() {
  return (
    <GlobalErrorBoundary>
      <Provider store={store}>
        <PartnerConfigProvider>
          <PlaidProvider>
            <AppContent />
          </PlaidProvider>
        </PartnerConfigProvider>
      </Provider>
    </GlobalErrorBoundary>
  );
}

export default App;
